# Fast Delivery API Tests

## Test Scripts

### `run-tests.ps1`
Basic API health check and authentication tests.

**Tests:**
- Health check endpoint
- Admin login
- Protected routes (admin stats)
- Store registration
- Driver registration
- Pending approvals queries

**Usage:**
```powershell
.\run-tests.ps1
```

### `test-complete-workflow.ps1`
Complete order workflow from creation to delivery completion.

**Tests all 13 order states:**
1. `pending_store` - Customer creates order
2. `pricing` - Store accepts order
3. `pending_admin` - Store sets product price
4. `pending_customer_confirm` - Admin adds delivery fee
5. `confirmed` - Customer confirms price
6. `assigned` - Admin assigns driver
7. `accepted_driver` - Driver accepts assignment
8. `preparing` - Store prepares order
9. `in_delivery` - Driver picks up order
10. `completed` - Driver delivers order

**Usage:**
```powershell
.\test-complete-workflow.ps1
```

**Prerequisites:**
- Server running on port 5000
- Admin user exists (admin@fastdelivery.gr / admin123)
- At least one approved driver in database

### `setup-test-data.ps1`
Creates and approves test store and driver for workflow testing.

**Creates:**
- New store (pending → approved)
- New driver (pending → approved)

**Usage:**
```powershell
.\setup-test-data.ps1
```

## Test Data

### `test-login.json`
Sample login credentials for manual testing with curl or Postman.

```json
{
  "email": "admin@fastdelivery.gr",
  "password": "admin123",
  "role": "admin"
}
```

## Running Tests

1. **Start the server:**
   ```powershell
   node server.js
   ```

2. **Run basic tests:**
   ```powershell
   cd tests
   .\run-tests.ps1
   ```

3. **Run complete workflow:**
   ```powershell
   .\test-complete-workflow.ps1
   ```

## Test Results (Last Run - 2025-11-18)

✅ All tests passing
- 4 completed orders
- €14 revenue (delivery fees)
- 5 active stores
- 3 online drivers

## Notes

- Tests use PowerShell's `Invoke-RestMethod` (native to Windows)
- All tests create new data to avoid conflicts
- Order numbers auto-generate as `ORD-YYYYMMDD-####`
- Tests verify JWT authentication and role-based authorization
