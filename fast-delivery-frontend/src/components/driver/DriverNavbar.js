import React from 'react';
import { Navbar, Container, Nav, Dropdown, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DriverNavbar = ({ user, profile }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg" className="shadow-sm">
      <Container fluid>
        <Navbar.Brand onClick={() => navigate('/driver')} style={{ cursor: 'pointer' }}>
          <span className="fw-bold">🚗 Fast Delivery</span>
          <span className="ms-2 badge bg-light text-primary">Οδηγός</span>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="driver-navbar" />
        
        <Navbar.Collapse id="driver-navbar" className="justify-content-end">
          <Nav>
            {profile && (
              <Nav.Item className="me-3 d-flex align-items-center">
                <Badge bg={profile.isOnline ? 'success' : 'secondary'}>
                  {profile.isOnline ? '🟢 Online' : '⚫ Offline'}
                </Badge>
              </Nav.Item>
            )}
            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-light" id="user-dropdown">
                👤 {profile?.name || user?.email}
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
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default DriverNavbar;
