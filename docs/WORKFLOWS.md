# Fast Delivery - User Workflows & State Diagrams

Αυτό το έγγραφο περιγράφει τις ροές χρηστών και τη λογική αλλαγής καταστάσεων.

---

## 1. Ροή Πελάτη (Customer - Guest Checkout)

### 1.1 Διάγραμμα Ροής
```
START
  ↓
[1] Πελάτης εισέρχεται στην εφαρμογή
  ↓
[2] Εισάγει: Όνομα, Τηλέφωνο, Διεύθυνση παράδοσης
  ↓
[3] Βλέπει λίστα διαθέσιμων καταστημάτων (φιλτραρισμένα βάσει περιοχής)
  ↓
[4] Επιλέγει κατάστημα
  ↓
[5] Επιλέγει τρόπο παραγγελίας:
    ├─ Κείμενο: Γράφει προϊόντα σε text field
    └─ Φωνή: Ηχογραφεί μήνυμα (voice note)
  ↓
[6] Υποβάλλει παραγγελία
  ↓
[7] Λαμβάνει επιβεβαίωση: "Η παραγγελία σας υποβλήθηκε - #ORD-XXX"
  ↓
[8] Περιμένει τιμολόγηση (κατάσταση: pending_store → pricing → pending_admin)
  ↓
[9] Λαμβάνει ειδοποίηση: "Η παραγγελία σας τιμολογήθηκε: €28.50"
  ↓
[10] Βλέπει breakdown:
     - Προϊόντα: €25.50
     - Αποστολή: €3.00
     - Σύνολο: €28.50
  ↓
[11] Επιλέγει:
     ├─ Επιβεβαίωση → Κατάσταση: confirmed
     └─ Ακύρωση → Κατάσταση: cancelled (τέλος)
  ↓
[12] (Αν επιβεβαίωσε) Παρακολουθεί real-time:
     - "Ετοιμάζεται" (preparing)
     - "Σε Παράδοση" (in_delivery)
     - "Ολοκληρώθηκε" (completed)
  ↓
[13] Πληρώνει διανομέα με μετρητά
  ↓
END
```

### 1.2 Βασικές Ενέργειες
| Ενέργεια | API Endpoint | Μέθοδος |
|----------|--------------|---------|
| Προβολή καταστημάτων | `/api/v1/stores` | GET |
| Υποβολή παραγγελίας | `/api/v1/orders` | POST |
| Παρακολούθηση κατάστασης | `/api/v1/orders/:orderNumber/status` | GET |
| Επιβεβαίωση τιμής | `/api/v1/orders/:orderId/confirm` | PUT |

---

## 2. Ροή Καταστήματος (Store Manager)

### 2.1 Διάγραμμα Ροής
```
START
  ↓
[1] Κατάστημα κάνει αίτηση εγγραφής (POST /auth/store/register)
  ↓
[2] Κατάσταση: "pending" (αναμονή έγκρισης)
  ↓
[3] Admin εγκρίνει → Κατάσταση: "approved"
  ↓
[4] Κατάστημα συνδέεται (POST /auth/login)
  ↓
[5] Dashboard: Βλέπει εισερχόμενες παραγγελίες (GET /store/orders?status=pending_store)
  ↓
[6] Νέα παραγγελία (real-time notification via Socket.IO)
  ↓
[7] Επιλέγει παραγγελία → Βλέπει:
    - Όνομα πελάτη
    - Τηλέφωνο
    - Διεύθυνση
    - Παραγγελία (κείμενο ή voice file)
  ↓
[8] (Αν voice) Ακούει το ηχητικό αρχείο
  ↓
[9] Αποφασίζει:
    ├─ Αποδοχή → Κατάσταση: pricing
    └─ Απόρριψη → Κατάσταση: rejected_store (πελάτης ειδοποιείται, τέλος)
  ↓
[10] (Αν αποδέχτηκε) Εισάγει τιμή προϊόντων (PUT /store/orders/:orderId/price)
      Π.χ., €25.50
  ↓
[11] Κατάσταση: pending_admin (αναμονή Admin για delivery fee)
  ↓
[12] Admin προσθέτει delivery fee → Κατάσταση: pending_customer_confirm
  ↓
[13] Πελάτης επιβεβαιώνει → Κατάσταση: confirmed
  ↓
[14] Admin αναθέτει σε διανομέα → Κατάσταση: assigned
  ↓
[15] Διανομέας αποδέχεται → Κατάσταση: accepted_driver
  ↓
[16] Κατάστημα ετοιμάζει παραγγελία
  ↓
[17] Ενημερώνει κατάσταση: "Ετοιμάζεται" (PUT /store/orders/:orderId/status)
      Κατάσταση: preparing
  ↓
[18] Διανομέας παραλαμβάνει → Κατάσταση: in_delivery
  ↓
[19] Διανομέας παραδίδει → Κατάσταση: completed
  ↓
END
```

