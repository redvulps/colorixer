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

/** Hue, saturation, value or lightness */
export type Channel = 'h' | 's' | 'v' | 'l';

const NAME: Record<Channel, string> = { h: 'Hue', s: 'Saturation', v: 'Value', l: 'Lightness' };
const THUMB = 20;

/** Value as shown in the field: degrees for hue, percent for the others */
function display(channel: Channel, value: number): string {
  return channel === 'h' ? `${Math.round(value)}°` : `${Math.round(value * 100)}%`;
}

interface ChannelSliderProps {
  channel: Channel;
  /** Degrees for hue, 0-1 for the others */
  value: number;
  /** Colors of the track, left to right */
  stops: string[];
  /** New value of the channel: degrees for hue, 0-1 for the others */
  onChange: (value: number) => void;
}

export function ChannelSlider({ channel, value, stops, onChange }: ChannelSliderProps) {
  const max = channel === 'h' ? 360 : 1;
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
        accessibilityLabel={NAME[channel]}
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
