import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

interface PaletteStripProps {
  colors: string[];
  height: number;
  radius: number;
  onPressColor?: (color: string) => void;
  onLongPressColor?: (color: string) => void;
  /** What a tap and a long press on a swatch do, for screen readers */
  swatchHint?: string;
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
  swatchHint = 'Copies the color. Long press for other formats.',
  style,
  testID,
}: PaletteStripProps) {
  const interactive = !!(onPressColor || onLongPressColor);
  return (
    <View testID={testID} style={[styles.strip, { height, borderRadius: radius }, style]}>
      {colors.map((color, i) =>
        interactive ? (
          <Pressable
            key={`${color}-${i}`}
            testID={`swatch-${color}`}
            accessibilityRole="button"
            accessibilityLabel={color}
            accessibilityHint={swatchHint}
            style={[styles.swatch, { backgroundColor: color }]}
            onPress={() => onPressColor?.(color)}
            onLongPress={() => onLongPressColor?.(color)}
          />
        ) : (
          <View key={`${color}-${i}`} style={[styles.swatch, { backgroundColor: color }]} />
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
});
