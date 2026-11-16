import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorSliders } from '@/src/components/ColorSliders';
import { ColorWheel } from '@/src/components/ColorWheel';
import {
  CheckIcon,
  ColorIcon,
  ExpandIcon,
  ExportIcon,
  FileIcon,
  GearIcon,
  ImageIcon,
  PalettesIcon,
  SaveIcon,
  TrashIcon,
} from '@/src/components/icons';
import {
  BottomSheet,
  Button,
  CopyField,
  HarmonyRow,
  type IconComponent,
  type ImagePaletteHandle,
  ImagePaletteView,
  LogoMark,
  type MenuPoint,
  Overline,
  PaletteCard,
  PaletteFullscreen,
  PaletteStrip,
  PillIconButton,
  PopoverMenu,
  type Rect,
  SheetAction,
  useToast,
} from '@/src/components/ui';
import {
  EXPORT_FORMATS,
  type ExportFormat,
  exportPalette,
  haptic,
  unsavedName,
  useCopy,
} from '@/src/hooks/usePaletteActions';
import { useHeldTopInset } from '@/src/hooks/useTopInset';
import { t } from '@/src/i18n';
import { SettingsView } from '@/src/screens/SettingsScreen';
import {
  type ImagePalette,
  paletteColors,
  paletteLabel,
  type SavedPalette,
  usePalette,
} from '@/src/state/palettes';
import { fonts, iconTone, radius, colors as tokens, type } from '@/src/theme/tokens';
import {
  HARMONIES,
  harmonyColors,
  hslString,
  hsvString,
  inkOn,
  rgbString,
} from '@/src/utils/color';

const TOP_BAR = 60;
const CONTROLS = 316;
const PREVIEW_HEADER = 52;
const BAND = 132;
/** Least room kept under the band, so the gesture bar never sits on the colors */
const MIN_BOTTOM_SAFE = 16;
const GRID_PADDING = 24;
const GRID_GAP = 12;

/** Toast offset that clears the palette band at the bottom */
export function tabletToastBottom(insetBottom: number): number {
  return PREVIEW_HEADER + BAND + Math.max(insetBottom, MIN_BOTTOM_SAFE) + 16;
}

const exportLabel = (format: ExportFormat) => (format === 'ase' ? 'Adobe ASE' : 'Procreate');

type TabletView = 'color' | 'palettes' | 'settings';

/**
 * Tablet held upright: Color, Palettes and Settings picked at the top. In Color the wheel takes
 * the left, the controls a column on the right, and the palette runs edge to edge along the
 * bottom.
 */
