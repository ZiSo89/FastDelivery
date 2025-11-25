import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import OrderScreen from './src/screens/OrderScreen';
import TrackOrderScreen from './src/screens/TrackOrderScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import CustomerOrders from './src/screens/CustomerOrders';
import CustomerProfile from './src/screens/CustomerProfile';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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
      />
      <Tab.Screen 
        name="SearchTab" 
        component={SearchStackScreen} 
        options={{ title: 'Αναζήτηση' }}
      />
      <Tab.Screen 
        name="OrdersTab" 
        component={OrdersStackScreen} 
        options={{ title: 'Παραγγελίες' }}
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
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00c2e8" />
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
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
