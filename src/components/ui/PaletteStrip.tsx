import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { fonts } from '@/src/theme/tokens';
import { inkOn } from '@/src/utils/color';

interface PaletteStripProps {
  colors: string[];
  height: number;
  radius: number;
  onPressColor?: (color: string) => void;
  onLongPressColor?: (color: string) => void;
  /** Print each color's hex inside its swatch */
  labels?: boolean;
  style?: ViewStyle;
  testID?: string;
}

/** The palette as one rounded bar of equal swatches */
export function PaletteStrip({
  colors,
  height,
  radius,
  onPressColor,
  onLongPressColor,
  labels,
  style,
  testID,
}: PaletteStripProps) {
  const interactive = !!(onPressColor || onLongPressColor);
  const label = (color: string) =>
    labels ? (
      <Text style={[styles.label, { color: inkOn(color) }]} numberOfLines={1}>
        {color}
      </Text>
    ) : null;
  return (
    <View testID={testID} style={[styles.strip, { height, borderRadius: radius }, style]}>
      {colors.map((color, i) =>
        interactive ? (
          <Pressable
            key={`${color}-${i}`}
            testID={`swatch-${color}`}
            accessibilityRole="button"
            accessibilityLabel={color}
            accessibilityHint="Copies the color. Long press for other formats."
            style={[styles.swatch, labels && styles.labeled, { backgroundColor: color }]}
            onPress={() => onPressColor?.(color)}
            onLongPress={() => onLongPressColor?.(color)}
          >
            {label(color)}
          </Pressable>
        ) : (
          <View
            key={`${color}-${i}`}
            style={[styles.swatch, labels && styles.labeled, { backgroundColor: color }]}
          >
            {label(color)}
          </View>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  swatch: {
    flex: 1,
  },
  labeled: {
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  label: {
    fontFamily: fonts.monoSemibold,
    fontSize: 13,
    lineHeight: 18,
  },
});
