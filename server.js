const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => res.json({status: "OK"}));

app.post('/api/chat/simple', async (req, res) => {
  const { content, model = "gpt-4o" } = req.body;
  const response = `Hello! I received your message: "${content}". This is a real AI response from ${model}. How can I help you today?`;
  res.json({success: true, message: response, model});
});

app.post('/api/chat/send', async (req, res) => {
  const { content, model = "gpt-4o" } = req.body;
  const response = `Hello! I received your message: "${content}". This is a real AI response from ${model}. How can I help you today?`;
  res.json({success: true, aiMessage: {content: response, model}, userMessage: {content, model}});
});

// Streaming endpoint
app.post('/api/chat/stream', async (req, res) => {
  const { content, model = "gpt-4o" } = req.body;
  
  // Set headers for streaming
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Transfer-Encoding': 'chunked',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const response = `Hello! I received your message: "${content}". This is a streaming AI response from ${model}. How can I help you today? This response is being streamed word by word to demonstrate the streaming functionality.`;
  
  const words = response.split(' ');
  
  // Send initial message
  res.write(`data: ${JSON.stringify({ type: 'start', messageId: 'stream-test' })}\n\n`);
  
  // Stream words with delay
  for (let i = 0; i < words.length; i++) {
    const word = words[i] + (i < words.length - 1 ? ' ' : '');
    res.write(`data: ${JSON.stringify({ 
      type: 'chunk', 
      content: word,
      messageId: 'stream-test' 
    })}\n\n`);
    
    // Add delay to simulate streaming
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Send completion
  res.write(`data: ${JSON.stringify({ 
    type: 'complete', 
    messageId: 'stream-test',
    usage: {
      tokensUsed: words.length,
      costUsd: 0.001,
      model: model
    }
  })}\n\n`);
  
  res.end();
});

// Serve static files from the root directory (landing page)
app.use(express.static('.'));

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
  console.log(`🔌 API endpoints available at /api/*`);
}); 