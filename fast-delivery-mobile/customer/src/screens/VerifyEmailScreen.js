import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAlert } from '../context/AlertContext';
import api from '../services/api';

const VerifyEmailScreen = ({ route, navigation }) => {
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const { showAlert } = useAlert();

  // Get token and type from deep link or navigation params
  const token = route.params?.token;
  const type = route.params?.type || 'customer';

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('Μη έγκυρο link επιβεβαίωσης.');
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await api.get(`/auth/verify-email?token=${token}&type=${type}`);
      
      setStatus('success');
      setMessage(response.data.message || 'Το email επιβεβαιώθηκε επιτυχώς!');
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Το link επιβεβαίωσης είναι άκυρο ή έχει λήξει.');
    }
  };

  const handleResend = async () => {
    showAlert(
      'Αποστολή ξανά',
      'Για να λάβετε νέο email επιβεβαίωσης, παρακαλώ συνδεθείτε και θα σας δοθεί η επιλογή.',
      [{ text: 'OK', onPress: () => navigation.navigate('Login') }],
      'info'
    );
  };

  if (status === 'verifying') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00c2e8" />
        <Text style={styles.loadingText}>Επιβεβαίωση email...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, status === 'success' ? styles.successIcon : styles.errorIcon]}>
        <Ionicons 
          name={status === 'success' ? 'checkmark-circle' : 'close-circle'} 
          size={80} 
          color={status === 'success' ? '#28a745' : '#dc3545'} 
        />
      </View>

      <Text style={styles.title}>
        {status === 'success' ? 'Επιτυχία!' : 'Αποτυχία'}
      </Text>

      <Text style={styles.message}>{message}</Text>

      {status === 'success' ? (
        <>
          <Text style={styles.nextSteps}>
            {type === 'customer' 
              ? 'Μπορείτε τώρα να συνδεθείτε στο λογαριασμό σας.'
              : 'Ο λογαριασμός σας αναμένει έγκριση από τον διαχειριστή.'}
          </Text>
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Σύνδεση</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={handleResend}
          >
            <Ionicons name="refresh" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.retryButtonText}>Αποστολή νέου email</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.backLink} 
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.backLinkText}>Πίσω στη Σύνδεση</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  successIcon: {
    backgroundColor: '#d4edda',
  },
  errorIcon: {
    backgroundColor: '#f8d7da',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  nextSteps: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic',
  },
  loginButton: {
    backgroundColor: '#00c2e8',
    borderRadius: 12,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#00c2e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: '#00c2e8',
    borderRadius: 12,
    height: 55,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backLink: {
    padding: 10,
  },
  backLinkText: {
    color: '#666',
    fontSize: 14,
  },
});

export default VerifyEmailScreen;
