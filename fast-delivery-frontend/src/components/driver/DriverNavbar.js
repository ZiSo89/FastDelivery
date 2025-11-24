import React, { useState, useEffect, useRef } from 'react';
import { Navbar, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DriverNavbar = ({ user, profile }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get first letter of name for avatar
  const getInitials = () => {
    if (profile?.name) {
      return profile.name[0].toUpperCase();
    }
    if (user?.name) {
      return user.name[0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'Ο'; // Default: Οδηγός
  };

  return (
    <Navbar bg="white" variant="light" expand="lg" className="shadow-sm" style={{ 
      borderBottom: '1px solid #f0f0f0',
      zIndex: 100
    }}>
      <Container fluid>
        <Navbar.Brand onClick={() => navigate('/driver')} style={{ cursor: 'pointer' }}>
          <span className="fw-bold" style={{ color: '#00c2e8', fontSize: '18px', letterSpacing: '-0.5px' }}>
            🚗 FastDelivery
          </span>
        </Navbar.Brand>
        
        <div className="d-flex align-items-center gap-3">
          {/* User Avatar with Dropdown */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <div
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                width: '38px',
                height: '38px',
                backgroundColor: '#e0f7fa',
                color: '#00c2e8',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: showDropdown ? '0 0 0 3px rgba(0, 194, 232, 0.2)' : 'none'
              }}
            >
              {getInitials()}
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  backgroundColor: 'white',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  borderRadius: '12px',
                  padding: '8px 0',
                  marginTop: '8px',
                  zIndex: 1000,
                  minWidth: '160px'
                }}
              >
                <div
                  onClick={handleLogout}
                  style={{
                    padding: '12px 20px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    fontSize: '15px',
                    fontWeight: '500',
                    color: '#202125'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  🚪 Αποσύνδεση
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </Navbar>
  );
};

export default DriverNavbar;
