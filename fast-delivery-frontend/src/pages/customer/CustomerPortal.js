import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import '../../styles/CustomerPortal.css';

const CustomerPortal = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🖱️ Clicked Login Submit');
    setError('');
    setLoading(true);

    const result = await login({ email, password, role: 'customer' });

    if (result.success) {
      console.log('✅ Login Successful');
      navigate('/order');
    } else {
      console.log('❌ Login Failed');
      setError('Λάθος email ή κωδικός');
    }
    setLoading(false);
  };

  const handleGuestClick = (e) => {
    e.preventDefault();
    // Clear any previous guest info to ensure fresh start
    localStorage.removeItem('guestInfo');
    navigate('/order');
  };

  return (
    <div className="app-container" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Container className="p-0" fluid>
        <Row className="justify-content-center m-0">
          <Col xs={12} sm={12} md={8} lg={6} xl={5} className="p-0 bg-white min-vh-100 shadow-sm position-relative">
            <div className="login-screen">
              <div className="brand-header">
                <h1>FastDelivery</h1>
                <p>Εσύ ζητάς, εμείς τρέχουμε</p>
              </div>

              <div className="login-form-container">
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
                  <div className="input-group">
                    <input 
                      type="password" 
                      placeholder="Κωδικός πρόσβασης"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                    />
                  </div>

                  {error && (
                    <>
                      <div className="error-msg">{error}</div>
                      <div style={{ textAlign: 'center', margin: '12px 0' }}>
                        <Link to="/customer/forgot-password" style={{ color: '#00c2e8', fontSize: '14px' }}>
                          🔑 Ξέχασες τον κωδικό σου;
                        </Link>
                      </div>
                    </>
                  )}

                  <button type="submit" className="btn-primary-app" disabled={loading}>
                    {loading ? 'Σύνδεση...' : 'Σύνδεση'}
                  </button>
                </form>

                <div className="secondary-actions">
                  <p>Δεν έχεις λογαριασμό; <Link to="/register" onClick={() => console.log('🖱️ Clicked Register Link')}>Εγγραφή</Link></p>
                  <div className="divider">ή</div>
                  <a href="#" className="guest-link" onClick={handleGuestClick}>Συνέχεια ως Επισκέπτης</a>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CustomerPortal;
