import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FaLock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import api from '../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');
  const type = searchParams.get('type');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('form'); // form, success, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token || !type) {
      setStatus('error');
      setMessage('Μη έγκυρο link επαναφοράς κωδικού');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Οι κωδικοί δεν ταιριάζουν');
      return;
    }

    if (password.length < 6) {
      setMessage('Ο κωδικός πρέπει να είναι τουλάχιστον 6 χαρακτήρες');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        type,
        password
      });

      if (response.data.success) {
        setStatus('success');
        setMessage(response.data.message);
        // Redirect to login after 3 seconds
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setStatus('error');
        setMessage(response.data.message);
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Σφάλμα επαναφοράς κωδικού');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !type) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Card style={{ maxWidth: '500px', width: '100%' }} className="shadow">
          <Card.Body className="text-center p-5">
            <FaTimesCircle size={80} className="text-danger mb-4" />
            <h3 className="text-danger">Μη έγκυρο Link</h3>
            <p>Το link επαναφοράς κωδικού είναι άκυρο ή έχει λήξει.</p>
            <Link to="/login" className="btn btn-outline-primary">
              Πίσω στη Σύνδεση
            </Link>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ maxWidth: '500px', width: '100%' }} className="shadow">
        <Card.Body className="p-5">
          {status === 'form' && (
            <>
              <div className="text-center mb-4">
                <FaLock size={50} className="text-primary mb-3" />
                <h3>Νέος Κωδικός</h3>
                <p className="text-muted">Εισάγετε τον νέο σας κωδικό</p>
              </div>

              {message && <Alert variant="danger">{message}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Νέος Κωδικός</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Τουλάχιστον 6 χαρακτήρες"
                    required
                    minLength={6}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Επιβεβαίωση Κωδικού</Form.Label>
                  <Form.Control
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Επαναλάβετε τον κωδικό"
                    required
                  />
                </Form.Group>

                <Button 
                  type="submit" 
                  variant="primary" 
                  size="lg" 
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Αποθήκευση...
                    </>
                  ) : (
                    'Αλλαγή Κωδικού'
                  )}
                </Button>
              </Form>
            </>
          )}

          {status === 'success' && (
            <div className="text-center">
              <FaCheckCircle size={80} className="text-success mb-4" />
              <h3 className="text-success">Επιτυχία!</h3>
              <p>{message}</p>
              <p className="text-muted">Ανακατεύθυνση στη σύνδεση...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <FaTimesCircle size={80} className="text-danger mb-4" />
              <h3 className="text-danger">Αποτυχία</h3>
              <p>{message}</p>
              <Link to="/login" className="btn btn-outline-primary">
                Πίσω στη Σύνδεση
              </Link>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ResetPassword;
