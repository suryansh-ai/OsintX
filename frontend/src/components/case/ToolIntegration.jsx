import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, ExternalLink, BookmarkPlus, Clock, CheckCircle,
  Globe, Mail, Phone, Hash, MapPin, Shield, Database, Image,
  Link as LinkIcon, X, ChevronRight, Play, AlertTriangle
} from 'lucide-react';
import { sanitizeResultData, sanitizeString, sanitizeToolName } from '../../utils/resultSanitizer';

const tools = [
  { id: 'ip', name: 'IP Intelligence', icon: Globe, color: 'blue', path: '/dashboard/user/tools/ip-intelligence' },
  { id: 'domain', name: 'Domain Analysis', icon: Globe, color: 'purple', path: '/dashboard/user/tools/domain-analysis' },
  { id: 'email', name: 'Email Intelligence', icon: Mail, color: 'cyan', path: '/dashboard/user/tools/email-intel' },
  { id: 'hash', name: 'Hash Analyzer', icon: Hash, color: 'amber', path: '/dashboard/user/tools/hash-analyzer' },
  { id: 'geo', name: 'Geolocation', icon: MapPin, color: 'red', path: '/dashboard/user/tools/geolocation' },
  { id: 'social', name: 'Social Profiler', icon: Shield, color: 'pink', path: '/dashboard/user/tools/social-profiler' },
  { id: 'breach', name: 'Breach Database', icon: Database, color: 'orange', path: '/dashboard/user/tools/breach-database' },
  { id: 'url', name: 'URL Scanner', icon: LinkIcon, color: 'yellow', path: '/dashboard/user/tools/url-scanner' },
  { id: 'dns', name: 'DNS Records', icon: Globe, color: 'emerald', path: '/dashboard/user/tools/dns-records' },
];

