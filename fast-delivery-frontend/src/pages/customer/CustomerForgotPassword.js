import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import api from '../../services/api';
import '../../styles/CustomerPortal.css';

const CustomerForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('form'); // form, success
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/forgot-password', {
        email,
        type: 'customer'
      });

      if (response.data.success) {
        setStatus('success');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Σφάλμα αποστολής email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Container className="p-0" fluid>
        <Row className="justify-content-center m-0">
          <Col xs={12} sm={12} md={8} lg={6} xl={5} className="p-0 bg-white min-vh-100 shadow-sm position-relative">
            <div className="login-screen">
              <div className="brand-header">
                <h1>FastDelivery</h1>
                <p>Επαναφορά Κωδικού</p>
              </div>

              {status === 'form' ? (
                <div className="login-form-container">
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔑</div>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                      Εισάγε το email σου και θα σου στείλουμε οδηγίες για να επαναφέρεις τον κωδικό σου.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="input-group">
                      <input 
                        type="email" 
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                      />
                    </div>

                    {error && <div className="error-msg">{error}</div>}

                    <button type="submit" className="btn-primary-app" disabled={loading}>
                      {loading ? 'Αποστολή...' : 'Αποστολή Email'}
                    </button>
                  </form>

                  <div className="secondary-actions">
                    <Link to="/" style={{ color: '#00c2e8' }}>
                      ← Πίσω στη Σύνδεση
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="login-form-container">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '64px', marginBottom: '24px' }}>✅</div>
                    <h3 style={{ color: '#28a745', marginBottom: '16px' }}>Email Στάλθηκε!</h3>
                    <p style={{ color: '#666', marginBottom: '24px' }}>
                      Ελέγξε τα εισερχόμενά σου (και τον φάκελο spam) για το email επαναφοράς κωδικού.
                    </p>
                    <Link to="/" className="btn-primary-app" style={{ display: 'block', textDecoration: 'none', textAlign: 'center', padding: '14px' }}>
                      Πίσω στη Σύνδεση
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CustomerForgotPassword;
