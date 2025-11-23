import React from 'react';
import { Modal, Button } from 'react-bootstrap';

/**
 * Reusable Confirmation Modal Component
 * 
 * Usage:
 * <ConfirmModal 
 *   show={showModal}
 *   onHide={() => setShowModal(false)}
 *   onConfirm={handleConfirm}
 *   title="Επιβεβαίωση"
 *   message="Είστε σίγουροι;"
 *   confirmText="Ναι"
 *   cancelText="Όχι"
 *   variant="danger" // or "success", "warning", "primary"
 * />
 */
const ConfirmModal = ({ 
  show, 
  onHide, 
  onConfirm, 
  title = 'Επιβεβαίωση', 
  message = 'Είστε σίγουροι;',
  confirmText = 'Επιβεβαίωση',
  cancelText = 'Άκυρο',
  variant = 'primary',
  icon = null
}) => {
  const handleConfirm = () => {
    onConfirm();
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {icon && <span className="me-2">{icon}</span>}
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>{message}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={handleConfirm}>
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmModal;
