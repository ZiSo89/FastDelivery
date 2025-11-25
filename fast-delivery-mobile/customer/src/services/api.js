import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ΑΛΛΑΞΕ ΤΟ ΜΕ ΤΗΝ IP ΤΟΥ ΥΠΟΛΟΓΙΣΤΗ ΣΟΥ (π.χ. 192.168.1.5)
// Αν τρέχεις σε Android Emulator: 'http://10.0.2.2:5000/api/v1'
// Αν τρέχεις σε φυσική συσκευή: 'http://YOUR_PC_IP:5000/api/v1'
const API_URL = 'http://192.168.31.160:5000/api/v1'; 

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
    console.log('📡 API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const customerService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/customer/register', data),
  getStores: (lat, lng) => api.get(`/orders/stores?latitude=${lat}&longitude=${lng}&maxDistance=5000000`),
  createOrder: (orderData) => api.post('/orders', orderData, {
    headers: orderData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
  }),
  getMyOrders: () => api.get('/orders/my-orders'),
  getOrderStatus: (orderNumber) => api.get(`/orders/${orderNumber}/status`),
  confirmPrice: (orderId, phone, confirm) => api.put(`/orders/${orderId}/confirm`, { phone, confirm }),
  getActiveOrderByPhone: (phone) => api.get(`/orders/active-by-phone/${phone}`),
  getProfile: () => api.put('/orders/profile'),
  updateProfile: (data) => api.put('/orders/profile', data),
};

export default api;
