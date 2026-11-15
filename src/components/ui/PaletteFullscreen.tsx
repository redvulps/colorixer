import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  type LayoutChangeEvent,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import { colors, fonts, type } from '@/src/theme/tokens';
import { inkOn } from '@/src/utils/color';

const OPEN_MS = 340;
const CLOSE_MS = 240;
const HINT_MS = 1800;
/** How long to wait for the bar's position before growing from the bottom edge instead */
const ORIGIN_WAIT_MS = 150;
/** Corner radius of the palette bar the view grows out of */
const ORIGIN_RADIUS = 14;
/** Box of the vertical hex label: its line height by the width of seven mono characters */
const LABEL_THICKNESS = 28;
const LABEL_LENGTH = 112;

/** Window rectangle, as measureInWindow reports it */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PaletteFullscreenProps {
  visible: boolean;
  /** Where the palette bar is on screen; the view grows out of it and shrinks back into it */
  origin: Rect | null;
  colors: string[];
  /** Chip at the top, e.g. "Pôr do sol · Analogous · 5 colors" */
  label: string;
  onClose: () => void;
  testID?: string;
}

/**
 * The palette over the whole screen, one column per color with its hex. It grows out of the
 * palette bar, and a tap anywhere shrinks it back. With reduced motion it only fades.
 */
export function PaletteFullscreen({
  visible,
  origin,
  colors: swatches,
  label,
  onClose,
  testID,
}: PaletteFullscreenProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const win = useWindowDimensions();
  // 0 = the palette bar, 1 = full screen. Drives layout props, so it runs on the JS thread.
  const progress = useRef(new Animated.Value(0)).current;
  const hint = useRef(new Animated.Value(1)).current;
  const [mounted, setMounted] = useState(visible);
  const mountedRef = useRef(visible);
  mountedRef.current = mounted;
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const laidOut = useRef(false);
  const started = useRef(false);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  const animateTo = useCallback(
    (toValue: 0 | 1, onDone?: () => void) => {
      progress.stopAnimation();
      Animated.timing(progress, {
        toValue,
        duration: toValue ? OPEN_MS : CLOSE_MS,
        easing: toValue ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) onDone?.();
      });
    },
    [progress],
  );

  const open = useCallback(() => {
    started.current = true;
    animateTo(1);
    hint.setValue(1);
    Animated.sequence([
      Animated.delay(HINT_MS),
      Animated.timing(hint, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [animateTo, hint]);

  // Grows once the modal has its size and the bar has been measured
  const tryOpen = useCallback(() => {
    if (!started.current && laidOut.current && visibleRef.current) open();
  }, [open]);

  useEffect(() => {
    if (visible) {
      // Cancels a closing animation, so its callback won't unmount the reopened view
      progress.stopAnimation();
      setMounted(true);
      if (started.current) open();
    } else if (mountedRef.current) {
      animateTo(0, () => {
        laidOut.current = false;
        started.current = false;
        setMounted(false);
      });
    }
  }, [visible, animateTo, open, progress]);

  useEffect(() => {
    if (origin) tryOpen();
  }, [origin, tryOpen]);

  const onRootLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
    if (laidOut.current) return;
    laidOut.current = true;
    if (origin) tryOpen();
    // A bar that can't be measured shouldn't keep the palette from opening
    else setTimeout(tryOpen, ORIGIN_WAIT_MS);
  };

  const W = size?.width ?? win.width;
  const H = size?.height ?? win.height;
  // Without an origin it rises from the bottom edge
  const from = origin ?? { x: 0, y: H, width: W, height: 0 };
  const lerp = (a: number, b: number) =>
    progress.interpolate({ inputRange: [0, 1], outputRange: [a, b] });

  const frame = reduceMotion
    ? [StyleSheet.absoluteFill, { opacity: progress }]
    : {
        position: 'absolute' as const,
        left: lerp(from.x, 0),
        top: lerp(from.y, 0),
        width: lerp(from.width, W),
        height: lerp(from.height, H),
        borderRadius: lerp(ORIGIN_RADIUS, 0),
      };
  // Labels show up once the colors have nearly filled the screen
  const labelOpacity = reduceMotion
    ? 1
    : progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 0, 1] });

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <StatusBar hidden animated />
      <View style={styles.root} onLayout={onRootLayout}>
        <Animated.View style={[styles.frame, frame]}>
          <Pressable
            testID={testID}
            accessibilityRole="button"
            accessibilityLabel={`${label}. Close full screen`}
            onPress={onClose}
            style={styles.columns}
          >
            {swatches.map((color, i) => (
              <View
                key={`${color}-${i}`}
                style={[
                  styles.column,
                  { backgroundColor: color, paddingBottom: insets.bottom + 28 },
                ]}
              >
                <Animated.View style={[styles.labelBox, { opacity: labelOpacity }]}>
                  <Text style={[styles.hex, { color: inkOn(color) }]} numberOfLines={1}>
                    {color}
                  </Text>
                </Animated.View>
              </View>
            ))}
          </Pressable>
          <Animated.View
            pointerEvents="none"
            style={[styles.chip, { top: insets.top + 12, opacity: labelOpacity }]}
          >
            <Text style={styles.chipText} numberOfLines={1}>
              {label}
            </Text>
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.hintBox, { opacity: labelOpacity }]}>
            <Animated.View style={[styles.chip, styles.hint, { opacity: hint }]}>
              <Text style={styles.chipText}>Tap anywhere to close</Text>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const CHIP_BG = 'rgba(17, 19, 24, 0.62)';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  frame: {
    overflow: 'hidden',
  },
  columns: {
    flex: 1,
    flexDirection: 'row',
  },
  column: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  labelBox: {
    width: LABEL_THICKNESS,
    height: LABEL_LENGTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Reads bottom to top, like the spine of a paint chip
  hex: {
    width: LABEL_LENGTH,
    textAlign: 'center',
    fontFamily: fonts.monoSemibold,
    fontSize: 22,
    lineHeight: LABEL_THICKNESS,
    letterSpacing: 0.9,
    transform: [{ rotate: '-90deg' }],
  },
  chip: {
    position: 'absolute',
    left: 16,
    maxWidth: '80%',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: CHIP_BG,
  },
  chipText: {
    ...type.labelPill,
    color: colors.textStrong,
  },
  hintBox: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    position: 'relative',
    left: 0,
  },
});
