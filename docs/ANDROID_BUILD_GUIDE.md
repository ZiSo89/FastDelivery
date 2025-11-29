# 📱 Οδηγός Build Android APK

Αυτός ο οδηγός περιγράφει πώς να κάνεις build τα Android APK για τις εφαρμογές **Customer** και **Driver** του FastDelivery.

---

## 📋 Προαπαιτούμενα

### 1. Java JDK 17
- Εγκατάσταση: [Eclipse Adoptium JDK 17](https://adoptium.net/)
- Τοποθεσία: `C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot`

### 2. Android SDK
- Τοποθεσία: `C:\Users\<username>\AppData\Local\Android\Sdk`
- Απαιτείται: Android Studio ή Android Command Line Tools

### 3. Node.js & npm
- Εγκατεστημένο με τα project dependencies

---

## 🔧 Ρύθμιση Περιβάλλοντος

### Ρύθμιση JAVA_HOME (PowerShell)
```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"
```

### Προσθήκη ADB στο PATH
```powershell
$env:PATH = "$env:PATH;C:\Users\<username>\AppData\Local\Android\Sdk\platform-tools"
```

---

## 🏗️ Build Customer APK

### Βήμα 1: Δημιουργία Junction (αποφυγή long path errors)
```powershell
# Δημιουργία junction για να αποφύγουμε Windows long path issues
cmd /c "mklink /J C:\A C:\Users\<username>\Documents\Projects\FastDelivery"
```

### Βήμα 2: Αντιγραφή και προετοιμασία
```powershell
cd C:\A

# Αντιγραφή customer app στο junction
Copy-Item -Recurse ".\fast-delivery-mobile\customer" -Destination "C:\A\customer"

cd C:\A\customer

# Εγκατάσταση dependencies
npm install
```

### Βήμα 3: Prebuild (δημιουργία Android project)
```powershell
npx expo prebuild --platform android --clean
```

### Βήμα 4: Build Release APK
```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"
cd C:\A\customer\android
.\gradlew.bat assembleRelease
```

### Βήμα 5: Αντιγραφή APK
```powershell
# Το APK βρίσκεται εδώ:
# C:\A\customer\android\app\build\outputs\apk\release\app-release.apk

# Αντιγραφή με όνομα
Copy-Item "C:\A\customer\android\app\build\outputs\apk\release\app-release.apk" -Destination "C:\Users\<username>\Documents\Projects\FastDelivery\FastDelivery-Customer-v1.0.0.apk"
```

---

## 🚗 Build Driver APK

### Βήμα 1: Αντιγραφή και προετοιμασία
```powershell
cd C:\A

# Αντιγραφή driver app στο junction
Copy-Item -Recurse ".\fast-delivery-mobile\driver" -Destination "C:\A\driver"

cd C:\A\driver

# Εγκατάσταση dependencies
npm install
```

### Βήμα 2: Prebuild
```powershell
npx expo prebuild --platform android --clean
```

### Βήμα 3: Build Release APK
```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"
cd C:\A\driver\android
.\gradlew.bat assembleRelease
```

### Βήμα 4: Αντιγραφή APK
```powershell
Copy-Item "C:\A\driver\android\app\build\outputs\apk\release\app-release.apk" -Destination "C:\Users\<username>\Documents\Projects\FastDelivery\FastDelivery-Driver-v1.0.0.apk"
```

---

## 📲 Εγκατάσταση & Εκτέλεση στον Emulator

### Έναρξη Emulator
```powershell
# Λίστα διαθέσιμων emulators
$env:PATH = "$env:PATH;C:\Users\<username>\AppData\Local\Android\Sdk\emulator"
emulator -list-avds

# Εκκίνηση emulator (π.χ. Medium_Phone_API_36)
emulator -avd Medium_Phone_API_36
```

### Εγκατάσταση APK
```powershell
$env:PATH = "$env:PATH;C:\Users\<username>\AppData\Local\Android\Sdk\platform-tools"

# Customer App
adb install "C:\Users\<username>\Documents\Projects\FastDelivery\FastDelivery-Customer-v1.0.0.apk"

# Driver App
adb install "C:\Users\<username>\Documents\Projects\FastDelivery\FastDelivery-Driver-v1.0.0.apk"
```

### Αν υπάρχει προηγούμενη έκδοση (signature mismatch)
```powershell
# Απεγκατάσταση παλιάς έκδοσης πρώτα
adb uninstall com.fastdelivery.customer
adb uninstall com.fastdelivery.driver

# Μετά εγκατάσταση
adb install "...\FastDelivery-Customer-v1.0.0.apk"
```

### Εκκίνηση εφαρμογής
```powershell
# Customer App
adb shell am start -n com.fastdelivery.customer/.MainActivity

# Driver App
adb shell am start -n com.fastdelivery.driver/.MainActivity
```

---

## 🐛 Αντιμετώπιση Προβλημάτων

### 1. Long Path Errors (CMake/Ninja)
**Σφάλμα:** `manifest 'build.ninja' still dirty after 100 tries`

**Λύση:** Χρήση junction path (C:\A) αντί για το πλήρες path

### 2. JAVA_HOME not set
```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"
```

### 3. Android SDK not found
Δημιουργία `local.properties` στο `android/` folder:
```properties
sdk.dir=C:\\Users\\<username>\\AppData\\Local\\Android\\Sdk
```

### 4. newArchEnabled CMake errors
Στο `app.json`:
```json
"newArchEnabled": false
```

Στο `android/gradle.properties`:
```properties
newArchEnabled=false
```

### 5. expo-notifications crash
Χρήση safe conditional imports στα `App.js` και `AuthContext.js`:
```javascript
let Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.log('expo-notifications not available');
}
```

### 6. Google Maps blank (Authorization failure)
- Πήγαινε στο [Google Cloud Console](https://console.cloud.google.com)
- APIs & Services → Library → Maps SDK for Android → Enable
- Credentials → API Key → Application restrictions → Android apps
- Πρόσθεσε package names:
  - `com.fastdelivery.customer`
  - `com.fastdelivery.driver`

---

## 📁 Τελικά APK Files

| App | Package Name | APK File |
|-----|--------------|----------|
| Customer | `com.fastdelivery.customer` | `FastDelivery-Customer-v1.0.0.apk` |
| Driver | `com.fastdelivery.driver` | `FastDelivery-Driver-v1.0.0.apk` |

---

## 🔄 Quick Build Script (όλα μαζί)

```powershell
# === Customer APK ===
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"
cd C:\A\customer
npm install
npx expo prebuild --platform android --clean
cd android
.\gradlew.bat assembleRelease
Copy-Item ".\app\build\outputs\apk\release\app-release.apk" -Destination "C:\Users\<username>\Documents\Projects\FastDelivery\FastDelivery-Customer-v1.0.0.apk"

# === Driver APK ===
cd C:\A\driver
npm install
npx expo prebuild --platform android --clean
cd android
.\gradlew.bat assembleRelease
Copy-Item ".\app\build\outputs\apk\release\app-release.apk" -Destination "C:\Users\<username>\Documents\Projects\FastDelivery\FastDelivery-Driver-v1.0.0.apk"
```

---

## ✅ Επαλήθευση

Μετά την εγκατάσταση, έλεγξε:
1. ✅ Η εφαρμογή ανοίγει χωρίς crash
2. ✅ Το login λειτουργεί (σύνδεση στο backend)
3. ✅ Οι χάρτες Google Maps εμφανίζονται σωστά
4. ✅ Τα real-time updates λειτουργούν (socket.io)

---

*Τελευταία ενημέρωση: 29 Νοεμβρίου 2025*
