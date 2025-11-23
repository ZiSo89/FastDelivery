import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Badge, Spinner, Alert, ButtonGroup, Card, Row, Col } from 'react-bootstrap';
import { adminService } from '../../services/api';
import AlertModal from '../AlertModal';

const StoresTab = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [processingId, setProcessingId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [alertModal, setAlertModal] = useState({ show: false, variant: 'success', message: '' });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchStores = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getStores(filter === 'all' ? null : filter);
      // Backend επιστρέφει { success: true, stores: [...] }
      setStores(response.stores || response.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Σφάλμα φόρτωσης καταστημάτων');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const handleApprove = async (storeId, action) => {
    try {
      setProcessingId(storeId);
      await adminService.approveStore(storeId, action === 'approve');
      
      // Refresh list
      await fetchStores();
      
      const messages = {
        approve: 'Το κατάστημα εγκρίθηκε!',
        reject: 'Το κατάστημα απορρίφθηκε!',
        pending: 'Το κατάστημα τέθηκε σε αναμονή!'
      };
      
      setAlertModal({
        show: true,
        variant: 'success',
        message: messages[action] || 'Η ενέργεια ολοκληρώθηκε!'
      });
    } catch (err) {
      setAlertModal({
        show: true,
        variant: 'danger',
        message: err.response?.data?.message || 'Σφάλμα κατά την επεξεργασία'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger'
    };
    
    const labels = {
      pending: 'Εκκρεμεί',
      approved: 'Εγκρίθηκε',
      rejected: 'Απορρίφθηκε'
    };

    return <Badge bg={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <div>
      <div className="mb-3">
        <h5 className="mb-3">Διαχείριση Καταστημάτων</h5>
        <div className="d-grid d-md-flex gap-2">
          <Button
            variant={filter === 'pending' ? 'primary' : 'outline-primary'}
            onClick={() => setFilter('pending')}
            size="sm"
          >
            Εκκρεμή
          </Button>
          <Button
            variant={filter === 'approved' ? 'success' : 'outline-success'}
            onClick={() => setFilter('approved')}
            size="sm"
          >
            Εγκεκριμένα
          </Button>
          <Button
            variant={filter === 'rejected' ? 'danger' : 'outline-danger'}
            onClick={() => setFilter('rejected')}
            size="sm"
          >
            Απορριφθέντα
          </Button>
          <Button
            variant={filter === 'all' ? 'secondary' : 'outline-secondary'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            Όλα
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Φόρτωση καταστημάτων...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : stores.length === 0 ? (
        <Alert variant="info">Δεν βρέθηκαν καταστήματα</Alert>
      ) : isMobile ? (
        // Mobile Card View
        <Row className="g-3">
          {stores.map((store) => (
            <Col xs={12} key={store._id}>
              <Card className="shadow-sm">
                <Card.Header>
                  <h6 className="mb-0 fw-bold">{store.businessName || store.storeName}</h6>
                  <Badge bg="info" className="mt-1">{store.storeType}</Badge>
                </Card.Header>
                <Card.Body>
                  <div className="mb-2">
                    <small className="text-muted">📧 Email:</small><br />
                    {store.email}
                  </div>
                  
                  <div className="mb-2">
                    <small className="text-muted">📞 Τηλέφωνο:</small><br />
                    <strong>{store.phone}</strong>
                  </div>
                  
                  <div className="mb-2">
                    <small className="text-muted">🏢 ΑΦΜ:</small><br />
                    {store.afm}
                  </div>
                  
                  <div className="mb-3">
                    <small className="text-muted">📍 Διεύθυνση:</small><br />
                    {store.address}
                  </div>
                  
                  <div className="mb-3">
                    <small className="text-muted">Κατάσταση:</small><br />
                    {getStatusBadge(store.status)}
                  </div>
                  
                  <div className="d-grid gap-2">
                    {store.status !== 'approved' && (
                      <Button
                        variant="success"
                        onClick={() => handleApprove(store._id, 'approve')}
                        disabled={processingId === store._id}
                      >
                        {processingId === store._id ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          '✅ Έγκριση Καταστήματος'
                        )}
                      </Button>
                    )}
                    {store.status !== 'rejected' && (
                      <Button
                        variant="danger"
                        onClick={() => handleApprove(store._id, 'reject')}
                        disabled={processingId === store._id}
                      >
                        ❌ Απόρριψη
                      </Button>
                    )}
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
                <th>Τύπος</th>
                <th>Email</th>
                <th>Τηλέφωνο</th>
                <th>ΑΦΜ</th>
                <th>Διεύθυνση</th>
                <th>Κατάσταση</th>
                <th>Ενέργειες</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store._id}>
                  <td className="fw-bold">{store.businessName || store.storeName}</td>
                  <td>{store.storeType}</td>
                  <td>{store.email}</td>
                  <td>{store.phone}</td>
                  <td>{store.afm}</td>
                  <td>
                    <small>{store.address}</small>
                  </td>
                  <td>{getStatusBadge(store.status)}</td>
                  <td>
                    <ButtonGroup size="sm">
                      {store.status !== 'approved' && (
                        <Button
                          variant="success"
                          onClick={() => handleApprove(store._id, 'approve')}
                          disabled={processingId === store._id}
                          title="Έγκριση"
                        >
                          {processingId === store._id ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            '✅'
                          )}
                        </Button>
                      )}
                      {store.status !== 'rejected' && (
                        <Button
                          variant="danger"
                          onClick={() => handleApprove(store._id, 'reject')}
                          disabled={processingId === store._id}
                          title="Απόρριψη"
                        >
                          ❌
                        </Button>
                      )}
                    </ButtonGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <AlertModal
        show={alertModal.show}
        onHide={() => setAlertModal({ ...alertModal, show: false })}
        variant={alertModal.variant}
        message={alertModal.message}
      />
    </div>
  );
};

export default StoresTab;
