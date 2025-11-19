import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/api';
import socketService from '../../services/socket';
import AdminNavbar from '../../components/admin/AdminNavbar';
import StoresTab from '../../components/admin/StoresTab';
import DriversTab from '../../components/admin/DriversTab';
import OrdersTab from '../../components/admin/OrdersTab';
import CustomersTab from '../../components/admin/CustomersTab';
import NotificationToast from '../../components/NotificationToast';
import '../../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    fetchStats();
    
    // Socket.IO listeners for auto-switching to relevant tabs
    const handleNewOrder = (data) => {
      setActiveTab('orders'); // Auto-switch to orders tab
    };

    const handleStoreRegistration = (data) => {
      setActiveTab('stores'); // Auto-switch to stores tab
    };

    const handleDriverRegistration = (data) => {
      setActiveTab('drivers'); // Auto-switch to drivers tab
    };

    const handleOrderStatusChange = (data) => {
      // Check if it needs admin attention
      if (data.status === 'pending_admin' || data.status === 'confirmed') {
        setActiveTab('orders');
      }
    };

    socketService.on('order:new', handleNewOrder);
    socketService.on('store:registered', handleStoreRegistration);
    socketService.on('driver:registered', handleDriverRegistration);
    socketService.on('order:status_changed', handleOrderStatusChange);
    socketService.on('order:pending_admin', handleOrderStatusChange);

    return () => {
      socketService.off('order:new', handleNewOrder);
      socketService.off('store:registered', handleStoreRegistration);
      socketService.off('driver:registered', handleDriverRegistration);
      socketService.off('order:status_changed', handleOrderStatusChange);
      socketService.off('order:pending_admin', handleOrderStatusChange);
    };
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await adminService.getStats('today');
      setStats(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Σφάλμα φόρτωσης στατιστικών');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <AdminNavbar user={user} />
      <NotificationToast />
      
      <Container fluid className="py-4">
        {/* Statistics Cards */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Φόρτωση στατιστικών...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : stats ? (
          <Row className="mb-4">
            <Col md={3}>
              <Card className="stat-card shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1">Παραγγελίες Σήμερα</p>
                      <h3 className="mb-0">{stats.totalOrders || 0}</h3>
                    </div>
                    <div className="stat-icon bg-primary">
                      📦
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card className="stat-card shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1">Ολοκληρωμένες</p>
                      <h3 className="mb-0">{stats.completedOrders || 0}</h3>
                    </div>
                    <div className="stat-icon bg-success">
                      ✅
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card className="stat-card shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1">Έσοδα (€)</p>
                      <h3 className="mb-0">{stats.totalRevenue?.toFixed(2) || '0.00'}</h3>
                    </div>
                    <div className="stat-icon bg-warning">
                      💰
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card className="stat-card shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1">Ενεργά Καταστήματα</p>
                      <h3 className="mb-0">{stats.activeStores || 0}</h3>
                    </div>
                    <div className="stat-icon bg-info">
                      🏪
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        ) : null}

        {/* Tabs Section */}
        <Card className="shadow-sm">
          <Card.Body>
            <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
              <Nav variant="tabs" className="mb-4">
                <Nav.Item>
                  <Nav.Link eventKey="stores">
                    🏪 Καταστήματα
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="drivers">
                    🚗 Οδηγοί
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="orders">
                    📦 Παραγγελίες
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="customers">
                    👥 Πελάτες
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              <Tab.Content>
                <Tab.Pane eventKey="stores">
                  <StoresTab />
                </Tab.Pane>
                <Tab.Pane eventKey="drivers">
                  <DriversTab />
                </Tab.Pane>
                <Tab.Pane eventKey="orders">
                  <OrdersTab />
                </Tab.Pane>
                <Tab.Pane eventKey="customers">
                  <CustomersTab />
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default AdminDashboard;
