const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireLandlord } = require("../middleware/roleCheck");
const { sendWelcomeEmail } = require("../utils/email");
const { auditLog } = require("../utils/audit");
const { generateTempPassword } = require("../utils/helpers");
const { createNotification } = require("../utils/notifications");

async function getLandlordId(userId) {
  const result = await pool.query("SELECT id FROM landlord WHERE user_id = $1", [userId]);
  return result.rows[0]?.id || null;
}

// GET /landlord/caretakers - List all caretakers
router.get("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const result = await pool.query(
      `SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.phone,
        c.is_active,
        c.assigned_property AS assigned_property_id,
        c.created_at,
        u.email,
        u.last_login,
        p.name AS property_name,
        p.address_line1 AS property_address,
        COALESCE(
          (SELECT COUNT(*) FROM maintenance_request mr
           JOIN unit un ON un.id = mr.unit_id
           WHERE un.property_id = c.assigned_property
             AND mr.status IN ('needs_repair','assigned','in_progress')),
          0
        ) AS open_maintenance_count,
        COALESCE(
          (SELECT COUNT(*) FROM complaint comp
           WHERE comp.property_id = c.assigned_property
             AND comp.status IN ('open','under_review','escalated')),
          0
        ) AS open_complaint_count
       FROM caretaker c
       JOIN user_ u ON u.id = c.user_id
       LEFT JOIN property p ON p.id = c.assigned_property
       WHERE c.landlord_id = $1
       ORDER BY c.created_at DESC`,
      [landlordId]
    );

    const caretakers = result.rows.map(c => ({
      ...c,
      status: c.is_active ? "active" : "inactive",
      name: `${c.first_name || ""} ${c.last_name || ""}`.trim(),
    }));

    res.json({ 
      caretakers,
      total: caretakers.length,
      active: caretakers.filter(c => c.is_active).length
    });
  } catch (err) {
    console.error("Get caretakers:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /landlord/caretakers - Register a new caretaker
router.post("/", requireAuth, requireLandlord, async (req, res) => {
  const { first_name, last_name, email, phone, assigned_property, notes } = req.body;

  if (!first_name || !last_name || !email) {
    return res.status(400).json({ error: "First name, last name, and email are required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Landlord record not found" });
    }

    // Check if email already exists
    const existingUser = await client.query(
      "SELECT id FROM user_ WHERE email = $1",
      [email.trim().toLowerCase()]
    );
    if (existingUser.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "A user with this email already exists" });
    }

    // If property is specified, verify it belongs to this landlord
    if (assigned_property) {
      const propertyCheck = await client.query(
        "SELECT id, caretaker_id FROM property WHERE id = $1 AND landlord_id = $2",
        [assigned_property, landlordId]
      );
      if (!propertyCheck.rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Property not found or does not belong to you" });
      }
      if (propertyCheck.rows[0].caretaker_id) {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "This property already has a caretaker assigned" });
      }
    }

    // Create user
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const userResult = await client.query(
      `INSERT INTO user_ (email, phone, password_hash, role, must_change_password, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'caretaker', true, 'active', NOW(), NOW())
       RETURNING id`,
      [email.trim().toLowerCase(), phone || null, hashedPassword]
    );
    const userId = userResult.rows[0].id;

    // Create caretaker profile
    const caretakerResult = await client.query(
      `INSERT INTO caretaker (user_id, landlord_id, first_name, last_name, phone, assigned_property, is_active, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, $7, NOW(), NOW())
       RETURNING id, first_name, last_name, phone, assigned_property, is_active, created_at`,
      [userId, landlordId, first_name.trim(), last_name.trim(), phone || null, assigned_property || null, req.userId]
    );
    const caretaker = caretakerResult.rows[0];

    // Assign property
    if (assigned_property) {
      await client.query(
        "UPDATE property SET caretaker_id = $1, updated_at = NOW() WHERE id = $2",
        [caretaker.id, assigned_property]
      );
    }

    // Save temp password
    await client.query(
      `INSERT INTO temp_password (user_id, password_hash, expires_at, created_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days', NOW())`,
      [userId, hashedPassword]
    );

    await client.query("COMMIT");

    // Send welcome email
    await sendWelcomeEmail(email, `${first_name} ${last_name}`, tempPassword, "caretaker");

    // Audit log
    await auditLog(req.userId, "CREATE", "caretaker", caretaker.id, null, { first_name, last_name, email, assigned_property }, req);

    // Notify caretaker
    await createNotification(
      userId, "account_created", "Welcome to Chihwa Rentals",
      `Your caretaker account has been created. Please check your email for login details.`,
      caretaker.id, "caretaker"
    );

    res.status(201).json({
      message: "Caretaker registered successfully",
      caretaker: {
        ...caretaker,
        email: email.trim().toLowerCase(),
        status: "active",
        name: `${first_name} ${last_name}`,
        temp_password: process.env.NODE_ENV === "development" ? tempPassword : undefined,
      }
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Register caretaker:", err);
    res.status(500).json({ error: "Server error while registering caretaker" });
  } finally {
    client.release();
  }
});

