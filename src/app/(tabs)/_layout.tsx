import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';
import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorIcon, PalettesIcon } from '@/src/components/icons';
import { TabButton, ToastProvider } from '@/src/components/ui';
import { colors, control, WIDE_BREAKPOINT } from '@/src/theme/tokens';

/**
 * Color and Palettes tabs. On wide windows the index route shows the three-column
 * workspace instead, so the tab bar is hidden.
 */
export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width >= WIDE_BREAKPOINT;
  const barBottom = Math.max(insets.bottom, 8) + 10;

  return (
    <ToastProvider bottom={wide ? 24 : 8 + control.lg + barBottom + 16}>
      <Tabs style={styles.tabs}>
        <TabSlot />
        <TabList style={[styles.bar, { paddingBottom: barBottom }, wide && styles.hidden]}>
          <TabTrigger name="index" href="/" asChild>
            <TabButton testID="tab-color" label="Color" icon={ColorIcon} />
          </TabTrigger>
          <TabTrigger name="palettes" href="/palettes" asChild>
            <TabButton testID="tab-palettes" label="Palettes" icon={PalettesIcon} />
          </TabTrigger>
        </TabList>
      </Tabs>
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  bar: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: colors.lineSubtle,
    backgroundColor: colors.bgApp,
  },
  hidden: {
    display: 'none',
  },
});
