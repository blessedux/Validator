const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { spawn } = require('child_process');

const app = express();
const PORT = 5556;
const STUDIO_PORT = 5555;

// Basic auth middleware
const basicAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  
  if (!auth || !auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="DB Studio"');
    return res.status(401).send('Authentication required');
  }
  
  const credentials = Buffer.from(auth.slice(6), 'base64').toString();
  const [username, password] = credentials.split(':');
  
  // Use environment variables for security
  const STUDIO_USERNAME = process.env.STUDIO_USERNAME || 'admin';
  const STUDIO_PASSWORD = process.env.STUDIO_PASSWORD || 'secure-' + Math.random().toString(36).substring(2, 15);
  
  if (username === STUDIO_USERNAME && password === STUDIO_PASSWORD) {
    next();
  } else {
    res.setHeader('WWW-Authenticate', 'Basic realm="DB Studio"');
    res.status(401).send('Invalid credentials');
  }
};

app.use(basicAuth);

// Proxy to Prisma Studio
app.use('/', createProxyMiddleware({
  target: `http://localhost:${STUDIO_PORT}`,
  changeOrigin: true,
  ws: true
}));

// Start Prisma Studio
console.log('🚀 Starting Prisma Studio...');
const studioProcess = spawn('npx', ['prisma', 'studio', '--port', STUDIO_PORT], {
  stdio: 'inherit'
});

// Start proxy server
app.listen(PORT, () => {
  const username = process.env.STUDIO_USERNAME || 'admin';
  const password = process.env.STUDIO_PASSWORD || 'secure-' + Math.random().toString(36).substring(2, 15);
  
  console.log(`🔒 Authenticated DB Studio available at: http://localhost:${PORT}`);
  console.log(`📊 Username: ${username} | Password: ${password}`);
  console.log(`💡 Set STUDIO_USERNAME and STUDIO_PASSWORD env vars for custom credentials`);
});

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  studioProcess.kill();
  process.exit();
}); 