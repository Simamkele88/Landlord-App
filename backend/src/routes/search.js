const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, async (req, res) => {
  const q = (req.query.q || "").trim();
  const userId = req.userId;
  const role = req.userRole;

  if (q.length < 2) {
    return res.json({ results: {} });
  }

  const like = `%${q}%`;

  try {
    let landlordId;

    if (role === "landlord") {
      const lRes = await pool.query(
        `SELECT id FROM landlord WHERE user_id = $1`,
        [userId],
      );
      landlordId = lRes.rows[0]?.id;
    } else if (role === "caretaker") {
      const cRes = await pool.query(
        `SELECT landlord_id FROM caretaker WHERE user_id = $1`,
        [userId],
      );
      landlordId = cRes.rows[0]?.landlord_id;
    }

    const [tenants, units, invoices, payments, complaints, maintenance] =
      await Promise.all([
        pool.query(
          `SELECT t.id, u.full_name, u.email, un.unit_number
           FROM tenant t
           JOIN users u ON u.id = t.user_id
           LEFT JOIN unit un ON un.current_tenant_id = t.id
           WHERE t.landlord_id = $1
             AND (u.full_name ILIKE $2 OR u.email ILIKE $2)
           LIMIT 5`,
          [landlordId, like],
        ),
        pool.query(
          `SELECT un.id, un.unit_number, un.status, p.name AS property_name
           FROM unit un
           JOIN property p ON p.id = un.property_id
           WHERE p.landlord_id = $1
             AND un.unit_number ILIKE $2
           LIMIT 5`,
          [landlordId, like],
        ),
        pool.query(
          `SELECT i.id, i.invoice_number, i.amount_due, i.status, u.full_name AS tenant_name
           FROM invoice i
           JOIN tenant t ON t.id = i.tenant_id
           JOIN users u ON u.id = t.user_id
           WHERE i.landlord_id = $1
             AND (i.invoice_number ILIKE $2 OR u.full_name ILIKE $2)
           LIMIT 5`,
          [landlordId, like],
        ),
        pool.query(
          `SELECT p.id, p.amount_paid, p.status, p.bank_reference, u.full_name AS tenant_name
           FROM payment p
           JOIN tenant t ON t.id = p.tenant_id
           JOIN users u ON u.id = t.user_id
           WHERE p.landlord_id = $1
             AND (p.bank_reference ILIKE $2 OR u.full_name ILIKE $2)
           LIMIT 5`,
          [landlordId, like],
        ),
        pool.query(
          `SELECT c.id, c.subject, c.status, c.category
           FROM complaint c
           JOIN property pr ON pr.id = c.property_id
           WHERE pr.landlord_id = $1
             AND c.subject ILIKE $2
           LIMIT 5`,
          [landlordId, like],
        ),
        pool.query(
          `SELECT id, request_number, title, status, priority
           FROM maintenance_request
           WHERE landlord_id = $1
             AND (title ILIKE $2 OR request_number ILIKE $2)
           LIMIT 5`,
          [landlordId, like],
        ),
      ]);

    res.json({
      results: {
        tenants: tenants.rows,
        units: units.rows,
        invoices: invoices.rows,
        payments: payments.rows,
        complaints: complaints.rows,
        maintenance: maintenance.rows,
      },
    });
  } catch (err) {
    console.error("[search] error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

module.exports = router;
