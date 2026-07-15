const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./config/database");

// Import route files
const authRoutes = require("./routes/auth");
const tenantRoutes = require("./routes/tenants");
const maintenanceRoutes = require("./routes/maintenance");
const propertyRoutes = require("./routes/properties");
const unitRoutes = require("./routes/units");
const complaintRoutes = require("./routes/complaints");
const uploadRoutes = require("./routes/uploads");
const caretakerRoutes = require("./routes/caretaker");
const landlordRoutes = require("./routes/landlord");
const paymentSettingsRoutes = require("./routes/paymentSettings");
const landlordSettingsRoutes = require("./routes/landlordSettings");
const landlordPaymentRoutes = require("./routes/landlordPayments");
const messageRoutes = require("./routes/messages");
const notificationRoutes = require("./routes/notifications");
const announcementRoutes = require("./routes/announcements");
const reportRoutes = require("./routes/reports");
const landlordCaretakerRoutes = require("./routes/landlordCaretakers");
const billingRoutes = require("./routes/billing");




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


app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use("/auth", authRoutes);
app.use("/tenants", tenantRoutes);
app.use("/maintenance", maintenanceRoutes);
app.use("/properties", propertyRoutes);
app.use("/units", unitRoutes);
app.use("/complaints", complaintRoutes);
app.use("/upload", uploadRoutes);
app.use("/caretaker", caretakerRoutes);
app.use("/landlord", landlordRoutes);
app.use("/landlord/payment-settings", paymentSettingsRoutes);
app.use("/landlord/settings", landlordSettingsRoutes);
app.use("/landlord/payments", landlordPaymentRoutes);
app.use("/messages", messageRoutes);
app.use("/notifications", notificationRoutes);
app.use("/announcements", announcementRoutes);
app.use("/reports", reportRoutes);
app.use("/landlord/caretakers", landlordCaretakerRoutes);
app.use("/billing", billingRoutes);

app.get("/uploads/maintenance/:filename", (req, res) => {
  const filePath = path.join(__dirname, '..', 'uploads', 'maintenance', req.params.filename);
  
  if (require('fs').existsSync(filePath)) {
    console.log(`Serving file: ${filePath}`);
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: "Image not found" });
  }
});

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    await pool.query("SELECT 1");
    console.log("Database connected successfully");
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
}

startServer();
