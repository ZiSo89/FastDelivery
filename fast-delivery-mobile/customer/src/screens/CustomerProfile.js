import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { customerService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../components/CustomAlert';

const CustomerProfile = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });
  
  // Alert states
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: []
  });

  const showAlert = (title, message, type = 'info', buttons = []) => {
    setAlertConfig({ visible: true, title, message, type, buttons });
  };

  const hideAlert = () => {
    setAlertConfig({ ...alertConfig, visible: false });
  };

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const handleUpdate = async () => {
    if (user?.isGuest) {
      showAlert('Ειδοποίηση', 'Παρακαλώ συνδεθείτε για να επεξεργαστείτε το προφίλ σας', 'warning');
      return;
    }
    setLoading(true);
    try {
      await customerService.updateProfile(formData);
      showAlert('Επιτυχία', 'Το προφίλ ενημερώθηκε', 'success');
    } catch (error) {
      showAlert('Σφάλμα', 'Η ενημέρωση απέτυχε', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (user?.isGuest) {
      logout();
      return;
    }
    showAlert(
      'Αποσύνδεση',
      'Είστε σίγουροι ότι θέλετε να αποσυνδεθείτε;',
      'warning',
      [
        { text: 'Ακύρωση', style: 'cancel' },
        { text: 'Αποσύνδεση', style: 'destructive', onPress: logout }
      ]
    );
  };

  if (user?.isGuest) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Ionicons name="person-circle-outline" size={100} color="#ccc" />
        <Text style={{ fontSize: 18, color: '#666', marginTop: 20, textAlign: 'center' }}>
          Είστε συνδεδεμένος ως επισκέπτης
        </Text>
        <TouchableOpacity 
          style={[styles.updateButton, { marginTop: 30, width: '100%' }]} 
          onPress={logout}
        >
          <Text style={styles.updateButtonText}>Σύνδεση / Εγγραφή</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Ονοματεπώνυμο</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData({...formData, name: text})}
          placeholder="Το όνομά σας"
        />

        <Text style={styles.label}>Τηλέφωνο</Text>
        <TextInput
          style={styles.input}
          value={formData.phone}
          onChangeText={(text) => setFormData({...formData, phone: text})}
          placeholder="Το τηλέφωνό σας"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Διεύθυνση</Text>
        <TextInput
          style={styles.input}
          value={formData.address}
          onChangeText={(text) => setFormData({...formData, address: text})}
          placeholder="Η διεύθυνσή σας"
        />

        <TouchableOpacity 
          style={styles.updateButton} 
          onPress={handleUpdate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.updateButtonText}>Ενημέρωση Προφίλ</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#e74c3c" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Αποσύνδεση</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00c2e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    marginLeft: 2,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  updateButton: {
    backgroundColor: '#00c2e8',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e74c3c',
    borderRadius: 8,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomerProfile;
