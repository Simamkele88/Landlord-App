// THIS FILE CONTAINS ALL ENDPOINTS, CONNECTS FRONTEND TO DATABASE
require("dotenv").config();
console.log("SUPABASE_DB_URL =", process.env.SUPABASE_DB_URL);
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});
const nodemailer = require("nodemailer");
const path = require('path');
const fs = require('fs');

const app = express();
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});
app.use(cors({
  origin: true,
  credentials: true,
}));
app.set("trust proxy", 1);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB connection failed");
  }
});

// EMAIL CONFIGURATION
const emailSender = process.env.EMAIL_SENDER || "noreplyconveniencyinc@gmail.com";
const emailPassword = process.env.EMAIL_PASSWORD || "vyfddhrzjphejurd";

// PORT AND APP URL CONFIGURATION
const PORT = process.env.PORT || 4000;
const APP_URL = process.env.APP_URL || "http://localhost:5173";

// EMAIL TRANSPORTER CONFIGURATION
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: emailSender,
    pass: emailPassword,
  },
});

// DATABASE CONFIGURATION
/*const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "chihwa_rentals_db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "Wekeza2004",
});*/

// JWT CONFIGURATION
const JWT_SECRET = process.env.JWT_SECRET || "supersunique_and_880409_jwt_secret_keyecretkey_";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

// GENERATE JWT TOKEN
function generateToken(userId, role) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// GENERATE TEMPORARY PASSWORD
function generateTempPassword() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

// GENERATE 6-DIGIT RESET CODE
function generateResetCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// PROTECTED ROUTES MIDDLEWARE
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

// LANDLORD-ONLY MIDDLEWARE
function requireLandlord(req, res, next) {
  if (req.userRole !== "landlord") {
    return res.status(403).json({ error: "Access denied. Landlord only." });
  }
  next();
}

// CARETAKER OR LANDLORD MIDDLEWARE
function requireCaretaker(req, res, next) {
  if (!["landlord", "caretaker"].includes(req.userRole)) {
    return res.status(403).json({ error: "Access denied. Caretaker or Landlord only." });
  }
  next();
}

// TENANT-ONLY MIDDLEWARE
function requireTenant(req, res, next) {
  if (req.userRole !== "tenant") {
    return res.status(403).json({ error: "Access denied. Tenant only." });
  }
  next();
}

// SEND EMAIL HELPER FUNCTION
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

// SEND RESET CODE EMAIL
async function sendResetCodeEmail(email, fullName, resetCode) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Password Reset</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.6; margin: 0; padding: 24px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <p>Hello ${fullName},</p>

        <p>We received a request to reset your password for your Chihwa Rentals account.</p>

        <p>Please use the verification code below to proceed:</p>

        <p style="font-size: 28px; letter-spacing: 6px; margin: 24px 0;">
          <strong>${resetCode}</strong>
        </p>

        <p>This code will expire in 15 minutes. If you did not request a password reset, you can safely ignore this email.</p>

        <p>Kind regards,<br/>Chihwa Rentals Team</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
  return sendEmail(email, "Password Reset Verification Code", html);
}

// SEND WELCOME EMAIL
async function sendWelcomeEmail(email, fullName, tempPassword, role) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Welcome to Chihwa Rentals</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.6; margin: 0; padding: 24px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <p>Hello ${fullName},</p>

        <p>Your landlord has created an account for you on Chihwa Rentals as a <strong>${role}</strong>.</p>

        <p>Your temporary password is:</p>

        <p style="font-size: 20px; letter-spacing: 3px; margin: 18px 0;">
          <strong>${tempPassword}</strong>
        </p>

        <p>You will be required to change this password when you log in for the first time. This password expires in 7 days.</p>

        <p>Kind regards,<br/>Chihwa Rentals Team</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
  return sendEmail(email, `Welcome to Chihwa Rentals — Your ${role} account is ready`, html);
}

// AUDIT LOGGING FUNCTION
async function auditLog(userId, action, entityType, entityId, oldValues, newValues, req) {
  try {
    await pool.query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        userId || null, action, entityType, entityId || null,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        req?.ip || null,
        req?.headers?.["user-agent"] || null,
      ]
    );
  } catch { }
}