export function TabletWorkspace() {
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
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<TabletView>('color');
  const imageFlow = useRef<ImagePaletteHandle>(null);
  const [exportAt, setExportAt] = useState<MenuPoint | null>(null);
  const [selected, setSelected] = useState<SavedPalette | null>(null);
  const [copyColor, setCopyColor] = useState<string | null>(null);
  const [fullOpen, setFullOpen] = useState(false);
  const [fullOrigin, setFullOrigin] = useState<Rect | null>(null);
  const { top: topInset, hold: holdTopInset } = useHeldTopInset(fullOpen);
  const bandRef = useRef<React.ComponentRef<typeof View>>(null);

  const name = current?.name ?? unsavedName();
  const topBarHeight = TOP_BAR + topInset;
  const bottomSafe = Math.max(insets.bottom, MIN_BOTTOM_SAFE);
  const stageWidth = width - CONTROLS - insets.left - insets.right;
  const stageHeight = height - topBarHeight - PREVIEW_HEADER - BAND - bottomSafe;
  const wheelSize = Math.max(200, Math.min(480, stageWidth - 48, stageHeight - 48));
  const cardWidth = (width - insets.left - insets.right - 2 * GRID_PADDING - GRID_GAP) / 2;
  const selectedColors = selected ? paletteColors(selected) : [];

  const onSave = () => {
    const palette = save();
    haptic();
    toast(t('toast.saved', { name: palette.name }));
  };

  const onExport = (format: ExportFormat) => {
    setExportAt(null);
    exportPalette(format, colors, name);
  };

  const open = (palette: SavedPalette) => {
    load(palette.id);
    setView('color');
  };

  // The full-screen view grows out of the band, so it needs the band's place on screen
  const openFull = () => {
    setFullOrigin(null);
    holdTopInset();
    setFullOpen(true);
    bandRef.current?.measureInWindow((x, y, w, h) => setFullOrigin({ x, y, width: w, height: h }));
  };

  const copyAs = (text: string) => {
    setCopyColor(null);
    copy(text);
  };

  const onUseImage = (palette: ImagePalette) => {
    setView('color');
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
        {/* The mark alone: with three views, the name no longer fits beside the actions */}
        <View accessible accessibilityRole="image" accessibilityLabel="Colorixer">
          <LogoMark />
        </View>
        <View style={styles.switch} accessibilityRole="tablist">
          <SwitchButton
            testID="view-color"
            icon={ColorIcon}
            label={t('tab.color')}
            selected={view === 'color'}
            onPress={() => setView('color')}
          />
          <SwitchButton
            testID="view-palettes"
            icon={PalettesIcon}
            label={t('tab.palettes')}
            count={saved.length}
            selected={view === 'palettes'}
            onPress={() => setView('palettes')}
          />
          <SwitchButton
            testID="view-settings"
            icon={GearIcon}
            label={t('tab.settings')}
            selected={view === 'settings'}
            onPress={() => setView('settings')}
          />
        </View>
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
          accessibilityState={{ expanded: exportAt !== null }}
          // Right-aligned under the button
          onPress={() => setExportAt({ x: width - 28 - insets.right, y: topBarHeight - 14 })}
        />
      </View>

      {view === 'color' ? (
        <>
          <View style={styles.body}>
            <View style={[styles.stage, { paddingLeft: insets.left }]}>
              <ColorWheel
                size={wheelSize}
                hsv={hsv}
                colors={colors}
                onChange={(h, s) => setHsv([h, s, hsv[2]])}
              />
            </View>
            <ScrollView
              style={[styles.controls, { width: CONTROLS + insets.right }]}
              contentContainerStyle={[styles.controlsContent, { paddingRight: 18 + insets.right }]}
            >
              <View style={styles.section}>
                <Overline style={styles.sectionLabel}>{t('section.harmony')}</Overline>
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
              </View>
              <ColorSliders />
              <View style={styles.section}>
                <Overline>{t('section.baseColor')}</Overline>
                <View style={[styles.baseSwatch, { backgroundColor: base }]}>
                  <Text style={[styles.baseHex, { color: inkOn(base) }]}>{base}</Text>
                </View>
                <CopyField label="HEX" value={base} onCopy={() => copy(base)} />
                <CopyField
                  label="RGB"
                  value={rgbString(base)}
                  onCopy={() => copy(rgbString(base))}
                />
                <CopyField
                  label="HSL"
                  value={hslString(base)}
                  onCopy={() => copy(hslString(base))}
                />
                <CopyField
                  label="HSV"
                  value={hsvString(base)}
                  onCopy={() => copy(hsvString(base))}
                />
              </View>
            </ScrollView>
          </View>

          {/* Edge to edge along the bottom, above the gesture bar's safe area */}
          <View style={[styles.preview, { paddingBottom: bottomSafe }]}>
            <View
              style={[
                styles.previewHeader,
                { paddingLeft: 20 + insets.left, paddingRight: 12 + insets.right },
              ]}
            >
              <Overline style={styles.paletteName}>
                {`${current ? `${current.name} · ` : ''}${kind} · ${t('common.colors', { count: colors.length })}`}
              </Overline>
              <PillIconButton
                testID="fullscreen-button"
                icon={ExpandIcon}
                accessibilityLabel={t('fullscreen.show')}
                onPress={openFull}
              />
            </View>
            <View ref={bandRef} collapsable={false}>
              <PaletteStrip
                testID="generated-colors"
                colors={colors}
                height={BAND}
                radius={0}
                labels
                onPressColor={copy}
                onLongPressColor={setCopyColor}
              />
            </View>
          </View>
        </>
      ) : view === 'settings' ? (
        <SettingsView bottomInset={insets.bottom} />
      ) : (
        <ScrollView
          style={styles.gridScroll}
          contentContainerStyle={[
            styles.grid,
            {
              paddingLeft: GRID_PADDING + insets.left,
              paddingRight: GRID_PADDING + insets.right,
              paddingBottom: 40 + insets.bottom,
            },
          ]}
        >
          {saved.length > 0 ? (
            saved.map((palette) => (
              <View key={palette.id} style={{ width: cardWidth }}>
                <PaletteCard
                  palette={palette}
                  current={palette.id === current?.id}
                  onPress={() => open(palette)}
                  onMore={() => setSelected(palette)}
                />
              </View>
            ))
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{t('palette.emptyTitle')}</Text>
              <Text style={styles.emptyText}>{t('palette.emptyTablet')}</Text>
            </View>
          )}
        </ScrollView>
      )}

      <PopoverMenu
        testID="export-menu"
        at={exportAt}
        items={EXPORT_FORMATS.length}
        onClose={() => setExportAt(null)}
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

      <PaletteFullscreen
        testID="palette-fullscreen"
        visible={fullOpen}
        origin={fullOrigin}
        colors={colors}
        label={`${current ? `${current.name} · ` : ''}${kind} · ${t('common.colors', { count: colors.length })}`}
        onClose={() => setFullOpen(false)}
      />

      <BottomSheet
        testID="palette-sheet"
        visible={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name}
        subtitle={
          selected
            ? `${paletteLabel(selected)} · ${t('common.colors', { count: selectedColors.length })}`
            : undefined
        }
        palette={selectedColors}
      >
        {selected && (
          <>
            {EXPORT_FORMATS.map(({ format, app, ext }) => (
              <SheetAction
                key={format}
                icon={FileIcon}
                label={t('export.to', { app })}
                ext={ext}
                onPress={() => {
                  setSelected(null);
                  exportPalette(format, selectedColors, selected.name);
                }}
              />
            ))}
            <SheetAction
              icon={TrashIcon}
              tone="danger"
              label={t('palette.delete')}
              onPress={() => {
                remove(selected.id);
                setSelected(null);
                toast(t('toast.deleted', { name: selected.name }));
              }}
            />
          </>
        )}
        <SheetAction label={t('common.cancel')} tone="cancel" onPress={() => setSelected(null)} />
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
      <ImagePaletteView ref={imageFlow} layout="sheet" onUse={onUseImage} />
    </View>
  );
}

