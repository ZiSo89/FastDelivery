import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaStore, FaMapMarkerAlt, FaClipboardList } from 'react-icons/fa';
import { Spinner } from 'react-bootstrap';
import './OrderPage.css'; // Import custom CSS for dark mode and styling

function OrderPage() {
  const [order, setOrder] = useState({ address: '', items: '', storeId: '' });
  const [stores, setStores] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const socket = io('http://192.168.1.8:5000');

  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://192.168.1.8:5000/api/stores');
        setStores(response.data);
      } catch (err) {
        console.error('Error fetching stores:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  const handleChange = (e) => {
    setOrder({ ...order, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://192.168.1.8:5000/api/orders', order);
      setMessage('Η παραγγελία καταχωρήθηκε με επιτυχία!');
      setOrder({ address: '', items: '', storeId: '' });
      socket.emit('newOrder', response.data);
    } catch (error) {
      console.error('Error placing order:', error);
      setMessage('Αποτυχία καταχώρησης της παραγγελίας. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="header-dark">
      <header className="bg-dark text-light py-3">
        <div className="container text-center">
          <h1>Fast Delivery</h1>
          <p>Η πιο γρήγορη πλατφόρμα παραγγελιών!</p>
        </div>
      </header>

      <div className="order-page">
        <div className="container mt-4 dark-mode">
          <h1 className="text-center mb-4 text-light">Καταχώρηση Παραγγελίας</h1>
          <div className="card shadow-lg p-4 bg-dark text-light rounded">
            {loading && (
              <div className="text-center mb-3">
                <Spinner animation="border" role="status" variant="light">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">
                  <FaStore className="me-2" /> Επιλέξτε Κατάστημα:
                </label>
                <select
                  className="form-select bg-dark text-light border-light rounded"
                  name="storeId"
                  value={order.storeId}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Επιλέξτε Κατάστημα --</option>
                  {stores.map((store) => (
                    <option key={store._id} value={store._id}>
                      {store.name} ({store.address})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">
                  <FaMapMarkerAlt className="me-2" /> Διεύθυνση Παράδοσης:
                </label>
                <input
                  type="text"
                  className="form-control bg-dark text-light border-light rounded"
                  name="address"
                  value={order.address}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">
                  <FaClipboardList className="me-2" /> Προϊόντα Παραγγελίας:
                </label>
                <textarea
                  className="form-control bg-dark text-light border-light rounded"
                  name="items"
                  value={order.items}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary w-100 rounded" disabled={loading}>
                Υποβολή Παραγγελίας
              </button>
            </form>
            {message && (
              <div
                className={`alert mt-3 ${message.includes('επιτυχία') ? 'alert-success' : 'alert-danger'
                  }`}
                role="alert"
              >
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="footer-dark">
        <footer className="bg-dark text-light py-3 mt-4">
          <div className="container text-center">
            <p>&copy; 2025 Fast Delivery. Όλα τα δικαιώματα Γιωργού Ρίνη.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default OrderPage;