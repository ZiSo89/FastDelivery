import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';
import socketService from '../services/socket';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Έλεγχος αν υπάρχει user στο localStorage κατά την αρχική φόρτωση
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      // Connect socket when user is restored from localStorage
      socketService.connect(currentUser);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      // Backend επιστρέφει: { success: true, token: "...", user: { user object } }
      const userData = response.user || response.data?.user || response.data || response;
      setUser(userData);
      
      // Connect socket after successful login
      socketService.connect(userData);
      
      return { success: true, data: userData, user: userData };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Σφάλμα κατά τη σύνδεση'
      };
    }
  };

  const reLogin = async () => {
    // Silent re-login to refresh token
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return false;

    try {
      // Get fresh user data from API
      const token = localStorage.getItem('token');
      if (!token) return false;

      // Just reconnect socket with current user (token is still valid in localStorage)
      socketService.disconnect();
      socketService.connect(currentUser);
      
      return true;
    } catch (error) {
      console.error('Re-login failed:', error);
      return false;
    }
  };

  const logout = () => {
    authService.logout();
    socketService.disconnect(); // Disconnect socket on logout
    setUser(null);
  };

  const refreshUser = () => {
    // Refresh user from localStorage (in case it was updated by API responses)
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      // Reconnect socket with updated user data
      socketService.disconnect();
      socketService.connect(currentUser);
    }
  };

  const updateUser = (updatedUserData) => {
    // Update user in state and localStorage
    setUser(updatedUserData);
    localStorage.setItem('user', JSON.stringify(updatedUserData));
    // Reconnect socket with updated user data
    socketService.disconnect();
    socketService.connect(updatedUserData);
  };

  const value = {
    user,
    login,
    logout,
    refreshUser,
    updateUser,
    reLogin,
    loading,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
