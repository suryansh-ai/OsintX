import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, X, Search, Zap, User, Globe, Camera, Heart, MessageCircle,
  Share2, Eye, Link, MapPin, Calendar, Shield, CheckCircle, AlertTriangle,
  ExternalLink, Copy, Download, RefreshCw,
  Instagram, Twitter, Facebook, Linkedin, Github, Youtube
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';

const SocialProfilerTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  
  const [username, setUsername] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Social Profiler', query: username });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [networkNodes, setNetworkNodes] = useState([]);
  const [connectionLines, setConnectionLines] = useState([]);
  const canvasRef = useRef(null);
  const [lastLookupTime, setLastLookupTime] = useState(null);

  const handleExportJSON = () => {
    if (!results) { toast.error('No results to export'); return; }
    const ok = exportToJSON(results, `social_profile_${Date.now()}.json`);
    if (ok) toast.success('Exported JSON'); else toast.error('Export failed');
  };

  const handleExportCSV = () => {
    if (!results) { toast.error('No results to export'); return; }
    const prepared = formatForExport(results, 'csv');
    const ok = exportToCSV(prepared, `social_profile_${Date.now()}.csv`);
    if (ok) toast.success('Exported CSV'); else toast.error('Export failed');
  };

  // Generate network visualization
  useEffect(() => {
    if (results) {
      const profiles = results.profiles || [];
      const nodes = profiles.map((profile, i) => {
        const angle = (i / (profiles.length || 1)) * Math.PI * 2;
        const radius = 120;
        return {
          id: profile.platform,
          x: 200 + Math.cos(angle) * radius,
          y: 150 + Math.sin(angle) * radius,
          found: profile.found,
          color: profile.color,
        };
      });
      setNetworkNodes(nodes);

      // Create connection lines
      const lines = nodes.filter(n => n.found).map(node => ({
        x1: 200,
        y1: 150,
        x2: node.x,
        y2: node.y,
        color: node.color,
      }));
      setConnectionLines(lines);
    }
  }, [results]);

  // Animated particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      color: ['#ec4899', '#a855f7', '#3b82f6', '#22c55e'][Math.floor(Math.random() * 4)],
    }));

    let animFrameId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.fillStyle = p.color + '40';
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        p.x += p.speedX;
        p.y += p.speedY;
        
        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
      });
      animFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animFrameId);
  }, []);

  const handleSearch = async () => {
    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }
    
    trackToolUsage('social-profiler', 'search', 'start');
    setIsSearching(true);
    onConsume?.(7);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetchWithTimeout(`${API_BASE}/tools/username/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Map backend response to UI format
      const resultData = {
        username: data.username,
        matchScore: data.matchScore || 0,
        totalFound: data.totalFound,
        profiles: data.profiles.map(p => ({
          platform: p.platform,
          found: p.found,
          followers: p.data?.followers != null ? (p.data.followers > 1000 ? `${(p.data.followers / 1000).toFixed(1)}K` : String(p.data.followers)) : (p.data?.karma != null ? String(p.data.karma) : '-'),
          posts: p.data?.repos || p.data?.posts || p.data?.packages || p.data?.honor || '-',
          verified: p.verified,
          url: p.url,
          color: p.color,
          icon: Globe,
          category: p.category,
          note: p.note || null,
          profileData: p.data,
        })),
        aggregateStats: {
          totalFollowers: data.aggregateStats?.totalFollowers || '0',
          totalPosts: data.aggregateStats?.totalPosts || '0',
          avgEngagement: data.aggregateStats?.avgEngagement || 'N/A',
          accountAge: data.aggregateStats?.accountAge || 'Varies',
          lastActive: data.aggregateStats?.lastActive || 'Recent',
        },
        commonInfo: {
          displayName: data.commonInfo?.displayName || username,
          bio: data.commonInfo?.bio || 'No bio available',
          location: data.commonInfo?.location || 'Unknown',
          website: data.commonInfo?.website || '',
          email: '',
          avatar: data.commonInfo?.avatar || '',
        },
        recentActivity: data.profiles
          .filter(p => p.found)
          .slice(0, 4)
          .map(p => ({
            platform: p.platform,
            action: 'Profile found',
            time: data.searchDuration || 'Just now',
            content: p.data?.bio || p.data?.name || p.data?.about || `Active on ${p.platform}`,
          })),
        riskIndicators: data.riskIndicators || {
          privateMode: false,
          suspiciousActivity: false,
          fakeFollowers: 0,
          automationRisk: 'Low',
        },
      };

      setResults(resultData);
      setLastLookupTime(new Date());
      addToHistory('social-profiler', username, resultData);
      trackToolUsage('social-profiler', 'search', 'success');
      toast.success(`Found on ${data.totalFound} of ${data.totalChecked} platforms!`);
    } catch (error) {
      console.error('Social profiler error:', error);
      toast.error(error.message || 'Search failed. Is the backend running?');
      trackToolUsage('social-profiler', 'search', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleRefresh = () => {
    setUsername('');
    setResults(null);
    setLastLookupTime(null);
    toast.info('Ready for new search');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-7xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-pink-950/20 to-slate-950 border border-pink-500/30 shadow-[0_0_100px_rgba(236,72,153,0.15)]"
      >
        {/* Animated background */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Gradient overlays */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />

        {/* Header */}
        <div className="relative px-3 sm:px-6 py-3 sm:py-5 border-b border-pink-500/20 bg-slate-950/50 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-5 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <motion.div
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-pink-500/40"
                  animate={{ 
                    background: [
                      'linear-gradient(135deg, #ec4899, #a855f7, #3b82f6)',
                      'linear-gradient(135deg, #a855f7, #3b82f6, #ec4899)',
                      'linear-gradient(135deg, #3b82f6, #ec4899, #a855f7)',
                      'linear-gradient(135deg, #ec4899, #a855f7, #3b82f6)',
                    ]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Users className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </motion.div>
                {/* Orbiting icons - hidden on mobile */}
                <div className="hidden sm:block">
                  {[Instagram, Twitter, Linkedin].map((Icon, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center shadow-lg"
                      style={{ left: '50%', top: '50%' }}
                      animate={{
                        x: Math.cos(i * 2.1) * 35 - 10,
                        y: Math.sin(i * 2.1) * 35 - 10,
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Icon className="w-3 h-3 text-pink-400" />
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span className="truncate">Social Profiler</span>
                  <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs bg-pink-500/20 text-pink-300 rounded-full border border-pink-500/30">OSINT</span>
                </h2>
                <p className="text-xs sm:text-sm text-pink-300/70 flex items-center gap-1 sm:gap-2">
                  <Share2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">Cross-platform social media intelligence</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                className="p-2 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-white/5 hover:bg-pink-500/20 border border-white/10 hover:border-pink-500/30 transition-all flex items-center gap-2"
                title="New Search"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
                <span className="hidden sm:inline text-xs text-pink-200">New Search</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                disabled={!results}
                onClick={handleExportJSON}
                className="hidden sm:flex px-3 py-2 rounded-xl bg-white/5 hover:bg-fuchsia-500/20 border border-white/10 hover:border-fuchsia-500/30 transition-all items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-5 h-5 text-fuchsia-400" />
                <span className="text-xs text-fuchsia-200">Export JSON</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                disabled={!results}
                onClick={handleExportCSV}
                className="hidden sm:flex px-3 py-2 rounded-xl bg-white/5 hover:bg-fuchsia-500/20 border border-white/10 hover:border-fuchsia-500/30 transition-all items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-5 h-5 text-fuchsia-400" />
                <span className="text-xs text-fuchsia-200">Export CSV</span>
              </motion.button>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="hidden sm:flex px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 items-center gap-2"
              >
                <Zap className="w-5 h-5 text-amber-400" />
                <span className="text-lg font-bold text-amber-300">7</span>
                <span className="text-xs text-amber-200/70">credits</span>
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 transition-all"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative p-3 sm:p-6 overflow-y-auto max-h-[calc(92vh-80px)] sm:max-h-[calc(92vh-100px)]">
          {/* Search Input */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-6 rounded-xl sm:rounded-2xl bg-slate-900/60 border border-pink-500/20 backdrop-blur-sm">
            <label className="text-pink-300 text-xs sm:text-sm font-medium mb-2 sm:mb-3 flex items-center gap-2">
              <User className="w-3 h-3 sm:w-4 sm:h-4" />
              Target Username
            </label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-pink-400 text-lg sm:text-xl">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="username (without @)"
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 rounded-lg sm:rounded-xl bg-slate-800/80 border-2 border-pink-500/30 text-white text-sm sm:text-lg placeholder-gray-500 focus:outline-none focus:border-pink-400 focus:shadow-[0_0_30px_rgba(236,72,153,0.2)] transition-all"
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(236,72,153,0.4)' }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSearch}
                disabled={isSearching || !username.trim()}
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-pink-500/30"
              >
                {isSearching ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Search className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <Search className="w-5 h-5" />
                )}
                <span>{isSearching ? 'Scanning...' : 'Profile'}</span>
              </motion.button>
            </div>

            {/* Scanning Animation */}
            {isSearching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6"
              >
                <div className="text-center mb-4">
                  <motion.div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/20 text-pink-300"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Globe className="w-4 h-4" />
                    Scanning social platforms...
                  </motion.div>
                </div>
                <div className="flex justify-center gap-4">
                  {[Instagram, Twitter, Facebook, Linkedin, Github, Youtube].map((Icon, i) => (
                    <motion.div
                      key={i}
                      className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center border border-pink-500/20"
                      initial={{ scale: 0.8, opacity: 0.3 }}
                      animate={{ scale: [0.8, 1, 0.8], opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                    >
                      <Icon className="w-6 h-6 text-pink-400" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Results */}
          <AnimatePresence>
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Overview Cards */}
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30"
                  >
                    <div className="text-4xl font-bold text-white mb-1">{results.totalFound}</div>
                    <div className="text-pink-300/70 text-sm">Profiles Found</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="p-5 rounded-2xl bg-slate-800/50 border border-pink-500/20"
                  >
                    <div className="text-4xl font-bold text-cyan-400 mb-1">{results.aggregateStats.totalFollowers}</div>
                    <div className="text-gray-400 text-sm">Total Followers</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="p-5 rounded-2xl bg-slate-800/50 border border-pink-500/20"
                  >
                    <div className="text-4xl font-bold text-emerald-400 mb-1">{results.aggregateStats.avgEngagement}</div>
                    <div className="text-gray-400 text-sm">Avg Engagement</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="p-5 rounded-2xl bg-slate-800/50 border border-pink-500/20"
                  >
                    <div className="text-4xl font-bold text-amber-400 mb-1">{results.matchScore}%</div>
                    <div className="text-gray-400 text-sm">Match Score</div>
                  </motion.div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Network Visualization */}
                  <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-900/60 border border-pink-500/20">
                    <h3 className="text-pink-300 font-semibold mb-4 flex items-center gap-2">
                      <Share2 className="w-5 h-5" />
                      Network Map
                    </h3>
                    <div className="relative h-80">
                      <svg className="w-full h-full">
                        {/* Connection lines */}
                        {connectionLines.map((line, i) => (
                          <motion.line
                            key={i}
                            x1={line.x1}
                            y1={line.y1}
                            x2={line.x2}
                            y2={line.y2}
                            stroke={line.color}
                            strokeWidth="2"
                            strokeOpacity="0.4"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                          />
                        ))}
                        {/* Central node */}
                        <motion.circle
                          cx="200"
                          cy="150"
                          r="30"
                          fill="#ec4899"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring' }}
                        />
                        <text x="200" y="155" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                          @{username.slice(0, 4)}
                        </text>
                        {/* Platform nodes */}
                        {networkNodes.map((node, i) => (
                          <motion.g
                            key={node.id}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedPlatform(results.profiles.find(p => p.platform === node.id))}
                          >
                            <circle
                              cx={node.x}
                              cy={node.y}
                              r="20"
                              fill={node.found ? node.color : '#374151'}
                              opacity={node.found ? 1 : 0.5}
                            />
                            <text x={node.x} y={node.y + 4} textAnchor="middle" fill="white" fontSize="8">
                              {node.id.slice(0, 2)}
                            </text>
                          </motion.g>
                        ))}
                      </svg>
                    </div>
                  </div>

                  {/* Platforms Grid */}
                  <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-pink-500/20">
                    <h3 className="text-pink-300 font-semibold mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Discovered Profiles
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {(results.profiles || []).map((profile, i) => (
                        <motion.div
                          key={profile.platform}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          whileHover={{ scale: 1.03 }}
                          onClick={() => setSelectedPlatform(profile)}
                          className={`p-4 rounded-xl cursor-pointer transition-all ${
                            profile.found 
                              ? 'bg-gradient-to-r from-slate-800/80 to-slate-800/40 border border-pink-500/30 hover:border-pink-500/50' 
                              : 'bg-slate-800/30 border border-slate-700/30'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                style={{ backgroundColor: profile.found ? profile.color + '30' : '#374151' }}
                              >
                                <profile.icon className={`w-5 h-5 ${profile.found ? 'text-white' : 'text-gray-500'}`} />
                              </div>
                              <div>
                                <div className={`font-semibold ${profile.found ? 'text-white' : 'text-gray-500'}`}>
                                  {profile.platform}
                                </div>
                                <div className={`text-xs ${profile.found ? 'text-pink-300' : 'text-gray-600'}`}>
                                  {profile.found === true ? 'Profile Found' : profile.found === null ? 'Unverified' : 'Not Found'}
                                </div>
                                {profile.found === null && profile.note && (
                                  <div className="text-amber-400/70 text-xs mt-1">{profile.note}</div>
                                )}
                              </div>
                            </div>
                            {profile.found && (
                              <div className="flex items-center gap-2 shrink-0">
                                {profile.verified && (
                                  <CheckCircle className="w-4 h-4 text-blue-400" />
                                )}
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                          {profile.found && (
                            <div className="flex gap-4 text-sm">
                              <div>
                                <div className="text-white font-semibold">{profile.followers}</div>
                                <div className="text-gray-500 text-xs">Followers</div>
                              </div>
                              <div>
                                <div className="text-white font-semibold">{profile.posts}</div>
                                <div className="text-gray-500 text-xs">Posts</div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Common Info & Activity */}
                <div className="grid lg:grid-cols-2 gap-6 mt-6">
                  {/* Profile Summary */}
                  <div className="p-6 rounded-2xl bg-slate-900/60 border border-pink-500/20">
                    <h3 className="text-pink-300 font-semibold mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Profile Summary
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white">
                          {results.commonInfo.displayName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xl font-semibold text-white">{results.commonInfo.displayName}</div>
                          <div className="text-pink-300">@{username}</div>
                        </div>
                      </div>
                      <p className="text-gray-300">{results.commonInfo.bio}</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-gray-400">
                          <MapPin className="w-4 h-4 text-pink-400" />
                          {results.commonInfo.location}
                        </div>
                        <div className="flex items-center gap-3 text-gray-400">
                          <Link className="w-4 h-4 text-pink-400" />
                          <a href={results.commonInfo.website} className="text-pink-300 hover:underline">
                            {results.commonInfo.website}
                          </a>
                        </div>
                        <div className="flex items-center gap-3 text-gray-400">
                          <Calendar className="w-4 h-4 text-pink-400" />
                          Active for {results.aggregateStats.accountAge}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="p-6 rounded-2xl bg-slate-900/60 border border-pink-500/20">
                    <h3 className="text-pink-300 font-semibold mb-4 flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Recent Activity
                    </h3>
                    <div className="space-y-3">
                      {(results.recentActivity || []).map((activity, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="p-3 rounded-xl bg-slate-800/50 flex items-start gap-3"
                        >
                          <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                            <MessageCircle className="w-4 h-4 text-pink-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{activity.platform}</span>
                              <span className="text-pink-300 text-sm">• {activity.action}</span>
                            </div>
                            <div className="text-gray-400 text-sm truncate">{activity.content}</div>
                            <div className="text-gray-500 text-xs">{activity.time}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-slate-900/80 to-slate-800/50 border border-pink-500/20">
                  <h3 className="text-pink-300 font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Risk Assessment
                  </h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    {[
                      { label: 'Private Mode', value: results.riskIndicators.privateMode, icon: Eye },
                      { label: 'Suspicious Activity', value: results.riskIndicators.suspiciousActivity, icon: AlertTriangle },
                      { label: 'Fake Followers', value: `${results.riskIndicators.fakeFollowers}%`, icon: Users },
                      { label: 'Automation Risk', value: results.riskIndicators.automationRisk || results.riskIndicators.botRisk, icon: Shield },
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-4 rounded-xl ${
                          item.value === true || item.value === 'High' 
                            ? 'bg-red-500/10 border border-red-500/30' 
                            : 'bg-emerald-500/10 border border-emerald-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <item.icon className={`w-5 h-5 ${
                            item.value === true || item.value === 'High' ? 'text-red-400' : 'text-emerald-400'
                          }`} />
                          <span className="text-gray-400 text-sm">{item.label}</span>
                        </div>
                        <div className={`text-lg font-semibold ${
                          item.value === true || item.value === 'High' ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                          {typeof item.value === 'boolean' ? (item.value ? 'Yes' : 'No') : item.value}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!results && !isSearching && (
            <div className="text-center py-20">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Users className="w-24 h-24 text-pink-500/30 mx-auto mb-6" />
              </motion.div>
              <h3 className="text-2xl text-gray-400 mb-3">Enter a username to profile</h3>
              <p className="text-gray-500">Scan multiple social platforms for accounts</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SocialProfilerTool;
