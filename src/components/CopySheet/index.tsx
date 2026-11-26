import React from 'react';

import { BottomSheet, SheetAction } from '@/src/components/ui';
import { useCopy } from '@/src/hooks/usePaletteActions';
import { t } from '@/src/i18n';
import { hslString, hsvString, rgbString } from '@/src/utils/color';

const FORMATS: { format: string; text: (hex: string) => string }[] = [
  { format: 'HEX', text: (hex) => hex },
  { format: 'RGB', text: rgbString },
  { format: 'HSL', text: hslString },
  { format: 'HSV', text: hsvString },
];

type CopyActionsProps = {
  color: string;
  compact?: boolean;
  onCopy: (text: string) => void;
};

/** One action per format to copy a color as text: HEX, RGB, HSL and HSV */
export function CopyActions({ color, compact, onCopy }: CopyActionsProps) {
  return (
    <>
      {FORMATS.map(({ format, text }) => (
        <SheetAction
          key={format}
          compact={compact}
          label={t('copy.as', { format })}
          ext={text(color)}
          onPress={() => onCopy(text(color))}
        />
      ))}
    </>
  );
}

type CopySheetProps = {
  /** The color to copy; null keeps the sheet closed */
  color: string | null;
  onClose: () => void;
};

/** Sheet that copies a color in the format the person picks */
export function CopySheet({ color, onClose }: CopySheetProps) {
  const copy = useCopy();
  const onCopy = (text: string) => {
    onClose();
    copy(text);
  };

  return (
    <BottomSheet
      testID="copy-sheet"
      visible={color !== null}
      onClose={onClose}
      title={color ?? undefined}
      subtitle={t('copy.title')}
    >
      {color && <CopyActions color={color} onCopy={onCopy} />}
      <SheetAction label={t('common.cancel')} tone="cancel" onPress={onClose} />
    </BottomSheet>
  );
}
