import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, ScrollView, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { customerService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../components/CustomAlert';

const CustomerOrders = ({ navigation }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [guestPhone, setGuestPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info'
  });
  const phoneInputRef = useRef(null);
  const scrollViewRef = useRef(null);
  const phoneContainerRef = useRef(null);

  // Auto scroll to phone input when guest view is shown
  useEffect(() => {
    if (user?.isGuest && !loading) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 280, animated: true });
      }, 300);
    }
  }, [user?.isGuest, loading]);

  const loadOrders = async (page = 1, append = false) => {
    if (user?.isGuest) {
      setLoading(false);
      return;
    }

    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const response = await customerService.getMyOrders(page, 10);
      const data = response.data;
      const ordersList = data.orders || [];
      
      if (append) {
        setOrders(prev => [...prev, ...ordersList]);
      } else {
        setOrders(ordersList);
      }
      
      setHasMore(data.hasMore || page < data.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('📦 loadOrders ERROR:', error.response?.data || error.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const loadMoreOrders = () => {
    if (!loadingMore && hasMore && !loading) {
      loadOrders(currentPage + 1, true);
    }
  };

  const showAlert = (title, message, type = 'info') => {
    setAlertConfig({ visible: true, title, message, type });
  };

  const hideAlert = () => {
    setAlertConfig({ ...alertConfig, visible: false });
  };

  const handleTrackOrder = async () => {
    Keyboard.dismiss();
    
    // Validate phone
    if (!guestPhone) {
      setPhoneError('Εισάγετε το τηλέφωνό σας');
      phoneInputRef.current?.focus();
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    
    if (guestPhone.length !== 10) {
      setPhoneError('Το τηλέφωνο πρέπει να έχει 10 ψηφία');
      phoneInputRef.current?.focus();
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    try {
      setLoading(true);
      setPhoneError('');
      const response = await customerService.getActiveOrderByPhone(guestPhone);
      setLoading(false);
      
      if (response.data.success && response.data.order) {
        navigation.navigate('TrackOrder', { orderNumber: response.data.order.orderNumber });
      } else {
        showAlert(
          'Δεν βρέθηκε παραγγελία',
          'Δεν υπάρχει ενεργή παραγγελία για αυτό το τηλέφωνο. Ελέγξτε τον αριθμό ή περιμένετε να ενημερωθεί η κατάσταση.',
          'warning'
        );
      }
    } catch (error) {
      setLoading(false);
      
      if (error.response?.status === 404) {
        showAlert(
          'Δεν βρέθηκε παραγγελία',
          'Δεν υπάρχει ενεργή παραγγελία για αυτό το τηλέφωνο. Αν έχετε ολοκληρωμένη παραγγελία, δεν εμφανίζεται εδώ.',
          'info'
        );
      } else {
        showAlert(
          'Σφάλμα',
          'Κάτι πήγε στραβά. Δοκιμάστε ξανά.',
          'error'
        );
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user && !user.isGuest) {
        loadOrders(1, false);
      } else if (user?.isGuest) {
        setLoading(false);
      }
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);
    loadOrders(1, false);
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
      'confirmed': 'Αναζήτηση Οδηγού',
      'pending_admin': 'Αναμονή Διαχειριστή',
      'assigned': 'Ανατέθηκε',
      'accepted_driver': 'Αποδεκτή από Οδηγό',
      'preparing': 'Ετοιμάζεται',
      'in_delivery': 'Καθ\' οδόν',
      'completed': 'Παραδόθηκε',
      'cancelled': 'Ακυρώθηκε',
      'rejected_store': 'Απορρίφθηκε από Κατάστημα',
      'rejected_driver': 'Αναζήτηση Οδηγού'
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
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.guestScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          bounces={true}
          alwaysBounceVertical={true}
        >
          <View style={styles.guestContainer}>
            <Ionicons name="search-circle-outline" size={100} color="#00c2e8" />
            <Text style={styles.guestTitle}>Παρακολούθηση Παραγγελίας</Text>
            <Text style={styles.guestSubtitle}>
              Εισάγετε το τηλέφωνό σας για να δείτε την εξέλιξη της τρέχουσας παραγγελίας σας
            </Text>
            
            <View style={[styles.inputContainer, phoneError && styles.inputContainerError]}>
              <Ionicons name="call-outline" size={20} color={phoneError ? "#e74c3c" : "#666"} style={styles.inputIcon} />
              <TextInput
                ref={phoneInputRef}
                style={styles.input}
                placeholder="Τηλέφωνο (π.χ. 6912345678)"
                value={guestPhone}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '');
                  if (cleaned.length <= 10) {
                    setGuestPhone(cleaned);
                    if (phoneError) setPhoneError('');
                  }
                }}
                keyboardType="phone-pad"
                maxLength={10}
                placeholderTextColor="#999"
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 300);
                }}
              />
            </View>
            {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
            
            <TouchableOpacity 
              style={[styles.trackButton, loading && styles.trackButtonDisabled]} 
              onPress={handleTrackOrder}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.trackButtonText}>Αναζήτηση</Text>
              )}
            </TouchableOpacity>
            
            {/* Extra space for keyboard */}
            <View style={{ height: 150 }} />
          </View>
        </ScrollView>
        
        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onClose={hideAlert}
        />
      </KeyboardAvoidingView>
    );
  }

  const renderFooter = () => {
    if (!loadingMore || orders.length === 0) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#00c2e8" />
        <Text style={styles.loadingMoreText}>Φόρτωση περισσότερων...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>
          {user?.isGuest ? 'Συνδεθείτε για να δείτε το ιστορικό σας' : 'Δεν υπάρχουν παραγγελίες'}
        </Text>
      </View>
    );
  };

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
        onEndReached={loadMoreOrders}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
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
  guestScrollContent: {
    flexGrow: 1,
  },
  guestContainer: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
    backgroundColor: '#fff',
    minHeight: '100%',
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
    marginBottom: 8,
    paddingHorizontal: 15,
    height: 50,
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#eee',
  },
  inputContainerError: {
    borderColor: '#e74c3c',
    backgroundColor: '#fff5f5',
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
  errorText: {
    color: '#e74c3c',
    fontSize: 13,
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  trackButton: {
    backgroundColor: '#00c2e8',
    borderRadius: 10,
    height: 50,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  trackButtonDisabled: {
    backgroundColor: '#b0e8f5',
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loadingMoreText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
});

export default CustomerOrders;
