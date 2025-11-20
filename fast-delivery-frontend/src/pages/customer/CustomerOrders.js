import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { customerService } from '../../services/api';
import '../../styles/Customer.css';

const CustomerOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await customerService.getMyOrders();
      if (response.success) {
        setOrders(response.orders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Σφάλμα φόρτωσης ιστορικού παραγγελιών');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending_store: { bg: 'warning', text: 'Αναμονή' },
      pricing: { bg: 'info', text: 'Τιμολόγηση' },
      pending_admin: { bg: 'primary', text: 'Έλεγχος' },
      pending_customer_confirm: { bg: 'warning', text: 'Επιβεβαίωση' },
      confirmed: { bg: 'success', text: 'Επιβεβαιώθηκε' },
      assigned: { bg: 'info', text: 'Ανατέθηκε' },
      accepted_driver: { bg: 'primary', text: 'Οδηγός καθοδόν' },
      preparing: { bg: 'warning', text: 'Προετοιμασία' },
      in_delivery: { bg: 'primary', text: 'Σε παράδοση' },
      completed: { bg: 'success', text: 'Ολοκληρώθηκε' },
      cancelled: { bg: 'danger', text: 'Ακυρώθηκε' },
      rejected_store: { bg: 'danger', text: 'Απορρίφθηκε' },
      rejected_driver: { bg: 'danger', text: 'Απορρίφθηκε' }
    };
    const info = statusMap[status] || { bg: 'secondary', text: status };
    return <Badge bg={info.bg}>{info.text}</Badge>;
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <button className="btn-icon" onClick={() => navigate('/order')}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h3>Οι Παραγγελίες μου</h3>
          <div style={{ width: 32 }}></div>
        </div>
      </header>

      <div className="main-content p-3">
        {loading ? (
          <div className="text-center mt-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : orders.length === 0 ? (
          <div className="text-center mt-5">
            <p className="text-muted">Δεν έχετε καμία παραγγελία ακόμα.</p>
            <Button variant="primary" onClick={() => navigate('/order')}>
              Κάντε την πρώτη σας παραγγελία!
            </Button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <Card 
                key={order._id} 
                className="mb-3 shadow-sm border-0 cursor-pointer"
                onClick={() => navigate(`/order-status/${order.orderNumber}`)}
              >
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h6 className="mb-1">{order.storeName || order.storeId?.businessName}</h6>
                      <small className="text-muted">
                        {new Date(order.createdAt).toLocaleDateString('el-GR', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </small>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-end">
                    <small className="text-muted">
                      {order.orderContent ? 
                        (order.orderContent.length > 30 ? order.orderContent.substring(0, 30) + '...' : order.orderContent) 
                        : 'Φωνητική παραγγελία'}
                    </small>
                    {order.totalPrice > 0 && (
                      <span className="fw-bold text-primary">€{order.totalPrice.toFixed(2)}</span>
                    )}
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrders;
