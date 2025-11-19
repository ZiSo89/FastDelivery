import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Form, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { driverService } from '../../services/api';
import socketService from '../../services/socket';
import DriverNavbar from '../../components/driver/DriverNavbar';
import DriverOrders from '../../components/driver/DriverOrders';
import NotificationToast from '../../components/NotificationToast';
import '../../styles/DriverDashboard.css';

const DriverDashboard = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      const response = await driverService.getProfile();
      // Backend επιστρέφει { success: true, driver: {...} }
      const driverData = response.driver || response.data || response;
      setProfile(driverData);
      setIsOnline(driverData.isOnline || false);
      setError('');
    } catch (err) {
      console.error('Profile fetch error:', err);
      // Αν αποτύχει το API, χρησιμοποίησε τα στοιχεία από το user object
      if (user) {
        setProfile({
          name: user.name || 'Οδηγός',
          email: user.email,
          vehicleType: user.vehicleType || 'N/A',
          vehiclePlate: user.vehiclePlate || 'N/A',
          status: user.status || 'pending',
          isOnline: false
        });
      }
      setError(err.response?.data?.message || 'Σφάλμα φόρτωσης προφίλ');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();

    // Listen for driver status changes
    const handleStatusChange = async (data) => {
      // If approved, show message and reload page to get new token
      if (data.status === 'approved' && data.isApproved) {
        setStatusMessage('✅ Η εγγραφή σας εγκρίθηκε! Η σελίδα θα ανανεωθεί...');
        
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

    // Listen for new order assignments - show notification
    const handleOrderAssigned = (data) => {
      setStatusMessage(`📦 Νέα παραγγελία ανατέθηκε: ${data.orderNumber || ''}`);
      setTimeout(() => setStatusMessage(''), 5000);
    };

    socketService.on('driver:status_changed', handleStatusChange);
    socketService.on('order:assigned', handleOrderAssigned);

    return () => {
      socketService.off('driver:status_changed', handleStatusChange);
      socketService.off('order:assigned', handleOrderAssigned);
    };
  }, [fetchProfile, user, updateUser]);

  const handleToggleOnline = async () => {
    try {
      const newStatus = !isOnline;
      await driverService.setAvailability(newStatus);
      setIsOnline(newStatus);
      alert(newStatus ? 'Είστε τώρα διαθέσιμος!' : 'Είστε τώρα offline');
    } catch (err) {
      alert(err.response?.data?.message || 'Σφάλμα');
    }
  };

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
    <div className="driver-dashboard">
      <DriverNavbar user={user} profile={profile} />
      <NotificationToast />
      
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
            <Col md={8}>
              <Card className="shadow-sm">
                <Card.Body>
                  <h4>🚗 {profile.name}</h4>
                  <p className="mb-0">
                    <Badge bg={profile.status === 'approved' ? 'success' : 'warning'}>
                      {profile.status === 'approved' ? 'Εγκεκριμένος' : 'Εκκρεμεί'}
                    </Badge>
                    {' · '}
                    <span className="text-muted">{profile.vehicleType} - {profile.vehiclePlate}</span>
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className={`shadow-sm ${isOnline ? 'border-success' : 'border-secondary'}`}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6>Διαθεσιμότητα</h6>
                      <Badge bg={isOnline ? 'success' : 'secondary'} className="fs-6">
                        {isOnline ? '🟢 Online' : '⚫ Offline'}
                      </Badge>
                    </div>
                    <Form.Check
                      type="switch"
                      id="online-switch"
                      checked={isOnline}
                      onChange={handleToggleOnline}
                      className="fs-3"
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        <Card className="shadow-sm">
          <Card.Body>
            <h5 className="mb-4">📦 Οι Παραγγελίες μου</h5>
            <DriverOrders />
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default DriverDashboard;
