import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import '../styles/Login.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const defaultCenter = {
  lat: 40.8457, // Alexandroupoli
  lng: 25.8733
};

const libraries = ['places'];

const StoreRegister = () => {
  const navigate = useNavigate();
  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);
  
  const [formData, setFormData] = useState({
    businessName: '',
    afm: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    storeType: 'Mini Market',
    workingHours: '',
    serviceAreas: ''
  });
  
  const [location, setLocation] = useState(defaultCenter);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries
  });

  if (loadError) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          Η φόρτωση του χάρτη απέτυχε. Παρακαλώ ελέγξτε το Google Maps API Key.
          <br />
          <small>{loadError.message}</small>
        </Alert>
      </Container>
    );
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleMapClick = (e) => {
    setLocation({
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    });
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      
      if (place.geometry && place.geometry.location) {
        const newLocation = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        
        setLocation(newLocation);
        setFormData(prev => ({
          ...prev,
          address: place.formatted_address || place.name
        }));

        // Pan map to new location
        if (mapRef.current) {
          mapRef.current.panTo(newLocation);
          mapRef.current.setZoom(17);
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (!formData.businessName || !formData.email || !formData.password) {
      setError('Παρακαλώ συμπληρώστε όλα τα υποχρεωτικά πεδία');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Οι κωδικοί δεν ταιριάζουν');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Ο κωδικός πρέπει να είναι τουλάχιστον 6 χαρακτήρες');
      setLoading(false);
      return;
    }

    if (formData.afm && !/^\d{9}$/.test(formData.afm)) {
      setError('Το ΑΦΜ πρέπει να είναι 9 ψηφία');
      setLoading(false);
      return;
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      setError('Το τηλέφωνο πρέπει να είναι 10 ψηφία');
      setLoading(false);
      return;
    }

    try {
      const registrationData = {
        businessName: formData.businessName,
        afm: formData.afm,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address,
        storeType: formData.storeType,
        workingHours: formData.workingHours || 'Δευ-Παρ: 08:00-22:00',
        serviceAreas: formData.serviceAreas || 'Αλεξανδρούπολη',
        location: {
          type: 'Point',
          coordinates: [location.lng, location.lat] // GeoJSON format: [lng, lat]
        }
      };

      const response = await axios.post(`${API_URL}/auth/store/register`, registrationData);

      if (response.data.success) {
        setSuccess('Η εγγραφή σας υποβλήθηκε επιτυχώς! Αναμένετε έγκριση από τον διαχειριστή.');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Σφάλμα εγγραφής. Δοκιμάστε ξανά.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Container>
        <Row className="justify-content-center py-5">
          <Col md={8} lg={6}>
            <Card className="shadow-lg">
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <div style={{ fontSize: '48px' }}>🏪</div>
                  <h2 className="fw-bold" style={{ color: '#00c2e8' }}>Εγγραφή Καταστήματος</h2>
                  <p className="text-muted">Συμπληρώστε τα στοιχεία σας</p>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Επωνυμία Επιχείρησης <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="businessName"
                      placeholder="π.χ. Mini Market Κέντρο"
                      value={formData.businessName}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>ΑΦΜ</Form.Label>
                        <Form.Control
                          type="text"
                          name="afm"
                          placeholder="9 ψηφία"
                          value={formData.afm}
                          onChange={handleChange}
                          disabled={loading}
                          maxLength={9}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Τηλέφωνο</Form.Label>
                        <Form.Control
                          type="text"
                          name="phone"
                          placeholder="10 ψηφία"
                          value={formData.phone}
                          onChange={handleChange}
                          disabled={loading}
                          maxLength={10}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="store@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Κωδικός <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="password"
                          name="password"
                          placeholder="Τουλάχιστον 6 χαρακτήρες"
                          value={formData.password}
                          onChange={handleChange}
                          disabled={loading}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Επιβεβαίωση Κωδικού <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="password"
                          name="confirmPassword"
                          placeholder="Επαναλάβετε τον κωδικό"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          disabled={loading}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Διεύθυνση</Form.Label>
                    {isLoaded ? (
                      <Autocomplete
                        onLoad={autocomplete => autocompleteRef.current = autocomplete}
                        onPlaceChanged={onPlaceChanged}
                      >
                        <Form.Control
                          type="text"
                          name="address"
                          placeholder="π.χ. Λεωφ. Δημοκρατίας 10, Αλεξανδρούπολη"
                          value={formData.address}
                          onChange={handleChange}
                          disabled={loading}
                        />
                      </Autocomplete>
                    ) : (
                      <Form.Control
                        type="text"
                        name="address"
                        placeholder="π.χ. Λεωφ. Δημοκρατίας 10, Αλεξανδρούπολη"
                        value={formData.address}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Τοποθεσία στο Χάρτη <span className="text-danger">*</span></Form.Label>
                    <div style={{ height: '300px', width: '100%', marginBottom: '10px' }}>
                      {isLoaded ? (
                        <GoogleMap
                          mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '8px' }}
                          center={defaultCenter}
                          zoom={14}
                          onClick={handleMapClick}
                          onLoad={map => mapRef.current = map}
                        >
                          <Marker position={location} />
                        </GoogleMap>
                      ) : (
                        <div>Loading Map...</div>
                      )}
                    </div>
                    <Form.Text className="text-muted">
                      Κάντε κλικ στο χάρτη για να ορίσετε την ακριβή τοποθεσία του καταστήματος.
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Τύπος Καταστήματος</Form.Label>
                    <Form.Select
                      name="storeType"
                      value={formData.storeType}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="Mini Market">Mini Market</option>
                      <option value="Φαρμακείο">Φαρμακείο</option>
                      <option value="Ταβέρνα">Ταβέρνα</option>
                      <option value="Καφετέρια">Καφετέρια</option>
                      <option value="Γλυκά">Γλυκά</option>
                      <option value="Άλλο">Άλλο</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Ωράριο Λειτουργίας</Form.Label>
                    <Form.Control
                      type="text"
                      name="workingHours"
                      placeholder="π.χ. Δευ-Παρ: 08:00-22:00, Σαβ: 09:00-20:00"
                      value={formData.workingHours}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Περιοχές Εξυπηρέτησης</Form.Label>
                    <Form.Control
                      type="text"
                      name="serviceAreas"
                      placeholder="π.χ. Κέντρο, Φλοίσβος, Μάκρη"
                      value={formData.serviceAreas}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100"
                    disabled={loading}
                    style={{ backgroundColor: '#00c2e8', border: 'none', padding: '12px', fontWeight: '600' }}
                  >
                    {loading ? 'Υποβολή...' : 'Εγγραφή'}
                  </Button>
                </Form>

                <div className="mt-4 text-center">
                  <small className="text-muted">
                    Έχετε ήδη λογαριασμό;{' '}
                    <span 
                      className="text-primary" 
                      style={{ cursor: 'pointer', fontWeight: '600' }} 
                      onClick={() => navigate('/login')}
                    >
                      Σύνδεση
                    </span>
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default StoreRegister;