// INSERT NOTIFICATION
async function createNotification(userId, type, title, message, relatedId, relatedType) {
  try {
    await pool.query(
      `INSERT INTO notification (user_id, type, title, message, related_entity_id, related_entity_type)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [userId, type, title, message, relatedId || null, relatedType || null]
    );
  } catch {  }
}

// POST /auth/landlord/login - LANDLORD LOGIN ENDPOINT
app.post("/auth/landlord/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    // GET LANDLORD RECORD WITH USER CREDENTIALS
    const result = await pool.query(
      `SELECT l.*, u.password_hash, u.id AS user_id, u.status
       FROM landlord l
       JOIN user_ u ON u.id = l.user_id
       WHERE u.email = $1`,
      [email.trim().toLowerCase()]
    );

    // CHECK IF LANDLORD EXISTS
    const landlord = result.rows[0];
    if (!landlord) return res.status(401).json({ error: "Invalid email or password" });

    // CHECK IF ACCOUNT IS ACTIVE
    if (landlord.status !== "active") {
      return res.status(403).json({ error: "Your account has been deactivated." });
    }

    // VERIFY PASSWORD
    const match = await bcrypt.compare(password, landlord.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid email or password" });

    // UPDATE LAST LOGIN TIME
    await pool.query("UPDATE user_ SET last_login = NOW() WHERE id = $1", [landlord.user_id]);

    // GENERATE JWT TOKEN AND RESPOND WITH USER INFO
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

// POST /auth/login - GENERAL LOGIN ENDPOINT FOR ALL ROLES
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    // GET USER RECORD BY EMAIL
    const result = await pool.query(
      "SELECT * FROM user_ WHERE email = $1",
      [email.trim().toLowerCase()]
    );

    // CHECK IF USER EXISTS
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    // CHECK IF ACCOUNT IS ACTIVE
    if (user.status !== "active") {
      return res.status(403).json({ error: "Your account has been deactivated. Contact your landlord." });
    }

    // VERIFY PASSWORD
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid email or password" });

    // CHECK IF TEMP PASSWORD IS STILL ACTIVE
    const tempCheck = await pool.query(
      "SELECT id FROM temp_password WHERE user_id = $1 AND used = false AND expires_at > NOW()",
      [user.id]
    );

    // GET PROFILE INFO BASED ON ROLE
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

    // UPDATE LAST LOGIN TIME
    await pool.query("UPDATE user_ SET last_login = NOW() WHERE id = $1", [user.id]);

    // GENERATE JWT TOKEN AND RESPOND
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

// POST /auth/change-password - CHANGE PASSWORD ENDPOINT
app.post("/auth/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current and new passwords are required" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  try {
    // GET CURRENT PASSWORD HASH
    const result = await pool.query("SELECT password_hash FROM user_ WHERE id = $1", [req.userId]);
    if (!result.rows.length) return res.status(404).json({ error: "User not found" });

    // VERIFY CURRENT PASSWORD
    const match = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!match) return res.status(401).json({ error: "Current password is incorrect" });

    // CHECK NEW PASSWORD IS DIFFERENT
    const samePassword = await bcrypt.compare(newPassword, result.rows[0].password_hash);
    if (samePassword) return res.status(400).json({ error: "New password must differ from current" });

    // HASH NEW PASSWORD AND UPDATE
    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.query(
      "UPDATE user_ SET password_hash=$1, must_change_password=false, updated_at=NOW() WHERE id=$2",
      [hashed, req.userId]
    );
    // MARK TEMP PASSWORD AS USED IF EXISTS
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

// POST /auth/forgot-password — SENDS 6-DIGIT CODE VIA EMAIL
app.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });
  try {
    // FIND USER AND GET FULL NAME
    const result = await pool.query(
      `SELECT u.id, u.email, COALESCE(t.first_name || ' ' || t.last_name, c.first_name || ' ' || c.last_name) AS full_name
       FROM user_ u
       LEFT JOIN tenant t ON t.user_id = u.id
       LEFT JOIN caretaker c ON c.user_id = u.id
       WHERE u.email = $1`,
      [email.trim().toLowerCase()]
    );

    // IF USER EXISTS, GENERATE 6-DIGIT CODE AND SEND EMAIL
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const resetCode = generateResetCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); 

      // DELETE OLD CODES AND INSERT NEW ONE
      await pool.query("DELETE FROM password_reset WHERE email=$1", [email]);
      await pool.query(
        "INSERT INTO password_reset (email, code, expires_at) VALUES ($1,$2,$3)",
        [email, resetCode, expiresAt]
      );

      // SEND RESET CODE EMAIL
      await sendResetCodeEmail(email, user.full_name || "there", resetCode);
    }
    // ALWAYS RETURN SUCCESS TO PREVENT EMAIL ENUMERATION
    res.json({ message: "If that email exists, a reset code has been sent." });
  } catch (err) {
    console.error("Forgot password:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /auth/verify-reset-code — VERIFIES THE 6-DIGIT CODE IS VALID
app.post("/auth/verify-reset-code", async (req, res) => {
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

// POST /auth/reset-password - RESET PASSWORD ENDPOINT
app.post("/auth/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: "Email, reset code, and new password are required" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  try {
    // FIND VALID CODE FOR THIS EMAIL
    const result = await pool.query(
      "SELECT * FROM password_reset WHERE email=$1 AND code=$2 AND used=false AND expires_at > NOW()",
      [email.trim().toLowerCase(), code]
    );
    if (!result.rows.length) {
      return res.status(400).json({ error: "Invalid or expired reset code" });
    }

    const reset = result.rows[0];
    const hashed = await bcrypt.hash(newPassword, 12);

    // UPDATE PASSWORD AND MARK CODE AS USED
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

// GET /auth/me - GET CURRENT USER INFO
app.get("/auth/me", requireAuth, async (req, res) => {
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



// POST /tenants/register - LANDLORD CAN REGISTER A NEW TENANT AND CREATE LEASE
app.post("/tenants/register", requireAuth, requireLandlord, async (req, res) => {
  const {
    first_name, last_name, email, phone,
    unit_id, rent_amount, deposit_amount,
    payment_frequency, payment_due_day,
    lease_start_date, lease_end_date, special_note,
  } = req.body;

  if (!first_name || !last_name || !email || !unit_id || !rent_amount || !lease_start_date || !lease_end_date) {
    return res.status(400).json({ error: "Name, email, unit, rent amount, and lease dates are required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // CHECK IF EMAIL ALREADY EXISTS
    const existing = await client.query("SELECT id FROM user_ WHERE email=$1", [email.trim().toLowerCase()]);
    if (existing.rows.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "A user with this email already exists" });
    }

    // CHECK IF UNIT IS VACANT
    const unitCheck = await client.query("SELECT id, property_id, status FROM unit WHERE id=$1", [unit_id]);
    if (!unitCheck.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Unit not found" });
    }
    if (unitCheck.rows[0].status !== "vacant") {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Unit is not vacant" });
    }

    // GET LANDLORD ID
    const landlordRes = await client.query("SELECT id FROM landlord WHERE user_id=$1", [req.userId]);
    if (!landlordRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Landlord record not found" });
    }
    const landlordId = landlordRes.rows[0].id;

    // GENERATE TEMP PASSWORD AND CREATE USER
    const tempPassword = generateTempPassword();
    const hashed = await bcrypt.hash(tempPassword, 12);

    const userRes = await client.query(
      `INSERT INTO user_ (email, phone, password_hash, role, must_change_password, status, created_at, updated_at)
       VALUES ($1,$2,$3,'tenant',true,'active',NOW(),NOW()) RETURNING id`,
      [email.trim().toLowerCase(), phone || null, hashed]
    );
    const userId = userRes.rows[0].id;

    // CREATE TENANT PROFILE
    const tenantRes = await client.query(
      `INSERT INTO tenant (user_id, landlord_id, first_name, last_name, special_note, profile_completed, created_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,false,$6,NOW(),NOW()) RETURNING id`,
      [userId, landlordId, first_name, last_name, special_note || null, req.userId]
    );
    const tenantId = tenantRes.rows[0].id;

    // SAVE TEMP PASSWORD
    await client.query(
      `INSERT INTO temp_password (user_id, password_hash, expires_at, created_at)
       VALUES ($1,$2, NOW() + INTERVAL '7 days', NOW())`,
      [userId, hashed]
    );

    // CREATE LEASE
    const leaseRes = await client.query(
      `INSERT INTO lease (tenant_id, unit_id, landlord_id, lease_start_date, lease_end_date,
         rent_amount, deposit_amount, payment_frequency, payment_due_day, status, created_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active',$10,NOW(),NOW()) RETURNING id`,
      [
        tenantId, unit_id, landlordId,
        lease_start_date, lease_end_date,
        rent_amount, deposit_amount || rent_amount,
        payment_frequency || "monthly", payment_due_day || 1,
        req.userId,
      ]
    );

    // UPDATE UNIT STATUS
    await client.query(
      "UPDATE unit SET status='occupied', current_tenant_id=$1, updated_at=NOW() WHERE id=$2",
      [tenantId, unit_id]
    );

    // INITIALIZE PAYMENT HISTORY
    await client.query(
      `INSERT INTO tenant_payment_history (tenant_id, on_time_payments, late_payments, missed_payments, partial_payment, last_calculated)
       VALUES ($1,0,0,0,0,NOW())`,
      [tenantId]
    );

    await client.query("COMMIT");

    // SEND WELCOME EMAIL
    await sendWelcomeEmail(email, `${first_name} ${last_name}`, tempPassword, "tenant");
    await auditLog(req.userId, "CREATE", "tenant", tenantId, null, { first_name, last_name, email, unit_id }, req);

    res.status(201).json({
      message:       "Tenant registered successfully",
      tenant_id:     tenantId,
      user_id:       userId,
      lease_id:      leaseRes.rows[0].id,
      temp_password: process.env.NODE_ENV === "development" ? tempPassword : undefined,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Register tenant:", err);
    res.status(500).json({ error: "Server error while registering tenant" });
  } finally {
    client.release();
  }
});

// PATCH /tenants/me/profile - TENANT CAN COMPLETE OR UPDATE THEIR PROFILE
app.patch("/tenants/me/profile", requireAuth, requireTenant, async (req, res) => {
  const {
    date_of_birth, gender, nationality, marital_status,
    id_document_type, id_number, passport_number,
    home_address_line1, home_address_line2, home_city, home_postal_code, home_province, home_country,
    employment_status, employer_company, employer_contact, employer_official_email, job_title, monthly_income,
    emergency_name, emergency_relationship, emergency_phone, emergency_email, emergency_address,
    number_of_occupants, has_pets, pet_details,
  } = req.body;

  if (!date_of_birth || !gender || !nationality || !id_document_type || !employment_status || !emergency_name || !emergency_phone) {
    return res.status(400).json({ error: "Date of birth, gender, nationality, ID type, employment status, and emergency contact are required" });
  }
  try {
    const tenantRes = await pool.query("SELECT id FROM tenant WHERE user_id=$1", [req.userId]);
    if (!tenantRes.rows.length) return res.status(404).json({ error: "Tenant record not found" });
    const tenantId = tenantRes.rows[0].id;

    // UPDATE TENANT PROFILE
    await pool.query(
      `UPDATE tenant SET
         date_of_birth=$1, gender=$2, nationality=$3, marital_status=$4,
         id_document_type=$5, id_number=$6, passport_number=$7,
         home_address_line1=$8, home_address_line2=$9, home_city=$10, home_postal_code=$11,
         home_province=$12, home_country=$13,
         employment_status=$14, employer_company=$15, employer_contact=$16,
         employer_official_email=$17, job_title=$18, monthly_income=$19,
         emergency_name=$20, emergency_relationship=$21, emergency_phone=$22,
         emergency_email=$23, emergency_address=$24,
         number_of_occupants=$25, has_pets=$26, pet_details=$27,
         profile_completed=true, updated_by=$28, updated_at=NOW()
       WHERE id=$29`,
      [
        date_of_birth, gender.toLowerCase(), nationality, marital_status.toLowerCase() || null,
        id_document_type, id_number || null, passport_number || null,
        home_address_line1 || null, home_address_line2 || null, home_city || null,
        home_postal_code || null, home_province || null, home_country || null,
        employment_status.toLowerCase(), employer_company || null, employer_contact || null,
        employer_official_email || null, job_title || null, monthly_income || null,
        emergency_name, emergency_relationship || null, emergency_phone,
        emergency_email || null, emergency_address || null,
        number_of_occupants || 1, has_pets || false, has_pets ? pet_details || null : null,
        req.userId, tenantId,
      ]
    );
    res.json({ message: "Profile completed successfully", profile_completed: true });
  } catch (err) {
    console.error("Complete profile:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /tenants/me - GET CURRENT TENANT INFO
app.get("/tenants/me", requireAuth, requireTenant, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.email, u.phone, u.must_change_password,
              un.unit_number, un.floor_number, p.name AS property_name
       FROM tenant t 
       JOIN user_ u ON u.id = t.user_id 
       LEFT JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
       LEFT JOIN unit un ON un.id = l.unit_id
       LEFT JOIN property p ON p.id = un.property_id
       WHERE u.id = $1`,
      [req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Tenant not found" });
    res.json({ tenant: result.rows[0] });
  } catch (err) {
    console.error("Get tenant me:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /tenants - GET ALL TENANTS FOR A LANDLORD
app.get("/tenants", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordRes = await pool.query("SELECT id FROM landlord WHERE user_id=$1", [req.userId]);
    if (!landlordRes.rows.length) return res.status(404).json({ error: "Landlord not found" });
    const landlordId = landlordRes.rows[0].id;

    const result = await pool.query(
      `SELECT t.id, t.first_name, t.last_name, 
              t.profile_completed, t.reliability_score, t.reliability_score_count,
              t.special_note, t.has_pets, t.number_of_occupants, t.tenant_since,
              u.email, u.phone, u.email_verified, u.phone_verified, u.status AS user_status, u.last_login,
              l.id AS lease_id, l.lease_start_date, l.lease_end_date,
              l.rent_amount, l.deposit_amount, l.payment_frequency,
              l.payment_due_day, l.status AS lease_status,
              un.id AS unit_id, un.unit_number, un.floor_number,
              p.id AS property_id, p.name AS property_name,
              COALESCE(ph.on_time_payments,0) AS on_time_payments,
              COALESCE(ph.late_payments,0) AS late_payments,
              COALESCE(ph.missed_payments,0) AS missed_payments,
              COALESCE(
                (SELECT SUM(i.remaining_balance) FROM invoice i
                 WHERE i.tenant_id = t.id AND i.status IN ('overdue','sent')), 0
              ) AS outstanding_balance
       FROM tenant t
       JOIN user_ u ON u.id = t.user_id
       LEFT JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
       LEFT JOIN unit un ON un.id = l.unit_id
       LEFT JOIN property p ON p.id = un.property_id
       LEFT JOIN tenant_payment_history ph ON ph.tenant_id = t.id
       WHERE t.landlord_id = $1
       ORDER BY t.created_at DESC`,
      [landlordId]
    );
    res.json({ tenants: result.rows });
  } catch (err) {
    console.error("Get tenants:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /tenants/:id - GET A SPECIFIC TENANT'S INFO
app.get("/tenants/:id", requireAuth, requireLandlord, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.email, u.phone, u.status, u.last_login,
              l.id AS lease_id, l.lease_start_date, l.lease_end_date,
              l.rent_amount, l.deposit_amount, l.status AS lease_status,
              un.unit_number, p.name AS property_name
       FROM tenant t
       JOIN user_ u ON u.id = t.user_id
       LEFT JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
       LEFT JOIN unit un ON un.id = l.unit_id
       LEFT JOIN property p ON p.id = un.property_id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Tenant not found" });
    res.json({ tenant: result.rows[0] });
  } catch (err) {
    console.error("Get tenant:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /units/vacant - GET ALL VACANT UNITS FOR LANDLORD
app.get("/units/vacant", requireAuth, requireLandlord, async (req, res) => {
  try {
    
    const lr = await pool.query("SELECT id FROM landlord WHERE user_id=$1", [req.userId]);
    const landlordId = lr.rows[0]?.id;
    
    if (!landlordId) {
      return res.status(404).json({ error: "Landlord not found" });
    }

    const result = await pool.query(
      `SELECT u.*, p.name AS property_name 
       FROM unit u
       JOIN property p ON p.id = u.property_id
       WHERE p.landlord_id = $1 AND u.status = 'vacant'
       ORDER BY p.name, u.unit_number`,
      [landlordId]
    );
    
    res.json({ units: result.rows });
  } catch (err) {
    console.error("Get vacant units:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /maintenance - GET ALL MAINTENANCE REQUESTS FOR THE CURRENT USER 
app.get("/maintenance", requireAuth, async (req, res) => {
  try {
    let where, params;
    
    if (req.userRole === "landlord") {
      const lr = await pool.query("SELECT id FROM landlord WHERE user_id = $1", [req.userId]);
      if (!lr.rows.length) return res.status(404).json({ error: "Landlord not found" });
      where = "mr.landlord_id = $1"; 
      params = [lr.rows[0].id];
      
    } else if (req.userRole === "tenant") {
      const tr = await pool.query("SELECT id FROM tenant WHERE user_id = $1", [req.userId]);
      if (!tr.rows.length) return res.status(404).json({ error: "Tenant not found" });
      where = "mr.tenant_id = $1"; 
      params = [tr.rows[0].id];
      
    } else {
      return res.status(403).json({ error: "Use /caretaker/maintenance endpoint" });
    }
    
    const result = await pool.query(
      `SELECT mr.*, 
              t.first_name || ' ' || t.last_name AS tenant_name,
              u.unit_number, 
              p.name AS property_name,
              (SELECT json_agg(mu ORDER BY mu.created_at ASC) 
               FROM maintenance_update mu 
               WHERE mu.request_id = mr.id) AS updates
       FROM maintenance_request mr
       JOIN tenant t ON t.id = mr.tenant_id
       JOIN unit u ON u.id = mr.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE ${where} 
       ORDER BY mr.created_at DESC`,
      params
    );
    
    res.json({ requests: result.rows });
  } catch (err) {
    console.error("Get maintenance:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /units/available — TENANT GETS OCCUPIED UNITS IN THEIR PROPERTY 
app.get("/units/available", requireAuth, requireTenant, async (req, res) => {
  try {
    const tenant = await pool.query(
      "SELECT t.id, l.unit_id, u.property_id FROM tenant t JOIN lease l ON l.tenant_id = t.id AND l.status = 'active' JOIN unit u ON u.id = l.unit_id WHERE t.user_id = $1",
      [req.userId]
    );
    
    if (!tenant.rows.length) {
      return res.status(404).json({ error: "Active lease not found" });
    }
    
    const { unit_id, property_id } = tenant.rows[0];
    
    const result = await pool.query(
      `SELECT u.unit_number, u.unit_type, u.status,
              t.first_name || ' ' || t.last_name AS tenant_name
       FROM unit u
       LEFT JOIN tenant t ON t.id = u.current_tenant_id
       WHERE u.property_id = $1 
         AND u.status = 'occupied'
         AND u.id != $2
       ORDER BY u.unit_number`,
      [property_id, unit_id]
    );
    
    res.json({ units: result.rows });
  } catch (err) {
    console.error("Get available units:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /caretaker/maintenance - CARETAKER VIEWS ALL REQUESTS FOR THEIR ASSIGNED PROPERTY
app.get("/caretaker/maintenance", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const cr = await pool.query(
      "SELECT id, assigned_property FROM caretaker WHERE user_id = $1", 
      [req.userId]
    );
    
    if (!cr.rows.length) {
      return res.status(404).json({ error: "Caretaker profile not found" });
    }
    
    if (!cr.rows[0].assigned_property) {
      return res.json({ 
        requests: [],
        property: null,
        message: "No property assigned yet. Please contact your landlord."
      });
    }
    
    // GET PROPERTY INFO
    const property = await pool.query(
      "SELECT id, name, property_type, address_line1, city FROM property WHERE id = $1",
      [cr.rows[0].assigned_property]
    );
    
    // GET ALL REQUESTS FOR THIS PROPERTY
    const result = await pool.query(
      `SELECT mr.*, 
              t.first_name || ' ' || t.last_name AS tenant_name,
              u.unit_number, 
              p.name AS property_name,
              (SELECT json_agg(mu ORDER BY mu.created_at ASC) 
               FROM maintenance_update mu 
               WHERE mu.request_id = mr.id) AS updates
       FROM maintenance_request mr
       JOIN tenant t ON t.id = mr.tenant_id
       JOIN unit u ON u.id = mr.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE u.property_id = $1
       ORDER BY mr.created_at DESC`,
      [cr.rows[0].assigned_property]
    );
    
    res.json({ 
      requests: result.rows,
      property: property.rows[0] || null,
      caretaker_id: cr.rows[0].id
    });
    
  } catch (err) {
    console.error("Get caretaker maintenance:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /caretaker/maintenance/:id — CARETAKER VIEWS SINGLE REQUEST DETAIL
app.get("/caretaker/maintenance/:id", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const { id } = req.params;
    const cr = await pool.query(
      "SELECT id, assigned_property FROM caretaker WHERE user_id = $1", 
      [req.userId]
    );
    
    if (!cr.rows.length) {
      return res.status(404).json({ error: "Caretaker profile not found" });
    }
    
    const result = await pool.query(
      `SELECT mr.*, 
              t.first_name || ' ' || t.last_name AS tenant_name,        
              u.unit_number, 
              p.name AS property_name,
              p.address_line1 AS property_address,
              (SELECT json_agg(mu ORDER BY mu.created_at ASC) 
               FROM maintenance_update mu 
               WHERE mu.request_id = mr.id) AS updates,
              COALESCE(
                (SELECT json_agg(
                  json_build_object(
                    'id', mp.id, 
                    'photo_type', mp.photo_type, 
                    'document_url', d.document_url,
                    'uploaded_at', mp.uploaded_at
                  ) ORDER BY mp.uploaded_at)
                FROM maintenance_photo mp
                JOIN document_ d ON d.id = mp.document_id
                WHERE mp.request_id = mr.id),
                '[]'::json
              ) AS photos
       FROM maintenance_request mr
       JOIN tenant t ON t.id = mr.tenant_id
       JOIN unit u ON u.id = mr.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE mr.id = $1 AND u.property_id = $2`,
      [id, cr.rows[0].assigned_property]
    );
    
    if (!result.rows.length) {
      return res.status(404).json({ error: "Request not found or not in your property" });
    }
    
    res.json({ request: result.rows[0] });
    
  } catch (err) {
    console.error("Get caretaker maintenance detail:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /caretaker/maintenance/:id/assign — ASSIGN CONTRACTOR
app.put("/caretaker/maintenance/:id/assign", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const { id } = req.params;
    const { contractorName, contractorPhone, scheduledDate, estimatedCost, notes } = req.body;
    
    if (!contractorName) {
      return res.status(400).json({ error: "Contractor name is required" });
    }
    
    // VERIFY CARETAKER MANAGES THIS PROPERTY
    const cr = await pool.query(
      "SELECT id, assigned_property FROM caretaker WHERE user_id = $1", 
      [req.userId]
    );
    
    // CHECK IF REQUEST EXISTS AND BELONGS TO THIS PROPERTY
    const requestCheck = await pool.query(
      `SELECT mr.* FROM maintenance_request mr
       JOIN unit u ON u.id = mr.unit_id
       WHERE mr.id = $1 AND u.property_id = $2`,
      [id, cr.rows[0].assigned_property]
    );
    
    if (!requestCheck.rows.length) {
      return res.status(403).json({ error: "You can only manage requests in your assigned property" });
    }
    
    // UPDATE REQUEST WITH CONTRACTOR INFO AND CHANGE STATUS TO ASSIGNED
    const result = await pool.query(
      `UPDATE maintenance_request 
       SET contractor_name = $1,
           contractor_phone = $2,
           scheduled_date = $3,
           estimated_cost = $4,
           status = 'assigned',
           assigned_at = NOW(),
           assigned_to = $5,
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [contractorName, contractorPhone, scheduledDate, estimatedCost, req.userId, id]
    );
    
    // ADD STATUS UPDATE RECORD
    const updateNotes = notes 
      ? `Assigned to ${contractorName}. ${notes}`
      : `Assigned to ${contractorName}`;
      
    await pool.query(
      `INSERT INTO maintenance_update (request_id, updated_by, status_from, status_to, notes)
       VALUES ($1, $2, $3, 'assigned', $4)`,
      [id, req.userId, requestCheck.rows[0].status, updateNotes]
    );
    
    // NOTIFY TENANT
    await createNotification(
      requestCheck.rows[0].reported_by,
      "maintenance_update",
      "Contractor Assigned",
      `${contractorName} has been assigned to your request "${requestCheck.rows[0].title}"`,
      id,
      "maintenance"
    );
    
    res.json({ 
      message: "Contractor assigned successfully",
      request: result.rows[0]
    });
    
  } catch (err) {
    console.error("Assign contractor:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /caretaker/maintenance/:id/status — UPDATE REQUEST STATUS
app.put("/caretaker/maintenance/:id/status", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, actualCost } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: "New status is required" });
    }
    
    const cr = await pool.query(
      "SELECT id, assigned_property FROM caretaker WHERE user_id = $1", 
      [req.userId]
    );
    
    if (!cr.rows.length) {
      return res.status(404).json({ error: "Caretaker not found" });
    }
    
    const requestCheck = await pool.query(
      `SELECT mr.* FROM maintenance_request mr
       JOIN unit u ON u.id = mr.unit_id
       WHERE mr.id = $1 AND u.property_id = $2`,
      [id, cr.rows[0].assigned_property]
    );
    
    if (!requestCheck.rows.length) {
      return res.status(403).json({ error: "You can only manage requests in your assigned property" });
    }
    
    const currentRequest = requestCheck.rows[0];
    
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    updates.push(`status = $${paramIndex}::maintenance_status`);
    values.push(status);
    paramIndex++;
    
    updates.push(`updated_at = NOW()`);
    
    // HANDLE COMPLETED STATUS 
    if (status === 'completed') {
      updates.push(`completed_at = NOW()`);
      
      if (actualCost != null && actualCost !== '') {
        updates.push(`actual_cost = $${paramIndex}::decimal`);
        values.push(Number(actualCost));
        paramIndex++;
      }
      
      if (notes && notes.trim()) {
        updates.push(`completion_notes = $${paramIndex}::text`);
        values.push(notes.trim());
        paramIndex++;
      }
    }
  
    values.push(id);
    
    const query = `
      UPDATE maintenance_request 
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *`;
    
    console.log("Update query:", query);
    console.log("Update values:", values);
    
    const result = await pool.query(query, values);
    
    await pool.query(
      `INSERT INTO maintenance_update (request_id, updated_by, status_from, status_to, notes)
       VALUES ($1, $2, $3::maintenance_status, $4::maintenance_status, $5::text)`,
      [
        id, 
        req.userId, 
        currentRequest.status, 
        status, 
        notes && notes.trim() ? notes.trim() : null
      ]
    );
    
    // NOTIFY TENANT OF STATUS CHANGE
    const statusLabel = status.replace(/_/g, ' ');
    await createNotification(
      currentRequest.reported_by,
      "maintenance_update",
      "Status Updated",
      `Your request "${currentRequest.title}" is now ${statusLabel}`,
      id,
      "maintenance"
    );
    
    res.json({ 
      message: "Status updated successfully",
      request: result.rows[0]
    });
    
  } catch (err) {
    console.error("Update status:", err);
    res.status(500).json({ 
      error: "Server error",
      details: err.message 
    });
  }
});

// PUT /caretaker/maintenance/:id/escalate — ESCALATE TO LANDLORD
app.put("/caretaker/maintenance/:id/escalate", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const { id } = req.params;
    const { estimatedCost, reason } = req.body;
    
    if (!estimatedCost || !reason) {
      return res.status(400).json({ error: "Estimated cost and reason are required" });
    }
    
    const cr = await pool.query(
      "SELECT id, assigned_property FROM caretaker WHERE user_id = $1", 
      [req.userId]
    );
    
    const requestCheck = await pool.query(
      `SELECT mr.*, p.landlord_id FROM maintenance_request mr
       JOIN unit u ON u.id = mr.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE mr.id = $1 AND u.property_id = $2`,
      [id, cr.rows[0].assigned_property]
    );
    
    if (!requestCheck.rows.length) {
      return res.status(403).json({ error: "You can only manage requests in your assigned property" });
    }
    
    const currentRequest = requestCheck.rows[0];
    
    const result = await pool.query(
      `UPDATE maintenance_request 
       SET status = 'pending_approval',
           estimated_cost = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [estimatedCost, id]
    );
    
    // Add STATUS UPDATE RECORD
    await pool.query(
      `INSERT INTO maintenance_update (request_id, updated_by, status_from, status_to, notes)
       VALUES ($1, $2, $3, 'pending_approval', $4)`,
      [id, req.userId, currentRequest.status, `Escalated: ${reason}`]
    );
    
    // NOTIFY LANDLORD
    const landlordUser = await pool.query(
      "SELECT user_id FROM landlord WHERE id = $1",
      [currentRequest.landlord_id]
    );
    
    if (landlordUser.rows.length) {
      await createNotification(
        landlordUser.rows[0].user_id,
        "maintenance_update",
        "Request Escalated - Approval Needed",
        `Request "${currentRequest.title}" needs approval. Estimated cost: R${estimatedCost}`,
        id,
        "maintenance"
      );
    }
    
    res.json({ 
      message: "Request escalated to landlord for approval",
      request: result.rows[0]
    });
    
  } catch (err) {
    console.error("Escalate request:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /maintenance — TENANT SUBMITS NEW MAINTENANCE REQUEST 
app.post("/maintenance", requireAuth, requireTenant, async (req, res) => {
  const { title, description, category, priority, photos } = req.body;
  
  // VALIDATE REQUIRED FIELDS
  if (!title || !description || !category) {
    return res.status(400).json({ 
      error: "Title, description, and category are required" 
    });
  }
  
  // VALIDATE CATEGORY
  const validCategories = ['plumbing', 'electrical', 'structural', 'appliance', 'hvac', 'painting', 'cleaning', 'pest_control', 'other'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ 
      error: "Invalid category",
      validCategories 
    });
  }
  
  // VALIDATE PRIORITY IF PROVIDED
  const validPriorities = ['low', 'medium', 'high', 'urgent', 'emergency'];
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({ 
      error: "Invalid priority",
      validPriorities 
    });
  }
  
  try {
    // GET TENANT, LANDLORD, UNIT, AND LEASE INFO
    const tr = await pool.query(
      `SELECT t.id, t.landlord_id, l.unit_id, l.id AS lease_id
       FROM tenant t
       JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
       WHERE t.user_id = $1
       ORDER BY l.lease_start_date DESC
       LIMIT 1`,
      [req.userId]
    );
    
    if (!tr.rows.length) {
      return res.status(404).json({ error: "No active lease found. Please contact your landlord." });
    }
    
    const { id: tenantId, landlord_id, unit_id, lease_id } = tr.rows[0];

    // GENERATE UNIQUE REQUEST NUMBER
    const count = await pool.query("SELECT COUNT(*) FROM maintenance_request");
    const requestNumber = `MR-${String(Number(count.rows[0].count) + 1).padStart(5, "0")}`;

    // INSERT NEW MAINTENANCE REQUEST
    const result = await pool.query(
      `INSERT INTO maintenance_request (
        tenant_id, landlord_id, unit_id, reported_by, request_number,
        title, description, category, priority, status, 
        created_at, updated_at
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'needs_repair', NOW(), NOW()) 
       RETURNING *`,
      [
        tenantId, 
        landlord_id, 
        unit_id, 
        req.userId, 
        requestNumber, 
        title, 
        description, 
        category, 
        priority || "medium"
      ]
    );

    const requestId = result.rows[0].id;

    // HANDLE PHOTO UPLOADS IF PROVIDED
    if (photos && Array.isArray(photos) && photos.length > 0) {
      for (const photo of photos) {
        if (!photo.document_url) {
          console.warn("Photo missing document_url, skipping...");
          continue;
        }
        
        // CREATE DOCUMENT RECORD
        const docResult = await pool.query(
          `INSERT INTO document_ (
            tenant_id, uploaded_by, document_type, 
            document_name, document_url, file_size, mime_type
          )
           VALUES ($1, $2, 'maintenance_photo', $3, $4, $5, $6)
           RETURNING id`,
          [
            tenantId,
            req.userId,
            photo.document_name || `Maintenance photo - ${requestNumber}`,
            photo.document_url,
            photo.file_size || 0,
            photo.mime_type || 'image/jpeg'
          ]
        );
        
        // CREATE MAINTENANCE_PHOTO RECORD LINKING TO THE REQUEST
        await pool.query(
          `INSERT INTO maintenance_photo (
            request_id, document_id, photo_type, uploaded_by
          )
           VALUES ($1, $2, $3, $4)`,
          [
            requestId,
            docResult.rows[0].id,
            photo.photo_type || 'before',
            req.userId
          ]
        );
      }
    }

    // ADD INITIAL STATUS UPDATE RECORD
    await pool.query(
      `INSERT INTO maintenance_update (
        request_id, updated_by, status_from, status_to, notes
      )
       VALUES ($1, $2, NULL, 'needs_repair', 'Request submitted by tenant')`,
      [requestId, req.userId]
    );

    // GET UNIT AND PROPERTY INFO FOR NOTIFICATIONS
    const unitInfo = await pool.query(
      `SELECT u.unit_number, p.name AS property_name, p.id AS property_id
       FROM unit u
       JOIN property p ON p.id = u.property_id
       WHERE u.id = $1`,
      [unit_id]
    );
    
    const unitNumber = unitInfo.rows[0]?.unit_number || 'Unknown';
    const propertyName = unitInfo.rows[0]?.property_name || 'Unknown';
    const propertyId = unitInfo.rows[0]?.property_id;

    // NOTIFY CARETAKER OR LANDLORD
    if (propertyId) {
      const caretaker = await pool.query(
        `SELECT u.id, u.email, c.first_name, c.last_name
         FROM user_ u 
         JOIN caretaker c ON c.user_id = u.id
         WHERE c.assigned_property = $1`,
        [propertyId]
      );

      if (caretaker.rows.length) {
        await createNotification(
          caretaker.rows[0].id,
          "maintenance_update",
          "New Maintenance Request",
          `New ${priority || 'medium'} priority request: "${title}" (${category}) - Unit ${unitNumber}, ${propertyName}`,
          requestId,
          "maintenance"
        );
      } else {
      
        const landlordUser = await pool.query(
          "SELECT user_id FROM landlord WHERE id = $1",
          [landlord_id]
        );
        
        if (landlordUser.rows.length) {
          await createNotification(
            landlordUser.rows[0].user_id,
            "maintenance_update",
            "New Maintenance Request (No Caretaker)",
            `New request: "${title}" (${category}) - No caretaker assigned to ${propertyName}`,
            requestId,
            "maintenance"
          );
        }
      }
    }

    // NOTIFY TENANT OF SUCCESSFUL SUBMISSION
    await createNotification(
      req.userId, 
      "maintenance_update", 
      "Request Submitted",
      `Your maintenance request "${title}" (${requestNumber}) has been submitted. We will review it shortly.`,
      requestId, 
      "maintenance"
    );

    // RETURN CREATED REQUEST WITH ADDITIONAL INFO
    res.status(201).json({ 
      message: "Maintenance request submitted successfully",
      request: {
        ...result.rows[0],
        request_number: requestNumber,
        unit_number: unitNumber,
        property_name: propertyName,
        photos_count: photos ? photos.length : 0
      }
    });
    
  } catch (err) {
    console.error("Submit maintenance:", err);
    res.status(500).json({ 
      error: "Server error",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// FILE UPLOADS

// SERVE UPLOADED FILES STATICALLY
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// POST /upload/maintenance-photo-base64 - UPLOAD MAINTENANCE PHOTO AS BASE64 STRING
app.post("/upload/maintenance-photo-base64", requireAuth, async (req, res) => {
  console.log(" Photo upload request received");
  
  try {
    const { image, fileName, mimeType, fileSize } = req.body;
    
    console.log("Upload request body keys:", Object.keys(req.body));
    console.log("Has image:", !!image);
    
    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // EXTRACT BASE64 DATA AND MIME TYPE
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ 
        error: "Invalid image format. Expected data URL like data:image/jpeg;base64,XXX..." 
      });
    }

    const imageType = matches[1];
    const imageData = matches[2];
    
    // CONVERT BASE64 TO BUFFER
    let buffer;
    try {
      buffer = Buffer.from(imageData, 'base64');
    } catch (bufErr) {
      return res.status(400).json({ error: "Invalid base64 data" });
    }
    
    console.log(`Image decoded: ${(buffer.length / 1024).toFixed(1)}KB, type: ${imageType}`);
    
    // VALIDATE SIZE
    const maxSize = 10 * 1024 * 1024;
    if (buffer.length > maxSize) {
      return res.status(400).json({ 
        error: `File too large. Maximum 10MB, got ${(buffer.length / (1024 * 1024)).toFixed(1)}MB` 
      });
    }
    
    // GENARATE UNIQUE FILENAME
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = imageType.includes('png') ? '.png' : 
                imageType.includes('webp') ? '.webp' : 
                imageType.includes('heic') ? '.heic' : '.jpg';
    const filename = `maintenance-${uniqueSuffix}${ext}`;
    
    // CREATE UPLOAD DIRECTORY IF IT DOESN'T EXIST
    const uploadDir = path.join(__dirname, 'uploads', 'maintenance');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log("Created upload directory:", uploadDir);
    }
    
    // SAVE FILE TO DISK
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);
    
    // CREATE DOCUMENT RECORD IN DATABASE
    let documentId = null;
    try {
      const tenant = await pool.query(
        "SELECT id FROM tenant WHERE user_id = $1", 
        [req.userId]
      );
      
      if (tenant.rows.length) {
        const docResult = await pool.query(
          `INSERT INTO document_ (
            tenant_id, uploaded_by, document_type,
            document_name, document_url, file_size, mime_type
          ) VALUES ($1, $2, 'maintenance_photo', $3, $4, $5, $6) 
          RETURNING id`,
          [
            tenant.rows[0].id,
            req.userId,
            fileName || `Maintenance photo`,
            `/uploads/maintenance/${filename}`,
            buffer.length,
            imageType
          ]
        );
        documentId = docResult.rows[0].id;
      }
    } catch (dbErr) {
      console.warn("Could not create document record:", dbErr.message);
    }

    return res.json({
      success: true,
      message: "Photo uploaded successfully",
      document_url: `/uploads/maintenance/${filename}`,
      document_name: fileName || 'Maintenance photo',
      file_size: buffer.length,
      mime_type: imageType,
      document_id: documentId
    });
    
  } catch (err) {
    return res.status(500).json({ 
      error: "Upload failed", 
      details: err.message 
    });
  }
});

// GET /uploads/maintenance/:filename - SERVE UPLOADED MAINTENANCE PHOTOS
app.get("/uploads/maintenance/:filename", (req, res) => {
  const filePath = path.join(__dirname, 'uploads', 'maintenance', req.params.filename);
  
  if (fs.existsSync(filePath)) {
    console.log(`Serving file: ${filePath}`);   
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: "Image not found" });
  }
});

// POST /upload — GENERIC FILE UPLOAD FOR COMPLAINT EVIDENCE
app.post("/upload", requireAuth, async (req, res) => {
  console.log(" Upload request received");
  
  try {
    const { image, fileName, mimeType, fileSize, uploadType } = req.body;
    
    console.log("Upload type:", uploadType || "maintenance");
    
    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Invalid image format" });
    }

    const imageType = matches[1];
    const imageData = matches[2];
    
    let buffer;
    try {
      buffer = Buffer.from(imageData, 'base64');
    } catch (bufErr) {
      return res.status(400).json({ error: "Invalid base64 data" });
    }
    
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: "File too large. Maximum 10MB." });
    }
    
    const type = uploadType || 'maintenance';
    const folderName = type === 'complaint' ? 'complaints' : 'maintenance';
    const documentType = type === 'complaint' ? 'complaint_evidence' : 'maintenance_photo';
    
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = imageType.includes('png') ? '.png' : '.jpg';
    const filename = `${folderName}-${uniqueSuffix}${ext}`;
    
    const uploadDir = path.join(__dirname, 'uploads', folderName);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);
    
    let documentId = null;
    try {
      let tenantId = null;
      if (req.userRole === 'tenant') {
        const tenant = await pool.query("SELECT id FROM tenant WHERE user_id = $1", [req.userId]);
        if (tenant.rows.length) tenantId = tenant.rows[0].id;
      }
      
      const docResult = await pool.query(
        `INSERT INTO document_ (tenant_id, uploaded_by, document_type, document_name, document_url, file_size, mime_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [tenantId, req.userId, documentType, fileName || `${type} photo`, `/uploads/${folderName}/${filename}`, buffer.length, imageType]
      );
      documentId = docResult.rows[0].id;
    } catch (dbErr) {
      console.warn("Could not create document record:", dbErr.message);
    }
    
    console.log(` Saved: ${filename}`);
    
    return res.json({
      success: true,
      document_url: `/uploads/${folderName}/${filename}`,
      document_name: fileName || `${type} photo`,
      file_size: buffer.length,
      mime_type: imageType,
      document_id: documentId
    });
    
  } catch (err) {
    console.error(" Upload error:", err);
    return res.status(500).json({ error: "Upload failed" });
  }
});

