import axios from 'axios';

// Βασικό URL από environment variables
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Δημιουργία axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - προσθέτει JWT token αν υπάρχει
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - διαχείριση errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect if it's a login attempt that failed
    if (error.response?.status === 401 && !error.config.url.includes('/login')) {
      // Αν το token έληξε, διαγραφή και redirect στο login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect to partner login if we are not in customer portal
      if (!window.location.pathname.startsWith('/order') && window.location.pathname !== '/') {
          window.location.href = '/login';
      } else {
          // For customer portal, maybe redirect to home?
          window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH SERVICES ====================

export const authService = {
  // Login
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      // Backend επιστρέφει: { success: true, token: "...", user: {...} }
      const userData = response.data.user || response.data.data;
      localStorage.setItem('user', JSON.stringify(userData));
    }
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    if (!user || user === 'undefined' || user === 'null') {
      return null;
    }
    try {
      return JSON.parse(user);
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      localStorage.removeItem('user');
      return null;
    }
  },

  // Store Registration
  registerStore: async (storeData) => {
    const response = await api.post('/auth/store/register', storeData);
    return response.data;
  },

  // Driver Registration
  registerDriver: async (driverData) => {
    const response = await api.post('/auth/driver/register', driverData);
    return response.data;
  },

  // Customer Registration
  registerCustomer: async (customerData) => {
    const response = await api.post('/auth/customer/register', customerData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      const userData = response.data.user;
      localStorage.setItem('user', JSON.stringify(userData));
    }
    return response.data;
  }
};

// ==================== ADMIN SERVICES ====================

export const adminService = {
  // Get statistics
  getStats: async (period = 'today') => {
    const response = await api.get(`/admin/stats?period=${period}`);
    return response.data;
  },

  // Get all stores
  getStores: async (status = null) => {
    const url = status ? `/admin/stores?status=${status}` : '/admin/stores';
    const response = await api.get(url);
    return response.data;
  },

  // Approve/Reject store
  approveStore: async (storeId, approved) => {
    const response = await api.put(`/admin/stores/${storeId}/approve`, { 
      action: approved ? 'approve' : 'reject' 
    });
    return response.data;
  },

  // Get all drivers
  getDrivers: async (status = null, isOnline = null) => {
    let url = '/admin/drivers?';
    if (status) url += `status=${status}&`;
    if (isOnline !== null) url += `isOnline=${isOnline}`;
    const response = await api.get(url);
    return response.data;
  },

  // Approve/Reject driver
  approveDriver: async (driverId, approved) => {
    const response = await api.put(`/admin/drivers/${driverId}/approve`, { 
      action: approved ? 'approve' : 'reject' 
    });
    return response.data;
  },

  // Get all orders
  getOrders: async (status = null, page = 1, limit = 20) => {
    let url = `/admin/orders?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    const response = await api.get(url);
    return response.data;
  },

  // Add delivery fee
  addDeliveryFee: async (orderId, deliveryFee) => {
    const response = await api.put(`/admin/orders/${orderId}/delivery-fee`, { deliveryFee });
    return response.data;
  },

  // Assign driver
  assignDriver: async (orderId, driverId) => {
    const response = await api.put(`/admin/orders/${orderId}/assign-driver`, { driverId });
    return response.data;
  },

  // Cancel order
  cancelOrder: async (orderId, reason) => {
    const response = await api.put(`/admin/orders/${orderId}/cancel`, { reason });
    return response.data;
  },

  // Get all customers
  getCustomers: async () => {
    const response = await api.get('/admin/customers');
    return response.data;
  },

  // Deactivate customer
  deactivateCustomer: async (customerId) => {
    const response = await api.put(`/admin/customers/${customerId}/deactivate`);
    return response.data;
  }
};

// ==================== STORE SERVICES ====================

export const storeService = {
  // Get store profile
  getProfile: async () => {
    const response = await api.get('/store/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/store/profile', profileData);
    return response.data;
  },

  // Get store orders
  getOrders: async (status = null) => {
    const url = status ? `/store/orders?status=${status}` : '/store/orders';
    const response = await api.get(url);
    return response.data;
  },

  // Accept/Reject order
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

  // Update order status
  updateStatus: async (orderId, status) => {
    const response = await api.put(`/store/orders/${orderId}/status`, { status });
    return response.data;
  }
};

// ==================== DRIVER SERVICES ====================

export const driverService = {
  // Get driver profile
  getProfile: async () => {
    const response = await api.get('/driver/profile');
    return response.data; // Backend επιστρέφει { success, driver }
  },

  // Set availability
  setAvailability: async (isOnline) => {
    const response = await api.put('/driver/availability', { isOnline });
    return response.data;
  },

  // Get assigned orders
  getOrders: async () => {
    const response = await api.get('/driver/orders');
    return response.data;
  },

  // Accept/Reject assignment
  acceptOrder: async (orderId, accepted, rejectionReason = null) => {
    const response = await api.put(`/driver/orders/${orderId}/accept`, {
      action: accepted ? 'accept' : 'reject',
      rejectionReason
    });
    return response.data;
  },

  // Update order status
  updateStatus: async (orderId, status) => {
    const response = await api.put(`/driver/orders/${orderId}/status`, { status });
    return response.data;
  }
};

// ==================== CUSTOMER SERVICES ====================

export const customerService = {
  // Get nearby stores
  getStores: async (params = {}) => {
    const { latitude, longitude, maxDistance, storeType, serviceArea } = params;
    let url = '/orders/stores?';
    
    if (latitude && longitude) {
      url += `latitude=${latitude}&longitude=${longitude}&`;
      if (maxDistance) url += `maxDistance=${maxDistance}&`;
    }
    
    if (storeType) url += `storeType=${encodeURIComponent(storeType)}&`;
    if (serviceArea) url += `serviceArea=${encodeURIComponent(serviceArea)}&`;
    
    const response = await api.get(url);
    return response.data;
  },

  // Create order
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  // Get order status
  getOrderStatus: async (orderNumber) => {
    const response = await api.get(`/orders/${orderNumber}/status`);
    return response.data;
  },

  // Confirm price
  confirmPrice: async (orderId, customerPhone) => {
    const response = await api.put(`/orders/${orderId}/confirm`, { 
      phone: customerPhone,
      confirm: true 
    });
    return response.data;
  },

  // Cancel order
  cancelOrder: async (orderId, customerPhone) => {
    const response = await api.put(`/orders/${orderId}/confirm`, { 
      phone: customerPhone,
      confirm: false 
    });
    return response.data;
  },

  // Get my orders
  getMyOrders: async () => {
    const response = await api.get('/orders/my-orders');
    return response.data;
  },

  // Get active order by phone
  getActiveOrderByPhone: async (phone) => {
    const response = await api.get(`/orders/active-by-phone/${phone}`);
    return response.data;
  },
};

export default api;
