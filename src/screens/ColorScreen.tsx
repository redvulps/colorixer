import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ColorSliders } from '@/src/components/ColorSliders';
import { ColorWheel } from '@/src/components/ColorWheel';
import { ExpandIcon, ExportIcon, FileIcon, ImageIcon } from '@/src/components/icons';
import {
  BottomSheet,
  HarmonyStrip,
  type ImagePaletteHandle,
  ImagePaletteView,
  Overline,
  PaletteFullscreen,
  PaletteStrip,
  PillButton,
  PillIconButton,
  type Rect,
  SheetAction,
  useToast,
} from '@/src/components/ui';
import {
  EXPORT_FORMATS,
  exportPalette,
  haptic,
  unsavedName,
  useCopy,
} from '@/src/hooks/usePaletteActions';
import { useHeldTopInset } from '@/src/hooks/useTopInset';
import { t } from '@/src/i18n';
import { type ImagePalette, usePalette } from '@/src/state/palettes';
import { colors as tokens, type } from '@/src/theme/tokens';
import { hslString, hsvString, rgbString } from '@/src/utils/color';

/** Largest wheel, for tablets and narrow browser windows */
const MAX_WHEEL = 480;

/**
 * Color tab: the harmony picker on top, then the wheel centered in the free height, the palette
 * and the HSV or HSL sliders. The palette sticks to the top once the wheel scrolls away.
 */
