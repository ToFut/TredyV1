const OpenAI = require('openai');
const winston = require('winston');
const Message = require('../models/Message');

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

  async generateResponse(content, threadId = null, model = null, conversationId = null) {
    try {
      const selectedModel = model || this.defaultModel;
      
      // Build context from conversation history
      let contextMessages = [];
      let totalContextTokens = 0;
      
      if (conversationId) {
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
      }

      // Build the complete message array
      const messages = [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. Provide clear, informative responses and maintain context from the conversation. If the user asks for clarification or references previous messages, respond appropriately.'
        },
        ...contextMessages,
        {
          role: 'user',
          content: content
        }
      ];

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
          timestamp: new Date()
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
          timestamp: new Date()
        },
        tokensUsed: 0,
        costUsd: 0,
        model: model || this.defaultModel
      };
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
}

module.exports = new AIService(); 