interface SwitchButtonProps {
  icon: IconComponent;
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Muted number after the label, e.g. how many palettes are saved */
  count?: number;
  testID?: string;
}

/** One side of the Color / Palettes switch in the top bar */
function SwitchButton({ icon: Icon, label, selected, onPress, count, testID }: SwitchButtonProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.switchButton,
        selected && styles.switchButtonOn,
        pressed && !selected && styles.switchButtonPressed,
      ]}
    >
      <Icon size={18} color={selected ? iconTone.onPrimary : iconTone.muted} />
      <Text
        style={[type.labelButton, { color: selected ? tokens.textOnPrimary : tokens.textMuted }]}
      >
        {label}
      </Text>
      {count !== undefined && <Text style={styles.switchCount}>{count}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.bgApp,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    // Three views and three actions in 800 dp, in any of the app's languages
    gap: 8,
    backgroundColor: tokens.surfacePanel,
    borderBottomWidth: 1,
    borderBottomColor: tokens.lineSubtle,
    zIndex: 2,
  },
  switch: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    marginLeft: 10,
    borderRadius: radius.md,
    backgroundColor: tokens.surfaceRaised,
  },
  switchButton: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
  },
  switchButtonOn: {
    backgroundColor: tokens.surfaceSegmentOn,
  },
  switchButtonPressed: {
    backgroundColor: tokens.surfaceHover,
  },
  switchCount: {
    ...type.monoSmall,
    color: tokens.textMuted,
  },
  spacer: {
    flex: 1,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bgCanvas,
  },
  controls: {
    flexGrow: 0,
    backgroundColor: tokens.surfacePanel,
    borderLeftWidth: 1,
    borderLeftColor: tokens.lineSubtle,
  },
  controlsContent: {
    paddingVertical: 20,
    paddingLeft: 18,
    gap: 26,
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    paddingBottom: 4,
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
    fontFamily: fonts.monoSemibold,
    fontSize: 13,
  },
  preview: {
    borderTopWidth: 1,
    borderTopColor: tokens.lineSubtle,
    backgroundColor: tokens.bgApp,
  },
  previewHeader: {
    height: PREVIEW_HEADER,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  paletteName: {
    flexShrink: 1,
  },
  gridScroll: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    gap: GRID_GAP,
    paddingTop: GRID_PADDING,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingTop: 120,
  },
  emptyTitle: {
    ...type.bodyStrong,
    color: tokens.textPrimary,
  },
  emptyText: {
    ...type.bodyDefault,
    color: tokens.textMuted,
  },
});
