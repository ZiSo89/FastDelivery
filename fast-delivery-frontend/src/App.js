import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import StoreDashboard from './pages/store/StoreDashboard';
import DriverDashboard from './pages/driver/DriverDashboard';
import CustomerHome from './pages/customer/CustomerHome';
import NewOrder from './pages/customer/NewOrder';
import OrderStatus from './pages/customer/OrderStatus';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<CustomerHome />} />
          <Route path="/new-order" element={<NewOrder />} />
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
    </AuthProvider>
  );
}

export default App;
