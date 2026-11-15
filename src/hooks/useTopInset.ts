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
