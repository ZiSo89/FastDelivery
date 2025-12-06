import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Vibration,
  Modal,
  TextInput,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storeService } from '../services/api';
import socketService from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { useNewOrders } from '../../App';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

// Order Timer Component - Count UP
const OrderTimer = ({ acceptedAt, status }) => {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!acceptedAt || status === 'completed' || status === 'cancelled') {
      setElapsed('');
      return;
    }

    const updateTimer = () => {
      const start = new Date(acceptedAt).getTime();
      const now = Date.now();
      const diff = Math.floor((now - start) / 1000);

      if (diff < 60) {
        setElapsed(`${diff}δ`);
      } else if (diff < 3600) {
        const mins = Math.floor(diff / 60);
        setElapsed(`${mins}λ`);
      } else {
        const hours = Math.floor(diff / 3600);
        const mins = Math.floor((diff % 3600) / 60);
        setElapsed(`${hours}ω ${mins}λ`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [acceptedAt, status]);

  if (!elapsed) return null;

  return (
    <View style={styles.timerBadge}>
      <Ionicons name="time-outline" size={14} color="#666" />
      <Text style={styles.timerText}>{elapsed}</Text>
    </View>
  );
};

// Audio Player Component
const AudioPlayer = ({ voiceUrl, orderId }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Format time (seconds to mm:ss)
  const formatTime = (millis) => {
    if (!millis || millis < 0) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Load audio
  const loadAudio = async () => {
    try {
      setIsLoading(true);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: voiceUrl },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      setIsLoaded(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading audio:', error);
      setIsLoading(false);
    }
  };

  // Playback status update
  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis || 0);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    }
  };

  // Play/Pause toggle
  const togglePlayPause = async () => {
    if (!sound) {
      await loadAudio();
      return;
    }

    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      // If at end, restart
      if (position >= duration - 100) {
        await sound.setPositionAsync(0);
      }
      await sound.playAsync();
    }
  };

  // Seek to position
  const seekTo = async (value) => {
    if (sound && isLoaded) {
      const seekPosition = value * duration;
      await sound.setPositionAsync(seekPosition);
      setPosition(seekPosition);
    }
  };

  // Skip backward 5 seconds
  const skipBackward = async () => {
    if (sound && isLoaded) {
      const newPosition = Math.max(0, position - 5000);
      await sound.setPositionAsync(newPosition);
    }
  };

  // Skip forward 5 seconds
  const skipForward = async () => {
    if (sound && isLoaded) {
      const newPosition = Math.min(duration, position + 5000);
      await sound.setPositionAsync(newPosition);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={audioStyles.container}>
      {/* Waveform/Progress Bar */}
      <View style={audioStyles.progressContainer}>
        <TouchableOpacity
          style={audioStyles.progressBar}
          onPress={(e) => {
            const { locationX } = e.nativeEvent;
            const barWidth = width - 100; // Approximate width
            const percentage = Math.max(0, Math.min(1, locationX / barWidth));
            seekTo(percentage);
          }}
          activeOpacity={0.9}
        >
          <View style={audioStyles.progressBackground}>
            <View style={[audioStyles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={[audioStyles.progressThumb, { left: `${progress * 100}%` }]} />
        </TouchableOpacity>
      </View>

      {/* Time Display */}
      <View style={audioStyles.timeContainer}>
        <Text style={audioStyles.timeText}>{formatTime(position)}</Text>
        <Text style={audioStyles.timeText}>{formatTime(duration)}</Text>
      </View>

      {/* Controls */}
      <View style={audioStyles.controls}>
        <TouchableOpacity
          style={audioStyles.skipButton}
          onPress={skipBackward}
          disabled={!isLoaded}
        >
          <Ionicons name="play-back" size={20} color={isLoaded ? '#333' : '#ccc'} />
          <Text style={[audioStyles.skipText, !isLoaded && { color: '#ccc' }]}>-5s</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={audioStyles.playButton}
          onPress={togglePlayPause}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={28}
              color="#fff"
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={audioStyles.skipButton}
          onPress={skipForward}
          disabled={!isLoaded}
        >
          <Text style={[audioStyles.skipText, !isLoaded && { color: '#ccc' }]}>+5s</Text>
          <Ionicons name="play-forward" size={20} color={isLoaded ? '#333' : '#ccc'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Audio Player Styles
const audioStyles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 24,
    justifyContent: 'center',
  },
  progressBackground: {
    height: 6,
    backgroundColor: '#dee2e6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00c1e8',
    borderRadius: 3,
  },
  progressThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00c1e8',
    top: 4,
    marginLeft: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00c1e8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00c1e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 2,
  },
  skipText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
});

// Tab definitions
const TABS = [
  { key: 'new', label: 'Νέες', icon: 'notifications', statuses: ['pending_store'] },
  { key: 'preparing', label: 'Ετοιμασία', icon: 'restaurant', statuses: ['pricing', 'pending_admin', 'pending_customer_confirm', 'confirmed', 'assigned', 'accepted_driver'] },
  { key: 'ready', label: 'Έτοιμες', icon: 'checkmark-circle', statuses: ['preparing', 'in_delivery'] },
];

const OrdersScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { resetNewOrderCount } = useNewOrders();
  const insets = useSafeAreaInsets();
  
  const [activeTab, setActiveTab] = useState('new');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  
  // Modals
  const [priceModal, setPriceModal] = useState({ visible: false, order: null });
  const [rejectModal, setRejectModal] = useState({ visible: false, orderId: null });
  const [priceValue, setPriceValue] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  // Refs
  const ordersRef = useRef([]);
  ordersRef.current = orders;
  const priceInputRef = useRef(null);

  // Get statuses for current tab
  const getCurrentStatuses = useCallback(() => {
    const tab = TABS.find(t => t.key === activeTab);
    return tab?.statuses || [];
  }, [activeTab]);

  // Fetch orders
  const fetchOrders = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      // Fetch all recent orders
      const response = await storeService.getOrders(null, 1, 100);
      const allOrders = response.orders || response.data || [];
      
      // Filter by last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentOrders = allOrders.filter(order => 
        new Date(order.createdAt) >= oneDayAgo
      );
      
      setOrders(recentOrders);
      
      // Reset badge when viewing new orders tab
      if (activeTab === 'new') {
        resetNewOrderCount();
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showAlert('error', 'Σφάλμα', 'Αποτυχία φόρτωσης παραγγελιών');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, showAlert, resetNewOrderCount]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, []);

  // Reset badge when switching to new tab
  useEffect(() => {
    if (activeTab === 'new') {
      resetNewOrderCount();
    }
  }, [activeTab, resetNewOrderCount]);

  // Filter orders by current tab
  const filteredOrders = orders.filter(order => 
    getCurrentStatuses().includes(order.status)
  );

  // Update single order in state
  const updateOrderInState = useCallback(async (orderId) => {
    try {
      const response = await storeService.getOrderById(orderId);
      const updatedOrder = response.order || response;
      
      setOrders(prev => {
        const exists = prev.find(o => o._id === orderId);
        if (exists) {
          return prev.map(o => o._id === orderId ? updatedOrder : o);
        }
        return [updatedOrder, ...prev];
      });
    } catch (error) {
      console.error('Error updating order:', error);
      fetchOrders();
    }
  }, [fetchOrders]);

  // Socket listeners
  useEffect(() => {
    if (!user) return;

    const handleNewOrder = (data) => {
      if (data.storeId === user._id) {
        console.log('🆕 New order received');
        Vibration.vibrate([0, 500, 200, 500]);
        updateOrderInState(data.orderId);
      }
    };

    const handleStatusChanged = (data) => {
      if (data.storeId === user._id) {
        console.log('📝 Order status changed:', data.newStatus);
        updateOrderInState(data.orderId);
      }
    };

    const handleOrderCancelled = (data) => {
      if (data.storeId === user._id) {
        setOrders(prev => prev.filter(o => o._id !== data.orderId));
      }
    };

    socketService.on('order:new', handleNewOrder);
    socketService.on('order:status_changed', handleStatusChanged);
    socketService.on('order:cancelled', handleOrderCancelled);
    socketService.on('driver:accepted', handleStatusChanged);
    socketService.on('order:completed', handleStatusChanged);
    socketService.on('order:confirmed', handleStatusChanged);
    // Additional events from admin actions
    socketService.on('order:price_ready', handleStatusChanged);
    socketService.on('order:assigned', handleStatusChanged);
    socketService.on('order:pending_admin', handleStatusChanged);

    return () => {
      socketService.off('order:new', handleNewOrder);
      socketService.off('order:status_changed', handleStatusChanged);
      socketService.off('order:cancelled', handleOrderCancelled);
      socketService.off('driver:accepted', handleStatusChanged);
      socketService.off('order:completed', handleStatusChanged);
      socketService.off('order:confirmed', handleStatusChanged);
      socketService.off('order:price_ready', handleStatusChanged);
      socketService.off('order:assigned', handleStatusChanged);
      socketService.off('order:pending_admin', handleStatusChanged);
    };
  }, [user, updateOrderInState]);

  // Handle accept & price (one-tap)
  const handleAcceptAndPrice = (order) => {
    setPriceModal({ visible: true, order });
    setPriceValue('');
  };

  // Submit accept & price
  const submitAcceptAndPrice = async () => {
    const { order } = priceModal;
    if (!priceValue || parseFloat(priceValue) <= 0) {
      showAlert('warning', 'Προσοχή', 'Εισάγετε έγκυρη τιμή');
      return;
    }

    try {
      setProcessingId(order._id);
      
      // Accept order
      await storeService.acceptOrder(order._id, true);
      
      // Small delay
      await new Promise(r => setTimeout(r, 300));
      
      // Set price
      await storeService.setPrice(order._id, parseFloat(priceValue));
      
      setPriceModal({ visible: false, order: null });
      await updateOrderInState(order._id);
      
      Vibration.vibrate(100);
    } catch (error) {
      showAlert('error', 'Σφάλμα', error.response?.data?.message || 'Αποτυχία επεξεργασίας');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle reject
  const handleReject = (orderId) => {
    setRejectModal({ visible: true, orderId });
    setRejectReason('');
  };

  // Submit reject
  const submitReject = async () => {
    const { orderId } = rejectModal;
    if (!rejectReason.trim()) {
      showAlert('warning', 'Προσοχή', 'Εισάγετε λόγο απόρριψης');
      return;
    }

    try {
      setProcessingId(orderId);
      await storeService.acceptOrder(orderId, false, rejectReason.trim());
      
      setRejectModal({ visible: false, orderId: null });
      setOrders(prev => prev.filter(o => o._id !== orderId));
    } catch (error) {
      showAlert('error', 'Σφάλμα', error.response?.data?.message || 'Αποτυχία απόρριψης');
    } finally {
      setProcessingId(null);
    }
  };

  // Mark as preparing (ready for pickup)
  const handleReady = async (orderId) => {
    try {
      setProcessingId(orderId);
      await storeService.updateStatus(orderId, 'preparing');
      await updateOrderInState(orderId);
      Vibration.vibrate(100);
    } catch (error) {
      showAlert('error', 'Σφάλμα', error.response?.data?.message || 'Αποτυχία ενημέρωσης');
    } finally {
      setProcessingId(null);
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
      pending_store: { bg: '#ffc107', label: 'Νέα', icon: 'alert-circle' },
      pricing: { bg: '#17a2b8', label: 'Τιμολόγηση', icon: 'pricetag' },
      pending_admin: { bg: '#00c1e8', label: 'Ορισμός Μεταφορικών', icon: 'hourglass' },
      pending_customer_confirm: { bg: '#fd7e14', label: 'Αναμονή Πελάτη', icon: 'time' },
      confirmed: { bg: '#28a745', label: 'Επιβεβαιωμένη', icon: 'checkmark' },
      assigned: { bg: '#6f42c1', label: 'Ανατέθηκε', icon: 'person' },
      accepted_driver: { bg: '#20c997', label: 'Ο οδηγός έρχεται', icon: 'bicycle' },
      preparing: { bg: '#fd7e14', label: 'Έτοιμη για τον οδηγό', icon: 'restaurant' },
      in_delivery: { bg: '#00c1e8', label: 'Σε Παράδοση', icon: 'navigate' },
    };
    const c = config[status] || { bg: '#6c757d', label: status, icon: 'help' };
    
    return (
      <View style={[styles.statusBadge, { backgroundColor: c.bg }]}>
        <Ionicons name={c.icon} size={14} color="#fff" />
        <Text style={styles.statusText}>{c.label}</Text>
      </View>
    );
  };

  // Count orders per tab
  const getTabCount = (tabKey) => {
    const tab = TABS.find(t => t.key === tabKey);
    return orders.filter(o => tab?.statuses.includes(o.status)).length;
  };

  // Render order card
  const renderOrderCard = ({ item: order }) => {
    const isNew = order.status === 'pending_store';
    const needsReadyButton = order.status === 'accepted_driver';
    const customerPhone = order.customer?.phone || order.customerPhone;

    return (
      <View style={[styles.orderCard, isNew && styles.orderCardNew]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.orderNumberContainer}>
            <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
            <OrderTimer acceptedAt={order.acceptedAt} status={order.status} />
          </View>
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
          <Text style={styles.customerAddress}>📍 {order.customer?.address || order.deliveryAddress || 'Χωρίς διεύθυνση'}</Text>
        </View>

        {/* Order Content */}
        <View style={styles.orderContent}>
          {order.orderType === 'voice' && (
            <View style={styles.voiceBadge}>
              <Ionicons name="mic" size={16} color="#fff" />
              <Text style={styles.voiceText}>Φωνητική Παραγγελία</Text>
            </View>
          )}
          {/* Voice Message Player */}
          {order.orderType === 'voice' && order.orderVoiceUrl && (
            <AudioPlayer voiceUrl={order.orderVoiceUrl} orderId={order._id} />
          )}
          <Text style={styles.orderText}>{order.orderContent || 'Χωρίς περιγραφή'}</Text>
        </View>

        {/* Price (if set) */}
        {order.productPrice != null && order.productPrice > 0 && (
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Τιμή Προϊόντων:</Text>
            <Text style={styles.priceValue}>€{Number(order.productPrice).toFixed(2)}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isNew && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleAcceptAndPrice(order)}
                disabled={processingId === order._id}
              >
                {processingId === order._id ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    <Text style={styles.actionButtonText}>Αποδοχή & Τιμή</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleReject(order._id)}
                disabled={processingId === order._id}
              >
                <Ionicons name="close-circle" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Απόρριψη</Text>
              </TouchableOpacity>
            </>
          )}
          
          {needsReadyButton && (
            <TouchableOpacity
              style={[styles.actionButton, styles.readyButton, { flex: 1 }]}
              onPress={() => handleReady(order._id)}
              disabled={processingId === order._id}
            >
              {processingId === order._id ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-done-circle" size={28} color="#fff" />
                  <Text style={styles.readyButtonText}>ΕΤΟΙΜΟ!</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        {TABS.map(tab => {
          const count = getTabCount(tab.key);
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons 
                name={tab.icon} 
                size={isTablet ? 28 : 24} 
                color={isActive ? '#00c1e8' : '#666'} 
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, tab.key === 'new' && styles.tabBadgeNew]}>
                  <Text style={styles.tabBadgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00c1e8" />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
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
                fetchOrders(true);
              }}
              colors={['#00c1e8']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                {activeTab === 'new' ? 'Δεν υπάρχουν νέες παραγγελίες' :
                 activeTab === 'preparing' ? 'Δεν υπάρχουν παραγγελίες σε ετοιμασία' :
                 'Δεν υπάρχουν έτοιμες παραγγελίες'}
              </Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: Math.max(insets.bottom, 34) + 100 }} />}
        />
      )}

      {/* Accept & Price Modal */}
      <Modal
        visible={priceModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setPriceModal({ visible: false, order: null })}
        onShow={() => {
          // Larger delay for tablets
          const delay = isTablet ? 300 : 100;
          setTimeout(() => {
            if (priceInputRef.current) {
              priceInputRef.current.focus();
              // Force keyboard on tablets
              if (isTablet) {
                priceInputRef.current.blur();
                setTimeout(() => priceInputRef.current?.focus(), 50);
              }
            }
          }, delay);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Αποδοχή & Τιμολόγηση</Text>
            
            {priceModal.order && (
              <View style={styles.modalOrderInfo}>
                <Text style={styles.modalOrderNumber}>#{priceModal.order.orderNumber}</Text>
                <Text style={styles.modalOrderContent}>{priceModal.order.orderContent}</Text>
              </View>
            )}

            <Text style={styles.modalLabel}>Τιμή Προϊόντων (€)</Text>
            <TextInput
              ref={priceInputRef}
              style={styles.modalInput}
              value={priceValue}
              onChangeText={setPriceValue}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#999"
              showSoftInputOnFocus={true}
              autoFocus={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setPriceModal({ visible: false, order: null })}
              >
                <Text style={styles.modalButtonCancelText}>Ακύρωση</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={submitAcceptAndPrice}
                disabled={!!processingId}
              >
                {processingId ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalButtonConfirmText}>Επιβεβαίωση</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal
        visible={rejectModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectModal({ visible: false, orderId: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Απόρριψη Παραγγελίας</Text>
            
            <Text style={styles.modalLabel}>Λόγος Απόρριψης</Text>
            <TextInput
              style={[styles.modalInput, styles.modalInputMultiline]}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="π.χ. Εκτός περιοχής, δεν έχουμε προϊόν..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setRejectModal({ visible: false, orderId: null })}
              >
                <Text style={styles.modalButtonCancelText}>Ακύρωση</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonReject]}
                onPress={submitReject}
                disabled={!!processingId}
              >
                {processingId ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalButtonConfirmText}>Απόρριψη</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#00c1e8',
  },
  tabLabel: {
    fontSize: isTablet ? 16 : 14,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#00c1e8',
    fontWeight: '600',
  },
  tabBadge: {
    position: 'absolute',
    top: 4,
    right: isTablet ? 30 : 20,
    backgroundColor: '#6c757d',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeNew: {
    backgroundColor: '#dc3545',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
    padding: isTablet ? 20 : 16,
    margin: isTablet ? 8 : 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderCardNew: {
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderNumber: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: 'bold',
    color: '#333',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  timerText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
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
    marginBottom: 12,
  },
  customerSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  customerName: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: isTablet ? 16 : 14,
    color: '#00c1e8',
    marginBottom: 4,
  },
  customerAddress: {
    fontSize: isTablet ? 15 : 13,
    color: '#666',
  },
  orderContent: {
    marginBottom: 12,
  },
  voiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#17a2b8',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 8,
  },
  voiceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  orderText: {
    fontSize: isTablet ? 16 : 15,
    color: '#333',
    lineHeight: 22,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e7f5ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: 'bold',
    color: '#00c1e8',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isTablet ? 16 : 14,
    borderRadius: 12,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#00c1e8',
    shadowColor: '#00c1e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  rejectButton: {
    backgroundColor: '#95a5a6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  readyButton: {
    backgroundColor: '#28a745',
    paddingVertical: isTablet ? 20 : 18,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
  },
  readyButtonText: {
    color: '#fff',
    fontSize: isTablet ? 22 : 20,
    fontWeight: 'bold',
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
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: isTablet ? 500 : 400,
  },
  modalTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOrderInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  modalOrderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00c1e8',
    marginBottom: 8,
  },
  modalOrderContent: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 16,
    fontSize: isTablet ? 24 : 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInputMultiline: {
    textAlign: 'left',
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f0f0f0',
  },
  modalButtonConfirm: {
    backgroundColor: '#28a745',
  },
  modalButtonReject: {
    backgroundColor: '#dc3545',
  },
  modalButtonCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrdersScreen;
