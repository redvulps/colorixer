import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorWheel } from '@/src/components/ColorWheel';
import { HsvSlider } from '@/src/components/HsvSlider';
import { ExportIcon, FileIcon } from '@/src/components/icons';
import {
  BottomSheet,
  HarmonyStrip,
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
  UNSAVED_NAME,
  useCopy,
} from '@/src/hooks/usePaletteActions';
import { usePalette } from '@/src/state/palettes';
import { colors as tokens, type } from '@/src/theme/tokens';
import { harmonyLabel, hslString, hsvString } from '@/src/utils/color';

/** Largest wheel, for tablets and narrow browser windows */
const MAX_WHEEL = 480;

/**
 * Color tab: the harmony picker on top, then the wheel centered in the free height, the palette
 * and the H/S/V sliders. The palette sticks to the top once the wheel scrolls away.
 */
export function ColorScreen() {
  const { hsv, harmony, colors, current, setHsv, setHarmony, save } = usePalette();
  const toast = useToast();
  const copy = useCopy();
  const { width } = useWindowDimensions();
  const [exportOpen, setExportOpen] = useState(false);
  const [copyColor, setCopyColor] = useState<string | null>(null);
  const [fullOpen, setFullOpen] = useState(false);
  const [fullOrigin, setFullOrigin] = useState<Rect | null>(null);
  // The full-screen view hides the status bar, which shrinks the top inset. The screen keeps
  // the inset it had, so nothing behind the view moves, until the status bar is back.
  const insets = useSafeAreaInsets();
  const [frozenTop, setFrozenTop] = useState<number | null>(null);
  useEffect(() => {
    if (!fullOpen && frozenTop !== null && insets.top >= frozenTop) setFrozenTop(null);
  }, [fullOpen, frozenTop, insets.top]);
  const stripRef = useRef<React.ComponentRef<typeof View>>(null);

  const wheelSize = Math.min(MAX_WHEEL, width - 32);
  const name = current?.name ?? UNSAVED_NAME;

  const onSave = () => {
    const palette = save();
    haptic();
    toast(`Saved “${palette.name}”`);
  };

  // The full-screen view grows out of the bar, so it needs the bar's place on screen
  const openFull = () => {
    setFullOrigin(null);
    setFrozenTop(insets.top);
    setFullOpen(true);
    stripRef.current?.measureInWindow((x, y, w, h) => setFullOrigin({ x, y, width: w, height: h }));
  };

  const copyAs = (text: string) => {
    setCopyColor(null);
    copy(text);
  };

  return (
    <View style={[styles.screen, { paddingTop: frozenTop ?? insets.top }]}>
      <View style={styles.header}>
        <HarmonyStrip value={harmony} onChange={setHarmony} />
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

        {/* Sticky: stays in view while the sliders scroll */}
        <View style={styles.paletteBlock}>
          <View style={styles.paletteHeader}>
            <Overline style={styles.paletteName}>
              {current ? `${current.name} · ${harmonyLabel(harmony)}` : harmonyLabel(harmony)}
            </Overline>
            <View style={styles.paletteActions}>
              <PillButton testID="save-button" saved={!!current} onPress={onSave} />
              <PillIconButton
                testID="share-button"
                icon={ExportIcon}
                accessibilityLabel="Export palette"
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
                onPressColor={openFull}
                onLongPressColor={setCopyColor}
                swatchHint="Shows the palette in full screen. Long press to copy the color."
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

        <View style={styles.sliders}>
          <HsvSlider channel="h" hsv={hsv} onChange={(h) => setHsv([h, hsv[1], hsv[2]])} />
          <HsvSlider channel="s" hsv={hsv} onChange={(s) => setHsv([hsv[0], s, hsv[2]])} />
          <HsvSlider channel="v" hsv={hsv} onChange={(v) => setHsv([hsv[0], hsv[1], v])} />
        </View>
      </ScrollView>

      <PaletteFullscreen
        testID="palette-fullscreen"
        visible={fullOpen}
        origin={fullOrigin}
        colors={colors}
        label={`${current ? `${current.name} · ` : ''}${harmonyLabel(harmony)} · ${colors.length} colors`}
        onClose={() => setFullOpen(false)}
      />

      <BottomSheet
        testID="export-sheet"
        visible={exportOpen}
        onClose={() => setExportOpen(false)}
        title={current?.name ?? 'Current palette'}
        subtitle={`${harmonyLabel(harmony)} · ${colors.length} colors`}
        palette={colors}
      >
        {EXPORT_FORMATS.map(({ format, app, ext }) => (
          <SheetAction
            key={format}
            icon={FileIcon}
            label={`Export to ${app}`}
            ext={ext}
            onPress={() => {
              setExportOpen(false);
              exportPalette(format, colors, name);
            }}
          />
        ))}
        <SheetAction label="Cancel" tone="cancel" onPress={() => setExportOpen(false)} />
      </BottomSheet>

      <BottomSheet
        testID="copy-sheet"
        visible={copyColor !== null}
        onClose={() => setCopyColor(null)}
        title={copyColor ?? undefined}
        subtitle="Copy the color as"
      >
        {copyColor && (
          <>
            <SheetAction label="Copy as HEX" ext={copyColor} onPress={() => copyAs(copyColor)} />
            <SheetAction
              label="Copy as HSL"
              ext={hslString(copyColor)}
              onPress={() => copyAs(hslString(copyColor))}
            />
            <SheetAction
              label="Copy as HSV"
              ext={hsvString(copyColor)}
              onPress={() => copyAs(hsvString(copyColor))}
            />
          </>
        )}
        <SheetAction label="Cancel" tone="cancel" onPress={() => setCopyColor(null)} />
      </BottomSheet>
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
  // Takes the free height and centers the wheel in it
  wheel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  paletteBlock: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 10,
    backgroundColor: tokens.bgApp,
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
    gap: 12,
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
