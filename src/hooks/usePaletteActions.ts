import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { Platform } from 'react-native';

import { useToast } from '@/src/components/ui';
import { exportAdobeAse } from '@/src/utils/exportAdobeAse';
import { exportProcreateSwatch } from '@/src/utils/exportProcreateSwatch';

export type ExportFormat = 'swatches' | 'ase';

export const EXPORT_FORMATS: { format: ExportFormat; app: string; ext: string }[] = [
  { format: 'swatches', app: 'Procreate', ext: '.swatches' },
  { format: 'ase', app: 'Adobe', ext: '.ase' },
];

/** Name used for files of a palette that was not saved */
export const UNSAVED_NAME = 'Colorixer palette';

function haptic() {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }
}

/** Copy text to the clipboard with haptic and toast feedback */
export function useCopy() {
  const toast = useToast();
  return useCallback(
    async (text: string) => {
      await Clipboard.setStringAsync(text);
      haptic();
      toast(`Copied ${text}`);
    },
    [toast],
  );
}

/** Export colors as a Procreate or Adobe swatch file named after the palette */
export async function exportPalette(format: ExportFormat, colors: string[], name: string) {
  const fileName = name.replace(/[\\/:*?"<>|]/g, '-').trim() || UNSAVED_NAME;
  if (format === 'swatches') {
    await exportProcreateSwatch(colors, fileName);
  } else {
    await exportAdobeAse(colors, fileName);
  }
}

export { haptic };
