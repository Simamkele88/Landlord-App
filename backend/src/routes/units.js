const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireLandlord, requireTenant } = require("../middleware/roleCheck");

// GET /units - Get all units for landlord with tenant info
router.get("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const lr = await pool.query("SELECT id FROM landlord WHERE user_id=$1", [req.userId]);
    const landlordId = lr.rows[0]?.id;
    
    if (!landlordId) {
      return res.status(404).json({ error: "Landlord not found" });
    }

    const result = await pool.query(
      `SELECT u.*, 
              p.name AS property_name,
              p.id AS property_id,
              t.id AS tenant_id,
              t.first_name || ' ' || t.last_name AS tenant_name,
              l.id AS lease_id,
              l.lease_start_date,
              l.lease_end_date,
              l.rent_amount AS lease_rent_amount
       FROM unit u
       JOIN property p ON p.id = u.property_id
       LEFT JOIN tenant t ON t.id = u.current_tenant_id
       LEFT JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
       WHERE p.landlord_id = $1
       ORDER BY p.name, u.unit_number`,
      [landlordId]
    );
    
    res.json({ units: result.rows });
  } catch (err) {
    console.error("Get units:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /units/vacant - Get all vacant units for landlord
router.get("/vacant", requireAuth, requireLandlord, async (req, res) => {
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

// GET /units/available - Tenant gets occupied units in their property
router.get("/available", requireAuth, requireTenant, async (req, res) => {
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

// PUT /units/:id - Update unit
router.put("/:id", requireAuth, async (req, res) => {
  try {
    if (req.userRole !== "landlord") {
      return res.status(403).json({ error: "Only landlords can update units" });
    }
    
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
        parseInt(unit_number), unit_type,
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

// DELETE /units/:id - Delete unit
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    if (req.userRole !== "landlord") {
      return res.status(403).json({ error: "Only landlords can delete units" });
    }
    
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

module.exports = router;