### 2.2 Βασικές Ενέργειες
| Ενέργεια | API Endpoint | Μέθοδος |
|----------|--------------|---------|
| Σύνδεση | `/api/v1/auth/login` | POST |
| Προβολή παραγγελιών | `/api/v1/store/orders` | GET |
| Αποδοχή/Απόρριψη | `/api/v1/store/orders/:orderId/accept` | PUT |
| Προσθήκη τιμής | `/api/v1/store/orders/:orderId/price` | PUT |
| Ενημέρωση κατάστασης | `/api/v1/store/orders/:orderId/status` | PUT |
| Chat με Admin/Driver | `/api/v1/chats/:orderId/message` | POST |

---

## 3. Ροή Διανομέα (Driver)

### 3.1 Διάγραμμα Ροής
```
START
  ↓
[1] Διανομέας κάνει αίτηση εγγραφής (POST /auth/driver/register)
  ↓
[2] Κατάσταση: "pending"
  ↓
[3] Admin εγκρίνει → Κατάσταση: "approved"
  ↓
[4] Διανομέας συνδέεται (POST /auth/login)
  ↓
[5] Dashboard: Ενεργοποιεί διαθεσιμότητα (PUT /driver/availability)
      isOnline: true
  ↓
[6] Περιμένει ανάθεση από Admin
  ↓
[7] Λαμβάνει ειδοποίηση: "Νέα ανάθεση παραγγελίας #ORD-XXX"
  ↓
[8] Βλέπει λεπτομέρειες:
    - Διεύθυνση παραλαβής (κατάστημα)
    - Διεύθυνση παράδοσης (πελάτης)
    - Προϊόντα
    - Ποσό (€28.50)
    - Delivery fee (€3.00)
  ↓
[9] Αποφασίζει:
    ├─ Αποδοχή → Κατάσταση: accepted_driver
    └─ Απόρριψη → Κατάσταση: rejected_driver (επιστρέφει στον Admin)
  ↓
[10] (Αν αποδέχτηκε) Πληρώνει κατάστημα (€25.50 από χρήματα Admin) - ΕΚΤΟΣ ΣΥΣΤΗΜΑΤΟΣ
  ↓
[11] Παραλαμβάνει προϊόντα από κατάστημα
  ↓
[12] Ενημερώνει κατάσταση: "Σε Παράδοση" (PUT /driver/orders/:orderId/status)
      Κατάσταση: in_delivery
  ↓
[13] Πλοηγείται στη διεύθυνση πελάτη (Google Maps - εκτός συστήματος)
  ↓
[14] Παραδίδει προϊόντα
  ↓
[15] Εισπράττει μετρητά από πελάτη (€28.50)
  ↓
[16] Ενημερώνει κατάσταση: "Ολοκληρώθηκε" (PUT /driver/orders/:orderId/status)
      Κατάσταση: completed
  ↓
[17] Κρατάει delivery fee (€3.00)
  ↓
[18] Δίνει υπόλοιπο (€25.50) στον Admin - ΕΚΤΟΣ ΣΥΣΤΗΜΑΤΟΣ
  ↓
[19] currentOrder: null → Ελεύθερος για νέα ανάθεση
  ↓
END
```

