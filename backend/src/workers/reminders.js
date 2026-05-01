const cron = require('node-cron');
const { db } = require('../firebase');
const log = require('../utils/logger');
const { Expo } = require('expo-server-sdk');

const expo = new Expo();

// Run every hour
function startReminderWorker() {
  cron.schedule('0 * * * *', async () => {
    log.info('Running background reminder worker...');
    try {
      const now = new Date();
      // Look for appointments coming up in the next 24 hours that haven't been notified yet
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const snap = await db.collection('appointments')
        .where('status', '==', 'scheduled')
        .where('dateTime', '>=', now.toISOString())
        .where('dateTime', '<=', tomorrow.toISOString())
        .get();

      for (const doc of snap.docs) {
        const appt = doc.data();
        if (appt.reminded) continue;

        // Fetch user to get FCM token
        const userSnap = await db.collection('users').doc(appt.ownerId).get();
        if (userSnap.exists && userSnap.data().fcmToken) {
          const token = userSnap.data().fcmToken;
          
          try {
            if (!Expo.isExpoPushToken(token)) {
              log.warn(`Push token ${token} is not a valid Expo push token`);
              continue;
            }
            
            await expo.sendPushNotificationsAsync([{
              to: token,
              sound: 'default',
              title: 'Upcoming Appointment',
              body: 'You have an appointment scheduled for your pet tomorrow.',
            }]);

            // Mark as reminded
            await doc.ref.update({ reminded: true });
            log.info(`Sent reminder for appointment ${doc.id}`);
          } catch (err) {
            log.warn(`Failed to send push to ${appt.ownerId}: ${err.message}`);
          }
        }
      }
    } catch (err) {
      log.error('Error in reminder worker', { error: err.message });
    }
  });
}

module.exports = { startReminderWorker };
