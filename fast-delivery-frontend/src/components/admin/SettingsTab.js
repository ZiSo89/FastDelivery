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
  Modal,
  OverlayTrigger,
  Tooltip
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
  FaEnvelope,
  FaEdit,
  FaClock,
  FaDownload,
  FaUpload,
  FaServer,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSync,
  FaHistory,
  FaMobileAlt,
  FaAndroid,
  FaApple
} from 'react-icons/fa';
import api from '../../services/api';

// Available icons for store types
const AVAILABLE_ICONS = [
  '🏪', '🛒', '☕', '🍔', '🍕', '🥙', '🍖', '🥖', '🎂', '🍰',
  '🥩', '🐟', '🍎', '🍷', '💐', '💊', '🐕', '🍜', '🍣', '🥗',
  '🍦', '🍩', '🧁', '🥪', '🌮', '🍿', '🥤', '🍺', '🍝', '🥘'
];

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
  const [newStoreIcon, setNewStoreIcon] = useState('🏪');
  const [addingType, setAddingType] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  
  // Service hours state
  const [serviceHoursEnabled, setServiceHoursEnabled] = useState(false);
  const [serviceHoursStart, setServiceHoursStart] = useState('09:00');
  const [serviceHoursEnd, setServiceHoursEnd] = useState('23:00');
  
  // Edit icon modal state
  const [showEditIconModal, setShowEditIconModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [editingIcon, setEditingIcon] = useState('🏪');
  const [savingIcon, setSavingIcon] = useState(false);
  
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

  // Database Backup state
  const [dbToolsStatus, setDbToolsStatus] = useState(null);
  const [checkingTools, setCheckingTools] = useState(false);
  const [installingTools, setInstallingTools] = useState(false);
  const [creatingDbBackup, setCreatingDbBackup] = useState(false);
  const [showDbRestoreModal, setShowDbRestoreModal] = useState(false);
  const [restoringDb, setRestoringDb] = useState(false);
  const [dbBackupFile, setDbBackupFile] = useState(null);
  const [dbBackupProgress, setDbBackupProgress] = useState('');

  // App Versions state
  const [appVersions, setAppVersions] = useState({
    customer: {
      android: { latest: '1.0.0', minimum: '1.0.0', storeUrl: '' },
      ios: { latest: '1.0.0', minimum: '1.0.0', storeUrl: '' }
    },
    driver: {
      android: { latest: '1.0.0', minimum: '1.0.0', storeUrl: '' },
      ios: { latest: '1.0.0', minimum: '1.0.0', storeUrl: '' }
    }
  });
  const [savingVersions, setSavingVersions] = useState(false);

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
        setServiceHoursEnabled(settings.serviceHoursEnabled || false);
        setServiceHoursStart(settings.serviceHoursStart || '09:00');
        setServiceHoursEnd(settings.serviceHoursEnd || '23:00');
        
        // Load app versions
        if (settings.appVersions) {
          setAppVersions(settings.appVersions);
        }
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
        defaultDeliveryFee: parseFloat(defaultDeliveryFee),
        serviceHoursEnabled,
        serviceHoursStart,
        serviceHoursEnd
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
        storeType: newStoreType.trim(),
        icon: newStoreIcon
      });
      
      if (res.data.success) {
        setStoreTypes(res.data.storeTypes);
        setNewStoreType('');
        setNewStoreIcon('🏪');
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

  // Update store type icon
  const handleUpdateIcon = async () => {
    if (!editingType) return;
    
    try {
      setSavingIcon(true);
      setError(null);
      
      const res = await api.put(`/admin/settings/store-types/${encodeURIComponent(editingType)}`, {
        icon: editingIcon
      });
      
      if (res.data.success) {
        setStoreTypes(res.data.storeTypes);
        setShowEditIconModal(false);
        setEditingType(null);
        setSuccess('Το εικονίδιο ενημερώθηκε!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error updating icon:', err);
      setError(err.response?.data?.message || 'Σφάλμα ενημέρωσης εικονιδίου');
    } finally {
      setSavingIcon(false);
    }
  };

  // Open edit icon modal
  const openEditIconModal = (storeType) => {
    setEditingType(storeType.name);
    setEditingIcon(storeType.icon);
    setShowEditIconModal(true);
  };

  // Confirm delete store type
  const confirmDeleteStoreType = (storeType) => {
    setTypeToDelete(storeType.name);
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

  // Check database tools status
  const checkDbToolsStatus = async () => {
    // Έλεγχος αν είναι Windows - το database backup δουλεύει μόνο σε Windows
    const isWindows = navigator.userAgent.includes('Windows');
    if (!isWindows) {
      setDbToolsStatus({ installed: false, notSupported: true, message: 'Το Database Backup διαθέσιμο μόνο σε Windows' });
      return;
    }
    
    try {
      setCheckingTools(true);
      setError(null);
      const res = await api.get('/admin/database/tools-status');
      setDbToolsStatus(res.data);
    } catch (err) {
      console.error('Error checking tools status:', err);
      setError('Σφάλμα ελέγχου εργαλείων βάσης δεδομένων');
    } finally {
      setCheckingTools(false);
    }
  };

  // Install database tools
  const handleInstallDbTools = async () => {
    try {
      setInstallingTools(true);
      setError(null);
      setDbBackupProgress('Εγκατάσταση εργαλείων MongoDB... Αυτό μπορεί να πάρει μερικά λεπτά.');
      
      const res = await api.post('/admin/database/install-tools');
      
      if (res.data.success) {
        setSuccess('Τα εργαλεία MongoDB εγκαταστάθηκαν επιτυχώς!');
        setDbToolsStatus({ installed: true, message: res.data.message });
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error installing tools:', err);
      setError(err.response?.data?.message || 'Σφάλμα εγκατάστασης εργαλείων');
    } finally {
      setInstallingTools(false);
      setDbBackupProgress('');
    }
  };

  // Create database backup
  const handleCreateDbBackup = async () => {
    try {
      setCreatingDbBackup(true);
      setError(null);
      setDbBackupProgress('Δημιουργία αντιγράφου ασφαλείας...');
      
      const res = await api.post('/admin/database/backup', {}, {
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([res.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mongodb-backup-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Το αντίγραφο ασφαλείας δημιουργήθηκε και κατέβηκε επιτυχώς!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error creating backup:', err);
      setError(err.response?.data?.message || 'Σφάλμα δημιουργίας αντιγράφου');
    } finally {
      setCreatingDbBackup(false);
      setDbBackupProgress('');
    }
  };

  // Handle database backup file selection
  const handleDbBackupFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.zip')) {
      setError('Παρακαλώ επιλέξτε αρχείο .zip');
      return;
    }
    
    setDbBackupFile(file);
  };

  // Restore database from backup
  const handleRestoreDatabase = async () => {
    if (!dbBackupFile) return;
    
    try {
      setRestoringDb(true);
      setError(null);
      setDbBackupProgress('Επαναφορά βάσης δεδομένων... Παρακαλώ περιμένετε.');
      
      const formData = new FormData();
      formData.append('backup', dbBackupFile);
      
      const res = await api.post('/admin/database/restore', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.data.success) {
        setSuccess(`Η βάση δεδομένων επαναφέρθηκε επιτυχώς! ${res.data.message}`);
        setShowDbRestoreModal(false);
        setDbBackupFile(null);
        fetchSettings(); // Refresh settings
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err) {
      console.error('Error restoring database:', err);
      setError(err.response?.data?.message || 'Σφάλμα επαναφοράς βάσης δεδομένων');
    } finally {
      setRestoringDb(false);
      setDbBackupProgress('');
    }
  };

  // Check tools status on mount
  useEffect(() => {
    checkDbToolsStatus();
  }, []);

  // Update app version field
  const handleVersionChange = (app, platform, field, value) => {
    setAppVersions(prev => ({
      ...prev,
      [app]: {
        ...prev[app],
        [platform]: {
          ...prev[app][platform],
          [field]: value
        }
      }
    }));
  };

  // Save app versions
  const handleSaveVersions = async () => {
    try {
      setSavingVersions(true);
      setError(null);
      setSuccess(null);
      
      const res = await api.put('/admin/settings', { appVersions });
      
      if (res.data.success) {
        setSuccess('Οι εκδόσεις εφαρμογών αποθηκεύτηκαν επιτυχώς!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error saving versions:', err);
      setError(err.response?.data?.message || 'Σφάλμα αποθήκευσης εκδόσεων');
    } finally {
      setSavingVersions(false);
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

                {/* Service Hours */}
                <Form.Group className="mb-4">
                  <Form.Label>
                    <FaClock className="me-2" />
                    Ώρες Λειτουργίας Υπηρεσίας
                  </Form.Label>
                  <Form.Check
                    type="switch"
                    id="service-hours-switch"
                    label={serviceHoursEnabled ? 'Ενεργοποιημένο' : 'Απενεργοποιημένο'}
                    checked={serviceHoursEnabled}
                    onChange={(e) => setServiceHoursEnabled(e.target.checked)}
                    className="mb-2"
                  />
                  {serviceHoursEnabled && (
                    <Row className="mt-2">
                      <Col xs={6}>
                        <Form.Label className="small text-muted">Ώρα Έναρξης</Form.Label>
                        <Form.Control
                          type="time"
                          value={serviceHoursStart}
                          onChange={(e) => setServiceHoursStart(e.target.value)}
                        />
                      </Col>
                      <Col xs={6}>
                        <Form.Label className="small text-muted">Ώρα Λήξης</Form.Label>
                        <Form.Control
                          type="time"
                          value={serviceHoursEnd}
                          onChange={(e) => setServiceHoursEnd(e.target.value)}
                        />
                      </Col>
                    </Row>
                  )}
                  <Form.Text className="text-muted">
                    {serviceHoursEnabled 
                      ? `Οι πελάτες μπορούν να παραγγείλουν μόνο ${serviceHoursStart} - ${serviceHoursEnd}`
                      : 'Οι πελάτες μπορούν να παραγγείλουν οποιαδήποτε ώρα'}
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
              {/* Add new type with icon picker */}
              <div className="mb-3">
                <div className="d-flex gap-2 mb-2">
                  {/* Icon Picker Dropdown */}
                  <div className="position-relative">
                    <Button 
                      variant="outline-secondary"
                      onClick={() => setShowIconPicker(!showIconPicker)}
                      style={{ fontSize: '1.5rem', padding: '4px 12px', minWidth: '50px' }}
                      title="Επιλογή εικονιδίου"
                    >
                      {newStoreIcon}
                    </Button>
                    {showIconPicker && (
                      <div 
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          zIndex: 1000,
                          backgroundColor: 'white',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          padding: '10px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(6, 1fr)',
                          gap: '5px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          maxWidth: '280px'
                        }}
                      >
                        {AVAILABLE_ICONS.map((icon, idx) => (
                          <Button
                            key={idx}
                            variant={newStoreIcon === icon ? 'primary' : 'outline-light'}
                            onClick={() => {
                              setNewStoreIcon(icon);
                              setShowIconPicker(false);
                            }}
                            style={{ 
                              fontSize: '1.3rem', 
                              padding: '5px',
                              border: newStoreIcon === icon ? '' : '1px solid #eee'
                            }}
                          >
                            {icon}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Store type input */}
                  <Form.Control
                    type="text"
                    placeholder="Νέος τύπος καταστήματος..."
                    value={newStoreType}
                    onChange={(e) => setNewStoreType(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddStoreType()}
                    className="flex-grow-1"
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
                </div>
                <Form.Text className="text-muted">
                  Επιλέξτε εικονίδιο και πληκτρολογήστε τον τύπο καταστήματος
                </Form.Text>
              </div>

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
                      <span className="d-flex align-items-center">
                        <span style={{ fontSize: '1.4rem', marginRight: '10px' }}>
                          {type.icon || '🏪'}
                        </span>
                        <span>{type.name}</span>
                      </span>
                      <div className="d-flex gap-2">
                        <OverlayTrigger
                          placement="top"
                          overlay={<Tooltip>Αλλαγή εικονιδίου</Tooltip>}
                        >
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => openEditIconModal(type)}
                          >
                            <FaEdit />
                          </Button>
                        </OverlayTrigger>
                        <OverlayTrigger
                          placement="top"
                          overlay={<Tooltip>Διαγραφή</Tooltip>}
                        >
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => confirmDeleteStoreType(type)}
                          >
                            <FaTrash />
                          </Button>
                        </OverlayTrigger>
                      </div>
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

        {/* App Versions Card */}
        <Col lg={12}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-dark text-white">
              <FaMobileAlt className="me-2" />
              Εκδόσεις Εφαρμογών (App Versioning)
            </Card.Header>
            <Card.Body>
              <Row>
                {/* Customer App */}
                <Col md={6}>
                  <h6 className="mb-3">
                    <span className="me-2">📱</span>
                    Customer App
                  </h6>
                  
                  {/* Android */}
                  <div className="border rounded p-3 mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <FaAndroid className="text-success me-2" />
                      <strong>Android</strong>
                    </div>
                    <Row className="g-2">
                      <Col sm={6}>
                        <Form.Group>
                          <Form.Label className="small text-muted">Τρέχουσα Έκδοση</Form.Label>
                          <Form.Control
                            type="text"
                            size="sm"
                            placeholder="1.0.0"
                            value={appVersions.customer?.android?.latest || ''}
                            onChange={(e) => handleVersionChange('customer', 'android', 'latest', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col sm={6}>
                        <Form.Group>
                          <Form.Label className="small text-muted">Ελάχιστη Έκδοση</Form.Label>
                          <Form.Control
                            type="text"
                            size="sm"
                            placeholder="1.0.0"
                            value={appVersions.customer?.android?.minimum || ''}
                            onChange={(e) => handleVersionChange('customer', 'android', 'minimum', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col sm={12}>
                        <Form.Group>
                          <Form.Label className="small text-muted">Play Store URL</Form.Label>
                          <Form.Control
                            type="url"
                            size="sm"
                            placeholder="https://play.google.com/store/apps/details?id=..."
                            value={appVersions.customer?.android?.storeUrl || ''}
                            onChange={(e) => handleVersionChange('customer', 'android', 'storeUrl', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>

                  {/* iOS */}
                  <div className="border rounded p-3">
                    <div className="d-flex align-items-center mb-2">
                      <FaApple className="text-dark me-2" />
                      <strong>iOS</strong>
                    </div>
                    <Row className="g-2">
                      <Col sm={6}>
                        <Form.Group>
                          <Form.Label className="small text-muted">Τρέχουσα Έκδοση</Form.Label>
                          <Form.Control
                            type="text"
                            size="sm"
                            placeholder="1.0.0"
                            value={appVersions.customer?.ios?.latest || ''}
                            onChange={(e) => handleVersionChange('customer', 'ios', 'latest', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col sm={6}>
                        <Form.Group>
                          <Form.Label className="small text-muted">Ελάχιστη Έκδοση</Form.Label>
                          <Form.Control
                            type="text"
                            size="sm"
                            placeholder="1.0.0"
                            value={appVersions.customer?.ios?.minimum || ''}
                            onChange={(e) => handleVersionChange('customer', 'ios', 'minimum', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col sm={12}>
                        <Form.Group>
                          <Form.Label className="small text-muted">App Store URL</Form.Label>
                          <Form.Control
                            type="url"
                            size="sm"
                            placeholder="https://apps.apple.com/app/..."
                            value={appVersions.customer?.ios?.storeUrl || ''}
                            onChange={(e) => handleVersionChange('customer', 'ios', 'storeUrl', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                </Col>

                {/* Driver App */}
                <Col md={6}>
                  <h6 className="mb-3">
                    <FaMotorcycle className="me-2" />
                    Driver App
                  </h6>
                  
                  {/* Android */}
                  <div className="border rounded p-3 mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <FaAndroid className="text-success me-2" />
                      <strong>Android</strong>
                    </div>
                    <Row className="g-2">
                      <Col sm={6}>
                        <Form.Group>
                          <Form.Label className="small text-muted">Τρέχουσα Έκδοση</Form.Label>
                          <Form.Control
                            type="text"
                            size="sm"
                            placeholder="1.0.0"
                            value={appVersions.driver?.android?.latest || ''}
                            onChange={(e) => handleVersionChange('driver', 'android', 'latest', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col sm={6}>
                        <Form.Group>
                          <Form.Label className="small text-muted">Ελάχιστη Έκδοση</Form.Label>
                          <Form.Control
                            type="text"
                            size="sm"
                            placeholder="1.0.0"
                            value={appVersions.driver?.android?.minimum || ''}
                            onChange={(e) => handleVersionChange('driver', 'android', 'minimum', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col sm={12}>
                        <Form.Group>
                          <Form.Label className="small text-muted">Play Store URL</Form.Label>
                          <Form.Control
                            type="url"
                            size="sm"
                            placeholder="https://play.google.com/store/apps/details?id=..."
                            value={appVersions.driver?.android?.storeUrl || ''}
                            onChange={(e) => handleVersionChange('driver', 'android', 'storeUrl', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>

                  {/* iOS */}
                  <div className="border rounded p-3">
                    <div className="d-flex align-items-center mb-2">
                      <FaApple className="text-dark me-2" />
                      <strong>iOS</strong>
                    </div>
                    <Row className="g-2">
                      <Col sm={6}>
                        <Form.Group>
                          <Form.Label className="small text-muted">Τρέχουσα Έκδοση</Form.Label>
                          <Form.Control
                            type="text"
                            size="sm"
                            placeholder="1.0.0"
                            value={appVersions.driver?.ios?.latest || ''}
                            onChange={(e) => handleVersionChange('driver', 'ios', 'latest', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col sm={6}>
                        <Form.Group>
                          <Form.Label className="small text-muted">Ελάχιστη Έκδοση</Form.Label>
                          <Form.Control
                            type="text"
                            size="sm"
                            placeholder="1.0.0"
                            value={appVersions.driver?.ios?.minimum || ''}
                            onChange={(e) => handleVersionChange('driver', 'ios', 'minimum', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col sm={12}>
                        <Form.Group>
                          <Form.Label className="small text-muted">App Store URL</Form.Label>
                          <Form.Control
                            type="url"
                            size="sm"
                            placeholder="https://apps.apple.com/app/..."
                            value={appVersions.driver?.ios?.storeUrl || ''}
                            onChange={(e) => handleVersionChange('driver', 'ios', 'storeUrl', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>

              <div className="d-flex justify-content-end mt-3">
                <Button 
                  variant="dark" 
                  onClick={handleSaveVersions}
                  disabled={savingVersions}
                >
                  {savingVersions ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-2" />
                      Αποθήκευση...
                    </>
                  ) : (
                    <>
                      <FaSave className="me-2" />
                      Αποθήκευση Εκδόσεων
                    </>
                  )}
                </Button>
              </div>

              <Alert variant="info" className="mt-3 mb-0 small">
                <strong>📌 Οδηγίες:</strong>
                <ul className="mb-0 mt-1">
                  <li><strong>Τρέχουσα Έκδοση:</strong> Η τελευταία διαθέσιμη έκδοση (προαιρετική ενημέρωση)</li>
                  <li><strong>Ελάχιστη Έκδοση:</strong> Αν ο χρήστης έχει παλαιότερη, εμφανίζεται force update</li>
                  <li>Χρησιμοποιήστε semantic versioning: MAJOR.MINOR.PATCH (π.χ. 1.2.3)</li>
                  <li>Οι εφαρμογές ελέγχουν την έκδοση κατά την εκκίνηση</li>
                </ul>
              </Alert>
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
                <li><strong>Ώρες Λειτουργίας:</strong> Όταν είναι ενεργές, οι πελάτες μπορούν να παραγγείλουν μόνο εντός του καθορισμένου ωραρίου.</li>
                <li>Για τα μηνιαία έξοδα, χρησιμοποιήστε την καρτέλα Στατιστικά.</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>

        {/* Database Full Backup Card */}
        <Col lg={6}>
          <Card className="shadow-sm border-success mb-4">
            <Card.Header className="bg-success text-white">
              <FaServer className="me-2" />
              Backup Βάσης Δεδομένων
            </Card.Header>
            <Card.Body>
              <p className="text-muted small mb-3">
                Πλήρες αντίγραφο της MongoDB με όλα τα δεδομένα.
              </p>

              {/* Tools Status */}
              <div className="mb-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <strong className="small">Κατάσταση Εργαλείων MongoDB:</strong>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={checkDbToolsStatus}
                    disabled={checkingTools}
                  >
                    <FaSync className={checkingTools ? 'fa-spin' : ''} />
                  </Button>
                </div>
                
                {checkingTools ? (
                  <div className="d-flex align-items-center text-muted small">
                    <Spinner size="sm" animation="border" className="me-2" />
                    Έλεγχος...
                  </div>
                ) : dbToolsStatus?.notSupported ? (
                  <Badge bg="secondary" className="d-flex align-items-center gap-1 py-2 px-3">
                    <FaExclamationTriangle /> Διαθέσιμο μόνο σε Windows
                  </Badge>
                ) : dbToolsStatus?.installed ? (
                  <Badge bg="success" className="d-flex align-items-center gap-1 py-2 px-3">
                    <FaCheckCircle /> Εγκατεστημένα
                  </Badge>
                ) : (
                  <div>
                    <Badge bg="warning" className="d-flex align-items-center gap-1 py-2 px-3 mb-2">
                      <FaExclamationTriangle /> Δεν είναι εγκατεστημένα
                    </Badge>
                    <Button 
                      variant="warning" 
                      size="sm"
                      onClick={handleInstallDbTools}
                      disabled={installingTools}
                      className="w-100"
                    >
                      {installingTools ? (
                        <>
                          <Spinner size="sm" animation="border" className="me-2" />
                          Εγκατάσταση...
                        </>
                      ) : (
                        <>
                          <FaDownload className="me-2" />
                          Εγκατάσταση MongoDB Tools
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {dbBackupProgress && (
                <Alert variant="info" className="small py-2">
                  <Spinner size="sm" animation="border" className="me-2" />
                  {dbBackupProgress}
                </Alert>
              )}

              <div className="d-grid gap-2">
                <Button 
                  variant="success" 
                  onClick={handleCreateDbBackup}
                  disabled={creatingDbBackup || !dbToolsStatus?.installed}
                >
                  {creatingDbBackup ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-2" />
                      Δημιουργία Backup...
                    </>
                  ) : (
                    <>
                      <FaDownload className="me-2" />
                      Δημιουργία & Λήψη Backup
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline-success" 
                  onClick={() => setShowDbRestoreModal(true)}
                  disabled={!dbToolsStatus?.installed}
                >
                  <FaHistory className="me-2" />
                  Επαναφορά από Backup
                </Button>
              </div>
              
              <Alert variant="success" className="mt-3 mb-0 small">
                <strong>📂 Πλεονεκτήματα πλήρους backup:</strong>
                <ul className="mb-0 mt-1">
                  <li>Πλήρης επαναφορά βάσης δεδομένων</li>
                  <li>Συμπεριλαμβάνει indexes & metadata</li>
                  <li>Γρήγορη αποκατάσταση σε περίπτωση ανάγκης</li>
                </ul>
              </Alert>
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

      {/* Edit Icon Modal */}
      <Modal show={showEditIconModal} onHide={() => setShowEditIconModal(false)} centered>
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title>
            <FaEdit className="me-2" />
            Αλλαγή Εικονιδίου
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-center mb-3">
            Επιλέξτε εικονίδιο για τον τύπο: <strong>{editingType}</strong>
          </p>
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '8px',
              padding: '10px'
            }}
          >
            {AVAILABLE_ICONS.map((icon, idx) => (
              <Button
                key={idx}
                variant={editingIcon === icon ? 'primary' : 'outline-secondary'}
                onClick={() => setEditingIcon(icon)}
                style={{ 
                  fontSize: '1.5rem', 
                  padding: '8px',
                  aspectRatio: '1'
                }}
              >
                {icon}
              </Button>
            ))}
          </div>
          <div className="text-center mt-3">
            <span style={{ fontSize: '2rem' }}>{editingIcon}</span>
            <p className="text-muted small mt-1">Επιλεγμένο εικονίδιο</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditIconModal(false)}>
            Ακύρωση
          </Button>
          <Button 
            variant="info" 
            onClick={handleUpdateIcon}
            disabled={savingIcon}
          >
            {savingIcon ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Αποθήκευση...
              </>
            ) : (
              <>
                <FaSave className="me-2" />
                Αποθήκευση
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Database Restore Modal */}
      <Modal show={showDbRestoreModal} onHide={() => {
        setShowDbRestoreModal(false);
        setDbBackupFile(null);
      }} centered>
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <FaHistory className="me-2" />
            Επαναφορά Βάσης Δεδομένων
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <strong>⚠️ ΠΡΟΣΟΧΗ!</strong>
            <p className="mb-0 mt-2">
              Η επαναφορά θα <strong>αντικαταστήσει ΟΛΟΚΛΗΡΗ</strong> την τρέχουσα βάση δεδομένων!
              Όλα τα υπάρχοντα δεδομένα θα διαγραφούν και θα αντικατασταθούν με αυτά του backup.
            </p>
          </Alert>

          <Form.Group className="mb-4">
            <Form.Label>Επιλέξτε αρχείο backup (.zip)</Form.Label>
            <Form.Control
              type="file"
              accept=".zip"
              onChange={handleDbBackupFileSelect}
            />
            {dbBackupFile && (
              <Form.Text className="text-success">
                ✓ Επιλεγμένο αρχείο: {dbBackupFile.name} ({(dbBackupFile.size / 1024 / 1024).toFixed(2)} MB)
              </Form.Text>
            )}
          </Form.Group>

          {dbBackupProgress && (
            <Alert variant="info" className="small">
              <Spinner size="sm" animation="border" className="me-2" />
              {dbBackupProgress}
            </Alert>
          )}

          <Alert variant="warning" className="small mb-0">
            <strong>Συστάσεις πριν την επαναφορά:</strong>
            <ul className="mb-0 mt-1">
              <li>Δημιουργήστε backup της τρέχουσας βάσης</li>
              <li>Ενημερώστε τους χρήστες για τη διακοπή λειτουργίας</li>
              <li>Μην κλείσετε το παράθυρο κατά τη διάρκεια της επαναφοράς</li>
            </ul>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowDbRestoreModal(false);
            setDbBackupFile(null);
          }}>
            Ακύρωση
          </Button>
          <Button 
            variant="danger" 
            onClick={handleRestoreDatabase}
            disabled={restoringDb || !dbBackupFile}
          >
            {restoringDb ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Επαναφορά...
              </>
            ) : (
              <>
                <FaHistory className="me-2" />
                Επαναφορά Βάσης Δεδομένων
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SettingsTab;
