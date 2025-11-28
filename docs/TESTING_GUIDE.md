# 🧪 Fast Delivery - Οδηγός Testing

**Τελευταία Ενημέρωση:** 2025-11-28

Αυτός ο οδηγός περιγράφει βήμα-βήμα πώς να τεστάρεις όλα τα features της εφαρμογής.

---

## 📋 Προετοιμασία

### 1. Εκκίνηση Συστήματος

Άνοιξε **4 terminals** και τρέξε:

```powershell
# Terminal 1: Backend
cd fast-delivery-backend
node server.js
# Θα δείς: "Server running on port 5001"

# Terminal 2: Frontend (Admin Panel)
cd fast-delivery-frontend
npm start
# Θα ανοίξει: http://localhost:3000

# Terminal 3: Customer Mobile App
cd fast-delivery-mobile/customer
npx expo start
# Σκάναρε QR με Expo Go ή πάτα 'a' για emulator

# Terminal 4: Driver Mobile App
cd fast-delivery-mobile/driver
npx expo start --port 8082
# Σκάναρε QR με Expo Go ή πάτα 'a' για emulator
```

### 2. Test Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@fastdelivery.gr | admin123 |
| **Store** | store@test.com | store123 |
| **Driver** | driver@test.com | driver123 |
| **Customer** | sakis@test.com | password123 |

---

## 🧪 ΣΕΝΑΡΙΟ 1: Πλήρης Ροή Παραγγελίας (End-to-End)

### Βήμα 1: Customer - Δημιουργία Παραγγελίας

1. Άνοιξε την **Customer App** στο κινητό/emulator
2. Κάνε **Login** ή συνέχισε ως **Guest**
3. Επίλεξε ένα κατάστημα (π.χ. "Καφετέρια Κεντρική")
4. Αν είσαι Guest:
   - Συμπλήρωσε **Όνομα**, **Τηλέφωνο**
   - Πάτα "Χρήση τρέχουσας τοποθεσίας" ή γράψε διεύθυνση
5. Γράψε την παραγγελία (π.χ. "2 καφέδες φραπέ μέτριους")
6. Πάτα **Αποστολή Παραγγελίας**

**✅ Αναμενόμενο:** Εμφανίζεται μήνυμα επιτυχίας με αριθμό παραγγελίας (π.χ. ORD-20251128-0001)

---

### Βήμα 2: Store - Αποδοχή & Τιμολόγηση

1. Άνοιξε το **Frontend** (http://localhost:3000)
2. Κάνε **Login ως Store** (store@test.com / store123)
3. Στο Dashboard θα δεις τη νέα παραγγελία με status "Αναμονή"
4. Πάτα **Αποδοχή**
5. Στο modal που ανοίγει:
   - Βάλε **Τιμή προϊόντων** (π.χ. 5.00€)
   - Βάλε **Εκτιμώμενο χρόνο** (π.χ. 15 λεπτά)
   - Πάτα **Υποβολή**

**✅ Αναμενόμενο:** Status αλλάζει σε "Τιμολογημένη" (priced)

---

### Βήμα 3: Customer - Επιβεβαίωση Τιμής

1. Επέστρεψε στην **Customer App**
2. Πήγαινε στις **Παραγγελίες μου**
3. Πάτα στην παραγγελία
4. Θα δεις την τιμή - πάτα **Επιβεβαίωση**

**✅ Αναμενόμενο:** Status αλλάζει σε "Επιβεβαιωμένη" (confirmed)

---

### Βήμα 4: Admin - Ανάθεση Διανομέα

1. Άνοιξε νέο tab στο browser
2. Κάνε **Login ως Admin** (admin@fastdelivery.gr / admin123)
3. Πήγαινε στο tab **Παραγγελίες**
4. Βρες την παραγγελία (status: Επιβεβαιωμένη)
5. Στο dropdown **Διανομέας**, επίλεξε έναν driver
6. Πάτα **Ανάθεση**

**✅ Αναμενόμενο:** Status αλλάζει σε "Ανατέθηκε" (assigned)

---

### Βήμα 5: Driver - Αποδοχή Παραγγελίας

1. Άνοιξε την **Driver App** στο κινητό/emulator
2. Κάνε **Login** (driver@test.com / driver123)
3. Θα δεις notification για νέα παραγγελία
4. Στο Dashboard, βρες την παραγγελία
5. Πάτα **Αποδοχή**

**✅ Αναμενόμενο:** Status αλλάζει σε "Αποδεκτή από Οδηγό" (accepted_driver)

---

### Βήμα 6: Store - Ετοιμασία Παραγγελίας

1. Επέστρεψε στο **Store Dashboard**
2. Η παραγγελία τώρα δείχνει ότι ο driver έχει αποδεχθεί
3. Όταν ετοιμαστεί, πάτα **Έτοιμη για Παραλαβή**

**✅ Αναμενόμενο:** Status αλλάζει σε "Ετοιμάζεται" (preparing) → "Έτοιμη" (ready)

---

### Βήμα 7: Driver - Παραλαβή & Παράδοση

1. Στην **Driver App**:
2. Πάτα **Παρέλαβα** (picked up)
3. Πάτα **Ξεκίνησα Παράδοση** 
4. Ο χάρτης θα δείξει τη διαδρομή προς τον πελάτη
5. Όταν φτάσεις, πάτα **Ολοκληρώθηκε**

**✅ Αναμενόμενο:** Status αλλάζει σε "Σε Παράδοση" (in_delivery) → "Ολοκληρώθηκε" (completed)

---

### Βήμα 8: Επαλήθευση

1. **Admin Dashboard** → Η παραγγελία είναι "Ολοκληρωμένη" ✅
2. **Store Dashboard** → Η παραγγελία εμφανίζεται στο ιστορικό ✅
3. **Customer App** → Παραγγελίες μου → Status "Ολοκληρώθηκε" ✅

---

## 🧪 ΣΕΝΑΡΙΟ 2: Guest Παραγγελία

### Βήματα:

1. **Customer App** → ΜΗΝ κάνεις login
2. Επίλεξε κατάστημα
3. Θα εμφανιστεί modal για Guest στοιχεία:
   - Όνομα: "Γιάννης"
   - Τηλέφωνο: "6971234567"
   - Διεύθυνση: "Κύπρου 15, Αλεξανδρούπολη"
4. Γράψε παραγγελία & υποβολή

**✅ Αναμενόμενο:** Η παραγγελία δημιουργείται χωρίς user account

---

## 🧪 ΣΕΝΑΡΙΟ 3: Ακύρωση Παραγγελίας

### Από Store:

1. Κάνε login στο **Store Dashboard**
2. Σε παραγγελία με status "Αναμονή"
3. Πάτα **Απόρριψη**
4. Γράψε λόγο (π.χ. "Δεν έχουμε διαθέσιμα προϊόντα")

**✅ Αναμενόμενο:** Status → "Απορρίφθηκε", ο πελάτης ενημερώνεται

### Από Admin:

1. Κάνε login στο **Admin Dashboard**
2. Tab **Παραγγελίες**
3. Βρες την παραγγελία → Πάτα **Ακύρωση**

**✅ Αναμενόμενο:** Status → "Ακυρώθηκε"

---

## 🧪 ΣΕΝΑΡΙΟ 4: Έγκριση Νέου Καταστήματος

### Βήμα 1: Εγγραφή Καταστήματος

1. Πήγαινε στο http://localhost:3000/store/register
2. Συμπλήρωσε:
   - Επωνυμία: "Πίτσα Express"
   - Email: newstore@test.com
   - Password: store123
   - Τύπος: Πιτσαρία
   - Διεύθυνση: "Δημοκρατίας 50, Αλεξανδρούπολη"
   - Τηλέφωνο: 2551099999
3. Υποβολή

**✅ Αναμενόμενο:** Μήνυμα "Η αίτηση υποβλήθηκε"

### Βήμα 2: Έγκριση από Admin

1. Login στο **Admin Dashboard**
2. Tab **Καταστήματα**
3. Βρες το νέο κατάστημα (status: Pending)
4. Πάτα **Έγκριση** ✅

**✅ Αναμενόμενο:** Το κατάστημα μπορεί τώρα να κάνει login

---

## 🧪 ΣΕΝΑΡΙΟ 5: Έγκριση Νέου Διανομέα

### Βήμα 1: Εγγραφή Driver

1. Πήγαινε στο http://localhost:3000/driver/register
2. Συμπλήρωσε:
   - Όνομα: "Νίκος Παπαδόπουλος"
   - Email: newdriver@test.com
   - Password: driver123
   - Τηλέφωνο: 6971234567
   - Όχημα: Μηχανή
   - Αριθμός Κυκλοφορίας: ΑΒΓ-1234
3. Υποβολή

### Βήμα 2: Έγκριση από Admin

1. Login στο **Admin Dashboard**
2. Tab **Οδηγοί**
3. Βρες τον νέο driver (status: Pending)
4. Πάτα **Έγκριση** ✅

**✅ Αναμενόμενο:** Ο driver μπορεί τώρα να κάνει login στην Driver App

---

## 🧪 ΣΕΝΑΡΙΟ 6: Statistics Tab Testing

### Βήματα:

1. Login στο **Admin Dashboard**
2. Πήγαινε στο tab **Στατιστικά**
3. Επέλεξε μήνα/έτος
4. Έλεγξε:
   - ✅ Εμφανίζονται τα έσοδα του μήνα
   - ✅ Εμφανίζονται οι μισθοί διανομέων
   - ✅ Το γράφημα παραγγελιών ανά ημέρα
   - ✅ Το γράφημα εσόδων ανά μήνα
   - ✅ Top 5 καταστήματα/διανομείς/πελάτες

### Test Έκτακτων Εξόδων:

1. Στο tab **Στατιστικά**
2. Στην κάρτα "Έκτακτα Έξοδα Μήνα":
   - Βάλε ποσό: 150
   - Βάλε σημειώσεις: "Συντήρηση οχήματος"
   - Πάτα **Αποθήκευση**
3. Το "Καθαρό Αποτέλεσμα" θα ενημερωθεί

**✅ Αναμενόμενο:** Τα έξοδα αποθηκεύονται και υπολογίζονται στο καθαρό

---

## 🧪 ΣΕΝΑΡΙΟ 7: Settings Tab Testing

### Test Μισθού Διανομέα:

1. Login στο **Admin Dashboard**
2. Πήγαινε στο tab **Ρυθμίσεις**
3. Άλλαξε τον "Μισθό Διανομέα" σε 850€
4. Πάτα **Αποθήκευση Ρυθμίσεων**
5. Πήγαινε στα **Στατιστικά**
6. Έλεγξε ότι οι μισθοί υπολογίζονται με 850€

**✅ Αναμενόμενο:** Νέος μισθός εμφανίζεται στα στατιστικά

### Test Τύπων Καταστημάτων:

1. Στο tab **Ρυθμίσεις**
2. Στην κάρτα "Τύποι Καταστημάτων":
   - Γράψε: "Σουβλατζίδικο"
   - Πάτα το ➕
3. Ο νέος τύπος εμφανίζεται στη λίστα

### Test Διαγραφής Τύπου:

1. Πάτα το 🗑️ δίπλα σε έναν τύπο που ΔΕΝ χρησιμοποιείται
2. Επιβεβαίωσε τη διαγραφή

**✅ Αναμενόμενο:** Ο τύπος διαγράφεται

### Test Διαγραφής Τύπου που Χρησιμοποιείται:

1. Πάτα το 🗑️ δίπλα στον τύπο "Καφετέρια" (έχει καταστήματα)
2. Θα εμφανιστεί error

**✅ Αναμενόμενο:** "Δεν μπορεί να διαγραφεί - X καταστήματα χρησιμοποιούν αυτόν τον τύπο"

---

## 🧪 ΣΕΝΑΡΙΟ 8: Real-time Updates (Socket.IO)

### Test 1: Νέα Παραγγελία → Store Notification

1. Έχε ανοιχτό το **Store Dashboard**
2. Από την **Customer App**, κάνε νέα παραγγελία στο ίδιο κατάστημα
3. Το Store Dashboard θα ανανεωθεί αυτόματα με ήχο 🔔

### Test 2: Status Change → Customer Notification

1. Έχε ανοιχτή την **Customer App** στις παραγγελίες
2. Από το Store, άλλαξε status μιας παραγγελίας
3. Η Customer App θα δείξει το νέο status

### Test 3: Driver Location → Admin Map

1. Από την **Driver App**, ξεκίνα μια παράδοση
2. Στο **Admin Dashboard**, η τοποθεσία του driver ενημερώνεται

---

## 🧪 ΣΕΝΑΡΙΟ 9: Pagination Testing

### Orders Tab:

1. Login στο **Admin Dashboard**
2. Tab **Παραγγελίες**
3. Επίλεξε "Όλες οι παραγγελίες" (αντί για "Σε εξέλιξη")
4. Αν υπάρχουν >50 παραγγελίες, θα εμφανιστεί pagination
5. Πάτα "Επόμενη" για τη 2η σελίδα

**✅ Αναμενόμενο:** 50 παραγγελίες ανά σελίδα

---

## 🧪 ΣΕΝΑΡΙΟ 10: Error Handling

### Test 1: Λάθος Credentials

1. Πήγαινε στο Login
2. Βάλε λάθος password
3. Θα εμφανιστεί error "Λάθος email ή κωδικός"

### Test 2: Network Error

1. Σταμάτα το backend (Ctrl+C)
2. Προσπάθησε να κάνεις κάτι στο frontend
3. Θα εμφανιστεί error "Αδυναμία σύνδεσης με τον server"

### Test 3: Validation Error

1. Store Register → Άφησε κενό το email
2. Θα εμφανιστεί validation error

---

## 🧪 ΣΕΝΑΡΙΟ 11: Mobile App Specific

### Customer App - Voice Order:

1. Στην οθόνη παραγγελίας
2. Πάτα το 🎤 (μικρόφωνο)
3. Μίλα την παραγγελία
4. Το κείμενο θα εμφανιστεί (speech-to-text)

⚠️ **Σημείωση:** Δουλεύει μόνο σε πραγματική συσκευή, όχι emulator

### Driver App - Location Tracking:

1. Login στην Driver App
2. Αποδέξου μια παραγγελία
3. Πάτα "Ξεκίνησα Παράδοση"
4. Η τοποθεσία σου στέλνεται κάθε 10 δευτερόλεπτα

---

## 📱 Testing σε Emulator vs Real Device

| Feature | Emulator | Real Device |
|---------|----------|-------------|
| GPS Location | ❌ Fake location (Google HQ) | ✅ Real GPS |
| Push Notifications | ⚠️ Limited (Expo Go) | ✅ Full (APK build) |
| Voice Recording | ❌ No microphone | ✅ Works |
| Camera | ⚠️ Simulated | ✅ Real |
| Performance | 🐢 Slower | 🚀 Fast |

### Για GPS στον Emulator:

1. Στον Android Emulator
2. Πάτα τις 3 τελείες (...) → Location
3. Βάλε: Latitude: 40.8457, Longitude: 25.8739 (Αλεξανδρούπολη)
4. Πάτα "Set Location"

---

## 🔧 Troubleshooting

### Πρόβλημα: "Module not found"

```powershell
cd fast-delivery-frontend  # ή backend/mobile
npm install
```

### Πρόβλημα: "Port already in use"

```powershell
# Βρες τι χρησιμοποιεί τη port
netstat -ano | findstr :5001
# Σκότωσε το process
taskkill /PID <PID> /F
```

### Πρόβλημα: MongoDB Connection Error

```powershell
# Έλεγξε αν τρέχει
mongod --version
# Ή χρησιμοποίησε MongoDB Atlas (cloud)
```

### Πρόβλημα: Expo App δεν συνδέεται

1. Βεβαιώσου ότι κινητό & PC είναι στο **ίδιο WiFi**
2. Απενεργοποίησε το **Windows Firewall** προσωρινά
3. Χρησιμοποίησε **tunnel**: `npx expo start --tunnel`

---

## 📊 Quick Reference: Order Status Flow

```
pending          → Νέα παραγγελία (αναμονή store)
accepted_store   → Store αποδέχθηκε
priced           → Store έβαλε τιμή
confirmed        → Πελάτης επιβεβαίωσε τιμή
assigned         → Admin ανέθεσε driver
accepted_driver  → Driver αποδέχθηκε
preparing        → Ετοιμάζεται
ready            → Έτοιμη για παραλαβή
picked_up        → Driver παρέλαβε
in_delivery      → Σε διαδρομή παράδοσης
completed        → Ολοκληρώθηκε ✅
cancelled        → Ακυρώθηκε ❌
rejected         → Απορρίφθηκε ❌
```

---

## ✅ Checklist πριν το Deploy

- [ ] Όλα τα terminals τρέχουν χωρίς errors
- [ ] Login λειτουργεί για όλους τους ρόλους
- [ ] Πλήρης ροή παραγγελίας (Σενάριο 1) ✅
- [ ] Real-time updates λειτουργούν
- [ ] Statistics εμφανίζονται σωστά
- [ ] Settings αποθηκεύονται
- [ ] Mobile apps συνδέονται με backend

---

**Καλό Testing! 🚀**
