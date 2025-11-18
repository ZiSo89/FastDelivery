# Fast Delivery - REST API Endpoints

**Base URL:** `https://your-backend.render.com/api/v1`

**Authentication:** JWT Bearer Token (όπου απαιτείται)

**Γενικές Conventions:**
- Όλα τα responses σε JSON format
- Status codes: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error)
- Timestamps σε ISO 8601 format

---

## Authentication Endpoints

### 1. POST `/auth/store/register`
**Σκοπός:** Εγγραφή νέου καταστήματος (αναμονή έγκρισης)

**Request Body:**
```json
{
  "businessName": "Mini Market Κέντρο",
  "afm": "123456789",
  "email": "store@example.com",
  "password": "securePassword123",
  "phone": "2551012345",
  "address": "Λεωφ. Δημοκρατίας 10, Αλεξανδρούπολη",
  "location": {
    "type": "Point",
    "coordinates": [25.8719, 40.8461]
  },
  "storeType": "Mini Market",
  "workingHours": "Δευ-Παρ: 08:00-22:00, Σαβ: 09:00-20:00",
  "serviceAreas": "Κέντρο, Φλοίσβος"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Η αίτηση εγγραφής σας υποβλήθηκε. Αναμένετε έγκριση από διαχειριστή.",
  "store": {
    "_id": "64abc123def456...",
    "businessName": "Mini Market Κέντρο",
    "email": "store@example.com",
    "status": "pending"
  }
}
```

---

### 2. POST `/auth/driver/register`
**Σκοπός:** Εγγραφή νέου διανομέα (αναμονή έγκρισης)

**Request Body:**
```json
{
  "name": "Γιάννης Παπαδόπουλος",
  "email": "driver@example.com",
  "password": "securePassword123",
  "phone": "6912345678"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Η αίτηση εγγραφής σας υποβλήθηκε. Αναμένετε έγκριση.",
  "driver": {
    "_id": "64abc789...",
    "name": "Γιάννης Παπαδόπουλος",
    "email": "driver@example.com",
    "status": "pending"
  }
}
```

---

### 3. POST `/auth/login`
**Σκοπός:** Σύνδεση για Store/Driver/Admin

**Request Body:**
```json
{
  "email": "store@example.com",
  "password": "securePassword123",
  "role": "store"  // "store", "driver", "admin"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64abc123...",
    "email": "store@example.com",
    "role": "store",
    "businessName": "Mini Market Κέντρο",
    "isApproved": true
  }
}
```

**Error (401 - Μη εγκεκριμένος):**
```json
{
  "success": false,
  "message": "Ο λογαριασμός σας αναμένει έγκριση από διαχειριστή."
}
```

---

## Customer (Guest) Endpoints

### 4. GET `/stores`
**Σκοπός:** Λίστα διαθέσιμων καταστημάτων (φιλτραρισμένα)

**Query Parameters:**
- `serviceArea` (optional): Φίλτρο βάσει περιοχής (π.χ., "Κέντρο")
- `storeType` (optional): Φίλτρο βάσει τύπου (π.χ., "Mini Market")

