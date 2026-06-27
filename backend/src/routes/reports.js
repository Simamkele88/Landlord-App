// src/routes/reports.js
const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireLandlord } = require("../middleware/roleCheck");

async function getLandlordId(userId) {
  const result = await pool.query("SELECT id FROM landlord WHERE user_id = $1", [userId]);
  return result.rows[0]?.id || null;
}

// GET /reports - Unified reports endpoint
router.get("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const { report, date_from, date_to, tenant_id } = req.query;
    let result;

    switch (report) {
      case 'rent-roll':
        result = await pool.query(
          `SELECT 
            t.first_name || ' ' || t.last_name AS tenant,
            u.unit_number AS unit,
            p.name AS property,
            l.rent_amount AS rent,
            l.payment_frequency AS frequency,
            l.lease_end_date AS "leaseEnd",
            COALESCE(i.remaining_balance, 0) AS balance,
            CASE WHEN l.status = 'active' THEN 'active' ELSE l.status END AS status
           FROM tenant t
           JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
           JOIN unit u ON u.id = l.unit_id
           JOIN property p ON p.id = u.property_id
           LEFT JOIN LATERAL (
             SELECT remaining_balance FROM invoice 
             WHERE tenant_id = t.id AND status IN ('sent', 'overdue') 
             ORDER BY created_at DESC LIMIT 1
           ) i ON true
           WHERE t.landlord_id = $1
           ORDER BY p.name, u.unit_number`,
          [landlordId]
        );
        return res.json(result.rows);

      case 'collections': {
        let query = `SELECT 
          t.first_name || ' ' || t.last_name AS tenant,
          u.unit_number AS unit,
          pay.amount_paid AS amount,
          inv.due_date AS due,
          pay.payment_date AS paid,
          pay.payment_method AS method,
          pay.status
         FROM payment pay
         JOIN tenant t ON t.id = pay.tenant_id
         LEFT JOIN invoice inv ON inv.id = pay.invoice_id
         LEFT JOIN unit u ON u.id = inv.unit_id
         WHERE pay.landlord_id = $1`;
        const params = [landlordId];
        let paramIndex = 2;

        if (date_from) {
          query += ` AND pay.payment_date >= $${paramIndex}`;
          params.push(date_from);
          paramIndex++;
        }
        if (date_to) {
          query += ` AND pay.payment_date <= $${paramIndex}`;
          params.push(date_to);
          paramIndex++;
        }

        query += ` ORDER BY pay.payment_date DESC LIMIT 100`;
        result = await pool.query(query, params);
        return res.json(result.rows);
      }

      case 'arrears':
        result = await pool.query(
          `SELECT 
            t.first_name || ' ' || t.last_name AS tenant,
            u.unit_number AS unit,
            p.name AS property,
            COALESCE(i.remaining_balance, i.amount_due, 0) AS balance,
            CASE WHEN i.due_date IS NOT NULL 
              THEN CURRENT_DATE - i.due_date::date 
              ELSE 0 
            END AS "daysOverdue",
            (SELECT MAX(pay.payment_date) FROM payment pay WHERE pay.tenant_id = t.id AND pay.status = 'paid') AS "lastPayment",
            CASE WHEN col.id IS NOT NULL THEN 'collections' ELSE 'overdue' END AS "collectionsStatus"
           FROM tenant t
           JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
           JOIN unit u ON u.id = l.unit_id
           JOIN property p ON p.id = u.property_id
           JOIN invoice i ON i.tenant_id = t.id AND i.status IN ('sent', 'overdue')
           LEFT JOIN collection col ON col.tenant_id = t.id AND col.status = 'active'
           WHERE t.landlord_id = $1
             AND i.due_date < CURRENT_DATE
           ORDER BY "daysOverdue" DESC`,
          [landlordId]
        );
        return res.json(result.rows);

      case 'maintenance':
        result = await pool.query(
          `SELECT 
            mr.title,
            p.name AS property,
            mr.category::text AS category,
            mr.priority::text AS priority,
            COALESCE(mr.actual_cost, mr.estimated_cost, 0) AS cost,
            mr.created_at AS date
           FROM maintenance_request mr
           JOIN unit u ON u.id = mr.unit_id
           JOIN property p ON p.id = u.property_id
           WHERE mr.landlord_id = $1
             AND mr.status = 'completed'
           ORDER BY mr.created_at DESC
           LIMIT 50`,
          [landlordId]
        );
        return res.json(result.rows);

      case 'occupancy':
        result = await pool.query(
          `SELECT 
            p.name AS property,
            COUNT(u.id) AS total,
            COUNT(CASE WHEN u.status = 'occupied' THEN 1 END) AS occupied,
            COUNT(CASE WHEN u.status = 'vacant' THEN 1 END) AS vacant,
            COUNT(CASE WHEN u.status = 'maintenance' THEN 1 END) AS maintenance
           FROM property p
           JOIN unit u ON u.property_id = p.id
           WHERE p.landlord_id = $1
           GROUP BY p.id, p.name
           ORDER BY p.name`,
          [landlordId]
        );
        return res.json(result.rows);

      case 'tenant-ledger': {
        if (!tenant_id) {
          return res.json([]);
        }
        result = await pool.query(
          `SELECT 
            inv.billing_period_start || ' — ' || inv.billing_period_end AS period,
            inv.amount_due AS amount,
            inv.due_date AS due,
            pay.payment_date AS paid,
            pay.payment_method AS method,
            COALESCE(pay.status, 'late') AS status
           FROM invoice inv
           LEFT JOIN payment pay ON pay.invoice_id = inv.id AND pay.status = 'paid'
           WHERE inv.tenant_id = $1
           ORDER BY inv.due_date DESC
           LIMIT 24`,
          [tenant_id]
        );
        return res.json(result.rows);
      }

      default:
        return res.json([]);
    }
  } catch (err) {
    console.error("Reports error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

module.exports = router;