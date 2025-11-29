import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { customerService } from '../../services/api';
import socketService from '../../services/socket';
import '../../styles/Customer.css';

const CustomerOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef();
  const lastOrderRef = useRef();

  // Infinite scroll observer
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreOrders();
        }
      },
      { threshold: 0.1 }
    );

    if (lastOrderRef.current) {
      observer.observe(lastOrderRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, loadingMore, hasMore, orders]);

  const fetchOrders = useCallback(async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const response = await customerService.getMyOrders(page, 10);
      if (response.success) {
        if (append) {
          setOrders(prev => [...prev, ...response.orders]);
        } else {
          setOrders(response.orders);
        }
        setHasMore(response.hasMore || page < response.totalPages);
        setCurrentPage(page);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Σφάλμα φόρτωσης ιστορικού παραγγελιών');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadMoreOrders = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchOrders(currentPage + 1, true);
    }
  }, [currentPage, loadingMore, hasMore, fetchOrders]);

  useEffect(() => {
    fetchOrders(1, false);
    
    // Socket.IO real-time updates for customer orders
    const handleOrderUpdate = () => {
      // Refresh only first page to show new orders
      fetchOrders(1, false);
    };

    // Subscribe to all order events
    socketService.on('order:status_changed', handleOrderUpdate);
    socketService.on('order:pending_admin', handleOrderUpdate);
    socketService.on('order:price_ready', handleOrderUpdate);
    socketService.on('order:confirmed', handleOrderUpdate);
    socketService.on('order:assigned', handleOrderUpdate);
    socketService.on('driver:accepted', handleOrderUpdate);
    socketService.on('order:completed', handleOrderUpdate);
    socketService.on('order:cancelled', handleOrderUpdate);

    return () => {
      socketService.off('order:status_changed', handleOrderUpdate);
      socketService.off('order:pending_admin', handleOrderUpdate);
      socketService.off('order:price_ready', handleOrderUpdate);
      socketService.off('order:confirmed', handleOrderUpdate);
      socketService.off('order:assigned', handleOrderUpdate);
      socketService.off('driver:accepted', handleOrderUpdate);
      socketService.off('order:completed', handleOrderUpdate);
      socketService.off('order:cancelled', handleOrderUpdate);
    };
  }, [fetchOrders]);

  const getStatusBadge = (status) => {
    const statusMap = {
      pending_store: { bg: 'warning', text: 'Αναμονή' },
      pricing: { bg: 'info', text: 'Τιμολόγηση' },
      pending_admin: { bg: 'primary', text: 'Έλεγχος' },
      pending_customer_confirm: { bg: 'warning', text: 'Επιβεβαίωση' },
      confirmed: { bg: 'success', text: 'Επιβεβαιώθηκε' },
      assigned: { bg: 'info', text: 'Ανατέθηκε' },
      accepted_driver: { bg: 'primary', text: 'Οδηγός καθοδόν' },
      preparing: { bg: 'warning', text: 'Προετοιμασία' },
      in_delivery: { bg: 'primary', text: 'Σε παράδοση' },
      completed: { bg: 'success', text: 'Ολοκληρώθηκε' },
      cancelled: { bg: 'danger', text: 'Ακυρώθηκε' },
      rejected_store: { bg: 'danger', text: 'Απορρίφθηκε' },
      rejected_driver: { bg: 'danger', text: 'Απορρίφθηκε' }
    };
    const info = statusMap[status] || { bg: 'secondary', text: status };
    return <Badge bg={info.bg}>{info.text}</Badge>;
  };

  return (
    <div className="app-container" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <style>
        {`
          ::-webkit-scrollbar {
            display: none;
          }
          * {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
      <Container className="p-0" fluid>
        <Row className="justify-content-center m-0">
          <Col xs={12} sm={12} md={8} lg={6} xl={5} className="p-0 bg-white min-vh-100 shadow-sm position-relative">
            <header className="app-header">
              <div className="header-content">
                <button className="btn-icon" onClick={() => navigate('/order')}>
                  <i className="fas fa-arrow-left"></i>
                </button>
                <h3>Οι Παραγγελίες μου</h3>
                <div style={{ width: 32 }}></div>
              </div>
            </header>

            <div className="main-content p-3">
              {loading ? (
                <div className="text-center mt-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : error ? (
                <Alert variant="danger">{error}</Alert>
              ) : orders.length === 0 ? (
                <div className="text-center mt-5">
                  <p className="text-muted">Δεν έχετε καμία παραγγελία ακόμα.</p>
                  <Button variant="primary" onClick={() => navigate('/order')}>
                    Κάντε την πρώτη σας παραγγελία!
                  </Button>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map((order, index) => (
                    <Card 
                      key={order._id} 
                      ref={index === orders.length - 1 ? lastOrderRef : null}
                      className="mb-3 shadow-sm border-0 cursor-pointer"
                      onClick={() => navigate(`/order-status/${order.orderNumber}`)}
                    >
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1">{order.storeName || order.storeId?.businessName}</h6>
                            <small className="text-muted">
                              {new Date(order.createdAt).toLocaleDateString('el-GR', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </small>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                        
                        <div className="d-flex justify-content-between align-items-end">
                          <small className="text-muted">
                            {order.orderContent ? 
                              (order.orderContent.length > 30 ? order.orderContent.substring(0, 30) + '...' : order.orderContent) 
                              : 'Φωνητική παραγγελία'}
                          </small>
                          {order.totalPrice > 0 && (
                            <span className="fw-bold text-primary">€{order.totalPrice.toFixed(2)}</span>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                  
                  {/* Loading more indicator */}
                  {loadingMore && (
                    <div className="text-center py-3">
                      <Spinner animation="border" size="sm" variant="primary" />
                      <small className="ms-2 text-muted">Φόρτωση περισσότερων...</small>
                    </div>
                  )}
                  
                  {/* End of list */}
                  {!hasMore && orders.length > 0 && (
                    <div className="text-center py-3">
                      <small className="text-muted">Τέλος λίστας παραγγελιών</small>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CustomerOrders;
