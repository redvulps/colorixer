import React from 'react';

import { FileIcon, TrashIcon } from '@/src/components/icons';
import { BottomSheet, SheetAction, useToast } from '@/src/components/ui';
import { EXPORT_FORMATS, exportPalette } from '@/src/hooks/usePaletteActions';
import { t } from '@/src/i18n';
import { paletteColors, paletteLabel, type SavedPalette, usePalette } from '@/src/state/palettes';

type PaletteSheetProps = {
  /** The saved palette the sheet acts on; null keeps the sheet closed */
  palette: SavedPalette | null;
  onClose: () => void;
};

/** Actions for a saved palette: export it to each app or delete it */
export function PaletteSheet({ palette, onClose }: PaletteSheetProps) {
  const { remove } = usePalette();
  const toast = useToast();
  const colors = palette ? paletteColors(palette) : [];

  return (
    <BottomSheet
      testID="palette-sheet"
      visible={palette !== null}
      onClose={onClose}
      title={palette?.name}
      subtitle={
        palette
          ? `${paletteLabel(palette)} · ${t('common.colors', { count: colors.length })}`
          : undefined
      }
      palette={colors}
    >
      {palette && (
        <>
          {EXPORT_FORMATS.map(({ format, app, ext }) => (
            <SheetAction
              key={format}
              icon={FileIcon}
              label={t('export.to', { app })}
              ext={ext}
              onPress={() => {
                onClose();
                void exportPalette(format, colors, palette.name);
              }}
            />
          ))}
          <SheetAction
            icon={TrashIcon}
            tone="danger"
            label={t('palette.delete')}
            onPress={() => {
              remove(palette.id);
              onClose();
              toast(t('toast.deleted', { name: palette.name }));
            }}
          />
        </>
      )}
      <SheetAction label={t('common.cancel')} tone="cancel" onPress={onClose} />
    </BottomSheet>
  );
}
