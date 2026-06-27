const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");

// POST /upload/maintenance-photo-base64 - Upload maintenance photo as base64
router.post("/maintenance-photo-base64", requireAuth, async (req, res) => {
  console.log("Photo upload request received");
  
  try {
    const { image, fileName, mimeType, fileSize } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Invalid image format. Expected data URL like data:image/jpeg;base64,XXX..." });
    }

    const imageType = matches[1];
    const imageData = matches[2];
    
    let buffer;
    try {
      buffer = Buffer.from(imageData, 'base64');
    } catch (bufErr) {
      return res.status(400).json({ error: "Invalid base64 data" });
    }
    
    console.log(`Image decoded: ${(buffer.length / 1024).toFixed(1)}KB, type: ${imageType}`);
    
    const maxSize = 10 * 1024 * 1024;
    if (buffer.length > maxSize) {
      return res.status(400).json({ error: `File too large. Maximum 10MB, got ${(buffer.length / (1024 * 1024)).toFixed(1)}MB` });
    }
    
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = imageType.includes('png') ? '.png' : 
                imageType.includes('webp') ? '.webp' : 
                imageType.includes('heic') ? '.heic' : '.jpg';
    const filename = `maintenance-${uniqueSuffix}${ext}`;
    
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'maintenance');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log("Created upload directory:", uploadDir);
    }
    
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);
    
    let documentId = null;
    try {
      const tenant = await pool.query("SELECT id FROM tenant WHERE user_id = $1", [req.userId]);
      
      if (tenant.rows.length) {
        const docResult = await pool.query(
          `INSERT INTO document_ (tenant_id, uploaded_by, document_type, document_name, document_url, file_size, mime_type)
           VALUES ($1, $2, 'maintenance_photo', $3, $4, $5, $6) RETURNING id`,
          [tenant.rows[0].id, req.userId, fileName || `Maintenance photo`, `/uploads/maintenance/${filename}`, buffer.length, imageType]
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
    return res.status(500).json({ error: "Upload failed", details: err.message });
  }
});

// POST /upload - Generic file upload for complaint evidence
router.post("/", requireAuth, async (req, res) => {
  console.log("Upload request received");
  
  try {
    const { image, fileName, mimeType, fileSize, uploadType } = req.body;
    
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
    
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', folderName);
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
    
    return res.json({
      success: true,
      document_url: `/uploads/${folderName}/${filename}`,
      document_name: fileName || `${type} photo`,
      file_size: buffer.length,
      mime_type: imageType,
      document_id: documentId
    });
    
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Upload failed" });
  }
});

module.exports = router;
