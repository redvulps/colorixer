import { Redirect } from 'expo-router';
import { useWindowDimensions } from 'react-native';

import { PalettesScreen } from '@/src/screens/PalettesScreen';
import { WIDE_BREAKPOINT } from '@/src/theme/tokens';

export default function PalettesTab() {
  const { width } = useWindowDimensions();
  // The wide workspace lists saved palettes in its sidebar
  return width >= WIDE_BREAKPOINT ? <Redirect href="/" /> : <PalettesScreen />;
}
