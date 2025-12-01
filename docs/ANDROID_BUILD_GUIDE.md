# 📱 Οδηγός Build Android APK

Αυτός ο οδηγός περιγράφει πώς να κάνεις build τα Android APK για τις εφαρμογές **Customer** και **Driver** του FastDelivery.

---

## 📋 Προαπαιτούμενα

### 1. Java JDK 17
- Εγκατάσταση: [Eclipse Adoptium JDK 17](https://adoptium.net/)
- Τοποθεσία: `C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot`

### 2. Android SDK
- Τοποθεσία: `C:\Users\zisog\AppData\Local\Android\Sdk`
- Απαιτείται: Android Studio ή Android Command Line Tools

### 3. Node.js & npm
- Εγκατεστημένο με τα project dependencies

---

## 🔧 Ρύθμιση Περιβάλλοντος

### Ρύθμιση JAVA_HOME (PowerShell)
```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"
```

### Προσθήκη ADB & Emulator στο PATH
```powershell
$env:PATH = "$env:PATH;C:\Users\zisog\AppData\Local\Android\Sdk\platform-tools"
$env:PATH = "$env:PATH;C:\Users\zisog\AppData\Local\Android\Sdk\emulator"
```

---

## 🏗️ Build Customer APK

### Βήμα 1: Δημιουργία φακέλου C:\A (αποφυγή long path errors)
```powershell
# Καθαρισμός και δημιουργία φακέλου
if (Test-Path "C:\A") { Remove-Item -Path "C:\A" -Recurse -Force }
New-Item -ItemType Directory -Path "C:\A\customer" -Force
```

### Βήμα 2: Αντιγραφή με robocopy (αποφυγή long path errors)
```powershell
# Χρήση robocopy για αντιγραφή - εξαιρεί τους φακέλους cache/build
robocopy "C:\Users\zisog\Documents\Projects\FastDelivery\fast-delivery-mobile\customer" "C:\A\customer" /E /XD ".expo" "android" "node_modules" ".git"
```

### Βήμα 3: Εγκατάσταση dependencies
```powershell
cd C:\A\customer
npm install
```

### Βήμα 4: Prebuild (δημιουργία Android project)
```powershell
npx expo prebuild --platform android --clean
```

### Βήμα 5: Build Release APK
```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"
cd C:\A\customer\android
.\gradlew.bat assembleRelease
```

### Βήμα 6: Το APK βρίσκεται εδώ
```
C:\A\customer\android\app\build\outputs\apk\release\app-release.apk
```

---

## 🚗 Build Driver APK

### Βήμα 1: Δημιουργία φακέλου και αντιγραφή
```powershell
New-Item -ItemType Directory -Path "C:\A\driver" -Force
robocopy "C:\Users\zisog\Documents\Projects\FastDelivery\fast-delivery-mobile\driver" "C:\A\driver" /E /XD ".expo" "android" "node_modules" ".git"
```

### Βήμα 2: Εγκατάσταση dependencies
```powershell
cd C:\A\driver
npm install
```

### Βήμα 3: Prebuild
```powershell
npx expo prebuild --platform android --clean
```

### Βήμα 4: Build Release APK
```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"
cd C:\A\driver\android
.\gradlew.bat assembleRelease
```

### Βήμα 5: Το APK βρίσκεται εδώ
```
C:\A\driver\android\app\build\outputs\apk\release\app-release.apk
```

---

## 📲 Εγκατάσταση & Εκτέλεση στον Emulator

### Έναρξη Emulator
```powershell
# Λίστα διαθέσιμων emulators
$env:PATH = "$env:PATH;C:\Users\zisog\AppData\Local\Android\Sdk\emulator"
emulator -list-avds

# Εκκίνηση emulator (π.χ. Medium_Phone_API_36)
emulator -avd Medium_Phone_API_36
emulator -avd Small_Phone
```

### Εγκατάσταση APK
```powershell
$env:PATH = "$env:PATH;C:\Users\zisog\AppData\Local\Android\Sdk\platform-tools"

# Customer App
adb install "C:\A\customer\android\app\build\outputs\apk\release\app-release.apk"

# Driver App
adb install "C:\A\driver\android\app\build\outputs\apk\release\app-release.apk"
```

### Αν υπάρχει προηγούμενη έκδοση (signature mismatch)
```powershell
# Απεγκατάσταση παλιάς έκδοσης πρώτα
adb uninstall com.fastdelivery.customer
adb uninstall com.fastdelivery.driver

# Μετά εγκατάσταση
adb install "C:\A\customer\android\app\build\outputs\apk\release\app-release.apk"
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

| App | Package Name | APK Location |
|-----|--------------|--------------|
| Customer | `com.fastdelivery.customer` | `C:\A\customer\android\app\build\outputs\apk\release\app-release.apk` |
| Driver | `com.fastdelivery.driver` | `C:\A\driver\android\app\build\outputs\apk\release\app-release.apk` |

---

## 🔄 Quick Build Script (όλα μαζί)

```powershell
# === Προετοιμασία ===
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"
if (Test-Path "C:\A") { Remove-Item -Path "C:\A" -Recurse -Force }

# === Customer APK ===
New-Item -ItemType Directory -Path "C:\A\customer" -Force
robocopy "C:\Users\zisog\Documents\Projects\FastDelivery\fast-delivery-mobile\customer" "C:\A\customer" /E /XD ".expo" "android" "node_modules" ".git"
cd C:\A\customer
npm install
npx expo prebuild --platform android --clean
cd android
.\gradlew.bat assembleRelease

# === Driver APK ===
New-Item -ItemType Directory -Path "C:\A\driver" -Force
robocopy "C:\Users\zisog\Documents\Projects\FastDelivery\fast-delivery-mobile\driver" "C:\A\driver" /E /XD ".expo" "android" "node_modules" ".git"
cd C:\A\driver
npm install
npx expo prebuild --platform android --clean
cd android
.\gradlew.bat assembleRelease

# === Εγκατάσταση στον Emulator ===
$env:PATH = "$env:PATH;C:\Users\zisog\AppData\Local\Android\Sdk\platform-tools"
adb install "C:\A\customer\android\app\build\outputs\apk\release\app-release.apk"
adb install "C:\A\driver\android\app\build\outputs\apk\release\app-release.apk"
```

---

## ✅ Επαλήθευση

Μετά την εγκατάσταση, έλεγξε:
1. ✅ Η εφαρμογή ανοίγει χωρίς crash
2. ✅ Το login λειτουργεί (σύνδεση στο backend)
3. ✅ Οι χάρτες Google Maps εμφανίζονται σωστά
4. ✅ Τα real-time updates λειτουργούν (socket.io)

---

*Τελευταία ενημέρωση: 1 Δεκεμβρίου 2025*
