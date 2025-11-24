import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import RegisterSelection from './pages/RegisterSelection';
import StoreRegister from './pages/StoreRegister';
import DriverRegister from './pages/DriverRegister';
import AdminDashboard from './pages/admin/AdminDashboard';
import StoreDashboard from './pages/store/StoreDashboard';
import DriverDashboard from './pages/driver/DriverDashboard';
import CustomerPortal from './pages/customer/CustomerPortal';
import Register from './pages/customer/Register';
import CustomerHome from './pages/customer/CustomerHome';
import NewOrder from './pages/customer/NewOrder';
import OrderStatus from './pages/customer/OrderStatus';
import TrackOrder from './pages/customer/TrackOrder';
import CustomerOrders from './pages/customer/CustomerOrders';
import CustomerProfile from './pages/customer/CustomerProfile';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import './styles/CustomerPortal.css';
import NotificationToast from './components/NotificationToast';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <NotificationToast />
        <Router>
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<CustomerPortal />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-business" element={<RegisterSelection />} />
          <Route path="/register-business/store" element={<StoreRegister />} />
          <Route path="/register-business/driver" element={<DriverRegister />} />
          <Route path="/order" element={<CustomerHome />} />
          <Route path="/new-order" element={<NewOrder />} />
          <Route path="/my-orders" element={<CustomerOrders />} />
          <Route path="/profile" element={<CustomerProfile />} />
          <Route path="/order-status/track" element={<TrackOrder />} />
          <Route path="/order-status/:orderNumber" element={<OrderStatus />} />
          
          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Protected Store Routes */}
          <Route
            path="/store"
            element={
              <ProtectedRoute allowedRoles={['store']}>
                <StoreDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Protected Driver Routes */}
          <Route
            path="/driver"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <DriverDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Catch All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
