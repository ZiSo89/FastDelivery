import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Form, 
  Button, 
  ListGroup, 
  Badge, 
  Spinner, 
  Alert,
  InputGroup,
  Modal
} from 'react-bootstrap';
import { 
  FaCog, 
  FaEuroSign, 
  FaStore, 
  FaPlus, 
  FaTrash, 
  FaSave,
  FaMotorcycle,
  FaUser,
  FaLock,
  FaEnvelope
} from 'react-icons/fa';
import api from '../../services/api';

const SettingsTab = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Settings state
  const [driverSalary, setDriverSalary] = useState(800);
  const [defaultDeliveryFee, setDefaultDeliveryFee] = useState(2.5);
  const [storeTypes, setStoreTypes] = useState([]);
  const [newStoreType, setNewStoreType] = useState('');
  const [addingType, setAddingType] = useState(false);
  
  // Admin profile state
  const [adminProfile, setAdminProfile] = useState({ name: '', email: '' });
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  
  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch settings on mount
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/settings');
      if (res.data.success) {
        const settings = res.data.settings;
        setDriverSalary(settings.driverSalary || 800);
        setDefaultDeliveryFee(settings.defaultDeliveryFee || 2.5);
        setStoreTypes(settings.storeTypes || []);
      }
      
      // Fetch admin profile
      const profileRes = await api.get('/admin/profile');
      if (profileRes.data.success) {
        setAdminProfile(profileRes.data.admin);
        setAdminName(profileRes.data.admin.name);
        setAdminEmail(profileRes.data.admin.email);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Σφάλμα φόρτωσης ρυθμίσεων');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Save general settings
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const res = await api.put('/admin/settings', {
        driverSalary: parseFloat(driverSalary),
        defaultDeliveryFee: parseFloat(defaultDeliveryFee)
      });
      
      if (res.data.success) {
        setSuccess('Οι ρυθμίσεις αποθηκεύτηκαν επιτυχώς!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.response?.data?.message || 'Σφάλμα αποθήκευσης ρυθμίσεων');
    } finally {
      setSaving(false);
    }
  };

  // Save admin profile
  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      setError(null);
      setSuccess(null);
      
      const res = await api.put('/admin/profile', {
        name: adminName,
        email: adminEmail
      });
      
      if (res.data.success) {
        setAdminProfile(res.data.admin);
        setSuccess('Το προφίλ ενημερώθηκε επιτυχώς!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.response?.data?.message || 'Σφάλμα ενημέρωσης προφίλ');
    } finally {
      setSavingProfile(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Οι κωδικοί δεν ταιριάζουν');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες');
      return;
    }
    
    try {
      setSavingPassword(true);
      setError(null);
      
      const res = await api.put('/admin/profile/password', {
        currentPassword,
        newPassword
      });
      
      if (res.data.success) {
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess('Ο κωδικός άλλαξε επιτυχώς!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err.response?.data?.message || 'Σφάλμα αλλαγής κωδικού');
    } finally {
      setSavingPassword(false);
    }
  };

  // Add new store type
  const handleAddStoreType = async () => {
    if (!newStoreType.trim()) return;
    
    try {
      setAddingType(true);
      setError(null);
      
      const res = await api.post('/admin/settings/store-types', {
        storeType: newStoreType.trim()
      });
      
      if (res.data.success) {
        setStoreTypes(res.data.storeTypes);
        setNewStoreType('');
        setSuccess('Ο τύπος καταστήματος προστέθηκε!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error adding store type:', err);
      setError(err.response?.data?.message || 'Σφάλμα προσθήκης τύπου καταστήματος');
    } finally {
      setAddingType(false);
    }
  };

  // Confirm delete store type
  const confirmDeleteStoreType = (storeType) => {
    setTypeToDelete(storeType);
    setShowDeleteModal(true);
  };

  // Delete store type
  const handleDeleteStoreType = async () => {
    if (!typeToDelete) return;
    
    try {
      setDeleting(true);
      setError(null);
      
      const res = await api.delete(`/admin/settings/store-types/${encodeURIComponent(typeToDelete)}`);
      
      if (res.data.success) {
        setStoreTypes(res.data.storeTypes);
        setSuccess('Ο τύπος καταστήματος διαγράφηκε!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error deleting store type:', err);
      setError(err.response?.data?.message || 'Σφάλμα διαγραφής τύπου καταστήματος');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setTypeToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Φόρτωση ρυθμίσεων...</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
          {success}
        </Alert>
      )}

      <Row>
        {/* General Settings */}
        <Col lg={6}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-primary text-white">
              <FaCog className="me-2" />
              Γενικές Ρυθμίσεις
            </Card.Header>
            <Card.Body>
              <Form>
                {/* Driver Salary */}
                <Form.Group className="mb-4">
                  <Form.Label>
                    <FaMotorcycle className="me-2" />
                    Μισθός Διανομέα (μηνιαίος)
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      value={driverSalary}
                      onChange={(e) => setDriverSalary(e.target.value)}
                      min="0"
                      step="50"
                    />
                    <InputGroup.Text>
                      <FaEuroSign />
                    </InputGroup.Text>
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Ο μισθός που εφαρμόζεται σε όλους τους εγκεκριμένους διανομείς
                  </Form.Text>
                </Form.Group>

                {/* Default Delivery Fee */}
                <Form.Group className="mb-4">
                  <Form.Label>
                    <FaEuroSign className="me-2" />
                    Προεπιλεγμένο Κόστος Παράδοσης
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      value={defaultDeliveryFee}
                      onChange={(e) => setDefaultDeliveryFee(e.target.value)}
                      min="0"
                      step="0.5"
                    />
                    <InputGroup.Text>
                      <FaEuroSign />
                    </InputGroup.Text>
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Η προεπιλεγμένη χρέωση παράδοσης για νέες παραγγελίες
                  </Form.Text>
                </Form.Group>

                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    onClick={handleSaveSettings}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Spinner size="sm" animation="border" className="me-2" />
                        Αποθήκευση...
                      </>
                    ) : (
                      <>
                        <FaSave className="me-2" />
                        Αποθήκευση Ρυθμίσεων
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Store Types */}
        <Col lg={6}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-info text-white">
              <FaStore className="me-2" />
              Τύποι Καταστημάτων
            </Card.Header>
            <Card.Body>
              {/* Add new type */}
              <InputGroup className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Νέος τύπος καταστήματος..."
                  value={newStoreType}
                  onChange={(e) => setNewStoreType(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddStoreType()}
                />
                <Button 
                  variant="success" 
                  onClick={handleAddStoreType}
                  disabled={addingType || !newStoreType.trim()}
                >
                  {addingType ? (
                    <Spinner size="sm" animation="border" />
                  ) : (
                    <FaPlus />
                  )}
                </Button>
              </InputGroup>

              {/* Store types list */}
              {storeTypes.length === 0 ? (
                <Alert variant="info">
                  Δεν υπάρχουν τύποι καταστημάτων. Προσθέστε έναν νέο τύπο παραπάνω.
                </Alert>
              ) : (
                <ListGroup>
                  {storeTypes.map((type, index) => (
                    <ListGroup.Item 
                      key={index}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <span>
                        <Badge bg="secondary" className="me-2">
                          {index + 1}
                        </Badge>
                        {type}
                      </span>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => confirmDeleteStoreType(type)}
                      >
                        <FaTrash />
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}

              <div className="mt-3 text-muted small">
                <strong>Συνολικά:</strong> {storeTypes.length} τύποι καταστημάτων
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Admin Profile */}
      <Row>
        <Col lg={6}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-dark text-white">
              <FaUser className="me-2" />
              Προφίλ Διαχειριστή
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaUser className="me-2" />
                    Όνομα
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Όνομα διαχειριστή"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaEnvelope className="me-2" />
                    Email
                  </Form.Label>
                  <Form.Control
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button 
                    variant="dark" 
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="flex-grow-1"
                  >
                    {savingProfile ? (
                      <>
                        <Spinner size="sm" animation="border" className="me-2" />
                        Αποθήκευση...
                      </>
                    ) : (
                      <>
                        <FaSave className="me-2" />
                        Αποθήκευση Προφίλ
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline-warning" 
                    onClick={() => setShowPasswordModal(true)}
                  >
                    <FaLock className="me-2" />
                    Αλλαγή Κωδικού
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Info Card */}
        <Col lg={6}>
          <Card className="shadow-sm border-warning mb-4">
            <Card.Body className="bg-warning bg-opacity-10">
              <h6 className="text-warning mb-2">💡 Πληροφορίες</h6>
              <ul className="mb-0 small">
                <li>Ο μισθός διανομέα χρησιμοποιείται για τον υπολογισμό του καθαρού κέρδους στα Στατιστικά.</li>
                <li>Οι τύποι καταστημάτων εμφανίζονται κατά την εγγραφή νέων καταστημάτων.</li>
                <li>Τύποι καταστημάτων που χρησιμοποιούνται από υπάρχοντα καταστήματα δεν μπορούν να διαγραφούν.</li>
                <li>Το προεπιλεγμένο κόστος παράδοσης συμπληρώνεται αυτόματα στην ανάθεση μεταφορικών.</li>
                <li>Για τα μηνιαία έξοδα, χρησιμοποιήστε την καρτέλα Στατιστικά.</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>
            <FaTrash className="me-2" />
            Διαγραφή Τύπου Καταστήματος
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Είστε σίγουροι ότι θέλετε να διαγράψετε τον τύπο καταστήματος:</p>
          <p className="fw-bold text-center fs-5">"{typeToDelete}"</p>
          <Alert variant="warning" className="mb-0">
            Αν υπάρχουν καταστήματα με αυτόν τον τύπο, η διαγραφή θα αποτύχει.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Ακύρωση
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteStoreType}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Διαγραφή...
              </>
            ) : (
              <>
                <FaTrash className="me-2" />
                Διαγραφή
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Password Change Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton className="bg-warning">
          <Modal.Title>
            <FaLock className="me-2" />
            Αλλαγή Κωδικού
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Τρέχων Κωδικός</Form.Label>
              <Form.Control
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Εισάγετε τον τρέχοντα κωδικό"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Νέος Κωδικός</Form.Label>
              <Form.Control
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Εισάγετε τον νέο κωδικό (min 6 χαρακτήρες)"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Επιβεβαίωση Νέου Κωδικού</Form.Label>
              <Form.Control
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Επαναλάβετε τον νέο κωδικό"
                isInvalid={confirmPassword && newPassword !== confirmPassword}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <Form.Control.Feedback type="invalid">
                  Οι κωδικοί δεν ταιριάζουν
                </Form.Control.Feedback>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowPasswordModal(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
          }}>
            Ακύρωση
          </Button>
          <Button 
            variant="warning" 
            onClick={handleChangePassword}
            disabled={savingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
          >
            {savingPassword ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Αποθήκευση...
              </>
            ) : (
              <>
                <FaLock className="me-2" />
                Αλλαγή Κωδικού
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SettingsTab;
