const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
let serviceAccount;
let firebaseInitialized = false;

try {
  if (process.env.FIREBASE_CREDENTIALS) {
    // Production - from environment variable
    serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    firebaseInitialized = true;
  } else {
    // Development - from file (if exists)
    const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = require(serviceAccountPath);
      firebaseInitialized = true;
    }
  }

  if (firebaseInitialized) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
    console.log('✅ Firebase initialized successfully');
  }
} catch (error) {
  console.error('⚠️  Firebase initialization failed:', error.message);
  firebaseInitialized = false;
}

const bucket = firebaseInitialized ? admin.storage().bucket() : null;

// Upload file to Firebase Storage
const uploadToFirebase = async (file, folder = 'voice') => {
  if (!firebaseInitialized || !bucket) {
    throw new Error('Firebase Storage is not initialized');
  }
  
  try {
    const fileName = `${folder}/${Date.now()}_${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        reject(error);
      });

      stream.on('finish', async () => {
        // Make file public
        await fileUpload.makePublic();
        
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        resolve(publicUrl);
      });

      stream.end(file.buffer);
    });
  } catch (error) {
    throw new Error(`Firebase upload failed: ${error.message}`);
  }
};

// Delete file from Firebase Storage
const deleteFromFirebase = async (fileUrl) => {
  if (!firebaseInitialized || !bucket) {
    return;
  }
  
  try {
    const fileName = fileUrl.split(`${bucket.name}/`)[1];
    await bucket.file(fileName).delete();
  } catch (error) {
    console.error(`Firebase delete error: ${error.message}`);
  }
};

module.exports = { uploadToFirebase, deleteFromFirebase, bucket };
