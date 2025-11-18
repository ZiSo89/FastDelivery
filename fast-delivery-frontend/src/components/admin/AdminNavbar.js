import React from 'react';
import { Navbar, Container, Nav, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminNavbar = ({ user }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
      <Container fluid>
        <Navbar.Brand href="/admin">
          <span className="fw-bold">🚚 Fast Delivery</span>
          <span className="ms-2 badge bg-primary">Admin</span>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="admin-navbar" />
        
        <Navbar.Collapse id="admin-navbar" className="justify-content-end">
          <Nav>
            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-light" id="user-dropdown">
                👤 {user?.name || user?.email}
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

export default AdminNavbar;
