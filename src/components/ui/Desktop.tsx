import React from 'react';
import { type GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import { type IconComponent, IconButton } from './Button';
import { PaletteStrip } from './PaletteStrip';

import { CopyIcon, FileIcon, HarmonyIcon, MoreIcon } from '@/src/components/icons';
import { paletteColors, paletteLabel, type SavedPalette } from '@/src/state/palettes';
import { colors, control, iconTone, radius, type } from '@/src/theme/tokens';
import { harmonyLabel } from '@/src/utils/color';
import type { ColorHarmonyType } from '@/src/utils/colorUtils';

/** Section label: small caps, muted */
export function Overline({ children, style }: { children: string; style?: object }) {
  return <Text style={[styles.overline, style]}>{children}</Text>;
}

/** Read-only value with a copy button (HEX, RGB, HSL, HSV) */
export function CopyField({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue} selectable numberOfLines={1}>
        {value}
      </Text>
      <Pressable
        testID={`copy-${label.toLowerCase()}`}
        accessibilityRole="button"
        accessibilityLabel={`Copy ${label}`}
        onPress={onCopy}
        style={({ pressed }) => [styles.copy, pressed && styles.copyPressed]}
      >
        <CopyIcon size={15} color={iconTone.muted} />
      </Pressable>
    </View>
  );
}

/** Full-width export button: format on the left, file extension on the right */
export function ExportOption({
  label,
  ext,
  onPress,
  icon: Icon = FileIcon,
}: {
  label: string;
  ext: string;
  onPress: () => void;
  icon?: IconComponent;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Export to ${label}`}
      onPress={onPress}
      style={({ pressed }) => [styles.option, pressed && styles.pressed]}
    >
      <Icon size={18} color={iconTone.strong} />
      <Text style={[type.labelButton, styles.optionLabel]}>{label}</Text>
      <Text style={styles.ext}>{ext}</Text>
    </Pressable>
  );
}

export function HarmonyRow({
  harmony,
  count,
  selected,
  onPress,
}: {
  harmony: ColorHarmonyType;
  count: number;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      testID={`harmony-${harmony}`}
      accessibilityRole="tab"
      accessibilityLabel={harmonyLabel(harmony)}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        pressed && !selected && styles.rowPressed,
      ]}
    >
      <HarmonyIcon
        harmony={harmony}
        size={26}
        color={selected ? iconTone.onPrimary : iconTone.muted}
      />
      <Text
        style={[styles.rowLabel, { color: selected ? colors.textOnPrimary : colors.textSecondary }]}
      >
        {harmonyLabel(harmony)}
      </Text>
      <Text style={styles.count}>{count}</Text>
    </Pressable>
  );
}

export function SavedRow({
  palette,
  selected,
  onPress,
  onMore,
}: {
  palette: SavedPalette;
  selected: boolean;
  onPress: () => void;
  /** Opens the palette's actions (export, delete) */
  onMore: (e: GestureResponderEvent) => void;
}) {
  return (
    <View style={[styles.savedRow, selected && styles.rowSelected]}>
      <Pressable
        testID={`palette-${palette.name}`}
        accessibilityRole="button"
        accessibilityLabel={`${palette.name}, ${paletteLabel(palette)}`}
        onPress={onPress}
        style={({ pressed }) => [styles.savedMain, pressed && !selected && styles.rowPressed]}
      >
        <PaletteStrip
          colors={paletteColors(palette)}
          height={22}
          radius={radius.xs}
          style={styles.savedStrip}
        />
        <View style={styles.savedText}>
          <Text
            style={[
              styles.rowLabel,
              { color: selected ? colors.textOnPrimary : colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            {palette.name}
          </Text>
          <Text style={styles.savedHarmony}>{paletteLabel(palette)}</Text>
        </View>
      </Pressable>
      <IconButton
        testID={`palette-more-${palette.name}`}
        icon={MoreIcon}
        tone="muted"
        iconSize={18}
        style={styles.moreButton}
        accessibilityLabel={`More actions for ${palette.name}`}
        onPress={onMore}
      />
    </View>
  );
}

/** Swatch and hex of one palette color: copies HEX, the ⋯ button offers other formats */
export function PaletteValue({
  color,
  onPress,
  onMore,
}: {
  color: string;
  onPress: () => void;
  onMore: (e: GestureResponderEvent) => void;
}) {
  return (
    <View style={styles.value}>
      <Pressable
        testID={`swatch-${color}`}
        accessibilityRole="button"
        accessibilityLabel={`Copy ${color}`}
        onPress={onPress}
        style={styles.valueMain}
      >
        <View style={[styles.valueSwatch, { backgroundColor: color }]} />
        <Text style={styles.valueHex}>{color}</Text>
      </Pressable>
      <IconButton
        testID={`swatch-more-${color}`}
        icon={MoreIcon}
        tone="muted"
        iconSize={16}
        style={styles.valueMore}
        accessibilityLabel={`Copy ${color} in another format`}
        onPress={onMore}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overline: {
    ...type.overline,
    color: colors.textMuted,
  },
  field: {
    height: control.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.lineDefault,
    backgroundColor: colors.surfaceField,
  },
  fieldLabel: {
    width: 40,
    fontFamily: type.labelTab.fontFamily,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.textMuted,
  },
  fieldValue: {
    ...type.monoSmall,
    flex: 1,
    color: colors.textPrimary,
  },
  copy: {
    width: 32,
    height: 32,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyPressed: {
    backgroundColor: colors.buttonSecondary,
  },
  option: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: colors.buttonSecondary,
  },
  pressed: {
    opacity: 0.8,
  },
  optionLabel: {
    flex: 1,
    color: colors.textStrong,
  },
  ext: {
    ...type.monoSmall,
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
    paddingLeft: 10,
    paddingRight: 12,
    borderRadius: 10,
  },
  rowSelected: {
    backgroundColor: colors.surfaceSelected,
  },
  rowPressed: {
    backgroundColor: colors.surfaceHover,
  },
  rowLabel: {
    ...type.bodyDefault,
    fontSize: 14,
    lineHeight: 19,
    flex: 1,
  },
  count: {
    ...type.monoSmall,
    color: colors.textMuted,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
  },
  savedMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 4,
    borderRadius: 10,
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 4,
  },
  savedStrip: {
    width: 58,
  },
  savedText: {
    flex: 1,
  },
  savedHarmony: {
    fontFamily: type.caption.fontFamily,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textMuted,
  },
  value: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueMain: {
    flex: 1,
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  valueMore: {
    width: 28,
    height: 28,
    borderRadius: 7,
  },
  valueSwatch: {
    width: 18,
    height: 18,
    borderRadius: 5,
  },
  valueHex: {
    ...type.monoSmall,
    color: colors.textSecondary,
  },
});
