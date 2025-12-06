import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet, Platform, Vibration, LogBox } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Hide Expo Go specific warnings
LogBox.ignoreLogs([
  'expo-notifications',
  'Android Push notifications',
  'Push notifications',
  'development build',
]);

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AlertProvider } from './src/context/AlertContext';
import LoginScreen from './src/screens/LoginScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import socketService from './src/services/socket';
import { storeService } from './src/services/api';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// New order badge context
const NewOrderContext = React.createContext({
  newOrderCount: 0,
  setNewOrderCount: () => {},
  resetNewOrderCount: () => {},
});

export const useNewOrders = () => React.useContext(NewOrderContext);

// Main Tab Navigator
function MainTabs() {
  const { newOrderCount } = useNewOrders();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Παραγγελίες') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Ιστορικό') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Προφίλ') {
            iconName = focused ? 'storefront' : 'storefront-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#00c1e8',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 85 : 90,
          paddingBottom: Platform.OS === 'ios' ? 25 : 35,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#00c1e8',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Παραγγελίες" 
        component={OrdersScreen}
        options={{
          tabBarBadge: newOrderCount > 0 ? newOrderCount : null,
          tabBarBadgeStyle: { backgroundColor: '#dc3545' },
        }}
      />
      <Tab.Screen name="Ιστορικό" component={HistoryScreen} />
      <Tab.Screen name="Προφίλ" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Auth Navigator
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

// Navigation component with auth check
function Navigation() {
  const { user, loading, token } = useAuth();
  const [newOrderCount, setNewOrderCount] = useState(0);
  const responseListener = useRef();

  // Reset new order count
  const resetNewOrderCount = () => setNewOrderCount(0);

  // Register for push notifications (Expo Notifications - works in Expo Go)
  const registerForPushNotifications = async () => {
    try {
      if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
        return;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        return;
      }

      // Get Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const pushToken = await Notifications.getExpoPushTokenAsync({
        projectId: projectId || '43835cb5-520f-4c0e-b5d4-93428e536914',
      });
      
      console.log('📱 Store Expo Push Token:', pushToken.data);

      // For now, we'll use socket for real-time updates
      // FCM will be used in production build with @react-native-firebase
      
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  // Setup socket connection and notification listeners
  useEffect(() => {
    if (!user || !token) return;

    // Connect socket
    socketService.connect(token);
    socketService.joinRoom({ role: 'store', userId: user._id });

    // Register for push notifications
    registerForPushNotifications();

    // Listen for new orders via socket
    const handleNewOrder = async (data) => {
      console.log('🆕 New order via socket:', data);
      Vibration.vibrate([0, 500, 200, 500]);
      setNewOrderCount(prev => prev + 1);

      // Show local notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🛵 Νέα Παραγγελία!',
          body: `Νέα παραγγελία από πελάτη`,
          sound: true,
        },
        trigger: null, // immediate
      });
    };

    // Listen for order status changes
    const handleOrderStatusChanged = (data) => {
      console.log('📋 Order status changed:', data);
    };

    socketService.on('order:new', handleNewOrder);
    socketService.on('order:status_changed', handleOrderStatusChanged);

    // Notification response listener (when user taps notification)
    if (Notifications.addNotificationResponseReceivedListener) {
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('📲 Notification tapped:', response);
        // Could navigate to specific order here
      });
    }

    return () => {
      socketService.off('order:new', handleNewOrder);
      socketService.off('order:status_changed', handleOrderStatusChanged);
      socketService.disconnect();
      // Safe cleanup - check if function exists
      if (responseListener.current && Notifications.removeNotificationSubscription) {
        try {
          Notifications.removeNotificationSubscription(responseListener.current);
        } catch (e) {
          // Ignore cleanup errors in Expo Go
        }
      }
    };
  }, [user, token]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00c1e8" />
        <Text style={styles.loadingText}>Φόρτωση...</Text>
      </View>
    );
  }

  return (
    <NewOrderContext.Provider value={{ newOrderCount, setNewOrderCount, resetNewOrderCount }}>
      <NavigationContainer>
        {user && token ? <MainTabs /> : <AuthStack />}
      </NavigationContainer>
    </NewOrderContext.Provider>
  );
}

// Main App Component
export default function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <StatusBar style="light" />
        <Navigation />
      </AlertProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
