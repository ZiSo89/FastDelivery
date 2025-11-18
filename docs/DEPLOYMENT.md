# Fast Delivery - Deployment Guide

Οδηγίες για deployment της εφαρμογής σε δωρεάν υπηρεσίες.

---

## 1. Προαπαιτούμενα

### 1.1 Λογαριασμοί (Δωρεάν)
- ✅ [MongoDB Atlas](https://cloud.mongodb.com/) - Database
- ✅ [Render.com](https://render.com/) - Backend hosting
- ✅ [Vercel](https://vercel.com/) ή [Netlify](https://netlify.com/) - Frontend hosting
- ✅ [Firebase](https://console.firebase.google.com/) - File storage (voice messages)
- ✅ [Google Cloud Console](https://console.cloud.google.com/) - Maps API

### 1.2 Εργαλεία Ανάπτυξης
- Node.js 18+ LTS
- npm ή yarn
- Git
- VS Code (προτεινόμενο)

---

## 2. MongoDB Atlas Setup

### 2.1 Δημιουργία Cluster
1. Πηγαίνετε στο https://cloud.mongodb.com/
2. Δημιουργήστε λογαριασμό (δωρεάν)
3. Επιλέξτε **M0 (Free Tier)**
4. Περιοχή: Επιλέξτε πλησιέστερη (π.χ., Frankfurt)
5. Όνομα Cluster: `fast-delivery-cluster`

### 2.2 Database User
1. Database Access → Add New Database User
2. Username: `fastdelivery_admin`
3. Password: Δημιουργήστε ισχυρό password (αποθηκεύστε το)
4. Privileges: **Read & Write to any database**

### 2.3 Network Access
1. Network Access → Add IP Address
2. Επιλέξτε **Allow Access from Anywhere** (`0.0.0.0/0`)
3. (Για production, περιορίστε σε Render IPs)

### 2.4 Connection String
1. Clusters → Connect → Connect your application
2. Driver: **Node.js**
3. Version: **4.1 or later**
4. Αντιγράψτε το connection string:
   ```
   mongodb+srv://fastdelivery_admin:<password>@fast-delivery-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Αντικαταστήστε `<password>` με το πραγματικό password

### 2.5 Δημιουργία Database
1. Collections → Create Database
2. Database Name: `fast_delivery`
3. Collection Name: `orders` (οι υπόλοιπες θα δημιουργηθούν αυτόματα)

---

## 3. Firebase Setup (Voice Storage)

### 3.1 Δημιουργία Project
1. https://console.firebase.google.com/
2. Add Project → Όνομα: `fast-delivery`
3. Disable Google Analytics (προαιρετικό)

### 3.2 Firebase Storage
1. Build → Storage → Get Started
2. Start in **production mode**
3. Location: Επιλέξτε `europe-west` (πλησιέστερο)

### 3.3 Storage Rules (Προσωρινά - Public Upload)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /voice/{fileName} {
      allow read, write: if true;  // MVP only - update για production
    }
  }
}
```

### 3.4 Service Account Key
1. Project Settings → Service Accounts
2. Generate New Private Key → **Download JSON**
3. Μετονομάστε σε `firebase-service-account.json`
4. **ΜΗΝ** το κάνετε commit στο Git!

---

## 4. Google Maps API Setup

### 4.1 Δημιουργία Project
1. https://console.cloud.google.com/
2. New Project → Όνομα: `Fast Delivery`

### 4.2 Enable APIs
1. APIs & Services → Library
2. Αναζήτηση & Enable:
   - **Maps JavaScript API**
   - **Geocoding API** (για μετατροπή διεύθυνσης σε coordinates)

### 4.3 API Key
1. APIs & Services → Credentials
2. Create Credentials → **API Key**
3. Αντιγράψτε το key (π.χ., `AIzaSyC...`)

### 4.4 Restrict API Key (Ασφάλεια)
1. Edit API Key
2. Application Restrictions: **HTTP referrers**
3. Προσθέστε:
   ```
   https://your-frontend.vercel.app/*
   http://localhost:3000/*  (για development)
   ```
4. API Restrictions: **Restrict key**
   - Maps JavaScript API
   - Geocoding API

---

## 5. Backend Deployment (Render)

### 5.1 Προετοιμασία Backend
```bash
cd fast-delivery-backend

# Δημιουργήστε .env file (τοπικά - ΔΕΝ το κάνετε commit)
touch .env
```

**Περιεχόμενο `.env`:**
```env
# MongoDB
MONGODB_URI=mongodb+srv://fastdelivery_admin:<password>@fast-delivery-cluster.xxxxx.mongodb.net/fast_delivery?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Firebase
FIREBASE_PROJECT_ID=fast-delivery
FIREBASE_STORAGE_BUCKET=fast-delivery.appspot.com

# Server
PORT=5000
NODE_ENV=production

# Frontend URL (για CORS)
FRONTEND_URL=https://your-frontend.vercel.app
```

### 5.2 Δημιουργία Render Service
1. https://dashboard.render.com/
2. New → **Web Service**
3. Connect GitHub repository: `fast-delivery-backend`
4. Settings:
   - **Name:** `fast-delivery-backend`
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free

### 5.3 Environment Variables (Render)
1. Environment → Add Environment Variables
2. Προσθέστε ΟΛΑ τα variables από το `.env`:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRE`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `PORT`
   - `NODE_ENV`
   - `FRONTEND_URL`

### 5.4 Firebase Service Account (Render)
1. Environment → Add Secret File
2. Filename: `firebase-service-account.json`
3. Contents: Επικολλήστε το περιεχόμενο του JSON file

### 5.5 Deploy
1. Render θα κάνει auto-deploy
2. URL: `https://fast-delivery-backend.onrender.com`
3. Ελέγξτε logs για errors

---

## 6. Frontend Deployment (Vercel)

### 6.1 Προετοιμασία Frontend
```bash
cd fast-delivery-frontend

# Δημιουργήστε .env.local (τοπικά)
touch .env.local
```

**Περιεχόμενο `.env.local`:**
```env
REACT_APP_API_URL=https://fast-delivery-backend.onrender.com/api/v1
REACT_APP_SOCKET_URL=https://fast-delivery-backend.onrender.com
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyC...
REACT_APP_FIREBASE_STORAGE_BUCKET=fast-delivery.appspot.com
```

### 6.2 Build Test (Τοπικά)
```bash
npm run build
# Ελέγξτε για errors
```

### 6.3 Vercel Deployment
1. https://vercel.com/
2. Import Project → GitHub → `fast-delivery-frontend`
3. Framework Preset: **Create React App**
4. Root Directory: `fast-delivery-frontend`
5. Environment Variables:
   - `REACT_APP_API_URL`
   - `REACT_APP_SOCKET_URL`
   - `REACT_APP_GOOGLE_MAPS_API_KEY`
   - `REACT_APP_FIREBASE_STORAGE_BUCKET`
6. Deploy

### 6.4 Custom Domain (Προαιρετικό)
1. Vercel → Settings → Domains
2. Προσθέστε custom domain (π.χ., `fastdelivery.gr`)
3. Ενημερώστε DNS records

---

## 7. Ενημέρωση CORS & URLs

### 7.1 Backend CORS (Render)
Ενημερώστε το `FRONTEND_URL` environment variable με το Vercel URL:
```env
FRONTEND_URL=https://fast-delivery-frontend.vercel.app
```

### 7.2 Google Maps Restrictions
Ενημερώστε το API Key με το production URL:
```
https://fast-delivery-frontend.vercel.app/*
```

---

## 8. Post-Deployment Checklist

### 8.1 Backend Health Check
```bash
curl https://fast-delivery-backend.onrender.com/api/v1/health
# Αναμενόμενο: { "success": true, "message": "API is running" }
```

### 8.2 Frontend Check
1. Ανοίξτε `https://fast-delivery-frontend.vercel.app`
2. Ελέγξτε Console για errors
3. Δοκιμάστε:
   - Προβολή καταστημάτων
   - Υποβολή παραγγελίας (test mode)

### 8.3 MongoDB Check
1. MongoDB Atlas → Clusters → Collections
2. Ελέγξτε αν δημιουργήθηκαν test records

### 8.4 Firebase Storage Check
1. Firebase Console → Storage
2. Ελέγξτε αν ανεβαίνουν voice files

---

## 9. Environment Variables Summary

### 9.1 Backend (.env)
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
FIREBASE_PROJECT_ID=fast-delivery
FIREBASE_STORAGE_BUCKET=fast-delivery.appspot.com
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://fast-delivery-frontend.vercel.app
```

### 9.2 Frontend (.env.local)
```env
REACT_APP_API_URL=https://fast-delivery-backend.onrender.com/api/v1
REACT_APP_SOCKET_URL=https://fast-delivery-backend.onrender.com
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyC...
REACT_APP_FIREBASE_STORAGE_BUCKET=fast-delivery.appspot.com
```

---

## 10. Monitoring & Maintenance

### 10.1 Render Logs
```bash
# Render Dashboard → Logs (real-time)
```

### 10.2 MongoDB Metrics
- MongoDB Atlas → Metrics → Monitor connections, operations

### 10.3 Cold Start Issue (Render Free Tier)
- Το backend "κοιμάται" μετά από 15 λεπτά αδράνειας
- Πρώτο request μετά: ~30-60 sec delay
- **Λύση (προαιρετική):** Ping service κάθε 10 λεπτά (π.χ., με cron job)

---

## 11. CI/CD (Auto-Deploy)

### 11.1 Backend (Render)
- Auto-deploy enabled by default
- Κάθε `git push` στο `main` branch → auto-deploy

### 11.2 Frontend (Vercel)
- Auto-deploy enabled by default
- Κάθε `git push` → auto-deploy
- Preview URLs για κάθε Pull Request

---

## 12. Backup Strategy

### 12.1 MongoDB Backups
- MongoDB Atlas (Free Tier): Auto snapshots κάθε 24 ώρες (2 ημέρες retention)
- Manual backup:
  ```bash
  mongodump --uri="mongodb+srv://..." --out=./backup
  ```

### 12.2 Code Backups
- GitHub repository (primary)
- Local clones (secondary)

---

## 13. Security Best Practices

### 13.1 Secrets Management
- ❌ **ΜΗΝ** κάνετε commit `.env` files
- ✅ Χρησιμοποιήστε Render/Vercel environment variables
- ✅ Rotate JWT secrets περιοδικά

### 13.2 HTTPS
- ✅ Render & Vercel παρέχουν δωρεάν SSL certificates

### 13.3 Rate Limiting (Μελλοντικά)
```javascript
// Express middleware (για production)
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 λεπτά
  max: 100 // max 100 requests ανά IP
});

app.use('/api/', limiter);
```

---

## 14. Troubleshooting

### 14.1 Backend Δεν Ξεκινάει
```bash
# Ελέγξτε Render logs:
# - MongoDB connection errors → Ελέγξτε MONGODB_URI
# - Firebase errors → Ελέγξτε firebase-service-account.json
# - Port errors → Χρησιμοποιήστε process.env.PORT
```

### 14.2 Frontend Δεν Συνδέεται στο Backend
```bash
# Ελέγξτε:
# 1. REACT_APP_API_URL είναι σωστό
# 2. CORS: Backend FRONTEND_URL έχει το Vercel URL
# 3. Browser console για network errors
```

### 14.3 Maps Δεν Εμφανίζονται
```bash
# Ελέγξτε:
# 1. API Key restrictions (HTTP referrers)
# 2. APIs enabled (Maps JavaScript API, Geocoding)
# 3. Billing account (Google Cloud - δωρεάν tier αρκεί)
```

---

## 15. Scaling (Μελλοντικά)

Όταν το traffic αυξηθεί:

### 15.1 Render Paid Plans
- **Starter ($7/μήνα):** No cold starts, persistent storage
- **Standard ($25/μήνα):** Auto-scaling, 1GB RAM

### 15.2 MongoDB Atlas Upgrade
- **M10 ($57/μήνα):** 10GB storage, automated backups

### 15.3 CDN για Frontend
- Vercel δωρεάν tier περιλαμβάνει CDN (100GB/μήνα)

---

**Deployment URLs (Παράδειγμα):**
- **Backend:** https://fast-delivery-backend.onrender.com
- **Frontend:** https://fast-delivery-frontend.vercel.app
- **Database:** MongoDB Atlas (cloud)

**Τελευταία ενημέρωση:** 18/11/2025
