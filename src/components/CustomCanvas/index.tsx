import chroma from 'chroma-js';
import React, { useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface CustomCanvasProps {
  size: number;
  onColorChange: (color: string) => void;
  onInit?: () => void;
}

export const CustomCanvas: React.FC<CustomCanvasProps> = ({ size, onColorChange, onInit }) => {
  const webViewRef = useRef<WebView>(null);

  // HTML content with canvas and color wheel logic
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          touch-action: none;
        }
        canvas {
          display: block;
          width: ${size}px;
          height: ${size}px;
        }
      </style>
    </head>
    <body>
      <canvas id="colorWheel" width="${size * 2}" height="${size * 2}"></canvas>
      <script>
        // Canvas setup
        const canvas = document.getElementById('colorWheel');
        const ctx = canvas.getContext('2d');
        const centerX = ${size};
        const centerY = ${size};
        const radius = ${size - 10};

        // Draw color wheel function
        function drawColorWheel() {
          ctx.clearRect(0, 0, ${size * 2}, ${size * 2});

          for (let angle = 0; angle < 360; angle++) {
            // Use slightly larger angle coverage to prevent gaps
            const startAngle = angle * Math.PI / 180;
            const endAngle = (angle + 1.2) * Math.PI / 180;

            // Create a radial gradient for this sector
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);

            // White at center (0% saturation)
            gradient.addColorStop(0, '#FFFFFF');
            // Fully saturated color at the edge
            gradient.addColorStop(1, hsvToHexForRendering(angle/360, 1, 1));

            // Draw the sector with gradient fill
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.lineTo(centerX, centerY);
            ctx.fillStyle = gradient;
            ctx.fill();
          }

          // Notify parent the wheel is ready
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'init',
            success: true
          }));
        }

        // Handle touch events
        canvas.addEventListener('touchstart', handleTouch);
        canvas.addEventListener('touchmove', handleTouch);
        canvas.addEventListener('mousedown', handleMouse);
        canvas.addEventListener('mousemove', handleMouse);

        function handleTouch(event) {
          event.preventDefault();
          const touch = event.touches[0];
          processPosition(touch.clientX, touch.clientY);
        }

        function handleMouse(event) {
          if (event.type === 'mousemove' && event.buttons !== 1) return;
          processPosition(event.clientX, event.clientY);
        }

        function processPosition(clientX, clientY) {
          const rect = canvas.getBoundingClientRect();
          let x = clientX - rect.left;
          let y = clientY - rect.top;

          // Scale coordinates if canvas is rendered at different size than its resolution
          x = x * (canvas.width / rect.width);
          y = y * (canvas.height / rect.height);

          // Calculate distance from center
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Constrain position to within the wheel
          if (distance > radius) {
            const angle = Math.atan2(dy, dx);
            x = Math.cos(angle) * radius + centerX;
            y = Math.sin(angle) * radius + centerY;
          }

          // Calculate color
          const saturation = Math.min(distance / radius, 1);
          const angle = Math.atan2(dy, dx);
          const hue = ((angle / Math.PI) * 180 + 360) % 360;

          // Send HSV values to React Native instead of hex
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'colorChange',
            hsv: {
              h: hue,
              s: saturation,
              v: 1
            },
            position: { x, y }
          }));
        }

        // Only used for rendering the wheel
        function hsvToHexForRendering(h, s, v) {
          let r, g, b;
          const i = Math.floor(h * 6);
          const f = h * 6 - i;
          const p = v * (1 - s);
          const q = v * (1 - f * s);
          const t = v * (1 - (1 - f) * s);

          switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
          }

          return '#' + ((1 << 24) + (Math.round(r * 255) << 16) + (Math.round(g * 255) << 8) + Math.round(b * 255)).toString(16).slice(1);
        }

        // Draw the wheel when page loads
        drawColorWheel();
      </script>
    </body>
    </html>
  `;

  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'colorChange') {
        // Convert HSV to hex using chroma-js
        if (data.hsv) {
          const { h, s, v } = data.hsv;
          const color = chroma.hsv(h, s, v).hex();
          onColorChange(color);
        }
      } else if (data.type === 'init' && data.success && onInit) {
        onInit();
      }
    } catch (error) {
      console.error('Error parsing message from WebView:', error);
    }
  }, [onColorChange, onInit]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webView}
        onMessage={handleMessage}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        javaScriptEnabled={true}
        automaticallyAdjustContentInsets={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 1000, // Make it circular
  },
  webView: {
    backgroundColor: 'transparent',
  }
});
