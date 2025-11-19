import React, { useState, useEffect, useCallback } from 'react';
import { Table, Badge, Spinner, Alert, Form, Button, Modal, Card, Row, Col } from 'react-bootstrap';
import { adminService } from '../../services/api';
import socketService from '../../services/socket';

const OrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  
  // Modals state
  const [showDeliveryFeeModal, setShowDeliveryFeeModal] = useState(false);
  const [showAssignDriverModal, setShowAssignDriverModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState('');
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Detect screen size changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getOrders(filter === 'all' ? null : filter);
      // Backend επιστρέφει { success: true, orders: [...] }
      setOrders(response.orders || response.data?.orders || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Σφάλμα φόρτωσης παραγγελιών');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders();
    
    // Socket.IO real-time listeners
    const handleNewOrder = (data) => {
      console.log('🔔 New order received:', data);
      fetchOrders(); // Refresh list
    };

    const handleOrderStatusChanged = (data) => {
      console.log('🔄 Order status changed:', data);
      fetchOrders(); // Refresh list
    };

    const handleDriverAccepted = (data) => {
      console.log('✅ Driver accepted order:', data);
      fetchOrders(); // Refresh list
    };

    const handleDriverRejected = (data) => {
      console.log('❌ Driver rejected order:', data);
      fetchOrders(); // Refresh list
    };

    const handleOrderCompleted = (data) => {
      console.log('🎉 Order completed:', data);
      fetchOrders(); // Refresh list
    };

    const handleOrderPendingAdmin = (data) => {
      console.log('💰 Store added price, pending admin:', data);
      fetchOrders(); // Refresh list
    };

    const handleOrderPriceReady = (data) => {
      console.log('💵 Admin added delivery fee:', data);
      fetchOrders(); // Refresh list
    };

    const handleOrderAssigned = (data) => {
      console.log('🚗 Order assigned to driver:', data);
      fetchOrders(); // Refresh list
    };

    const handleOrderRejectedStore = (data) => {
      console.log('❌ Store rejected order:', data);
      fetchOrders(); // Refresh list
    };

    const handleOrderCancelled = (data) => {
      console.log('🚫 Order cancelled:', data);
      fetchOrders(); // Refresh list
    };

    // Subscribe to events
    socketService.on('order:new', handleNewOrder);
    socketService.on('order:status_changed', handleOrderStatusChanged);
    socketService.on('order:confirmed', handleOrderStatusChanged);
    socketService.on('order:pending_admin', handleOrderPendingAdmin);
    socketService.on('order:price_ready', handleOrderPriceReady);
    socketService.on('order:assigned', handleOrderAssigned);
    socketService.on('order:rejected_store', handleOrderRejectedStore);
    socketService.on('order:cancelled', handleOrderCancelled);
    socketService.on('driver:accepted', handleDriverAccepted);
    socketService.on('driver:rejected', handleDriverRejected);
    socketService.on('order:completed', handleOrderCompleted);

    // Cleanup on unmount
    return () => {
      socketService.off('order:new', handleNewOrder);
      socketService.off('order:status_changed', handleOrderStatusChanged);
      socketService.off('order:confirmed', handleOrderStatusChanged);
      socketService.off('order:pending_admin', handleOrderPendingAdmin);
      socketService.off('order:price_ready', handleOrderPriceReady);
      socketService.off('order:assigned', handleOrderAssigned);
      socketService.off('order:rejected_store', handleOrderRejectedStore);
      socketService.off('order:cancelled', handleOrderCancelled);
      socketService.off('driver:accepted', handleDriverAccepted);
      socketService.off('driver:rejected', handleDriverRejected);
      socketService.off('order:completed', handleOrderCompleted);
    };
  }, [fetchOrders]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_store: { bg: 'warning', label: 'Αναμονή Καταστήματος' },
      pricing: { bg: 'info', label: 'Τιμολόγηση' },
      pending_admin: { bg: 'primary', label: 'Αναμονή Admin' },
      pending_customer_confirm: { bg: 'warning', label: 'Αναμονή Πελάτη' },
      confirmed: { bg: 'success', label: 'Επιβεβαιωμένη' },
      assigned: { bg: 'info', label: 'Ανατέθηκε' },
      accepted_driver: { bg: 'primary', label: 'Αποδοχή Οδηγού' },
      preparing: { bg: 'warning', label: 'Προετοιμασία' },
      in_delivery: { bg: 'primary', label: 'Σε Παράδοση' },
      completed: { bg: 'success', label: 'Ολοκληρώθηκε' },
      cancelled: { bg: 'danger', label: 'Ακυρώθηκε' },
      rejected_store: { bg: 'danger', label: 'Απόρριψη Καταστήματος' },
      rejected_driver: { bg: 'danger', label: 'Απόρριψη Οδηγού' }
    };

    const config = statusConfig[status] || { bg: 'secondary', label: status };
    return <Badge bg={config.bg}>{config.label}</Badge>;
  };

  const handleOpenDeliveryFeeModal = (order) => {
    setSelectedOrder(order);
    setDeliveryFee('');
    setShowDeliveryFeeModal(true);
  };

  const handleOpenAssignDriverModal = async (order) => {
    setSelectedOrder(order);
    setSelectedDriver('');
    setShowAssignDriverModal(true);
    
    // Fetch available drivers
    try {
      const response = await adminService.getDrivers('approved', true); // approved & online
      setAvailableDrivers(response.drivers || []);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setAvailableDrivers([]);
    }
  };

  const handleAddDeliveryFee = async () => {
    if (!deliveryFee || parseFloat(deliveryFee) <= 0) {
      alert('Παρακαλώ εισάγετε έγκυρο ποσό μεταφορικών');
      return;
    }

    try {
      setActionLoading(true);
      await adminService.addDeliveryFee(selectedOrder._id, parseFloat(deliveryFee));
      setShowDeliveryFeeModal(false);
      fetchOrders(); // Refresh list
      // Success - real-time update will show the change
    } catch (err) {
      alert(err.response?.data?.message || 'Σφάλμα προσθήκης μεταφορικών');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedDriver) {
      alert('Παρακαλώ επιλέξτε οδηγό');
      return;
    }

    try {
      setActionLoading(true);
      await adminService.assignDriver(selectedOrder._id, selectedDriver);
      setShowAssignDriverModal(false);
      fetchOrders(); // Refresh list
      // Success - real-time update will show the change
    } catch (err) {
      alert(err.response?.data?.message || 'Σφάλμα ανάθεσης οδηγού');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Διαχείριση Παραγγελιών</h5>
        <Form.Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: '300px' }}
          size="sm"
        >
          <option value="all">Όλες οι Παραγγελίες</option>
          <option value="pending_store">⏳ Αναμονή Καταστήματος</option>
          <option value="pricing">💰 Τιμολόγηση</option>
          <option value="pending_admin">👨‍💼 Εκκρεμείς (Admin)</option>
          <option value="pending_customer_confirm">⚠️ Αναμονή Πελάτη</option>
          <option value="confirmed">✅ Επιβεβαιωμένες</option>
          <option value="assigned">🚗 Ανατεθειμένες</option>
          <option value="accepted_driver">👍 Αποδοχή Οδηγού</option>
          <option value="preparing">👨‍🍳 Προετοιμασία</option>
          <option value="in_delivery">🚚 Σε Παράδοση</option>
          <option value="completed">🎉 Ολοκληρωμένες</option>
          <option value="cancelled">❌ Ακυρωμένες</option>
          <option value="rejected_store">❌ Απόρριψη Καταστήματος</option>
          <option value="rejected_driver">❌ Απόρριψη Οδηγού</option>
        </Form.Select>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Φόρτωση παραγγελιών...</p>
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
                    <small>{order.customer?.phone || order.customerPhone}</small>
                  </div>
                  
                  <div className="mb-2">
                    <small className="text-muted">Κατάστημα:</small><br />
                    <strong>{order.storeId?.businessName || order.storeName || 'N/A'}</strong>
                  </div>
                  
                  {(order.driverId?.name || order.driver?.name) && (
                    <div className="mb-2">
                      <small className="text-muted">Οδηγός:</small><br />
                      <strong>{order.driverId?.name || order.driver?.name}</strong>
                    </div>
                  )}
                  
                  <div className="mb-2">
                    <Row>
                      <Col xs={6}>
                        <small className="text-muted">Προϊόντα:</small><br />
                        <strong>{order.productPrice ? `€${order.productPrice.toFixed(2)}` : '-'}</strong>
                      </Col>
                      <Col xs={6}>
                        <small className="text-muted">Μεταφορικά:</small><br />
                        <strong>{order.deliveryFee ? `€${order.deliveryFee.toFixed(2)}` : '-'}</strong>
                      </Col>
                    </Row>
                  </div>
                  
                  <div className="mb-3">
                    <small className="text-muted">Σύνολο:</small><br />
                    <h5 className="mb-0 text-primary">
                      {order.totalPrice ? `€${order.totalPrice.toFixed(2)}` : '-'}
                    </h5>
                  </div>
                  
                  <div className="mb-2">
                    <small className="text-muted">
                      {new Date(order.createdAt).toLocaleString('el-GR')}
                    </small>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="d-grid gap-2">
                    {order.status === 'pending_admin' && (
                      <Button 
                        variant="primary"
                        onClick={() => handleOpenDeliveryFeeModal(order)}
                      >
                        💰 Προσθήκη Μεταφορικών
                      </Button>
                    )}
                    {['confirmed', 'rejected_driver'].includes(order.status) && (
                      <Button 
                        variant="success"
                        onClick={() => handleOpenAssignDriverModal(order)}
                      >
                        🚗 Ανάθεση Οδηγού
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
                <th>Κατάστημα</th>
                <th>Οδηγός</th>
                <th>Τιμή Προϊόντος</th>
                <th>Μεταφορικά</th>
                <th>Σύνολο</th>
                <th>Κατάσταση</th>
                <th>Ημερομηνία</th>
                <th>Ενέργειες</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td className="fw-bold">{order.orderNumber}</td>
                  <td>
                    {order.customer?.name || 'N/A'}
                    <br />
                    <small className="text-muted">{order.customer?.phone || order.customerPhone}</small>
                  </td>
                  <td>
                    {order.storeId?.businessName || order.storeName || 'N/A'}
                  </td>
                  <td>{order.driverId?.name || order.driver?.name || '-'}</td>
                  <td>{order.productPrice ? `€${order.productPrice.toFixed(2)}` : '-'}</td>
                  <td>{order.deliveryFee ? `€${order.deliveryFee.toFixed(2)}` : '-'}</td>
                  <td className="fw-bold">
                    {order.totalPrice ? `€${order.totalPrice.toFixed(2)}` : '-'}
                  </td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td>
                    <small>{new Date(order.createdAt).toLocaleString('el-GR')}</small>
                  </td>
                  <td>
                    {order.status === 'pending_admin' && (
                      <Button 
                        size="sm" 
                        variant="primary"
                        onClick={() => handleOpenDeliveryFeeModal(order)}
                      >
                        💰 Μεταφορικά
                      </Button>
                    )}
                    {['confirmed', 'rejected_driver'].includes(order.status) && (
                      <Button 
                        size="sm" 
                        variant="success"
                        onClick={() => handleOpenAssignDriverModal(order)}
                      >
                        🚗 Ανάθεση
                      </Button>
                    )}
                    {!['pending_admin', 'confirmed', 'rejected_driver'].includes(order.status) && (
                      <small className="text-muted">-</small>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Modal για Προσθήκη Μεταφορικών */}
      <Modal show={showDeliveryFeeModal} onHide={() => setShowDeliveryFeeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Προσθήκη Μεταφορικών</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              <p><strong>Παραγγελία:</strong> {selectedOrder.orderNumber}</p>
              <p><strong>Πελάτης:</strong> {selectedOrder.customer?.name}</p>
              <p><strong>Τιμή Προϊόντων:</strong> €{selectedOrder.productPrice?.toFixed(2)}</p>
              
              <Form.Group className="mt-3">
                <Form.Label>Ποσό Μεταφορικών (€)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.50"
                  min="0"
                  placeholder="π.χ. 3.50"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  autoFocus
                />
                <Form.Text className="text-muted">
                  Το συνολικό ποσό θα είναι: €{(parseFloat(selectedOrder.productPrice || 0) + parseFloat(deliveryFee || 0)).toFixed(2)}
                </Form.Text>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeliveryFeeModal(false)}>
            Ακύρωση
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddDeliveryFee}
            disabled={actionLoading}
          >
            {actionLoading ? 'Αποθήκευση...' : 'Προσθήκη Μεταφορικών'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal για Ανάθεση Οδηγού */}
      <Modal show={showAssignDriverModal} onHide={() => setShowAssignDriverModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ανάθεση Οδηγού</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              <p><strong>Παραγγελία:</strong> {selectedOrder.orderNumber}</p>
              <p><strong>Πελάτης:</strong> {selectedOrder.customer?.name}</p>
              <p><strong>Διεύθυνση:</strong> {selectedOrder.customer?.address}</p>
              <p><strong>Συνολικό Ποσό:</strong> €{selectedOrder.totalPrice?.toFixed(2)}</p>
              
              <Form.Group className="mt-3">
                <Form.Label>Επιλογή Οδηγού</Form.Label>
                <Form.Select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                >
                  <option value="">-- Επιλέξτε Οδηγό --</option>
                  {availableDrivers.map((driver) => (
                    <option key={driver._id} value={driver._id}>
                      {driver.name} - {driver.vehicle || driver.vehicleType} {driver.licensePlate || driver.vehiclePlate} 
                      {driver.isOnline ? ' 🟢 Online' : ' ⚪ Offline'}
                    </option>
                  ))}
                </Form.Select>
                {availableDrivers.length === 0 && (
                  <Form.Text className="text-danger">
                    Δεν υπάρχουν διαθέσιμοι οδηγοί αυτή τη στιγμή
                  </Form.Text>
                )}
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignDriverModal(false)}>
            Ακύρωση
          </Button>
          <Button 
            variant="success" 
            onClick={handleAssignDriver}
            disabled={actionLoading || !selectedDriver}
          >
            {actionLoading ? 'Ανάθεση...' : 'Ανάθεση Οδηγού'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OrdersTab;
