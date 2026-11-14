import React, { forwardRef } from 'react';
import { Pressable, type PressableProps, StyleSheet, Text } from 'react-native';

import type { IconComponent } from './Button';

import { colors, control, iconTone, radius, type } from '@/src/theme/tokens';

interface TabButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  icon: IconComponent;
  /** Set by expo-router's TabTrigger */
  isFocused?: boolean;
}

/** Bottom tab: icon over label, filled when active */
export const TabButton = forwardRef<React.ComponentRef<typeof Pressable>, TabButtonProps>(
  function TabButton({ label, icon: Icon, isFocused, ...props }, ref) {
    return (
      <Pressable
        ref={ref}
        accessibilityRole="tab"
        accessibilityState={{ selected: !!isFocused }}
        style={[styles.tab, isFocused && styles.tabActive]}
        {...props}
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
