import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import api from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('form'); // form, success
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/forgot-password', {
        email,
        type: userType
      });

      if (response.data.success) {
        setStatus('success');
        setMessage(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Σφάλμα αποστολής email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ maxWidth: '500px', width: '100%' }} className="shadow">
        <Card.Body className="p-5">
          {status === 'form' ? (
            <>
              <div className="text-center mb-4">
                <FaEnvelope size={50} className="text-primary mb-3" />
                <h3>Ξέχασες τον κωδικό σου;</h3>
                <p className="text-muted">
                  Εισάγε το email σου και θα σου στείλουμε οδηγίες επαναφοράς.
                </p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Τύπος Λογαριασμού</Form.Label>
                  <Form.Select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                  >
                    <option value="customer">Πελάτης</option>
                    <option value="store">Κατάστημα</option>
                    <option value="driver">Διανομέας</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Το email του λογαριασμού σου"
                    required
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Αποστολή...
                    </>
                  ) : (
                    'Αποστολή Email'
                  )}
                </Button>

                <div className="text-center">
                  <Link to="/login" className="text-decoration-none">
                    <FaArrowLeft className="me-2" />
                    Πίσω στη Σύνδεση (Υπάλληλοι)
                  </Link>
                </div>
              </Form>
            </>
          ) : (
            <div className="text-center">
              <FaCheckCircle size={80} className="text-success mb-4" />
              <h3 className="text-success">Email Στάλθηκε!</h3>
              <p className="mb-4">{message}</p>
              <Alert variant="info">
                Ελέγξε τα εισερχόμενά σου (και τον φάκελο spam) για το email επαναφοράς κωδικού.
              </Alert>
              <Link to="/login" className="btn btn-outline-primary">
                <FaArrowLeft className="me-2" />
                Πίσω στη Σύνδεση (Υπάλληλοι)
              </Link>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ForgotPassword;
