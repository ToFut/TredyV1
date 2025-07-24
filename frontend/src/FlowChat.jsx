import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  Plus, 
  Send, 
  Settings, 
  ChevronRight, 
  Menu, 
  X, 
  Check, 
  Mail, 
  Download,
  Eye,
  EyeOff,
  Zap,
  GitBranch,
  Clock,
  Play,
  BarChart3,
  FileText,
  Code,
  MoreHorizontal,
  ArrowLeft,
  Lightbulb,
  Users,
  Minimize2,
  Maximize2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Target,
  Share2,
  TreePine,
  Bookmark,
  Brain
} from 'lucide-react';
import { chatAPI } from './services/api';
import { isAPIConfigured } from './config/api';

// --- FULL FlowChat COMPONENT IMPLEMENTATION ---

const FlowChat = () => {
    // Core State Management
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [threads, setThreads] = useState([]);
    const [draftText, setDraftText] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [viewMode, setViewMode] = useState('chat');
    const [currentView, setCurrentView] = useState('main');
    const [navigationHistory, setNavigationHistory] = useState(['main']);
    const [suggestedQuestions, setSuggestedQuestions] = useState([]);
    const [currentModel, setCurrentModel] = useState('GPT-4');
    const [breadcrumbs, setBreadcrumbs] = useState([{ label: 'Main Chat', id: 'main' }]);
    const [isTyping, setIsTyping] = useState(false);
    
    // Advanced Threading States
    const [selectedText, setSelectedText] = useState('');
    const [selectionContext, setSelectionContext] = useState(null);
    const [threadDropdowns, setThreadDropdowns] = useState({});
    const [suggestedThreads, setSuggestedThreads] = useState({});
    const [threadHierarchy, setThreadHierarchy] = useState({});
    const [hoveredThread, setHoveredThread] = useState(null);
    
    // UX Improvement States
    const [showOnboarding, setShowOnboarding] = useState(true);
    const [onboardingStep, setOnboardingStep] = useState(0);
    const [collapsedThreads, setCollapsedThreads] = useState(new Set());
    const [compactMode, setCompactMode] = useState(false);
    const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
    
    // Collaboration States
    const [collaborators, setCollaborators] = useState([]);
    const [activeUsers, setActiveUsers] = useState([]);
    const [inviteModal, setInviteModal] = useState(false);
    const [currentInviteThread, setCurrentInviteThread] = useState(null);
    const [permissions, setPermissions] = useState({});
    
    // --- Add state for export outcome modal ---
    const [exportOutcomeModal, setExportOutcomeModal] = useState({ open: false, threadId: null });
    const [outcomeText, setOutcomeText] = useState('');
    const [outcomeModel, setOutcomeModel] = useState(currentModel);
    const [outcomeTarget, setOutcomeTarget] = useState('main');
    
    // Memory and Understanding States
    const [threadMemories, setThreadMemories] = useState({});
    const [userUnderstanding, setUserUnderstanding] = useState({});
    const [memoryModal, setMemoryModal] = useState({ open: false, threadId: null });
    const [groupMemories, setGroupMemories] = useState({});
    const [learningPath, setLearningPath] = useState([]);
    const [knowledgeGaps, setKnowledgeGaps] = useState({});
    const [recommendations, setRecommendations] = useState({});
    
    const chatRef = useRef(null);
  
    // Available Models - Enhanced with advanced AI models
    const availableModels = [
      { id: 'GPT-4', name: 'GPT-4', description: 'Most capable model', color: 'bg-green-100 text-green-800', type: 'text' },
      { id: 'Claude-3.5', name: 'Claude 3.5', description: 'Excellent reasoning', color: 'bg-purple-100 text-purple-800', type: 'text' },
      { id: 'Gemini-Pro', name: 'Gemini Pro', description: 'Fast and efficient', color: 'bg-blue-100 text-blue-800', type: 'text' },
      { id: 'Base-44-API', name: 'Base 44 API', description: 'Advanced reasoning', color: 'bg-orange-100 text-orange-800', type: 'text' },
      { id: 'Claude-Code', name: 'Claude Code', description: 'Code specialist', color: 'bg-indigo-100 text-indigo-800', type: 'code' },
      { id: 'Gemini-Code', name: 'Gemini Code', description: 'Google code model', color: 'bg-teal-100 text-teal-800', type: 'code' },
      { id: 'Sora', name: 'Sora', description: 'Video generation', color: 'bg-pink-100 text-pink-800', type: 'video' },
      { id: 'Veo', name: 'Veo', description: 'Google video model', color: 'bg-red-100 text-red-800', type: 'video' },
      { id: 'Mistral', name: 'Mistral', description: 'Open source power', color: 'bg-yellow-100 text-yellow-800', type: 'text' },
      { id: 'LangChain', name: 'LangChain', description: 'Tool orchestration', color: 'bg-cyan-100 text-cyan-800', type: 'tools' },
      { id: 'AI-Group-Manager', name: 'AI Group Manager', description: 'Manages AI teams', color: 'bg-emerald-100 text-emerald-800', type: 'manager' }
    ];
  
    // Onboarding Steps
    const onboardingSteps = [
      {
        title: "Welcome to FlowChat Next-Gen!",
        description: "Experience advanced threading with text selection, hierarchical discussions, and AI suggestions.",
        highlight: null
      },
      {
        title: "Main Conversation",
        description: "Start conversations here. Every AI response can spawn multiple discussion threads.",
        highlight: "main-chat"
      },
      {
        title: "Advanced Threading",
        description: "Select text to create focused threads, or use the ⚙️ icon for general threads.",
        highlight: "thread-button"
      },
      {
        title: "Thread Hierarchy",
        description: "Navigate between sibling threads, create sub-threads, and explore AI suggestions.",
        highlight: "navigation"
      },
      {
        title: "You're Ready!",
        description: "Start threading conversations and watch your discussions branch into focused explorations.",
        highlight: null
      }
    ];
  
    // Initialize with enhanced sample data
    useEffect(() => {
      const sessionId = '22222222-2222-2222-2222-222222222222'; // Use proper UUID format
      setCurrentSessionId(sessionId);
      setSessions([{ id: sessionId, name: 'New Conversation', createdAt: new Date() }]);
      
      // Sample active users
      setActiveUsers([
        { id: 'user-1', name: 'You', email: 'you@company.com', avatar: '👤', status: 'active', isCurrentUser: true },
        { id: 'user-2', name: 'Sarah Chen', email: 'sarah@company.com', avatar: '👩‍💼', status: 'active', lastSeen: new Date() },
        { id: 'user-3', name: 'Alex Rivera', email: 'alex@company.com', avatar: '👨‍💻', status: 'away', lastSeen: new Date(Date.now() - 300000) }
      ]);
  
      setPermissions({
        'user-1': { canInvite: true, canModerate: true, canExport: true },
        'user-2': { canInvite: true, canModerate: false, canExport: true },
        'user-3': { canInvite: false, canModerate: false, canExport: false }
      });
      
      setMessages([]); // Do not set an initial AI message
  
      // Initialize suggested threads for demo - removed complex suggestions
      setSessions([{ id: sessionId, name: 'New Conversation', createdAt: new Date() }]);
    }, []);
  
    // Core Functions
    const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
    const sendMessage = async (text, threadId = null, model = currentModel) => {
      if (!text.trim()) return;
  
      const userMsg = {
        id: generateId(),
        sessionId: currentSessionId,
        content: text,
        sender: 'user',
        timestamp: new Date(),
        threadId
      };
  
      setMessages(prev => [...prev, userMsg]);
      setDraftText('');
      setIsTyping(true);
  
      // Update thread last active time
      if (threadId) {
        setThreads(prev => prev.map(t => 
          t.id === threadId ? { ...t, lastActiveAt: new Date() } : t
        ));
      }
  
            try {
        // Check if API is configured - temporarily bypass for debugging
        console.log('🔍 isAPIConfigured() result:', isAPIConfigured());
        if (!isAPIConfigured()) {
          console.log('⚠️ API not configured, but continuing anyway for testing');
          // throw new Error('OpenAI API key not configured');
        }

        // Map display names to actual model IDs for the backend
        const modelMapping = {
          'GPT-4': 'gpt-4o',
          'GPT-3.5': 'gpt-3.5-turbo',
          'Claude-3.5': 'claude-3.5-sonnet',
          'Gemini-Pro': 'gemini-pro',
          'Base-44-API': 'gpt-4o',
          'Claude-Code': 'claude-3.5-sonnet',
          'Gemini-Code': 'gemini-pro',
          'Sora': 'gpt-4o',
          'Veo': 'gemini-pro',
          'Mistral': 'gpt-4o',
          'LangChain': 'gpt-4o',
          'AI-Group-Manager': 'gpt-4o'
        };
        
        const actualModelId = modelMapping[model] || 'gpt-4o';
        
        console.log('🔍 Attempting API call with:', {
          content: text,
          conversationId: currentSessionId || '22222222-2222-2222-2222-222222222222',
          threadId: threadId,
          model: model,
          actualModelId: actualModelId
        });

        console.log('🔍 API Base URL:', process.env.REACT_APP_API_URL || 'http://localhost:5001/api');
        console.log('🔍 Full URL being called:', `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/chat/send`);
        console.log('🔍 Environment variable REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
        console.log('🔍 Fallback URL:', 'http://localhost:5001/api');

        // Generate real ChatGPT response using backend API
        const requestData = {
          content: text,
          conversationId: currentSessionId || '22222222-2222-2222-2222-222222222222',
          model: actualModelId
        };
        
        // Only include threadId if it's a valid UUID
        if (threadId && threadId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          requestData.threadId = threadId;
        }
        
        const response = await chatAPI.sendMessage(requestData);

        console.log('✅ API Response received:', response);
        
        const aiMsg = {
          id: generateId(),
          sessionId: currentSessionId,
          content: response.aiMessage.content,
          sender: 'AI',
          model: response.usage.model,
          timestamp: new Date(),
          threadId,
          contextUsed: response.contextUsed || null
        };

        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);

        // Generate thread suggestions
        if (response.suggestions && response.suggestions.length > 0) {
          setSuggestedThreads(prev => ({
            ...prev,
            [aiMsg.id]: response.suggestions
          }));
        }
  
        // Generate suggested threads for AI responses
        if (!threadId) {
          generateSuggestedThreadsForMessage(aiMsg.id, text, aiMsg.content);
        }
        
        // Update memory after AI response
        if (threadId && threadMemories[threadId]) {
          setTimeout(() => {
            generateThreadMemory(threadId);
            // Trigger additional analyses
            analyzeLearningPath();
            identifyKnowledgeGaps();
            generatePersonalizedRecommendations();
          }, 500);
        }
        
        // Auto-scroll
        setTimeout(() => {
          if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
          }
        }, 100);
  
      } catch (error) {
        console.error('❌ ChatGPT API Error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          url: error.config?.url
        });
        
        // Fallback to mock response
        const fallbackResponse = generateAIResponse(text, model, threadId);
        const aiMsg = {
          id: generateId(),
          sessionId: currentSessionId,
          content: fallbackResponse,
          sender: 'AI',
          model,
          timestamp: new Date(),
          threadId
        };
  
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
        
        // Auto-scroll for fallback
        setTimeout(() => {
          if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
          }
        }, 100);
      }
    };
  
    const generateAIResponse = (userText, model, threadId) => {
      const thread = threads.find(t => t.id === threadId);
      const isSubThread = thread && thread.parentThreadId;
      const hasSelectedText = thread && thread.selectedText;
      const isImportantNote = thread && thread.isImportantNote;
      const modelInfo = availableModels.find(m => m.id === model);
      
      // Model-specific response patterns
      const modelResponses = {
        'GPT-4': {
          prefix: '🤖 GPT-4: ',
          style: 'comprehensive and detailed',
          examples: [
            `I'll provide a comprehensive analysis of ${userText.slice(0, 30)}...`,
            `Let me break this down systematically with multiple perspectives...`,
            `This is an interesting challenge that requires careful consideration...`
          ]
        },
        'Claude-3.5': {
          prefix: '🧠 Claude 3.5: ',
          style: 'reasoning-focused',
          examples: [
            `Let me think through this step by step...`,
            `The logical approach here would be to consider...`,
            `This requires careful reasoning about the underlying principles...`
          ]
        },
        'Gemini-Pro': {
          prefix: '🔍 Gemini Pro: ',
          style: 'fast and efficient',
          examples: [
            `Here's a quick but thorough analysis...`,
            `Let me get straight to the key points...`,
            `This can be approached efficiently by focusing on...`
          ]
        },
        'Base-44-API': {
          prefix: '⚡ Base 44 API: ',
          style: 'advanced reasoning',
          examples: [
            `Using advanced reasoning capabilities, I can see that...`,
            `This requires sophisticated analysis beyond surface-level thinking...`,
            `Let me apply advanced problem-solving techniques to...`
          ]
        },
        'Claude-Code': {
          prefix: '💻 Claude Code: ',
          style: 'code-focused',
          examples: [
            `Here's the code implementation for this approach...`,
            `Let me show you the technical solution...`,
            `The code structure would look like this...`
          ]
        },
        'Gemini-Code': {
          prefix: '🔧 Gemini Code: ',
          style: 'Google code model',
          examples: [
            `Here's the Google-optimized code solution...`,
            `Let me implement this using Google's best practices...`,
            `The code architecture follows Google's patterns...`
          ]
        },
        'Sora': {
          prefix: '🎬 Sora: ',
          style: 'video generation',
          examples: [
            `I can create a video visualization of this concept...`,
            `Let me generate a video that demonstrates...`,
            `This would make an excellent video presentation showing...`
          ]
        },
        'Veo': {
          prefix: '📹 Veo: ',
          style: 'Google video model',
          examples: [
            `I'll create a Google Veo video showing this process...`,
            `Let me generate a video using Google's Veo model...`,
            `This concept would be perfect for a Veo video demonstration...`
          ]
        },
        'Mistral': {
          prefix: '🌪️ Mistral: ',
          style: 'open source power',
          examples: [
            `Using open-source AI capabilities, I can help with...`,
            `Let me leverage the power of open-source AI to...`,
            `This is a great application for open-source AI models...`
          ]
        },
        'LangChain': {
          prefix: '🔗 LangChain: ',
          style: 'tool orchestration',
          examples: [
            `I'll orchestrate multiple tools to solve this...`,
            `Let me coordinate different AI tools for this task...`,
            `This requires tool orchestration across multiple AI services...`
          ]
        },
        'AI-Group-Manager': {
          prefix: '👥 AI Group Manager: ',
          style: 'manages AI teams',
          examples: [
            `As your AI team manager, I'll coordinate the best models for this task...`,
            `Let me assemble the right AI team to tackle this challenge...`,
            `I'll manage the AI workflow to ensure optimal results...`
          ]
        }
      };
      
      const modelResponse = modelResponses[model] || modelResponses['GPT-4'];
      const baseResponse = modelResponse.examples[Math.floor(Math.random() * modelResponse.examples.length)];
      
      if (isImportantNote) {
        return `${modelResponse.prefix}📌 **Important Note Saved**: "${thread.selectedText}"\n\nThis has been marked as important for future reference. ${baseResponse} I'll help you explore this topic in detail and ensure we capture all the key insights.`;
      }
      
      if (hasSelectedText) {
        return `${modelResponse.prefix}Excellent focus on "${thread.selectedText}"! ${baseResponse} This specific aspect opens up several interesting directions that we can explore in detail.`;
      }
      
      if (isSubThread) {
        return `${modelResponse.prefix}Building on our parent discussion, this sub-thread lets us explore the deeper implications of ${userText.slice(0, 30)}... ${baseResponse} Sub-threads like this help maintain clarity while exploring complex interconnected topics.`;
      }
      
      if (threadId) {
        return `${modelResponse.prefix}Excellent thread discussion! This focused environment lets us dive deeper into ${userText.slice(0, 20)}... ${baseResponse} Feel free to select specific text to create even more focused sub-discussions!`;
      }
  
      return `${modelResponse.prefix}${baseResponse} This has multiple angles worth exploring. Try selecting specific text to create focused threads, or use the thread button to start broader discussions. I can suggest related topics too!`;
    };
  
    const generateSuggestedThreadsForMessage = (messageId, userText, aiResponse) => {
      // Extract key concepts for suggestions
      const concepts = extractKeyConcepts(userText + ' ' + aiResponse);
      
      const suggestions = [
        {
          text: `What are practical examples of ${concepts[0] || 'this concept'}?`,
          type: 'examples',
          context: concepts[0] || userText.slice(0, 30),
          priority: 'high'
        },
        {
          text: `What challenges might arise with ${concepts[1] || 'this approach'}?`,
          type: 'challenges',
          context: concepts[1] || userText.slice(0, 30),
          priority: 'medium'
        },
        {
          text: `How does ${concepts[0] || 'this'} compare to alternatives?`,
          type: 'comparison',
          context: concepts[0] || userText.slice(0, 30),
          priority: 'medium'
        },
        {
          text: `Can you break down ${concepts[2] || 'this process'} step-by-step?`,
          type: 'breakdown',
          context: concepts[2] || userText.slice(0, 30),
          priority: 'low'
        }
      ];
  
      setSuggestedThreads(prev => ({
        ...prev,
        [messageId]: suggestions
      }));
    };
  
    const extractKeyConcepts = (text) => {
      // Simple concept extraction - in real app would use NLP
      const words = text.toLowerCase().split(' ');
      const concepts = words.filter(word => 
        word.length > 4 && 
        !['that', 'this', 'with', 'from', 'they', 'have', 'been', 'will', 'would', 'could', 'should'].includes(word)
      );
      return concepts.slice(0, 3);
    };
  
    // Advanced Threading Functions
    const openThread = (parentMsgId, selectedText = null, parentThreadId = null, preferredModel = null) => {
      const threadId = generateId();
      
      // Determine the model to use for this thread
      let threadModel = preferredModel || currentModel;
      
      // If this is an AI Group Manager thread, set up special properties
      const isGroupManager = threadModel === 'AI-Group-Manager';
      
      const newThread = {
        id: threadId,
        sessionId: currentSessionId,
        parentMsgId,
        parentThreadId,
        selectedText,
        model: threadModel,
        status: 'active',
        lastActiveAt: new Date(),
        isExpanded: true,
        showInline: true,
        messages: [],
        level: parentThreadId ? (getThreadLevel(parentThreadId) + 1) : 1,
        siblingIndex: getSiblingThreads(parentMsgId, parentThreadId).length,
        createdAt: new Date(),
        highlight: true,
        // AI Group Manager specific properties
        isGroupManager,
        managedModels: isGroupManager ? ['GPT-4', 'Claude-3.5', 'Gemini-Pro'] : [],
        groupStrategy: isGroupManager ? 'collaborative' : null
      };
  
      setThreads(prev => [...prev, newThread]);
      
      // Update thread hierarchy
      setThreadHierarchy(prev => {
        const newHierarchy = { ...prev };
        newHierarchy[threadId] = {
          parent: parentThreadId || parentMsgId,
          children: [],
          siblings: getSiblingThreads(parentMsgId, parentThreadId).map(t => t.id)
        };
  
        // Update parent's children if it's a sub-thread
        if (parentThreadId && newHierarchy[parentThreadId]) {
          newHierarchy[parentThreadId] = {
            ...newHierarchy[parentThreadId],
            children: [...(newHierarchy[parentThreadId].children || []), threadId]
          };
        }
  
        return newHierarchy;
      });
  
      // Generate contextual suggestions for the new thread
      if (selectedText) {
        generateContextualSuggestions(threadId, selectedText, parentMsgId);
      }
      
      // Auto-scroll to new thread
      setTimeout(() => {
        if (chatRef.current) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
      }, 100);
      
      // Optionally, scroll to the new thread summary after a short delay
      setTimeout(() => {
        const el = document.getElementById(`thread-summary-${threadId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
      
      // Remove highlight after a moment
      setTimeout(() => {
        setThreads(prev => prev.map(t => t.id === threadId ? { ...t, highlight: false } : t));
      }, 2000);
    };
  
    const generateContextualSuggestions = (threadId, selectedText, parentMsgId) => {
      const suggestions = [
        {
          text: `How does "${selectedText}" work in practice?`,
          type: 'practical',
          context: selectedText,
          priority: 'high'
        },
        {
          text: `What are alternatives to "${selectedText}"?`,
          type: 'alternatives',
          context: selectedText,
          priority: 'medium'
        },
        {
          text: `What problems does "${selectedText}" solve?`,
          type: 'problems',
          context: selectedText,
          priority: 'medium'
        }
      ];
  
      setSuggestedThreads(prev => ({
        ...prev,
        [threadId]: suggestions
      }));
    };
  
    const createSuggestedThread = (parentMsgId, suggestion, parentThreadId = null, preferredModel = null) => {
      const threadId = generateId();
      
      // Determine the model to use for this thread
      let threadModel = preferredModel || currentModel;
      
      const newThread = {
        id: threadId,
        sessionId: currentSessionId,
        parentMsgId,
        parentThreadId,
        selectedText: null,
        model: threadModel,
        status: 'active',
        lastActiveAt: new Date(),
        isExpanded: true,
        showInline: true,
        messages: [],
        level: parentThreadId ? (getThreadLevel(parentThreadId) + 1) : 1,
        siblingIndex: getSiblingThreads(parentMsgId, parentThreadId).length,
        isSuggested: true,
        suggestionType: suggestion.type,
        createdAt: new Date()
      };
  
      setThreads(prev => [...prev, newThread]);
      
      // Auto-start with the suggested question
      setTimeout(() => {
        sendMessage(suggestion.text, threadId, currentModel);
      }, 300);
    };
  
    const getThreadLevel = (threadId) => {
      const thread = threads.find(t => t.id === threadId);
      return thread ? thread.level : 0;
    };
  
    const getSiblingThreads = (parentMsgId, parentThreadId = null) => {
      return threads.filter(t => 
        t.parentMsgId === parentMsgId && 
        t.parentThreadId === parentThreadId
      ).sort((a, b) => a.createdAt - b.createdAt);
    };
  
    const getChildThreads = (threadId) => {
      return threads.filter(t => t.parentThreadId === threadId);
    };
  
    const getRelatedThreads = (currentThreadId) => {
      const currentThread = threads.find(t => t.id === currentThreadId);
      if (!currentThread) return { siblings: [], children: [], parent: null };
  
      const siblings = getSiblingThreads(currentThread.parentMsgId, currentThread.parentThreadId)
        .filter(t => t.id !== currentThreadId);
      
      const children = getChildThreads(currentThreadId);
      
      const parent = currentThread.parentThreadId ? 
        threads.find(t => t.id === currentThread.parentThreadId) : null;
  
      return { siblings, children, parent };
    };
  
    const handleTextSelection = (messageId, messageContent) => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      // Only set if valid selection
      if (selectedText.replace(/\s|"/g, '').length > 0) {
        setSelectedText(selectedText);
        setSelectionContext({ messageId, messageContent });
        // Set a timeout to auto-clear after 20 seconds
        if (window._threadSelectionTimeout) clearTimeout(window._threadSelectionTimeout);
        window._threadSelectionTimeout = setTimeout(() => {
          setSelectedText('');
          setSelectionContext(null);
        }, 20000);
      }
      // Do NOT clear on empty selection; only clear after thread creation or timeout
    };
  
    const navigateToThread = (threadId) => {
      setCurrentView(threadId);
      setNavigationHistory(prev => [...prev, threadId]);
      
      const thread = threads.find(t => t.id === threadId);
      if (thread) {
        const parentMessage = messages.find(m => m.id === thread.parentMsgId);
        
        // Build breadcrumbs with full hierarchy
        const breadcrumbPath = buildThreadBreadcrumbs(thread);
        setBreadcrumbs(breadcrumbPath);
        
        // Generate suggestions for current thread
        const suggestions = generateSuggestedQuestions(parentMessage, getThreadMessages(threadId));
        setSuggestedQuestions(suggestions);
      }
    };
  
    const buildThreadBreadcrumbs = (thread) => {
      const crumbs = [{ label: 'Main Chat', id: 'main' }];
      
      if (thread.parentThreadId) {
        const parentThread = threads.find(t => t.id === thread.parentThreadId);
        if (parentThread) {
          const parentCrumbs = buildThreadBreadcrumbs(parentThread);
          crumbs.push(...parentCrumbs.slice(1)); // Remove duplicate main
        }
      }
      
      const label = thread.selectedText ? 
        `"${thread.selectedText.slice(0, 20)}..."` : 
        `Thread #${thread.id.slice(-4)}`;
      
      crumbs.push({ label, id: thread.id });
      return crumbs;
    };
  
    const generateSuggestedQuestions = (parentMessage, threadMessages = []) => {
      if (threadMessages.length === 0) {
        return [
          `Can you explain this concept step-by-step?`,
          `What are real-world examples of this?`,
          `What should I know about potential challenges?`
        ];
      }
      
      return [
        `How can I apply this practically?`,
        `What are the next steps to explore?`,
        `What connections exist with other topics?`
      ];
    };
  
    const navigateBack = () => {
      const newHistory = [...navigationHistory];
      newHistory.pop();
      const previousView = newHistory[newHistory.length - 1] || 'main';
      
      setNavigationHistory(newHistory);
      setCurrentView(previousView);
      
      if (previousView === 'main') {
        setBreadcrumbs([{ label: 'Main Chat', id: 'main' }]);
        setSuggestedQuestions([]);
      } else {
        const thread = threads.find(t => t.id === previousView);
        if (thread) {
          setBreadcrumbs(buildThreadBreadcrumbs(thread));
        }
      }
    };
  
    const navigateToMain = () => {
      setCurrentView('main');
      setNavigationHistory(['main']);
      setBreadcrumbs([{ label: 'Main Chat', id: 'main' }]);
      setSuggestedQuestions([]);
    };
  
    const toggleThreadDropdown = (messageId) => {
      setThreadDropdowns(prev => ({
        ...prev,
        [messageId]: !prev[messageId]
      }));
    };
  
    const toggleThread = (threadId) => {
      setThreads(prev => prev.map(t => 
        t.id === threadId ? { ...t, isExpanded: !t.isExpanded } : t
      ));
      
      if (collapsedThreads.has(threadId)) {
        setCollapsedThreads(prev => {
          const newSet = new Set(prev);
          newSet.delete(threadId);
          return newSet;
        });
      } else {
        setCollapsedThreads(prev => new Set(prev).add(threadId));
      }
    };
  
    const resolveThread = (threadId) => {
      setThreads(prev => prev.map(t => 
        t.id === threadId ? { ...t, status: 'resolved', isExpanded: false } : t
      ));
    };
  
    const getThreadMessages = (threadId) => {
      return messages.filter(m => m.threadId === threadId);
    };
  
    const jumpTo = (breadcrumbId) => {
      if (breadcrumbId === 'main') {
        navigateToMain();
      } else {
        navigateToThread(breadcrumbId);
      }
    };
  
    // Additional helper functions for collaboration
    const inviteExpert = (threadId, inviteData) => {
      if (!inviteData) return;
      
      const { email, name, role, permissions: userPermissions } = inviteData;
      const newCollaborator = {
        id: generateId(),
        email,
        name: name || email.split('@')[0],
        role: role || 'contributor',
        permissions: userPermissions || { canInvite: false, canModerate: false, canExport: false },
        invitedAt: new Date(),
        threadId,
        status: 'invited'
      };
  
      setCollaborators(prev => [...prev, newCollaborator]);
    };
  
    const switchModel = (threadId, model) => {
      if (threadId) {
        setThreads(prev => prev.map(t => 
          t.id === threadId ? { 
            ...t, 
            model,
            isGroupManager: model === 'AI-Group-Manager',
            managedModels: model === 'AI-Group-Manager' ? ['GPT-4', 'Claude-3.5', 'Gemini-Pro'] : t.managedModels,
            groupStrategy: model === 'AI-Group-Manager' ? 'collaborative' : t.groupStrategy
          } : t
        ));
      } else {
        setCurrentModel(model);
      }
    };

    const createAIGroupManager = (parentMsgId, selectedText = null, parentThreadId = null) => {
      return openThread(parentMsgId, selectedText, parentThreadId, 'AI-Group-Manager');
    };

    const createImportantNote = (parentMsgId, selectedText = null, parentThreadId = null) => {
      const threadId = generateId();
      
      const newThread = {
        id: threadId,
        sessionId: currentSessionId,
        parentMsgId,
        parentThreadId,
        selectedText,
        model: currentModel,
        status: 'active',
        lastActiveAt: new Date(),
        isExpanded: true,
        showInline: true,
        messages: [],
        level: parentThreadId ? (getThreadLevel(parentThreadId) + 1) : 1,
        siblingIndex: getSiblingThreads(parentMsgId, parentThreadId).length,
        createdAt: new Date(),
        highlight: true,
        isImportantNote: true,
        noteType: 'highlighted-text',
        importance: 'high'
      };

      setThreads(prev => [...prev, newThread]);
      
      // Update thread hierarchy
      setThreadHierarchy(prev => {
        const newHierarchy = { ...prev };
        newHierarchy[threadId] = {
          parent: parentThreadId || parentMsgId,
          children: [],
          siblings: getSiblingThreads(parentMsgId, parentThreadId).map(t => t.id)
        };

        // Update parent's children if it's a sub-thread
        if (parentThreadId && newHierarchy[parentThreadId]) {
          newHierarchy[parentThreadId] = {
            ...newHierarchy[parentThreadId],
            children: [...(newHierarchy[parentThreadId].children || []), threadId]
          };
        }

        return newHierarchy;
      });

      // Auto-scroll to new thread
      setTimeout(() => {
        if (chatRef.current) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
      }, 100);
      
      // Remove highlight after a moment
      setTimeout(() => {
        setThreads(prev => prev.map(t => t.id === threadId ? { ...t, highlight: false } : t));
      }, 2000);

      // Generate initial memory for important notes
      if (newThread.isImportantNote) {
        setTimeout(() => {
          generateThreadMemory(threadId);
        }, 1000);
      }

      return newThread;
    };

    // Memory and Understanding Functions
    const generateThreadMemory = (threadId) => {
      const thread = threads.find(t => t.id === threadId);
      if (!thread) return null;

      const threadMessages = getThreadMessages(threadId);
      const userMessages = threadMessages.filter(m => m.sender === 'user');
      const aiMessages = threadMessages.filter(m => m.sender === 'AI');

      // Analyze user understanding patterns
      const understandingLevel = analyzeUserUnderstanding(userMessages, aiMessages);
      const keyConcepts = extractKeyConceptsFromThread(threadMessages);
      const learningProgress = trackLearningProgress(threadMessages);

      const memory = {
        threadId,
        topic: thread.selectedText || 'General discussion',
        understandingLevel,
        keyConcepts,
        learningProgress,
        lastUpdated: new Date(),
        messageCount: threadMessages.length,
        userEngagement: calculateUserEngagement(userMessages),
        aiInsights: extractAIInsights(aiMessages),
        suggestedNextSteps: generateNextSteps(understandingLevel, keyConcepts)
      };

      setThreadMemories(prev => ({
        ...prev,
        [threadId]: memory
      }));

      return memory;
    };

    const analyzeUserUnderstanding = (userMessages, aiMessages) => {
      if (userMessages.length === 0) return 'beginner';
      
      const questionTypes = userMessages.map(msg => {
        if (msg.content.toLowerCase().includes('how') || msg.content.toLowerCase().includes('explain')) return 'exploration';
        if (msg.content.toLowerCase().includes('why') || msg.content.toLowerCase().includes('reason')) return 'analysis';
        if (msg.content.toLowerCase().includes('example') || msg.content.toLowerCase().includes('show')) return 'application';
        if (msg.content.toLowerCase().includes('what if') || msg.content.toLowerCase().includes('alternative')) return 'synthesis';
        return 'general';
      });

      const explorationCount = questionTypes.filter(t => t === 'exploration').length;
      const analysisCount = questionTypes.filter(t => t === 'analysis').length;
      const applicationCount = questionTypes.filter(t => t === 'application').length;
      const synthesisCount = questionTypes.filter(t => t === 'synthesis').length;

      if (synthesisCount > 2) return 'expert';
      if (analysisCount > 2 || applicationCount > 2) return 'intermediate';
      if (explorationCount > 2) return 'beginner';
      return 'beginner';
    };

    const extractKeyConceptsFromThread = (messages) => {
      const allText = messages.map(m => m.content).join(' ');
      const concepts = extractKeyConcepts(allText);
      return concepts.slice(0, 5); // Top 5 concepts
    };

    const trackLearningProgress = (messages) => {
      const progress = {
        questionsAsked: messages.filter(m => m.sender === 'user' && m.content.includes('?')).length,
        conceptsExplored: extractKeyConceptsFromThread(messages).length,
        depthOfInquiry: calculateInquiryDepth(messages),
        practicalApplications: messages.filter(m => 
          m.sender === 'user' && 
          (m.content.toLowerCase().includes('example') || m.content.toLowerCase().includes('apply'))
        ).length
      };
      return progress;
    };

    const calculateInquiryDepth = (messages) => {
      const userMessages = messages.filter(m => m.sender === 'user');
      let depth = 0;
      
      userMessages.forEach(msg => {
        if (msg.content.toLowerCase().includes('why')) depth += 2;
        if (msg.content.toLowerCase().includes('how')) depth += 1;
        if (msg.content.toLowerCase().includes('what if')) depth += 3;
        if (msg.content.toLowerCase().includes('example')) depth += 1;
      });
      
      return Math.min(depth, 10); // Cap at 10
    };

    const calculateUserEngagement = (userMessages) => {
      return {
        messageFrequency: userMessages.length,
        averageMessageLength: userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / userMessages.length || 0,
        followUpQuestions: userMessages.filter(msg => msg.content.includes('?')).length,
        specificRequests: userMessages.filter(msg => 
          msg.content.toLowerCase().includes('show') || 
          msg.content.toLowerCase().includes('explain') ||
          msg.content.toLowerCase().includes('example')
        ).length
      };
    };

    const extractAIInsights = (aiMessages) => {
      return aiMessages.map(msg => ({
        model: msg.model,
        keyPoints: msg.content.split('.').slice(0, 2).join('.'),
        timestamp: msg.timestamp
      }));
    };

    const generateNextSteps = (understandingLevel, keyConcepts) => {
      const steps = [];
      
      if (understandingLevel === 'beginner') {
        steps.push('Explore basic concepts further');
        steps.push('Ask for practical examples');
        steps.push('Request step-by-step explanations');
      } else if (understandingLevel === 'intermediate') {
        steps.push('Dive deeper into specific aspects');
        steps.push('Explore real-world applications');
        steps.push('Compare with alternative approaches');
      } else if (understandingLevel === 'expert') {
        steps.push('Synthesize multiple concepts');
        steps.push('Explore edge cases and limitations');
        steps.push('Create practical implementations');
      }
      
      return steps;
    };

    const generateGroupMemory = (threadIds) => {
      const groupThreads = threads.filter(t => threadIds.includes(t.id));
      const allMemories = threadIds.map(id => threadMemories[id]).filter(Boolean);
      
      if (allMemories.length === 0) return null;

      const groupMemory = {
        groupId: `group-${Date.now()}`,
        threadIds,
        overallUnderstanding: calculateOverallUnderstanding(allMemories),
        commonConcepts: findCommonConcepts(allMemories),
        learningTrajectory: analyzeLearningTrajectory(allMemories),
        groupInsights: generateGroupInsights(groupThreads, allMemories),
        lastUpdated: new Date()
      };

      setGroupMemories(prev => ({
        ...prev,
        [groupMemory.groupId]: groupMemory
      }));

      return groupMemory;
    };

    const calculateOverallUnderstanding = (memories) => {
      const levels = memories.map(m => m.understandingLevel);
      const levelScores = { beginner: 1, intermediate: 2, expert: 3 };
      const averageScore = levels.reduce((sum, level) => sum + levelScores[level], 0) / levels.length;
      
      if (averageScore >= 2.5) return 'expert';
      if (averageScore >= 1.5) return 'intermediate';
      return 'beginner';
    };

    const findCommonConcepts = (memories) => {
      const allConcepts = memories.flatMap(m => m.keyConcepts);
      const conceptCounts = {};
      
      allConcepts.forEach(concept => {
        conceptCounts[concept] = (conceptCounts[concept] || 0) + 1;
      });
      
      return Object.entries(conceptCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([concept]) => concept);
    };

    const analyzeLearningTrajectory = (memories) => {
      const sortedMemories = memories.sort((a, b) => new Date(a.lastUpdated) - new Date(b.lastUpdated));
      
      return {
        progression: sortedMemories.map(m => m.understandingLevel),
        acceleration: calculateLearningAcceleration(sortedMemories),
        focusAreas: identifyFocusAreas(sortedMemories)
      };
    };

    const calculateLearningAcceleration = (memories) => {
      if (memories.length < 2) return 'stable';
      
      const recent = memories.slice(-3);
      const early = memories.slice(0, 3);
      
      const recentAvg = recent.reduce((sum, m) => sum + (m.understandingLevel === 'expert' ? 3 : m.understandingLevel === 'intermediate' ? 2 : 1), 0) / recent.length;
      const earlyAvg = early.reduce((sum, m) => sum + (m.understandingLevel === 'expert' ? 3 : m.understandingLevel === 'intermediate' ? 2 : 1), 0) / early.length;
      
      if (recentAvg > earlyAvg + 0.5) return 'accelerating';
      if (recentAvg < earlyAvg - 0.5) return 'decelerating';
      return 'stable';
    };

    const identifyFocusAreas = (memories) => {
      const allTopics = memories.map(m => m.topic);
      const topicCounts = {};
      
      allTopics.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
      
      return Object.entries(topicCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([topic]) => topic);
    };

    const generateGroupInsights = (groupThreads, memories) => {
      return {
        totalThreads: groupThreads.length,
        averageUnderstanding: calculateOverallUnderstanding(memories),
        mostExploredTopics: identifyFocusAreas(memories),
        learningPattern: analyzeLearningTrajectory(memories).progression,
        suggestedGroupActions: generateGroupActions(memories)
      };
    };

    const generateGroupActions = (memories) => {
      const actions = [];
      const understanding = calculateOverallUnderstanding(memories);
      
      if (understanding === 'beginner') {
        actions.push('Create foundational concept threads');
        actions.push('Request more basic explanations');
        actions.push('Focus on practical examples');
      } else if (understanding === 'intermediate') {
        actions.push('Explore advanced applications');
        actions.push('Connect related concepts');
        actions.push('Dive into specific use cases');
      } else if (understanding === 'expert') {
        actions.push('Synthesize multiple perspectives');
        actions.push('Explore edge cases');
        actions.push('Create comprehensive summaries');
      }
      
      return actions;
    };

    // Advanced Learning Path Analysis
    const analyzeLearningPath = () => {
      const allMemories = Object.values(threadMemories);
      if (allMemories.length === 0) return [];

      const sortedMemories = allMemories.sort((a, b) => new Date(a.lastUpdated) - new Date(b.lastUpdated));
      
      const path = sortedMemories.map((memory, index) => ({
        step: index + 1,
        threadId: memory.threadId,
        topic: memory.topic,
        understandingLevel: memory.understandingLevel,
        keyConcepts: memory.keyConcepts,
        timestamp: memory.lastUpdated,
        progress: calculateStepProgress(memory, index, sortedMemories.length)
      }));

      setLearningPath(path);
      return path;
    };

    const calculateStepProgress = (memory, stepIndex, totalSteps) => {
      const levelScores = { beginner: 1, intermediate: 2, expert: 3 };
      const currentScore = levelScores[memory.understandingLevel];
      const maxPossibleScore = totalSteps * 3;
      const achievedScore = (stepIndex + 1) * currentScore;
      
      return {
        percentage: Math.min((achievedScore / maxPossibleScore) * 100, 100),
        level: memory.understandingLevel,
        concepts: memory.keyConcepts.length,
        depth: memory.learningProgress.depthOfInquiry
      };
    };

    const identifyKnowledgeGaps = () => {
      const allMemories = Object.values(threadMemories);
      const gaps = {};

      // Analyze concept coverage
      const allConcepts = allMemories.flatMap(m => m.keyConcepts);
      const conceptFrequency = {};
      
      allConcepts.forEach(concept => {
        conceptFrequency[concept] = (conceptFrequency[concept] || 0) + 1;
      });

      // Identify under-explored concepts
      const underExplored = Object.entries(conceptFrequency)
        .filter(([, count]) => count === 1)
        .map(([concept]) => concept);

      // Analyze understanding depth gaps
      const shallowTopics = allMemories
        .filter(m => m.learningProgress.depthOfInquiry < 5)
        .map(m => m.topic);

      // Identify missing practical applications
      const theoryHeavy = allMemories
        .filter(m => m.learningProgress.practicalApplications === 0)
        .map(m => m.topic);

      gaps.underExploredConcepts = underExplored;
      gaps.shallowTopics = shallowTopics;
      gaps.theoryHeavy = theoryHeavy;
      gaps.missingConnections = findMissingConnections(allMemories);

      setKnowledgeGaps(gaps);
      return gaps;
    };

    const findMissingConnections = (memories) => {
      const connections = [];
      
      for (let i = 0; i < memories.length; i++) {
        for (let j = i + 1; j < memories.length; j++) {
          const mem1 = memories[i];
          const mem2 = memories[j];
          
          // Check for potential connections
          const commonConcepts = mem1.keyConcepts.filter(concept => 
            mem2.keyConcepts.includes(concept)
          );
          
          if (commonConcepts.length > 0 && commonConcepts.length < 2) {
            connections.push({
              topic1: mem1.topic,
              topic2: mem2.topic,
              commonConcepts,
              potential: 'high'
            });
          }
        }
      }
      
      return connections;
    };

    const generatePersonalizedRecommendations = () => {
      const gaps = knowledgeGaps;
      const memories = Object.values(threadMemories);
      const recommendations = {};

      // Learning path recommendations
      if (learningPath.length > 0) {
        const currentLevel = learningPath[learningPath.length - 1]?.understandingLevel || 'beginner';
        recommendations.nextSteps = generateNextSteps(currentLevel, []);
      }

      // Gap-filling recommendations
      if (gaps.underExploredConcepts?.length > 0) {
        recommendations.exploreConcepts = gaps.underExploredConcepts.slice(0, 3);
      }

      if (gaps.shallowTopics?.length > 0) {
        recommendations.deepenUnderstanding = gaps.shallowTopics.slice(0, 2);
      }

      if (gaps.theoryHeavy?.length > 0) {
        recommendations.practicalApplications = gaps.theoryHeavy.slice(0, 2);
      }

      if (gaps.missingConnections?.length > 0) {
        recommendations.connectTopics = gaps.missingConnections.slice(0, 3);
      }

      // Adaptive recommendations based on learning style
      const learningStyle = analyzeLearningStyle(memories);
      recommendations.learningStyle = learningStyle;
      recommendations.adaptiveSuggestions = generateAdaptiveSuggestions(learningStyle, memories);

      setRecommendations(recommendations);
      return recommendations;
    };

    const analyzeLearningStyle = (memories) => {
      const styles = {
        visual: 0,
        practical: 0,
        theoretical: 0,
        collaborative: 0
      };

      memories.forEach(memory => {
        if (memory.userEngagement.specificRequests > 2) styles.practical++;
        if (memory.learningProgress.depthOfInquiry > 7) styles.theoretical++;
        if (memory.userEngagement.averageMessageLength > 100) styles.collaborative++;
        if (memory.keyConcepts.length > 3) styles.visual++;
      });

      const dominantStyle = Object.entries(styles)
        .sort(([,a], [,b]) => b - a)[0][0];

      return {
        dominant: dominantStyle,
        scores: styles,
        description: getLearningStyleDescription(dominantStyle)
      };
    };

    const getLearningStyleDescription = (style) => {
      const descriptions = {
        visual: "You prefer visual learning with concept mapping and clear structure",
        practical: "You learn best through hands-on application and real examples",
        theoretical: "You enjoy deep analysis and understanding underlying principles",
        collaborative: "You thrive in interactive discussions and collaborative exploration"
      };
      return descriptions[style] || "You have a balanced learning approach";
    };

    const generateAdaptiveSuggestions = (learningStyle, memories) => {
      const suggestions = [];

      if (learningStyle.dominant === 'visual') {
        suggestions.push("Create concept maps for complex topics");
        suggestions.push("Use visual diagrams to connect related concepts");
        suggestions.push("Organize information in structured formats");
      } else if (learningStyle.dominant === 'practical') {
        suggestions.push("Focus on real-world applications");
        suggestions.push("Request step-by-step implementation guides");
        suggestions.push("Practice with hands-on examples");
      } else if (learningStyle.dominant === 'theoretical') {
        suggestions.push("Explore underlying principles and theories");
        suggestions.push("Analyze edge cases and limitations");
        suggestions.push("Dive deep into fundamental concepts");
      } else if (learningStyle.dominant === 'collaborative') {
        suggestions.push("Engage in interactive discussions");
        suggestions.push("Ask follow-up questions for clarification");
        suggestions.push("Explore multiple perspectives on topics");
      }

      return suggestions;
    };
  
    // Enhanced Export Functions
    const exportSession = () => {
      const data = {
        session: sessions.find(s => s.id === currentSessionId),
        messages: messages.filter(m => m.sessionId === currentSessionId),
        threads: threads.filter(t => t.sessionId === currentSessionId),
        hierarchy: threadHierarchy
      };
      console.log('Exported session data:', data);
      alert('Session exported to console! (In real app, this would download a file)');
    };

    const exportThreadOutcome = (threadId, targetType = 'main', targetId = null, summaryModel = null) => {
      const thread = threads.find(t => t.id === threadId);
      if (!thread) return;

      const threadMessages = getThreadMessages(threadId);
      const userMessages = threadMessages.filter(m => m.sender === 'user');
      const aiMessages = threadMessages.filter(m => m.sender === 'AI');

      // Create summary of the thread
      let summary = `Thread Summary (#${threadId.slice(-4)}):\n\n`;
      summary += `Topic: ${thread.selectedText || 'General discussion'}\n`;
      summary += `Level: ${thread.level}\n`;
      summary += `Messages: ${threadMessages.length} (${userMessages.length} user, ${aiMessages.length} AI)\n\n`;
      
      // Add key points from AI messages
      if (aiMessages.length > 0) {
        summary += `Key Points:\n`;
        aiMessages.forEach((msg, idx) => {
          const keyPoints = msg.content.split('.').slice(0, 2).join('.');
          summary += `${idx + 1}. ${keyPoints}\n`;
        });
      }

      // Create the export message
      const exportMessage = {
        id: generateId(),
        sessionId: currentSessionId,
        content: summary,
        sender: 'system',
        type: 'thread-outcome',
        model: summaryModel || thread.model,
        timestamp: new Date(),
        threadId: targetType === 'thread' ? targetId : null,
        metadata: {
          exportedFrom: threadId,
          originalThread: thread,
          exportType: 'outcome'
        }
      };

      // Add to messages
      setMessages(prev => [...prev, exportMessage]);

      // If target is a thread, also send the summary as a prompt to that thread
      if (targetType === 'thread' && targetId) {
        const promptMessage = {
          id: generateId(),
          sessionId: currentSessionId,
          content: `Please analyze this thread outcome: ${summary}`,
          sender: 'user',
          timestamp: new Date(),
          threadId: targetId
        };
        setMessages(prev => [...prev, promptMessage]);
        
        // Generate AI response in the target thread
        setTimeout(() => {
          const aiResponse = generateAIResponse(promptMessage.content, summaryModel || thread.model, targetId);
          const aiMessage = {
            id: generateId(),
            sessionId: currentSessionId,
            content: aiResponse,
            sender: 'AI',
            model: summaryModel || thread.model,
            timestamp: new Date(),
            threadId: targetId
          };
          setMessages(prev => [...prev, aiMessage]);
        }, 1000);
      }

      return exportMessage;
    };

    const summarizeChat = (model = currentModel) => {
      const mainMessages = messages.filter(m => m.sessionId === currentSessionId && !m.threadId);
      const userMessages = mainMessages.filter(m => m.sender === 'user');
      const aiMessages = mainMessages.filter(m => m.sender === 'AI');

      let summary = `Chat Summary:\n\n`;
      summary += `Total Messages: ${mainMessages.length} (${userMessages.length} user, ${aiMessages.length} AI)\n`;
      summary += `Active Threads: ${activeThreads.length}\n\n`;
      
      // Add key discussion points
      if (userMessages.length > 0) {
        summary += `Main Discussion Points:\n`;
        userMessages.slice(-5).forEach((msg, idx) => {
          const keyPoint = msg.content.length > 100 ? msg.content.slice(0, 100) + '...' : msg.content;
          summary += `${idx + 1}. ${keyPoint}\n`;
        });
      }

      // Create summary message
      const summaryMessage = {
        id: generateId(),
        sessionId: currentSessionId,
        content: summary,
        sender: 'system',
        type: 'chat-summary',
        model: model,
        timestamp: new Date(),
        threadId: null,
        metadata: {
          summaryType: 'chat-overview',
          summaryModel: model
        }
      };

      setMessages(prev => [...prev, summaryMessage]);
      return summaryMessage;
    };
  
    // Define computed values
    const activeThreads = threads.filter(t => t.status === 'active');
    const currentModelInfo = availableModels.find(m => m.id === currentModel);
    const currentUser = activeUsers.find(u => u.isCurrentUser);
    const canInvite = currentUser && permissions[currentUser.id]?.canInvite;
  
    // Enhanced Onboarding Component
    const OnboardingTour = () => {
      if (!showOnboarding || onboardingStep >= onboardingSteps.length) return null;
      
      const step = onboardingSteps[onboardingStep];
      
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <TreePine className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="text-gray-600 mt-2">{step.description}</p>
            </div>
            
            <div className="flex items-center justify-between mt-6">
              <div className="flex space-x-2">
                {onboardingSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === onboardingStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowOnboarding(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Skip
                </button>
                <button
                  onClick={() => {
                    if (onboardingStep < onboardingSteps.length - 1) {
                      setOnboardingStep(prev => prev + 1);
                    } else {
                      setShowOnboarding(false);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {onboardingStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    };
  
    // Export Modal Component
    // Memory Modal Component
    const MemoryModal = () => {
      const [activeTab, setActiveTab] = useState('thread');
      const [selectedThreads, setSelectedThreads] = useState([]);

      if (!memoryModal.open) return null;

      const currentThread = threads.find(t => t.id === memoryModal.threadId);
      const threadMemory = threadMemories[memoryModal.threadId];
      const groupMemory = groupMemories[Object.keys(groupMemories).find(key => 
        groupMemories[key].threadIds.includes(memoryModal.threadId)
      )];

      const handleGenerateMemory = () => {
        if (memoryModal.threadId) {
          generateThreadMemory(memoryModal.threadId);
        }
      };

      const handleGenerateGroupMemory = () => {
        if (selectedThreads.length > 1) {
          generateGroupMemory(selectedThreads);
        }
      };

      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Dynamic Memory & Understanding</h3>
              <button
                onClick={() => setMemoryModal({ open: false, threadId: null })}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex h-full">
              {/* Sidebar */}
              <div className="w-64 border-r border-gray-200 p-4">
                <div className="space-y-4">
                  <button
                    onClick={() => setActiveTab('thread')}
                    className={`w-full text-left px-3 py-2 rounded-lg ${
                      activeTab === 'thread' ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-50'
                    }`}
                  >
                    Thread Memory
                  </button>
                  <button
                    onClick={() => setActiveTab('group')}
                    className={`w-full text-left px-3 py-2 rounded-lg ${
                      activeTab === 'group' ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-50'
                    }`}
                  >
                    Group Memory
                  </button>
                                     <button
                     onClick={() => setActiveTab('understanding')}
                     className={`w-full text-left px-3 py-2 rounded-lg ${
                       activeTab === 'understanding' ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-50'
                     }`}
                   >
                     Learning Progress
                   </button>
                   <button
                     onClick={() => setActiveTab('path')}
                     className={`w-full text-left px-3 py-2 rounded-lg ${
                       activeTab === 'path' ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-50'
                     }`}
                   >
                     Learning Path
                   </button>
                   <button
                     onClick={() => setActiveTab('gaps')}
                     className={`w-full text-left px-3 py-2 rounded-lg ${
                       activeTab === 'gaps' ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-50'
                     }`}
                   >
                     Knowledge Gaps
                   </button>
                   <button
                     onClick={() => setActiveTab('recommendations')}
                     className={`w-full text-left px-3 py-2 rounded-lg ${
                       activeTab === 'recommendations' ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-50'
                     }`}
                   >
                     Recommendations
                   </button>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                {activeTab === 'thread' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold">Thread Memory</h4>
                      <button
                        onClick={handleGenerateMemory}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Generate Memory
                      </button>
                    </div>

                    {threadMemory ? (
                      <div className="space-y-4">
                        {/* Understanding Level */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                          <h5 className="font-semibold text-gray-900 mb-2">Understanding Level</h5>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              threadMemory.understandingLevel === 'expert' ? 'bg-green-100 text-green-800' :
                              threadMemory.understandingLevel === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {threadMemory.understandingLevel.charAt(0).toUpperCase() + threadMemory.understandingLevel.slice(1)}
                            </span>
                            <span className="text-sm text-gray-600">
                              Based on {threadMemory.messageCount} messages
                            </span>
                          </div>
                        </div>

                        {/* Key Concepts */}
                        <div className="bg-white border border-gray-200 p-4 rounded-lg">
                          <h5 className="font-semibold text-gray-900 mb-2">Key Concepts Explored</h5>
                          <div className="flex flex-wrap gap-2">
                            {threadMemory.keyConcepts.map((concept, idx) => (
                              <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                                {concept}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Learning Progress */}
                        <div className="bg-white border border-gray-200 p-4 rounded-lg">
                          <h5 className="font-semibold text-gray-900 mb-2">Learning Progress</h5>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm text-gray-600">Questions Asked</span>
                              <div className="text-lg font-semibold">{threadMemory.learningProgress.questionsAsked}</div>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Concepts Explored</span>
                              <div className="text-lg font-semibold">{threadMemory.learningProgress.conceptsExplored}</div>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Inquiry Depth</span>
                              <div className="text-lg font-semibold">{threadMemory.learningProgress.depthOfInquiry}/10</div>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Practical Applications</span>
                              <div className="text-lg font-semibold">{threadMemory.learningProgress.practicalApplications}</div>
                            </div>
                          </div>
                        </div>

                        {/* Suggested Next Steps */}
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                          <h5 className="font-semibold text-gray-900 mb-2">Suggested Next Steps</h5>
                          <ul className="space-y-1">
                            {threadMemory.suggestedNextSteps.map((step, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-center space-x-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No memory generated yet. Click "Generate Memory" to analyze this thread.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'group' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold">Group Memory</h4>
                      <button
                        onClick={handleGenerateGroupMemory}
                        disabled={selectedThreads.length < 2}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        Generate Group Memory
                      </button>
                    </div>

                    {/* Thread Selection */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-gray-900 mb-2">Select Threads for Group Analysis</h5>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {threads.map(thread => (
                          <label key={thread.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedThreads.includes(thread.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedThreads(prev => [...prev, thread.id]);
                                } else {
                                  setSelectedThreads(prev => prev.filter(id => id !== thread.id));
                                }
                              }}
                              className="text-blue-600"
                            />
                            <span className="text-sm">#{thread.id.slice(-4)}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {groupMemory && (
                      <div className="space-y-4">
                        {/* Overall Understanding */}
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                          <h5 className="font-semibold text-gray-900 mb-2">Overall Understanding</h5>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            groupMemory.overallUnderstanding === 'expert' ? 'bg-green-100 text-green-800' :
                            groupMemory.overallUnderstanding === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {groupMemory.overallUnderstanding.charAt(0).toUpperCase() + groupMemory.overallUnderstanding.slice(1)}
                          </span>
                        </div>

                        {/* Common Concepts */}
                        <div className="bg-white border border-gray-200 p-4 rounded-lg">
                          <h5 className="font-semibold text-gray-900 mb-2">Common Concepts</h5>
                          <div className="flex flex-wrap gap-2">
                            {groupMemory.commonConcepts.map((concept, idx) => (
                              <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                                {concept}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Learning Trajectory */}
                        <div className="bg-white border border-gray-200 p-4 rounded-lg">
                          <h5 className="font-semibold text-gray-900 mb-2">Learning Trajectory</h5>
                          <div className="space-y-2">
                            <div>
                              <span className="text-sm text-gray-600">Progression: </span>
                              <span className="text-sm font-medium">
                                {groupMemory.learningTrajectory.progression.join(' → ')}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Acceleration: </span>
                              <span className={`text-sm font-medium ${
                                groupMemory.learningTrajectory.acceleration === 'accelerating' ? 'text-green-600' :
                                groupMemory.learningTrajectory.acceleration === 'decelerating' ? 'text-red-600' :
                                'text-gray-600'
                              }`}>
                                {groupMemory.learningTrajectory.acceleration}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Focus Areas: </span>
                              <span className="text-sm font-medium">
                                {groupMemory.learningTrajectory.focusAreas.join(', ')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Group Insights */}
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
                          <h5 className="font-semibold text-gray-900 mb-2">Group Insights</h5>
                          <div className="space-y-2">
                            <div>
                              <span className="text-sm text-gray-600">Total Threads: </span>
                              <span className="text-sm font-medium">{groupMemory.groupInsights.totalThreads}</span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Most Explored Topics: </span>
                              <span className="text-sm font-medium">
                                {groupMemory.groupInsights.mostExploredTopics.join(', ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'understanding' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold">Learning Progress Analysis</h4>
                    
                    {threadMemory && (
                      <div className="space-y-4">
                        {/* User Engagement */}
                        <div className="bg-white border border-gray-200 p-4 rounded-lg">
                          <h5 className="font-semibold text-gray-900 mb-2">User Engagement</h5>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm text-gray-600">Message Frequency</span>
                              <div className="text-lg font-semibold">{threadMemory.userEngagement.messageFrequency}</div>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Avg Message Length</span>
                              <div className="text-lg font-semibold">{Math.round(threadMemory.userEngagement.averageMessageLength)} chars</div>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Follow-up Questions</span>
                              <div className="text-lg font-semibold">{threadMemory.userEngagement.followUpQuestions}</div>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Specific Requests</span>
                              <div className="text-lg font-semibold">{threadMemory.userEngagement.specificRequests}</div>
                            </div>
                          </div>
                        </div>

                        {/* AI Insights */}
                        <div className="bg-white border border-gray-200 p-4 rounded-lg">
                          <h5 className="font-semibold text-gray-900 mb-2">AI Insights</h5>
                          <div className="space-y-2">
                            {threadMemory.aiInsights.map((insight, idx) => (
                              <div key={idx} className="border-l-4 border-blue-500 pl-3">
                                <div className="text-sm font-medium text-gray-900">{insight.model}</div>
                                <div className="text-sm text-gray-600">{insight.keyPoints}</div>
                                <div className="text-xs text-gray-500">{insight.timestamp.toLocaleTimeString()}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                                         )}
                   </div>
                 )}

                 {activeTab === 'path' && (
                   <div className="space-y-6">
                     <div className="flex items-center justify-between">
                       <h4 className="text-lg font-semibold">Learning Path Analysis</h4>
                       <button
                         onClick={analyzeLearningPath}
                         className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                       >
                         Analyze Path
                       </button>
                     </div>

                     {learningPath.length > 0 ? (
                       <div className="space-y-4">
                         {/* Learning Journey Visualization */}
                         <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
                           <h5 className="font-semibold text-gray-900 mb-3">Your Learning Journey</h5>
                           <div className="space-y-3">
                             {learningPath.map((step, idx) => (
                               <div key={idx} className="flex items-center space-x-3">
                                 <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                                   {step.step}
                                 </div>
                                 <div className="flex-1">
                                   <div className="flex items-center space-x-2">
                                     <span className="font-medium text-gray-900">{step.topic}</span>
                                     <span className={`px-2 py-1 rounded-full text-xs ${
                                       step.understandingLevel === 'expert' ? 'bg-green-100 text-green-800' :
                                       step.understandingLevel === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                       'bg-blue-100 text-blue-800'
                                     }`}>
                                       {step.understandingLevel}
                                     </span>
                                   </div>
                                   <div className="text-sm text-gray-600">
                                     {step.keyConcepts.slice(0, 3).join(', ')}
                                   </div>
                                   <div className="mt-1">
                                     <div className="w-full bg-gray-200 rounded-full h-2">
                                       <div 
                                         className="bg-blue-600 h-2 rounded-full transition-all"
                                         style={{ width: `${step.progress.percentage}%` }}
                                       ></div>
                                     </div>
                                     <div className="text-xs text-gray-500 mt-1">
                                       Progress: {Math.round(step.progress.percentage)}%
                                     </div>
                                   </div>
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>

                         {/* Path Statistics */}
                         <div className="bg-white border border-gray-200 p-4 rounded-lg">
                           <h5 className="font-semibold text-gray-900 mb-3">Path Statistics</h5>
                           <div className="grid grid-cols-2 gap-4">
                             <div>
                               <span className="text-sm text-gray-600">Total Steps</span>
                               <div className="text-lg font-semibold">{learningPath.length}</div>
                             </div>
                             <div>
                               <span className="text-sm text-gray-600">Average Progress</span>
                               <div className="text-lg font-semibold">
                                 {Math.round(learningPath.reduce((sum, step) => sum + step.progress.percentage, 0) / learningPath.length)}%
                               </div>
                             </div>
                             <div>
                               <span className="text-sm text-gray-600">Concepts Explored</span>
                               <div className="text-lg font-semibold">
                                 {learningPath.reduce((sum, step) => sum + step.keyConcepts.length, 0)}
                               </div>
                             </div>
                             <div>
                               <span className="text-sm text-gray-600">Current Level</span>
                               <div className="text-lg font-semibold">
                                 {learningPath[learningPath.length - 1]?.understandingLevel || 'Beginner'}
                               </div>
                             </div>
                           </div>
                         </div>
                       </div>
                     ) : (
                       <div className="text-center py-8">
                         <p className="text-gray-500">No learning path data available. Click "Analyze Path" to generate your learning journey.</p>
                       </div>
                     )}
                   </div>
                 )}

                 {activeTab === 'gaps' && (
                   <div className="space-y-6">
                     <div className="flex items-center justify-between">
                       <h4 className="text-lg font-semibold">Knowledge Gap Analysis</h4>
                       <button
                         onClick={identifyKnowledgeGaps}
                         className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                       >
                         Identify Gaps
                       </button>
                     </div>

                     {Object.keys(knowledgeGaps).length > 0 ? (
                       <div className="space-y-4">
                         {/* Under-explored Concepts */}
                         {knowledgeGaps.underExploredConcepts?.length > 0 && (
                           <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg">
                             <h5 className="font-semibold text-gray-900 mb-2">Under-explored Concepts</h5>
                             <div className="flex flex-wrap gap-2">
                               {knowledgeGaps.underExploredConcepts.map((concept, idx) => (
                                 <span key={idx} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                                   {concept}
                                 </span>
                               ))}
                             </div>
                             <p className="text-sm text-gray-600 mt-2">
                               These concepts were mentioned but not deeply explored
                             </p>
                           </div>
                         )}

                         {/* Shallow Topics */}
                         {knowledgeGaps.shallowTopics?.length > 0 && (
                           <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-lg">
                             <h5 className="font-semibold text-gray-900 mb-2">Topics Needing Depth</h5>
                             <div className="space-y-2">
                               {knowledgeGaps.shallowTopics.map((topic, idx) => (
                                 <div key={idx} className="flex items-center space-x-2">
                                   <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                   <span className="text-sm text-gray-700">{topic}</span>
                                 </div>
                               ))}
                             </div>
                             <p className="text-sm text-gray-600 mt-2">
                               These topics need deeper exploration and analysis
                             </p>
                           </div>
                         )}

                         {/* Theory-Heavy Topics */}
                         {knowledgeGaps.theoryHeavy?.length > 0 && (
                           <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                             <h5 className="font-semibold text-gray-900 mb-2">Theory-Heavy Topics</h5>
                             <div className="space-y-2">
                               {knowledgeGaps.theoryHeavy.map((topic, idx) => (
                                 <div key={idx} className="flex items-center space-x-2">
                                   <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                   <span className="text-sm text-gray-700">{topic}</span>
                                 </div>
                               ))}
                             </div>
                             <p className="text-sm text-gray-600 mt-2">
                               These topics need practical applications and examples
                             </p>
                           </div>
                         )}

                         {/* Missing Connections */}
                         {knowledgeGaps.missingConnections?.length > 0 && (
                           <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                             <h5 className="font-semibold text-gray-900 mb-2">Potential Connections</h5>
                             <div className="space-y-2">
                               {knowledgeGaps.missingConnections.map((connection, idx) => (
                                 <div key={idx} className="border-l-4 border-green-500 pl-3">
                                   <div className="text-sm font-medium text-gray-900">
                                     {connection.topic1} ↔ {connection.topic2}
                                   </div>
                                   <div className="text-xs text-gray-600">
                                     Common concepts: {connection.commonConcepts.join(', ')}
                                   </div>
                                 </div>
                               ))}
                             </div>
                             <p className="text-sm text-gray-600 mt-2">
                               These topics could be connected for deeper understanding
                             </p>
                           </div>
                         )}
                       </div>
                     ) : (
                       <div className="text-center py-8">
                         <p className="text-gray-500">No gap analysis available. Click "Identify Gaps" to analyze your knowledge gaps.</p>
                       </div>
                     )}
                   </div>
                 )}

                 {activeTab === 'recommendations' && (
                   <div className="space-y-6">
                     <div className="flex items-center justify-between">
                       <h4 className="text-lg font-semibold">Personalized Recommendations</h4>
                       <button
                         onClick={generatePersonalizedRecommendations}
                         className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                       >
                         Generate Recommendations
                       </button>
                     </div>

                     {Object.keys(recommendations).length > 0 ? (
                       <div className="space-y-4">
                         {/* Learning Style */}
                         {recommendations.learningStyle && (
                           <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                             <h5 className="font-semibold text-gray-900 mb-2">Your Learning Style</h5>
                             <div className="space-y-2">
                               <div className="flex items-center space-x-2">
                                 <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                                   {recommendations.learningStyle.dominant}
                                 </span>
                               </div>
                               <p className="text-sm text-gray-700">
                                 {recommendations.learningStyle.description}
                               </p>
                             </div>
                           </div>
                         )}

                         {/* Adaptive Suggestions */}
                         {recommendations.adaptiveSuggestions?.length > 0 && (
                           <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg">
                             <h5 className="font-semibold text-gray-900 mb-2">Adaptive Learning Suggestions</h5>
                             <ul className="space-y-2">
                               {recommendations.adaptiveSuggestions.map((suggestion, idx) => (
                                 <li key={idx} className="text-sm text-gray-700 flex items-center space-x-2">
                                   <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                   <span>{suggestion}</span>
                                 </li>
                               ))}
                             </ul>
                           </div>
                         )}

                         {/* Gap-Filling Recommendations */}
                         {recommendations.exploreConcepts?.length > 0 && (
                           <div className="bg-white border border-gray-200 p-4 rounded-lg">
                             <h5 className="font-semibold text-gray-900 mb-2">Explore These Concepts</h5>
                             <div className="flex flex-wrap gap-2">
                               {recommendations.exploreConcepts.map((concept, idx) => (
                                 <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                   {concept}
                                 </span>
                               ))}
                             </div>
                           </div>
                         )}

                         {recommendations.deepenUnderstanding?.length > 0 && (
                           <div className="bg-white border border-gray-200 p-4 rounded-lg">
                             <h5 className="font-semibold text-gray-900 mb-2">Deepen Understanding</h5>
                             <div className="space-y-2">
                               {recommendations.deepenUnderstanding.map((topic, idx) => (
                                 <div key={idx} className="flex items-center space-x-2">
                                   <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                   <span className="text-sm text-gray-700">{topic}</span>
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}

                         {recommendations.practicalApplications?.length > 0 && (
                           <div className="bg-white border border-gray-200 p-4 rounded-lg">
                             <h5 className="font-semibold text-gray-900 mb-2">Add Practical Applications</h5>
                             <div className="space-y-2">
                               {recommendations.practicalApplications.map((topic, idx) => (
                                 <div key={idx} className="flex items-center space-x-2">
                                   <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                   <span className="text-sm text-gray-700">{topic}</span>
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}

                         {recommendations.connectTopics?.length > 0 && (
                           <div className="bg-white border border-gray-200 p-4 rounded-lg">
                             <h5 className="font-semibold text-gray-900 mb-2">Connect Related Topics</h5>
                             <div className="space-y-2">
                               {recommendations.connectTopics.map((connection, idx) => (
                                 <div key={idx} className="border-l-4 border-blue-500 pl-3">
                                   <div className="text-sm text-gray-700">
                                     {connection.topic1} ↔ {connection.topic2}
                                   </div>
                                   <div className="text-xs text-gray-500">
                                     Common: {connection.commonConcepts.join(', ')}
                                   </div>
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}
                       </div>
                     ) : (
                       <div className="text-center py-8">
                         <p className="text-gray-500">No recommendations available. Click "Generate Recommendations" to get personalized suggestions.</p>
                       </div>
                     )}
                   </div>
                 )}
               </div>
             </div>
           </div>
         </div>
       );
     };

    const ExportModal = () => {
      const [exportType, setExportType] = useState('thread-outcome');
      const [targetType, setTargetType] = useState('main');
      const [targetThread, setTargetThread] = useState('');
      const [summaryModel, setSummaryModel] = useState(currentModel);
      const [exportThreadId, setExportThreadId] = useState(null);

      if (!exportOutcomeModal.open) return null;

      const availableTargetThreads = threads.filter(t => t.id !== exportOutcomeModal.threadId);

      const handleExport = () => {
        if (exportType === 'thread-outcome' && exportOutcomeModal.threadId) {
          const targetId = targetType === 'thread' ? targetThread : null;
          exportThreadOutcome(exportOutcomeModal.threadId, targetType, targetId, summaryModel);
        } else if (exportType === 'chat-summary') {
          summarizeChat(summaryModel);
        }
        
        setExportOutcomeModal({ open: false, threadId: null });
      };

      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Export & Summarize</h3>
              <button
                onClick={() => setExportOutcomeModal({ open: false, threadId: null })}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Export Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="thread-outcome"
                      checked={exportType === 'thread-outcome'}
                      onChange={(e) => setExportType(e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="text-sm">Thread Outcome</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="chat-summary"
                      checked={exportType === 'chat-summary'}
                      onChange={(e) => setExportType(e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="text-sm">Chat Summary</span>
                  </label>
                </div>
              </div>

              {/* Target Selection */}
              {exportType === 'thread-outcome' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Export To
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="main"
                        checked={targetType === 'main'}
                        onChange={(e) => setTargetType(e.target.value)}
                        className="text-blue-600"
                      />
                      <span className="text-sm">Main Chat</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="thread"
                        checked={targetType === 'thread'}
                        onChange={(e) => setTargetType(e.target.value)}
                        className="text-blue-600"
                      />
                      <span className="text-sm">Another Thread</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Thread Selection */}
              {exportType === 'thread-outcome' && targetType === 'thread' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Target Thread
                  </label>
                  <select
                    value={targetThread}
                    onChange={(e) => setTargetThread(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Choose a thread...</option>
                    {availableTargetThreads.map(thread => (
                      <option key={thread.id} value={thread.id}>
                        #{thread.id.slice(-4)} - {thread.selectedText || 'General discussion'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Summary Model
                </label>
                <select
                  value={summaryModel}
                  onChange={(e) => setSummaryModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {availableModels.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} - {model.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setExportOutcomeModal({ open: false, threadId: null })}
                  className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={exportType === 'thread-outcome' && targetType === 'thread' && !targetThread}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    };

    // Enhanced Collaboration Modal
    const CollaborationModal = () => {
      const [inviteForm, setInviteForm] = useState({
        email: '',
        name: '',
        role: 'contributor',
        message: ''
      });
      const [activeTab, setActiveTab] = useState('invite');
  
      if (!inviteModal) return null;
  
      const handleInvite = () => {
        if (!inviteForm.email.trim()) return;
  
        const inviteData = {
          email: inviteForm.email,
          name: inviteForm.name || inviteForm.email.split('@')[0],
          role: inviteForm.role,
          permissions: {
            canInvite: inviteForm.role === 'moderator',
            canModerate: inviteForm.role === 'moderator',
            canExport: true
          },
          message: inviteForm.message
        };
  
        inviteExpert(currentInviteThread, inviteData);
        setInviteForm({ email: '', name: '', role: 'contributor', message: '' });
        setInviteModal(false);
      };
  
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="w-6 h-6 text-blue-600" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Collaboration</h2>
                    <p className="text-sm text-gray-600">
                      {currentInviteThread ? `Thread #${currentInviteThread.slice(-4)}` : 'Entire Session'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setInviteModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
  
              <div className="flex space-x-4 mt-4">
                {['invite', 'members'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-blue-100'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
  
            <div className="p-6">
              {activeTab === 'invite' && (
                <div className="space-y-4">
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="colleague@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="contributor">Contributor</option>
                    <option value="moderator">Moderator</option>
                  </select>
                </div>
              )}
  
              {activeTab === 'members' && (
                <div className="space-y-4">
                  {activeUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{user.avatar}</span>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{user.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
  
            {activeTab === 'invite' && (
              <div className="p-6 border-t bg-gray-50">
                <button
                  onClick={handleInvite}
                  disabled={!inviteForm.email.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Send Invitation
                </button>
              </div>
            )}
          </div>
        </div>
      );
    };
  
    // Component definitions
    const ThreadTreeNode = ({ thread, threads, messages, currentView, onNavigate, getThreadMessages, level }) => {
      const [isExpanded, setIsExpanded] = useState(true);
      const childThreads = threads.filter(t => t.parentThreadId === thread.id);
      const threadMessages = getThreadMessages(thread.id);
      const isCurrentView = currentView === thread.id;
      
      return (
        <div className={`${level > 0 ? 'ml-4 border-l-2 border-gray-200 pl-3' : ''}`}>
          <div
            className={`p-3 rounded-lg cursor-pointer transition-all ${
              isCurrentView 
                ? 'border-blue-500 bg-blue-50 border-2' 
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 border'
            }`}
            onClick={() => onNavigate(thread.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  level === 0 ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                }`}>
                  #{thread.id.slice(-4)}
                </span>
                {thread.level > 1 && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    L{thread.level}
                  </span>
                )}
                {thread.isSuggested && (
                  <span className="text-xs bg-yellow-100 text-yellow-600 px-1 py-0.5 rounded">💡</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">{threadMessages.length} msg</span>
                {childThreads.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
            
            <p className="text-xs text-gray-600 line-clamp-2">
              {thread.selectedText ? 
                `"${thread.selectedText.slice(0, 40)}..."` : 
                `${threadMessages.length} messages`
              }
            </p>
          </div>
          
          {/* Child Threads */}
          {isExpanded && childThreads.map(childThread => (
            <ThreadTreeNode
              key={childThread.id}
              thread={childThread}
              threads={threads}
              messages={messages}
              currentView={currentView}
              onNavigate={onNavigate}
              getThreadMessages={getThreadMessages}
              level={level + 1}
            />
          ))}
        </div>
      );
    };
  
    const MessageBubble = ({ 
      message, 
      onTextSelection, 
      selectedText, 
      selectionContext, 
      onCreateThread, 
      onCreateSelectedThread,
      siblingThreads,
      suggestedThreads,
      onCreateSuggestedThread,
      threadDropdown,
      onToggleDropdown,
      onNavigateToThread
    }) => {
      return (
        <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-3xl px-4 py-3 rounded-2xl ${
              message.sender === 'user'
                ? 'bg-blue-600 text-white'
                : message.type === 'thread-outcome' || message.type === 'chat-summary'
                ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-gray-900 border-2 border-purple-200 shadow-sm'
                : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
            } relative group`}
            onMouseUp={() => onTextSelection(message.id, message.content)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm leading-relaxed">{message.content}</p>
                
                {/* Text Selection Thread Option */}
                {selectedText && selectionContext?.messageId === message.id && selectedText.replace(/\s|"/g, '').length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-xs text-blue-600 mb-2 font-medium">
                      Selected: {selectedText.slice(0, 50)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          openThread(message.id, selectedText, null);
                          setSelectedText('');
                          setSelectionContext(null);
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                      >
                        <Target className="w-3 h-3" />
                        <span>Thread This Text</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          createAIGroupManager(message.id, selectedText, null);
                          setSelectedText('');
                          setSelectionContext(null);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-1"
                      >
                        <Users className="w-3 h-3" />
                        <span>AI Group Manager</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          createImportantNote(message.id, selectedText, null);
                          setSelectedText('');
                          setSelectionContext(null);
                        }}
                        className="px-3 py-1.5 bg-yellow-600 text-white text-xs rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-1"
                      >
                        <Bookmark className="w-3 h-3" />
                        <span>Save as Important</span>
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-2 text-xs opacity-75">
                  <span className="flex items-center space-x-2">
                    {message.sender === 'AI' && message.model && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${availableModels.find(m => m.id === message.model)?.color || 'bg-gray-100 text-gray-700'}`}>
                        {availableModels.find(m => m.id === message.model)?.name || message.model}
                      </span>
                    )}
                    {message.sender === 'AI' && message.contextUsed && (
                      <span className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        <Brain className="w-3 h-3" />
                        <span>Context: {message.contextUsed.messagesCount}msgs</span>
                      </span>
                    )}
                    <span>{message.timestamp.toLocaleTimeString()}</span>
                  </span>
                </div>
              </div>
              
              {message.sender === 'AI' && (
                <div className="ml-3 flex items-center space-x-1">
                  {/* Thread Creation Dropdown */}
                  <div className="relative group">
                    <button
                      onClick={() => onCreateThread(message.id)}
                      className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all"
                      title="Create Thread"
                    >
                      <Settings className="w-4 h-4 text-gray-600" />
                    </button>
                    
                    {/* Thread Creation Options */}
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <div className="px-3 py-2 border-b border-gray-100">
                        <div className="text-xs font-medium text-gray-700 mb-2">Create Thread</div>
                      </div>
                      
                      <button
                        onClick={() => {
                          onCreateThread(message.id);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <GitBranch className="w-4 h-4" />
                        <span>Regular Thread</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          createAIGroupManager(message.id);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 flex items-center space-x-2"
                      >
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span>AI Group Manager</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          createImportantNote(message.id);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-yellow-50 flex items-center space-x-2"
                      >
                        <Bookmark className="w-4 h-4 text-yellow-600" />
                        <span>Save as Important</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Related Threads & Suggestions Dropdown */}
                  {(siblingThreads.length > 0 || suggestedThreads.length > 0) && (
                    <div className="relative">
                      <button
                        onClick={() => {
                          console.log('Toggling dropdown for message:', message.id);
                          onToggleDropdown();
                        }}
                        className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all"
                        title="Related & Suggested Threads"
                      >
                        <Share2 className="w-4 h-4 text-gray-600" />
                      </button>
                      
                      {threadDropdown && (
                        <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                          {/* Existing Sibling Threads */}
                          {siblingThreads.length > 0 && (
                            <>
                              <div className="px-3 py-2 border-b border-gray-100">
                                <div className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                                  <GitBranch className="w-4 h-4" />
                                  <span>Related Threads ({siblingThreads.length})</span>
                                </div>
                              </div>
                              {siblingThreads.map(thread => (
                                <button
                                  key={thread.id}
                                  onClick={() => {
                                    console.log('Navigating to related thread:', thread.id);
                                    onNavigateToThread(thread.id);
                                    onToggleDropdown();
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between"
                                >
                                  <div>
                                    <div className="text-sm text-gray-900">#{thread.id.slice(-4)}</div>
                                    <div className="text-xs text-gray-500">
                                      {thread.selectedText ? 
                                        `"${thread.selectedText.slice(0, 30)}..."` : 
                                        `Level ${thread.level}`
                                      }
                                    </div>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                </button>
                              ))}
                            </>
                          )}
                          
                          {/* AI Suggested Threads */}
                          {suggestedThreads.length > 0 && (
                            <>
                              {siblingThreads.length > 0 && <div className="border-t border-gray-100 my-2" />}
                              <div className="px-3 py-2 border-b border-gray-100">
                                <div className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                                  <span>AI Suggestions</span>
                                </div>
                              </div>
                              {suggestedThreads.slice(0, 3).map((suggestion, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    console.log('Creating suggested thread:', suggestion.text);
                                    onCreateSuggestedThread(message.id, suggestion);
                                    onToggleDropdown();
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-yellow-50 text-sm flex items-start space-x-2"
                                >
                                  <span className="text-yellow-500 mt-0.5">💡</span>
                                  <div>
                                    <div className="text-gray-900">{suggestion.text}</div>
                                    <div className="text-xs text-gray-500 capitalize">{suggestion.type} • {suggestion.priority} priority</div>
                                  </div>
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    };
  
    const ThreadHierarchy = ({ 
      parentMsgId, 
      threads, 
      messages, 
      compactMode,
      onNavigateToThread,
      onOpenThread,
      onToggleThread,
      onResolveThread,
      onInviteToThread,
      getThreadMessages,
      getSiblingThreads,
      getChildThreads,
      onSendMessage
    }) => {
      const mainThreads = threads.filter(t => t.parentMsgId === parentMsgId);
      
      return (
        <div className="space-y-4">
          {mainThreads.map(thread => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              threads={threads}
              messages={messages}
              compactMode={compactMode}
              onNavigateToThread={onNavigateToThread}
              onOpenThread={onOpenThread}
              onToggleThread={onToggleThread}
              onResolveThread={onResolveThread}
              onInviteToThread={onInviteToThread}
              getThreadMessages={getThreadMessages}
              getSiblingThreads={getSiblingThreads}
              getChildThreads={getChildThreads}
              level={0}
              onSendMessage={onSendMessage}
            />
          ))}
        </div>
      );
    };
  
    const ThreadCard = ({ 
      thread, 
      threads, 
      messages, 
      compactMode,
      onNavigateToThread,
      onOpenThread,
      onToggleThread,
      onResolveThread,
      onInviteToThread,
      getThreadMessages,
      getSiblingThreads,
      getChildThreads,
      level = 0,
      onSendMessage
    }) => {
      const threadMessages = getThreadMessages(thread.id);
      const childThreads = getChildThreads(thread.id);
      const siblings = getSiblingThreads(thread.parentMsgId, thread.parentThreadId);
      const currentIndex = siblings.findIndex(t => t.id === thread.id);
      const isCollapsed = !thread.isExpanded;
      
      const levelColors = [
        'from-blue-50 to-blue-50 border-blue-200',
        'from-purple-50 to-purple-50 border-purple-200',
        'from-green-50 to-green-50 border-green-200',
        'from-orange-50 to-orange-50 border-orange-200'
      ];
      
      const levelColor = levelColors[Math.min(level, levelColors.length - 1)];
      
      const [showInline, setShowInline] = useState(false);
      
      const isInlineOpen = thread.showInline || showInline;
      
      return (
        <div
          id={`thread-summary-${thread.id}`}
          className={`mt-4 relative ${level > 0 ? 'ml-12' : 'ml-12'} ${thread.highlight ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
        >
          {/* Visual Connection */}
          <div className="absolute left-8 top-0 w-px h-6 bg-gradient-to-b from-blue-200 to-transparent"></div>
          <div className="absolute left-7 top-6 w-3 h-3 bg-blue-400 rounded-full border-2 border-white shadow-sm"></div>
          
          <div className={`bg-gradient-to-r ${levelColor} border rounded-xl shadow-sm transition-all ${
            compactMode ? 'p-3' : 'p-4'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <GitBranch className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900 text-sm">
                    Thread #{thread.id.slice(-4)}
                  </span>
                  {thread.level > 1 && (
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
                      L{thread.level}
                    </span>
                  )}
                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                    {thread.model}
                  </span>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {threadMessages.length} messages
                  </span>
                  {thread.isSuggested && (
                    <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded">
                      💡 AI Suggested
                    </span>
                  )}
                  {thread.isImportantNote && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded flex items-center space-x-1">
                      <Bookmark className="w-3 h-3" />
                      <span>Important</span>
                    </span>
                  )}
                </div>
              </div>
              
              {/* Enhanced Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onNavigateToThread(thread.id)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Open
                </button>
                
                {/* Create Sub-thread */}
                <button
                  onClick={() => onOpenThread(thread.parentMsgId, null, thread.id)}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium"
                  title="Create Sub-thread"
                >
                  <Plus className="w-3 h-3" />
                </button>
                
                <div className="relative group">
                  <button className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-gray-600" />
                  </button>
                  
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <button
                      onClick={() => setExportOutcomeModal({ open: true, threadId: thread.id })}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export Outcome</span>
                    </button>
                    
                    <button
                      onClick={() => setMemoryModal({ open: true, threadId: thread.id })}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Brain className="w-4 h-4" />
                      <span>View Memory</span>
                    </button>
                    <button
                      onClick={() => onInviteToThread(thread.id)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Users className="w-4 h-4" />
                      <span>Invite to Thread</span>
                    </button>
                    <button
                      onClick={() => onResolveThread(thread.id)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark Resolved</span>
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={() => onToggleThread(thread.id)}
                  className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
            </div>
  
            {/* Context Preview */}
            <div className="text-xs text-blue-700 bg-blue-100/50 px-3 py-2 rounded-lg">
              {thread.selectedText ? (
                <span>🎯 Selected: "{thread.selectedText.slice(0, 60)}..."</span>
              ) : (
                <span>💬 Thread discussion</span>
              )}
            </div>
  
            {/* Sibling Navigation */}
            {siblings.length > 1 && (
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-blue-600 font-medium">
                  Thread {currentIndex + 1} of {siblings.length} siblings
                </span>
                <div className="flex space-x-1">
                  {siblings.map((sibling, idx) => (
                    <button
                      key={sibling.id}
                      onClick={() => onNavigateToThread(sibling.id)}
                      className={`w-6 h-6 rounded text-xs font-medium transition-colors ${
                        sibling.id === thread.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      }`}
                      title={`Thread #${sibling.id.slice(-4)}`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
  
            {/* Thread Preview */}
            {!isCollapsed && (
              <div className="mt-4 space-y-3">
                {threadMessages.slice(0, compactMode ? 2 : 3).map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg text-sm ${
                      msg.sender === 'user'
                        ? 'bg-blue-100 text-blue-900 ml-6'
                        : 'bg-white text-gray-900 border border-gray-200 mr-6'
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
                
                {compactMode && threadMessages.length > 2 && (
                  <div className="text-center text-sm text-blue-600">
                    +{threadMessages.length - 2} more messages
                  </div>
                )}
                
                {threadMessages.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    💬 Click "Open" to start discussion
                  </div>
                )}
              </div>
            )}
          </div>
  
          {/* Child Threads (Sub-threads) */}
          {childThreads.length > 0 && (
            <div className="mt-3 space-y-3">
              {childThreads.map(childThread => (
                <ThreadCard
                  key={childThread.id}
                  thread={childThread}
                  threads={threads}
                  messages={messages}
                  compactMode={compactMode}
                  onNavigateToThread={onNavigateToThread}
                  onOpenThread={onOpenThread}
                  onToggleThread={onToggleThread}
                  onResolveThread={onResolveThread}
                  onInviteToThread={onInviteToThread}
                  getThreadMessages={getThreadMessages}
                  getSiblingThreads={getSiblingThreads}
                  getChildThreads={getChildThreads}
                  level={level + 1}
                  onSendMessage={onSendMessage}
                />
              ))}
            </div>
          )}
  
          {isInlineOpen && (
            <div className="mt-3 border-t border-gray-200 pt-3">
              {/* Render all messages for this thread */}
              {getThreadMessages(thread.id).map(msg => (
                <div key={msg.id} className={`p-3 rounded-lg text-sm ${msg.sender === 'user' ? 'bg-blue-100 text-blue-900 ml-6' : 'bg-white text-gray-900 border border-gray-200 mr-6'}`}>{msg.content}</div>
              ))}
              {/* Input for this thread */}
              <div className="flex space-x-2 mt-2">
                <input
                  type="text"
                  placeholder="Reply in this thread..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  onKeyPress={e => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      onSendMessage(e.target.value, thread.id, thread.model);
                      e.target.value = '';
                    }
                  }}
                />
                <button
                  onClick={e => {
                    const input = e.target.parentElement.querySelector('input');
                    if (input?.value.trim()) {
                      onSendMessage(input.value, thread.id, thread.model);
                      input.value = '';
                    }
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigateToThread(thread.id)}
                  className="px-2 py-2 ml-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs"
                >Go to full view</button>
              </div>
              {/* Render sub-thread hierarchy under this thread */}
              <ThreadHierarchy
                parentMsgId={thread.id}
                threads={threads}
                messages={messages}
                compactMode={compactMode}
                onNavigateToThread={onNavigateToThread}
                onOpenThread={onOpenThread}
                onToggleThread={onToggleThread}
                onResolveThread={onResolveThread}
                onInviteToThread={onInviteToThread}
                getThreadMessages={getThreadMessages}
                getSiblingThreads={getSiblingThreads}
                getChildThreads={getChildThreads}
                onSendMessage={onSendMessage}
              />
            </div>
          )}
        </div>
      );
    };
  
    const ThreadView = ({ 
      threadId, 
      threads, 
      messages, 
      availableModels, 
      suggestedQuestions,
      isTyping,
      onSendMessage,
      onSwitchModel,
      onOpenSubThread,
      onInviteToThread,
      getRelatedThreads,
      getThreadMessages,
      canInvite,
      selectedText,
      setSelectedText,
      selectionContext,
      setSelectionContext,
      handleTextSelection,
      activeUsers,
      openThread
    }) => {
      const currentThread = threads.find(t => t.id === threadId);
      const threadMessages = getThreadMessages(threadId);
      const related = getRelatedThreads(threadId);
      const parentMessage = currentThread && messages.find(m => m.id === currentThread.parentMsgId);
      
      if (!currentThread) {
        return <div className="flex-1 flex items-center justify-center text-gray-500">Thread not found</div>;
      }
  
      return (
        <div className="flex-1 flex flex-col">
          {/* Enhanced Thread Header */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <GitBranch className="w-6 h-6 text-blue-600" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Thread #{threadId.slice(-4)}
                      </h2>
                      {currentThread.level > 1 && (
                        <span className="text-sm bg-purple-100 text-purple-600 px-2 py-1 rounded">
                          Level {currentThread.level}
                        </span>
                      )}
                    </div>
                    
                    {/* Users online under thread name */}
                    {activeUsers.length > 1 && (
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex -space-x-1">
                          {activeUsers.slice(0, 4).map(user => (
                            <div key={user.id} className="w-5 h-5 bg-white rounded-full border border-gray-300 flex items-center justify-center text-xs">
                              {user.avatar}
                            </div>
                          ))}
                          {activeUsers.length > 4 && (
                            <div className="w-5 h-5 bg-gray-100 rounded-full border border-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
                              +{activeUsers.length - 4}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-600">{activeUsers.length} online</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
  
              <div className="flex items-center space-x-3">
                {/* Current Model Display */}
                <div className="flex items-center space-x-2">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${availableModels.find(m => m.id === currentThread.model)?.color || 'bg-gray-100 text-gray-800'}`}>
                    {availableModels.find(m => m.id === currentThread.model)?.name || currentThread.model}
                  </div>
                  {currentThread.isGroupManager && (
                    <div className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                      👥 Group Manager
                    </div>
                  )}
                </div>
                
                {/* Settings Menu */}
                <div className="relative group">
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Settings className="w-5 h-5" />
                  </button>
                  
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    {/* Model Selection */}
                    <div className="px-3 py-2 border-b border-gray-100">
                      <div className="text-xs font-medium text-gray-700 mb-2">AI Model</div>
                      <select
                        value={currentThread.model}
                        onChange={(e) => onSwitchModel(currentThread.id, e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        {availableModels.map(model => (
                          <option key={model.id} value={model.id}>
                            {model.name} - {model.description}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Thread Actions */}
                    <div className="px-3 py-2 border-b border-gray-100">
                      <div className="text-xs font-medium text-gray-700 mb-2">Thread Actions</div>
                      <div className="space-y-1">
                        <button
                          onClick={() => setExportOutcomeModal({ open: true, threadId: currentThread.id })}
                          className="w-full text-left px-2 py-1 text-sm hover:bg-gray-50 rounded flex items-center space-x-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Export Outcome</span>
                        </button>
                        
                        <button
                          onClick={() => setMemoryModal({ open: true, threadId: currentThread.id })}
                          className="w-full text-left px-2 py-1 text-sm hover:bg-gray-50 rounded flex items-center space-x-2"
                        >
                          <Brain className="w-4 h-4" />
                          <span>View Memory</span>
                        </button>
                        
                        <button
                          onClick={() => openThread(currentThread.parentMsgId, null, currentThread.id)}
                          className="w-full text-left px-2 py-1 text-sm hover:bg-gray-50 rounded flex items-center space-x-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Create Sub-thread</span>
                        </button>
                        
                        {canInvite && (
                          <button
                            onClick={() => onInviteToThread(currentThread.id)}
                            className="w-full text-left px-2 py-1 text-sm hover:bg-gray-50 rounded flex items-center space-x-2"
                          >
                            <Users className="w-4 h-4" />
                            <span>Collaborate</span>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Navigation Info */}
                    <div className="px-3 py-2">
                      <div className="text-xs font-medium text-gray-700 mb-2">Thread Info</div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div>Level {currentThread.level} Thread</div>
                        <div>{threadMessages.length} messages</div>
                        {related.siblings.length > 0 && (
                          <div>{related.siblings.length} sibling threads</div>
                        )}
                        {related.children.length > 0 && (
                          <div>{related.children.length} sub-threads</div>
                        )}
                        {currentThread.selectedText && (
                          <div className="flex items-center space-x-1">
                            <Target className="w-3 h-3" />
                            <span>Text-focused</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
  
            {/* Simplified Context Display */}
            {currentThread.selectedText ? (
              <div className="mt-4 p-3 bg-white rounded-lg border-l-4 border-blue-500">
                <div className="text-xs text-gray-500 mb-1">Selected Text Focus</div>
                <p className="text-sm text-gray-800">"{currentThread.selectedText}"</p>
              </div>
            ) : parentMessage && (
              <div className="mt-4 p-3 bg-white rounded-lg border-l-4 border-blue-500">
                <div className="text-xs text-gray-500 mb-1">Original Context</div>
                <p className="text-sm text-gray-800">{parentMessage.content.slice(0, 100)}...</p>
              </div>
            )}
          </div>
  
          {/* Thread Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {threadMessages.map((msg, index) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-3xl px-4 py-3 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : msg.isPlugin
                      ? 'bg-purple-50 text-purple-900 border border-purple-200'
                      : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                  } relative group`}
                  onMouseUp={() => {
                    if (msg.sender === 'AI') {
                      handleTextSelection(msg.id, msg.content);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      
                      {/* Text Selection Thread Option for Thread Messages */}
                      {selectedText && selectionContext?.messageId === msg.id && msg.sender === 'AI' && selectedText.replace(/\s|"/g, '').length > 0 && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="text-xs text-green-600 mb-2 font-medium">
                            Selected: {selectedText.slice(0, 50)}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                openThread(msg.id, selectedText, currentThread.id);
                                setSelectedText('');
                                setSelectionContext(null);
                              }}
                              className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                            >
                              <Target className="w-3 h-3" />
                              <span>Create Sub-thread</span>
                            </button>
                            <button
                              onClick={() => {
                                openThread(msg.id, selectedText, currentThread.parentThreadId);
                                setSelectedText('');
                                setSelectionContext(null);
                              }}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                            >
                              <GitBranch className="w-3 h-3" />
                              <span>Sibling Thread</span>
                            </button>
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            Sub-thread: Creates child thread • Sibling: Creates brother thread
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-2 text-xs opacity-75 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {msg.model && msg.sender !== 'user' && (
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {msg.model}
                            </span>
                          )}
                          <span>Step {index + 1}</span>
                        </div>
                        <span>{msg.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </div>
                    
                    {/* Thread Creation Options for AI Messages in Threads */}
                    {msg.sender === 'AI' && (
                      <div className="ml-3 flex items-center space-x-1">
                        <button
                          onClick={() => {
                            console.log('Creating sub-thread from message:', msg.id);
                            openThread(msg.id, null, currentThread.id);
                          }}
                          className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all"
                          title="Create Sub-thread from this message"
                        >
                          <Plus className="w-4 h-4 text-gray-600" />
                        </button>
                        
                        <button
                          onClick={() => {
                            console.log('Creating sibling thread from message:', msg.id);
                            openThread(msg.id, null, currentThread.parentThreadId);
                          }}
                          className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all"
                          title="Create Sibling thread from this message"
                        >
                          <GitBranch className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {/* Render collapsible sub-threads under this message */}
                <ThreadHierarchy
                  parentMsgId={msg.id}
                  threads={threads}
                  messages={messages}
                  compactMode={true}
                  onNavigateToThread={navigateToThread}
                  onOpenThread={openThread}
                  onToggleThread={toggleThread}
                  onResolveThread={resolveThread}
                  onInviteToThread={onInviteToThread}
                  getThreadMessages={getThreadMessages}
                  getSiblingThreads={getSiblingThreads}
                  getChildThreads={getChildThreads}
                  onSendMessage={onSendMessage}
                />
              </div>
            ))}
  
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl shadow-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
  
            {/* AI Suggestions for Thread Continuation */}
            {suggestedQuestions.length > 0 && (
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <h4 className="text-sm font-medium text-yellow-800 mb-3 flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Continue the discussion
                </h4>
                <div className="space-y-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => onSendMessage(question, currentThread.id, currentThread.model)}
                      className="w-full text-left text-sm p-3 bg-white border border-yellow-300 rounded-lg hover:bg-yellow-100 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
  
          {/* Thread Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex space-x-3">
              <input
                type="text"
                placeholder={`Continue ${currentThread.selectedText ? 'focused' : 'thread'} discussion...`}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    onSendMessage(e.target.value, currentThread.id, currentThread.model);
                    e.target.value = '';
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.target.parentElement.querySelector('input');
                  if (input?.value.trim()) {
                    onSendMessage(input.value, currentThread.id, currentThread.model);
                    input.value = '';
                  }
                }}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            {/* Thread-specific status */}
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
              <div className="flex items-center space-x-3">
                <span>Level {currentThread.level} Thread</span>
                <span>{threadMessages.length} messages</span>
                {currentThread.selectedText && (
                  <span className="flex items-center space-x-1">
                    <Target className="w-3 h-3" />
                    <span>Text-focused</span>
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span>{currentThread.model}</span>
              </div>
            </div>
          </div>
        </div>
      );
    };
  
    const handleInviteToThread = (threadId) => {
      setCurrentInviteThread(threadId);
      setInviteModal(true);
    };
  
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <OnboardingTour />
        <CollaborationModal />
        
        {/* Enhanced Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-4" id="navigation">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {currentView !== 'main' && (
              <button
                onClick={navigateBack}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
            
            {/* Enhanced Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.id}>
                  <button
                    onClick={() => jumpTo(crumb.id)}
                    className={`font-medium transition-colors ${
                      index === breadcrumbs.length - 1 
                        ? 'text-gray-900' 
                        : 'text-blue-600 hover:text-blue-800'
                    }`}
                  >
                    {crumb.label}
                  </button>
                  {index < breadcrumbs.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>
  
          <div className="flex items-center space-x-3">
            {/* Settings Menu */}
            <div className="relative group">
              <button 
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {/* Collaboration */}
                {canInvite && (
                  <button
                    onClick={() => {
                      setCurrentInviteThread(null);
                      setInviteModal(true);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>Collaborate</span>
                  </button>
                )}
                
                {/* Compact Mode */}
                <button
                  onClick={() => setCompactMode(!compactMode)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                >
                  {compactMode ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  <span>{compactMode ? 'Expand View' : 'Compact View'}</span>
                </button>
                
                {/* Export */}
                <button
                  onClick={() => {
                    exportSession();
                    console.log('Export clicked');
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Session</span>
                </button>
                
                {/* Tutorial */}
                <button
                  onClick={() => {
                    setShowOnboarding(true);
                    setOnboardingStep(0);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Show Tutorial</span>
                </button>
                
                <div className="border-t border-gray-100 my-2"></div>
                
                {/* New Chat */}
                <button
                  onClick={() => {
                    // Reset to clean state
                    setMessages([{
                      id: generateId(),
                      sessionId: currentSessionId,
                      content: 'Hello! How can I help you today?',
                      sender: 'AI',
                      model: 'GPT-4',
                      timestamp: new Date(),
                      threadId: null
                    }]);
                    setThreads([]);
                    setCurrentView('main');
                    setNavigationHistory(['main']);
                    setBreadcrumbs([{ label: 'Main Chat', id: 'main' }]);
                    setSuggestedQuestions([]);
                    console.log('New chat started');
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Chat</span>
                </button>
              </div>
            </div>
  
            {/* Users online indicator */}
            {activeUsers.length > 1 && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg">
                <div className="flex -space-x-2">
                  {activeUsers.slice(0, 3).map(user => (
                    <div key={user.id} className="w-6 h-6 bg-white rounded-full border-2 border-white flex items-center justify-center text-xs">
                      {user.avatar}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-green-800 font-medium">{activeUsers.length} online</span>
              </div>
            )}
          </div>
        </header>
  
        <div className="flex-1 flex overflow-hidden">
          {/* Enhanced Sidebar */}
          <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} lg:w-80 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Thread Hierarchy</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded lg:hidden"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-blue-50 rounded-lg p-2 text-center">
                  <div className="font-medium text-blue-900">{activeThreads.length}</div>
                  <div className="text-blue-600 text-xs">Total</div>
                </div>
                <div className="bg-green-50 rounded-lg p-2 text-center">
                  <div className="font-medium text-green-900">{activeThreads.filter(t => !t.parentThreadId).length}</div>
                  <div className="text-green-600 text-xs">Main</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-2 text-center">
                  <div className="font-medium text-purple-900">{activeThreads.filter(t => t.parentThreadId).length}</div>
                  <div className="text-purple-600 text-xs">Sub</div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {activeThreads.length === 0 ? (
                <div className="text-center py-8">
                  <TreePine className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm mb-2">No threads yet</p>
                  <p className="text-gray-400 text-xs">Select text or click ⚙️ to start threading</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Show main threads with their hierarchies */}
                  {activeThreads
                    .filter(t => !t.parentThreadId)
                    .map(thread => (
                      <ThreadTreeNode 
                        key={thread.id} 
                        thread={thread} 
                        threads={threads}
                        messages={messages}
                        currentView={currentView}
                        onNavigate={navigateToThread}
                        getThreadMessages={getThreadMessages}
                        level={0}
                      />
                    ))}
                </div>
              )}
            </div>
          </aside>
  
          {/* Main Content */}
          <main className="flex-1 flex flex-col">
            {!messages.filter(m => m.sessionId === currentSessionId && !m.threadId).length > 0 && currentView === 'main' ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-white">
                <div className="text-4xl font-semibold text-gray-900 mb-8 text-center">
                  How can I help, {currentUser?.name || 'there'}?
                </div>
                <div className="w-full max-w-2xl flex flex-col items-center">
                  <div className="flex items-center w-full bg-white border border-gray-200 rounded-2xl shadow px-6 py-5">
                    <input
                      type="text"
                      value={draftText}
                      onChange={e => setDraftText(e.target.value)}
                      onKeyPress={e => {
                        if (e.key === 'Enter' && draftText.trim()) {
                          sendMessage(draftText);
                        }
                      }}
                      placeholder="Ask anything"
                      className="flex-1 bg-transparent outline-none text-lg"
                    />
                    <button
                      onClick={() => sendMessage(draftText)}
                      disabled={!draftText.trim()}
                      className="ml-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : currentView === 'main' ? (
              <>
                <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4" id="main-chat">
                  {messages
                    .filter(m => m.sessionId === currentSessionId && !m.threadId)
                    .map((message) => (
                      <div key={message.id}>
                        <MessageBubble 
                          message={message}
                          onTextSelection={handleTextSelection}
                          selectedText={selectedText}
                          selectionContext={selectionContext}
                          onCreateThread={openThread}
                          onCreateSelectedThread={(text) => {
                            openThread(message.id, text, null);
                            setSelectedText('');
                            setSelectionContext(null);
                          }}
                          siblingThreads={getSiblingThreads(message.id)}
                          suggestedThreads={suggestedThreads[message.id] || []}
                          onCreateSuggestedThread={createSuggestedThread}
                          threadDropdown={threadDropdowns[message.id]}
                          onToggleDropdown={() => toggleThreadDropdown(message.id)}
                          onNavigateToThread={navigateToThread}
                        />
                        {/* Inline sub-threads under this message */}
                        <ThreadHierarchy
                          parentMsgId={message.id}
                          threads={threads}
                          messages={messages}
                          compactMode={compactMode}
                          onNavigateToThread={navigateToThread}
                          onOpenThread={openThread}
                          onToggleThread={toggleThread}
                          onResolveThread={resolveThread}
                          onInviteToThread={handleInviteToThread}
                          getThreadMessages={getThreadMessages}
                          getSiblingThreads={getSiblingThreads}
                          getChildThreads={getChildThreads}
                          onSendMessage={sendMessage}
                        />
                      </div>
                    ))}
  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl shadow-sm">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
  
                {/* Enhanced Main Input */}
                <footer className="bg-white border-t border-gray-200 p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    {/* Enhanced Model Selector */}
                    <div className="relative">
                      <select
                        value={currentModel}
                        onChange={(e) => setCurrentModel(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                      >
                        {availableModels.map(model => (
                          <option key={model.id} value={model.id}>
                            {model.name} - {model.description}
                          </option>
                        ))}
                      </select>
                      <div className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full ${availableModels.find(m => m.id === currentModel)?.color?.replace('text-', 'bg-').replace('100', '500') || 'bg-gray-500'}`}></div>
                    </div>
  
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && draftText.trim()) {
                            sendMessage(draftText);
                          }
                        }}
                        placeholder="Message FlowChat..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                      />
                      <button
                        onClick={() => sendMessage(draftText)}
                        disabled={!draftText.trim()}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
  
                    <button
                      onClick={() => setExportOutcomeModal({ open: true, threadId: null })}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Export & Summarize"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={exportSession}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Export Session"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                  </div>
  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>{messages.filter(m => !m.threadId).length} messages</span>
                      <span>{activeThreads.length} threads</span>
                      <span className="flex items-center space-x-1">
                        <TreePine className="w-3 h-3" />
                        <span>Advanced Threading</span>
                      </span>
                      {Object.keys(threadMemories).length > 0 && (
                        <span className="flex items-center space-x-1">
                          <Brain className="w-3 h-3" />
                          <span>{Object.keys(threadMemories).length} memories</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Zap className="w-3 h-3" />
                      <span>FlowChat Next-Gen</span>
                    </div>
                  </div>
                </footer>
              </>
            ) : (
              <ThreadView 
                threadId={currentView}
                threads={threads}
                messages={messages}
                availableModels={availableModels}
                suggestedQuestions={suggestedQuestions}
                isTyping={isTyping}
                onSendMessage={sendMessage}
                onSwitchModel={switchModel}
                onOpenSubThread={openThread}
                onInviteToThread={handleInviteToThread}
                getRelatedThreads={getRelatedThreads}
                getThreadMessages={getThreadMessages}
                canInvite={canInvite}
                selectedText={selectedText}
                setSelectedText={setSelectedText}
                selectionContext={selectionContext}
                setSelectionContext={setSelectionContext}
                handleTextSelection={handleTextSelection}
                activeUsers={activeUsers}
                openThread={openThread}
              />
            )}
          </main>
        </div>
      
      {/* Modals */}
      <OnboardingTour />
      <ExportModal />
      <CollaborationModal />
      <MemoryModal />
    </div>
  );
};

export default FlowChat;

