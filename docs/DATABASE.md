# Fast Delivery - Database Schema (MongoDB)

**Database:** MongoDB Atlas  
**ODM:** Mongoose  
**Τελευταία ενημέρωση:** 01/12/2025

---

## Πίνακας Περιεχομένων

1. [admins](#1-collection-admins)
2. [stores](#2-collection-stores)
3. [drivers](#3-collection-drivers)
4. [customers](#4-collection-customers)
5. [orders](#5-collection-orders)
6. [settings](#6-collection-settings)
7. [monthlyexpenses](#7-collection-monthlyexpenses)
8. [users](#8-collection-users-legacy)
9. [Relationships](#relationships)
10. [Order Status Flow](#order-status-flow)

---

## 1. Collection: `admins`

**Σκοπός:** Διαχειριστές συστήματος

```javascript
{
  _id: ObjectId,
  name: String,                    // Όνομα (required)
  email: String,                   // Email (required, unique, lowercase)
  password: String,                // Hashed bcrypt (required, min 6 chars, select: false)
  role: String,                    // Default: 'admin'
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email` (unique)

**Validation:**
- `email`: `/^\S+@\S+\.\S+$/`
- `password`: min 6 χαρακτήρες

**Methods:**
- `comparePassword(candidatePassword)` → Boolean

---

## 2. Collection: `stores`

**Σκοπός:** Καταστήματα/Επιχειρήσεις

```javascript
{
  _id: ObjectId,
  businessName: String,            // Όνομα επιχείρησης (required)
  afm: String,                     // ΑΦΜ 9ψήφιο (required, unique)
  email: String,                   // Email (required, unique, lowercase)
  password: String,                // Hashed bcrypt (required, select: false)
  phone: String,                   // Τηλέφωνο (required)
  address: String,                 // Διεύθυνση (required)
  location: {
    type: "Point",                 // GeoJSON type
    coordinates: [Number, Number]  // [longitude, latitude]
  },
  storeType: String,               // Τύπος καταστήματος (dynamic from Settings)
  workingHours: String,            // Default: "Δευ-Παρ: 08:00-22:00"
  description: String,             // Περιγραφή
  serviceAreas: String,            // Περιοχές εξυπηρέτησης
  status: String,                  // Enum: pending | approved | rejected | inactive
  isApproved: Boolean,             // Default: false
  
  // Email Verification
  isEmailVerified: Boolean,        // Default: false
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Password Reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email` (unique)
- `afm` (unique)
- `location` (2dsphere - geospatial)
- `status`

**Validation:**
- `afm`: `/^\d{9}$/` (9 ψηφία)
- `email`: `/^\S+@\S+\.\S+$/`

---

## 3. Collection: `drivers`

**Σκοπός:** Διανομείς

```javascript
{
  _id: ObjectId,
  name: String,                    // Όνομα (required)
  email: String,                   // Email (required, unique, lowercase)
  password: String,                // Hashed bcrypt (required, select: false)
  phone: String,                   // Τηλέφωνο (required)
  vehicle: String,                 // Τύπος οχήματος (default: "Μοτοσυκλέτα")
  licensePlate: String,            // Πινακίδα
  status: String,                  // Enum: pending | approved | rejected | inactive
  isApproved: Boolean,             // Default: false
  isOnline: Boolean,               // Διαθεσιμότητα (default: false)
  currentOrder: ObjectId,          // Reference → Order (null αν ελεύθερος)
  
  // Email Verification
  isEmailVerified: Boolean,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Password Reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Push Notifications
  pushToken: String,               // Expo push token
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email` (unique)
- `isOnline`
- `status`

**Business Rule:**
- Ένας driver μπορεί να έχει μόνο 1 `currentOrder` τη φορά

---

## 4. Collection: `customers`

**Σκοπός:** Εγγεγραμμένοι πελάτες (με login)

```javascript
{
  _id: ObjectId,
  name: String,                    // Όνομα (required)
  email: String,                   // Email (required, unique, lowercase)
  password: String,                // Hashed bcrypt (required, select: false)
  phone: String,                   // 10ψήφιο (required)
  address: String,                 // Διεύθυνση (required)
  location: {
    type: "Point",
    coordinates: [Number, Number]  // [longitude, latitude]
  },
  role: String,                    // Default: 'customer'
  isActive: Boolean,               // Default: true
  
  // Push Notifications
  pushToken: String,
  
  // Email Verification
  isEmailVerified: Boolean,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Password Reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Soft Delete
  isDeleted: Boolean,              // Default: false
  deletedAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Validation:**
- `phone`: `/^\d{10}$/` (10 ψηφία)
- `email`: `/^\S+@\S+\.\S+$/`

---

## 5. Collection: `orders`

**Σκοπός:** Παραγγελίες

```javascript
{
  _id: ObjectId,
  orderNumber: String,             // Auto-generated: ORD-YYYYMMDD-XXXX (unique)
  
  // Customer Info (embedded)
  customer: {
    name: String,                  // Required
    phone: String,                 // 10ψήφιο (required)
    email: String,                 // Optional
    address: String                // Διεύθυνση παράδοσης (required)
  },
  
  // Delivery Location (geocoded)
  deliveryLocation: {
    type: "Point",
    coordinates: [Number, Number]  // [longitude, latitude]
  },
  
  // Order Content
  orderType: String,               // Enum: text | voice
  orderContent: String,            // Κείμενο παραγγελίας
  orderVoiceUrl: String,           // Firebase Storage URL (για voice orders)
  
  // Store (denormalized)
  storeId: ObjectId,               // Reference → Store
  storeName: String,               // Denormalized για ταχύτητα
  
  // Pricing
  productPrice: Number,            // Τιμή προϊόντων (από Store)
  deliveryFee: Number,             // Κόστος αποστολής (από Admin)
  totalPrice: Number,              // productPrice + deliveryFee
  
  // Driver (denormalized)
  driverId: ObjectId,              // Reference → Driver (null μέχρι ανάθεση)
  driverName: String,              // Denormalized
  
  // Status
  status: String,                  // Enum (βλέπε παρακάτω)
  statusHistory: [{
    status: String,
    updatedBy: String,             // customer | store | driver | admin | system
    timestamp: Date
  }],
  
  // Timestamps
  confirmedAt: Date,               // Πότε επιβεβαίωσε ο πελάτης
  completedAt: Date,               // Πότε ολοκληρώθηκε
  createdAt: Date,
  updatedAt: Date
}
```

**Status Enum:**
```javascript
[
  'pending_store',           // Αναμονή αποδοχής από κατάστημα
  'pricing',                 // Κατάστημα προσθέτει τιμή
  'pending_admin',           // Αναμονή Admin για delivery fee
  'pending_customer_confirm',// Αναμονή επιβεβαίωσης πελάτη
  'confirmed',               // Πελάτης επιβεβαίωσε
  'assigned',                // Admin ανέθεσε σε διανομέα
  'accepted_driver',         // Διανομέας αποδέχτηκε
  'preparing',               // Κατάστημα ετοιμάζει
  'in_delivery',             // Σε παράδοση
  'completed',               // Ολοκληρώθηκε
  'cancelled',               // Ακυρώθηκε
  'rejected_store',          // Απόρριψη από κατάστημα
  'rejected_driver'          // Απόρριψη από διανομέα
]
```

**Indexes:**
- `orderNumber` (unique)
- `storeId`
- `driverId`
- `status`
- `createdAt` (descending)
- `customer.phone`

**Auto-generated Order Number:**
```
ORD-20251201-0001  (format: ORD-YYYYMMDD-XXXX)
```

---

## 6. Collection: `settings`

**Σκοπός:** Ρυθμίσεις συστήματος (Singleton pattern)

```javascript
{
  _id: ObjectId,
  key: String,                     // Default: 'main' (unique)
  
  driverSalary: Number,            // Μισθός διανομέα (default: 800)
  defaultDeliveryFee: Number,      // Προεπιλεγμένο κόστος (default: 3)
  serviceArea: String,             // Περιοχή εξυπηρέτησης (default: "Αλεξανδρούπολη")
  
  // Store Types (dynamic with icons)
  storeTypes: [{
    name: String,                  // Όνομα τύπου
    icon: String                   // Emoji icon (default: '🏪')
  }],
  
  // Service Hours
  serviceHoursEnabled: Boolean,    // Ενεργοποίηση ωραρίου
  serviceHoursStart: String,       // "09:00"
  serviceHoursEnd: String,         // "23:00"
  
  createdAt: Date,
  updatedAt: Date
}
```

**Default Store Types:**
```javascript
[
  { name: 'Mini Market', icon: '🛒' },
  { name: 'Φαρμακείο', icon: '💊' },
  { name: 'Ταβέρνα', icon: '🍔' },
  { name: 'Καφετέρια', icon: '☕' },
  { name: 'Γλυκά', icon: '🍰' },
  { name: 'Πιτσαρία', icon: '🍕' },
  { name: 'Σουβλατζίδικο', icon: '🥙' },
  { name: 'Αρτοποιείο', icon: '🥖' },
  { name: 'Κάβα', icon: '🍷' },
  { name: 'Ανθοπωλείο', icon: '💐' },
  { name: 'Άλλο', icon: '🏪' }
]
```

**Static Methods:**
- `getSettings()` → Settings (creates default if not exists)
- `updateSettings(updates)` → Settings

---

## 7. Collection: `monthlyexpenses`

**Σκοπός:** Μηνιαία έξοδα

```javascript
{
  _id: ObjectId,
  year: Number,                    // Έτος (required)
  month: Number,                   // Μήνας 1-12 (required)
  amount: Number,                  // Ποσό εξόδων (default: 0)
  notes: String,                   // Σημειώσεις (max 500 chars)
  updatedBy: ObjectId,             // Reference → Admin
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ year, month }` (compound unique)

**Static Methods:**
- `getOrCreateForMonth(year, month)` → MonthlyExpense
- `updateForMonth(year, month, amount, notes, adminId)` → MonthlyExpense

---

## 8. Collection: `users` (Legacy)

**Σκοπός:** Guest χρήστες (παλιό schema, για backward compatibility)

```javascript
{
  _id: ObjectId,
  name: String,                    // Required
  email: String,                   // Optional (sparse unique)
  password: String,                // Optional
  phone: String,                   // 10ψήφιο (required)
  address: String,
  isActive: Boolean,               // Default: true
  pushToken: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `phone`
- `email` (unique, sparse - allows null)

**Σημείωση:** Χρησιμοποιείται κυρίως για guest checkouts. Νέοι εγγεγραμμένοι πελάτες αποθηκεύονται στο `customers` collection.

---

## Relationships

```
┌─────────────┐     ┌─────────────┐
│   admins    │     │  settings   │
└─────────────┘     └─────────────┘
       │                   │
       │ updatedBy         │ storeTypes
       ▼                   ▼
┌─────────────────┐  ┌─────────────┐
│ monthlyexpenses │  │   stores    │
└─────────────────┘  └─────────────┘
                           │
                           │ storeId
                           ▼
┌─────────────┐     ┌─────────────┐
│  customers  │────▶│   orders    │◀────┌─────────────┐
└─────────────┘     └─────────────┘     │   drivers   │
  (customer info        │               └─────────────┘
   embedded)            │                     │
                        │ driverId            │
                        │◀────────────────────┘
                        │ currentOrder
```

**References:**
- `orders.storeId` → `stores._id`
- `orders.driverId` → `drivers._id`
- `drivers.currentOrder` → `orders._id`
- `monthlyexpenses.updatedBy` → `admins._id`

**Denormalization (για performance):**
- `orders.storeName` (αντί για populate)
- `orders.driverName` (αντί για populate)

---

## Order Status Flow

```
                    ┌──────────────────┐
                    │   ORDER CREATED  │
                    │  pending_store   │
                    └────────┬─────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                │
   ┌─────────────┐    ┌─────────────┐        │
   │rejected_store│    │   pricing   │        │
   └─────────────┘    └──────┬──────┘        │
         END                 │               │
                             ▼               │
                    ┌─────────────────┐      │
                    │  pending_admin  │      │
                    └────────┬────────┘      │
                             │               │
                             ▼               │
                ┌─────────────────────────┐  │
                │ pending_customer_confirm │  │
                └───────────┬─────────────┘  │
                            │                │
          ┌─────────────────┼───────┐        │
          │                 │       │        │
          ▼                 ▼       ▼        │
  ┌──────────────┐   ┌──────────┐  ┌────────┴─┐
  │rejected_customer│ │confirmed │  │cancelled │
  └──────────────┘   └────┬─────┘  └──────────┘
        END               │             END
                          ▼
                   ┌─────────────┐
                   │  assigned   │
                   └──────┬──────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               │
  ┌───────────────┐ ┌──────────────┐      │
  │rejected_driver│ │accepted_driver│      │
  └───────────────┘ └──────┬───────┘      │
     (back to admin)       │              │
                           ▼              │
                    ┌─────────────┐       │
                    │  preparing  │       │
                    └──────┬──────┘       │
                           │              │
                           ▼              │
                    ┌─────────────┐       │
                    │ in_delivery │       │
                    └──────┬──────┘       │
                           │              │
                           ▼              │
                    ┌─────────────┐       │
                    │  completed  │◀──────┘
                    └─────────────┘
                         END
```

---

## Seed Data Credentials

Για testing (μετά από `node tests/seedData.js`):

| Role     | Email                    | Password   |
|----------|--------------------------|------------|
| Admin    | admin@fastdelivery.gr    | admin123   |
| Store    | store1@test.com          | store123   |
| Driver   | driver1@test.com         | driver123  |
| Customer | customer1@test.com       | customer123|

---

## Backup & Data Retention

**MongoDB Atlas Free Tier:**
- Αυτόματα snapshots κάθε 24 ώρες
- Retention: 2 ημέρες

**Προτεινόμενη πολιτική διατήρησης:**

| Collection      | Retention  | Λόγος                          |
|-----------------|------------|--------------------------------|
| orders          | 2 χρόνια   | Νομικές/φορολογικές υποχρεώσεις|
| customers       | GDPR       | Anonymization μετά διαγραφή    |
| monthlyexpenses | 5 χρόνια   | Λογιστικό αρχείο               |
| settings        | Διαρκής    | Configuration                  |
