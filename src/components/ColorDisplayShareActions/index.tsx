import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { exportAdobeAse } from '@/src/utils/exportAdobeAse';
import { exportProcreateSwatch } from '@/src/utils/exportProcreateSwatch';

export interface ColorDisplayShareActionsProps {
  colors: string[];
  isVisible: boolean;
  onClose: () => void;
}

export const ColorDisplayShareActions: React.FC<ColorDisplayShareActionsProps> = ({
  isVisible,
  onClose,
  colors,
}) => {
  const handleExportAs = async (format: 'procreate' | 'adobe_ase') => {
    if (format === 'procreate') {
      await exportProcreateSwatch(colors);
    } else if (format === 'adobe_ase') {
      await exportAdobeAse(colors);
    }

    onClose();
  };

  return (
    <Modal transparent visible={isVisible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalOption} onPress={() => handleExportAs('procreate')}>
            <Text style={styles.modalOptionText}>Procreate Swatches</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalOption} onPress={() => handleExportAs('adobe_ase')}>
            <Text style={styles.modalOptionText}>Adobe Swatches (Photoshop)</Text>
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
