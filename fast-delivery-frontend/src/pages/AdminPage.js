import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';

function AdminPage() {
  const [stores, setStores] = useState([]); // State για αποθήκευση της λίστας καταστημάτων
  const [orders, setOrders] = useState([]); // State για αποθήκευση της λίστας παραγγελιών
  const [deliveryUsers, setDeliveryUsers] = useState([]); // State για διανομείς
  const [error, setError] = useState(''); // State για αποθήκευση σφαλμάτων
  const socket = io('http://192.168.1.8:5000'); // Σύνδεση με τον server

  useEffect(() => {
    // Άκου για νέες παραγγελίες μέσω Socket.IO
    socket.on('orderUpdated', () => {
      console.log('Νέα παραγγελία δημιουργήθηκε. Ενημέρωση παραγγελιών...');
      fetchOrders(); // Κάλεσε τη λειτουργία για να κάνεις fetch τις παραγγελίες
    });

    // Καθαρισμός σύνδεσης όταν αποσυνδέεται το component
    return () => {
      socket.off('orderUpdated');
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://192.168.1.8:5000/api/orders');
      const sortedOrders = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sortedOrders);
    } catch (err) {
      console.error('Σφάλμα κατά τη φόρτωση των παραγγελιών:', err);
      setError('Αποτυχία φόρτωσης των παραγγελιών. Παρακαλώ δοκιμάστε ξανά.');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    // Άκου για ενημερώσεις κατάστασης παραγγελιών μέσω Socket.IO
    socket.on('orderStatusUpdated', (updatedOrder) => {
      console.log('Η κατάσταση της παραγγελίας ενημερώθηκε:', updatedOrder);

      // Ενημέρωση του state για τη συγκεκριμένη παραγγελία
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === updatedOrder._id ? { ...order, status: updatedOrder.status } : order
        )
      );
    });

    // Καθαρισμός σύνδεσης όταν αποσυνδέεται το component
    return () => {
      socket.off('orderStatusUpdated');
    };
  }, []);

  useEffect(() => {
    // Φόρτωσε τη λίστα των καταστημάτων
    const fetchStores = async () => {
      try {
        const response = await axios.get('http://192.168.1.8:5000/api/stores');
        setStores(response.data);
      } catch (err) {
        console.error('Σφάλμα κατά τη φόρτωση των καταστημάτων:', err);
        setError('Αποτυχία φόρτωσης των καταστημάτων. Παρακαλώ δοκιμάστε ξανά.');
      }
    };

    // Φόρτωσε τη λίστα των διανομέων
    const fetchDeliveryUsers = async () => {
      try {
        const response = await axios.get('http://192.168.1.8:5000/api/users/delivery');
        setDeliveryUsers(response.data);
      } catch (err) {
        console.error('Σφάλμα κατά τη φόρτωση των διανομέων:', err);
        setError('Αποτυχία φόρτωσης των διανομέων. Παρακαλώ δοκιμάστε ξανά.');
      }
    };

    fetchStores();
    fetchDeliveryUsers();
  }, []);

  const handleOrderDelete = async (id) => {
    try {
      await axios.delete(`http://192.168.1.8:5000/api/orders/${id}`);
      setOrders(orders.filter((order) => order._id !== id));
    } catch (err) {
      console.error('Σφάλμα κατά τη διαγραφή της παραγγελίας:', err);
      setError('Αποτυχία διαγραφής της παραγγελίας. Παρακαλώ δοκιμάστε ξανά.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://192.168.1.8:5000/api/stores/${id}`);
      setStores(stores.filter((store) => store._id !== id)); // Αφαίρεσε το διαγραμμένο κατάστημα από το state
    } catch (err) {
      console.error('Σφάλμα κατά τη διαγραφή του καταστήματος:', err);
      setError('Αποτυχία διαγραφής του καταστήματος. Παρακαλώ δοκιμάστε ξανά.');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(`http://192.168.1.8:5000/api/users/${userId}`);
      setDeliveryUsers(deliveryUsers.filter((user) => user._id !== userId));
    } catch (err) {
      console.error('Σφάλμα κατά τη διαγραφή του χρήστη:', err);
      setError('Αποτυχία διαγραφής του χρήστη. Παρακαλώ δοκιμάστε ξανά.');
    }
  };

  const handleAssignOrder = async (orderId, userId) => {
    try {
      const response = await axios.put(`http://192.168.1.8:5000/api/orders/${orderId}/assign`, {
        assignedTo: userId,
      });
      console.log('Η παραγγελία ανατέθηκε:', response.data);

      socket.emit('newOrder', response.data); // Στέλνει ενημέρωση στους clients
      // Ενημέρωση του state για τη συγκεκριμένη παραγγελία
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, assignedTo: userId } : order
        )
      );
    } catch (err) {
      console.error('Σφάλμα κατά την ανάθεση της παραγγελίας:', err);
      setError('Αποτυχία ανάθεσης της παραγγελίας. Παρακαλώ δοκιμάστε ξανά.');
    }
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      const response = await axios.put(`http://192.168.1.8:5000/api/orders/${orderId}/status`, { status });
      console.log('Η κατάσταση της παραγγελίας ενημερώθηκε:', response.data);
      socket.emit('updateOrderStatus', response.data); // Στέλνει ενημέρωση στους clients
      // Ενημέρωση του state για τη συγκεκριμένη παραγγελία
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status } : order
        )
      );
    } catch (err) {
      console.error('Σφάλμα κατά την ενημέρωση της κατάστασης:', err);
      setError('Αποτυχία ενημέρωσης της κατάστασης. Παρακαλώ δοκιμάστε ξανά.');
    }
  };

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Πίνακας Διαχείρισης</h1>
      <p className="text-center">Διαχειριστείτε καταστήματα, παραγγελίες και χρήστες εδώ.</p>

      {/* Κατηγορία: Όλες οι Παραγγελίες */}
      <div className="p-4 mb-4" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h2 className="mb-3 text-primary">Όλες οι Παραγγελίες</h2>
        <div className="row">
          {orders.map((order) => (
            <div className="col-md-6 mb-4" key={order._id}>
              <div className="card">
                <div className="card-body">
                  <p className="card-text">
                    <strong>Κατάστημα:</strong> {order.storeId?.name || 'N/A'}
                  </p>
                  <p className="card-text">
                    <strong>Προϊόντα:</strong> {order.items}
                  </p>
                  <p className="card-text">
                    <strong>Διεύθυνση Παραλαβής:</strong> {order.storeId?.address || 'N/A'}
                  </p>
                  <p className="card-text">
                    <strong>Διεύθυνση Παράδοσης:</strong> {order.address}
                  </p>
                  <p className="card-text">
                    <strong>Κατάσταση:</strong> {order.status}
                  </p>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleOrderDelete(order._id)}
                  >
                    Διαγραφή
                  </button>
                  <div className="mb-3">
                    <label className="form-label">Ανάθεση σε Διανομέα:</label>
                    <select
                      value={order.assignedTo || ''} // Χρησιμοποιεί το assignedTo της παραγγελίας
                      className="form-select"
                      onChange={(e) => handleAssignOrder(order._id, e.target.value)} // Ενημερώνει την ανάθεση για τη συγκεκριμένη παραγγελία
                    >
                      <option value="" disabled>
                        Επιλέξτε Διανομέα
                      </option>
                      {deliveryUsers.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Αλλαγή Κατάστασης:</label>
                    <select
                      className="form-select"
                      value={order.status}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    >
                      <option value="Σε Εξέλιξη">Σε Εξέλιξη</option>
                      <option value="Ολοκληρώθηκε">Ολοκληρώθηκε</option>
                      <option value="Ακυρώθηκε">Ακυρώθηκε</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Κατηγορία: Όλοι οι Διανομείς */}
      <div className="p-4 mb-4" style={{ backgroundColor: '#e9ecef', borderRadius: '8px' }}>
        <h2 className="mb-3 text-success">Όλοι οι Διανομείς</h2>
        {error && <p className="text-danger">{error}</p>}
        <div className="text-center mb-4">
          <Link to="/admin/add-delivery-user" className="btn btn-primary">
            Προσθήκη Διανομέα
          </Link>
        </div>
        <div className="row">
          {deliveryUsers.map((user) => (
            <div className="col-md-4 mb-4" key={user._id}>
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">{user.name}</h5>
                  <p className="card-text">
                    <strong>Ρόλος:</strong> {user.role}
                  </p>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeleteUser(user._id)}
                  >
                    Διαγραφή
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Κατηγορία: Όλα τα Καταστήματα */}
      <div className="p-4 mb-4" style={{ backgroundColor: '#f1f3f5', borderRadius: '8px' }}>
        <h2 className="mb-3 text-warning">Όλα τα Καταστήματα</h2>
        <div className="text-center mb-4">
          <Link to="/admin/stores" className="btn btn-primary">
            Προσθήκη Καταστήματος
          </Link>
        </div>
        <div className="row">
          {stores.map((store) => (
            <div className="col-md-4 mb-4" key={store._id}>
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">{store.name}</h5>
                  <p className="card-text">
                    <strong>Διεύθυνση:</strong> {store.address}
                  </p>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(store._id)}
                  >
                    Διαγραφή
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;