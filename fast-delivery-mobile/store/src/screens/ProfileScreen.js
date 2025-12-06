import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storeService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const ProfileScreen = () => {
  const { user, updateUser, logout } = useAuth();
  const { showAlert } = useAlert();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(user?.isOnline || false);
  const [togglingOnline, setTogglingOnline] = useState(false);

  // Fetch profile
  const fetchProfile = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const response = await storeService.getProfile();
      const storeData = response.store || response.data || response;
      setProfile(storeData);
      setIsOnline(storeData.isOnline || false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      showAlert('error', 'Σφάλμα', 'Αποτυχία φόρτωσης προφίλ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showAlert]);

  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Toggle online status
  const toggleOnlineStatus = async () => {
    try {
      setTogglingOnline(true);
      const newStatus = !isOnline;
      
      await storeService.toggleOnlineStatus(newStatus);
      setIsOnline(newStatus);
      
      // Update user context
      updateUser({ ...user, isOnline: newStatus });
      
      showAlert(
        'success',
        newStatus ? 'Online!' : 'Offline',
        newStatus ? 'Το κατάστημα είναι ανοιχτό για παραγγελίες' : 'Το κατάστημα είναι κλειστό'
      );
    } catch (error) {
      console.error('Error toggling status:', error);
      showAlert('error', 'Σφάλμα', 'Αποτυχία αλλαγής κατάστασης');
      // Revert switch
      setIsOnline(!isOnline);
    } finally {
      setTogglingOnline(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    showAlert('warning', 'Αποσύνδεση', 'Είστε σίγουροι ότι θέλετε να αποσυνδεθείτε;');
    // For now, just logout. In a real app, you'd show a confirm dialog
    setTimeout(() => logout(), 1500);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00c1e8" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchProfile(true);
          }}
          colors={['#00c1e8']}
        />
      }
    >
      {/* Online Status Card */}
      <View style={[styles.card, styles.statusCard, isOnline && styles.statusCardOnline]}>
        <View style={styles.statusContent}>
          <View style={styles.statusIcon}>
            <Ionicons 
              name={isOnline ? 'radio-button-on' : 'radio-button-off'} 
              size={32} 
              color={isOnline ? '#28a745' : '#dc3545'} 
            />
          </View>
          <View style={styles.statusText}>
            <Text style={styles.statusLabel}>Κατάσταση Καταστήματος</Text>
            <Text style={[styles.statusValue, { color: isOnline ? '#28a745' : '#dc3545' }]}>
              {isOnline ? 'ΑΝΟΙΧΤΟ' : 'ΚΛΕΙΣΤΟ'}
            </Text>
          </View>
        </View>
        <Switch
          value={isOnline}
          onValueChange={toggleOnlineStatus}
          disabled={togglingOnline}
          trackColor={{ false: '#ffcccc', true: '#c3e6cb' }}
          thumbColor={isOnline ? '#28a745' : '#dc3545'}
          style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
        />
      </View>

      {/* Store Info Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="storefront" size={24} color="#00c1e8" />
          <Text style={styles.cardTitle}>Στοιχεία Καταστήματος</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="business" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Επωνυμία</Text>
            <Text style={styles.infoValue}>{profile?.businessName || profile?.storeName || '-'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="pricetag" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Τύπος</Text>
            <Text style={styles.infoValue}>{profile?.storeType || '-'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="mail" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profile?.email || user?.email || '-'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="call" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Τηλέφωνο</Text>
            <Text style={styles.infoValue}>{profile?.phone || '-'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Διεύθυνση</Text>
            <Text style={styles.infoValue}>{profile?.address || '-'}</Text>
          </View>
        </View>

        {profile?.workingHours && (
          <View style={styles.infoRow}>
            <Ionicons name="time" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Ωράριο</Text>
              <Text style={styles.infoValue}>{profile.workingHours}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Account Status Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="shield-checkmark" size={24} color="#00c1e8" />
          <Text style={styles.cardTitle}>Κατάσταση Λογαριασμού</Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusRowLabel}>Κατάσταση:</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: profile?.status === 'approved' ? '#28a745' : '#ffc107' }
          ]}>
            <Text style={styles.statusBadgeText}>
              {profile?.status === 'approved' ? 'Εγκεκριμένο' : 'Σε Αναμονή'}
            </Text>
          </View>
        </View>

        {profile?.afm && (
          <View style={styles.infoRow}>
            <Ionicons name="document-text" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>ΑΦΜ</Text>
              <Text style={styles.infoValue}>{profile.afm}</Text>
            </View>
          </View>
        )}
      </View>

      {/* App Info */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="information-circle" size={24} color="#00c1e8" />
          <Text style={styles.cardTitle}>Πληροφορίες Εφαρμογής</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="phone-portrait" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Έκδοση</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={24} color="#fff" />
        <Text style={styles.logoutButtonText}>Αποσύνδεση</Text>
      </TouchableOpacity>

      {/* Footer */}
      <Text style={styles.footer}>
        © 2025 Fast Delivery - Store Manager
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: isTablet ? 24 : 16,
    maxWidth: isTablet ? 600 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: isTablet ? 24 : 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#dc3545',
  },
  statusCardOnline: {
    borderColor: '#28a745',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 16,
  },
  statusText: {},
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusValue: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  cardTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: '600',
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: isTablet ? 17 : 16,
    color: '#333',
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  statusRowLabel: {
    fontSize: 16,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
    gap: 12,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 24,
    marginBottom: 32,
  },
});

export default ProfileScreen;
