const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
require('dotenv').config();

const app = express();

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Proxy API requests to the backend
app.use('/api', createProxyMiddleware({
  target: process.env.BACKEND_URL || 'http://localhost:5001',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Backend service unavailable' });
  }
}));

// Proxy health check to backend
app.use('/health', createProxyMiddleware({
  target: process.env.BACKEND_URL || 'http://localhost:5001',
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Health check proxy error:', err);
    res.status(500).json({ error: 'Backend service unavailable' });
  }
}));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Landing page: http://localhost:${PORT}`);
  console.log(`💬 FlowChat app: http://localhost:${PORT}/flowchat`);
});

module.exports = app; 