export function ColorScreen() {
  const {
    hsv,
    activeHarmony,
    kind,
    colors,
    current,
    setHsv,
    setHarmony,
    useImage: applyImage,
    save,
  } = usePalette();
  const toast = useToast();
  const copy = useCopy();
  const { width } = useWindowDimensions();
  const [exportOpen, setExportOpen] = useState(false);
  const [copyColor, setCopyColor] = useState<string | null>(null);
  const [fullOpen, setFullOpen] = useState(false);
  const imageFlow = useRef<ImagePaletteHandle>(null);
  const [fullOrigin, setFullOrigin] = useState<Rect | null>(null);
  const { top: topInset, hold: holdTopInset } = useHeldTopInset(fullOpen);
  const stripRef = useRef<React.ComponentRef<typeof View>>(null);

  const wheelSize = Math.min(MAX_WHEEL, width - 32);
  const name = current?.name ?? unsavedName();

  const onSave = () => {
    const palette = save();
    haptic();
    toast(t('toast.saved', { name: palette.name }));
  };

  // The full-screen view grows out of the bar, so it needs the bar's place on screen
  const openFull = () => {
    setFullOrigin(null);
    holdTopInset();
    setFullOpen(true);
    stripRef.current?.measureInWindow((x, y, w, h) => setFullOrigin({ x, y, width: w, height: h }));
  };

  const onUseImage = (palette: ImagePalette) => {
    applyImage(palette);
    toast(t('toast.fromImage', { name: palette.name }));
  };

  const copyAs = (text: string) => {
    setCopyColor(null);
    copy(text);
  };

  return (
    <View style={[styles.screen, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <HarmonyStrip value={activeHarmony} onChange={setHarmony} />
      </View>
      <ScrollView contentContainerStyle={styles.content} stickyHeaderIndices={[1]}>
        <View style={styles.wheel}>
          <ColorWheel
            size={wheelSize}
            hsv={hsv}
            colors={colors}
            onChange={(h, s) => setHsv([h, s, hsv[2]])}
          />
        </View>

        {/* Sticky: stays in view while the sliders scroll. A sticky child's own style goes to
            the ScrollView's wrapper, so the gap lives on an inner view. */}
        <View style={styles.paletteBlock}>
          <View style={styles.paletteInner}>
            <View style={styles.paletteHeader}>
              <Overline style={styles.paletteName}>
                {current ? `${current.name} · ${kind}` : kind}
              </Overline>
              <View style={styles.paletteActions}>
                <PillButton testID="save-button" saved={!!current} onPress={onSave} />
                <PillIconButton
                  testID="image-button"
                  icon={ImageIcon}
                  accessibilityLabel={t('image.take')}
                  onPress={() => imageFlow.current?.start()}
                />
                <PillIconButton
                  testID="fullscreen-button"
                  icon={ExpandIcon}
                  accessibilityLabel={t('fullscreen.show')}
                  onPress={openFull}
                />
                <PillIconButton
                  testID="share-button"
                  icon={ExportIcon}
                  accessibilityLabel={t('export.palette')}
                  onPress={() => setExportOpen(true)}
                />
              </View>
            </View>
            <View style={styles.palette}>
              <View ref={stripRef} collapsable={false}>
                <PaletteStrip
                  testID="generated-colors"
                  colors={colors}
                  height={52}
                  radius={14}
                  onPressColor={copy}
                  onLongPressColor={setCopyColor}
                />
              </View>
              <View style={styles.hexRow}>
                {colors.map((color, i) => (
                  <Text key={`${color}-${i}`} style={styles.hex}>
                    {color}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        </View>

        <ColorSliders style={styles.sliders} />
      </ScrollView>

      <PaletteFullscreen
        testID="palette-fullscreen"
        visible={fullOpen}
        origin={fullOrigin}
        colors={colors}
        label={`${current ? `${current.name} · ` : ''}${kind} · ${t('common.colors', { count: colors.length })}`}
        onClose={() => setFullOpen(false)}
      />

      <BottomSheet
        testID="export-sheet"
        visible={exportOpen}
        onClose={() => setExportOpen(false)}
        title={current?.name ?? t('palette.current')}
        subtitle={`${kind} · ${t('common.colors', { count: colors.length })}`}
        palette={colors}
      >
        {EXPORT_FORMATS.map(({ format, app, ext }) => (
          <SheetAction
            key={format}
            icon={FileIcon}
            label={t('export.to', { app })}
            ext={ext}
            onPress={() => {
              setExportOpen(false);
              exportPalette(format, colors, name);
            }}
          />
        ))}
        <SheetAction
          label={t('common.cancel')}
          tone="cancel"
          onPress={() => setExportOpen(false)}
        />
      </BottomSheet>

      <BottomSheet
        testID="copy-sheet"
        visible={copyColor !== null}
        onClose={() => setCopyColor(null)}
        title={copyColor ?? undefined}
        subtitle={t('copy.title')}
      >
        {copyColor && (
          <>
            <SheetAction
              label={t('copy.as', { format: 'HEX' })}
              ext={copyColor}
              onPress={() => copyAs(copyColor)}
            />
            <SheetAction
              label={t('copy.as', { format: 'RGB' })}
              ext={rgbString(copyColor)}
              onPress={() => copyAs(rgbString(copyColor))}
            />
            <SheetAction
              label={t('copy.as', { format: 'HSL' })}
              ext={hslString(copyColor)}
              onPress={() => copyAs(hslString(copyColor))}
            />
            <SheetAction
              label={t('copy.as', { format: 'HSV' })}
              ext={hsvString(copyColor)}
              onPress={() => copyAs(hsvString(copyColor))}
            />
          </>
        )}
        <SheetAction label={t('common.cancel')} tone="cancel" onPress={() => setCopyColor(null)} />
      </BottomSheet>
      <ImagePaletteView ref={imageFlow} layout="screen" onUse={onUseImage} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.bgApp,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  // Grows to the screen height, so the palette and sliders sit on the tab bar
  content: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  // Takes the free height and centers the wheel in it. The palette block keeps its own space
  // below, so a small padding is enough, and everything fits a 914 dp phone without scrolling.
  wheel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  // The space around the palette is its own, so it keeps it while stuck to the top
  paletteBlock: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: tokens.bgApp,
  },
  paletteInner: {
    gap: 10,
  },
  paletteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  paletteName: {
    flexShrink: 1,
  },
  paletteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  palette: {
    gap: 6,
  },
  sliders: {
    paddingHorizontal: 24,
  },
  hexRow: {
    flexDirection: 'row',
  },
  hex: {
    ...type.monoTiny,
    flex: 1,
    textAlign: 'center',
    color: tokens.textMuted,
  },
});
