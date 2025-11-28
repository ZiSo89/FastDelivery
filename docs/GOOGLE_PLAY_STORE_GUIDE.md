# 📱 Οδηγός Δημοσίευσης στο Google Play Store

**Fast Delivery - Customer & Driver Apps**

---

## 📋 1. Προαπαιτούμενα

### Λογαριασμός Google Play Developer
| Στοιχείο | Λεπτομέρειες |
|----------|--------------|
| **Κόστος** | $25 εφάπαξ |
| **Εγγραφή** | [play.google.com/console](https://play.google.com/console) |
| **Επαλήθευση** | Ταυτότητα (1-2 εργάσιμες ημέρες) |

### Εργαλεία που χρειάζονται
- ✅ **EAS CLI** - Expo Application Services
- ✅ **Expo account** - [expo.dev](https://expo.dev)
- ✅ **Node.js** - Για τρέξιμο εντολών

---

## 📦 2. Production Build (AAB format)

Το Google Play απαιτεί **AAB (Android App Bundle)**, όχι APK.

### 2.1 Ρύθμιση eas.json

Βεβαιώσου ότι το `eas.json` έχει production profile:

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 2.2 Εκτέλεση Production Build

```powershell
# Customer App
cd fast-delivery-mobile/customer
eas build --platform android --profile production

# Driver App  
cd fast-delivery-mobile/driver
eas build --platform android --profile production
```

### 2.3 Παρακολούθηση Build
- **Expo Dashboard:** https://expo.dev/accounts/zisosak
- Μετά την ολοκλήρωση, κατεβάζεις το `.aab` αρχείο

---

## 🔐 3. Signing Key (Keystore)

### Αυτόματη Δημιουργία
Το EAS δημιουργεί αυτόματα keystore κατά το πρώτο build.

### Διαχείριση Credentials
```powershell
eas credentials
```

### ⚠️ ΣΗΜΑΝΤΙΚΟ - Backup Keystore!
```powershell
# Κατέβασε το keystore για backup
eas credentials --platform android
# Επίλεξε: Download credentials from EAS
```

**Κράτα το keystore σε ασφαλές μέρος!** Αν το χάσεις, δεν μπορείς να ενημερώσεις την εφαρμογή.

---

## 📝 4. Υλικό για το Store Listing

### 4.1 Γραφικά

| Στοιχείο | Διαστάσεις | Μορφή | Απαιτείται |
|----------|------------|-------|------------|
| **App Icon** | 512 x 512 px | PNG (32-bit) | ✅ Ναι |
| **Feature Graphic** | 1024 x 500 px | PNG/JPG | ✅ Ναι |
| **Screenshots** | Min 320px πλάτος | PNG/JPG | ✅ Min 2 |
| **Promo Video** | YouTube link | - | ❌ Όχι |

### 4.2 Screenshots Απαιτήσεις
- **Ελάχιστα:** 2 screenshots
- **Μέγιστα:** 8 screenshots
- **Τύποι συσκευών:** Phone, Tablet (προαιρετικό)
- **Συμβουλή:** Πρόσθεσε επεξηγηματικό κείμενο στα screenshots

### 4.3 Κείμενα

| Πεδίο | Όριο | Παράδειγμα |
|-------|------|------------|
| **App Name** | 30 χαρακτήρες | Fast Delivery Customer |
| **Short Description** | 80 χαρακτήρες | Παράγγειλε φαγητό εύκολα και γρήγορα! |
| **Full Description** | 4000 χαρακτήρες | Αναλυτική περιγραφή... |

---

## 📄 5. Privacy Policy (Υποχρεωτικό)

### Γιατί χρειάζεται;
Η εφαρμογή συλλέγει:
- 📍 Location data (τοποθεσία)
- 👤 Personal info (email, τηλέφωνο)
- 🔐 Authentication data

### Δωρεάν Privacy Policy Generators
1. [privacypolicygenerator.info](https://www.privacypolicygenerator.info/)
2. [freeprivacypolicy.com](https://www.freeprivacypolicy.com/)
3. [termsfeed.com](https://www.termsfeed.com/privacy-policy-generator/)

### Που να το φιλοξενήσεις
- GitHub Pages (δωρεάν)
- Στο website της εταιρείας
- Google Sites (δωρεάν)

### Παράδειγμα URL
```
https://fastdelivery.gr/privacy-policy
https://ziso89.github.io/fastdelivery-privacy
```

---

## 🚀 6. Διαδικασία Upload στο Play Console

### Βήμα 1: Δημιουργία App
1. Σύνδεση στο [Play Console](https://play.google.com/console)
2. **"Create app"**
3. Συμπλήρωσε:
   - App name: `Fast Delivery Customer`
   - Default language: `Ελληνικά`
   - App or Game: `App`
   - Free or Paid: `Free`
4. Αποδοχή όρων

### Βήμα 2: Store Listing
1. **Main store listing** → Συμπλήρωσε περιγραφές
2. **Graphics** → Ανέβασε icon, screenshots, feature graphic
3. **Categorization** → Κατηγορία: `Food & Drink`

### Βήμα 3: Content Rating
1. Πήγαινε στο **Policy** → **App content** → **Content rating**
2. Συμπλήρωσε το ερωτηματολόγιο IARC
3. Θα πάρεις rating (συνήθως "Everyone" ή "Everyone 10+")

### Βήμα 4: Target Audience
1. **Policy** → **App content** → **Target audience**
2. Επίλεξε ηλικιακές ομάδες (18+ για food delivery)
3. Απάντησε αν απευθύνεται σε παιδιά (Όχι)

### Βήμα 5: Data Safety
1. **Policy** → **App content** → **Data safety**
2. Δήλωσε τι δεδομένα συλλέγεις:
   - ✅ Location
   - ✅ Personal info (name, email, phone)
   - ✅ App activity
3. Εξήγησε γιατί (για παράδοση, επικοινωνία)

### Βήμα 6: Upload AAB
1. **Release** → **Production** → **Create new release**
2. **Upload** → Ανέβασε το `.aab` αρχείο
3. Πρόσθεσε Release notes:
   ```
   Πρώτη έκδοση της εφαρμογής Fast Delivery!
   - Παραγγελία φαγητού
   - Παρακολούθηση παράδοσης σε πραγματικό χρόνο
   - Push notifications
   ```

### Βήμα 7: Review & Publish
1. Έλεγξε όλα τα checkmarks στο Dashboard
2. **"Review and roll out"**
3. Περίμενε έγκριση (1-7 ημέρες)

---

## ⚡ 7. Γρήγορο Testing με Internal Testing

Για **πιο γρήγορο review** (ώρες αντί για μέρες):

1. **Release** → **Testing** → **Internal testing**
2. Δημιούργησε internal testing track
3. Ανέβασε το AAB εκεί πρώτα
4. Πρόσθεσε testers (email addresses)
5. Οι testers λαμβάνουν link για εγκατάσταση

---

## 🔧 8. Τεχνικές Ρυθμίσεις

### app.json Απαιτήσεις

```json
{
  "expo": {
    "name": "Fast Delivery Customer",
    "slug": "customer",
    "version": "1.0.0",
    "android": {
      "package": "com.fastdelivery.customer",
      "versionCode": 1,
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    }
  }
}
```

### Firebase Configuration
Αν χρησιμοποιείς Firebase για push notifications:
1. Πήγαινε στο Firebase Console
2. **Project Settings** → **Your apps** → **Android app**
3. Πρόσθεσε το **SHA-256 fingerprint** του production keystore:
   ```powershell
   eas credentials
   # Δες το SHA-256 fingerprint
   ```

### API Keys
Βεβαιώσου ότι τα API keys (Google Maps κλπ) είναι:
- ✅ Restricted για production
- ✅ Έχουν το σωστό package name

---

## 📊 9. Checklist Πριν το Upload

### Customer App
| Στοιχείο | Κατάσταση |
|----------|-----------|
| Google Play Developer account | ⬜ |
| Production build (AAB) | ⬜ |
| App icon 512x512 | ⬜ |
| Feature graphic 1024x500 | ⬜ |
| Screenshots (min 2) | ⬜ |
| Privacy Policy URL | ⬜ |
| Short description (80 chars) | ⬜ |
| Full description | ⬜ |
| Content rating completed | ⬜ |
| Data safety form completed | ⬜ |
| Keystore backup saved | ⬜ |

### Driver App
| Στοιχείο | Κατάσταση |
|----------|-----------|
| Google Play Developer account | ⬜ |
| Production build (AAB) | ⬜ |
| App icon 512x512 | ⬜ |
| Feature graphic 1024x500 | ⬜ |
| Screenshots (min 2) | ⬜ |
| Privacy Policy URL | ⬜ |
| Short description (80 chars) | ⬜ |
| Full description | ⬜ |
| Content rating completed | ⬜ |
| Data safety form completed | ⬜ |
| Keystore backup saved | ⬜ |

---

## ⚠️ 10. Συνήθη Προβλήματα

### "App rejected" - Συνήθεις λόγοι
1. **Missing Privacy Policy** - Πρόσθεσε link
2. **Incomplete Data Safety** - Συμπλήρωσε όλα τα πεδία
3. **Misleading content** - Ταίριαξε screenshots με functionality
4. **Crashes** - Τέσταρε καλά πριν το upload

### Version Code Conflict
```powershell
# Αύξησε το versionCode στο app.json
"android": {
  "versionCode": 2  // αύξησε κάθε φορά
}
```

### Keystore Lost
**Δεν υπάρχει recovery!** Θα πρέπει να δημιουργήσεις νέα εφαρμογή με διαφορετικό package name.

---

## 📞 11. Υποστήριξη

- **Google Play Help:** [support.google.com/googleplay/android-developer](https://support.google.com/googleplay/android-developer)
- **Expo Docs:** [docs.expo.dev](https://docs.expo.dev)
- **EAS Build:** [docs.expo.dev/build/introduction](https://docs.expo.dev/build/introduction)

---

## 📅 Timeline Εκτίμηση

| Βήμα | Χρόνος |
|------|--------|
| Δημιουργία Play Developer account | 1-2 ημέρες |
| Ετοιμασία γραφικών | 2-4 ώρες |
| Production build | 15-30 λεπτά |
| Συμπλήρωση Store listing | 1-2 ώρες |
| Internal testing review | 1-2 ώρες |
| Production review | 1-7 ημέρες |
| **Σύνολο** | **3-10 ημέρες** |

---

*Τελευταία ενημέρωση: Νοέμβριος 2025*
