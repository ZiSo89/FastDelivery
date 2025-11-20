import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Alert, ListGroup, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { customerService } from '../../services/api';
import socketService from '../../services/socket';
import '../../styles/Customer.css';

const OrderStatus = () => {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrderStatus = useCallback(async () => {
    try {
      const response = await customerService.getOrderStatus(orderNumber);
      // Backend επιστρέφει { success: true, order: {...} }
      const orderData = response.order || response.data || response;
      setOrder(orderData);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Δεν βρέθηκε η παραγγελία');
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    if (orderNumber) {
      fetchOrderStatus();
      
      // Socket.IO real-time updates
      // Connect socket for guest user (no authentication needed)
      if (!socketService.isConnected()) {
        socketService.connect(null);
      }

      // Listen to ALL order events
      const handleOrderUpdate = (data) => {
        if (data.orderNumber === orderNumber || data.orderId === order?._id) {
          fetchOrderStatus(); // Refresh order data
        }
      };

      // Subscribe to all relevant events
      socketService.on('order:status_changed', handleOrderUpdate);
      socketService.on('order:pending_admin', handleOrderUpdate);
      socketService.on('order:price_ready', handleOrderUpdate);
      socketService.on('order:confirmed', handleOrderUpdate);
      socketService.on('order:assigned', handleOrderUpdate);
      socketService.on('driver:accepted', handleOrderUpdate);
      socketService.on('driver:rejected', handleOrderUpdate);
      socketService.on('order:completed', handleOrderUpdate);
      socketService.on('order:cancelled', handleOrderUpdate);
      socketService.on('order:rejected_store', handleOrderUpdate);

      // Cleanup on unmount
      return () => {
        socketService.off('order:status_changed', handleOrderUpdate);
        socketService.off('order:pending_admin', handleOrderUpdate);
        socketService.off('order:price_ready', handleOrderUpdate);
        socketService.off('order:confirmed', handleOrderUpdate);
        socketService.off('order:assigned', handleOrderUpdate);
        socketService.off('driver:accepted', handleOrderUpdate);
        socketService.off('driver:rejected', handleOrderUpdate);
        socketService.off('order:completed', handleOrderUpdate);
        socketService.off('order:cancelled', handleOrderUpdate);
        socketService.off('order:rejected_store', handleOrderUpdate);
      };
    }
  }, [orderNumber, order?._id, fetchOrderStatus]);

  const handleConfirmPrice = async () => {
    if (!order) return;

    try {
      // Χρησιμοποιούμε το τηλέφωνο που υπάρχει ήδη στην παραγγελία
      const phone = order.customer?.phone || order.customerPhone;
      await customerService.confirmPrice(order._id, phone);
      // No alert needed, UI will update via socket or re-fetch
      fetchOrderStatus();
    } catch (err) {
      // Keep error alert if something goes wrong
      alert(err.response?.data?.message || 'Σφάλμα επιβεβαίωσης');
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    const phone = order.customer?.phone || order.customerPhone;
    if (!phone) {
      alert('Δεν βρέθηκε το τηλέφωνο της παραγγελίας');
      return;
    }

    try {
      // Καλούμε το backend να ακυρώσει την παραγγελία
      await customerService.cancelOrder(order._id, phone);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Σφάλμα ακύρωσης');
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending_store: { color: '#f0ad4e', icon: '⏳', title: 'Αναμονή', subtitle: 'Περιμένουμε το κατάστημα', progress: 10 },
      pricing: { color: '#5bc0de', icon: '💰', title: 'Τιμολόγηση', subtitle: 'Το κατάστημα ελέγχει την παραγγελία', progress: 25 },
      pending_admin: { color: '#0275d8', icon: '👨‍💼', title: 'Έλεγχος', subtitle: 'Υπολογισμός κόστους μεταφοράς', progress: 40 },
      pending_customer_confirm: { color: '#f0ad4e', icon: '🔔', title: 'Επιβεβαίωση', subtitle: 'Απαιτείται η έγκρισή σας', progress: 50 },
      confirmed: { color: '#5cb85c', icon: '✅', title: 'Επιβεβαιώθηκε', subtitle: 'Αναζήτηση διανομέα', progress: 60 },
      assigned: { color: '#5bc0de', icon: '🚗', title: 'Ανατέθηκε', subtitle: 'Βρέθηκε οδηγός', progress: 70 },
      accepted_driver: { color: '#0275d8', icon: '👍', title: 'Αποδοχή', subtitle: 'Ο οδηγός έρχεται', progress: 75 },
      preparing: { color: '#f0ad4e', icon: '👨‍🍳', title: 'Προετοιμασία', subtitle: 'Το φαγητό ετοιμάζεται', progress: 80 },
      in_delivery: { color: '#0275d8', icon: '🚚', title: 'Στο δρόμο', subtitle: 'Η παραγγελία έρχεται σε εσάς', progress: 90 },
      completed: { color: '#5cb85c', icon: '🎉', title: 'Παραδόθηκε', subtitle: 'Καλή απόλαυση!', progress: 100 },
      cancelled: { color: '#d9534f', icon: '❌', title: 'Ακυρώθηκε', subtitle: 'Η παραγγελία ακυρώθηκε', progress: 0 },
      rejected_store: { color: '#d9534f', icon: '❌', title: 'Απορρίφθηκε', subtitle: 'Από το κατάστημα', progress: 0 },
      rejected_driver: { color: '#d9534f', icon: '❌', title: 'Απορρίφθηκε', subtitle: 'Δεν βρέθηκε οδηγός', progress: 0 }
    };
    return statusMap[status] || { color: '#777', icon: '❓', title: 'Άγνωστο', subtitle: status, progress: 0 };
  };

  if (loading) {
    return (
      <div className="app-container d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Φόρτωση...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <header className="app-header">
          <div className="header-content">
            <button className="btn-icon" onClick={() => navigate('/order')}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <h3>Σφάλμα</h3>
            <div style={{ width: 32 }}></div>
          </div>
        </header>
        <div className="main-content p-4">
          <Alert variant="danger">
            <h4>Σφάλμα</h4>
            <p>{error}</p>
            <Button variant="primary" onClick={() => navigate('/order')}>
              Επιστροφή
            </Button>
          </Alert>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="app-container bg-light">
      <header className="app-header bg-white shadow-sm">
        <div className="header-content">
          <button className="btn-icon" onClick={() => navigate('/order')}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h3 className="fw-bold">Παραγγελία {order.orderNumber.split('-').pop()}</h3>
          <div style={{ width: 32 }}></div>
        </div>
      </header>

      <div className="main-content p-0">
        {/* Status Hero Section */}
        <div className="bg-white p-4 mb-3 text-center shadow-sm" style={{ borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}>
          <div className="mb-3" style={{ fontSize: '3rem' }}>{statusInfo.icon}</div>
          <h2 className="fw-bold mb-1">{statusInfo.title}</h2>
          <p className="text-muted mb-4">{statusInfo.subtitle}</p>
          
          <div className="progress" style={{ height: '8px', borderRadius: '4px', backgroundColor: '#f0f0f0' }}>
            <div
              className="progress-bar"
              role="progressbar"
              style={{ 
                width: `${statusInfo.progress}%`, 
                backgroundColor: statusInfo.color,
                borderRadius: '4px',
                transition: 'width 0.5s ease-in-out'
              }}
              aria-valuenow={statusInfo.progress}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>

        {/* Action Card for Confirmation */}
        {order.status === 'pending_customer_confirm' && (
          <div className="px-3 mb-3">
            <Card className="border-0 shadow-sm" style={{ borderRadius: '15px', overflow: 'hidden' }}>
              <div className="p-3 bg-warning bg-opacity-10 border-bottom border-warning border-opacity-25">
                <h5 className="mb-0 text-warning text-dark fw-bold">🔔 Απαιτείται Ενέργεια</h5>
              </div>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Προϊόντα</span>
                  <span className="fw-bold">€{order.productPrice?.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Μεταφορικά</span>
                  <span className="fw-bold">€{order.deliveryFee?.toFixed(2)}</span>
                </div>
                <hr className="my-3" />
                <div className="d-flex justify-content-between mb-4">
                  <span className="h5 mb-0">Σύνολο</span>
                  <span className="h4 mb-0 text-primary fw-bold">€{order.totalPrice?.toFixed(2)}</span>
                </div>
                
                <div className="d-grid gap-2">
                  <Button 
                    size="lg" 
                    style={{ backgroundColor: '#5cb85c', borderColor: '#5cb85c', borderRadius: '12px' }} 
                    onClick={handleConfirmPrice}
                  >
                    Αποδοχή & Συνέχεια
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    size="lg" 
                    style={{ borderRadius: '12px', borderWidth: '0' }}
                    onClick={handleCancelOrder}
                  >
                    Ακύρωση Παραγγελίας
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        )}

        {/* Order Details */}
        <div className="px-3 pb-4">
          <Card className="border-0 shadow-sm" style={{ borderRadius: '15px' }}>
            <Card.Body className="p-0">
              <ListGroup variant="flush">
                <ListGroup.Item className="p-3 border-bottom-0">
                  <small className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>ΚΑΤΑΣΤΗΜΑ</small>
                  <div className="fw-bold mt-1">{order.storeName || order.store?.businessName || 'Μη διαθέσιμο'}</div>
                </ListGroup.Item>
                
                <ListGroup.Item className="p-3 border-bottom-0 border-top">
                  <small className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>ΠΑΡΑΓΓΕΛΙΑ</small>
                  <div className="mt-1">
                    {order.orderContent ? order.orderContent : (order.orderType === 'voice' ? '🎤 Φωνητική παραγγελία' : 'Δεν καταχωρήθηκε')}
                  </div>
                </ListGroup.Item>
                
                <ListGroup.Item className="p-3 border-bottom-0 border-top">
                  <small className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>ΠΑΡΑΔΟΣΗ ΣΕ</small>
                  <div className="fw-bold mt-1">{order.customer?.address || order.deliveryAddress}</div>
                  <div className="text-muted small">{order.customer?.phone || order.customerPhone}</div>
                </ListGroup.Item>

                {(order.driverName || order.driver) && (
                  <ListGroup.Item className="p-3 border-bottom-0 border-top">
                    <small className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>ΔΙΑΝΟΜΕΑΣ</small>
                    <div className="d-flex align-items-center mt-2">
                      <div className="bg-light rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                        🚗
                      </div>
                      <div>
                        <div className="fw-bold">{order.driverName || order.driver?.name}</div>
                        <div className="text-muted small">{order.driver?.vehicleType || 'Όχημα'}</div>
                      </div>
                    </div>
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
          
          <div className="text-center mt-4 text-muted small">
            Κωδικός: #{order.orderNumber} • {new Date(order.createdAt).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatus;
