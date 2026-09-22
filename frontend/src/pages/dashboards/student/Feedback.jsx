import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, ChevronLeft, Send, Bug, Lightbulb, HelpCircle, AlertCircle,
  CheckCircle, Star, Upload, X, Image, FileText, Link2, Clock, User,
  ThumbsUp, Flag, Mail, Phone, MapPin, ExternalLink, ChevronDown,
  Paperclip, Smile, AtSign, Hash
} from 'lucide-react';

const Feedback = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('submit');
  const [feedbackType, setFeedbackType] = useState('bug');
  const [priority, setPriority] = useState('medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const feedbackTypes = [
    { id: 'bug', name: 'Bug Report', icon: Bug, color: 'red', description: 'Report a technical issue' },
    { id: 'feature', name: 'Feature Request', icon: Lightbulb, color: 'amber', description: 'Suggest a new feature' },
    { id: 'question', name: 'Question', icon: HelpCircle, color: 'blue', description: 'Ask for help' },
    { id: 'other', name: 'Other', icon: MessageSquare, color: 'purple', description: 'General feedback' },
  ];

  const priorities = [
    { id: 'low', name: 'Low', color: 'green' },
    { id: 'medium', name: 'Medium', color: 'yellow' },
    { id: 'high', name: 'High', color: 'orange' },
    { id: 'critical', name: 'Critical', color: 'red' },
  ];

  const previousFeedback = [
    {
      id: 1,
      type: 'bug',
      subject: 'Terminal command not working',
      status: 'resolved',
      date: 'Dec 28, 2025',
      response: 'Fixed in v2.5.1. The help command now displays correctly.'
    },
    {
      id: 2,
      type: 'feature',
      subject: 'Add dark mode toggle in header',
      status: 'in-progress',
      date: 'Dec 25, 2025',
      response: 'Great suggestion! We\'re working on implementing quick theme toggle.'
    },
    {
      id: 3,
      type: 'question',
      subject: 'How to reset case progress?',
      status: 'answered',
      date: 'Dec 20, 2025',
      response: 'You can reset progress from Settings > Data & Export > Reset Progress.'
    },
  ];

  const faqs = [
    { q: 'How long does it take to get a response?', a: 'We typically respond within 24-48 hours for general inquiries and faster for critical issues.' },
    { q: 'Can I track my submitted feedback?', a: 'Yes! Check the "My Feedback" tab to see all your submissions and their status.' },
    { q: 'What information should I include in a bug report?', a: 'Include steps to reproduce, expected vs actual behavior, browser/device info, and screenshots if possible.' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject || !description) return;
    
    // Simulate submission
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSubject('');
      setDescription('');
      setAttachments([]);
      setFeedbackType('bug');
      setPriority('medium');
      setActiveTab('history');
    }, 2000);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => ({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type.includes('image') ? 'image' : 'file'
    }));
    setAttachments(prev => [...prev, ...newAttachments].slice(0, 5));
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'in-progress': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'answered': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'pending': return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-[#010408] text-gray-100">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-transparent to-blue-950/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.1),transparent_50%)]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
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
                <MessageSquare className="w-6 h-6 text-cyan-400" />
                Feedback & Support
              </h1>
              <p className="text-sm text-gray-500">We'd love to hear from you</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6"
        >
          {[
            { id: 'submit', name: 'Submit Feedback' },
            { id: 'history', name: 'My Feedback' },
            { id: 'contact', name: 'Contact Us' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg border transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Submit Feedback */}
          {activeTab === 'submit' && (
            <motion.div
              key="submit"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {submitted ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
                  <p className="text-gray-400 mb-6">Your feedback has been submitted successfully.</p>
                  <p className="text-sm text-gray-500">We'll review it and get back to you soon.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Feedback Type */}
                  <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20">
                    <h3 className="text-sm font-medium text-gray-300 mb-4">What type of feedback?</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {feedbackTypes.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setFeedbackType(type.id)}
                          className={`p-4 rounded-xl border transition-all text-left ${
                            feedbackType === type.id
                              ? `bg-${type.color}-500/20 border-${type.color}-500/50`
                              : 'bg-gray-800/30 border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <type.icon className={`w-6 h-6 mb-2 ${
                            feedbackType === type.id ? `text-${type.color}-400` : 'text-gray-500'
                          }`} />
                          <p className={`text-sm font-medium ${
                            feedbackType === type.id ? 'text-white' : 'text-gray-400'
                          }`}>{type.name}</p>
                          <p className="text-xs text-gray-600 mt-1">{type.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Priority (for bugs) */}
                  {feedbackType === 'bug' && (
                    <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20">
                      <h3 className="text-sm font-medium text-gray-300 mb-4">Priority Level</h3>
                      <div className="flex gap-3">
                        {priorities.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setPriority(p.id)}
                            className={`px-4 py-2 rounded-lg border transition-all ${
                              priority === p.id
                                ? `bg-${p.color}-500/20 border-${p.color}-500/50 text-${p.color}-400`
                                : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-600'
                            }`}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subject & Description */}
                  <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Subject *</label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Brief summary of your feedback"
                        className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 outline-none focus:border-cyan-500 transition-all"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={
                          feedbackType === 'bug'
                            ? 'Please describe the issue in detail. Include:\n- Steps to reproduce\n- Expected behavior\n- Actual behavior\n- Browser/device info'
                            : 'Please provide detailed feedback...'
                        }
                        rows={6}
                        className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 outline-none focus:border-cyan-500 transition-all resize-none"
                        required
                      />
                    </div>

                    {/* Attachments */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Attachments (optional)</label>
                      <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-gray-600 transition-all">
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                          accept="image/*,.pdf,.txt,.log"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <Upload className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">
                            Drag & drop files here or <span className="text-cyan-400">browse</span>
                          </p>
                          <p className="text-xs text-gray-600 mt-1">Max 5 files, up to 5MB each</p>
                        </label>
                      </div>
                      
                      {attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {attachments.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50"
                            >
                              <div className="flex items-center gap-2">
                                {file.type === 'image' ? (
                                  <Image className="w-4 h-4 text-blue-400" />
                                ) : (
                                  <FileText className="w-4 h-4 text-gray-400" />
                                )}
                                <span className="text-sm text-gray-300">{file.name}</span>
                                <span className="text-xs text-gray-600">{file.size}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAttachment(idx)}
                                className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-red-400"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Email for follow-up */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email for follow-up (optional)</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 outline-none focus:border-cyan-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:from-cyan-400 hover:to-blue-400 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Submit Feedback
                  </button>
                </form>
              )}
            </motion.div>
          )}

          {/* Feedback History */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {previousFeedback.length === 0 ? (
                <div className="text-center py-16">
                  <MessageSquare className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">No feedback yet</h3>
                  <p className="text-sm text-gray-600">Your submitted feedback will appear here</p>
                </div>
              ) : (
                previousFeedback.map((feedback) => (
                  <div
                    key={feedback.id}
                    className="p-4 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {feedback.type === 'bug' && <Bug className="w-5 h-5 text-red-400" />}
                        {feedback.type === 'feature' && <Lightbulb className="w-5 h-5 text-amber-400" />}
                        {feedback.type === 'question' && <HelpCircle className="w-5 h-5 text-blue-400" />}
                        <div>
                          <h3 className="text-white font-medium">{feedback.subject}</h3>
                          <p className="text-xs text-gray-500 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {feedback.date}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs border capitalize ${getStatusColor(feedback.status)}`}>
                        {feedback.status.replace('-', ' ')}
                      </span>
                    </div>
                    {feedback.response && (
                      <div className="mt-3 p-3 rounded-lg bg-gray-800/50 border-l-2 border-cyan-500">
                        <p className="text-xs text-gray-500 mb-1">Response from Support:</p>
                        <p className="text-sm text-gray-300">{feedback.response}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* Contact Us */}
          {activeTab === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Contact Methods */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-white font-medium mb-1">Email</h3>
                  <p className="text-sm text-gray-400 mb-3">For general inquiries</p>
                  <a href="mailto:support@osintx.com" className="text-cyan-400 text-sm hover:underline">
                    support@osintx.com
                  </a>
                </div>
                
                <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-white font-medium mb-1">Phone</h3>
                  <p className="text-sm text-gray-400 mb-3">Mon-Fri, 9AM-6PM IST</p>
                  <a href="tel:+911234567890" className="text-green-400 text-sm hover:underline">
                    +91 123 456 7890
                  </a>
                </div>
                
                <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-white font-medium mb-1">Live Chat</h3>
                  <p className="text-sm text-gray-400 mb-3">Quick support</p>
                  <button
                    onClick={() => navigate('/dashboard/student/help')}
                    className="text-purple-400 text-sm hover:underline"
                  >
                    Start Chat →
                  </button>
                </div>
              </div>

              {/* Quick Rate Experience */}
              <div className="p-6 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
                <h3 className="text-lg font-semibold text-white mb-4 text-center">Rate Your Experience</h3>
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoverRating || rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center text-sm text-gray-400">
                    Thank you for rating us {rating} star{rating > 1 ? 's' : ''}!
                  </p>
                )}
              </div>

              {/* FAQs */}
              <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20">
                <h3 className="text-lg font-semibold text-white mb-4">Frequently Asked Questions</h3>
                <div className="space-y-3">
                  {faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg bg-gray-800/30 border border-gray-800"
                    >
                      <h4 className="text-white font-medium mb-2">{faq.q}</h4>
                      <p className="text-sm text-gray-400">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Links */}
              <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20">
                <h3 className="text-lg font-semibold text-white mb-4">Connect With Us</h3>
                <div className="flex gap-4">
                  {['Twitter', 'Discord', 'GitHub', 'LinkedIn'].map((platform) => (
                    <button
                      key={platform}
                      className="flex-1 p-3 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-400 hover:text-white hover:border-cyan-500/30 transition-all flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {platform}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Feedback;
