import React, { useState } from 'react';
import axios from 'axios';

function AddDeliveryUserPage() {
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://192.168.1.8:5000/api/users/delivery', { name });
            setMessage('Ο διανομέας προστέθηκε με επιτυχία!');
            setError('');
            setName(''); // Καθαρισμός του πεδίου
        } catch (err) {
            console.error('Σφάλμα κατά την προσθήκη διανομέα:', err);
            setError('Αποτυχία προσθήκης διανομέα. Παρακαλώ δοκιμάστε ξανά.');
            setMessage('');
        }
    };

    return (
        <div className="container mt-4">
            <h1 className="text-center mb-4">Προσθήκη Διανομέα</h1>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Όνομα:</label>
                    <input
                        type="text"
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary">
                    Προσθήκη Διανομέα
                </button>
            </form>
            {message && <p className="text-success mt-3">{message}</p>}
            {error && <p className="text-danger mt-3">{error}</p>}
        </div>
    );
}

export default AddDeliveryUserPage;