### 3.2 Βασικές Ενέργειες
| Ενέργεια | API Endpoint | Μέθοδος |
|----------|--------------|---------|
| Σύνδεση | `/api/v1/auth/login` | POST |
| Toggle διαθεσιμότητας | `/api/v1/driver/availability` | PUT |
| Προβολή αναθέσεων | `/api/v1/driver/orders` | GET |
| Αποδοχή/Απόρριψη | `/api/v1/driver/orders/:orderId/accept` | PUT |
| Ενημέρωση κατάστασης | `/api/v1/driver/orders/:orderId/status` | PUT |
| Chat με Admin/Store | `/api/v1/chats/:orderId/message` | POST |

---

## 4. Ροή Διαχειριστή (Admin)

### 4.1 Διάγραμμα Ροής (Διαχείριση Παραγγελιών)
```
START
  ↓
[1] Admin συνδέεται (POST /auth/login)
  ↓
[2] Dashboard: Προβολή στατιστικών (GET /admin/stats)
  ↓
[3] Βλέπει όλες τις παραγγελίες (GET /admin/orders)
  ↓
[4] Φιλτράρει παραγγελίες με κατάσταση "pending_admin"
  ↓
[5] Επιλέγει παραγγελία → Βλέπει:
    - Τιμή προϊόντων (από κατάστημα)
    - Διεύθυνση παράδοσης
  ↓
[6] Βλέπει διεύθυνση στον χάρτη (Google Maps)
  ↓
[7] Υπολογίζει απόσταση (χειροκίνητα)
  ↓
[8] Εισάγει delivery fee (PUT /admin/orders/:orderId/delivery-fee)
    Π.χ., €3.00
  ↓
[9] Κατάσταση: pending_customer_confirm
  ↓
[10] Πελάτης επιβεβαιώνει → Κατάσταση: confirmed
  ↓
[11] Admin βλέπει λίστα online διανομέων (GET /admin/drivers?isOnline=true)
  ↓
[12] Επιλέγει διαθέσιμο διανομέα (currentOrder = null)
  ↓
[13] Αναθέτει παραγγελία (PUT /admin/orders/:orderId/assign-driver)
      Κατάσταση: assigned
  ↓
[14] Διανομέας αποδέχεται → Κατάσταση: accepted_driver
  ↓
[15] (Αν διανομέας απορρίψει) Κατάσταση: rejected_driver
      → Admin αναθέτει σε άλλον διανομέα (επιστροφή στο [11])
  ↓
[16] Παρακολουθεί εξέλιξη (real-time):
      - preparing
      - in_delivery
      - completed
  ↓
END
```

### 4.2 Διάγραμμα Ροής (Διαχείριση Καταστημάτων/Διανομέων)
```
START
  ↓
[1] Νέο κατάστημα/διανομέας υποβάλλει αίτηση
  ↓
[2] Admin λαμβάνει ειδοποίηση
  ↓
[3] Admin προβάλλει λίστα (GET /admin/stores?status=pending ή /admin/drivers?status=pending)
  ↓
[4] Ελέγχει στοιχεία (ΑΦΜ, email, κ.λπ.)
  ↓
[5] Αποφασίζει:
    ├─ Έγκριση (PUT /admin/stores/:id/approve ή /admin/drivers/:id/approve)
    │   → Κατάσταση: approved, isApproved: true
    └─ Απόρριψη (action: "reject")
        → Κατάσταση: rejected
  ↓
[6] Εγκεκριμένοι χρήστες μπορούν να συνδεθούν
  ↓
END
```

### 4.3 Βασικές Ενέργειες
| Ενέργεια | API Endpoint | Μέθοδος |
|----------|--------------|---------|
| Προβολή στατιστικών | `/api/v1/admin/stats` | GET |
| Διαχείριση καταστημάτων | `/api/v1/admin/stores` | GET |
| Έγκριση καταστήματος | `/api/v1/admin/stores/:id/approve` | PUT |
| Διαχείριση διανομέων | `/api/v1/admin/drivers` | GET |
| Έγκριση διανομέα | `/api/v1/admin/drivers/:id/approve` | PUT |
| Προβολή παραγγελιών | `/api/v1/admin/orders` | GET |
| Προσθήκη delivery fee | `/api/v1/admin/orders/:id/delivery-fee` | PUT |
| Ανάθεση διανομέα | `/api/v1/admin/orders/:id/assign-driver` | PUT |
| Ακύρωση παραγγελίας | `/api/v1/admin/orders/:id/cancel` | PUT |
| Απενεργοποίηση πελάτη | `/api/v1/admin/customers/:id/deactivate` | PUT |
| Chat | `/api/v1/chats/:orderId/message` | POST |

