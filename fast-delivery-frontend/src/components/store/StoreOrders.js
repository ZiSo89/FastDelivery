import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Button, Badge, Spinner, Alert, ButtonGroup, Modal, Form, Card, Row, Col } from 'react-bootstrap';
import { storeService } from '../../services/api';
import socketService from '../../services/socket';

const StoreOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('in_progress');
  const [processingId, setProcessingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [productPrice, setProductPrice] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const filterRef = useRef(filter);

  // Keep filterRef in sync with filter state
  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchOrders = useCallback(async (currentFilter = null) => {
    try {
      setLoading(true);
      const filterToUse = currentFilter !== null ? currentFilter : filterRef.current;
      
      // For in_progress, fetch all and filter client-side
      const statusFilter = filterToUse === 'in_progress' || filterToUse === 'all' ? null : filterToUse;
      const response = await storeService.getOrders(statusFilter);
      let allOrders = response.orders || response.data || [];
      
      // Filter for "Σε Εξέλιξη": all orders from last 3 hours except completed
      if (filterToUse === 'in_progress') {
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
        allOrders = allOrders.filter(order => {
          const isNotCompleted = order.status !== 'completed';
          const isRecent = new Date(order.createdAt) >= threeHoursAgo;
          return isNotCompleted && isRecent;
        });
      }
      
      setOrders(allOrders);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Σφάλμα φόρτωσης παραγγελιών');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch orders when filter changes
  useEffect(() => {
    fetchOrders(filter);
  }, [filter, fetchOrders]);

  // Socket.IO listeners (setup once, never recreate)
  useEffect(() => {
    
    // Socket.IO real-time listeners for store
    const handleNewOrder = (data) => {
      fetchOrders(); // Refresh list
    };

    const handleOrderCancelled = (data) => {
      fetchOrders(); // Refresh list
    };

    const handleDriverAccepted = (data) => {
      fetchOrders(); // Refresh list
    };

    const handleOrderStatusChanged = (data) => {
      fetchOrders(); // Refresh list
    };

    const handleOrderPendingAdmin = (data) => {
      fetchOrders(); // Refresh list
    };

    const handleOrderPriceReady = (data) => {
      fetchOrders(); // Refresh list
    };

    const handleOrderAssigned = (data) => {
      fetchOrders(); // Refresh list
    };

    const handleOrderCompleted = (data) => {
      fetchOrders(); // Refresh list
    };

    const handleOrderConfirmed = (data) => {
      fetchOrders(); // Refresh list
    };

    // Subscribe to events
    socketService.on('order:new', handleNewOrder);
    socketService.on('order:cancelled', handleOrderCancelled);
    socketService.on('order:status_changed', handleOrderStatusChanged);
    socketService.on('order:pending_admin', handleOrderPendingAdmin);
    socketService.on('order:price_ready', handleOrderPriceReady);
    socketService.on('order:assigned', handleOrderAssigned);
    socketService.on('driver:accepted', handleDriverAccepted);
    socketService.on('order:completed', handleOrderCompleted);
    socketService.on('order:confirmed', handleOrderConfirmed);

    // Cleanup on unmount
    return () => {
      socketService.off('order:new', handleNewOrder);
      socketService.off('order:cancelled', handleOrderCancelled);
      socketService.off('order:status_changed', handleOrderStatusChanged);
      socketService.off('order:pending_admin', handleOrderPendingAdmin);
      socketService.off('order:price_ready', handleOrderPriceReady);
      socketService.off('order:assigned', handleOrderAssigned);
      socketService.off('driver:accepted', handleDriverAccepted);
      socketService.off('order:completed', handleOrderCompleted);
      socketService.off('order:confirmed', handleOrderConfirmed);
    };
  }, [fetchOrders]); // Only recreate if fetchOrders changes (which it won't)

  const handleAccept = async (orderId) => {
    try {
      setProcessingId(orderId);
      await storeService.acceptOrder(orderId, true);
      await fetchOrders();
      // Success - real-time update will show the change
    } catch (err) {
      alert(err.response?.data?.message || 'Σφάλμα');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (orderId) => {
    const reason = prompt('Λόγος απόρριψης:');
    if (!reason) return;

    try {
      setProcessingId(orderId);
      await storeService.acceptOrder(orderId, false, reason);
      await fetchOrders();
      // Success - real-time update will show the change
    } catch (err) {
      alert(err.response?.data?.message || 'Σφάλμα');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSetPrice = (order) => {
    setSelectedOrder(order);
    setProductPrice('');
    setShowModal(true);
  };

  const submitPrice = async () => {
    if (!productPrice || parseFloat(productPrice) <= 0) {
      alert('Παρακαλώ εισάγετε έγκυρη τιμή');
      return;
    }

    try {
      await storeService.setPrice(selectedOrder._id, parseFloat(productPrice));
      setShowModal(false);
      await fetchOrders();
      // Success - real-time update will show the change
    } catch (err) {
      alert(err.response?.data?.message || 'Σφάλμα');
    }
  };

  const handlePreparing = async (orderId) => {
    try {
      setProcessingId(orderId);
      await storeService.updateStatus(orderId, 'preparing');
      await fetchOrders();
      // Success - real-time update will show the change
    } catch (err) {
      alert(err.response?.data?.message || 'Σφάλμα');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending_store: { bg: 'warning', label: 'Νέα' },
      pricing: { bg: 'info', label: 'Τιμολόγηση' },
      pending_admin: { bg: 'primary', label: 'Στον Admin' },
      pending_customer_confirm: { bg: 'warning', label: 'Αναμονή επιβεβαίωσης πελάτη' },
      confirmed: { bg: 'success', label: 'Επιβεβαιωμένη' },
      assigned: { bg: 'info', label: 'Ανατέθηκε' },
      accepted_driver: { bg: 'primary', label: 'Οδηγός Αποδέχτηκε' },
      preparing: { bg: 'warning', label: 'Προετοιμασία' },
      in_delivery: { bg: 'primary', label: 'Σε Παράδοση' },
      completed: { bg: 'success', label: 'Ολοκληρώθηκε' },
      cancelled: { bg: 'danger', label: 'Ακυρώθηκε' },
      rejected_store: { bg: 'danger', label: 'Απορρίφθηκε' }
    };
    const c = config[status] || { bg: 'secondary', label: status };
    return <Badge bg={c.bg}>{c.label}</Badge>;
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Παραγγελίες</h5>
        <ButtonGroup>
          <Button
            variant={filter === 'in_progress' ? 'primary' : 'outline-primary'}
            onClick={() => setFilter('in_progress')}
            size="sm"
          >
            🔄 Σε Εξέλιξη
          </Button>
          <Button
            variant={filter === 'all' ? 'secondary' : 'outline-secondary'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            📋 Όλες
          </Button>
        </ButtonGroup>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : orders.length === 0 ? (
        <Alert variant="info">Δεν βρέθηκαν παραγγελίες</Alert>
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
                    <small className="text-muted">Πελάτης:</small><br />
                    <strong>{order.customer?.name || 'N/A'}</strong><br />
                    <small>📞 {order.customer?.phone || order.customerPhone || 'N/A'}</small><br />
                    <small>📍 {order.customer?.address || order.deliveryAddress || 'N/A'}</small>
                  </div>
                  
                  <div className="mb-2">
                    <small className="text-muted">Παραγγελία:</small><br />
                    {order.orderType === 'voice' ? (
                      <span>🎤 Φωνητική παραγγελία</span>
                    ) : (
                      order.orderContent
                    )}
                  </div>
                  
                  {order.productPrice && (
                    <div className="mb-3">
                      <small className="text-muted">Τιμή:</small><br />
                      <h5 className="text-primary mb-0">€{order.productPrice.toFixed(2)}</h5>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="d-grid gap-2">
                    {order.status === 'pending_store' && (
                      <>
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
                      </>
                    )}
                    {order.status === 'pricing' && (
                      <Button
                        variant="primary"
                        onClick={() => handleSetPrice(order)}
                      >
                        💰 Καθορισμός Τιμής
                      </Button>
                    )}
                    {order.status === 'accepted_driver' && (
                      <Button
                        variant="warning"
                        onClick={() => handlePreparing(order._id)}
                        disabled={processingId === order._id}
                      >
                        👨‍🍳 Προετοιμασία
                      </Button>
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
                <th>Πελάτης</th>
                <th>Περιγραφή</th>
                <th>Τιμή</th>
                <th>Κατάσταση</th>
                <th>Ενέργειες</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td className="fw-bold">{order.orderNumber}</td>
                  <td>
                    <strong>{order.customer?.name || 'N/A'}</strong><br />
                    <small className="text-muted">
                      📞 {order.customer?.phone || order.customerPhone || 'N/A'}
                    </small><br />
                    <small className="text-muted">
                      📍 {order.customer?.address || order.deliveryAddress || 'N/A'}
                    </small>
                  </td>
                  <td>
                    {order.orderType === 'voice' ? (
                      <span>🎤 Φωνητική παραγγελία</span>
                    ) : (
                      order.orderContent
                    )}
                  </td>
                  <td>{order.productPrice ? `€${order.productPrice.toFixed(2)}` : '-'}</td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td>
                    {order.status === 'pending_store' && (
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
                    {order.status === 'pricing' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSetPrice(order)}
                      >
                        💰 Τιμολόγηση
                      </Button>
                    )}
                    {order.status === 'accepted_driver' && (
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={() => handlePreparing(order._id)}
                        disabled={processingId === order._id}
                      >
                        👨‍🍳 Προετοιμασία
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Τιμολόγηση Παραγγελίας</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Τιμή Προϊόντος (€)</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
              placeholder="0.00"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Ακύρωση
          </Button>
          <Button variant="primary" onClick={submitPrice}>
            Καταχώρηση
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default StoreOrders;
