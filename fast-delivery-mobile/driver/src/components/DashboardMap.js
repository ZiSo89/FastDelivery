import React, { useState, useEffect, useRef, memo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Linking,
  Platform,
  ActivityIndicator
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { GOOGLE_MAPS_API_KEY } from '../config';

// Force light mode on Google Maps
const lightMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] },
];

// Memoized Marker Components to prevent flickering
const DriverMarkerMemo = memo(({ coordinate, styles }) => {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    setIsReady(false);
    const timer = setTimeout(() => setIsReady(true), 200);
    return () => clearTimeout(timer);
  }, [coordinate?.latitude, coordinate?.longitude]);
  if (!coordinate) return null;
  return (
    <Marker coordinate={coordinate} title="Εσύ" anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={!isReady}>
      <View style={styles.driverMarker}>
        <Ionicons name="bicycle" size={12} color="#fff" />
      </View>
    </Marker>
  );
});

const StoreMarkerMemo = memo(({ coordinate, title, description, styles }) => {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);
  if (!coordinate) return null;
  return (
    <Marker coordinate={coordinate} title={title} description={description} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={!isReady}>
      <View style={styles.storeMarker}>
        <Ionicons name="storefront" size={10} color="#fff" />
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
    <Marker coordinate={coordinate} title={title} description={description} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={!isReady}>
      <View style={styles.customerMarker}>
        <Ionicons name="home" size={10} color="#fff" />
      </View>
    </Marker>
  );
});

