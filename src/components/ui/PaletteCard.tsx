import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconButton } from './Button';
import { PaletteStrip } from './PaletteStrip';

import { HarmonyIcon, MoreIcon } from '@/src/components/icons';
import { formatPaletteDate, paletteColors, type SavedPalette } from '@/src/state/palettes';
import { colors, iconTone, radius, type } from '@/src/theme/tokens';
import { harmonyLabel } from '@/src/utils/color';

interface PaletteCardProps {
  palette: SavedPalette;
  /** Open in the Color tab */
  current: boolean;
  onPress: () => void;
  onMore: () => void;
}

/** Saved palette in the Palettes tab */
export function PaletteCard({ palette, current, onPress, onMore }: PaletteCardProps) {
  const swatches = paletteColors(palette);
  return (
    <View style={[styles.card, current && styles.cardCurrent]}>
      <Pressable
        testID={`palette-${palette.name}`}
        accessibilityRole="button"
        accessibilityLabel={`${palette.name}, ${harmonyLabel(palette.harmony)}`}
        accessibilityHint="Opens the palette in the Color tab"
        onPress={onPress}
        style={({ pressed }) => [styles.main, pressed && styles.mainPressed]}
      >
        <View style={styles.top}>
          <HarmonyIcon harmony={palette.harmony} size={24} color={iconTone.muted} />
          <View style={styles.text}>
            <Text style={styles.name} numberOfLines={1}>
              {palette.name}
            </Text>
            <Text style={styles.meta}>
              {harmonyLabel(palette.harmony)} · {swatches.length} colors ·{' '}
              {formatPaletteDate(palette.createdAt)}
            </Text>
          </View>
        </View>
        <PaletteStrip colors={swatches} height={30} radius={radius.sm} />
      </Pressable>
      <IconButton
        icon={MoreIcon}
        tone="muted"
        accessibilityLabel={`More actions for ${palette.name}`}
        onPress={onMore}
        testID={`palette-more-${palette.name}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    padding: 6,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lineSubtle,
    backgroundColor: colors.surfaceCard,
  },
  cardCurrent: {
    borderColor: colors.lineCurrent,
  },
  main: {
    flex: 1,
    gap: 10,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 4,
    borderRadius: radius.md,
  },
  mainPressed: {
    backgroundColor: colors.surfaceField,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  text: {
    flex: 1,
    gap: 1,
  },
  name: {
    ...type.bodyStrong,
    color: colors.textStrong,
  },
  meta: {
    ...type.caption,
    color: colors.textMuted,
  },
});
