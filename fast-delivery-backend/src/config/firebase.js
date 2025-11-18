const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../../firebase-service-account.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const bucket = admin.storage().bucket();

// Upload file to Firebase Storage
const uploadToFirebase = async (file, folder = 'voice') => {
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
  try {
    const fileName = fileUrl.split(`${bucket.name}/`)[1];
    await bucket.file(fileName).delete();
    console.log(`🗑️  File deleted: ${fileName}`);
  } catch (error) {
    console.error(`Firebase delete error: ${error.message}`);
  }
};

module.exports = { uploadToFirebase, deleteFromFirebase, bucket };
