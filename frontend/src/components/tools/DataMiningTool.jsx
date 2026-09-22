import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  Pickaxe, X, Search, Zap, Database, Cpu, HardDrive, Activity,
  Download, Filter, BarChart3, PieChart, TrendingUp, Users,
  FileText, Image, Globe, Mail, Phone, CreditCard, Lock,
  RefreshCw, Play, Pause, Settings, Layers, ArrowUpRight, Copy,
  Server, Network, Shield, Eye, Radio, Gem, Boxes, GitBranch,
  Terminal, Code, Hash, Binary, CircuitBoard, Workflow, Clock,
  CheckCircle2, AlertTriangle, Info, ChevronRight, ExternalLink,
  Wifi, Key, Bitcoin, Tag, MapPin, AlertCircle
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';

// ═══════════════════════════════════════════════════════════════════════════
// MINING DRILL ANIMATION - Industrial drill bit visualization
// ═══════════════════════════════════════════════════════════════════════════
const MiningDrill = ({ isActive, progress }) => {
  return (
    <div className="relative w-32 h-32">
      {/* Drill shaft */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={isActive ? { rotate: 360 } : { rotate: 0 }}
        transition={{ duration: 0.5, repeat: isActive ? Infinity : 0, ease: 'linear' }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Drill bit spiral */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <motion.path
              key={i}
              d={`M50,50 L${50 + 35 * Math.cos((angle * Math.PI) / 180)},${50 + 35 * Math.sin((angle * Math.PI) / 180)}`}
              stroke="url(#drillGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: isActive ? 1 : 0.5 }}
            />
          ))}
          {/* Center core */}
          <circle cx="50" cy="50" r="12" fill="url(#coreGradient)" />
          <circle cx="50" cy="50" r="6" fill="#0d1117" />
          <defs>
            <linearGradient id="drillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <radialGradient id="coreGradient">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </radialGradient>
          </defs>
        </svg>
      </motion.div>
      
      {/* Progress ring */}
      <svg className="absolute inset-0 w-full h-full -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="58"
          fill="none"
          stroke="rgba(16,185,129,0.1)"
          strokeWidth="4"
        />
        <motion.circle
          cx="64"
          cy="64"
          r="58"
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={364}
          initial={{ strokeDashoffset: 364 }}
          animate={{ strokeDashoffset: 364 - (364 * progress) / 100 }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#6ee7b7" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Sparks when active */}
      {isActive && [...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-emerald-400 rounded-full"
          style={{ left: '50%', top: '50%' }}
          animate={{
            x: [0, (Math.random() - 0.5) * 80],
            y: [0, (Math.random() - 0.5) * 80],
            opacity: [1, 0],
            scale: [1, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// DATA ORE CRYSTAL - Visual representation of extracted data types
// ═══════════════════════════════════════════════════════════════════════════
const DataCrystal = ({ type, count, color, isSelected, onClick }) => {
  const colors = {
    emerald: { base: '#10b981', glow: 'rgba(16,185,129,0.5)' },
    blue: { base: '#3b82f6', glow: 'rgba(59,130,246,0.5)' },
    purple: { base: '#8b5cf6', glow: 'rgba(139,92,246,0.5)' },
    pink: { base: '#ec4899', glow: 'rgba(236,72,153,0.5)' },
    cyan: { base: '#06b6d4', glow: 'rgba(6,182,212,0.5)' },
    amber: { base: '#f59e0b', glow: 'rgba(245,158,11,0.5)' },
    red: { base: '#ef4444', glow: 'rgba(239,68,68,0.5)' },
    indigo: { base: '#6366f1', glow: 'rgba(99,102,241,0.5)' },
  };
  
  const c = colors[color] || colors.emerald;
  
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -3 }}
      whileTap={{ scale: 0.95 }}
      className={`relative p-4 rounded-xl transition-all ${
        isSelected 
          ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-2' 
          : 'bg-slate-900/50 border border-slate-700/50 hover:border-slate-600'
      }`}
      style={{ 
        borderColor: isSelected ? c.base : undefined,
        boxShadow: isSelected ? `0 0 30px ${c.glow}` : undefined 
      }}
    >
      {/* Crystal SVG */}
      <div className="relative w-12 h-12 mx-auto mb-2">
        <svg viewBox="0 0 50 60" className="w-full h-full">
          {/* Crystal facets */}
          <motion.polygon
            points="25,5 45,20 45,45 25,55 5,45 5,20"
            fill={isSelected ? c.base : 'transparent'}
            fillOpacity={isSelected ? 0.2 : 0}
            stroke={c.base}
            strokeWidth="1.5"
            animate={isSelected ? { 
              fillOpacity: [0.2, 0.4, 0.2],
              strokeWidth: [1.5, 2, 1.5]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <line x1="25" y1="5" x2="25" y2="55" stroke={c.base} strokeWidth="0.5" opacity="0.5" />
          <line x1="5" y1="20" x2="45" y2="45" stroke={c.base} strokeWidth="0.5" opacity="0.5" />
          <line x1="45" y1="20" x2="5" y2="45" stroke={c.base} strokeWidth="0.5" opacity="0.5" />
          {/* Inner glow */}
          <circle cx="25" cy="30" r="8" fill={c.base} opacity={isSelected ? 0.6 : 0.2}>
            {isSelected && (
              <animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.5s" repeatCount="indefinite" />
            )}
          </circle>
        </svg>
        
        {/* Floating particles when selected */}
        {isSelected && [...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{ backgroundColor: c.base, left: '50%', top: '50%' }}
            animate={{
              y: [-5, -25],
              x: [(i - 1) * 8, (i - 1) * 12],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </div>
      
      <p className={`text-xs font-medium text-center ${isSelected ? 'text-white' : 'text-gray-400'}`}>
        {type}
      </p>
      {count !== undefined && (
        <p className="text-xs text-center mt-1" style={{ color: c.base }}>{count}</p>
      )}
    </motion.button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// EXTRACTION PIPELINE - Visual data flow through extraction stages
// ═══════════════════════════════════════════════════════════════════════════
const ExtractionPipeline = ({ stages, activeStage }) => {
  return (
    <div className="flex items-center justify-between w-full">
      {stages.map((stage, i) => (
        <div key={stage.id} className="flex items-center flex-1">
          {/* Stage node */}
          <div className="relative flex flex-col items-center">
            <motion.div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                i <= activeStage 
                  ? 'bg-emerald-500/20 border-2 border-emerald-500' 
                  : 'bg-slate-800/50 border border-slate-700'
              }`}
              animate={i === activeStage ? { 
                scale: [1, 1.1, 1],
                boxShadow: ['0 0 0px rgba(16,185,129,0)', '0 0 20px rgba(16,185,129,0.5)', '0 0 0px rgba(16,185,129,0)']
              } : {}}
              transition={{ duration: 1, repeat: i === activeStage ? Infinity : 0 }}
            >
              <stage.icon className={`w-5 h-5 ${i <= activeStage ? 'text-emerald-400' : 'text-gray-600'}`} />
            </motion.div>
            <span className={`text-xs mt-2 ${i <= activeStage ? 'text-emerald-400' : 'text-gray-600'}`}>
              {stage.label}
            </span>
            {stage.count !== undefined && (
              <span className="text-xs text-gray-500">{stage.count}</span>
            )}
          </div>
          
          {/* Connector line */}
          {i < stages.length - 1 && (
            <div className="flex-1 h-0.5 mx-2 bg-slate-800 relative overflow-hidden">
              {i < activeStage && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-400"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  style={{ transformOrigin: 'left' }}
                />
              )}
              {i === activeStage && (
                <motion.div
                  className="absolute top-0 left-0 w-4 h-full bg-gradient-to-r from-emerald-500 to-transparent"
                  animate={{ x: ['0%', '400%'] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// DATA VEIN VISUALIZATION - Underground mining shaft visual
// ═══════════════════════════════════════════════════════════════════════════
const DataVeins = ({ depth }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="veinGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(16,185,129,0.1)" />
            <stop offset="50%" stopColor="rgba(16,185,129,0.3)" />
            <stop offset="100%" stopColor="rgba(16,185,129,0.1)" />
          </linearGradient>
          <linearGradient id="veinGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(6,182,212,0.1)" />
            <stop offset="50%" stopColor="rgba(6,182,212,0.2)" />
            <stop offset="100%" stopColor="rgba(6,182,212,0.1)" />
          </linearGradient>
        </defs>
        
        {/* Layer lines representing data strata */}
        {[...Array(8)].map((_, i) => (
          <motion.path
            key={i}
            d={`M0,${100 + i * 60} Q${200 + i * 30},${80 + i * 50} ${400 + i * 20},${120 + i * 55} T800,${90 + i * 62} T1200,${110 + i * 58}`}
            fill="none"
            stroke={`url(#veinGradient${i % 2 + 1})`}
            strokeWidth={2 - i * 0.15}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: Math.min(1, depth / (12 - i)),
              opacity: depth > i * 10 ? 0.6 : 0 
            }}
            transition={{ duration: 1.5, delay: i * 0.1 }}
          />
        ))}
        
        {/* Data ore deposits */}
        {depth > 30 && [...Array(5)].map((_, i) => (
          <motion.circle
            key={`ore-${i}`}
            cx={100 + i * 180 + Math.random() * 50}
            cy={150 + i * 80}
            r={4 + Math.random() * 3}
            fill={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'][i]}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: [0.3, 0.7, 0.3] }}
            transition={{ 
              scale: { delay: 0.5 + i * 0.2 },
              opacity: { duration: 2, repeat: Infinity, delay: i * 0.3 }
            }}
          />
        ))}
      </svg>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SOURCE HEALTH MONITOR - Real-time source status display
// ═══════════════════════════════════════════════════════════════════════════
const SourceHealthMonitor = ({ sources }) => {
  return (
    <div className="space-y-2">
      {sources.map((source, i) => (
        <motion.div
          key={source.name}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30"
        >
          <div className={`w-2 h-2 rounded-full ${
            source.status === 'active' ? 'bg-emerald-500 animate-pulse' :
            source.status === 'complete' ? 'bg-emerald-500' :
            source.status === 'error' ? 'bg-red-500' :
            'bg-gray-600'
          }`} />
          <span className="text-xs text-gray-400 flex-1 truncate">{source.name}</span>
          <span className={`text-xs font-mono ${
            source.status === 'active' ? 'text-emerald-400' :
            source.status === 'complete' ? 'text-emerald-300' :
            source.status === 'error' ? 'text-red-400' :
            'text-gray-600'
          }`}>
            {source.records || '—'}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// EXTRACTION METRICS CARD
// ═══════════════════════════════════════════════════════════════════════════
const MetricCard = ({ icon: Icon, label, value, subValue, color = 'emerald', trend }) => {
  const colorClasses = {
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400',
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400',
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between mb-2">
        <Icon className={`w-5 h-5 ${colorClasses[color].split(' ').pop()}`} />
        {trend && (
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            trend > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
      {subValue && <div className="text-xs text-gray-600 mt-1">{subValue}</div>}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// EXTRACTED DATA ITEM
// ═══════════════════════════════════════════════════════════════════════════
const ExtractedDataItem = ({ item, type, index, onCopy }) => {
  const typeColors = {
    emails: 'emerald',
    phones: 'blue',
    documents: 'purple',
    images: 'pink',
    links: 'cyan',
    financial: 'amber',
    credentials: 'red',
    social: 'indigo',
    ipAddresses: 'orange',
    cryptoWallets: 'yellow',
    apiKeys: 'rose',
    metaTags: 'teal',
    subdomains: 'violet',
  };
  
  const color = typeColors[type] || 'gray';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group flex items-center gap-3 p-3 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/30 hover:border-slate-600/50 transition-all"
    >
      {/* Confidence indicator */}
      <div className="relative w-10 h-10 flex-shrink-0">
        <svg className="w-full h-full -rotate-90">
          <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke={`var(--tw-color-${color}-500, #10b981)`}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={100}
            strokeDashoffset={100 - item.confidence}
            className={`text-${color}-500`}
            style={{ stroke: color === 'emerald' ? '#10b981' : color === 'blue' ? '#3b82f6' : color === 'purple' ? '#8b5cf6' : color === 'cyan' ? '#06b6d4' : color === 'amber' ? '#f59e0b' : color === 'red' ? '#ef4444' : color === 'indigo' ? '#6366f1' : '#10b981' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
          {item.confidence}
        </span>
      </div>
      
      {/* Data value */}
      <div className="flex-1 min-w-0">
        <code className="text-sm text-emerald-400 font-mono block truncate">{item.value}</code>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <span className="px-1.5 py-0.5 rounded bg-slate-700/50">{item.source}</span>
          {item.verified && (
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" /> Verified
            </span>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onCopy?.(item.value)}
          className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <Copy className="w-4 h-4 text-gray-400" />
        </button>
        <button className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors">
          <ExternalLink className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
const DataMiningTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  
  const [target, setTarget] = useState('');
  const [dataTypes, setDataTypes] = useState([]);
  const [isMining, setIsMining] = useState(false);
  const [miningProgress, setMiningProgress] = useState(0);
  const [miningDepth, setMiningDepth] = useState(0);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Data Mining', query: target });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [activeTab, setActiveTab] = useState('overview');
  const [activeStage, setActiveStage] = useState(-1);
  const [expandedType, setExpandedType] = useState(null);
  const canvasRef = useRef(null);
  const [activeSources, setActiveSources] = useState([]);

  const handleExportJSON = () => {
    if (!results) { toast.error('No results to export'); return; }
    const ok = exportToJSON(results, `data_mining_${Date.now()}.json`);
    if (ok) toast.success('Exported JSON'); else toast.error('Export failed');
  };

  const handleExportCSV = () => {
    if (!results) { toast.error('No results to export'); return; }
    const prepared = formatForExport(results, 'csv');
    const ok = exportToCSV(prepared, `data_mining_${Date.now()}.csv`);
    if (ok) toast.success('Exported CSV'); else toast.error('Export failed');
  };

  const handleCopy = (text) => {
    copy(text);
    toast.success('Copied to clipboard');
  };

  const availableTypes = [
    { id: 'emails', label: 'Emails', icon: Mail, color: 'emerald' },
    { id: 'phones', label: 'Phones', icon: Phone, color: 'blue' },
    { id: 'documents', label: 'Documents', icon: FileText, color: 'purple' },
    { id: 'images', label: 'Images', icon: Image, color: 'pink' },
    { id: 'links', label: 'Links', icon: Globe, color: 'cyan' },
    { id: 'financial', label: 'Financial', icon: CreditCard, color: 'amber' },
    { id: 'credentials', label: 'Credentials', icon: Key, color: 'red' },
    { id: 'social', label: 'Social', icon: Users, color: 'indigo' },
    { id: 'ipAddresses', label: 'IP Addresses', icon: Wifi, color: 'orange' },
    { id: 'cryptoWallets', label: 'Crypto Wallets', icon: Bitcoin, color: 'yellow' },
    { id: 'metaTags', label: 'Meta Tags', icon: Tag, color: 'teal' },
  ];

  const pipelineStages = [
    { id: 'init', label: 'Initialize', icon: CircuitBoard },
    { id: 'dns', label: 'DNS Enum', icon: Network },
    { id: 'whois', label: 'WHOIS', icon: Database },
    { id: 'scrape', label: 'Web Scrape', icon: Code },
    { id: 'extract', label: 'Deep Extract', icon: Search },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'security', label: 'Security Scan', icon: Shield },
    { id: 'analyze', label: 'Analyze', icon: Cpu },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'extracts', label: 'Extracts', icon: Gem },
    { id: 'sources', label: 'Sources', icon: Server },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'export', label: 'Export', icon: Download },
  ];

  // Mining depth animation
  useEffect(() => {
    if (isMining) {
      const interval = setInterval(() => {
        setMiningDepth(prev => Math.min(prev + 0.8, 100));
      }, 80);
      return () => clearInterval(interval);
    }
  }, [isMining]);

  // Mining progress and stages
  useEffect(() => {
    if (isMining && miningProgress < 100) {
      const interval = setInterval(() => {
        setMiningProgress(prev => {
          const newProgress = Math.min(prev + Math.random() * 2.5 + 0.5, 100);
          setActiveStage(Math.floor((newProgress / 100) * pipelineStages.length));
          return newProgress;
        });
      }, 120);
      return () => clearInterval(interval);
    }
  }, [isMining, miningProgress]);

  // Simulated active sources
  useEffect(() => {
    if (isMining) {
      const sources = [
        'WHOIS Registry', 'DNS Resolver', 'Web Crawler', 'Google Cache',
        'Wayback Machine', 'Certificate Logs', 'Shodan API', 'LinkedIn',
        'GitHub Search', 'Pastebin Monitor'
      ];
      setActiveSources(sources.map((name, i) => ({
        name,
        status: i < Math.floor(miningProgress / 10) ? 'complete' : 
                i === Math.floor(miningProgress / 10) ? 'active' : 'pending',
        records: i < Math.floor(miningProgress / 10) ? Math.floor(Math.random() * 500) + 50 : null
      })));
    }
  }, [isMining, miningProgress]);

  // Canvas network visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    };
    resize();
    window.addEventListener('resize', resize);

    const nodes = [];
    const nodeCount = 40;
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(13, 17, 23, 0.1)';
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // Update and draw nodes
      nodes.forEach((node, i) => {
        node.x += node.vx;
        node.y += node.vy;
        
        if (node.x < 0 || node.x > canvas.offsetWidth) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.offsetHeight) node.vy *= -1;

        // Draw connections
        nodes.forEach((other, j) => {
          if (i >= j) return;
          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${0.15 * (1 - dist / 100)})`;
            ctx.stroke();
          }
        });

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.6)';
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const toggleDataType = (id) => {
    setDataTypes(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleStartMining = async () => {
    if (!target.trim() || dataTypes.length === 0) return;
    
    setIsMining(true);
    setMiningProgress(0);
    setMiningDepth(0);
    setActiveStage(0);
    onConsume?.(12);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE}/tools/datamining/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: target.trim(), dataTypes }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Data mining failed');
      }

      const resultData = await response.json();
      setResults(resultData);
      addToHistory('data-mining', target, resultData);
      trackToolUsage('data-mining', 'mine', 'success');
      toast.success('Data mining complete — real data!');
      setActiveTab('overview');
    } catch (error) {
      console.error('Data mining error:', error);
      toast.error(error.message || 'Mining failed. Is the backend running?');
      trackToolUsage('data-mining', 'mine', 'error');
    } finally {
      setIsMining(false);
    }
  };

  const handleRefresh = () => {
    setTarget('');
    setDataTypes([]);
    setResults(null);
    setMiningProgress(0);
    setMiningDepth(0);
    setActiveStage(-1);
    toast.info('Ready for new mining operation');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 20 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-7xl max-h-[92vh] overflow-hidden rounded-2xl bg-[#0d1117] border border-emerald-500/20 shadow-2xl shadow-emerald-500/10"
      >
        {/* Background canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full opacity-30"
        />
        
        {/* Data veins visualization */}
        <DataVeins depth={isMining ? miningDepth : results ? 100 : 0} />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 border-b border-emerald-500/20 bg-[#0d1117]/90 backdrop-blur-md">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            {/* Logo */}
            <div className="relative flex-shrink-0">
              <motion.div
                className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/40"
                animate={isMining ? { rotate: [0, 5, -5, 0] } : {}}
                transition={{ duration: 0.3, repeat: isMining ? Infinity : 0 }}
              >
                <Pickaxe className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </motion.div>
              {isMining && (
                <motion.div
                  className="absolute -inset-1 rounded-xl border-2 border-emerald-500/50"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </div>
            
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>Data Mining</span>
                {isMining && (
                  <motion.span
                    className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/50"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    EXTRACTING
                  </motion.span>
                )}
                {results && !isMining && (
                  <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-300 rounded-full">
                    COMPLETE
                  </span>
                )}
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 truncate">
                Industrial-grade data extraction & reconnaissance
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="p-2 sm:px-3 sm:py-2 rounded-lg bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-200 hidden sm:inline">Reset</span>
            </motion.button>
            
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="px-3 py-2 rounded-lg border border-amber-500/40 hidden sm:flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,146,60,0.1))' }}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-amber-300">12</span>
              <span className="text-xs text-amber-200/70">credits</span>
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 transition-all"
            >
              <X className="w-5 h-5 text-gray-400" />
            </motion.button>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 overflow-y-auto max-h-[calc(92vh-80px)] custom-scrollbar">
          <AnimatePresence mode="wait">
            {!results ? (
              <motion.div
                key="config"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 sm:p-6"
              >
                {/* Mining Configuration */}
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Left Column - Target & Controls */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Target Input */}
                    <div className="p-5 rounded-xl bg-slate-900/60 border border-emerald-500/20">
                      <label className="text-sm text-emerald-400 mb-3 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Target Domain / URL / Keyword
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={target}
                          onChange={e => setTarget(e.target.value)}
                          placeholder="example.com"
                          className="w-full px-4 py-4 rounded-xl bg-[#0d1117] border-2 border-emerald-500/30 text-white text-lg font-mono placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all"
                        />
                        {target && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Data Type Selection - Crystals Grid */}
                    <div className="p-5 rounded-xl bg-slate-900/60 border border-emerald-500/20">
                      <label className="text-sm text-emerald-400 mb-4 flex items-center gap-2">
                        <Gem className="w-4 h-4" />
                        Data Ore Types to Extract
                        <span className="ml-auto text-gray-500">{dataTypes.length} selected</span>
                      </label>
                      <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                        {availableTypes.map(type => (
                          <DataCrystal
                            key={type.id}
                            type={type.label}
                            color={type.color}
                            isSelected={dataTypes.includes(type.id)}
                            onClick={() => toggleDataType(type.id)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Extraction Pipeline Preview */}
                    <div className="p-5 rounded-xl bg-slate-900/60 border border-emerald-500/20">
                      <label className="text-sm text-emerald-400 mb-4 flex items-center gap-2">
                        <Workflow className="w-4 h-4" />
                        Extraction Pipeline
                      </label>
                      <ExtractionPipeline stages={pipelineStages} activeStage={activeStage} />
                    </div>

                    {/* Start Mining Button */}
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(16,185,129,0.3)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleStartMining}
                      disabled={isMining || !target.trim() || dataTypes.length === 0}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30 transition-all"
                    >
                      {isMining ? (
                        <>
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                            <Cpu className="w-6 h-6" />
                          </motion.div>
                          <span>Extracting... {miningProgress.toFixed(0)}%</span>
                        </>
                      ) : (
                        <>
                          <Pickaxe className="w-6 h-6" />
                          <span>Start Mining Operation</span>
                        </>
                      )}
                    </motion.button>

                    {/* Mining Progress */}
                    {isMining && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4"
                      >
                        {/* Progress bar */}
                        <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/20">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-emerald-400">Mining Depth</span>
                            <span className="text-white font-mono">{miningDepth.toFixed(0)}m</span>
                          </div>
                          <div className="h-3 bg-[#0d1117] rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ 
                                background: 'linear-gradient(90deg, #10b981, #34d399, #6ee7b7, #34d399, #10b981)',
                                backgroundSize: '200% 100%'
                              }}
                              initial={{ width: 0 }}
                              animate={{ 
                                width: `${miningProgress}%`,
                                backgroundPosition: ['0% 0%', '100% 0%']
                              }}
                              transition={{ backgroundPosition: { duration: 1.5, repeat: Infinity, ease: 'linear' } }}
                            />
                          </div>
                          
                          {/* Mining stats */}
                          <div className="grid grid-cols-4 gap-3 mt-4">
                            {[
                              { icon: Database, label: 'Sources', value: Math.floor(miningProgress / 10) },
                              { icon: HardDrive, label: 'Records', value: Math.floor(miningProgress * 68) },
                              { icon: Cpu, label: 'Threads', value: 8 },
                              { icon: Activity, label: 'Ops/sec', value: Math.floor(Math.random() * 500 + 800) },
                            ].map((stat, i) => (
                              <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="text-center p-2 rounded-lg bg-[#0d1117]/50"
                              >
                                <stat.icon className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                                <div className="text-lg font-bold text-white">{stat.value}</div>
                                <div className="text-xs text-gray-500">{stat.label}</div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Right Column - Drill Visualization & Source Monitor */}
                  <div className="space-y-6">
                    {/* Mining Drill */}
                    <div className="p-5 rounded-xl bg-slate-900/60 border border-emerald-500/20 flex flex-col items-center">
                      <MiningDrill isActive={isMining} progress={miningProgress} />
                      <p className="text-sm text-gray-400 mt-4 text-center">
                        {isMining ? 'Drill operational' : 'Drill on standby'}
                      </p>
                      {isMining && (
                        <div className="text-center mt-2">
                          <span className="text-2xl font-bold text-emerald-400 font-mono">
                            {miningProgress.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Source Health Monitor */}
                    <div className="p-5 rounded-xl bg-slate-900/60 border border-emerald-500/20">
                      <label className="text-sm text-emerald-400 mb-3 flex items-center gap-2">
                        <Server className="w-4 h-4" />
                        Source Status
                      </label>
                      {isMining ? (
                        <SourceHealthMonitor sources={activeSources} />
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Server className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Sources idle</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 sm:p-6"
              >
                {/* Results Tabs */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                  {tabs.map(tab => (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                          : 'bg-slate-800/50 text-gray-400 border border-transparent hover:border-slate-700'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </motion.button>
                  ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  {activeTab === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      {/* Summary Header */}
                      <div className="p-5 rounded-xl border border-emerald-500/30" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(20,184,166,0.05))' }}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              Mining Complete
                            </h3>
                            <p className="text-emerald-400 font-mono">{results.target}</p>
                          </div>
                          <div className="flex gap-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-emerald-400">{results.totalRecords.toLocaleString()}</div>
                              <div className="text-xs text-gray-500">Total Records</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-teal-400">{results.sources}</div>
                              <div className="text-xs text-gray-500">Sources</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-cyan-400">{results.duration}</div>
                              <div className="text-xs text-gray-500">Duration</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <MetricCard
                          icon={Database}
                          label="Data Quality"
                          value={`${results.dataQuality}%`}
                          color="emerald"
                        />
                        <MetricCard
                          icon={Layers}
                          label="Mining Depth"
                          value={results.miningDepth}
                          color="blue"
                        />
                        <MetricCard
                          icon={Server}
                          label="Active Sources"
                          value={results.sources}
                          color="purple"
                        />
                        <MetricCard
                          icon={Shield}
                          label="Verified Data"
                          value={`${Math.round((Object.values(results.data || {}).reduce((sum, d) => sum + (d.items || []).filter(i => i.verified).length, 0) / Math.max(results.totalRecords, 1)) * 100)}%`}
                          color="amber"
                        />
                      </div>

                      {/* Data Distribution */}
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* By Source */}
                        <div className="p-5 rounded-xl bg-slate-900/60 border border-emerald-500/20">
                          <h4 className="text-emerald-400 font-semibold mb-4 flex items-center gap-2">
                            <PieChart className="w-4 h-4" />
                            Data by Source
                          </h4>
                          <div className="space-y-3">
                            {results.statistics.bySource.map((item, i) => (
                              <motion.div
                                key={item.name}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className="flex items-center gap-3"
                              >
                                <div className="w-20 text-sm text-gray-400 truncate">{item.name}</div>
                                <div className="flex-1 h-5 bg-[#0d1117] rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.value}%` }}
                                    transition={{ duration: 0.8, delay: i * 0.1 }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: item.color }}
                                  />
                                </div>
                                <div className="w-12 text-right text-white font-bold">{item.value}%</div>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* By Type */}
                        <div className="p-5 rounded-xl bg-slate-900/60 border border-emerald-500/20">
                          <h4 className="text-emerald-400 font-semibold mb-4 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Data by Type
                          </h4>
                          <div className="flex items-end justify-around h-40 pt-4 px-2">
                            {results.statistics.byType.map((item, i) => (
                              <div key={item.name} className="flex flex-col items-center">
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: `${item.value * 3}px` }}
                                  transition={{ duration: 0.8, delay: i * 0.1 }}
                                  className="w-8 sm:w-12 rounded-t-lg relative group cursor-pointer"
                                  style={{ backgroundColor: item.color === 'emerald' ? '#10b981' : item.color === 'blue' ? '#3b82f6' : item.color === 'purple' ? '#8b5cf6' : item.color === 'cyan' ? '#06b6d4' : item.color === 'amber' ? '#f59e0b' : item.color === 'red' ? '#ef4444' : '#6366f1' }}
                                >
                                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                    {item.value}%
                                  </div>
                                </motion.div>
                                <div className="text-xs text-gray-500 mt-2 truncate max-w-[50px]" title={item.name}>
                                  {item.name.split(' ')[0]}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Quick Data Preview */}
                      <div className="p-5 rounded-xl bg-slate-900/60 border border-emerald-500/20">
                        <h4 className="text-emerald-400 font-semibold mb-4 flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Quick Data Preview
                        </h4>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {Object.entries(results.data).slice(0, 9).map(([type, data]) => (
                            <motion.div
                              key={type}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="p-3 rounded-lg bg-[#0d1117]/50 border border-slate-700/50"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-white font-medium capitalize text-sm">{type.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <span className="text-emerald-400 text-xs font-mono">{data.count}</span>
                              </div>
                              <div className="text-xs text-gray-500 truncate font-mono">
                                {data.items[0]?.value}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Security Findings */}
                      {results.securityFindings && (
                        <div className={`p-5 rounded-xl border ${
                          results.securityFindings.riskLevel === 'critical' ? 'bg-red-500/5 border-red-500/30' :
                          results.securityFindings.riskLevel === 'high' ? 'bg-orange-500/5 border-orange-500/30' :
                          results.securityFindings.riskLevel === 'medium' ? 'bg-amber-500/5 border-amber-500/30' :
                          'bg-emerald-500/5 border-emerald-500/30'
                        }`}>
                          <h4 className={`font-semibold mb-4 flex items-center gap-2 ${
                            results.securityFindings.riskLevel === 'critical' ? 'text-red-400' :
                            results.securityFindings.riskLevel === 'high' ? 'text-orange-400' :
                            results.securityFindings.riskLevel === 'medium' ? 'text-amber-400' :
                            'text-emerald-400'
                          }`}>
                            <AlertCircle className="w-5 h-5" />
                            Security Findings — {(results.securityFindings.riskLevel || 'low').toUpperCase()} RISK
                          </h4>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {results.securityFindings.exposedEmails > 0 && (
                              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-amber-400" />
                                <div><div className="text-sm text-white font-mono">{results.securityFindings.exposedEmails}</div><div className="text-[10px] text-slate-500">Exposed Emails</div></div>
                              </div>
                            )}
                            {results.securityFindings.exposedPhones > 0 && (
                              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30 flex items-center gap-2">
                                <Phone className="w-4 h-4 text-amber-400" />
                                <div><div className="text-sm text-white font-mono">{results.securityFindings.exposedPhones}</div><div className="text-[10px] text-slate-500">Exposed Phones</div></div>
                              </div>
                            )}
                            {results.securityFindings.exposedAPIKeys > 0 && (
                              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                                <Key className="w-4 h-4 text-red-400" />
                                <div><div className="text-sm text-red-400 font-mono font-bold">{results.securityFindings.exposedAPIKeys}</div><div className="text-[10px] text-red-400/60">EXPOSED API KEYS</div></div>
                              </div>
                            )}
                            {results.securityFindings.cryptoWallets > 0 && (
                              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                                <Bitcoin className="w-4 h-4 text-amber-400" />
                                <div><div className="text-sm text-amber-400 font-mono">{results.securityFindings.cryptoWallets}</div><div className="text-[10px] text-slate-500">Crypto Wallets Found</div></div>
                              </div>
                            )}
                            {results.securityFindings.socialProfiles > 0 && (
                              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30 flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-400" />
                                <div><div className="text-sm text-white font-mono">{results.securityFindings.socialProfiles}</div><div className="text-[10px] text-slate-500">Social Profiles</div></div>
                              </div>
                            )}
                            {results.securityFindings.documentsFound > 0 && (
                              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-purple-400" />
                                <div><div className="text-sm text-white font-mono">{results.securityFindings.documentsFound}</div><div className="text-[10px] text-slate-500">Documents Found</div></div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'extracts' && (
                    <motion.div
                      key="extracts"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      {Object.entries(results.data).map(([type, data]) => (
                        <div key={type} className="rounded-xl bg-slate-900/60 border border-emerald-500/20 overflow-hidden">
                          <motion.button
                            onClick={() => setExpandedType(expandedType === type ? null : type)}
                            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Gem className="w-5 h-5 text-emerald-400" />
                              <span className="text-white font-medium capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs">
                                {data.count} found
                              </span>
                            </div>
                            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedType === type ? 'rotate-90' : ''}`} />
                          </motion.button>
                          
                          <AnimatePresence>
                            {expandedType === type && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-slate-700/50"
                              >
                                <div className="p-4 space-y-2">
                                  {data.items.map((item, i) => (
                                    <ExtractedDataItem
                                      key={i}
                                      item={item}
                                      type={type}
                                      index={i}
                                      onCopy={handleCopy}
                                    />
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {activeTab === 'sources' && (
                    <motion.div
                      key="sources"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      <div className="grid sm:grid-cols-2 gap-4">
                        {results.sources.map((source, i) => (
                          <motion.div
                            key={source.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/20"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Server className="w-4 h-4 text-emerald-400" />
                                <span className="text-white font-medium">{source.name}</span>
                              </div>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs">
                                {source.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Records</span>
                                <p className="text-white font-mono">{source.records}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Quality</span>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: `${source.quality}%` }} />
                                  </div>
                                  <span className="text-emerald-400 text-xs">{source.quality}%</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'timeline' && (
                    <motion.div
                      key="timeline"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <div className="relative">
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-emerald-500/20" />
                        <div className="space-y-4 pl-14">
                          {results.timeline.map((event, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.08 }}
                              className="relative"
                            >
                              <div className="absolute -left-14 w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              </div>
                              <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/20">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-white font-medium">{event.phase}</span>
                                  <span className="text-gray-500 font-mono text-sm">{event.time}</span>
                                </div>
                                <p className="text-sm text-gray-400">{event.event}</p>
                                <div className="text-sm text-emerald-400 mt-2">
                                  {event.records.toLocaleString()} records
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'export' && (
                    <motion.div
                      key="export"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      <div className="grid sm:grid-cols-2 gap-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleExportJSON}
                          className="p-6 rounded-xl bg-slate-900/60 border border-emerald-500/20 hover:border-emerald-500/50 transition-all text-left"
                        >
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                            <Code className="w-6 h-6 text-emerald-400" />
                          </div>
                          <h4 className="text-white font-bold mb-1">Export JSON</h4>
                          <p className="text-sm text-gray-500">Complete structured data with metadata</p>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleExportCSV}
                          className="p-6 rounded-xl bg-slate-900/60 border border-blue-500/20 hover:border-blue-500/50 transition-all text-left"
                        >
                          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                            <FileText className="w-6 h-6 text-blue-400" />
                          </div>
                          <h4 className="text-white font-bold mb-1">Export CSV</h4>
                          <p className="text-sm text-gray-500">Spreadsheet-ready format</p>
                        </motion.button>
                      </div>

                      {/* Export Summary */}
                      <div className="p-5 rounded-xl bg-slate-900/60 border border-emerald-500/20">
                        <h4 className="text-emerald-400 font-semibold mb-4">Export Summary</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Total Records</span>
                            <p className="text-white font-bold">{results.totalRecords.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Data Types</span>
                            <p className="text-white font-bold">{Object.keys(results.data).length}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Sources Used</span>
                            <p className="text-white font-bold">{results.sources.length}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Timestamp</span>
                            <p className="text-white font-bold text-xs">{new Date(results.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
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
            background: rgba(16,185,129,0.3);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(16,185,129,0.5);
          }
        `}</style>
      </motion.div>
    </motion.div>
  );
};

export default DataMiningTool;
