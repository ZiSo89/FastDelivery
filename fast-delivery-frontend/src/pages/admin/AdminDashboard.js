import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/api';
import AdminNavbar from '../../components/admin/AdminNavbar';
import StoresTab from '../../components/admin/StoresTab';
import DriversTab from '../../components/admin/DriversTab';
import OrdersTab from '../../components/admin/OrdersTab';
import CustomersTab from '../../components/admin/CustomersTab';
import '../../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('stores');

  useEffect(() => {
    fetchStats();
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
