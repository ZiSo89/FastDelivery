import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import '../styles/Login.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const DriverRegister = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      setError('Παρακαλώ συμπληρώστε όλα τα πεδία');
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

    if (!/^\d{10}$/.test(formData.phone)) {
      setError('Το τηλέφωνο πρέπει να είναι 10 ψηφία');
      setLoading(false);
      return;
    }

    try {
      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone
      };

      const response = await axios.post(`${API_URL}/auth/driver/register`, registrationData);

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
            <div className="logo-emoji">🚗</div>
            <h2 className="app-title">Εγγραφή Οδηγού</h2>
            <p className="app-subtitle">Συμπληρώστε τα στοιχεία σας</p>
          </div>

          {error && <Alert variant="danger" className="custom-alert">{error}</Alert>}
          {success && <Alert variant="success" className="custom-alert">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="form-label-custom">Ονοματεπώνυμο <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="name"
                placeholder="π.χ. Γιάννης Παπαδόπουλος"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                required
                className="form-input-custom"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="form-label-custom">Email <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="email"
                name="email"
                placeholder="driver@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
                className="form-input-custom"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="form-label-custom">Τηλέφωνο <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="phone"
                placeholder="10 ψηφία (π.χ. 6912345678)"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
                maxLength={10}
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

            <Alert variant="info" className="custom-alert mt-3">
              <small>
                <strong>Σημείωση:</strong> Μετά την υποβολή της αίτησης:
                <br />1. Θα λάβετε email επιβεβαίωσης (ελέγξτε και τον φάκελο Spam)
                <br />2. Μετά την επιβεβαίωση, ο διαχειριστής θα εγκρίνει τον λογαριασμό σας
              </small>
            </Alert>

            <Button
              type="submit"
              className="btn-primary-app w-100 mt-3"
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

export default DriverRegister;
