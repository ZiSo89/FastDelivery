# 🏙️ Fast Delivery - Multi-City Architecture Plan

**Ημερομηνία:** 2025-12-05  
**Κατάσταση:** 📋 Σχεδιασμός (Δεν έχει υλοποιηθεί)  
**Εκτιμώμενος χρόνος υλοποίησης:** 30-50 ώρες

---

## 📊 Τρέχουσα Αρχιτεκτονική (Single-City)

```
┌─────────────────────────────────────────────────────────┐
│                    FAST DELIVERY                        │
│                   (Αλεξανδρούπολη)                      │
├─────────────────────────────────────────────────────────┤
│  1 Admin → Βλέπει ΟΛΑ                                  │
│  N Stores → Χωρίς φίλτρο πόλης                         │
│  N Drivers → Χωρίς φίλτρο πόλης                        │
│  N Customers → Βλέπουν ΟΛΑ τα καταστήματα              │
│  N Orders → Χωρίς φίλτρο πόλης                         │
└─────────────────────────────────────────────────────────┘
```

**Περιορισμοί:**
- Δεν υπάρχει διαχωρισμός δεδομένων ανά πόλη
- Ένας admin διαχειρίζεται τα πάντα
- Πελάτες βλέπουν καταστήματα από όλες τις περιοχές
- Ρυθμίσεις (ώρες λειτουργίας, τιμές) είναι καθολικές

---

## 🎯 Στόχος: Multi-City / Multi-Tenant Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FAST DELIVERY                               │
│                        (Multi-City)                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ ΑΛΕΞΑΝΔΡΟΥΠΟΛΗ  │  │     ΚΑΒΑΛΑ      │  │     ΞΑΝΘΗ       │     │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤     │
│  │ City Admin      │  │ City Admin      │  │ City Admin      │     │
│  │ Local Stores    │  │ Local Stores    │  │ Local Stores    │     │
│  │ Local Drivers   │  │ Local Drivers   │  │ Local Drivers   │     │
│  │ Local Customers │  │ Local Customers │  │ Local Customers │     │
│  │ Local Orders    │  │ Local Orders    │  │ Local Orders    │     │
│  │ Local Settings  │  │ Local Settings  │  │ Local Settings  │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                     │
│                    ┌─────────────────────┐                         │
│                    │    SUPER ADMIN      │                         │
│                    │  (Βλέπει τα πάντα)  │                         │
│                    └─────────────────────┘                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema Changes

### 1. Νέο Model: City

```javascript
// fast-delivery-backend/src/models/City.js

const citySchema = new mongoose.Schema({
  // Βασικά στοιχεία
  name: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
    // π.χ. "alexandroupoli", "kavala", "xanthi"
  },
  
  // Γεωγραφικά όρια (Polygon για έλεγχο αν διεύθυνση ανήκει στην πόλη)
  boundaries: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: {
      type: [[[Number]]], // Array of arrays of [lng, lat] pairs
      required: true
    }
  },
  
  // Κέντρο πόλης (για default map view)
  center: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  },
  
  // Ρυθμίσεις ανά πόλη
  settings: {
    // Ώρες λειτουργίας
    serviceHoursEnabled: { type: Boolean, default: false },
    serviceHoursStart: { type: String, default: '09:00' },
    serviceHoursEnd: { type: String, default: '23:00' },
    
    // Οικονομικά
    defaultDeliveryFee: { type: Number, default: 2.5 },
    driverSalary: { type: Number, default: 800 },
    
    // Τύποι καταστημάτων (μπορεί να διαφέρουν ανά πόλη)
    storeTypes: [{
      name: String,
      icon: String
    }],
    
    // Timezone (αν χρειαστεί για διαφορετικές χώρες)
    timezone: { type: String, default: 'Europe/Athens' }
  },
  
  // Κατάσταση
  isActive: { type: Boolean, default: true },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
citySchema.index({ slug: 1 });
citySchema.index({ boundaries: '2dsphere' });
citySchema.index({ center: '2dsphere' });
```

### 2. Τροποποίηση: Admin Model

```javascript
// fast-delivery-backend/src/models/Admin.js

const adminSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // ΝΕΑ ΠΕΔΙΑ
  role: {
    type: String,
    enum: ['superadmin', 'city_admin'],
    default: 'city_admin'
  },
  
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: function() {
      return this.role === 'city_admin';
    }
    // null/undefined για superadmin
  },
  
  // Permissions (για μελλοντική επέκταση)
  permissions: {
    canManageStores: { type: Boolean, default: true },
    canManageDrivers: { type: Boolean, default: true },
    canManageOrders: { type: Boolean, default: true },
    canViewStatistics: { type: Boolean, default: true },
    canEditSettings: { type: Boolean, default: true },
    canManageCities: { type: Boolean, default: false } // μόνο superadmin
  }
});
```

