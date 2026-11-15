import { useWindowDimensions } from 'react-native';

import { TABLET_MIN_SIDE, WIDE_BREAKPOINT } from '@/src/theme/tokens';

/** wide: three-column workspace. tablet: Color and Palettes in one screen. phone: two tabs. */
export type Layout = 'wide' | 'tablet' | 'phone';

/**
 * The layout a window gets: the workspace from 1024 dp wide (a browser or a tablet held
 * sideways), the tablet layout when the shorter side is 600 dp or more (a tablet held upright),
 * and the phone tabs otherwise.
 */
export function layoutFor(width: number, height: number): Layout {
  if (width >= WIDE_BREAKPOINT) return 'wide';
  if (Math.min(width, height) >= TABLET_MIN_SIDE) return 'tablet';
  return 'phone';
}

export function useLayout(): Layout {
  const { width, height } = useWindowDimensions();
  return layoutFor(width, height);
}
