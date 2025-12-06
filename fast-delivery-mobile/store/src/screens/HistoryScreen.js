import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storeService } from '../services/api';
import { useAlert } from '../context/AlertContext';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const HistoryScreen = () => {
  const { showAlert } = useAlert();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch orders
  const fetchOrders = useCallback(async (pageNum = 1, isRefresh = false) => {
    try {
      if (pageNum === 1 && !isRefresh) setLoading(true);
      if (pageNum > 1) setLoadingMore(true);

      const response = await storeService.getOrders('completed', pageNum, 20);
      const newOrders = response.orders || response.data || [];

      if (pageNum === 1) {
        setOrders(newOrders);
      } else {
        setOrders(prev => [...prev, ...newOrders]);
      }

      setHasMore(newOrders.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching history:', error);
      showAlert('error', 'Σφάλμα', 'Αποτυχία φόρτωσης ιστορικού');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [showAlert]);

  // Initial fetch
  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  // Load more
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchOrders(page + 1);
    }
  };

  // Call customer
  const callCustomer = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const config = {
      completed: { bg: '#28a745', label: 'Ολοκληρώθηκε', icon: 'checkmark-circle' },
      cancelled: { bg: '#dc3545', label: 'Ακυρώθηκε', icon: 'close-circle' },
      rejected_store: { bg: '#dc3545', label: 'Απορρίφθηκε', icon: 'close-circle' },
    };
    const c = config[status] || { bg: '#6c757d', label: status, icon: 'help' };

    return (
      <View style={[styles.statusBadge, { backgroundColor: c.bg }]}>
        <Ionicons name={c.icon} size={14} color="#fff" />
        <Text style={styles.statusText}>{c.label}</Text>
      </View>
    );
  };

  // Calculate totals for today
  const todayStats = React.useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => 
      new Date(o.createdAt).toDateString() === today && o.status === 'completed'
    );
    const total = todayOrders.reduce((sum, o) => sum + (o.productPrice || 0), 0);
    return { count: todayOrders.length, total };
  }, [orders]);

  // Render order card
  const renderOrderCard = ({ item: order }) => {
    const customerPhone = order.customer?.phone || order.customerPhone;
    const isCompleted = order.status === 'completed';

    return (
      <View style={[styles.orderCard, !isCompleted && styles.orderCardCancelled]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          {getStatusBadge(order.status)}
        </View>

        {/* Time */}
        <Text style={styles.orderTime}>
          📅 {new Date(order.createdAt).toLocaleDateString('el-GR')} {' '}
          {new Date(order.createdAt).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}
        </Text>

        {/* Customer Info */}
        <View style={styles.customerSection}>
          <Text style={styles.customerName}>👤 {order.customer?.name || 'Πελάτης'}</Text>
          {customerPhone ? (
            <TouchableOpacity onPress={() => callCustomer(customerPhone)}>
              <Text style={styles.customerPhone}>📞 {customerPhone}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Order Content */}
        <Text style={styles.orderText} numberOfLines={2}>
          {order.orderContent || 'Χωρίς περιγραφή'}
        </Text>

        {/* Price */}
        {order.productPrice != null && order.productPrice > 0 && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Τιμή:</Text>
            <Text style={styles.priceValue}>€{Number(order.productPrice).toFixed(2)}</Text>
          </View>
        )}
      </View>
    );
  };

  // Render footer (loading more indicator)
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#00c1e8" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Today's Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="receipt" size={24} color="#00c1e8" />
          <Text style={styles.statValue}>{todayStats.count}</Text>
          <Text style={styles.statLabel}>Σήμερα</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="cash" size={24} color="#28a745" />
          <Text style={styles.statValue}>€{todayStats.total.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Έσοδα</Text>
        </View>
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00c1e8" />
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          numColumns={isTablet ? 2 : 1}
          key={isTablet ? 'tablet' : 'phone'}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchOrders(1, true);
              }}
              colors={['#00c1e8']}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Δεν υπάρχει ιστορικό παραγγελιών</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: isTablet ? 16 : 12,
  },
  orderCard: {
    flex: isTablet ? 0.5 : 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    margin: isTablet ? 8 : 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderCardCancelled: {
    opacity: 0.7,
    backgroundColor: '#fff5f5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderTime: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  customerSection: {
    marginBottom: 8,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  customerPhone: {
    fontSize: 14,
    color: '#00c1e8',
  },
  orderText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#28a745',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default HistoryScreen;
