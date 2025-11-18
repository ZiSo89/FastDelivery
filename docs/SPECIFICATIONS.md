# Fast Delivery - Τεχνικές Προδιαγραφές Έργου

**Έκδοση:** 1.0  
**Ημερομηνία:** 18 Νοεμβρίου 2025  
**Κατάσταση:** Final MVP Specifications

---

## Πίνακας Περιεχομένων

1. [Επισκόπηση Έργου](#1-επισκόπηση-έργου)
2. [Ρόλοι Χρηστών](#2-ρόλοι-χρηστών)
3. [Βασικές Λειτουργίες](#3-βασικές-λειτουργίες)
4. [Τεχνολογική Στοίβα](#4-τεχνολογική-στοίβα)
5. [Αρχιτεκτονική Συστήματος](#5-αρχιτεκτονική-συστήματος)

Για λεπτομέρειες δείτε:
- [DATABASE.md](./DATABASE.md) - Σχήμα βάσης δεδομένων
- [API.md](./API.md) - REST API Endpoints
- [WORKFLOWS.md](./WORKFLOWS.md) - Ροές χρηστών & διαγράμματα
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Οδηγίες deployment

---

## 1. Επισκόπηση Έργου

### 1.1 Σκοπός
Η **Fast Delivery** είναι μια full-stack web εφαρμογή που συνδέει:
- **Πελάτες** (guest users) με
- **Καταστήματα** (stores) μέσω
- **Διανομέων** (delivery drivers) υπό την
- **Εποπτεία διαχειριστή** (admin)

### 1.2 Γεωγραφική Περιοχή (MVP)
- **Μόνο Αλεξανδρούπολη** για το MVP
- Επέκταση σε άλλες πόλεις σε μελλοντικές φάσεις

### 1.3 Βασική Ροή Παραγγελίας
```
Πελάτης → Παραγγελία (κείμενο/φωνή) 
  ↓
Κατάστημα → Αποδοχή + Τιμολόγηση προϊόντων
  ↓
Admin → Προσθήκη κόστους αποστολής + Ανάθεση σε Διανομέα
  ↓
Πελάτης → Επιβεβαίωση τελικής τιμής
  ↓
Διανομέας → Παραλαβή + Παράδοση
  ↓
Ολοκλήρωση (Πληρωμή με μετρητά)
```

---

## 2. Ρόλοι Χρηστών

### 2.1 Πελάτης (Customer - Guest User)
**Εγγραφή:** Όχι - Guest checkout μόνο  
**Στοιχεία εισόδου:**
- Όνομα (πλήρες)
- Τηλέφωνο (10ψήφιο)
- Διεύθυνση παράδοσης (ελεύθερο κείμενο)

**Δυνατότητες:**
- ✅ Υποβολή παραγγελίας (κείμενο ή φωνή)
- ✅ Επιλογή καταστήματος από διαθέσιμα
- ✅ Επιβεβαίωση/Ακύρωση τελικής τιμής
- ✅ Παρακολούθηση real-time κατάστασης παραγγελίας
- ✅ Λήψη in-app ειδοποιήσεων
- ✅ Προβολή ιστορικού παραγγελιών (μόνο για guest που **ξαναχρησιμοποιεί το ίδιο τηλέφωνο** - προαιρετικό)
- ❌ Δεν μπορεί να ακυρώσει μετά την αποδοχή από κατάστημα

**Περιορισμοί:**
- Δεν αποθηκεύονται μόνιμα credentials
- Κάθε παραγγελία είναι ανεξάρτητη (one-time checkout)
- Μία διεύθυνση ανά παραγγελία

---

### 2.2 Διαχειριστής (Admin)
**Εγγραφή:** Προκαθορισμένος λογαριασμός (hardcoded ή manual DB insert)  
**Στοιχεία σύνδεσης:**
- Email + Password (JWT authentication)

**Δυνατότητες:**
- ✅ Έγκριση/Απόρριψη εγγραφών καταστημάτων
- ✅ Έγκριση/Απόρριψη εγγραφών διανομέων
- ✅ Προβολή όλων των παραγγελιών (real-time)
- ✅ Προσθήκη κόστους αποστολής (χειροκίνητα ανά παραγγελία)
- ✅ Ανάθεση παραγγελίας σε online διανομέα
- ✅ Ακύρωση παραγγελίας (οποτεδήποτε)
- ✅ Διαχείριση χρηστών (προβολή, απενεργοποίηση πελατών)
- ✅ Προβολή στατιστικών & dashboards
- ✅ Chat με καταστήματα/διανομείς (κείμενο + voice notes)

**Στατιστικά Dashboard:**
- Συνολικές παραγγελίες (ανά κατάσταση)
- Συνολικά έσοδα (άθροισμα delivery fees)
- Ενεργά καταστήματα/διανομείς
- Παραγγελίες σήμερα/εβδομάδα/μήνα
- Γραφήματα (charts - π.χ., Chart.js)

---

### 2.3 Κατάστημα (Store Manager)
**Εγγραφή:** Αίτηση με στοιχεία → Έγκριση από Admin  
**Στοιχεία εγγραφής:**
- Όνομα επιχείρησης
- ΑΦΜ (9 ψηφία - υποχρεωτικό, validation)
- Διεύθυνση (πλήρης)
- Τηλέφωνο επικοινωνίας
- Email + Password
- Τύπος καταστήματος (dropdown):
  - Mini Market
  - Φαρμακείο
  - Ταβέρνα
  - Καφετέρια
  - Άλλο
- Ωράριο λειτουργίας (ελεύθερο κείμενο, π.χ., "Δευ-Παρ: 08:00-22:00")
- Περιοχές εξυπηρέτησης (ελεύθερο κείμενο, π.χ., "Κέντρο, Φλοίσβος")

**Δυνατότητες:**
- ✅ Προβολή εισερχόμενων παραγγελιών (real-time)
- ✅ Αποδοχή/Απόρριψη παραγγελιών
- ✅ Εισαγωγή τιμής προϊόντων (χειροκίνητα)
- ✅ Ενημέρωση κατάστασης σε "Ετοιμάζεται"
- ✅ Chat με Admin/Διανομέα (κείμενο + voice)
- ✅ Επεξεργασία προφίλ (ωράριο, περιοχές)
- ❌ Δεν βλέπει το κόστος αποστολής (το προσθέτει ο Admin)

**Ειδική Σημείωση:**
- Για παραγγελίες με **φωνή**, το κατάστημα ακούει το ηχητικό αρχείο και γράφει χειροκίνητα τα προϊόντα

---

### 2.4 Διανομέας (Driver)
**Εγγραφή:** Αίτηση με στοιχεία → Έγκριση από Admin  
**Στοιχεία εγγραφής:**
- Όνομα (πλήρες)
- Τηλέφωνο
- Email + Password

**Δυνατότητες:**
- ✅ Ενεργοποίηση/Απενεργοποίηση διαθεσιμότητας (online/offline toggle)
- ✅ Προβολή ανατεθειμένων παραγγελιών
- ✅ Αποδοχή/Απόρριψη ανάθεσης
- ✅ Προβολή λεπτομερειών παραγγελίας (διεύθυνση παραλαβής/παράδοσης)
- ✅ Ενημέρωση κατάστασης σε "Σε Παράδοση"
- ✅ Ενημέρωση κατάστασης σε "Ολοκληρώθηκε"
- ✅ Chat με Admin/Κατάστημα (κείμενο + voice)
- ❌ Δεν έχει live GPS tracking (μόνο manual status updates)

**Περιορισμοί:**
- Μία παραγγελία τη φορά (concurrent orders = 1)
- Παραμένει "online" ενώ εκτελεί παραγγελία
- Ο Admin βλέπει μόνο online διανομείς κατά την ανάθεση

---

## 3. Βασικές Λειτουργίες

### 3.1 Παραγγελία (MVP - Φάση 1)

#### 3.1.1 Τρόποι Υποβολής
1. **Κείμενο (Text Input)**
   - Ελεύθερη φόρμα (π.χ., "2 πακέτα πάνες Pampers, 6 κόκα-κόλα")
   - Κανένας κατάλογος προϊόντων

2. **Φωνή (Voice Recording)**
   - Ηχογράφηση μηνύματος (όπως WhatsApp voice note)
   - Αποθήκευση σε Firebase Storage
   - Το κατάστημα ακούει και μετατρέπει χειροκίνητα

#### 3.1.2 Ροή Τιμολόγησης (ΚΡΙΣΙΜΗ)
```
1. Πελάτης υποβάλλει παραγγελία (κείμενο/φωνή)
   ↓
2. Κατάστημα βλέπει παραγγελία → Αποδέχεται
   ↓
3. Κατάστημα εισάγει τιμή προϊόντων (π.χ., 25.00€)
   ↓
4. Admin βλέπει παραγγελία με τιμή προϊόντων
   ↓
5. Admin προσθέτει κόστος αποστολής (χειροκίνητα, π.χ., 3.00€)
   ↓
6. Τελική τιμή: 28.00€
   ↓
7. Πελάτης βλέπει τελική τιμή και επιβεβαιώνει/ακυρώνει
   ↓
8. (Αν επιβεβαιώσει) Admin αναθέτει σε διανομέα
```

**Σημαντικό:** Ο πελάτης **ΔΕΝ** βλέπει τιμή κατά την υποβολή—μόνο μετά την επεξεργασία από κατάστημα + Admin.

#### 3.1.3 Καταστάσεις Παραγγελίας
| Κατάσταση | Ορισμός | Ποιος ενημερώνει |
|-----------|---------|------------------|
| `pending_store` | Αναμονή αποδοχής από κατάστημα | Αυτόματο (default) |
| `pricing` | Κατάστημα προσθέτει τιμή | Κατάστημα |
| `pending_admin` | Αναμονή Admin για delivery cost | Αυτόματο |
| `pending_customer_confirm` | Αναμονή επιβεβαίωσης από πελάτη | Αυτόματο |
| `confirmed` | Πελάτης επιβεβαίωσε τιμή | Πελάτης |
| `assigned` | Admin ανέθεσε σε διανομέα | Admin |
| `accepted_driver` | Διανομέας αποδέχτηκε | Διανομέας |
| `preparing` | Κατάστημα ετοιμάζει | Κατάστημα |
| `in_delivery` | Διανομέας παραδίδει | Διανομέας |
| `completed` | Ολοκληρώθηκε | Διανομέας |
| `cancelled` | Ακυρώθηκε | Admin ή Πελάτης (πριν τιμολόγηση) |
| `rejected_store` | Απορρίφθηκε από κατάστημα | Κατάστημα |
| `rejected_driver` | Απορρίφθηκε από διανομέα | Διανομέας |

---

### 3.2 Real-time Λειτουργίες (Socket.IO)

#### 3.2.1 Ειδοποιήσεις (In-App Notifications)
| Γεγονός | Παραλήπτης | Μήνυμα |
|---------|-----------|--------|
| Νέα παραγγελία | Κατάστημα | "Νέα παραγγελία από [Όνομα πελάτη]" |
| Αποδοχή/Απόρριψη καταστήματος | Πελάτης | "Η παραγγελία σας έγινε αποδεκτή/απορρίφθηκε" |
| Τελική τιμή έτοιμη | Πελάτης | "Η παραγγελία σας τιμολογήθηκε: [Ποσό]€" |
| Ανάθεση σε διανομέα | Διανομέας | "Νέα ανάθεση παραγγελίας" |
| Αλλαγή κατάστασης | Πελάτης, Κατάστημα, Admin | "[Κατάσταση] - Παραγγελία #[ID]" |
| Ολοκλήρωση | Όλοι | "Παραγγελία #[ID] ολοκληρώθηκε" |

#### 3.2.2 Chat (Real-time Messaging)
**Συμμετέχοντες:**
- Admin ↔ Κατάστημα
- Admin ↔ Διανομέας
- Κατάστημα ↔ Διανομέας
- Πελάτης ↔ Κατάστημα (προαιρετικά - για διευκρινίσεις)

**Τύποι μηνυμάτων:**
- Κείμενο (text)
- Ηχογράφηση (voice note - αποθηκευμένη σε Firebase Storage)

---

### 3.3 Πληρωμές (MVP)

**Μέθοδος:** Μόνο **μετρητά κατά την παράδοση**

**Ροή χρημάτων:**
```
1. Διανομέας πληρώνει κατάστημα (από χρήματα Admin) ΠΡΙΝ την παραλαβή
   ↓
2. Διανομέας παραλαμβάνει προϊόντα
   ↓
3. Διανομέας παραδίδει στον πελάτη
   ↓
4. Πελάτης πληρώνει διανομέα (π.χ., 28€)
   ↓
5. Διανομέας κρατάει το delivery fee (π.χ., 3€)
   ↓
6. Διανομέας δίνει το υπόλοιπο (25€) στον Admin
   ↓
7. Admin εξοφλεί κατάστημα σε μεταγενέστερο χρόνο
```

**Σημείωση:** Το σύστημα **ΔΕΝ** διαχειρίζεται χρηματικές συναλλαγές—μόνο tracking των ποσών.

---

### 3.4 Χάρτες (Google Maps)

**Χρήση:**
- Εμφάνιση καταστημάτων σε χάρτη (για πελάτη)
- Admin βλέπει διευθύνσεις παραγγελιών σε χάρτη (για χειροκίνητο υπολογισμό απόστασης)

**ΔΕΝ υλοποιείται:**
- ❌ Live GPS tracking διανομέα
- ❌ Αυτόματος υπολογισμός απόστασης (Distance Matrix API)
- ❌ Route optimization

**Δωρεάν tier:** 28,000 χάρτες/μήνα (Google Maps JavaScript API)

---

## 4. Τεχνολογική Στοίβα

### 4.1 Frontend
- **Framework:** React 18+
- **UI Library:** Bootstrap 5 (responsive)
- **State Management:** Redux Toolkit ή Zustand
- **Routing:** React Router v6 (role-based routes)
- **Real-time:** Socket.IO Client
- **HTTP Client:** Axios
- **Maps:** Google Maps JavaScript API
- **Charts:** Chart.js (για Admin dashboard)
- **Voice Recording:** MediaRecorder API (browser native)

### 4.2 Backend
- **Runtime:** Node.js 18+ LTS
- **Framework:** Express.js
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **Real-time:** Socket.IO
- **File Upload:** Multer (για voice files)
- **Validation:** express-validator
- **CORS:** cors middleware

### 4.3 Database
- **Primary DB:** MongoDB Atlas (free tier 512MB)
- **ODM:** Mongoose
- **Collections:** users, stores, drivers, orders, chats, notifications

### 4.4 File Storage
- **Voice Messages:** Firebase Storage (5GB δωρεάν)
- **SDK:** firebase-admin

### 4.5 Deployment
- **Backend:** Render.com (free tier - 1 instance)
- **Frontend:** Vercel ή Netlify (δωρεάν static hosting)
- **Database:** MongoDB Atlas (free tier)
- **Environment:** Production-ready με environment variables

### 4.6 Περιορισμοί Δωρεάν Tiers
| Υπηρεσία | Περιορισμός | Επίπτωση |
|----------|-------------|----------|
| Render | Cold start μετά 15' αδράνειας | Πρώτο request ~30-60s delay |
| MongoDB Atlas | 512MB storage | Αρκετό για ~10,000+ παραγγελίες |
| Firebase Storage | 5GB, 1GB/day downloads | Αρκετό για voice messages MVP |
| Google Maps | 28,000 loads/μήνα | Αρκετό για χαμηλό traffic |

---

## 5. Αρχιτεκτονική Συστήματος

### 5.1 Δομή Project
```
FastDelivery/
├── fast-delivery-backend/
│   ├── src/
│   │   ├── config/          # DB, Firebase, JWT config
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API endpoints
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── sockets/         # Socket.IO handlers
│   │   └── utils/           # Helper functions
│   ├── uploads/             # Temporary voice file storage
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── fast-delivery-frontend/
│   ├── src/
│   │   ├── components/      # Shared components
│   │   ├── pages/
│   │   │   ├── Customer/    # Guest order flow
│   │   │   ├── Admin/       # Admin dashboard
│   │   │   ├── Store/       # Store manager panel
│   │   │   └── Driver/      # Driver app
│   │   ├── context/         # React Context (auth, socket)
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API calls (axios)
│   │   ├── utils/           # Helpers
│   │   └── App.js
│   ├── public/
│   ├── .env
│   └── package.json
│
└── docs/                    # Αυτό το έγγραφο
```

### 5.2 Role-Based Routing (Frontend)
```javascript
// Παράδειγμα δομής (χωρίς κώδικα)
/                     → Landing page (επιλογή ρόλου)
/customer             → Guest order flow
/login                → Login για Store/Driver/Admin
/admin/dashboard      → Admin panel (protected)
/store/dashboard      → Store panel (protected)
/driver/dashboard     → Driver panel (protected)
```

**Authentication Flow:**
1. Store/Driver/Admin → Login με email/password
2. Backend επιστρέφει JWT token με role
3. Frontend αποθηκεύει σε localStorage
4. Protected routes ελέγχουν role πριν render

---

## Επόμενα Βήματα

Δείτε τα παρακάτω έγγραφα για λεπτομέρειες:

1. **[DATABASE.md](./DATABASE.md)** - Πλήρες MongoDB schema
2. **[API.md](./API.md)** - REST API endpoints & request/response examples
3. **[WORKFLOWS.md](./WORKFLOWS.md)** - User flows & state diagrams
4. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Οδηγίες deployment & env vars

---

**Τελευταία ενημέρωση:** 18/11/2025  
**Έγκριση:** Εκκρεμεί review
