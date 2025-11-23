import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import '../styles/Login.css';

const RegisterSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="login-page">
      <Container className="py-4">
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col xs={12} md={10} lg={9} xl={8}>
            <div className="text-center mb-4 mb-md-5">
              <div className="logo-emoji">🚚</div>
              <h2 className="app-title">Fast Delivery</h2>
              <p className="app-subtitle">Επιλέξτε τύπο εγγραφής</p>
            </div>

            <Row className="g-3 g-md-4 mb-4">
              {/* Store Registration */}
              <Col xs={12} md={6}>
                <Card className="register-option-card h-100">
                  <Card.Body className="p-4 text-center">
                    <div className="option-icon">🏪</div>
                    <h3 className="option-title">Κατάστημα</h3>
                    <p className="option-description">
                      Εγγραφείτε ως κατάστημα για να δέχεστε παραγγελίες από πελάτες
                    </p>
                    <ul className="option-features">
                      <li>✓ Διαχείριση παραγγελιών</li>
                      <li>✓ Τιμολόγηση προϊόντων</li>
                      <li>✓ Ειδοποιήσεις real-time</li>
                      <li>✓ Στατιστικά πωλήσεων</li>
                    </ul>
                    <Button
                      className="btn-primary-app w-100 mt-3"
                      onClick={() => navigate('/register-business/store')}
                    >
                      Εγγραφή ως Κατάστημα
                    </Button>
                  </Card.Body>
                </Card>
              </Col>

              {/* Driver Registration */}
              <Col xs={12} md={6}>
                <Card className="register-option-card h-100">
                  <Card.Body className="p-4 text-center">
                    <div className="option-icon">🚗</div>
                    <h3 className="option-title">Οδηγός</h3>
                    <p className="option-description">
                      Εγγραφείτε ως οδηγός για να αναλαμβάνετε παραδόσεις
                    </p>
                    <ul className="option-features">
                      <li>✓ Ευέλικτο ωράριο</li>
                      <li>✓ Άμεσες αναθέσεις</li>
                      <li>✓ Παρακολούθηση εσόδων</li>
                      <li>✓ Online/Offline status</li>
                    </ul>
                    <Button
                      className="btn-primary-app w-100 mt-3"
                      onClick={() => navigate('/register-business/driver')}
                    >
                      Εγγραφή ως Οδηγός
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <div className="text-center">
              <div className="divider-custom mb-3">
                <span>ή</span>
              </div>
              <Button
                variant="outline"
                className="btn-outline-app"
                size="lg"
                onClick={() => navigate('/login')}
              >
                <span className="me-2">🔐</span>
                Έχω ήδη λογαριασμό - Σύνδεση
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default RegisterSelection;
