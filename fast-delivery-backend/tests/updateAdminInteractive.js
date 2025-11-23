const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Import Admin model
const Admin = require('../src/models/Admin');

// MongoDB Connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://fastdelivery:56ynGiuw24D1T8b3@cluster0.istyclo.mongodb.net/fast_delivery';

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function updateAdminCredentials() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🔐 ΕΝΗΜΕΡΩΣΗ ΣΤΟΙΧΕΙΩΝ ΔΙΑΧΕΙΡΙΣΤΗ');
    console.log('='.repeat(60) + '\n');

    // Get new credentials from user
    const newEmail = await question('📧 Νέο Email Διαχειριστή: ');
    const newPassword = await question('🔑 Νέος Κωδικός: ');
    const newName = await question('👤 Όνομα Διαχειριστή (προαιρετικό, πατήστε Enter για "Admin"): ') || 'Admin';

    // Validation
    if (!newEmail || !newEmail.includes('@')) {
      console.log('\n❌ Το email δεν είναι έγκυρο!');
      rl.close();
      process.exit(1);
    }

    if (!newPassword || newPassword.length < 6) {
      console.log('\n❌ Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες!');
      rl.close();
      process.exit(1);
    }

    console.log('\n📡 Σύνδεση με MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Συνδέθηκε στη βάση δεδομένων\n');

    // Find the admin (should be only one)
    const admin = await Admin.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('⚠️  Δεν βρέθηκε διαχειριστής. Δημιουργία νέου...\n');
      
      // Create new admin (password will be hashed by pre-save hook)
      const newAdmin = new Admin({
        name: newName,
        email: newEmail,
        password: newPassword,  // Plain password - will be hashed automatically
        role: 'admin'
      });
      
      await newAdmin.save();
      console.log('✅ Νέος διαχειριστής δημιουργήθηκε επιτυχώς!');
    } else {
      console.log('📝 Βρέθηκε διαχειριστής:', admin.email);
      console.log('🔄 Ενημέρωση στοιχείων...\n');
      
      // Update admin (password will be hashed by pre-save hook)
      admin.name = newName;
      admin.email = newEmail;
      admin.password = newPassword;  // Plain password - will be hashed automatically
      
      await admin.save();
      console.log('✅ Τα στοιχεία του διαχειριστή ενημερώθηκαν επιτυχώς!');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 ΝΕΑ ΣΤΟΙΧΕΙΑ ΔΙΑΧΕΙΡΙΣΤΗ:');
    console.log('='.repeat(60));
    console.log('👤 Όνομα:', newName);
    console.log('📧 Email:', newEmail);
    console.log('🔑 Κωδικός:', newPassword);
    console.log('🔐 Ρόλος: Διαχειριστής (admin)');
    console.log('='.repeat(60));
    console.log('\n✅ Μπορείτε τώρα να συνδεθείτε με τα νέα στοιχεία!\n');
    
    await mongoose.disconnect();
    rl.close();
    
  } catch (error) {
    console.error('\n❌ Σφάλμα:', error.message);
    rl.close();
    process.exit(1);
  }
}

// Run the script
updateAdminCredentials();
