import OpenAI from 'openai';

// Initialize OpenAI client with better error handling
let openai;

try {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    console.warn('OpenAI API key not configured. Using fallback responses.');
    openai = null;
  } else {
    openai = new OpenAI({
      apiKey: apiKey.trim(),
      dangerouslyAllowBrowser: true // Only for development
    });
  }
} catch (error) {
  console.error('Error initializing OpenAI:', error);
  openai = null;
}

// ChatGPT API Service
export class ChatGPTService {
  constructor() {
    this.conversationHistory = new Map(); // Store conversation history per thread
  }

  // Generate AI response using real ChatGPT
  async generateResponse(userMessage, threadId = null, model = 'gpt-4') {
    try {
      // Check if OpenAI is available
      if (!openai) {
        throw new Error('OpenAI not configured');
      }

      // Get conversation history for this thread
      const history = this.conversationHistory.get(threadId) || [];
      
      // Prepare messages for ChatGPT
      const messages = [
        {
          role: 'system',
          content: `You are FlowChat, an intelligent AI assistant that helps users explore ideas through threaded conversations. 
          
          Your role:
          - Provide thoughtful, helpful responses
          - Suggest related topics for deeper exploration
          - Help users create focused threads from specific parts of your responses
          - Maintain context across conversation threads
          - Encourage creative thinking and exploration
          
          Current thread: ${threadId ? `Thread #${threadId.slice(-4)}` : 'Main conversation'}
          
          Be conversational, engaging, and always ready to help users dive deeper into topics.`
        },
        ...history,
        {
          role: 'user',
          content: userMessage
        }
      ];

      // Call ChatGPT API
      const completion = await openai.chat.completions.create({
        model: model,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const aiResponse = completion.choices[0].message.content;

      // Update conversation history
      const newHistory = [
        ...history,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: aiResponse }
      ];
      
      // Keep only last 10 messages to manage context length
      if (newHistory.length > 10) {
        newHistory.splice(0, 2); // Remove oldest user/assistant pair
      }
      
      this.conversationHistory.set(threadId, newHistory);

      return aiResponse;

    } catch (error) {
      console.error('ChatGPT API Error:', error);
      
      // Fallback response if API fails
      return `I apologize, but I'm having trouble connecting to my AI services right now. Here's what I can suggest based on your message: "${userMessage}"

      Please try again in a moment, or check your internet connection.`;
    }
  }

  // Generate thread suggestions
  async generateThreadSuggestions(userMessage, aiResponse, threadId = null) {
    try {
      if (!openai) {
        throw new Error('OpenAI not configured');
      }

      const prompt = `Based on this conversation:
      
      User: "${userMessage}"
      AI: "${aiResponse}"
      
      Suggest 3-5 specific topics that could be explored in separate threads. Each suggestion should be:
      - Specific and focused
      - Interesting and valuable
      - Different from the main conversation
      
      Format as a JSON array of strings.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.8
      });

      const suggestions = completion.choices[0].message.content;
      
      // Try to parse JSON, fallback to simple parsing
      try {
        return JSON.parse(suggestions);
      } catch {
        // Fallback: extract suggestions from text
        return suggestions.split('\n').filter(s => s.trim().length > 0).slice(0, 5);
      }

    } catch (error) {
      console.error('Thread suggestions error:', error);
      return [
        'Explore this topic deeper',
        'Related concepts',
        'Practical applications',
        'Common questions',
        'Advanced insights'
      ];
    }
  }

  // Generate content (code, video script, research, etc.)
  async generateContent(prompt, contentType, threadId = null) {
    try {
      if (!openai) {
        throw new Error('OpenAI not configured');
      }

      let systemPrompt = '';
      
      switch (contentType) {
        case 'code':
          systemPrompt = `You are an expert programmer. Generate clean, working code based on the user's request. Include comments and explanations.`;
          break;
        case 'video':
          systemPrompt = `You are a video script writer. Create an engaging video script that explains the topic clearly and entertainingly.`;
          break;
        case 'audio':
          systemPrompt = `You are an audio content creator. Write a script for an audio explanation that's clear and engaging.`;
          break;
        case 'research':
          systemPrompt = `You are a research analyst. Create a comprehensive research summary with key insights and findings.`;
          break;
        case 'presentation':
          systemPrompt = `You are a presentation expert. Create slides content that's engaging and informative.`;
          break;
        default:
          systemPrompt = `You are a content creator. Generate high-quality content based on the user's request.`;
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.7
      });

      return completion.choices[0].message.content;

    } catch (error) {
      console.error('Content generation error:', error);
      return `I apologize, but I'm having trouble generating ${contentType} content right now. Please try again later.`;
    }
  }

  // Clear conversation history for a thread
  clearHistory(threadId) {
    this.conversationHistory.delete(threadId);
  }

  // Get conversation history
  getHistory(threadId) {
    return this.conversationHistory.get(threadId) || [];
  }

  // Check if OpenAI is configured
  isConfigured() {
    return openai !== null;
  }
}

// Export singleton instance
export const chatGPTService = new ChatGPTService(); 