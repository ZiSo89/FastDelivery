import React from 'react';
import { Modal, Button } from 'react-bootstrap';

/**
 * Reusable Alert Modal Component
 * 
 * Usage:
 * <AlertModal 
 *   show={showModal}
 *   onHide={() => setShowModal(false)}
 *   title="Επιτυχία"
 *   message="Η ενέργεια ολοκληρώθηκε!"
 *   variant="success" // or "danger", "warning", "info"
 *   buttonText="Εντάξει"
 * />
 */
const AlertModal = ({ 
  show, 
  onHide, 
  title = 'Ειδοποίηση', 
  message = '',
  variant = 'info',
  buttonText = 'Εντάξει',
  icon = null
}) => {
  const getIconForVariant = () => {
    if (icon) return icon;
    
    switch (variant) {
      case 'success':
        return '✅';
      case 'danger':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return null;
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {getIconForVariant() && <span className="me-2">{getIconForVariant()}</span>}
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>{message}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant={variant} onClick={onHide}>
          {buttonText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AlertModal;
