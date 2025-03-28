import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import { hsvToRgb, rgbToHex, HSV } from '../../utils/colorUtils';

interface ColorPickerProps {
  size?: number;
  onColorChange: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ size = 280, onColorChange }) => {
  const [selectedPosition, setSelectedPosition] = useState({ x: size / 2, y: size / 2 });
  const [selectedColor, setSelectedColor] = useState('#ff0000');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // Calculate color wheel center and radius
  const center = size / 2;
  const radius = size / 2 - 10;

  // Function to calculate color at position
  const getColorAtPosition = (x: number, y: number): string => {
    // Calculate distance from center (for saturation)
    const dx = x - center;
    const dy = y - center;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Calculate saturation (0 to 100) based on distance from center
    const saturation = Math.min(distance / radius * 100, 100);

    // Calculate hue (0 to 360) based on angle
    const angle = Math.atan2(dy, dx);
    const hue = ((angle / Math.PI * 180) + 360) % 360;

    // Create color with full value/brightness
    const hsv: HSV = { h: hue, s: saturation, v: 100 };
    const rgb = hsvToRgb(hsv);
    return rgbToHex(rgb);
  };

  // Handle user interaction with the color wheel
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: handleTouch,
      onPanResponderMove: handleTouch,
    })
  ).current;

  function handleTouch(event: any) {
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
  }

  // Draw color wheel on canvas
  const drawColorWheel = (ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw hue circle
    for (let angle = 0; angle < 360; angle++) {
      const startAngle = (angle - 0.5) * Math.PI / 180;
      const endAngle = (angle + 0.5) * Math.PI / 180;

      // Draw each hue as a line from center to edge
      for (let j = 0; j < radius; j++) {
        // Calculate saturation based on distance from center
        const saturation = j / radius * 100;

        // Create color for this segment
        const hsv: HSV = { h: angle, s: saturation, v: 100 };
        const rgb = hsvToRgb(hsv);
        const color = rgbToHex(rgb);

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.arc(center, center, j, startAngle, endAngle);
        ctx.stroke();
      }
    }
  };

  // Set up canvas and draw color wheel when component mounts
  useEffect(() => {
    if (canvasRef.current) {
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
  }, []);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <canvas ref={canvasRef} style={styles.canvas} />
      <View style={styles.touchLayer} {...panResponder.panHandlers} />
      <View
        style={[
          styles.selector,
          {
            left: selectedPosition.x - 15,
            top: selectedPosition.y - 15,
            borderColor: selectedColor === '#FFFFFF' ? '#000000' : '#FFFFFF'
          }
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 1000, // Make it circular
    overflow: 'hidden',
    alignSelf: 'center',
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
  },
});
