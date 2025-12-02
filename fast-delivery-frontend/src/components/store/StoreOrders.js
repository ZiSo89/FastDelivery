import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Button, Badge, Spinner, Alert, ButtonGroup, Modal, Form, Card, Row, Col, Pagination } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { storeService } from '../../services/api';
import socketService from '../../services/socket';
import AlertModal from '../AlertModal';
import { useNotification } from '../../context/NotificationContext';

const StoreOrders = () => {
  const { user } = useAuth();
  const { removeNotificationsByRelatedId } = useNotification();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('in_progress');
  const [processingId, setProcessingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [productPrice, setProductPrice] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [alertModal, setAlertModal] = useState({ show: false, variant: 'success', message: '' });
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectOrderId, setRejectOrderId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
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

  const fetchOrders = useCallback(async (currentFilter = null, page = 1) => {
    try {
      setLoading(true);
      const filterToUse = currentFilter !== null ? currentFilter : filterRef.current;
      
      // For in_progress, we need all recent orders - use higher limit without pagination
      // For 'all' and specific statuses, use pagination
      if (filterToUse === 'in_progress') {
        // Fetch more orders without pagination for in_progress filter
        const response = await storeService.getOrders(null, 1, 100);
        let allOrders = response.orders || response.data || [];
        
        // Filter for "Σε Εξέλιξη": all orders from last 3 hours except completed
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
        allOrders = allOrders.filter(order => {
          const isNotCompleted = order.status !== 'completed';
          const isRecent = new Date(order.createdAt) >= threeHoursAgo;
          return isNotCompleted && isRecent;
        });
        
        setOrders(allOrders);
        setTotalPages(1);
        setTotalCount(allOrders.length);
        setCurrentPage(1);
      } else {
        // For 'all' or specific status, use pagination
        const statusFilter = filterToUse === 'all' ? null : filterToUse;
        const response = await storeService.getOrders(statusFilter, page, 20);
        
        setOrders(response.orders || response.data || []);
        setTotalPages(response.pages || 1);
        setTotalCount(response.total || 0);
        setCurrentPage(page);
      }
      
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Σφάλμα φόρτωσης παραγγελιών');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch orders when filter changes - reset to page 1
  useEffect(() => {
    setCurrentPage(1);
    fetchOrders(filter, 1);
  }, [filter, fetchOrders]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchOrders(filter, page);
  };

  // Helper function to update a single order in state (optimized - no full refetch)
  const updateOrderInState = useCallback(async (orderId) => {
    if (!orderId) return;
    try {
      const response = await storeService.getOrderById(orderId);
      const updatedOrder = response.order || response.data?.order || response;
      if (updatedOrder) {
        setOrders(prev => {
          const exists = prev.find(o => o._id === updatedOrder._id);
          if (exists) {
            // Update existing order
            return prev.map(o => o._id === updatedOrder._id ? updatedOrder : o);
          } else {
            // New order - add to beginning if viewing in_progress
            if (filterRef.current === 'in_progress') {
              return [updatedOrder, ...prev];
            }
            return prev;
          }
        });
      }
    } catch (err) {
      console.error('Failed to update single order:', err);
      // Fallback to full refresh on error
      fetchOrders();
    }
  }, [fetchOrders]);

  // Helper to remove order from state (for completed/cancelled when viewing in_progress)
  const removeOrderFromState = useCallback((orderId) => {
    if (!orderId) return;
    setOrders(prev => prev.filter(o => o._id !== orderId && o._id?.toString() !== orderId));
  }, []);

  // Socket.IO listeners (setup once, never recreate)
  useEffect(() => {
    // Helper function to check if event is for this store
    const isMyOrder = (data) => {
      const match = data.storeId && user?._id && data.storeId.toString() === user._id.toString();
      return match;
    };
    
    // Socket.IO real-time listeners for store - optimized to update single order
    const handleNewOrder = (data) => {
      if (isMyOrder(data)) {
        // For new orders, add to list if viewing in_progress
        if (filterRef.current === 'in_progress') {
          updateOrderInState(data.orderId);
        }
      }
    };

    const handleOrderCancelled = (data) => {
      if (isMyOrder(data)) {
        if (filterRef.current === 'in_progress') {
          removeOrderFromState(data.orderId);
        } else {
          updateOrderInState(data.orderId);
        }
      }
    };

    const handleDriverAccepted = (data) => {
      if (isMyOrder(data)) updateOrderInState(data.orderId);
    };

    const handleOrderStatusChanged = (data) => {
      if (isMyOrder(data)) {
        if (filterRef.current === 'in_progress' && data.newStatus === 'completed') {
          removeOrderFromState(data.orderId);
        } else {
          updateOrderInState(data.orderId);
        }
      }
    };

    const handleOrderPendingAdmin = (data) => {
      if (isMyOrder(data)) updateOrderInState(data.orderId);
    };

    const handleOrderPriceReady = (data) => {
      if (isMyOrder(data)) updateOrderInState(data.orderId);
    };

    const handleOrderAssigned = (data) => {
      if (isMyOrder(data)) updateOrderInState(data.orderId);
    };

    const handleOrderCompleted = (data) => {
      if (isMyOrder(data)) {
        if (filterRef.current === 'in_progress') {
          removeOrderFromState(data.orderId);
        } else {
          updateOrderInState(data.orderId);
        }
      }
    };

    const handleOrderConfirmed = (data) => {
      if (isMyOrder(data)) updateOrderInState(data.orderId);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, updateOrderInState, removeOrderFromState]); // Re-attach listeners when user or helpers change

  const handleAccept = async (orderId) => {
    try {
      setProcessingId(orderId);
      await storeService.acceptOrder(orderId, true);
      // Find order to get orderNumber
      const order = orders.find(o => o._id === orderId);
      if (order) removeNotificationsByRelatedId(order.orderNumber);
      
      // Update only this order instead of fetching all
      await updateOrderInState(orderId);
    } catch (err) {
      setAlertModal({
        show: true,
        variant: 'danger',
        message: err.response?.data?.message || 'Σφάλμα'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (orderId) => {
    setRejectOrderId(orderId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const submitReject = async () => {
    if (!rejectReason || rejectReason.trim().length === 0) {
      setAlertModal({
        show: true,
        variant: 'warning',
        message: 'Παρακαλώ εισάγετε λόγο απόρριψης'
      });
      return;
    }

    try {
      setProcessingId(rejectOrderId);
      await storeService.acceptOrder(rejectOrderId, false, rejectReason);
      
      // Find order to get orderNumber
      const order = orders.find(o => o._id === rejectOrderId);
      if (order) removeNotificationsByRelatedId(order.orderNumber);

      setShowRejectModal(false);
      // Update only this order instead of fetching all
      await updateOrderInState(rejectOrderId);
    } catch (err) {
      setAlertModal({
        show: true,
        variant: 'danger',
        message: err.response?.data?.message || 'Σφάλμα'
      });
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
      setAlertModal({
        show: true,
        variant: 'warning',
        message: 'Παρακαλώ εισάγετε έγκυρη τιμή'
      });
      return;
    }

    try {
      await storeService.setPrice(selectedOrder._id, parseFloat(productPrice));
      removeNotificationsByRelatedId(selectedOrder.orderNumber);
      setShowModal(false);
      // Update only this order instead of fetching all
      await updateOrderInState(selectedOrder._id);
    } catch (err) {
      setAlertModal({
        show: true,
        variant: 'danger',
        message: err.response?.data?.message || 'Σφάλμα'
      });
    }
  };

  const handlePreparing = async (orderId) => {
    try {
      setProcessingId(orderId);
      await storeService.updateStatus(orderId, 'preparing');
      
      // Find order to get orderNumber
      const order = orders.find(o => o._id === orderId);
      if (order) removeNotificationsByRelatedId(order.orderNumber);

      // Update only this order instead of fetching all
      await updateOrderInState(orderId);
    } catch (err) {
      setAlertModal({
        show: true,
        variant: 'danger',
        message: err.response?.data?.message || 'Σφάλμα'
      });
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

      {/* Order count - show for paginated filters */}
      {filter !== 'in_progress' && totalCount > 0 && (
        <div className="text-muted mb-3">
          <small>Σύνολο: {totalCount} παραγγελίες (Σελίδα {currentPage} από {totalPages})</small>
        </div>
      )}

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
                    <a href={`tel:${order.customer?.phone || order.customerPhone}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <small>📞 {order.customer?.phone || order.customerPhone || 'N/A'}</small>
                    </a><br />
                    <small>📍 {order.customer?.address || order.deliveryAddress || 'N/A'}</small>
                  </div>
                  
                  <div className="mb-2">
                    <small className="text-muted">Παραγγελία:</small><br />
                    {order.orderType === 'voice' && (
                      <div className="mb-2">
                        <span className="badge bg-info mb-1">🎤 Φωνητική</span>
                        {order.orderVoiceUrl && (
                          <audio controls src={order.orderVoiceUrl} className="w-100" style={{ height: '32px' }} />
                        )}
                      </div>
                    )}
                    {order.orderContent && <div>{order.orderContent}</div>}
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
                        variant="success"
                        onClick={() => handlePreparing(order._id)}
                        disabled={processingId === order._id}
                      >
                        ✅ Έτοιμο για Παραλαβή
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
                    <a href={`tel:${order.customer?.phone || order.customerPhone}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <small className="text-muted">
                        📞 {order.customer?.phone || order.customerPhone || 'N/A'}
                      </small>
                    </a><br />
                    <small className="text-muted">
                      📍 {order.customer?.address || order.deliveryAddress || 'N/A'}
                    </small>
                  </td>
                  <td>
                    {order.orderType === 'voice' && (
                      <div className="mb-1">
                        <span className="badge bg-info me-1">🎤 Φωνητική</span>
                        {order.orderVoiceUrl && (
                          <audio controls src={order.orderVoiceUrl} style={{ height: '32px', maxWidth: '200px' }} />
                        )}
                      </div>
                    )}
                    {order.orderContent}
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
                        variant="success"
                        size="sm"
                        onClick={() => handlePreparing(order._id)}
                        disabled={processingId === order._id}
                      >
                        ✅ Έτοιμο για Παραλαβή
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Pagination - only show for 'all' and specific status filters */}
      {filter !== 'in_progress' && totalPages > 1 && (
        <div className="d-flex justify-content-center mt-3">
          <Pagination className="mb-0">
            <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
            <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
            {[...Array(Math.min(5, totalPages))].map((_, idx) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = idx + 1;
              } else if (currentPage <= 3) {
                pageNum = idx + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + idx;
              } else {
                pageNum = currentPage - 2 + idx;
              }
              return (
                <Pagination.Item
                  key={pageNum}
                  active={pageNum === currentPage}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Pagination.Item>
              );
            })}
            <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
            <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
          </Pagination>
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

      {/* Reject Order Modal */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Απόρριψη Παραγγελίας</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Λόγος Απόρριψης <span className="text-danger">*</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Εισάγετε τον λόγο απόρριψης..."
              maxLength={200}
            />
            <Form.Text className="text-muted">
              {rejectReason.length}/200 χαρακτήρες
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
            Ακύρωση
          </Button>
          <Button 
            variant="danger" 
            onClick={submitReject}
            disabled={!rejectReason || rejectReason.trim().length === 0}
          >
            Απόρριψη Παραγγελίας
          </Button>
        </Modal.Footer>
      </Modal>

      <AlertModal
        show={alertModal.show}
        onHide={() => setAlertModal({ ...alertModal, show: false })}
        variant={alertModal.variant}
        message={alertModal.message}
      />
    </>
  );
};

export default StoreOrders;
