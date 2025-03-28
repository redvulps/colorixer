import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

interface ColorDisplayProps {
  colors: string[];
}

export const ColorDisplay: React.FC<ColorDisplayProps> = ({ colors }) => {
  const copyToClipboard = async (color: string) => {
    await Clipboard.setStringAsync(color);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Generated Colors</Text>
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
