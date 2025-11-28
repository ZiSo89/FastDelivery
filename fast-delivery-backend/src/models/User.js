const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Το όνομα είναι υποχρεωτικό'],
    trim: true
  },
  email: {
    type: String,
    sparse: true, // Allows multiple null values
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Μη έγκυρο email']
  },
  password: {
    type: String,
    minlength: [6, 'Ο κωδικός πρέπει να είναι τουλάχιστον 6 χαρακτήρες']
  },
  phone: {
    type: String,
    required: [true, 'Το τηλέφωνο είναι υποχρεωτικό'],
    match: [/^\d{10}$/, 'Το τηλέφωνο πρέπει να είναι 10ψήφιο']
  },
  address: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  pushToken: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index για γρήγορη αναζήτηση
userSchema.index({ phone: 1 });
userSchema.index({ email: 1 }, { unique: true, sparse: true }); // Unique email but allows null

module.exports = mongoose.model('User', userSchema);
