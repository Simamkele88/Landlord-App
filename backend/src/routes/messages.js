const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { sendPushNotification } = require("../utils/notifications");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "..", "..", "uploads", "messages");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `msg-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'application/zip'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// GET /messages/conversations - Get all conversations for current user
router.get("/conversations", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;

    const result = await pool.query(
      `SELECT DISTINCT ON (other_user_id)
        m.id,
        CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END AS other_user_id,
        CASE WHEN m.sender_id = $1 THEN 
          COALESCE(t.first_name || ' ' || t.last_name, c.first_name || ' ' || c.last_name, l.first_name || ' ' || l.last_name, 'Unknown')
        ELSE 
          COALESCE(t2.first_name || ' ' || t2.last_name, c2.first_name || ' ' || c2.last_name, l2.first_name || ' ' || l2.last_name, 'Unknown')
        END AS with_name,
        CASE WHEN m.sender_id = $1 THEN u2.role ELSE u.role END AS with_role,
        
        prop.name AS property,
        un.unit_number AS unit,
        m.body AS last_message,
        m.created_at AS last_message_at,
        (SELECT COUNT(*) FROM message_ msg WHERE 
          (msg.recipient_id = $1 AND msg.sender_id = CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END)
          AND msg.is_read = false) AS unread_count
       FROM message_ m
       JOIN user_ u ON u.id = m.sender_id
       JOIN user_ u2 ON u2.id = m.recipient_id
       LEFT JOIN tenant t ON t.user_id = m.recipient_id
       LEFT JOIN caretaker c ON c.user_id = m.recipient_id
       LEFT JOIN landlord l ON l.user_id = m.recipient_id
       LEFT JOIN tenant t2 ON t2.user_id = m.sender_id
       LEFT JOIN caretaker c2 ON c2.user_id = m.sender_id
       LEFT JOIN landlord l2 ON l2.user_id = m.sender_id
       LEFT JOIN property prop ON prop.id = m.property_id
       LEFT JOIN unit un ON un.id = (
         SELECT unit_id FROM lease WHERE tenant_id = COALESCE(t.id, t2.id) AND status = 'active' LIMIT 1
       )
       WHERE (m.sender_id = $1 OR m.recipient_id = $1)
         AND (m.sender_id != m.recipient_id)
       ORDER BY other_user_id, m.created_at DESC`,
      [userId]
    );

    const conversations = [];
    for (const row of result.rows) {
      const messages = await pool.query(
        `SELECT m.id, m.sender_id, m.recipient_id, m.body, m.subject, 
                m.message_type, m.is_read, m.created_at,
                CASE WHEN m.sender_id = $1 THEN true ELSE false END AS is_mine
         FROM message_ m
         WHERE (m.sender_id = $1 AND m.recipient_id = $2)
            OR (m.sender_id = $2 AND m.recipient_id = $1)
         ORDER BY m.created_at ASC`,
        [userId, row.other_user_id]
      );

      const messageIds = messages.rows.map(m => m.id);
      let attachments = [];
      if (messageIds.length > 0) {
        const attachResult = await pool.query(
          `SELECT ma.message_id, d.id, d.document_name, d.document_url, d.mime_type, d.file_size
           FROM message_attachment ma
           JOIN document_ d ON d.id = ma.document_id
           WHERE ma.message_id = ANY($1)`,
          [messageIds]
        );
        attachments = attachResult.rows;
      }

      const attachmentsByMessage = {};
      attachments.forEach(a => {
        if (!attachmentsByMessage[a.message_id]) attachmentsByMessage[a.message_id] = [];
        attachmentsByMessage[a.message_id].push({
          id: a.id,
          name: a.document_name,
          url: a.document_url,
          mime_type: a.mime_type,
          file_size: a.file_size,
        });
      });

      conversations.push({
        id: row.other_user_id,
        with_id: row.other_user_id,
        with_name: row.with_name || "Unknown",
        with_role: row.with_role || "unknown",
        property: row.property,
        unit: row.unit,
        last_message: row.last_message,
        last_message_at: row.last_message_at,
        unread_count: parseInt(row.unread_count) || 0,
        with_online: false,
        messages: messages.rows.map(m => ({
          id: m.id,
          sender_id: m.sender_id,
          message: m.body,
          subject: m.subject,
          created_at: m.created_at,
          read: m.is_read,
          is_mine: m.is_mine,
          attachments: attachmentsByMessage[m.id] || [],
        })),
      });
    }

    res.json({ conversations });
  } catch (err) {
    console.error("Get conversations:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// GET /messages/recipients - Get possible recipients
router.get("/recipients", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const userRes = await pool.query("SELECT role FROM user_ WHERE id = $1", [userId]);
    const role = userRes.rows[0]?.role;
    let recipients = [];

    if (role === 'landlord') {
      const tenants = await pool.query(
        `SELECT u.id AS user_id, t.first_name || ' ' || t.last_name AS name, 'tenant' AS role, 
                prop.name AS property, un.unit_number AS unit
         FROM tenant t
         JOIN user_ u ON u.id = t.user_id
         JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
         LEFT JOIN unit un ON un.id = l.unit_id
         LEFT JOIN property prop ON prop.id = un.property_id
         WHERE t.landlord_id = (SELECT id FROM landlord WHERE user_id = $1)`,
        [userId]
      );
      recipients.push(...tenants.rows);

      const caretakers = await pool.query(
        `SELECT u.id AS user_id, c.first_name || ' ' || c.last_name AS name, 'caretaker' AS role,
                prop.name AS property, NULL AS unit
         FROM caretaker c
         JOIN user_ u ON u.id = c.user_id
         LEFT JOIN property prop ON prop.id = c.assigned_property
         WHERE c.landlord_id = (SELECT id FROM landlord WHERE user_id = $1)`,
        [userId]
      );
      recipients.push(...caretakers.rows);
    }

    if (role === 'caretaker') {
      const caretakerRes = await pool.query(
        "SELECT landlord_id, assigned_property FROM caretaker WHERE user_id = $1",
        [userId]
      );
      const landlordId = caretakerRes.rows[0]?.landlord_id;
      const propertyId = caretakerRes.rows[0]?.assigned_property;

      if (landlordId) {
        const landlords = await pool.query(
          `SELECT u.id AS user_id, l.first_name || ' ' || l.last_name AS name, 'landlord' AS role,
                  NULL AS property, NULL AS unit
           FROM landlord l JOIN user_ u ON u.id = l.user_id WHERE l.id = $1`,
          [landlordId]
        );
        recipients.push(...landlords.rows);
      }

      if (propertyId) {
        const tenants = await pool.query(
          `SELECT u.id AS user_id, t.first_name || ' ' || t.last_name AS name, 'tenant' AS role,
                  prop.name AS property, un.unit_number AS unit
           FROM tenant t
           JOIN user_ u ON u.id = t.user_id
           JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
           JOIN unit un ON un.id = l.unit_id
           JOIN property prop ON prop.id = un.property_id
           WHERE prop.id = $1`,
          [propertyId]
        );
        recipients.push(...tenants.rows);
      }
    }

    if (role === 'tenant') {
      const tenantRes = await pool.query(
        "SELECT landlord_id FROM tenant WHERE user_id = $1",
        [userId]
      );
      const landlordId = tenantRes.rows[0]?.landlord_id;

      if (landlordId) {
        const landlords = await pool.query(
          `SELECT u.id AS user_id, l.first_name || ' ' || l.last_name AS name, 'landlord' AS role,
                  NULL AS property, NULL AS unit
           FROM landlord l JOIN user_ u ON u.id = l.user_id WHERE l.id = $1`,
          [landlordId]
        );
        recipients.push(...landlords.rows);

        const caretakers = await pool.query(
          `SELECT u.id AS user_id, c.first_name || ' ' || c.last_name AS name, 'caretaker' AS role,
                  prop.name AS property, NULL AS unit
           FROM caretaker c
           JOIN user_ u ON u.id = c.user_id
           LEFT JOIN property prop ON prop.id = c.assigned_property
           WHERE c.landlord_id = $1`,
          [landlordId]
        );
        recipients.push(...caretakers.rows);
      }
    }

    res.json({ recipients });
  } catch (err) {
    console.error("Get recipients:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /messages - Send a new message
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { recipient_id, message, property_id, subject } = req.body;

    if (!recipient_id || !message) {
      return res.status(400).json({ error: "Recipient and message are required" });
    }

    const result = await pool.query(
      `INSERT INTO message_ (sender_id, recipient_id, property_id, subject, body, message_type, priority, created_at)
       VALUES ($1, $2, $3, $4, $5, 'direct', 'normal', NOW())
       RETURNING *`,
      [userId, recipient_id, property_id || null, subject || null, message]
    );

    // ── SEND PUSH NOTIFICATION ──────────────────────────────
    const senderResult = await pool.query(
      `SELECT COALESCE(
        (SELECT first_name || ' ' || last_name FROM landlord WHERE user_id = $1),
        (SELECT first_name || ' ' || last_name FROM tenant WHERE user_id = $1),
        (SELECT first_name || ' ' || last_name FROM caretaker WHERE user_id = $1),
        'Someone'
      ) AS sender_name`,
      [userId]
    );
    const senderName = senderResult.rows[0]?.sender_name || "Someone";
    const preview = message.substring(0, 100);

    await sendPushNotification(
      recipient_id,
      `New message from ${senderName}`,
      preview,
      { type: "message_received", conversationId: userId }
    );

    await pool.query(
      `INSERT INTO notification (user_id, type, title, message_, related_entity_id, related_entity_type, created_at)
       VALUES ($1, 'message_received', $2, $3, $4, 'message', NOW())`,
      [recipient_id, `New message from ${senderName}`, preview, result.rows[0].id]
    );

    res.status(201).json({ message: "Message sent", data: result.rows[0] });
  } catch (err) {
    console.error("Send message:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /messages/:conversationId/reply - Reply with optional attachments
router.post("/:conversationId/reply", requireAuth, upload.array("attachments", 5), async (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;
    const { message } = req.body;
    const files = req.files || [];

    if (!message && files.length === 0) {
      return res.status(400).json({ error: "Message or attachment is required" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const result = await client.query(
        `INSERT INTO message_ (sender_id, recipient_id, body, message_type, priority, created_at)
         VALUES ($1, $2, $3, 'direct', 'normal', NOW())
         RETURNING *`,
        [userId, conversationId, message || ""]
      );

      const messageId = result.rows[0].id;
      const uploadedAttachments = [];

      for (const file of files) {
        const docResult = await client.query(
          `INSERT INTO document_ (uploaded_by, document_type, document_name, document_url, file_size, mime_type)
           VALUES ($1, 'other', $2, $3, $4, $5)
           RETURNING id, document_name, document_url, file_size, mime_type`,
          [userId, file.originalname, `/uploads/messages/${file.filename}`, file.size, file.mimetype]
        );

        await client.query(
          `INSERT INTO message_attachment (message_id, document_id) VALUES ($1, $2)`,
          [messageId, docResult.rows[0].id]
        );

        uploadedAttachments.push({
          id: docResult.rows[0].id,
          name: docResult.rows[0].document_name,
          url: docResult.rows[0].document_url,
          mime_type: docResult.rows[0].mime_type,
          file_size: docResult.rows[0].file_size,
        });
      }

      await client.query("COMMIT");

      // ── SEND PUSH NOTIFICATION TO RECIPIENT ──────────────────
      // Get sender name
      const senderResult = await pool.query(
        `SELECT COALESCE(
          (SELECT first_name || ' ' || last_name FROM landlord WHERE user_id = $1),
          (SELECT first_name || ' ' || last_name FROM tenant WHERE user_id = $1),
          (SELECT first_name || ' ' || last_name FROM caretaker WHERE user_id = $1),
          'Someone'
        ) AS sender_name`,
        [userId]
      );
      const senderName = senderResult.rows[0]?.sender_name || "Someone";
      const preview = message ? message.substring(0, 100) : "📎 Attachment";

      // Send push to the recipient
      await sendPushNotification(
        conversationId,  // recipient's user_id
        `New message from ${senderName}`,
        preview,
        { type: "message_received", conversationId: userId }
      );

      // Also create a notification in the database
      await pool.query(
        `INSERT INTO notification (user_id, type, title, message_, related_entity_id, related_entity_type, created_at)
         VALUES ($1, 'message_received', $2, $3, $4, 'message', NOW())`,
        [conversationId, `New message from ${senderName}`, preview, messageId]
      );

      res.status(201).json({ 
        message: "Reply sent", 
        data: { ...result.rows[0], attachments: uploadedAttachments, attachments_count: files.length } 
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Reply message:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /messages/:id/read - Mark single message as read
router.put("/:id/read", requireAuth, async (req, res) => {
  try {
    await pool.query("UPDATE message_ SET is_read = true WHERE id = $1", [req.params.id]);
    res.json({ message: "Marked as read" });
  } catch (err) {
    console.error("Mark read:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /messages/read-all/:conversationId - Mark all messages in conversation as read
router.put("/read-all/:conversationId", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    await pool.query(
      `UPDATE message_ SET is_read = true 
       WHERE recipient_id = $1 AND sender_id = $2 AND is_read = false`,
      [userId, req.params.conversationId]
    );
    res.json({ message: "All messages marked as read" });
  } catch (err) {
    console.error("Mark all read:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;