const ToolIntegration = ({
  caseId,
  onSaveResult,
  savedResults = [],
  onQuickInvestigate
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(null);
  const [activeTab, setActiveTab] = useState('investigate');

  const allSavedResults = savedResults.map((result) => ({
    ...result,
    tool: sanitizeToolName(result.tool),
    query: sanitizeString(result.query),
    summary: sanitizeString(result.summary),
    data: sanitizeResultData(result.data),
  }));

  // Quick search with tool
  const handleQuickSearch = async () => {
    if (!selectedTool || !inputValue.trim()) return;

    setIsSearching(true);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_BASE}/tools/${selectedTool.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: inputValue })
      });
      const data = await res.json();

      if (data.success) {
        const cleanData = sanitizeResultData(data.result);
        setSearchResults({
          tool: selectedTool.id,
          query: sanitizeString(inputValue),
          timestamp: new Date().toLocaleString(),
          data: cleanData
        });
      }
    } catch {
      setSearchResults({
        tool: selectedTool.id,
        query: inputValue,
        timestamp: new Date().toLocaleString(),
        data: { risk: 'unknown', summary: 'API request failed', details: {}, iocs: [] }
      });
    }

    setIsSearching(false);
  };

  // Save result to case
  const handleSaveResult = async () => {
    if (!searchResults) return;
    
    const result = {
      id: Date.now(),
      tool: sanitizeToolName(searchResults.tool),
      query: sanitizeString(searchResults.query),
      timestamp: searchResults.timestamp,
      summary: sanitizeString(searchResults.data.summary),
      risk: searchResults.data.risk,
      data: sanitizeResultData(searchResults.data)
    };
    
    await onSaveResult?.(result);
    setShowSaveModal(null);
    setSearchResults(null);
    setInputValue('');
  };

  // Navigate to full tool
  const handleOpenTool = (tool) => {
    navigate(tool.path, { state: { caseId, prefillValue: inputValue } });
  };

  // Get risk color
  const getRiskColor = (risk) => {
    switch (risk) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  // Get tool by id
  const getToolById = (id) => tools.find(t => t.id === id);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab('investigate')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
            activeTab === 'investigate'
              ? 'bg-amber-500/20 text-amber-400 border-b-2 border-amber-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          Quick Investigate
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
            activeTab === 'saved'
              ? 'bg-amber-500/20 text-amber-400 border-b-2 border-amber-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <BookmarkPlus className="w-4 h-4" />
          Saved Results ({allSavedResults.length})
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
            activeTab === 'tools'
              ? 'bg-amber-500/20 text-amber-400 border-b-2 border-amber-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          All Tools
        </button>
      </div>

      {/* Quick Investigate Tab */}
      {activeTab === 'investigate' && (
        <div className="space-y-4">
          {/* Tool Selection */}
          <div>
            <label className="text-sm text-gray-400 mb-3 block">Select Investigation Tool</label>
            <div className="grid grid-cols-6 gap-2">
              {tools.map(tool => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setSelectedTool(tool)}
                    className={`p-3 rounded-lg border transition-all ${
                      selectedTool?.id === tool.id
                        ? `bg-${tool.color}-500/20 border-${tool.color}-500/50`
                        : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mx-auto mb-1 text-${tool.color}-400`} />
                    <p className="text-[10px] text-gray-400 text-center truncate">{tool.name}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Input */}
          {selectedTool && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Enter {selectedTool.name} Query
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder={
                      selectedTool.id === 'ip' ? 'e.g., 192.168.1.100' :
                      selectedTool.id === 'domain' ? 'e.g., example.com' :
                      selectedTool.id === 'email' ? 'e.g., user@example.com' :
                      selectedTool.id === 'hash' ? 'e.g., a1b2c3d4e5f6...' :
                      'Enter value...'
                    }
                    className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white outline-none focus:border-amber-500/50"
                    onKeyDown={e => e.key === 'Enter' && handleQuickSearch()}
                  />
                  <button
                    onClick={handleQuickSearch}
                    disabled={!inputValue.trim() || isSearching}
                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSearching ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Search className="w-4 h-4" />
                        </motion.div>
                        Searching...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Investigate
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleOpenTool(selectedTool)}
                    className="px-4 py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Full Tool
                  </button>
                </div>
              </div>

              {/* Search Results */}
              <AnimatePresence>
                {searchResults && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-xl bg-gray-900/50 border border-amber-500/20 overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <div>
                          <h4 className="font-bold text-white">Analysis Complete</h4>
                          <p className="text-xs text-gray-500">{searchResults.timestamp}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded bg-${getRiskColor(searchResults.data.risk)}-500/20 text-${getRiskColor(searchResults.data.risk)}-400 text-sm font-bold`}>
                          {searchResults.data.risk.toUpperCase()} RISK
                        </span>
                        <button
                          onClick={() => setShowSaveModal(searchResults)}
                          className="flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-sm"
                        >
                          <BookmarkPlus className="w-4 h-4" />
                          Save to Case
                        </button>
                      </div>
                    </div>

                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-xs text-gray-500 mb-2">Summary</h5>
                        <p className="text-sm text-white">{searchResults.data.summary}</p>
                        
                        <h5 className="text-xs text-gray-500 mt-4 mb-2">Details</h5>
                        <div className="space-y-1">
                          {Object.entries(searchResults.data.details).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="text-gray-500 capitalize">{key}:</span>
                              <span className="text-gray-300">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="text-xs text-gray-500 mb-2">Related IOCs</h5>
                        <div className="space-y-2">
                          {searchResults.data.iocs.map((ioc, i) => (
                            <div key={i} className="p-2 rounded-lg bg-gray-800/50">
                              <p className="text-[10px] text-gray-500">{ioc.type}</p>
                              <code className="text-sm text-amber-400">{ioc.value}</code>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {!selectedTool && (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">Select a tool above to start investigating</p>
            </div>
          )}
        </div>
      )}

      {/* Saved Results Tab */}
      {activeTab === 'saved' && (
        <div className="space-y-3">
          {allSavedResults.length > 0 ? (
            allSavedResults.map((result, i) => {
              const tool = getToolById(result.tool);
              const Icon = tool?.icon || Globe;
              return (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-900/50 border border-amber-500/20"
                >
                  <div className={`w-10 h-10 rounded-lg bg-${tool?.color || 'gray'}-500/20 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${tool?.color || 'gray'}-400`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm text-white font-mono">{result.query}</code>
                      <span className={`text-[10px] px-2 py-0.5 rounded bg-${getRiskColor(result.risk)}-500/20 text-${getRiskColor(result.risk)}-400`}>
                        {result.risk.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{result.summary}</p>
                    <p className="text-[10px] text-gray-600 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {result.timestamp}
                    </p>
                  </div>
                  <button className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <BookmarkPlus className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">No saved investigation results</p>
              <p className="text-xs text-gray-600 mt-1">Run investigations and save results to this case</p>
            </div>
          )}
        </div>
      )}

      {/* All Tools Tab */}
      {activeTab === 'tools' && (
        <div className="grid grid-cols-3 gap-4">
          {tools.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => handleOpenTool(tool)}
                className={`p-4 rounded-xl bg-${tool.color}-500/10 border border-${tool.color}-500/20 cursor-pointer hover:border-${tool.color}-500/50 transition-all`}
              >
                <Icon className={`w-8 h-8 text-${tool.color}-400 mb-3`} />
                <h4 className="font-bold text-white mb-1">{tool.name}</h4>
                <p className="text-xs text-gray-500">Open full investigation tool</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-amber-400">
                  <ExternalLink className="w-3 h-3" />
                  Launch Tool
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Save Result Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowSaveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-gray-900 rounded-xl border border-amber-500/30"
            >
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="font-bold text-white">Save to Case Evidence</h3>
                <button onClick={() => setShowSaveModal(null)} className="text-gray-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <div className="p-4 rounded-lg bg-gray-800/50 mb-4">
                  <p className="text-xs text-gray-500 mb-1">Query</p>
                  <code className="text-white">{showSaveModal.query}</code>
                  <p className="text-xs text-gray-500 mt-3 mb-1">Summary</p>
                  <p className="text-sm text-gray-300">{showSaveModal.data?.summary}</p>
                </div>
                <p className="text-sm text-gray-400">
                  This result will be saved as evidence linked to the current case.
                </p>
              </div>
              <div className="p-4 border-t border-gray-800 flex gap-3">
                <button
                  onClick={() => setShowSaveModal(null)}
                  className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveResult}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold"
                >
                  Save Evidence
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ToolIntegration;
