import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Linking,
  Dimensions 
} from 'react-native';

const { width } = Dimensions.get('window');

const UpdateModal = ({ visible, forceUpdate, storeUrl, onDismiss }) => {
  const handleUpdate = () => {
    if (storeUrl) {
      Linking.openURL(storeUrl).catch(err => {
        console.log('Error opening store URL:', err);
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={forceUpdate ? undefined : onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{forceUpdate ? '⚠️' : '📱'}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {forceUpdate ? 'Απαιτείται Ενημέρωση!' : 'Νέα Έκδοση Διαθέσιμη!'}
          </Text>

          {/* Message */}
          <Text style={styles.message}>
            {forceUpdate 
              ? 'Η έκδοσή σας δεν υποστηρίζεται πλέον. Παρακαλώ ενημερώστε την εφαρμογή για να συνεχίσετε.'
              : 'Υπάρχει νέα έκδοση της εφαρμογής με βελτιώσεις και νέα χαρακτηριστικά.'
            }
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {!forceUpdate && (
              <TouchableOpacity 
                style={[styles.button, styles.laterButton]} 
                onPress={onDismiss}
              >
                <Text style={styles.laterButtonText}>Αργότερα</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.button, 
                styles.updateButton,
                forceUpdate && styles.fullWidthButton
              ]} 
              onPress={handleUpdate}
            >
              <Text style={styles.updateButtonText}>Ενημέρωση</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.85,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  laterButton: {
    backgroundColor: '#f0f0f0',
  },
  laterButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  updateButton: {
    backgroundColor: '#00c2e8',
  },
  fullWidthButton: {
    flex: 1,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UpdateModal;
