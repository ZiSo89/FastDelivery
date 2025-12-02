const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
const expo = new Expo();

const sendPushNotification = async (pushToken, title, body, data = {}) => {
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
    // Send the notification
    const tickets = await expo.sendPushNotificationsAsync([message]);
    const ticket = tickets[0];
    
    console.log(`📨 Expo ticket response:`, JSON.stringify(ticket));
    
    if (ticket.status === 'ok') {
      console.log(`✅ Push delivered to Expo, ticket ID: ${ticket.id}`);
      return { success: true, ticketId: ticket.id };
    } else {
      // Handle errors
      console.error(`❌ Expo push error: ${ticket.message}`);
      if (ticket.details?.error) {
        console.error(`   Error type: ${ticket.details.error}`);
        // DeviceNotRegistered means the token is invalid/expired
        if (ticket.details.error === 'DeviceNotRegistered') {
          console.error(`   ⚠️ Device not registered - token may be expired!`);
        }
      }
      return { success: false, error: ticket.message };
    }
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendPushNotification };
