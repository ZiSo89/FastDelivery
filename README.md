# **FastDelivery**

Ένα ολοκληρωμένο σύστημα παραγγελιών delivery που περιλαμβάνει backend και frontend για τη διαχείριση παραγγελιών, καταστημάτων και διανομών.

---

## **Περιεχόμενα**
- [Περιγραφή Έργου](#περιγραφή-έργου)
- [Λειτουργίες Χρηστών](#λειτουργίες-χρηστών)
- [Εγκατάσταση](#εγκατάσταση)
- [Οδηγίες Εκτέλεσης](#οδηγίες-εκτέλεσης)
- [Τεχνολογίες](#τεχνολογίες)

---

## **Περιγραφή Έργου**
Το FastDelivery επιτρέπει τη δημιουργία και διαχείριση παραγγελιών delivery από πελάτες, διαχειριστές και διανομείς. Περιλαμβάνει:
- **Frontend**: Εφαρμογή React για πλοήγηση στον ιστότοπο.
- **Backend**: Express server με σύνδεση σε MongoDB για αποθήκευση δεδομένων.
- **Real-Time Ενημερώσεις**: Socket.IO για ενημερώσεις παραγγελιών σε πραγματικό χρόνο.

---

## **Λειτουργίες Χρηστών**
### **1. Πελάτης (Customer)**
- Δημιουργία παραγγελίας με επιλογή καταστήματος και διεύθυνσης παράδοσης.

### **2. Διαχειριστής (Admin)**
- Διαχείριση καταστημάτων, παραγγελιών και χρηστών.

### **3. Διανομέας (Delivery User)**
- Προβολή αναθέσεων παραγγελιών και ενημέρωση κατάστασης παραγγελιών.

---

## **Εγκατάσταση**

### **Προαπαιτούμενα**
- [Node.js](https://nodejs.org/) (έκδοση 16 ή νεότερη)
- [MongoDB](https://www.mongodb.com/) (τοπικά ή σε cloud)
- Git

---

### **Βήματα Εγκατάστασης**
1. **Κλωνοποίηση του Repository**
   ```bash
   git clone https://github.com/ZiSo89/FastDelivery.git
   cd FastDelivery
   ```

2. **Εγκατάσταση Εξαρτήσεων**
   - **Backend**:
     ```bash
     cd fast-delivery-backend
     npm install
     ```
   - **Frontend**:
     ```bash
     cd ../fast-delivery-frontend
     npm install
     ```

3. **Δημιουργία `.env` Αρχείου** για το Backend
   Δημιουργήστε ένα αρχείο `.env` στον φάκελο `fast-delivery-backend` και προσθέστε τα εξής:
   ```
   MONGO_URI=mongodb://<your-mongodb-url>:27017/fastdelivery
   PORT=5000
   ```

---

## **Οδηγίες Εκτέλεσης**

### **1. Εκκίνηση Backend**
Μεταβείτε στον φάκελο `fast-delivery-backend` και τρέξτε:
```bash
npm start
```
Ο server θα τρέξει στο `http://localhost:5000`.

---

### **2. Εκκίνηση Frontend**
Μεταβείτε στον φάκελο `fast-delivery-frontend` και τρέξτε:
```bash
npm start
```
Η εφαρμογή θα ανοίξει στο `http://localhost:3000`.

---

## **Τεχνολογίες**
- **Frontend**: React.js με React Router
- **Backend**: Express.js, Mongoose
- **Database**: MongoDB
- **Real-Time**: Socket.IO

---

Αν αντιμετωπίσετε προβλήματα ή έχετε απορίες, παρακαλώ ανοίξτε ένα θέμα (issue) στο [GitHub Repository](https://github.com/ZiSo89/FastDelivery/issues).

--- 