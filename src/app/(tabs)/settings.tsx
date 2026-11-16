import { Redirect } from 'expo-router';

import { useLayout } from '@/src/hooks/useLayout';
import { SettingsScreen } from '@/src/screens/SettingsScreen';

export default function SettingsTab() {
  // The tablet layout shows Settings as a view, and the workspace in a dialog, on the Color route
  return useLayout() === 'phone' ? <SettingsScreen /> : <Redirect href="/" />;
}
