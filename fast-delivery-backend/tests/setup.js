/**
 * Jest Test Setup
 * ================
 * Configures the test environment for API testing
 */

require('dotenv').config();

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for async operations
jest.setTimeout(30000);

// Global test configuration
global.testConfig = {
  baseUrl: process.env.TEST_API_URL || 'http://localhost:5000',
  adminCredentials: {
    email: 'admin@fastdelivery.gr',
    password: 'admin123'
  },
  storeCredentials: {
    email: 'store1@test.com',
    password: 'store123'
  },
  driverCredentials: {
    email: 'driver1@test.com',
    password: 'driver123'
  },
  customerCredentials: {
    email: 'customer1@test.com',
    password: 'customer123'
  }
};

// Suppress console logs during tests (optional)
// console.log = jest.fn();
// console.error = jest.fn();
