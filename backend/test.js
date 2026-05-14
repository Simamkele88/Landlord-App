
const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = "Wekeza2004@";
  
  // Generate hash with 12 rounds
  const hash = await bcrypt.hash(password, 12);

  console.log('Password:', password);
  console.log('Hash:    ', hash);
  
  // Verify it works
  const isValid = await bcrypt.compare(password, hash);
  console.log(' Verification test:', isValid ? 'PASSED' : 'FAILED');
}

generateHash();