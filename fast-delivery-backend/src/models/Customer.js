const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Το όνομα είναι υποχρεωτικό'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Το email είναι υποχρεωτικό'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Μη έγκυρο email']
  },
  password: {
    type: String,
    required: [true, 'Ο κωδικός είναι υποχρεωτικός'],
    minlength: [6, 'Ο κωδικός πρέπει να είναι τουλάχιστον 6 χαρακτήρες'],
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Το τηλέφωνο είναι υποχρεωτικό'],
    match: [/^\d{10}$/, 'Το τηλέφωνο πρέπει να είναι 10ψήφιο']
  },
  address: {
    type: String,
    required: [true, 'Η διεύθυνση είναι υποχρεωτική']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0] // [lng, lat]
    }
  },
  role: {
    type: String,
    default: 'customer'
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

// Hash password before save
customerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
customerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Customer', customerSchema);
