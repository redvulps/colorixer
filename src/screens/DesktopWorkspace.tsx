import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ColorWheel } from '@/src/components/ColorWheel';
import { HsvSlider } from '@/src/components/HsvSlider';
import { CheckIcon, ExportIcon, FileIcon, SaveIcon } from '@/src/components/icons';
import {
  Button,
  CopyField,
  ExportOption,
  HarmonyRow,
  LogoMark,
  Overline,
  PaletteValue,
  SavedRow,
  SheetAction,
  useToast,
} from '@/src/components/ui';
import {
  EXPORT_FORMATS,
  exportPalette,
  UNSAVED_NAME,
  useCopy,
} from '@/src/hooks/usePaletteActions';
import { usePalette } from '@/src/state/palettes';
import { colors as tokens, radius, shadows, type } from '@/src/theme/tokens';
import {
  HARMONIES,
  harmonyColors,
  harmonyLabel,
  hslString,
  hsvString,
  inkOn,
} from '@/src/utils/color';

const TOP_BAR = 60;
const SIDEBAR = 252;
const INSPECTOR = 320;

/** Wide layout: harmonies and saved palettes | wheel and sliders | base color and export */
export function DesktopWorkspace() {
  const { hsv, harmony, base, colors, current, saved, setHsv, setHarmony, save, load } =
    usePalette();
  const copy = useCopy();
  const toast = useToast();
  const { width, height } = useWindowDimensions();
  const [menuOpen, setMenuOpen] = useState(false);

  const canvasWidth = width - SIDEBAR - INSPECTOR;
  // Wheel, three 34 px sliders with 12 px gaps, 18 px between them, 48 px of margin
  const wheelSize = Math.max(
    220,
    Math.min(400, height - TOP_BAR - (3 * 34 + 2 * 12) - 18 - 48, canvasWidth - 48),
  );
  const sliderWidth = Math.min(470, canvasWidth - 48);
  const name = current?.name ?? UNSAVED_NAME;

  const onSave = () => {
    const palette = save();
    toast(`Saved “${palette.name}”`);
  };

  const onExport = (format: (typeof EXPORT_FORMATS)[number]['format']) => {
    setMenuOpen(false);
    exportPalette(format, colors, name);
  };

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <LogoMark />
        <Text style={styles.brand}>Colorixer</Text>
        <Text style={styles.crumb}>
          / Palettes / <Text style={styles.crumbName}>{current?.name ?? 'Untitled'}</Text>
        </Text>
        <View style={styles.spacer} />
        <Button
          testID="save-button"
          variant={current ? 'saved' : 'ghost'}
          icon={current ? CheckIcon : SaveIcon}
          label={current ? 'Saved' : 'Save'}
          disabled={!!current}
          onPress={onSave}
        />
        <Button
          testID="share-button"
          variant="primary"
          icon={ExportIcon}
          label="Export"
          chevron
          accessibilityState={{ expanded: menuOpen }}
          onPress={() => setMenuOpen((open) => !open)}
        />
      </View>

      <View style={styles.columns}>
        <ScrollView style={styles.sidebar} contentContainerStyle={styles.sidebarContent}>
          <Overline style={styles.sidebarLabel}>Harmony</Overline>
          <View testID="harmony-selector">
            {HARMONIES.map(({ key }) => (
              <HarmonyRow
                key={key}
                harmony={key}
                count={harmonyColors(key, base).length}
                selected={key === harmony}
                onPress={() => setHarmony(key)}
              />
            ))}
          </View>
          <Overline style={[styles.sidebarLabel, styles.sidebarLabelGap]}>Saved palettes</Overline>
          {saved.length > 0 ? (
            saved.map((palette) => (
              <SavedRow
                key={palette.id}
                palette={palette}
                selected={palette.id === current?.id}
                onPress={() => load(palette.id)}
              />
            ))
          ) : (
            <Text style={styles.sidebarEmpty}>Saved palettes show up here.</Text>
          )}
        </ScrollView>

        <ScrollView style={styles.canvas} contentContainerStyle={styles.canvasContent}>
          <ColorWheel
            size={wheelSize}
            hsv={hsv}
            colors={colors}
            onChange={(h, s) => setHsv([h, s, hsv[2]])}
          />
          <View style={[styles.sliders, { width: sliderWidth }]}>
            <HsvSlider channel="h" hsv={hsv} onChange={(h) => setHsv([h, hsv[1], hsv[2]])} />
            <HsvSlider channel="s" hsv={hsv} onChange={(s) => setHsv([hsv[0], s, hsv[2]])} />
            <HsvSlider channel="v" hsv={hsv} onChange={(v) => setHsv([hsv[0], hsv[1], v])} />
          </View>
        </ScrollView>

        <ScrollView style={styles.inspector} contentContainerStyle={styles.inspectorContent}>
          <View style={styles.section}>
            <Overline>Base color</Overline>
            <View style={[styles.baseSwatch, { backgroundColor: base }]}>
              <Text style={[styles.baseHex, { color: inkOn(base) }]}>{base}</Text>
            </View>
            <CopyField label="HEX" value={base} onCopy={() => copy(base)} />
            <CopyField label="HSL" value={hslString(base)} onCopy={() => copy(hslString(base))} />
            <CopyField label="HSV" value={hsvString(base)} onCopy={() => copy(hsvString(base))} />
          </View>

          <View testID="generated-colors" style={styles.paletteSection}>
            <Overline style={styles.paletteLabel}>{`Palette · ${harmonyLabel(harmony)}`}</Overline>
            {colors.map((color, i) => (
              <PaletteValue key={`${color}-${i}`} color={color} onPress={() => copy(color)} />
            ))}
          </View>

          <View style={styles.exportSection}>
            <Overline>Export</Overline>
            {EXPORT_FORMATS.map(({ format, app, ext }) => (
              <ExportOption
                key={format}
                label={format === 'ase' ? 'Adobe ASE' : app}
                ext={ext}
                onPress={() => onExport(format)}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {menuOpen && (
        <>
          <Pressable
            style={styles.menuDismiss}
            onPress={() => setMenuOpen(false)}
            accessibilityLabel="Close menu"
          />
          <View style={styles.menu} accessibilityRole="menu">
            {EXPORT_FORMATS.map(({ format, app, ext }) => (
              <SheetAction
                key={format}
                compact
                icon={FileIcon}
                label={format === 'ase' ? 'Adobe ASE' : app}
                ext={ext}
                onPress={() => onExport(format)}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.bgBrowser,
  },
  topBar: {
    height: TOP_BAR,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 22,
    paddingRight: 16,
    backgroundColor: tokens.surfacePanel,
    borderBottomWidth: 1,
    borderBottomColor: tokens.lineSubtle,
    zIndex: 2,
  },
  brand: {
    ...type.titleApp,
    fontSize: 19,
    color: tokens.textStrong,
  },
  crumb: {
    ...type.bodyDefault,
    fontSize: 14,
    color: tokens.textMuted,
    paddingLeft: 4,
  },
  crumbName: {
    fontFamily: type.labelButton.fontFamily,
    color: tokens.textPrimary,
  },
  spacer: {
    flex: 1,
  },
  columns: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: SIDEBAR,
    flexGrow: 0,
    backgroundColor: tokens.surfacePanel,
    borderRightWidth: 1,
    borderRightColor: tokens.lineSubtle,
  },
  sidebarContent: {
    paddingVertical: 18,
    paddingHorizontal: 12,
    gap: 2,
  },
  sidebarLabel: {
    paddingLeft: 10,
    paddingBottom: 8,
  },
  sidebarLabelGap: {
    paddingTop: 20,
  },
  sidebarEmpty: {
    ...type.caption,
    color: tokens.textMuted,
    paddingLeft: 10,
  },
  canvas: {
    flex: 1,
    backgroundColor: tokens.bgCanvas,
  },
  canvasContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingVertical: 24,
  },
  sliders: {
    gap: 12,
  },
  inspector: {
    width: INSPECTOR,
    flexGrow: 0,
    backgroundColor: tokens.surfacePanel,
    borderLeftWidth: 1,
    borderLeftColor: tokens.lineSubtle,
  },
  inspectorContent: {
    padding: 18,
    gap: 22,
  },
  section: {
    gap: 6,
  },
  baseSwatch: {
    height: 72,
    borderRadius: radius.md,
    justifyContent: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  baseHex: {
    fontFamily: 'SourceCodePro_600SemiBold',
    fontSize: 13,
  },
  paletteSection: {
    gap: 2,
  },
  paletteLabel: {
    paddingBottom: 4,
  },
  exportSection: {
    gap: 8,
  },
  menuDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
  },
  menu: {
    position: 'absolute',
    top: TOP_BAR - 2,
    right: 16,
    width: 260,
    padding: 6,
    gap: 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: tokens.lineDefault,
    backgroundColor: tokens.surfaceField,
    zIndex: 4,
    ...shadows.menu,
  },
});
