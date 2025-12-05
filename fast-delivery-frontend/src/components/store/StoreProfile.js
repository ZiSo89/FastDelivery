import React, { useState, useRef, useEffect } from 'react';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { storeService, authService } from '../../services/api';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';

const libraries = ['places'];

const StoreProfile = ({ profile, onUpdate }) => {
  const [formData, setFormData] = useState({
    businessName: profile?.businessName || profile?.storeName || '',
    storeType: profile?.storeType || '',
    afm: profile?.afm || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    workingHours: profile?.workingHours || '',
    description: profile?.description || '',
    serviceAreas: profile?.serviceAreas || '',
    location: profile?.location || null
  });
  const [storeTypes, setStoreTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const autocompleteRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script-store',
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

  // Fetch store types on mount
  useEffect(() => {
    const fetchStoreTypes = async () => {
      try {
        const response = await authService.getStoreTypes();
        if (response.storeTypes) {
          setStoreTypes(response.storeTypes);
        }
      } catch (err) {
        console.error('Error fetching store types:', err);
      }
    };
    fetchStoreTypes();
  }, []);

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
    setLoading(true);
    setMessage('');

    try {
      await storeService.updateProfile(formData);
      setMessage('Το προφίλ ενημερώθηκε επιτυχώς!');
      onUpdate();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Σφάλμα ενημέρωσης');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h5 className="mb-4">Στοιχεία Καταστήματος</h5>
      
      {message && (
        <Alert variant={message.includes('επιτυχώς') ? 'success' : 'danger'}>
          {message}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Όνομα Καταστήματος</Form.Label>
              <Form.Control
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Τύπος</Form.Label>
              <Form.Select
                name="storeType"
                value={formData.storeType}
                onChange={handleChange}
              >
                <option value="">Επιλέξτε τύπο</option>
                {storeTypes.map((type, index) => (
                  <option key={index} value={type.name}>
                    {type.icon} {type.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>ΑΦΜ</Form.Label>
              <Form.Control
                type="text"
                name="afm"
                value={formData.afm}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Κατάσταση</Form.Label>
              <Form.Control
                type="text"
                value={profile?.status === 'approved' ? 'Εγκεκριμένο' : 'Εκκρεμεί'}
                disabled
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={profile?.email || ''}
                disabled
              />
              <Form.Text className="text-muted">Το email δεν μπορεί να αλλάξει</Form.Text>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Τηλέφωνο</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
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
              />
            </Autocomplete>
          ) : (
            <Form.Control
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          )}
        </Form.Group>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Ωράριο Λειτουργίας</Form.Label>
              <Form.Control
                type="text"
                name="workingHours"
                placeholder="π.χ. Δευ-Κυρ: 08:00-23:00"
                value={formData.workingHours}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Περιγραφή</Form.Label>
              <Form.Control
                as="textarea"
                rows={1}
                name="description"
                placeholder="Λίγα λόγια για το κατάστημα..."
                value={formData.description}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>

        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Αποθήκευση...' : 'Ενημέρωση Προφίλ'}
        </Button>
      </Form>
    </div>
  );
};

export default StoreProfile;
