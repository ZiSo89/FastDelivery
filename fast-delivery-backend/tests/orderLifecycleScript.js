// Semi-automated end-to-end order lifecycle script
// Runs against local backend: http://localhost:5000/api/v1
// Usage:
//   cd fast-delivery-backend/tests
//   node orderLifecycleScript.js
//
// Prerequisites:
// - Backend running locally (npm run dev or node server.js)
// - Database seeded (node clearAllData.js && node seedTestData.js)

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

// Test credentials from API docs / seedTestData.js
const adminCreds = {
  email: 'admin@fastdelivery.gr',
  password: 'admin123',
  role: 'admin',
};

const storeCreds = {
  email: 'kafeteria@test.com',
  password: 'store123',
  role: 'store',
};

const driverCreds = {
  email: 'driver1@test.com',
  password: 'driver123',
  role: 'driver',
};

// Simple customer payload for creating order (guest-style)
const customerPayload = {
  customer: {
    name: 'Test Customer Script',
    phone: '6900000001',
    address: 'Script Address 1, Alexandroupoli',
  },
  orderType: 'text',
  orderContent: '1x test order from script',
  // storeId and storeName will be populated dynamically
};

async function login({ email, password, role }) {
  const res = await axios.post(`${BASE_URL}/auth/login`, { email, password, role });
  return res.data.token || res.data.data?.token || res.data?.jwt || null;
}

async function getStoresNear() {
  // Use dummy coords; backend will filter nearby stores
  const res = await axios.get(`${BASE_URL}/orders/stores`, {
    params: { lat: 40.848, lng: 25.874 },
  });
  return res.data.stores || res.data.data || res.data;
}

async function createOrder(store) {
  const payload = {
    ...customerPayload,
    storeId: store._id || store.id,
    storeName: store.businessName || store.name || 'Script Store',
  };

  const res = await axios.post(`${BASE_URL}/orders`, payload);
  return res.data.order || res.data.data || res.data;
}

