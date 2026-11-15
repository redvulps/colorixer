import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorWheel } from '@/src/components/ColorWheel';
import { HsvSlider } from '@/src/components/HsvSlider';
import { CheckIcon, ExportIcon, FileIcon, SaveIcon, TrashIcon } from '@/src/components/icons';
import {
  Button,
  CopyField,
  ExportOption,
  HarmonyRow,
  LogoMark,
  type MenuPoint,
  Overline,
  PaletteValue,
  pointFromEvent,
  PopoverMenu,
  SavedRow,
  SheetAction,
  useToast,
} from '@/src/components/ui';
import {
  EXPORT_FORMATS,
  type ExportFormat,
  exportPalette,
  UNSAVED_NAME,
  useCopy,
} from '@/src/hooks/usePaletteActions';
import { useTopInset } from '@/src/hooks/useTopInset';
import { paletteColors, type SavedPalette, usePalette } from '@/src/state/palettes';
import { colors as tokens, radius, type } from '@/src/theme/tokens';
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

/** Open menu: export of the current palette, actions of a saved palette, or copy formats of a color */
type Menu =
  | { kind: 'export'; at: MenuPoint }
  | { kind: 'saved'; at: MenuPoint; palette: SavedPalette }
  | { kind: 'color'; at: MenuPoint; color: string };

const exportLabel = (format: ExportFormat) => (format === 'ase' ? 'Adobe ASE' : 'Procreate');

/** Wide layout: harmonies and saved palettes | wheel and sliders | base color and export */
export function DesktopWorkspace() {
  const { hsv, harmony, base, colors, current, saved, setHsv, setHarmony, save, load, remove } =
    usePalette();
  const copy = useCopy();
  const toast = useToast();
  const { width, height } = useWindowDimensions();
  // Zero in a browser; on a tablet, the system bars the workspace has to stay clear of
  const insets = useSafeAreaInsets();
  const [menu, setMenu] = useState<Menu | null>(null);
  const closeMenu = () => setMenu(null);

  const topInset = useTopInset();
  const topBarHeight = TOP_BAR + topInset;
  const canvasWidth = width - SIDEBAR - INSPECTOR - insets.left - insets.right;
  // Wheel, three 34 px sliders with 12 px gaps, 18 px between them, 48 px of margin
  const wheelSize = Math.max(
    220,
    Math.min(
      400,
      height - topBarHeight - insets.bottom - (3 * 34 + 2 * 12) - 18 - 48,
      canvasWidth - 48,
    ),
  );
  const sliderWidth = Math.min(470, canvasWidth - 48);
  const name = current?.name ?? UNSAVED_NAME;

  const onSave = () => {
    const palette = save();
    toast(`Saved “${palette.name}”`);
  };

  const onExport = (format: ExportFormat, palette?: SavedPalette) => {
    setMenu(null);
    if (palette) {
      exportPalette(format, paletteColors(palette), palette.name);
    } else {
      exportPalette(format, colors, name);
    }
  };

  const onDelete = (palette: SavedPalette) => {
    setMenu(null);
    remove(palette.id);
    toast(`Deleted “${palette.name}”`);
  };

  const onCopy = (text: string) => {
    setMenu(null);
    copy(text);
  };

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.topBar,
          {
            height: topBarHeight,
            paddingTop: topInset,
            paddingLeft: 22 + insets.left,
            paddingRight: 16 + insets.right,
          },
        ]}
      >
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
          accessibilityState={{ expanded: menu?.kind === 'export' }}
          // Right-aligned under the button
          onPress={() =>
            setMenu({ kind: 'export', at: { x: width - 28 - insets.right, y: topBarHeight - 14 } })
          }
        />
      </View>

      <View style={styles.columns}>
        <ScrollView
          style={[styles.sidebar, { width: SIDEBAR + insets.left }]}
          contentContainerStyle={[
            styles.sidebarContent,
            { paddingLeft: 12 + insets.left, paddingBottom: 18 + insets.bottom },
          ]}
        >
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
                onMore={(e) => setMenu({ kind: 'saved', at: pointFromEvent(e), palette })}
              />
            ))
          ) : (
            <Text style={styles.sidebarEmpty}>Saved palettes show up here.</Text>
          )}
        </ScrollView>

        <ScrollView
          style={styles.canvas}
          contentContainerStyle={[styles.canvasContent, { paddingBottom: 24 + insets.bottom }]}
        >
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

        <ScrollView
          style={[styles.inspector, { width: INSPECTOR + insets.right }]}
          contentContainerStyle={[
            styles.inspectorContent,
            { paddingRight: 18 + insets.right, paddingBottom: 18 + insets.bottom },
          ]}
        >
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
              <PaletteValue
                key={`${color}-${i}`}
                color={color}
                onPress={() => copy(color)}
                onMore={(e) => setMenu({ kind: 'color', at: pointFromEvent(e), color })}
              />
            ))}
          </View>

          <View style={styles.exportSection}>
            <Overline>Export</Overline>
            {EXPORT_FORMATS.map(({ format, ext }) => (
              <ExportOption
                key={format}
                label={exportLabel(format)}
                ext={ext}
                onPress={() => onExport(format)}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      <PopoverMenu
        testID="export-menu"
        at={menu?.kind === 'export' ? menu.at : null}
        items={EXPORT_FORMATS.length}
        onClose={closeMenu}
      >
        {EXPORT_FORMATS.map(({ format, ext }) => (
          <SheetAction
            key={format}
            compact
            icon={FileIcon}
            label={exportLabel(format)}
            ext={ext}
            onPress={() => onExport(format)}
          />
        ))}
      </PopoverMenu>

      <PopoverMenu
        testID="palette-menu"
        at={menu?.kind === 'saved' ? menu.at : null}
        items={EXPORT_FORMATS.length + 1}
        width={300}
        onClose={closeMenu}
      >
        {menu?.kind === 'saved' && (
          <>
            {EXPORT_FORMATS.map(({ format, ext }) => (
              <SheetAction
                key={format}
                compact
                icon={FileIcon}
                label={`Export to ${exportLabel(format)}`}
                ext={ext}
                onPress={() => onExport(format, menu.palette)}
              />
            ))}
            <SheetAction
              compact
              icon={TrashIcon}
              tone="danger"
              label="Delete palette"
              onPress={() => onDelete(menu.palette)}
            />
          </>
        )}
      </PopoverMenu>

      <PopoverMenu
        testID="copy-menu"
        at={menu?.kind === 'color' ? menu.at : null}
        items={3}
        width={320}
        onClose={closeMenu}
      >
        {menu?.kind === 'color' && (
          <>
            <SheetAction
              compact
              label="Copy as HEX"
              ext={menu.color}
              onPress={() => onCopy(menu.color)}
            />
            <SheetAction
              compact
              label="Copy as HSL"
              ext={hslString(menu.color)}
              onPress={() => onCopy(hslString(menu.color))}
            />
            <SheetAction
              compact
              label="Copy as HSV"
              ext={hsvString(menu.color)}
              onPress={() => onCopy(hsvString(menu.color))}
            />
          </>
        )}
      </PopoverMenu>
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
});