**Request:**
```
GET /api/v1/stores?serviceArea=Κέντρο&storeType=Mini Market
```

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "stores": [
    {
      "_id": "64abc123...",
      "businessName": "Mini Market Κέντρο",
      "storeType": "Mini Market",
      "address": "Λεωφ. Δημοκρατίας 10",
      "workingHours": "Δευ-Παρ: 08:00-22:00",
      "serviceAreas": "Κέντρο, Φλοίσβος",
      "location": {
        "coordinates": [25.8719, 40.8461]
      }
    }
  ]
}
```

---

### 5. POST `/orders`
**Σκοπός:** Δημιουργία νέας παραγγελίας (guest checkout)

**Request Body (Text Order):**
```json
{
  "customer": {
    "name": "Μαρία Γεωργίου",
    "phone": "6987654321",
    "address": "Καραϊσκάκη 25, Αλεξανδρούπολη"
  },
  "storeId": "64abc123...",
  "orderType": "text",
  "orderContent": "2 πακέτα πάνες Pampers, 6 κόκα-κόλα 330ml, 1 ψωμί τοστ"
}
```

**Request Body (Voice Order):**
```json
{
  "customer": {
    "name": "Μαρία Γεωργίου",
    "phone": "6987654321",
    "address": "Καραϊσκάκη 25"
  },
  "storeId": "64abc123...",
  "orderType": "voice",
  "orderVoiceFile": "<base64-encoded-audio>"  // ή multipart/form-data upload
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Η παραγγελία σας υποβλήθηκε επιτυχώς!",
  "order": {
    "_id": "64order123...",
    "orderNumber": "ORD-20251118-0001",
    "status": "pending_store",
    "customer": {
      "name": "Μαρία Γεωργίου",
      "phone": "6987654321"
    },
    "storeName": "Mini Market Κέντρο",
    "createdAt": "2025-11-18T10:30:00Z"
  }
}
```

---

### 6. GET `/orders/:orderNumber/status`
**Σκοπός:** Παρακολούθηση κατάστασης παραγγελίας (guest - με orderNumber)

**Request:**
```
GET /api/v1/orders/ORD-20251118-0001/status
```

**Response (200):**
```json
{
  "success": true,
  "order": {
    "orderNumber": "ORD-20251118-0001",
    "status": "in_delivery",
    "statusHistory": [
      {
        "status": "pending_store",
        "timestamp": "2025-11-18T10:30:00Z"
      },
      {
        "status": "pricing",
        "updatedBy": "store",
        "timestamp": "2025-11-18T10:35:00Z"
      },
      {
        "status": "in_delivery",
        "updatedBy": "driver",
        "timestamp": "2025-11-18T11:00:00Z"
      }
    ],
    "productPrice": 25.50,
    "deliveryFee": 3.00,
    "totalPrice": 28.50,
    "driverName": "Γιάννης Παπαδόπουλος"
  }
}
```

---

### 7. PUT `/orders/:orderId/confirm`
**Σκοπός:** Επιβεβαίωση τελικής τιμής από πελάτη

**Request Body:**
```json
{
  "phone": "6987654321",  // Verification
  "confirm": true         // true = επιβεβαίωση, false = ακύρωση
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Η παραγγελία σας επιβεβαιώθηκε!",
  "order": {
    "orderNumber": "ORD-20251118-0001",
    "status": "confirmed",
    "totalPrice": 28.50
  }
}
```

---

## Store Endpoints (Protected - JWT Required)

**Headers:** `Authorization: Bearer <token>`

### 8. GET `/store/orders`
**Σκοπός:** Λίστα παραγγελιών του καταστήματος

**Query Parameters:**
- `status` (optional): Φίλτρο κατάστασης (π.χ., "pending_store")
- `limit` (default: 20)
- `page` (default: 1)

**Request:**
```
GET /api/v1/store/orders?status=pending_store
Headers: Authorization: Bearer <store-token>
```

**Response (200):**
```json
{
  "success": true,
  "count": 3,
  "orders": [
    {
      "_id": "64order123...",
      "orderNumber": "ORD-20251118-0001",
      "customer": {
        "name": "Μαρία Γεωργίου",
        "phone": "6987654321",
        "address": "Καραϊσκάκη 25"
      },
      "orderType": "text",
      "orderContent": "2 πακέτα πάνες Pampers...",
      "status": "pending_store",
      "createdAt": "2025-11-18T10:30:00Z"
    }
  ]
}
```

---

### 9. PUT `/store/orders/:orderId/accept`
**Σκοπός:** Αποδοχή παραγγελίας από κατάστημα

**Request Body:**
```json
{
  "action": "accept"  // ή "reject"
}
```

**Response (200 - Accept):**
```json
{
  "success": true,
  "message": "Η παραγγελία έγινε αποδεκτή. Προσθέστε την τιμή προϊόντων.",
  "order": {
    "orderNumber": "ORD-20251118-0001",
    "status": "pricing"
  }
}
```

**Response (200 - Reject):**
```json
{
  "success": true,
  "message": "Η παραγγελία απορρίφθηκε.",
  "order": {
    "orderNumber": "ORD-20251118-0001",
    "status": "rejected_store"
  }
}
```

---

### 10. PUT `/store/orders/:orderId/price`
**Σκοπός:** Προσθήκη τιμής προϊόντων

**Request Body:**
```json
{
  "productPrice": 25.50
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Η τιμή καταχωρήθηκε. Αναμονή Admin για κόστος αποστολής.",
  "order": {
    "orderNumber": "ORD-20251118-0001",
    "status": "pending_admin",
    "productPrice": 25.50
  }
}
```

---

### 11. PUT `/store/orders/:orderId/status`
**Σκοπός:** Ενημέρωση κατάστασης σε "preparing"

**Request Body:**
```json
{
  "status": "preparing"
}
```

**Response (200):**
```json
{
  "success": true,
  "order": {
    "orderNumber": "ORD-20251118-0001",
    "status": "preparing"
  }
}
```

---

### 12. GET `/store/profile`
**Σκοπός:** Προβολή προφίλ καταστήματος

**Response (200):**
```json
{
  "success": true,
  "store": {
    "_id": "64abc123...",
    "businessName": "Mini Market Κέντρο",
    "afm": "123456789",
    "email": "store@example.com",
    "phone": "2551012345",
    "address": "Λεωφ. Δημοκρατίας 10",
    "storeType": "Mini Market",
    "workingHours": "Δευ-Παρ: 08:00-22:00",
    "serviceAreas": "Κέντρο, Φλοίσβος",
    "isApproved": true
  }
}
```

---

### 13. PUT `/store/profile`
**Σκοπός:** Επεξεργασία προφίλ

**Request Body:**
```json
{
  "workingHours": "Δευ-Παρ: 07:00-23:00",
  "serviceAreas": "Κέντρο, Φλοίσβος, Μάκρη"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Το προφίλ ενημερώθηκε.",
  "store": { /* updated data */ }
}
```

---

## Driver Endpoints (Protected - JWT Required)

### 14. GET `/driver/profile`
**Σκοπός:** Προβολή προφίλ διανομέα

**Response (200):**
```json
{
  "success": true,
  "driver": {
    "_id": "64abc789...",
    "name": "Γιάννης Παπαδόπουλος",
    "email": "driver@example.com",
    "phone": "6912345678",
    "isOnline": true,
    "currentOrder": "64order123...",
    "isApproved": true
  }
}
```

---

### 15. PUT `/driver/availability`
**Σκοπός:** Toggle online/offline status

**Request Body:**
```json
{
  "isOnline": true  // true = online, false = offline
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Κατάσταση ενημερώθηκε σε: online",
  "driver": {
    "isOnline": true
  }
}
```

---

### 16. GET `/driver/orders`
**Σκοπός:** Προβολή ανατεθειμένων παραγγελιών

**Response (200):**
```json
{
  "success": true,
  "orders": [
    {
      "_id": "64order123...",
      "orderNumber": "ORD-20251118-0001",
      "status": "assigned",
      "customer": {
        "name": "Μαρία Γεωργίου",
        "phone": "6987654321",
        "address": "Καραϊσκάκη 25"
      },
      "storeName": "Mini Market Κέντρο",
      "storeAddress": "Λεωφ. Δημοκρατίας 10",
      "totalPrice": 28.50,
      "deliveryFee": 3.00
    }
  ]
}
```

---

### 17. PUT `/driver/orders/:orderId/accept`
**Σκοπός:** Αποδοχή/Απόρριψη ανάθεσης

**Request Body:**
```json
{
  "action": "accept"  // ή "reject"
}
```

**Response (200 - Accept):**
```json
{
  "success": true,
  "message": "Η ανάθεση έγινε αποδεκτή.",
  "order": {
    "orderNumber": "ORD-20251118-0001",
    "status": "accepted_driver"
  }
}
```

**Response (200 - Reject):**
```json
{
  "success": true,
  "message": "Η ανάθεση απορρίφθηκε. Επιστρέφει στον Admin.",
  "order": {
    "status": "rejected_driver"
  }
}
```

---

### 18. PUT `/driver/orders/:orderId/status`
**Σκοπός:** Ενημέρωση κατάστασης (in_delivery, completed)

**Request Body:**
```json
{
  "status": "in_delivery"  // ή "completed"
}
```

**Response (200):**
```json
{
  "success": true,
  "order": {
    "orderNumber": "ORD-20251118-0001",
    "status": "in_delivery"
  }
}
```

---

## Admin Endpoints (Protected - JWT Required)

### 19. GET `/admin/stores`
**Σκοπός:** Λίστα όλων των καταστημάτων

**Query Parameters:**
- `status`: "pending", "approved", "rejected"

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "stores": [
    {
      "_id": "64abc123...",
      "businessName": "Mini Market Κέντρο",
      "email": "store@example.com",
      "status": "pending",
      "createdAt": "2025-11-15T09:00:00Z"
    }
  ]
}
```

