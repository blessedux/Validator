const jwt = require('jsonwebtoken');

// Configuration
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production'; // Development secret
const JWT_EXPIRES_IN = '7d';

// Test user data
const testData = {
  walletAddress: 'GBLTXF4ZVSQXQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ', // Example Stellar address
  userId: 'test-user-123'
};

// Generate token
const token = jwt.sign(testData, JWT_SECRET, {
  expiresIn: JWT_EXPIRES_IN
});

console.log('\nTest JWT Token Generated:');
console.log('=======================');
console.log('\nToken:', token);
console.log('\nDecoded token payload:', jwt.decode(token));
console.log('\nUse this token in your Authorization header like this:');
console.log('Authorization: Bearer', token);
console.log('\nToken will expire in 7 days');
