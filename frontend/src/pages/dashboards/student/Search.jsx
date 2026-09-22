import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon, X, Filter, Clock, ArrowRight, FileText, Wrench,
  BookOpen, Shield, AlertTriangle, CheckCircle, Circle, ChevronDown,
  Command, Zap, Target, Hash, Folder, Star, TrendingUp, ChevronLeft
} from 'lucide-react';

const Search = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [recentSearches, setRecentSearches] = useState([
    'phishing attack', 'SQL injection', 'network forensics', 'malware analysis'
  ]);
  const [isSearching, setIsSearching] = useState(false);

  // Mock search data
  const searchData = {
    cases: [
      { id: 1, title: 'Phishing Email Investigation', category: 'Phishing', difficulty: 'easy', status: 'completed', xp: 150, description: 'Analyze suspicious email headers and identify phishing indicators' },
      { id: 2, title: 'SQL Injection Attack Analysis', category: 'Web Security', difficulty: 'medium', status: 'in-progress', xp: 250, description: 'Investigate database breach through SQL injection vulnerability' },
      { id: 3, title: 'Ransomware Incident Response', category: 'Malware', difficulty: 'hard', status: 'not-started', xp: 400, description: 'Contain and analyze ransomware attack on enterprise network' },
      { id: 4, title: 'Network Traffic Forensics', category: 'Forensics', difficulty: 'medium', status: 'completed', xp: 300, description: 'Analyze packet captures to identify malicious activity' },
      { id: 5, title: 'Social Engineering Assessment', category: 'Social', difficulty: 'easy', status: 'not-started', xp: 200, description: 'Evaluate organization susceptibility to social engineering' },
      { id: 6, title: 'APT Threat Hunting', category: 'Advanced', difficulty: 'hard', status: 'not-started', xp: 500, description: 'Hunt for advanced persistent threats in enterprise environment' },
    ],
    tools: [
      { id: 1, title: 'Packet Analyzer', category: 'Network', description: 'Analyze network traffic and packet captures', icon: '📡' },
      { id: 2, title: 'Hash Decoder', category: 'Crypto', description: 'Decode and verify file hashes', icon: '🔐' },
      { id: 3, title: 'Log Parser', category: 'Forensics', description: 'Parse and analyze system logs', icon: '📋' },
      { id: 4, title: 'Malware Sandbox', category: 'Malware', description: 'Safely analyze suspicious files', icon: '🧪' },
      { id: 5, title: 'IP Tracer', category: 'Network', description: 'Trace IP addresses and geolocation', icon: '🌐' },
      { id: 6, title: 'Email Analyzer', category: 'Phishing', description: 'Analyze email headers and content', icon: '📧' },
    ],
    resources: [
      { id: 1, title: 'OWASP Top 10 Guide', category: 'Web Security', type: 'Guide', description: 'Essential web application security risks' },
      { id: 2, title: 'Incident Response Playbook', category: 'IR', type: 'Playbook', description: 'Step-by-step incident response procedures' },
      { id: 3, title: 'Network Protocols Cheatsheet', category: 'Network', type: 'Cheatsheet', description: 'Quick reference for common protocols' },
      { id: 4, title: 'Malware Analysis Fundamentals', category: 'Malware', type: 'Course', description: 'Introduction to malware analysis techniques' },
      { id: 5, title: 'Digital Forensics Handbook', category: 'Forensics', type: 'Handbook', description: 'Comprehensive forensics procedures' },
    ]
  };

  const categories = [
    { id: 'all', name: 'All', icon: Hash, count: 17 },
    { id: 'cases', name: 'Cases', icon: FileText, count: 6 },
    { id: 'tools', name: 'Tools', icon: Wrench, count: 6 },
    { id: 'resources', name: 'Resources', icon: BookOpen, count: 5 },
  ];

  const difficulties = ['easy', 'medium', 'hard'];
  const statuses = ['completed', 'in-progress', 'not-started'];

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        navigate(-1);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const filterResults = useCallback(() => {
    let results = [];
    const query = searchQuery.toLowerCase();

    if (activeCategory === 'all' || activeCategory === 'cases') {
      const filteredCases = searchData.cases.filter(item => {
        const matchesQuery = !query || item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query) || item.category.toLowerCase().includes(query);
        const matchesDifficulty = selectedDifficulty.length === 0 || selectedDifficulty.includes(item.difficulty);
        const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(item.status);
        return matchesQuery && matchesDifficulty && matchesStatus;
      });
      results.push(...filteredCases.map(item => ({ ...item, type: 'case' })));
    }

    if (activeCategory === 'all' || activeCategory === 'tools') {
      const filteredTools = searchData.tools.filter(item => {
        const matchesQuery = !query || item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query) || item.category.toLowerCase().includes(query);
        return matchesQuery;
      });
      results.push(...filteredTools.map(item => ({ ...item, type: 'tool' })));
    }

    if (activeCategory === 'all' || activeCategory === 'resources') {
      const filteredResources = searchData.resources.filter(item => {
        const matchesQuery = !query || item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query) || item.category.toLowerCase().includes(query);
        return matchesQuery;
      });
      results.push(...filteredResources.map(item => ({ ...item, type: 'resource' })));
    }

    return results;
  }, [searchQuery, activeCategory, selectedDifficulty, selectedStatus]);

  const results = filterResults();

  const handleSearch = (query) => {
    setSearchQuery(query);
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 300);
    
    // Add to recent searches
    if (query && !recentSearches.includes(query)) {
      setRecentSearches(prev => [query, ...prev.slice(0, 3)]);
    }
  };

  const toggleDifficulty = (diff) => {
    setSelectedDifficulty(prev =>
      prev.includes(diff) ? prev.filter(d => d !== diff) : [...prev, diff]
    );
  };

  const toggleStatus = (status) => {
    setSelectedStatus(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const clearFilters = () => {
    setSelectedDifficulty([]);
    setSelectedStatus([]);
    setActiveCategory('all');
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'easy': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'hard': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'not-started': return <Circle className="w-4 h-4 text-gray-400" />;
      default: return null;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'case': return <FileText className="w-5 h-5 text-cyan-400" />;
      case 'tool': return <Wrench className="w-5 h-5 text-purple-400" />;
      case 'resource': return <BookOpen className="w-5 h-5 text-amber-400" />;
      default: return <Hash className="w-5 h-5 text-gray-400" />;
    }
  };

  const trendingSearches = ['DDoS attack', 'password cracking', 'MITM', 'zero-day exploit'];

  return (
    <div className="min-h-screen bg-[#010408] text-gray-100">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-transparent to-blue-950/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.1),transparent_50%)]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/dashboard/student')}
            className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Back to Dashboard</span>
          </button>

          <h1 className="text-3xl font-bold text-white mb-2">Search</h1>
          <p className="text-gray-400">Find cases, tools, and resources across the platform</p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-6"
        >
          <div className="relative flex items-center">
            <SearchIcon className="absolute left-4 w-5 h-5 text-gray-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search cases, tools, resources..."
              className="w-full pl-12 pr-32 py-4 rounded-xl bg-[#0a1520]/80 border border-cyan-500/30 text-white placeholder-gray-500 outline-none focus:border-cyan-500 transition-all text-lg"
            />
            <div className="absolute right-4 flex items-center gap-2">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg border transition-all ${
                  showFilters || selectedDifficulty.length > 0 || selectedStatus.length > 0
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                    : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:text-gray-300'
                }`}
              >
                <Filter className="w-4 h-4" />
              </button>
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-800/50 border border-gray-700 text-xs text-gray-500">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="p-4 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-white">Filters</h3>
                  {(selectedDifficulty.length > 0 || selectedStatus.length > 0) && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Difficulty Filter */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Difficulty</label>
                    <div className="flex flex-wrap gap-2">
                      {difficulties.map(diff => (
                        <button
                          key={diff}
                          onClick={() => toggleDifficulty(diff)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${
                            selectedDifficulty.includes(diff)
                              ? getDifficultyColor(diff)
                              : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Status</label>
                    <div className="flex flex-wrap gap-2">
                      {statuses.map(status => (
                        <button
                          key={status}
                          onClick={() => toggleStatus(status)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                            selectedStatus.includes(status)
                              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                              : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                          }`}
                        >
                          {getStatusIcon(status)}
                          {status.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 mb-6 overflow-x-auto pb-2"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              <cat.icon className="w-4 h-4" />
              <span className="text-sm">{cat.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeCategory === cat.id ? 'bg-cyan-500/30' : 'bg-gray-700/50'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </motion.div>

        {/* No Search Query - Show Recent & Trending */}
        {!searchQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="p-4 rounded-xl bg-[#0a1520]/60 border border-gray-800">
                <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  Recent Searches
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSearch(search)}
                      className="px-3 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700 text-sm text-gray-400 hover:text-white hover:border-gray-600 transition-all"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Searches */}
            <div className="p-4 rounded-xl bg-[#0a1520]/60 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-500" />
                Trending Searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearch(search)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-sm text-cyan-400 hover:bg-cyan-500/20 transition-all"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/dashboard/student/cases')}
                className="p-4 rounded-xl bg-[#0a1520]/60 border border-gray-800 hover:border-cyan-500/30 transition-all text-left group"
              >
                <FileText className="w-6 h-6 text-cyan-400 mb-2" />
                <h3 className="text-white font-medium mb-1">Browse Cases</h3>
                <p className="text-xs text-gray-500">Explore all available cases</p>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-cyan-400 mt-2 transition-colors" />
              </button>
              <button
                onClick={() => navigate('/dashboard/student/tools')}
                className="p-4 rounded-xl bg-[#0a1520]/60 border border-gray-800 hover:border-purple-500/30 transition-all text-left group"
              >
                <Wrench className="w-6 h-6 text-purple-400 mb-2" />
                <h3 className="text-white font-medium mb-1">Browse Tools</h3>
                <p className="text-xs text-gray-500">Access investigation tools</p>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 mt-2 transition-colors" />
              </button>
              <button
                onClick={() => navigate('/dashboard/student/help')}
                className="p-4 rounded-xl bg-[#0a1520]/60 border border-gray-800 hover:border-amber-500/30 transition-all text-left group"
              >
                <BookOpen className="w-6 h-6 text-amber-400 mb-2" />
                <h3 className="text-white font-medium mb-1">Help Center</h3>
                <p className="text-xs text-gray-500">Guides and documentation</p>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-amber-400 mt-2 transition-colors" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Search Results */}
        {searchQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400">
                {isSearching ? 'Searching...' : `${results.length} results for "${searchQuery}"`}
              </p>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-12">
                <SearchIcon className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">No results found</h3>
                <p className="text-sm text-gray-600">Try different keywords or adjust filters</p>
              </div>
            ) : (
              <div className="space-y-2">
                {results.map((result, idx) => (
                  <motion.div
                    key={`${result.type}-${result.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 rounded-xl bg-[#0a1520]/60 border border-gray-800 hover:border-cyan-500/30 transition-all cursor-pointer group"
                    onClick={() => {
                      if (result.type === 'case') navigate('/dashboard/student/cases');
                      else if (result.type === 'tool') navigate('/dashboard/student/tools');
                      else navigate('/dashboard/student/help');
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-gray-800/50">
                        {result.type === 'tool' && result.icon ? (
                          <span className="text-xl">{result.icon}</span>
                        ) : (
                          getTypeIcon(result.type)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-medium truncate group-hover:text-cyan-400 transition-colors">
                            {result.title}
                          </h3>
                          {result.difficulty && (
                            <span className={`px-2 py-0.5 rounded-full text-xs border capitalize ${getDifficultyColor(result.difficulty)}`}>
                              {result.difficulty}
                            </span>
                          )}
                          {result.status && getStatusIcon(result.status)}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{result.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-600 flex items-center gap-1">
                            <Folder className="w-3 h-3" />
                            {result.category}
                          </span>
                          {result.xp && (
                            <span className="text-xs text-cyan-400 flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              {result.xp} XP
                            </span>
                          )}
                          {result.type && (
                            <span className="text-xs text-gray-600 capitalize">{result.type}</span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-700 group-hover:text-cyan-400 transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Keyboard Shortcuts Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-6 right-6 p-3 rounded-xl bg-[#0a1520]/90 border border-gray-800 text-xs text-gray-500"
        >
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">Esc</kbd>
              Close
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">⌘K</kbd>
              Focus
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Search;
