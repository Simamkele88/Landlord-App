// generate-hash.js
const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = "Wekeza2004@";
  
  // Generate hash with 12 rounds
  const hash = await bcrypt.hash(password, 12);
  
  console.log('\n🔐 Password Hash Generated:');
  console.log('==========================');
  console.log('Password:', password);
  console.log('Hash:    ', hash);
  console.log('==========================\n');
  
  // Verify it works
  const isValid = await bcrypt.compare(password, hash);
  console.log('✅ Verification test:', isValid ? 'PASSED' : 'FAILED');
  console.log('\n📋 SQL Update Query:');
  console.log(`UPDATE landlords SET password_hash = '${hash}' WHERE email = 'john.smith@rentpay.com';`);
}

generateHash();