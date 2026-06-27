const crypto = require("crypto");

function generateTempPassword() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

function generateResetCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = { generateTempPassword, generateResetCode };
