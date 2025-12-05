const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const storeSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: [true, 'Το όνομα επιχείρησης είναι υποχρεωτικό'],
    trim: true
  },
  afm: {
    type: String,
    required: [true, 'Το ΑΦΜ είναι υποχρεωτικό'],
    match: [/^\d{9}$/, 'Το ΑΦΜ πρέπει να είναι 9ψήφιο']
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
      default: [0, 0]
    }
  },
  storeType: {
    type: String,
    required: [true, 'Ο τύπος καταστήματος είναι υποχρεωτικός']
    // No enum restriction - store types are managed dynamically via Settings
  },
  workingHours: {
    type: String,
    default: 'Δευ-Παρ: 08:00-22:00'
  },
  description: {
    type: String,
    default: ''
  },
  serviceAreas: {
    type: String,
    default: 'Αλεξανδρούπολη'
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
  // Online/Busy status - whether store is accepting orders
  isOnline: {
    type: Boolean,
    default: true
  },
  // Email verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Geospatial index
storeSchema.index({ location: '2dsphere' });
storeSchema.index({ email: 1 }, { unique: true });
storeSchema.index({ afm: 1 }, { unique: true });
storeSchema.index({ status: 1 });

// Hash password before save
storeSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
storeSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Store', storeSchema);
