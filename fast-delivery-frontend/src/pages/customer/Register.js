import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/CustomerPortal.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!formData.name || !formData.email || !formData.password || !formData.phone || !formData.address) {
      setError('Παρακαλώ συμπληρώστε όλα τα πεδία');
      setLoading(false);
      return;
    }

    if (formData.phone.length !== 10) {
      setError('Το τηλέφωνο πρέπει να είναι 10ψήφιο');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Ο κωδικός πρέπει να είναι τουλάχιστον 6 χαρακτήρες');
      setLoading(false);
      return;
    }

    const result = await register(formData);

    if (result.success) {
      navigate('/order');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <button className="btn-icon" onClick={() => navigate('/')}>
            <span style={{ fontSize: '1.2rem' }}>🔙</span>
          </button>
          <h3>Εγγραφή</h3>
          <div style={{ width: 32 }}></div>
        </div>
      </header>

      <div className="main-content" style={{ padding: '20px' }}>
        <div className="login-form-container">
          <h2 className="screen-title" style={{ textAlign: 'center', marginBottom: '20px' }}>Δημιουργία λογαριασμού</h2>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ονοματεπώνυμο"
                className="app-input"
              />
            </div>

            <div className="input-group">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="app-input"
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Κωδικός (min. 6 chars)"
                className="app-input"
              />
            </div>

            <div className="input-group">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Κινητό τηλέφωνο"
                maxLength="10"
                className="app-input"
              />
            </div>

            <div className="input-group">
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Διεύθυνση παράδοσης"
                className="app-input"
              />
            </div>

            <button type="submit" className="btn-primary-app" disabled={loading}>
              {loading ? 'Εγγραφή...' : 'Εγγραφή'}
            </button>
          </form>

          <div className="secondary-actions">
            <p>Έχεις ήδη λογαριασμό; <Link to="/">Σύνδεση</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
