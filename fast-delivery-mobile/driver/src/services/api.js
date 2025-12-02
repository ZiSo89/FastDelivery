import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - προσθέτει JWT token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.log('❌ API Error:', error.config?.url, error.response?.status, error.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);

export const driverService = {
  // Login
  login: (credentials) => api.post('/auth/login', { ...credentials, role: 'driver' }),
  
  // Get profile
  getProfile: () => api.get('/driver/profile'),
  
  // Set availability (online/offline)
  setAvailability: (isOnline) => api.put('/driver/availability', { isOnline }),
  
  // Get assigned orders
  getOrders: () => api.get('/driver/orders'),
  
  // Accept/Reject order
  acceptOrder: (orderId, accepted, rejectionReason = null) => 
    api.put(`/driver/orders/${orderId}/accept`, {
      action: accepted ? 'accept' : 'reject',
      rejectionReason
    }),
  
  // Update order status (in_delivery, completed)
  updateStatus: (orderId, status) => 
    api.put(`/driver/orders/${orderId}/status`, { status }),
  
  // Update push token
  updatePushToken: (pushToken) => 
    api.put('/driver/profile', { pushToken }),
};

export default api;
