import React, { useState, useRef, useEffect } from 'react';
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

// Default store types (fallback)
const defaultStoreTypes = ['Mini Market', 'Φαρμακείο', 'Ταβέρνα', 'Καφετέρια', 'Γλυκά', 'Άλλο'];

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
    storeType: '',
    workingHours: '',
    description: '',
    serviceAreas: ''
  });
  
  const [location, setLocation] = useState(defaultCenter);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [storeTypes, setStoreTypes] = useState(defaultStoreTypes);

  // Fetch store types from settings
  useEffect(() => {
    const fetchStoreTypes = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/store-types`);
        if (response.data.success && response.data.storeTypes?.length > 0) {
          // Handle both old format (strings) and new format (objects with name/icon)
          const types = response.data.storeTypes.map(t => 
            typeof t === 'object' ? t.name : t
          );
          setStoreTypes(types);
          setFormData(prev => ({ ...prev, storeType: types[0] }));
        }
      } catch (err) {
        console.log('Using default store types');
        setFormData(prev => ({ ...prev, storeType: defaultStoreTypes[0] }));
      }
    };
    fetchStoreTypes();
  }, []);

  const { isLoaded, loadError } = useJsApiLoader({
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
        description: formData.description,
        serviceAreas: formData.serviceAreas || 'Αλεξανδρούπολη',
        location: {
          type: 'Point',
          coordinates: [location.lng, location.lat] // GeoJSON format: [lng, lat]
        }
      };

      const response = await axios.post(`${API_URL}/auth/store/register`, registrationData);

      if (response.data.success) {
        // Use the message from backend (includes email verification info in production)
        setSuccess(response.data.message);
        
        // Redirect to login after 5 seconds (more time to read email verification message)
        setTimeout(() => {
          navigate('/login');
        }, 5000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Σφάλμα εγγραφής. Δοκιμάστε ξανά.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="dashboard-content-wrapper">
        <div className="login-content">
          <div className="text-center mb-4">
            <div className="logo-emoji">🏪</div>
            <h2 className="app-title">Εγγραφή Καταστήματος</h2>
            <p className="app-subtitle">Συμπληρώστε τα στοιχεία σας</p>
          </div>

          {error && <Alert variant="danger" className="custom-alert">{error}</Alert>}
          {success && <Alert variant="success" className="custom-alert">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="form-label-custom">Επωνυμία Επιχείρησης <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="businessName"
                placeholder="π.χ. Mini Market Κέντρο"
                value={formData.businessName}
                onChange={handleChange}
                disabled={loading}
                required
                className="form-input-custom"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="form-label-custom">ΑΦΜ</Form.Label>
              <Form.Control
                type="text"
                name="afm"
                placeholder="9 ψηφία"
                value={formData.afm}
                onChange={handleChange}
                disabled={loading}
                maxLength={9}
                className="form-input-custom"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="form-label-custom">Τηλέφωνο</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                placeholder="10 ψηφία"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
                maxLength={10}
                className="form-input-custom"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="form-label-custom">Email <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="email"
                name="email"
                placeholder="store@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
                className="form-input-custom"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="form-label-custom">Κωδικός <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="password"
                name="password"
                placeholder="Τουλάχιστον 6 χαρακτήρες"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                required
                className="form-input-custom"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="form-label-custom">Επιβεβαίωση Κωδικού <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                placeholder="Επαναλάβετε τον κωδικό"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                required
                className="form-input-custom"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="form-label-custom">Διεύθυνση</Form.Label>
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
                    placeholder="π.χ. Λεωφ. Δημοκρατίας 10, Αλεξανδρούπολη"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={loading}
                    className="form-input-custom"
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
                  className="form-input-custom"
                />
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="form-label-custom">Τοποθεσία στο Χάρτη <span className="text-danger">*</span></Form.Label>
              <div style={{ height: '300px', width: '100%', marginBottom: '10px', borderRadius: '12px', overflow: 'hidden' }}>
                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={defaultCenter}
                    zoom={14}
                    onClick={handleMapClick}
                    onLoad={map => mapRef.current = map}
                  >
                    <Marker 
                      position={location}
                      icon={{
                        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                        fillColor: "#00c1e8",
                        fillOpacity: 1,
                        strokeWeight: 1,
                        strokeColor: "#ffffff",
                        scale: 1.5,
                        anchor: { x: 12, y: 22 }
                      }}
                    />
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
              <Form.Label className="form-label-custom">Τύπος Καταστήματος</Form.Label>
              <Form.Select
                name="storeType"
                value={formData.storeType}
                onChange={handleChange}
                disabled={loading}
                className="form-input-custom"
              >
                {storeTypes.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="form-label-custom">Ωράριο Λειτουργίας</Form.Label>
              <Form.Control
                type="text"
                name="workingHours"
                placeholder="π.χ. Δευ-Παρ: 08:00-22:00, Σαβ: 09:00-20:00"
                value={formData.workingHours}
                onChange={handleChange}
                disabled={loading}
                className="form-input-custom"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="form-label-custom">Περιγραφή</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                placeholder="Λίγα λόγια για το κατάστημα..."
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
                className="form-input-custom"
              />
            </Form.Group>

            <Alert variant="info" className="custom-alert mt-3">
              <small>
                <strong>Σημείωση:</strong> Μετά την υποβολή της αίτησης:
                <br />1. Θα λάβετε email επιβεβαίωσης (ελέγξτε και τον φάκελο Spam)
                <br />2. Μετά την επιβεβαίωση, ο διαχειριστής θα εγκρίνει τον λογαριασμό σας
              </small>
            </Alert>

            <Button
              type="submit"
              className="btn-primary-app w-100"
              disabled={loading}
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
        </div>
      </div>
    </div>
  );
};

export default StoreRegister;
