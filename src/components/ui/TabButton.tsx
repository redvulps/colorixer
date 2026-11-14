import React, { forwardRef } from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';

import type { IconComponent } from './Button';

import { colors, control, iconTone, radius, type } from '@/src/theme/tokens';

interface TabButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  icon: IconComponent;
  /** Set by expo-router's TabTrigger */
  isFocused?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Bottom tab: icon over label, filled when active */
export const TabButton = forwardRef<React.ComponentRef<typeof Pressable>, TabButtonProps>(
  function TabButton({ label, icon: Icon, isFocused, style, ...props }, ref) {
    return (
      <Pressable
        ref={ref}
        accessibilityRole="tab"
        accessibilityState={{ selected: !!isFocused }}
        {...props}
        style={[style, styles.tab, isFocused && styles.tabActive]}
      >
        <Icon size={22} color={isFocused ? iconTone.onPrimary : iconTone.muted} />
        <Text
          style={[type.labelTab, { color: isFocused ? colors.textOnPrimary : colors.textMuted }]}
        >
          {label}
        </Text>
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    flexDirection: 'column',
    height: control.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabActive: {
    backgroundColor: colors.surfaceTabActive,
  },
});
