import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Linking, Dimensions, BackHandler } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
import { customerService } from '../services/api';
import socketService from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

// NOTE: Local notifications have been REMOVED from TrackOrderScreen
// All notifications are now handled by push notifications from the server
// This prevents duplicate notifications when the app is in foreground
// Push notifications are filtered in App.js by ALLOWED_NOTIFICATION_STATUSES

const { width, height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.35; // 35% of screen height for map

// Memoized Store Marker - prevents flickering
const StoreMarkerMemo = memo(({ coordinate, title, styles }) => {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  if (!coordinate) return null;
  
  return (
    <Marker
      identifier="store-marker"
      coordinate={coordinate}
      title={title}
      tracksViewChanges={!isReady}
    >
      <View style={styles.markerContainer}>
        <View style={[styles.marker, styles.storeMarker]}>
          <Ionicons name="storefront" size={16} color="#fff" />
        </View>
      </View>
    </Marker>
  );
});

// Memoized Customer Marker - prevents flickering
const CustomerMarkerMemo = memo(({ coordinate, styles }) => {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  if (!coordinate) return null;
  
  return (
    <Marker
      identifier="customer-marker"
      coordinate={coordinate}
      title="Διεύθυνση Παράδοσης"
      tracksViewChanges={!isReady}
    >
      <View style={styles.markerContainer}>
        <View style={[styles.marker, styles.customerMarker]}>
          <Ionicons name="home" size={16} color="#fff" />
        </View>
      </View>
    </Marker>
  );
});

// Memoized Driver Marker - this one needs to update when driver moves
const DriverMarkerMemo = memo(({ coordinate, title, styles }) => {
  // Driver marker needs tracksViewChanges=true initially but can be false after stable
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Longer delay for driver since position updates
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);
  
  // Reset isReady when coordinate changes significantly
  useEffect(() => {
    setIsReady(false);
    const timer = setTimeout(() => setIsReady(true), 200);
    return () => clearTimeout(timer);
  }, [coordinate?.latitude, coordinate?.longitude]);
  
  if (!coordinate) return null;
  
  return (
    <Marker
      identifier="driver-marker"
      coordinate={coordinate}
      title={title}
      tracksViewChanges={!isReady}
    >
      <View style={styles.markerContainer}>
        <View style={[styles.marker, styles.driverMarker]}>
          <Ionicons name="bicycle" size={16} color="#fff" />
        </View>
      </View>
    </Marker>
  );
});

const TrackOrderScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [order, setOrder] = useState(null);
  const orderRef = useRef(null); // Keep track of latest order for socket handlers
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // Driver location - with throttling to prevent crashes
  const [driverLocation, setDriverLocation] = useState(null);
  const lastDriverUpdateRef = useRef(0);
  const DRIVER_UPDATE_THROTTLE = 3000; // Update every 3 seconds max
  const mapRef = useRef(null);
  
  // Safely get orderNumber if passed
  const paramOrderNumber = route.params?.orderNumber;
  
  // Update orderRef whenever order changes
  useEffect(() => {
    orderRef.current = order;
  }, [order]);
  
  // Track last notified status to avoid duplicate notifications
  // NOTE: Not needed anymore - local notifications removed
  // const lastNotifiedStatusRef = useRef(null);

  // Navigate back to Home - reset the stack
  const goToHome = useCallback(() => {
    console.log('🏠 Back pressed - navigating to Home');
    // Reset the navigation stack and go to HomeTab
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'HomeTab' }],
      })
    );
  }, [navigation]);

  // Handle hardware back button - always go to Home
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        console.log('🔙 Hardware back button pressed');
        goToHome();
        return true; // Prevent default behavior
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        subscription.remove();
      };
    }, [goToHome])
  );

  // Set custom header with back button that goes to Home
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={goToHome} style={{ marginLeft: 8, padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, goToHome]);

  // NOTE: showStatusNotification has been REMOVED
  // All notifications are now handled by push notifications from the server
  // This prevents duplicate notifications when the app is in foreground

  useEffect(() => {
    loadOrderData();
    
    // Connect socket
    socketService.connect();
    
    // Optimized: Update only the status field without full reload
    // This prevents map flickering on status updates
    const handleStatusChange = (data) => {
      // Check if this event is for our order
      const currentOrder = orderRef.current;
      let isOurOrder = false;
      if (paramOrderNumber) {
        isOurOrder = data?.orderNumber === paramOrderNumber;
      } else if (currentOrder?._id) {
        isOurOrder = data?.orderId === currentOrder._id || data?.orderNumber === currentOrder?.orderNumber;
      } else {
        isOurOrder = true;
      }
      
      if (!isOurOrder) return;
      
      // Update status directly in state (avoids full reload)
      if (data?.newStatus) {
        setOrder(prev => {
          if (!prev || prev.status === data.newStatus) return prev;
          return { ...prev, status: data.newStatus };
        });
        
        // Only accepted_driver needs full reload for driver info
        if (data.newStatus === 'accepted_driver') {
          loadOrderData();
        }
      } else {
        loadOrderData();
      }
    };

    // Driver location tracking with throttling
    const handleDriverLocation = (data) => {
      const now = Date.now();
      if (now - lastDriverUpdateRef.current < DRIVER_UPDATE_THROTTLE) return;
      lastDriverUpdateRef.current = now;
      
      if (data?.location?.lat && data?.location?.lng) {
        setDriverLocation({
          latitude: data.location.lat,
          longitude: data.location.lng,
        });
      }
    };

    // Price ready needs full reload
    const handlePriceReady = (data) => {
      const isOurOrder = paramOrderNumber 
        ? data?.orderNumber === paramOrderNumber 
        : true;
      if (isOurOrder) {
        loadOrderData();
      }
    };

    // Cancelled/rejected update status directly
    const handleOrderCancelled = (data) => {
      const isOurOrder = paramOrderNumber 
        ? data?.orderNumber === paramOrderNumber 
        : true;
      if (isOurOrder) {
        setOrder(prev => prev ? { ...prev, status: 'cancelled' } : prev);
      }
    };

    const handleOrderRejectedStore = (data) => {
      const isOurOrder = paramOrderNumber 
        ? data?.orderNumber === paramOrderNumber 
        : true;
      if (isOurOrder) {
        setOrder(prev => prev ? { ...prev, status: 'rejected_store' } : prev);
      }
    };

    socketService.on('driver:location', handleDriverLocation);
    socketService.on('order:status_changed', handleStatusChange);
    socketService.on('order:confirmed', handleStatusChange);
    socketService.on('order:cancelled', handleOrderCancelled);
    socketService.on('order:rejected_store', handleOrderRejectedStore);
    socketService.on('order:pending_admin', handleStatusChange);
    socketService.on('order:price_ready', handlePriceReady);
    socketService.on('order:assigned', handleStatusChange);
    socketService.on('order:completed', handleStatusChange);
    socketService.on('driver:accepted', handleStatusChange);
    socketService.on('driver:rejected', handleStatusChange);

    return () => {
      socketService.off('driver:location', handleDriverLocation);
      socketService.off('order:status_changed', handleStatusChange);
      socketService.off('order:confirmed', handleStatusChange);
      socketService.off('order:cancelled', handleOrderCancelled);
      socketService.off('order:rejected_store', handleOrderRejectedStore);
      socketService.off('order:pending_admin', handleStatusChange);
      socketService.off('order:price_ready', handlePriceReady);
      socketService.off('order:assigned', handleStatusChange);
      socketService.off('order:completed', handleStatusChange);
      socketService.off('driver:accepted', handleStatusChange);
      socketService.off('driver:rejected', handleStatusChange);
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [paramOrderNumber]); // Only depend on paramOrderNumber - orderRef handles order state

  // Join customer room when order is loaded - only once per order
  // Use a ref to track if we've already joined
  const hasJoinedRef = useRef(null);
  
  useEffect(() => {
    const finalStatuses = ['completed', 'cancelled', 'rejected_store'];
    if (order?.status && finalStatuses.includes(order.status)) {
      return;
    }
    
    // Only join if we haven't joined for this order yet
    if (order?._id && hasJoinedRef.current !== order._id) {
      hasJoinedRef.current = order._id;
      
      if (order?.customer?.phone) {
        socketService.joinRoom({ role: 'customer', userId: order.customer.phone });
      }
      
      if (socketService.socket && socketService.socket.connected) {
        socketService.socket.emit('join_order', order._id);
      } else {
        socketService.connect();
        setTimeout(() => {
          if (socketService.socket && socketService.socket.connected) {
            socketService.socket.emit('join_order', order._id);
          }
        }, 1000);
      }
    }
  }, [order?._id, order?.status]);

  const loadOrderData = async () => {
    setLoading(true);
    try {
      if (paramOrderNumber) {
        // If orderNumber is passed, fetch that specific order
        const response = await customerService.getOrderStatus(paramOrderNumber);
        setOrder(response.data.order);
      } else if (user && !user.isGuest) {
        // If no orderNumber, try to find active order for user
        try {
          const response = await customerService.getMyOrders();
          const orders = response.data;
          // Find the most recent active order
          const activeOrder = orders.find(o => 
            ['pending_store', 'pricing', 'pending_customer_confirm', 'confirmed', 'pending_admin', 'assigned', 'accepted_driver', 'preparing', 'ready', 'in_delivery'].includes(o.status)
          );
          
          if (activeOrder && activeOrder.orderNumber) {
             // Fetch full details for the active order
             const fullOrderResponse = await customerService.getOrderStatus(activeOrder.orderNumber);
             if (fullOrderResponse.data && fullOrderResponse.data.order) {
                setOrder(fullOrderResponse.data.order);
             } else {
                setOrder(null);
             }
          } else {
             setOrder(null);
          }
        } catch (err) {
          // No active order found or error
          setOrder(null);
        }
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  const playRecording = async () => {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
        return;
      }

      if (!order.orderVoiceUrl) return;

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: order.orderVoiceUrl },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          newSound.stopAsync();
        }
      });
    } catch (error) {
      console.error('Playback failed:', error.message);
    }
  };

  const handleCallStore = () => {
    if (order?.storeId?.phone) {
      Linking.openURL(`tel:${order.storeId.phone}`);
    }
  };

  const handleCallDriver = () => {
    if (order?.driverId?.phone) {
      Linking.openURL(`tel:${order.driverId.phone}`);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_store: '#f0ad4e',
      pricing: '#00c1e8',
      pending_customer_confirm: '#5cb85c',
      confirmed: '#5cb85c',
      pending_admin: '#0275d8',
      assigned: '#00c1e8',
      accepted_driver: '#00c1e8',
      preparing: '#f0ad4e',
      ready: '#5cb85c',
      in_delivery: '#0275d8',
      completed: '#27ae60',
      cancelled: '#d9534f',
      rejected_store: '#d9534f',
      rejected_driver: '#5cb85c' // Same as confirmed - searching for new driver
    };
    return colors[status] || '#777';
  };

  const getStatusText = (status) => {
    const texts = {
      pending_store: 'Αναμονή Καταστήματος',
      pricing: 'Τιμολόγηση',
      pending_customer_confirm: 'Αναμονή Επιβεβαίωσης',
      confirmed: 'Αναζήτηση Οδηγού',
      pending_admin: 'Ορισμός Μεταφορικών',
      assigned: 'Ανατέθηκε σε Οδηγό',
      accepted_driver: 'Αποδεκτή από Οδηγό',
      preparing: 'Ετοιμάζεται',
      ready: 'Έτοιμη για Παραλαβή',
      in_delivery: 'Ο Οδηγός είναι καθ\' οδόν',
      completed: 'Παραδόθηκε',
      cancelled: 'Ακυρώθηκε',
      rejected_store: 'Απορρίφθηκε από Κατάστημα',
      rejected_driver: 'Αναζήτηση Οδηγού'
    };
    return texts[status] || status;
  };

  const handleConfirmPrice = async (confirm) => {
    if (!confirm) {
      showAlert(
        'Ακύρωση Παραγγελίας',
        'Είστε σίγουροι ότι θέλετε να ακυρώσετε την παραγγελία;',
        [
          { text: 'Όχι', style: 'cancel' },
          { 
            text: 'Ναι, Ακύρωση', 
            style: 'destructive',
            onPress: () => processConfirmation(false)
          }
        ],
        'warning'
      );
      return;
    }
    
    await processConfirmation(true);
  };

  const processConfirmation = async (confirm) => {
    try {
      setLoading(true);
      // Use user phone if available, otherwise use the phone from the order (for guests)
      const phoneToConfirm = user?.phone || order.customer.phone;
      await customerService.confirmPrice(order._id, phoneToConfirm, confirm);
      loadOrderData(); // Reload to get new status
    } catch (error) {
      console.error('Confirmation error:', error);
      setLoading(false);
    }
  };

  // Get coordinates from order data
  const getMapData = () => {
    const mapData = {
      customerLocation: null,
      storeLocation: null,
      showMap: false,
    };

    // Customer/Delivery location - try multiple sources
    // 1. First try deliveryLocation field
    if (order?.deliveryLocation?.coordinates && 
        order.deliveryLocation.coordinates[0] !== 0 && 
        order.deliveryLocation.coordinates[1] !== 0) {
      mapData.customerLocation = {
        latitude: order.deliveryLocation.coordinates[1],
        longitude: order.deliveryLocation.coordinates[0],
      };
    }
    // 2. Fallback: try customer.location if deliveryLocation is empty
    else if (order?.customer?.location?.coordinates && 
             order.customer.location.coordinates[0] !== 0 && 
             order.customer.location.coordinates[1] !== 0) {
      mapData.customerLocation = {
        latitude: order.customer.location.coordinates[1],
        longitude: order.customer.location.coordinates[0],
      };
    }
    // 3. Fallback: try user's saved location
    else if (user?.location?.coordinates && 
             user.location.coordinates[0] !== 0 && 
             user.location.coordinates[1] !== 0) {
      mapData.customerLocation = {
        latitude: user.location.coordinates[1],
        longitude: user.location.coordinates[0],
      };
    }

    // Store location (from populated storeId)
    if (order?.storeId?.location?.coordinates) {
      mapData.storeLocation = {
        latitude: order.storeId.location.coordinates[1],
        longitude: order.storeId.location.coordinates[0],
      };
    }

    // Show map if we have at least customer or store location
    mapData.showMap = !!(mapData.customerLocation || mapData.storeLocation);

    return mapData;
  };

  // Calculate initial map region to fit all markers
  const getInitialRegion = () => {
    const { customerLocation, storeLocation } = getMapData();
    const locations = [customerLocation, storeLocation].filter(Boolean);
    
    if (locations.length === 0) {
      // Default to Alexandroupoli
      return {
        latitude: 40.8477,
        longitude: 25.8744,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }

    if (locations.length === 1) {
      return {
        ...locations[0],
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    // Calculate bounds
    const lats = locations.map(l => l.latitude);
    const lngs = locations.map(l => l.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(0.02, (maxLat - minLat) * 1.5),
      longitudeDelta: Math.max(0.02, (maxLng - minLng) * 1.5),
    };
  };

  // Fit map to show all markers
  useEffect(() => {
    if (mapRef.current && order) {
      const { customerLocation, storeLocation } = getMapData();
      const locations = [];
      
      if (customerLocation) locations.push(customerLocation);
      if (storeLocation) locations.push(storeLocation);
      if (driverLocation) locations.push(driverLocation);
      
      if (locations.length > 1) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(locations, {
            edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
            animated: true,
          });
        }, 500);
      }
    }
  }, [order, driverLocation]);

  // Custom map style for a cleaner look (like Uber/Wolt)
  const mapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
    { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
    { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
    { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
    { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  ];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00c1e8" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.noOrderText}>Δεν υπάρχει ενεργή παραγγελία</Text>
        <Text style={styles.noOrderSubText}>Οι παραγγελίες σας θα εμφανίζονται εδώ</Text>
      </View>
    );
  }

  // Get map data for rendering
  const { customerLocation, storeLocation, showMap } = getMapData();

  return (
    <View style={styles.container}>
      {/* Full-width Map at Top - Uber/Wolt Style */}
      {showMap ? (
        <View style={styles.mapWrapper}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            customMapStyle={mapStyle}
            userInterfaceStyle="light"
            initialRegion={getInitialRegion()}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={false}
            showsScale={false}
            toolbarEnabled={false}
          >
            {/* Store Marker - Orange (Memoized) */}
            <StoreMarkerMemo 
              coordinate={storeLocation} 
              title={order.storeName} 
              styles={styles} 
            />

            {/* Customer Home Marker - Green (Memoized) */}
            <CustomerMarkerMemo 
              coordinate={customerLocation} 
              styles={styles} 
            />

            {/* Driver Marker - Blue (show when driver accepted and has location) */}
            {['accepted_driver', 'preparing', 'ready', 'in_delivery'].includes(order.status) && driverLocation && (
              <DriverMarkerMemo 
                coordinate={driverLocation} 
                title={order.driverName || 'Οδηγός'} 
                styles={styles} 
              />
            )}
          </MapView>

          {/* Floating Status Badge on Map */}
          <View style={styles.floatingStatusBadge}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(order.status) }]} />
            <Text style={styles.floatingStatusText}>{getStatusText(order.status)}</Text>
          </View>

          {/* Live Indicator - show when driver location is being tracked */}
          {['accepted_driver', 'preparing', 'ready', 'in_delivery'].includes(order.status) && driverLocation && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveIndicatorDot} />
              <Text style={styles.liveIndicatorText}>LIVE</Text>
            </View>
          )}

          {/* Map Legend */}
          <View style={styles.mapLegendFloating}>
            <View style={styles.legendItemFloating}>
              <View style={[styles.legendDotSmall, { backgroundColor: '#FF6B35' }]} />
              <Text style={styles.legendTextSmall}>Κατάστημα</Text>
            </View>
            <View style={styles.legendItemFloating}>
              <View style={[styles.legendDotSmall, { backgroundColor: '#00C853' }]} />
              <Text style={styles.legendTextSmall}>Εσείς</Text>
            </View>
            {['accepted_driver', 'preparing', 'ready', 'in_delivery'].includes(order.status) && driverLocation && (
              <View style={styles.legendItemFloating}>
                <View style={[styles.legendDotSmall, { backgroundColor: '#00c1e8' }]} />
                <Text style={styles.legendTextSmall}>Οδηγός</Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        // No map available - show status header instead
        <View style={styles.statusHeaderNoMap}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(order.status) }]} />
          <Text style={styles.statusHeaderText}>{getStatusText(order.status)}</Text>
          <Text style={styles.orderNumberNoMap}>{order.orderNumber}</Text>
        </View>
      )}

      <ScrollView style={styles.contentScrollView} showsVerticalScrollIndicator={false}>
        {/* Action Buttons for Customer Confirmation */}
        {order.status === 'pending_customer_confirm' && (
          <View style={styles.actionContainer}>
            <Text style={styles.actionTitle}>Απαιτείται Επιβεβαίωση</Text>
            <Text style={styles.actionText}>
              Παρακαλώ επιβεβαιώστε το τελικό ποσό των €{order.totalPrice?.toFixed(2)}
            </Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleConfirmPrice(false)}
              >
                <Text style={styles.rejectButtonText}>Ακύρωση</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.confirmButton]}
                onPress={() => handleConfirmPrice(true)}
              >
                <Text style={styles.buttonText}>Επιβεβαίωση</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Store Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Στοιχεία Καταστήματος</Text>
          <View style={styles.infoRow}>
            <Ionicons name="storefront-outline" size={18} color="#666" />
            <Text style={styles.infoTextBold}>{order.storeName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color="#666" />
            <Text style={styles.infoText}>{order.storeId?.address || 'Διεύθυνση μη διαθέσιμη'}</Text>
          </View>
          {order.storeId?.phone && (
            <TouchableOpacity style={styles.infoRow} onPress={handleCallStore}>
              <Ionicons name="call-outline" size={18} color="#00c1e8" />
              <Text style={[styles.infoText, { color: '#00c1e8', fontWeight: '600' }]}>
                {order.storeId.phone}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Driver Details Card - Only show if assigned */}
        {order.driverId && order.driverId.name && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Στοιχεία Οδηγού</Text>
            <View style={styles.infoRow}>
              <Ionicons name="bicycle-outline" size={18} color="#666" />
              <Text style={styles.infoTextBold}>{order.driverId?.name || 'Οδηγός'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="car-sport-outline" size={18} color="#666" />
              <Text style={styles.infoText}>{order.driverId?.vehicle || 'Όχημα'}</Text>
            </View>
            {order.driverId?.phone && (
              <TouchableOpacity style={styles.infoRow} onPress={handleCallDriver}>
                <Ionicons name="call-outline" size={18} color="#00c1e8" />
                <Text style={[styles.infoText, { color: '#00c1e8', fontWeight: '600' }]}>
                  {order.driverId.phone}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Customer Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Στοιχεία Πελάτη</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color="#666" />
            <Text style={styles.infoTextBold}>{order.customer?.name || 'Πελάτης'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color="#666" />
            <Text style={styles.infoText}>{order.customer?.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color="#666" />
            <Text style={styles.infoText}>{order.customer?.address}</Text>
          </View>
        </View>

        {/* Order Content & Voice */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Περιεχόμενο Παραγγελίας</Text>
          {order.orderVoiceUrl ? (
            <View style={styles.playbackContainer}>
              <TouchableOpacity style={styles.playButton} onPress={playRecording}>
                <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.playbackInfo}>
                <Text style={styles.playbackText}>Ηχητικό μήνυμα</Text>
                <Text style={styles.playbackSubText}>Πατήστε για αναπαραγωγή</Text>
              </View>
            </View>
          ) : null}
          
          {order.orderContent ? (
            <Text style={styles.orderContent}>{order.orderContent}</Text>
          ) : null}
        </View>

        {/* Price Breakdown */}
        {order.totalPrice > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Χρέωση</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Προϊόντα:</Text>
              <Text style={styles.priceValue}>€{order.productPrice?.toFixed(2)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Μεταφορικά:</Text>
              <Text style={styles.priceValue}>€{order.deliveryFee?.toFixed(2)}</Text>
            </View>
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Σύνολο:</Text>
              <Text style={styles.totalValue}>€{order.totalPrice?.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Order Number at bottom */}
        <View style={styles.orderNumberFooter}>
          <Text style={styles.orderNumberFooterText}>{order.orderNumber}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6f8',
  },
  noOrderText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  noOrderSubText: {
    fontSize: 15,
    color: '#888',
  },
  
  // Map Wrapper - Full width at top like Uber/Wolt
  mapWrapper: {
    height: MAP_HEIGHT,
    width: '100%',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  
  // Floating Status Badge on Map
  floatingStatusBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  floatingStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  
  // Order Number Badge
  orderBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  orderBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  
  // Live Indicator
  liveIndicator: {
    position: 'absolute',
    bottom: 60,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00C853',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  liveIndicatorText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  
  // Map Legend Floating
  mapLegendFloating: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  legendItemFloating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendTextSmall: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666',
  },
  
  // Pin Styles - Compact modern look
  pinContainer: {
    alignItems: 'center',
  },
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  storePin: {
    backgroundColor: '#FF6B35',
  },
  homePin: {
    backgroundColor: '#00C853',
  },
  pinShadow: {
    width: 14,
    height: 4,
    borderRadius: 2,
    marginTop: -2,
    opacity: 0.25,
  },
  storePinShadow: {
    backgroundColor: '#FF6B35',
  },
  homePinShadow: {
    backgroundColor: '#00C853',
  },
  
  // Driver Pin - Animated pulsing effect look
  driverPinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverPinOuter: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,193,232,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverPinInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00c1e8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#00c1e8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  driverPulse: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,193,232,0.15)',
  },
  
  // Content ScrollView
  contentScrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  
  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#555',
    flex: 1,
  },
  infoTextBold: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  
  // Playback
  playbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00c1e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#00c1e8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  playbackInfo: {
    flex: 1,
  },
  playbackText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  playbackSubText: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  
  orderContent: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
    backgroundColor: '#f8f9fa',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  
  // Price Section
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceLabel: {
    color: '#777',
    fontSize: 15,
  },
  priceValue: {
    fontWeight: '600',
    fontSize: 15,
    color: '#333',
  },
  totalRow: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00c1e8',
  },
  
  // Action Container
  actionContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FFB74D',
    alignItems: 'center',
    shadowColor: '#FFB74D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF9800',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 18,
    color: '#555',
    lineHeight: 22,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButton: {
    backgroundColor: '#00c1e8',
  },
  rejectButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF5252',
  },
  rejectButtonText: {
    color: '#FF5252',
    fontWeight: '700',
    fontSize: 15,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  
  // Fallback when no map location data
  statusHeaderNoMap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statusHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  orderNumberNoMap: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  // Custom map markers
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 2,
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
  // Order number footer
  orderNumberFooter: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingBottom: 24,
    marginTop: 8,
  },
  orderNumberFooterText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});

export default TrackOrderScreen;
