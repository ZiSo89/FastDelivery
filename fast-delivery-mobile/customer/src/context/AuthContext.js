import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { customerService } from '../services/api';
import socketService from '../services/socket';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expoPushToken, setExpoPushToken] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    let token;
    try {
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
        // Get push token - will fail in Expo Go, that's OK
        token = (await Notifications.getExpoPushTokenAsync()).data;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    } catch (error) {
      // Push tokens don't work in Expo Go - this is expected
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

  const loginAsGuest = () => {
    setUser({ isGuest: true, name: 'Επισκέπτης' });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
};
