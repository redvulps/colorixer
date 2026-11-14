import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, type } from '@/src/theme/tokens';

const WHEEL_IMAGE = require('@/assets/images/color-wheel.png');

/** The color wheel as a small round brand mark */
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <Image source={WHEEL_IMAGE} style={{ width: size, height: size, borderRadius: size / 2 }} />
  );
}

interface AppBarProps {
  /** Screen title; without it the bar shows the logo and "Colorixer" */
  title?: string;
  /** Muted text on the right, e.g. "5 saved" */
  meta?: string;
  /** Actions on the right */
  right?: React.ReactNode;
}

export function AppBar({ title, meta, right }: AppBarProps) {
  return (
    <View style={[styles.bar, !right && styles.barNoAction]}>
      {!title && <LogoMark />}
      <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
        {title ?? 'Colorixer'}
      </Text>
      {meta && <Text style={styles.meta}>{meta}</Text>}
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 20,
    paddingRight: 8,
  },
  barNoAction: {
    paddingRight: 20,
  },
  title: {
    ...type.titleApp,
    color: colors.textStrong,
    flex: 1,
  },
  meta: {
    ...type.monoSmall,
    color: colors.textMuted,
  },
});
