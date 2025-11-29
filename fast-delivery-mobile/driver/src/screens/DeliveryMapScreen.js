import React, { useState, useEffect, useRef, memo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Linking,
  Platform
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import locationService from '../services/locationService';
import { GOOGLE_MAPS_API_KEY } from '../config';

const { width, height } = Dimensions.get('window');

// Memoized Marker Components to prevent flickering
const StoreMarkerMemo = memo(({ coordinate, title, description, styles }) => {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);
  if (!coordinate) return null;
  return (
    <Marker coordinate={coordinate} title={title} description={description} tracksViewChanges={!isReady}>
      <View style={styles.markerContainer}>
        <View style={[styles.marker, styles.storeMarker]}>
          <Ionicons name="storefront" size={20} color="#fff" />
        </View>
      </View>
    </Marker>
  );
});

const CustomerMarkerMemo = memo(({ coordinate, title, description, styles }) => {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);
  if (!coordinate) return null;
  return (
    <Marker coordinate={coordinate} title={title} description={description} tracksViewChanges={!isReady}>
      <View style={styles.markerContainer}>
        <View style={[styles.marker, styles.customerMarker]}>
          <Ionicons name="home" size={20} color="#fff" />
        </View>
      </View>
    </Marker>
  );
});

const DriverMarkerMemo = memo(({ coordinate, styles }) => {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    setIsReady(false);
    const timer = setTimeout(() => setIsReady(true), 200);
    return () => clearTimeout(timer);
  }, [coordinate?.latitude, coordinate?.longitude]);
  if (!coordinate) return null;
  return (
    <Marker coordinate={coordinate} title="Εσείς" tracksViewChanges={!isReady}>
      <View style={styles.markerContainer}>
        <View style={[styles.marker, styles.driverMarker]}>
          <Ionicons name="car-sport" size={20} color="#fff" />
        </View>
      </View>
    </Marker>
  );
});

