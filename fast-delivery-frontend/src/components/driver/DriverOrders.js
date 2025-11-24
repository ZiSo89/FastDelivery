import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Badge, Spinner, Alert, ButtonGroup, Card, Row, Col, Modal, Form } from 'react-bootstrap';
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await driverService.getOrders();
      // Backend επιστρέφει { success: true, orders: [...] }
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
    
    // Socket.IO real-time listeners for driver
    // For drivers, we refresh on ANY order event since the API filters by driverId anyway
    const handleOrderEvent = (data) => {
      fetchOrders(); // Always refresh - API will filter by driverId
    };

    // Subscribe to events
    socketService.on('order:assigned', handleOrderEvent);
    socketService.on('order:status_changed', handleOrderEvent);
    socketService.on('order:cancelled', handleOrderEvent);
    socketService.on('order:completed', handleOrderEvent);

    // Cleanup on unmount
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
      
      // Find order to get orderNumber
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
      
      // Find order to get orderNumber
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
      
      // Find order to get orderNumber
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
      
      // Find order to get orderNumber
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

  const getStatusBadge = (status) => {
    const config = {
      assigned: { bg: 'warning', label: 'Ανάθεση' },
      accepted_driver: { bg: 'info', label: 'Αποδοχή' },
      preparing: { bg: 'warning', label: 'Προετοιμασία' },
      in_delivery: { bg: 'primary', label: 'Σε Παράδοση' },
      completed: { bg: 'success', label: 'Ολοκληρώθηκε' },
      rejected_driver: { bg: 'danger', label: 'Απορρίφθηκε' }
    };
    const c = config[status] || { bg: 'secondary', label: status };
    return <Badge bg={c.bg}>{c.label}</Badge>;
  };

  return (
    <>
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : orders.length === 0 ? (
        <Alert variant="info">Δεν έχετε ανατεθειμένες παραγγελίες</Alert>
      ) : isMobile ? (
        // Mobile Card View
        <Row className="g-3">
          {orders.map((order) => (
            <Col xs={12} key={order._id}>
              <Card className="shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <strong>{order.orderNumber}</strong>
                  {getStatusBadge(order.status)}
                </Card.Header>
                <Card.Body>
                  <div className="mb-2">
                    <small className="text-muted">🏪 Κατάστημα:</small><br />
                    <strong>{order.storeId?.businessName || order.storeName}</strong><br />
                    <small>{order.storeId?.address}</small><br />
                    <a href={`tel:${order.storeId?.phone}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <small>📞 {order.storeId?.phone}</small>
                    </a>
                    {order.storeId?.managerPhone && (
                      <>
                        <br />
                        <a href={`tel:${order.storeId?.managerPhone}`} style={{ textDecoration: 'none', color: 'inherit' }} className="text-muted">
                          <small>👤 Υπεύθυνος: {order.storeId?.managerPhone}</small>
                        </a>
                      </>
                    )}
                  </div>
                  
                  <div className="mb-2">
                    <small className="text-muted">📍 Διεύθυνση Παράδοσης:</small><br />
                    {order.customer?.address || order.deliveryAddress}
                  </div>
                  
                  <div className="mb-2">
                    <small className="text-muted">📞 Τηλέφωνο:</small><br />
                    <a href={`tel:${order.customer?.phone || order.customerPhone}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <strong>{order.customer?.phone || order.customerPhone}</strong>
                    </a>
                  </div>
                  
                  <div className="mb-3">
                    <small className="text-muted">Αξία Παραγγελίας:</small><br />
                    <h5 className="text-success mb-0">€{order.totalPrice?.toFixed(2)}</h5>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="d-grid gap-2">
                    {order.status === 'assigned' && (
                      <>
                        <Button
                          variant="success"
                          onClick={() => handleAccept(order._id)}
                          disabled={processingId === order._id}
                        >
                          ✅ Αποδοχή Παραγγελίας
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleReject(order._id)}
                          disabled={processingId === order._id}
                        >
                          ❌ Απόρριψη
                        </Button>
                      </>
                    )}
                    {order.status === 'accepted_driver' && (
                      <Alert variant="info" className="mb-0">
                        <div className="text-center">
                          <strong>⏳ Αναμονή Προετοιμασίας</strong>
                          <p className="mb-0 mt-2 small">Το κατάστημα ετοιμάζει την παραγγελία</p>
                        </div>
                      </Alert>
                    )}
                    {order.status === 'preparing' && (
                      <Button
                        variant="primary"
                        onClick={() => handlePickup(order._id)}
                        disabled={processingId === order._id}
                      >
                        🚗 Παραλαβή & Αποστολή
                      </Button>
                    )}
                    {order.status === 'in_delivery' && (
                      <Button
                        variant="success"
                        onClick={() => handleComplete(order._id)}
                        disabled={processingId === order._id}
                      >
                        ✅ Ολοκλήρωση Παράδοσης
                      </Button>
                    )}
                    {order.status === 'completed' && (
                      <Badge bg="success" className="p-2">✅ Ολοκληρώθηκε</Badge>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        // Desktop Table View
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Αριθμός</th>
                <th>Κατάστημα</th>
                <th>Διεύθυνση Παράδοσης</th>
                <th>Τηλέφωνο</th>
                <th>Αξία</th>
                <th>Κατάσταση</th>
                <th>Ενέργειες</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td className="fw-bold">{order.orderNumber}</td>
                  <td>
                    {order.storeId?.businessName || order.storeName}<br />
                    <small className="text-muted">{order.storeId?.address}</small><br />
                    <a href={`tel:${order.storeId?.phone}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <small className="text-muted">📞 {order.storeId?.phone}</small>
                    </a>
                    {order.storeId?.managerPhone && (
                      <>
                        <br />
                        <a href={`tel:${order.storeId?.managerPhone}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <small className="text-muted">👤 {order.storeId?.managerPhone}</small>
                        </a>
                      </>
                    )}
                  </td>
                  <td>{order.customer?.address || order.deliveryAddress}</td>
                  <td>
                    <a href={`tel:${order.customer?.phone || order.customerPhone}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {order.customer?.phone || order.customerPhone}
                    </a>
                  </td>
                  <td className="fw-bold">€{order.totalPrice?.toFixed(2)}</td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td>
                    {order.status === 'assigned' && (
                      <ButtonGroup size="sm">
                        <Button
                          variant="success"
                          onClick={() => handleAccept(order._id)}
                          disabled={processingId === order._id}
                        >
                          ✅ Αποδοχή
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleReject(order._id)}
                          disabled={processingId === order._id}
                        >
                          ❌ Απόρριψη
                        </Button>
                      </ButtonGroup>
                    )}
                    {order.status === 'accepted_driver' && (
                      <Badge bg="info" className="p-2">
                        ⏳ Αναμονή Προετοιμασίας
                      </Badge>
                    )}
                    {order.status === 'preparing' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handlePickup(order._id)}
                        disabled={processingId === order._id}
                      >
                        🚗 Παραλαβή & Αποστολή
                      </Button>
                    )}
                    {order.status === 'in_delivery' && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleComplete(order._id)}
                        disabled={processingId === order._id}
                      >
                        ✅ Ολοκλήρωση
                      </Button>
                    )}
                    {order.status === 'completed' && (
                      <Badge bg="success">Ολοκληρώθηκε</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
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
          <Modal.Title>❌ Απόρριψη Παραγγελίας</Modal.Title>
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
                placeholder="π.χ. Πολύ μακριά, Δεν είμαι διαθέσιμος κτλ."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
            Άκυρο
          </Button>
          <Button variant="danger" onClick={confirmReject} disabled={!rejectReason.trim()}>
            Απόρριψη Παραγγελίας
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
          <Modal.Title>✅ Ολοκλήρωση Παράδοσης</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Είστε σίγουρος ότι ολοκληρώθηκε η παράδοση;</p>
          <p className="text-muted mb-0">
            <small>Μετά την επιβεβαίωση, η παραγγελία θα μεταφερθεί στο ιστορικό.</small>
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCompleteModal(false)}>
            Όχι, Ακύρωση
          </Button>
          <Button variant="primary" onClick={confirmComplete}>
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
