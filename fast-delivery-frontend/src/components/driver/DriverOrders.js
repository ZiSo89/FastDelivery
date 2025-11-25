import React, { useState, useEffect, useCallback } from 'react';
import { Button, Badge, Spinner, Alert, Card, Modal, Form } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { driverService } from '../../services/api';
import socketService from '../../services/socket';
import { useNotification } from '../../context/NotificationContext';

const DriverOrders = () => {
  const { user } = useAuth();
  const { removeNotificationsByRelatedId } = useNotification();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  
  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await driverService.getOrders();
      setOrders(response.orders || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Σφάλμα φόρτωσης παραγγελιών');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    
    const handleOrderEvent = (data) => {
      fetchOrders();
    };

    socketService.on('order:assigned', handleOrderEvent);
    socketService.on('order:status_changed', handleOrderEvent);
    socketService.on('order:cancelled', handleOrderEvent);
    socketService.on('order:completed', handleOrderEvent);

    return () => {
      socketService.off('order:assigned', handleOrderEvent);
      socketService.off('order:status_changed', handleOrderEvent);
      socketService.off('order:cancelled', handleOrderEvent);
      socketService.off('order:completed', handleOrderEvent);
    };
  }, [fetchOrders]);

  const handleAccept = async (orderId) => {
    try {
      setProcessingId(orderId);
      await driverService.acceptOrder(orderId, true);
      const order = orders.find(o => o._id === orderId);
      if (order) removeNotificationsByRelatedId(order.orderNumber);
      await fetchOrders();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Σφάλμα αποδοχής παραγγελίας');
      setShowErrorModal(true);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (orderId) => {
    setSelectedOrderId(orderId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      setErrorMessage('Παρακαλώ εισάγετε λόγο απόρριψης');
      setShowErrorModal(true);
      return;
    }

    try {
      setProcessingId(selectedOrderId);
      await driverService.acceptOrder(selectedOrderId, false, rejectReason);
      const order = orders.find(o => o._id === selectedOrderId);
      if (order) removeNotificationsByRelatedId(order.orderNumber);
      await fetchOrders();
      setShowRejectModal(false);
      setRejectReason('');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Σφάλμα απόρριψης παραγγελίας');
      setShowErrorModal(true);
      setShowRejectModal(false);
    } finally {
      setProcessingId(null);
      setSelectedOrderId(null);
    }
  };

  const handlePickup = async (orderId) => {
    try {
      setProcessingId(orderId);
      await driverService.updateStatus(orderId, 'in_delivery');
      const order = orders.find(o => o._id === orderId);
      if (order) removeNotificationsByRelatedId(order.orderNumber);
      await fetchOrders();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Σφάλμα παραλαβής παραγγελίας');
      setShowErrorModal(true);
    } finally {
      setProcessingId(null);
    }
  };

  const handleComplete = async (orderId) => {
    setSelectedOrderId(orderId);
    setShowCompleteModal(true);
  };

  const confirmComplete = async () => {
    try {
      setProcessingId(selectedOrderId);
      await driverService.updateStatus(selectedOrderId, 'completed');
      const order = orders.find(o => o._id === selectedOrderId);
      if (order) removeNotificationsByRelatedId(order.orderNumber);
      await fetchOrders();
      setShowCompleteModal(false);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Σφάλμα ολοκλήρωσης παραγγελίας');
      setShowErrorModal(true);
      setShowCompleteModal(false);
    } finally {
      setProcessingId(null);
      setSelectedOrderId(null);
    }
  };

  const openNavigation = (address) => {
    if (!address) return;
    // Open Google Maps in new tab
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };

  const getStatusBadge = (status) => {
    const config = {
      assigned: { bg: 'warning', label: 'Νέα Ανάθεση' },
      accepted_driver: { bg: 'info', label: 'Αναμονή' },
      preparing: { bg: 'warning', label: 'Προετοιμασία' },
      in_delivery: { bg: 'primary', label: 'Σε Παράδοση' },
      completed: { bg: 'success', label: 'Ολοκληρώθηκε' },
      rejected_driver: { bg: 'danger', label: 'Απορρίφθηκε' }
    };
    const c = config[status] || { bg: 'secondary', label: status };
    return <Badge bg={c.bg} className="status-badge">{c.label}</Badge>;
  };

  return (
    <>
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : error ? (
        <Alert variant="danger" className="border-0 shadow-sm">{error}</Alert>
      ) : orders.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <div className="mb-3" style={{ fontSize: '40px' }}>😴</div>
          <h5>Δεν υπάρχουν ενεργές παραγγελίες</h5>
          <p>Περιμένετε για νέες αναθέσεις...</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <Card key={order._id} className="order-card mb-3 border-0 shadow-sm">
              <Card.Body className="p-0">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-light-subtle">
                  <div>
                    <span className="fw-bold text-dark" style={{ fontSize: '1.1rem' }}>
                      Είσπραξη: €{order.totalPrice?.toFixed(2)}
                    </span>
                    <div className="text-muted small mt-1">#{order.orderNumber}</div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                {/* Timeline Content */}
                <div className="p-3">
                  {/* Store */}
                  <div className="timeline-item">
                    <div className="timeline-marker store-marker"></div>
                    <div className="timeline-content ms-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1 fw-bold">{order.storeId?.businessName || order.storeName}</h6>
                          <p className="mb-1 text-muted small">{order.storeId?.address}</p>
                        </div>
                        <Button 
                          variant="light" 
                          size="sm" 
                          className="nav-btn rounded-circle shadow-sm"
                          onClick={() => openNavigation(order.storeId?.address)}
                          title="Πλοήγηση στο κατάστημα"
                        >
                          📍
                        </Button>
                      </div>
                      <a href={`tel:${order.storeId?.phone}`} className="text-decoration-none small text-secondary d-block mt-1">
                        📞 {order.storeId?.phone}
                      </a>
                    </div>
                  </div>

                  {/* Connector */}
                  <div className="timeline-connector ms-1"></div>

                  {/* Customer */}
                  <div className="timeline-item mt-1">
                    <div className="timeline-marker customer-marker"></div>
                    <div className="timeline-content ms-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1 fw-bold">{order.customer?.name || 'Πελάτης'}</h6>
                          <p className="mb-1 text-muted small">{order.customer?.address || order.deliveryAddress}</p>
                        </div>
                        <Button 
                          variant="light" 
                          size="sm" 
                          className="nav-btn rounded-circle shadow-sm"
                          onClick={() => openNavigation(order.customer?.address || order.deliveryAddress)}
                          title="Πλοήγηση στον πελάτη"
                        >
                          📍
                        </Button>
                      </div>
                      <a href={`tel:${order.customer?.phone || order.customerPhone}`} className="text-decoration-none small text-secondary d-block mt-1">
                        📞 {order.customer?.phone || order.customerPhone}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-3 bg-light border-top">
                  <div className="d-grid gap-2">
                    {order.status === 'assigned' && (
                      <div className="d-flex gap-2">
                        <Button
                          variant="success"
                          className="flex-grow-1 fw-bold py-2"
                          onClick={() => handleAccept(order._id)}
                          disabled={processingId === order._id}
                        >
                          Αποδοχή
                        </Button>
                        <Button
                          variant="outline-danger"
                          className="fw-bold py-2"
                          onClick={() => handleReject(order._id)}
                          disabled={processingId === order._id}
                        >
                          Απόρριψη
                        </Button>
                      </div>
                    )}
                    {order.status === 'accepted_driver' && (
                      <Alert variant="info" className="mb-0 py-2 text-center small border-0">
                        <strong>⏳ Αναμονή Προετοιμασίας</strong>
                      </Alert>
                    )}
                    {order.status === 'preparing' && (
                      <Button
                        variant="primary"
                        className="fw-bold py-2"
                        onClick={() => handlePickup(order._id)}
                        disabled={processingId === order._id}
                      >
                        🚗 Παραλαβή & Αποστολή
                      </Button>
                    )}
                    {order.status === 'in_delivery' && (
                      <Button
                        variant="success"
                        className="fw-bold py-2"
                        onClick={() => handleComplete(order._id)}
                        disabled={processingId === order._id}
                      >
                        ✅ Ολοκλήρωση Παράδοσης
                      </Button>
                    )}
                    {order.status === 'completed' && (
                      <div className="text-center text-success fw-bold">
                        ✅ Η παραγγελία ολοκληρώθηκε
                      </div>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Order Modal */}
      <Modal 
        show={showRejectModal} 
        onHide={() => setShowRejectModal(false)}
        centered
        className="driver-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>❌ Απόρριψη</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Λόγος απόρριψης:</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="π.χ. Πολύ μακριά..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
            Άκυρο
          </Button>
          <Button variant="danger" onClick={confirmReject} disabled={!rejectReason.trim()}>
            Απόρριψη
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Complete Delivery Modal */}
      <Modal 
        show={showCompleteModal} 
        onHide={() => setShowCompleteModal(false)}
        centered
        className="driver-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>✅ Ολοκλήρωση</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Επιβεβαιώνετε την παράδοση;</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCompleteModal(false)}>
            Άκυρο
          </Button>
          <Button variant="success" onClick={confirmComplete}>
            Ναι, Ολοκληρώθηκε
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Error Modal */}
      <Modal 
        show={showErrorModal} 
        onHide={() => setShowErrorModal(false)}
        centered
        className="driver-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>⚠️ Σφάλμα</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{errorMessage}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowErrorModal(false)}>
            Κλείσιμο
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DriverOrders;
