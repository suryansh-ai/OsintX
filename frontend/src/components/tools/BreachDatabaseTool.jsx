import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  Database, X, Search, Zap, Shield, AlertTriangle, Eye, Lock,
  Skull, FileWarning, Calendar, Globe, Mail, Key, CreditCard,
  Phone, User, RefreshCw, ChevronRight, Download, ExternalLink, Copy,
  Activity, TrendingUp, AlertCircle, CheckCircle, XCircle, Clock,
  Server, Wifi, WifiOff, ShieldAlert, ShieldCheck, Hash, Layers,
  BarChart3, PieChart, Target, Crosshair, Radio, Fingerprint, 
  CircleDot, ChevronDown, ChevronUp, Info, Terminal, Cpu, FileText
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';

// ═══════════════════════════════════════════════════════════════════════════════
// BREACH DATABASE TOOL - DARK WEB INTELLIGENCE & CREDENTIAL MONITORING
// A specialized OSINT tool for data breach analysis & exposure detection
// ═══════════════════════════════════════════════════════════════════════════════

// Hexagonal Grid Pattern for Background
const HexPattern = () => (
  <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
        <polygon fill="none" stroke="currentColor" strokeWidth="0.5" points="24.8,22 37.3,29.2 37.3,43.7 24.8,51 12.3,43.7 12.3,29.2" transform="translate(-12,-21)" />
        <polygon fill="none" stroke="currentColor" strokeWidth="0.5" points="24.8,22 37.3,29.2 37.3,43.7 24.8,51 12.3,43.7 12.3,29.2" transform="translate(13,0)" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hexagons)" className="text-violet-500" />
  </svg>
);

// Terminal Output Component
const TerminalLine = ({ text, type = 'info', delay = 0 }) => {
  const [visible, setVisible] = useState(false);
  const [displayText, setDisplayText] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!visible) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i <= text.length) {
        setDisplayText(text.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 15);
    return () => clearInterval(interval);
  }, [visible, text]);

  if (!visible) return null;

  const colors = {
    info: 'text-violet-400',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    error: 'text-red-400',
    system: 'text-cyan-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`font-mono text-xs ${colors[type]} flex items-start gap-2`}
    >
      <span className="text-gray-600 select-none">{type === 'system' ? '>' : '$'}</span>
      <span>{displayText}<span className="animate-pulse">_</span></span>
    </motion.div>
  );
};

// Risk Gauge Component
const RiskGauge = ({ level, score }) => {
  const rotation = useMotionValue(0);
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  const targetRotation = (normalizedScore / 100) * 180 - 90;

  useEffect(() => {
    const timeout = setTimeout(() => {
      rotation.set(targetRotation);
    }, 500);
    return () => clearTimeout(timeout);
  }, [normalizedScore, targetRotation]);

  const getColor = (lvl) => {
    switch (lvl) {
      case 'Critical': return { primary: '#ef4444', secondary: '#fca5a5' };
      case 'High': return { primary: '#f97316', secondary: '#fdba74' };
      case 'Medium': return { primary: '#eab308', secondary: '#fde047' };
      case 'Low': return { primary: '#22c55e', secondary: '#86efac' };
      default: return { primary: '#6b7280', secondary: '#d1d5db' };
    }
  };

  const colors = getColor(level);

  return (
    <div className="relative w-48 h-28">
      <svg viewBox="0 0 200 110" className="w-full h-full">
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Colored segments */}
        <path d="M 20 100 A 80 80 0 0 1 60 35" fill="none" stroke="#22c55e" strokeWidth="12" strokeLinecap="round" opacity="0.3" />
        <path d="M 60 35 A 80 80 0 0 1 100 20" fill="none" stroke="#eab308" strokeWidth="12" strokeLinecap="round" opacity="0.3" />
        <path d="M 100 20 A 80 80 0 0 1 140 35" fill="none" stroke="#f97316" strokeWidth="12" strokeLinecap="round" opacity="0.3" />
        <path d="M 140 35 A 80 80 0 0 1 180 100" fill="none" stroke="#ef4444" strokeWidth="12" strokeLinecap="round" opacity="0.3" />
        
        {/* Needle */}
        <motion.g
          style={{ originX: '100px', originY: '100px' }}
          animate={{ rotate: targetRotation }}
          transition={{ type: 'spring', stiffness: 60, damping: 15, delay: 0.3 }}
        >
          <line x1="100" y1="100" x2="100" y2="30" stroke={colors.primary} strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="100" r="8" fill={colors.primary} />
          <circle cx="100" cy="100" r="4" fill="white" />
        </motion.g>
      </svg>
      
      {/* Score Display */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8, type: 'spring' }}
          className="text-2xl font-bold"
          style={{ color: colors.primary }}
        >
          {normalizedScore}
        </motion.div>
        <div className="text-xs text-gray-500 uppercase tracking-wider">{level} Risk</div>
      </div>
    </div>
  );
};

