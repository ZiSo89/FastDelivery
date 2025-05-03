import React, { useState, useEffect } from 'react';
import axios from 'axios';

function OrderPage() {
  const [order, setOrder] = useState({ address: '', items: '', storeId: '' });
  const [stores, setStores] = useState([]); // Λίστα καταστημάτων
  const [message, setMessage] = useState(''); // Μηνύματα επιτυχίας ή σφάλματος

  useEffect(() => {
    // Φόρτωσε τη λίστα των καταστημάτων
    const fetchStores = async () => {
      try {
        const response = await axios.get('http://192.168.1.8:5000/api/stores');
        setStores(response.data);
      } catch (err) {
        console.error('Error fetching stores:', err);
      }
    };

    fetchStores();
  }, []);

  const handleChange = (e) => {
    setOrder({ ...order, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://192.168.1.8:5000/api/orders', order);
      setMessage('Η παραγγελία καταχωρήθηκε με επιτυχία!');
      setOrder({ address: '', items: '', storeId: '' })// Καθαρισμός πεδίων
      console.log('Order response:', response.data);
    } catch (error) {
      console.error('Error placing order:', error);
      setMessage('Αποτυχία καταχώρησης της παραγγελίας. Παρακαλώ δοκιμάστε ξανά.');
    }
  };

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Καταχώρηση Παραγγελίας</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Επιλέξτε Κατάστημα:</label>
          <select
            className="form-select"
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
          <label className="form-label">Διεύθυνση Παράδοσης:</label>
          <input
            type="text"
            className="form-control"
            name="address"
            value={order.address}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Προϊόντα Παραγγελίας:</label>
          <textarea
            className="form-control"
            name="items"
            value={order.items}
            onChange={handleChange}
            required
          ></textarea>
        </div>
        <button type="submit" className="btn btn-primary">
          Υποβολή Παραγγελίας
        </button>
      </form>
      {message && <p className="mt-3">{message}</p>}
    </div>
  );
}

export default OrderPage;