---

### 20. PUT `/admin/stores/:storeId/approve`
**Σκοπός:** Έγκριση/Απόρριψη καταστήματος

**Request Body:**
```json
{
  "action": "approve"  // ή "reject"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Το κατάστημα εγκρίθηκε.",
  "store": {
    "_id": "64abc123...",
    "status": "approved",
    "isApproved": true
  }
}
```

---

### 21. GET `/admin/drivers`
**Σκοπός:** Λίστα όλων των διανομέων

**Query Parameters:**
- `status`: "pending", "approved", "rejected"
- `isOnline`: true/false

**Response (200):**
```json
{
  "success": true,
  "count": 3,
  "drivers": [
    {
      "_id": "64abc789...",
      "name": "Γιάννης Παπαδόπουλος",
      "email": "driver@example.com",
      "status": "approved",
      "isOnline": true,
      "currentOrder": null
    }
  ]
}
```

---

### 22. PUT `/admin/drivers/:driverId/approve`
**Σκοπός:** Έγκριση/Απόρριψη διανομέα

**Request Body:**
```json
{
  "action": "approve"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Ο διανομέας εγκρίθηκε.",
  "driver": {
    "_id": "64abc789...",
    "status": "approved",
    "isApproved": true
  }
}
```

---

### 23. GET `/admin/orders`
**Σκοπός:** Λίστα όλων των παραγγελιών

