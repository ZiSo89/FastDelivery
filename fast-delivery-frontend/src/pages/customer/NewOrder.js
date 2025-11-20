import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, ListGroup } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { customerService } from '../../services/api';
import '../../styles/Customer.css';

const NewOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '', // Added email field
    deliveryAddress: '',
    orderContent: '',
    orderType: 'text'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (location.state?.store) {
      setSelectedStore(location.state.store);
    } else {
      fetchStores();
    }
  }, [location.state]);

  useEffect(() => {
    if (user) {
      console.log('👤 Auto-filling form with user data:', user);
      setFormData(prev => ({
        ...prev,
        customerName: user.name || '',
        customerPhone: user.phone || '',
        customerEmail: user.email || '', // Auto-fill email
        deliveryAddress: user.address || ''
      }));
    }
  }, [user]);

  const fetchStores = async () => {
    try {
      // Default coordinates (Thessaloniki center for demo)
      const response = await customerService.getStores({ latitude: 40.6401, longitude: 22.9444, maxDistance: 10000 });
      // Backend επιστρέφει { success: true, stores: [...] }
      setStores(response.stores || response.data || []);
    } catch (err) {
      setError('Σφάλμα φόρτωσης καταστημάτων');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🖱️ Clicked Submit Order');
    setError('');
    setSuccess('');

    if (!selectedStore) {
      console.log('❌ No store selected');
      setError('Παρακαλώ επιλέξτε κατάστημα');
      return;
    }

    if (!formData.customerName || !formData.customerPhone || !formData.deliveryAddress || !formData.orderContent) {
      console.log('❌ Missing fields', formData);
      setError('Παρακαλώ συμπληρώστε όλα τα πεδία');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        customer: {
          name: formData.customerName,
          phone: formData.customerPhone,
          email: formData.customerEmail, // Send email to backend
          address: formData.deliveryAddress
        },
        storeId: selectedStore._id,
        orderType: formData.orderType,
        orderContent: formData.orderContent
      };

      console.log('📤 Sending Order Data:', orderData);
      const response = await customerService.createOrder(orderData);
      console.log('✅ Order Created:', response);
      setSuccess(`Η παραγγελία σας καταχωρήθηκε! Αριθμός: ${response.order.orderNumber}`);
      
      setTimeout(() => {
        navigate(`/order-status/${response.order.orderNumber}`);
      }, 2000);
    } catch (err) {
      console.error('❌ Order Error:', err);
      setError(err.response?.data?.message || 'Σφάλμα δημιουργίας παραγγελίας');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <button className="btn-icon" onClick={() => navigate('/order')}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h3>Νέα Παραγγελία</h3>
          <div style={{ width: 32 }}></div>
        </div>
      </header>

      <div className="main-content" style={{ padding: '20px' }}>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <h5 className="mb-3">1. Επιλογή Καταστήματος</h5>
          {selectedStore ? (
            <div className="selected-store-card mb-4 p-3 border rounded bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">{selectedStore.businessName || selectedStore.storeName}</h6>
                  <small>{selectedStore.storeType} · {selectedStore.address}</small>
                </div>
              </div>
            </div>
          ) : (
            <ListGroup className="mb-4">
              {stores.length === 0 ? (
                <Alert variant="info">Δεν βρέθηκαν διαθέσιμα καταστήματα</Alert>
              ) : (
                stores.map((store) => (
                  <ListGroup.Item
                    key={store._id}
                    action
                    active={selectedStore?._id === store._id}
                    onClick={() => setSelectedStore(store)}
                    className="cursor-pointer"
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">{store.businessName || store.storeName}</h6>
                        <small>{store.storeType} · {store.address}</small>
                      </div>
                      {selectedStore?._id === store._id && (
                        <span className="badge bg-success">✓</span>
                      )}
                    </div>
                  </ListGroup.Item>
                ))
              )}
            </ListGroup>
          )}

          <h5 className="mb-3">2. Στοιχεία Παραγγελίας</h5>
          
          <div className="mb-3">
            <label className="form-label">Όνομα *</label>
            <input
              type="text"
              name="customerName"
              className="form-control app-input"
              placeholder="Γιάννης Παπαδόπουλος"
              value={formData.customerName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Τηλέφωνο *</label>
            <input
              type="tel"
              name="customerPhone"
              className="form-control app-input"
              placeholder="6912345678"
              value={formData.customerPhone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Διεύθυνση *</label>
            <input
              type="text"
              name="deliveryAddress"
              className="form-control app-input"
              placeholder="Λεωφόρος Δημοκρατίας 25"
              value={formData.deliveryAddress}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label">Περιγραφή Παραγγελίας *</label>
            <textarea
              rows={4}
              name="orderContent"
              className="form-control app-input"
              placeholder="Περιγράψτε τι θέλετε να παραγγείλετε..."
              value={formData.orderContent}
              onChange={handleChange}
              required
            />
            <div className="form-text">
              Αναφέρετε με λεπτομέρεια τα προϊόντα που θέλετε
            </div>
          </div>

          <div className="d-grid">
            <button
              type="submit"
              className="btn-primary-app"
              disabled={loading || !selectedStore}
            >
              {loading ? 'Αποστολή...' : 'Υποβολή Παραγγελίας'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewOrder;
