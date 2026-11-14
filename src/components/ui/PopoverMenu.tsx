import React from 'react';
import {
  type GestureResponderEvent,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { colors, control, radius, shadows } from '@/src/theme/tokens';

export interface MenuPoint {
  x: number;
  y: number;
}

/** Where a press happened, to open a menu next to it */
export function pointFromEvent(e: GestureResponderEvent): MenuPoint {
  return { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
}

const PADDING = 6;
const GAP = 2;

interface PopoverMenuProps {
  /** Open next to this point (closed when null) */
  at: MenuPoint | null;
  onClose: () => void;
  /** Number of compact actions, to keep the menu inside the window */
  items: number;
  width?: number;
  children: React.ReactNode;
  testID?: string;
}

/**
 * Small menu that opens below and to the left of a point (above it near the bottom edge).
 * Clicking outside closes it. Holds compact SheetActions.
 */
export function PopoverMenu({
  at,
  onClose,
  items,
  width = 260,
  children,
  testID,
}: PopoverMenuProps) {
  const window = useWindowDimensions();
  if (!at) return null;

  const height = 2 * PADDING + items * control.touch + (items - 1) * GAP;
  const left = Math.min(Math.max(at.x - width + 12, 8), window.width - width - 8);
  const fitsBelow = at.y + 12 + height <= window.height - 8;
  const top = fitsBelow ? at.y + 12 : Math.max(at.y - 12 - height, 8);

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityLabel="Close menu"
      />
      <View testID={testID} accessibilityRole="menu" style={[styles.menu, { top, left, width }]}>
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    padding: PADDING,
    gap: GAP,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineDefault,
    backgroundColor: colors.surfaceField,
    ...shadows.menu,
  },
});
