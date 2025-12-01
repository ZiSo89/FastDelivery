# Fast Delivery - REST API Documentation

**Base URL:** `https://fastdelivery-api.onrender.com/api/v1`

**Authentication:** JWT Bearer Token (όπου απαιτείται)

**Τελευταία ενημέρωση:** 01/12/2025

---

## Πίνακας Περιεχομένων

1. [Authentication](#authentication-endpoints)
2. [Customer/Orders](#customer--orders-endpoints)
3. [Store Dashboard](#store-endpoints)
4. [Driver App](#driver-endpoints)
5. [Admin Dashboard](#admin-endpoints)
6. [Error Responses](#error-responses)

---

## Authentication Endpoints

### POST `/auth/login`
**Σκοπός:** Σύνδεση για Store/Driver/Admin/Customer

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "store"  // "store", "driver", "admin", "customer"
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

---

### POST `/auth/store/register`
**Σκοπός:** Εγγραφή νέου καταστήματος

**Request Body:**
```json
{
  "businessName": "Mini Market Κέντρο",
  "afm": "123456789",
  "email": "store@example.com",
  "password": "securePassword123",
  "phone": "2551012345",
  "address": "Λεωφ. Δημοκρατίας 10, Αλεξανδρούπολη",
  "storeType": "Mini Market",
  "workingHours": "Δευ-Παρ: 08:00-22:00",
  "serviceAreas": "Κέντρο, Φλοίσβος"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Η αίτηση εγγραφής σας υποβλήθηκε. Ελέγξτε το email σας για επιβεβαίωση.",
  "store": {
    "_id": "64abc123...",
    "businessName": "Mini Market Κέντρο",
    "email": "store@example.com",
    "status": "pending"
  }
}
```

---

### POST `/auth/driver/register`
**Σκοπός:** Εγγραφή νέου διανομέα

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
  "message": "Η αίτηση εγγραφής σας υποβλήθηκε.",
  "driver": {
    "_id": "64abc789...",
    "name": "Γιάννης Παπαδόπουλος",
    "email": "driver@example.com",
    "status": "pending"
  }
}
```

---

### POST `/auth/customer/register`
**Σκοπός:** Εγγραφή νέου πελάτη

**Request Body:**
```json
{
  "name": "Μαρία Γεωργίου",
  "email": "customer@example.com",
  "password": "securePassword123",
  "phone": "6987654321"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Εγγραφή επιτυχής! Ελέγξτε το email σας.",
  "customer": {
    "_id": "64cust123...",
    "name": "Μαρία Γεωργίου",
    "email": "customer@example.com"
  }
}
```

---

### GET `/auth/store-types`
**Σκοπός:** Λίστα διαθέσιμων τύπων καταστημάτων (για registration form)

**Response (200):**
```json
{
  "success": true,
  "storeTypes": ["Mini Market", "Φαρμακείο", "Ταβέρνα", "Καφετέρια", "Γλυκά", "Άλλο"]
}
```

---

### GET `/auth/verify-email`
**Σκοπός:** Επιβεβαίωση email

**Query Parameters:**
- `token`: Verification token
- `type`: "customer", "store", "driver"

---

### POST `/auth/forgot-password`
**Σκοπός:** Αίτημα επαναφοράς κωδικού

**Request Body:**
```json
{
  "email": "user@example.com",
  "type": "customer"  // "customer", "store", "driver"
}
```

---

### POST `/auth/reset-password`
**Σκοπός:** Επαναφορά κωδικού με token

**Request Body:**
```json
{
  "token": "reset-token...",
  "type": "customer",
  "password": "newPassword123"
}
```

---

## Customer / Orders Endpoints

### GET `/orders/stores`
**Σκοπός:** Λίστα διαθέσιμων καταστημάτων (Public)

**Query Parameters:**
- `serviceArea` (optional): Φίλτρο περιοχής
- `storeType` (optional): Φίλτρο τύπου

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "stores": [
    {
      "_id": "64abc123...",
      "businessName": "Mini Market Κέντρο",
      "storeType": "Mini Market",
      "address": "Λεωφ. Δημοκρατίας 10",
      "phone": "2551012345",
      "workingHours": "Δευ-Παρ: 08:00-22:00",
      "serviceAreas": "Κέντρο, Φλοίσβος",
      "location": { "coordinates": [25.8719, 40.8461] }
    }
  ]
}
```

---

### GET `/orders/service-status`
**Σκοπός:** Κατάσταση υπηρεσίας (ανοιχτή/κλειστή)

**Response (200):**
```json
{
  "success": true,
  "isOpen": true,
  "serviceHoursStart": "09:00",
  "serviceHoursEnd": "23:00",
  "serviceHoursEnabled": true
}
```

---

### POST `/orders`
**Σκοπός:** Δημιουργία νέας παραγγελίας (Guest ή Logged-in)

**Request Body:**
```json
{
  "customer": {
    "name": "Μαρία Γεωργίου",
    "phone": "6987654321",
    "email": "maria@example.com"
  },
  "storeId": "64abc123...",
  "orderType": "delivery",
  "orderContent": {
    "deliveryAddress": "Καραϊσκάκη 25, Αλεξανδρούπολη",
    "orderDetails": "2 πακέτα πάνες Pampers, 6 κόκα-κόλα 330ml"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Η παραγγελία σας καταχωρήθηκε!",
  "order": {
    "_id": "64order123...",
    "orderNumber": "ORD-20251201-0001",
    "status": "pending_store"
  }
}
```

---

### GET `/orders/:orderNumber/status`
**Σκοπός:** Παρακολούθηση κατάστασης παραγγελίας

**Response (200):**
```json
{
  "success": true,
  "order": {
    "orderNumber": "ORD-20251201-0001",
    "status": "in_delivery",
    "productPrice": 25.50,
    "deliveryFee": 3.00,
    "totalPrice": 28.50,
    "statusHistory": [
      { "status": "pending_store", "timestamp": "2025-12-01T10:30:00Z" },
      { "status": "in_delivery", "timestamp": "2025-12-01T11:00:00Z" }
    ]
  }
}
```

---

### PUT `/orders/:orderId/confirm`
**Σκοπός:** Επιβεβαίωση/Ακύρωση τιμής από πελάτη

**Request Body:**
```json
{
  "phone": "6987654321",
  "action": "confirm"  // ή "reject"
}
```

---

### GET `/orders/my-orders` 🔒
**Σκοπός:** Ιστορικό παραγγελιών πελάτη (απαιτεί login)

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "totalCount": 25,
  "totalPages": 3,
  "currentPage": 1,
  "hasMore": true,
  "orders": [...]
}
```

---

### GET `/orders/active-by-phone/:phone`
**Σκοπός:** Ενεργή παραγγελία με βάση τηλέφωνο

---

### PUT `/orders/profile` 🔒
**Σκοπός:** Ενημέρωση προφίλ πελάτη

---

### DELETE `/orders/profile` 🔒
**Σκοπός:** Διαγραφή λογαριασμού πελάτη

---

## Store Endpoints 🔒

**Όλα τα endpoints απαιτούν:** `Authorization: Bearer <store-token>`

### GET `/store/orders`
**Σκοπός:** Λίστα παραγγελιών καταστήματος

**Query Parameters:**
- `status`: Φίλτρο κατάστασης
- `limit` (default: 20)
- `page` (default: 1)

**Response (200):**
```json
{
  "success": true,
  "count": 3,
  "total": 50,
  "page": 1,
  "pages": 3,
  "orders": [
    {
      "_id": "64order123...",
      "orderNumber": "ORD-20251201-0001",
      "customer": {
        "name": "Μαρία Γεωργίου",
        "phone": "6987654321",
        "address": "Καραϊσκάκη 25"
      },
      "status": "pending_store",
      "createdAt": "2025-12-01T10:30:00Z"
    }
  ]
}
```

---

### PUT `/store/orders/:orderId/accept`
**Σκοπός:** Αποδοχή/Απόρριψη παραγγελίας

**Request Body:**
```json
{
  "action": "accept"  // ή "reject"
}
```

---

### PUT `/store/orders/:orderId/price`
**Σκοπός:** Προσθήκη τιμής προϊόντων

**Request Body:**
```json
{
  "productPrice": 25.50
}
```

---

### PUT `/store/orders/:orderId/status`
**Σκοπός:** Ενημέρωση κατάστασης σε "preparing"

**Request Body:**
```json
{
  "status": "preparing"
}
```

---

### GET `/store/profile`
**Σκοπός:** Προφίλ καταστήματος

**Response (200):**
```json
{
  "success": true,
  "store": {
    "_id": "64abc123...",
    "businessName": "Mini Market Κέντρο",
    "email": "store@example.com",
    "phone": "2551012345",
    "address": "Λεωφ. Δημοκρατίας 10",
    "storeType": "Mini Market",
    "workingHours": "Δευ-Παρ: 08:00-22:00",
    "status": "approved"
  }
}
```

---

### PUT `/store/profile`
**Σκοπός:** Ενημέρωση προφίλ

**Request Body:**
```json
{
  "phone": "2551098765",
  "workingHours": "Δευ-Κυρ: 07:00-23:00",
  "serviceAreas": "Κέντρο, Φλοίσβος, Μάκρη"
}
```

---

## Driver Endpoints 🔒

**Όλα τα endpoints απαιτούν:** `Authorization: Bearer <driver-token>`

### GET `/driver/profile`
**Σκοπός:** Προφίλ διανομέα

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
    "currentOrder": null,
    "status": "approved"
  }
}
```

---

### PUT `/driver/profile`
**Σκοπός:** Ενημέρωση προφίλ διανομέα

**Request Body:**
```json
{
  "phone": "6900000001",
  "pushToken": "ExponentPushToken[...]"
}
```

---

### PUT `/driver/availability`
**Σκοπός:** Toggle online/offline

**Request Body:**
```json
{
  "isOnline": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Κατάσταση ενημερώθηκε σε: online",
  "driver": { "isOnline": true }
}
```

---

### GET `/driver/orders`
**Σκοπός:** Ανατεθειμένες παραγγελίες

**Response (200):**
```json
{
  "success": true,
  "orders": [
    {
      "_id": "64order123...",
      "orderNumber": "ORD-20251201-0001",
      "status": "assigned",
      "customer": {...},
      "storeId": {
        "businessName": "Mini Market Κέντρο",
        "address": "...",
        "phone": "...",
        "location": {...}
      }
    }
  ]
}
```

---

### PUT `/driver/orders/:orderId/accept`
**Σκοπός:** Αποδοχή/Απόρριψη ανάθεσης

**Request Body:**
```json
{
  "action": "accept"  // ή "reject"
}
```

---

### PUT `/driver/orders/:orderId/status`
**Σκοπός:** Ενημέρωση κατάστασης

**Request Body:**
```json
{
  "status": "in_delivery"  // ή "completed"
}
```

---

## Admin Endpoints 🔒

**Όλα τα endpoints απαιτούν:** `Authorization: Bearer <admin-token>`

### GET `/admin/stats`
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
      "completed": 120
    },
    "totalRevenue": 4500.00,
    "activeStores": 12,
    "activeDrivers": 5,
    "ordersToday": 8,
    "ordersThisWeek": 35,
    "ordersThisMonth": 150
  }
}
```

---

### GET `/admin/stats/extended`
**Σκοπός:** Εκτεταμένα στατιστικά

---

### GET `/admin/stores`
**Σκοπός:** Λίστα καταστημάτων

**Query Parameters:**
- `status`: "pending", "approved", "rejected"
- `showUnverified`: true/false
- `page`, `limit`

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "totalCount": 20,
  "totalPages": 4,
  "currentPage": 1,
  "stores": [...]
}
```

---

### PUT `/admin/stores/:storeId/approve`
**Σκοπός:** Έγκριση/Απόρριψη καταστήματος

**Request Body:**
```json
{
  "action": "approve"  // "approve", "reject", "pending"
}
```

---

### GET `/admin/drivers`
**Σκοπός:** Λίστα διανομέων

---

### PUT `/admin/drivers/:driverId/approve`
**Σκοπός:** Έγκριση/Απόρριψη διανομέα

---

### GET `/admin/orders`
**Σκοπός:** Λίστα παραγγελιών

**Query Parameters:**
- `status`, `storeId`, `driverId`
- `page`, `limit`

**Response (200):**
```json
{
  "success": true,
  "count": 10,
  "total": 150,
  "page": 1,
  "pages": 15,
  "orders": [...]
}
```

---

### PUT `/admin/orders/:orderId/delivery-fee`
**Σκοπός:** Προσθήκη κόστους αποστολής

**Request Body:**
```json
{
  "deliveryFee": 3.00
}
```

---

### PUT `/admin/orders/:orderId/assign-driver`
**Σκοπός:** Ανάθεση σε διανομέα

**Request Body:**
```json
{
  "driverId": "64abc789..."
}
```

---

### PUT `/admin/orders/:orderId/cancel`
**Σκοπός:** Ακύρωση παραγγελίας

**Request Body:**
```json
{
  "reason": "Αίτημα πελάτη"
}
```

---

### GET `/admin/customers`
**Σκοπός:** Λίστα πελατών

---

### PUT `/admin/customers/:customerId/deactivate`
**Σκοπός:** Απενεργοποίηση πελάτη

---

### GET `/admin/settings`
**Σκοπός:** Ρυθμίσεις συστήματος

**Response (200):**
```json
{
  "success": true,
  "settings": {
    "driverSalary": 800,
    "defaultDeliveryFee": 2.5,
    "storeTypes": ["Mini Market", "Φαρμακείο", ...],
    "serviceHoursEnabled": true,
    "serviceHoursStart": "09:00",
    "serviceHoursEnd": "23:00"
  }
}
```

---

### PUT `/admin/settings`
**Σκοπός:** Ενημέρωση ρυθμίσεων

---

### POST `/admin/settings/store-types`
**Σκοπός:** Προσθήκη τύπου καταστήματος

---

### PUT `/admin/settings/store-types/:storeType`
**Σκοπός:** Ενημέρωση τύπου καταστήματος

---

### DELETE `/admin/settings/store-types/:storeType`
**Σκοπός:** Διαγραφή τύπου καταστήματος

---

### GET `/admin/expenses/:year/:month`
**Σκοπός:** Μηνιαία έξοδα

---

### PUT `/admin/expenses/:year/:month`
**Σκοπός:** Ενημέρωση μηνιαίων εξόδων

---

### GET `/admin/profile`
**Σκοπός:** Προφίλ admin

**Response (200):**
```json
{
  "success": true,
  "admin": {
    "_id": "...",
    "name": "Admin",
    "email": "admin@fastdelivery.gr"
  }
}
```

---

### PUT `/admin/profile`
**Σκοπός:** Ενημέρωση προφίλ admin

---

### PUT `/admin/profile/password`
**Σκοπός:** Αλλαγή κωδικού admin

---

## Order Status Flow

```
pending_store → pricing → pending_admin → pending_customer_confirm → confirmed → assigned → accepted_driver → preparing → in_delivery → completed
                    ↓                              ↓                                    ↓
              rejected_store              rejected_customer                    rejected_driver → (back to admin)
                                                                                         ↓
                                                                                    cancelled
```

---

## Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Email, password και role είναι απαραίτητα"
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
  "message": "Δεν έχετε δικαίωμα πρόσβασης."
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
  "message": "Εσωτερικό σφάλμα διακομιστή."
}
```

---

## WebSocket Events (Socket.IO)

**Connection:** `wss://fastdelivery-api.onrender.com`

### Rooms
- `admin` - Admin dashboard
- `store:{storeId}` - Specific store
- `driver:{driverId}` - Specific driver
- `customer:{phone}` - Customer by phone

### Events
- `order:created` - Νέα παραγγελία
- `order:status_changed` - Αλλαγή κατάστασης
- `order:assigned` - Ανάθεση σε διανομέα
- `driver:availability_changed` - Διαθεσιμότητα διανομέα

---

**🔒 = Απαιτεί Authentication**
