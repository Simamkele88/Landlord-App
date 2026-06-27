const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const pool = require("../config/database");
const { generateToken } = require("../config/jwt");
const { requireAuth } = require("../middleware/auth");
const { sendResetCodeEmail, sendWelcomeEmail } = require("../utils/email");
const { generateTempPassword, generateResetCode } = require("../utils/helpers");

// POST /auth/push-token
router.post("/push-token", requireAuth, async (req, res) => {
  try {
    const { token, platform } = req.body;
    
    // Store the token in a push_tokens table
    await pool.query(
      `INSERT INTO push_tokens (user_id, token, platform, created_at) 
       VALUES ($1, $2, $3, NOW()) 
       ON CONFLICT (token) DO UPDATE SET user_id = $1, updated_at = NOW()`,
      [req.userId, token, platform]
    );

    res.json({ message: "Push token registered" });
  } catch (err) {
    console.error("Push token:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /auth/landlord/login - LANDLORD LOGIN (must be before /login)
router.post("/landlord/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    const result = await pool.query(
      `SELECT l.*, u.password_hash, u.id AS user_id, u.status
       FROM landlord l
       JOIN user_ u ON u.id = l.user_id
       WHERE u.email = $1`,
      [email.trim().toLowerCase()]
    );

    const landlord = result.rows[0];
    if (!landlord) return res.status(401).json({ error: "Invalid email or password" });

    if (landlord.status !== "active") {
      return res.status(403).json({ error: "Your account has been deactivated." });
    }

    const match = await bcrypt.compare(password, landlord.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid email or password" });

    await pool.query("UPDATE user_ SET last_login = NOW() WHERE id = $1", [landlord.user_id]);

    const token = generateToken(landlord.user_id, "landlord");
    res.json({
      token,
      user: {
        id:          landlord.user_id,
        landlord_id: landlord.id,
        first_name:  landlord.first_name,
        last_name:   landlord.last_name,
        email:       email.trim().toLowerCase(),
        phone:       landlord.phone || null,
        role:        "landlord",
      },
    });
  } catch (err) {
    console.error("Landlord login: ", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /auth/login - GENERAL LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    const result = await pool.query(
      "SELECT * FROM user_ WHERE email = $1",
      [email.trim().toLowerCase()]
    );

    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    if (user.status !== "active") {
      return res.status(403).json({ error: "Your account has been deactivated. Contact your landlord." });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid email or password" });

    const tempCheck = await pool.query(
      "SELECT id FROM temp_password WHERE user_id = $1 AND used = false AND expires_at > NOW()",
      [user.id]
    );

    let profileComplete = true;
    let firstName = "";
    let lastName = "";

    if (user.role === "tenant") {
      const tenantRes = await pool.query(
        "SELECT profile_completed, first_name, last_name FROM tenant WHERE user_id = $1",
        [user.id]
      );
      profileComplete = tenantRes.rows[0]?.profile_completed ?? false;
      firstName = tenantRes.rows[0]?.first_name ?? "";
      lastName = tenantRes.rows[0]?.last_name ?? "";
    }

    if (user.role === "caretaker") {
      const caretakerRes = await pool.query(
        "SELECT first_name, last_name FROM caretaker WHERE user_id = $1",
        [user.id]
      );
      firstName = caretakerRes.rows[0]?.first_name ?? "";
      lastName = caretakerRes.rows[0]?.last_name ?? "";
    }

    await pool.query("UPDATE user_ SET last_login = NOW() WHERE id = $1", [user.id]);

    const token = generateToken(user.id, user.role);
    res.json({
      token,
      user: {
        id:                   user.id,
        email:                user.email,
        phone:                user.phone,
        role:                 user.role,
        must_change_password: user.must_change_password,
        profile_completed:    profileComplete,
        first_name:           firstName,
        last_name:            lastName,
      },
    });
  } catch (err) {
    console.error("Login:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /auth/change-password
router.post("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current and new passwords are required" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  try {
    const result = await pool.query("SELECT password_hash FROM user_ WHERE id = $1", [req.userId]);
    if (!result.rows.length) return res.status(404).json({ error: "User not found" });

    const match = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!match) return res.status(401).json({ error: "Current password is incorrect" });

    const samePassword = await bcrypt.compare(newPassword, result.rows[0].password_hash);
    if (samePassword) return res.status(400).json({ error: "New password must differ from current" });

    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.query(
      "UPDATE user_ SET password_hash=$1, must_change_password=false, updated_at=NOW() WHERE id=$2",
      [hashed, req.userId]
    );
    await pool.query(
      "UPDATE temp_password SET used=true WHERE user_id=$1 AND used=false",
      [req.userId]
    );
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, COALESCE(t.first_name || ' ' || t.last_name, c.first_name || ' ' || c.last_name) AS full_name
       FROM user_ u
       LEFT JOIN tenant t ON t.user_id = u.id
       LEFT JOIN caretaker c ON c.user_id = u.id
       WHERE u.email = $1`,
      [email.trim().toLowerCase()]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const resetCode = generateResetCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await pool.query("DELETE FROM password_reset WHERE email=$1", [email]);
      await pool.query(
        "INSERT INTO password_reset (email, code, expires_at) VALUES ($1,$2,$3)",
        [email, resetCode, expiresAt]
      );

      await sendResetCodeEmail(email, user.full_name || "there", resetCode);
    }
    res.json({ message: "If that email exists, a reset code has been sent." });
  } catch (err) {
    console.error("Forgot password:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /auth/verify-reset-code
router.post("/verify-reset-code", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "Email and reset code are required" });
  }
  try {
    const result = await pool.query(
      "SELECT id FROM password_reset WHERE email=$1 AND code=$2 AND used=false AND expires_at > NOW()",
      [email.trim().toLowerCase(), code]
    );
    if (!result.rows.length) {
      return res.status(400).json({ error: "Invalid or expired reset code" });
    }
    res.json({ message: "Code verified successfully" });
  } catch (err) {
    console.error("Verify reset code:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /auth/reset-password
router.post("/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: "Email, reset code, and new password are required" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  try {
    const result = await pool.query(
      "SELECT * FROM password_reset WHERE email=$1 AND code=$2 AND used=false AND expires_at > NOW()",
      [email.trim().toLowerCase(), code]
    );
    if (!result.rows.length) {
      return res.status(400).json({ error: "Invalid or expired reset code" });
    }

    const reset = result.rows[0];
    const hashed = await bcrypt.hash(newPassword, 12);

    await pool.query(
      "UPDATE user_ SET password_hash=$1, must_change_password=false, updated_at=NOW() WHERE email=$2",
      [hashed, reset.email]
    );
    await pool.query("UPDATE password_reset SET used=true WHERE id=$1", [reset.id]);
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset password:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /auth/me
router.get("/me", requireAuth, async (req, res) => {
  try {
    let result;
    if (req.userRole === "landlord") {
      result = await pool.query(
        `SELECT l.id AS landlord_id, u.id, u.email, u.phone, u.last_login,
                l.first_name, l.last_name, l.company_name, l.profile_image_url
         FROM landlord l JOIN user_ u ON u.id = l.user_id WHERE u.id = $1`,
        [req.userId]
      );
    } else if (req.userRole === "tenant") {
      result = await pool.query(
        `SELECT t.id AS tenant_id, u.id, u.email, u.phone, u.must_change_password,
                t.first_name, t.last_name, t.profile_image_url, t.profile_completed,
                t.reliability_score
         FROM tenant t JOIN user_ u ON u.id = t.user_id WHERE u.id = $1`,
        [req.userId]
      );
    } else {
      result = await pool.query(
        `SELECT c.id AS caretaker_id, u.id, u.email, u.phone, u.must_change_password,
                c.first_name, c.last_name, c.profile_image_url
         FROM caretaker c JOIN user_ u ON u.id = c.user_id WHERE u.id = $1`,
        [req.userId]
      );
    }
    if (!result.rows.length) return res.status(404).json({ error: "User not found" });
    res.json({ user: { ...result.rows[0], role: req.userRole } });
  } catch (err) {
    console.error("Auth me:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
