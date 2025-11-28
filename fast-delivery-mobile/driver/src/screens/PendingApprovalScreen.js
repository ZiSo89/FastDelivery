import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image,
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const PendingApprovalScreen = () => {
  const { logout, refreshUser } = useAuth();

  const handleRefresh = async () => {
    await refreshUser();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
        
        <View style={styles.iconContainer}>
          <Ionicons name="time-outline" size={80} color="#FF9800" />
        </View>
        
        <Text style={styles.title}>Αναμονή Έγκρισης</Text>
        
        <Text style={styles.message}>
          Η εγγραφή σας βρίσκεται υπό αναθεώρηση. Θα λάβετε ειδοποίηση μόλις εγκριθεί ο λογαριασμός σας από τον διαχειριστή.
        </Text>

        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <View style={[styles.stepIcon, styles.stepCompleted]}>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </View>
            <Text style={styles.stepText}>Εγγραφή</Text>
          </View>
          
          <View style={styles.stepLine} />
          
          <View style={styles.step}>
            <View style={[styles.stepIcon, styles.stepActive]}>
              <Ionicons name="hourglass-outline" size={20} color="#fff" />
            </View>
            <Text style={styles.stepText}>Έλεγχος</Text>
          </View>
          
          <View style={styles.stepLine} />
          
          <View style={styles.step}>
            <View style={[styles.stepIcon, styles.stepPending]}>
              <Ionicons name="car-outline" size={20} color="#999" />
            </View>
            <Text style={[styles.stepText, { color: '#999' }]}>Ενεργοποίηση</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={20} color="#00c2e8" />
          <Text style={styles.refreshButtonText}>Έλεγχος Κατάστασης</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#dc3545" />
          <Text style={styles.logoutButtonText}>Αποσύνδεση</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
    opacity: 0.5,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    width: '100%',
  },
  step: {
    alignItems: 'center',
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepActive: {
    backgroundColor: '#FF9800',
  },
  stepPending: {
    backgroundColor: '#e0e0e0',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 5,
    marginBottom: 30,
  },
  stepText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f7fa',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 15,
  },
  refreshButtonText: {
    color: '#00c2e8',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  logoutButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default PendingApprovalScreen;
