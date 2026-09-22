/**
 * Search History Panel
 * Displays search history for tools with ability to re-run searches
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, X, Search, Clock, Trash2, ChevronRight, 
  Globe, Mail, Phone, Hash, Link2, Shield, MapPin,
  Server, Database, Eye, Image, RefreshCw
} from 'lucide-react';
import { useSearchHistory } from '../../context/SearchHistoryContext';
import { useTheme } from '../../context/ThemeContext';

// Tool icons mapping
const toolIcons = {
  'ip-trace': Globe,
  'domain': Search,
  'email': Mail,
  'phone': Phone,
  'hash': Hash,
  'url': Link2,
  'breach': Shield,
  'geo': MapPin,
  'dns': Server,
  'database': Database,
  'social': Eye,
  'image': Image,
};

// Tool names mapping
const toolNames = {
  'ip-trace': 'IP Intelligence',
  'domain': 'Domain Analysis',
  'email': 'Email Forensics',
  'phone': 'Phone Lookup',
  'hash': 'Hash Analyzer',
  'url': 'URL Scanner',
  'breach': 'Breach Database',
  'geo': 'Geolocation',
  'dns': 'DNS Records',
  'database': 'Data Mining',
  'social': 'Social Profiler',
  'image': 'Image EXIF',
};

const SearchHistoryPanel = ({ isOpen, onClose, onSelectSearch, activeToolId = null }) => {
  const { isDark } = useTheme();
  const { 
    history, 
    getToolHistory, 
    getRecentSearches, 
    clearToolHistory, 
    clearAllHistory,
    removeSearch,
    getStats 
  } = useSearchHistory();
  
  const [selectedTool, setSelectedTool] = useState(activeToolId || 'all');
  const [confirmClear, setConfirmClear] = useState(false);

  const stats = getStats();
  
  const displaySearches = selectedTool === 'all' 
    ? getRecentSearches(50) 
    : getToolHistory(selectedTool);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = now - then;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return then.toLocaleDateString();
  };

  const handleRerunSearch = (search) => {
    if (onSelectSearch) {
      onSelectSearch(search);
      onClose();
    }
  };

  const handleClearHistory = () => {
    if (selectedTool === 'all') {
      clearAllHistory();
    } else {
      clearToolHistory(selectedTool);
    }
    setConfirmClear(false);
  };

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
            className={`w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border ${
              isDark 
                ? 'bg-slate-900 border-white/10' 
                : 'bg-white border-gray-200'
            }`}
          >
            {/* Header */}
            <div className={`p-6 border-b ${isDark ? 'border-white/10 bg-gradient-to-r from-cyan-500/10 to-violet-500/10' : 'border-gray-200 bg-gradient-to-r from-cyan-50 to-violet-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center shadow-lg">
                    <History className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Search History
                    </h2>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {stats.totalSearches} searches across {stats.toolsUsed} tools
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

              {/* Tool Filter */}
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                <button
                  onClick={() => setSelectedTool('all')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    selectedTool === 'all'
                      ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white'
                      : isDark
                        ? 'bg-white/5 text-gray-400 hover:bg-white/10'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Tools
                </button>
                {Object.keys(history).map(toolId => {
                  const Icon = toolIcons[toolId] || Search;
                  return (
                    <button
                      key={toolId}
                      onClick={() => setSelectedTool(toolId)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                        selectedTool === toolId
                          ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white'
                          : isDark
                            ? 'bg-white/5 text-gray-400 hover:bg-white/10'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {toolNames[toolId] || toolId}
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        selectedTool === toolId
                          ? 'bg-white/20'
                          : isDark ? 'bg-white/10' : 'bg-gray-200'
                      }`}>
                        {history[toolId]?.length || 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search List */}
            <div className="max-h-[50vh] overflow-y-auto p-4 custom-scrollbar">
              {displaySearches.length > 0 ? (
                <div className="space-y-2">
                  {displaySearches.map((search, idx) => {
                    const Icon = toolIcons[search.toolId] || Search;
                    return (
                      <motion.div
                        key={search.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className={`group flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer ${
                          isDark 
                            ? 'hover:bg-white/5 border border-transparent hover:border-white/10' 
                            : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                        }`}
                        onClick={() => handleRerunSearch(search)}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isDark ? 'bg-cyan-500/10' : 'bg-cyan-50'
                        }`}>
                          <Icon className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {search.query}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {toolNames[search.toolId] || search.toolId}
                            </span>
                            <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>•</span>
                            <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(search.timestamp)}
                            </span>
                            {search.resultsSummary && (
                              <>
                                <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>•</span>
                                <span className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                  {search.resultsSummary}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRerunSearch(search);
                            }}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-cyan-500/20' : 'hover:bg-cyan-50'}`}
                            title="Run again"
                          >
                            <RefreshCw className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSearch(search.toolId, search.id);
                            }}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-rose-500/20' : 'hover:bg-rose-50'}`}
                            title="Remove"
                          >
                            <Trash2 className={`w-4 h-4 ${isDark ? 'text-rose-400' : 'text-rose-500'}`} />
                          </motion.button>
                        </div>

                        <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-600' : 'text-gray-400'} group-hover:translate-x-1 transition-transform`} />
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <History className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    No search history yet
                  </h3>
                  <p className={`text-sm mt-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    Your searches will appear here
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {displaySearches.length > 0 && (
              <div className={`p-4 border-t ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  {confirmClear ? (
                    <div className="flex items-center gap-3">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Clear all {selectedTool === 'all' ? '' : toolNames[selectedTool] + ' '}history?
                      </span>
                      <button
                        onClick={handleClearHistory}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 text-sm font-medium hover:bg-rose-500/30 transition-colors"
                      >
                        Yes, clear
                      </button>
                      <button
                        onClick={() => setConfirmClear(false)}
                        className={`px-3 py-1.5 rounded-lg text-sm ${isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'}`}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmClear(true)}
                      className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-500 hover:text-rose-400' : 'text-gray-500 hover:text-rose-500'} transition-colors`}
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear history
                    </button>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Done
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchHistoryPanel;
