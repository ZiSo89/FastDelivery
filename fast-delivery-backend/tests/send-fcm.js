require('dotenv').config({ path: '../.env' });
const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const fcmToken = 'eiceLDTvRSe7NYw1_0Cmd3:APA91bGwmRq7Ldp9G6hgDWvIHcxCajR_sDZy8iADC14x33Okyn6i-t_1PH6XpMv_INnfsh-6yKtUZGuqPKnOad2cmuo2__S9eaYW64VbBvLCxSMPQ3YQPAU';

console.log('Sending FCM push to driver...');
console.log('Token:', fcmToken.substring(0, 40) + '...');

admin.messaging().send({
  token: fcmToken,
  notification: {
    title: '🚗 FCM Test!',
    body: 'Push notification μέσω Firebase Cloud Messaging!'
  },
  android: {
    priority: 'high',
    notification: {
      sound: 'default',
      channelId: 'orders'
    }
  }
}).then(result => {
  console.log('✅ SUCCESS! Message ID:', result);
  process.exit(0);
}).catch(error => {
  console.error('❌ ERROR:', error.message);
  process.exit(1);
});
