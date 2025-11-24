import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { customerService } from '../../services/api';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import '../../styles/Customer.css';

const libraries = ['places'];

const CustomerProfile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const autocompleteRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
    language: 'el',
    region: 'GR'
  });

  // Alexandroupoli bounds
  const alexandroupoliBounds = {
    north: 40.88,
    south: 40.81,
    east: 25.92,
    west: 25.82
  };

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      console.log('📍 Google Maps Place Selected:', place);
      
      if (place.geometry && place.geometry.location) {
        const newAddress = place.formatted_address || place.name;
        console.log('📝 Setting address to:', newAddress);
        
        setFormData(prev => ({
          ...prev,
          address: newAddress
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    console.log('📤 Submitting Profile Update:', formData);

    try {
      const response = await customerService.updateProfile(formData);
      console.log('✅ Profile Update Response:', response);

      setMessage({ type: 'success', text: 'Το προφίλ ενημερώθηκε επιτυχώς!' });
      
      if (response.user) {
        console.log('🔄 Updating Auth Context with new user data:', response.user);
        updateUser(response.user);
      }
      
    } catch (err) {
      console.error('❌ Profile Update Error:', err);
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Σφάλμα ενημέρωσης προφίλ' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Container className="p-0" fluid>
        <Row className="justify-content-center m-0">
          <Col xs={12} sm={12} md={8} lg={6} xl={5} className="p-0 bg-white min-vh-100 shadow-sm position-relative">
            <header className="app-header">
              <div className="header-content">
                <button className="btn-icon" onClick={() => navigate('/order')}>
                  <i className="fas fa-arrow-left"></i>
                </button>
                <h3>Το Προφίλ μου</h3>
                <div style={{ width: 32 }}></div>
              </div>
            </header>

            <div className="main-content p-4">
              {message.text && (
                <Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })} dismissible>
                  {message.text}
                </Alert>
              )}

              <div className="text-center mb-4">
                <div className="avatar-large mb-3" style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  backgroundColor: '#e0f7fa', 
                  color: '#00c2e8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  margin: '0 auto'
                }}>
                  {formData.name ? formData.name[0].toUpperCase() : 'U'}
                </div>
                <h5 className="mb-1">{formData.name}</h5>
                <p className="text-muted small">{formData.email}</p>
              </div>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted fw-bold">ΟΝΟΜΑΤΕΠΩΝΥΜΟ</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="app-input"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted fw-bold">EMAIL</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled // Usually email is not editable or requires verification
                    className="app-input bg-light"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted fw-bold">ΤΗΛΕΦΩΝΟ</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="app-input"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="small text-muted fw-bold">ΔΙΕΥΘΥΝΣΗ ΠΑΡΑΔΟΣΗΣ</Form.Label>
                  {isLoaded ? (
                    <Autocomplete
                      onLoad={autocomplete => autocompleteRef.current = autocomplete}
                      onPlaceChanged={onPlaceChanged}
                      options={{
                        bounds: alexandroupoliBounds,
                        componentRestrictions: { country: "gr" },
                        strictBounds: true
                      }}
                    >
                      <Form.Control
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="app-input"
                        required
                      />
                    </Autocomplete>
                  ) : (
                    <Form.Control
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="app-input"
                      required
                    />
                  )}
                </Form.Group>

                <div className="d-grid">
                  <Button 
                    type="submit" 
                    className="btn-primary-app" 
                    disabled={loading}
                  >
                    {loading ? <Spinner size="sm" animation="border" /> : 'Αποθήκευση Αλλαγών'}
                  </Button>
                </div>
              </Form>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CustomerProfile;
