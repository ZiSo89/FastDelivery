import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import '../styles/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'admin'
  });
  
  const [error, setError] = useState('');
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
    setLoading(true);

    // Validation
    if (!formData.email || !formData.password) {
      setError('Παρακαλώ συμπληρώστε όλα τα πεδία');
      setLoading(false);
      return;
    }

    const result = await login(formData);
    
    if (result.success) {
      // Redirect based on role
      switch (result.data.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'store':
          navigate('/store');
          break;
        case 'driver':
          navigate('/driver');
          break;
        default:
          navigate('/');
      }
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-page">
      <Container>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col md={6} lg={5}>
            <Card className="shadow-lg">
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <h2 className="fw-bold text-primary">🚚 Fast Delivery</h2>
                  <p className="text-muted">Σύστημα Διαχείρισης Παραγγελιών</p>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Ρόλος</Form.Label>
                    <Form.Select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                    >
                      <option value="admin">Διαχειριστής</option>
                      <option value="store">Κατάστημα</option>
                      <option value="driver">Οδηγός</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="example@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Κωδικός</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100"
                    disabled={loading}
                  >
                    {loading ? 'Σύνδεση...' : 'Είσοδος'}
                  </Button>
                </Form>

                <div className="mt-4 text-center">
                  <small className="text-muted">
                    Δεν έχετε λογαριασμό;{' '}
                    <a href="/register" className="text-primary">
                      Εγγραφή
                    </a>
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

export default Login;
