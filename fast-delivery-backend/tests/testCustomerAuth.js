const axios = require('axios');
require('dotenv').config({ path: '../.env' }); // Βεβαιώσου ότι το .env είναι στο root του backend

const API_BASE_URL = 'http://localhost:5000/api/v1';

const newCustomer = {
  name: 'Σάκης Δοκιμαστικός',
  email: `sakis.test.${Date.now()}@example.com`,
  password: 'password123',
  phone: '6999999999',
  address: 'Δοκιμαστική Οδός 123, Αλεξανδρούπολη'
};

let createdCustomerToken = '';

const testCustomerAuth = async () => {
  try {
    // --- 1. Test Customer Registration ---
    console.log('--- Ξεκινάει το Test Εγγραφής Πελάτη ---');
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/customer/register`, newCustomer);
    
    console.log('✅ ΕΠΙΤΥΧΙΑ: Εγγραφή Πελάτη');
    console.log('Status:', registerResponse.status);
    console.log('User:', registerResponse.data.user);
    console.log('Token:', registerResponse.data.token ? 'OK' : 'NOT FOUND');
    
    if (registerResponse.data.token) {
        createdCustomerToken = registerResponse.data.token;
    }
    console.log('----------------------------------------\n');


    // --- 2. Test Customer Login ---
    console.log('--- Ξεκινάει το Test Σύνδεσης Πελάτη ---');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: newCustomer.email,
      password: newCustomer.password,
      role: 'customer'
    });

    console.log('✅ ΕΠΙΤΥΧΙΑ: Σύνδεση Πελάτη');
    console.log('Status:', loginResponse.status);
    console.log('User:', loginResponse.data.user);
    console.log('Token:', loginResponse.data.token ? 'OK' : 'NOT FOUND');
    console.log('----------------------------------------\n');


    // --- 3. Test Login with wrong password ---
    console.log('--- Test Σύνδεσης με λάθος κωδικό ---');
    try {
        await axios.post(`${API_BASE_URL}/auth/login`, {
            email: newCustomer.email,
            password: 'wrongpassword',
            role: 'customer'
        });
    } catch (error) {
        if (error.response.status === 401) {
            console.log('✅ ΕΠΙΤΥΧΙΑ: Το API απέρριψε σωστά το λάθος password (Status 401)');
        } else {
            console.error('❌ ΑΠΟΤΥΧΙΑ: Το API δεν απάντησε με 401 σε λάθος password.');
            console.error('   Αντ\' αυτού απάντησε με:', error.response.status, error.response.data.message);
        }
    }
    console.log('----------------------------------------\n');


  } catch (error) {
    console.error('❌ ΚΑΤΙ ΠΗΓΕ ΠΟΛΥ ΣΤΡΑΒΑ:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
};

// Run the test
testCustomerAuth();
