# 📧 Email Verification & Password Reset System

## Overview

Το σύστημα email verification και password reset για το Fast Delivery.

**Email Provider:** Mailjet (δωρεάν plan - 200 emails/ημέρα)

---

## 🔧 Backend Setup

### Environment Variables (`.env` / Render.com)

```env
MAILJET_API_KEY=your-mailjet-api-key
MAILJET_SECRET_KEY=your-mailjet-secret-key
EMAIL_FROM=your-verified-email@example.com
NODE_ENV=production
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/auth/verify-email?token=xxx&type=customer` | Verify email with token |
| `POST` | `/api/v1/auth/resend-verification` | Resend verification email |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset email |
| `POST` | `/api/v1/auth/reset-password` | Reset password with token |

---

## 📱 Frontend Pages (Web)

| Route | Component | Description |
|-------|-----------|-------------|
| `/verify-email` | `VerifyEmail.js` | Email verification page |
| `/forgot-password` | `ForgotPassword.js` | Request password reset |
| `/reset-password` | `ResetPassword.js` | Set new password |

---

## 📲 Mobile App Implementation (TODO)

### Screens to Create

#### 1. ForgotPasswordScreen.js
```javascript
// Location: fast-delivery-mobile/customer/src/screens/ForgotPasswordScreen.js

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import api from '../services/api';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert('Σφάλμα', 'Παρακαλώ εισάγετε το email σας');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', {
        email,
        type: 'customer'
      });
      
      Alert.alert(
        'Επιτυχία',
        'Αν το email υπάρχει, θα λάβετε οδηγίες επαναφοράς κωδικού.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Σφάλμα', error.response?.data?.message || 'Κάτι πήγε στραβά');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ξέχασες τον κωδικό σου;</Text>
      <Text style={styles.subtitle}>
        Εισάγε το email σου και θα σου στείλουμε οδηγίες επαναφοράς.
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Αποστολή...' : 'Αποστολή Email'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backLink}>← Πίσω στη Σύνδεση</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#00c2e8',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backLink: {
    color: '#00c2e8',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default ForgotPasswordScreen;
```

#### 2. Add to LoginScreen.js
```javascript
// Add link after password input:
<TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
  <Text style={styles.forgotPassword}>Ξέχασες τον κωδικό σου;</Text>
</TouchableOpacity>
```

#### 3. Add to Navigation (App.js)
```javascript
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';

// In your navigator:
<Stack.Screen 
  name="ForgotPassword" 
  component={ForgotPasswordScreen}
  options={{ title: 'Επαναφορά Κωδικού' }}
/>
```

---

## 🔄 Flow Diagrams

### Email Verification Flow
```
1. User registers
   ↓
2. Backend sends verification email (production only)
   ↓
3. User clicks link in email
   ↓
4. Browser opens: /verify-email?token=xxx&type=customer
   ↓
5. Frontend calls: GET /api/v1/auth/verify-email
   ↓
6. Backend verifies token, sets isEmailVerified=true
   ↓
7. User can now login
```

### Password Reset Flow
```
1. User clicks "Forgot Password"
   ↓
2. User enters email
   ↓
3. Frontend calls: POST /api/v1/auth/forgot-password
   ↓
4. Backend sends reset email (if email exists)
   ↓
5. User clicks link in email
   ↓
6. Browser opens: /reset-password?token=xxx&type=customer
   ↓
7. User enters new password
   ↓
8. Frontend calls: POST /api/v1/auth/reset-password
   ↓
9. Password updated, user can login
```

---

## 🧪 Testing

### Development Mode
- Email verification is **skipped** (`NODE_ENV=development`)
- Users are auto-verified on registration
- Console logs show verification tokens

### Production Mode
- Real emails are sent via Resend
- Users must verify email before login
- Token expires after 24 hours (verification) or 1 hour (password reset)

---

## 📁 Files Reference

### Backend
```
fast-delivery-backend/
├── src/
│   ├── controllers/authController.js  # Verification & reset logic
│   ├── routes/auth.js                 # Routes
│   ├── utils/emailService.js          # Resend integration
│   └── models/
│       ├── Customer.js                # +isEmailVerified, tokens
│       ├── Store.js                   # +isEmailVerified, tokens
│       └── Driver.js                  # +isEmailVerified, tokens
```

### Frontend (Web)
```
fast-delivery-frontend/
└── src/
    ├── pages/
    │   ├── VerifyEmail.js
    │   ├── ForgotPassword.js
    │   ├── ResetPassword.js
    │   └── Login.js              # +forgot password link
    └── App.js                    # Routes
```

### Mobile (✅ IMPLEMENTED)
```
fast-delivery-mobile/
├── customer/src/
│   └── screens/
│       ├── ForgotPasswordScreen.js    # ✅ Done
│       ├── VerifyEmailScreen.js       # ✅ Done
│       ├── RegisterScreen.js          # ✅ Updated - shows email verification message
│       └── LoginScreen.js             # ✅ Updated - forgot password link
└── driver/src/
    └── screens/
        ├── ForgotPasswordScreen.js    # ✅ Done
        └── LoginScreen.js             # ✅ Updated - forgot password link
```

---

## ⚠️ Important Notes

1. **Token Expiry:**
   - Email verification: 24 hours
   - Password reset: 1 hour

2. **Security:**
   - Tokens are one-time use
   - Tokens are cleared after use
   - Password reset doesn't reveal if email exists

3. **Email Deliverability:**
   - Using `@resend.dev` domain (free tier)
   - For better deliverability, use custom domain
   - Some carriers (T-Mobile) may block links

4. **Custom Domain (Recommended for Production):**
   - Buy domain (e.g., `fastdelivery.gr`)
   - Configure DNS records in Resend
   - Update `EMAIL_FROM` to use custom domain
