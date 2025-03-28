import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';

import { ColorDisplayCopyActions } from '../ColorDisplayCopyActions';
import { ColorDisplayShareActions } from '../ColorDisplayShareActions';

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
    <View style={styles.container}>
      <Text style={styles.title}>Generated Colors</Text>
      <View style={styles.colorsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.colorsContainer}
        >
          {colors.map((color, index) => (
            <TouchableOpacity
              key={index}
              style={styles.colorItem}
              onPress={() => copyToClipboard(color)}
              onLongPress={() => handleLongPress(color)}
            >
              <View
                style={[
                  styles.colorPreview,
                  { backgroundColor: color },
                  color === '#FFFFFF' && styles.whiteBorder
                ]}
              />
              <Text style={styles.colorText}>{color}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity onPress={handleShowShareActions}>
          <Text>Share</Text>
        </TouchableOpacity>
      </View>

      <ColorDisplayCopyActions isVisible={isCopyActionsVisible} onClose={handleCopyActionsClose} selectedColor={selectedColor} />
      <ColorDisplayShareActions
        isVisible={isShareActionsVisible}
        onClose={handleShareActionsClose}
        colors={colors}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  colorsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  colorsContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  colorItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  colorPreview: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  whiteBorder: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  colorText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
