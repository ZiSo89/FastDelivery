import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  RefreshControl,
  Switch,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Vibration,
  AppState
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { driverService } from '../services/api';
import socketService from '../services/socket';
import locationService from '../services/locationService';
import OrderCard from '../components/OrderCard';
import DashboardMap from '../components/DashboardMap';

const DashboardScreen = () => {
  const { user, logout, refreshUser } = useAuth();
  const { showAlert } = useAlert();
  const navigation = useNavigation();
  
  const [isOnline, setIsOnline] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  
  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);

  // Default location (Alexandroupoli city center)
  const DEFAULT_LOCATION = {
    latitude: 40.8476,
    longitude: 25.8743,
  };

  // Get driver location on mount and update periodically
  useEffect(() => {
    let locationSubscription;
    
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          // Use default location if permission denied
          setDriverLocation(DEFAULT_LOCATION);
          return;
        }

        // Get initial location
        let location = await Location.getCurrentPositionAsync({ 
          accuracy: Location.Accuracy.Balanced 
        });
        setDriverLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        // Watch for location updates
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000,
            distanceInterval: 50,
          },
          (location) => {
            setDriverLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          }
        );
      } catch (error) {
        setDriverLocation(DEFAULT_LOCATION);
      }
    })();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      const response = await driverService.getOrders();
      const fetchedOrders = response.data.orders || [];
      setOrders(fetchedOrders);
      
      // Check if any order needs GPS tracking (accepted_driver, preparing, ready, in_delivery)
      const trackingStatuses = ['accepted_driver', 'preparing', 'ready', 'in_delivery'];
      const activeOrder = fetchedOrders.find(o => trackingStatuses.includes(o.status));
      
      if (activeOrder && user?._id) {
        if (!locationService.isTracking || locationService.currentOrderId !== activeOrder._id) {
          const started = await locationService.startTracking(activeOrder._id, user._id);
          setIsTracking(started);
        }
      } else if (!activeOrder && locationService.isTracking) {
        await locationService.stopTracking();
        setIsTracking(false);
      }
    } catch (err) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Fetch profile to get online status
  const fetchProfile = useCallback(async () => {
    try {
      const response = await driverService.getProfile();
      const driverData = response.data.driver || response.data;
      setIsOnline(driverData.isOnline || false);
    } catch (err) {
      // Silent fail
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchProfile();
    fetchOrders();
  }, [fetchOrders]);

  // Refresh on screen focus (when switching back to this screen)
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  // Refresh when app becomes active
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        fetchOrders();
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [fetchOrders]);

  // Socket listeners
  useEffect(() => {
    // Handler for NEW order assignments - just refresh + vibrate
    const handleNewAssignment = (data) => {
      fetchOrders();
      
      // Only vibrate for new assignments to THIS driver
      // Push notification is sent by server - no local notification needed
      if (data.driverId && user?._id && data.driverId.toString() === user._id.toString()) {
        Vibration.vibrate([0, 500, 200, 500]);
      }
    };

    // Handler for status changes - vibrate when PREPARING (ready for pickup)
    const handleStatusChange = (data) => {
      fetchOrders();
      
      // Vibrate when order is PREPARING (store finished, ready for pickup)
      // Push notification is sent by server - no local notification needed
      if (data.newStatus === 'preparing') {
        if (data.driverId && user?._id && data.driverId.toString() === user._id.toString()) {
          Vibration.vibrate([0, 500, 200, 500]);
        }
      }
    };

    // Handler for other updates - NO notification, just refresh
    const handleOrderUpdate = (data) => {
      fetchOrders();
    };

    const handleDriverStatusChange = (data) => {
      if (data.status === 'approved' && data.isApproved) {
        showAlert('Έγκριση!', 'Η εγγραφή σας εγκρίθηκε!', [], 'success');
        refreshUser();
      }
      fetchOrders();
    };

    // NEW assignments - with notification
    socketService.on('order:assigned', handleNewAssignment);
    
    // Status changes - notify only for 'preparing' (ready for pickup)
    socketService.on('order:status_changed', handleStatusChange);
    
    // Other updates - NO notification
    socketService.on('order:cancelled', handleOrderUpdate);
    socketService.on('order:completed', handleOrderUpdate);
    socketService.on('driver:accepted', handleOrderUpdate);
    socketService.on('driver:rejected', handleOrderUpdate);
    socketService.on('driver:status_changed', handleDriverStatusChange);

    return () => {
      socketService.off('order:assigned', handleNewAssignment);
      socketService.off('order:status_changed', handleStatusChange);
      socketService.off('order:cancelled', handleOrderUpdate);
      socketService.off('order:completed', handleOrderUpdate);
      socketService.off('driver:accepted', handleOrderUpdate);
      socketService.off('driver:rejected', handleOrderUpdate);
      socketService.off('driver:status_changed', handleDriverStatusChange);
    };
  }, [user, fetchOrders, refreshUser, showAlert]);

  // Toggle online status
  const handleToggleOnline = async (value) => {
    if (!value) {
      // Going offline - show confirmation
      setShowOfflineModal(true);
    } else {
      // Going online - direct
      try {
        await driverService.setAvailability(true);
        setIsOnline(true);
      } catch (err) {
        showAlert('Σφάλμα', 'Αποτυχία αλλαγής κατάστασης', [], 'error');
      }
    }
  };

  const confirmGoOffline = async () => {
    try {
      await driverService.setAvailability(false);
      setIsOnline(false);
      setShowOfflineModal(false);
    } catch (err) {
      showAlert('Σφάλμα', 'Αποτυχία αλλαγής κατάστασης', [], 'error');
      setShowOfflineModal(false);
    }
  };

  // Order actions
  const handleAccept = async (orderId) => {
    try {
      setProcessingId(orderId);
      await driverService.acceptOrder(orderId, true);
      
      // Start location tracking when driver accepts order
      if (user?._id) {
        const started = await locationService.startTracking(orderId, user._id);
        setIsTracking(started);
      }
      
      await fetchOrders();
    } catch (err) {
      showAlert('Σφάλμα', err.response?.data?.message || 'Σφάλμα αποδοχής', [], 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = (orderId) => {
    setSelectedOrderId(orderId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      showAlert('Σφάλμα', 'Παρακαλώ εισάγετε λόγο απόρριψης', [], 'warning');
      return;
    }

    try {
      setProcessingId(selectedOrderId);
      await driverService.acceptOrder(selectedOrderId, false, rejectReason);
      await fetchOrders();
      setShowRejectModal(false);
      setRejectReason('');
    } catch (err) {
      showAlert('Σφάλμα', err.response?.data?.message || 'Σφάλμα απόρριψης', [], 'error');
    } finally {
      setProcessingId(null);
      setSelectedOrderId(null);
    }
  };

  const handlePickup = async (orderId) => {
    try {
      setProcessingId(orderId);
      await driverService.updateStatus(orderId, 'in_delivery');
      await fetchOrders();
    } catch (err) {
      showAlert('Σφάλμα', err.response?.data?.message || 'Σφάλμα παραλαβής', [], 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleComplete = (orderId) => {
    setSelectedOrderId(orderId);
    setShowCompleteModal(true);
  };

  const confirmComplete = async () => {
    try {
      setProcessingId(selectedOrderId);
      await driverService.updateStatus(selectedOrderId, 'completed');
      
      // Stop location tracking when delivery is completed
      await locationService.stopTracking();
      setIsTracking(false);
      
      await fetchOrders();
      setShowCompleteModal(false);
    } catch (err) {
      showAlert('Σφάλμα', err.response?.data?.message || 'Σφάλμα ολοκλήρωσης', [], 'error');
    } finally {
      setProcessingId(null);
      setSelectedOrderId(null);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // Navigate to map screen
  const handleViewMap = (order) => {
    navigation.navigate('DeliveryMap', { order });
  };

  // Get initials for avatar
  const getInitials = () => {
    if (user?.name) return user.name[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return 'Ο';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>🚗 FastDelivery</Text>
        </View>
        <TouchableOpacity 
          style={styles.avatar}
          onPress={() => setShowMenu(!showMenu)}
        >
          <Text style={styles.avatarText}>{getInitials()}</Text>
        </TouchableOpacity>
        
        {/* Dropdown Menu */}
        {showMenu && (
          <View style={styles.dropdownMenu}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                logout();
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#333" />
              <Text style={styles.menuItemText}>Αποσύνδεση</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Status Bar */}
      <View style={[styles.statusBar, isOnline ? styles.statusOnline : styles.statusOffline]}>
        <View style={styles.statusLeft}>
          <View style={[styles.statusDot, isOnline && styles.statusDotPulse]} />
          <Text style={styles.statusText}>
            {isOnline ? 'Είστε Online' : 'Είστε Offline'}
          </Text>
          {isTracking && (
            <View style={styles.trackingBadge}>
              <Ionicons name="navigate" size={12} color="#fff" />
              <Text style={styles.trackingText}>GPS</Text>
            </View>
          )}
        </View>
        <Switch
          value={isOnline}
          onValueChange={handleToggleOnline}
          trackColor={{ false: '#ccc', true: '#00c2e8' }}
          thumbColor="#fff"
        />
      </View>

      {/* Orders List */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00c2e8']} />
        }
      >
        {/* Dashboard Map - Always visible */}
        <DashboardMap 
          orders={orders} 
          driverLocation={driverLocation}
        />
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#00c2e8" />
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>😴</Text>
            <Text style={styles.emptyTitle}>Δεν υπάρχουν ενεργές παραγγελίες</Text>
            <Text style={styles.emptyText}>Περιμένετε για νέες αναθέσεις...</Text>
          </View>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onAccept={handleAccept}
              onReject={handleReject}
              onPickup={handlePickup}
              onComplete={handleComplete}
              onViewMap={handleViewMap}
              processing={processingId}
            />
          ))
        )}
      </ScrollView>

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>❌ Απόρριψη Παραγγελίας</Text>
            <Text style={styles.modalLabel}>Λόγος απόρριψης:</Text>
            <TextInput
              style={styles.modalInput}
              multiline
              numberOfLines={3}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="π.χ. Πολύ μακριά..."
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowRejectModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Άκυρο</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonDestructive]}
                onPress={confirmReject}
              >
                <Text style={styles.modalButtonDestructiveText}>Απόρριψη</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Complete Modal */}
      <Modal
        visible={showCompleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✅ Ολοκλήρωση Παράδοσης</Text>
            <Text style={styles.modalMessage}>Επιβεβαιώνετε ότι η παράδοση ολοκληρώθηκε;</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowCompleteModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Άκυρο</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonSuccess]}
                onPress={confirmComplete}
              >
                <Text style={styles.modalButtonSuccessText}>Ολοκλήρωση</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Offline Confirmation Modal */}
      <Modal
        visible={showOfflineModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOfflineModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚫ Απενεργοποίηση</Text>
            <Text style={styles.modalMessage}>
              Θα σταματήσετε να λαμβάνετε νέες παραγγελίες.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowOfflineModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Άκυρο</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonDark]}
                onPress={confirmGoOffline}
              >
                <Text style={styles.modalButtonDarkText}>Επιβεβαίωση</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    zIndex: 1000,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00c2e8',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0f7fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00c2e8',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 55,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
    minWidth: 160,
    zIndex: 2000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  menuItemText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 10,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusOnline: {
    backgroundColor: '#e0f7fa',
    borderBottomWidth: 1,
    borderBottomColor: '#b2ebf2',
  },
  statusOffline: {
    backgroundColor: '#eceff1',
    borderBottomWidth: 1,
    borderBottomColor: '#cfd8dc',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00c2e8',
    marginRight: 8,
  },
  statusDotPulse: {
    // Animation would be added with Animated API
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#37474f',
  },
  trackingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  trackingText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  modalButtonCancel: {
    backgroundColor: '#f0f2f5',
  },
  modalButtonCancelText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalButtonDestructive: {
    backgroundColor: '#dc3545',
  },
  modalButtonDestructiveText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalButtonSuccess: {
    backgroundColor: '#28a745',
  },
  modalButtonSuccessText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalButtonDark: {
    backgroundColor: '#333',
  },
  modalButtonDarkText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default DashboardScreen;