// PUT /landlord/caretakers/:id/assign-property - Assign property to caretaker
router.put("/:id/assign-property", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const { id } = req.params;
    const { property_id } = req.body;

    if (!property_id) {
      return res.status(400).json({ error: "Property ID is required" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Verify caretaker
      const caretakerCheck = await client.query(
        "SELECT * FROM caretaker WHERE id = $1 AND landlord_id = $2",
        [id, landlordId]
      );
      if (!caretakerCheck.rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Caretaker not found" });
      }

      const caretaker = caretakerCheck.rows[0];

      // Verify property
      const propertyCheck = await client.query(
        "SELECT id, caretaker_id, name FROM property WHERE id = $1 AND landlord_id = $2",
        [property_id, landlordId]
      );
      if (!propertyCheck.rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Property not found" });
      }

      // Check if property already has another caretaker
      if (propertyCheck.rows[0].caretaker_id && propertyCheck.rows[0].caretaker_id !== id) {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "This property already has a different caretaker" });
      }

      // Remove from old property
      if (caretaker.assigned_property && caretaker.assigned_property !== property_id) {
        await client.query(
          "UPDATE property SET caretaker_id = NULL, updated_at = NOW() WHERE id = $1",
          [caretaker.assigned_property]
        );
      }

      // Assign to new property
      await client.query(
        "UPDATE caretaker SET assigned_property = $1, updated_at = NOW() WHERE id = $2",
        [property_id, id]
      );
      await client.query(
        "UPDATE property SET caretaker_id = $1, updated_at = NOW() WHERE id = $2",
        [id, property_id]
      );

      await client.query("COMMIT");

      await createNotification(
        caretaker.user_id, "property_assigned", "Property Assigned",
        `You have been assigned to: ${propertyCheck.rows[0].name}`,
        property_id, "property"
      );

      res.json({ 
        message: "Property assigned successfully",
        property_name: propertyCheck.rows[0].name
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Assign property:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /landlord/caretakers/:id/toggle-status - Activate/deactivate caretaker
router.put("/:id/toggle-status", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const { id } = req.params;

    const caretakerCheck = await pool.query(
      "SELECT c.*, u.id AS user_id FROM caretaker c JOIN user_ u ON u.id = c.user_id WHERE c.id = $1 AND c.landlord_id = $2",
      [id, landlordId]
    );
    if (!caretakerCheck.rows.length) {
      return res.status(404).json({ error: "Caretaker not found" });
    }

    const caretaker = caretakerCheck.rows[0];
    const newStatus = !caretaker.is_active;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query("UPDATE caretaker SET is_active = $1, updated_at = NOW() WHERE id = $2", [newStatus, id]);
      await client.query("UPDATE user_ SET status = $1, updated_at = NOW() WHERE id = $2", [newStatus ? 'active' : 'inactive', caretaker.user_id]);

      await client.query("COMMIT");

      await createNotification(
        caretaker.user_id, "account_status",
        newStatus ? "Account Activated" : "Account Deactivated",
        newStatus ? "Your account has been activated." : "Your account has been deactivated.",
        id, "caretaker"
      );

      res.json({ message: `Caretaker ${newStatus ? 'activated' : 'deactivated'}`, is_active: newStatus });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Toggle status:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;