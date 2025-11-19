import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../../services/api';
import '../../styles/Customer.css';

const CustomerHome = () => {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState('');
  const [error, setError] = useState('');

  const handleTrackOrder = () => {
    if (!orderNumber.trim()) {
      setError('Παρακαλώ εισάγετε αριθμό παραγγελίας');
      return;
    }
    navigate(`/order-status/${orderNumber.trim()}`);
  };

  return (
    <div className="customer-home">
      <Container>
        <Row className="min-vh-100 align-items-center">
          <Col lg={10} xl={8} className="mx-auto">
            <div className="text-center mb-5">
              <h1 className="display-4 fw-bold text-white mb-3">
                🚚 Fast Delivery
              </h1>
              <p className="lead text-white">
                Παράγγειλε από το αγαπημένο σου κατάστημα
              </p>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row className="g-4">
              <Col md={6}>
                <Card className="shadow-lg h-100 hover-card">
                  <Card.Body className="text-center p-5">
                    <div className="mb-4">
                      <span className="display-1">📦</span>
                    </div>
                    <h3 className="mb-3">Νέα Παραγγελία</h3>
                    <p className="text-muted mb-4">
                      Δημιούργησε μια νέα παραγγελία από κοντινά καταστήματα
                    </p>
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-100"
                      onClick={() => navigate('/new-order')}
                    >
                      Παραγγελία Τώρα
                    </Button>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                <Card className="shadow-lg h-100 hover-card">
                  <Card.Body className="text-center p-5">
                    <div className="mb-4">
                      <span className="display-1">🔍</span>
                    </div>
                    <h3 className="mb-3">Παρακολούθηση</h3>
                    <p className="text-muted mb-4">
                      Δες την κατάσταση της παραγγελίας σου
                    </p>
                    <Form.Group className="mb-3">
                      <Form.Control
                        type="text"
                        placeholder="Αριθμός Παραγγελίας (π.χ. ORD-20251118-0001)"
                        value={orderNumber}
                        onChange={(e) => {
                          setOrderNumber(e.target.value);
                          setError('');
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && handleTrackOrder()}
                      />
                    </Form.Group>
                    <Button
                      variant="success"
                      size="lg"
                      className="w-100"
                      onClick={handleTrackOrder}
                    >
                      Παρακολούθηση
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <div className="text-center mt-5">
              <p className="text-white-50">
                <small>
                  Έχεις λογαριασμό καταστήματος ή οδηγού;{' '}
                  <span className="text-white" style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/login')}>
                    Σύνδεση
                  </span>
                </small>
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CustomerHome;
