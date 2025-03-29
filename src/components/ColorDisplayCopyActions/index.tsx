import chroma from 'chroma-js';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface ColorDisplayActionsProps {
  selectedColor?: string | null;
  isVisible: boolean;
  onClose: () => void;
}

export const ColorDisplayCopyActions: React.FC<ColorDisplayActionsProps> = ({
  isVisible,
  onClose,
  selectedColor,
}) => {
  const handleCopyAs = async (format: 'HEX' | 'HSL' | 'HSV') => {
    if (!selectedColor) {
      return;
    }

    let converted = selectedColor;
    if (format === 'HSL') {
      converted = chroma(selectedColor).css('hsl');
    } else if (format === 'HSV') {
      const hsv = chroma(selectedColor).hsv();
      converted = `hsv(${Math.round(hsv[0])}, ${Math.round(hsv[1] * 100)}%, ${Math.round(hsv[2] * 100)}%)`;
    } else {
      converted = chroma(selectedColor).hex();
    }

    await Clipboard.setStringAsync(converted);

    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    onClose();
  };

  return (
    <Modal transparent visible={isVisible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalOption} onPress={() => handleCopyAs('HEX')}>
            <Text style={styles.modalOptionText}>Copy as HEX</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalOption} onPress={() => handleCopyAs('HSL')}>
            <Text style={styles.modalOptionText}>Copy as HSL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalOption} onPress={() => handleCopyAs('HSV')}>
            <Text style={styles.modalOptionText}>Copy as HSV</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalOption} onPress={onClose}>
            <Text style={styles.modalOptionText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalOption: {
    paddingVertical: 12,
  },
  modalOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
