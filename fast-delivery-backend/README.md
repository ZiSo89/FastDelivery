# Fast Delivery Backend

Express.js + MongoDB backend για εφαρμογή delivery που συνδέει πελάτες, καταστήματα και διανομείς μέσω διαχειριστή.

## 🚀 Features

- **JWT Authentication** με role-based authorization (Admin, Store, Driver, Customer)
- **Real-time notifications** με Socket.IO
- **13-state order workflow** από δημιουργία έως παράδοση
- **Voice order support** με Firebase Storage
- **Geolocation** για εύρεση κοντινών καταστημάτων
- **Auto-generated order numbers** (ORD-YYYYMMDD-####)
- **Complete approval workflow** για stores και drivers

## 📋 Prerequisites

- Node.js 18+ LTS
- MongoDB Atlas account
- Firebase project (for voice messages)

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your MongoDB and Firebase credentials

# Create admin user
node createAdmin.js

# Start server
node server.js
```

## 🔧 Environment Variables

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRE=7d
FIREBASE_PROJECT_ID=your-project
FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## 📚 API Documentation

See [`docs/API_ENDPOINTS.txt`](docs/API_ENDPOINTS.txt) for complete API reference.

**Base URL:** `http://localhost:5000/api/v1`

### Quick Examples

**Login:**
```bash
POST /auth/login
{
  "email": "admin@fastdelivery.gr",
  "password": "admin123",
  "role": "admin"
}
```

**Create Order:**
```bash
POST /orders
{
  "customer": {
    "name": "Maria Ioannou",
    "phone": "6912345678",
    "address": "Kyprou 25, Alexandroupoli"
  },
  "storeId": "STORE_ID",
  "storeName": "City Market",
  "orderType": "text",
  "orderContent": "2kg tomatoes, milk, bread"
}
```

## 🧪 Testing

```bash
# Run basic tests
cd tests
.\run-tests.ps1

# Run complete workflow test
.\test-complete-workflow.ps1
```

See [`tests/README.md`](tests/README.md) for detailed testing documentation.

## 📦 Project Structure

```
fast-delivery-backend/
├── server.js              # Main Express app
├── createAdmin.js         # Admin user creation script
├── src/
│   ├── config/
│   │   ├── database.js    # MongoDB connection
│   │   └── firebase.js    # Firebase Storage
│   ├── models/            # Mongoose schemas (5 models)
│   ├── controllers/       # Business logic (5 controllers)
│   ├── routes/            # API routes (5 route files)
│   ├── middleware/
│   │   └── auth.js        # JWT + role authorization
│   └── utils/
│       └── jwt.js         # Token generation/verification
├── tests/                 # PowerShell test scripts
└── docs/                  # API documentation
```

## 🔐 Default Admin Credentials

```
Email: admin@fastdelivery.gr
Password: admin123
```

**⚠️ Change these in production!**

## 🌐 Deployment

### Backend (Render)
```bash
# Build command
npm install

# Start command
node server.js
```

### Environment Variables
Set all variables from `.env` in Render dashboard.

## 📊 Order Workflow States

1. `pending_store` → Customer creates order
2. `pricing` → Store accepts
3. `pending_admin` → Store sets price
4. `pending_customer_confirm` → Admin adds delivery fee
5. `confirmed` → Customer confirms
6. `assigned` → Admin assigns driver
7. `accepted_driver` → Driver accepts
8. `preparing` → Store prepares
9. `in_delivery` → Driver delivers
10. `completed` → Order complete
11. `cancelled` → Cancelled by admin
12. `rejected_store` → Store rejected
13. `rejected_driver` → Driver rejected

## 🛡️ Security

- JWT tokens with 7-day expiration
- bcrypt password hashing (10 rounds)
- Role-based route protection
- Phone number verification for orders
- CORS enabled for frontend domain

## 📝 License

MIT

## 👨‍💻 Author

Fast Delivery Team - 2025