const DashboardMap = ({ orders, driverLocation }) => {
  const mapRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(driverLocation);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastOrderStatus, setLastOrderStatus] = useState(null);

  // Get active order (first non-completed order)
  const activeOrder = orders?.find(o => 
    ['assigned', 'accepted_driver', 'preparing', 'in_delivery'].includes(o.status)
  );

  // When status changes, clear route to force re-fetch
  useEffect(() => {
    if (activeOrder) {
      if (lastOrderStatus && lastOrderStatus !== activeOrder.status) {
        setRouteCoordinates([]);
        setRouteInfo(null);
      }
      setLastOrderStatus(activeOrder.status);
    } else {
      setLastOrderStatus(null);
    }
  }, [orders, activeOrder?.status]);

  // Default location (Alexandroupoli city center)
  const DEFAULT_LOCATION = {
    latitude: 40.8476,
    longitude: 25.8743,
  };

  // Get location on mount
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          // Use default location if permission denied
          setCurrentLocation(DEFAULT_LOCATION);
          return;
        }

        let location = await Location.getCurrentPositionAsync({ 
          accuracy: Location.Accuracy.Balanced 
        });
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.log('Error getting location, using default:', error.message);
        // Use default location on error (emulator without location set)
        setCurrentLocation(DEFAULT_LOCATION);
      }
    })();
  }, []);

  // Update location when driverLocation prop changes
  useEffect(() => {
    if (driverLocation) {
      setCurrentLocation(driverLocation);
    }
  }, [driverLocation]);

  // Get store and customer coordinates
  const getStoreCoords = () => {
    if (!activeOrder?.storeId?.location?.coordinates) {
      return null;
    }
    const [lng, lat] = activeOrder.storeId.location.coordinates;
    if (lat === 0 && lng === 0) {
      return null;
    }
    return { latitude: lat, longitude: lng };
  };

  const getCustomerCoords = () => {
    // Try customer.location first
    if (activeOrder?.customer?.location?.coordinates) {
      const [lng, lat] = activeOrder.customer.location.coordinates;
      if (lat !== 0 || lng !== 0) {
        return { latitude: lat, longitude: lng };
      }
    }
    // Try deliveryLocation
    if (activeOrder?.deliveryLocation?.coordinates) {
      const [lng, lat] = activeOrder.deliveryLocation.coordinates;
      if (lat !== 0 || lng !== 0) {
        return { latitude: lat, longitude: lng };
      }
    }
    return null;
  };

  // Fetch route from Google Directions API
  const fetchRoute = async () => {
    if (!currentLocation || !activeOrder) {
      setRouteCoordinates([]);
      setRouteInfo(null);
      return;
    }

    const storeCoords = getStoreCoords();
    const customerCoords = getCustomerCoords();

    if (!storeCoords) {
      setRouteCoordinates([]);
      setRouteInfo(null);
      return;
    }

    setLoading(true);

    try {
      let origin, destination, waypoints;

      if (activeOrder.status === 'in_delivery' && customerCoords) {
        // After pickup: driver → customer
        origin = `${currentLocation.latitude},${currentLocation.longitude}`;
        destination = `${customerCoords.latitude},${customerCoords.longitude}`;
        waypoints = null;
      } else if (customerCoords) {
        // Before pickup: driver → store → customer
        origin = `${currentLocation.latitude},${currentLocation.longitude}`;
        destination = `${customerCoords.latitude},${customerCoords.longitude}`;
        waypoints = `${storeCoords.latitude},${storeCoords.longitude}`;
      } else {
        // Only store available: driver → store
        origin = `${currentLocation.latitude},${currentLocation.longitude}`;
        destination = `${storeCoords.latitude},${storeCoords.longitude}`;
        waypoints = null;
      }

      let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
      if (waypoints) {
        url += `&waypoints=${waypoints}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const points = decodePolyline(route.overview_polyline.points);
        setRouteCoordinates(points);

        // Calculate total distance and duration
        let totalDistance = 0;
        let totalDuration = 0;
        route.legs.forEach(leg => {
          totalDistance += leg.distance.value;
          totalDuration += leg.duration.value;
        });

        setRouteInfo({
          distance: (totalDistance / 1000).toFixed(1),
          duration: Math.ceil(totalDuration / 60),
        });

        // Fit map to show route - tight zoom on pins
        if (mapRef.current && points.length > 0) {
          const allCoords = [
            currentLocation,
            storeCoords,
            customerCoords,
            ...points
          ].filter(Boolean);

          setTimeout(() => {
            mapRef.current?.fitToCoordinates(allCoords, {
              edgePadding: { top: 30, right: 20, bottom: 60, left: 20 },
              animated: true,
            });
          }, 500);
        }
      } else {
        // Still show markers even without route
        if (mapRef.current) {
          const allCoords = [currentLocation, storeCoords, customerCoords].filter(Boolean);
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(allCoords, {
              edgePadding: { top: 30, right: 20, bottom: 60, left: 20 },
              animated: true,
            });
          }, 500);
        }
      }
    } catch (error) {
      // Error fetching route - silently fail
    } finally {
      setLoading(false);
    }
  };

  // Fetch route when order status changes
  useEffect(() => {
    if (activeOrder && currentLocation) {
      // Small delay to allow state to settle
      const timer = setTimeout(() => {
        fetchRoute();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setRouteCoordinates([]);
      setRouteInfo(null);
    }
  }, [activeOrder?._id, activeOrder?.status]);

  // Re-fetch when location changes significantly
  useEffect(() => {
    if (activeOrder && currentLocation && routeCoordinates.length === 0) {
      fetchRoute();
    }
  }, [currentLocation?.latitude]);

  // Fit map when no order - just show driver location with high zoom
  useEffect(() => {
    if (!activeOrder && currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...currentLocation,
        latitudeDelta: 0.003,
        longitudeDelta: 0.003,
      }, 300);
    }
  }, [activeOrder, currentLocation]);

  // Decode Google polyline
  const decodePolyline = (encoded) => {
    const points = [];
    let index = 0, lat = 0, lng = 0;

    while (index < encoded.length) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  };

  // Open Google Maps navigation
  const openNavigation = () => {
    if (!activeOrder) return;

    let destination;
    
    if (activeOrder.status === 'in_delivery') {
      // Navigate to customer
      const customerCoords = getCustomerCoords();
      if (customerCoords) {
        destination = `${customerCoords.latitude},${customerCoords.longitude}`;
      } else {
        destination = encodeURIComponent(activeOrder.customer?.address || activeOrder.deliveryAddress);
      }
    } else {
      // Navigate to store
      const storeCoords = getStoreCoords();
      if (storeCoords) {
        destination = `${storeCoords.latitude},${storeCoords.longitude}`;
      } else {
        destination = encodeURIComponent(activeOrder.storeId?.address);
      }
    }

    if (!destination) return;

    const url = Platform.select({
      ios: `maps://app?daddr=${destination}`,
      android: `google.navigation:q=${destination}`,
    });

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}`);
      }
    });
  };

  // Get navigation button text - shorter for better fit
  const getNavButtonText = () => {
    if (!activeOrder) return null;
    
    if (activeOrder.status === 'in_delivery') {
      return 'Προς Πελάτη';
    } else if (['assigned', 'accepted_driver', 'preparing'].includes(activeOrder.status)) {
      return 'Προς Κατάστημα';
    }
    return null;
  };

  // Get navigation button icon
  const getNavButtonIcon = () => {
    if (activeOrder?.status === 'in_delivery') {
      return 'home';
    }
    return 'storefront';
  };

  const storeCoords = getStoreCoords();
  const customerCoords = getCustomerCoords();

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        userInterfaceStyle="light"
        customMapStyle={lightMapStyle}
        initialRegion={{
          latitude: currentLocation?.latitude || 40.8457,
          longitude: currentLocation?.longitude || 25.8733,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* Driver Marker (always shown) - Memoized */}
        <DriverMarkerMemo
          coordinate={currentLocation}
          styles={styles}
        />

        {/* Store Marker - Memoized */}
        {activeOrder && (
          <StoreMarkerMemo
            coordinate={storeCoords}
            title={activeOrder.storeId?.businessName || 'Κατάστημα'}
            description={activeOrder.storeId?.address}
            styles={styles}
          />
        )}

        {/* Customer Marker - Memoized */}
        {activeOrder && (
          <CustomerMarkerMemo
            coordinate={customerCoords}
            title={activeOrder.customer?.name || 'Πελάτης'}
            description={activeOrder.customer?.address || activeOrder.deliveryAddress}
            styles={styles}
          />
        )}

        {/* Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#00c2e8"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Route Info Overlay */}
      {routeInfo && activeOrder && (
        <View style={styles.routeInfoContainer}>
          <View style={styles.routeInfo}>
            <View style={styles.routeInfoItem}>
              <Ionicons name="navigate" size={16} color="#00c2e8" />
              <Text style={styles.routeInfoText}>{routeInfo.distance} km</Text>
            </View>
            <View style={styles.routeInfoDivider} />
            <View style={styles.routeInfoItem}>
              <Ionicons name="time" size={16} color="#00c2e8" />
              <Text style={styles.routeInfoText}>{routeInfo.duration} λεπτά</Text>
            </View>
          </View>
        </View>
      )}

      {/* Navigation Button */}
      {getNavButtonText() && (
        <TouchableOpacity style={styles.navButton} onPress={openNavigation}>
          <Ionicons name={getNavButtonIcon()} size={18} color="#fff" />
          <Text style={styles.navButtonText}>{getNavButtonText()}</Text>
          <Ionicons name="navigate" size={16} color="#fff" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      )}

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#00c2e8" />
        </View>
      )}

      {/* No order state */}
      {!activeOrder && (
        <View style={styles.noOrderOverlay}>
          <Text style={styles.noOrderText}>📍 Η τοποθεσία σας</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200,
    backgroundColor: '#f0f2f5',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 15,
  },
  map: {
    flex: 1,
  },
  driverMarker: {
    backgroundColor: '#00c2e8',
    padding: 5,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  storeMarker: {
    backgroundColor: '#FF9800',
    padding: 5,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  customerMarker: {
    backgroundColor: '#4CAF50',
    padding: 5,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  routeInfoContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
  },
  routeInfo: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  routeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeInfoText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  routeInfoDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#ddd',
    marginHorizontal: 12,
  },
  navButton: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: '#00c2e8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 8,
    borderRadius: 20,
  },
  noOrderOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  noOrderText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
});

export default DashboardMap;
