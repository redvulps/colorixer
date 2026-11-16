import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { FileIcon, TrashIcon } from '@/src/components/icons';
import { AppBar, BottomSheet, PaletteCard, SheetAction, useToast } from '@/src/components/ui';
import { EXPORT_FORMATS, exportPalette } from '@/src/hooks/usePaletteActions';
import { useTopInset } from '@/src/hooks/useTopInset';
import { t } from '@/src/i18n';
import { paletteColors, paletteLabel, type SavedPalette, usePalette } from '@/src/state/palettes';
import { colors as tokens, type } from '@/src/theme/tokens';

/** Palettes tab: the saved palettes, newest first */
export function PalettesScreen() {
  const { saved, current, load, remove } = usePalette();
  const router = useRouter();
  const toast = useToast();
  const topInset = useTopInset();
  const [selected, setSelected] = useState<SavedPalette | null>(null);
  const selectedColors = selected ? paletteColors(selected) : [];

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

      <BottomSheet
        testID="palette-sheet"
        visible={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name}
        subtitle={
          selected
            ? `${paletteLabel(selected)} · ${t('common.colors', { count: selectedColors.length })}`
            : undefined
        }
        palette={selectedColors}
      >
        {selected && (
          <>
            {EXPORT_FORMATS.map(({ format, app, ext }) => (
              <SheetAction
                key={format}
                icon={FileIcon}
                label={t('export.to', { app })}
                ext={ext}
                onPress={() => {
                  setSelected(null);
                  exportPalette(format, selectedColors, selected.name);
                }}
              />
            ))}
            <SheetAction
              icon={TrashIcon}
              tone="danger"
              label={t('palette.delete')}
              onPress={() => {
                remove(selected.id);
                setSelected(null);
                toast(t('toast.deleted', { name: selected.name }));
              }}
            />
          </>
        )}
        <SheetAction label={t('common.cancel')} tone="cancel" onPress={() => setSelected(null)} />
      </BottomSheet>
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