async function adminSetDeliveryFee(orderId, token) {
  const res = await axios.put(
    `${BASE_URL}/admin/orders/${orderId}/delivery-fee`,
    { deliveryFee: 3.5 },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.order || res.data.data || res.data;
}

async function storeAcceptOrder(orderId, token) {
  const res = await axios.put(
    `${BASE_URL}/store/orders/${orderId}/accept`,
    { action: 'accept' },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.order || res.data.data || res.data;
}

async function storeSetPrice(orderId, token, price = 25.5) {
  const res = await axios.put(
    `${BASE_URL}/store/orders/${orderId}/price`,
    { productPrice: price },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.order || res.data.data || res.data;
}

async function driverAcceptOrder(orderId, token) {
  const res = await axios.put(
    `${BASE_URL}/driver/orders/${orderId}/accept`,
    { action: 'accept' },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.order || res.data.data || res.data;
}

async function driverUpdateStatus(orderId, status, token) {
  const res = await axios.put(
    `${BASE_URL}/driver/orders/${orderId}/status`,
    { status },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.order || res.data.data || res.data;
}

async function storeUpdateStatus(orderId, status, token) {
  const res = await axios.put(
    `${BASE_URL}/store/orders/${orderId}/status`,
    { status },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.order || res.data.data || res.data;
}

async function run() {
  try {
    console.log('=== FastDelivery Order Lifecycle Script ===');
    console.log('Base URL:', BASE_URL);
    console.log('\n⚠️  PREREQUISITES:');
    console.log('   - Backend must be running: npm run dev (in fast-delivery-backend)');
    console.log('   - Database seeded: node clearAllData.js && node seedTestData.js');
    console.log('   - For visual verification, run: .\\open-test-browsers.ps1\n');

    // 1. Login as admin, store, driver
    console.log('[1] Logging in as Admin/Store/Driver...');
    let adminToken, storeToken, driverToken;
    
    try {
      [adminToken, storeToken, driverToken] = await Promise.all([
        login(adminCreds),
        login(storeCreds),
        login(driverCreds),
      ]);
    } catch (loginErr) {
      console.error('\n❌ Login failed. Is backend running on', BASE_URL, '?');
      console.error('   Error:', loginErr.message);
      console.error('\n   Start backend with: cd fast-delivery-backend && npm run dev');
      process.exit(1);
    }

    if (!adminToken || !storeToken || !driverToken) {
      throw new Error('One or more JWT tokens are missing. Check auth/login response structure.');
    }

    console.log('   ✅ Admin token OK');
    console.log('   ✅ Store token OK');
    console.log('   ✅ Driver token OK');

    // 2. Get nearby stores
    console.log('\n[2] Fetching nearby stores...');
    const stores = await getStoresNear();
    if (!stores || stores.length === 0) {
      throw new Error('No stores returned from /orders/stores. Check seedTestData or coordinates.');
    }

    const store = stores[0];
    console.log(`   - Using store: ${store.businessName || store.name || store._id}`);

    // 3. Create new customer order
    console.log('\n[3] Creating new customer order...');
    const order = await createOrder(store);
    const orderId = order._id || order.id;
    const orderNumber = order.orderNumber || order.order_no || order.number;

    console.log('   - Order created with ID:', orderId);
    console.log('   - Order number:', orderNumber);
    console.log('   - Initial status:', order.status);

    // 4. Store accepts order (pending_store → pricing)
    console.log('\n[4] Store: accepting order...');
    const afterStoreAccept = await storeAcceptOrder(orderId, storeToken);
    console.log('   - Status after store accept:', afterStoreAccept.status);

    // 5. Store sets price (pricing → pending_admin)
    console.log('\n[5] Store: setting product price...');
    let afterPrice;
    try {
      afterPrice = await storeSetPrice(orderId, storeToken);
      console.log('   - Status after price set:', afterPrice.status);
    } catch (e) {
      console.log('   - Skipping price set (error):', e.response?.data?.message || e.message);
    }

    // 6. Admin sets delivery fee (pending_admin → pending_customer_confirm)
    console.log('\n[6] Admin: setting delivery fee...');
    let afterFee;
    if ((afterPrice?.status || afterStoreAccept.status) !== 'pending_admin') {
      console.log('   - Skipping delivery-fee: current status is', afterPrice?.status || afterStoreAccept.status);
    } else {
      try {
        afterFee = await adminSetDeliveryFee(orderId, adminToken);
        console.log('   - Status after fee:', afterFee.status);
      } catch (e) {
        console.log('   - Delivery-fee failed:', e.response?.data?.message || e.message);
      }
    }

    // 7. [Manual] Customer confirms price in browser
    console.log('\n[7] ⚠️  MANUAL STEP: Customer must confirm price in browser');
    console.log('   - Open customer browser tab');
    console.log('   - Navigate to "Οι Παραγγελίες μου" and confirm order', orderNumber);
    console.log('   - Press ENTER here when done...');
    
    // Wait for manual confirmation
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });

    // 8. [Manual] Admin assigns driver in browser
    console.log('\n[8] ⚠️  MANUAL STEP: Admin must assign driver in browser');
    console.log('   - Open admin browser tab');
    console.log('   - Go to Orders tab, find order', orderNumber);
    console.log('   - Assign driver and press ENTER here when done...');
    
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });

    // 9. [Manual] Driver accepts order (assigned → accepted_driver)
    console.log('\n[9] ⚠️  MANUAL STEP: Driver must accept order');
    console.log('   - Open driver browser tab');
    console.log('   - Click "✅ Αποδοχή Παραγγελίας" button for order', orderNumber);
    console.log('   - Press ENTER here when done...');
    
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });

    // 10. [Manual] Store sets status to "Προετοιμασία" (accepted_driver → preparing)
    console.log('\n[10] ⚠️  MANUAL STEP: Store must mark order as "Προετοιμασία"');
    console.log('   - Open store browser tab');
    console.log('   - Find order', orderNumber);
    console.log('   - Click "Προετοιμασία" button');
    console.log('   - Press ENTER here when done...');
    
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });

    // 11. Driver picks up order (preparing → in_delivery)
    console.log('\n[11] Driver: marking as "in_delivery" (Παραλαβή)...');
    const inDelivery = await driverUpdateStatus(orderId, 'in_delivery', driverToken);
    console.log('   - Status now:', inDelivery.status);

    // 12. Driver delivers order (in_delivery → completed)
    console.log('\n[12] Driver: marking as "completed" (Παράδοση)...');
    const completed = await driverUpdateStatus(orderId, 'completed', driverToken);
    console.log('   - Final status:', completed.status);

    console.log('\n=== DONE ===');
    console.log('Open your test browsers to visually verify status changes.');
    console.log('Order number for tracking:', orderNumber);
  } catch (err) {
    console.error('\n[ERROR] Script failed:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
}

run();
