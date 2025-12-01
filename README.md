# 🚀 Fast Delivery - Delivery Management Platform

<p align="center">
  <img src="docs/logo.png" alt="Fast Delivery Logo" width="200" />
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![React Native](https://img.shields.io/badge/React%20Native-Expo-purple.svg)](https://expo.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen.svg)](https://www.mongodb.com/atlas)

**Fast Delivery** is a complete delivery management platform for local businesses. It includes a web admin panel, store dashboards, driver mobile apps, and customer mobile apps with real-time order tracking.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Mobile App Build](#-mobile-app-build)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 👨‍💼 Admin Dashboard
- 📊 Real-time statistics and charts
- 👥 Store, driver, and customer management
- ✅ Approval workflows for new registrations
- 💰 Financial reports and expense tracking
- ⚙️ System settings (delivery fees, service hours, store types)

### 🏪 Store Panel
- 📦 Order management (accept/reject/price)
- 📋 Order history and status updates
- 🔔 Real-time notifications for new orders
- 👤 Profile management

### 🚗 Driver Mobile App
- 📍 GPS-based order assignments
- 🗺️ Navigation to pickup/delivery locations
- 📡 Real-time location broadcasting
- ✅ Order status updates (picked up, delivered)
- 💼 Availability toggle

### 👤 Customer Mobile App
- 🏪 Browse nearby stores
- 📝 Place orders (text or voice)
- 🗺️ Live driver tracking on map
- 📱 Order history
- 🔔 Push notifications

### 🔧 Technical Features
- 🔐 JWT Authentication with role-based access
- 📡 Real-time updates via Socket.IO
- 📧 Email verification (Brevo/Resend)
- 📲 Push notifications (Expo)
- 🗺️ Google Maps integration
- 📱 Progressive Web App (PWA) support

---

## 🛠 Tech Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Node.js, Express.js, MongoDB, Socket.IO |
| **Frontend** | React.js, React Bootstrap, Recharts |
| **Mobile** | React Native (Expo), react-native-maps |
| **Database** | MongoDB Atlas |
| **Authentication** | JWT, bcryptjs |
| **Email** | Brevo (Sendinblue), Resend |
| **Maps** | Google Maps API |
| **Hosting** | Render (Backend), Render (Frontend) |

---

## 📁 Project Structure

```
FastDelivery/
├── fast-delivery-backend/      # Express.js API Server
│   ├── server.js               # Main entry point
│   ├── src/
│   │   ├── config/             # Database & Firebase config
│   │   ├── controllers/        # Business logic
│   │   ├── middleware/         # Auth middleware
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # API routes
│   │   └── utils/              # Helpers (JWT, geocoding, etc.)
│   └── tests/                  # Jest API tests
│
├── fast-delivery-frontend/     # React Web Application
│   ├── public/                 # Static files & PWA manifests
│   └── src/
│       ├── components/         # React components (admin, store, driver)
│       ├── context/            # Auth & notification context
│       ├── pages/              # Page components
│       ├── services/           # API & Socket clients
│       └── styles/             # CSS files
│
├── fast-delivery-mobile/       # React Native Apps (Expo)
│   ├── customer/               # Customer App
│   │   ├── src/screens/        # App screens
│   │   ├── src/services/       # API & Socket services
│   │   └── android/            # Android native files
│   │
│   └── driver/                 # Driver App
│       ├── src/screens/        # App screens
│       ├── src/components/     # Map components
│       └── android/            # Android native files
│
└── docs/                       # Documentation
```

---

## 📦 Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **MongoDB** (Atlas or local)
- **Android Studio** (for mobile development)
- **Expo CLI**: `npm install -g expo-cli`

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/ZiSo89/FastDelivery.git
cd FastDelivery
```

### 2. Install Backend Dependencies

```bash
cd fast-delivery-backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../fast-delivery-frontend
npm install
```

### 4. Install Mobile App Dependencies

```bash
# Customer App
cd ../fast-delivery-mobile/customer
npm install

# Driver App
cd ../driver
npm install
```

---

## ⚙️ Configuration

### Backend Environment Variables

Create `.env` file in `fast-delivery-backend/`:

```env
# Server
NODE_ENV=development
PORT=5001

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fastdelivery

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d

# Frontend URL (for CORS & emails)
FRONTEND_URL=http://localhost:3000

# Email (choose one)
BREVO_SMTP_KEY=your-brevo-api-key
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@fastdelivery.gr

# Google Maps (for geocoding)
GOOGLE_MAPS_API_KEY=AIzaSy...

# Admin Setup Key (one-time use)
ADMIN_SETUP_KEY=FastDelivery2024Setup!
```

### Mobile App Configuration

Create `config.js` in `fast-delivery-mobile/customer/src/` and `driver/src/`:

```javascript
export const API_URL = 'https://your-backend-url.com';
export const SOCKET_URL = 'https://your-backend-url.com';
export const GOOGLE_MAPS_API_KEY = 'AIzaSy...';
```

---

## 🏃 Running the Application

### Start Backend Server

```bash
cd fast-delivery-backend
npm run dev
# Server runs on http://localhost:5001
```

### Start Frontend (React Web)

```bash
cd fast-delivery-frontend
npm start
# Web app runs on http://localhost:3000
```

### Start Mobile Apps

```bash
# Customer App
cd fast-delivery-mobile/customer
npx expo start

# Driver App (different port)
cd fast-delivery-mobile/driver
npx expo start --port 8082
```

### Using Android Emulator

```bash
# Start emulator
emulator -avd Your_AVD_Name

# Or use Expo Go app on physical device
```

---

## 📚 API Documentation

### Base URL
- **Development:** `http://localhost:5001/api/v1`
- **Production:** `https://your-backend.onrender.com/api/v1`

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login (all roles) |
| POST | `/auth/customer/register` | Register customer |
| POST | `/auth/store/register` | Register store |
| POST | `/auth/driver/register` | Register driver |
| GET | `/auth/store-types` | Get store types (public) |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password |

### Admin Endpoints (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats` | Dashboard statistics |
| GET | `/admin/stats/extended` | Extended statistics |
| GET | `/admin/stores` | List all stores |
| PUT | `/admin/stores/:id/approve` | Approve/reject store |
| GET | `/admin/drivers` | List all drivers |
| PUT | `/admin/drivers/:id/approve` | Approve/reject driver |
| GET | `/admin/customers` | List all customers |
| GET | `/admin/orders` | List all orders |
| PUT | `/admin/orders/:id/assign-driver` | Assign driver |
| GET | `/admin/settings` | Get system settings |
| PUT | `/admin/settings` | Update settings |

### Customer Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders/stores` | Get active stores (public) |
| GET | `/orders/service-status` | Check if service is open |
| POST | `/orders` | Create new order |
| GET | `/orders/my-orders` | Get customer orders (protected) |
| GET | `/orders/:orderNumber/status` | Get order status |
| PUT | `/orders/:orderId/confirm` | Confirm order price |
| DELETE | `/orders/profile` | Delete account (soft) |

### Store Endpoints (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/store/orders` | Get store orders |
| PUT | `/store/orders/:id/accept` | Accept/reject order |
| PUT | `/store/orders/:id/price` | Set order price |
| PUT | `/store/orders/:id/status` | Update order status |
| GET | `/store/profile` | Get store profile |
| PUT | `/store/profile` | Update profile |

### Driver Endpoints (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/driver/orders` | Get assigned orders |
| PUT | `/driver/orders/:id/accept` | Accept/reject assignment |
| PUT | `/driver/orders/:id/status` | Update order status |
| GET | `/driver/profile` | Get driver profile |
| PUT | `/driver/profile` | Update profile |
| PUT | `/driver/availability` | Toggle availability |

### Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join` | Client → Server | Join room (role:userId) |
| `join_order` | Client → Server | Join order room |
| `driver:location_update` | Driver → Server | Send location |
| `driver:location` | Server → Clients | Broadcast location |
| `order:status_updated` | Server → Clients | Order status change |
| `new_order` | Server → Store | New order notification |

---

## 🧪 Testing

### Run All Tests

```bash
cd fast-delivery-backend
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Verbose Output

```bash
npm run test:verbose
```

### Test Coverage

Tests cover:
- ✅ Authentication (login, register, password reset)
- ✅ Admin API (stats, stores, drivers, orders, settings)
- ✅ Customer API (stores, orders, profile)
- ✅ Store API (orders, profile)
- ✅ Driver API (orders, profile, availability)
- ✅ Health check and error handling

---

## 📱 Mobile App Build

### Prerequisites
- Java JDK 17
- Android SDK
- Expo CLI

### Build APK

```powershell
# Set JAVA_HOME
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"

# Customer App
cd fast-delivery-mobile/customer
npx expo prebuild --platform android --clean
cd android
.\gradlew.bat assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk

# Driver App
cd ../../driver
npx expo prebuild --platform android --clean
cd android
.\gradlew.bat assembleRelease
```

### Install on Emulator

```bash
adb install path/to/app-release.apk
```

For detailed build instructions, see [ANDROID_BUILD_GUIDE.md](docs/ANDROID_BUILD_GUIDE.md).

---

## 🌐 Deployment

### Backend (Render)

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables

### Frontend (Render Static Site)

1. Create a new Static Site
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Add `_redirects` file for SPA routing

### Mobile Apps

- Use EAS Build for production APK/AAB
- Upload to Google Play Console

---

## 📄 Documentation

- [API Documentation](docs/API.md)
- [Database Schema](docs/DATABASE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Android Build Guide](docs/ANDROID_BUILD_GUIDE.md)
- [User Manual (Greek)](docs/ΕΓΧΕΙΡΙΔΙΟ_ΧΡΗΣΤΗ.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Author

**ZiSo89** - [GitHub](https://github.com/ZiSo89)

---

## 🙏 Acknowledgements

- [Expo](https://expo.dev/) - React Native framework
- [Socket.IO](https://socket.io/) - Real-time communication
- [MongoDB Atlas](https://www.mongodb.com/atlas) - Database hosting
- [Render](https://render.com/) - Hosting platform
- [Google Maps Platform](https://developers.google.com/maps) - Maps and geocoding
