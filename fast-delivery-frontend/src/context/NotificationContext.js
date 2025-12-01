import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import socketService from '../services/socket';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  
  const activeKeysRef = useRef(new Set());
  
  // Helper to remove notification by ID
  const removeNotification = useCallback((id) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification && notification.uniqueKey) {
        activeKeysRef.current.delete(notification.uniqueKey);
      }
      return prev.filter(n => n.id !== id);
    });
  }, []);

  // Helper to remove notifications by related ID (e.g. orderNumber)
  const removeNotificationsByRelatedId = useCallback((relatedId) => {
    if (!relatedId) return;
    setNotifications(prev => {
      const toRemove = prev.filter(n => n.relatedId === relatedId);
      toRemove.forEach(n => {
        if (n.uniqueKey) activeKeysRef.current.delete(n.uniqueKey);
      });
      return prev.filter(n => n.relatedId !== relatedId);
    });
  }, []);

  const addNotification = useCallback((message, variant = 'info', icon = '🔔', relatedId = null, sticky = false) => {
    const uniqueKey = relatedId ? `${relatedId}-${message}` : null;

    // Check for duplicates using Ref (synchronous and fresh)
    if (uniqueKey && activeKeysRef.current.has(uniqueKey)) {
      return; // Already exists
    }

    if (uniqueKey) {
      activeKeysRef.current.add(uniqueKey);
    }

    const id = Date.now() + Math.random();
    
    const newNotification = {
      id,
      message,
      variant,
      icon,
      relatedId,
      uniqueKey,
      sticky,
      timestamp: new Date()
    };

    setNotifications(prev => [...prev, newNotification]);

    // Play sound and vibrate ONLY if sticky (action required)
    if (sticky) {
      console.log('🔊 Attempting to play sound for sticky notification:', message);
      try {
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
        const audio = new Audio('/assets/notification.wav');
        
        // Force user interaction workaround:
        // Browsers block audio if not triggered by user interaction.
        // We can't bypass this easily without user clicking first.
        // However, we can try to play and catch the error gracefully.
        
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('✅ Audio played successfully');
            })
            .catch(error => {
              console.error('❌ Audio play failed:', error);
              // Fallback: Try to play on next user interaction (click anywhere)
              const playOnInteraction = () => {
                audio.play().catch(e => console.error('Retry failed:', e));
                document.removeEventListener('click', playOnInteraction);
                document.removeEventListener('keydown', playOnInteraction);
                document.removeEventListener('touchstart', playOnInteraction);
              };
              document.addEventListener('click', playOnInteraction);
              document.addEventListener('keydown', playOnInteraction);
              document.addEventListener('touchstart', playOnInteraction);
            });
        }
      } catch (e) {
        console.error('❌ Notification feedback failed:', e);
      }
    } else {
      console.log('🔇 Notification is not sticky, skipping sound:', message);
    }

    // Auto-remove after 5 seconds ONLY if not sticky
    if (!sticky) {
      setTimeout(() => {
        removeNotification(id);
      }, 5000);
    }
  }, [removeNotification]);

  // Socket Listeners
  useEffect(() => {
    if (!user) return;

    // Admin notifications
    if (user.role === 'admin') {
      const handleNewOrder = (data) => {
        // Not sticky for admin (no action required yet), so no sound
        addNotification(`Νέα Παραγγελία! Ελέγξτε τις λεπτομέρειες.`, 'primary', '📦', data.orderNumber, false);
      };

      const handleStoreRegistered = (data) => {
        addNotification(`Νέο κατάστημα: ${data.businessName}`, 'info', '🏪', `store-${data.storeId}`);
      };

      const handleDriverRegistered = (data) => {
        addNotification(`Νέος οδηγός: ${data.name}`, 'info', '🚗', `driver-${data.driverId}`);
      };

      const handleOrderPendingAdmin = (data) => {
        addNotification(`Απαιτείται ενέργεια: Ορισμός μεταφορικών.`, 'warning', '💰', data.orderNumber, true);
      };

      const handleDriverRejected = (data) => {
        addNotification(`Ο οδηγός απέρριψε την ανάθεση. Δοκιμάστε άλλον.`, 'danger', '❌', data.orderNumber, true);
      };

      const handleOrderCompleted = (data) => {
        addNotification(`Η παραγγελία ολοκληρώθηκε επιτυχώς!`, 'success', '🎉', data.orderNumber, false);
      };

      // Handle status changes - check for confirmed status
      const handleStatusChanged = (data) => {
        if (data.newStatus === 'confirmed') {
          addNotification(`Η παραγγελία επιβεβαιώθηκε. Αναζήτηση οδηγού.`, 'success', '✅', data.orderNumber, true);
        }
      };

      socketService.on('order:new', handleNewOrder);
      socketService.on('store:registered', handleStoreRegistered);
      socketService.on('driver:registered', handleDriverRegistered);
      socketService.on('order:pending_admin', handleOrderPendingAdmin);
      socketService.on('order:status_changed', handleStatusChanged);
      socketService.on('driver:rejected', handleDriverRejected);
      socketService.on('order:completed', handleOrderCompleted);

      return () => {
        socketService.off('order:new', handleNewOrder);
        socketService.off('store:registered', handleStoreRegistered);
        socketService.off('driver:registered', handleDriverRegistered);
        socketService.off('order:pending_admin', handleOrderPendingAdmin);
        socketService.off('order:status_changed', handleStatusChanged);
        socketService.off('driver:rejected', handleDriverRejected);
        socketService.off('order:completed', handleOrderCompleted);
      };
    }

    // Store notifications
    if (user.role === 'store') {
      const handleNewOrder = (data) => {
        const match = data.storeId && user._id && data.storeId.toString() === user._id.toString();
        if (match) {
          addNotification(`Νέα Παραγγελία! Αποδεχτείτε ή απορρίψτε.`, 'primary', '📦', data.orderNumber, true);
        }
      };

      const handleOrderConfirmed = (data) => {
        if (data.storeId && user._id && data.storeId.toString() === user._id.toString()) {
          addNotification(`Ο πελάτης επιβεβαίωσε. Ξεκινήστε την προετοιμασία!`, 'success', '✅', data.orderNumber, true);
        }
      };

      const handleOrderAssigned = (data) => {
        if (data.storeId && user._id && data.storeId.toString() === user._id.toString()) {
          addNotification(`Βρέθηκε οδηγός. Αναμονή για άφιξη.`, 'info', '📋', data.orderNumber);
        }
      };

      const handleDriverAccepted = (data) => {
        if (data.storeId && user._id && data.storeId.toString() === user._id.toString()) {
          addNotification(`Ο οδηγός έρχεται! Ετοιμάστε το πακέτο.`, 'success', '✅', data.orderNumber, true);
        }
      };

      const handleOrderCompleted = (data) => {
        if (data.storeId && user._id && data.storeId.toString() === user._id.toString()) {
          addNotification(`Παραδόθηκε επιτυχώς!`, 'success', '🎉', data.orderNumber);
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
        addNotification(`Νέα Ανάθεση! Αποδεχτείτε ή απορρίψτε.`, 'warning', '🚗', data.orderNumber, true);
      };

      const handleOrderStatusChanged = (data) => {
        if (data.status === 'preparing' || data.newStatus === 'preparing') {
          // Remove previous notifications for this order (e.g. New Assignment)
          removeNotificationsByRelatedId(data.orderNumber);
          addNotification(`Το κατάστημα ετοιμάζει την παραγγελία.`, 'info', '👨‍🍳', data.orderNumber, true);
        }
      };

      const handleOrderCancelled = (data) => {
        // Remove all notifications for this order
        removeNotificationsByRelatedId(data.orderNumber);
        addNotification(`Η παραγγελία ακυρώθηκε. Επιστροφή στη βάση.`, 'danger', '❌', data.orderNumber);
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

    // Customer notifications (Global)
    if (user.role === 'customer') {
      // Note: Room joining is handled in socket.js connect() function
      // No need to call joinRoom here as it's already done during connection

      const handleOrderPriceReady = (data) => {
        addNotification(`Επιβεβαίωση: Απαιτείται η έγκρισή σας`, 'warning', '🔔', data.orderNumber, true);
      };

      const handleOrderCancelled = (data) => {
        addNotification(`Η παραγγελία #${data.orderNumber} ακυρώθηκε.`, 'danger', '❌', data.orderNumber, true);
      };

      const handleOrderCompleted = (data) => {
        addNotification(`Η παραγγελία παραδόθηκε! Καλή απόλαυση!`, 'success', '🎉', data.orderNumber, false);
      };

      // Listen for confirmation to remove the sticky notification
      const handleOrderConfirmed = (data) => {
        removeNotificationsByRelatedId(data.orderNumber);
      };

      socketService.on('order:price_ready', handleOrderPriceReady);
      socketService.on('order:cancelled', handleOrderCancelled);
      socketService.on('order:completed', handleOrderCompleted);
      socketService.on('order:confirmed', handleOrderConfirmed); // Add listener to remove alert

      return () => {
        socketService.off('order:price_ready', handleOrderPriceReady);
        socketService.off('order:cancelled', handleOrderCancelled);
        socketService.off('order:completed', handleOrderCompleted);
        socketService.off('order:confirmed', handleOrderConfirmed);
      };
    }
  }, [user, addNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, removeNotificationsByRelatedId }}>
      {children}
    </NotificationContext.Provider>
  );
};
