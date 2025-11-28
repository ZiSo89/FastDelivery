import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { customerService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const CustomerOrders = ({ navigation }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [guestPhone, setGuestPhone] = useState('');

  const loadOrders = async () => {
    if (user?.isGuest) {
      setLoading(false);
      return;
    }

    try {
      const response = await customerService.getMyOrders();
      const ordersList = response.data.orders || response.data;
      setOrders(Array.isArray(ordersList) ? ordersList : []);
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleTrackOrder = async () => {
    if (!guestPhone || guestPhone.length !== 10) {
      console.log('Invalid phone number');
      return;
    }

    try {
      setLoading(true);
      const response = await customerService.getActiveOrderByPhone(guestPhone);
      setLoading(false);
      
      if (response.data.success && response.data.order) {
        navigation.navigate('TrackOrder', { orderNumber: response.data.order.orderNumber });
      } else {
        console.log('No active order found');
      }
    } catch (error) {
      setLoading(false);
      console.log('Track order error:', error.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return '#27ae60';
      case 'cancelled': return '#e74c3c';
      case 'new': return '#f39c12';
      default: return '#00c2e8';
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending_store': 'Αναμονή Καταστήματος',
      'pricing': 'Τιμολόγηση',
      'pending_customer_confirm': 'Αναμονή Επιβεβαίωσης',
      'confirmed': 'Επιβεβαιωμένη',
      'pending_admin': 'Αναμονή Διαχειριστή',
      'assigned': 'Ανατέθηκε',
      'accepted_driver': 'Αποδεκτή από Οδηγό',
      'preparing': 'Ετοιμάζεται',
      'in_delivery': 'Καθ\' οδόν',
      'completed': 'Παραδόθηκε',
      'cancelled': 'Ακυρώθηκε',
      'rejected_store': 'Απορρίφθηκε από Κατάστημα',
      'rejected_driver': 'Απορρίφθηκε από Οδηγό'
    };
    return statusMap[status] || status;
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('TrackOrder', { orderNumber: item.orderNumber })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.storeName}>{item.storeId?.businessName || item.storeName || 'Άγνωστο Κατάστημα'}</Text>
        <Text style={[styles.statusBadge, { color: getStatusColor(item.status) }]}>
          {getStatusText(item.status)}
        </Text>
      </View>
      
      <View style={styles.cardBody}>
        <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('el-GR')}</Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cost}>{item.totalPrice ? `€${item.totalPrice.toFixed(2)}` : '-'}</Text>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00c2e8" />
      </View>
    );
  }

  if (user?.isGuest) {
    return (
      <View style={styles.container}>
        <View style={styles.guestContainer}>
          <Ionicons name="search-circle-outline" size={100} color="#00c2e8" />
          <Text style={styles.guestTitle}>Παρακολούθηση Παραγγελίας</Text>
          <Text style={styles.guestSubtitle}>
            Εισάγετε το τηλέφωνό σας για να δείτε την εξέλιξη της τρέχουσας παραγγελίας σας
          </Text>
          
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Τηλέφωνο (π.χ. 6912345678)"
              value={guestPhone}
              onChangeText={setGuestPhone}
              keyboardType="phone-pad"
              maxLength={10}
              placeholderTextColor="#999"
            />
          </View>
          
          <TouchableOpacity style={styles.trackButton} onPress={handleTrackOrder}>
             <Text style={styles.trackButtonText}>Αναζήτηση</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00c2e8']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {user?.isGuest ? 'Συνδεθείτε για να δείτε το ιστορικό σας' : 'Δεν υπάρχουν παραγγελίες'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardBody: {
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 14,
    color: '#666',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  cost: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00c2e8',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    marginTop: 10,
    color: '#999',
    fontSize: 16,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  guestSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 15,
    height: 50,
    width: '100%',
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
  trackButton: {
    backgroundColor: '#00c2e8',
    borderRadius: 10,
    height: 50,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CustomerOrders;
