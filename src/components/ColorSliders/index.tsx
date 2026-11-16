import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { ChannelSlider } from '@/src/components/ChannelSlider';
import { Overline } from '@/src/components/ui/Desktop';
import { t } from '@/src/i18n';
import { type SliderMode, usePalette } from '@/src/state/palettes';
import { colors, radius, type } from '@/src/theme/tokens';
import { hslToHex, hslToHsv, hsvToHex, hsvToHsl } from '@/src/utils/color';

const RAINBOW = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ff0000'];
const HEADER = 32;
const BUTTON = 26;

const MODES: { mode: SliderMode; label: string; readonly title: string }[] = [
  {
    mode: 'hsv',
    label: 'HSV',
    get title() {
      return t('sliders.hsv');
    },
  },
  {
    mode: 'hsl',
    label: 'HSL',
    get title() {
      return t('sliders.hsl');
    },
  },
];

/** Height of the header above the sliders, for layouts that budget their height */
export const SLIDERS_HEADER = HEADER;

/**
 * The base color's sliders, in HSV or HSL, with the switch between them. The color stays in HSV
 * either way, because the wheel is HSV; in HSL the sliders convert by formula, so the hue holds.
 */
export function ColorSliders({ style }: { style?: ViewStyle }) {
  const { hsv, setHsv, sliderMode, setSliderMode } = usePalette();
  const [h, sv, v] = hsv;
  const [, derivedSl, l] = hsvToHsl(hsv);
  // White has no HSL saturation, and HSV can't hold one: keep the last one shown
  const [heldSl, setHeldSl] = useState(derivedSl);
  const sl = l === 1 ? heldSl : derivedSl;
  const title = MODES.find((m) => m.mode === sliderMode)!.title;

  const setHsl = (s: number, light: number) => setHsv(hslToHsv([h, s, light]));

  return (
    <View style={[styles.root, style]}>
      <View style={styles.header}>
        <Overline style={styles.title}>{title}</Overline>
        <View style={styles.switch} accessibilityRole="tablist">
          {MODES.map(({ mode, label, title: name }) => {
            const selected = mode === sliderMode;
            return (
              <Pressable
                key={mode}
                testID={`slider-mode-${mode}`}
                accessibilityRole="tab"
                accessibilityLabel={name}
                accessibilityState={{ selected }}
                hitSlop={{ top: 9, bottom: 9 }}
                onPress={() => {
                  setHeldSl(sl);
                  setSliderMode(mode);
                }}
                style={({ pressed }) => [
                  styles.button,
                  selected && styles.buttonOn,
                  pressed && !selected && styles.buttonPressed,
                ]}
              >
                <Text style={[styles.label, selected && styles.labelOn]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ChannelSlider
        channel="h"
        value={h}
        stops={RAINBOW}
        onChange={(hue) => setHsv([hue, sv, v])}
      />
      {sliderMode === 'hsv' ? (
        <>
          <ChannelSlider
            channel="s"
            value={sv}
            stops={[hsvToHex([h, 0, v]), hsvToHex([h, 1, v])]}
            onChange={(s) => setHsv([h, s, v])}
          />
          <ChannelSlider
            channel="v"
            value={v}
            stops={['#000000', hsvToHex([h, sv, 1])]}
            onChange={(value) => setHsv([h, sv, value])}
          />
        </>
      ) : (
        <>
          <ChannelSlider
            channel="s"
            value={sl}
            stops={[hslToHex([h, 0, l]), hslToHex([h, 1, l])]}
            onChange={(s) => {
              setHeldSl(s);
              setHsl(s, l);
            }}
          />
          <ChannelSlider
            channel="l"
            value={l}
            stops={['#000000', hslToHex([h, sl, 0.5]), '#ffffff']}
            onChange={(light) => {
              setHeldSl(sl);
              setHsl(sl, light);
            }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
  },
  header: {
    height: HEADER,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    flex: 1,
  },
  switch: {
    flexDirection: 'row',
    gap: 2,
    padding: (HEADER - BUTTON) / 2,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
  },
  button: {
    height: BUTTON,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: radius.xs,
  },
  buttonOn: {
    backgroundColor: colors.surfaceSegmentOn,
  },
  buttonPressed: {
    backgroundColor: colors.surfaceHover,
  },
  label: {
    ...type.labelTab,
    color: colors.textMuted,
  },
  labelOn: {
    color: colors.textOnPrimary,
  },
});
