const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Το όνομα είναι υποχρεωτικό'],
    trim: true
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
  }
}, {
  timestamps: true
});

// Index για γρήγορη αναζήτηση
userSchema.index({ phone: 1 });

module.exports = mongoose.model('User', userSchema);