// Breach Timeline Item
const TimelineBreachItem = ({ breach, index, isExpanded, onToggle }) => {
  const severityColors = {
    Critical: { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400', glow: 'shadow-red-500/20' },
    High: { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400', glow: 'shadow-orange-500/20' },
    Medium: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
    Low: { bg: 'bg-green-500/20', border: 'border-green-500/40', text: 'text-green-400', glow: 'shadow-green-500/20' },
  };

  const colors = severityColors[breach.severity] || severityColors.Medium;

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative pl-8"
    >
      {/* Timeline line */}
      <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-violet-500/50 via-violet-500/20 to-transparent" />
      
      {/* Timeline dot */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
        className={`absolute left-0 top-4 w-6 h-6 rounded-full ${colors.bg} ${colors.border} border-2 flex items-center justify-center shadow-lg ${colors.glow}`}
      >
        <div className={`w-2 h-2 rounded-full ${colors.text} bg-current`} />
      </motion.div>

      {/* Content Card */}
      <motion.div
        whileHover={{ x: 4 }}
        className={`p-4 rounded-xl ${colors.bg} ${colors.border} border backdrop-blur-sm cursor-pointer transition-all duration-300 ${isExpanded ? 'ring-2 ring-violet-500/30' : ''}`}
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-semibold text-white text-lg">{breach.name}</h4>
              {breach.verified && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </span>
              )}
              {breach.source === 'HIBP' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  HIBP
                </span>
              )}
              {breach.isSensitive && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-pink-500/20 text-pink-400 border border-pink-500/30">
                  Sensitive
                </span>
              )}
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${colors.bg} ${colors.text} border ${colors.border}`}>
                {breach.severity}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {breach.date}
              </span>
              <span className="flex items-center gap-1">
                <Database className="w-3.5 h-3.5" />
                {breach.records} records
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                {breach.origin || 'Unknown'}
              </span>
            </div>
          </div>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="p-1"
          >
            <ChevronDown className={`w-5 h-5 ${colors.text}`} />
          </motion.div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-white/10">
                <p className="text-gray-400 text-sm mb-4">{breach.description}</p>
                
                <div className="mb-4">
                  <span className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Exposed Data Types</span>
                  <div className="flex flex-wrap gap-2">
                    {breach.dataTypes.map(type => (
                      <span
                        key={type}
                        className="px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-300 text-xs border border-violet-500/20 flex items-center gap-1.5"
                      >
                        {type === 'Email' && <Mail className="w-3 h-3" />}
                        {type === 'Password' && <Key className="w-3 h-3" />}
                        {type === 'Phone' && <Phone className="w-3 h-3" />}
                        {type === 'Address' && <User className="w-3 h-3" />}
                        {type === 'Username' && <User className="w-3 h-3" />}
                        {type === 'Name' && <User className="w-3 h-3" />}
                        {type === 'Location' && <Globe className="w-3 h-3" />}
                        {type === 'Employment' && <Fingerprint className="w-3 h-3" />}
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                {breach.passwordHashes && (
                  <div className="p-3 rounded-lg bg-black/30 border border-violet-500/20">
                    <span className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Password Storage</span>
                    <span className={`text-sm ${breach.passwordHashes === 'Plaintext' ? 'text-red-400' : 'text-amber-400'}`}>
                      {breach.passwordHashes}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

// Exposed Data Card with Hexagonal Design
const ExposedDataHex = ({ data, index, total }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isExposed = data.count > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative"
    >
      <div className={`
        relative w-24 h-28 flex flex-col items-center justify-center
        transition-all duration-300 cursor-pointer
        ${isExposed ? 'text-red-400' : 'text-gray-600'}
      `}>
        {/* Hexagon Shape */}
        <svg viewBox="0 0 100 115" className="absolute inset-0 w-full h-full">
          <polygon
            points="50,0 100,28.75 100,86.25 50,115 0,86.25 0,28.75"
            fill={isExposed ? 'rgba(239,68,68,0.1)' : 'rgba(0,0,0,0.3)'}
            stroke={isExposed ? 'rgba(239,68,68,0.5)' : 'rgba(139,92,246,0.2)'}
            strokeWidth="2"
            className="transition-all duration-300"
          />
          {isHovered && isExposed && (
            <polygon
              points="50,0 100,28.75 100,86.25 50,115 0,86.25 0,28.75"
              fill="none"
              stroke="rgba(239,68,68,0.8)"
              strokeWidth="2"
              className="animate-pulse"
            />
          )}
        </svg>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center">
          <data.icon className={`w-6 h-6 mb-1 ${isExposed ? 'text-red-400' : 'text-gray-600'}`} />
          <span className={`text-2xl font-bold ${isExposed ? 'text-red-400' : 'text-gray-600'}`}>
            {data.count}
          </span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
            {data.type}
          </span>
        </div>

        {/* Glow effect */}
        {isExposed && isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 rounded-full bg-red-500/20 blur-xl -z-10"
          />
        )}
      </div>
    </motion.div>
  );
};

// Stats Card Component
const StatCard = ({ icon: Icon, label, value, subValue, color = 'violet', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ y: -4 }}
    className={`p-4 rounded-xl bg-${color}-500/10 border border-${color}-500/20 backdrop-blur-sm`}
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
        <Icon className={`w-5 h-5 text-${color}-400`} />
      </div>
      {subValue && (
        <span className={`text-xs text-${color}-400 bg-${color}-500/10 px-2 py-0.5 rounded-full`}>
          {subValue}
        </span>
      )}
    </div>
    <div className={`text-2xl font-bold text-${color}-300 mb-1`}>{value}</div>
    <div className="text-xs text-gray-500">{label}</div>
  </motion.div>
);

// Scanning Animation Component
const ScanningOverlay = ({ searchQuery, searchType }) => {
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  
  const scanSteps = useMemo(() => [
    { text: 'Initializing secure connection...', type: 'system', delay: 0 },
    { text: `Target: ${searchQuery}`, type: 'info', delay: 300 },
    { text: 'Connecting to dark web nodes...', type: 'system', delay: 600 },
    { text: 'Scanning breach databases...', type: 'warning', delay: 1000 },
    { text: 'Querying paste sites...', type: 'info', delay: 1500 },
    { text: 'Checking credential dumps...', type: 'warning', delay: 2000 },
    { text: 'Analyzing forum mentions...', type: 'info', delay: 2500 },
    { text: 'Compiling threat intelligence...', type: 'success', delay: 3000 },
  ], [searchQuery]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 2, 95));
    }, 70);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Terminal Window */}
      <div className="rounded-xl bg-black/60 border border-violet-500/30 overflow-hidden backdrop-blur-sm">
        <div className="flex items-center gap-2 px-4 py-2 bg-violet-500/10 border-b border-violet-500/20">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-gray-400 font-mono ml-2">breach_scanner.exe</span>
          <Terminal className="w-3 h-3 text-violet-400 ml-auto" />
        </div>
        <div className="p-4 h-48 overflow-y-auto space-y-1.5 font-mono">
          {scanSteps.map((step, i) => (
            <TerminalLine key={i} text={step.text} type={step.type} delay={step.delay} />
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Scanning databases...</span>
          <span className="font-mono">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-black/50 overflow-hidden border border-violet-500/20">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-600 via-purple-500 to-violet-600 bg-[length:200%_100%]"
            initial={{ width: 0 }}
            animate={{ 
              width: `${progress}%`,
              backgroundPosition: ['0% 0%', '100% 0%']
            }}
            transition={{ 
              width: { duration: 0.3 },
              backgroundPosition: { duration: 2, repeat: Infinity, ease: 'linear' }
            }}
          />
        </div>
      </div>

      {/* Scanning Sources */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { name: 'Dark Web', icon: Skull, delay: 0 },
          { name: 'Paste Sites', icon: FileWarning, delay: 0.1 },
          { name: 'Forums', icon: Globe, delay: 0.2 },
          { name: 'Databases', icon: Database, delay: 0.3 },
        ].map((source, i) => (
          <motion.div
            key={source.name}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: source.delay }}
            className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-center"
          >
            <source.icon className="w-6 h-6 mx-auto mb-2 text-violet-400" />
            <span className="text-xs text-violet-300">{source.name}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Main Component
const BreachDatabaseTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('email');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Breach Database', query: '' });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [expandedBreach, setExpandedBreach] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedField, setCopiedField] = useState(null);
  
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Calculate risk score based on results
  const riskScore = useMemo(() => {
    if (!results) return 0;
    let score = 0;
    score += results.totalBreaches * 10;
    score += results.exposedData.find(d => d.type === 'Password')?.count * 15 || 0;
    score += results.exposedData.find(d => d.type === 'Credit Card')?.count * 25 || 0;
    score += results.darkWebMentions * 0.5;
    return Math.min(Math.round(score), 100);
  }, [results]);

  const handleExportJSON = () => {
    if (!results) { toast.error('No results to export'); return; }
    const ok = exportToJSON(results, `breach_intel_${Date.now()}.json`);
    if (ok) toast.success('Exported JSON'); else toast.error('Export failed');
  };

  const handleCopy = async (text, field) => {
    await copy(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success('Copied to clipboard');
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setResults(null);
    setExpandedBreach(null);
    setActiveTab('overview');
    inputRef.current?.focus();
    toast.info('Ready for new search');
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }
    
    trackToolUsage('breach-database', 'search', 'start');
    setIsSearching(true);
    onConsume?.(10);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetchWithTimeout(`${API_BASE}/tools/breach/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.trim(), type: searchType }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Map icons for exposed data types
      const iconMap = {
        'Email addresses': Mail, 'Passwords': Key, 'Phone numbers': Phone,
        'Names': User, 'IP addresses': Globe, 'Usernames': Hash,
        'Dates of birth': Calendar, 'Geographic locations': Globe,
        'Social media profiles': User, 'Physical addresses': Globe,
        'Genders': User, 'Job titles': User, 'Employers': Database,
      };

      const resultData = {
        query: data.query,
        type: data.type,
        found: data.found,
        compromised: data.compromised,
        totalBreaches: data.totalBreaches,
        totalRecords: data.totalRecords,
        firstBreach: data.firstBreach,
        lastBreach: data.lastBreach,
        riskLevel: data.riskLevel,
        stealerData: data.stealerData,
        stealerCount: data.stealerCount,
        dataSources: data.dataSources,
        exposedData: (data.exposedData || []).map(ed => ({
          type: ed.type,
          count: ed.count,
          icon: iconMap[ed.type] || Database,
        })),
        breaches: (data.breaches || []).map(b => ({
          name: b.title || b.name || b.Name || 'Unknown',
          date: b.date || b.BreachDate || '',
          records: b.records > 1000000000 ? `${(b.records / 1000000000).toFixed(1)}B` :
                   b.records > 1000000 ? `${(b.records / 1000000).toFixed(0)}M` :
                   b.records > 1000 ? `${(b.records / 1000).toFixed(0)}K` : String(b.records || b.PwnCount || 0),
          dataTypes: b.dataTypes || b.DataClasses || [],
          severity: b.severity,
          verified: b.verified ?? b.IsVerified ?? false,
          description: b.description || b.Description || '',
          origin: b.domain || b.Domain || 'Unknown',
          passwordHashes: b.dataTypes?.includes('Passwords') || b.DataClasses?.includes('Passwords') ? 'Exposed' : 'N/A',
          source: b.source || 'XposedOrNot',
          isSensitive: b.IsSensitive || false,
          logoUrl: b.LogoPath || null,
        })),
        recommendations: (data.recommendations || []).map(r => ({
          text: r.text,
          priority: r.priority,
          icon: r.priority === 'Critical' ? AlertTriangle : r.priority === 'High' ? Shield : Lock,
        })),
        darkWebMentions: data.stealerCount || 0,
        pastebin: data.pasteData?.count || 0,
        pasteData: data.pasteData || null,
        forumPosts: 0,
        lastSeen: new Date().toISOString(),
      };

      setResults(resultData);
      addToHistory({
        tool: 'Breach Database',
        query: searchQuery,
        timestamp: new Date().toISOString(),
        results: resultData,
      });
      trackToolUsage('breach-database', 'search', 'success');
      toast.success(`Breach analysis complete — ${data.totalBreaches} breaches found${data.compromised ? ' ⚠️ INFOSTEALER DETECTED' : ''}`);
    } catch (error) {
      console.error('Breach search error:', error);
      toast.error(error.message || 'Search failed. Is the backend running?');
      trackToolUsage('breach-database', 'search', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'breaches', label: 'Breaches', icon: Database },
    { id: 'pastes', label: 'Pastes', icon: FileText },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'recommendations', label: 'Actions', icon: Shield },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-xl"
    >
      <motion.div
        ref={containerRef}
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-6xl max-h-[95vh] bg-gradient-to-br from-[#0a0a12] via-[#0f0a1a] to-[#0a0a12] rounded-2xl sm:rounded-3xl border border-violet-500/20 overflow-hidden shadow-2xl shadow-violet-500/10"
      >
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <HexPattern />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/3 rounded-full blur-[100px]" />
        </div>

        {/* Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,92,246,0.03) 2px, rgba(139,92,246,0.03) 4px)',
        }} />

        {/* ═══════════════ HEADER ═══════════════ */}
        <div className="relative z-10 flex items-center justify-between p-3 sm:p-5 border-b border-violet-500/20 bg-black/40 backdrop-blur-xl">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Logo */}
            <motion.div
              whileHover={{ rotate: [0, -5, 5, 0] }}
              className="relative"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Skull className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0a0a12] flex items-center justify-center"
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </motion.div>
            </motion.div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Breach Intelligence</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                  DARK WEB
                </span>
              </div>
              <p className="text-xs sm:text-sm text-violet-300/60 flex items-center gap-2 mt-0.5">
                <Eye className="w-3.5 h-3.5" />
                <span>Credential leak detection & monitoring</span>
                {results && (
                  <span className="flex items-center gap-1 text-red-400">
                    <Radio className="w-3 h-3 animate-pulse" />
                    {results.totalBreaches} exposures
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-amber-300">10</span>
              <span className="text-xs text-amber-400/60">credits</span>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.05, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-violet-500/10 border border-white/10 hover:border-violet-500/30 transition-all"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </motion.button>

            {results && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportJSON}
                className="hidden sm:flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-violet-500/10 border border-white/10 hover:border-violet-500/30 transition-all"
              >
                <Download className="w-4 h-4 text-violet-400" />
                <span className="text-xs text-violet-300">Export</span>
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 transition-all"
            >
              <X className="w-5 h-5 text-gray-400" />
            </motion.button>
          </div>
        </div>

        {/* ═══════════════ CONTENT ═══════════════ */}
        <div className="relative z-10 overflow-y-auto max-h-[calc(95vh-80px)] custom-scrollbar">
          <AnimatePresence mode="wait">
            {!results ? (
              /* ═══════════════ SEARCH VIEW ═══════════════ */
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-4 sm:p-8"
              >
                <div className="max-w-3xl mx-auto space-y-6">
                  {/* Search Type Selector */}
                  <div className="grid grid-cols-4 gap-2 sm:gap-3">
                    {[
                      { id: 'email', label: 'Email', icon: Mail, placeholder: 'target@example.com' },
                      { id: 'username', label: 'Username', icon: User, placeholder: 'username123' },
                      { id: 'phone', label: 'Phone', icon: Phone, placeholder: '+1234567890' },
                      { id: 'domain', label: 'Domain', icon: Globe, placeholder: 'example.com' },
                    ].map(type => (
                      <motion.button
                        key={type.id}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSearchType(type.id)}
                        className={`p-3 sm:p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                          searchType === type.id
                            ? 'bg-violet-500/20 border-2 border-violet-500/50 text-white shadow-lg shadow-violet-500/20'
                            : 'bg-black/30 border border-violet-500/20 text-gray-400 hover:border-violet-500/40'
                        }`}
                      >
                        <type.icon className={`w-5 h-5 ${searchType === type.id ? 'text-violet-400' : ''}`} />
                        <span className="text-xs sm:text-sm font-medium">{type.label}</span>
                      </motion.button>
                    ))}
                  </div>

                  {/* Search Input */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-black/40 border border-violet-500/20 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="w-4 h-4 text-violet-400" />
                      <label className="text-sm font-medium text-violet-400 tracking-wide">SEARCH TARGET</label>
                    </div>
                    
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                      <div className="relative flex gap-3">
                        <div className="flex-1 relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-500/70" />
                          <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder={
                              searchType === 'email' ? 'target@example.com' :
                              searchType === 'username' ? 'username123' :
                              searchType === 'phone' ? '+1234567890' : 'example.com'
                            }
                            disabled={isSearching}
                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-black/50 border-2 border-violet-500/30 focus:border-violet-500 text-white text-lg placeholder-gray-600 outline-none font-mono transition-all disabled:opacity-50"
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                          />
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleSearch}
                          disabled={isSearching || !searchQuery.trim()}
                          className="px-6 sm:px-8 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all"
                        >
                          {isSearching ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                              <Cpu className="w-5 h-5" />
                            </motion.div>
                          ) : (
                            <Crosshair className="w-5 h-5" />
                          )}
                          <span className="hidden sm:inline">{isSearching ? 'Scanning...' : 'Scan'}</span>
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Scanning Animation or Empty State */}
                  {isSearching ? (
                    <ScanningOverlay searchQuery={searchQuery} searchType={searchType} />
                  ) : (
                    <div className="text-center py-12">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.05, 1],
                          opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="inline-block"
                      >
                        <div className="relative">
                          <Skull className="w-24 h-24 text-violet-500/20 mx-auto" />
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-0 border-2 border-dashed border-violet-500/10 rounded-full"
                          />
                        </div>
                      </motion.div>
                      <h3 className="text-xl text-gray-400 mt-6 mb-2">Search the breach database</h3>
                      <p className="text-gray-600 text-sm max-w-md mx-auto">
                        Check if your credentials have been exposed in known data breaches, paste sites, or dark web forums.
                      </p>
                    </div>
                  )}

                  {/* Warning Notice */}
                  {!isSearching && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-amber-400">Legal Notice</p>
                          <p className="text-xs text-amber-300/70 mt-1">
                            This tool searches publicly available breach databases. Use only to check your own accounts or with proper authorization.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ) : (
              /* ═══════════════ RESULTS VIEW ═══════════════ */
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 sm:p-6"
              >
                {/* Risk Summary Header */}
                <div className={`mb-6 p-4 sm:p-6 rounded-2xl border backdrop-blur-sm ${
                  results.riskLevel === 'Critical' ? 'bg-red-500/10 border-red-500/30' :
                  results.riskLevel === 'High' ? 'bg-orange-500/10 border-orange-500/30' :
                  'bg-amber-500/10 border-amber-500/30'
                }`}>
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <RiskGauge level={results.riskLevel} score={riskScore} />
                      <div>
                        <div className={`text-2xl sm:text-3xl font-bold ${
                          results.riskLevel === 'Critical' ? 'text-red-400' :
                          results.riskLevel === 'High' ? 'text-orange-400' : 'text-amber-400'
                        }`}>
                          {results.totalBreaches} Breaches Found
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-gray-400">{results.query}</span>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCopy(results.query, 'query')}
                            className="p-1 rounded hover:bg-white/10"
                          >
                            {copiedField === 'query' ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-500" />
                            )}
                          </motion.button>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            First: {results.firstBreach}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Last: {results.lastBreach}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center px-4 py-3 rounded-xl bg-black/30 border border-violet-500/20">
                        <div className="text-2xl font-bold text-violet-400">{results.darkWebMentions}</div>
                        <div className="text-xs text-gray-500">Dark Web</div>
                      </div>
                      <div className="text-center px-4 py-3 rounded-xl bg-black/30 border border-purple-500/20">
                        <div className="text-2xl font-bold text-purple-400">{results.pastebin}</div>
                        <div className="text-xs text-gray-500">Paste Sites</div>
                      </div>
                      <div className="text-center px-4 py-3 rounded-xl bg-black/30 border border-pink-500/20">
                        <div className="text-2xl font-bold text-pink-400">{results.forumPosts}</div>
                        <div className="text-xs text-gray-500">Forum Posts</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                  {tabs.map(tab => (
                    <motion.button
                      key={tab.id}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'bg-violet-500/20 text-white border border-violet-500/40'
                          : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-violet-400' : ''}`} />
                      {tab.label}
                    </motion.button>
                  ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      {/* Exposed Data Types - Hexagonal Grid */}
                      <div className="p-6 rounded-2xl bg-black/30 border border-violet-500/20">
                        <h3 className="text-violet-300 font-semibold mb-6 flex items-center gap-2">
                          <ShieldAlert className="w-5 h-5" />
                          Exposed Data Types
                        </h3>
                        <div className="flex flex-wrap justify-center gap-4">
                          {(results.exposedData || []).map((data, i) => (
                            <ExposedDataHex key={data.type} data={data} index={i} total={(results.exposedData || []).length} />
                          ))}
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                          icon={Database}
                          label="Total Breaches"
                          value={results.totalBreaches}
                          subValue={results.riskLevel}
                          color="violet"
                          delay={0}
                        />
                        <StatCard
                          icon={Layers}
                          label="Records Exposed"
                          value={results.totalRecords.toLocaleString()}
                          color="purple"
                          delay={0.1}
                        />
                        <StatCard
                          icon={Key}
                          label="Passwords Leaked"
                          value={results.exposedData.find(d => d.type === 'Password')?.count || 0}
                          subValue="High Priority"
                          color="red"
                          delay={0.2}
                        />
                        <StatCard
                          icon={Globe}
                          label="Active Sources"
                          value={results.darkWebMentions + results.pastebin}
                          subValue="Monitoring"
                          color="cyan"
                          delay={0.3}
                        />
                      </div>

                      {/* Recent Breaches Preview */}
                      <div className="p-6 rounded-2xl bg-black/30 border border-violet-500/20">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-violet-300 font-semibold flex items-center gap-2">
                            <Skull className="w-5 h-5" />
                            Recent Breaches
                          </h3>
                          <button
                            onClick={() => setActiveTab('breaches')}
                            className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                          >
                            View all <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {results.breaches.slice(0, 4).map((breach, i) => (
                            <motion.div
                              key={breach.name}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className={`p-3 rounded-xl border ${
                                breach.severity === 'Critical' ? 'bg-red-500/10 border-red-500/30' :
                                breach.severity === 'High' ? 'bg-orange-500/10 border-orange-500/30' :
                                'bg-amber-500/10 border-amber-500/30'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-white">{breach.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  breach.severity === 'Critical' ? 'bg-red-500/20 text-red-400' :
                                  breach.severity === 'High' ? 'bg-orange-500/20 text-orange-400' :
                                  'bg-amber-500/20 text-amber-400'
                                }`}>
                                  {breach.severity}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">{breach.date} • {breach.records} records</div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Breaches Tab */}
                  {activeTab === 'breaches' && (
                    <motion.div
                      key="breaches"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      {(results.breaches || []).map((breach, i) => (
                        <TimelineBreachItem
                          key={breach.name}
                          breach={breach}
                          index={i}
                          isExpanded={expandedBreach === breach.name}
                          onToggle={() => setExpandedBreach(expandedBreach === breach.name ? null : breach.name)}
                        />
                      ))}
                    </motion.div>
                  )}

                  {/* Timeline Tab */}
                  {activeTab === 'timeline' && (
                    <motion.div
                      key="timeline"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="p-6 rounded-2xl bg-black/30 border border-violet-500/20"
                    >
                      <h3 className="text-violet-300 font-semibold mb-6 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Breach Timeline
                      </h3>
                      
                      {/* Timeline Visualization */}
                      <div className="relative">
                        {/* Timeline bar */}
                        <div 
                          className="absolute top-4 left-0 right-0 h-1 rounded-full"
                          style={{ background: 'linear-gradient(to right, rgba(34,197,94,0.5), rgba(234,179,8,0.5), rgba(249,115,22,0.5), rgba(239,68,68,0.5))' }}
                        />
                        
                        {/* Timeline items */}
                        <div className="relative flex justify-between pt-8">
                          {results.breaches.sort((a, b) => new Date(a.date) - new Date(b.date)).map((breach, i) => (
                            <motion.div
                              key={breach.name}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.15 }}
                              className="flex flex-col items-center"
                            >
                              <div className={`w-4 h-4 rounded-full -mt-6 mb-2 ${
                                breach.severity === 'Critical' ? 'bg-red-500' :
                                breach.severity === 'High' ? 'bg-orange-500' :
                                'bg-amber-500'
                              } ring-4 ring-black/50`} />
                              <div className="text-center">
                                <div className="text-xs text-gray-500">{breach.date.slice(0, 4)}</div>
                                <div className="text-xs text-white font-medium truncate max-w-[80px]">{breach.name}</div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Timeline List */}
                      <div className="mt-8 space-y-3">
                        {results.breaches.sort((a, b) => new Date(b.date) - new Date(a.date)).map((breach, i) => (
                          <motion.div
                            key={breach.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-4 p-3 rounded-xl bg-black/30 border border-violet-500/10"
                          >
                            <div className={`w-2 h-10 rounded-full ${
                              breach.severity === 'Critical' ? 'bg-red-500' :
                              breach.severity === 'High' ? 'bg-orange-500' :
                              'bg-amber-500'
                            }`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white">{breach.name}</span>
                                <span className="text-xs text-gray-500">{breach.records} records</span>
                              </div>
                              <div className="text-xs text-gray-500">{breach.date}</div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {breach.dataTypes.slice(0, 3).map(type => (
                                <span key={type} className="text-[10px] px-2 py-0.5 rounded bg-violet-500/20 text-violet-300">
                                  {type}
                                </span>
                              ))}
                              {breach.dataTypes.length > 3 && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/20 text-violet-300">
                                  +{breach.dataTypes.length - 3}
                                </span>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Recommendations Tab */}
                  {activeTab === 'recommendations' && (
                    <motion.div
                      key="recommendations"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20"
                    >
                      <h3 className="text-emerald-300 font-semibold mb-6 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5" />
                        Recommended Actions
                      </h3>
                      
                      <div className="space-y-3">
                        {(results.recommendations || []).map((rec, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`p-4 rounded-xl border flex items-start gap-4 ${
                              rec.priority === 'Critical' ? 'bg-red-500/10 border-red-500/30' :
                              rec.priority === 'High' ? 'bg-orange-500/10 border-orange-500/30' :
                              'bg-emerald-500/10 border-emerald-500/30'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              rec.priority === 'Critical' ? 'bg-red-500/20' :
                              rec.priority === 'High' ? 'bg-orange-500/20' :
                              'bg-emerald-500/20'
                            }`}>
                              <rec.icon className={`w-5 h-5 ${
                                rec.priority === 'Critical' ? 'text-red-400' :
                                rec.priority === 'High' ? 'text-orange-400' :
                                'text-emerald-400'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  rec.priority === 'Critical' ? 'bg-red-500/20 text-red-400' :
                                  rec.priority === 'High' ? 'bg-orange-500/20 text-orange-400' :
                                  'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                  {rec.priority}
                                </span>
                              </div>
                              <p className="text-gray-300 text-sm">{rec.text}</p>
                            </div>
                            <CheckCircle className="w-5 h-5 text-gray-600 flex-shrink-0 cursor-pointer hover:text-emerald-400 transition-colors" />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Pastes Tab */}
                  {activeTab === 'pastes' && (
                    <motion.div
                      key="pastes"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20">
                        <h3 className="text-purple-300 font-semibold mb-4 flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Paste Site Exposure
                          {results.pasteData?.count > 0 && (
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">
                              {results.pasteData.count} paste(s) found
                            </span>
                          )}
                        </h3>

                        {results.pasteData?.count > 0 ? (
                          <div className="space-y-3">
                            {/* Paste Summary Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                              <div className="p-3 rounded-xl bg-black/30 border border-purple-500/20 text-center">
                                <div className="text-xl font-bold text-purple-400">{results.pasteData.count}</div>
                                <div className="text-[10px] text-gray-500">Total Pastes</div>
                              </div>
                              {results.pasteData.sources && (
                                <div className="p-3 rounded-xl bg-black/30 border border-purple-500/20 text-center">
                                  <div className="text-xl font-bold text-pink-400">
                                    {[...new Set((results.pasteData.pastes || []).map(p => p.source))].length || '-'}
                                  </div>
                                  <div className="text-[10px] text-gray-500">Sources</div>
                                </div>
                              )}
                              <div className="p-3 rounded-xl bg-black/30 border border-purple-500/20 text-center">
                                <div className="text-xl font-bold text-amber-400">
                                  {(results.pasteData.pastes || []).reduce((sum, p) => sum + (p.emailCount || 0), 0) || '-'}
                                </div>
                                <div className="text-[10px] text-gray-500">Emails in Pastes</div>
                              </div>
                            </div>

                            {/* Individual Pastes */}
                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar space-y-2">
                              {(results.pasteData.pastes || []).map((paste, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                  className="p-4 rounded-xl bg-black/20 border border-purple-500/15 hover:border-purple-500/30 transition-all"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-white text-sm font-medium truncate">
                                        {paste.title || 'Untitled Paste'}
                                      </div>
                                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                                        {paste.source && (
                                          <span className="flex items-center gap-1">
                                            <Globe className="w-3 h-3" />
                                            {paste.source}
                                          </span>
                                        )}
                                        {paste.date && (
                                          <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {paste.date}
                                          </span>
                                        )}
                                        {paste.emailCount > 0 && (
                                          <span className="flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            {paste.emailCount} emails
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] flex-shrink-0">PASTE</span>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-10">
                            <FileText className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                            <p className="text-gray-400">No paste site exposure found</p>
                            <p className="text-gray-600 text-sm mt-1">This is a good sign — no credentials found on paste sites</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Custom Scrollbar Styles */}
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.2);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(139,92,246,0.3);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(139,92,246,0.5);
          }
        `}</style>
      </motion.div>
    </motion.div>
  );
};

export default BreachDatabaseTool;
