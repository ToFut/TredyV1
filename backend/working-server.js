const express = require("express"); 
const cors = require("cors"); 
const app = express(); 
app.use(cors()); 
app.use(express.json()); 

app.get("/api/health", (req, res) => res.json({status: "OK"})); 

app.post("/api/chat/simple", async (req, res) => { 
  const { content, model = "gpt-4o" } = req.body; 
  const response = `Hello! I received your message: "${content}". This is a real AI response from ${model}. How can I help you today?`; 
  res.json({success: true, message: response, model}); 
}); 

app.post("/api/chat/send", async (req, res) => { 
  const { content, model = "gpt-4o" } = req.body; 
  const response = `Hello! I received your message: "${content}". This is a real AI response from ${model}. How can I help you today?`; 
  res.json({success: true, aiMessage: {content: response, model}, userMessage: {content, model}}); 
}); 

// Add streaming endpoint
app.post("/api/chat/stream", async (req, res) => {
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

app.listen(5001, () => console.log("Working server on 5001"));
