import React, { useState, useEffect } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import socketService from '../services/socket';
import { useAuth } from '../context/AuthContext';

const NotificationToast = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const shownNotificationsRef = React.useRef(new Set());

  useEffect(() => {
    if (!user) return;

    // Notification handlers based on role
    const addNotification = (message, variant = 'info', icon = '🔔', uniqueKey = null) => {
      // Prevent duplicate notifications using uniqueKey
      if (uniqueKey && shownNotificationsRef.current.has(uniqueKey)) {
        return; // Already shown this notification
      }

      const id = Date.now() + Math.random(); // More unique ID
      
      if (uniqueKey) {
        shownNotificationsRef.current.add(uniqueKey);
        // Remove from Set after 6 seconds (1 second after it disappears)
        setTimeout(() => {
          shownNotificationsRef.current.delete(uniqueKey);
        }, 6000);
      }
      
      setNotifications(prev => [...prev, { id, message, variant, icon, timestamp: new Date() }]);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
    };

    // Admin notifications
    if (user.role === 'admin') {
      const handleNewOrder = (data) => {
        addNotification(`Νέα παραγγελία: ${data.orderNumber}`, 'primary', '📦', `admin-new-${data.orderNumber}`);
      };

      const handleStoreRegistered = (data) => {
        addNotification(`Νέο κατάστημα: ${data.businessName}`, 'info', '🏪', `admin-store-${data.storeId}`);
      };

      const handleDriverRegistered = (data) => {
        addNotification(`Νέος οδηγός: ${data.name}`, 'info', '🚗', `admin-driver-${data.driverId}`);
      };

      const handleOrderPendingAdmin = (data) => {
        addNotification(`Παραγγελία ${data.orderNumber} - Αναμονή Admin`, 'warning', '💰', `admin-pending-${data.orderNumber}`);
      };

      const handleOrderConfirmed = (data) => {
        addNotification(`Παραγγελία ${data.orderNumber} - Επιβεβαιώθηκε`, 'success', '✅', `admin-confirmed-${data.orderNumber}`);
      };

      const handleDriverRejected = (data) => {
        addNotification(`Οδηγός απέρριψε ${data.orderNumber}`, 'danger', '❌', `admin-rejected-${data.orderNumber}`);
      };

      const handleOrderCompleted = (data) => {
        addNotification(`Παραγγελία ${data.orderNumber} - Ολοκληρώθηκε!`, 'success', '🎉', `admin-completed-${data.orderNumber}`);
      };

      socketService.on('order:new', handleNewOrder);
      socketService.on('store:registered', handleStoreRegistered);
      socketService.on('driver:registered', handleDriverRegistered);
      socketService.on('order:pending_admin', handleOrderPendingAdmin);
      socketService.on('order:confirmed', handleOrderConfirmed);
      socketService.on('driver:rejected', handleDriverRejected);
      socketService.on('order:completed', handleOrderCompleted);

      return () => {
        socketService.off('order:new', handleNewOrder);
        socketService.off('store:registered', handleStoreRegistered);
        socketService.off('driver:registered', handleDriverRegistered);
        socketService.off('order:pending_admin', handleOrderPendingAdmin);
        socketService.off('order:confirmed', handleOrderConfirmed);
        socketService.off('driver:rejected', handleDriverRejected);
        socketService.off('order:completed', handleOrderCompleted);
      };
    }

    // Store notifications
    if (user.role === 'store') {
      const handleNewOrder = (data) => {
        // FILTER: Only show notification if this order is for THIS store
        const match = data.storeId && user._id && data.storeId.toString() === user._id.toString();
        // Debug logging (uncomment to debug):
        // console.log('🔔 NotificationToast filter:', { 
        //   eventStoreId: data.storeId, 
        //   myId: user._id, 
        //   match,
        //   orderNumber: data.orderNumber 
        // });
        if (match) {
          addNotification(`Νέα παραγγελία: ${data.orderNumber}`, 'primary', '📦', `store-new-${data.orderNumber}`);
        }
      };

      const handleOrderConfirmed = (data) => {
        // FILTER: Only show notification if this order is for THIS store
        if (data.storeId && user._id && data.storeId.toString() === user._id.toString()) {
          addNotification(`Παραγγελία ${data.orderNumber} - Επιβεβαιώθηκε από πελάτη`, 'success', '✅', `store-confirmed-${data.orderNumber}`);
        }
      };

      const handleOrderAssigned = (data) => {
        // FILTER: Only show notification if this order is for THIS store
        if (data.storeId && user._id && data.storeId.toString() === user._id.toString()) {
          addNotification(`Οδηγός ανατέθηκε για ${data.orderNumber}`, 'info', '📋', `store-assigned-${data.orderNumber}`);
        }
      };

      const handleDriverAccepted = (data) => {
        // FILTER: Only show notification if this order is for THIS store
        if (data.storeId && user._id && data.storeId.toString() === user._id.toString()) {
          addNotification(`Οδηγός επιβεβαίωσε ${data.orderNumber} - Ετοιμάστε την!`, 'success', '✅', `store-accepted-${data.orderNumber}`);
        }
      };

      const handleOrderCompleted = (data) => {
        // FILTER: Only show notification if this order is for THIS store
        if (data.storeId && user._id && data.storeId.toString() === user._id.toString()) {
          addNotification(`Παραγγελία ${data.orderNumber} - Παραδόθηκε!`, 'success', '🎉', `store-completed-${data.orderNumber}`);
        }
      };

      socketService.on('order:new', handleNewOrder);
      socketService.on('order:confirmed', handleOrderConfirmed);
      socketService.on('order:assigned', handleOrderAssigned);
      socketService.on('driver:accepted', handleDriverAccepted);
      socketService.on('order:completed', handleOrderCompleted);

      return () => {
        socketService.off('order:new', handleNewOrder);
        socketService.off('order:confirmed', handleOrderConfirmed);
        socketService.off('order:assigned', handleOrderAssigned);
        socketService.off('driver:accepted', handleDriverAccepted);
        socketService.off('order:completed', handleOrderCompleted);
      };
    }

    // Driver notifications
    if (user.role === 'driver') {
      const handleOrderAssigned = (data) => {
        addNotification(`Νέα παραγγελία ανατέθηκε: ${data.orderNumber}`, 'warning', '🚗', `driver-assigned-${data.orderNumber}`);
        // Play notification sound (optional)
        if (window.Audio) {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => console.log('Audio play failed:', e));
        }
      };

      const handleOrderStatusChanged = (data) => {
        // Check both data.status and data.newStatus for compatibility
        if (data.status === 'preparing' || data.newStatus === 'preparing') {
          addNotification(`Παραγγελία ${data.orderNumber} - Προετοιμάζεται`, 'info', '👨‍🍳', `driver-preparing-${data.orderNumber}`);
        }
      };

      const handleOrderCancelled = (data) => {
        addNotification(`Παραγγελία ${data.orderNumber} - Ακυρώθηκε`, 'danger', '❌', `driver-cancelled-${data.orderNumber}`);
      };

      socketService.on('order:assigned', handleOrderAssigned);
      socketService.on('order:status_changed', handleOrderStatusChanged);
      socketService.on('order:cancelled', handleOrderCancelled);

      return () => {
        socketService.off('order:assigned', handleOrderAssigned);
        socketService.off('order:status_changed', handleOrderStatusChanged);
        socketService.off('order:cancelled', handleOrderCancelled);
      };
    }
  }, [user]);

  return (
    <ToastContainer 
      position="top-end" 
      className="p-3" 
      style={{ zIndex: 9999 }}
    >
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          bg={notification.variant}
          show={true}
          onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
          delay={5000}
          autohide
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
