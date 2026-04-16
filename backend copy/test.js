// test-password.js
import { hash, compare } from 'bcryptjs';

async function testPassword() {
  // The password you're trying
  const plainPassword = "Landlord@2024";
  
  // The hash from your database
  const storedHash = "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeH3nE7PO";
  
  // Generate a new hash
  const newHash = await hash(plainPassword, 12);
  
  console.log('Plain password:', plainPassword);
  console.log('Stored hash:   ', storedHash);
  console.log('New hash:       ', newHash);
  
  // Test comparison
  const match = await compare(plainPassword, storedHash);
  console.log('Password match? ', match);
  
  // Test with new hash
  const matchNew = await compare(plainPassword, newHash);
  console.log('New hash match? ', matchNew);
}

testPassword();