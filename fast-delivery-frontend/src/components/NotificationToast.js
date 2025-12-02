import React, { useEffect } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { useNotification } from '../context/NotificationContext';

const NotificationToast = () => {
  const { notifications, removeNotification } = useNotification();

  // Close sticky notifications when user clicks anywhere else on the page
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Check if click is outside of toast container
      const toastContainer = e.target.closest('.toast-container');
      if (!toastContainer) {
        // Remove all sticky notifications when clicking outside
        notifications.forEach(notification => {
          if (notification.sticky) {
            removeNotification(notification.id);
          }
        });
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [notifications, removeNotification]);

  return (
    <ToastContainer 
      position="top-end" 
      className="p-3 toast-container" 
      style={{ zIndex: 9999 }}
    >
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          bg={notification.variant}
          show={true}
          onClose={() => removeNotification(notification.id)}
          delay={5000}
          autohide={!notification.sticky}
        >
          <Toast.Header>
            <span className="me-2">{notification.icon}</span>
            <strong className="me-auto">Fast Delivery</strong>
            <small>{notification.timestamp.toLocaleTimeString('el-GR')}</small>
          </Toast.Header>
          <Toast.Body className={notification.variant === 'warning' || notification.variant === 'info' ? 'text-dark' : 'text-white'}>
            {notification.message}
          </Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
};

export default NotificationToast;