**Query Parameters:**
- `status`: Any order status
- `limit`, `page`

**Response (200):**
```json
{
  "success": true,
  "count": 10,
  "orders": [
    {
      "_id": "64order123...",
      "orderNumber": "ORD-20251118-0001",
      "customer": {
        "name": "Μαρία Γεωργίου",
        "phone": "6987654321"
      },
      "storeName": "Mini Market Κέντρο",
      "status": "pending_admin",
      "productPrice": 25.50,
      "deliveryFee": null,
      "createdAt": "2025-11-18T10:30:00Z"
    }
  ]
}
```

---

### 24. PUT `/admin/orders/:orderId/delivery-fee`
**Σκοπός:** Προσθήκη κόστους αποστολής

**Request Body:**
```json
{
  "deliveryFee": 3.00
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Το κόστος αποστολής προστέθηκε. Αναμονή επιβεβαίωσης πελάτη.",
  "order": {
    "orderNumber": "ORD-20251118-0001",
    "status": "pending_customer_confirm",
    "productPrice": 25.50,
    "deliveryFee": 3.00,
    "totalPrice": 28.50
  }
}
```

---

### 25. PUT `/admin/orders/:orderId/assign-driver`
**Σκοπός:** Ανάθεση παραγγελίας σε διανομέα

**Request Body:**
```json
{
  "driverId": "64abc789..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Η παραγγελία ανατέθηκε στον Γιάννης Παπαδόπουλος.",
  "order": {
    "orderNumber": "ORD-20251118-0001",
    "status": "assigned",
    "driverId": "64abc789...",
    "driverName": "Γιάννης Παπαδόπουλος"
  }
}
```

---

### 26. PUT `/admin/orders/:orderId/cancel`
**Σκοπός:** Ακύρωση παραγγελίας (οποτεδήποτε)

**Request Body:**
```json
{
  "reason": "Αίτημα πελάτη"  // optional
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Η παραγγελία ακυρώθηκε.",
  "order": {
    "orderNumber": "ORD-20251118-0001",
    "status": "cancelled"
  }
}
```

---

### 27. GET `/admin/customers`
**Σκοπός:** Λίστα όλων των πελατών (guest users)

**Response (200):**
```json
{
  "success": true,
  "count": 50,
  "customers": [
    {
      "_id": "64user123...",
      "name": "Μαρία Γεωργίου",
      "phone": "6987654321",
      "isActive": true,
      "totalOrders": 5,
      "createdAt": "2025-11-10T12:00:00Z"
    }
  ]
}
```

---

### 28. PUT `/admin/customers/:customerId/deactivate`
**Σκοπός:** Απενεργοποίηση πελάτη (όχι διαγραφή)

**Response (200):**
```json
{
  "success": true,
  "message": "Ο πελάτης απενεργοποιήθηκε.",
  "customer": {
    "_id": "64user123...",
    "isActive": false
  }
}
```

---

