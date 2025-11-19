import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Badge, Spinner, Alert, ButtonGroup, Card, Row, Col } from 'react-bootstrap';
import { driverService } from '../../services/api';
import socketService from '../../services/socket';

const DriverOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
    
    // Socket.IO real-time listeners for driver (replaces 30s polling)
    const handleOrderAssigned = (data) => {
      fetchOrders(); // Refresh list
    };

    const handleOrderStatusChanged = (data) => {
      fetchOrders(); // Refresh list
    };

    const handleOrderCancelled = (data) => {
      fetchOrders(); // Refresh list
    };

    const handleOrderCompleted = (data) => {
      fetchOrders(); // Refresh list
    };

    // Subscribe to events
    socketService.on('order:assigned', handleOrderAssigned);
    socketService.on('order:status_changed', handleOrderStatusChanged);
    socketService.on('order:cancelled', handleOrderCancelled);
    socketService.on('order:completed', handleOrderCompleted);

    // Cleanup on unmount
    return () => {
      socketService.off('order:assigned', handleOrderAssigned);
      socketService.off('order:status_changed', handleOrderStatusChanged);
      socketService.off('order:cancelled', handleOrderCancelled);
      socketService.off('order:completed', handleOrderCompleted);
    };
  }, [fetchOrders]);

  const handleAccept = async (orderId) => {
    try {
      setProcessingId(orderId);
      await driverService.acceptOrder(orderId, true);
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
      await driverService.acceptOrder(orderId, false, reason);
      await fetchOrders();
      // Success - real-time update will show the change
    } catch (err) {
      alert(err.response?.data?.message || 'Σφάλμα');
    } finally {
      setProcessingId(null);
    }
  };

  const handlePickup = async (orderId) => {
    try {
      setProcessingId(orderId);
      await driverService.updateStatus(orderId, 'in_delivery');
      await fetchOrders();
      // Success - real-time update will show the change
    } catch (err) {
      alert(err.response?.data?.message || 'Σφάλμα');
    } finally {
      setProcessingId(null);
    }
  };

  const handleComplete = async (orderId) => {
    if (!window.confirm('Είστε σίγουρος ότι ολοκληρώθηκε η παράδοση;')) return;

    try {
      setProcessingId(orderId);
      await driverService.updateStatus(orderId, 'completed');
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
                    <small>{order.storeId?.address}</small>
                  </div>
                  
                  <div className="mb-2">
                    <small className="text-muted">📍 Διεύθυνση Παράδοσης:</small><br />
                    {order.customer?.address || order.deliveryAddress}
                  </div>
                  
                  <div className="mb-2">
                    <small className="text-muted">📞 Τηλέφωνο:</small><br />
                    <strong>{order.customer?.phone || order.customerPhone}</strong>
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
                    <small className="text-muted">{order.storeId?.address}</small>
                  </td>
                  <td>{order.customer?.address || order.deliveryAddress}</td>
                  <td>{order.customer?.phone || order.customerPhone}</td>
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
    </>
  );
};

export default DriverOrders;