### 3. Τροποποίηση: Store Model

```javascript
// fast-delivery-backend/src/models/Store.js

const storeSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // ΝΕΟ ΠΕΔΙΟ
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true,
    index: true
  }
});

// Compound indexes για γρήγορα queries
storeSchema.index({ city: 1, isApproved: 1 });
storeSchema.index({ city: 1, isOnline: 1 });
```

### 4. Τροποποίηση: Driver Model

```javascript
// fast-delivery-backend/src/models/Driver.js

const driverSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // ΝΕΟ ΠΕΔΙΟ
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true,
    index: true
  }
});

// Compound indexes
driverSchema.index({ city: 1, isApproved: 1 });
driverSchema.index({ city: 1, isAvailable: 1 });
```

### 5. Τροποποίηση: Order Model

```javascript
// fast-delivery-backend/src/models/Order.js

const orderSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // ΝΕΟ ΠΕΔΙΟ
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true,
    index: true
  }
});

// Compound indexes για γρήγορα queries
orderSchema.index({ city: 1, status: 1 });
orderSchema.index({ city: 1, createdAt: -1 });
```

### 6. Τροποποίηση: Customer Model

```javascript
// fast-delivery-backend/src/models/Customer.js

const customerSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // ΝΕΟ ΠΕΔΙΟ - Πόλη του πελάτη (based on address)
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true,
    index: true
  },
  
  // Ή εναλλακτικά: πολλές διευθύνσεις σε διαφορετικές πόλεις
  addresses: [{
    label: String, // "Σπίτι", "Δουλειά"
    address: String,
    city: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number]
    },
    isDefault: Boolean
  }]
});
```

### 7. Τροποποίηση: MonthlyExpense Model

```javascript
// fast-delivery-backend/src/models/MonthlyExpense.js

const monthlyExpenseSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // ΝΕΟ ΠΕΔΙΟ
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  }
});

// Compound index
monthlyExpenseSchema.index({ city: 1, year: 1, month: 1 }, { unique: true });
```

---

## 🔧 Backend API Changes

### 1. Middleware: City Context

```javascript
// fast-delivery-backend/src/middleware/cityContext.js

const City = require('../models/City');

// Middleware που προσθέτει το city context σε κάθε request
const cityContext = async (req, res, next) => {
  try {
    // Αν ο χρήστης είναι superadmin, μπορεί να επιλέξει πόλη
    if (req.user.role === 'superadmin') {
      // Πόλη από query param ή header
      const citySlug = req.query.city || req.headers['x-city'];
      if (citySlug) {
        const city = await City.findOne({ slug: citySlug, isActive: true });
        req.city = city;
      }
      // Αν δεν δοθεί πόλη, superadmin βλέπει τα πάντα (req.city = null)
    } 
    // Αν ο χρήστης είναι city_admin, χρησιμοποιεί τη δική του πόλη
    else if (req.user.role === 'city_admin') {
      req.city = await City.findById(req.user.city);
    }
    // Για stores/drivers, χρησιμοποιεί την πόλη τους
    else if (req.user.city) {
      req.city = await City.findById(req.user.city);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = cityContext;
```

### 2. Helper: City Filter

```javascript
// fast-delivery-backend/src/utils/cityFilter.js

// Προσθέτει city filter σε queries
const addCityFilter = (query, req) => {
  // Αν υπάρχει city context, φιλτράρει
  if (req.city) {
    query.city = req.city._id;
  }
  // Αν δεν υπάρχει (superadmin χωρίς επιλογή), επιστρέφει τα πάντα
  return query;
};

module.exports = { addCityFilter };
```

### 3. Παράδειγμα: Updated Controller

```javascript
// fast-delivery-backend/src/controllers/adminController.js

const { addCityFilter } = require('../utils/cityFilter');

// ΠΡΙΝ (Single-City)
const getOrders = async (req, res) => {
  const orders = await Order.find({ status: 'pending' });
  res.json(orders);
};

// ΜΕΤΑ (Multi-City)
const getOrders = async (req, res) => {
  const filter = addCityFilter({ status: 'pending' }, req);
  const orders = await Order.find(filter);
  res.json(orders);
};
```

### 4. Νέα Routes: City Management

```javascript
// fast-delivery-backend/src/routes/city.js

const express = require('express');
const router = express.Router();
const { protect, superAdminOnly } = require('../middleware/auth');

// GET /api/v1/cities - Λίστα πόλεων
router.get('/', protect, getCities);

// POST /api/v1/cities - Δημιουργία πόλης (superadmin only)
router.post('/', protect, superAdminOnly, createCity);

// PUT /api/v1/cities/:id - Ενημέρωση πόλης
router.put('/:id', protect, superAdminOnly, updateCity);

// DELETE /api/v1/cities/:id - Απενεργοποίηση πόλης
router.delete('/:id', protect, superAdminOnly, deactivateCity);

// GET /api/v1/cities/:id/stats - Στατιστικά πόλης
router.get('/:id/stats', protect, getCityStats);

module.exports = router;
```

