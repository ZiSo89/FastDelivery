# Fast Delivery - Database Schema (MongoDB)

**Συλλογές (Collections):**
1. users (Πελάτες - Guest data)
2. stores (Καταστήματα)
3. drivers (Διανομείς)
4. admins (Διαχειριστές)
5. orders (Παραγγελίες)
6. chats (Μηνύματα)
7. notifications (Ειδοποιήσεις)

---

## 1. Collection: `users`
**Σκοπός:** Αποθήκευση στοιχείων πελατών (guest checkout)

```javascript
{
  _id: ObjectId,
  name: String,              // Πλήρες όνομα
  phone: String,             // 10ψήφιο τηλέφωνο (unique per order)
  isActive: Boolean,         // true/false (για απενεργοποίηση από Admin)
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `phone` (για γρήγορη αναζήτηση ιστορικού)

**Σημείωση:** Κάθε παραγγελία δημιουργεί νέο user document (δεν υπάρχει authentication).

---

## 2. Collection: `stores`
**Σκοπός:** Πληροφορίες καταστημάτων

```javascript
{
  _id: ObjectId,
  businessName: String,                 // Όνομα επιχείρησης
  afm: String,                          // ΑΦΜ (9 ψηφία, unique)
  email: String,                        // Email (unique)
  password: String,                     // Hashed (bcrypt)
  phone: String,                        // Τηλέφωνο επικοινωνίας
  address: String,                      // Πλήρης διεύθυνση
  location: {                           // Google Maps coordinates
    type: "Point",
    coordinates: [Number, Number]       // [longitude, latitude]
  },
  storeType: String,                    // Enum: "Mini Market", "Φαρμακείο", "Ταβέρνα", "Καφετέρια", "Άλλο"
  workingHours: String,                 // Ελεύθερο κείμενο (π.χ., "Δευ-Παρ: 08:00-22:00")
  serviceAreas: String,                 // Ελεύθερο κείμενο (π.χ., "Κέντρο, Φλοίσβος")
  status: String,                       // Enum: "pending", "approved", "rejected", "inactive"
  isApproved: Boolean,                  // true μετά από έγκριση Admin
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email` (unique)
- `afm` (unique)
- `location` (geospatial index για maps)
- `status`

**Validation:**
- `afm`: Regex `/^\d{9}$/` (9 ψηφία)
- `email`: Valid email format
- `storeType`: Μόνο από predefined list

---

## 3. Collection: `drivers`
**Σκοπός:** Πληροφορίες διανομέων

```javascript
{
  _id: ObjectId,
  name: String,                         // Πλήρες όνομα
  email: String,                        // Email (unique)
  password: String,                     // Hashed (bcrypt)
  phone: String,                        // Τηλέφωνο
  status: String,                       // Enum: "pending", "approved", "rejected", "inactive"
  isApproved: Boolean,                  // true μετά από έγκριση Admin
  isOnline: Boolean,                    // true/false (availability toggle)
  currentOrder: ObjectId,               // Reference to orders collection (null αν ελεύθερος)
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email` (unique)
- `isOnline` (για γρήγορο φιλτράρισμα διαθέσιμων)
- `status`

**Business Rule:**
- `currentOrder` !== null → Διανομέας έχει ενεργή παραγγελία
- Ένας διανομέας μπορεί να έχει μόνο 1 `currentOrder` τη φορά

---

## 4. Collection: `admins`
**Σκοπός:** Διαχειριστές συστήματος

```javascript
{
  _id: ObjectId,
  name: String,                         // Όνομα διαχειριστή
  email: String,                        // Email (unique)
  password: String,                     // Hashed (bcrypt)
  role: String,                         // "admin" (για μελλοντική επέκταση ρόλων)
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email` (unique)

**Σημείωση:** Για MVP, 1 admin hardcoded ή manual DB insert.

---

## 5. Collection: `orders`
**Σκοπός:** Κεντρική συλλογή παραγγελιών

```javascript
{
  _id: ObjectId,
  orderNumber: String,                  // Μοναδικός αριθμός (π.χ., "ORD-20251118-0001")
  
  // Πελάτης
  customer: {
    name: String,
    phone: String,
    address: String                     // Διεύθυνση παράδοσης
  },
  
  // Παραγγελία
  orderType: String,                    // Enum: "text", "voice"
  orderContent: String,                 // Κείμενο παραγγελίας (αν text)
  orderVoiceUrl: String,                // Firebase Storage URL (αν voice)
  
  // Κατάστημα
  storeId: ObjectId,                    // Reference to stores
  storeName: String,                    // Denormalized για ταχύτητα
  
  // Τιμολόγηση
  productPrice: Number,                 // Τιμή προϊόντων (από κατάστημα)
  deliveryFee: Number,                  // Κόστος αποστολής (από Admin)
  totalPrice: Number,                   // productPrice + deliveryFee
  
  // Διανομέας
  driverId: ObjectId,                   // Reference to drivers (null μέχρι ανάθεση)
  driverName: String,                   // Denormalized
  
  // Κατάσταση
  status: String,                       // Enum (βλέπε παρακάτω)
  statusHistory: [                      // Ιστορικό αλλαγών
    {
      status: String,
      updatedBy: String,                // "customer", "store", "driver", "admin"
      timestamp: Date
    }
  ],
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  confirmedAt: Date,                    // Πότε επιβεβαιώθηκε από πελάτη
  completedAt: Date                     // Πότε ολοκληρώθηκε
}
```

**Status Enum:**
```javascript
[
  "pending_store",              // Αναμονή αποδοχής από κατάστημα
  "pricing",                    // Κατάστημα προσθέτει τιμή
  "pending_admin",              // Αναμονή Admin για delivery fee
  "pending_customer_confirm",   // Αναμονή επιβεβαίωσης από πελάτη
  "confirmed",                  // Πελάτης επιβεβαίωσε
  "assigned",                   // Admin ανέθεσε σε διανομέα
  "accepted_driver",            // Διανομέας αποδέχτηκε
  "preparing",                  // Κατάστημα ετοιμάζει
  "in_delivery",                // Διανομέας παραδίδει
  "completed",                  // Ολοκληρώθηκε
  "cancelled",                  // Ακυρώθηκε (από Admin ή πελάτη πριν τιμολόγηση)
  "rejected_store",             // Απορρίφθηκε από κατάστημα
  "rejected_driver"             // Απορρίφθηκε από διανομέα
]
```

**Indexes:**
- `orderNumber` (unique)
- `storeId`
- `driverId`
- `status`
- `createdAt` (για ταξινόμηση)

**Validation:**
- `customer.phone`: Regex `/^\d{10}$/` (10 ψηφία)
- `totalPrice = productPrice + deliveryFee` (backend validation)

---

## 6. Collection: `chats`
**Σκοπός:** Real-time messaging μεταξύ ρόλων

```javascript
{
  _id: ObjectId,
  orderId: ObjectId,                    // Reference to orders (αν σχετίζεται με παραγγελία)
  participants: [String],               // Array of roles: ["admin", "store:123", "driver:456"]
  messages: [
    {
      _id: ObjectId,                    // Μοναδικό ID μηνύματος
      senderId: ObjectId,               // User ID (admin/store/driver)
      senderRole: String,               // "admin", "store", "driver", "customer"
      messageType: String,              // "text", "voice"
      content: String,                  // Text content (αν text)
      voiceUrl: String,                 // Firebase Storage URL (αν voice)
      timestamp: Date,
      isRead: Boolean
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `orderId`
- `participants` (multikey index)
- `messages.timestamp` (για ταξινόμηση)

**Σημείωση:** 
- Ένα chat document ανά ζεύγος συμμετεχόντων ανά παραγγελία
- Για general admin-store chat (χωρίς παραγγελία), `orderId = null`

---

## 7. Collection: `notifications`
**Σκοπός:** Ιστορικό in-app notifications

```javascript
{
  _id: ObjectId,
  recipientId: ObjectId,                // User ID (admin/store/driver/customer)
  recipientRole: String,                // "admin", "store", "driver", "customer"
  orderId: ObjectId,                    // Reference to orders (αν σχετίζεται)
  type: String,                         // Enum: "order_created", "order_accepted", "price_ready", etc.
  title: String,                        // Τίτλος ειδοποίησης
  message: String,                      // Κείμενο
  isRead: Boolean,                      // true/false
  createdAt: Date
}
```

**Notification Types (Enum):**
```javascript
[
  "order_created",           // Νέα παραγγελία (→ Store)
  "order_accepted",          // Αποδοχή από κατάστημα (→ Customer)
  "order_rejected_store",    // Απόρριψη από κατάστημα (→ Customer)
  "price_ready",             // Τιμή έτοιμη (→ Customer)
  "order_confirmed",         // Πελάτης επιβεβαίωσε (→ Admin)
  "order_cancelled",         // Ακύρωση (→ όλους)
  "driver_assigned",         // Ανάθεση σε διανομέα (→ Driver)
  "driver_accepted",         // Αποδοχή από διανομέα (→ Admin, Store)
  "driver_rejected",         // Απόρριψη από διανομέα (→ Admin)
  "order_preparing",         // Ετοιμάζεται (→ Customer, Driver)
  "order_in_delivery",       // Σε παράδοση (→ Customer, Store)
  "order_completed"          // Ολοκληρώθηκε (→ όλους)
]
```

**Indexes:**
- `recipientId + recipientRole` (composite)
- `isRead`
- `createdAt`

---

## Relationships (References)

```
orders.storeId → stores._id
orders.driverId → drivers._id
chats.orderId → orders._id
notifications.orderId → orders._id
drivers.currentOrder → orders._id
```

**Denormalization Strategy:**
- Αποθηκεύουμε `storeName`, `driverName` στο `orders` για ταχύτητα (αποφυγή joins)
- Trade-off: Πρέπει να ενημερώνουμε denormalized data αν αλλάξει το store/driver name

---

## Geospatial Queries (Maps)

**Παράδειγμα:** Εύρεση καταστημάτων κοντά σε τοποθεσία πελάτη

```javascript
// Mongoose query (παράδειγμα)
Store.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [25.8719, 40.8461] // [lng, lat] Αλεξανδρούπολη
      },
      $maxDistance: 5000 // 5km radius
    }
  },
  isApproved: true
})
```

**Σημείωση:** Για MVP, δεν χρησιμοποιούμε geospatial queries—φιλτράρουμε με `serviceAreas` (text matching).

---

## Data Retention Policy (Προτάσεις)

| Collection | Retention | Λόγος |
|------------|-----------|-------|
| orders | 2 χρόνια | Νομικές υποχρεώσεις, analytics |
| users | Διατήρηση με orders | GDPR compliance (anonymization μετά 2 χρόνια) |
| chats | 6 μήνες | Αρχείο επικοινωνίας |
| notifications | 30 ημέρες | Cleanup παλιών ειδοποιήσεων |

---

## Backup Strategy

**MongoDB Atlas (Free Tier):**
- Αυτόματα snapshots κάθε 24 ώρες
- Retention: 2 ημέρες (free tier)

**Recommendation:**
- Χειροκίνητα exports με `mongodump` εβδομαδιαίως
- Αποθήκευση σε Google Drive/Dropbox

---

**Τελευταία ενημέρωση:** 18/11/2025
