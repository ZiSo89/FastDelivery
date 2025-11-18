const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
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
  role: {
    type: String,
    default: 'admin'
  }
}, {
  timestamps: true
});

// Indexes
adminSchema.index({ email: 1 }, { unique: true });

// Hash password before save
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);
