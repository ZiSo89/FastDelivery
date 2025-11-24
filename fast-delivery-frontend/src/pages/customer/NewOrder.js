import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, ListGroup } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { customerService } from '../../services/api';
import '../../styles/Customer.css';

const NewOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '', // Added email field
    deliveryAddress: '',
    orderContent: '',
    orderType: 'text'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const MAX_RECORDING_TIME = 50; // seconds

  useEffect(() => {
    if (location.state?.store) {
      setSelectedStore(location.state.store);
    } else {
      fetchStores();
    }
  }, [location.state]);

  useEffect(() => {
    if (user) {
      console.log('👤 Auto-filling form with user data:', user);
      setFormData(prev => ({
        ...prev,
        customerName: user.name || '',
        customerPhone: user.phone || '',
        customerEmail: user.email || '', // Auto-fill email
        deliveryAddress: user.address || ''
      }));
    }
  }, [user]);

  const fetchStores = async () => {
    try {
      // Default coordinates (Thessaloniki center for demo)
      const response = await customerService.getStores({ latitude: 40.6401, longitude: 22.9444, maxDistance: 10000 });
      // Backend επιστρέφει { success: true, stores: [...] }
      setStores(response.stores || response.data || []);
    } catch (err) {
      setError('Σφάλμα φόρτωσης καταστημάτων');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🖱️ Clicked Submit Order');
    setError('');
    setSuccess('');

    if (!selectedStore) {
      console.log('❌ No store selected');
      setError('Παρακαλώ επιλέξτε κατάστημα');
      return;
    }

    if (!formData.customerName || !formData.customerPhone || !formData.deliveryAddress) {
      console.log('❌ Missing fields', formData);
      setError('Παρακαλώ συμπληρώστε όλα τα πεδία');
      return;
    }

    // Check if either text or voice is provided
    if (!formData.orderContent && !audioBlob) {
      setError('Παρακαλώ συμπληρώστε την περιγραφή ή ηχογραφήστε μήνυμα');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    try {
      let orderData;
      
      if (audioBlob) {
        // Use FormData for voice order
        orderData = new FormData();
        // Send customer data as JSON string to handle nested object correctly
        orderData.append('customer', JSON.stringify({
          name: formData.customerName,
          phone: formData.customerPhone,
          email: formData.customerEmail,
          address: formData.deliveryAddress
        }));
        orderData.append('storeId', selectedStore._id);
        orderData.append('orderType', 'voice');
        orderData.append('orderContent', formData.orderContent || 'Φωνητική Παραγγελία'); // Fallback text
        orderData.append('voiceFile', audioBlob, 'voice-order.webm');
      } else {
        // Use JSON for text order
        orderData = {
          customer: {
            name: formData.customerName,
            phone: formData.customerPhone,
            email: formData.customerEmail,
            address: formData.deliveryAddress
          },
          storeId: selectedStore._id,
          orderType: 'text',
          orderContent: formData.orderContent
        };
      }

      console.log('📤 Sending Order Data...');
      const response = await customerService.createOrder(orderData);
      console.log('✅ Order Created:', response);
      setSuccess(`Η παραγγελία σας καταχωρήθηκε! Αριθμός: ${response.order.orderNumber}`);
      
      setTimeout(() => {
        navigate(`/order-status/${response.order.orderNumber}`);
      }, 2000);
    } catch (err) {
      console.error('❌ Order Error:', err);
      setError(err.response?.data?.message || 'Σφάλμα δημιουργίας παραγγελίας');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_RECORDING_TIME) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Δεν ήταν δυνατή η πρόσβαση στο μικρόφωνο');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    if (isRecording) {
      stopRecording();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="app-container" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Container className="p-0" fluid>
        <Row className="justify-content-center m-0">
          <Col xs={12} sm={12} md={8} lg={6} xl={5} className="p-0 bg-white min-vh-100 shadow-sm position-relative">
            <header className="app-header">
              <div className="header-content">
                <button className="btn-icon" onClick={() => navigate('/order')}>
                  <i className="fas fa-arrow-left"></i>
                </button>
                <h3>Νέα Παραγγελία</h3>
                <div style={{ width: 32 }}></div>
              </div>
            </header>

            <div className="main-content" style={{ padding: '20px' }}>
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              <form onSubmit={handleSubmit}>
                <h5 className="mb-3">Στοιχεία Καταστήματος</h5>
                {selectedStore ? (
                  <div className="selected-store-card mb-4 p-3 bg-light rounded" style={{ borderLeft: '4px solid #00c2e8' }}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="w-100">
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-store me-3 text-secondary" style={{ width: '20px' }}></i>
                          <h6 className="mb-0 fw-bold text-dark">{selectedStore.businessName || selectedStore.storeName}</h6>
                        </div>
                        
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-info-circle me-3 text-secondary" style={{ width: '20px' }}></i>
                          <span className="text-dark">{selectedStore.storeType}</span>
                        </div>

                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-map-marker-alt me-3 text-secondary" style={{ width: '20px' }}></i>
                          <span className="text-dark">{selectedStore.address}</span>
                        </div>

                        {selectedStore.phone && (
                          <div className="d-flex align-items-center mb-2">
                            <i className="fas fa-phone me-3 text-secondary" style={{ width: '20px' }}></i>
                            <a href={`tel:${selectedStore.phone}`} className="text-decoration-none text-dark fw-bold">
                              {selectedStore.phone}
                            </a>
                          </div>
                        )}
                        
                        {selectedStore.description && (
                          <div className="mt-3 p-2 bg-white rounded border-start border-2 border-info">
                            <small className="text-secondary fst-italic">"{selectedStore.description}"</small>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <ListGroup className="mb-4">
                    {stores.length === 0 ? (
                      <Alert variant="info">Δεν βρέθηκαν διαθέσιμα καταστήματα</Alert>
                    ) : (
                      stores.map((store) => (
                        <ListGroup.Item
                          key={store._id}
                          action
                          active={selectedStore?._id === store._id}
                          onClick={() => setSelectedStore(store)}
                          className="cursor-pointer"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-1">{store.businessName || store.storeName}</h6>
                              <small>{store.storeType} · {store.address}</small>
                            </div>
                            {selectedStore?._id === store._id && (
                              <span className="badge bg-success">✓</span>
                            )}
                          </div>
                        </ListGroup.Item>
                      ))
                    )}
                  </ListGroup>
                )}

                <h5 className="mb-3">Στοιχεία Πελάτη</h5>
                
                <div className="customer-details-card mb-4 p-3 bg-light rounded" style={{ borderLeft: '4px solid #00c2e8' }}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="w-100">
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-user me-3 text-secondary" style={{ width: '20px' }}></i>
                        <h6 className="mb-0 fw-bold text-dark">{formData.customerName || 'Όνομα Πελάτη'}</h6>
                      </div>
                      
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-phone me-3 text-secondary" style={{ width: '20px' }}></i>
                        <span className="text-dark fw-bold">{formData.customerPhone || 'Τηλέφωνο'}</span>
                      </div>

                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-map-marker-alt me-3 text-secondary" style={{ width: '20px' }}></i>
                        <span className="text-dark">{formData.deliveryAddress || 'Διεύθυνση'}</span>
                      </div>
                      
                      <div className="mt-3 text-end">
                        <small>
                          <a href="/profile" className="text-decoration-none" style={{ color: '#00c2e8' }}>
                            <i className="fas fa-edit me-1"></i>
                            Αλλαγή στοιχείων
                          </a>
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label">Φωνητική Παραγγελία</label>
                  <div className="voice-recorder-container p-3 border rounded bg-light mb-3">
                    {!isRecording && !audioBlob ? (
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="text-muted">Πατήστε για ηχογράφηση (max 50s)</span>
                        <button 
                          type="button" 
                          className="btn btn-danger rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: '50px', height: '50px' }}
                          onClick={startRecording}
                        >
                          <i className="fas fa-microphone fa-lg"></i>
                        </button>
                      </div>
                    ) : isRecording ? (
                      <div className="recording-active">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-danger fw-bold animate-pulse">● Recording...</span>
                          <span className="font-monospace">{formatTime(recordingTime)} / 0:50</span>
                        </div>
                        <div className="progress mb-3" style={{ height: '10px' }}>
                          <div 
                            className="progress-bar bg-danger progress-bar-striped progress-bar-animated" 
                            role="progressbar" 
                            style={{ width: `${(recordingTime / MAX_RECORDING_TIME) * 100}%` }}
                          ></div>
                        </div>
                        <div className="d-flex justify-content-center">
                          <button 
                            type="button" 
                            className="btn btn-outline-danger rounded-circle"
                            style={{ width: '50px', height: '50px' }}
                            onClick={stopRecording}
                          >
                            <i className="fas fa-stop"></i>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="recording-complete">
                        <div className="d-flex align-items-center justify-content-between">
                          <audio src={audioUrl} controls className="flex-grow-1 me-3" style={{ height: '40px' }} />
                          <button 
                            type="button" 
                            className="btn btn-outline-secondary rounded-circle"
                            onClick={deleteRecording}
                            title="Διαγραφή"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <label className="form-label">Περιγραφή Παραγγελίας</label>
                  <textarea
                    rows={4}
                    name="orderContent"
                    className="form-control app-input"
                    placeholder="Περιγράψτε τι θέλετε να παραγγείλετε..."
                    value={formData.orderContent}
                    onChange={handleChange}
                  />
                  <div className="form-text">
                    Αναφέρετε με λεπτομέρεια τα προϊόντα που θέλετε ή χρησιμοποιήστε φωνητικό μήνυμα.
                  </div>
                </div>



                <div className="d-grid">
                  <button
                    type="submit"
                    className="btn-primary-app"
                    disabled={loading || !selectedStore}
                  >
                    {loading ? 'Αποστολή...' : 'Υποβολή Παραγγελίας'}
                  </button>
                </div>
              </form>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default NewOrder;
