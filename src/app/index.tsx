import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ColorPicker } from '../components/ColorPicker';
import { HarmonySelector } from '../components/HarmonySelector';
import { ColorDisplay } from '../components/ColorDisplay';
import { hexToRgb, rgbToHsl, ColorHarmonyType } from '../utils/colorUtils';
import { getHarmonyColors } from '../utils/harmonies';

export default function App() {
  // Initial state for the base color (red)
  const [baseColor, setBaseColor] = useState('#FF0000');
  // Default to analogous harmony type
  const [harmonyType, setHarmonyType] = useState<ColorHarmonyType>('analogous');
  // Store generated harmony colors
  const [harmonyColors, setHarmonyColors] = useState<string[]>([]);

  // Generate harmony colors whenever base color or harmony type changes
  useEffect(() => {
    try {
      const rgb = hexToRgb(baseColor);
      const hsl = rgbToHsl(rgb);
      const colors = getHarmonyColors(harmonyType, hsl);
      setHarmonyColors(colors);
    } catch (error) {
      console.error('Error generating harmony colors:', error);
      setHarmonyColors([]);
    }
  }, [baseColor, harmonyType]);

  // Handler for when user selects a new color
  const handleColorChange = (color: string) => {
    setBaseColor(color);
  };

  // Handler for when user changes harmony type
  const handleHarmonyChange = (harmony: ColorHarmonyType) => {
    setHarmonyType(harmony);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.content}>
        <Text style={styles.appTitle}>Colorixer</Text>

        <HarmonySelector
          selectedHarmony={harmonyType}
          onHarmonyChange={handleHarmonyChange}
        />

        <View style={styles.pickerContainer}>
          <ColorPicker
            size={280}
            onColorChange={handleColorChange}
          />
        </View>

        <ColorDisplay
          colors={harmonyColors}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  pickerContainer: {
    marginVertical: 20,
    alignItems: 'center',
  }
});
