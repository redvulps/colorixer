import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  type LayoutChangeEvent,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IconComponent } from './Button';
import { PaletteStrip } from './PaletteStrip';

import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import { colors, control, iconTone, radius, type } from '@/src/theme/tokens';

const OPEN_MS = 280;
const CLOSE_MS = 200;
/** Off-screen offset used until the sheet has been measured */
const UNMEASURED_OFFSET = 1000;

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  /** Palette shown under the title */
  palette?: string[];
  children: React.ReactNode;
  testID?: string;
}

/**
 * Modal sheet from the bottom: the scrim fades in while the sheet slides up, and both reverse
 * before the modal goes away. With reduced motion the sheet only fades. Tapping the scrim closes it.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  palette,
  children,
  testID,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  // 0 = hidden, 1 = open
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);
  const mountedRef = useRef(visible);
  mountedRef.current = mounted;
  const [height, setHeight] = useState(0);
  const measured = useRef(false);

  const animateTo = useCallback(
    (toValue: 0 | 1, onDone?: () => void) => {
      progress.stopAnimation();
      Animated.timing(progress, {
        toValue,
        duration: toValue ? OPEN_MS : CLOSE_MS,
        easing: toValue ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onDone?.();
      });
    },
    [progress],
  );

  useEffect(() => {
    if (visible) {
      // Cancels a closing animation, so its callback won't unmount the reopened sheet
      progress.stopAnimation();
      setMounted(true);
      // The first opening waits for the sheet's height (see onSheetLayout)
      if (measured.current) animateTo(1);
    } else if (mountedRef.current) {
      animateTo(0, () => setMounted(false));
    }
  }, [visible, animateTo, progress]);

  const onSheetLayout = (e: LayoutChangeEvent) => {
    setHeight(e.nativeEvent.layout.height);
    if (!measured.current) {
      measured.current = true;
      if (visible) animateTo(1);
    }
  };

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [height || UNMEASURED_OFFSET, 0],
  });

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View style={[styles.scrim, { opacity: progress }]}>
          <Pressable style={styles.fill} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View
          testID={testID}
          onLayout={onSheetLayout}
          style={[
            styles.sheet,
            { paddingBottom: 20 + insets.bottom },
            reduceMotion ? { opacity: progress } : { transform: [{ translateY }] },
          ]}
          accessibilityViewIsModal
        >
          <View style={styles.grabber} />
          {(title || subtitle) && (
            <View style={styles.header}>
              {title && <Text style={styles.title}>{title}</Text>}
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          )}
          {palette && (
            <PaletteStrip colors={palette} height={30} radius={radius.sm} style={styles.palette} />
          )}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

type SheetActionTone = 'default' | 'danger' | 'cancel';

interface SheetActionProps {
  label: string;
  onPress: () => void;
  icon?: IconComponent;
  /** File extension or hint on the right */
  ext?: string;
  tone?: SheetActionTone;
  /** 52 px in sheets, 44 px in menus */
  compact?: boolean;
  testID?: string;
}

export function SheetAction({
  label,
  onPress,
  icon: Icon,
  ext,
  tone = 'default',
  compact,
  testID,
}: SheetActionProps) {
  const color =
    tone === 'danger' ? colors.danger : tone === 'cancel' ? colors.textMuted : colors.textPrimary;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        compact && styles.actionCompact,
        tone === 'cancel' && styles.actionCancel,
        pressed && styles.actionPressed,
      ]}
    >
      {Icon && <Icon size={20} color={tone === 'danger' ? iconTone.danger : iconTone.secondary} />}
      <Text
        style={[
          compact ? styles.labelCompact : type.bodyDefault,
          { color },
          tone !== 'cancel' && styles.labelFill,
        ]}
      >
        {label}
      </Text>
      {ext && <Text style={styles.ext}>{ext}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.scrim,
  },
  fill: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.surfaceRaised,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: 10,
    paddingHorizontal: 16,
    gap: 4,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.grabber,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    paddingHorizontal: 12,
    gap: 2,
  },
  title: {
    ...type.titleSheet,
    color: colors.textStrong,
  },
  subtitle: {
    ...type.caption,
    color: colors.textMuted,
  },
  palette: {
    marginTop: 12,
    marginBottom: 10,
    marginHorizontal: 12,
  },
  action: {
    height: control.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  actionCompact: {
    height: control.touch,
  },
  actionCancel: {
    justifyContent: 'center',
  },
  actionPressed: {
    backgroundColor: colors.surfaceHover,
  },
  labelFill: {
    flex: 1,
  },
  labelCompact: {
    fontFamily: type.bodyDefault.fontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
  ext: {
    ...type.monoSmall,
    color: colors.textMuted,
  },
});
