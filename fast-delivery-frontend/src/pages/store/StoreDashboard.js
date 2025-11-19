import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Badge, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { storeService } from '../../services/api';
import StoreNavbar from '../../components/store/StoreNavbar';
import StoreProfile from '../../components/store/StoreProfile';
import StoreOrders from '../../components/store/StoreOrders';
import '../../styles/StoreDashboard.css';

const StoreDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('orders');

  const fetchProfile = useCallback(async () => {
    try {
      const response = await storeService.getProfile();
      // Backend επιστρέφει { success: true, store: {...} }
      const storeData = response.store || response.data || response;
      setProfile(storeData);
      setError('');
    } catch (err) {
      console.error('Profile fetch error:', err);
      // Αν αποτύχει το API, χρησιμοποίησε τα στοιχεία από το user object
      if (user) {
        setProfile({
          businessName: user.businessName || 'Κατάστημα',
          email: user.email,
          phone: user.phone || 'N/A',
          address: user.address || 'N/A',
          status: user.status || 'pending'
        });
      }
      setError(err.response?.data?.message || 'Σφάλμα φόρτωσης προφίλ');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Φόρτωση...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="store-dashboard">
      <StoreNavbar user={user} profile={profile} />
      
      <Container fluid className="py-4">
        {error && (
          <Alert variant="warning" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {profile && (
          <Row className="mb-4">
            <Col>
              <Card className="shadow-sm">
                <Card.Body>
                  <h4>🏪 {profile.businessName || profile.storeName}</h4>
                  <p className="mb-0">
                    <Badge bg={profile.status === 'approved' ? 'success' : 'warning'}>
                      {profile.status === 'approved' ? 'Εγκεκριμένο' : 'Εκκρεμεί'}
                    </Badge>
                    {' · '}
                    <span className="text-muted">{profile.storeType}</span>
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        <Card className="shadow-sm">
          <Card.Body>
            <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
              <Nav variant="tabs" className="mb-4">
                <Nav.Item>
                  <Nav.Link eventKey="orders">📦 Παραγγελίες</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="profile">⚙️ Προφίλ</Nav.Link>
                </Nav.Item>
              </Nav>

              <Tab.Content>
                <Tab.Pane eventKey="orders">
                  <StoreOrders />
                </Tab.Pane>
                <Tab.Pane eventKey="profile">
                  <StoreProfile profile={profile} onUpdate={fetchProfile} />
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default StoreDashboard;
