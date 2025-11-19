const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Το όνομα είναι υποχρεωτικό'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Το email είναι υποχρεωτικό'],
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
    required: [true, 'Το τηλέφωνο είναι υποχρεωτικό']
  },
  vehicle: {
    type: String,
    default: 'Μοτοσυκλέτα'
  },
  licensePlate: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'inactive'],
    default: 'pending'
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  currentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  }
}, {
  timestamps: true
});

// Indexes
driverSchema.index({ email: 1 }, { unique: true });
driverSchema.index({ isOnline: 1 });
driverSchema.index({ status: 1 });

// Hash password before save
driverSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
driverSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Driver', driverSchema);
