import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Badge, Spinner, Alert, ButtonGroup } from 'react-bootstrap';
import { adminService } from '../../services/api';

const DriversTab = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [processingId, setProcessingId] = useState(null);

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getDrivers(filter === 'all' ? null : filter);
      setDrivers(response.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Σφάλμα φόρτωσης οδηγών');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleApprove = async (driverId, approved) => {
    try {
      setProcessingId(driverId);
      await adminService.approveDriver(driverId, approved);
      
      await fetchDrivers();
      alert(approved ? 'Ο οδηγός εγκρίθηκε!' : 'Ο οδηγός απορρίφθηκε!');
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
        <h5>Διαχείριση Οδηγών</h5>
        <ButtonGroup>
          <Button
            variant={filter === 'pending' ? 'primary' : 'outline-primary'}
            onClick={() => setFilter('pending')}
            size="sm"
          >
            Εκκρεμείς
          </Button>
          <Button
            variant={filter === 'approved' ? 'success' : 'outline-success'}
            onClick={() => setFilter('approved')}
            size="sm"
          >
            Εγκεκριμένοι
          </Button>
          <Button
            variant={filter === 'rejected' ? 'danger' : 'outline-danger'}
            onClick={() => setFilter('rejected')}
            size="sm"
          >
            Απορριφθέντες
          </Button>
          <Button
            variant={filter === 'all' ? 'secondary' : 'outline-secondary'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            Όλοι
          </Button>
        </ButtonGroup>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Φόρτωση οδηγών...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : drivers.length === 0 ? (
        <Alert variant="info">Δεν βρέθηκαν οδηγοί</Alert>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Όνομα</th>
                <th>Email</th>
                <th>Τηλέφωνο</th>
                <th>Όχημα</th>
                <th>Πινακίδα</th>
                <th>Διαθεσιμότητα</th>
                <th>Κατάσταση</th>
                <th>Ενέργειες</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver._id}>
                  <td className="fw-bold">{driver.name}</td>
                  <td>{driver.email}</td>
                  <td>{driver.phone}</td>
                  <td>{driver.vehicleType}</td>
                  <td>{driver.vehiclePlate}</td>
                  <td>
                    {driver.isOnline ? (
                      <Badge bg="success">Online</Badge>
                    ) : (
                      <Badge bg="secondary">Offline</Badge>
                    )}
                  </td>
                  <td>{getStatusBadge(driver.status)}</td>
                  <td>
                    {driver.status === 'pending' && (
                      <ButtonGroup size="sm">
                        <Button
                          variant="success"
                          onClick={() => handleApprove(driver._id, true)}
                          disabled={processingId === driver._id}
                        >
                          {processingId === driver._id ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            '✅ Έγκριση'
                          )}
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleApprove(driver._id, false)}
                          disabled={processingId === driver._id}
                        >
                          ❌ Απόρριψη
                        </Button>
                      </ButtonGroup>
                    )}
                    {driver.status !== 'pending' && (
                      <small className="text-muted">Επεξεργασμένος</small>
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

export default DriversTab;
