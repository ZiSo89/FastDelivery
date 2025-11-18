import React, { useState, useEffect, useCallback } from 'react';
import { Table, Badge, Spinner, Alert, Form } from 'react-bootstrap';
import { adminService } from '../../services/api';

const OrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getOrders(filter === 'all' ? null : filter);
      setOrders(response.data?.orders || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Σφάλμα φόρτωσης παραγγελιών');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_store: { bg: 'warning', label: 'Αναμονή Καταστήματος' },
      pricing: { bg: 'info', label: 'Τιμολόγηση' },
      pending_admin: { bg: 'primary', label: 'Αναμονή Admin' },
      pending_customer_confirm: { bg: 'warning', label: 'Αναμονή Πελάτη' },
      confirmed: { bg: 'success', label: 'Επιβεβαιωμένη' },
      assigned: { bg: 'info', label: 'Ανατέθηκε' },
      accepted_driver: { bg: 'primary', label: 'Αποδοχή Οδηγού' },
      preparing: { bg: 'warning', label: 'Προετοιμασία' },
      in_delivery: { bg: 'primary', label: 'Σε Παράδοση' },
      completed: { bg: 'success', label: 'Ολοκληρώθηκε' },
      cancelled: { bg: 'danger', label: 'Ακυρώθηκε' },
      rejected_store: { bg: 'danger', label: 'Απόρριψη Καταστήματος' },
      rejected_driver: { bg: 'danger', label: 'Απόρριψη Οδηγού' }
    };

    const config = statusConfig[status] || { bg: 'secondary', label: status };
    return <Badge bg={config.bg}>{config.label}</Badge>;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Διαχείριση Παραγγελιών</h5>
        <Form.Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: '250px' }}
          size="sm"
        >
          <option value="all">Όλες οι Παραγγελίες</option>
          <option value="pending_admin">Εκκρεμείς (Admin)</option>
          <option value="confirmed">Επιβεβαιωμένες</option>
          <option value="in_delivery">Σε Παράδοση</option>
          <option value="completed">Ολοκληρωμένες</option>
          <option value="cancelled">Ακυρωμένες</option>
        </Form.Select>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Φόρτωση παραγγελιών...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : orders.length === 0 ? (
        <Alert variant="info">Δεν βρέθηκαν παραγγελίες</Alert>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Αριθμός</th>
                <th>Πελάτης</th>
                <th>Κατάστημα</th>
                <th>Οδηγός</th>
                <th>Τιμή Προϊόντος</th>
                <th>Μεταφορικά</th>
                <th>Σύνολο</th>
                <th>Κατάσταση</th>
                <th>Ημερομηνία</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td className="fw-bold">{order.orderNumber}</td>
                  <td>{order.customerPhone}</td>
                  <td>{order.store?.storeName || 'N/A'}</td>
                  <td>{order.driver?.name || '-'}</td>
                  <td>{order.productPrice ? `€${order.productPrice.toFixed(2)}` : '-'}</td>
                  <td>{order.deliveryFee ? `€${order.deliveryFee.toFixed(2)}` : '-'}</td>
                  <td className="fw-bold">
                    {order.totalPrice ? `€${order.totalPrice.toFixed(2)}` : '-'}
                  </td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td>
                    <small>{new Date(order.createdAt).toLocaleString('el-GR')}</small>
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

export default OrdersTab;
