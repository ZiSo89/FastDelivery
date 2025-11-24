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
      const userData = result.user || result.data;
      const userRole = userData?.role;
      
      switch (userRole) {
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
      <Container className="py-0 py-md-4" fluid="sm">
        <Row className="justify-content-center align-items-center min-vh-100 m-0">
          <Col xs={12} sm={10} md={8} lg={6} xl={5} className="p-0 p-sm-3">
            <Card className="login-card h-100 h-sm-auto">
              <Card.Body className="p-4 p-md-5">
                <div className="text-center mb-4">
                  <div className="logo-emoji">🚚</div>
                  <h2 className="app-title">Fast Delivery</h2>
                  <p className="app-subtitle">Σύνδεση στο σύστημα</p>
                </div>

                {error && <Alert variant="danger" className="custom-alert">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label-custom">Ρόλος</Form.Label>
                    <Form.Select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="form-input-custom"
                    >
                      <option value="admin">Διαχειριστής</option>
                      <option value="store">Κατάστημα</option>
                      <option value="driver">Οδηγός</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="form-label-custom">Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="example@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                      className="form-input-custom"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="form-label-custom">Κωδικός</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                      className="form-input-custom"
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    className="btn-primary-app w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? 'Σύνδεση...' : 'Είσοδος'}
                  </Button>
                </Form>

                <div className="divider-custom">
                  <span>ή</span>
                </div>

                <Button
                  variant="outline"
                  className="btn-outline-app w-100"
                  onClick={() => navigate('/register-business')}
                >
                  <span className="me-2">📝</span>
                  Εγγραφή ως Κατάστημα ή Οδηγός
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;
