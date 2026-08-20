const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");

// GET /properties - Landlord views all properties
router.get("/", requireAuth, async (req, res) => {
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
              cu.full_name AS caretaker_name,
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
                    'tenant_name', tu.full_name
                  ) ORDER BY u.unit_number)
                FROM unit u
                LEFT JOIN tenant t ON t.id = u.current_tenant_id
                LEFT JOIN users tu ON tu.id = t.user_id
                WHERE u.property_id = p.id),
                '[]'::json
              ) AS units
       FROM property p
       LEFT JOIN caretaker c ON c.id = p.caretaker_id
       LEFT JOIN users cu ON cu.id = c.user_id
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

// POST /properties/create - Landlord creates property
router.post("/create", requireAuth, async (req, res) => {
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
      has_elevator, has_parking, has_security, has_pool, pet_friendly,
      parking_spots, monthly_rates, monthly_levies, latitude, longitude
    } = req.body;
    
    if (!name || !address_line1 || !city) {
      return res.status(400).json({ error: "Name, address, and city are required" });
    }
    
    // Validate coordinates if provided
    if (latitude !== undefined && latitude !== null && latitude !== '') {
      const lat = parseFloat(latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        return res.status(400).json({ error: "Latitude must be between -90 and 90" });
      }
    }
    
    if (longitude !== undefined && longitude !== null && longitude !== '') {
      const lng = parseFloat(longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        return res.status(400).json({ error: "Longitude must be between -180 and 180" });
      }
    }
    
    const result = await pool.query(
      `INSERT INTO property (
        landlord_id, name, property_type, address_line1, address_line2,
        city, province, postal_code, country, total_floors, total_units,
        has_elevator, has_parking, has_security, has_pool, pet_friendly,
        parking_spots, monthly_rates, monthly_levies, latitude, longitude
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
      RETURNING *`,
      [
        landlord.rows[0].id, name, property_type || "residential",
        address_line1, address_line2 || null, city, province || null,
        postal_code || null, country || "South Africa",
        total_floors ? parseInt(total_floors) : null,
        total_units ? parseInt(total_units) : null,
        has_elevator || false, has_parking || false,
        has_security || false, has_pool || false, pet_friendly || false,
        parking_spots ? parseInt(parking_spots) : null,
        monthly_rates ? parseFloat(monthly_rates) : null,
        monthly_levies ? parseFloat(monthly_levies) : null,
        latitude !== undefined && latitude !== null && latitude !== '' ? parseFloat(latitude) : null,
        longitude !== undefined && longitude !== null && longitude !== '' ? parseFloat(longitude) : null
      ]
    );
    
    res.status(201).json({ message: "Property created", property: result.rows[0] });
  } catch (err) {
    console.error("Create property:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /properties/:id - Landlord views a specific property with its units
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT p.*, 
              cu.full_name AS caretaker_name,
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
                    'tenant_name', tu.full_name
                  ) ORDER BY u.unit_number)
                FROM unit u
                LEFT JOIN tenant t ON t.id = u.current_tenant_id
                LEFT JOIN users tu ON tu.id = t.user_id
                WHERE u.property_id = p.id),
                '[]'::json
              ) AS units
       FROM property p
       LEFT JOIN caretaker c ON c.id = p.caretaker_id
       LEFT JOIN users cu ON cu.id = c.user_id
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

// GET /properties/:id/leases - La  ndlord views all leases for a specific property
router.get("/:id/leases", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT l.*, l.status AS lease_status,
              u.unit_number, u.unit_type, u.status,
              t.id AS tenant_id, tu.full_name AS tenant_name
       FROM lease l
       JOIN unit u ON u.id = l.unit_id
       LEFT JOIN tenant t ON t.id = l.tenant_id
       LEFT JOIN users tu ON tu.id = t.user_id
       WHERE u.property_id = $1`,
      [id]
    );
    
    res.json({ leases: result.rows });
  } catch (err) {
    console.error("Get property leases:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /properties/:id - Landlord updates property
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const {
      name, property_type, address_line1, address_line2, city, province,
      postal_code, country, total_floors, total_units,
      has_elevator, has_parking, has_security, has_pool, pet_friendly,
      parking_spots, monthly_rates, monthly_levies, latitude, longitude
    } = req.body;
    
    // Validate coordinates if provided
    if (latitude !== undefined && latitude !== null && latitude !== '') {
      const lat = parseFloat(latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        return res.status(400).json({ error: "Latitude must be between -90 and 90" });
      }
    }
    
    if (longitude !== undefined && longitude !== null && longitude !== '') {
      const lng = parseFloat(longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        return res.status(400).json({ error: "Longitude must be between -180 and 180" });
      }
    }
    
    const result = await pool.query(
      `UPDATE property SET
        name = $1, property_type = $2, address_line1 = $3, address_line2 = $4,
        city = $5, province = $6, postal_code = $7, country = $8,
        total_floors = $9, total_units = $10,
        has_elevator = $11, has_parking = $12, has_security = $13,
        has_pool = $14, pet_friendly = $15,
        parking_spots = $16, monthly_rates = $17, monthly_levies = $18,
        latitude = $19, longitude = $20, updated_at = NOW()
       WHERE id = $21 RETURNING *`,
      [
        name, property_type, address_line1, address_line2 || null,
        city, province || null, postal_code || null,
        country || "South Africa",
        total_floors ? parseInt(total_floors) : null,
        total_units ? parseInt(total_units) : null,
        has_elevator || false, has_parking || false,
        has_security || false, has_pool || false, pet_friendly || false,
        parking_spots ? parseInt(parking_spots) : null,
        monthly_rates ? parseFloat(monthly_rates) : null,
        monthly_levies ? parseFloat(monthly_levies) : null,
        latitude !== undefined && latitude !== null && latitude !== '' ? parseFloat(latitude) : null,
        longitude !== undefined && longitude !== null && longitude !== '' ? parseFloat(longitude) : null,
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

// POST /properties/:propertyId/units - Add unit to a specific property
router.post("/:propertyId/units", requireAuth, async (req, res) => {
  try {
    if (req.userRole !== "landlord") {
      return res.status(403).json({ error: "Only landlords can create units" });
    }
    
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
        propertyId, String(unit_number),
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

// DELETE /properties/:id - Landlord deletes property
router.delete("/:id", requireAuth, async (req, res) => {
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

module.exports = router;