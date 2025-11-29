import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AlertProvider } from './src/context/AlertContext';
import { ActivityIndicator, View, LogBox, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ServerLoadingScreen from './src/components/ServerLoadingScreen';

// Hide Expo Go specific warnings
LogBox.ignoreLogs([
  'Expo push',
  'expo-notifications',
  'Push notifications',
  'Cannot retrieve',
  'development client',
  'expo-av',
]);

// Import notifications conditionally
let Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.log('expo-notifications not available');
}

import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import OrderScreen from './src/screens/OrderScreen';
import TrackOrderScreen from './src/screens/TrackOrderScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';
import CustomerOrders from './src/screens/CustomerOrders';
import CustomerProfile from './src/screens/CustomerProfile';

// Statuses that should show notifications to customer
// pending_customer_confirm = needs action (confirm price)
// in_delivery = driver picked up order
const ALLOWED_NOTIFICATION_STATUSES = ['pending_customer_confirm', 'in_delivery'];

// Configure notification handler - FILTER notifications here
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
          shouldShowAlert: shouldShow,
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
const Tab = createBottomTabNavigator();

// Navigation ref for notification tap handling
const navigationRef = React.createRef();

const HomeStack = createNativeStackNavigator();
const HomeStackScreen = () => (
  <HomeStack.Navigator>
    <HomeStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="Order" component={OrderScreen} options={{ title: 'Παραγγελία' }} />
    <HomeStack.Screen name="TrackOrder" component={TrackOrderScreen} options={{ title: 'Παρακολούθηση' }} />
  </HomeStack.Navigator>
);

const SearchStack = createNativeStackNavigator();
const SearchStackScreen = () => (
  <SearchStack.Navigator>
    <SearchStack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
    <SearchStack.Screen name="Order" component={OrderScreen} options={{ title: 'Παραγγελία' }} />
    <SearchStack.Screen name="TrackOrder" component={TrackOrderScreen} options={{ title: 'Παρακολούθηση' }} />
  </SearchStack.Navigator>
);

const OrdersStack = createNativeStackNavigator();
const OrdersStackScreen = () => (
  <OrdersStack.Navigator>
    <OrdersStack.Screen name="Orders" component={CustomerOrders} options={{ title: 'Παραγγελίες' }} />
    <OrdersStack.Screen name="TrackOrder" component={TrackOrderScreen} options={{ title: 'Παρακολούθηση' }} />
  </OrdersStack.Navigator>
);

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'SearchTab') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'OrdersTab') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#00c2e8',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeStackScreen} 
        options={{ title: 'Αρχική' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Always navigate to the Home screen (root of the stack)
            navigation.navigate('HomeTab', { screen: 'Home' });
          },
        })}
      />
      <Tab.Screen 
        name="SearchTab" 
        component={SearchStackScreen} 
        options={{ title: 'Αναζήτηση' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.navigate('SearchTab', { screen: 'Search' });
          },
        })}
      />
      <Tab.Screen 
        name="OrdersTab" 
        component={OrdersStackScreen} 
        options={{ title: 'Παραγγελίες' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.navigate('OrdersTab', { screen: 'Orders' });
          },
        })}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={CustomerProfile} 
        options={{ title: 'Προφίλ', headerShown: true }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { user, loading, serverReady, serverStatus } = useAuth();

  // Show server loading screen while connecting to backend
  if (!serverReady) {
    return <ServerLoadingScreen status={serverStatus} />;
  }

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00c2e8' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <Stack.Navigator 
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
            name="Register" 
            component={RegisterScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="ForgotPassword" 
            component={ForgotPasswordScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="VerifyEmail" 
            component={VerifyEmailScreen} 
            options={{ headerShown: false }}
          />
        </>
      ) : (
        // App Stack
        <>
          <Stack.Screen 
            name="Main" 
            component={MainTabNavigator} 
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Only set up notification listeners if Notifications is available
    if (!Notifications || !Notifications.addNotificationReceivedListener) {
      return;
    }

    try {
      // Listen for notifications when app is in foreground
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        // Notification received - handled by setNotificationHandler
      });

      // Handle notification tap (response) - navigate to TrackOrder
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        
        // Navigate to TrackOrder with orderNumber
        if (navigationRef.current) {
          if (data?.orderNumber) {
            // If we have orderNumber, navigate directly to TrackOrder
            navigationRef.current.navigate('OrdersTab', {
              screen: 'TrackOrder',
              params: { orderNumber: data.orderNumber }
            });
          } else {
            // Fallback - just go to Orders tab
            navigationRef.current.navigate('OrdersTab');
          }
        }
      });
    } catch (e) {
      console.log('Failed to setup notification listeners:', e);
    }

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AlertProvider>
          <NavigationContainer ref={navigationRef}>
            <AppNavigator />
          </NavigationContainer>
        </AlertProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
