/**
 * Migration Script: Convert storeTypes from strings to objects with icons
 * 
 * Run this script once to update the database:
 * node tests/migrateStoreTypes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');

// Default icons mapping
const DEFAULT_ICONS = {
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

const DEFAULT_ICON = '🏪';

async function migrateStoreTypes() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Get the Settings collection directly
    const db = mongoose.connection.db;
    const settingsCollection = db.collection('settings');

    // Find the settings document
    const settings = await settingsCollection.findOne({ key: 'main' });

    if (!settings) {
      console.log('⚠️ No settings document found. Creating default...');
      
      const defaultStoreTypes = [
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
      ];

      await settingsCollection.insertOne({
        key: 'main',
        driverSalary: 800,
        defaultDeliveryFee: 3,
        serviceArea: 'Αλεξανδρούπολη',
        serviceHours: '08:00 - 22:00',
        storeTypes: defaultStoreTypes,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('✅ Created default settings with store types');
      return;
    }

    console.log('📋 Current storeTypes:', JSON.stringify(settings.storeTypes, null, 2));

    // Check if migration is needed
    if (!settings.storeTypes || settings.storeTypes.length === 0) {
      console.log('⚠️ No storeTypes found. Adding defaults...');
      
      const defaultStoreTypes = [
        { name: 'Mini Market', icon: '🛒' },
        { name: 'Φαρμακείο', icon: '💊' },
        { name: 'Ταβέρνα', icon: '🍔' },
        { name: 'Καφετέρια', icon: '☕' },
        { name: 'Γλυκά', icon: '🍰' },
        { name: 'Άλλο', icon: '🏪' }
      ];

      await settingsCollection.updateOne(
        { key: 'main' },
        { $set: { storeTypes: defaultStoreTypes, updatedAt: new Date() } }
      );

      console.log('✅ Added default store types');
      return;
    }

    // Check if already migrated (first item is an object with name property)
    const firstType = settings.storeTypes[0];
    if (typeof firstType === 'object' && firstType.name) {
      console.log('✅ Store types already migrated! No action needed.');
      console.log('📋 Current format:', settings.storeTypes.map(t => `${t.icon} ${t.name}`).join(', '));
      return;
    }

    // Migration needed - convert strings to objects
    console.log('🔄 Migrating store types from strings to objects...');

    const migratedTypes = settings.storeTypes.map(type => {
      if (typeof type === 'string') {
        return {
          name: type,
          icon: DEFAULT_ICONS[type] || DEFAULT_ICON
        };
      }
      // Already an object, just ensure it has icon
      return {
        name: type.name || type,
        icon: type.icon || DEFAULT_ICONS[type.name] || DEFAULT_ICON
      };
    });

    // Update the database
    await settingsCollection.updateOne(
      { key: 'main' },
      { $set: { storeTypes: migratedTypes, updatedAt: new Date() } }
    );

    console.log('✅ Migration completed successfully!');
    console.log('📋 New format:', migratedTypes.map(t => `${t.icon} ${t.name}`).join(', '));

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the migration
migrateStoreTypes();
