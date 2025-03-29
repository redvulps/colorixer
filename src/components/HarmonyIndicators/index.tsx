import React from 'react';
import { View, StyleSheet } from 'react-native';

interface HarmonyIndicatorsProps {
  harmonyColors?: string[];
  selectedColor: string;
  getPositionFromColor: (color: string) => { x: number; y: number };
}

export const HarmonyIndicators: React.FC<HarmonyIndicatorsProps> = ({
  harmonyColors = [],
  selectedColor,
  getPositionFromColor,
}) => {
  return (
    <>
      {harmonyColors.map((color, index) => {
        // Skip the base color
        if (color === selectedColor) return null;

        const position = getPositionFromColor(color);

        return (
          <View
            key={`harmony-${index}`}
            style={[
              styles.harmonyIndicator,
              {
                left: position.x - 10,
                top: position.y - 10,
              },
            ]}
          />
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  harmonyIndicator: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    zIndex: 10,
    borderColor: '#FFFFFF',
  },
});