### 29. GET `/admin/stats`
**Σκοπός:** Dashboard στατιστικά

**Query Parameters:**
- `period`: "today", "week", "month"

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalOrders": 150,
    "ordersByStatus": {
      "pending_store": 5,
      "in_delivery": 3,
      "completed": 120,
      "cancelled": 10
    },
    "totalRevenue": 4500.00,        // Άθροισμα delivery fees
    "activeStores": 12,
    "activeDrivers": 5,
    "ordersToday": 8,
    "ordersThisWeek": 35,
    "ordersThisMonth": 150
  }
}
```

---

## Chat & Notifications Endpoints

### 30. GET `/chats/:orderId`
**Σκοπός:** Λήψη μηνυμάτων για συγκεκριμένη παραγγελία

**Headers:** Authorization (Store/Driver/Admin)

**Response (200):**
```json
{
  "success": true,
  "chat": {
    "_id": "64chat123...",
    "orderId": "64order123...",
    "participants": ["admin", "store:64abc123", "driver:64abc789"],
    "messages": [
      {
        "_id": "64msg1...",
        "senderRole": "admin",
        "messageType": "text",
        "content": "Παρακαλώ ετοιμάστε την παραγγελία το συντομότερο.",
        "timestamp": "2025-11-18T11:00:00Z",
        "isRead": true
      },
      {
        "_id": "64msg2...",
        "senderRole": "store",
        "messageType": "voice",
        "voiceUrl": "https://firebasestorage.googleapis.com/...",
        "timestamp": "2025-11-18T11:05:00Z",
        "isRead": false
      }
    ]
  }
}
```

---

### 31. POST `/chats/:orderId/message`
**Σκοπός:** Αποστολή νέου μηνύματος

**Request Body (Text):**
```json
{
  "messageType": "text",
  "content": "Η παραγγελία είναι έτοιμη!"
}
```

**Request Body (Voice):**
```json
{
  "messageType": "voice",
  "voiceFile": "<base64-encoded-audio>"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": {
    "_id": "64msg3...",
    "senderRole": "store",
    "messageType": "text",
    "content": "Η παραγγελία είναι έτοιμη!",
    "timestamp": "2025-11-18T11:10:00Z"
  }
}
```

---

### 32. GET `/notifications`
**Σκοπός:** Λήψη ειδοποιήσεων χρήστη

**Headers:** Authorization (Store/Driver/Admin)

**Query Parameters:**
- `isRead`: true/false
- `limit`: default 20

**Response (200):**
```json
{
  "success": true,
  "count": 3,
  "notifications": [
    {
      "_id": "64notif1...",
      "type": "order_created",
      "title": "Νέα Παραγγελία",
      "message": "Νέα παραγγελία από Μαρία Γεωργίου",
      "orderId": "64order123...",
      "isRead": false,
      "createdAt": "2025-11-18T10:30:00Z"
    }
  ]
}
```

---

### 33. PUT `/notifications/:notificationId/read`
**Σκοπός:** Σημείωση ειδοποίησης ως αναγνωσμένης

**Response (200):**
```json
{
  "success": true,
  "notification": {
    "_id": "64notif1...",
    "isRead": true
  }
}
```

---

## File Upload Endpoints

### 34. POST `/upload/voice`
**Σκοπός:** Upload voice file σε Firebase Storage

**Request:** multipart/form-data
```
Content-Type: multipart/form-data
file: <audio-file.webm>
```

**Response (200):**
```json
{
  "success": true,
  "voiceUrl": "https://firebasestorage.googleapis.com/v0/b/fast-delivery.../voice_123.webm"
}
```

---

## Error Responses (Γενικό Format)

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation errors",
  "errors": [
    {
      "field": "phone",
      "message": "Το τηλέφωνο πρέπει να είναι 10ψήφιο"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Μη έγκυρο token. Παρακαλώ συνδεθείτε ξανά."
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Δεν έχετε δικαίωμα πρόσβασης σε αυτόν τον πόρο."
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Η παραγγελία δεν βρέθηκε."
}
```

**500 Server Error:**
```json
{
  "success": false,
  "message": "Εσωτερικό σφάλμα διακομιστή. Παρακαλώ δοκιμάστε ξανά."
}
```

---

**Σημαντικό:** Όλα τα protected endpoints απαιτούν JWT token στο header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Τελευταία ενημέρωση:** 18/11/2025
