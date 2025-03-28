import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import type { ColorHarmonyType } from '../../utils/colorUtils';

interface HarmonySelectorProps {
  selectedHarmony: ColorHarmonyType;
  onHarmonyChange: (harmony: ColorHarmonyType) => void;
}

export const HarmonySelector: React.FC<HarmonySelectorProps> = ({
  selectedHarmony,
  onHarmonyChange
}) => {
  const harmonies: { label: string; value: ColorHarmonyType }[] = [
    { label: 'Analogous', value: 'analogous' },
    { label: 'Triadic', value: 'triadic' },
    { label: 'Tetratriadic', value: 'tetratriadic' },
    { label: 'Complementary', value: 'complementary' },
    { label: 'Monochromatic', value: 'monochromatic' }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Harmony Type:</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.optionsContainer}
      >
        {harmonies.map((harmony) => (
          <TouchableOpacity
            key={harmony.value}
            style={[
              styles.option,
              selectedHarmony === harmony.value && styles.selectedOption
            ]}
            onPress={() => onHarmonyChange(harmony.value)}
          >
            <Text
              style={[
                styles.optionText,
                selectedHarmony === harmony.value && styles.selectedOptionText
              ]}
            >
              {harmony.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

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
  option: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  selectedOption: {
    backgroundColor: '#2196F3',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedOptionText: {
    color: 'white',
  },
});
