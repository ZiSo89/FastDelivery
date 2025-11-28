import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    location: null
  });
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const { register } = useAuth();
  const { showAlert } = useAlert();

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGetLocation = async () => {
    setGettingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Άρνηση πρόσβασης', 'Χρειαζόμαστε πρόσβαση στην τοποθεσία για να βρούμε τη διεύθυνσή σας.', [], 'warning');
        setGettingLocation(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Reverse geocoding to get address
      let addressResponse = await Location.reverseGeocodeAsync({ latitude, longitude });
      
      if (addressResponse.length > 0) {
        const addr = addressResponse[0];
        // Keep only street and number as requested
        const formattedAddress = `${addr.street || ''} ${addr.streetNumber || ''}`;
        const finalAddress = formattedAddress.trim() || 'Άγνωστη διεύθυνση';
        
        setFormData(prev => ({
          ...prev,
          address: finalAddress,
          location: {
            type: 'Point',
            coordinates: [longitude, latitude]
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          location: {
            type: 'Point',
            coordinates: [longitude, latitude]
          }
        }));
      }
    } catch (error) {
      console.log('Location error:', error);
      showAlert('Σφάλμα', 'Δεν ήταν δυνατή η εύρεση της τοποθεσίας.', [], 'error');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.phone || !formData.address) {
      showAlert('Σφάλμα', 'Παρακαλώ συμπληρώστε όλα τα πεδία', [], 'error');
      return;
    }

    if (formData.phone.length !== 10) {
      showAlert('Σφάλμα', 'Το τηλέφωνο πρέπει να είναι 10ψήφιο', [], 'error');
      return;
    }

    if (formData.password.length < 6) {
      showAlert('Σφάλμα', 'Ο κωδικός πρέπει να είναι τουλάχιστον 6 χαρακτήρες', [], 'error');
      return;
    }

    setLoading(true);

    // Append city and country for accurate geocoding and saving
    const fullAddress = `${formData.address.trim()}, Αλεξανδρούπολη, Ελλάδα`;

    // Geocode address if location is missing or to ensure accuracy
    let finalLocation = formData.location;
    
    try {
      // Always try to geocode the address text to ensure it matches what the user typed
      const geocodedLocation = await Location.geocodeAsync(fullAddress);
      
      if (geocodedLocation.length > 0) {
        const { latitude, longitude } = geocodedLocation[0];
        finalLocation = {
          type: 'Point',
          coordinates: [longitude, latitude]
        };
      }
    } catch (error) {
      console.log('Geocoding error:', error);
      // If geocoding fails, we'll fall back to the existing location (from GPS) if available
    }

    if (!finalLocation) {
      setLoading(false);
      showAlert('Σφάλμα', 'Δεν βρέθηκε η τοποθεσία της διεύθυνσης. Παρακαλώ ελέγξτε τη διεύθυνση ή χρησιμοποιήστε το κουμπί εντοπισμού.', [], 'error');
      return;
    }

    const dataToSubmit = {
      ...formData,
      address: fullAddress, // Send the full address to backend
      location: finalLocation
    };

    console.log('📤 Registering with data:', JSON.stringify(dataToSubmit, null, 2));

    const result = await register(dataToSubmit);
    setLoading(false);

    if (!result.success) {
      showAlert('Σφάλμα', result.error, [], 'error');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Δημιουργία λογαριασμού</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Ονοματεπώνυμο"
              value={formData.name}
              onChangeText={(text) => handleChange('name', text)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Κωδικός (min. 6 chars)"
              value={formData.password}
              onChangeText={(text) => handleChange('password', text)}
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Κινητό τηλέφωνο"
              value={formData.phone}
              onChangeText={(text) => handleChange('phone', text)}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          <View style={styles.addressContainer}>
            <View style={[styles.inputContainer, { flex: 1, marginBottom: 0 }]}>
              <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Διεύθυνση (Οδός, Αριθμός)"
                value={formData.address}
                onChangeText={(text) => handleChange('address', text)}
              />
            </View>
            <TouchableOpacity 
              style={styles.locationButton} 
              onPress={handleGetLocation}
              disabled={gettingLocation}
            >
              {gettingLocation ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="locate" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.registerButton} 
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Εγγραφή</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Έχεις ήδη λογαριασμό; </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Σύνδεση</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: '#eee',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  addressContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  locationButton: {
    width: 50,
    height: 50,
    backgroundColor: '#00c2e8',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  registerButton: {
    backgroundColor: '#00c2e8',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 15,
  },
  linkText: {
    color: '#00c2e8',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
