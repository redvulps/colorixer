import type { TextStyle, ViewStyle } from 'react-native';

/**
 * Design tokens for Colorixer Pro (dark).
 * Mirrors the variables, text styles and effect styles of design/colorixer.figcraft.
 */
export const colors = {
  bgApp: '#111318',
  bgCanvas: '#0C0D10',
  bgBrowser: '#0F1013',
  surfacePanel: '#15171C',
  surfaceCard: '#171A20',
  surfaceRaised: '#1A1D23',
  surfaceField: '#1D2027',
  surfaceTabActive: '#1F232B',
  surfaceHover: '#232730',
  surfaceSelected: '#252A33',
  surfaceSegmentOn: '#2C313B',
  buttonSecondary: '#2A2F39',
  buttonPrimary: '#2F6FD0',
  lineSubtle: '#23262E',
  lineDefault: '#2B2F38',
  lineCurrent: '#3B6FAE',
  /** Ring of an unselected radio */
  controlOff: '#4A505C',
  textStrong: '#F1F3F7',
  textPrimary: '#E8EAF0',
  textSecondary: '#C3C8D2',
  textMuted: '#8F96A3',
  textOnPrimary: '#FFFFFF',
  accentFocus: '#5EA6F4',
  danger: '#F28B7F',
  inverseSurface: '#E8EAF0',
  inverseText: '#111318',
  grabber: '#3A3F4A',
  scrim: 'rgba(0, 0, 0, 0.55)',
} as const;

/** Icon tones: the "Icon Tone" variable modes in the design file. */
export const iconTone = {
  secondary: colors.textSecondary,
  muted: colors.textMuted,
  strong: colors.textStrong,
  onPrimary: colors.textOnPrimary,
  danger: colors.danger,
} as const;

export type IconTone = keyof typeof iconTone;

export const radius = {
  xs: 6,
  sm: 9,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
} as const;

/** Control heights */
export const control = {
  sm: 34,
  md: 40,
  lg: 52,
  touch: 44,
} as const;

export const fonts = {
  regular: 'Inter_400Regular',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  mono: 'SourceCodePro_400Regular',
  monoSemibold: 'SourceCodePro_600SemiBold',
} as const;

/** Text styles (names match the design file) */
export const type = {
  titleApp: { fontFamily: fonts.bold, fontSize: 21, lineHeight: 28, letterSpacing: -0.2 },
  titleSheet: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 20 },
  bodyDefault: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  labelButton: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
  labelPill: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18 },
  labelTab: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16 },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
  overline: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  monoValue: {
    fontFamily: fonts.mono,
    fontSize: 13,
    lineHeight: 18,
    fontVariant: ['tabular-nums'],
  },
  monoSmall: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 16 },
  monoTiny: { fontFamily: fonts.mono, fontSize: 11, lineHeight: 14 },
} as const satisfies Record<string, TextStyle>;

export const shadows = {
  toast: { boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)' },
  menu: { boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)' },
  thumb: { boxShadow: '0 1px 4px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 0, 0, 0.2)' },
} as const satisfies Record<string, ViewStyle>;

/** Window width from which the three-column workspace replaces the tabs */
export const WIDE_BREAKPOINT = 1024;

/** Shortest window side, in dp, from which a device counts as a tablet (Android's sw600dp) */
export const TABLET_MIN_SIDE = 600;
