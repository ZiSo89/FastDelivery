# 🔐 Οδηγίες Αλλαγής Admin Credentials

## Τρόπος Αλλαγής Email και Κωδικού Διαχειριστή

### Μέθοδος 1: Μέσω MongoDB Atlas (Εύκολη - Recommended)

1. **Σύνδεση στο MongoDB Atlas:**
   - Πήγαινε στο: https://cloud.mongodb.com
   - Σύνδεση με τα credentials σου

2. **Πλοήγηση στη Database:**
   - Επίλεξε το cluster: `Cluster0`
   - Κλικ στο `Browse Collections`
   - Επίλεξε Database: `fast_delivery`
   - Επίλεξε Collection: `admins`

3. **Επεξεργασία Admin Document:**
   - Βρες το admin document (υπάρχει μόνο 1)
   - Κλικ στο εικονίδιο Edit (μολύβι)
   - **Αλλαγή Email:**
     ```json
     "email": "ΝΕΟ_EMAIL@example.com"
     ```
   - **Αλλαγή Κωδικού:** (Πρέπει να είναι hashed)
     - Χρησιμοποίησε το script που περιγράφεται παρακάτω

4. **Αποθήκευση:**
   - Κλικ `Update`

---

### Μέθοδος 2: Μέσω Script (Recommended για Hash Password)

**Βήμα 1:** Δημιούργησε το αρχείο `updateAdmin.js` στο `fast-delivery-backend/`:

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import Admin model
const Admin = require('./src/models/Admin');

// MongoDB Connection URI
const MONGODB_URI = 'mongodb+srv://fastdelivery:56ynGiuw24D1T8b3@cluster0.istyclo.mongodb.net/fast_delivery';

// ΝΕΑ ΣΤΟΙΧΕΙΑ ADMIN
const NEW_EMAIL = 'admin@fastdelivery.gr';     // <-- ΑΛΛΑΞΕ ΕΔΩ
const NEW_PASSWORD = 'admin123';                 // <-- ΑΛΛΑΞΕ ΕΔΩ
const NEW_NAME = 'Admin User';                   // <-- ΑΛΛΑΞΕ ΕΔΩ (optional)

async function updateAdminCredentials() {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Find the admin (should be only one)
    const admin = await Admin.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('❌ No admin found. Creating new admin...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
      
      // Create new admin
      const newAdmin = new Admin({
        name: NEW_NAME,
        email: NEW_EMAIL,
        password: hashedPassword,
        role: 'admin'
      });
      
      await newAdmin.save();
      console.log('✅ New admin created successfully!');
    } else {
      console.log('📝 Found admin:', admin.email);
      console.log('🔄 Updating credentials...');
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
      
      // Update admin
      admin.name = NEW_NAME;
      admin.email = NEW_EMAIL;
      admin.password = hashedPassword;
      
      await admin.save();
      console.log('✅ Admin credentials updated successfully!');
    }
    
    console.log('\n📋 New Admin Credentials:');
    console.log('Email:', NEW_EMAIL);
    console.log('Password:', NEW_PASSWORD);
    console.log('Role: admin');
    
    await mongoose.disconnect();
    console.log('\n✅ Done! You can now login with the new credentials.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit();
  }
}

updateAdminCredentials();
```

**Βήμα 2:** Εκτέλεση του script:

```powershell
# Από το φάκελο fast-delivery-backend/
node updateAdmin.js
```

**Βήμα 3:** Δοκιμή σύνδεσης:
- Πήγαινε στο http://localhost:3000/login
- Επίλεξε ρόλο: "Διαχειριστής"
- Email: (το νέο email που έβαλες)
- Password: (το νέο password που έβαλες)

---

### Μέθοδος 3: Μέσω MongoDB Compass (Desktop App)

1. **Κατέβασμα MongoDB Compass:**
   - https://www.mongodb.com/try/download/compass

2. **Σύνδεση:**
   ```
   mongodb+srv://fastdelivery:56ynGiuw24D1T8b3@cluster0.istyclo.mongodb.net/fast_delivery
   ```

3. **Πλοήγηση:**
   - Database: `fast_delivery`
   - Collection: `admins`

4. **Επεξεργασία:**
   - Δεξί κλικ στο document → Edit Document
   - Αλλαγή `email` field
   - Για password: Χρησιμοποίησε το script (Μέθοδος 2)

---

## 🔒 Παραγωγή Password Hash (Χειροκίνητα)

Αν θέλεις να δημιουργήσεις μόνο το hashed password:

**Δημιούργησε το αρχείο `hashPassword.js`:**

```javascript
const bcrypt = require('bcryptjs');

const PASSWORD = 'YOUR_NEW_PASSWORD_HERE'; // <-- ΑΛΛΑΞΕ ΕΔΩ

async function hashPassword() {
  const hashed = await bcrypt.hash(PASSWORD, 10);
  console.log('\n🔐 Hashed Password:');
  console.log(hashed);
  console.log('\nΑντίγραψε αυτό το hash και βάλ\' το στο password field στο MongoDB.\n');
}

hashPassword();
```

**Εκτέλεση:**
```powershell
node hashPassword.js
```

Μετά copy το hashed password και βάλ\' το στο MongoDB Atlas χειροκίνητα.

---

## 📝 Τρέχοντα Admin Credentials (Default)

```
Email: admin@fastdelivery.gr
Password: admin123
Role: admin
```

**⚠️ ΠΡΟΣΟΧΗ:** Για production, άλλαξε ΠΑΝΤΑ το default password!

---

## 🚀 Quick Setup (Πρώτη Εγκατάσταση)

Αν ξεκινάς από μηδέν και δεν υπάρχει admin:

```powershell
# 1. Πήγαινε στο backend folder
cd fast-delivery-backend

# 2. Τρέξε το seed script (δημιουργεί admin + test data)
node tests/seedTestData.js

# 3. Το script θα δημιουργήσει:
#    - Admin: admin@fastdelivery.gr / admin123
#    - Stores (5)
#    - Drivers (4)
#    - Customers (4)
#    - Orders (8)
```

---

## 🔍 Έλεγχος Τρεχόντων Admins

Για να δεις τους υπάρχοντες admins:

```javascript
// checkAdmins.js
const mongoose = require('mongoose');
const Admin = require('./src/models/Admin');

const MONGODB_URI = 'mongodb+srv://fastdelivery:56ynGiuw24D1T8b3@cluster0.istyclo.mongodb.net/fast_delivery';

async function checkAdmins() {
  await mongoose.connect(MONGODB_URI);
  
  const admins = await Admin.find();
  console.log('📋 Admins in database:', admins.length);
  
  admins.forEach((admin, index) => {
    console.log(`\n${index + 1}. Admin:`);
    console.log('   Name:', admin.name);
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
  });
  
  await mongoose.disconnect();
  process.exit();
}

checkAdmins();
```

---

## 💡 Tips

1. **Πάντα κράτα backup** πριν αλλάξεις credentials
2. **Δοκίμασε το login** αμέσως μετά την αλλαγή
3. **Μην μοιράζεσαι** το admin password
4. **Χρησιμοποίησε δυνατό password** για production
5. **Κράτα τα credentials** σε ασφαλές μέρος (π.χ. password manager)

---

**Τελευταία ενημέρωση:** 21/11/2025
