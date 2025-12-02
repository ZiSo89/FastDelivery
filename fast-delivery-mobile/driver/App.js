import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AlertProvider } from './src/context/AlertContext';
import { ActivityIndicator, View, Platform, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Safe import for expo-notifications (may not work in all environments)
let Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.log('expo-notifications not available');
}

import LoginScreen from './src/screens/LoginScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import PendingApprovalScreen from './src/screens/PendingApprovalScreen';
import DeliveryMapScreen from './src/screens/DeliveryMapScreen';

// Ignore expo-notifications warnings in Expo Go
LogBox.ignoreLogs([
  'expo-notifications',
  '`expo-notifications` functionality is not fully supported',
]);

// IMPORTANT: Only show push notifications for important driver statuses
// These match the statuses sent by the server in socketHelpers.js
// Server only sends: assigned (new order), preparing (ready for pickup)
const ALLOWED_NOTIFICATION_STATUSES = ['assigned', 'preparing'];

// Configure notification handler for foreground (only if available)
if (Notifications && Notifications.setNotificationHandler) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        // Get the status from notification data
        const data = notification.request.content.data;
        const status = data?.status;
        
        // Only show notification for allowed statuses
        const shouldShow = ALLOWED_NOTIFICATION_STATUSES.includes(status);
        
        return {
          shouldShowBanner: shouldShow,
          shouldShowList: shouldShow,
          shouldPlaySound: shouldShow,
          shouldSetBadge: false,
        };
      },
    });
  } catch (e) {
    console.log('Failed to set notification handler:', e);
  }
}

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Listen for incoming notifications (only if Notifications available)
    if (Notifications && Notifications.addNotificationReceivedListener) {
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        // Notification received
      });

      // Listen for notification responses (when user taps)
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        // Notification tapped
      });
    }

    return () => {
      // Use .remove() method instead of removeNotificationSubscription
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#00c2e8" />
      </View>
    );
  }

  // Determine which screen to show based on user status
  const getInitialScreen = () => {
    if (!user) return 'Login';
    if (user.status === 'pending' || !user.isApproved) return 'PendingApproval';
    return 'Dashboard';
  };

  return (
    <Stack.Navigator 
      initialRouteName={getInitialScreen()}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#00c2e8',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {!user ? (
        // Auth Stack
        <>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="ForgotPassword" 
            component={ForgotPasswordScreen} 
            options={{ headerShown: false }}
          />
        </>
      ) : user.status === 'pending' || !user.isApproved ? (
        // Pending Approval
        <Stack.Screen 
          name="PendingApproval" 
          component={PendingApprovalScreen} 
          options={{ headerShown: false }}
        />
      ) : (
        // Main App
        <>
          <Stack.Screen 
            name="Dashboard" 
            component={DashboardScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="DeliveryMap" 
            component={DeliveryMapScreen} 
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AlertProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </AlertProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
