// ============================================================
// AUTH SYSTEM - Node.js + Express + PostgreSQL Backend
// ============================================================
// Endpoints:
//   POST /auth/register        → Create new user
//   POST /auth/login           → Login, returns JWT
//   POST /auth/forgot-password → Send reset token
//   POST /auth/reset-password  → Use token to set new password
//   GET  /auth/me              → Protected: get current user
// ============================================================

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Pool } = require("pg");
const nodemailer = require("nodemailer");
const emailSender = "noreplyconveniencyinc@gmail.com";
const password = "vyfddhrzjphejurd";

const app = express();
app.use(express.json());
app.use(cors());

// ── Database Connection ──────────────────────────────────────
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "auth_db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "Wekeza2004",
});

// Create a transporter (using Gmail as an example)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: emailSender,     
    pass: password,     
  },
});

// ── JWT Secret (use a long random string in production!) ─────
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_change_in_prod";
const JWT_EXPIRES_IN = "7d"; // Token valid for 7 days

// ── Database Setup (run once on startup) ─────────────────────
async function setupDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(100) NOT NULL,
      email       VARCHAR(255) UNIQUE NOT NULL,
      password    VARCHAR(255) NOT NULL,
      created_at  TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id          SERIAL PRIMARY KEY,
      email       VARCHAR(255) NOT NULL,
      token       VARCHAR(255) UNIQUE NOT NULL,
      expires_at  TIMESTAMP NOT NULL,
      used        BOOLEAN DEFAULT FALSE,
      created_at  TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log("✅ Database tables ready");
}

// ── Helper: Generate JWT ─────────────────────────────────────
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// ── Middleware: Protect Routes ───────────────────────────────
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId; 
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

async function sendResetEmail(toEmail, resetLink) {
  await transporter.sendMail({
    from: `"Auth App" <${emailSender}>`,
    to: toEmail,
    subject: "Password Reset Request",
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password. It expires in 1 hour.</p>
      <a href="${resetLink}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">
        Reset Password
      </a>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });
}

// ════════════════════════════════════════════════════════════
// ROUTES
// ════════════════════════════════════════════════════════════

// ── POST /auth/register ─────────────────────────────────────
app.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  // 1. Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    // 2. Check if email already exists
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // 3. Hash the password (salt rounds = 12)
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. Insert new user
    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, hashedPassword]
    );

    const user = result.rows[0];

    // 5. Generate token and respond
    const token = generateToken(user.id);
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /auth/login ────────────────────────────────────────
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  // 1. Validate input
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // 2. Find user by email
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) {
      // Use a vague message so attackers can't enumerate emails
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 3. Compare password with stored hash
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 4. Generate token and respond
    const token = generateToken(user.id);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /auth/forgot-password ──────────────────────────────
app.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Always respond with success (don't reveal if email exists)
    const user = await pool.query("SELECT id FROM users WHERE email = $1", [email]);

    if (user.rows.length > 0) {
      // Generate a secure random token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store token in DB (invalidate old ones for this email first)
      await pool.query("DELETE FROM password_resets WHERE email = $1", [email]);
      await pool.query(
        "INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)",
        [email, resetToken, expiresAt]
      );

      // 🚀 In production: send this link via email (e.g. with Nodemailer/SendGrid)
      const resetLink = `http://localhost:${5174}/reset-password?token=${resetToken}`;
      //console.log(`📧 Password reset link for ${email}: ${resetLink}`);
      await sendResetEmail(email, resetLink);
    }

    // Always return 200 to prevent email enumeration
    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /auth/reset-password ───────────────────────────────
app.post("/auth/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token and new password are required" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    // 1. Find valid, unused token
    const result = await pool.query(
      "SELECT * FROM password_resets WHERE token = $1 AND used = FALSE AND expires_at > NOW()",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const reset = result.rows[0];

    // 2. Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 3. Update user's password
    await pool.query("UPDATE users SET password = $1 WHERE email = $2", [
      hashedPassword,
      reset.email,
    ]);

    // 4. Mark token as used
    await pool.query("UPDATE password_resets SET used = TRUE WHERE id = $1", [reset.id]);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /auth/me (Protected) ────────────────────────────────
app.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, created_at FROM users WHERE id = $1",
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
setupDatabase().then(() => {
  app.listen(PORT, () => console.log(`🚀 Auth API running on http://localhost:${PORT}`));
});
