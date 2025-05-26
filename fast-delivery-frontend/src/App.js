import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import OrderPage from './pages/OrderPage';
import AdminPage from './pages/AdminPage';
import AdminStoresPage from './pages/AdminStoresPage';
import DeliveryPage from './pages/DeliveryPage';
import AddDeliveryUserPage from './pages/AddDeliveryUserPage';

import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/order" element={<OrderPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/stores" element={<AdminStoresPage />} />
          <Route path="/delivery" element={<DeliveryPage />} />
          <Route path="/admin/add-delivery-user" element={<AddDeliveryUserPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;