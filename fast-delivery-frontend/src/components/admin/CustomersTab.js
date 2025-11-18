import React, { useState, useEffect } from 'react';
import { Table, Badge, Spinner, Alert } from 'react-bootstrap';
import { adminService } from '../../services/api';

const CustomersTab = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getCustomers();
      setCustomers(response.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Σφάλμα φόρτωσης πελατών');
    } finally {
      setLoading(false);
    }
  };

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
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
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
                  <td className="fw-bold">{customer.phone}</td>
                  <td>{customer.address || 'N/A'}</td>
                  <td className="text-center">
                    <Badge bg="primary">{customer.orderCount || 0}</Badge>
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
