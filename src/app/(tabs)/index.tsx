import { useLayout } from '@/src/hooks/useLayout';
import { ColorScreen } from '@/src/screens/ColorScreen';
import { DesktopWorkspace } from '@/src/screens/DesktopWorkspace';
import { TabletWorkspace } from '@/src/screens/TabletWorkspace';

export default function ColorTab() {
  const layout = useLayout();
  if (layout === 'wide') return <DesktopWorkspace />;
  if (layout === 'tablet') return <TabletWorkspace />;
  return <ColorScreen />;
}
