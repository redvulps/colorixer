import { useEffect, useState } from 'react';
import { Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Space to leave at the top of a screen. On Android tablets the safe area also counts the caption
 * bar that holds the window handle, which is taller than the status bar and left a gap under it.
 * The handle fits inside the status bar, so its height is enough there. It still drops to 0 while
 * the status bar is hidden.
 */
export function useTopInset(): number {
  const { top } = useSafeAreaInsets();
  if (Platform.OS !== 'android' || StatusBar.currentHeight == null) return top;
  return Math.min(top, StatusBar.currentHeight);
}

/**
 * The top inset, held while the full-screen palette is open. That view hides the status bar,
 * which shrinks the inset; holding it keeps the screen behind from jumping up and back down.
 * Call `hold` right before opening; the inset is released once the status bar is back.
 */
export function useHeldTopInset(open: boolean): { top: number; hold: () => void } {
  const top = useTopInset();
  const [held, setHeld] = useState<number | null>(null);
  useEffect(() => {
    if (!open && held !== null && top >= held) setHeld(null);
  }, [open, held, top]);
  return { top: held ?? top, hold: () => setHeld(top) };
}
