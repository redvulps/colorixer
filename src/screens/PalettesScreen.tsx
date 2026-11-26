import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { PaletteSheet } from '@/src/components/PaletteSheet';
import { AppBar, PaletteCard } from '@/src/components/ui';
import { useTopInset } from '@/src/hooks/useTopInset';
import { t } from '@/src/i18n';
import { type SavedPalette, usePalette } from '@/src/state/palettes';
import { colors as tokens, type } from '@/src/theme/tokens';

/** Palettes tab: the saved palettes, newest first */
export function PalettesScreen() {
  const { saved, current, load } = usePalette();
  const router = useRouter();
  const topInset = useTopInset();
  const [selected, setSelected] = useState<SavedPalette | null>(null);

  const open = (palette: SavedPalette) => {
    load(palette.id);
    router.navigate('/');
  };

  return (
    <View style={[styles.screen, { paddingTop: topInset }]}>
      <AppBar title={t('tab.palettes')} meta={t('palette.savedCount', { count: saved.length })} />
      <FlatList
        data={saved}
        keyExtractor={(p) => p.id}
        contentContainerStyle={[styles.list, saved.length === 0 && styles.listEmpty]}
        renderItem={({ item }) => (
          <PaletteCard
            palette={item}
            current={item.id === current?.id}
            onPress={() => open(item)}
            onMore={() => setSelected(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t('palette.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('palette.emptyPhone')}</Text>
          </View>
        }
      />

      <PaletteSheet palette={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.bgApp,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 14,
    gap: 10,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    ...type.bodyStrong,
    color: tokens.textPrimary,
  },
  emptyText: {
    ...type.bodyDefault,
    fontSize: 14,
    color: tokens.textMuted,
    textAlign: 'center',
  },
});
