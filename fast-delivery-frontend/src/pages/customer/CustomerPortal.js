import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/CustomerPortal.css';

const CustomerPortal = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🖱️ Clicked Login Submit');
    setError('');
    setLoading(true);

    const result = await login({ email, password, role: 'customer' });

    if (result.success) {
      console.log('✅ Login Successful');
      navigate('/order');
    } else {
      console.log('❌ Login Failed');
      setError('Λάθος email ή κωδικός');
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <div className="login-screen">
        <div className="brand-header">
          <h1>FastDelivery</h1>
          <p>Εσύ ζητάς, εμείς τρέχουμε</p>
        </div>

        <div className="login-form-container">
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input 
                type="email" 
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="input-group">
              <input 
                type="password" 
                placeholder="Κωδικός πρόσβασης"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>

            {error && <div className="error-msg">{error}</div>}

            <button type="submit" className="btn-primary-app" disabled={loading}>
              {loading ? 'Σύνδεση...' : 'Σύνδεση'}
            </button>
          </form>

          <div className="secondary-actions">
            <p>Δεν έχεις λογαριασμό; <Link to="/register" onClick={() => console.log('🖱️ Clicked Register Link')}>Εγγραφή</Link></p>
            <div className="divider">ή</div>
            <Link to="/order" className="guest-link" onClick={() => console.log('🖱️ Clicked Guest Link')}>Συνέχεια ως Επισκέπτης</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPortal;
