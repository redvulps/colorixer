import { Redirect } from 'expo-router';

import { useLayout } from '@/src/hooks/useLayout';
import { PalettesScreen } from '@/src/screens/PalettesScreen';

export default function PalettesTab() {
  // The workspace and the tablet layout show saved palettes on the Color route
  return useLayout() === 'phone' ? <PalettesScreen /> : <Redirect href="/" />;
}
