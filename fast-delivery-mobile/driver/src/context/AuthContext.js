import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import { Platform, AppState } from 'react-native';
import Constants from 'expo-constants';

// Safe import for expo-notifications
let Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.log('expo-notifications not available in AuthContext');
}
import { driverService, publicService } from '../services/api';
import socketService from '../services/socket';
import { checkVersionUpdate } from '../utils/versionUtils';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

// Configure notifications to show even when app is in foreground (only if available)
if (Notifications && Notifications.setNotificationHandler) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [updateInfo, setUpdateInfo] = useState(null); // { needsUpdate, forceUpdate, storeUrl }

  useEffect(() => {
    loadUser();
    performVersionCheck();
  }, []);

  // Version check on app start
  const performVersionCheck = async () => {
    try {
      const response = await publicService.checkAppVersion();
      const versions = response.data?.versions;
      
      if (!versions?.driver) {
        console.log('📱 Version: No driver version info from server');
        return;
      }

      // Get current app version
      const currentVersion = Constants.expoConfig?.version || Constants.manifest?.version || '1.0.0';
      const platform = Platform.OS; // 'android' or 'ios'
      
      // Get version info for current platform
      const platformVersions = versions.driver[platform];
      if (!platformVersions) {
        console.log(`📱 Version: No ${platform} version info`);
        return;
      }

      const result = checkVersionUpdate(currentVersion, platformVersions);
      console.log(`📱 Version check: current=${currentVersion}, latest=${platformVersions.latest}, min=${platformVersions.minimum}`);
      
      if (result.needsUpdate) {
        console.log(`📱 Version: Update needed, force=${result.forceUpdate}`);
        setUpdateInfo(result);
      }
    } catch (error) {
      console.log('📱 Version check failed:', error.message);
    }
  };

  const dismissUpdateModal = () => {
    // Only dismiss if not a force update
    if (updateInfo && !updateInfo.forceUpdate) {
      setUpdateInfo(null);
    }
  };

  // Handle app state changes for reconnection - separate effect
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && user) {
        console.log('📱 App became active, reconnecting socket...');
        // Force reconnect when app becomes active
        if (!socketService.isConnected()) {
          socketService.connect();
        }
        socketService.joinRoom({ role: 'driver', userId: user._id });
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [user]);

  const registerForPushNotificationsAsync = async () => {
    let token = null;
    
    // Check if Notifications is available
    if (!Notifications) {
      console.log('Notifications not available, skipping push registration');
      return null;
    }
    
    try {
      if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
        await Notifications.setNotificationChannelAsync('orders', {
          name: 'Παραγγελίες',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#00c2e8',
          sound: 'default',
          enableVibrate: true,
          enableLights: true,
        });
      }

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          return null;
        }
        
        // Try to get native FCM token first (for standalone builds)
        try {
          const deviceToken = await Notifications.getDevicePushTokenAsync();
          if (deviceToken && deviceToken.data) {
            console.log('📱 Push: Got FCM device token:', deviceToken.data.substring(0, 30) + '...');
            // Return as Expo-compatible format for FCM
            token = deviceToken.data;
            return { type: 'fcm', token: deviceToken.data };
          }
        } catch (fcmError) {
          console.log('📱 Push: FCM not available, trying Expo token...');
        }
        
        // Fallback to Expo push token (for development/Expo Go)
        try {
          token = (await Notifications.getExpoPushTokenAsync({
            projectId: '7d7f4652-50aa-4515-8e0a-b2a83cc2abe9'
          })).data;
          console.log('📱 Push: Got Expo token for driver:', token);
          return { type: 'expo', token };
        } catch (tokenError) {
          console.log('📱 Push: Could not get token:', tokenError.message);
        }
      } else {
        // Must use physical device for Push Notifications
      }
    } catch (error) {
      console.log('📱 Push: Error:', error.message);
    }

    return null;
  };

  const loadUser = async () => {
    try {
      const storedUser = await SecureStore.getItemAsync('user');
      const token = await SecureStore.getItemAsync('token');
      
      if (storedUser && token) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Connect socket and join driver room
        socketService.connect();
        socketService.joinRoom({ role: 'driver', userId: userData._id });

        // Register for push notifications
        const pushResult = await registerForPushNotificationsAsync();
        if (pushResult) {
          setExpoPushToken(pushResult.token);
          // Send push token to backend with type
          try {
            await driverService.updatePushToken(pushResult.token, pushResult.type);
          } catch (e) {
            console.log('Failed to update push token on server');
          }
        }
      }
    } catch (error) {
      // Error loading user
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await driverService.login({ email, password });
      const { token, user: userData } = response.data;

      await SecureStore.setItemAsync('token', token);
      await SecureStore.setItemAsync('user', JSON.stringify(userData));

      setUser(userData);
      
      // Connect socket
      socketService.connect();
      socketService.joinRoom({ role: 'driver', userId: userData._id });

      // Register for push notifications
      const pushResult = await registerForPushNotificationsAsync();
      if (pushResult) {
        setExpoPushToken(pushResult.token);
        // Send push token to backend with type
        try {
          await driverService.updatePushToken(pushResult.token, pushResult.type);
        } catch (e) {
          console.log('Failed to update push token on server');
        }
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Σφάλμα κατά τη σύνδεση' 
      };
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      setUser(null);
      socketService.disconnect();
    } catch (error) {
      // Silent fail
    }
  };

  const updateUser = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
    SecureStore.setItemAsync('user', JSON.stringify({ ...user, ...updatedData }));
  };

  const refreshUser = async () => {
    try {
      const response = await driverService.getProfile();
      const driverData = response.data.driver || response.data;
      setUser(prev => ({ ...prev, ...driverData }));
      await SecureStore.setItemAsync('user', JSON.stringify({ ...user, ...driverData }));
      return driverData;
    } catch (error) {
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      updateUser, 
      refreshUser,
      expoPushToken,
      updateInfo,
      dismissUpdateModal
    }}>
      {children}
    </AuthContext.Provider>
  );
};
