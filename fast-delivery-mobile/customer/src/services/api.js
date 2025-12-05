import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to every request
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

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Health check to wake up the server (MongoDB cold start)
export const healthCheck = async (maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await api.get('/health', { timeout: 10000 });
      return { success: true, data: response.data };
    } catch (error) {
      if (i === maxRetries - 1) {
        return { success: false, error: 'Server unavailable' };
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

export const customerService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/customer/register', data),
  getStores: (lat, lng) => api.get(`/orders/stores?latitude=${lat}&longitude=${lng}&maxDistance=5000000`),
  getServiceStatus: () => api.get('/orders/service-status'),
  createOrder: (orderData) => api.post('/orders', orderData, {
    headers: orderData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
  }),
  getMyOrders: (page = 1, limit = 10) => api.get(`/orders/my-orders?page=${page}&limit=${limit}`),
  getOrderStatus: (orderNumber) => api.get(`/orders/${orderNumber}/status`),
  confirmPrice: (orderId, phone, confirm) => api.put(`/orders/${orderId}/confirm`, { phone, confirm }),
  getActiveOrderByPhone: (phone) => api.get(`/orders/active-by-phone/${phone}`),
  getProfile: () => api.put('/orders/profile'),
  updateProfile: (data) => api.put('/orders/profile', data),
  deleteAccount: () => api.delete('/orders/profile'),
};

// App version check (public endpoint)
export const checkAppVersion = async (app = 'customer', platform = 'android') => {
  try {
    const response = await api.get(`/app-version?app=${app}&platform=${platform}`, { 
      timeout: 5000 
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.log('Version check failed:', error.message);
    return { success: false, error: error.message };
  }
};

export default api;
