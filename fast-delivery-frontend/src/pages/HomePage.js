import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Καλώς ήρθατε στο Fast Delivery</h1>
      <p className="text-center">Επιλέξτε μία από τις παρακάτω επιλογές:</p>
      <div className="row justify-content-center">
        <div className="col-md-4">
          <div className="card text-center mb-3">
            <div className="card-body">
              <h5 className="card-title">Καταχώρηση Παραγγελίας</h5>
              <p className="card-text">Δημιουργήστε μια νέα παραγγελία εύκολα και γρήγορα.</p>
              <Link to="/order" className="btn btn-primary">Μετάβαση</Link>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center mb-3">
            <div className="card-body">
              <h5 className="card-title">Πίνακας Διαχείρισης</h5>
              <p className="card-text">Διαχειριστείτε καταστήματα, παραγγελίες και χρήστες.</p>
              <Link to="/admin" className="btn btn-success">Μετάβαση</Link>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center mb-3">
            <div className="card-body">
              <h5 className="card-title">Πίνακας Διανομών</h5>
              <p className="card-text">Διαχειριστείτε τις παραγγελίες που έχουν ανατεθεί.</p>
              <Link to="/delivery" className="btn btn-warning">Μετάβαση</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;