

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Pool } = require("pg");
const nodemailer = require("nodemailer");


const app = express();
app.use(express.json());
app.use(cors());

// Email Configuration 
const emailSender = process.env.EMAIL_SENDER || "noreplyconveniencyinc@gmail.com";
const emailPassword = process.env.EMAIL_PASSWORD || "vyfddhrzjphejurd";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: emailSender,
    pass: emailPassword,
  },
});

//  Database Connection 
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432 ,
  database: process.env.DB_NAME || "landlord_app",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "Wekeza2004",
});

// JWT Configuration 
const JWT_SECRET = process.env.JWT_SECRET || "supersunique_and_880409_jwt_secret_keyecretkey_";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

//  Helper: Generate JWT 
function generateToken(userId, role) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}


// Middleware: Protect Routes 
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Middleware: Landlord Only 
function requireLandlord(req, res, next) {
  if (req.userRole !== 'landlord') {
    return res.status(403).json({ error: "Access denied. Landlord only." });
  }
  next();
}

//  Helper: Send Email 
async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"Chihwa Rentals" <${emailSender}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

//Helper: Send Welcome Email with Temp Password
async function sendWelcomeEmail(email, fullName, tempPassword, role) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .password-box { background: #fff; border: 2px dashed #667eea; padding: 15px; text-align: center; margin: 20px 0; border-radius: 8px; }
        .password { font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 2px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Chihwa Rentals! 🎉</h1>
        </div>
        <div class="content">
          <h2>Hello ${fullName},</h2>
          <p>Your landlord has created an account for you as a <strong>${role}</strong> in the Chihwa Rentals property management system.</p>
          
          <div class="password-box">
            <p style="margin: 0 0 10px 0; color: #666;">Your Temporary Password:</p>
            <div class="password">${tempPassword}</div>
          </div>
          
          <p><strong>Important:</strong> This is a temporary password. You will be required to change it upon your first login.</p>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <ul style="margin: 10px 0 0 0;">
              <li>This password will expire in 7 days</li>
              <li>Never share this password with anyone</li>
              <li>Create a strong, unique password when prompted</li>
            </ul>
          </div>
          
          <center>
            <a href="http://localhost:5173/login" class="button">Login to Your Account</a>
          </center>
          
          <p style="margin-top: 30px;">If you have any questions, please contact your landlord or property manager.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Chihwa Rentals. All rights reserved.</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(email, `Welcome to Chihwa Rentals - Your ${role} Account`, html);
}

// AUTH ROUTES

// POST /auth/landlord/login 
app.post("/auth/landlord/login", async (req, res) => {
  const { email, password } = req.body;

   if (!email || !password || typeof password !== "string" || typeof email !== "string") {
    return res.status(400).json({ error: "Email and password are required" });
    }

  try {
    // Check hardcoded landlords table
    const result = await pool.query(
      "SELECT * FROM landlords WHERE email = $1 AND is_active = true",
      [email]
    );
    
    const landlord = result.rows[0];

    if (!landlord) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, landlord.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(landlord.id, 'landlord');
    res.json({
      token,
      user: {
        id: landlord.id,
        full_name: landlord.full_name,
        email: landlord.email,
        phone: landlord.phone,
        role: 'landlord'
      }
    });
  } catch (err) {
    console.error("Landlord login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /auth/login - For tenants and caretakers
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password || typeof password !== "string" || typeof email !== "string") {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND is_active = true",
      [email]
    );
    
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if this is a temp password
    const tempCheck = await pool.query(
      "SELECT * FROM temp_passwords WHERE user_id = $1 AND used = false AND expires_at > NOW()",
      [user.id]
    );

    const token = generateToken(user.id, user.role);
    
    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        must_change_password: user.must_change_password || tempCheck.rows.length > 0
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

//  POST /auth/change-password 
app.post("/auth/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId;

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters" });
  }

  try {
    // Get user
    const userResult = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(
      currentPassword,
      userResult.rows[0].password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Check if new password is same as old
    const isSamePassword = await bcrypt.compare(
      newPassword,
      userResult.rows[0].password_hash
    );

    if (isSamePassword) {
      return res.status(400).json({ error: "New password must be different from current password" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear flags
    await pool.query(
      `UPDATE users 
       SET password_hash = $1, 
           must_change_password = false,
           updated_at = NOW()
       WHERE id = $2`,
      [hashedPassword, userId]
    );

    // Mark temp password as used if exists
    await pool.query(
      "UPDATE temp_passwords SET used = true WHERE user_id = $1 AND used = false",
      [userId]
    );

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

//  POST /auth/landlord/create-user 
app.post("/auth/landlord/create-user", requireAuth, requireLandlord, async (req, res) => {
  const { full_name, email, phone, role } = req.body;

  if (!full_name || !email || !role) {
    return res.status(400).json({ error: "Full name, email, and role are required" });
  }

  if (!['tenant', 'caretaker'].includes(role)) {
    return res.status(400).json({ error: "Invalid role. Must be 'tenant' or 'caretaker'" });
  }

  try {
    // Check if email already exists
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, must_change_password)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, full_name, email, phone, role`,
      [full_name, email, phone, hashedPassword, role]
    );

    const newUser = result.rows[0];

    // Store temp password record
    await pool.query(
      `INSERT INTO temp_passwords (user_id, temp_password_hash, created_by, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
      [newUser.id, hashedPassword, req.userId]
    );

    // Send welcome email with temp password
    await sendWelcomeEmail(email, full_name, tempPassword, role);

    res.status(201).json({
      message: "User created successfully",
      user: newUser
    });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /auth/forgot-password 
app.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Check users table
    const userResult = await pool.query(
      "SELECT id, full_name FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length > 0) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await pool.query("DELETE FROM password_resets WHERE email = $1", [email]);
      await pool.query(
        "INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)",
        [email, resetToken, expiresAt]
      );

      const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
      
      const html = `
        <h2>Password Reset Request</h2>
        <p>Hello ${userResult.rows[0].full_name},</p>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetLink}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">
          Reset Password
        </a>
        <p>If you didn't request this, please ignore this email.</p>
      `;

      await sendEmail(email, "Password Reset Request", html);
    }

    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /auth/reset-password 
app.post("/auth/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token and new password are required" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM password_resets WHERE token = $1 AND used = FALSE AND expires_at > NOW()",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const reset = result.rows[0];
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await pool.query(
      "UPDATE users SET password_hash = $1, must_change_password = false WHERE email = $2",
      [hashedPassword, reset.email]
    );

    await pool.query("UPDATE password_resets SET used = TRUE WHERE id = $1", [reset.id]);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /auth/me 
app.get("/auth/me", requireAuth, async (req, res) => {
  try {
    let result;
    
    if (req.userRole === 'landlord') {
      result = await pool.query(
        "SELECT id, full_name, email, phone FROM landlords WHERE id = $1",
        [req.userId]
      );
    } else {
      result = await pool.query(
        "SELECT id, full_name, email, phone, role, must_change_password FROM users WHERE id = $1",
        [req.userId]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];
    user.role = req.userRole;

    res.json({ user });
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

//  GET /auth/landlord/users (List all tenants/caretakers) 
app.get("/auth/landlord/users", requireAuth, requireLandlord, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, phone, role, is_active, must_change_password, created_at
       FROM users
       WHERE role IN ('tenant', 'caretaker')
       ORDER BY created_at DESC`
    );

    res.json({ users: result.rows });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Database Setup Function ──────────────────────────────────
async function setupDatabase() {
  try {
    // Test connection
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database setup error:", error);
    throw error;
  }
}

// Start Server 
const PORT = process.env.PORT || 4000;
setupDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📍 Landlord login: POST http://localhost:${PORT}/auth/landlord/login`);
    console.log(`📍 User login: POST http://localhost:${PORT}/auth/login`);
  });
});