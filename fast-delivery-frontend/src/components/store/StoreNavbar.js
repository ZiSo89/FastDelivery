import React, { useState } from 'react';
import { Navbar, Container, Nav, Dropdown, Button, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { storeService } from '../../services/api';

const StoreNavbar = ({ user, profile, isOnline, setIsOnline }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleToggleOnline = async () => {
    if (isOnline) {
      // Going offline - show confirmation
      setShowConfirmModal(true);
    } else {
      // Going online - no confirmation needed
      await toggleStatus(true);
    }
  };

  const toggleStatus = async (newStatus) => {
    try {
      setLoading(true);
      await storeService.toggleOnlineStatus(newStatus);
      setIsOnline(newStatus);
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Toggle status error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar bg="success" variant="dark" expand="lg" className="shadow-sm">
        <Container fluid>
          <Navbar.Brand onClick={() => navigate('/store')} style={{ cursor: 'pointer' }}>
            <span className="fw-bold">🏪 Fast Delivery</span>
            <span className="ms-2 badge bg-light text-success d-none d-sm-inline">Κατάστημα</span>
          </Navbar.Brand>
          
          {/* Mobile: Show buttons inline without hamburger menu */}
          <div className="d-flex align-items-center d-lg-none">
            {/* Online/Offline Toggle - Mobile */}
            <Button
              variant={isOnline ? 'light' : 'outline-light'}
              size="sm"
              className="me-2 d-flex align-items-center"
              onClick={handleToggleOnline}
              disabled={loading}
              style={{ padding: '4px 8px' }}
            >
              <span 
                style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: isOnline ? '#28a745' : '#dc3545',
                  marginRight: '4px',
                  display: 'inline-block'
                }} 
              />
              {isOnline ? 'Online' : 'Offline'}
            </Button>

            {/* Dropdown - Mobile */}
            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-light" size="sm" id="user-dropdown-mobile">
                🏪
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item disabled>
                  <small className="text-muted">{user?.email}</small>
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>
                  🚪 Αποσύνδεση
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
          
          {/* Desktop: Normal navbar */}
          <Navbar.Collapse id="store-navbar" className="justify-content-end d-none d-lg-flex">
            <Nav className="align-items-center">
              {/* Online/Offline Toggle - Desktop */}
              <Button
                variant={isOnline ? 'light' : 'outline-light'}
                size="sm"
                className="me-3 d-flex align-items-center"
                onClick={handleToggleOnline}
                disabled={loading}
                style={{ minWidth: '120px' }}
              >
                <span 
                  style={{ 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '50%', 
                    backgroundColor: isOnline ? '#28a745' : '#dc3545',
                    marginRight: '8px',
                    display: 'inline-block'
                  }} 
                />
                {isOnline ? 'Online' : 'Offline'}
              </Button>

              <Dropdown align="end">
                <Dropdown.Toggle variant="outline-light" id="user-dropdown">
                  🏪 {user?.email}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item onClick={handleLogout}>
                    🚪 Αποσύνδεση
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Confirmation Modal for going Offline */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>⚠️ Επιβεβαίωση</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Είστε σίγουροι ότι θέλετε να απενεργοποιήσετε τη λήψη παραγγελιών;</p>
          <p className="text-muted mb-0">
            <small>Οι πελάτες δεν θα μπορούν να σας στείλουν νέες παραγγελίες όσο είστε Offline.</small>
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Ακύρωση
          </Button>
          <Button 
            variant="danger" 
            onClick={() => toggleStatus(false)}
            disabled={loading}
          >
            {loading ? 'Αλλαγή...' : '🔴 Πήγαινε Offline'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default StoreNavbar;
