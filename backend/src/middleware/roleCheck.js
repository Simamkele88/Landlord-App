function requireLandlord(req, res, next) {
  if (req.userRole !== "landlord") {
    return res.status(403).json({ error: "Access denied. Landlord only." });
  }
  next();
}

function requireCaretaker(req, res, next) {
  if (!["landlord", "caretaker"].includes(req.userRole)) {
    return res.status(403).json({ error: "Access denied. Caretaker or Landlord only." });
  }
  next();
}

function requireTenant(req, res, next) {
  if (req.userRole !== "tenant") {
    return res.status(403).json({ error: "Access denied. Tenant only." });
  }
  next();
}

module.exports = { requireLandlord, requireCaretaker, requireTenant };
