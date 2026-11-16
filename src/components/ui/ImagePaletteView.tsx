import * as ImagePicker from 'expo-image-picker';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet, SheetAction } from './BottomSheet';
import { Button, IconButton } from './Button';
import { PaletteStrip } from './PaletteStrip';

import { CameraIcon, CloseIcon, ImageIcon } from '@/src/components/icons';
import type { ImagePalette } from '@/src/state/palettes';
import { colors, radius, type } from '@/src/theme/tokens';
import {
  extractPalettes,
  IMAGE_MOODS,
  type ImageMood,
  type MoodPalette,
} from '@/src/utils/extract';
import { readPixels } from '@/src/utils/imagePixels';

/** Full screen on phones, a centered sheet on upright tablets, a two-column dialog when wide */
export type ImagePaletteLayout = 'screen' | 'sheet' | 'dialog';

type Source = 'gallery' | 'camera';

interface Picked {
  uri: string;
  name: string;
  width: number;
  height: number;
}

interface ImagePaletteViewProps {
  layout: ImagePaletteLayout;
  /** Takes the palette to the editor */
  onUse: (palette: ImagePalette) => void;
}

export interface ImagePaletteHandle {
  /** Asks where the photo comes from, then shows its colors */
  start: () => void;
}

const SPOT = 26;
const MAX_PHOTO_HEIGHT: Record<ImagePaletteLayout, number> = {
  screen: 360,
  sheet: 340,
  dialog: 420,
};
const SHEET_WIDTH = 560;
const DIALOG_WIDTH = 920;
const DIALOG_SIDE = 380;
/** Waits for the source sheet's closing animation, so the system picker doesn't open over it */
export const imageFlowTiming = { sheetCloseMs: 300 };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Palette from a photo: asks for the gallery or the camera, then shows the photo, where its colors
 * come from and five colors in the mood the person chooses. The web has no camera to offer, so
 * the file chooser opens straight away.
 */
