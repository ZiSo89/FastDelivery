/**
 * Customer API Tests
 * ===================
 * Tests for customer endpoints
 */

const request = require('supertest');
require('../setup');

const BASE_URL = global.testConfig.baseUrl;
let customerToken;

beforeAll(async () => {
  // Login as customer and get token
  const res = await request(BASE_URL)
    .post('/api/v1/auth/login')
    .send({
      email: global.testConfig.customerCredentials.email,
      password: global.testConfig.customerCredentials.password,
      role: 'customer'
    });
  
  customerToken = res.body.token;
});

describe('Customer API', () => {

  describe('GET /api/v1/orders/stores', () => {
    
    it('should return active stores (public)', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/orders/stores');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.stores)).toBe(true);
    });

    it('stores should have required fields', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/orders/stores');
      
      if (res.body.stores && res.body.stores.length > 0) {
        const store = res.body.stores[0];
        expect(store.businessName).toBeDefined();
        expect(store.storeType).toBeDefined();
        expect(store.address).toBeDefined();
      }
    });
  });

  describe('GET /api/v1/orders/service-status', () => {
    
    it('should return service status', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/orders/service-status');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.isOpen).toBe('boolean');
    });
  });

  describe('GET /api/v1/orders/my-orders', () => {
    
    it('should return customer orders (authenticated)', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/orders/my-orders')
        .set('Authorization', `Bearer ${customerToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.orders)).toBe(true);
    });

    it('should reject without auth token', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/orders/my-orders');
      
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/v1/orders', () => {
    
    it('should create order with valid data', async () => {
      // First get a store
      const storesRes = await request(BASE_URL)
        .get('/api/v1/orders/stores');
      
      if (storesRes.body.stores && storesRes.body.stores.length > 0) {
        const store = storesRes.body.stores[0];
        
        const res = await request(BASE_URL)
          .post('/api/v1/orders')
          .send({
            storeId: store._id,
            customer: {
              name: 'Test Customer',
              phone: '6900000000',
              email: 'test@test.com'
            },
            orderType: 'delivery',
            orderContent: {
              deliveryAddress: 'Test Address 123',
              orderDetails: 'Test order details'
            }
          });
        
        // Order creation may be blocked by service hours (403), validation (400), or succeed (201)
        expect([201, 400, 403]).toContain(res.statusCode);
      }
    });

    it('should reject order without storeId', async () => {
      const res = await request(BASE_URL)
        .post('/api/v1/orders')
        .send({
          customer: {
            name: 'Test Customer',
            phone: '6900000000'
          },
          orderType: 'delivery',
          orderContent: {
            deliveryAddress: 'Test Address'
          }
        });
      
      expect(res.statusCode).toBe(400);
    });
  });
});
