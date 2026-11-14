import React, { useMemo, useRef, useState } from 'react';
import {
  type AccessibilityActionEvent,
  type LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { colors, radius, shadows, type } from '@/src/theme/tokens';
import { type Hsv, hsvToHex } from '@/src/utils/color';

export type HsvChannel = 'h' | 's' | 'v';

const INDEX: Record<HsvChannel, 0 | 1 | 2> = { h: 0, s: 1, v: 2 };
const MAX: Record<HsvChannel, number> = { h: 360, s: 1, v: 1 };
const THUMB = 20;
const RAINBOW = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ff0000'];

/** Value as shown in the field: degrees for hue, percent for saturation and value */
function display(channel: HsvChannel, value: number): string {
  return channel === 'h' ? `${Math.round(value)}°` : `${Math.round(value * 100)}%`;
}

function trackStops(channel: HsvChannel, [h, s, v]: Hsv): string[] {
  if (channel === 'h') return RAINBOW;
  if (channel === 's') return [hsvToHex([h, 0, v]), hsvToHex([h, 1, v])];
  return ['#000000', hsvToHex([h, s, 1])];
}

interface HsvSliderProps {
  channel: HsvChannel;
  hsv: Hsv;
  /** New value of the channel: degrees for hue, 0-1 for saturation and value */
  onChange: (value: number) => void;
}

export function HsvSlider({ channel, hsv, onChange }: HsvSliderProps) {
  const value = hsv[INDEX[channel]];
  const max = MAX[channel];
  const [width, setWidth] = useState(0);
  const [draft, setDraft] = useState<string | null>(null);

  const latest = useRef({ width, max, onChange });
  latest.current = { width, max, onChange };
  const origin = useRef(0);

  const responder = useMemo(() => {
    const pick = (x: number) => {
      const { width: w, max: m, onChange: change } = latest.current;
      if (w <= THUMB) return;
      const fraction = Math.min(Math.max((x - THUMB / 2) / (w - THUMB), 0), 1);
      // Hue stops just short of 360 so it doesn't wrap back to 0 at the end of the track
      change(m === 360 ? Math.min(fraction * 360, 359.99) : fraction);
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        origin.current = e.nativeEvent.locationX;
        pick(origin.current);
      },
      onPanResponderMove: (_, g) => pick(origin.current + g.dx),
    });
  }, []);

  const step = channel === 'h' ? 5 : 0.05;
  const onAccessibilityAction = (e: AccessibilityActionEvent) => {
    const delta = e.nativeEvent.actionName === 'increment' ? step : -step;
    onChange(Math.min(Math.max(value + delta, 0), channel === 'h' ? 359.99 : 1));
  };

  const commitDraft = () => {
    if (draft === null) return;
    const number = parseFloat(draft.replace(',', '.'));
    if (!Number.isNaN(number)) {
      onChange(
        channel === 'h'
          ? Math.min(Math.max(number, 0), 359.99)
          : Math.min(Math.max(number / 100, 0), 1),
      );
    }
    setDraft(null);
  };

  const stops = trackStops(channel, hsv);
  const fraction = value / max;
  const label = channel.toUpperCase();

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View
        testID={`slider-${channel}`}
        style={styles.hitArea}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={{ h: 'Hue', s: 'Saturation', v: 'Value' }[channel]}
        accessibilityValue={{ text: display(channel, value) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={onAccessibilityAction}
        {...responder.panHandlers}
      >
        {width > 0 && (
          <Svg width={width} height={10} pointerEvents="none">
            <Defs>
              <LinearGradient id={`track-${channel}`} x1="0" y1="0" x2="1" y2="0">
                {stops.map((color, i) => (
                  <Stop key={i} offset={i / (stops.length - 1)} stopColor={color} />
                ))}
              </LinearGradient>
            </Defs>
            <Rect width={width} height={10} rx={5} fill={`url(#track-${channel})`} />
          </Svg>
        )}
        <View
          pointerEvents="none"
          style={[styles.thumb, { left: fraction * Math.max(width - THUMB, 0) }]}
        />
      </View>
      <TextInput
        testID={`value-${channel}`}
        style={styles.field}
        value={draft ?? display(channel, value)}
        onFocus={() => setDraft(String(Math.round(channel === 'h' ? value : value * 100)))}
        onChangeText={setDraft}
        onEndEditing={commitDraft}
        onSubmitEditing={commitDraft}
        onBlur={commitDraft}
        keyboardType="number-pad"
        returnKeyType="done"
        selectTextOnFocus
        maxLength={3}
        accessibilityLabel={`${label} value`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: 34,
  },
  label: {
    ...type.monoValue,
    color: colors.textMuted,
    width: 14,
  },
  hitArea: {
    flex: 1,
    height: 34,
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    top: (34 - THUMB) / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: '#FFFFFF',
    ...shadows.thumb,
  },
  field: {
    ...type.monoValue,
    width: 72,
    height: 34,
    paddingHorizontal: 12,
    paddingVertical: 0,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.lineDefault,
    backgroundColor: colors.surfaceField,
    color: colors.textPrimary,
    textAlign: 'right',
  },
});
