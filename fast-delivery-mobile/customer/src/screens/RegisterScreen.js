import React, { useState, useRef } from 'react';
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
  ScrollView,
  Keyboard,
  Dimensions
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { GOOGLE_MAPS_API_KEY } from '../config';

const { width } = Dimensions.get('window');

// Cyan for Prax - Custom Map Style
const cyanForPraxStyle = [
  { "featureType": "all", "elementType": "all", "stylers": [{ "visibility": "simplified" }] },
  { "featureType": "all", "elementType": "labels", "stylers": [{ "visibility": "simplified" }] },
  { "featureType": "administrative", "elementType": "labels", "stylers": [{ "gamma": "3.86" }, { "lightness": "100" }] },
  { "featureType": "administrative", "elementType": "labels.text.fill", "stylers": [{ "color": "#5A5A5A" }] },
  { "featureType": "landscape", "elementType": "all", "stylers": [{ "color": "#f2f2f2" }] },
  { "featureType": "poi", "elementType": "all", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "all", "stylers": [{ "saturation": -100 }, { "lightness": 45 }] },
  { "featureType": "road.highway", "elementType": "all", "stylers": [{ "visibility": "simplified" }] },
  { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#a8a8a8" }] },
  { "featureType": "road.arterial", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "featureType": "transit", "elementType": "all", "stylers": [{ "visibility": "off" }] },
  { "featureType": "water", "elementType": "all", "stylers": [{ "color": "#00c2e8" }, { "visibility": "on" }] }
];

// Alexandroupoli default center
const DEFAULT_REGION = {
  latitude: 40.8457,
  longitude: 25.8733,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

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
  
  // Location state
  const [markerPosition, setMarkerPosition] = useState(null);
  
  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  
  // Refs
  const scrollViewRef = useRef(null);
  const mapRef = useRef(null);
  const debounceTimer = useRef(null);
  
  const { register } = useAuth();
  const { showAlert } = useAlert();

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Debounced address search for autocomplete
  const searchAddresses = async (text) => {
    if (!text || text.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchingAddress(true);
    try {
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
    setFormData(prev => ({ ...prev, address: text }));
    
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
    
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.place_id}&fields=geometry,formatted_address&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        const formattedAddress = data.result.formatted_address || suggestion.description;
        
        setFormData(prev => ({ 
          ...prev, 
          address: formattedAddress,
          location: {
            type: 'Point',
            coordinates: [lng, lat]
          }
        }));
        setMarkerPosition({ latitude: lat, longitude: lng });
        
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
        
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
      setFormData(prev => ({ ...prev, address: suggestion.description }));
    }
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

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;

      setMarkerPosition({ latitude, longitude });
      setFormData(prev => ({
        ...prev,
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        }
      }));
      
      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      }, 500);

      // Reverse geocoding with Google
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=el&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK' && data.results?.[0]) {
          setFormData(prev => ({
            ...prev,
            address: data.results[0].formatted_address
          }));
        }
      } catch (geoError) {
        console.error('Reverse geocode error:', geoError);
      }
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.log('Location error:', error);
      showAlert('Σφάλμα', 'Δεν ήταν δυνατή η εύρεση της τοποθεσίας.', [], 'error');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });
    setFormData(prev => ({
      ...prev,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      }
    }));

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=el&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results?.[0]) {
        setFormData(prev => ({
          ...prev,
          address: data.results[0].formatted_address
        }));
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }
  };

  const handleMarkerDrag = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });
    setFormData(prev => ({
      ...prev,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      }
    }));

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=el&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results?.[0]) {
        setFormData(prev => ({
          ...prev,
          address: data.results[0].formatted_address
        }));
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
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

    if (!formData.location) {
      showAlert('Σφάλμα', 'Παρακαλώ επιλέξτε τοποθεσία στο χάρτη ή χρησιμοποιήστε το κουμπί εντοπισμού', [], 'error');
      return;
    }

    setLoading(true);

    const dataToSubmit = {
      ...formData,
      address: formData.address,
      location: formData.location
    };

    console.log('📤 Registering with data:', JSON.stringify(dataToSubmit, null, 2));

    const result = await register(dataToSubmit);
    setLoading(false);

    if (result.success) {
      if (result.needsVerification) {
        // Show email verification message
        showAlert(
          'Επιβεβαίωση Email', 
          'Η εγγραφή ολοκληρώθηκε! Ελέγξτε το email σας για να επιβεβαιώσετε τον λογαριασμό σας.\n\n💡 Ελέγξτε και τον φάκελο Spam!',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }],
          'success'
        );
      }
      // If no verification needed, AuthContext handles login automatically
    } else {
      showAlert('Σφάλμα', result.error, [], 'error');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView 
        ref={scrollViewRef}
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
              placeholderTextColor="#999"
              value={formData.name}
              onChangeText={(text) => handleChange('name', text)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
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
              placeholderTextColor="#999"
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
              placeholderTextColor="#999"
              value={formData.phone}
              onChangeText={(text) => handleChange('phone', text)}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          {/* Address with Autocomplete */}
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
              <View style={[styles.inputContainer, { flex: 1, marginBottom: 0 }]}>
                <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Διεύθυνση (Οδός, Αριθμός)"
                  placeholderTextColor="#999"
                  value={formData.address}
                  onChangeText={handleAddressChange}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: 200, animated: true });
                    }, 300);
                  }}
                />
                {searchingAddress && (
                  <ActivityIndicator style={{ marginRight: 10 }} size="small" color="#00c2e8" />
                )}
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
          </View>

          {/* Map */}
          <Text style={styles.mapLabel}>Τοποθεσία στο Χάρτη</Text>
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={DEFAULT_REGION}
              userInterfaceStyle="light"
              customMapStyle={cyanForPraxStyle}
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
            Κλικ στο χάρτη ή σύρετε το pin για ακριβή τοποθεσία
          </Text>

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
    paddingBottom: 40,
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
    color: '#333',
  },
  addressWrapper: {
    position: 'relative',
    zIndex: 1000,
    marginBottom: 15,
  },
  addressContainer: {
    flexDirection: 'row',
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
  mapLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginLeft: 2,
  },
  mapContainer: {
    height: 180,
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
    marginTop: 6,
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
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
