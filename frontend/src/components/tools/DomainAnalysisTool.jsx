import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  Search, X, Globe, Shield, Clock, Activity, Zap, Server,
  Link2, ExternalLink, AlertTriangle, CheckCircle, Eye, Lock,
  FileText, Calendar, ChevronDown, Copy, Layers, Code, Database,
  Download, RefreshCw, Network, Radio, Wifi, Hash, GitBranch,
  Fingerprint, Binary, Cpu, HardDrive, Cloud, Box, CheckCircle2,
  XCircle, AlertCircle, TrendingUp, MapPin, Gauge, Timer, Award,
  Archive, FolderTree, FileCode2, Map
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';

// ═══════════════════════════════════════════════════════════════════════════
// DOMAIN HEALTH HEXAGON - Central visualization component
// ═══════════════════════════════════════════════════════════════════════════
const DomainHealthHexagon = ({ data }) => {
  const categories = [
    { key: 'dns', label: 'DNS', value: 95, color: '#3b82f6' },
    { key: 'ssl', label: 'SSL', value: data?.ssl?.valid ? 100 : 0, color: '#10b981' },
    { key: 'security', label: 'Security', value: data?.security?.reputation || 0, color: '#8b5cf6' },
    { key: 'whois', label: 'WHOIS', value: 90, color: '#f59e0b' },
    { key: 'tech', label: 'Tech', value: 85, color: '#ec4899' },
    { key: 'age', label: 'Age', value: 80, color: '#06b6d4' },
  ];

  const overallScore = Math.round(categories.reduce((sum, c) => sum + c.value, 0) / categories.length);

  return (
    <div className="relative w-full aspect-square max-w-[280px] mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Background hexagon */}
        <polygon
          points="100,10 178,55 178,145 100,190 22,145 22,55"
          fill="none"
          stroke="rgba(139,92,246,0.2)"
          strokeWidth="1"
        />
        
        {/* Category segments */}
        {categories.map((cat, i) => {
          const angle = (i * 60 - 90) * (Math.PI / 180);
          const nextAngle = ((i + 1) * 60 - 90) * (Math.PI / 180);
          const radius = 70 * (cat.value / 100);
          
          const x1 = 100 + Math.cos(angle) * radius;
          const y1 = 100 + Math.sin(angle) * radius;
          const x2 = 100 + Math.cos(nextAngle) * radius;
          const y2 = 100 + Math.sin(nextAngle) * radius;
          
          return (
            <g key={cat.key}>
              {/* Segment fill */}
              <motion.path
                d={`M100,100 L${x1},${y1} L${x2},${y2} Z`}
                fill={`${cat.color}40`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
              />
              {/* Outer edge */}
              <motion.line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={cat.color}
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              />
              {/* Label */}
              <text
                x={100 + Math.cos((angle + nextAngle) / 2) * 85}
                y={100 + Math.sin((angle + nextAngle) / 2) * 85}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={cat.color}
                fontSize="8"
                fontWeight="600"
              >
                {cat.label}
              </text>
            </g>
          );
        })}

        {/* Center score */}
        <circle cx="100" cy="100" r="35" fill="rgba(15,23,42,0.9)" stroke="rgba(139,92,246,0.3)" strokeWidth="2" />
        <text x="100" y="95" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">
          {overallScore}
        </text>
        <text x="100" y="112" textAnchor="middle" fill="rgba(139,92,246,0.7)" fontSize="8">
          HEALTH SCORE
        </text>
      </svg>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SSL CERTIFICATE CHAIN VISUALIZATION
// ═══════════════════════════════════════════════════════════════════════════
const SSLCertificateChain = ({ ssl, domain }) => {
  const chain = [
    { level: 'Root CA', name: 'ISRG Root X1', icon: Shield, status: 'trusted' },
    { level: 'Intermediate', name: ssl?.issuer || "Let's Encrypt R3", icon: Award, status: 'verified' },
    { level: 'Domain', name: domain, icon: Globe, status: ssl?.valid ? 'valid' : 'invalid' },
  ];

  return (
    <div className="space-y-3">
      {chain.map((cert, i) => (
        <motion.div
          key={cert.level}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.15 }}
          className="relative"
        >
          {/* Connecting line */}
          {i < chain.length - 1 && (
            <div className="absolute left-6 top-14 w-0.5 h-6 bg-gradient-to-b from-emerald-500 to-emerald-500/20" />
          )}
          
          <div className={`p-4 rounded-xl border flex items-center gap-4 ${
            cert.status === 'valid' || cert.status === 'verified' || cert.status === 'trusted'
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              cert.status === 'valid' || cert.status === 'verified' || cert.status === 'trusted'
                ? 'bg-emerald-500/20'
                : 'bg-red-500/20'
            }`}>
              <cert.icon className={`w-6 h-6 ${
                cert.status === 'valid' || cert.status === 'verified' || cert.status === 'trusted'
                  ? 'text-emerald-400'
                  : 'text-red-400'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-400">{cert.level}</div>
              <div className="text-white font-medium truncate">{cert.name}</div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              cert.status === 'valid' || cert.status === 'verified' || cert.status === 'trusted'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {cert.status.toUpperCase()}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// TECHNOLOGY STACK VISUALIZATION - Layered view
// ═══════════════════════════════════════════════════════════════════════════
const TechStackVisualization = ({ technologies }) => {
  const layers = {
    'CDN': { color: '#06b6d4', position: 0 },
    'Server': { color: '#f59e0b', position: 1 },
    'Framework': { color: '#8b5cf6', position: 2 },
    'Runtime': { color: '#10b981', position: 3 },
    'Database': { color: '#ec4899', position: 4 },
  };

  return (
    <div className="space-y-2">
      {technologies?.map((tech, i) => {
        const layerConfig = layers[tech.category] || { color: '#6b7280', position: i };
        return (
          <motion.div
            key={tech.name}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="relative group"
            style={{ originX: 0 }}
          >
            <div 
              className="p-3 rounded-xl border transition-all cursor-default"
              style={{ 
                backgroundColor: `${layerConfig.color}15`,
                borderColor: `${layerConfig.color}40`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tech.icon}</span>
                  <div>
                    <div className="text-white font-medium text-sm">{tech.name}</div>
                    <div className="text-xs" style={{ color: layerConfig.color }}>{tech.category}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: layerConfig.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${tech.confidence}%` }}
                      transition={{ delay: i * 0.1 + 0.3, duration: 0.5 }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-8">{tech.confidence}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY THREAT INDICATOR
// ═══════════════════════════════════════════════════════════════════════════
const SecurityThreatIndicator = ({ security }) => {
  const threats = [
    { key: 'malware', label: 'Malware', detected: security?.malware },
    { key: 'phishing', label: 'Phishing', detected: security?.phishing },
    { key: 'spam', label: 'Spam', detected: security?.spam },
  ];

  const threatCount = threats.filter(t => t.detected).length;
  const status = threatCount === 0 ? 'clean' : threatCount === 1 ? 'warning' : 'danger';
  const statusConfig = {
    clean: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'CLEAN', icon: CheckCircle2 },
    warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'WARNING', icon: AlertCircle },
    danger: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'DANGER', icon: XCircle },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div 
      className="p-5 rounded-2xl border"
      style={{ backgroundColor: config.bg, borderColor: `${config.color}40` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${config.color}20` }}
          >
            <StatusIcon className="w-6 h-6" style={{ color: config.color }} />
          </div>
          <div>
            <div className="text-white font-semibold">Threat Status</div>
            <div className="text-sm" style={{ color: config.color }}>{config.label}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold" style={{ color: config.color }}>
            {security?.reputation || 0}%
          </div>
          <div className="text-xs text-slate-400">Reputation</div>
        </div>
      </div>

      <div className="space-y-2">
        {threats.map((threat, i) => (
          <motion.div
            key={threat.key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-center justify-between p-3 rounded-lg ${
              threat.detected ? 'bg-red-500/20' : 'bg-emerald-500/10'
            }`}
          >
            <span className="text-white text-sm">{threat.label}</span>
            {threat.detected ? (
              <span className="flex items-center gap-1.5 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                Detected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                Clear
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// DOMAIN TIMELINE VISUALIZATION
// ═══════════════════════════════════════════════════════════════════════════
const DomainTimeline = ({ created, updated, expires }) => {
  const events = [
    { date: created, label: 'Created', icon: Calendar, color: '#10b981' },
    { date: updated, label: 'Updated', icon: RefreshCw, color: '#3b82f6' },
    { date: expires, label: 'Expires', icon: Timer, color: '#f59e0b' },
  ];

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-emerald-500 via-blue-500 to-amber-500" />
      
      <div className="space-y-6">
        {events.map((event, i) => (
          <motion.div
            key={event.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className="flex items-center gap-4"
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center relative z-10"
              style={{ backgroundColor: `${event.color}20`, border: `2px solid ${event.color}` }}
            >
              <event.icon className="w-5 h-5" style={{ color: event.color }} />
            </div>
            <div>
              <div className="text-white font-medium">{event.date}</div>
              <div className="text-sm text-slate-400">{event.label}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// DNS RECORD CARD
// ═══════════════════════════════════════════════════════════════════════════
const DNSRecordCard = ({ type, records, onCopy }) => {
  const typeColors = {
    a: '#3b82f6',
    aaaa: '#6366f1',
    mx: '#f59e0b',
    txt: '#10b981',
    ns: '#06b6d4',
  };
  const color = typeColors[type] || '#6b7280';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border transition-all"
      style={{ 
        backgroundColor: `${color}10`,
        borderColor: `${color}30`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span 
          className="px-2 py-1 rounded-lg text-xs font-bold"
          style={{ backgroundColor: `${color}30`, color }}
        >
          {type.toUpperCase()}
        </span>
        <span className="text-xs text-slate-400">{records.length} record{records.length > 1 ? 's' : ''}</span>
      </div>
      <div className="space-y-2">
        {records.map((record, i) => (
          <div 
            key={i}
            className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900/50 group"
          >
            <code className="text-xs text-white font-mono flex-1 break-all">{record}</code>
            <button 
              onClick={() => onCopy(record)}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
            >
              <Copy className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SUBDOMAIN NETWORK MAP
// ═══════════════════════════════════════════════════════════════════════════
const SubdomainMap = ({ subdomains, domain }) => {
  return (
    <div className="relative p-6 rounded-xl bg-slate-900/50 border border-purple-500/20">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* Central domain */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="px-4 py-2 rounded-xl bg-purple-500/30 border border-purple-500 text-purple-300 font-mono text-sm"
        >
          {domain}
        </motion.div>
      </div>
      
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {subdomains?.map((sub, i) => (
          <motion.div
            key={sub}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.05 }}
            className="px-3 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700 text-slate-300 text-xs font-mono cursor-default"
          >
            {sub}.{domain}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// INFO CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
const InfoCard = ({ label, value, icon: Icon, color = '#8b5cf6' }) => (
  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-3 h-3" style={{ color }} />
      <span className="text-xs text-slate-400">{label}</span>
    </div>
    <div className="text-white font-medium text-sm truncate">{value}</div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
const DomainAnalysisTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  
  const [domain, setDomain] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Domain Analysis', query: domain });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [enrichedData, setEnrichedData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const canvasRef = useRef(null);

  const handleRefresh = () => {
    setDomain('');
    setResults(null);
    setActiveTab('overview');
    toast.info('Ready for new analysis');
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Background canvas animation
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

    const particles = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2 + 0.5,
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.offsetWidth) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.offsetHeight) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(139, 92, 246, 0.4)';
        ctx.fill();
      });

      // Draw connections
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach(other => {
          const dist = Math.hypot(p.x - other.x, p.y - other.y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.1 * (1 - dist / 100)})`;
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Analyze step animation
  useEffect(() => {
    if (isAnalyzing) {
      setAnalyzeStep(0);
      const steps = 5;
      let current = 0;
      const interval = setInterval(() => {
        current++;
        if (current <= steps) setAnalyzeStep(current);
      }, 400);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  const handleAnalyze = async () => {
    if (!domain.trim()) {
      toast.error('Please enter a domain name');
      return;
    }
    
    trackToolUsage('domain-analysis', 'analyze', 'start');
    setIsAnalyzing(true);
    onConsume?.(8);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetchWithTimeout(`${API_BASE}/tools/domain/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Domain analysis failed');
      }
      const resultData = await response.json();
      setResults(resultData);
      addToHistory('domain-analysis', domain, resultData);
      trackToolUsage('domain-analysis', 'analyze', 'success');
      toast.success('Domain analysis complete — real data!');
      (async () => {
        try {
          const enhRes = await fetchWithTimeout(`${API_BASE}/tools/domain/enriched`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain: domain.trim() }),
          });
          if (enhRes.ok) setEnrichedData(await enhRes.json());
        } catch (e) { /* non-critical */ }
      })();
    } catch (err) {
      toast.error(err.message || 'Domain analysis failed');
      trackToolUsage('domain-analysis', 'analyze', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportJSON = () => {
    if (!results) { toast.error('No results to export'); return; }
    const ok = exportToJSON(results, `domain_analysis_${Date.now()}.json`);
    if (ok) toast.success('Exported JSON'); else toast.error('Export failed');
  };

  const handleExportCSV = () => {
    if (!results) { toast.error('No results to export'); return; }
    const prepared = formatForExport(results, 'csv');
    const ok = exportToCSV(prepared, `domain_analysis_${Date.now()}.csv`);
    if (ok) toast.success('Exported CSV'); else toast.error('Export failed');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Gauge },
    { id: 'whois', label: 'WHOIS', icon: FileText },
    { id: 'dns', label: 'DNS', icon: Server },
    { id: 'ssl', label: 'SSL', icon: Lock },
    { id: 'tech', label: 'Tech Stack', icon: Layers },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'recon', label: 'Recon', icon: Archive },
  ];

  const analyzeSteps = [
    { label: 'WHOIS', icon: FileText },
    { label: 'DNS', icon: Server },
    { label: 'SSL', icon: Lock },
    { label: 'Tech', icon: Code },
    { label: 'Security', icon: Shield },
    { label: 'Recon', icon: Archive },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-7xl max-h-[94vh] overflow-hidden rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(30,27,75,0.95) 50%, rgba(15,23,42,0.98) 100%)',
          boxShadow: '0 0 100px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
          border: '1px solid rgba(139,92,246,0.2)',
        }}
      >
        {/* Background Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
        />

        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-950/90 to-transparent pointer-events-none" />

        {/* ═══════════════════════════════════════ HEADER ═══════════════════════════════════════ */}
        <div className="relative z-10 px-4 sm:px-8 py-4 sm:py-6 border-b border-purple-500/20">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Logo */}
              <div className="relative">
                <motion.div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #ec4899 100%)',
                    boxShadow: '0 0 30px rgba(139,92,246,0.4)',
                  }}
                  animate={{
                    boxShadow: [
                      '0 0 30px rgba(139,92,246,0.4)',
                      '0 0 50px rgba(168,85,247,0.5)',
                      '0 0 30px rgba(139,92,246,0.4)',
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Globe className="w-7 h-7 sm:w-8 sm:h-8 text-white relative z-10" />
                </motion.div>
                
                {/* Orbiting particles */}
                {[0, 120, 240].map((angle, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full hidden sm:block"
                    style={{
                      background: ['#a855f7', '#ec4899', '#06b6d4'][i],
                      top: '50%',
                      left: '50%',
                    }}
                    animate={{
                      x: [
                        Math.cos((angle * Math.PI) / 180) * 35,
                        Math.cos(((angle + 360) * Math.PI) / 180) * 35,
                      ],
                      y: [
                        Math.sin((angle * Math.PI) / 180) * 35,
                        Math.sin(((angle + 360) * Math.PI) / 180) * 35,
                      ],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  />
                ))}
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                  Domain Analysis
                  <span className="px-2 py-0.5 text-xs bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-300 rounded-lg border border-purple-500/30 hidden sm:inline">
                    OSINT
                  </span>
                </h2>
                <p className="text-sm text-slate-400 mt-1 hidden sm:block">
                  Complete domain intelligence & threat assessment
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 transition-all"
                title="Reset"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              </motion.button>
              
              <div className="hidden sm:flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!results}
                  onClick={handleExportJSON}
                  className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 transition-all flex items-center gap-2 disabled:opacity-40"
                >
                  <Download className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-slate-300">JSON</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!results}
                  onClick={handleExportCSV}
                  className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 transition-all flex items-center gap-2 disabled:opacity-40"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-slate-300">CSV</span>
                </motion.button>
              </div>

              {/* Credits badge */}
              <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-lg font-bold text-amber-300">8</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 hover:bg-red-500/20 border border-slate-600/50 hover:border-red-500/50 transition-all"
              >
                <X className="w-5 h-5 text-slate-400" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════ MAIN CONTENT ═══════════════════════════════════════ */}
        <div className="relative z-10 p-4 sm:p-6 overflow-y-auto max-h-[calc(94vh-100px)] custom-scrollbar">
          
          {/* Search Section */}
          <div className="mb-6">
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-purple-500/20 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-purple-500/20">
                    <Globe className="w-5 h-5 text-purple-400" />
                  </div>
                  <input
                    type="text"
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    placeholder="Enter domain (e.g., example.com)"
                    className="w-full pl-16 pr-4 py-4 rounded-xl bg-slate-800/80 border-2 border-slate-700 text-white text-lg placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:shadow-[0_0_30px_rgba(139,92,246,0.2)] transition-all"
                    onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !domain.trim()}
                  className="px-8 py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-3 disabled:opacity-50 transition-all"
                  style={{
                    background: isAnalyzing 
                      ? 'linear-gradient(135deg, #4c1d95 0%, #701a75 100%)'
                      : 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #ec4899 100%)',
                    boxShadow: '0 4px 20px rgba(139,92,246,0.3)',
                  }}
                >
                  {isAnalyzing ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Layers className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Domain'}</span>
                </motion.button>
              </div>

              {/* Analysis Progress Steps */}
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 pt-6 border-t border-slate-700/50"
                >
                  <div className="flex items-center justify-between">
                    {analyzeSteps.map((step, i) => (
                      <div key={step.label} className="flex items-center flex-1">
                        <motion.div
                          className={`relative flex flex-col items-center`}
                          initial={{ opacity: 0.3 }}
                          animate={{ opacity: analyzeStep > i ? 1 : 0.3 }}
                        >
                          <motion.div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${
                              analyzeStep > i 
                                ? 'bg-purple-500/30 border-purple-500' 
                                : 'bg-slate-800 border-slate-700'
                            }`}
                            animate={analyzeStep === i + 1 ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 0.5, repeat: analyzeStep === i + 1 ? Infinity : 0 }}
                          >
                            <step.icon className={`w-5 h-5 ${analyzeStep > i ? 'text-purple-400' : 'text-slate-500'}`} />
                          </motion.div>
                          <span className={`text-xs mt-2 ${analyzeStep > i ? 'text-purple-300' : 'text-slate-500'}`}>
                            {step.label}
                          </span>
                          
                          {analyzeStep === i + 1 && (
                            <motion.div
                              className="absolute inset-0 rounded-xl border-2 border-purple-500"
                              animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                          )}
                        </motion.div>
                        
                        {i < analyzeSteps.length - 1 && (
                          <div className="flex-1 h-0.5 mx-2 bg-slate-700">
                            <motion.div
                              className="h-full bg-purple-500"
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: analyzeStep > i + 1 ? 1 : 0 }}
                              style={{ transformOrigin: 'left' }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Results */}
          <AnimatePresence>
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Tab Navigation */}
                <div className="flex gap-2 flex-wrap p-1.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                  {tabs.map(tab => (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-purple-500 text-white shadow-lg'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  {/* OVERVIEW TAB */}
                  {activeTab === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                    >
                      {/* Domain Health Hexagon */}
                      <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-900/50 border border-purple-500/20">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <Gauge className="w-4 h-4 text-purple-400" />
                          Domain Health
                        </h3>
                        <DomainHealthHexagon data={results} />
                      </div>

                      {/* Quick Stats */}
                      <div className="lg:col-span-2 space-y-4">
                        {/* Domain Card */}
                        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 border border-purple-500/30">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <div className="text-sm text-purple-300/70 mb-1">Analyzed Domain</div>
                              <div className="text-2xl sm:text-3xl font-bold text-white font-mono">{results.domain}</div>
                            </div>
                            <div className="flex gap-3">
                              <div className="text-center px-5 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                                <div className="text-lg font-bold text-emerald-400">Active</div>
                                <div className="text-xs text-slate-400">Status</div>
                              </div>
                              <div className="text-center px-5 py-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
                                <div className="text-lg font-bold text-purple-400">{results.age}</div>
                                <div className="text-xs text-slate-400">Age</div>
                              </div>
                              <div className="text-center px-5 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                                <div className="text-lg font-bold text-cyan-400">{results.ssl.grade}</div>
                                <div className="text-xs text-slate-400">SSL Grade</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Data Sources */}
                        {results.dataSources && (
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Intel from</span>
                            {results.dataSources.map((src, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-400 font-medium">{src}</span>
                            ))}
                          </div>
                        )}
                        {results.security?.vulnerabilities?.length > 0 && (
                          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 mb-3">
                            <span className="text-xs text-red-400 font-bold">{results.security.vulnerabilities.length} Known Vulnerabilities: </span>
                            {results.security.vulnerabilities.map((v, i) => (
                              <a key={i} href={v.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-red-300 hover:underline font-mono mr-2">{v.id}</a>
                            ))}
                          </div>
                        )}

                        {/* Quick Info Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <InfoCard label="Registrar" value={results.registrar} icon={FileText} />
                          <InfoCard label="Created" value={results.created} icon={Calendar} color="#10b981" />
                          <InfoCard label="Expires" value={results.expires} icon={Timer} color="#f59e0b" />
                          <InfoCard label="Reputation" value={`${results.security.reputation}%`} icon={Shield} color="#06b6d4" />
                        </div>

                        {/* Security Threat Status */}
                        <SecurityThreatIndicator security={results.security} />

                        {/* Wayback & Recon Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {results.wayback && results.wayback.available && (
                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                              <div className="flex items-center gap-2 mb-2">
                                <Archive className="w-4 h-4 text-amber-400" />
                                <span className="text-xs text-amber-300 font-semibold uppercase">Web Archive</span>
                              </div>
                              <div className="text-xl font-bold text-amber-400">{results.wayback.totalCaptures?.toLocaleString() || '—'}</div>
                              <div className="text-[10px] text-slate-400">Snapshots since {results.wayback.firstCapture || 'N/A'}</div>
                              {results.wayback.archiveUrl && (
                                <a href={results.wayback.archiveUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-amber-400 hover:underline mt-1 inline-block">View Archive →</a>
                              )}
                            </div>
                          )}
                          {results.robotsTxt && results.robotsTxt.found && (
                            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                              <div className="flex items-center gap-2 mb-2">
                                <FileCode2 className="w-4 h-4 text-blue-400" />
                                <span className="text-xs text-blue-300 font-semibold uppercase">robots.txt</span>
                              </div>
                              <div className="text-xl font-bold text-blue-400">{results.robotsTxt.disallowedPaths?.length || 0}</div>
                              <div className="text-[10px] text-slate-400">Disallowed paths found</div>
                              {results.robotsTxt.hiddenPaths?.length > 0 && (
                                <div className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  {results.robotsTxt.hiddenPaths.length} sensitive path(s)
                                </div>
                              )}
                            </div>
                          )}
                          {results.sitemap && results.sitemap.found && (
                            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                              <div className="flex items-center gap-2 mb-2">
                                <Map className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs text-emerald-300 font-semibold uppercase">Sitemap</span>
                              </div>
                              <div className="text-xl font-bold text-emerald-400">{results.sitemap.totalUrls?.toLocaleString() || 0}</div>
                              <div className="text-[10px] text-slate-400">URLs indexed{results.sitemap.isSitemapIndex ? ' (Index)' : ''}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* WHOIS TAB */}
                  {activeTab === 'whois' && (
                    <motion.div
                      key="whois"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    >
                      {/* Timeline */}
                      <div className="p-6 rounded-2xl bg-slate-900/50 border border-purple-500/20">
                        <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-400" />
                          Domain Timeline
                        </h3>
                        <DomainTimeline 
                          created={results.created}
                          updated={results.updated}
                          expires={results.expires}
                        />
                      </div>

                      {/* WHOIS Details */}
                      <div className="p-6 rounded-2xl bg-slate-900/50 border border-purple-500/20">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-purple-400" />
                          Registration Details
                        </h3>
                        <div className="space-y-3">
                          {[
                            { label: 'Registrar', value: results.registrar },
                            { label: 'Registrant', value: results.whois.registrant },
                            { label: 'Admin', value: results.whois.admin },
                            { label: 'Tech', value: results.whois.tech },
                            { label: 'DNSSEC', value: results.whois.dnssec },
                          ].map((item, i) => (
                            <motion.div
                              key={item.label}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
                            >
                              <span className="text-slate-400 text-sm">{item.label}</span>
                              <span className="text-white text-sm font-medium">{item.value}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Nameservers */}
                      <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/50 border border-purple-500/20">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <Server className="w-4 h-4 text-purple-400" />
                          Nameservers
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {results.nameservers?.map((ns, i) => (
                            <motion.div
                              key={ns}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.1 }}
                              className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-mono text-sm"
                            >
                              {ns}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* DNS TAB */}
                  {activeTab === 'dns' && (
                    <motion.div
                      key="dns"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                      {Object.entries(results.dns || {}).map(([type, records], i) => (
                        <DNSRecordCard key={type} type={type} records={records} onCopy={handleCopy} />
                      ))}
                    </motion.div>
                  )}

                  {/* SSL TAB */}
                  {activeTab === 'ssl' && (
                    <motion.div
                      key="ssl"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    >
                      {/* Certificate Chain */}
                      <div className="p-6 rounded-2xl bg-slate-900/50 border border-purple-500/20">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <Lock className="w-4 h-4 text-emerald-400" />
                          Certificate Chain
                        </h3>
                        <SSLCertificateChain ssl={results.ssl} domain={results.domain} />
                      </div>

                      {/* SSL Details */}
                      <div className="space-y-4">
                        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                              <CheckCircle className="w-7 h-7 text-emerald-400" />
                            </div>
                            <div>
                              <div className="text-emerald-400 font-bold text-xl">Valid Certificate</div>
                              <div className="text-slate-400 text-sm">Grade: {results.ssl.grade}</div>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-700/50">
                          <div className="space-y-3">
                            {[
                              { label: 'Issuer', value: results.ssl.issuer },
                              { label: 'Protocol', value: results.ssl.protocol, highlight: true },
                              { label: 'Expires', value: results.ssl.expires },
                              { label: 'Cipher', value: results.ssl.cipher },
                            ].map((item, i) => (
                              <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                                <span className="text-slate-400 text-sm">{item.label}</span>
                                <span className={`text-sm font-medium ${item.highlight ? 'text-emerald-400' : 'text-white'}`}>
                                  {item.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TECH STACK TAB */}
                  {activeTab === 'tech' && (
                    <motion.div
                      key="tech"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    >
                      {/* Technology Stack */}
                      <div className="p-6 rounded-2xl bg-slate-900/50 border border-purple-500/20">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <Layers className="w-4 h-4 text-purple-400" />
                          Detected Technologies
                        </h3>
                        <TechStackVisualization technologies={results.technologies} />
                      </div>

                      {/* Subdomains */}
                      <div className="p-6 rounded-2xl bg-slate-900/50 border border-purple-500/20">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <Network className="w-4 h-4 text-purple-400" />
                          Discovered Subdomains ({results.subdomains.length})
                        </h3>
                        <SubdomainMap subdomains={results.subdomains} domain={results.domain} />
                      </div>
                    </motion.div>
                  )}

                  {/* SECURITY TAB */}
                  {activeTab === 'security' && (
                    <motion.div
                      key="security"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    >
                      {/* Security Threats */}
                      <SecurityThreatIndicator security={results.security} />

                      {/* Subdomains for Security */}
                      <div className="p-6 rounded-2xl bg-slate-900/50 border border-purple-500/20">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <Network className="w-4 h-4 text-purple-400" />
                          Attack Surface - Subdomains
                        </h3>
                        <p className="text-slate-400 text-sm mb-4">
                          {results.subdomains.length} subdomains discovered that could be potential attack vectors.
                        </p>
                        <SubdomainMap subdomains={results.subdomains} domain={results.domain} />
                      </div>

                      {/* Hidden Paths from robots.txt */}
                      {results.robotsTxt?.hiddenPaths?.length > 0 && (
                        <div className="lg:col-span-2 p-6 rounded-2xl bg-red-500/5 border border-red-500/30">
                          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            Sensitive Paths Exposed in robots.txt
                          </h3>
                          <p className="text-slate-400 text-xs mb-3">These paths were found in robots.txt and may reveal admin panels, configs, or sensitive directories.</p>
                          <div className="flex flex-wrap gap-2">
                            {results.robotsTxt.hiddenPaths.map((p, i) => (
                              <span key={i} className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 font-mono text-xs">{p}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Enriched: Zone Transfer */}
                      {enrichedData?.zoneTransfer && (
                        <div className={`p-6 rounded-2xl border ${enrichedData.zoneTransfer.vulnerable ? 'bg-red-500/5 border-red-500/30' : 'bg-slate-900/50 border-purple-500/20'}`}>
                          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <Network className="w-4 h-4 text-purple-400" />
                            Zone Transfer Test
                          </h3>
                          {enrichedData.zoneTransfer.vulnerable ? (
                            <div className="space-y-3">
                              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                                <span className="text-red-400 font-bold text-sm">VULNERABLE — Zone transfer allowed from {enrichedData.zoneTransfer.vulnerableNs}</span>
                              </div>
                              {enrichedData.zoneTransfer.records?.length > 0 && (
                                <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                                  {enrichedData.zoneTransfer.records.slice(0, 30).map((rec, i) => (
                                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/70 text-xs font-mono">
                                      <span className="text-amber-400 min-w-[60px]">{rec.type}</span>
                                      <span className="text-slate-300">{rec.name}</span>
                                      <span className="text-slate-500 ml-auto">{rec.rdata}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                                <span className="text-emerald-400 font-bold text-sm">SECURE — Zone transfer not allowed</span>
                              </div>
                              {enrichedData.zoneTransfer.nameServers?.length > 0 && (
                                <div className="text-xs text-slate-400">
                                  <span className="text-slate-500">Checked {enrichedData.zoneTransfer.checked || enrichedData.zoneTransfer.nameServers.length} nameservers</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {enrichedData.zoneTransfer.nameServers.map((ns, i) => (
                                      <span key={i} className="px-2 py-0.5 rounded bg-slate-700/50 text-slate-300 font-mono text-[10px]">{ns}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Enriched: DNSSEC Validation */}
                      {enrichedData?.dnssec && (
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-purple-500/20">
                          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-purple-400" />
                            DNSSEC Validation
                          </h3>
                          <div className="flex flex-wrap gap-3 mb-3">
                            <div className={`px-3 py-2 rounded-xl text-sm font-bold border ${enrichedData.dnssec.signed ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                              {enrichedData.dnssec.signed ? 'SIGNED' : 'NOT SIGNED'}
                            </div>
                            <div className={`px-3 py-2 rounded-xl text-sm font-bold border ${enrichedData.dnssec.validated ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : enrichedData.dnssec.signed ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-slate-700/50 border-slate-600/30 text-slate-400'}`}>
                              {enrichedData.dnssec.validated ? 'VALIDATED' : enrichedData.dnssec.signed ? 'PENDING' : 'N/A'}
                            </div>
                          </div>
                          {enrichedData.dnssec.algorithms?.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-slate-400">Algorithms: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {enrichedData.dnssec.algorithms.map((a, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 text-[10px] font-mono border border-blue-500/20">{a}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {enrichedData.dnssec.hasDS && <div className="text-xs text-cyan-400 mt-2 font-mono">{enrichedData.dnssec.dsCount} DS records in parent zone</div>}
                        </div>
                      )}

                      {/* Enriched: SSL Chain */}
                      {enrichedData?.sslChain && (
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-purple-500/20">
                          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-purple-400" />
                            SSL Certificate Chain
                          </h3>
                          {enrichedData.sslChain.verified ? (
                            <div className="space-y-2">
                              {enrichedData.sslChain.certificates.slice(0, 5).map((cert, i) => (
                                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                  className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/50">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                                    <span className="text-xs text-slate-400 font-mono">{cert.subject}</span>
                                    {cert.source === 'crt.sh' && <span className="px-1.5 py-0.5 text-[9px] rounded bg-cyan-500/10 text-cyan-400">crt.sh</span>}
                                  </div>
                                  <div className="grid grid-cols-2 gap-x-4 text-[11px] text-slate-500 pl-4">
                                    <span>Issuer: {cert.issuer}</span>
                                    <span>Serial: {(cert.serialNumber || '').slice(0, 20)}</span>
                                    <span>From: {cert.notBefore?.split('T')[0] || cert.notBefore}</span>
                                    <span>To: {cert.notAfter?.split('T')[0] || cert.notAfter}</span>
                                  </div>
                                  {cert.subjectAltName?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2 pl-4">
                                      {cert.subjectAltName.slice(0, 5).map((san, j) => (
                                        <span key={j} className="px-1.5 py-0.5 text-[9px] rounded bg-violet-500/10 text-violet-300 font-mono">{san}</span>
                                      ))}
                                    </div>
                                  )}
                                </motion.div>
                              ))}
                              {enrichedData.sslChain.fingerprint && (
                                <div className="mt-2 p-2 rounded-lg bg-slate-800/50 text-xs">
                                  <span className="text-slate-500">SHA-256 Fingerprint: </span>
                                  <span className="text-cyan-300 font-mono">{enrichedData.sslChain.fingerprint}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-slate-400 text-sm flex flex-col items-center gap-2">
                              <AlertCircle className="w-6 h-6 text-red-400" />
                              <span>SSL certificate chain could not be verified</span>
                              {enrichedData.sslChain.error && <span className="text-[11px] font-mono text-slate-500">{enrichedData.sslChain.error}</span>}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Enriched: Email Security Score */}
                      {enrichedData?.emailSecurityScore && (
                        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/50 border border-purple-500/20">
                          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-purple-400" />
                            Email Security Score
                          </h3>
                          <div className="flex items-start gap-6">
                            <div className="flex flex-col items-center">
                              <div className={`text-5xl font-black font-mono ${
                                enrichedData.emailSecurityScore.grade === 'A' ? 'text-emerald-400' :
                                enrichedData.emailSecurityScore.grade === 'B' ? 'text-blue-400' :
                                enrichedData.emailSecurityScore.grade === 'C' ? 'text-amber-400' :
                                'text-red-400'
                              }`}>
                                {enrichedData.emailSecurityScore.grade}
                              </div>
                              <div className="text-2xl font-bold text-slate-300 mt-1">{enrichedData.emailSecurityScore.score}/100</div>
                              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Security Grade</div>
                            </div>
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              {enrichedData.emailSecurityScore.details?.map((chk, i) => (
                                <div key={i} className={`p-2.5 rounded-xl border flex items-center justify-between ${
                                  chk.pass ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
                                }`}>
                                  <div>
                                    <div className={`text-xs font-bold ${chk.pass ? 'text-emerald-400' : 'text-red-400'}`}>{chk.name}</div>
                                    <div className="text-[9px] text-slate-500">{chk.description}</div>
                                  </div>
                                  <div className={`text-sm font-black font-mono ${chk.pass ? 'text-emerald-400' : 'text-slate-600'}`}>
                                    {chk.pass ? `+${chk.score}` : '0'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                    </motion.div>
                  )}

                  {/* RECON TAB */}
                  {activeTab === 'recon' && (
                    <motion.div
                      key="recon"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    >
                      {/* Wayback Machine */}
                      <div className="p-6 rounded-2xl bg-slate-900/50 border border-amber-500/20">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <Archive className="w-4 h-4 text-amber-400" />
                          Wayback Machine Archive
                        </h3>
                        {results.wayback?.available ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                                <div className="text-2xl font-bold text-amber-400">{results.wayback.totalCaptures?.toLocaleString() || '—'}</div>
                                <div className="text-[10px] text-slate-400">Total Snapshots</div>
                              </div>
                              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                                <div className="text-sm font-bold text-amber-400">{results.wayback.firstCapture || 'N/A'}</div>
                                <div className="text-[10px] text-slate-400">First Capture</div>
                              </div>
                              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                                <div className="text-sm font-bold text-amber-400">{results.wayback.lastCapture || 'N/A'}</div>
                                <div className="text-[10px] text-slate-400">Last Capture</div>
                              </div>
                              {results.wayback.closestSnapshot && (
                                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                                  <div className="text-sm font-bold text-amber-400 truncate">{results.wayback.closestSnapshot.timestamp || '—'}</div>
                                  <div className="text-[10px] text-slate-400">Closest Snapshot</div>
                                </div>
                              )}
                            </div>
                            {results.wayback.archiveUrl && (
                              <a
                                href={results.wayback.archiveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 w-full p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm transition-all"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Browse Full Archive on Wayback Machine
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-slate-400 text-sm">
                            <Archive className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            No web archive data available for this domain.
                          </div>
                        )}
                      </div>

                      {/* robots.txt */}
                      <div className="p-6 rounded-2xl bg-slate-900/50 border border-blue-500/20">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <FileCode2 className="w-4 h-4 text-blue-400" />
                          robots.txt Analysis
                        </h3>
                        {results.robotsTxt?.found ? (
                          <div className="space-y-4">
                            {/* User Agents */}
                            {results.robotsTxt.userAgents?.length > 0 && (
                              <div>
                                <div className="text-xs text-slate-400 mb-2">User Agents ({results.robotsTxt.userAgents.length})</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {results.robotsTxt.userAgents.map((ua, i) => (
                                    <span key={i} className="px-2 py-1 rounded bg-blue-500/15 text-blue-300 font-mono text-[10px] border border-blue-500/20">{ua}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Disallowed */}
                            {results.robotsTxt.disallowedPaths?.length > 0 && (
                              <div>
                                <div className="text-xs text-slate-400 mb-2">Disallowed Paths ({results.robotsTxt.disallowedPaths.length})</div>
                                <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                                  {results.robotsTxt.disallowedPaths.map((p, i) => (
                                    <div key={i} className="px-2 py-1 rounded bg-slate-800/70 text-slate-300 font-mono text-[11px] flex items-center gap-2">
                                      <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />{p}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Hidden/Sensitive Paths */}
                            {results.robotsTxt.hiddenPaths?.length > 0 && (
                              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                <div className="text-xs text-red-400 font-semibold mb-2 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />Sensitive Paths Detected
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {results.robotsTxt.hiddenPaths.map((p, i) => (
                                    <span key={i} className="px-2 py-1 rounded bg-red-500/20 text-red-300 font-mono text-[10px] border border-red-500/30">{p}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Sitemaps referenced */}
                            {results.robotsTxt.sitemaps?.length > 0 && (
                              <div>
                                <div className="text-xs text-slate-400 mb-2">Referenced Sitemaps</div>
                                {results.robotsTxt.sitemaps.map((s, i) => (
                                  <a key={i} href={s} target="_blank" rel="noopener noreferrer" className="block text-[11px] text-blue-400 hover:underline font-mono truncate">{s}</a>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-slate-400 text-sm">
                            <FileCode2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            No robots.txt found for this domain.
                          </div>
                        )}
                      </div>

                      {/* Sitemap */}
                      <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/50 border border-emerald-500/20">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <Map className="w-4 h-4 text-emerald-400" />
                          Sitemap Analysis
                        </h3>
                        {results.sitemap?.found ? (
                          <div className="space-y-4">
                            <div className="flex flex-wrap gap-4">
                              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center min-w-[100px]">
                                <div className="text-2xl font-bold text-emerald-400">{results.sitemap.totalUrls?.toLocaleString() || 0}</div>
                                <div className="text-[10px] text-slate-400">Total URLs</div>
                              </div>
                              {results.sitemap.isSitemapIndex && (
                                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center min-w-[100px]">
                                  <div className="text-lg font-bold text-cyan-400">Index</div>
                                  <div className="text-[10px] text-slate-400">Sitemap Type</div>
                                </div>
                              )}
                            </div>
                            {results.sitemap.sampleUrls?.length > 0 && (
                              <div>
                                <div className="text-xs text-slate-400 mb-2">Sample URLs (up to 20)</div>
                                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                                  {results.sitemap.sampleUrls.map((url, i) => (
                                    <a
                                      key={i}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block px-3 py-1.5 rounded bg-slate-800/70 text-emerald-300 font-mono text-[11px] hover:bg-slate-800 transition-colors truncate hover:text-emerald-200"
                                    >
                                      <ExternalLink className="w-3 h-3 inline mr-2 opacity-50" />{url}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-slate-400 text-sm">
                            <Map className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            No sitemap.xml found for this domain.
                          </div>
                        )}
                      </div>

                      {/* Enriched: Typosquatting Detection */}
                      {enrichedData?.typosquatting && (
                        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/50 border border-purple-500/20">
                          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-purple-400" />
                            Typosquatting Detection
                            {enrichedData.typosquatting.activeCount > 0 && (
                              <span className="px-2 py-0.5 text-xs font-bold rounded bg-red-500/20 text-red-400 border border-red-500/30">
                                {enrichedData.typosquatting.activeCount} active
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-slate-400 mb-4">
                            Generated {enrichedData.typosquatting.totalGenerated} variants, checked {enrichedData.typosquatting.checked || 0} —
                            {enrichedData.typosquatting.activeCount > 0
                              ? ` ${enrichedData.typosquatting.activeCount} resolve to active IPs`
                              : ' none resolve to active IPs'}
                          </p>
                          {enrichedData.typosquatting.variants?.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-80 overflow-y-auto custom-scrollbar">
                              {enrichedData.typosquatting.variants.map((v, i) => (
                                <div key={i} className={`p-2.5 rounded-xl border text-xs ${
                                  v.status === 'active' ? 'bg-red-500/10 border-red-500/30' :
                                  v.status === 'inactive' ? 'bg-slate-800/50 border-slate-700/30' :
                                  'bg-slate-800/30 border-slate-700/20'
                                }`}>
                                  <div className="font-mono text-slate-300 truncate" title={v.domain}>{v.domain}</div>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className={`text-[9px] uppercase font-bold ${
                                      v.status === 'active' ? 'text-red-400' :
                                      v.status === 'inactive' ? 'text-slate-600' :
                                      'text-amber-500'
                                    }`}>{v.status}</span>
                                    {v.ips?.length > 0 && <span className="text-[9px] text-slate-500 font-mono">{v.ips[0]}</span>}
                                    {v.similarity > 0 && <span className="text-[9px] text-slate-600">{v.similarity}%</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!results && !isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-16 sm:py-24">
              <motion.div
                className="relative mb-8"
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                <div 
                  className="w-32 h-32 rounded-3xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(168,85,247,0.2) 50%, rgba(236,72,153,0.2) 100%)',
                    boxShadow: '0 0 60px rgba(139,92,246,0.2)',
                  }}
                >
                  <Globe className="w-16 h-16 text-purple-400/50" />
                </div>
              </motion.div>

              <h3 className="text-2xl font-semibold text-white mb-3">Ready to Analyze</h3>
              <p className="text-slate-400 text-center max-w-md mb-6">
                Enter a domain name to discover WHOIS data, DNS records, SSL certificates,
                technologies, and security status.
              </p>

              <div className="flex flex-wrap justify-center gap-2">
                {['WHOIS', 'DNS', 'SSL', 'Tech Detection', 'Security', 'Subdomains', 'Wayback', 'robots.txt', 'Sitemap'].map((tag, i) => (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 text-sm"
                  >
                    {tag}
                  </motion.span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Custom scrollbar styles */}
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(30, 41, 59, 0.5);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(139, 92, 246, 0.3);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(139, 92, 246, 0.5);
          }
        `}</style>
      </motion.div>
    </motion.div>
  );
};

export default DomainAnalysisTool;
