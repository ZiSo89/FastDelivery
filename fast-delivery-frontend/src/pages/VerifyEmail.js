import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Container, Card, Spinner, Alert } from 'react-bootstrap';
import { FaCheckCircle, FaTimesCircle, FaEnvelope } from 'react-icons/fa';
import api from '../services/api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  const token = searchParams.get('token');
  const type = searchParams.get('type');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token || !type) {
        setStatus('error');
        setMessage('Μη έγκυρο link επιβεβαίωσης');
        return;
      }

      try {
        const response = await api.get(`/auth/verify-email?token=${token}&type=${type}`);
        if (response.data.success) {
          setStatus('success');
          setMessage(response.data.message);
        } else {
          setStatus('error');
          setMessage(response.data.message || 'Σφάλμα επιβεβαίωσης');
        }
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Το link επιβεβαίωσης είναι άκυρο ή έχει λήξει');
      }
    };

    verifyEmail();
  }, [token, type]);

  const getLoginPath = () => {
    // Customers go to home page (CustomerPortal), others go to login
    if (type === 'customer') return '/';
    if (type === 'store' || type === 'driver') return '/login';
    return '/';
  };

  const getButtonText = () => {
    if (type === 'customer') return 'Συνέχεια';
    return 'Σύνδεση';
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ maxWidth: '500px', width: '100%' }} className="shadow">
        <Card.Body className="text-center p-5">
          {status === 'loading' && (
            <>
              <Spinner animation="border" variant="primary" className="mb-4" style={{ width: '4rem', height: '4rem' }} />
              <h4>Επιβεβαίωση email...</h4>
              <p className="text-muted">Παρακαλώ περιμένετε</p>
            </>
          )}

          {status === 'success' && (
            <>
              <FaCheckCircle size={80} className="text-success mb-4" />
              <h3 className="text-success">Επιτυχία!</h3>
              <p className="mb-4">{message}</p>
              <Link to={getLoginPath()} className="btn btn-primary btn-lg">
                {getButtonText()}
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <FaTimesCircle size={80} className="text-danger mb-4" />
              <h3 className="text-danger">Αποτυχία</h3>
              <p className="mb-4">{message}</p>
              <Alert variant="info">
                <FaEnvelope className="me-2" />
                Αν χρειάζεστε νέο email επιβεβαίωσης, δοκιμάστε να συνδεθείτε και θα σας ζητηθεί.
              </Alert>
              <Link to="/" className="btn btn-outline-primary">
                Αρχική Σελίδα
              </Link>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default VerifyEmail;
