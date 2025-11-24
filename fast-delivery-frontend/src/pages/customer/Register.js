import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import '../../styles/CustomerPortal.css';

const libraries = ['places'];

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    location: null
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();
  const autocompleteRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
    language: 'el',
    region: 'GR'
  });

  // Alexandroupoli bounds for autocomplete
  const alexandroupoliBounds = {
    north: 40.88,
    south: 40.81,
    east: 25.92,
    west: 25.82
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        setFormData(prev => ({
          ...prev,
          address: place.formatted_address || place.name,
          location: {
            type: 'Point',
            coordinates: [lng, lat]
          }
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!formData.name || !formData.email || !formData.password || !formData.phone || !formData.address) {
      setError('Παρακαλώ συμπληρώστε όλα τα πεδία');
      setLoading(false);
      return;
    }

    if (formData.phone.length !== 10) {
      setError('Το τηλέφωνο πρέπει να είναι 10ψήφιο');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Ο κωδικός πρέπει να είναι τουλάχιστον 6 χαρακτήρες');
      setLoading(false);
      return;
    }

    // If location is missing (user typed address manually without selecting from dropdown), 
    // we might want to geocode it or just warn. For now, we proceed but warn if critical.
    // Ideally, we force selection or geocode on submit.
    
    const result = await register(formData);

    if (result.success) {
      navigate('/order');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="app-container" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Container className="p-0" fluid>
        <Row className="justify-content-center m-0">
          <Col xs={12} sm={12} md={8} lg={6} xl={5} className="p-0 bg-white min-vh-100 shadow-sm position-relative">
            <header className="app-header">
              <div className="header-content">
                <button className="btn-icon" onClick={() => navigate('/')}>
                  <i className="fas fa-arrow-left"></i>
                </button>
                <h3>Εγγραφή</h3>
                <div style={{ width: 32 }}></div>
              </div>
            </header>

            <div className="main-content" style={{ padding: '20px' }}>
              <div className="login-form-container">
                <h2 className="screen-title" style={{ textAlign: 'center', marginBottom: '20px' }}>Δημιουργία λογαριασμού</h2>

                {error && <div className="error-msg">{error}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="input-group">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Ονοματεπώνυμο"
                      className="app-input"
                    />
                  </div>

                  <div className="input-group">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email"
                      className="app-input"
                    />
                  </div>

                  <div className="input-group">
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Κωδικός (min. 6 chars)"
                      className="app-input"
                    />
                  </div>

                  <div className="input-group">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Κινητό τηλέφωνο"
                      maxLength="10"
                      className="app-input"
                    />
                  </div>

                  <div className="input-group">
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
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="Διεύθυνση παράδοσης"
                          className="app-input"
                          style={{ width: '100%' }}
                        />
                      </Autocomplete>
                    ) : (
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Διεύθυνση παράδοσης"
                        className="app-input"
                      />
                    )}
                  </div>

                  <button type="submit" className="btn-primary-app" disabled={loading}>
                    {loading ? 'Εγγραφή...' : 'Εγγραφή'}
                  </button>
                </form>

                <div className="secondary-actions">
                  <p>Έχεις ήδη λογαριασμό; <Link to="/">Σύνδεση</Link></p>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Register;
