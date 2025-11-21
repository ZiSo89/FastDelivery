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
                  <div style={{ fontSize: '48px' }}>🚗</div>
                  <h2 className="fw-bold" style={{ color: '#00c2e8' }}>Εγγραφή Οδηγού</h2>
                  <p className="text-muted">Συμπληρώστε τα στοιχεία σας</p>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Ονοματεπώνυμο <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      placeholder="π.χ. Γιάννης Παπαδόπουλος"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="driver@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Τηλέφωνο <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="phone"
                      placeholder="10 ψηφία (π.χ. 6912345678)"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={loading}
                      maxLength={10}
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

                  <Alert variant="info" className="mt-3">
                    <small>
                      <strong>Σημείωση:</strong> Μετά την υποβολή της αίτησης, θα χρειαστεί να εγκριθείτε από τον διαχειριστή πριν μπορέσετε να συνδεθείτε.
                    </small>
                  </Alert>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 mt-3"
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

export default DriverRegister;
