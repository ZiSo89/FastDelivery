import * as Location from 'expo-location';
import socketService from './socket';

class LocationService {
  watchSubscription = null;
  currentOrderId = null;
  driverId = null;
  isTracking = false;
  updateInterval = null;
  lastLocation = null;

  // Start tracking driver location for a specific order
  async startTracking(orderId, driverId) {
    if (this.isTracking && this.currentOrderId === orderId) {
      return;
    }

    // Stop any existing tracking
    await this.stopTracking();

    this.currentOrderId = orderId;
    this.driverId = driverId;
    this.isTracking = true;

    try {
      // Request permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.log('❌ Location permission denied');
        return false;
      }

      // Try to get background permission (optional, for better tracking)
      await Location.requestBackgroundPermissionsAsync();

      // Get initial location
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      this.lastLocation = {
        lat: initialLocation.coords.latitude,
        lng: initialLocation.coords.longitude,
      };

      // Send initial location
      this.sendLocationUpdate();

      // Start watching location with high accuracy
      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // Update every 10 meters
          timeInterval: 5000, // Or every 5 seconds
        },
        (location) => {
          this.lastLocation = {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          };
        }
      );

      // Send location updates every 10 seconds via socket
      this.updateInterval = setInterval(() => {
        this.sendLocationUpdate();
      }, 10000); // 10 seconds

      return true;
    } catch (error) {
      console.error('❌ Error starting location tracking:', error);
      this.isTracking = false;
      return false;
    }
  }

  // Send current location to server
  sendLocationUpdate() {
    if (!this.lastLocation || !this.currentOrderId || !this.driverId) {
      return;
    }

    const locationData = {
      orderId: this.currentOrderId,
      driverId: this.driverId,
      location: this.lastLocation,
      timestamp: Date.now(),
    };

    if (socketService.socket && socketService.socket.connected) {
      socketService.socket.emit('driver:location_update', locationData);
    }
  }

  // Stop tracking
  async stopTracking() {
    
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.currentOrderId = null;
    this.isTracking = false;
    this.lastLocation = null;
  }

  // Get current tracking status
  getStatus() {
    return {
      isTracking: this.isTracking,
      orderId: this.currentOrderId,
      lastLocation: this.lastLocation,
    };
  }

  // Get current location (one-time)
  async getCurrentLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }
}

export default new LocationService();
