import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ColorWheel } from '@/src/components/ColorWheel';
import { HsvSlider } from '@/src/components/HsvSlider';
import { ExportIcon, FileIcon } from '@/src/components/icons';
import {
  AppBar,
  BottomSheet,
  HarmonyStrip,
  IconButton,
  Overline,
  PaletteStrip,
  PillButton,
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

/** Color tab: wheel, H/S/V sliders, harmony, and the resulting palette */
export function ColorScreen() {
  const { hsv, harmony, colors, current, setHsv, setHarmony, save } = usePalette();
  const toast = useToast();
  const copy = useCopy();
  const { width } = useWindowDimensions();
  const [exportOpen, setExportOpen] = useState(false);
  const [copyColor, setCopyColor] = useState<string | null>(null);

  const wheelSize = Math.min(320, width - 48);
  const name = current?.name ?? UNSAVED_NAME;

  const onSave = () => {
    const palette = save();
    haptic();
    toast(`Saved “${palette.name}”`);
  };

  const copyAs = (text: string) => {
    setCopyColor(null);
    copy(text);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <AppBar
        right={
          <IconButton
            testID="share-button"
            icon={ExportIcon}
            accessibilityLabel="Export palette"
            onPress={() => setExportOpen(true)}
          />
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.wheel}>
          <ColorWheel
            size={wheelSize}
            hsv={hsv}
            colors={colors}
            onChange={(h, s) => setHsv([h, s, hsv[2]])}
          />
        </View>

        <View style={styles.sliders}>
          <HsvSlider channel="h" hsv={hsv} onChange={(h) => setHsv([h, hsv[1], hsv[2]])} />
          <HsvSlider channel="s" hsv={hsv} onChange={(s) => setHsv([hsv[0], s, hsv[2]])} />
          <HsvSlider channel="v" hsv={hsv} onChange={(v) => setHsv([hsv[0], hsv[1], v])} />
        </View>

        <View style={styles.section}>
          <HarmonyStrip value={harmony} onChange={setHarmony} />
        </View>

        <View style={[styles.section, styles.paletteHeader]}>
          <Overline style={styles.paletteName}>
            {current ? `${current.name} · ${harmonyLabel(harmony)}` : harmonyLabel(harmony)}
          </Overline>
          <PillButton testID="save-button" saved={!!current} onPress={onSave} />
        </View>

        <View style={[styles.section, styles.palette]}>
          <PaletteStrip
            testID="generated-colors"
            colors={colors}
            height={52}
            radius={14}
            onPressColor={copy}
            onLongPressColor={setCopyColor}
          />
          <View style={styles.hexRow}>
            {colors.map((color, i) => (
              <Text key={`${color}-${i}`} style={styles.hex}>
                {color}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.bgApp,
  },
  content: {
    paddingBottom: 16,
  },
  wheel: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  sliders: {
    paddingHorizontal: 24,
    gap: 12,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 14,
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
  palette: {
    paddingTop: 10,
    gap: 6,
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
