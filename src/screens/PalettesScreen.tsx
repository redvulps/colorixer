import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FileIcon, TrashIcon } from '@/src/components/icons';
import { AppBar, BottomSheet, PaletteCard, SheetAction, useToast } from '@/src/components/ui';
import { EXPORT_FORMATS, exportPalette } from '@/src/hooks/usePaletteActions';
import { paletteColors, type SavedPalette, usePalette } from '@/src/state/palettes';
import { colors as tokens, type } from '@/src/theme/tokens';
import { harmonyLabel } from '@/src/utils/color';

/** Palettes tab: the saved palettes, newest first */
export function PalettesScreen() {
  const { saved, current, load, remove } = usePalette();
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState<SavedPalette | null>(null);
  const selectedColors = selected ? paletteColors(selected) : [];

  const open = (palette: SavedPalette) => {
    load(palette.id);
    router.navigate('/');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <AppBar title="Palettes" meta={`${saved.length} saved`} />
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
            <Text style={styles.emptyTitle}>No saved palettes</Text>
            <Text style={styles.emptyText}>
              Save a palette on the Color tab and it shows up here.
            </Text>
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
            ? `${harmonyLabel(selected.harmony)} · ${selectedColors.length} colors`
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
                label={`Export to ${app}`}
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
              label="Delete palette"
              onPress={() => {
                remove(selected.id);
                setSelected(null);
                toast(`Deleted “${selected.name}”`);
              }}
            />
          </>
        )}
        <SheetAction label="Cancel" tone="cancel" onPress={() => setSelected(null)} />
      </BottomSheet>
    </SafeAreaView>
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
