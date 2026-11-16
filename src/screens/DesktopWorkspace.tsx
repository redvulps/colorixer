import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorSliders, SLIDERS_HEADER } from '@/src/components/ColorSliders';
import { ColorWheel } from '@/src/components/ColorWheel';
import {
  CheckIcon,
  ExportIcon,
  FileIcon,
  GearIcon,
  ImageIcon,
  SaveIcon,
  TrashIcon,
} from '@/src/components/icons';
import {
  Button,
  CopyField,
  ExportOption,
  HarmonyRow,
  type ImagePaletteHandle,
  ImagePaletteView,
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
  unsavedName,
  useCopy,
} from '@/src/hooks/usePaletteActions';
import { useTopInset } from '@/src/hooks/useTopInset';
import { t } from '@/src/i18n';
import { SettingsDialog } from '@/src/screens/SettingsScreen';
import {
  type ImagePalette,
  paletteColors,
  type SavedPalette,
  usePalette,
} from '@/src/state/palettes';
import { colors as tokens, radius, type } from '@/src/theme/tokens';
import {
  HARMONIES,
  harmonyColors,
  hslString,
  hsvString,
  inkOn,
  rgbString,
} from '@/src/utils/color';

const TOP_BAR = 60;
/** The gear right of Export: its 40 px and the 12 px gap before it */
const GEAR_SPACE = 40 + 12;
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
  const {
    hsv,
    activeHarmony,
    kind,
    base,
    colors,
    current,
    saved,
    setHsv,
    setHarmony,
    useImage: applyImage,
    save,
    load,
    remove,
  } = usePalette();
  const copy = useCopy();
  const toast = useToast();
  const { width, height } = useWindowDimensions();
  // Zero in a browser; on a tablet, the system bars the workspace has to stay clear of
  const insets = useSafeAreaInsets();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const imageFlow = useRef<ImagePaletteHandle>(null);
  const closeMenu = () => setMenu(null);

  const topInset = useTopInset();
  const topBarHeight = TOP_BAR + topInset;
  const canvasWidth = width - SIDEBAR - INSPECTOR - insets.left - insets.right;
  // Wheel, the sliders' header and three 34 px sliders with 12 px gaps, 18 px between them,
  // 48 px of margin
  const wheelSize = Math.max(
    220,
    Math.min(
      400,
      height - topBarHeight - insets.bottom - (SLIDERS_HEADER + 3 * 34 + 3 * 12) - 18 - 48,
      canvasWidth - 48,
    ),
  );
  const sliderWidth = Math.min(470, canvasWidth - 48);
  const name = current?.name ?? unsavedName();

  const onSave = () => {
    const palette = save();
    toast(t('toast.saved', { name: palette.name }));
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
    toast(t('toast.deleted', { name: palette.name }));
  };

  const onCopy = (text: string) => {
    setMenu(null);
    copy(text);
  };

  const onUseImage = (palette: ImagePalette) => {
    applyImage(palette);
    toast(t('toast.fromImage', { name: palette.name }));
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
          / {t('tab.palettes')} /{' '}
          <Text style={styles.crumbName}>{current?.name ?? t('palette.untitled')}</Text>
        </Text>
        <View style={styles.spacer} />
        <Button
          testID="image-button"
          variant="ghost"
          icon={ImageIcon}
          label={t('common.image')}
          onPress={() => imageFlow.current?.start()}
        />
        <Button
          testID="save-button"
          variant={current ? 'saved' : 'ghost'}
          icon={current ? CheckIcon : SaveIcon}
          label={current ? t('common.saved') : t('common.save')}
          disabled={!!current}
          onPress={onSave}
        />
        <Button
          testID="share-button"
          variant="primary"
          icon={ExportIcon}
          label={t('common.export')}
          chevron
          accessibilityState={{ expanded: menu?.kind === 'export' }}
          // Right-aligned under the button, which has the gear and a gap to its right
          onPress={() =>
            setMenu({
              kind: 'export',
              at: { x: width - 28 - GEAR_SPACE - insets.right, y: topBarHeight - 14 },
            })
          }
        />
        <Button
          testID="settings-button"
          variant="ghost"
          icon={GearIcon}
          accessibilityLabel={t('tab.settings')}
          onPress={() => setSettingsOpen(true)}
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
          <Overline style={styles.sidebarLabel}>{t('section.harmony')}</Overline>
          <View testID="harmony-selector">
            {HARMONIES.map(({ key }) => (
              <HarmonyRow
                key={key}
                harmony={key}
                count={harmonyColors(key, base).length}
                selected={key === activeHarmony}
                onPress={() => setHarmony(key)}
              />
            ))}
          </View>
          <Overline style={[styles.sidebarLabel, styles.sidebarLabelGap]}>
            {t('section.savedPalettes')}
          </Overline>
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
            <Text style={styles.sidebarEmpty}>{t('section.savedEmpty')}</Text>
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
          <ColorSliders style={{ width: sliderWidth }} />
        </ScrollView>

        <ScrollView
          style={[styles.inspector, { width: INSPECTOR + insets.right }]}
          contentContainerStyle={[
            styles.inspectorContent,
            { paddingRight: 18 + insets.right, paddingBottom: 18 + insets.bottom },
          ]}
        >
          <View style={styles.section}>
            <Overline>{t('section.baseColor')}</Overline>
            <View style={[styles.baseSwatch, { backgroundColor: base }]}>
              <Text style={[styles.baseHex, { color: inkOn(base) }]}>{base}</Text>
            </View>
            <CopyField label="HEX" value={base} onCopy={() => copy(base)} />
            <CopyField label="RGB" value={rgbString(base)} onCopy={() => copy(rgbString(base))} />
            <CopyField label="HSL" value={hslString(base)} onCopy={() => copy(hslString(base))} />
            <CopyField label="HSV" value={hsvString(base)} onCopy={() => copy(hsvString(base))} />
          </View>

          <View testID="generated-colors" style={styles.paletteSection}>
            <Overline style={styles.paletteLabel}>{t('palette.header', { kind })}</Overline>
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
            <Overline>{t('common.export')}</Overline>
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
                label={t('export.to', { app: exportLabel(format) })}
                ext={ext}
                onPress={() => onExport(format, menu.palette)}
              />
            ))}
            <SheetAction
              compact
              icon={TrashIcon}
              tone="danger"
              label={t('palette.delete')}
              onPress={() => onDelete(menu.palette)}
            />
          </>
        )}
      </PopoverMenu>

      <PopoverMenu
        testID="copy-menu"
        at={menu?.kind === 'color' ? menu.at : null}
        items={4}
        width={320}
        onClose={closeMenu}
      >
        {menu?.kind === 'color' && (
          <>
            <SheetAction
              compact
              label={t('copy.as', { format: 'HEX' })}
              ext={menu.color}
              onPress={() => onCopy(menu.color)}
            />
            <SheetAction
              compact
              label={t('copy.as', { format: 'RGB' })}
              ext={rgbString(menu.color)}
              onPress={() => onCopy(rgbString(menu.color))}
            />
            <SheetAction
              compact
              label={t('copy.as', { format: 'HSL' })}
              ext={hslString(menu.color)}
              onPress={() => onCopy(hslString(menu.color))}
            />
            <SheetAction
              compact
              label={t('copy.as', { format: 'HSV' })}
              ext={hsvString(menu.color)}
              onPress={() => onCopy(hsvString(menu.color))}
            />
          </>
        )}
      </PopoverMenu>
      <ImagePaletteView ref={imageFlow} layout="dialog" onUse={onUseImage} />
      <SettingsDialog visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
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
