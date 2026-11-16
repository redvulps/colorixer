import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';
import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorIcon, PalettesIcon } from '@/src/components/icons';
import { TabButton, ToastProvider } from '@/src/components/ui';
import { layoutFor } from '@/src/hooks/useLayout';
import { t } from '@/src/i18n';
import { tabletToastBottom } from '@/src/screens/TabletWorkspace';
import { colors, control } from '@/src/theme/tokens';

/**
 * Color and Palettes tabs. On wide windows the index route shows the three-column workspace,
 * and on an upright tablet the tablet layout, which switches Color and Palettes itself; both
 * hide the tab bar.
 */
export default function TabsLayout() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const layout = layoutFor(width, height);
  const barBottom = Math.max(insets.bottom, 8) + 10;
  const toastBottom =
    layout === 'wide'
      ? 24
      : layout === 'tablet'
        ? tabletToastBottom(insets.bottom)
        : 8 + control.lg + barBottom + 16;

  return (
    <ToastProvider bottom={toastBottom}>
      <Tabs style={styles.tabs}>
        <TabSlot />
        <TabList
          style={[styles.bar, { paddingBottom: barBottom }, layout !== 'phone' && styles.hidden]}
        >
          <TabTrigger name="index" href="/" asChild>
            <TabButton testID="tab-color" label={t('tab.color')} icon={ColorIcon} />
          </TabTrigger>
          <TabTrigger name="palettes" href="/palettes" asChild>
            <TabButton testID="tab-palettes" label={t('tab.palettes')} icon={PalettesIcon} />
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
