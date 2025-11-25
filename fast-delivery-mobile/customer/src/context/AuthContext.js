import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { customerService } from '../services/api';
import socketService from '../services/socket';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

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
      }
    } catch (error) {
      console.log('Error loading user:', error);
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

      return { success: true };
    } catch (error) {
      console.log('Login error:', error.response?.data);
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

      return { success: true };
    } catch (error) {
      console.log('Register error:', error.response?.data);
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
      console.log('Logout error:', error);
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
