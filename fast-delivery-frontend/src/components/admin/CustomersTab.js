import React, { useState, useEffect, useCallback } from 'react';
import { Table, Badge, Spinner, Alert, Card, Row, Col } from 'react-bootstrap';
import { adminService } from '../../services/api';

const CustomersTab = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getCustomers();
      // Backend επιστρέφει { success: true, customers: [...] }
      setCustomers(response.customers || response.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Σφάλμα φόρτωσης πελατών');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return (
    <div>
      <div className="mb-3">
        <h5>Διαχείριση Πελατών</h5>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Φόρτωση πελατών...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : customers.length === 0 ? (
        <Alert variant="info">Δεν βρέθηκαν πελάτες</Alert>
      ) : isMobile ? (
        // Mobile Card View
        <Row className="g-3">
          {customers.map((customer) => (
            <Col xs={12} key={customer._id}>
              <Card className="shadow-sm">
                <Card.Body>
                  <h6 className="fw-bold mb-2">{customer.name || 'N/A'}</h6>
                  
                  <div className="mb-2">
                    <small className="text-muted">📞 Τηλέφωνο:</small><br />
                    <strong>{customer.phone}</strong>
                  </div>
                  
                  {customer.address && (
                    <div className="mb-2">
                      <small className="text-muted">📍 Διεύθυνση:</small><br />
                      {customer.address}
                    </div>
                  )}
                  
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      <small className="text-muted">Παραγγελίες:</small><br />
                      <Badge bg="primary" className="fs-6">
                        {customer.totalOrders || customer.orderCount || 0}
                      </Badge>
                    </div>
                    <div>
                      {customer.isActive ? (
                        <Badge bg="success">Ενεργός</Badge>
                      ) : (
                        <Badge bg="danger">Ανενεργός</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <small className="text-muted">
                      Εγγραφή: {new Date(customer.createdAt).toLocaleDateString('el-GR')}
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        // Desktop Table View
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Όνομα</th>
                <th>Τηλέφωνο</th>
                <th>Διεύθυνση</th>
                <th>Σύνολο Παραγγελιών</th>
                <th>Κατάσταση</th>
                <th>Ημερομηνία Εγγραφής</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer._id}>
                  <td className="fw-bold">{customer.name || 'N/A'}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.address || 'N/A'}</td>
                  <td className="text-center">
                    <Badge bg="primary">{customer.totalOrders || customer.orderCount || 0}</Badge>
                  </td>
                  <td>
                    {customer.isActive ? (
                      <Badge bg="success">Ενεργός</Badge>
                    ) : (
                      <Badge bg="danger">Ανενεργός</Badge>
                    )}
                  </td>
                  <td>
                    <small>{new Date(customer.createdAt).toLocaleDateString('el-GR')}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default CustomersTab;
