import './global.css';
import chroma from 'chroma-js';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useCallback } from 'react';
import { View, SafeAreaView, Text, Platform, LayoutChangeEvent } from 'react-native';

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
  const [pickerSize, setPickerSize] = useState(
    typeof window !== 'undefined' && window.innerWidth >= 768 ? 400 : 320,
  );

  const handlePickerContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setPickerSize(width > height ? height : width);
  }, []);

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
    <SafeAreaView className="container mx-auto flex-1 bg-white">
      <StatusBar style="auto" />
      <View className="flex-1 px-4 py-6 md:px-12 md:py-10">
        {Platform.OS === 'web' && (
          <Text className="text-2xl font-bold mb-6 text-center">Colorixer</Text>
        )}
        {/* HarmonySelector on top for mobile only */}
        <View className="block md:hidden mb-4">
          <HarmonySelector selectedHarmony={harmonyType} onHarmonyChange={handleHarmonyChange} />
        </View>
        {/* Responsive layout: column on mobile, row on md+ */}
        <View className="flex-1 flex-col md:flex-row gap-8 md:gap-12 w-full h-full">
          {/* Color Picker on left (full width on mobile, left column on md+) */}
          <View
            onLayout={handlePickerContainerLayout}
            className="flex-1 items-center justify-center md:items-start md:justify-start"
          >
            <ColorPicker
              size={pickerSize}
              onColorChange={handleColorChange}
              harmonyColors={harmonyColors}
            />
            {/* ColorDisplay below picker on mobile */}
            <View className="block md:hidden w-full mt-6">
              <ColorDisplay colors={harmonyColors} />
            </View>
          </View>
          {/* Harmony selector and display on right (right column on md+) */}
          <View className="hidden md:flex flex-1 flex-col items-start gap-6">
            <HarmonySelector selectedHarmony={harmonyType} onHarmonyChange={handleHarmonyChange} />
            <ColorDisplay colors={harmonyColors} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
