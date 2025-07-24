const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from the root directory (landing page)
app.use(express.static('.'));

// Proxy /flowchat requests to the React development server
app.use('/flowchat', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  pathRewrite: {
    '^/flowchat': '/'
  }
}));

// Serve the landing page at the root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle React routing - serve index.html for any unmatched routes
app.get('/flowchat/*', (req, res) => {
  res.redirect('/flowchat');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Landing page: http://localhost:${PORT}`);
  console.log(`💬 FlowChat app: http://localhost:${PORT}/flowchat`);
}); 