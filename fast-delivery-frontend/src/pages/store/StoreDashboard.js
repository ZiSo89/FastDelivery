import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Badge, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { storeService } from '../../services/api';
import socketService from '../../services/socket';
import StoreNavbar from '../../components/store/StoreNavbar';
import StoreProfile from '../../components/store/StoreProfile';
import StoreOrders from '../../components/store/StoreOrders';
import '../../styles/StoreDashboard.css';

const StoreDashboard = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('orders');
  const [statusMessage, setStatusMessage] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await storeService.getProfile();
      // Backend επιστρέφει { success: true, store: {...} }
      const storeData = response.store || response.data || response;
      setProfile(storeData);
      // Set isOnline from profile (default true if not set)
      setIsOnline(storeData.isOnline !== false);
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

    // Listen for store status changes
    const handleStatusChange = async (data) => {
      // If approved, show message and reload page to get new token
      if (data.status === 'approved' && data.isApproved) {
        setStatusMessage('✅ Το κατάστημά σας εγκρίθηκε! Η σελίδα θα ανανεωθεί...');
        
        // Wait 2 seconds to show message, then reload
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setStatusMessage(data.message);
        
        // Refresh profile to get updated status
        fetchProfile();
        
        // Update user in context
        if (user) {
          const updatedUser = {
            ...user,
            status: data.status,
            isApproved: data.isApproved
          };
          updateUser(updatedUser);
        }

        // Clear message after 5 seconds
        setTimeout(() => setStatusMessage(''), 5000);
      }
    };

    // Listen for new orders - auto switch to orders tab
    const handleNewOrder = (data) => {
      // FILTER: Only show notification if this order is for THIS store
      if (data.storeId && user?._id && data.storeId.toString() === user._id.toString()) {
        setActiveTab('orders'); // Auto-switch to orders tab
        setStatusMessage(`📦 Νέα παραγγελία: ${data.orderNumber || ''}`);
        setTimeout(() => setStatusMessage(''), 5000);
      }
    };

    socketService.on('store:status_changed', handleStatusChange);
    socketService.on('order:new', handleNewOrder);

    return () => {
      socketService.off('store:status_changed', handleStatusChange);
      socketService.off('order:new', handleNewOrder);
    };
  }, [fetchProfile, user, updateUser]);

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
      <StoreNavbar user={user} profile={profile} isOnline={isOnline} setIsOnline={setIsOnline} />
      
      <Container fluid className="py-4">
        {statusMessage && (
          <Alert variant="info" dismissible onClose={() => setStatusMessage('')}>
            {statusMessage}
          </Alert>
        )}
        
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
