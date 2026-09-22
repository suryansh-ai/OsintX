import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Loader2, Minimize2, Maximize2,
  Trash2, Copy, CheckCircle, User, Sparkles,
  HelpCircle, FileQuestion, Shield, Zap
} from 'lucide-react';

const QUICK_ACTIONS = [
  { id: 'help', label: 'How to use tools?', icon: HelpCircle },
  { id: 'credits', label: 'About credits', icon: Zap },
  { id: 'security', label: 'Security tips', icon: Shield },
  { id: 'faq', label: 'FAQs', icon: FileQuestion },
];

const ChatbotBubble = ({ userId, userName = 'User', position = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = position === 'left'
    ? 'bottom-6 left-6'
    : 'bottom-6 right-6';
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello${userName ? `, ${userName}` : ''}! I'm your OsintX assistant. How can I help you today?`,
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (messageText = inputValue) => {
    if (!messageText.trim() || isTyping) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE}/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText.trim(),
          conversationId,
          userId,
          context: {
            page: window.location.pathname,
            previousMessages: messages.slice(-5)
          }
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setConversationId(data.conversationId);

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        suggestions: data.suggestions,
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action) => {
    const queries = {
      help: 'How do I use the investigation tools?',
      credits: 'How do credits work?',
      security: 'What are the security best practices?',
      faq: 'Help me get started',
    };
    handleSendMessage(queries[action.id] || action.label);
  };

  const handleClearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Chat cleared! How can I help you today?',
      timestamp: new Date(),
    }]);
    setConversationId(null);
  };

  const handleCopyMessage = (messageId, content) => {
    navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        onClick={() => setIsOpen(true)}
        className={`fixed ${positionClasses} z-50 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 flex items-center justify-center hover:scale-110 transition-transform ${isOpen ? 'hidden' : ''}`}
        title="Chat with Assistant"
      >
        <Sparkles className="w-7 h-7 text-white" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0a1520]" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              height: isMinimized ? 'auto' : '500px'
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed ${positionClasses} z-[100] w-[380px] rounded-2xl bg-[#0a1520] border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 flex flex-col overflow-hidden`}
          >
            <div className="p-3 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="p-2 rounded-xl bg-cyan-500/20">
                      <Sparkles className="w-5 h-5 text-cyan-400" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#0a1520]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm" style={{ fontFamily: "'Papyrus', 'Copperplate', fantasy", color: '#22d3ee', textShadow: '0 0 10px rgba(34, 211, 238, 0.5)' }}>OsintX Assistant</h3>
                    <p className="text-[10px] text-cyan-400">Always here to help</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleClearChat}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Clear chat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title={isMinimized ? 'Expand' : 'Minimize'}
                  >
                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-start gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                        message.role === 'user'
                          ? 'bg-violet-500/20'
                          : message.isError
                            ? 'bg-red-500/20'
                            : 'bg-cyan-500/20'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="w-4 h-4 text-violet-400" />
                        ) : (
                          <Sparkles className={`w-4 h-4 ${message.isError ? 'text-red-400' : 'text-cyan-400'}`} />
                        )}
                      </div>

                      <div className={`group max-w-[75%] ${message.role === 'user' ? 'text-right' : ''}`}>
                        <div className={`px-3 py-2 rounded-xl text-sm ${
                          message.role === 'user'
                            ? 'bg-violet-500/20 text-white rounded-tr-none'
                            : message.isError
                              ? 'bg-red-500/10 text-red-300 rounded-tl-none'
                              : 'bg-white/5 text-gray-200 rounded-tl-none'
                        }`}>
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        </div>

                        <button
                          onClick={() => handleCopyMessage(message.id, message.content)}
                          className="mt-1 opacity-0 group-hover:opacity-100 text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-opacity"
                        >
                          {copiedId === message.id ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-green-400" />
                              <span className="text-green-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {message.suggestions.map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSendMessage(suggestion)}
                                className="px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2"
                    >
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="px-4 py-3 rounded-xl bg-white/5 rounded-tl-none">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {messages.length <= 1 && (
                  <div className="px-4 pb-2">
                    <p className="text-[10px] text-gray-500 mb-2">Quick actions:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_ACTIONS.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => handleQuickAction(action)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/10 text-xs text-gray-300 hover:text-cyan-400 transition-all"
                        >
                          <action.icon className="w-3 h-3" />
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 border-t border-cyan-500/20 bg-[#040810]/50 flex-shrink-0">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        rows={1}
                        className="w-full px-4 py-2.5 pr-12 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 outline-none resize-none transition-all"
                        style={{ minHeight: '44px', maxHeight: '120px' }}
                      />
                      <button
                        onClick={() => handleSendMessage()}
                        disabled={!inputValue.trim() || isTyping}
                        className="absolute right-2 bottom-2 p-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {isTyping ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-[9px] text-gray-500 mt-2 text-center">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    AI-powered assistant • Press Enter to send
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatbotBubble;
