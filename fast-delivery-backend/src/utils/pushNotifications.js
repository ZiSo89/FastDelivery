const { Expo } = require('expo-server-sdk');
const admin = require('firebase-admin');

// Create a new Expo SDK client
const expo = new Expo();

// Initialize Firebase Admin if not already done
const initFirebase = () => {
  if (!admin.apps.length) {
    try {
      const serviceAccount = require('../../firebase-service-account.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin initialized for push notifications');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin:', error.message);
    }
  }
};

// Send push via FCM (for standalone APK builds)
const sendFCMNotification = async (fcmToken, title, body, data = {}) => {
  initFirebase();
  
  const message = {
    token: fcmToken,
    notification: {
      title,
      body,
    },
    data: Object.keys(data).reduce((acc, key) => {
      acc[key] = String(data[key]);
      return acc;
    }, {}),
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'orders',
      }
    }
  };

  try {
    const result = await admin.messaging().send(message);
    console.log(`✅ FCM push sent: ${result}`);
    return { success: true, messageId: result };
  } catch (error) {
    console.error('❌ FCM push error:', error.message);
    return { success: false, error: error.message };
  }
};

// Send push via Expo (for Expo Go / development)
const sendExpoPushNotification = async (pushToken, title, body, data = {}) => {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`❌ Push token ${pushToken} is not a valid Expo push token`);
    return { success: false, error: 'Invalid token' };
  }

  const message = {
    to: pushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
    priority: 'high',
  };

  try {
    const tickets = await expo.sendPushNotificationsAsync([message]);
    const ticket = tickets[0];
    
    console.log(`📨 Expo ticket response:`, JSON.stringify(ticket));
    
    if (ticket.status === 'ok') {
      console.log(`✅ Push delivered to Expo, ticket ID: ${ticket.id}`);
      return { success: true, ticketId: ticket.id };
    } else {
      console.error(`❌ Expo push error: ${ticket.message}`);
      if (ticket.details?.error === 'DeviceNotRegistered') {
        console.error(`   ⚠️ Device not registered - token may be expired!`);
      }
      return { success: false, error: ticket.message };
    }
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    return { success: false, error: error.message };
  }
};

// Main function - auto-detect token type
const sendPushNotification = async (pushToken, title, body, data = {}, tokenType = null) => {
  // Auto-detect token type if not provided
  if (!tokenType) {
    tokenType = Expo.isExpoPushToken(pushToken) ? 'expo' : 'fcm';
  }
  
  console.log(`📱 Sending ${tokenType.toUpperCase()} push: "${title}" to ${pushToken.substring(0, 30)}...`);
  
  if (tokenType === 'fcm') {
    return sendFCMNotification(pushToken, title, body, data);
  } else {
    return sendExpoPushNotification(pushToken, title, body, data);
  }
};

module.exports = { sendPushNotification, sendFCMNotification, sendExpoPushNotification };
