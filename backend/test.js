const bcrypt = require("bcrypt");

const password = "Koketso#"; // Replace with the password you want to hash
const saltRounds = 12;

async function hashPassword() {
  try {
    const hash = await bcrypt.hash(password, saltRounds);

    console.log("Password:");
    console.log(password);

    console.log("\nHashed Password:");
    console.log(hash);
  } catch (err) {
    console.error("Error hashing password:", err);
  }
}

hashPassword();