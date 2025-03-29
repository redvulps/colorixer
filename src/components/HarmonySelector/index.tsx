import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { ColorHarmonyType } from '../../utils/colorUtils';

import { HarmonyOption } from '@/src/components/HarmonyOption';

const harmonies: { label: string; value: ColorHarmonyType }[] = [
  { label: 'Analogous', value: 'analogous' },
  { label: 'Triadic', value: 'triadic' },
  { label: 'Tetratriadic', value: 'tetratriadic' },
  { label: 'Complementary', value: 'complementary' },
  { label: 'Monochromatic', value: 'monochromatic' },
];

interface HarmonySelectorProps {
  selectedHarmony: ColorHarmonyType;
  onHarmonyChange: (harmony: ColorHarmonyType) => void;
}

const HarmonySelectorComponent: React.FC<HarmonySelectorProps> = ({
  selectedHarmony,
  onHarmonyChange,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Harmony Type:</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.optionsContainer}
      >
        {harmonies.map((harmony) => (
          <HarmonyOption
            key={harmony.value}
            harmony={harmony}
            selected={selectedHarmony === harmony.value}
            onHarmonyChange={onHarmonyChange}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export const HarmonySelector = React.memo(HarmonySelectorComponent);

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
});
