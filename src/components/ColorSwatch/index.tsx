import chroma from 'chroma-js';
import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';

import { useBreakpoint } from '@/src/hooks/useBreakpoint';

interface ColorSwatchProps {
  color: string;
  onPress: (color: string) => void;
  onLongPress: (color: string) => void;
}

const defaultTextClasses = 'text-xs font-semibold text-shadow-lg tracking-wide';
const defaultClasses =
  'rounded-xl w-16 h-16 lg:w-auto border border-transparent justify-center items-center transition-transform duration-200 hover:scale-105 hover:drop-shadow-lg';

export const ColorSwatch: React.FC<ColorSwatchProps> = React.memo(
  ({ color, onPress, onLongPress }) => {
    const breakpoint = useBreakpoint();
    const colorBrightness = chroma(color).get('luminance');
    const textColor = colorBrightness > 0.5 ? 'text-black' : 'text-white';
    const textClasses = `${defaultTextClasses} ${textColor}`;

    if (['lg', 'xl', '2xl'].includes(breakpoint)) {
      const colorHSL = chroma(color).hsl().map(Math.round);
      const colorHSV = chroma(color).hsv().map(Math.round);

      return (
        <View className="flex-col gap-2 flex-1">
          <TouchableOpacity className={defaultClasses} style={{ backgroundColor: color }}>
            <Text className={textClasses}>{color.toLocaleUpperCase()}</Text>
          </TouchableOpacity>
          <TouchableOpacity className={defaultClasses} style={{ backgroundColor: color }}>
            <Text
              className={textClasses}
            >{`HSL: (${colorHSL[0]}, ${colorHSL[1]}, ${colorHSL[2]})`}</Text>
          </TouchableOpacity>
          <TouchableOpacity className={defaultClasses} style={{ backgroundColor: color }}>
            <Text
              className={textClasses}
            >{`HSV: (${colorHSV[0]}, ${colorHSV[1]}, ${colorHSV[2]})`}</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <TouchableOpacity
          className={defaultClasses}
          style={{ backgroundColor: color }}
          onPress={() => onPress(color)}
          onLongPress={() => onLongPress(color)}
          activeOpacity={0.8}
        >
          <Text className={textClasses}>{color.toLocaleUpperCase()}</Text>
        </TouchableOpacity>
      );
    }
  },
  (prevProps, nextProps) => prevProps.color === nextProps.color,
);
