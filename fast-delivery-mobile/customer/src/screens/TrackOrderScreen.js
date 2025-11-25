import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Alert, TouchableOpacity, Linking } from 'react-native';
import { customerService } from '../services/api';
import socketService from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

const TrackOrderScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Safely get orderNumber if passed
  const paramOrderNumber = route.params?.orderNumber;

  useEffect(() => {
    loadOrderData();
    
    // Connect socket
    socketService.connect();
    
    // Listen for updates
    const handleStatusChange = (data) => {
      // If we are tracking a specific order, check if the update is for this order
      if (paramOrderNumber) {
        if (data.orderNumber === paramOrderNumber) {
          loadOrderData();
        }
      } else {
        // If we are in "active order" mode, reload to see if the updated order is relevant
        loadOrderData();
      }
    };

    socketService.on('order:status_changed', handleStatusChange);
    socketService.on('order:confirmed', handleStatusChange);
    socketService.on('order:cancelled', handleStatusChange);
    socketService.on('order:rejected_store', handleStatusChange);
    socketService.on('order:pending_admin', handleStatusChange);
    socketService.on('order:price_ready', handleStatusChange);
    socketService.on('order:assigned', handleStatusChange);

    return () => {
      socketService.off('order:status_changed', handleStatusChange);
      socketService.off('order:confirmed', handleStatusChange);
      socketService.off('order:cancelled', handleStatusChange);
      socketService.off('order:rejected_store', handleStatusChange);
      socketService.off('order:pending_admin', handleStatusChange);
      socketService.off('order:price_ready', handleStatusChange);
      socketService.off('order:assigned', handleStatusChange);
      // Don't disconnect here as other screens might need it
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [paramOrderNumber]);

  // Join customer room when order is loaded (crucial for guests)
  useEffect(() => {
    if (order?.customer?.phone) {
      socketService.joinRoom({ role: 'customer', userId: order.customer.phone });
    }
  }, [order]);

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
      console.log('Error loading order:', error);
      // Don't show alert if just checking for active order
      if (paramOrderNumber) {
        Alert.alert('Σφάλμα', 'Δεν βρέθηκε η παραγγελία');
      }
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
      console.error('Playback failed', error);
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η αναπαραγωγή');
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
      rejected_driver: '#d9534f'
    };
    return colors[status] || '#777';
  };

  const getStatusText = (status) => {
    const texts = {
      pending_store: 'Αναμονή Καταστήματος',
      pricing: 'Τιμολόγηση',
      pending_customer_confirm: 'Αναμονή Επιβεβαίωσης',
      confirmed: 'Επιβεβαιωμένη',
      pending_admin: 'Έλεγχος Admin',
      assigned: 'Ανατέθηκε σε Οδηγό',
      accepted_driver: 'Αποδεκτή από Οδηγό',
      preparing: 'Ετοιμάζεται',
      ready: 'Έτοιμη για Παραλαβή',
      in_delivery: 'Ο Οδηγός είναι καθ\' οδόν',
      completed: 'Παραδόθηκε',
      cancelled: 'Ακυρώθηκε',
      rejected_store: 'Απορρίφθηκε από Κατάστημα',
      rejected_driver: 'Απορρίφθηκε από Οδηγό'
    };
    return texts[status] || status;
  };

  const handleConfirmPrice = async (confirm) => {
    try {
      setLoading(true);
      // Use user phone if available, otherwise use the phone from the order (for guests)
      const phoneToConfirm = user?.phone || order.customer.phone;
      await customerService.confirmPrice(order._id, phoneToConfirm, confirm);
      Alert.alert('Επιτυχία', confirm ? 'Η παραγγελία επιβεβαιώθηκε!' : 'Η παραγγελία ακυρώθηκε.');
      loadOrderData(); // Reload to get new status
    } catch (error) {
      console.error('Confirmation error:', error);
      Alert.alert('Σφάλμα', 'Προέκυψε σφάλμα κατά την επιβεβαίωση');
      setLoading(false);
    }
  };

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

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.statusHeader, { backgroundColor: getStatusColor(order.status) }]}>
        <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
        <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
      </View>

      <View style={styles.content}>
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
                <Text style={styles.buttonText}>Ακύρωση</Text>
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
        {order.driverId && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Στοιχεία Οδηγού</Text>
            <View style={styles.infoRow}>
              <Ionicons name="bicycle-outline" size={18} color="#666" />
              <Text style={styles.infoTextBold}>{order.driverId.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="car-sport-outline" size={18} color="#666" />
              <Text style={styles.infoText}>{order.driverId.vehicle || 'Όχημα'}</Text>
            </View>
            {order.driverId.phone && (
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
            <Text style={styles.infoTextBold}>{order.customer?.name}</Text>
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
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noOrderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  noOrderSubText: {
    fontSize: 14,
    color: '#666',
  },
  statusHeader: {
    padding: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  orderNumber: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontWeight: '500',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#444',
    flex: 1,
  },
  infoTextBold: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  playbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00c1e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#00c1e8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  playbackInfo: {
    flex: 1,
  },
  playbackText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  playbackSubText: {
    fontSize: 12,
    color: '#666',
  },
  orderContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    color: '#666',
    fontSize: 14,
  },
  priceValue: {
    fontWeight: '500',
    fontSize: 14,
    color: '#333',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00c1e8',
  },
  actionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0ad4e',
    alignItems: 'center',
    shadowColor: '#f0ad4e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f0ad4e',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
    color: '#444',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  confirmButton: {
    backgroundColor: '#27ae60',
  },
  rejectButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default TrackOrderScreen;
