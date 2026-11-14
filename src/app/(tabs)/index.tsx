import { useWindowDimensions } from 'react-native';

import { ColorScreen } from '@/src/screens/ColorScreen';
import { DesktopWorkspace } from '@/src/screens/DesktopWorkspace';
import { WIDE_BREAKPOINT } from '@/src/theme/tokens';

export default function ColorTab() {
  const { width } = useWindowDimensions();
  return width >= WIDE_BREAKPOINT ? <DesktopWorkspace /> : <ColorScreen />;
}
