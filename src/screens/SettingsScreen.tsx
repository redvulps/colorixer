import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseIcon, ExternalIcon } from '@/src/components/icons';
import { IconButton, Overline } from '@/src/components/ui';
import { type LanguageChoice, LOCALE_NAMES, LOCALES, t } from '@/src/i18n';
import { useLanguage } from '@/src/state/language';
import { colors, control, iconTone, radius, type } from '@/src/theme/tokens';

export const PRIVACY_URL = 'https://github.com/redvulps/colorixer/blob/main/PRIVACY.md';
export const SOURCE_URL = 'https://github.com/redvulps/colorixer';

const APP_ICON = require('@/assets/images/icon.png');
const DIALOG_WIDTH = 480;

/** "1.1.0 (6)": the store version and the build; in a browser, the version alone */
export function appVersion(): string {
  const version = Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '';
  const build = Application.nativeBuildVersion;
  return build ? `${version} (${build})` : version;
}

/**
 * Settings: the app's icon, name and version, the language, and the links the store asks for.
 * The phone shows it as a tab, the upright tablet as a view, and wide windows in a dialog.
 */
export function SettingsContent() {
  const { choice, device, setChoice } = useLanguage();

  const radio = (value: LanguageChoice, title: string, hint?: string) => (
    <LanguageRow
      key={value}
      testID={`language-${value}`}
      title={title}
      hint={hint}
      divider={value !== 'auto'}
      selected={choice === value}
      onPress={() => setChoice(value)}
    />
  );

  return (
    <>
      <View style={styles.app}>
        <Image source={APP_ICON} style={styles.icon} accessibilityIgnoresInvertColors />
        <Text style={styles.name} accessibilityRole="header">
          Colorixer
        </Text>
        <Text testID="app-version" style={styles.version}>
          {t('settings.version', { version: appVersion() })}
        </Text>
      </View>

      <View style={styles.section}>
        <Overline style={styles.label}>{t('settings.language')}</Overline>
        <View style={styles.group} accessibilityRole="radiogroup">
          {radio('auto', t('settings.auto'), LOCALE_NAMES[device])}
          {LOCALES.map((locale) => radio(locale, LOCALE_NAMES[locale]))}
        </View>
      </View>

      <View style={styles.section}>
        <Overline style={styles.label}>{t('settings.about')}</Overline>
        <View style={styles.group}>
          <LinkRow testID="privacy-link" title={t('settings.privacy')} url={PRIVACY_URL} />
          <LinkRow testID="source-link" title={t('settings.source')} url={SOURCE_URL} divider />
        </View>
      </View>
    </>
  );
}

/** The Settings tab on phones */
export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  // Renders again when the language changes, as the tab bar does
  useLanguage();
  return (
    <ScrollView
      testID="settings-screen"
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        styles.phone,
        {
          paddingTop: 28 + insets.top,
          paddingLeft: 16 + insets.left,
          paddingRight: 16 + insets.right,
        },
      ]}
    >
      <SettingsContent />
    </ScrollView>
  );
}

/** The Settings view of the upright tablet: the same content in a 560 dp column */
export function SettingsView({ bottomInset }: { bottomInset: number }) {
  return (
    <ScrollView
      testID="settings-screen"
      style={styles.screen}
      contentContainerStyle={[styles.tablet, { paddingBottom: 40 + bottomInset }]}
    >
      <View style={[styles.content, styles.column]}>
        <SettingsContent />
      </View>
    </ScrollView>
  );
}

/** Settings in a 480 dp dialog, from the gear of the wide workspace */
export function SettingsDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const window = useWindowDimensions();
  if (!visible) return null;
  return (
    <Modal
      testID="settings-dialog"
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.scrim}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityLabel={t('common.close')}
          onPress={onClose}
        />
        <View
          style={[styles.dialog, { width: Math.min(DIALOG_WIDTH, window.width - 48) }]}
          accessibilityViewIsModal
        >
          <View style={styles.header}>
            <IconButton icon={CloseIcon} accessibilityLabel={t('common.close')} onPress={onClose} />
            <Text style={styles.title} accessibilityRole="header">
              {t('tab.settings')}
            </Text>
          </View>
          <ScrollView contentContainerStyle={[styles.content, styles.dialogContent]}>
            <SettingsContent />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

interface LanguageRowProps {
  title: string;
  hint?: string;
  /** A line above, between rows of a group */
  divider?: boolean;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}

function LanguageRow({ title, hint, divider, selected, onPress, testID }: LanguageRowProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.row, divider && styles.divider, pressed && styles.rowPressed]}
    >
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        {hint && <Text style={styles.rowHint}>{hint}</Text>}
      </View>
      <View style={[styles.radio, selected && styles.radioOn]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </Pressable>
  );
}

interface LinkRowProps {
  title: string;
  url: string;
  divider?: boolean;
  testID?: string;
}

function LinkRow({ title, url, divider, testID }: LinkRowProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="link"
      onPress={() => {
        WebBrowser.openBrowserAsync(url).catch((error) =>
          console.warn('Could not open the link:', error),
        );
      }}
      style={({ pressed }) => [styles.row, divider && styles.divider, pressed && styles.rowPressed]}
    >
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
      </View>
      <ExternalIcon size={18} color={iconTone.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  content: {
    gap: 24,
  },
  phone: {
    paddingBottom: 24,
  },
  tablet: {
    paddingTop: 48,
    paddingHorizontal: 24,
  },
  column: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  app: {
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    width: 64,
    height: 64,
    marginBottom: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lineDefault,
  },
  name: {
    ...type.titleApp,
    color: colors.textStrong,
  },
  version: {
    ...type.monoSmall,
    color: colors.textMuted,
  },
  section: {
    gap: 8,
  },
  label: {
    marginHorizontal: 4,
  },
  group: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  row: {
    minHeight: control.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.lineSubtle,
  },
  rowPressed: {
    backgroundColor: colors.surfaceHover,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    ...type.bodyDefault,
    color: colors.textPrimary,
  },
  rowHint: {
    ...type.caption,
    color: colors.textMuted,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.controlOff,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: colors.accentFocus,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accentFocus,
  },
  scrim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.scrim,
  },
  dialog: {
    maxHeight: '92%',
    borderRadius: radius.xl,
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.lineDefault,
    overflow: 'hidden',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  title: {
    ...type.titleSheet,
    color: colors.textStrong,
  },
  dialogContent: {
    paddingTop: 4,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});