const DeliveryMapScreen = ({ route, navigation }) => {
  const { order } = route.params;
  const mapRef = useRef(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);

  // Get store and customer locations
  const storeLocation = order?.storeId?.location?.coordinates 
    ? {
        latitude: order.storeId.location.coordinates[1],
        longitude: order.storeId.location.coordinates[0],
      }
    : null;

  const customerLocation = order?.customer?.location?.coordinates
    ? {
        latitude: order.customer.location.coordinates[1],
        longitude: order.customer.location.coordinates[0],
      }
    : null;

  useEffect(() => {
    initializeMap();
    const interval = setInterval(updateDriverLocation, 5000);
    return () => clearInterval(interval);
  }, []);

  const initializeMap = async () => {
    setLoading(true);
    
    // Get current driver location
    const currentLoc = await locationService.getCurrentLocation();
    if (currentLoc) {
      setDriverLocation({
        latitude: currentLoc.lat,
        longitude: currentLoc.lng,
      });
    }

    // Fetch route from Google Directions API
    if (storeLocation && customerLocation && GOOGLE_MAPS_API_KEY) {
      await fetchRoute();
    }
    
    setLoading(false);
    fitMapToMarkers();
  };

  const updateDriverLocation = async () => {
    const status = locationService.getStatus();
    if (status.lastLocation) {
      setDriverLocation({
        latitude: status.lastLocation.lat,
        longitude: status.lastLocation.lng,
      });
    }
  };

  const fetchRoute = async () => {
    if (!storeLocation || !customerLocation || !GOOGLE_MAPS_API_KEY) return;
    
    try {
      const origin = `${storeLocation.latitude},${storeLocation.longitude}`;
      const destination = `${customerLocation.latitude},${customerLocation.longitude}`;
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        // Set distance and duration
        setDistance(leg.distance.text);
        setDuration(leg.duration.text);
        
        // Decode polyline
        const points = decodePolyline(route.overview_polyline.points);
        setRouteCoordinates(points);
      }
    } catch (error) {
      console.log('Error fetching route:', error);
    }
  };

  // Decode Google polyline
  const decodePolyline = (encoded) => {
    const points = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  };

  const fitMapToMarkers = () => {
    if (!mapRef.current) return;
    
    const markers = [storeLocation, customerLocation, driverLocation].filter(Boolean);
    
    if (markers.length > 0) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(markers, {
          edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
          animated: true,
        });
      }, 500);
    }
  };

  const openNavigation = () => {
    // Navigate to customer address
    const address = order?.customer?.address;
    if (!address) return;
    
    const encodedAddress = encodeURIComponent(address);
    const url = Platform.select({
      ios: `maps://app?daddr=${encodedAddress}`,
      android: `google.navigation:q=${encodedAddress}`,
    });
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
      }
    });
  };

  const makeCall = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00c2e8" />
        <Text style={styles.loadingText}>Φόρτωση χάρτη...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Διαδρομή Παράδοσης</Text>
          <Text style={styles.headerSubtitle}>#{order?.orderNumber}</Text>
        </View>
        {locationService.isTracking && (
          <View style={styles.gpsBadge}>
            <Ionicons name="navigate" size={14} color="#fff" />
            <Text style={styles.gpsText}>GPS</Text>
          </View>
        )}
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: storeLocation?.latitude || 40.8477,
            longitude: storeLocation?.longitude || 25.8744,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
        >
          {/* Route Polyline */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#00c2e8"
              strokeWidth={4}
              lineDashPattern={[1]}
            />
          )}

          {/* Store Marker - Memoized */}
          <StoreMarkerMemo
            coordinate={storeLocation}
            title="Κατάστημα"
            description={order?.storeId?.businessName}
            styles={styles}
          />

          {/* Customer Marker - Memoized */}
          <CustomerMarkerMemo
            coordinate={customerLocation}
            title="Πελάτης"
            description={order?.customer?.name}
            styles={styles}
          />

          {/* Driver Location - Memoized */}
          <DriverMarkerMemo
            coordinate={driverLocation}
            styles={styles}
          />
        </MapView>

        {/* Route Info Card */}
        {(distance || duration) && (
          <View style={styles.routeInfoCard}>
            <View style={styles.routeInfoItem}>
              <Ionicons name="time-outline" size={20} color="#00c2e8" />
              <Text style={styles.routeInfoText}>{duration}</Text>
            </View>
            <View style={styles.routeInfoDivider} />
            <View style={styles.routeInfoItem}>
              <Ionicons name="navigate-outline" size={20} color="#00c2e8" />
              <Text style={styles.routeInfoText}>{distance}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomCard}>
        <View style={styles.deliveryInfo}>
          <View style={styles.addressRow}>
            <View style={styles.addressIcon}>
              <Ionicons name="location" size={20} color="#fff" />
            </View>
            <View style={styles.addressContent}>
              <Text style={styles.addressLabel}>Παράδοση στο:</Text>
              <Text style={styles.addressText}>{order?.customer?.address}</Text>
            </View>
          </View>
          
          <View style={styles.customerRow}>
            <Text style={styles.customerName}>{order?.customer?.name}</Text>
            <TouchableOpacity 
              style={styles.callButton}
              onPress={() => makeCall(order?.customer?.phone)}
            >
              <Ionicons name="call" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.navigateButton} onPress={openNavigation}>
          <Ionicons name="navigate" size={22} color="#fff" />
          <Text style={styles.navigateButtonText}>Πλοήγηση στο Google Maps</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  gpsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 4,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 3,
    borderColor: '#fff',
  },
  storeMarker: {
    backgroundColor: '#FF5722',
  },
  customerMarker: {
    backgroundColor: '#4CAF50',
  },
  driverMarker: {
    backgroundColor: '#2196F3',
  },
  routeInfoCard: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  routeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeInfoText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  routeInfoDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  bottomCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  deliveryInfo: {
    marginBottom: 16,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressContent: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingLeft: 48,
  },
  customerName: {
    fontSize: 14,
    color: '#666',
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00c2e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00c2e8',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#00c2e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  navigateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
});

export default DeliveryMapScreen;
