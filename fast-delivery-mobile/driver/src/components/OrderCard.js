import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  Linking,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const OrderCard = ({ order, onAccept, onReject, onPickup, onComplete, processing, onViewMap }) => {
  
  // Open navigation in Google Maps or Apple Maps
  const openNavigation = (address) => {
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
        // Fallback to Google Maps web
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
      }
    });
  };

  // Make phone call
  const makeCall = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  // Get status badge config
  const getStatusConfig = (status) => {
    const config = {
      assigned: { bg: '#fff3cd', color: '#856404', label: 'Νέα Ανάθεση' },
      accepted_driver: { bg: '#cce5ff', color: '#004085', label: 'Αναμονή' },
      preparing: { bg: '#fff3cd', color: '#856404', label: 'Προετοιμασία' },
      in_delivery: { bg: '#cce5ff', color: '#004085', label: 'Σε Παράδοση' },
      completed: { bg: '#d4edda', color: '#155724', label: 'Ολοκληρώθηκε' },
      rejected_driver: { bg: '#f8d7da', color: '#721c24', label: 'Απορρίφθηκε' }
    };
    return config[status] || { bg: '#e2e3e5', color: '#383d41', label: status };
  };

  const statusConfig = getStatusConfig(order.status);
  const isProcessing = processing === order._id;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.priceText}>Είσπραξη: €{order.totalPrice?.toFixed(2)}</Text>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.timeline}>
        {/* Store */}
        <View style={styles.timelineItem}>
          <View style={styles.timelineLeft}>
            <View style={[styles.marker, styles.storeMarker]} />
            <View style={styles.connector} />
          </View>
          <View style={styles.timelineContent}>
            <View style={styles.locationRow}>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>
                  {order.storeId?.businessName || order.storeName}
                </Text>
                <Text style={styles.locationAddress}>{order.storeId?.address}</Text>
              </View>
              <TouchableOpacity 
                style={styles.navButton}
                onPress={() => openNavigation(order.storeId?.address)}
              >
                <Ionicons name="navigate" size={18} color="#00c2e8" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.phoneRow}
              onPress={() => makeCall(order.storeId?.phone)}
            >
              <Ionicons name="call-outline" size={14} color="#666" />
              <Text style={styles.phoneText}>{order.storeId?.phone}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Customer */}
        <View style={styles.timelineItem}>
          <View style={styles.timelineLeft}>
            <View style={[styles.marker, styles.customerMarker]} />
          </View>
          <View style={styles.timelineContent}>
            <View style={styles.locationRow}>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>
                  {order.customer?.name || 'Πελάτης'}
                </Text>
                <Text style={styles.locationAddress}>
                  {order.customer?.address || order.deliveryAddress}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.navButton}
                onPress={() => openNavigation(order.customer?.address || order.deliveryAddress)}
              >
                <Ionicons name="navigate" size={18} color="#00c2e8" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.phoneRow}
              onPress={() => makeCall(order.customer?.phone || order.customerPhone)}
            >
              <Ionicons name="call-outline" size={14} color="#666" />
              <Text style={styles.phoneText}>
                {order.customer?.phone || order.customerPhone}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {order.status === 'assigned' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton, isProcessing && styles.buttonDisabled]}
              onPress={() => onAccept(order._id)}
              disabled={isProcessing}
            >
              <Text style={styles.acceptButtonText}>Αποδοχή</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton, isProcessing && styles.buttonDisabled]}
              onPress={() => onReject(order._id)}
              disabled={isProcessing}
            >
              <Text style={styles.rejectButtonText}>Απόρριψη</Text>
            </TouchableOpacity>
          </View>
        )}

        {order.status === 'accepted_driver' && (
          <View style={styles.waitingContainer}>
            <Ionicons name="time-outline" size={20} color="#004085" />
            <Text style={styles.waitingText}>Αναμονή Προετοιμασίας</Text>
          </View>
        )}

        {order.status === 'preparing' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.pickupButton, isProcessing && styles.buttonDisabled]}
            onPress={() => onPickup(order._id)}
            disabled={isProcessing}
          >
            <Ionicons name="car" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.pickupButtonText}>Παραλαβή & Αποστολή</Text>
          </TouchableOpacity>
        )}

        {order.status === 'in_delivery' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton, isProcessing && styles.buttonDisabled]}
            onPress={() => onComplete(order._id)}
            disabled={isProcessing}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.completeButtonText}>Ολοκλήρωση Παράδοσης</Text>
          </TouchableOpacity>
        )}

        {order.status === 'completed' && (
          <View style={styles.completedContainer}>
            <Ionicons name="checkmark-circle" size={24} color="#28a745" />
            <Text style={styles.completedText}>Η παραγγελία ολοκληρώθηκε</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  orderNumber: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeline: {
    padding: 16,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeft: {
    alignItems: 'center',
    width: 20,
    marginRight: 12,
  },
  marker: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  storeMarker: {
    backgroundColor: '#333',
  },
  customerMarker: {
    backgroundColor: '#00c2e8',
  },
  connector: {
    width: 2,
    height: 50,
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 15,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  locationInfo: {
    flex: 1,
    paddingRight: 10,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 13,
    color: '#666',
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  phoneText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 5,
  },
  actions: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  acceptButton: {
    backgroundColor: '#00c2e8',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  rejectButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '600',
  },
  pickupButton: {
    backgroundColor: '#00c2e8',
  },
  pickupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#28a745',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#cce5ff',
    paddingVertical: 12,
    borderRadius: 10,
  },
  waitingText: {
    color: '#004085',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  completedText: {
    color: '#28a745',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default OrderCard;
