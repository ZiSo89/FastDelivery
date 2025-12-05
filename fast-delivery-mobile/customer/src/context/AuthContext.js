import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { customerService, healthCheck, checkAppVersion } from '../services/api';
import socketService from '../services/socket';
import { checkVersionUpdate } from '../utils/versionUtils';

// Safe import for expo-notifications
let Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.log('expo-notifications not available');
}

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverReady, setServerReady] = useState(false);
  const [serverStatus, setServerStatus] = useState('Σύνδεση με τον server...');
  const [expoPushToken, setExpoPushToken] = useState('');
  
  // App update state
  const [updateInfo, setUpdateInfo] = useState({
    showModal: false,
    forceUpdate: false,
    storeUrl: ''
  });

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // Step 1: Wake up server (MongoDB cold start fix)
    console.log('🚀 Starting initializeApp...');
    setServerStatus('Εκκίνηση συστήματος...');
    const healthResult = await healthCheck(3);
    console.log('🏥 Health check result:', healthResult);
    
    if (healthResult.success) {
      setServerReady(true);
      
      // Step 2: Check app version (skip in development)
      if (!__DEV__) {
        await performVersionCheck();
      }
      
      setServerStatus('Έλεγχος σύνδεσης...');
      // Step 3: Load user
      console.log('👤 Loading user...');
      await loadUser();
      console.log('✅ User loaded');
    } else {
      console.log('❌ Health check failed');
      setServerStatus('Αδυναμία σύνδεσης. Ελέγξτε το internet.');
      // Still allow app to load after delay
      setTimeout(() => {
        setServerReady(true);
        loadUser();
      }, 3000);
    }
  };

  const performVersionCheck = async () => {
    try {
      const currentVersion = Constants.expoConfig?.version || '1.0.0';
      const platform = Platform.OS; // 'android' or 'ios'
      
      console.log('📱 Checking app version:', currentVersion, 'on', platform);
      
      const result = await checkAppVersion('customer', platform);
      
      if (result.success && result.data?.version) {
        const versionInfo = result.data.version;
        const updateCheck = checkVersionUpdate(currentVersion, versionInfo);
        
        console.log('📱 Version check result:', updateCheck);
        
        if (updateCheck.needsUpdate) {
          setUpdateInfo({
            showModal: true,
            forceUpdate: updateCheck.forceUpdate,
            storeUrl: updateCheck.storeUrl
          });
        }
      }
    } catch (error) {
      console.log('📱 Version check error (continuing):', error.message);
      // Don't block app usage if version check fails
    }
  };

  const dismissUpdateModal = () => {
    if (!updateInfo.forceUpdate) {
      setUpdateInfo(prev => ({ ...prev, showModal: false }));
    }
  };

  const registerForPushNotificationsAsync = async () => {
    // Skip if Notifications not available
    if (!Notifications) {
      console.log('📱 Push: Notifications module not available');
      return null;
    }
    
    let token;
    try {
      // For emulator testing, we skip the isDevice check
      // In production, Device.isDevice will be true on real phones
      const isRealDevice = Device.isDevice;
      console.log('📱 Push: Starting registration, isDevice:', isRealDevice);
      
      // Try to get permissions regardless of device type
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('📱 Push: Existing permission status:', existingStatus);
      
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('📱 Push: Requested permission, new status:', finalStatus);
      }
      if (finalStatus !== 'granted') {
        console.log('📱 Push: Permission denied');
        return null;
      }
      
      // Get push token with projectId for standalone builds
      console.log('📱 Push: Getting Expo push token...');
      try {
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: '7eec880b-7918-467c-96c8-7dad2d531d01'
        })).data;
        console.log('📱 Push: Got token:', token);
      } catch (tokenError) {
        console.log('📱 Push: Could not get token (emulator?):', tokenError.message);
        // Continue without push token - app still works
      }

      if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance?.MAX || 4,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });
        console.log('📱 Push: Android notification channel created');
      }
    } catch (error) {
      console.log('📱 Push: Error getting token:', error.message);
      return null;
    }

    return token;
  };

  const loadUser = async () => {
    try {
      const storedUser = await SecureStore.getItemAsync('user');
      const token = await SecureStore.getItemAsync('token');
      
      if (storedUser && token) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        socketService.connect();
        
        // Join user specific room using PHONE number (as used in backend notifications)
        if (userData.phone) {
            socketService.joinRoom({ role: 'customer', userId: userData.phone });
        }

        // Register for push notifications
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken) {
          setExpoPushToken(pushToken);
          // Update user profile with push token if it's different or not set
          if (userData.pushToken !== pushToken) {
             try {
               await customerService.updateProfile({ pushToken });
             } catch (err) {
               // Silent fail
             }
          }
        }
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await customerService.login({ email, password, role: 'customer' });
      const { token, user } = response.data;

      await SecureStore.setItemAsync('token', token);
      await SecureStore.setItemAsync('user', JSON.stringify(user));

      setUser(user);
      socketService.connect();
      // Join using PHONE
      if (user.phone) {
        socketService.joinRoom({ role: 'customer', userId: user.phone });
      }

      // Register for push notifications (don't await - do in background)
      registerForPushNotificationsAsync().then(pushToken => {
        if (pushToken) {
          setExpoPushToken(pushToken);
          customerService.updateProfile({ pushToken }).catch(() => {});
        }
      });

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Σφάλμα κατά τη σύνδεση' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await customerService.register(userData);
      
      // Check if email verification is needed (production mode)
      if (response.data.needsVerification) {
        return { 
          success: true, 
          needsVerification: true,
          message: response.data.message || 'Ελέγξτε το email σας για επιβεβαίωση.'
        };
      }
      
      const { token, user } = response.data;

      await SecureStore.setItemAsync('token', token);
      await SecureStore.setItemAsync('user', JSON.stringify(user));

      setUser(user);
      socketService.connect();
      // Join using PHONE
      if (user.phone) {
        socketService.joinRoom({ role: 'customer', userId: user.phone });
      }

      // Register for push notifications
      const pushToken = await registerForPushNotificationsAsync();
      if (pushToken) {
        setExpoPushToken(pushToken);
        try {
          await customerService.updateProfile({ pushToken });
        } catch (err) {
          // Silent fail
        }
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Σφάλμα κατά την εγγραφή' 
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

  const refreshUser = async () => {
    try {
      // Get updated user data from server
      const response = await customerService.updateProfile({});
      if (response.data?.user) {
        const updatedUser = response.data.user;
        await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      console.log('Failed to refresh user:', error);
    }
  };

  const loginAsGuest = () => {
    setUser({ isGuest: true, name: 'Επισκέπτης' });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      serverReady, 
      serverStatus, 
      login, 
      register, 
      logout, 
      loginAsGuest,
      refreshUser,
      updateInfo,
      dismissUpdateModal
    }}>
      {children}
    </AuthContext.Provider>
  );
};
