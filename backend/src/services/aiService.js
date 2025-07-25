const OpenAI = require('openai');
const winston = require('winston');
const Message = require('../models/Message');
const Thread = require('../models/Thread');

// Initialize OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AIService {
  constructor() {
    this.defaultModel = 'gpt-4o';
    this.maxTokens = 4000;
    this.temperature = 0.7;
    this.maxContextMessages = 10; // Limit context to reduce costs
    this.maxContextTokens = 6000; // Token limit for context
  }

  async generateResponse(content, threadId = null, model = null, conversationId = null, displayModel = null) {
    try {
      const selectedModel = model || this.defaultModel;
      
      // Detect content type based on model and user request
      const contentType = this.detectContentType(content, selectedModel, displayModel);
      console.log(`🔍 Content Type Detection: content="${content}", model="${selectedModel}", detected="${contentType}"`);
      
      // Build context from conversation history
      let contextMessages = [];
      let totalContextTokens = 0;
      
      if (conversationId) {
        try {
          // Fetch recent conversation messages
          const recentMessages = await Message.findByConversation(conversationId, {
            limit: this.maxContextMessages,
            offset: 0,
            threadId: threadId || null
          });

          // Build context with smart token management
          for (const msg of recentMessages.reverse()) { // Start from oldest
            const messageTokens = this.estimateTokens(msg.content);
            
            // Check if adding this message would exceed token limit
            if (totalContextTokens + messageTokens > this.maxContextTokens) {
              break;
            }
            
            contextMessages.push({
              role: msg.messageType === 'user' ? 'user' : 'assistant',
              content: msg.content
            });
            
            totalContextTokens += messageTokens;
          }
        } catch (error) {
          // If database is not available, continue without context
          console.log('Database not available, proceeding without context');
        }
      }

      // Build the complete message array with content type specific prompts
      const systemPrompt = this.getSystemPromptForContentType(contentType, selectedModel);
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        ...contextMessages,
        {
          role: 'user',
          content: content
        }
      ];

      // Check if we have a valid API key
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key is required');
      }

      const completion = await openai.chat.completions.create({
        model: selectedModel,
        messages: messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

      const aiMessage = completion.choices[0].message.content;
      const tokensUsed = completion.usage.total_tokens;
      const costUsd = this.calculateCost(tokensUsed, selectedModel);

      return {
        message: {
          content: aiMessage,
          model: selectedModel,
          threadId,
          conversationId,
          messageType: 'ai',
          timestamp: new Date(),
          contentType: contentType
        },
        tokensUsed,
        costUsd,
        model: selectedModel,
        contextUsed: {
          messagesCount: contextMessages.length,
          tokensUsed: totalContextTokens
        }
      };

    } catch (error) {
      winston.error('Error generating AI response:', error);
      
      // Fallback response if OpenAI fails
      return {
        message: {
          content: `I apologize, but I'm having trouble connecting to my AI service right now. Please try again in a moment. (Error: ${error.message})`,
          model: model || this.defaultModel,
          threadId,
          conversationId,
          messageType: 'ai',
          timestamp: new Date(),
          contentType: 'text'
        },
        tokensUsed: 0,
        costUsd: 0,
        model: model || this.defaultModel
      };
    }
  }

  async generateStreamingResponse(content, threadId = null, model = null, conversationId = null) {
    try {
      const selectedModel = model || this.defaultModel;
      
      // Detect content type for appropriate response
      const contentType = this.detectContentType(content, selectedModel);
      
      // Build context from conversation history
      let contextMessages = [];
      let totalContextTokens = 0;
      
      if (conversationId) {
        try {
          // Fetch recent conversation messages
          const recentMessages = await Message.findByConversation(conversationId, {
            limit: this.maxContextMessages,
            offset: 0,
            threadId: threadId || null
          });

          // Build context with smart token management
          for (const msg of recentMessages.reverse()) { // Start from oldest
            const messageTokens = this.estimateTokens(msg.content);
            
            // Check if adding this message would exceed token limit
            if (totalContextTokens + messageTokens > this.maxContextTokens) {
              break;
            }
            
            contextMessages.push({
              role: msg.messageType === 'user' ? 'user' : 'assistant',
              content: msg.content
            });
            
            totalContextTokens += messageTokens;
          }
          
          // If this is a thread, also include parent thread context
          if (threadId) {
            try {
              // Get thread information to understand the context
              const thread = await Thread.findById(threadId);
              if (thread && thread.parentMessageId) {
                // Get the parent message that created this thread
                const parentMessage = await Message.findById(thread.parentMessageId);
                if (parentMessage) {
                  // Add parent message context
                  const parentContext = `[Thread Context: This conversation is about "${parentMessage.content}". Please refer to this context when responding.]`;
                  contextMessages.unshift({
                    role: 'system',
                    content: parentContext
                  });
                  console.log('Injected thread context system message:', parentContext);
                } else {
                  console.log('Parent message not found for thread:', threadId);
                }
              } else {
                console.log('Thread or parentMessageId not found for thread:', threadId);
              }
            } catch (threadError) {
              console.log('Could not fetch thread context:', threadError.message);
            }
          }
        } catch (error) {
          // If database is not available, continue without context
          console.log('Database not available, proceeding without context');
        }
      }

      // Check if we have a valid API key
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key is required');
      }

      // Build the complete message array with content type specific prompts
      const systemPrompt = this.getSystemPromptForContentType(contentType, selectedModel);
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        ...contextMessages,
        {
          role: 'user',
          content: content
        }
      ];

      // Create streaming completion
      try {
        const stream = await openai.chat.completions.create({
          model: selectedModel,
          messages: messages,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          stream: true
        });

        return stream;
      } catch (apiError) {
        // If API key is invalid, provide a helpful mock response
        if (apiError.status === 401) {
          console.log('API key invalid, providing mock streaming response for testing');
          
          const mockResponses = {
            'code': `\`\`\`javascript
// Here's a sample function for you
function greet(name) {
  return \`Hello, \${name}! Welcome to our AI chat system.\`;
}

// Example usage
console.log(greet('User')); // Output: Hello, User! Welcome to our AI chat system.
\`\`\`

This is a mock response since the API key appears to be invalid. Please update your OpenAI API key to get real AI responses.`,
            'video': `🎬 **Mock Video Script Response**

**Note:** This is a mock response because the API key is invalid.

**Opening Scene (0:00-0:15)**
- Welcome message
- Introduction to the topic

**Main Content (0:15-1:00)**
- Key points and insights
- Visual examples and demonstrations

**Call to Action (1:00-1:15)**
- Summary and next steps

*Please update your OpenAI API key to get real AI-generated content.*`,
            'audio': `🎵 **Mock Audio Response**

**Note:** This is a mock response because the API key is invalid.

**Episode Title:** "Getting Started with AI"

**Content Overview:**
- Introduction to AI concepts
- Practical applications
- Future possibilities

*Please update your OpenAI API key to get real AI-generated audio content.*`,
            'visualization': `📊 **Mock Data Visualization**

**Note:** This is a mock response because the API key is invalid.

**Chart Type:** Sample data visualization
**Data:** Example dataset
**Insights:** Sample analysis

*Please update your OpenAI API key to get real AI-generated visualizations.*`,
            'table': `📋 **Mock Table Response**

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |

*Please update your OpenAI API key to get real AI-generated tables.*`,
            'text': `Hello! I'd be happy to help you with that. This is a mock response because the API key appears to be invalid or expired.

**To get real AI responses:**
1. Check your OpenAI API key
2. Make sure it's valid and not expired
3. Update the key in your .env file
4. Restart the backend server

The system is working correctly, but needs a valid API key for real AI interactions.`
          };

          const mockResponse = mockResponses[contentType] || mockResponses['text'];
          
          // Create a mock streaming response
          const self = this;
          const mockStream = {
            async *[Symbol.asyncIterator]() {
              const words = mockResponse.split(' ');
              for (let i = 0; i < words.length; i++) {
                yield {
                  choices: [{
                    delta: {
                      content: words[i] + (i < words.length - 1 ? ' ' : '')
                    }
                  }]
                };
                // Simulate streaming delay
                await new Promise(resolve => setTimeout(resolve, 30));
              }
              // Add usage info
              yield {
                usage: {
                  total_tokens: self.estimateTokens(mockResponse),
                  prompt_tokens: self.estimateTokens(content),
                  completion_tokens: self.estimateTokens(mockResponse)
                }
              };
            }
          };

          return mockStream;
        }
        
        // Re-throw other errors
        throw apiError;
      }

    } catch (error) {
      winston.error('Error generating streaming AI response:', error);
      throw error;
    }
  }

  // Estimate token count (rough approximation)
  estimateTokens(text) {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  // Smart context summarization for very long conversations
  async generateContextSummary(messages, conversationId) {
    try {
      if (messages.length <= 5) {
        return messages; // No need to summarize short conversations
      }

      const summaryPrompt = `Summarize the key points from this conversation in 2-3 sentences, focusing on the main topics and decisions made. Keep it concise but informative.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Use cheaper model for summarization
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that creates concise conversation summaries.'
          },
          {
            role: 'user',
            content: summaryPrompt
          }
        ],
        max_tokens: 200,
        temperature: 0.3,
      });

      const summary = completion.choices[0].message.content;
      
      // Return summary + recent messages
      return [
        {
          role: 'system',
          content: `Previous conversation summary: ${summary}`
        },
        ...messages.slice(-3) // Keep last 3 messages for immediate context
      ];

    } catch (error) {
      winston.error('Error generating context summary:', error);
      return messages.slice(-5); // Fallback: just keep last 5 messages
    }
  }

  async generateThreadSuggestions(userMessage, aiResponse, threadId = null, conversationId = null) {
    try {
      const prompt = `Based on this conversation:
User: ${userMessage}
AI: ${aiResponse}

Generate 3-5 relevant discussion thread suggestions. Each should be a specific question or topic that could be explored further. Format as JSON array of strings.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Use cheaper model for suggestions
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates relevant discussion thread suggestions. Return only valid JSON arrays.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.8,
      });

      const suggestionsText = completion.choices[0].message.content;
      
      // Try to parse JSON, fallback to simple array if parsing fails
      try {
        const suggestions = JSON.parse(suggestionsText);
        return Array.isArray(suggestions) ? suggestions : [];
      } catch (parseError) {
        // Fallback: extract suggestions from text
        const lines = suggestionsText.split('\n').filter(line => line.trim().length > 0);
        return lines.slice(0, 5);
      }

    } catch (error) {
      winston.error('Error generating thread suggestions:', error);
      
      // Fallback suggestions
      return [
        'What are practical examples of this concept?',
        'How does this compare to alternatives?',
        'What challenges might arise with this approach?',
        'Can you break this down step-by-step?'
      ];
    }
  }

  async generateContent(prompt, contentType, threadId = null) {
    try {
      let systemPrompt = '';
      
      switch (contentType) {
        case 'code':
          systemPrompt = 'You are a coding expert. Provide clear, well-commented code examples.';
          break;
        case 'video':
          systemPrompt = 'You are a video content creator. Provide detailed video script outlines.';
          break;
        case 'audio':
          systemPrompt = 'You are an audio content creator. Provide podcast or audio script outlines.';
          break;
        case 'research':
          systemPrompt = 'You are a research assistant. Provide comprehensive research summaries and analysis.';
          break;
        case 'presentation':
          systemPrompt = 'You are a presentation expert. Provide slide outlines and talking points.';
          break;
        default:
          systemPrompt = 'You are a helpful content creator.';
      }

      const completion = await openai.chat.completions.create({
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

      return {
        content: completion.choices[0].message.content,
        contentType,
        model: this.defaultModel,
        tokensUsed: completion.usage.total_tokens,
        costUsd: this.calculateCost(completion.usage.total_tokens, this.defaultModel)
      };

    } catch (error) {
      winston.error('Error generating content:', error);
      throw new Error(`Failed to generate ${contentType} content: ${error.message}`);
    }
  }

  calculateCost(tokens, model) {
    // Approximate cost calculation (prices may vary)
    const costPer1kTokens = {
      'gpt-4o': 0.005,
      'gpt-4o-mini': 0.00015,
      'gpt-4': 0.03,
      'gpt-3.5-turbo': 0.002
    };

    const baseCost = costPer1kTokens[model] || costPer1kTokens['gpt-4o'];
    return (tokens / 1000) * baseCost;
  }

  async validateAPIKey() {
    try {
      await openai.models.list();
      return true;
    } catch (error) {
      winston.error('OpenAI API key validation failed:', error);
      return false;
    }
  }

  // Detect content type based on model and user request
  detectContentType(content, model, displayModel = null) {
    const lowerContent = (content || '').toLowerCase();
    const lowerModel = (model || '').toLowerCase();
    
    // Model-specific content types (check for display names that might be passed)
    if (lowerModel.includes('code') || lowerModel.includes('claude-code') || lowerModel.includes('gemini-code') || 
        (displayModel && displayModel.toLowerCase && displayModel.toLowerCase().includes('code'))) {
      return 'code';
    }
    
    if (lowerModel.includes('sora') || lowerModel.includes('veo') || 
        (displayModel && displayModel.toLowerCase && displayModel.toLowerCase().includes('sora'))) {
      return 'video';
    }
    
    // Content-based detection
    if (lowerContent.includes('generate video') || lowerContent.includes('create video') || 
        lowerContent.includes('video of') || lowerContent.includes('video script') ||
        lowerContent.includes('🎥') || lowerContent.includes('script')) {
      return 'video';
    }
    
    if (lowerContent.includes('generate audio') || lowerContent.includes('create audio') || 
        lowerContent.includes('audio of') || lowerContent.includes('🎵')) {
      return 'audio';
    }
    
    if (lowerContent.includes('write code') || lowerContent.includes('create code') || 
        lowerContent.includes('program') || lowerContent.includes('function') || 
        lowerContent.includes('```') || lowerContent.includes('💻')) {
      return 'code';
    }
    
    if (lowerContent.includes('create chart') || lowerContent.includes('visualize') || 
        lowerContent.includes('graph') || lowerContent.includes('📊')) {
      return 'visualization';
    }
    
    if (lowerContent.includes('create table') || lowerContent.includes('organize data') || 
        lowerContent.includes('📋')) {
      return 'table';
    }
    
    return 'text';
  }

  // Get system prompt based on content type
  getSystemPromptForContentType(contentType, model) {
    switch (contentType) {
      case 'code':
        return `You are an expert programmer. Provide clean, well-commented code with explanations. Always format code blocks properly and include language-specific syntax highlighting.`;
      
      case 'video':
        return `You are a video content creator. Describe video scenes, scripts, and visual elements. Include 🎥 emoji and detailed visual descriptions.`;
      
      case 'audio':
        return `You are an audio content creator. Describe audio content, scripts, and sound elements. Include 🎵 emoji and detailed audio descriptions.`;
      
      case 'visualization':
        return `You are a data visualization expert. Create charts, graphs, and visual representations. Include 📊 emoji and detailed visual descriptions.`;
      
      case 'table':
        return `You are a data organization expert. Create structured tables and organized data formats. Include 📋 emoji and clear data presentation.`;
      
      default:
        return 'You are a helpful AI assistant. Provide clear, informative responses and maintain context from the conversation. If the user asks for clarification or references previous messages, respond appropriately.';
    }
  }
}

module.exports = new AIService(); 