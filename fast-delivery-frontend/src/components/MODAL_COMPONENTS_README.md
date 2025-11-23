# Modal Components Documentation

## Overview
This directory contains reusable modal components that replace browser-native `alert()` and `confirm()` dialogs throughout the application. These components provide a consistent, branded user experience.

## Components

### 1. AlertModal.js
A reusable alert/notification modal component.

**Purpose:** Display informational, success, warning, or error messages to users.

**Props:**
- `show` (boolean, required): Controls modal visibility
- `onHide` (function, required): Callback when modal is closed
- `variant` (string, optional): Bootstrap variant - 'success', 'danger', 'warning', 'info'
- `title` (string, optional): Modal title (defaults based on variant)
- `message` (string, required): Message to display (supports multiline with \n)

**Auto-Icon Feature:**
- ✅ success
- ❌ danger
- ⚠️ warning
- ℹ️ info

**Usage Example:**
```javascript
import AlertModal from './components/AlertModal';

const [alertModal, setAlertModal] = useState({ 
  show: false, 
  variant: 'success', 
  message: '' 
});

// Show alert
setAlertModal({
  show: true,
  variant: 'success',
  message: 'Η ενέργεια ολοκληρώθηκε!'
});

// In JSX
<AlertModal
  show={alertModal.show}
  onHide={() => setAlertModal({ ...alertModal, show: false })}
  variant={alertModal.variant}
  message={alertModal.message}
/>
```

---

### 2. ConfirmModal.js
A reusable confirmation dialog component.

**Purpose:** Ask users to confirm or cancel an action before proceeding.

**Props:**
- `show` (boolean, required): Controls modal visibility
- `onHide` (function, required): Callback when modal is closed/cancelled
- `onConfirm` (function, required): Callback when user confirms action
- `title` (string, optional): Modal title (default: "Επιβεβαίωση")
- `message` (string, required): Confirmation message (supports multiline with \n)
- `confirmText` (string, optional): Confirm button text (default: "Επιβεβαίωση")
- `cancelText` (string, optional): Cancel button text (default: "Ακύρωση")
- `variant` (string, optional): Button variant - 'primary', 'danger', 'warning', etc.
- `icon` (string, optional): Emoji/icon to display

**Usage Example:**
```javascript
import ConfirmModal from './components/ConfirmModal';

const [confirmModal, setConfirmModal] = useState({ 
  show: false, 
  message: '', 
  onConfirm: null 
});

// Show confirmation
setConfirmModal({
  show: true,
  message: 'Είστε βέβαιος ότι θέλετε να ακυρώσετε;',
  onConfirm: async () => {
    // Perform action
    await deleteItem();
  }
});

// In JSX
<ConfirmModal
  show={confirmModal.show}
  onHide={() => setConfirmModal({ ...confirmModal, show: false })}
  onConfirm={() => {
    setConfirmModal({ ...confirmModal, show: false });
    confirmModal.onConfirm && confirmModal.onConfirm();
  }}
  title="Επιβεβαίωση Διαγραφής"
  message={confirmModal.message}
  confirmText="Διαγραφή"
  cancelText="Ακύρωση"
  variant="danger"
  icon="🗑️"
/>
```

---

## Migration from Browser Dialogs

### Before (alert):
```javascript
alert('Η ενέργεια ολοκληρώθηκε!');
```

### After (AlertModal):
```javascript
setAlertModal({
  show: true,
  variant: 'success',
  message: 'Η ενέργεια ολοκληρώθηκε!'
});
```

---

### Before (window.confirm):
```javascript
const confirmed = window.confirm('Είστε βέβαιος;');
if (confirmed) {
  // Do something
}
```

### After (ConfirmModal):
```javascript
setConfirmModal({
  show: true,
  message: 'Είστε βέβαιος;',
  onConfirm: () => {
    // Do something
  }
});
```

---

## Files Using Modal Components

### Admin Components
- **StoresTab.js**: AlertModal for success/error messages
- **DriversTab.js**: AlertModal for success/error messages
- **OrdersTab.js**: AlertModal for validation/error messages

### Customer Pages
- **OrderStatus.js**: AlertModal + ConfirmModal for price confirmation and order cancellation

### Store Components
- **StoreOrders.js**: AlertModal + Custom Reject Modal (with text input)

---

## Benefits

1. **Consistent UX**: All dialogs use the same styling and behavior
2. **Branded**: Matches application design (Wolt-style)
3. **Responsive**: Works on mobile and desktop
4. **Accessible**: Better keyboard navigation and screen reader support
5. **Multiline Support**: Messages can include line breaks
6. **Customizable**: Variants, icons, button text all configurable
7. **Non-Blocking**: Doesn't pause JavaScript execution like native dialogs

---

## Notes

- All native `alert()` and `window.confirm()` calls have been removed from the codebase
- For dialogs requiring text input (like rejection reasons), create a custom Modal with Form.Control
- Always include state management for modal visibility and message content
- Use appropriate variants for different message types (success, danger, warning, info)
