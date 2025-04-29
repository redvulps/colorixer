import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';

import { ColorDisplayCopyActions } from '../ColorDisplayCopyActions';
import { ColorDisplayShareActions } from '../ColorDisplayShareActions';
import { ColorSwatch } from '../ColorSwatch';

interface ColorDisplayProps {
  colors: string[];
}

export const ColorDisplay: React.FC<ColorDisplayProps> = ({ colors }) => {
  const [isCopyActionsVisible, setCopyActionsVisible] = React.useState(false);
  const [isShareActionsVisible, setShareActionsVisible] = React.useState(false);
  const [selectedColor, setSelectedColor] = React.useState<string | null>(null);

  const copyToClipboard = async (color: string) => {
    await Clipboard.setStringAsync(color);

    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleLongPress = useCallback((color: string) => {
    setSelectedColor(color);
    setCopyActionsVisible(true);
  }, []);

  const handleCopyActionsClose = useCallback(() => {
    setCopyActionsVisible(false);
    setSelectedColor(null);
  }, []);

  const handleShowShareActions = useCallback(() => {
    setShareActionsVisible(true);
  }, []);

  const handleShareActionsClose = useCallback(() => {
    setShareActionsVisible(false);
  }, []);

  return (
    <View className="my-5 w-full">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-lg font-bold">Generated Colors</Text>
        <TouchableOpacity onPress={handleShowShareActions} className="p-2">
          <Text className="text-blue-500">Share</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="p-1"
        contentContainerClassName="flex-row gap-2 min-w-full"
      >
        {colors.map((color, index) => (
          <ColorSwatch
            key={index}
            color={color}
            onPress={copyToClipboard}
            onLongPress={handleLongPress}
          />
        ))}
      </ScrollView>
      {isCopyActionsVisible && selectedColor && (
        <ColorDisplayCopyActions
          isVisible={isCopyActionsVisible}
          selectedColor={selectedColor}
          onClose={handleCopyActionsClose}
        />
      )}
      {isShareActionsVisible && (
        <ColorDisplayShareActions
          isVisible={isShareActionsVisible}
          colors={colors}
          onClose={handleShareActionsClose}
        />
      )}
    </View>
  );
};
