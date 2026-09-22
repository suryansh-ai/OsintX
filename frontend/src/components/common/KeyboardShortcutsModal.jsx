/**
 * Keyboard Shortcuts Modal
 * Shows all available keyboard shortcuts in a beautiful modal
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Keyboard, X, Command, Search, Home, History, 
  Bookmark, HelpCircle, Settings, Bell, LogOut,
  ChevronRight, Zap
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

// Define all available shortcuts
const shortcuts = [
  {
    category: 'Navigation',
    icon: Home,
    items: [
      { keys: ['Ctrl', 'H'], description: 'Go to Home/Dashboard', action: 'navigation' },
      { keys: ['Ctrl', 'K'], description: 'Open Search', action: 'search' },
      { keys: ['Ctrl', 'Shift', 'H'], description: 'Show Search History', action: 'history' },
      { keys: ['Ctrl', 'B'], description: 'Show Bookmarks', action: 'bookmarks' },
    ]
  },
  {
    category: 'Tools',
    icon: Zap,
    items: [
      { keys: ['Ctrl', '1'], description: 'IP Intelligence Tool', action: 'tool-ip' },
      { keys: ['Ctrl', '2'], description: 'Domain Analysis Tool', action: 'tool-domain' },
      { keys: ['Ctrl', '3'], description: 'Email Forensics Tool', action: 'tool-email' },
      { keys: ['Ctrl', '4'], description: 'Phone Lookup Tool', action: 'tool-phone' },
    ]
  },
  {
    category: 'General',
    icon: Settings,
    items: [
      { keys: ['?'], description: 'Show Keyboard Shortcuts', action: 'help' },
      { keys: ['Escape'], description: 'Close Modal/Panel', action: 'close' },
      { keys: ['Ctrl', 'S'], description: 'Save Current Work', action: 'save' },
      { keys: ['Ctrl', 'E'], description: 'Export Results', action: 'export' },
    ]
  },
  {
    category: 'Theme & View',
    icon: HelpCircle,
    items: [
      { keys: ['Ctrl', 'Shift', 'T'], description: 'Toggle Dark/Light Theme', action: 'theme' },
      { keys: ['Ctrl', 'Shift', 'N'], description: 'Open Notifications', action: 'notifications' },
      { keys: ['Ctrl', ','], description: 'Open Settings', action: 'settings' },
    ]
  },
];

const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Close on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Filter shortcuts based on search
  const filteredShortcuts = shortcuts.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keys.join(' ').toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border ${
              isDark 
                ? 'bg-slate-900 border-white/10' 
                : 'bg-white border-gray-200'
            }`}
          >
            {/* Header */}
            <div className={`p-6 border-b ${isDark ? 'border-white/10 bg-gradient-to-r from-violet-500/10 to-cyan-500/10' : 'border-gray-200 bg-gradient-to-r from-violet-50 to-cyan-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <Keyboard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Keyboard Shortcuts
                    </h2>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Press <kbd className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-400 text-xs font-mono">?</kbd> anytime to show this
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                >
                  <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                </motion.button>
              </div>

              {/* Search */}
              <div className="mt-4 relative">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search shortcuts..."
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border transition-all ${
                    isDark 
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-violet-500/50 focus:bg-white/10' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:bg-white'
                  } outline-none`}
                  autoFocus
                />
              </div>
            </div>

            {/* Shortcuts List */}
            <div className="max-h-[60vh] overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {filteredShortcuts.length > 0 ? (
                filteredShortcuts.map((category, idx) => (
                  <motion.div
                    key={category.category}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <category.icon className={`w-4 h-4 ${isDark ? 'text-violet-400' : 'text-violet-500'}`} />
                      <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {category.category}
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {category.items.map((item, itemIdx) => (
                        <motion.div
                          key={item.description}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 + itemIdx * 0.02 }}
                          className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                            isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                          }`}
                        >
                          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {item.description}
                          </span>
                          <div className="flex items-center gap-1">
                            {item.keys.map((key, keyIdx) => (
                              <span key={keyIdx} className="flex items-center">
                                <kbd className={`px-2.5 py-1.5 text-xs font-mono rounded-lg border shadow-sm ${
                                  isDark 
                                    ? 'bg-slate-800 border-slate-700 text-gray-300' 
                                    : 'bg-gray-100 border-gray-200 text-gray-700'
                                }`}>
                                  {key === 'Ctrl' && navigator.platform.includes('Mac') ? '⌘' : key}
                                </kbd>
                                {keyIdx < item.keys.length - 1 && (
                                  <span className={`mx-1 text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>+</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Search className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                  <p className={`text-lg font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    No shortcuts found
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    Try a different search term
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`p-4 border-t ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Command className="w-3 h-3 inline mr-1" />
                  On Mac, use ⌘ instead of Ctrl
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Got it
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default KeyboardShortcutsModal;
