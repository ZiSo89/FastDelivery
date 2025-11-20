import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { customerService } from '../../services/api';
import '../../styles/CustomerPortal.css';

const TrackOrder = () => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // If user is logged in, redirect to My Orders
    if (user) {
      navigate('/my-orders');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const value = inputValue.trim();
    if (!value) return;

    setLoading(true);

    try {
      // Check if input is phone number (10 digits)
      const isPhone = /^\d{10}$/.test(value);

      if (isPhone) {
        // Search by phone
        const response = await customerService.getActiveOrderByPhone(value);
        if (response.success && response.order) {
          navigate(`/order-status/${response.order.orderNumber}`);
        }
      } else {
        // Assume it's an order number
        navigate(`/order-status/${value}`);
      }
    } catch (err) {
      console.error('Track error:', err);
      setError(err.response?.data?.message || 'Δεν βρέθηκε ενεργή παραγγελία');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <button className="btn-icon" onClick={() => navigate('/order')}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h3>Εντοπισμός</h3>
          <div style={{width: 32}}></div>
        </div>
      </header>

      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px' }}>
        <div className="login-form-container">
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Πού είναι το φαγητό μου;</h2>
          
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input 
                type="text" 
                placeholder="Αριθμός Παραγγελίας ή Τηλέφωνο"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                required 
              />
            </div>
            <div className="form-text mb-3 text-center">
              Εισάγετε τον αριθμό της παραγγελίας σας ή το κινητό σας τηλέφωνο (10 ψηφία)
            </div>
            <button type="submit" className="btn-primary-app" disabled={loading}>
              {loading ? 'Αναζήτηση...' : 'Αναζήτηση'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