### 5. Νέο Endpoint: Detect City by Location

```javascript
// POST /api/v1/cities/detect
// Body: { lat: 40.8457, lng: 25.8733 }
// Response: { city: { _id, name, slug } }

const detectCity = async (req, res) => {
  const { lat, lng } = req.body;
  
  const city = await City.findOne({
    boundaries: {
      $geoIntersects: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        }
      }
    },
    isActive: true
  });
  
  if (!city) {
    return res.status(404).json({ 
      message: 'Η υπηρεσία δεν είναι διαθέσιμη στην περιοχή σας' 
    });
  }
  
  res.json({ city });
};
```

---

## 🖥️ Frontend Changes

### 1. Super Admin Dashboard

```javascript
// Νέο component: CitySelector.js
// Dropdown για επιλογή πόλης (εμφανίζεται μόνο σε superadmin)

const CitySelector = () => {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  
  // Αλλαγή πόλης ενημερώνει το context και τα data
  const handleCityChange = (citySlug) => {
    setSelectedCity(citySlug);
    // Refetch all data with new city filter
  };
  
  return (
    <Dropdown>
      <Dropdown.Toggle>
        {selectedCity ? selectedCity.name : 'Όλες οι πόλεις'}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item onClick={() => handleCityChange(null)}>
          Όλες οι πόλεις
        </Dropdown.Item>
        {cities.map(city => (
          <Dropdown.Item 
            key={city._id} 
            onClick={() => handleCityChange(city)}
          >
            {city.name}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};
```

### 2. Νέο Tab: Διαχείριση Πόλεων

```javascript
// components/admin/CitiesTab.js

// Features:
// - Λίστα πόλεων με status (Active/Inactive)
// - Προσθήκη νέας πόλης
// - Επεξεργασία ρυθμίσεων πόλης
// - Ανάθεση City Admin
// - Στατιστικά ανά πόλη (overview)
// - Χάρτης με polygons των περιοχών
```

### 3. City Admin Περιορισμοί

```javascript
// AuthContext.js ή ProtectedRoute.js

// City admin δεν βλέπει:
// - Διαχείριση Πόλεων tab
// - Dropdown επιλογής πόλης
// - Δεδομένα άλλων πόλεων

// City admin βλέπει μόνο:
// - Τα δεδομένα της δικής του πόλης
// - Τις ρυθμίσεις της δικής του πόλης
```

---

## 📱 Mobile App Changes

### 1. Customer App: City Selection

```javascript
// screens/CitySelectScreen.js (νέο)
// Εμφανίζεται κατά το πρώτο άνοιγμα ή αν GPS δεν λειτουργεί

const CitySelectScreen = () => {
  const [cities, setCities] = useState([]);
  
  return (
    <View>
      <Text>Επιλέξτε την πόλη σας</Text>
      <FlatList
        data={cities}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => selectCity(item)}>
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};
```

### 2. Customer App: Auto-Detect City

```javascript
// services/cityService.js

const detectUserCity = async () => {
  try {
    // Πάρε GPS location
    const location = await Location.getCurrentPositionAsync();
    
    // Στείλε στο backend για detect
    const response = await api.post('/cities/detect', {
      lat: location.coords.latitude,
      lng: location.coords.longitude
    });
    
    return response.data.city;
  } catch (error) {
    // Fallback: Ζήτα από τον χρήστη να επιλέξει
    return null;
  }
};
```

### 3. City Context στο App

```javascript
// context/CityContext.js

const CityContext = createContext();

export const CityProvider = ({ children }) => {
  const [city, setCity] = useState(null);
  
  // Αποθήκευση επιλογής
  useEffect(() => {
    if (city) {
      AsyncStorage.setItem('selectedCity', JSON.stringify(city));
    }
  }, [city]);
  
  return (
    <CityContext.Provider value={{ city, setCity }}>
      {children}
    </CityContext.Provider>
  );
};
```

---

## 🔄 Migration Plan

### Phase 1: Προετοιμασία (Χωρίς breaking changes)

1. ✅ Δημιουργία City model
2. ✅ Προσθήκη `city` field σε όλα τα models (optional, default null)
3. ✅ Δημιουργία default City "Αλεξανδρούπολη"
4. ✅ Migration script: Ανάθεση όλων των υπαρχόντων records στην default city

