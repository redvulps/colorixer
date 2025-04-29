import chroma from 'chroma-js';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, PanResponder, Platform, GestureResponderEvent } from 'react-native';

import { CustomCanvas } from '../CustomCanvas';
import { HarmonyIndicators } from '../HarmonyIndicators';

interface ColorPickerProps {
  size?: number;
  onColorChange: (color: string) => void;
  harmonyColors?: string[]; // Add harmony colors prop
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  size = 480,
  onColorChange,
  harmonyColors = [], // Default to empty array if not provided
}) => {
  const [selectedPosition, setSelectedPosition] = useState({ x: size / 2, y: size / 2 });
  const [selectedColor, setSelectedColor] = useState('#ff0000');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // Calculate color wheel center and radius
  const center = size / 2;
  const radius = size / 2 - 10;

  // Function to calculate color at position
  const getColorAtPosition = useCallback(
    (x: number, y: number): string => {
      // Calculate distance from center (for saturation)
      const dx = x - center;
      const dy = y - center;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Calculate saturation (0 to 1) based on distance from center
      const saturation = Math.min(distance / radius, 1);

      // Calculate hue (0 to 360) based on angle
      const angle = Math.atan2(dy, dx);
      const hue = ((angle / Math.PI) * 180 + 360) % 360;

      // Use Chroma.js to create the color (full value/brightness)
      return chroma.hsv(hue, saturation, 1).hex();
    },
    [center, radius],
  );

  // Function to calculate position from color
  const getPositionFromColor = useCallback(
    (color: string) => {
      try {
        // Use Chroma.js to convert color to HSV
        const [hue, saturation] = chroma(color).hsv();

        // Calculate position based on hue and saturation
        const hueRad = (hue * Math.PI) / 180; // Convert hue to radians
        const saturationFactor = saturation; // Chroma.js already returns saturation in 0-1 range

        const x = center + Math.cos(hueRad) * saturationFactor * radius;
        const y = center + Math.sin(hueRad) * saturationFactor * radius;

        return { x, y };
      } catch (error) {
        console.error('Error calculating position from color:', error);
        return { x: center, y: center };
      }
    },
    [center, radius],
  );

  const handleTouch = useCallback(
    (event: GestureResponderEvent) => {
      // Get touch position relative to the wheel
      const { locationX, locationY } = event.nativeEvent;

      // Calculate distance from center
      const dx = locationX - center;
      const dy = locationY - center;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Constrain position to within the wheel
      let x = locationX;
      let y = locationY;

      if (distance > radius) {
        // If outside the wheel, clamp to the edge
        const angle = Math.atan2(dy, dx);
        x = Math.cos(angle) * radius + center;
        y = Math.sin(angle) * radius + center;
      }

      setSelectedPosition({ x, y });

      // Get the color at this position and notify parent
      const color = getColorAtPosition(x, y);
      setSelectedColor(color);
      onColorChange(color);
    },
    [center, getColorAtPosition, onColorChange, radius],
  );

  // Draw color wheel on canvas
  const drawColorWheel = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      // Clear canvas
      ctx.clearRect(0, 0, size, size);

      // Draw hue circle
      for (let angle = 0; angle < 360; angle++) {
        // Use slightly larger angle coverage to prevent gaps
        const startAngle = (angle * Math.PI) / 180;
        const endAngle = ((angle + 1.2) * Math.PI) / 180;

        // Create a radial gradient for this sector
        const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius);

        // White at center (0% saturation)
        gradient.addColorStop(0, '#FFFFFF');
        // Fully saturated color at the edge
        gradient.addColorStop(1, chroma.hsv(angle, 1, 1).hex());

        // Draw the sector with gradient fill
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, startAngle, endAngle);
        ctx.lineTo(center, center);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    },
    [center, radius, size],
  );

  const createPanResponder = useCallback(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: handleTouch,
        onPanResponderMove: handleTouch,
      }),
    [handleTouch],
  );

  // Handle user interaction with the color wheel
  const panResponder = useRef(createPanResponder());

  // Set up canvas and draw color wheel when component mounts
  useEffect(() => {
    if (Platform.OS === 'web' && canvasRef.current) {
      // Set canvas size
      canvasRef.current.width = size * 2; // 2x for high DPI displays
      canvasRef.current.height = size * 2;

      // Get context and store it for later use
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        contextRef.current = ctx;
        // Scale for high DPI displays
        ctx.scale(2, 2);
        // Draw the color wheel
        drawColorWheel(ctx);
      }
    }
  }, [drawColorWheel, size]);

  // Handle color change from CustomCanvas (mobile)
  const handleMobileColorChange = useCallback(
    (color: string) => {
      setSelectedColor(color);
      onColorChange(color);
      // Update selected position based on the new color
      setSelectedPosition(getPositionFromColor(color));
    },
    [onColorChange, getPositionFromColor],
  );

  useEffect(() => {
    setSelectedPosition({ x: size / 2, y: size / 2 });
    panResponder.current = createPanResponder();
  }, [createPanResponder, size]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {Platform.OS === 'web' ? (
        <>
          <canvas ref={canvasRef} style={styles.canvas} />
          <View style={styles.touchLayer} {...panResponder.current.panHandlers} />
        </>
      ) : (
        <CustomCanvas size={size} onColorChange={handleMobileColorChange} />
      )}

      <HarmonyIndicators
        harmonyColors={harmonyColors}
        selectedColor={selectedColor}
        getPositionFromColor={getPositionFromColor}
      />

      <View
        style={[
          styles.selector,
          {
            left: selectedPosition.x - 15,
            top: selectedPosition.y - 15,
          },
        ]}
      />
    </View>
  );
};

ColorPicker.displayName = 'ColorPicker';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 1000, // Make it circular
    overflow: 'hidden',
    alignSelf: 'center',
    userSelect: 'none',
  },
  canvas: {
    width: '100%',
    height: '100%',
  },
  touchLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  selector: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    backgroundColor: 'transparent',
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 100,
  },
});
