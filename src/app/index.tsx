// import 'react-scan';
import chroma from 'chroma-js';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, Text, Platform } from 'react-native';

import { ColorDisplay } from '../components/ColorDisplay';
import { ColorPicker } from '../components/ColorPicker';
import { HarmonySelector } from '../components/HarmonySelector';
import { ColorHarmonyType } from '../utils/colorUtils';
import { getHarmonyColors } from '../utils/harmonies';

export default function App() {
  // Initial state for the base color (red)
  const [baseColor, setBaseColor] = useState('#FF0000');
  // Default to analogous harmony type
  const [harmonyType, setHarmonyType] = useState<ColorHarmonyType>('analogous');
  // Store generated harmony colors
  const [harmonyColors, setHarmonyColors] = useState<string[]>([]);

  const pickerSize = 320;

  // Generate harmony colors whenever base color or harmony type changes
  useEffect(() => {
    try {
      // Use chroma.js directly to convert hex to HSL
      const [h, s, l] = chroma(baseColor).hsl();
      const hslColor = { h, s, l };
      const colors = getHarmonyColors(harmonyType, hslColor);
      setHarmonyColors(colors);
    } catch (error) {
      console.error('Error generating harmony colors:', error);
      setHarmonyColors([]);
    }
  }, [baseColor, harmonyType]);

  // Handler for when user selects a new color
  const handleColorChange = useCallback((color: string) => {
    setBaseColor(color);
  }, []);

  // Handler for when user changes harmony type
  const handleHarmonyChange = useCallback((harmony: ColorHarmonyType) => {
    setHarmonyType(harmony);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.content}>
        {Platform.OS === 'web' && <Text style={styles.appTitle}>Colorixer</Text>}

        <HarmonySelector
          selectedHarmony={harmonyType}
          onHarmonyChange={handleHarmonyChange}
        />

        <View style={styles.pickerContainer}>
          <ColorPicker
            size={pickerSize}
            onColorChange={handleColorChange}
            harmonyColors={harmonyColors} // Pass harmony colors to the color picker
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
    justifyContent: 'space-between',
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