```javascript
// migration/001_add_cities.js

const migrateToMultiCity = async () => {
  // 1. Δημιουργία default city
  const defaultCity = await City.create({
    name: 'Αλεξανδρούπολη',
    slug: 'alexandroupoli',
    center: { type: 'Point', coordinates: [25.8733, 40.8457] },
    boundaries: { /* polygon coordinates */ },
    isActive: true
  });
  
  // 2. Ανάθεση σε όλα τα υπάρχοντα records
  await Store.updateMany({}, { city: defaultCity._id });
  await Driver.updateMany({}, { city: defaultCity._id });
  await Customer.updateMany({}, { city: defaultCity._id });
  await Order.updateMany({}, { city: defaultCity._id });
  await MonthlyExpense.updateMany({}, { city: defaultCity._id });
  
  // 3. Ενημέρωση admin σε superadmin
  await Admin.updateMany({}, { role: 'superadmin', city: null });
  
  console.log('Migration completed!');
};
```

### Phase 2: Backend Updates

1. Προσθήκη cityContext middleware
2. Ενημέρωση όλων των controllers με city filters
3. Νέα routes για city management
4. Testing με Postman

### Phase 3: Frontend Updates

1. City selector για superadmin
2. Νέο Cities tab
3. Περιορισμοί για city_admin role
4. Testing

### Phase 4: Mobile Updates

1. City detection/selection
2. City context
3. Filtering stores by city
4. Testing

### Phase 5: Production Deployment

1. Backup database
2. Run migration
3. Deploy backend
4. Deploy frontend
5. Publish mobile apps
6. Monitor for issues

---

## 📊 Εκτίμηση Χρόνου

| Task | Ώρες |
|------|------|
| City Model & Migration | 4 |
| Backend Controllers Update | 8 |
| City Management API | 6 |
| Super Admin UI | 8 |
| City Admin Restrictions | 4 |
| Customer App - City Select | 6 |
| Customer App - Auto Detect | 4 |
| Driver App Updates | 4 |
| Testing & Bug Fixes | 8 |
| **Σύνολο** | **~50 ώρες** |

---

## ⚠️ Σημαντικές Σημειώσεις

### 1. Socket.IO Rooms

```javascript
// Τώρα: socket.join(`order_${orderId}`)
// Multi-city: socket.join(`city_${citySlug}:order_${orderId}`)

// Ή καλύτερα: Ξεχωριστά namespaces
// io.of('/alexandroupoli').on('connection', ...)
// io.of('/kavala').on('connection', ...)
```

### 2. Push Notifications

```javascript
// Τώρα: Broadcast σε όλους
// Multi-city: Filter by city

// Αλλαγή στο topic structure
// Τώρα: "new_order"
// Multi-city: "alexandroupoli_new_order", "kavala_new_order"
```

### 3. Statistics

```javascript
// Superadmin βλέπει:
// - Aggregate stats από όλες τις πόλεις
// - Breakdown ανά πόλη
// - Comparison μεταξύ πόλεων

// City Admin βλέπει:
// - Μόνο τα stats της δικής του πόλης
```

### 4. Settings Inheritance

```javascript
// Global settings (default values)
// ↓
// City settings (override per city)
// ↓
// Store settings (override per store, if needed)
```

---

## 🚀 Πότε να το υλοποιήσεις

**Υλοποίησε Multi-City ΟΤΑΝ:**
- ✅ Έχεις ξεκάθαρο πλάνο για 2+ πόλεις
- ✅ Έχεις χρόνο για proper testing
- ✅ Έχεις backup strategy

**ΜΗΝ το υλοποιήσεις αν:**
- ❌ Δεν είσαι σίγουρος για expansion
- ❌ Έχεις πολλά pending features
- ❌ Η εφαρμογή δεν είναι stable

---

## 📝 Εναλλακτική: Ξεχωριστά Deployments

Αν προτιμάς απλούστερη λύση:

```
fastdelivery-alex.gr  → MongoDB: fastdelivery_alex
fastdelivery-kavala.gr → MongoDB: fastdelivery_kavala
```

**Πλεονεκτήματα:**
- Μηδέν αλλαγές στον κώδικα
- Πλήρης απομόνωση
- Εύκολο setup

**Μειονεκτήματα:**
- Πολλαπλά deployments
- Πολλαπλές DBs
- Δεν υπάρχει central dashboard

---

## 📚 Related Documentation

- [MongoDB Geospatial Queries](https://docs.mongodb.com/manual/geospatial-queries/)
- [Multi-Tenant Architecture Best Practices](https://docs.microsoft.com/en-us/azure/architecture/guide/multitenant/overview)
- [Socket.IO Namespaces](https://socket.io/docs/v4/namespaces/)

---

*Αυτό το έγγραφο είναι σχεδιασμός για μελλοντική υλοποίηση. Καμία αλλαγή δεν έχει γίνει στον κώδικα.*
