import React, { useState } from 'react';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { storeService } from '../../services/api';

const StoreProfile = ({ profile, onUpdate }) => {
  const [formData, setFormData] = useState({
    phone: profile?.phone || '',
    address: profile?.address || '',
    workingHours: profile?.workingHours || '',
    serviceAreas: profile?.serviceAreas || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
                value={profile?.businessName || profile?.storeName || ''}
                disabled
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Τύπος</Form.Label>
              <Form.Control
                type="text"
                value={profile?.storeType || ''}
                disabled
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>ΑΦΜ</Form.Label>
              <Form.Control
                type="text"
                value={profile?.afm || ''}
                disabled
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
          <Form.Control
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
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
              <Form.Label>Περιοχές Εξυπηρέτησης</Form.Label>
              <Form.Control
                type="text"
                name="serviceAreas"
                placeholder="π.χ. Αλεξανδρούπολη"
                value={formData.serviceAreas}
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
