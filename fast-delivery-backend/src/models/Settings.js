const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Singleton pattern - only one settings document
  key: {
    type: String,
    default: 'main',
    unique: true
  },
  
  // Driver salary settings
  driverSalary: {
    type: Number,
    default: 800,
    min: 0
  },
  
  // Store types (dynamic list)
  storeTypes: [{
    type: String,
    trim: true
  }],
  
  // Service area (for MVP - single city)
  serviceArea: {
    type: String,
    default: 'Αλεξανδρούπολη'
  },
  
  // Default delivery fee
  defaultDeliveryFee: {
    type: Number,
    default: 3,
    min: 0
  },
  
  // Service hours
  serviceHours: {
    type: String,
    default: '08:00 - 22:00'
  }
}, {
  timestamps: true
});

// Static method to get settings (creates default if not exists)
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne({ key: 'main' });
  
  if (!settings) {
    // Create default settings
    settings = await this.create({
      key: 'main',
      storeTypes: ['Mini Market', 'Φαρμακείο', 'Ταβέρνα', 'Καφετέρια', 'Γλυκά', 'Άλλο']
    });
  }
  
  return settings;
};

// Static method to update settings
settingsSchema.statics.updateSettings = async function(updates) {
  const settings = await this.findOneAndUpdate(
    { key: 'main' },
    { $set: updates },
    { new: true, upsert: true, runValidators: true }
  );
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
