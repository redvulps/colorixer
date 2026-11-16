import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconButton } from './Button';
import { PaletteStrip } from './PaletteStrip';

import { HarmonyIcon, ImageIcon, MoreIcon } from '@/src/components/icons';
import { t } from '@/src/i18n';
import {
  formatPaletteDate,
  paletteColors,
  paletteLabel,
  type SavedPalette,
} from '@/src/state/palettes';
import { colors, iconTone, radius, type } from '@/src/theme/tokens';

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
        accessibilityLabel={`${palette.name}, ${paletteLabel(palette)}`}
        accessibilityHint={t('palette.openHint')}
        onPress={onPress}
        style={({ pressed }) => [styles.main, pressed && styles.mainPressed]}
      >
        <View style={styles.top}>
          {palette.mood ? (
            <ImageIcon size={24} color={iconTone.muted} />
          ) : (
            <HarmonyIcon harmony={palette.harmony} size={24} color={iconTone.muted} />
          )}
          <View style={styles.text}>
            <Text style={styles.name} numberOfLines={1}>
              {palette.name}
            </Text>
            <Text style={styles.meta}>
              {paletteLabel(palette)} · {t('common.colors', { count: swatches.length })} ·{' '}
              {formatPaletteDate(palette.createdAt)}
            </Text>
          </View>
        </View>
        <PaletteStrip colors={swatches} height={30} radius={radius.sm} />
      </Pressable>
      {/* Over the card's corner, so the strip runs the card's full width */}
      <IconButton
        icon={MoreIcon}
        tone="muted"
        accessibilityLabel={t('palette.more', { name: palette.name })}
        onPress={onMore}
        testID={`palette-more-${palette.name}`}
        style={styles.more}
      />
    </View>
  );
}

/** Room the top row leaves for the ⋯ button */
const MORE_SPACE = 40;

const styles = StyleSheet.create({
  card: {
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
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.md,
  },
  mainPressed: {
    backgroundColor: colors.surfaceField,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: MORE_SPACE,
  },
  more: {
    position: 'absolute',
    top: 10,
    right: 6,
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
