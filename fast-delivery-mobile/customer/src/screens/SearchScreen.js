import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { customerService } from '../services/api';
import api from '../services/api';

// Default icon for unknown types (fallback)
const DEFAULT_ICON = '🏪';

const SearchScreen = ({ navigation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeTypeIcons, setStoreTypeIcons] = useState({});

  // Fetch store types for icons from backend
  useEffect(() => {
    const fetchStoreTypes = async () => {
      try {
        const response = await api.get('/auth/store-types');
        if (response.data.success && response.data.storeTypes?.length > 0) {
          // Build icon mapping from backend data
          const iconMap = {};
          response.data.storeTypes.forEach(type => {
            if (typeof type === 'object' && type.name) {
              iconMap[type.name] = type.icon || DEFAULT_ICON;
            } else if (typeof type === 'string') {
              // Fallback for old string format
              iconMap[type] = DEFAULT_ICON;
            }
          });
          setStoreTypeIcons(iconMap);
        }
      } catch (error) {
        console.log('Error fetching store types:', error);
      }
    };
    fetchStoreTypes();
  }, []);

  // Load stores on mount - no location permission needed for search
  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStores(stores);
    } else {
      const filtered = stores.filter(store => 
        store.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.storeType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStores(filtered);
    }
  }, [searchTerm, stores]);

  const loadStores = async () => {
    try {
      // Only show full loading indicator if we have no stores yet
      if (stores.length === 0) setLoading(true);
      
      // Use default location - no need for permission in search screen
      const lat = 40.8457;
      const lng = 25.8733;
      const response = await customerService.getStores(lat, lng);
      setStores(response.data.stores || []);
      
      // If we already have a search term, filter immediately
      if (searchTerm.trim() !== '') {
         const filtered = (response.data.stores || []).filter(store => 
          store.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          store.storeType?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredStores(filtered);
      } else {
        setFilteredStores(response.data.stores || []);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStoreIcon = (type) => {
    return storeTypeIcons[type] || DEFAULT_ICON;
  };

  const renderStoreItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('Order', { store: item })}
    >
      <View style={styles.cardIcon}>
        <Text style={styles.emoji}>{getStoreIcon(item.storeType)}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.storeName}>{item.businessName}</Text>
        <Text style={styles.storeType}>{item.storeType}</Text>
        <Text style={styles.storeAddress}>{item.address}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Αναζήτηση καταστήματος..."
            placeholderTextColor="#666"
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoFocus={false}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && stores.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#00c1e8" />
        </View>
      ) : (
        <FlatList
          data={filteredStores}
          renderItem={renderStoreItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Δεν βρέθηκαν αποτελέσματα</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 20,
  },
  cardContent: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  storeType: {
    fontSize: 13,
    color: '#00c1e8',
    marginBottom: 2,
  },
  storeAddress: {
    fontSize: 12,
    color: '#999',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});

export default SearchScreen;