// PUT /maintenance/:id/confirm — TENANT CONFIRMS COMPLETION
app.put("/maintenance/:id/confirm", requireAuth, requireTenant, async (req, res) => {
  try {
    const { id } = req.params;
    const { photos } = req.body;
    const { userId } = req;
    
    const tenant = await pool.query("SELECT id FROM tenant WHERE user_id = $1", [userId]);
    if (!tenant.rows.length) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    
    const requestCheck = await pool.query(
      "SELECT * FROM maintenance_request WHERE id = $1 AND tenant_id = $2 AND status = 'completed'",
      [id, tenant.rows[0].id]
    );
    
    if (!requestCheck.rows.length) {
      return res.status(404).json({ error: "Request not found or not completed yet" });
    }
    
    await pool.query(
      `UPDATE maintenance_request 
       SET status = 'cancelled'::maintenance_status, updated_at = NOW() 
       WHERE id = $1`,
      [id]
    );
    
    // ADD STATUS UPDATE RECORD
    await pool.query(
      `INSERT INTO maintenance_update (request_id, updated_by, status_from, status_to, notes)
       VALUES ($1, $2, 'completed'::maintenance_status, 'cancelled'::maintenance_status, 'Tenant confirmed completion - request closed')`,
      [id, userId]
    );
    
    // HANDLE POST-COMPLETION PHOTO UPLOADS IF PROVIDED
    if (photos && Array.isArray(photos) && photos.length > 0) {
      for (const photo of photos) {
        if (!photo.document_url) continue;
        
        const docResult = await pool.query(
          `INSERT INTO document_ (tenant_id, uploaded_by, document_type, document_name, document_url, file_size, mime_type)
           VALUES ($1, $2, 'maintenance_photo', $3, $4, $5, $6) RETURNING id`,
          [tenant.rows[0].id, userId, `After photo - ${id}`, photo.document_url, photo.file_size || 0, photo.mime_type || 'image/jpeg']
        );
        
        await pool.query(
          `INSERT INTO maintenance_photo (request_id, document_id, photo_type, uploaded_by)
           VALUES ($1, $2, 'after', $3)`,
          [id, docResult.rows[0].id, userId]
        );
      }
    }
    
    res.json({ message: "Completion confirmed. Request closed." });
    
  } catch (err) {
    console.error("Confirm completion:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /maintenance/:id/reopen — TENANT REOPENS CLOSED OR COMPLETED REQUEST
app.put("/maintenance/:id/reopen", requireAuth, requireTenant, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { userId } = req;
    
    const tenant = await pool.query("SELECT id FROM tenant WHERE user_id = $1", [userId]);
    if (!tenant.rows.length) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    
    const requestCheck = await pool.query(
      `SELECT mr.*, u.property_id, p.landlord_id 
       FROM maintenance_request mr
       JOIN unit u ON u.id = mr.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE mr.id = $1 AND mr.tenant_id = $2 AND mr.status IN ('completed', 'cancelled')`,
      [id, tenant.rows[0].id]
    );
    
    if (!requestCheck.rows.length) {
      return res.status(404).json({ 
        error: "Request not found or cannot be reopened" 
      });
    }
    
    const currentRequest = requestCheck.rows[0];
    
    await pool.query(
      `UPDATE maintenance_request 
       SET status = 'needs_repair'::maintenance_status, 
           completed_at = NULL,
           contractor_name = NULL,
           contractor_phone = NULL,
           scheduled_date = NULL,
           actual_cost = NULL,
           completion_notes = NULL,
           updated_at = NOW() 
       WHERE id = $1`,
      [id]
    );
    
    await pool.query(
      `INSERT INTO maintenance_update (request_id, updated_by, status_from, status_to, notes)
       VALUES ($1, $2, $3::maintenance_status, 'needs_repair'::maintenance_status, $4::text)`,
      [id, userId, currentRequest.status, reason || "Tenant reopened — issue not resolved"]
    );
    
    const caretaker = await pool.query(
      `SELECT u.id FROM user_ u 
       JOIN caretaker c ON c.user_id = u.id 
       WHERE c.assigned_property = $1`,
      [currentRequest.property_id]
    );
    
    if (caretaker.rows.length) {
      await createNotification(
        caretaker.rows[0].id,
        "maintenance_update",
        "Request Reopened",
        `Tenant reopened: "${currentRequest.title}" — needs attention`,
        id,
        "maintenance"
      );
    }
    
    const landlordUser = await pool.query(
      "SELECT user_id FROM landlord WHERE id = $1",
      [currentRequest.landlord_id]
    );
    
    if (landlordUser.rows.length) {
      await createNotification(
        landlordUser.rows[0].user_id,
        "maintenance_update",
        "Request Reopened by Tenant",
        `"${currentRequest.title}" has been reopened — tenant says issue persists`,
        id,
        "maintenance"
      );
    }
    
    res.json({ 
      message: "Request reopened successfully",
      newStatus: "needs_repair"
    });
    
  } catch (err) {
    console.error("Reopen request:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /maintenance/:id — GET SINGLE MAINTENANCE REQUEST DETAIL
app.get("/maintenance/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT mr.*, 
              t.first_name || ' ' || t.last_name AS tenant_name,
              u.unit_number, 
              p.name AS property_name,
              (SELECT json_agg(mu ORDER BY mu.created_at ASC) 
               FROM maintenance_update mu 
               WHERE mu.request_id = mr.id) AS updates,
              COALESCE(
                (SELECT json_agg(
                  json_build_object(
                    'id', mp.id, 
                    'photo_type', mp.photo_type, 
                    'document_url', d.document_url,
                    'uploaded_at', mp.uploaded_at
                  ) ORDER BY mp.uploaded_at)
                FROM maintenance_photo mp
                JOIN document_ d ON d.id = mp.document_id
                WHERE mp.request_id = mr.id),
                '[]'::json
              ) AS photos
       FROM maintenance_request mr
       JOIN tenant t ON t.id = mr.tenant_id
       JOIN unit u ON u.id = mr.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE mr.id = $1`,
      [id]
    );
    
    if (!result.rows.length) {
      return res.status(404).json({ error: "Request not found" });
    }
    
    res.json({ request: result.rows[0] });
    
  } catch (err) {
    console.error("Get maintenance detail:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /maintenance/:id — GET SINGLE MAINTENANCE REQUEST FOR ALL ROLES
app.get("/maintenance/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT mr.*, 
              t.first_name || ' ' || t.last_name AS tenant_name,
              u.unit_number, 
              p.name AS property_name,
              (SELECT json_agg(mu ORDER BY mu.created_at ASC) 
               FROM maintenance_update mu 
               WHERE mu.request_id = mr.id) AS updates,
              COALESCE(
                (SELECT json_agg(
                  json_build_object(
                    'id', mp.id, 
                    'photo_type', mp.photo_type, 
                    'document_url', d.document_url,
                    'uploaded_at', mp.uploaded_at
                  ) ORDER BY mp.uploaded_at)
                FROM maintenance_photo mp
                JOIN document_ d ON d.id = mp.document_id
                WHERE mp.request_id = mr.id),
                '[]'::json
              ) AS photos
       FROM maintenance_request mr
       JOIN tenant t ON t.id = mr.tenant_id
       JOIN unit u ON u.id = mr.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE mr.id = $1`,
      [id]
    );
    
    if (!result.rows.length) {
      return res.status(404).json({ error: "Request not found" });
    }
    
    res.json({ request: result.rows[0] });
    
  } catch (err) {
    console.error("Get maintenance detail:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PROPERTY ROUTES

// GET /properties — LANDLORD VIEWS ALL PROPERTIES
app.get("/properties", requireAuth, async (req, res) => {
  try {
    if (req.userRole !== "landlord") {
      return res.status(403).json({ error: "Only landlords can access properties" });
    }
    
    const landlord = await pool.query("SELECT id FROM landlord WHERE user_id = $1", [req.userId]);
    if (!landlord.rows.length) {
      return res.status(404).json({ error: "Landlord not found" });
    }
    
    const result = await pool.query(
      `SELECT p.*, 
              c.first_name || ' ' || c.last_name AS caretaker_name,
              COALESCE(
                (SELECT json_agg(
                  json_build_object(
                    'id', u.id,
                    'unit_number', u.unit_number,
                    'unit_type', u.unit_type,
                    'floor_number', u.floor_number,
                    'bedrooms', u.bedrooms,
                    'bathrooms', u.bathrooms,
                    'square_meters', u.square_meters,
                    'monthly_rent', u.monthly_rent,
                    'deposit_amount', u.deposit_amount,
                    'status', u.status,
                    'furnished', u.furnished,
                    'parking_bay', u.parking_bay,
                    'has_balcony', u.has_balcony,
                    'tenant_name', t.first_name || ' ' || t.last_name
                  ) ORDER BY u.unit_number)
                FROM unit u
                LEFT JOIN tenant t ON t.id = u.current_tenant_id
                WHERE u.property_id = p.id),
                '[]'::json
              ) AS units
       FROM property p
       LEFT JOIN caretaker c ON c.id = p.caretaker_id
       WHERE p.landlord_id = $1
       ORDER BY p.name ASC`,
      [landlord.rows[0].id]
    );
    
    res.json({ properties: result.rows });
  } catch (err) {
    console.error("Get properties:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /properties/:id — LANDLORD VIEWS SINGLE PROPERTY
app.get("/properties/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT p.*, 
              c.first_name || ' ' || c.last_name AS caretaker_name,
              COALESCE(
                (SELECT json_agg(
                  json_build_object(
                    'id', u.id,
                    'unit_number', u.unit_number,
                    'unit_type', u.unit_type,
                    'floor_number', u.floor_number,
                    'bedrooms', u.bedrooms,
                    'bathrooms', u.bathrooms,
                    'square_meters', u.square_meters,
                    'monthly_rent', u.monthly_rent,
                    'deposit_amount', u.deposit_amount,
                    'status', u.status,
                    'furnished', u.furnished,
                    'parking_bay', u.parking_bay,
                    'has_balcony', u.has_balcony,
                    'tenant_name', t.first_name || ' ' || t.last_name
                  ) ORDER BY u.unit_number)
                FROM unit u
                LEFT JOIN tenant t ON t.id = u.current_tenant_id
                WHERE u.property_id = p.id),
                '[]'::json
              ) AS units
       FROM property p
       LEFT JOIN caretaker c ON c.id = p.caretaker_id
       WHERE p.id = $1`,
      [id]
    );
    
    if (!result.rows.length) {
      return res.status(404).json({ error: "Property not found" });
    }
    
    res.json({ property: result.rows[0] });
  } catch (err) {
    console.error("Get property:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /properties — LANDLORD CREATES PROPERTY
app.post("/properties", requireAuth, async (req, res) => {
  try {
    if (req.userRole !== "landlord") {
      return res.status(403).json({ error: "Only landlords can create properties" });
    }
    
    const landlord = await pool.query("SELECT id FROM landlord WHERE user_id = $1", [req.userId]);
    if (!landlord.rows.length) {
      return res.status(404).json({ error: "Landlord not found" });
    }
    
    const {
      name, property_type, address_line1, address_line2, city, province,
      postal_code, country, total_floors, total_units,
      has_elevator, has_parking, has_security, has_pool, pet_friendly
    } = req.body;
    
    if (!name || !address_line1 || !city) {
      return res.status(400).json({ error: "Name, address, and city are required" });
    }
    
    const result = await pool.query(
      `INSERT INTO property (
        landlord_id, name, property_type, address_line1, address_line2,
        city, province, postal_code, country, total_floors, total_units,
        has_elevator, has_parking, has_security, has_pool, pet_friendly
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *`,
      [
        landlord.rows[0].id, name, property_type || "residential",
        address_line1, address_line2 || null, city, province || null,
        postal_code ? parseInt(postal_code) : null, country || "South Africa",
        total_floors ? parseInt(total_floors) : null,
        total_units ? parseInt(total_units) : null,
        has_elevator || false, has_parking || false,
        has_security || false, has_pool || false, pet_friendly || false
      ]
    );
    
    res.status(201).json({ message: "Property created", property: result.rows[0] });
  } catch (err) {
    console.error("Create property:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /properties/:id — LANDLORD UPDATES PROPERTY
app.put("/properties/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const {
      name, property_type, address_line1, address_line2, city, province,
      postal_code, country, total_floors, total_units,
      has_elevator, has_parking, has_security, has_pool, pet_friendly
    } = req.body;
    
    const result = await pool.query(
      `UPDATE property SET
        name = $1, property_type = $2, address_line1 = $3, address_line2 = $4,
        city = $5, province = $6, postal_code = $7, country = $8,
        total_floors = $9, total_units = $10,
        has_elevator = $11, has_parking = $12, has_security = $13,
        has_pool = $14, pet_friendly = $15, updated_at = NOW()
       WHERE id = $16 RETURNING *`,
      [
        name, property_type, address_line1, address_line2 || null,
        city, province || null, postal_code ? parseInt(postal_code) : null,
        country || "South Africa",
        total_floors ? parseInt(total_floors) : null,
        total_units ? parseInt(total_units) : null,
        has_elevator || false, has_parking || false,
        has_security || false, has_pool || false, pet_friendly || false,
        id
      ]
    );
    
    if (!result.rows.length) {
      return res.status(404).json({ error: "Property not found" });
    }
    
    res.json({ message: "Property updated", property: result.rows[0] });
  } catch (err) {
    console.error("Update property:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /properties/:id — LANDLORD DELETES PROPERTY
app.delete("/properties/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const units = await pool.query("SELECT COUNT(*) FROM unit WHERE property_id = $1", [id]);
    if (parseInt(units.rows[0].count) > 0) {
      return res.status(400).json({ error: "Cannot delete property with assigned units. Remove units first." });
    }
    
    const result = await pool.query("DELETE FROM property WHERE id = $1 RETURNING id", [id]);
    
    if (!result.rows.length) {
      return res.status(404).json({ error: "Property not found" });
    }
    
    res.json({ message: "Property deleted" });
  } catch (err) {
    console.error("Delete property:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// UNIT ROUTES

// POST /properties/:propertyId/units — ADD UNIT TO PROPERTY
app.post("/properties/:propertyId/units", requireAuth, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const {
      unit_number, unit_type, floor_number, bedrooms, bathrooms,
      square_meters, monthly_rent, deposit_amount, status,
      furnished, parking_bay, has_balcony
    } = req.body;
    
    if (!unit_number || !monthly_rent) {
      return res.status(400).json({ error: "Unit number and monthly rent are required" });
    }
    
    const property = await pool.query("SELECT id FROM property WHERE id = $1", [propertyId]);
    if (!property.rows.length) {
      return res.status(404).json({ error: "Property not found" });
    }
    
    const result = await pool.query(
      `INSERT INTO unit (
        property_id, unit_number, unit_type, floor_number, bedrooms, bathrooms,
        square_meters, monthly_rent, deposit_amount, status,
        furnished, parking_bay, has_balcony
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *`,
      [
        propertyId,
        parseInt(unit_number),
        unit_type || "1_bedroom",
        floor_number ? parseInt(floor_number) : null,
        bedrooms ? parseInt(bedrooms) : null,
        bathrooms ? parseInt(bathrooms) : null,
        square_meters ? parseFloat(square_meters) : null,
        parseFloat(monthly_rent),
        deposit_amount ? parseFloat(deposit_amount) : null,
        status || "vacant",
        furnished || false,
        parking_bay || false,
        has_balcony || false
      ]
    );
    
    res.status(201).json({ message: "Unit created", unit: result.rows[0] });
  } catch (err) {
    console.error("Create unit:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /units/:id — UPDATE UNIT
app.put("/units/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      unit_number, unit_type, floor_number, bedrooms, bathrooms,
      square_meters, monthly_rent, deposit_amount, status,
      furnished, parking_bay, has_balcony
    } = req.body;
    
    const result = await pool.query(
      `UPDATE unit SET
        unit_number = $1, unit_type = $2, floor_number = $3,
        bedrooms = $4, bathrooms = $5, square_meters = $6,
        monthly_rent = $7, deposit_amount = $8, status = $9,
        furnished = $10, parking_bay = $11, has_balcony = $12,
        updated_at = NOW()
       WHERE id = $13 RETURNING *`,
      [
        parseInt(unit_number),
        unit_type,
        floor_number ? parseInt(floor_number) : null,
        bedrooms ? parseInt(bedrooms) : null,
        bathrooms ? parseInt(bathrooms) : null,
        square_meters ? parseFloat(square_meters) : null,
        parseFloat(monthly_rent),
        deposit_amount ? parseFloat(deposit_amount) : null,
        status || "vacant",
        furnished || false,
        parking_bay || false,
        has_balcony || false,
        id
      ]
    );
    
    if (!result.rows.length) {
      return res.status(404).json({ error: "Unit not found" });
    }
    
    res.json({ message: "Unit updated", unit: result.rows[0] });
  } catch (err) {
    console.error("Update unit:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /units/:id — DELETE UNIT
app.delete("/units/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const leaseCheck = await pool.query(
      "SELECT COUNT(*) FROM lease WHERE unit_id = $1 AND status = 'active'",
      [id]
    );
    if (parseInt(leaseCheck.rows[0].count) > 0) {
      return res.status(400).json({ error: "Cannot delete unit with active lease" });
    }
    
    const result = await pool.query("DELETE FROM unit WHERE id = $1 RETURNING id", [id]);
    
    if (!result.rows.length) {
      return res.status(404).json({ error: "Unit not found" });
    }
    
    res.json({ message: "Unit deleted" });
  } catch (err) {
    console.error("Delete unit:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// COMPLAINT ROUTES
// POST /complaints — TENANT SUBMITS NEW COMPLAINT WITH EVIDENCE
app.post("/complaints", requireAuth, requireTenant, async (req, res) => {
  try {
    const { 
      subject, 
      description, 
      category, 
      complaint_scope,        
      against_unit_number,    
      common_area_location,
      evidence,              
    } = req.body;
    
    if (!subject || !description || !category) {
      return res.status(400).json({ error: "Subject, description, and category are required" });
    }
    
    if (!complaint_scope) {
      return res.status(400).json({ error: "Complaint scope is required" });
    }
    
    if (complaint_scope === 'specific_tenant' && !against_unit_number) {
      return res.status(400).json({ error: "Unit number is required for tenant-specific complaints" });
    }
    
    if (complaint_scope === 'common_area' && !common_area_location) {
      return res.status(400).json({ error: "Common area location is required" });
    }
    
    const tenant = await pool.query(
      "SELECT t.id, t.landlord_id, l.unit_id, u.property_id FROM tenant t JOIN lease l ON l.tenant_id = t.id AND l.status = 'active' JOIN unit u ON u.id = l.unit_id WHERE t.user_id = $1",
      [req.userId]
    );
    
    if (!tenant.rows.length) {
      return res.status(404).json({ error: "Active lease not found" });
    }
    
    const { id: tenantId, landlord_id, unit_id, property_id } = tenant.rows[0];
    
    let againstTenantId = null;
    let againstUnitId = null;
    
    if (complaint_scope === 'specific_tenant' && against_unit_number) {
      const unitResult = await pool.query(
        "SELECT id, current_tenant_id FROM unit WHERE unit_number = $1 AND property_id = $2",
        [parseInt(against_unit_number), property_id]
      );
      
      if (unitResult.rows.length) {
        againstUnitId = unitResult.rows[0].id;
        againstTenantId = unitResult.rows[0].current_tenant_id;
      }
    }
    
    
    const result = await pool.query(
      `INSERT INTO complaint (
        property_id, filed_by, filed_by_tenant_id, 
        against_tenant_id, against_unit_id, 
        subject, description, category, status,
        complaint_scope, common_area_location
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open', $9, $10) 
      RETURNING *`,
      [
        property_id, req.userId, tenantId, 
        againstTenantId, againstUnitId,
        subject, description, category,
        complaint_scope, common_area_location || null
      ]
    );
    
    const complaintId = result.rows[0].id;
    
  
    if (evidence && Array.isArray(evidence) && evidence.length > 0) {
      console.log(`Processing ${evidence.length} evidence items for complaint ${complaintId}`);
      
      for (const item of evidence) {
        if (!item.document_url) {
          console.warn("Skipping evidence item without document_url");
          continue;
        }
        
        try {
       
          const docResult = await pool.query(
            `INSERT INTO document_ (
              tenant_id, uploaded_by, document_type,
              document_name, document_url, file_size, mime_type
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id`,
            [
              tenantId,
              req.userId,
              'complaint_evidence',
              item.document_name || `Complaint evidence - ${complaintId}`,
              item.document_url,
              item.file_size || 0,
              item.mime_type || 'image/jpeg'
            ]
          );
          
          const documentId = docResult.rows[0].id;
          console.log(` Created document record: ${documentId}`);
          
          
          await pool.query(
            `INSERT INTO complaint_evidence (
              complaint_id, document_id, evidence_type, uploaded_by
            ) VALUES ($1, $2, $3, $4)`,
            [complaintId, documentId, item.photo_type || 'photo', req.userId]
          );
          
          console.log(` Linked evidence ${documentId} to complaint ${complaintId}`);
          
        } catch (evidenceErr) {
          console.error(" Failed to save evidence item:", evidenceErr.message);
        }
      }
    }
    

    const caretaker = await pool.query(
      "SELECT u.id FROM user_ u JOIN caretaker c ON c.user_id = u.id WHERE c.assigned_property = $1",
      [property_id]
    );
    
    const scopeLabels = {
      specific_tenant: `against Unit ${against_unit_number}`,
      common_area: `about ${common_area_location}`,
      unknown: 'general complaint',
      property_wide: 'property-wide issue'
    };
    
    if (caretaker.rows.length) {
      await createNotification(
        caretaker.rows[0].id, 
        "complaint_update", 
        "New Complaint",
        `New ${scopeLabels[complaint_scope]}: "${subject}"`, 
        complaintId, 
        "complaint"
      );
    }
    
    await createNotification(
      req.userId, 
      "complaint_update", 
      "Complaint Submitted",
      `Your complaint "${subject}" is under review.`, 
      complaintId, 
      "complaint"
    );
    
    res.status(201).json({ 
      message: "Complaint submitted", 
      complaint: result.rows[0] 
    });
  } catch (err) {
    console.error("Submit complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /complaints/my — TENANT VIEWS THEIR OWN COMPLAINTS
app.get("/complaints/my", requireAuth, requireTenant, async (req, res) => {
  try {
    const tenant = await pool.query("SELECT id FROM tenant WHERE user_id = $1", [req.userId]);
    if (!tenant.rows.length) return res.status(404).json({ error: "Tenant not found" });
    
    const result = await pool.query(
      `SELECT c.*, 
              t1.first_name || ' ' || t1.last_name AS filed_by_name,
              t2.first_name || ' ' || t2.last_name AS against_name,
              u.unit_number AS against_unit_number,
              p.name AS property_name,
              COALESCE(
                (SELECT json_agg(json_build_object('id', ce.id, 'document_url', d.document_url, 'evidence_type', ce.evidence_type, 'label', d.document_name, 'mimeType', d.mime_type))
                 FROM complaint_evidence ce
                 LEFT JOIN document_ d ON d.id = ce.document_id
                 WHERE ce.complaint_id = c.id),
                '[]'::json
              ) AS evidence
       FROM complaint c
       LEFT JOIN tenant t1 ON t1.id = c.filed_by_tenant_id
       LEFT JOIN tenant t2 ON t2.id = c.against_tenant_id
       LEFT JOIN unit u ON u.id = c.against_unit_id
       LEFT JOIN property p ON p.id = c.property_id
       WHERE c.filed_by_tenant_id = $1
       ORDER BY c.created_at DESC`,
      [tenant.rows[0].id]
    );
    
    res.json({ complaints: result.rows });
  } catch (err) {
    console.error("Get tenant complaints:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /complaints/:id — GET SINGLE COMPLAINT
app.get("/complaints/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT c.*, 
              t1.first_name || ' ' || t1.last_name AS filed_by_name,
              t2.first_name || ' ' || t2.last_name AS against_name,
              u.unit_number AS against_unit_number,
              p.name AS property_name,
              COALESCE(
                (SELECT json_agg(json_build_object('id', ce.id, 'document_url', d.document_url, 'evidence_type', ce.evidence_type, 'label', d.document_name, 'mimeType', d.mime_type))
                 FROM complaint_evidence ce
                 LEFT JOIN document_ d ON d.id = ce.document_id
                 WHERE ce.complaint_id = c.id),
                '[]'::json
              ) AS evidence
       FROM complaint c
       LEFT JOIN tenant t1 ON t1.id = c.filed_by_tenant_id
       LEFT JOIN tenant t2 ON t2.id = c.against_tenant_id
       LEFT JOIN unit u ON u.id = c.against_unit_id
       LEFT JOIN property p ON p.id = c.property_id
       WHERE c.id = $1`,
      [id]
    );
    
    if (!result.rows.length) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    
    res.json({ complaint: result.rows[0] });
  } catch (err) {
    console.error("Get complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /caretaker/complaints — CARETAKER VIEWS PROPERTY COMPLAINTS
app.get("/caretaker/complaints", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const cr = await pool.query("SELECT assigned_property FROM caretaker WHERE user_id = $1", [req.userId]);
    if (!cr.rows.length) return res.status(404).json({ error: "Caretaker not found" });
    if (!cr.rows[0].assigned_property) return res.json({ complaints: [] });
    
    const result = await pool.query(
      `SELECT c.*, 
              t1.first_name || ' ' || t1.last_name AS filed_by_name,
              t2.first_name || ' ' || t2.last_name AS against_name,
              u.unit_number AS against_unit_number,
              p.name AS property_name
       FROM complaint c
       LEFT JOIN tenant t1 ON t1.id = c.filed_by_tenant_id
       LEFT JOIN tenant t2 ON t2.id = c.against_tenant_id
       LEFT JOIN unit u ON u.id = c.against_unit_id
       LEFT JOIN property p ON p.id = c.property_id
       WHERE c.property_id = $1
       ORDER BY c.created_at DESC`,
      [cr.rows[0].assigned_property]
    );
    
    res.json({ complaints: result.rows });
  } catch (err) {
    console.error("Get caretaker complaints:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /caretaker/complaints/:id/review — MARK UNDER REVIEW
app.put("/caretaker/complaints/:id/review", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      "UPDATE complaint SET status = 'under_review', updated_at = NOW() WHERE id = $1 AND status = 'open' RETURNING *",
      [id]
    );
    
    if (!result.rows.length) return res.status(404).json({ error: "Complaint not found or not open" });
    
    const tenantUser = await pool.query("SELECT user_id FROM tenant WHERE id = $1", [result.rows[0].filed_by_tenant_id]);
    if (tenantUser.rows.length) {
      await createNotification(tenantUser.rows[0].user_id, "complaint_update", "Complaint Under Review",
        `Your complaint is being reviewed.`, id, "complaint");
    }
    
    res.json({ message: "Complaint marked as under review", complaint: result.rows[0] });
  } catch (err) {
    console.error("Review complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /caretaker/complaints/:id/resolve — MARK AS RESOLVED
app.put("/caretaker/complaints/:id/resolve", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const result = await pool.query(
      `UPDATE complaint 
       SET status = 'resolved', 
           resolution_notes = COALESCE($2, 'Resolved by caretaker'),
           resolved_by = $3,
           resolved_at = NOW(), 
           updated_at = NOW() 
       WHERE id = $1 AND status IN ( 'under_review') 
       RETURNING *`,
      [id, notes || null, req.userId]
    );
    
    if (!result.rows.length) {
      return res.status(404).json({ error: "Complaint not found or cannot be resolved in current status" });
    }
    
    const tenantUser = await pool.query(
      "SELECT user_id FROM tenant WHERE id = $1", 
      [result.rows[0].filed_by_tenant_id]
    );
    
    if (tenantUser.rows.length) {
      await createNotification(
        tenantUser.rows[0].user_id, 
        "complaint_update", 
        "Complaint Resolved",
        `Your complaint "${result.rows[0].subject}" has been resolved.`, 
        id, 
        "complaint"
      );
    }
    
    res.json({ message: "Complaint marked as resolved", complaint: result.rows[0] });
  } catch (err) {
    console.error("Resolve complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /caretaker/complaints/:id/escalate — CARETAKER ESCALATES TO LANDLORD
app.put("/caretaker/complaints/:id/escalate", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const result = await pool.query(
      "UPDATE complaint SET status = 'escalated', updated_at = NOW() WHERE id = $1 RETURNING *",
      [id]
    );
    
    if (!result.rows.length) return res.status(404).json({ error: "Complaint not found" });
    
    const property = await pool.query("SELECT landlord_id FROM property WHERE id = $1", [result.rows[0].property_id]);
    if (property.rows.length) {
      const landlordUser = await pool.query("SELECT user_id FROM landlord WHERE id = $1", [property.rows[0].landlord_id]);
      if (landlordUser.rows.length) {
        await createNotification(landlordUser.rows[0].user_id, "complaint_update", "Complaint Escalated",
          `"${result.rows[0].subject}" has been escalated.`, id, "complaint");
      }
    }
    
    res.json({ message: "Complaint escalated", complaint: result.rows[0] });
  } catch (err) {
    console.error("Escalate complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /caretaker/complaints/:id/dismiss — CARETAKER DISMISSES COMPLAINT
app.put("/caretaker/complaints/:id/dismiss", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) return res.status(400).json({ error: "Dismissal reason is required" });
    
    const result = await pool.query(
      "UPDATE complaint SET status = 'dismissed', resolution_notes = $1, resolved_by = $2, resolved_at = NOW(), updated_at = NOW() WHERE id = $3 RETURNING *",
      [reason, req.userId, id]
    );
    
    if (!result.rows.length) return res.status(404).json({ error: "Complaint not found" });
    
    const tenantUser = await pool.query("SELECT user_id FROM tenant WHERE id = $1", [result.rows[0].filed_by_tenant_id]);
    if (tenantUser.rows.length) {
      await createNotification(tenantUser.rows[0].user_id, "complaint_update", "Complaint Dismissed",
        `Your complaint was dismissed: ${reason}`, id, "complaint");
    }
    
    res.json({ message: "Complaint dismissed", complaint: result.rows[0] });
  } catch (err) {
    console.error("Dismiss complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /landlord/complaints — LANDLORD VIEWS ALL COMPLAINTS
app.get("/landlord/complaints", requireAuth, async (req, res) => {
  try {
    if (req.userRole !== "landlord") return res.status(403).json({ error: "Access denied" });
    
    const landlord = await pool.query("SELECT id FROM landlord WHERE user_id = $1", [req.userId]);
    if (!landlord.rows.length) return res.status(404).json({ error: "Landlord not found" });
    
    const result = await pool.query(
      `SELECT c.*, 
              t1.first_name || ' ' || t1.last_name AS filed_by_name,
              t2.first_name || ' ' || t2.last_name AS against_name,
              u.unit_number AS against_unit_number,
              p.name AS property_name
       FROM complaint c
       LEFT JOIN tenant t1 ON t1.id = c.filed_by_tenant_id
       LEFT JOIN tenant t2 ON t2.id = c.against_tenant_id
       LEFT JOIN unit u ON u.id = c.against_unit_id
       LEFT JOIN property p ON p.id = c.property_id
       WHERE p.landlord_id = $1
       ORDER BY c.created_at DESC`,
      [landlord.rows[0].id]
    );
    
    res.json({ complaints: result.rows });
  } catch (err) {
    console.error("Get landlord complaints:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /landlord/complaints/:id/approve — LANDLORD APPROVES
app.put("/landlord/complaints/:id/approve", requireAuth, async (req, res) => {
  try {
    if (req.userRole !== "landlord") return res.status(403).json({ error: "Access denied" });
    
    const { id } = req.params;
    
    const result = await pool.query(
      "UPDATE complaint SET status = 'approved', updated_at = NOW() WHERE id = $1 AND status IN ('escalated', 'awaiting_clarification') RETURNING *",
      [id]
    );
    
    if (!result.rows.length) return res.status(404).json({ error: "Complaint not found or cannot be approved" });
    
    const tenantUser = await pool.query("SELECT user_id FROM tenant WHERE id = $1", [result.rows[0].filed_by_tenant_id]);
    if (tenantUser.rows.length) {
      await createNotification(tenantUser.rows[0].user_id, "complaint_update", "Complaint Approved",
        `Your complaint has been approved.`, id, "complaint");
    }
    
    res.json({ message: "Complaint approved", complaint: result.rows[0] });
  } catch (err) {
    console.error("Approve complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /landlord/complaints/:id/reject — LANDLORD REJECTS
app.put("/landlord/complaints/:id/reject", requireAuth, async (req, res) => {
  try {
    if (req.userRole !== "landlord") return res.status(403).json({ error: "Access denied" });
    
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) return res.status(400).json({ error: "Rejection reason is required" });
    
    const result = await pool.query(
      "UPDATE complaint SET status = 'rejected', resolution_notes = $1, resolved_by = $2, resolved_at = NOW(), updated_at = NOW() WHERE id = $3 RETURNING *",
      [reason, req.userId, id]
    );
    
    if (!result.rows.length) return res.status(404).json({ error: "Complaint not found" });
    
    const tenantUser = await pool.query("SELECT user_id FROM tenant WHERE id = $1", [result.rows[0].filed_by_tenant_id]);
    if (tenantUser.rows.length) {
      await createNotification(tenantUser.rows[0].user_id, "complaint_update", "Complaint Rejected",
        `Your complaint was not approved.`, id, "complaint");
    }
    
    res.json({ message: "Complaint rejected", complaint: result.rows[0] });
  } catch (err) {
    console.error("Reject complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /landlord/complaints/:id/clarify — LANDLORD REQUESTS CLARIFICATION
app.put("/landlord/complaints/:id/clarify", requireAuth, async (req, res) => {
  try {
    if (req.userRole !== "landlord") return res.status(403).json({ error: "Access denied" });
    
    const { id } = req.params;
    const { request } = req.body;
    
    if (!request) return res.status(400).json({ error: "Clarification request is required" });
    
    const result = await pool.query(
      "UPDATE complaint SET status = 'awaiting_clarification', updated_at = NOW() WHERE id = $1 RETURNING *",
      [id]
    );
    
    if (!result.rows.length) return res.status(404).json({ error: "Complaint not found" });
    
    const tenantUser = await pool.query("SELECT user_id FROM tenant WHERE id = $1", [result.rows[0].filed_by_tenant_id]);
    if (tenantUser.rows.length) {
      await createNotification(tenantUser.rows[0].user_id, "complaint_update", "Clarification Needed",
        `The landlord needs more information.`, id, "complaint");
    }
    
    res.json({ message: "Clarification requested", complaint: result.rows[0] });
  } catch (err) {
    console.error("Request clarification:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /complaints/:id/clarify — TENANT PROVIDES CLARIFICATION
app.put("/complaints/:id/clarify", requireAuth, requireTenant, async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    
    if (!response) return res.status(400).json({ error: "Response is required" });
    
    const result = await pool.query(
      "UPDATE complaint SET status = 'escalated', updated_at = NOW() WHERE id = $1 AND filed_by = $2 AND status = 'awaiting_clarification' RETURNING *",
      [id, req.userId]
    );
    
    if (!result.rows.length) return res.status(404).json({ error: "Complaint not found or not awaiting clarification" });
    
    const property = await pool.query("SELECT landlord_id FROM property WHERE id = $1", [result.rows[0].property_id]);
    if (property.rows.length) {
      const landlordUser = await pool.query("SELECT user_id FROM landlord WHERE id = $1", [property.rows[0].landlord_id]);
      if (landlordUser.rows.length) {
        await createNotification(landlordUser.rows[0].user_id, "complaint_update", "Clarification Provided",
          `Tenant provided clarification.`, id, "complaint");
      }
    }
    
    res.json({ message: "Clarification submitted", complaint: result.rows[0] });
  } catch (err) {
    console.error("Clarify complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /landlord/complaints/:id/verdict — LANDLORD ISSUES VERDICT
app.put("/landlord/complaints/:id/verdict", requireAuth, async (req, res) => {
  try {
    if (req.userRole !== "landlord") return res.status(403).json({ error: "Access denied" });
    
    const { id } = req.params;
    const { type, fineAmount, notes } = req.body;
    
    if (!type || !["warning", "fine", "final_warning", "eviction_notice"].includes(type)) {
      return res.status(400).json({ error: "Valid verdict type required" });
    }
    
    if (type === "fine" && (!fineAmount || isNaN(Number(fineAmount)) || Number(fineAmount) <= 0)) {
      return res.status(400).json({ error: "Valid fine amount required" });
    }
    
    const resolutionNotes = `${type.replace(/_/g, " ")}${fineAmount ? ` | Fine: R${fineAmount}` : ""}${notes ? ` | ${notes}` : ""}`;
    
    const result = await pool.query(
      "UPDATE complaint SET status = 'resolved', resolution_notes = $1, resolved_by = $2, resolved_at = NOW(), updated_at = NOW() WHERE id = $3 AND status = 'approved' RETURNING *",
      [resolutionNotes, req.userId, id]
    );
    
    if (!result.rows.length) return res.status(404).json({ error: "Complaint not found or not approved" });
    
    if (result.rows[0].against_tenant_id) {
      const againstUser = await pool.query("SELECT user_id FROM tenant WHERE id = $1", [result.rows[0].against_tenant_id]);
      if (againstUser.rows.length) {
        await createNotification(againstUser.rows[0].user_id, "complaint_update", "Verdict Issued",
          `A ${type.replace(/_/g, " ")} has been issued against you.`, id, "complaint");
      }
    }
    
    const filedByUser = await pool.query("SELECT user_id FROM tenant WHERE id = $1", [result.rows[0].filed_by_tenant_id]);
    if (filedByUser.rows.length) {
      await createNotification(filedByUser.rows[0].user_id, "complaint_update", "Verdict Issued",
        `A verdict has been issued for your complaint.`, id, "complaint");
    }
    
    res.json({ message: "Verdict issued", complaint: result.rows[0] });
  } catch (err) {
    console.error("Issue verdict:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /complaints/:id/reopen — TENANT REOPENS COMPLAINT
app.put("/complaints/:id/reopen", requireAuth, requireTenant, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const result = await pool.query(
      `UPDATE complaint SET status = 'open', resolution_notes = NULL, resolved_by = NULL, resolved_at = NULL, updated_at = NOW() 
       WHERE id = $1 AND filed_by = $2 AND status IN ('resolved', 'rejected', 'dismissed') RETURNING *`,
      [id, req.userId]
    );
    
    if (!result.rows.length) return res.status(404).json({ error: "Complaint not found or cannot be reopened" });
    
    const caretaker = await pool.query(
      "SELECT u.id FROM user_ u JOIN caretaker c ON c.user_id = u.id WHERE c.assigned_property = $1",
      [result.rows[0].property_id]
    );
    
    if (caretaker.rows.length) {
      await createNotification(caretaker.rows[0].id, "complaint_update", "Complaint Reopened",
        `Tenant reopened a complaint.`, id, "complaint");
    }
    
    res.json({ message: "Complaint reopened", complaint: result.rows[0] });
  } catch (err) {
    console.error("Reopen complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// START SERVER
async function verifyConnection() {
  try {
    await pool.query("SELECT 1");
    console.log("Database connected successfully");
  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
}

verifyConnection().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n Server running on http://10.254.73.40:${PORT}`);
  });
});