import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Form, Alert, Modal, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { driverService } from '../../services/api';
import socketService from '../../services/socket';
import DriverNavbar from '../../components/driver/DriverNavbar';
import DriverOrders from '../../components/driver/DriverOrders';
import '../../styles/DriverDashboard.css';

const DriverDashboard = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  
  // Modal states
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [pendingOnlineStatus, setPendingOnlineStatus] = useState(false);

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
      // FILTER: Only show notification if this order is assigned to THIS driver
      if (data.driverId && user?._id && data.driverId.toString() === user._id.toString()) {
        setStatusMessage(`📦 Νέα παραγγελία ανατέθηκε: ${data.orderNumber || ''}`);
        setTimeout(() => setStatusMessage(''), 5000);
      }
    };

    socketService.on('driver:status_changed', handleStatusChange);
    socketService.on('order:assigned', handleOrderAssigned);

    return () => {
      socketService.off('driver:status_changed', handleStatusChange);
      socketService.off('order:assigned', handleOrderAssigned);
    };
  }, [fetchProfile, user, updateUser]);

  const handleToggleOnline = async () => {
    const newStatus = !isOnline;
    
    // Αν γίνεται online, αλλάζει απευθείας χωρίς modal
    if (newStatus) {
      try {
        await driverService.setAvailability(true);
        setIsOnline(true);
      } catch (err) {
        setError(err.response?.data?.message || 'Σφάλμα αλλαγής διαθεσιμότητας');
      }
    } else {
      // Αν γίνεται offline, δείχνει modal επιβεβαίωσης
      setPendingOnlineStatus(newStatus);
      setShowAvailabilityModal(true);
    }
  };

  const confirmToggleOnline = async () => {
    try {
      await driverService.setAvailability(pendingOnlineStatus);
      setIsOnline(pendingOnlineStatus);
      setShowAvailabilityModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Σφάλμα αλλαγής διαθεσιμότητας');
      setShowAvailabilityModal(false);
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
      <div className="dashboard-content-wrapper">
        <DriverNavbar user={user} profile={profile} />
        
        {/* Compact Status Bar */}
        <div className={`status-bar-sticky ${isOnline ? 'bg-online' : 'bg-offline'}`}>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <div className={`status-indicator ${isOnline ? 'pulse' : ''}`}></div>
              <span className="status-text ms-2">
                {isOnline ? 'Είστε Online' : 'Είστε Offline'}
              </span>
            </div>
            <Form.Check
              type="switch"
              id="online-switch"
              checked={isOnline}
              onChange={handleToggleOnline}
              className="custom-switch"
            />
          </div>
        </div>

        <div className="dashboard-content p-3">
          {statusMessage && (
            <Alert variant="info" dismissible onClose={() => setStatusMessage('')} className="mb-3 shadow-sm border-0">
              {statusMessage}
            </Alert>
          )}
          
          {error && (
            <Alert variant="warning" dismissible onClose={() => setError('')} className="mb-3 shadow-sm border-0">
              {error}
            </Alert>
          )}
          
          <DriverOrders />
        </div>

        {/* Availability Confirmation Modal */}
        <Modal 
          show={showAvailabilityModal} 
          onHide={() => setShowAvailabilityModal(false)}
          centered
          className="driver-modal"
        >
          <Modal.Header closeButton>
            <Modal.Title>⚫ Απενεργοποίηση</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Θα σταματήσετε να λαμβάνετε νέες παραγγελίες.</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAvailabilityModal(false)}>
              Άκυρο
            </Button>
            <Button variant="dark" onClick={confirmToggleOnline}>
              Επιβεβαίωση
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default DriverDashboard;
