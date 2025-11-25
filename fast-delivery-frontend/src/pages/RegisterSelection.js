import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import '../styles/Login.css';

const RegisterSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="login-page">
      <div className="dashboard-content-wrapper">
        <div className="login-content">
          <div className="text-center mb-4">
            <h2 className="app-title">Fast Delivery</h2>
            <p className="app-subtitle">Επιλέξτε τύπο εγγραφής</p>
          </div>

          {/* Store Registration */}
          <div className="register-option-card p-3 mb-3" onClick={() => navigate('/register-business/store')} style={{cursor: 'pointer'}}>
            <div className="d-flex align-items-center mb-2">
              <div className="option-icon me-3 mb-0" style={{fontSize: '32px'}}>🏪</div>
              <div>
                <h3 className="option-title">Κατάστημα</h3>
                <p className="option-description mb-0">
                  Διαχείριση παραγγελιών & προϊόντων
                </p>
              </div>
            </div>
            <ul className="option-features ps-0 mb-3">
              <li>Διαχείριση παραγγελιών</li>
              <li>Τιμολόγηση προϊόντων</li>
            </ul>
            <Button
              className="btn-primary-app py-2 mb-0"
              style={{fontSize: '14px'}}
              onClick={(e) => {
                e.stopPropagation();
                navigate('/register-business/store');
              }}
            >
              Εγγραφή ως Κατάστημα
            </Button>
          </div>

          {/* Driver Registration */}
          <div className="register-option-card p-3 mb-4" onClick={() => navigate('/register-business/driver')} style={{cursor: 'pointer'}}>
            <div className="d-flex align-items-center mb-2">
              <div className="option-icon me-3 mb-0" style={{fontSize: '32px'}}>🚗</div>
              <div>
                <h3 className="option-title">Οδηγός</h3>
                <p className="option-description mb-0">
                  Αναλάβετε παραδόσεις & κερδίστε
                </p>
              </div>
            </div>
            <ul className="option-features ps-0 mb-3">
              <li>Ευέλικτο ωράριο</li>
              <li>Άμεσες αναθέσεις</li>
            </ul>
            <Button
              className="btn-primary-app py-2 mb-0"
              style={{fontSize: '14px'}}
              onClick={(e) => {
                e.stopPropagation();
                navigate('/register-business/driver');
              }}
            >
              Εγγραφή ως Οδηγός
            </Button>
          </div>

          <div className="text-center mt-auto">
            <div className="divider-custom mb-3">
              <span>ή</span>
            </div>
            <Button
              variant="outline"
              className="btn-outline-app"
              onClick={() => navigate('/login')}
            >
              <span className="me-2">🔐</span>
              Έχω ήδη λογαριασμό - Σύνδεση
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterSelection;
