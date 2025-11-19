import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Form, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { driverService } from '../../services/api';
import DriverNavbar from '../../components/driver/DriverNavbar';
import DriverOrders from '../../components/driver/DriverOrders';
import '../../styles/DriverDashboard.css';

const DriverDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
  }, [fetchProfile]);

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
      
      <Container fluid className="py-4">
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
