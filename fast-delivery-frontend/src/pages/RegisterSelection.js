import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card } from 'react-bootstrap';
import '../styles/Login.css';

const RegisterSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="login-page">
      <Container>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col md={10} lg={8}>
            <div className="text-center mb-5">
              <h2 className="fw-bold text-primary">🚚 Fast Delivery</h2>
              <p className="text-muted">Επιλέξτε τύπο εγγραφής</p>
            </div>

            <Row className="g-4">
              {/* Store Registration */}
              <Col md={6}>
                <Card 
                  className="shadow-lg h-100 hover-card" 
                  style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                  onClick={() => navigate('/register-business/store')}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <Card.Body className="p-5 text-center">
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>🏪</div>
                    <h3 className="fw-bold mb-3" style={{ color: '#00c2e8' }}>Κατάστημα</h3>
                    <p className="text-muted mb-4">
                      Εγγραφείτε ως κατάστημα για να δέχεστε παραγγελίες από πελάτες
                    </p>
                    <ul className="text-start text-muted" style={{ listStyle: 'none', padding: 0 }}>
                      <li className="mb-2">✓ Διαχείριση παραγγελιών</li>
                      <li className="mb-2">✓ Τιμολόγηση προϊόντων</li>
                      <li className="mb-2">✓ Ειδοποιήσεις real-time</li>
                      <li className="mb-2">✓ Στατιστικά πωλήσεων</li>
                    </ul>
                    <div className="mt-4">
                      <button 
                        className="btn btn-primary w-100"
                        style={{ backgroundColor: '#00c2e8', border: 'none', padding: '12px', fontWeight: '600' }}
                      >
                        Εγγραφή ως Κατάστημα
                      </button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* Driver Registration */}
              <Col md={6}>
                <Card 
                  className="shadow-lg h-100 hover-card" 
                  style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                  onClick={() => navigate('/register-business/driver')}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <Card.Body className="p-5 text-center">
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚗</div>
                    <h3 className="fw-bold mb-3" style={{ color: '#00c2e8' }}>Οδηγός</h3>
                    <p className="text-muted mb-4">
                      Εγγραφείτε ως οδηγός για να αναλαμβάνετε παραδόσεις
                    </p>
                    <ul className="text-start text-muted" style={{ listStyle: 'none', padding: 0 }}>
                      <li className="mb-2">✓ Ευέλικτο ωράριο</li>
                      <li className="mb-2">✓ Άμεσες αναθέσεις</li>
                      <li className="mb-2">✓ Παρακολούθηση εσόδων</li>
                      <li className="mb-2">✓ Online/Offline status</li>
                    </ul>
                    <div className="mt-4">
                      <button 
                        className="btn btn-primary w-100"
                        style={{ backgroundColor: '#00c2e8', border: 'none', padding: '12px', fontWeight: '600' }}
                      >
                        Εγγραφή ως Οδηγός
                      </button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

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
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default RegisterSelection;
