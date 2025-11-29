import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import { Platform, AppState } from 'react-native';

// Safe import for expo-notifications
let Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.log('expo-notifications not available in AuthContext');
}
import { driverService } from '../services/api';
import socketService from '../services/socket';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

// Configure notifications to show even when app is in foreground (only if available)
if (Notifications && Notifications.setNotificationHandler) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expoPushToken, setExpoPushToken] = useState('');

  useEffect(() => {
    loadUser();
    
    // Handle app state changes for reconnection
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && user) {
        socketService.connect();
        socketService.joinRoom({ role: 'driver', userId: user._id });
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

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
        
        // Note: Push notifications don't work fully in Expo Go
        // For full functionality, use a development build
        try {
          token = (await Notifications.getExpoPushTokenAsync()).data;
        } catch (tokenError) {
          // Push token not available in Expo Go
        }
      } else {
        // Must use physical device for Push Notifications
      }
    } catch (error) {
      // Error setting up notifications
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
        
        // Connect socket and join driver room
        socketService.connect();
        socketService.joinRoom({ role: 'driver', userId: userData._id });

        // Register for push notifications
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken) {
          setExpoPushToken(pushToken);
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
      const pushToken = await registerForPushNotificationsAsync();
      if (pushToken) {
        setExpoPushToken(pushToken);
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
      expoPushToken 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
