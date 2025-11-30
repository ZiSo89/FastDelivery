const mongoose = require('mongoose');

// Store type sub-schema with name and icon
const storeTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    default: '🏪'
  }
}, { _id: false });

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
  
  // Store types (dynamic list with icons)
  storeTypes: [storeTypeSchema],
  
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
  
  // Service hours (structured)
  serviceHoursEnabled: {
    type: Boolean,
    default: false
  },
  serviceHoursStart: {
    type: String,
    default: '09:00'
  },
  serviceHoursEnd: {
    type: String,
    default: '23:00'
  }
}, {
  timestamps: true
});

// Static method to get settings (creates default if not exists)
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne({ key: 'main' });
  
  if (!settings) {
    // Create default settings with icons
    settings = await this.create({
      key: 'main',
      storeTypes: [
        { name: 'Mini Market', icon: '🛒' },
        { name: 'Φαρμακείο', icon: '💊' },
        { name: 'Ταβέρνα', icon: '🍔' },
        { name: 'Καφετέρια', icon: '☕' },
        { name: 'Γλυκά', icon: '🍰' },
        { name: 'Πιτσαρία', icon: '🍕' },
        { name: 'Σουβλατζίδικο', icon: '🥙' },
        { name: 'Αρτοποιείο', icon: '🥖' },
        { name: 'Κάβα', icon: '🍷' },
        { name: 'Ανθοπωλείο', icon: '💐' },
        { name: 'Άλλο', icon: '🏪' }
      ]
    });
  }
  
  // Migration: convert old string format to new object format
  if (settings.storeTypes.length > 0 && typeof settings.storeTypes[0] === 'string') {
    const defaultIcons = {
      'Mini Market': '🛒',
      'Φαρμακείο': '💊',
      'Ταβέρνα': '🍔',
      'Καφετέρια': '☕',
      'Γλυκά': '🍰',
      'Πιτσαρία': '🍕',
      'Σουβλατζίδικο': '🥙',
      'Αρτοποιείο': '🥖',
      'Ζαχαροπλαστείο': '🎂',
      'Κρεοπωλείο': '🥩',
      'Ιχθυοπωλείο': '🐟',
      'Οπωροπωλείο': '🍎',
      'Κάβα': '🍷',
      'Ανθοπωλείο': '💐',
      'Pet Shop': '🐕',
      'Ψητοπωλείο': '🍖',
      'Άλλο': '🏪'
    };
    
    settings.storeTypes = settings.storeTypes.map(type => ({
      name: type,
      icon: defaultIcons[type] || '🏪'
    }));
    await settings.save();
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
