import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Badge, Spinner, Alert, ButtonGroup, Modal, Form } from 'react-bootstrap';
import { storeService } from '../../services/api';

const StoreOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending_store');
  const [processingId, setProcessingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [productPrice, setProductPrice] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await storeService.getOrders(filter === 'all' ? null : filter);
      // Backend επιστρέφει { success: true, orders: [...] }
      setOrders(response.orders || response.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Σφάλμα φόρτωσης παραγγελιών');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleAccept = async (orderId) => {
    try {
      setProcessingId(orderId);
      await storeService.acceptOrder(orderId, true);
      await fetchOrders();
      alert('Η παραγγελία έγινε αποδεκτή!');
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
      alert('Η παραγγελία απορρίφθηκε');
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
      alert('Η τιμή καταχωρήθηκε!');
    } catch (err) {
      alert(err.response?.data?.message || 'Σφάλμα');
    }
  };

  const handlePreparing = async (orderId) => {
    try {
      setProcessingId(orderId);
      await storeService.updateStatus(orderId, 'preparing');
      await fetchOrders();
      alert('Η παραγγελία είναι σε προετοιμασία!');
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
      confirmed: { bg: 'success', label: 'Επιβεβαιωμένη' },
      assigned: { bg: 'info', label: 'Ανατέθηκε' },
      accepted_driver: { bg: 'primary', label: 'Οδηγός Αποδέχτηκε' },
      preparing: { bg: 'warning', label: 'Προετοιμασία' },
      in_delivery: { bg: 'primary', label: 'Σε Παράδοση' },
      completed: { bg: 'success', label: 'Ολοκληρώθηκε' },
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
            variant={filter === 'pending_store' ? 'warning' : 'outline-warning'}
            onClick={() => setFilter('pending_store')}
            size="sm"
          >
            Νέες
          </Button>
          <Button
            variant={filter === 'pricing' ? 'info' : 'outline-info'}
            onClick={() => setFilter('pricing')}
            size="sm"
          >
            Τιμολόγηση
          </Button>
          <Button
            variant={filter === 'accepted_driver' ? 'primary' : 'outline-primary'}
            onClick={() => setFilter('accepted_driver')}
            size="sm"
          >
            Σε Εξέλιξη
          </Button>
          <Button
            variant={filter === 'all' ? 'secondary' : 'outline-secondary'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            Όλες
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
      ) : (
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
