import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, X, Search, Zap, Server, Network, Shield, Clock, Download,
  ChevronRight, Copy, CheckCircle, RefreshCw, ArrowRight, Activity,
  Database, Lock, AlertTriangle, Info, ExternalLink, MapPin, Radio,
  Wifi, WifiOff, Eye, Layers, GitBranch, Terminal, Hash, Link2,
  AlertCircle, CheckCircle2, XCircle, Timer, Gauge, ChevronDown
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';

// ═══════════════════════════════════════════════════════════════════════════
// DNS RESOLUTION PATH VISUALIZATION
// Shows the query path from client → root → TLD → authoritative
// ═══════════════════════════════════════════════════════════════════════════
const DNSResolutionPath = ({ isResolving, currentStep }) => {
  const steps = [
    { id: 'client', label: 'Client', icon: Terminal, color: '#3b82f6' },
    { id: 'resolver', label: 'Resolver', icon: Server, color: '#8b5cf6' },
    { id: 'root', label: 'Root DNS', icon: Globe, color: '#f59e0b' },
    { id: 'tld', label: 'TLD Server', icon: Database, color: '#10b981' },
    { id: 'auth', label: 'Authoritative', icon: Shield, color: '#06b6d4' },
  ];

  return (
    <div className="flex items-center justify-between w-full py-4">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center flex-1">
          <motion.div
            className="relative flex flex-col items-center"
            animate={isResolving && currentStep === i ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: isResolving && currentStep === i ? Infinity : 0 }}
          >
            <motion.div
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                currentStep >= i 
                  ? 'shadow-lg' 
                  : 'opacity-40'
              }`}
              style={{ 
                backgroundColor: currentStep >= i ? `${step.color}20` : 'transparent',
                borderWidth: 2,
                borderColor: currentStep >= i ? step.color : '#374151',
                boxShadow: currentStep >= i ? `0 0 20px ${step.color}40` : 'none'
              }}
            >
              <step.icon 
                className="w-5 h-5" 
                style={{ color: currentStep >= i ? step.color : '#6b7280' }} 
              />
            </motion.div>
            <span className={`text-xs mt-2 font-medium ${currentStep >= i ? 'text-white' : 'text-gray-600'}`}>
              {step.label}
            </span>
            
            {/* Ping animation when active */}
            {isResolving && currentStep === i && (
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{ borderColor: step.color, borderWidth: 2 }}
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </motion.div>
          
          {/* Connector */}
          {i < steps.length - 1 && (
            <div className="flex-1 h-0.5 mx-3 bg-gray-800 relative overflow-hidden">
              {currentStep > i && (
                <motion.div
                  className="absolute inset-0"
                  style={{ backgroundColor: step.color }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
              {isResolving && currentStep === i && (
                <motion.div
                  className="absolute top-0 left-0 w-8 h-full"
                  style={{ background: `linear-gradient(90deg, transparent, ${step.color}, transparent)` }}
                  animate={{ x: ['0%', '500%'] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
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
// WORLD MAP PROPAGATION VISUALIZATION
// ═══════════════════════════════════════════════════════════════════════════
const WorldPropagationMap = ({ propagation }) => {
  const locations = [
    { id: 'na', name: 'North America', x: 22, y: 35 },
    { id: 'eu', name: 'Europe', x: 48, y: 30 },
    { id: 'as', name: 'Asia', x: 72, y: 35 },
    { id: 'sa', name: 'South America', x: 30, y: 65 },
    { id: 'af', name: 'Africa', x: 50, y: 55 },
    { id: 'oc', name: 'Oceania', x: 82, y: 70 },
  ];

  return (
    <div className="relative w-full h-48 bg-slate-900/50 rounded-xl border border-blue-500/20 overflow-hidden">
      {/* Simple world outline */}
      <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full opacity-20">
        <path
          d="M10,25 Q20,20 30,25 Q35,30 25,35 Q20,45 15,40 Q10,35 10,25 M35,20 Q45,15 55,20 Q60,25 55,30 Q50,35 45,30 Q40,25 35,20 M60,25 Q70,20 80,25 Q85,30 80,35 Q75,45 70,40 Q65,35 60,25 M75,50 Q80,45 85,50 Q88,55 82,58 Q78,55 75,50"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="0.5"
        />
      </svg>
      
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full">
        {locations.map((loc, i) => (
          <motion.line
            key={`line-${loc.id}`}
            x1="50%"
            y1="40%"
            x2={`${loc.x}%`}
            y2={`${loc.y}%`}
            stroke={propagation[i]?.status === 'propagated' ? '#10b981' : 
                   propagation[i]?.status === 'propagating' ? '#f59e0b' : '#374151'}
            strokeWidth="1"
            strokeDasharray="4,4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          />
        ))}
      </svg>

      {/* Central server */}
      <motion.div
        className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-8 h-8 rounded-lg bg-blue-500/30 border border-blue-500 flex items-center justify-center">
          <Server className="w-4 h-4 text-blue-400" />
        </div>
      </motion.div>

      {/* Location nodes */}
      {locations.map((loc, i) => {
        const status = propagation[i]?.status || 'pending';
        return (
          <motion.div
            key={loc.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.2 }}
          >
            <div className={`w-4 h-4 rounded-full border-2 ${
              status === 'propagated' ? 'bg-emerald-500/50 border-emerald-500' :
              status === 'propagating' ? 'bg-amber-500/50 border-amber-500 animate-pulse' :
              'bg-gray-500/50 border-gray-500'
            }`} />
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
              {loc.name}
              <span className={`ml-2 ${
                status === 'propagated' ? 'text-emerald-400' :
                status === 'propagating' ? 'text-amber-400' :
                'text-gray-400'
              }`}>
                {status}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// DNS RECORD CARD - Individual record display with TTL gauge
// ═══════════════════════════════════════════════════════════════════════════
const DNSRecordCard = ({ record, type, index, onCopy, copied }) => {
  const typeConfig = {
    A: { color: '#3b82f6', bgColor: 'rgba(59,130,246,0.1)', icon: Server, desc: 'IPv4 Address' },
    AAAA: { color: '#6366f1', bgColor: 'rgba(99,102,241,0.1)', icon: Server, desc: 'IPv6 Address' },
    CNAME: { color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.1)', icon: Link2, desc: 'Canonical Name' },
    MX: { color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)', icon: Network, desc: 'Mail Exchange' },
    TXT: { color: '#10b981', bgColor: 'rgba(16,185,129,0.1)', icon: Terminal, desc: 'Text Record' },
    NS: { color: '#06b6d4', bgColor: 'rgba(6,182,212,0.1)', icon: Globe, desc: 'Name Server' },
    SOA: { color: '#ef4444', bgColor: 'rgba(239,68,68,0.1)', icon: Database, desc: 'Start of Authority' },
    CAA: { color: '#eab308', bgColor: 'rgba(234,179,8,0.1)', icon: Shield, desc: 'Cert Authority Auth' },
    SRV: { color: '#ec4899', bgColor: 'rgba(236,72,153,0.1)', icon: Radio, desc: 'Service Record' },
    PTR: { color: '#a855f7', bgColor: 'rgba(168,85,247,0.1)', icon: ArrowRight, desc: 'Pointer Record' },
  };

  const config = typeConfig[type] || typeConfig.A;
  const Icon = config.icon;
  const ttlPercent = Math.min(100, (record.ttl / 86400) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group p-4 rounded-xl border transition-all hover:shadow-lg"
      style={{ 
        backgroundColor: config.bgColor,
        borderColor: `${config.color}30`,
      }}
      whileHover={{ 
        borderColor: config.color,
        boxShadow: `0 0 20px ${config.color}20`
      }}
    >
      <div className="flex items-start gap-3">
        {/* Type badge */}
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${config.color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color: config.color }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span 
              className="px-2 py-0.5 rounded text-xs font-bold"
              style={{ backgroundColor: `${config.color}30`, color: config.color }}
            >
              {type}
            </span>
            <span className="text-xs text-gray-500">{config.desc}</span>
          </div>
          
          <code className="text-sm text-white font-mono block break-all leading-relaxed">
            {record.value}
          </code>

          {/* TTL and Priority */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <Timer className="w-3 h-3 text-gray-500" />
              <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ 
                    width: `${ttlPercent}%`,
                    backgroundColor: ttlPercent > 50 ? '#10b981' : ttlPercent > 20 ? '#f59e0b' : '#ef4444'
                  }}
                />
              </div>
              <span className="text-xs text-gray-400">{record.ttl}s</span>
            </div>
            {record.priority !== null && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Gauge className="w-3 h-3" />
                Priority: {record.priority}
              </div>
            )}
          </div>
        </div>

        {/* Copy button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onCopy(record.value)}
          className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10"
        >
          {copied ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400" />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// NAMESERVER HEALTH CARD
// ═══════════════════════════════════════════════════════════════════════════
const NameserverCard = ({ ns, index }) => {
  const latency = parseInt(ns.responseTime);
  const status = latency < 30 ? 'excellent' : latency < 60 ? 'good' : latency < 100 ? 'fair' : 'slow';
  const statusColors = {
    excellent: { color: '#10b981', label: 'Excellent' },
    good: { color: '#3b82f6', label: 'Good' },
    fair: { color: '#f59e0b', label: 'Fair' },
    slow: { color: '#ef4444', label: 'Slow' },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="p-4 rounded-xl bg-slate-800/50 border border-blue-500/20"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-400" />
          <span className="text-white font-mono text-sm">{ns.host}</span>
        </div>
        <span 
          className="px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ 
            backgroundColor: `${statusColors[status].color}20`,
            color: statusColors[status].color
          }}
        >
          {statusColors[status].label}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500 text-xs">IP Address</span>
          <p className="text-white font-mono">{ns.ip}</p>
        </div>
        <div>
          <span className="text-gray-500 text-xs">Response Time</span>
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3" style={{ color: statusColors[status].color }} />
            <p className="text-white">{ns.responseTime}</p>
          </div>
        </div>
      </div>
      
      {/* Latency bar */}
      <div className="mt-3 h-1 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: statusColors[status].color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (150 - latency) / 1.5)}%` }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        />
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY STATUS BADGE
// ═══════════════════════════════════════════════════════════════════════════
const SecurityBadge = ({ name, enabled, index }) => {
  const configs = {
    dnssec: { icon: Shield, label: 'DNSSEC', desc: 'Domain Name System Security Extensions' },
    dmarc: { icon: Lock, label: 'DMARC', desc: 'Domain-based Message Auth' },
    spf: { icon: CheckCircle2, label: 'SPF', desc: 'Sender Policy Framework' },
    dkim: { icon: Hash, label: 'DKIM', desc: 'DomainKeys Identified Mail' },
  };

  const config = configs[name] || { icon: Shield, label: name.toUpperCase(), desc: '' };
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className={`relative p-4 rounded-xl border overflow-hidden ${
        enabled 
          ? 'bg-emerald-500/10 border-emerald-500/30' 
          : 'bg-red-500/10 border-red-500/30'
      }`}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${enabled ? '#10b981' : '#ef4444'} 10px, ${enabled ? '#10b981' : '#ef4444'} 11px)`
        }} />
      </div>

      <div className="relative flex flex-col items-center text-center">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${
          enabled ? 'bg-emerald-500/20' : 'bg-red-500/20'
        }`}>
          {enabled ? (
            <Icon className="w-6 h-6 text-emerald-400" />
          ) : (
            <XCircle className="w-6 h-6 text-red-400" />
          )}
        </div>
        <span className="text-white font-bold text-sm">{config.label}</span>
        <span className={`text-xs mt-1 ${enabled ? 'text-emerald-400' : 'text-red-400'}`}>
          {enabled ? 'Configured' : 'Not Found'}
        </span>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
const DNSRecordsTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const clipboard = useClipboard();
  
  const [domain, setDomain] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'D N S Records', query: domain });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [copiedRecord, setCopiedRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [resolutionStep, setResolutionStep] = useState(-1);
  const [expandedTypes, setExpandedTypes] = useState({});
  const [dnsEnrichment, setDnsEnrichment] = useState(null);
  const [isEnrichingDNS, setIsEnrichingDNS] = useState(false);
  const canvasRef = useRef(null);

  const handleExportJSON = () => {
    if (!results) { toast.error('No results to export'); return; }
    const ok = exportToJSON(results, `dns_records_${Date.now()}.json`);
    if (ok) toast.success('Exported JSON'); else toast.error('Export failed');
  };

  const handleExportCSV = () => {
    if (!results) { toast.error('No results to export'); return; }
    const prepared = formatForExport(results, 'csv');
    const ok = exportToCSV(prepared, `dns_records_${Date.now()}.csv`);
    if (ok) toast.success('Exported CSV'); else toast.error('Export failed');
  };

  // Canvas DNS network visualization
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
    for (let i = 0; i < 25; i++) {
      nodes.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2 + 1,
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(13, 17, 23, 0.1)';
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // Draw connections
      nodes.forEach((node, i) => {
        nodes.forEach((other, j) => {
          if (i >= j) return;
          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.15 * (1 - dist / 80)})`;
            ctx.stroke();
          }
        });
      });

      // Update and draw nodes
      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > canvas.offsetWidth) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.offsetHeight) node.vy *= -1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
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

  // Resolution step animation
  useEffect(() => {
    if (isResolving) {
      setResolutionStep(0);
      const steps = [0, 1, 2, 3, 4];
      let current = 0;
      const interval = setInterval(() => {
        current++;
        if (current < steps.length) {
          setResolutionStep(current);
        }
      }, 400);
      return () => clearInterval(interval);
    } else {
      setResolutionStep(-1);
    }
  }, [isResolving]);

  const handleResolve = async () => {
    if (!domain.trim()) {
      toast.error('Please enter a domain name');
      return;
    }
    
    trackToolUsage('dns-records', 'resolve', 'start');
    setIsResolving(true);
    onConsume?.(6);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetchWithTimeout(`${API_BASE}/tools/dns/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'DNS lookup failed');
      }
      const resultData = await response.json();
      setResults(resultData);
      setResolutionStep(5);
      addToHistory('dns-records', domain, resultData);
      trackToolUsage('dns-records', 'resolve', 'success');
      toast.success('DNS records resolved — real data!');
    } catch (err) {
      toast.error(err.message || 'DNS resolution failed');
      trackToolUsage('dns-records', 'resolve', 'error');
    } finally {
      setIsResolving(false);
    }
  };

  const handleDNSEnrich = async () => {
    if (!results) return;
    setIsEnrichingDNS(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const resp = await fetchWithTimeout(`${API_BASE}/tools/dns/enriched`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: results.domain }),
      });
      if (!resp.ok) throw new Error('DNS enrichment failed');
      const data = await resp.json();
      setDnsEnrichment(data);
      toast.success('DNS enrichment loaded');
    } catch (err) {
      toast.error(err.message || 'DNS enrichment failed');
    } finally {
      setIsEnrichingDNS(false);
    }
  };

  const handleRefresh = () => {
    setDomain('');
    setResults(null);
    setResolutionStep(-1);
    setExpandedTypes({});
    setDnsEnrichment(null);
    toast.info('Ready for new lookup');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedRecord(text);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedRecord(null), 2000);
  };

  const toggleTypeExpand = (type) => {
    setExpandedTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const recordTypes = ['all', 'A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'CAA', 'SRV'];

  const filteredRecords = results?.records 
    ? (activeTab === 'all' 
        ? Object.entries(results.records) 
        : Object.entries(results.records).filter(([type]) => type === activeTab))
    : [];

  const totalRecords = results ? Object.values(results.records).flat().length : 0;

  // Count by status
  const propagatedCount = results?.propagation?.filter(p => p.status === 'propagated').length || 0;
  const securityBooleans = results ? Object.entries(results.securityInfo || {}).filter(([k, v]) => typeof v === 'boolean') : [];
  const securityScore = securityBooleans.filter(([, v]) => v).length;
  const securityTotal = Math.max(securityBooleans.length, 4);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-7xl max-h-[94vh] overflow-hidden rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.95) 50%, rgba(15,23,42,0.98) 100%)',
          boxShadow: '0 0 100px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
          border: '1px solid rgba(59,130,246,0.2)',
        }}
      >
        {/* Network Canvas Background */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full opacity-40 pointer-events-none"
        />

        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-slate-950/90 to-transparent pointer-events-none" />

        {/* ═══════════════════════════════════════ HEADER ═══════════════════════════════════════ */}
        <div className="relative z-10 px-4 sm:px-8 py-4 sm:py-6 border-b border-blue-500/20">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Logo */}
              <div className="relative">
                <motion.div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
                    boxShadow: '0 0 30px rgba(99,102,241,0.4)',
                  }}
                >
                  <Globe className="w-7 h-7 sm:w-8 sm:h-8 text-white relative z-10" />
                  {/* Spinning rings */}
                  <motion.div
                    className="absolute inset-0 border-2 border-white/20 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  />
                  <motion.div
                    className="absolute inset-1 border border-white/10 rounded-full"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                  />
                </motion.div>
                
                {/* Status indicator */}
                <motion.div
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Wifi className="w-3 h-3 text-white" />
                </motion.div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                  DNS Records Analyzer
                  <span className="px-2 py-0.5 text-xs bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-blue-300 rounded-lg border border-blue-500/30 hidden sm:inline">
                    PRO
                  </span>
                </h2>
                <p className="text-sm text-slate-400 mt-1 hidden sm:block">
                  Complete DNS resolution with propagation tracking
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
                  <Download className="w-4 h-4 text-blue-400" />
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
                <span className="text-lg font-bold text-amber-300">6</span>
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
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-blue-500/20 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-blue-500/20">
                    <Globe className="w-5 h-5 text-blue-400" />
                  </div>
                  <input
                    type="text"
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    placeholder="Enter domain name (e.g., example.com)"
                    className="w-full pl-16 pr-4 py-4 rounded-xl bg-slate-800/80 border-2 border-slate-700 text-white text-lg placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all"
                    onKeyDown={e => e.key === 'Enter' && handleResolve()}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleResolve}
                  disabled={isResolving || !domain.trim()}
                  className="px-8 py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-3 disabled:opacity-50 transition-all"
                  style={{
                    background: isResolving 
                      ? 'linear-gradient(135deg, #1e40af 0%, #3730a3 100%)'
                      : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                    boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
                  }}
                >
                  {isResolving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <RefreshCw className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  <span>{isResolving ? 'Resolving...' : 'Resolve DNS'}</span>
                </motion.button>
              </div>

              {/* DNS Resolution Path Visualization */}
              {isResolving && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 pt-6 border-t border-slate-700/50"
                >
                  <DNSResolutionPath isResolving={isResolving} currentStep={resolutionStep} />
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
                {/* Data Sources */}
                {results.dataSources && (
                  <div className="flex flex-wrap items-center gap-2 px-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Resolved via</span>
                    {results.dataSources.map((src, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-400 font-medium">{src}</span>
                    ))}
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <Clock className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-sm text-slate-400">Resolution</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{results.resolveTime}</div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <Database className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="text-sm text-slate-400">Records</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{totalRecords}</div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-cyan-500/20">
                        <Server className="w-4 h-4 text-cyan-400" />
                      </div>
                      <span className="text-sm text-slate-400">Nameservers</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{results.nameservers?.length}</div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className={`p-4 rounded-xl border ${
                      securityScore >= 3 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : securityScore >= 2
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${
                        securityScore >= 3 ? 'bg-emerald-500/20' : securityScore >= 2 ? 'bg-amber-500/20' : 'bg-red-500/20'
                      }`}>
                        <Shield className={`w-4 h-4 ${
                          securityScore >= 3 ? 'text-emerald-400' : securityScore >= 2 ? 'text-amber-400' : 'text-red-400'
                        }`} />
                      </div>
                      <span className="text-sm text-slate-400">Security</span>
                    </div>
                    <div className={`text-2xl font-bold ${
                      securityScore >= 3 ? 'text-emerald-400' : securityScore >= 2 ? 'text-amber-400' : 'text-red-400'
                    }`}>{securityScore}/{securityTotal}</div>
                  </motion.div>
                </div>

                {/* Main Grid - Records & Side Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Records Section - Takes 2/3 */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Tab Bar */}
                    <div className="flex gap-2 flex-wrap p-1.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                      {recordTypes.map(type => (
                        <motion.button
                          key={type}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setActiveTab(type)}
                          className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === type
                              ? 'bg-blue-500 text-white shadow-lg'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {type === 'all' ? 'All Records' : type}
                          {type !== 'all' && results.records?.[type] && (
                            <span className="ml-1.5 text-xs opacity-70">
                              ({results.records[type].length})
                            </span>
                          )}
                        </motion.button>
                      ))}
                    </div>

                    {/* Records List */}
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {filteredRecords.map(([type, records]) => (
                        <div key={type}>
                          {activeTab === 'all' && (
                            <motion.button
                              onClick={() => toggleTypeExpand(type)}
                              className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 mb-2 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-white font-semibold">{type}</span>
                                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs">
                                  {records.length} records
                                </span>
                              </div>
                              <motion.div
                                animate={{ rotate: expandedTypes[type] ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown className="w-5 h-5 text-slate-400" />
                              </motion.div>
                            </motion.button>
                          )}
                          
                          <AnimatePresence>
                            {(activeTab !== 'all' || expandedTypes[type]) && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2"
                              >
                                {records.map((record, i) => (
                                  <DNSRecordCard
                                    key={`${type}-${i}`}
                                    record={record}
                                    type={type}
                                    index={i}
                                    onCopy={copyToClipboard}
                                    copied={copiedRecord === record.value}
                                  />
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Side Panel - Takes 1/3 */}
                  <div className="space-y-5">
                    {/* Nameservers */}
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50">
                      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <Server className="w-4 h-4 text-blue-400" />
                        Nameservers
                      </h3>
                      <div className="space-y-3">
                        {results.nameservers?.map((ns, i) => (
                          <NameserverCard key={i} ns={ns} index={i} />
                        ))}
                      </div>
                    </div>

                    {/* Security Badges */}
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50">
                      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-400" />
                        Email Security
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(results.securityInfo || {}).filter(([, v]) => typeof v === 'boolean').map(([key, enabled], i) => (
                          <SecurityBadge key={key} name={key} enabled={enabled} index={i} />
                        ))}
                      </div>
                    </div>

                    {/* CAA Records (Parsed) */}
                    {results.securityInfo?.caa?.length > 0 && (
                      <div className="p-4 rounded-xl bg-slate-900/50 border border-amber-500/30">
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-amber-400" />
                          CAA Policy
                        </h3>
                        <div className="space-y-2">
                          {results.securityInfo.caa.map((caa, i) => (
                            <div key={i} className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/40">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase">{caa.tag}</span>
                                {caa.flags > 0 && <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px]">Critical</span>}
                              </div>
                              <div className="text-white text-xs font-mono truncate">{caa.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SRV Services Discovered */}
                    {results.securityInfo?.srvServices?.length > 0 && (
                      <div className="p-4 rounded-xl bg-slate-900/50 border border-pink-500/30">
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <Radio className="w-4 h-4 text-pink-400" />
                          Discovered Services
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {results.securityInfo.srvServices.map((svc, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg bg-pink-500/15 border border-pink-500/25 text-pink-300 text-xs font-mono">
                              {svc}
                            </span>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2">Services found via SRV record discovery</p>
                      </div>
                    )}

                    {/* World Propagation Map */}
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50">
                      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-cyan-400" />
                        Global Propagation
                        <span className="ml-auto text-xs text-slate-400">
                          {propagatedCount}/{results.propagation.length} regions
                        </span>
                      </h3>
                      <WorldPropagationMap propagation={results.propagation} />
                    </div>

                    {/* DNS Enrichment */}
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                          <Radio className="w-4 h-4 text-purple-400" />
                          DNS Enrichment
                        </h3>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleDNSEnrich}
                          disabled={isEnrichingDNS}
                          className="px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isEnrichingDNS ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                          {isEnrichingDNS ? 'Loading...' : 'Enrich'}
                        </motion.button>
                      </div>

                      {dnsEnrichment && (
                        <div className="space-y-3">
                          {/* DoH Support */}
                          <div>
                            <span className="text-xs text-slate-400 mb-1 block">DNS over HTTPS</span>
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(dnsEnrichment.dohSupport || {}).map(([provider, info]) => (
                                <span key={provider} className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                  info.supported ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {provider}: {info.supported ? 'Supported' : 'N/A'}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* DMARC Report */}
                          <div>
                            <span className="text-xs text-slate-400 mb-1 block">DMARC Report</span>
                            {dnsEnrichment.dmarcReport?.found ? (
                              <div className="space-y-1">
                                <div className="text-xs text-emerald-400">Policy: {dnsEnrichment.dmarcReport.policy || 'none'}</div>
                                {dnsEnrichment.dmarcReport.rua && <div className="text-[10px] text-gray-400">RUA: {dnsEnrichment.dmarcReport.rua}</div>}
                                {dnsEnrichment.dmarcReport.ruf && <div className="text-[10px] text-gray-400">RUF: {dnsEnrichment.dmarcReport.ruf}</div>}
                                <div className="text-[10px] text-gray-400">PCT: {dnsEnrichment.dmarcReport.pct}%</div>
                              </div>
                            ) : (
                              <div className="text-xs text-amber-400">No DMARC record found</div>
                            )}
                          </div>

                          {/* MTA-STS */}
                          <div>
                            <span className="text-xs text-slate-400 mb-1 block">MTA-STS</span>
                            <div className={`text-xs ${
                              dnsEnrichment.mtaStsTlsRpt?.mtaSts?.dnsRecordFound ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              {dnsEnrichment.mtaStsTlsRpt?.mtaSts?.dnsRecordFound ? 'Configured' : 'Not configured'}
                            </div>
                            {dnsEnrichment.mtaStsTlsRpt?.mtaSts?.policyUrlFound && (
                              <div className="text-[10px] text-emerald-400">MTA-STS policy hosted</div>
                            )}
                          </div>

                          {/* TLS-RPT */}
                          <div>
                            <span className="text-xs text-slate-400 mb-1 block">TLS-RPT</span>
                            <div className={`text-xs ${
                              dnsEnrichment.mtaStsTlsRpt?.tlsRpt?.found ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              {dnsEnrichment.mtaStsTlsRpt?.tlsRpt?.found ? 'Configured' : 'Not configured'}
                            </div>
                          </div>

                          {/* Propagation summary */}
                          {dnsEnrichment.propagation?.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-700/50">
                              <span className="text-xs text-slate-400 mb-1 block">Propagation ({dnsEnrichment.propagation.filter(p => p.status === 'propagated').length}/{dnsEnrichment.propagation.length})</span>
                              <div className="space-y-1">
                                {dnsEnrichment.propagation.slice(0, 4).map((p, i) => (
                                  <div key={i} className="flex items-center justify-between text-[10px]">
                                    <span className="text-gray-400">{p.resolver}</span>
                                    <span className={p.status === 'propagated' ? 'text-emerald-400' : 'text-amber-400'}>
                                      {p.latency ? `${p.latency}ms` : p.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {!dnsEnrichment && !isEnrichingDNS && (
                        <div className="text-xs text-slate-500">Click "Enrich" for DMARC, DoH, MTA-STS & propagation details</div>
                      )}
                    </div>

                    {/* Query Info */}
                    <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">Query ID</span>
                          <p className="text-white font-mono mt-1">{results.queryId}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Timestamp</span>
                          <p className="text-white mt-1">
                            {new Date(results.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!results && !isResolving && (
            <div className="flex flex-col items-center justify-center py-16 sm:py-24">
              <motion.div
                className="relative mb-8"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div 
                  className="w-32 h-32 rounded-3xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(99,102,241,0.2) 100%)',
                    boxShadow: '0 0 60px rgba(99,102,241,0.2)',
                  }}
                >
                  <Globe className="w-16 h-16 text-blue-400/50" />
                </div>
                
                {/* Orbiting elements */}
                {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-3 h-3 rounded-full"
                    style={{
                      background: ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#06b6d4'][i],
                      top: '50%',
                      left: '50%',
                    }}
                    animate={{
                      x: [
                        Math.cos((angle * Math.PI) / 180) * 70,
                        Math.cos(((angle + 360) * Math.PI) / 180) * 70,
                      ],
                      y: [
                        Math.sin((angle * Math.PI) / 180) * 70,
                        Math.sin(((angle + 360) * Math.PI) / 180) * 70,
                      ],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                ))}
              </motion.div>

              <h3 className="text-2xl font-semibold text-white mb-3">Ready to Analyze DNS</h3>
              <p className="text-slate-400 text-center max-w-md mb-6">
                Enter a domain name to discover all DNS records, check propagation status,
                and analyze email security configuration.
              </p>

              <div className="flex flex-wrap justify-center gap-2">
                {['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA', 'CAA', 'SRV'].map((type, i) => (
                  <motion.span
                    key={type}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 text-sm"
                  >
                    {type}
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
            background: rgba(59, 130, 246, 0.3);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(59, 130, 246, 0.5);
          }
        `}</style>
      </motion.div>
    </motion.div>
  );
};

export default DNSRecordsTool;
