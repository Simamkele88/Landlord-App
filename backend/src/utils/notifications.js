const pool = require("../config/database");
const { Expo } = require("expo-server-sdk");
const expo = new Expo();

async function sendPushNotification(userId, title, body, data = {}) {
  try {
    const result = await pool.query(
      "SELECT token FROM push_tokens WHERE user_id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      console.log(`No push tokens found for user ${userId}`);
      return;
    }

    const messages = [];
    for (const row of result.rows) {
      if (!Expo.isExpoPushToken(row.token)) {
        console.error(`Invalid Expo push token: ${row.token}`);
        continue;
      }

      messages.push({
        to: row.token,
        sound: "default",
        title,
        body,
        data,
        priority: "high",
      });
    }

    if (messages.length === 0) return;

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];
    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    console.log(`Push notifications sent: ${tickets.length} tickets`);
  } catch (err) {
    console.error("Send push notification error:", err);
  }
}

async function createNotification(userId, type, title, message, relatedId, relatedType) {
  try {
    await pool.query(
      `INSERT INTO notification (user_id, type, title, message_, related_entity_id, related_entity_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, type, title, message, relatedId || null, relatedType || null]
    );

    await sendPushNotification(userId, title, message, {
      type,
      relatedId: relatedId || "",
      relatedType: relatedType || "",
    });
  } catch (err) {
    console.error("Notification creation error:", err.message);
  }
}

module.exports = { createNotification, sendPushNotification };