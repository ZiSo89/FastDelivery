import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Badge, Spinner, Alert, ButtonGroup } from 'react-bootstrap';
import { adminService } from '../../services/api';

const StoresTab = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [processingId, setProcessingId] = useState(null);

  const fetchStores = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getStores(filter === 'all' ? null : filter);
      setStores(response.data || []);
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

  const handleApprove = async (storeId, approved) => {
    try {
      setProcessingId(storeId);
      await adminService.approveStore(storeId, approved);
      
      // Refresh list
      await fetchStores();
      
      // Show success message
      alert(approved ? 'Το κατάστημα εγκρίθηκε!' : 'Το κατάστημα απορρίφθηκε!');
    } catch (err) {
      alert(err.response?.data?.message || 'Σφάλμα κατά την επεξεργασία');
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
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Διαχείριση Καταστημάτων</h5>
        <ButtonGroup>
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
        </ButtonGroup>
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
      ) : (
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
                  <td className="fw-bold">{store.storeName}</td>
                  <td>{store.storeType}</td>
                  <td>{store.email}</td>
                  <td>{store.phone}</td>
                  <td>{store.afm}</td>
                  <td>
                    <small>{store.address}</small>
                  </td>
                  <td>{getStatusBadge(store.status)}</td>
                  <td>
                    {store.status === 'pending' && (
                      <ButtonGroup size="sm">
                        <Button
                          variant="success"
                          onClick={() => handleApprove(store._id, true)}
                          disabled={processingId === store._id}
                        >
                          {processingId === store._id ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            '✅ Έγκριση'
                          )}
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleApprove(store._id, false)}
                          disabled={processingId === store._id}
                        >
                          ❌ Απόρριψη
                        </Button>
                      </ButtonGroup>
                    )}
                    {store.status !== 'pending' && (
                      <small className="text-muted">Επεξεργασμένο</small>
                    )}
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

export default StoresTab;
