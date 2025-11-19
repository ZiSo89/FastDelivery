import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../../services/api';
import '../../styles/Customer.css';

const NewOrder = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    orderContent: '',
    orderType: 'text'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      // Default coordinates (Athens center) - σε production θα χρησιμοποιούσες geolocation
      const response = await customerService.getStores(37.9838, 23.7275, 10000);
      // Backend επιστρέφει { success: true, stores: [...] }
      setStores(response.stores || response.data || []);
    } catch (err) {
      setError('Σφάλμα φόρτωσης καταστημάτων');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedStore) {
      setError('Παρακαλώ επιλέξτε κατάστημα');
      return;
    }

    if (!formData.customerName || !formData.customerPhone || !formData.deliveryAddress || !formData.orderContent) {
      setError('Παρακαλώ συμπληρώστε όλα τα πεδία');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        customer: {
          name: formData.customerName,
          phone: formData.customerPhone,
          address: formData.deliveryAddress
        },
        storeId: selectedStore._id,
        orderType: formData.orderType,
        orderContent: formData.orderContent
      };

      const response = await customerService.createOrder(orderData);
      setSuccess(`Η παραγγελία σας καταχωρήθηκε! Αριθμός: ${response.order.orderNumber}`);
      
      setTimeout(() => {
        navigate(`/order-status/${response.order.orderNumber}`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Σφάλμα δημιουργίας παραγγελίας');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-page">
      <Container className="py-5">
        <Row>
          <Col lg={10} xl={8} className="mx-auto">
            <Card className="shadow-lg">
              <Card.Header className="bg-primary text-white">
                <h3 className="mb-0">📦 Νέα Παραγγελία</h3>
              </Card.Header>
              <Card.Body className="p-4">
                <Button
                  variant="link"
                  className="mb-3 p-0"
                  onClick={() => navigate('/')}
                >
                  ← Πίσω
                </Button>

                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <h5 className="mb-3">1. Επιλογή Καταστήματος</h5>
                  <ListGroup className="mb-4">
                    {stores.length === 0 ? (
                      <Alert variant="info">Δεν βρέθηκαν διαθέσιμα καταστήματα</Alert>
                    ) : (
                      stores.map((store) => (
                        <ListGroup.Item
                          key={store._id}
                          action
                          active={selectedStore?._id === store._id}
                          onClick={() => setSelectedStore(store)}
                          className="cursor-pointer"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-1">{store.storeName}</h6>
                              <small>{store.storeType} · {store.address}</small>
                            </div>
                            {selectedStore?._id === store._id && (
                              <span className="badge bg-success">✓</span>
                            )}
                          </div>
                        </ListGroup.Item>
                      ))
                    )}
                  </ListGroup>

                  <h5 className="mb-3">2. Στοιχεία Παραγγελίας</h5>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Όνομα *</Form.Label>
                        <Form.Control
                          type="text"
                          name="customerName"
                          placeholder="Γιάννης Παπαδόπουλος"
                          value={formData.customerName}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Τηλέφωνο Επικοινωνίας *</Form.Label>
                        <Form.Control
                          type="tel"
                          name="customerPhone"
                          placeholder="6912345678"
                          value={formData.customerPhone}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Διεύθυνση Παράδοσης *</Form.Label>
                    <Form.Control
                      type="text"
                      name="deliveryAddress"
                      placeholder="Λεωφόρος Δημοκρατίας 25, Αλεξανδρούπολη"
                      value={formData.deliveryAddress}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Περιγραφή Παραγγελίας *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      name="orderContent"
                      placeholder="Περιγράψτε τι θέλετε να παραγγείλετε..."
                      value={formData.orderContent}
                      onChange={handleChange}
                      required
                    />
                    <Form.Text className="text-muted">
                      Αναφέρετε με λεπτομέρεια τα προϊόντα που θέλετε
                    </Form.Text>
                  </Form.Group>

                  <div className="d-grid">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={loading || !selectedStore}
                    >
                      {loading ? 'Αποστολή...' : 'Υποβολή Παραγγελίας'}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default NewOrder;