export const ImagePaletteView = forwardRef<ImagePaletteHandle, ImagePaletteViewProps>(
  function ImagePaletteView({ layout, onUse }, ref) {
    const insets = useSafeAreaInsets();
    const window = useWindowDimensions();
    const [visible, setVisible] = useState(false);
    const [asking, setAsking] = useState(false);
    const [picked, setPicked] = useState<Picked | null>(null);
    const [palettes, setPalettes] = useState<Record<ImageMood, MoodPalette> | null>(null);
    const [mood, setMood] = useState<ImageMood>('vibrant');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const pickFrom = async (source: Source) => {
      if (asking) {
        setAsking(false);
        await wait(imageFlowTiming.sheetCloseMs);
      }
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setError('Colorixer has no access to the camera. Allow it in the system settings.');
          // The message shows in the view when it is open, else back in the sheet
          if (!visible) setAsking(true);
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);
      const asset = result.canceled ? null : result.assets[0];
      if (!asset) return;
      setPicked({
        uri: asset.uri,
        // The camera names its files with an id, which says nothing to the person
        name: source === 'camera' ? 'Camera photo' : (asset.fileName ?? 'Photo'),
        width: asset.width,
        height: asset.height,
      });
      setPalettes(null);
      setError(null);
      setVisible(true);
      setBusy(true);
      try {
        const pixels = await readPixels(asset.uri, asset.width, asset.height);
        setPalettes(extractPalettes(pixels));
      } catch (e) {
        setError(`Could not read this image. ${e instanceof Error ? e.message : ''}`.trim());
      } finally {
        setBusy(false);
      }
    };

    const start = () => {
      setError(null);
      if (Platform.OS === 'web') pickFrom('gallery');
      else setAsking(true);
    };
    useImperativeHandle(ref, () => ({ start }));

    const sourceSheet = (
      <BottomSheet
        testID="image-source"
        visible={asking}
        onClose={() => setAsking(false)}
        title="Take colors from a photo"
      >
        {error && !visible && <Text style={[styles.error, styles.sheetError]}>{error}</Text>}
        <SheetAction
          testID="source-gallery"
          icon={ImageIcon}
          label="From gallery"
          onPress={() => pickFrom('gallery')}
        />
        <SheetAction
          testID="source-camera"
          icon={CameraIcon}
          label="From camera"
          onPress={() => pickFrom('camera')}
        />
        <SheetAction label="Cancel" tone="cancel" onPress={() => setAsking(false)} />
      </BottomSheet>
    );

    if (!visible || !picked) return sourceSheet;

    const current = palettes?.[mood] ?? null;

    // Room for the photo, kept to its aspect ratio
    const contentWidth =
      layout === 'screen'
        ? window.width - 32 - insets.left - insets.right
        : layout === 'sheet'
          ? Math.min(SHEET_WIDTH, window.width - 48) - 48
          : Math.min(DIALOG_WIDTH, window.width - 48) - 48 - DIALOG_SIDE - 24;
    const aspect = picked.width / picked.height;
    const photoHeight = Math.min(contentWidth / aspect, MAX_PHOTO_HEIGHT[layout]);
    const photoWidth = photoHeight * aspect;
    const close = () => setVisible(false);

    const photo = (
      <View style={[styles.photo, { width: photoWidth, height: photoHeight }]}>
        <Image
          source={{ uri: picked.uri }}
          style={{ width: photoWidth, height: photoHeight }}
          accessibilityIgnoresInvertColors
          accessibilityLabel={`Photo ${picked.name}`}
        />
        {current?.spots.map((spot, i) => (
          <View
            key={i}
            pointerEvents="none"
            style={[
              styles.spot,
              {
                left: spot.x * photoWidth - SPOT / 2,
                top: spot.y * photoHeight - SPOT / 2,
                backgroundColor: current.colors[i],
              },
            ]}
          />
        ))}
        {busy && (
          <View style={styles.busy}>
            <ActivityIndicator color={colors.textStrong} />
          </View>
        )}
      </View>
    );

    const moods = (
      <ScrollView
        horizontal={layout !== 'dialog'}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.moods, layout === 'dialog' && styles.moodsWrap]}
        style={styles.moodsScroll}
        accessibilityRole="tablist"
      >
        {IMAGE_MOODS.map(({ key, label }) => {
          const selected = key === mood;
          return (
            <Pressable
              key={key}
              testID={`mood-${key}`}
              accessibilityRole="tab"
              accessibilityState={{ selected, disabled: !palettes }}
              disabled={!palettes}
              onPress={() => setMood(key)}
              style={[styles.chip, selected && styles.chipOn, !palettes && styles.chipOff]}
            >
              <Text style={[styles.chipLabel, selected && styles.chipLabelOn]}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    );

    const result = (
      <View style={styles.result}>
        {current && (
          <>
            <PaletteStrip testID="image-colors" colors={current.colors} height={52} radius={14} />
            <View style={styles.hexRow}>
              {current.colors.map((color, i) => (
                <Text key={`${color}-${i}`} style={styles.hex}>
                  {color}
                </Text>
              ))}
            </View>
          </>
        )}
        {error && <Text style={styles.error}>{error}</Text>}
        <View style={styles.source}>
          <Text style={styles.sourceText} numberOfLines={1}>
            {current ? `${picked.name} · ${current.colors.length} colors` : picked.name}
          </Text>
          <Button
            testID="choose-image"
            label="Choose another"
            variant="ghost"
            icon={ImageIcon}
            disabled={busy}
            onPress={start}
          />
        </View>
      </View>
    );

    const use = (
      <Button
        testID="use-palette"
        label="Use palette"
        variant="primary"
        disabled={!current || busy}
        style={current ? styles.use : { ...styles.use, ...styles.useOff }}
        onPress={() => {
          if (!current) return;
          setVisible(false);
          onUse({ colors: current.colors, mood, name: picked.name });
        }}
      />
    );

    const header = (
      <View style={styles.header}>
        <IconButton icon={CloseIcon} accessibilityLabel="Close" onPress={close} />
        <Text style={styles.title}>From image</Text>
      </View>
    );

    return (
      <Modal
        testID="image-palette"
        visible
        transparent={layout !== 'screen'}
        animationType={layout === 'screen' ? 'slide' : 'fade'}
        onRequestClose={close}
        statusBarTranslucent
        navigationBarTranslucent
      >
        {layout === 'screen' ? (
          <View
            style={[
              styles.screen,
              { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right },
            ]}
          >
            {header}
            <ScrollView contentContainerStyle={styles.screenContent}>
              {photo}
              {moods}
              {result}
            </ScrollView>
            <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>{use}</View>
          </View>
        ) : (
          <View style={styles.scrim}>
            <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Close" onPress={close} />
            <View
              style={[
                styles.card,
                {
                  width: Math.min(
                    layout === 'sheet' ? SHEET_WIDTH : DIALOG_WIDTH,
                    window.width - 48,
                  ),
                },
              ]}
            >
              {header}
              {layout === 'sheet' ? (
                <View style={styles.cardColumn}>
                  {photo}
                  {moods}
                  {result}
                  {use}
                </View>
              ) : (
                <View style={styles.cardRow}>
                  {photo}
                  <View style={styles.side}>
                    {moods}
                    {result}
                    <View style={styles.spacer} />
                    {use}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
        {sourceSheet}
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  title: {
    ...type.titleSheet,
    color: colors.textStrong,
  },
  screenContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
    alignItems: 'center',
  },
  photo: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
  },
  spot: {
    position: 'absolute',
    width: SPOT,
    height: SPOT,
    borderRadius: SPOT / 2,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.35), 0 2px 6px rgba(0, 0, 0, 0.4)',
  },
  busy: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17, 19, 24, 0.55)',
  },
  moodsScroll: {
    flexGrow: 0,
    alignSelf: 'stretch',
  },
  moods: {
    gap: 8,
  },
  moodsWrap: {
    flexWrap: 'wrap',
  },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  chipOn: {
    backgroundColor: colors.surfaceSegmentOn,
  },
  chipOff: {
    opacity: 0.5,
  },
  chipLabel: {
    ...type.labelPill,
    color: colors.textMuted,
  },
  chipLabelOn: {
    color: colors.textStrong,
  },
  result: {
    alignSelf: 'stretch',
    gap: 10,
  },
  hexRow: {
    flexDirection: 'row',
    marginTop: -4,
  },
  hex: {
    ...type.monoTiny,
    flex: 1,
    textAlign: 'center',
    color: colors.textMuted,
  },
  error: {
    ...type.caption,
    color: colors.danger,
  },
  sheetError: {
    marginHorizontal: 12,
    marginBottom: 8,
  },
  source: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sourceText: {
    ...type.caption,
    flex: 1,
    color: colors.textMuted,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.lineSubtle,
  },
  use: {
    height: 52,
    justifyContent: 'center',
    borderRadius: radius.md,
    alignSelf: 'stretch',
  },
  useOff: {
    opacity: 0.5,
  },
  scrim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.scrim,
  },
  card: {
    maxHeight: '92%',
    borderRadius: radius.xl,
    backgroundColor: colors.surfacePanel,
    borderWidth: 1,
    borderColor: colors.lineSubtle,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  cardColumn: {
    paddingHorizontal: 24,
    gap: 16,
    alignItems: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 24,
    alignItems: 'flex-start',
  },
  side: {
    width: DIALOG_SIDE,
    alignSelf: 'stretch',
    gap: 16,
  },
  spacer: {
    flex: 1,
  },
});
