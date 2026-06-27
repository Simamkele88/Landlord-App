const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersunique_and_880409_jwt_secret_keyecretkey_";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

function generateToken(userId, role) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

module.exports = { JWT_SECRET, JWT_EXPIRES_IN, generateToken };
