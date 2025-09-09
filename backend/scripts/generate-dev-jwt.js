const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate a secure development secret if not provided
const DEV_JWT_SECRET = crypto.randomBytes(64).toString('hex');

// Get wallet address from command line argument
const walletAddress = process.argv[2];

if (!walletAddress) {
  console.log('\nError: Please provide your wallet address as an argument');
  console.log('Usage: node generate-dev-jwt.js YOUR_WALLET_ADDRESS');
  console.log('Example: node generate-dev-jwt.js GBLTXF4ZVSQXQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ');
  process.exit(1);
}

// Configuration
const JWT_EXPIRES_IN = '30d'; // Longer expiration for development

// Generate token
const tokenData = {
  walletAddress: walletAddress,
  userId: `dev-${walletAddress.substring(0, 8)}`, // Create a deterministic userId
  role: 'admin', // Give admin role for development
  permissions: ['all'] // Full permissions for development
};

const token = jwt.sign(tokenData, DEV_JWT_SECRET, {
  expiresIn: JWT_EXPIRES_IN
});

console.log('\n=== Development JWT Configuration ===');
console.log('\nAdd this to your backend/.env.development file:');
console.log('JWT_SECRET="' + DEV_JWT_SECRET + '"');

console.log('\n=== Your Development JWT Token ===');
console.log('\nToken:', token);
console.log('\nDecoded token payload:', jwt.decode(token));
console.log('\nUse this token in your Authorization header like this:');
console.log('Authorization: Bearer', token);
console.log('\nToken will expire in 30 days');

console.log('\n=== Important Notes ===');
console.log('1. Share the JWT_SECRET with your team to use in their .env.development');
console.log('2. Each dev should generate their own token using their wallet address');
console.log('3. This is for DEVELOPMENT only - never use in production!');
console.log('4. Token includes admin role and full permissions for development\n');
