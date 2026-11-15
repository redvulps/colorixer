import chroma from 'chroma-js';
import React, { useMemo, useRef } from 'react';
import { Image, PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import type { Hsv } from '@/src/utils/color';

// Must match INSET in scripts/generate-color-wheel.js
const INSET = 0.035;
// Room around the wheel so markers on the edge are not clipped. The frame includes it, because
// some Android versions clip a view's children to its bounds whatever its overflow says.
const PAD = 24;
const WHEEL_IMAGE = require('@/assets/images/color-wheel.png');

interface ColorWheelProps {
  size: number;
  /** Base color; its value (V) darkens the wheel */
  hsv: Hsv;
  /** Harmony colors, base first: drawn as markers joined to the center */
  colors: string[];
  onChange: (hue: number, saturation: number) => void;
  testID?: string;
}

/**
 * Hue/saturation wheel: hue is the angle (red to the right, clockwise),
 * saturation the distance from the center. Drag anywhere on it to pick.
 */
export function ColorWheel({
  size,
  hsv,
  colors,
  onChange,
  testID = 'color-wheel',
}: ColorWheelProps) {
  const radius = size / 2;
  const saturationRadius = radius * (1 - INSET);

  // Keep the responder stable while the latest props stay reachable
  const latest = useRef({ onChange, radius, saturationRadius });
  latest.current = { onChange, radius, saturationRadius };
  const origin = useRef({ x: 0, y: 0 });

  const responder = useMemo(() => {
    const pick = (x: number, y: number) => {
      const { radius: r, saturationRadius: sr, onChange: change } = latest.current;
      const dx = x - r;
      const dy = y - r;
      const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
      change(hue, Math.min(Math.hypot(dx, dy) / sr, 1));
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        origin.current = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };
        pick(origin.current.x, origin.current.y);
      },
      // Moves are measured from the touch-down point, so they stay right over child views
      onPanResponderMove: (_, g) => pick(origin.current.x + g.dx, origin.current.y + g.dy),
    });
  }, []);

  const position = (hue: number, saturation: number) => {
    const a = (hue * Math.PI) / 180;
    return {
      x: radius + Math.cos(a) * saturation * saturationRadius,
      y: radius + Math.sin(a) * saturation * saturationRadius,
    };
  };

  const base = position(hsv[0], hsv[1]);
  const others = colors.slice(1).map((color) => {
    const [h, s] = chroma(color).hsv();
    return { color, ...position(Number.isNaN(h) ? 0 : h, s) };
  });
  const baseRadius = Math.max(11, size * 0.045);
  const markerRadius = Math.max(7, size * 0.0275);

  return (
    // The negative margin keeps the wheel's footprint at `size` in the parent's layout
    <View
      pointerEvents="box-none"
      style={{ width: size + 2 * PAD, height: size + 2 * PAD, margin: -PAD }}
    >
      <View
        testID={testID}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Color wheel"
        accessibilityValue={{ text: colors[0] }}
        style={{ width: size, height: size, borderRadius: radius, margin: PAD }}
        {...responder.panHandlers}
      >
        <Image source={WHEEL_IMAGE} style={{ width: size, height: size }} pointerEvents="none" />
        <View
          pointerEvents="none"
          style={[styles.dim, { borderRadius: radius, opacity: 1 - hsv[2] }]}
        />
      </View>
      <Svg
        width={size + 2 * PAD}
        height={size + 2 * PAD}
        viewBox={`${-PAD} ${-PAD} ${size + 2 * PAD} ${size + 2 * PAD}`}
        style={styles.overlay}
        pointerEvents="none"
      >
        {[base, ...others].map((p, i) => (
          <Line
            key={`line-${i}`}
            x1={radius}
            y1={radius}
            x2={p.x}
            y2={p.y}
            stroke="#FFFFFF"
            strokeOpacity={0.9}
            strokeWidth={2}
          />
        ))}
        {others.map((p, i) => (
          <React.Fragment key={`marker-${i}`}>
            <Circle cx={p.x} cy={p.y} r={markerRadius + 1} fill="rgba(0,0,0,0.35)" />
            <Circle
              cx={p.x}
              cy={p.y}
              r={markerRadius}
              fill={p.color}
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          </React.Fragment>
        ))}
        <Circle
          cx={base.x}
          cy={base.y}
          r={baseRadius + 1.5}
          fill="none"
          stroke="rgba(0,0,0,0.35)"
          strokeWidth={1}
        />
        <Circle
          cx={base.x}
          cy={base.y}
          r={baseRadius - 1.5}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={3}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  dim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
});
