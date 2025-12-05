# 📦 Fast Delivery - Versioning & Deployment Guide

**Ημερομηνία:** 2025-12-05  
**Συντάκτης:** AI Assistant  
**Κατάσταση:** Ενεργό

---

## 📋 Περιεχόμενα

1. [Αρχιτεκτονική Project](#αρχιτεκτονική-project)
2. [Version Numbers - Τι σημαίνουν](#version-numbers)
3. [Πού αποθηκεύονται οι εκδόσεις](#πού-αποθηκεύονται-οι-εκδόσεις)
4. [Deployment Workflow](#deployment-workflow)
5. [Συμβατότητα - Compatibility Matrix](#συμβατότητα)
6. [Git Workflow](#git-workflow)
7. [Checklist πριν το Release](#checklist-πριν-το-release)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ Αρχιτεκτονική Project

```
FastDelivery/
├── fast-delivery-backend/      ← Express.js API (Render.com)
│   └── package.json            ← Backend version
│
├── fast-delivery-frontend/     ← React Web App (Netlify)
│   └── package.json            ← Frontend version
│
└── fast-delivery-mobile/
    ├── customer/               ← React Native (Play Store)
    │   └── app.json            ← Customer app version
    │
    └── driver/                 ← React Native (Play Store)
        └── app.json            ← Driver app version
```

### Components & Deployments

| Component | Platform | Auto-Deploy | URL |
|-----------|----------|-------------|-----|
| Backend | Render.com | ✅ On push to master | fastdelivery-hvff.onrender.com |
| Frontend | Netlify | ✅ On push to master | fastdelivery.netlify.app |
| Customer App | Play Store | ❌ Manual | Google Play |
| Driver App | Play Store | ❌ Manual | Google Play |

---

## 🔢 Version Numbers

### Semantic Versioning (SemVer)

```
MAJOR.MINOR.PATCH
  │     │     │
  │     │     └── Bug fixes, μικρές διορθώσεις
  │     │         Δεν σπάει τίποτα
  │     │
  │     └── Νέα features, backward compatible
  │         Δεν σπάει τα υπάρχοντα
  │
  └── Breaking changes
      ΣΠΑΕΙ τη συμβατότητα με παλιές εκδόσεις
```

### Παραδείγματα

| Αλλαγή | Version Change | Παράδειγμα |
|--------|----------------|------------|
| Fix bug στο login | 1.0.0 → 1.0.1 | Διόρθωση typo |
| Νέο feature | 1.0.1 → 1.1.0 | Προσθήκη favorites |
| API αλλαγή | 1.1.0 → 2.0.0 | Αλλαγή response format |

---

## 📍 Πού αποθηκεύονται οι εκδόσεις

### 1. Backend Version
```json
// fast-delivery-backend/package.json
{
  "name": "fast-delivery-backend",
  "version": "1.0.0"  ← ΑΥΤΟ
}
```

### 2. Frontend Version
```json
// fast-delivery-frontend/package.json
{
  "name": "fast-delivery-frontend",
  "version": "1.0.0"  ← ΑΥΤΟ
}
```

### 3. Customer App Version
```json
// fast-delivery-mobile/customer/app.json
{
  "expo": {
    "version": "1.0.0",  ← User-facing version
    "android": {
      "versionCode": 1   ← Play Store version (αυξάνει κάθε build)
    }
  }
}
```

### 4. Driver App Version
```json
// fast-delivery-mobile/driver/app.json
{
  "expo": {
    "version": "1.0.0",
    "android": {
      "versionCode": 1
    }
  }
}
```

### 5. App Version Check (MongoDB Settings)
```javascript
// Αποθηκεύεται στη βάση, διαχειρίζεται από Admin Panel
{
  appVersions: {
    customer: {
      android: {
        latest: "1.2.0",    // Τελευταία διαθέσιμη
        minimum: "1.0.0",   // Ελάχιστη συμβατή
        storeUrl: "https://play.google.com/..."
      }
    },
    driver: {
      android: {
        latest: "1.1.0",
        minimum: "1.0.0",
        storeUrl: "https://play.google.com/..."
      }
    }
  }
}
```

---

## 🚀 Deployment Workflow

### Σενάριο A: Bug Fix (Patch)

```
Βήμα 1: Fix the bug
Βήμα 2: Update version (1.0.0 → 1.0.1)
Βήμα 3: git commit -m "Fix: login bug"
Βήμα 4: git push (auto-deploy backend & frontend)
Βήμα 5: (Αν mobile) Build & publish to Play Store
Βήμα 6: Update Settings.appVersions.latest = "1.0.1"
```

### Σενάριο B: Νέο Feature (Minor)

```
Βήμα 1: Implement feature
Βήμα 2: Update version (1.0.1 → 1.1.0)
Βήμα 3: git commit -m "Feature: add favorites"
Βήμα 4: git push
Βήμα 5: Test στο staging
Βήμα 6: (Αν mobile) Build APK, test, publish
Βήμα 7: Update Settings.appVersions.latest = "1.1.0"
```

### Σενάριο C: Breaking Change (Major) ⚠️

```
Βήμα 1: Implement breaking change
Βήμα 2: Update ALL versions (1.x.x → 2.0.0)
Βήμα 3: Update minimum version BEFORE deploy
         Settings.appVersions.minimum = "2.0.0"
Βήμα 4: Build & publish mobile apps FIRST
Βήμα 5: Wait for users to update (optional grace period)
Βήμα 6: Deploy backend & frontend
Βήμα 7: Update Settings.appVersions.latest = "2.0.0"
```

---

## 🔄 Συμβατότητα

### Compatibility Matrix

```
                    Backend Version
                    1.0.x   1.1.x   2.0.x
                   ┌───────┬───────┬───────┐
Frontend   1.0.x   │  ✅   │  ✅   │  ❌   │
           1.1.x   │  ✅   │  ✅   │  ❌   │
           2.0.x   │  ❌   │  ❌   │  ✅   │
                   └───────┴───────┴───────┘

                    Backend Version
                    1.0.x   1.1.x   2.0.x
                   ┌───────┬───────┬───────┐
Mobile     1.0.x   │  ✅   │  ✅   │  ❌   │
           1.1.x   │  ✅   │  ✅   │  ❌   │
           2.0.x   │  ❌   │  ❌   │  ✅   │
                   └───────┴───────┴───────┘
```

### Κανόνες Συμβατότητας

| Αλλαγή στο Backend | Επηρεάζει Frontend | Επηρεάζει Mobile |
|--------------------|--------------------|--------------------|
| Νέο endpoint | ❌ Όχι | ❌ Όχι |
| Νέο field στο response | ❌ Όχι | ❌ Όχι |
| Αφαίρεση field | ⚠️ Ίσως | ⚠️ Ίσως |
| Αλλαγή response format | ✅ Ναι | ✅ Ναι |
| Αλλαγή endpoint URL | ✅ Ναι | ✅ Ναι |
| Αλλαγή auth mechanism | ✅ Ναι | ✅ Ναι |

### Πώς να αποφύγεις Breaking Changes

```javascript
// ❌ ΚΑΚΟ - Αφαίρεση field
// ΠΡΙΝ
{ user: { name: "John", email: "john@test.com" } }
// ΜΕΤΑ
{ user: { name: "John" } }  // email αφαιρέθηκε!

// ✅ ΚΑΛΟ - Προσθήκη field (backward compatible)
// ΠΡΙΝ
{ user: { name: "John" } }
// ΜΕΤΑ
{ user: { name: "John", phone: "123456" } }  // νέο field OK
```

---

## 🌿 Git Workflow

### Branch Strategy

```
master (production)
    │
    ├── develop (staging)
    │       │
    │       ├── feature/favorites
    │       ├── feature/ratings
    │       └── bugfix/login-error
    │
    └── hotfix/critical-bug (emergency fixes)
```

### Daily Workflow

```bash
# 1. Ξεκίνα νέο feature
git checkout develop
git pull
git checkout -b feature/my-new-feature

# 2. Δούλεψε και κάνε commits
git add .
git commit -m "Add new feature"

# 3. Push και merge to develop
git push origin feature/my-new-feature
# Create Pull Request → develop

# 4. Όταν είναι ready για production
git checkout master
git merge develop
git push

# 5. Tag για reference
git tag v1.2.0
git push --tags
```

### Commit Message Convention

```
Type: Short description

Types:
- Fix:      Bug fix
- Feature:  New feature
- Update:   Modification to existing feature
- Refactor: Code restructuring
- Docs:     Documentation
- Style:    UI/CSS changes
- Chore:    Maintenance tasks

Examples:
- Fix: Login not working on iOS
- Feature: Add order rating system
- Update: Improve store search performance
- Refactor: Reorganize API routes
```

---

## ✅ Checklist πριν το Release

### Mobile App Release

```
□ Όλα τα tests περνάνε
□ Tested σε physical device
□ Tested σε διαφορετικές Android versions
□ Version αυξήθηκε στο app.json
□ versionCode αυξήθηκε στο app.json
□ Release notes ετοιμάστηκαν
□ APK built με EAS
□ APK tested (sideload)
□ Uploaded to Play Console
□ Settings.appVersions.latest ενημερώθηκε
```

### Backend/Frontend Release

```
□ Όλα τα features tested locally
□ No console errors
□ API endpoints tested με Postman
□ Version αυξήθηκε στο package.json
□ git push to master
□ Render/Netlify deployment successful
□ Production testing completed
```

### Breaking Change Release

```
□ Ενημέρωσε Settings.appVersions.minimum ΠΡΩΤΑ
□ Περίμενε 24-48 ώρες για users να κάνουν update
□ Build και publish νέα mobile apps
□ Deploy backend/frontend
□ Verify old versions δεν λειτουργούν
□ Monitor for errors
```

---

## 🔧 Troubleshooting

### Πρόβλημα: Mobile app δεν βλέπει νέο feature

**Αιτία:** Παλιά cached version  
**Λύση:**
1. Κλείσε εντελώς την εφαρμογή
2. Clear cache από Settings
3. Restart app

### Πρόβλημα: "Network Error" μετά από update

**Αιτία:** Backend δεν έχει κάνει deploy ακόμα  
**Λύση:**
1. Περίμενε 2-3 λεπτά
2. Check Render dashboard για deploy status
3. Try again

### Πρόβλημα: Χρήστες δεν βλέπουν update prompt

**Αιτία:** Settings.appVersions δεν ενημερώθηκε  
**Λύση:**
1. Login ως Admin
2. Ρυθμίσεις → App Versions
3. Update latest version

### Πρόβλημα: Force update loop

**Αιτία:** minimum > latest ή λάθος version  
**Λύση:**
1. Fix Settings.appVersions στη βάση
2. minimum <= latest πάντα

---

## 📊 Version History Template

Κράτα ένα changelog:

```markdown
## [1.2.0] - 2025-12-05

### Added
- Order rating system
- Favorites stores

### Changed
- Improved map performance

### Fixed
- Login bug on Samsung devices

---

## [1.1.0] - 2025-11-28

### Added
- Live order tracking
- Push notifications

### Fixed
- Address autocomplete issue
```

---

## 🎯 Quick Reference

### Πότε αυξάνω κάθε αριθμό

| Τι έκανα | Version |
|----------|---------|
| Διόρθωσα bug | X.X.+1 |
| Πρόσθεσα feature | X.+1.0 |
| Άλλαξα API | +1.0.0 |

### Πότε κάνω deploy τι

| Αλλαγή σε | Deploy |
|-----------|--------|
| Backend only | Render auto-deploys |
| Frontend only | Netlify auto-deploys |
| Mobile only | Manual EAS build + Play Store |
| Breaking change | ΟΛΑ μαζί! |

### Emergency Hotfix

```bash
git checkout master
git checkout -b hotfix/critical-bug
# Fix the bug
git commit -m "Fix: critical bug"
git checkout master
git merge hotfix/critical-bug
git push
git tag v1.0.1
```

---

## 📞 Υποστήριξη

Αν κάτι πάει στραβά:

1. **Rollback Backend:**
   - Render Dashboard → Deploys → Select previous → Rollback

2. **Rollback Frontend:**
   - Netlify Dashboard → Deploys → Select previous → Publish

3. **Rollback Mobile:**
   - Δεν γίνεται rollback στο Play Store
   - Πρέπει να κάνεις νέο build με fix

---

*Τελευταία ενημέρωση: 2025-12-05*
