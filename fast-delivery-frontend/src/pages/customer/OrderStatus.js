import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Alert, ListGroup, Button } from 'react-bootstrap';
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
        console.log('🔄 Order update received:', data);
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
  }, [orderNumber, order?._id]);

  const fetchOrderStatus = async () => {
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
  };

  const handleConfirmPrice = async () => {
    if (!order) return;

    const phone = prompt('Εισάγετε το τηλέφωνό σας για επιβεβαίωση:');
    if (!phone) return;

    try {
      await customerService.confirmPrice(order._id, phone);
      alert('Η τιμή επιβεβαιώθηκε! Η παραγγελία θα ανατεθεί σε οδηγό.');
      fetchOrderStatus();
    } catch (err) {
      alert(err.response?.data?.message || 'Σφάλμα επιβεβαίωσης');
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending_store: { color: 'warning', icon: '⏳', text: 'Αναμονή απόκρισης καταστήματος', progress: 10 },
      pricing: { color: 'info', icon: '💰', text: 'Το κατάστημα τιμολογεί την παραγγελία', progress: 25 },
      pending_admin: { color: 'primary', icon: '👨‍💼', text: 'Υπολογισμός μεταφορικών', progress: 40 },
      pending_customer_confirm: { color: 'warning', icon: '⚠️', text: 'Αναμονή επιβεβαίωσης τιμής', progress: 50 },
      confirmed: { color: 'success', icon: '✅', text: 'Επιβεβαιωμένη - Αναζήτηση οδηγού', progress: 60 },
      assigned: { color: 'info', icon: '🚗', text: 'Ανατέθηκε σε οδηγό', progress: 70 },
      accepted_driver: { color: 'primary', icon: '👍', text: 'Ο οδηγός αποδέχτηκε', progress: 75 },
      preparing: { color: 'warning', icon: '👨‍🍳', text: 'Το κατάστημα προετοιμάζει', progress: 80 },
      in_delivery: { color: 'primary', icon: '🚚', text: 'Σε παράδοση', progress: 90 },
      completed: { color: 'success', icon: '🎉', text: 'Ολοκληρώθηκε!', progress: 100 },
      cancelled: { color: 'danger', icon: '❌', text: 'Ακυρώθηκε', progress: 0 },
      rejected_store: { color: 'danger', icon: '❌', text: 'Απορρίφθηκε από το κατάστημα', progress: 0 },
      rejected_driver: { color: 'danger', icon: '❌', text: 'Απορρίφθηκε από τον οδηγό', progress: 0 }
    };
    return statusMap[status] || { color: 'secondary', icon: '❓', text: status, progress: 0 };
  };

  if (loading) {
    return (
      <div className="customer-page d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Φόρτωση...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="customer-page">
        <Container className="py-5">
          <Row>
            <Col lg={8} className="mx-auto">
              <Alert variant="danger">
                <h4>Σφάλμα</h4>
                <p>{error}</p>
                <Button variant="primary" onClick={() => navigate('/')}>
                  Επιστροφή
                </Button>
              </Alert>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="customer-page">
      <Container className="py-5">
        <Row>
          <Col lg={8} className="mx-auto">
            <Button variant="link" className="mb-3 p-0" onClick={() => navigate('/')}>
              ← Πίσω στην Αρχική
            </Button>

            <Card className="shadow-lg mb-4">
              <Card.Header className="bg-primary text-white">
                <h4 className="mb-0">Παραγγελία {order.orderNumber}</h4>
              </Card.Header>
              <Card.Body>
                <div className="text-center mb-4">
                  <div className="display-1 mb-3">{statusInfo.icon}</div>
                  <h3>{statusInfo.text}</h3>
                  <Badge bg={statusInfo.color} className="fs-6">
                    {order.status}
                  </Badge>
                </div>

                <div className="progress mb-4" style={{ height: '30px' }}>
                  <div
                    className={`progress-bar bg-${statusInfo.color}`}
                    role="progressbar"
                    style={{ width: `${statusInfo.progress}%` }}
                    aria-valuenow={statusInfo.progress}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    {statusInfo.progress}%
                  </div>
                </div>

                {order.status === 'pending_customer_confirm' && (
                  <Alert variant="warning" className="text-center">
                    <h5>Επιβεβαίωση Τιμής</h5>
                    <p className="mb-3">
                      Τιμή Προϊόντων: <strong>€{order.productPrice?.toFixed(2)}</strong><br />
                      Μεταφορικά: <strong>€{order.deliveryFee?.toFixed(2)}</strong><br />
                      <strong>Σύνολο: €{order.totalPrice?.toFixed(2)}</strong>
                    </p>
                    <Button variant="success" size="lg" onClick={handleConfirmPrice}>
                      Επιβεβαίωση & Συνέχεια
                    </Button>
                  </Alert>
                )}

                <ListGroup className="mb-4">
                  <ListGroup.Item>
                    <strong>Κατάστημα:</strong> {order.storeName || order.store?.businessName || order.store?.storeName || 'Μη διαθέσιμο'}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Διεύθυνση Παράδοσης:</strong> {order.customer?.address || order.deliveryAddress || 'Μη διαθέσιμη'}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Τηλέφωνο:</strong> {order.customer?.phone || order.customerPhone || 'Μη διαθέσιμο'}
                  </ListGroup.Item>
                  {order.customer?.name && (
                    <ListGroup.Item>
                      <strong>Όνομα Πελάτη:</strong> {order.customer.name}
                    </ListGroup.Item>
                  )}
                  {(order.driverName || order.driver) && (
                    <ListGroup.Item>
                      <strong>Οδηγός:</strong> {order.driverName || order.driver?.name} {order.driver?.vehicleType ? `(${order.driver.vehicleType})` : ''}
                    </ListGroup.Item>
                  )}
                  {order.productPrice > 0 && (
                    <ListGroup.Item>
                      <strong>Τελική Τιμή:</strong> €{order.totalPrice?.toFixed(2) || '0.00'}
                    </ListGroup.Item>
                  )}
                </ListGroup>

                <small className="text-muted">
                  Δημιουργήθηκε: {new Date(order.createdAt).toLocaleString('el-GR')}
                  <br />
                  Η σελίδα ενημερώνεται αυτόματα σε πραγματικό χρόνο
                </small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default OrderStatus;
