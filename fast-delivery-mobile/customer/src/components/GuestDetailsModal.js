import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Keyboard, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
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

const GuestDetailsModal = ({ visible, onClose, onSubmit, initialData = {} }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState({});
  const [location, setLocation] = useState(null);
  
  // Location state
  const [markerPosition, setMarkerPosition] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  
  // Refs
  const scrollViewRef = useRef(null);
  const phoneInputRef = useRef(null);
  const addressInputRef = useRef(null);
  const mapRef = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (visible) {
      setName(initialData?.name || '');
      setPhone(initialData?.phone || '');
      setAddress(initialData?.address || '');
      setErrors({});
      setMarkerPosition(null);
      setLocation(null);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [visible, initialData]);

  const handlePhoneChange = (text) => {
    // Only allow numbers
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length <= 10) {
      setPhone(cleaned);
    }
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
    setAddress(text);
    if(errors.address) setErrors({...errors, address: null});
    
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
    
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.place_id}&fields=geometry,formatted_address&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        const formattedAddress = data.result.formatted_address || suggestion.description;
        
        setAddress(formattedAddress);
        setMarkerPosition({ latitude: lat, longitude: lng });
        setLocation({
          type: 'Point',
          coordinates: [lng, lat]
        });
        
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
      setAddress(suggestion.description);
    }
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Παρακαλώ επιτρέψτε την πρόσβαση στην τοποθεσία σας');
        return;
      }

      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = locationResult.coords;
      
      setMarkerPosition({ latitude, longitude });
      setLocation({
        type: 'Point',
        coordinates: [longitude, latitude]
      });
      
      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      }, 500);

      // Reverse geocode
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=el&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK' && data.results?.[0]) {
          setAddress(data.results[0].formatted_address);
        }
      } catch (geoError) {
        console.error('Reverse geocode error:', geoError);
      }
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Location error:', error);
      alert('Αδυναμία λήψης τοποθεσίας');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });
    setLocation({
      type: 'Point',
      coordinates: [longitude, latitude]
    });

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=el&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results?.[0]) {
        setAddress(data.results[0].formatted_address);
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }
  };

  const handleMarkerDrag = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });
    setLocation({
      type: 'Point',
      coordinates: [longitude, latitude]
    });

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=el&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results?.[0]) {
        setAddress(data.results[0].formatted_address);
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Το όνομα είναι υποχρεωτικό';
    }
    
    if (!phone.trim()) {
      newErrors.phone = 'Το τηλέφωνο είναι υποχρεωτικό';
    } else if (phone.length !== 10) {
      newErrors.phone = 'Το τηλέφωνο πρέπει να έχει 10 ψηφία';
    }
    
    if (!address.trim()) {
      newErrors.address = 'Η διεύθυνση είναι υποχρεωτική';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit({ 
        name: name.trim(), 
        phone: phone.trim(), 
        address: address.trim(),
        location: location 
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableOpacity style={styles.overlayBackground} activeOpacity={1} onPress={Keyboard.dismiss} />
        <View style={styles.container}>
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Ionicons name="person-add" size={28} color="#00c1e8" />
              </View>
              <Text style={styles.title}>Στοιχεία Παράδοσης</Text>
              <Text style={styles.subtitle}>Συμπληρώστε τα στοιχεία σας για την παραγγελία</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Name Input */}
              <View style={[styles.inputContainer, errors.name && styles.inputContainerError]}>
                <View style={styles.inputIcon}>
                  <Ionicons name="person-outline" size={20} color={errors.name ? "#e74c3c" : "#666"} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Ονοματεπώνυμο"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={(text) => { setName(text); if(errors.name) setErrors({...errors, name: null}); }}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => phoneInputRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

              {/* Phone Input */}
              <View style={[styles.inputContainer, errors.phone && styles.inputContainerError]}>
                <View style={styles.inputIcon}>
                  <Ionicons name="call-outline" size={20} color={errors.phone ? "#e74c3c" : "#666"} />
                </View>
                <TextInput
                  ref={phoneInputRef}
                  style={styles.input}
                  placeholder="Τηλέφωνο (10 ψηφία)"
                  placeholderTextColor="#999"
                  value={phone}
                  onChangeText={(text) => { handlePhoneChange(text); if(errors.phone) setErrors({...errors, phone: null}); }}
                  keyboardType="phone-pad"
                  maxLength={10}
                  returnKeyType="next"
                  onSubmitEditing={() => addressInputRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

              {/* Address Input with Autocomplete */}
              <View style={styles.addressWrapper}>
                {/* Suggestions Dropdown - Above input */}
                {showSuggestions && suggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    <ScrollView 
                      style={{ maxHeight: 120 }} 
                      keyboardShouldPersistTaps="handled"
                      nestedScrollEnabled={true}
                    >
                      {suggestions.slice(0, 4).map((item) => (
                        <TouchableOpacity
                          key={item.place_id}
                          style={styles.suggestionItem}
                          onPress={() => selectSuggestion(item)}
                        >
                          <Ionicons name="location-outline" size={14} color="#666" style={{ marginRight: 6 }} />
                          <Text style={styles.suggestionText} numberOfLines={2}>
                            {item.description}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                
                <View style={styles.addressRow}>
                  <View style={[styles.inputContainer, errors.address && styles.inputContainerError, { flex: 1, marginBottom: 0 }]}>
                    <View style={styles.inputIcon}>
                      <Ionicons name="location-outline" size={20} color={errors.address ? "#e74c3c" : "#666"} />
                    </View>
                    <TextInput
                      ref={addressInputRef}
                      style={styles.input}
                      placeholder="Διεύθυνση παράδοσης"
                      placeholderTextColor="#999"
                      value={address}
                      onChangeText={handleAddressChange}
                      returnKeyType="done"
                      onFocus={() => {
                        setTimeout(() => {
                          scrollViewRef.current?.scrollTo({ y: 100, animated: true });
                        }, 300);
                      }}
                    />
                    {searchingAddress && (
                      <ActivityIndicator style={{ marginRight: 10 }} size="small" color="#00c1e8" />
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
              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}

              {/* Map */}
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
                        <Ionicons name="home" size={14} color="#fff" />
                      </View>
                    </Marker>
                  )}
                </MapView>
              </View>
              <Text style={styles.mapHint}>
                Κλικ στο χάρτη ή σύρετε το pin για ακριβή τοποθεσία
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Ακύρωση</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Συνέχεια</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayBackground: {
    flex: 1,
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e6f9fc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
  },
  inputContainerError: {
    borderColor: '#e74c3c',
    backgroundColor: '#fff5f5',
  },
  inputIcon: {
    paddingLeft: 16,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 16,
  },
  addressWrapper: {
    position: 'relative',
    zIndex: 1000,
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationButton: {
    backgroundColor: '#00c1e8',
    width: 50,
    height: 50,
    borderRadius: 12,
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
    maxHeight: 140,
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
    fontSize: 12,
    color: '#333',
  },
  mapContainer: {
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: 10,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: '#00c1e8',
    padding: 6,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  mapHint: {
    fontSize: 11,
    color: '#888',
    marginTop: 6,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f0f2f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#00c1e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default GuestDetailsModal;