---

## 5. State Machine: Κατάσταση Παραγγελίας

### 5.1 Διάγραμμα Καταστάσεων
```
                    [Πελάτης υποβάλλει]
                            ↓
                    ┌───────────────┐
                    │ pending_store │
                    └───────┬───────┘
                            │
              ┌─────────────┴──────────────┐
              │ (Κατάστημα αποδέχεται)     │ (Κατάστημα απορρίπτει)
              ↓                            ↓
        ┌──────────┐              ┌──────────────────┐
        │ pricing  │              │ rejected_store   │ → END
        └────┬─────┘              └──────────────────┘
             │ (Κατάστημα εισάγει τιμή)
             ↓
      ┌──────────────┐
      │ pending_admin│
      └──────┬───────┘
             │ (Admin προσθέτει delivery fee)
             ↓
 ┌───────────────────────────┐
 │ pending_customer_confirm  │
 └─────────┬─────────────────┘
           │
    ┌──────┴──────┐
    │ (Πελάτης)   │
    ↓             ↓
┌──────────┐  ┌──────────┐
│confirmed │  │cancelled │ → END
└────┬─────┘  └──────────┘
     │ (Admin αναθέτει)
     ↓
┌──────────┐
│ assigned │
└────┬─────┘
     │
  ┌──┴───┐
  │(Διανομέας)
  ↓      ↓
┌────────────────┐  ┌──────────────────┐
│accepted_driver │  │ rejected_driver  │ → (Admin ξανα-αναθέτει)
└───────┬────────┘  └──────────────────┘
        │ (Κατάστημα ετοιμάζει)
        ↓
   ┌──────────┐
   │preparing │
   └────┬─────┘
        │ (Διανομέας παραλαμβάνει)
        ↓
  ┌─────────────┐
  │ in_delivery │
  └──────┬──────┘
         │ (Διανομέας παραδίδει)
         ↓
    ┌──────────┐
    │completed │ → END
    └──────────┘

    [Σε οποιοδήποτε σημείο]
           ↓
    ┌──────────┐
    │cancelled │ (Admin μόνο)
    └──────────┘ → END
```

### 5.2 Πίνακας Μεταβάσεων Καταστάσεων

| Τρέχουσα Κατάσταση | Ενέργεια | Ποιος | Νέα Κατάσταση |
|-------------------|----------|-------|---------------|
| `pending_store` | Αποδοχή | Κατάστημα | `pricing` |
| `pending_store` | Απόρριψη | Κατάστημα | `rejected_store` |
| `pricing` | Εισαγωγή τιμής | Κατάστημα | `pending_admin` |
| `pending_admin` | Προσθήκη delivery fee | Admin | `pending_customer_confirm` |
| `pending_customer_confirm` | Επιβεβαίωση | Πελάτης | `confirmed` |
| `pending_customer_confirm` | Ακύρωση | Πελάτης | `cancelled` |
| `confirmed` | Ανάθεση διανομέα | Admin | `assigned` |
| `assigned` | Αποδοχή | Διανομέας | `accepted_driver` |
| `assigned` | Απόρριψη | Διανομέας | `rejected_driver` |
| `rejected_driver` | Ξανα-ανάθεση | Admin | `assigned` |
| `accepted_driver` | Ετοιμάζεται | Κατάστημα | `preparing` |
| `preparing` | Παραλαβή | Διανομέας | `in_delivery` |
| `in_delivery` | Παράδοση | Διανομέας | `completed` |
| **Οποιαδήποτε** | Ακύρωση | Admin | `cancelled` |

---

## 6. Real-time Events (Socket.IO)

### 6.1 Namespaces & Rooms
```javascript
// Socket.IO Namespaces
/customer    → Πελάτες (guest)
/store       → Καταστήματα
/driver      → Διανομείς
/admin       → Διαχειριστές

// Rooms (per order)
order:64abc123...   → Όλοι οι συμμετέχοντες σε μια παραγγελία
```

