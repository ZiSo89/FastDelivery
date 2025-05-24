import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

function AdminStoresPage() {
    const [store, setStore] = useState({ name: '', address: '', workingHours: '' });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setStore({ ...store, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE_URL}/api/stores`, store);
            setMessage('Το κατάστημα προστέθηκε με επιτυχία!');
            //console.log('Απάντηση από το backend:', response.data);
            setStore({ name: '', address: '', workingHours: '' }); // Καθαρισμός πεδίων
        } catch (error) {
            console.error('Σφάλμα κατά την προσθήκη καταστήματος:', error);
            setMessage('Αποτυχία προσθήκης καταστήματος. Παρακαλώ δοκιμάστε ξανά.');
        }
    };

    return (
        <div className="container mt-4">
            <h1 className="text-center mb-4">Προσθήκη Νέου Καταστήματος</h1>
            <form onSubmit={handleSubmit} className="card p-4 shadow">
                <div className="mb-3">
                    <label className="form-label">Όνομα Καταστήματος:</label>
                    <input
                        type="text"
                        name="name"
                        className="form-control"
                        value={store.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Διεύθυνση:</label>
                    <input
                        type="text"
                        name="address"
                        className="form-control"
                        value={store.address}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary w-100">
                    Προσθήκη Καταστήματος
                </button>
            </form>
            {message && <p className="text-center mt-3">{message}</p>}
        </div>
    );
}

export default AdminStoresPage;