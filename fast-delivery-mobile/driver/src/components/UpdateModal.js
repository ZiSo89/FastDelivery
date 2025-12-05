import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Linking,
  BackHandler
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const UpdateModal = ({ visible, forceUpdate, storeUrl, onDismiss }) => {
  // Prevent back button from closing force update modal
  React.useEffect(() => {
    if (forceUpdate && visible) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => backHandler.remove();
    }
  }, [forceUpdate, visible]);

  const handleUpdate = () => {
    if (storeUrl) {
      Linking.openURL(storeUrl);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={forceUpdate ? undefined : onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={forceUpdate ? "warning" : "cloud-download"} 
              size={50} 
              color={forceUpdate ? "#f59e0b" : "#4F46E5"} 
            />
          </View>
          
          <Text style={styles.title}>
            {forceUpdate ? 'Απαιτείται Ενημέρωση' : 'Νέα Έκδοση Διαθέσιμη'}
          </Text>
          
          <Text style={styles.message}>
            {forceUpdate 
              ? 'Η τρέχουσα έκδοση της εφαρμογής δεν υποστηρίζεται πλέον. Παρακαλώ ενημερώστε για να συνεχίσετε.'
              : 'Υπάρχει διαθέσιμη νεότερη έκδοση της εφαρμογής με βελτιώσεις και διορθώσεις.'
            }
          </Text>
          
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
            <Ionicons name="download" size={20} color="#fff" />
            <Text style={styles.updateButtonText}>Ενημέρωση Τώρα</Text>
          </TouchableOpacity>
          
          {!forceUpdate && (
            <TouchableOpacity style={styles.laterButton} onPress={onDismiss}>
              <Text style={styles.laterButtonText}>Αργότερα</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  updateButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: '100%',
    gap: 8,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  laterButton: {
    marginTop: 12,
    paddingVertical: 10,
  },
  laterButtonText: {
    color: '#6B7280',
    fontSize: 15,
  },
});

export default UpdateModal;
