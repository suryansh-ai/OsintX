import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HelpCircle, ChevronLeft, Search, BookOpen, MessageCircle, Keyboard,
  ChevronDown, ChevronRight, ExternalLink, Play, FileText, Wrench,
  Shield, Zap, Terminal, Globe, Target, AlertTriangle, CheckCircle,
  Mail, Clock, Send, ThumbsUp, ThumbsDown, Copy, Check, X,
  Lightbulb, Users, Award, Settings, Video, Code, Database
} from 'lucide-react';

const HelpCenter = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, type: 'assistant', message: 'Hello! I\'m your OsintX assistant. How can I help you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(null);

  const tabs = [
    { id: 'faq', name: 'FAQs', icon: HelpCircle },
    { id: 'tutorials', name: 'Tutorials', icon: Play },
    { id: 'tools', name: 'Tool Guides', icon: Wrench },
    { id: 'shortcuts', name: 'Shortcuts', icon: Keyboard },
    { id: 'chat', name: 'Live Chat', icon: MessageCircle },
  ];

  const faqs = [
    {
      category: 'Getting Started',
      items: [
        { q: 'How do I start my first investigation?', a: 'Navigate to "Case Files" from your dashboard. Select a case marked as "Beginner Friendly" to start. Read the case brief, analyze the provided evidence, and use the terminal commands to investigate.' },
        { q: 'What are credits and how do I earn them?', a: 'Credits are your in-platform currency. You earn them by completing cases, achieving badges, maintaining login streaks, and participating in challenges. Use credits to unlock advanced tools and premium cases.' },
        { q: 'How does the XP system work?', a: 'XP (Experience Points) determine your agent level. Earn XP by completing cases, using tools correctly, and achieving objectives. Higher levels unlock harder cases and advanced features.' },
      ]
    },
    {
      category: 'Investigation Tools',
      items: [
        { q: 'How do I use the Packet Analyzer?', a: 'The Packet Analyzer lets you examine network traffic. Upload a PCAP file or paste packet data. Use filters to narrow down specific protocols, IPs, or patterns. Look for anomalies in traffic patterns.' },
        { q: 'What is the Hash Decoder used for?', a: 'The Hash Decoder helps verify file integrity and identify malware. Paste a hash (MD5, SHA1, SHA256) to check against known databases. Compare file hashes to detect tampering.' },
        { q: 'How do I analyze malware safely?', a: 'Use the Malware Sandbox tool. It runs suspicious files in an isolated environment. Never download malware to your local machine. The sandbox provides behavioral analysis and indicators of compromise.' },
      ]
    },
    {
      category: 'Cases & Missions',
      items: [
        { q: 'What happens if I fail a case?', a: 'Don\'t worry! You can retry any case. You\'ll receive partial XP for progress made. Review the case feedback to understand what you missed. Use hints if you\'re stuck (costs credits).' },
        { q: 'Can I collaborate with other agents?', a: 'Team investigations are available for select cases. Look for the "Team" badge on cases. You can also discuss strategies in the community forums without sharing case solutions.' },
        { q: 'How are cases difficulty levels determined?', a: 'Cases are rated Easy, Medium, or Hard based on: required skills, time to complete, number of steps, and complexity of evidence. Start with Easy cases to build foundational skills.' },
      ]
    },
    {
      category: 'Account & Progress',
      items: [
        { q: 'How do I track my progress?', a: 'Visit your Profile page to see your level, XP, badges, and statistics. The Progress Reports section provides detailed analytics including strengths, weaknesses, and improvement suggestions.' },
        { q: 'Can I reset my progress?', a: 'Account reset is available in Settings > Data & Export. This will clear all progress, badges, and statistics. This action is irreversible. Consider downloading your data first.' },
        { q: 'How do certificates work?', a: 'Complete course tracks to earn certificates. Certificates are verifiable with unique IDs. Share them on LinkedIn or download as PDFs. They demonstrate your cybersecurity skills to employers.' },
      ]
    },
  ];

  const tutorials = [
    { id: 1, title: 'Getting Started with OsintX', duration: '5 min', level: 'Beginner', icon: '🚀', description: 'Learn the basics of navigation and your first investigation' },
    { id: 2, title: 'Mastering the Terminal', duration: '10 min', level: 'Beginner', icon: '💻', description: 'Essential terminal commands for investigations' },
    { id: 3, title: 'Network Traffic Analysis', duration: '15 min', level: 'Intermediate', icon: '📡', description: 'Analyze packets and identify suspicious traffic' },
    { id: 4, title: 'Phishing Email Investigation', duration: '12 min', level: 'Beginner', icon: '📧', description: 'Identify and analyze phishing attempts' },
    { id: 5, title: 'Malware Analysis Basics', duration: '20 min', level: 'Intermediate', icon: '🦠', description: 'Safely analyze suspicious files and executables' },
    { id: 6, title: 'Digital Forensics 101', duration: '25 min', level: 'Advanced', icon: '🔍', description: 'Deep dive into forensic investigation techniques' },
  ];

  const toolGuides = [
    { name: 'Packet Analyzer', icon: '📡', category: 'Network', description: 'Capture and analyze network packets', features: ['PCAP file support', 'Protocol filtering', 'Traffic visualization', 'Anomaly detection'] },
    { name: 'Hash Decoder', icon: '🔐', category: 'Crypto', description: 'Decode and verify cryptographic hashes', features: ['MD5/SHA support', 'Database lookup', 'File verification', 'Bulk processing'] },
    { name: 'Log Parser', icon: '📋', category: 'Forensics', description: 'Parse and analyze system logs', features: ['Multi-format support', 'Pattern matching', 'Timeline creation', 'Export options'] },
    { name: 'Email Analyzer', icon: '📧', category: 'Phishing', description: 'Analyze email headers and content', features: ['Header inspection', 'Link analysis', 'Attachment scanning', 'Reputation check'] },
    { name: 'IP Tracer', icon: '🌐', category: 'Network', description: 'Trace IP addresses and geolocation', features: ['Geolocation', 'Reverse DNS', 'WHOIS lookup', 'Threat intel'] },
    { name: 'Malware Sandbox', icon: '🧪', category: 'Malware', description: 'Safely analyze suspicious files', features: ['Isolated execution', 'Behavior analysis', 'Network monitoring', 'Report generation'] },
  ];

  const keyboardShortcuts = [
    { category: 'Global', shortcuts: [
      { keys: ['Ctrl', 'K'], action: 'Open search' },
      { keys: ['Ctrl', 'B'], action: 'Toggle sidebar' },
      { keys: ['Esc'], action: 'Close modal / Go back' },
      { keys: ['?'], action: 'Open help' },
    ]},
    { category: 'Terminal', shortcuts: [
      { keys: ['Enter'], action: 'Execute command' },
      { keys: ['↑', '↓'], action: 'Navigate command history' },
      { keys: ['Tab'], action: 'Autocomplete command' },
      { keys: ['Ctrl', 'L'], action: 'Clear terminal' },
      { keys: ['Ctrl', 'C'], action: 'Cancel command' },
    ]},
    { category: 'Navigation', shortcuts: [
      { keys: ['G', 'D'], action: 'Go to Dashboard' },
      { keys: ['G', 'C'], action: 'Go to Cases' },
      { keys: ['G', 'T'], action: 'Go to Tools' },
      { keys: ['G', 'P'], action: 'Go to Profile' },
      { keys: ['G', 'S'], action: 'Go to Settings' },
    ]},
    { category: 'Actions', shortcuts: [
      { keys: ['N'], action: 'New investigation' },
      { keys: ['S'], action: 'Save progress' },
      { keys: ['R'], action: 'Refresh data' },
      { keys: ['F'], action: 'Toggle fullscreen' },
    ]},
  ];

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    
    const userMessage = { id: Date.now(), type: 'user', message: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');

    // Simulate assistant response
    setTimeout(() => {
      const assistantResponses = [
        'I can help you with that! Could you provide more details about your issue?',
        'Great question! Let me find the relevant information for you.',
        'I understand. Here\'s what I recommend: Check the FAQ section for detailed guides on this topic.',
        'For this specific issue, I\'d suggest visiting the Tool Guides section. Would you like me to direct you there?',
      ];
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        message: assistantResponses[Math.floor(Math.random() * assistantResponses.length)]
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  };

  const copyShortcut = (keys) => {
    navigator.clipboard.writeText(keys.join(' + '));
    setCopied(keys.join('-'));
    setTimeout(() => setCopied(null), 2000);
  };

  const filteredFaqs = faqs.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <div className="min-h-screen bg-[#010408] text-gray-100">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-transparent to-blue-950/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.1),transparent_50%)]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard/student')}
              className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-cyan-400" />
                Help Center
              </h1>
              <p className="text-sm text-gray-500">Documentation, guides, and support</p>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 text-white placeholder-gray-500 outline-none focus:border-cyan-500 transition-all"
            />
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 mb-6 overflow-x-auto pb-2"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm">{tab.name}</span>
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* FAQs */}
          {activeTab === 'faq' && (
            <motion.div
              key="faq"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-12">
                  <HelpCircle className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-400">No FAQs match your search</p>
                </div>
              ) : (
                filteredFaqs.map((category, catIdx) => (
                  <div key={catIdx} className="p-4 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-400" />
                      {category.category}
                    </h3>
                    <div className="space-y-2">
                      {category.items.map((faq, faqIdx) => {
                        const faqId = `${catIdx}-${faqIdx}`;
                        return (
                          <div
                            key={faqIdx}
                            className="border border-gray-800 rounded-lg overflow-hidden"
                          >
                            <button
                              onClick={() => setExpandedFaq(expandedFaq === faqId ? null : faqId)}
                              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800/30 transition-all"
                            >
                              <span className="text-sm text-white pr-4">{faq.q}</span>
                              <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${
                                expandedFaq === faqId ? 'rotate-180' : ''
                              }`} />
                            </button>
                            <AnimatePresence>
                              {expandedFaq === faqId && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 pb-4 text-sm text-gray-400 border-t border-gray-800 pt-3">
                                    {faq.a}
                                  </div>
                                  <div className="px-4 pb-4 flex items-center gap-2">
                                    <span className="text-xs text-gray-600">Was this helpful?</span>
                                    <button className="p-1 rounded hover:bg-green-500/20 text-gray-500 hover:text-green-400">
                                      <ThumbsUp className="w-4 h-4" />
                                    </button>
                                    <button className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400">
                                      <ThumbsDown className="w-4 h-4" />
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* Tutorials */}
          {activeTab === 'tutorials' && (
            <motion.div
              key="tutorials"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {tutorials.map((tutorial) => (
                <div
                  key={tutorial.id}
                  className="p-4 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 hover:border-cyan-500/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{tutorial.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium mb-1 group-hover:text-cyan-400 transition-colors">
                        {tutorial.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">{tutorial.description}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {tutorial.duration}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          tutorial.level === 'Beginner' ? 'bg-green-500/20 text-green-400' :
                          tutorial.level === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {tutorial.level}
                        </span>
                      </div>
                    </div>
                    <Play className="w-5 h-5 text-gray-600 group-hover:text-cyan-400 transition-colors" />
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Tool Guides */}
          {activeTab === 'tools' && (
            <motion.div
              key="tools"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {toolGuides.map((tool, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 hover:border-cyan-500/40 transition-all"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-3xl">{tool.icon}</div>
                    <div>
                      <h3 className="text-white font-medium">{tool.name}</h3>
                      <span className="text-xs text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded-full">
                        {tool.category}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{tool.description}</p>
                  <div className="space-y-1">
                    {tool.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2 text-xs text-gray-400">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  <button className="mt-4 w-full py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-sm text-gray-400 hover:text-white hover:border-gray-600 transition-all flex items-center justify-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    View Full Guide
                  </button>
                </div>
              ))}
            </motion.div>
          )}

          {/* Keyboard Shortcuts */}
          {activeTab === 'shortcuts' && (
            <motion.div
              key="shortcuts"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {keyboardShortcuts.map((category, catIdx) => (
                <div
                  key={catIdx}
                  className="p-4 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20"
                >
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Keyboard className="w-5 h-5 text-cyan-400" />
                    {category.category}
                  </h3>
                  <div className="space-y-2">
                    {category.shortcuts.map((shortcut, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-gray-900/50 hover:bg-gray-800/50 transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          {shortcut.keys.map((key, kIdx) => (
                            <span key={kIdx}>
                              <kbd className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-xs text-gray-300 font-mono">
                                {key}
                              </kbd>
                              {kIdx < shortcut.keys.length - 1 && (
                                <span className="text-gray-600 mx-1">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">{shortcut.action}</span>
                          <button
                            onClick={() => copyShortcut(shortcut.keys)}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-700 transition-all"
                          >
                            {copied === shortcut.keys.join('-') ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Live Chat */}
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-[500px] flex flex-col rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 overflow-hidden"
            >
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Cyber Assistant</h3>
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                    Online
                  </p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-3 rounded-xl ${
                      msg.type === 'user'
                        ? 'bg-cyan-500/20 border border-cyan-500/30 text-white'
                        : 'bg-gray-800/50 border border-gray-700 text-gray-300'
                    }`}>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 outline-none focus:border-cyan-500 text-sm"
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={!chatInput.trim()}
                    className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-medium hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Response time: Usually within 5 minutes during business hours
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-6 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Still need help?</h3>
              <p className="text-sm text-gray-400">Contact our support team for personalized assistance</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/dashboard/student/feedback')}
                className="px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition-all flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Contact Support
              </button>
              <button className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-medium hover:bg-cyan-400 transition-all flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Community Forum
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HelpCenter;
