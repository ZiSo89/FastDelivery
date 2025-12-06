import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - clear storage
      await AsyncStorage.multiRemove(['token', 'user']);
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  login: async (email, password) => {
    console.log('📡 API Login Request:', { 
      email, 
      password: password ? `[${password.length} chars]` : 'EMPTY',
      role: 'store',
      url: API_URL + '/auth/login' 
    });
    try {
      const body = { email, password, role: 'store' };
      console.log('📡 Request body:', JSON.stringify(body));
      const response = await api.post('/auth/login', body);
      console.log('📡 API Login Response:', response.status, response.data);
      return response.data;
    } catch (error) {
      console.log('📡 API Login Error:', error.response?.status, error.response?.data);
      throw error;
    }
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Store Service
export const storeService = {
  // Get orders with optional status filter
  getOrders: async (status = null, page = 1, limit = 50) => {
    let url = `/store/orders?page=${page}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  // Get single order by ID
  getOrderById: async (orderId) => {
    const response = await api.get(`/store/orders/${orderId}`);
    return response.data;
  },

  // Accept or reject order
  acceptOrder: async (orderId, accepted, rejectionReason = null) => {
    const response = await api.put(`/store/orders/${orderId}/accept`, {
      action: accepted ? 'accept' : 'reject',
      rejectionReason
    });
    return response.data;
  },

  // Set product price
  setPrice: async (orderId, productPrice) => {
    const response = await api.put(`/store/orders/${orderId}/price`, { productPrice });
    return response.data;
  },

  // Update order status (e.g., preparing)
  updateStatus: async (orderId, status) => {
    const response = await api.put(`/store/orders/${orderId}/status`, { status });
    return response.data;
  },

  // Get store profile
  getProfile: async () => {
    const response = await api.get('/store/profile');
    return response.data;
  },

  // Update store profile
  updateProfile: async (profileData) => {
    const response = await api.put('/store/profile', profileData);
    return response.data;
  },

  // Toggle online/offline status
  toggleOnlineStatus: async (isOnline) => {
    const response = await api.put('/store/online-status', { isOnline });
    return response.data;
  },

  // Update push token
  updatePushToken: async (pushToken) => {
    const response = await api.put('/store/profile', { 
      pushToken,
      pushTokenType: 'fcm'
    });
    return response.data;
  },
};

export default api;
