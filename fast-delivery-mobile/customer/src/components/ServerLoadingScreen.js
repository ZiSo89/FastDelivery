import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';

const ServerLoadingScreen = ({ status }) => {
  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image 
        source={require('../../assets/logo.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
      
      {/* App Name */}
      <Text style={styles.appName}>FastDelivery</Text>
      
      {/* Spinner */}
      <ActivityIndicator size="large" color="#fff" style={styles.spinner} />
      
      {/* Status Message */}
      <Text style={styles.statusText}>{status}</Text>
      
      {/* Subtitle */}
      <Text style={styles.subtitle}>Παρακαλώ περιμένετε...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00c2e8',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
  },
  spinner: {
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});

export default ServerLoadingScreen;
