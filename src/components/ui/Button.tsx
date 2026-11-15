import React from 'react';
import { Pressable, type PressableProps, StyleSheet, Text, type ViewStyle } from 'react-native';

import { CheckIcon, ChevronDownIcon, type IconProps, SaveIcon } from '@/src/components/icons';
import { colors, control, iconTone, type IconTone, type } from '@/src/theme/tokens';

export type IconComponent = React.ComponentType<IconProps>;

const pressedStyle = { opacity: 0.8 };

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'saved';

const VARIANTS: Record<ButtonVariant, { box: ViewStyle; text: string; tone: IconTone }> = {
  primary: {
    box: { backgroundColor: colors.buttonPrimary },
    text: colors.textOnPrimary,
    tone: 'onPrimary',
  },
  secondary: {
    box: { backgroundColor: colors.buttonSecondary },
    text: colors.textStrong,
    tone: 'strong',
  },
  ghost: {
    box: { borderWidth: 1, borderColor: colors.lineDefault },
    text: colors.textStrong,
    tone: 'strong',
  },
  saved: {
    box: { borderWidth: 1, borderColor: colors.lineDefault },
    text: colors.textMuted,
    tone: 'muted',
  },
};

interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  icon?: IconComponent;
  variant?: ButtonVariant;
  chevron?: boolean;
  style?: ViewStyle;
}

/** Web button: 40 px high */
export function Button({
  label,
  icon: Icon,
  variant = 'secondary',
  chevron,
  style,
  ...props
}: ButtonProps) {
  const v = VARIANTS[variant];
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        chevron && styles.withChevron,
        v.box,
        pressed && pressedStyle,
        style,
      ]}
      {...props}
    >
      {Icon && <Icon size={18} color={iconTone[v.tone]} />}
      <Text style={[type.labelButton, { color: v.text }]}>{label}</Text>
      {chevron && <ChevronDownIcon size={16} color={iconTone[v.tone]} />}
    </Pressable>
  );
}

interface PillButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  saved: boolean;
}

/** Save / Saved toggle of the Color tab: 34 px pill */
export function PillButton({ saved, ...props }: PillButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: saved }}
      disabled={saved}
      style={({ pressed }) => [
        styles.pill,
        saved ? styles.pillSaved : styles.pillSave,
        pressed && pressedStyle,
      ]}
      {...props}
    >
      {saved ? (
        <CheckIcon size={17} color={iconTone.muted} />
      ) : (
        <SaveIcon size={17} color={iconTone.strong} />
      )}
      <Text style={[type.labelPill, { color: saved ? colors.textMuted : colors.textStrong }]}>
        {saved ? 'Saved' : 'Save'}
      </Text>
    </Pressable>
  );
}

interface PillIconButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  icon: IconComponent;
  accessibilityLabel: string;
}

/** Icon-only companion of the Save pill: 34 px round, with a hit area of 44 px */
export function PillIconButton({ icon: Icon, ...props }: PillIconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={(control.touch - control.sm) / 2}
      style={({ pressed }) => [styles.pillIcon, pressed && pressedStyle]}
      {...props}
    >
      <Icon size={17} color={iconTone.strong} />
    </Pressable>
  );
}

interface IconButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  icon: IconComponent;
  accessibilityLabel: string;
  tone?: IconTone;
  iconSize?: number;
  style?: ViewStyle;
}

/** 44 px round touch target with a 22 px icon */
export function IconButton({
  icon: Icon,
  tone = 'secondary',
  iconSize = 22,
  style,
  ...props
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={4}
      style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed, style]}
      {...props}
    >
      <Icon size={iconSize} color={iconTone[tone]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: control.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 18,
    borderRadius: 10,
  },
  withChevron: {
    paddingRight: 14,
  },
  pill: {
    height: control.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 11,
    paddingRight: 14,
    borderRadius: control.sm / 2,
  },
  pillSave: {
    backgroundColor: colors.buttonSecondary,
  },
  pillSaved: {
    borderWidth: 1,
    borderColor: colors.lineDefault,
  },
  pillIcon: {
    width: control.sm,
    height: control.sm,
    borderRadius: control.sm / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.buttonSecondary,
  },
  iconButton: {
    width: control.touch,
    height: control.touch,
    borderRadius: control.touch / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    backgroundColor: colors.surfaceField,
  },
});
