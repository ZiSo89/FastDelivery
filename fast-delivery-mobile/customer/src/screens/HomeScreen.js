import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { customerService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { id: 'all', label: 'Όλα', icon: '🍽️' },
  { id: 'coffee', label: 'Καφές', icon: '☕' },
  { id: 'food', label: 'Φαγητό', icon: '🍔' },
  { id: 'market', label: 'Market', icon: '🛒' },
  { id: 'sweets', label: 'Γλυκά', icon: '🍰' },
  { id: 'pharmacy', label: 'Φαρμακείο', icon: '💊' },
  { id: 'other', label: 'Άλλο', icon: '🏪' },
];

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(user?.address || 'Αλεξανδρούπολη'); 
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  const fitMapToMarkers = () => {
    if (filteredStores.length > 0 && mapRef.current) {
      const coordinates = filteredStores
        .filter(store => store.location && store.location.coordinates)
        .map(store => ({
          latitude: store.location.coordinates[1],
          longitude: store.location.coordinates[0],
        }));

      if (coordinates.length > 0) {
        // Add user location to bounds if available so user sees themselves relative to stores
        if (location) {
          coordinates.push({
            latitude: location.latitude,
            longitude: location.longitude
          });
        }

        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    }
  };

  useEffect(() => {
    if (viewMode === 'map') {
      // Try to fit immediately if map is already ready (e.g. switching back and forth)
      fitMapToMarkers();
      // Also set a small timeout to ensure map layout is complete
      setTimeout(fitMapToMarkers, 500);
    }
  }, [viewMode, filteredStores, location]);

  useEffect(() => {
    if (user?.address) {
      setAddress(user.address);
    }
  }, [user]);

  useEffect(() => {
    (async () => {
      // 1. Check if user has a saved location in their profile
      if (user?.location?.coordinates) {
        const [lng, lat] = user.location.coordinates;
        setLocation({ latitude: lat, longitude: lng });
        return;
      }

      // 2. Fallback to GPS if no user location
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          // Load stores with default location if permission denied
          loadStores();
          return;
        }

        // Try to get last known position first (Very fast)
        let lastKnown = await Location.getLastKnownPositionAsync({});
        if (lastKnown) {
          setLocation(lastKnown.coords);
        }

        // Get fresh current position
        let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation(loc.coords);
      } catch (error) {
        // Fallback to default location
        loadStores();
      }
    })();
  }, [user]); // Re-run if user changes (e.g. login)

  useEffect(() => {
    if (location) {
      loadStores();
    }
  }, [location]);

  useEffect(() => {
    filterStores();
  }, [stores, activeCategory, searchTerm]);

  const loadStores = async () => {
    try {
      // Only show full loading state if we don't have data yet
      if (stores.length === 0) {
        setLoading(true);
      }
      
      const lat = location ? location.latitude : 40.8457;
      const lng = location ? location.longitude : 25.8733;
      console.log('📍 Loading stores for location:', lat, lng);
      
      const response = await customerService.getStores(lat, lng);
      console.log('🏪 Stores loaded:', response.data.stores?.length);
      
      setStores(response.data.stores || []);
    } catch (error) {
      console.error('❌ Error loading stores:', error);
      // Silent fail - just log error
    } finally {
      setLoading(false);
    }
  };

  const filterStores = () => {
    let result = stores;

    // Filter by Category
    if (activeCategory !== 'all') {
      const typeMap = {
        'coffee': 'Καφετέρια',
        'food': 'Ταβέρνα',
        'market': 'Mini Market',
        'sweets': 'Γλυκά',
        'pharmacy': 'Φαρμακείο',
        'other': 'Άλλο'
      };
      const targetType = typeMap[activeCategory];
      result = result.filter(store => store.storeType === targetType);
    }

    // Filter by Search
    if (searchTerm) {
      result = result.filter(store => 
        store.businessName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredStores(result);
  };

  const handleLogout = () => {
    Alert.alert(
      "Αποσύνδεση",
      "Είστε σίγουροι ότι θέλετε να αποσυνδεθείτε;",
      [
        { text: "Ακύρωση", style: "cancel" },
        { text: "Αποσύνδεση", onPress: logout, style: "destructive" }
      ]
    );
  };

  const getInitials = () => {
    if (!user) return 'G';
    // Check for 'name' field first (as used in User/Customer model)
    const name = user.name || '';
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      } else if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
      }
    }
    
    // Fallback to firstName/lastName if they exist (legacy)
    const first = user.firstName ? user.firstName.charAt(0).toUpperCase() : '';
    const last = user.lastName ? user.lastName.charAt(0).toUpperCase() : '';
    return (first + last) || 'U';
  };

  const getStoreIcon = (type) => {
    switch(type) {
      case 'Καφετέρια': return '☕';
      case 'Mini Market': return '🛒';
      case 'Ταβέρνα': return '🍔';
      case 'Γλυκά': return '🍰';
      case 'Φαρμακείο': return '💊';
      default: return '🏪';
    }
  };

  const renderStoreItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('Order', { store: item })}
      activeOpacity={0.9}
    >
      <View style={styles.cardImagePlaceholder}>
        <Text style={styles.cardEmoji}>{getStoreIcon(item.storeType)}</Text>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.storeName}>{item.businessName}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>★ 4.5</Text>
          </View>
        </View>
        <Text style={styles.storeMeta}>{item.storeType} • {item.workingHours || '09:00 - 23:00'}</Text>
        <Text style={styles.storeAddress}>{item.address}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.locationPill}>
          <Ionicons name="location" size={16} color="#00c2e8" />
          <Text style={styles.locationText} numberOfLines={1}>{address}</Text>
          <Ionicons name="chevron-down" size={12} color="#666" />
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={handleLogout}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search Bar (Conditional) */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Αναζήτηση καταστήματος..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoFocus
          />
          <TouchableOpacity onPress={() => { setShowSearch(false); setSearchTerm(''); }}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content */}
      <View style={styles.content}>
        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity 
                key={cat.id} 
                style={[styles.categoryChip, activeCategory === cat.id && styles.activeCategoryChip]}
                onPress={() => setActiveCategory(cat.id)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={[styles.categoryLabel, activeCategory === cat.id && styles.activeCategoryLabel]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* View Toggle & Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {viewMode === 'list' ? 'Κοντά σας' : 'Χάρτης'}
          </Text>
          <View style={styles.toggleGroup}>
            <TouchableOpacity 
              style={[styles.toggleBtn, viewMode === 'list' && styles.activeToggleBtn]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons name="list" size={16} color={viewMode === 'list' ? '#fff' : '#00c2e8'} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, viewMode === 'map' && styles.activeToggleBtn]}
              onPress={() => setViewMode('map')}
            >
              <Ionicons name="map" size={16} color={viewMode === 'map' ? '#fff' : '#00c2e8'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* List or Map */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00c2e8" />
            <Text style={styles.loadingText}>Φόρτωση καταστημάτων...</Text>
          </View>
        ) : viewMode === 'list' ? (
          <FlatList
            data={filteredStores}
            renderItem={renderStoreItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Δεν βρέθηκαν καταστήματα</Text>
            }
          />
        ) : (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              onMapReady={fitMapToMarkers}
              initialRegion={{
                latitude: location ? location.latitude : 40.8457,
                longitude: location ? location.longitude : 25.8733,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              showsUserLocation={!user?.location} // Only show GPS dot if no user address
            >
              {/* User Address Marker */}
              {user?.location?.coordinates && (
                <Marker
                  coordinate={{
                    latitude: user.location.coordinates[1],
                    longitude: user.location.coordinates[0],
                  }}
                  title="Η διεύθυνσή μου"
                  description={user.address}
                >
                  <View style={styles.userLocationMarker}>
                    <Ionicons name="home" size={16} color="#fff" />
                  </View>
                </Marker>
              )}

              {filteredStores.map(store => {
                // Check if store has valid location data
                // GeoJSON format: { type: "Point", coordinates: [longitude, latitude] }
                if (store.location && store.location.coordinates && store.location.coordinates.length === 2) {
                  return (
                    <Marker
                      key={store._id}
                      coordinate={{
                        latitude: store.location.coordinates[1], // Latitude is 2nd element in GeoJSON
                        longitude: store.location.coordinates[0], // Longitude is 1st element in GeoJSON
                      }}
                      title={store.businessName}
                      description={store.storeType}
                      onCalloutPress={() => navigation.navigate('Order', { store })}
                    />
                  );
                }
                return null;
              })}
            </MapView>
          </View>
        )}
      </View>

      {/* Bottom Navigation - REMOVED as we use Tab Navigator now */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    flex: 1,
    marginRight: 15,
  },
  locationText: {
    marginHorizontal: 8,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  profileButton: {
    padding: 2,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    paddingBottom: 10,
  },
  categoriesScroll: {
    paddingHorizontal: 15,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  activeCategoryChip: {
    backgroundColor: '#e6f9fc',
    borderColor: '#00c2e8',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryLabel: {
    fontWeight: '600',
    color: '#666',
  },
  activeCategoryLabel: {
    color: '#00c2e8',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00c2e8',
    overflow: 'hidden',
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  activeToggleBtn: {
    backgroundColor: '#00c2e8',
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImagePlaceholder: {
    height: 120,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardEmoji: {
    fontSize: 50,
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingContainer: {
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  storeMeta: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  storeAddress: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#999',
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 10,
    marginTop: 4,
    color: '#999',
  },
  activeNavLabel: {
    color: '#00c2e8',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  userLocationMarker: {
    backgroundColor: '#00c2e8',
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});

export default HomeScreen;
