import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { HarmonyIcon } from '@/src/components/icons';
import { colors, iconTone, radius } from '@/src/theme/tokens';
import { HARMONIES } from '@/src/utils/color';
import type { ColorHarmonyType } from '@/src/utils/colorUtils';

interface HarmonyStripProps {
  value: ColorHarmonyType;
  onChange: (harmony: ColorHarmonyType) => void;
}

/** Segmented control with a diagram per harmony type */
export function HarmonyStrip({ value, onChange }: HarmonyStripProps) {
  return (
    <View testID="harmony-selector" style={styles.strip} accessibilityRole="tablist">
      {HARMONIES.map(({ key, label }) => {
        const selected = key === value;
        return (
          <Pressable
            key={key}
            testID={`harmony-${key}`}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            onPress={() => onChange(key)}
            style={[styles.segment, selected && styles.segmentOn]}
          >
            <HarmonyIcon
              harmony={key}
              size={26}
              color={selected ? iconTone.onPrimary : iconTone.muted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    gap: 4,
    padding: 5,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceRaised,
  },
  segment: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentOn: {
    backgroundColor: colors.surfaceSegmentOn,
  },
});
