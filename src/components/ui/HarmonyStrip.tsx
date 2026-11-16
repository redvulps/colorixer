import React, { useEffect, useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { HarmonyIcon } from '@/src/components/icons';
import { colors, iconTone, radius } from '@/src/theme/tokens';
import { HARMONIES } from '@/src/utils/color';
import type { ColorHarmonyType } from '@/src/utils/colorUtils';

const PADDING = 5;
const BUTTON = 56;
const FADE = 36;
/** Room kept beside the selected harmony when it is scrolled into view */
const MARGIN = 28;

interface HarmonyStripProps {
  /** Selected harmony; none when the palette came from an image */
  value: ColorHarmonyType | null;
  onChange: (harmony: ColorHarmonyType) => void;
}

/** Fades the strip's edge where more harmonies are hidden */
function Fade({ side }: { side: 'left' | 'right' }) {
  const id = `harmony-fade-${side}`;
  return (
    <Svg width={FADE} height="100%" style={[styles.fade, { [side]: 0 }]} pointerEvents="none">
      <Defs>
        <LinearGradient
          id={id}
          x1={side === 'left' ? 1 : 0}
          y1="0"
          x2={side === 'left' ? 0 : 1}
          y2="0"
        >
          <Stop offset="0" stopColor={colors.surfaceRaised} stopOpacity={0} />
          <Stop offset="1" stopColor={colors.surfaceRaised} stopOpacity={1} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

/** Scrolling row with a diagram per harmony type; the selected one stays in view */
export function HarmonyStrip({ value, onChange }: HarmonyStripProps) {
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const frames = useRef<Partial<Record<ColorHarmonyType, { x: number; width: number }>>>({});
  const [view, setView] = useState({ width: 0, content: 0, offset: 0 });

  // Keep the selected harmony in view, with some of its neighbors
  useEffect(() => {
    const frame = value ? frames.current[value] : undefined;
    if (!frame || !view.width) return;
    const left = frame.x - MARGIN;
    const right = frame.x + frame.width + MARGIN - view.width;
    if (left < view.offset) scroll.current?.scrollTo({ x: Math.max(left, 0), animated: true });
    else if (right > view.offset) scroll.current?.scrollTo({ x: right, animated: true });
    // Only when the selection or the size changes, not on every scroll
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, view.width, view.content]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset.x;
    setView((v) => (v.offset === offset ? v : { ...v, offset }));
  };

  return (
    <View
      testID="harmony-selector"
      style={styles.strip}
      onLayout={(e: LayoutChangeEvent) => {
        const width = e.nativeEvent.layout.width;
        setView((v) => ({ ...v, width }));
      }}
    >
      <ScrollView
        ref={scroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        onScroll={onScroll}
        scrollEventThrottle={32}
        onContentSizeChange={(content) => setView((v) => ({ ...v, content }))}
        accessibilityRole="tablist"
      >
        {HARMONIES.map(({ key, label }) => {
          const selected = key === value;
          return (
            <Pressable
              key={key}
              testID={`harmony-${key}`}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
              onPress={() => onChange(key)}
              onLayout={(e: LayoutChangeEvent) => {
                const { x, width } = e.nativeEvent.layout;
                frames.current[key] = { x, width };
              }}
              style={[styles.segment, selected && styles.segmentOn]}
            >
              <HarmonyIcon
                harmony={key}
                size={26}
                color={selected ? iconTone.onPrimary : iconTone.muted}
              />
            </Pressable>
          );
        })}
      </ScrollView>
      {view.offset > 1 && <Fade side="left" />}
      {view.offset + view.width < view.content - 1 && <Fade side="right" />}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  content: {
    flexGrow: 1,
    gap: 4,
    padding: PADDING,
  },
  segment: {
    flexGrow: 1,
    minWidth: BUTTON,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentOn: {
    backgroundColor: colors.surfaceSegmentOn,
  },
  fade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
});
