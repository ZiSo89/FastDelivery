import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import { customerService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../components/CustomAlert';
import { GOOGLE_MAPS_API_KEY } from '../config';

const { width } = Dimensions.get('window');

// Alexandroupoli default center
const DEFAULT_REGION = {
  latitude: 40.8457,
  longitude: 25.8733,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const CustomerProfile = () => {
  const { user, logout, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });
  
  // Delete account state
  const [deleting, setDeleting] = useState(false);
  
  // Location state
  const [markerPosition, setMarkerPosition] = useState(null);
  
  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  
  // Refs
  const mapRef = useRef(null);
  const scrollViewRef = useRef(null);
  const addressInputRef = useRef(null);
  const debounceTimer = useRef(null);
  const mapContainerRef = useRef(null);
  
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
      
      // Set marker from user's location if available
      if (user.location?.coordinates && 
          user.location.coordinates[0] !== 0 && 
          user.location.coordinates[1] !== 0) {
        const lng = user.location.coordinates[0];
        const lat = user.location.coordinates[1];
        setMarkerPosition({ latitude: lat, longitude: lng });
        
        // Animate to user's saved location after map loads
        setTimeout(() => {
          mapRef.current?.animateToRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.002,
            longitudeDelta: 0.002,
          }, 500);
        }, 500);
      }
    }
  }, [user]);

  // Debounced address search for autocomplete
  const searchAddresses = async (text) => {
    if (!text || text.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchingAddress(true);
    try {
      // Append city for better results
      const searchQuery = `${text}, Αλεξανδρούπολη, Ελλάδα`;
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(searchQuery)}&language=el&components=country:gr&location=40.8457,25.8733&radius=10000&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.predictions) {
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
      setSuggestions([]);
    } finally {
      setSearchingAddress(false);
    }
  };

  const handleAddressChange = (text) => {
    setFormData({ ...formData, address: text });
    
    // Debounce the search
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      searchAddresses(text);
    }, 500);
  };

  const selectSuggestion = async (suggestion) => {
    setShowSuggestions(false);
    Keyboard.dismiss();
    
    // Get place details for coordinates
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.place_id}&fields=geometry,formatted_address&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        const formattedAddress = data.result.formatted_address || suggestion.description;
        
        setFormData({ ...formData, address: formattedAddress });
        setMarkerPosition({ latitude: lat, longitude: lng });
        
        // First scroll to show the map
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: 420, animated: true });
        }, 100);
        
        // Then animate map to new location
        setTimeout(() => {
          mapRef.current?.animateToRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.002,
            longitudeDelta: 0.002,
          }, 500);
        }, 400);
      }
    } catch (error) {
      console.error('Place details error:', error);
      // Fallback: just set the address text
      setFormData({ ...formData, address: suggestion.description });
    }
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Άδεια Τοποθεσίας', 'Παρακαλώ επιτρέψτε την πρόσβαση στην τοποθεσία σας', 'warning');
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      
      // Update marker
      setMarkerPosition({ latitude, longitude });
      
      // Animate map to location
      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      }, 500);

      // Reverse geocode to get address
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=el&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK' && data.results?.[0]) {
          setFormData({ ...formData, address: data.results[0].formatted_address });
        }
      } catch (geoError) {
        console.error('Reverse geocode error:', geoError);
      }
    } catch (error) {
      console.error('Location error:', error);
      showAlert('Σφάλμα', 'Αδυναμία λήψης τοποθεσίας', 'error');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });

    // Reverse geocode
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=el&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results?.[0]) {
        setFormData({ ...formData, address: data.results[0].formatted_address });
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }
  };

  const handleMarkerDrag = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });

    // Reverse geocode after drag ends
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=el&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results?.[0]) {
        setFormData({ ...formData, address: data.results[0].formatted_address });
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }
  };

  const geocodeAddress = async (address) => {
    try {
      const searchAddress = address.includes('Αλεξανδρούπολη') 
        ? address 
        : `${address}, Αλεξανδρούπολη, Ελλάδα`;
        
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchAddress)}&language=el&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
        return data.results[0].geometry.location;
      }
      return null;
    } catch (error) {
      console.error('Geocode error:', error);
      return null;
    }
  };

  const handleUpdate = async () => {
    if (user?.isGuest) {
      showAlert('Ειδοποίηση', 'Παρακαλώ συνδεθείτε για να επεξεργαστείτε το προφίλ σας', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      // Try to geocode the address if we don't have coordinates
      let finalLocation = null;
      
      if (markerPosition) {
        // Use marker position
        finalLocation = {
          type: 'Point',
          coordinates: [markerPosition.longitude, markerPosition.latitude] // GeoJSON format [lng, lat]
        };
      } else if (formData.address) {
        // Try to geocode the address
        const coords = await geocodeAddress(formData.address);
        if (coords) {
          finalLocation = {
            type: 'Point',
            coordinates: [coords.lng, coords.lat]
          };
          setMarkerPosition({ latitude: coords.lat, longitude: coords.lng });
        }
      }

      // Prepare update data
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
      };
      
      if (finalLocation) {
        updateData.location = finalLocation;
      }

      await customerService.updateProfile(updateData);
      
      // Refresh user data in context
      if (refreshUser) {
        await refreshUser();
      }
      
      showAlert('Επιτυχία', 'Το προφίλ ενημερώθηκε', 'success');
    } catch (error) {
      console.error('Update error:', error);
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

  const handleDeleteAccount = () => {
    showAlert(
      'Διαγραφή Λογαριασμού',
      'ΠΡΟΣΟΧΗ: Αυτή η ενέργεια είναι μη αναστρέψιμη! Ο λογαριασμός σας θα διαγραφεί οριστικά.\n\nΘέλετε να συνεχίσετε;',
      'error',
      [
        { text: 'Ακύρωση', style: 'cancel' },
        { text: 'Διαγραφή', style: 'destructive', onPress: confirmDeleteAccount }
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    setDeleting(true);
    try {
      await customerService.deleteAccount();
      showAlert(
        'Επιτυχία',
        'Ο λογαριασμός σας διαγράφηκε επιτυχώς.',
        'success',
        [{ text: 'OK', onPress: logout }]
      );
    } catch (error) {
      console.error('Delete account error:', error);
      const message = error.response?.data?.message || 'Σφάλμα διαγραφής λογαριασμού';
      showAlert('Σφάλμα', message, 'error');
    } finally {
      setDeleting(false);
    }
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
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
    >
      <ScrollView 
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
          <View style={styles.addressWrapper}>
            {/* Suggestions Dropdown - Above input */}
            {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <ScrollView 
                  style={{ maxHeight: 150 }} 
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled={true}
                >
                  {suggestions.slice(0, 5).map((item) => (
                    <TouchableOpacity
                      key={item.place_id}
                      style={styles.suggestionItem}
                      onPress={() => selectSuggestion(item)}
                    >
                      <Ionicons name="location-outline" size={16} color="#666" style={{ marginRight: 8 }} />
                      <Text style={styles.suggestionText} numberOfLines={2}>
                        {item.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            <View style={styles.addressContainer}>
              <View style={styles.addressInputWrapper}>
                <TextInput
                  ref={addressInputRef}
                  style={styles.addressInput}
                  value={formData.address}
                  onChangeText={handleAddressChange}
                  placeholder="Διεύθυνση (Οδός, Αριθμός)"
                  onFocus={() => {
                    // Scroll more to give space above keyboard
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: 280, animated: true });
                    }, 300);
                  }}
                />
                {searchingAddress && (
                  <ActivityIndicator style={styles.searchIndicator} size="small" color="#00c2e8" />
                )}
              </View>
              <TouchableOpacity 
                style={styles.locationButton}
                onPress={getCurrentLocation}
                disabled={gettingLocation}
              >
                {gettingLocation ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="locate" size={22} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Map */}
          <Text style={[styles.label, { marginTop: 10 }]}>Τοποθεσία στο Χάρτη</Text>
          <View style={styles.mapContainer} ref={mapContainerRef}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={DEFAULT_REGION}
              onPress={handleMapPress}
            >
              {markerPosition && (
                <Marker
                  coordinate={markerPosition}
                  draggable
                  onDragEnd={handleMarkerDrag}
                  anchor={{ x: 0.5, y: 1 }}
                  centerOffset={{ x: 0, y: 0 }}
                >
                  <View style={styles.markerContainer}>
                    <Ionicons name="home" size={16} color="#fff" />
                  </View>
                </Marker>
              )}
            </MapView>
          </View>
          <Text style={styles.mapHint}>
            Κάντε κλικ στο χάρτη ή σύρετε το pin για να ορίσετε την ακριβή τοποθεσία σας
          </Text>

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

          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color="#dc3545" size="small" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color="#dc3545" style={styles.logoutIcon} />
                <Text style={styles.deleteButtonText}>Διαγραφή Λογαριασμού</Text>
              </>
            )}
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
    </KeyboardAvoidingView>
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
  addressWrapper: {
    position: 'relative',
    zIndex: 1000,
    marginBottom: 5,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressInputWrapper: {
    flex: 1,
    position: 'relative',
  },
  addressInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    paddingRight: 40,
  },
  searchIndicator: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  locationButton: {
    backgroundColor: '#00c2e8',
    width: 46,
    height: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
    maxHeight: 180,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    zIndex: 1001,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: '#00c2e8',
    padding: 8,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  mapHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    marginBottom: 15,
    textAlign: 'center',
    fontStyle: 'italic',
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dc3545',
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomerProfile;
