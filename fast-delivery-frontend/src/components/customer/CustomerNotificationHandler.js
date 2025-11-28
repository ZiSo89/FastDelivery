import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import socketService from '../../services/socket';

/**
 * Component that handles auto-navigation for customer notifications
 * When a customer receives a price_ready notification and is not on the order status page,
 * it automatically navigates them there for action
 */
const CustomerNotificationHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Only handle for logged-in customers
    if (!user || user.role !== 'customer') return;

    const handleOrderPriceReady = (data) => {
      console.log('📍 CustomerNotificationHandler: Received order:price_ready', data);
      
      const orderNumber = data.orderNumber;
      if (!orderNumber) return;

      const targetPath = `/order-status/${orderNumber}`;
      const currentPath = location.pathname;

      // Check if user is already on the order status page for this order
      if (currentPath === targetPath) {
        console.log('✅ Already on order status page, no navigation needed');
        return;
      }

      // Check if user is on any order status page (different order)
      if (currentPath.startsWith('/order-status/')) {
        console.log('📍 On different order page, navigating to:', targetPath);
      } else {
        console.log('📍 Not on order status page, navigating to:', targetPath);
      }

      // Navigate to the order status page
      navigate(targetPath);
    };

    // Subscribe to the event
    socketService.on('order:price_ready', handleOrderPriceReady);

    return () => {
      socketService.off('order:price_ready', handleOrderPriceReady);
    };
  }, [user, navigate, location.pathname]);

  // This component doesn't render anything
  return null;
};

export default CustomerNotificationHandler;
