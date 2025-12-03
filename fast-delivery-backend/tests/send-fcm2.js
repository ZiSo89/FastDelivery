require('dotenv').config({ path: '../.env' });
const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const fcmToken = 'eiceLDTvRSe7NYw1_0Cmd3:APA91bGwmRq7Ldp9G6hgDWvIHcxCajR_sDZy8iADC14x33Okyn6i-t_1PH6XpMv_INnfsh-6yKtUZGuqPKnOad2cmuo2__S9eaYW64VbBvLCxSMPQ3YQPAU';

console.log('Sending FCM push to driver...');
console.log('Token:', fcmToken.substring(0, 40) + '...');

// Try with data-only message (works when app is in foreground)
admin.messaging().send({
  token: fcmToken,
  // Data message - handled by app
  data: {
    title: 'FCM Data Test',
    body: 'This is a data message!',
    type: 'test'
  },
  // Notification message - shown by system
  notification: {
    title: '🚗 Νέα Παραγγελία!',
    body: 'Test push από FCM - ' + new Date().toLocaleTimeString()
  },
  android: {
    priority: 'high',
    ttl: 60000, // 1 minute TTL
    notification: {
      icon: 'ic_notification',
      color: '#00c2e8',
      sound: 'default',
      defaultSound: true,
      defaultVibrateTimings: true,
      channelId: 'orders',
      priority: 'max',
      visibility: 'public'
    }
  }
}).then(result => {
  console.log('✅ SUCCESS! Message ID:', result);
  process.exit(0);
}).catch(error => {
  console.error('❌ ERROR:', error.code, error.message);
  process.exit(1);
});
