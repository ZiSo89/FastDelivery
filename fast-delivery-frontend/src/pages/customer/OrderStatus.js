import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Alert, ListGroup, Button, Toast, ToastContainer } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { customerService } from '../../services/api';
import socketService from '../../services/socket';
import AlertModal from '../../components/AlertModal';
import ConfirmModal from '../../components/ConfirmModal';
import '../../styles/Customer.css';

const OrderStatus = () => {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alertModal, setAlertModal] = useState({ show: false, variant: 'success', message: '' });
  const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null });

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
    }
  }, [orderNumber, fetchOrderStatus]);

  useEffect(() => {
    if (!order || !order.customer?.phone) return;

    // Socket.IO real-time updates
    // Connect socket for guest user (no authentication needed)
    if (!socketService.isConnected()) {
      socketService.connect(null);
    }

    // Join customer room using phone number
    const customerRoom = `customer:${order.customer.phone}`;
    socketService.joinRoom(customerRoom);

    // Listen to ALL order events
    const handleOrderUpdate = (data) => {
      console.log('📨 Order event received:', data);
      if (data.orderNumber === orderNumber || data.orderId === order?._id?.toString()) {
        console.log('✅ Refreshing order data...');
        fetchOrderStatus(); // Refresh order data
      }
    };

    // Log order data for debugging
    console.log('🔍 Order Data:', order);
    if (order.storeId) {
      console.log('🏪 Store Data:', order.storeId);
    } else {
      console.warn('⚠️ Store ID is missing or not populated');
    }

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
  }, [order, orderNumber, fetchOrderStatus]);

  const handleConfirmPrice = async () => {
    if (!order) return;

    try {
      // Χρησιμοποιούμε το τηλέφωνο που υπάρχει ήδη στην παραγγελία
      const phone = order.customer?.phone || order.customerPhone;
      await customerService.confirmPrice(order._id, phone);
      
      // Remove notification manually since we are performing the action
      // We need to import useNotification hook or dispatch event, but since we are outside context here
      // we rely on socket update. However, user said it didn't dismiss.
      // Let's try to force a refresh which might help, but the notification is global.
      // The best way is to listen to the socket event 'order:confirmed' which we already do in NotificationContext
      // Wait... NotificationContext listens to 'order:confirmed' for ADMIN and STORE, but not for CUSTOMER to remove the alert!
      
      fetchOrderStatus();
    } catch (err) {
      // Keep error alert if something goes wrong
      setAlertModal({
        show: true,
        variant: 'danger',
        message: err.response?.data?.message || 'Σφάλμα επιβεβαίωσης'
      });
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    const phone = order.customer?.phone || order.customerPhone;
    if (!phone) {
      setAlertModal({
        show: true,
        variant: 'danger',
        message: 'Δεν βρέθηκε το τηλέφωνο της παραγγελίας'
      });
      return;
    }

    // Επιβεβαίωση από τον χρήστη με custom modal
    setConfirmModal({
      show: true,
      message: 'Είστε βέβαιος ότι θέλετε να ακυρώσετε αυτή την παραγγελία?\n\nΗ ακύρωση είναι οριστική και δεν μπορεί να αναιρεθεί.',
      onConfirm: async () => {
        try {
          // Καλούμε το backend να ακυρώσει την παραγγελία
          await customerService.cancelOrder(order._id, phone);
          navigate('/');
        } catch (err) {
          setAlertModal({
            show: true,
            variant: 'danger',
            message: err.response?.data?.message || 'Σφάλμα ακύρωσης'
          });
        }
      }
    });
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
      <div className="app-container d-flex justify-content-center align-items-center min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Φόρτωση...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <Container className="p-0" fluid>
          <Row className="justify-content-center m-0">
            <Col xs={12} sm={12} md={8} lg={6} xl={5} className="p-0 bg-white min-vh-100 shadow-sm position-relative">
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
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="app-container bg-light" style={{ minHeight: '100vh' }}>
      <Container className="p-0" fluid>
        <Row className="justify-content-center m-0">
          <Col xs={12} sm={12} md={8} lg={6} xl={5} className="p-0 bg-white min-vh-100 shadow-sm position-relative">
            <header className="app-header bg-white shadow-sm">
              <div className="header-content">
                <button className="btn-icon" onClick={() => navigate('/order')}>
                  <i className="fas fa-arrow-left"></i>
                </button>
                <h3 className="fw-bold">Fast Delivery</h3>
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
                      
                      <div className="d-grid gap-3">
                        <button 
                          className="btn-primary-app"
                          onClick={handleConfirmPrice}
                        >
                          Αποδοχή & Συνέχεια
                        </button>
                        <button 
                          style={{
                            width: '100%',
                            padding: '16px',
                            backgroundColor: '#fff',
                            color: '#dc3545',
                            border: '1px solid #ffebee',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onClick={handleCancelOrder}
                          onMouseOver={(e) => e.target.style.backgroundColor = '#fff5f5'}
                          onMouseOut={(e) => e.target.style.backgroundColor = '#fff'}
                        >
                          Ακύρωση Παραγγελίας
                        </button>
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
                        {(order.storeId?.address || order.store?.address) && (
                          <div className="text-muted small mt-1">
                            <i className="fas fa-map-marker-alt me-1" style={{ fontSize: '0.8rem' }}></i> 
                            {order.storeId?.address || order.store?.address}
                          </div>
                        )}
                        {(order.storeId?.phone || order.store?.phone) && (
                          <div className="mt-1">
                            <a href={`tel:${order.storeId?.phone || order.store?.phone}`} className="text-decoration-none text-muted small" style={{ textDecoration: 'none', color: 'inherit' }}>
                              <i className="fas fa-phone-alt me-1" style={{ fontSize: '0.8rem' }}></i> 
                              {order.storeId?.phone || order.store?.phone}
                            </a>
                          </div>
                        )}
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
                        <div className="text-muted small">
                          <a href={`tel:${order.customer?.phone || order.customerPhone}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            {order.customer?.phone || order.customerPhone}
                          </a>
                        </div>
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

            <AlertModal
              show={alertModal.show}
              onHide={() => setAlertModal({ ...alertModal, show: false })}
              variant={alertModal.variant}
              message={alertModal.message}
            />

            <ConfirmModal
              show={confirmModal.show}
              onHide={() => setConfirmModal({ ...confirmModal, show: false })}
              onConfirm={() => {
                setConfirmModal({ ...confirmModal, show: false });
                confirmModal.onConfirm && confirmModal.onConfirm();
              }}
              title="Επιβεβαίωση Ακύρωσης"
              message={confirmModal.message}
              confirmText="Ακύρωση Παραγγελίας"
              cancelText="Όχι, Επιστροφή"
              variant="danger"
              icon="❌"
            />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default OrderStatus;