### 6.2 Events

#### Customer Events
| Event | Trigger | Payload |
|-------|---------|---------|
| `order:created` | Υποβολή παραγγελίας | `{ orderNumber, status }` |
| `order:status_changed` | Αλλαγή κατάστασης | `{ orderNumber, newStatus, timestamp }` |
| `order:price_ready` | Τιμολόγηση έτοιμη | `{ orderNumber, totalPrice, breakdown }` |
| `order:rejected` | Απόρριψη | `{ orderNumber, reason }` |

#### Store Events
| Event | Trigger | Payload |
|-------|---------|---------|
| `order:new` | Νέα παραγγελία | `{ orderId, customer, orderContent }` |
| `order:confirmed` | Πελάτης επιβεβαίωσε | `{ orderId, totalPrice }` |
| `chat:message` | Νέο μήνυμα | `{ orderId, sender, message }` |

#### Driver Events
| Event | Trigger | Payload |
|-------|---------|---------|
| `order:assigned` | Ανάθεση | `{ orderId, pickup, delivery, totalPrice }` |
| `order:cancelled` | Ακύρωση | `{ orderId, reason }` |
| `chat:message` | Νέο μήνυμα | `{ orderId, sender, message }` |

#### Admin Events
| Event | Trigger | Payload |
|-------|---------|---------|
| `order:new` | Νέα παραγγελία | `{ orderId, storeId }` |
| `order:confirmed` | Πελάτης επιβεβαίωσε | `{ orderId }` |
| `driver:status_changed` | Διανομέας online/offline | `{ driverId, isOnline }` |
| `store:new_registration` | Νέα εγγραφή | `{ storeId, businessName }` |
| `driver:new_registration` | Νέα εγγραφή | `{ driverId, name }` |

---

## 7. Περιπτώσεις Σφαλμάτων & Rollback

### 7.1 Διανομέας Απορρίπτει Ανάθεση
```
Admin αναθέτει → assigned
  ↓
Διανομέας απορρίπτει → rejected_driver
  ↓
Admin ειδοποιείται (notification + real-time event)
  ↓
Admin επιλέγει άλλον διανομέα → assigned (νέος driver)
```

### 7.2 Κατάστημα Απορρίπτει Παραγγελία
```
Πελάτης υποβάλλει → pending_store
  ↓
Κατάστημα απορρίπτει → rejected_store
  ↓
Πελάτης ειδοποιείται (notification)
  ↓
END (δεν μπορεί να επανυποβληθεί - νέα παραγγελία απαιτείται)
```

### 7.3 Πελάτης Ακυρώνει Μετά την Τιμολόγηση
```
Τιμολόγηση έτοιμη → pending_customer_confirm
  ↓
Πελάτης επιλέγει "Ακύρωση" → cancelled
  ↓
Κατάστημα & Admin ειδοποιούνται
  ↓
END (δεν μπορεί να επανενεργοποιηθεί)
```

### 7.4 Admin Ακυρώνει Ενεργή Παραγγελία
```
Οποιαδήποτε κατάσταση (εκτός completed)
  ↓
Admin επιλέγει "Ακύρωση" → cancelled
  ↓
Όλοι οι συμμετέχοντες ειδοποιούνται (Πελάτης, Κατάστημα, Διανομέας)
  ↓
(Αν Διανομέας είχε currentOrder) → currentOrder = null
  ↓
END
```

---

## 8. Χρονικοί Περιορισμοί (Προτάσεις - Μελλοντικά)

| Κατάσταση | Max Χρόνος | Ενέργεια μετά timeout |
|-----------|------------|---------------------|
| `pending_store` | 15 λεπτά | Αυτόματη ακύρωση |
| `pending_customer_confirm` | 30 λεπτά | Αυτόματη ακύρωση |
| `assigned` | 10 λεπτά | Επιστροφή στον Admin |
| `preparing` | 60 λεπτά | Ειδοποίηση Admin |

**Σημείωση:** Για MVP, δεν υλοποιούνται timeouts—χειροκίνητη διαχείριση από Admin.

---

**Τελευταία ενημέρωση:** 18/11/2025
