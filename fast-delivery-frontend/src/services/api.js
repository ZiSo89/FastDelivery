import axios from 'axios';

// Βασικό URL από environment variables
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// ==================== STORAGE HELPERS ====================
// Customers use sessionStorage (per-tab isolation)
// Other roles (store, driver, admin) use localStorage (persistent)

const getStorageForRole = (role) => {
  return role === 'customer' ? sessionStorage : localStorage;
};

const getCurrentUserRole = () => {
  // Check sessionStorage first (customers)
  const sessionUser = sessionStorage.getItem('user');
  if (sessionUser && sessionUser !== 'undefined' && sessionUser !== 'null') {
    try {
      const parsed = JSON.parse(sessionUser);
      if (parsed?.role === 'customer') return 'customer';
    } catch (e) {}
  }
  // Then check localStorage (staff)
  const localUser = localStorage.getItem('user');
  if (localUser && localUser !== 'undefined' && localUser !== 'null') {
    try {
      const parsed = JSON.parse(localUser);
      return parsed?.role || null;
    } catch (e) {}
  }
  return null;
};

export const getToken = () => {
  // Check sessionStorage first (customers)
  const sessionToken = sessionStorage.getItem('token');
  if (sessionToken) return sessionToken;
  // Then check localStorage (staff)
  return localStorage.getItem('token');
};

export const getUser = () => {
  // Check sessionStorage first (customers)
  const sessionUser = sessionStorage.getItem('user');
  if (sessionUser && sessionUser !== 'undefined' && sessionUser !== 'null') {
    try {
      return JSON.parse(sessionUser);
    } catch (e) {}
  }
  // Then check localStorage (staff)
  const localUser = localStorage.getItem('user');
  if (localUser && localUser !== 'undefined' && localUser !== 'null') {
    try {
      return JSON.parse(localUser);
    } catch (e) {}
  }
  return null;
};

export const setAuthData = (token, user, role) => {
  const storage = getStorageForRole(role);
  storage.setItem('token', token);
  storage.setItem('user', JSON.stringify(user));
};

export const clearAuthData = () => {
  // Clear from both storages to be safe
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const clearAuthDataForRole = (role) => {
  const storage = getStorageForRole(role);
  storage.removeItem('token');
  storage.removeItem('user');
};

// ==================== AXIOS SETUP ====================

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
    const token = getToken();
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
      console.warn('🔒 401 Unauthorized:', error.config.url, 'Path:', window.location.pathname);
      
      // Αν το token έληξε, διαγραφή και redirect στο login
      clearAuthData();
      
      // Check if we are in customer portal (any customer-related URL)
      const customerPaths = ['/order', '/new-order', '/my-orders', '/profile', '/register'];
      const isCustomerPortal = customerPaths.some(path => 
        window.location.pathname === path || window.location.pathname.startsWith('/order-status')
      );
      
      // Also check if on root path but coming from customer context
      const isRootCustomer = window.location.pathname === '/' || window.location.pathname === '';
      
      console.warn('🔒 isCustomerPortal:', isCustomerPortal, 'isRootCustomer:', isRootCustomer);
      
      if (isCustomerPortal) {
        // For customer portal pages, redirect to customer home (not login)
        window.location.href = '/order';
      } else if (isRootCustomer) {
        // Already on login page, don't redirect
        return Promise.reject(error);
      } else {
        // For partner portal (admin, store, driver), redirect to login
        window.location.href = '/login';
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
      // Backend επιστρέφει: { success: true, token: "...", user: {...} }
      const userData = response.data.user || response.data.data;
      const role = userData?.role || credentials.role;
      // Use role-based storage: customers → sessionStorage, others → localStorage
      setAuthData(response.data.token, userData, role);
    }
    return response.data;
  },

  // Logout
  logout: () => {
    clearAuthData();
  },

  // Get current user
  getCurrentUser: () => {
    return getUser();
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
      const userData = response.data.user;
      // Customers always use sessionStorage
      setAuthData(response.data.token, userData, 'customer');
    }
    return response.data;
  },

  // Get token (for external use)
  getToken: () => {
    return getToken();
  }
};

// ==================== ADMIN SERVICES ====================

export const adminService = {
  // Get statistics
  getStats: async (period = 'today') => {
    const response = await api.get(`/admin/stats?period=${period}`);
    return response.data;
  },

  // Get all stores with pagination
  getStores: async (status = null, page = 1, limit = 20) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    const response = await api.get(`/admin/stores?${params}`);
    return response.data;
  },

  // Approve/Reject/Pending store
  approveStore: async (storeId, action) => {
    // action can be: 'approve', 'reject', or 'pending'
    // For backward compatibility, also accept boolean (true = approve, false = reject)
    const actionValue = typeof action === 'boolean' 
      ? (action ? 'approve' : 'reject')
      : action;
    
    const response = await api.put(`/admin/stores/${storeId}/approve`, { 
      action: actionValue
    });
    return response.data;
  },

  // Get all drivers with pagination
  getDrivers: async (status = null, isOnline = null, page = 1, limit = 20) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    if (isOnline !== null) params.append('isOnline', isOnline);
    const response = await api.get(`/admin/drivers?${params}`);
    return response.data;
  },

  // Approve/Reject/Pending driver
  approveDriver: async (driverId, action) => {
    // action can be: 'approve', 'reject', or 'pending'
    // For backward compatibility, also accept boolean (true = approve, false = reject)
    const actionValue = typeof action === 'boolean' 
      ? (action ? 'approve' : 'reject')
      : action;
    
    const response = await api.put(`/admin/drivers/${driverId}/approve`, { 
      action: actionValue
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

  // Get single order by ID
  getOrderById: async (orderId) => {
    const response = await api.get(`/admin/orders/${orderId}`);
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

  // Get all customers with pagination
  getCustomers: async (page = 1, limit = 20, search = '') => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append('search', search);
    const response = await api.get(`/admin/customers?${params}`);
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
  getOrders: async (status = null, page = 1, limit = 20) => {
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
    const config = {};
    if (orderData instanceof FormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' };
    }
    const response = await api.post('/orders', orderData, config);
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

  // Get my orders with pagination
  getMyOrders: async (page = 1, limit = 10) => {
    const response = await api.get(`/orders/my-orders?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Update profile
  updateProfile: async (data) => {
    const response = await api.put('/orders/profile', data);
    return response.data;
  },

  // Delete account (soft delete)
  deleteAccount: async () => {
    const response = await api.delete('/orders/profile');
    return response.data;
  },

  // Get active order by phone
  getActiveOrderByPhone: async (phone) => {
    const response = await api.get(`/orders/active-by-phone/${phone}`);
    return response.data;
  },
};

export default api;
