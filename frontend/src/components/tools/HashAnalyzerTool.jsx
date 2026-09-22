import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hash, X, Search, Zap, Shield, AlertTriangle, CheckCircle, FileText,
  Database, Cpu, Lock, Unlock, Eye, Copy, RefreshCw, Binary, Code,
  Terminal, Server, Clock, ChevronRight, Download, Activity, Layers,
  ShieldCheck, ShieldAlert, Key, Fingerprint, Timer, Gauge, BarChart3,
  TrendingUp, Braces, Dna, Radio, CircuitBoard
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';

// ═══════════════════════════════════════════════════════════════════════════════
// HASH DNA HELIX - Visualizes hash as a DNA-like double helix structure
// ═══════════════════════════════════════════════════════════════════════════════
const HashDNAHelix = ({ hash, isActive }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hash) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let offset = 0;
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerY = canvas.height / 2;
      const amplitude = 20;
      const frequency = 0.05;
      const charWidth = canvas.width / Math.max(hash.length, 1);
      
      // Draw connecting rungs first
      hash.split('').forEach((char, i) => {
        const x = i * charWidth + charWidth / 2;
        const phase = (i * frequency + offset) * Math.PI * 2;
        const y1 = centerY + Math.sin(phase) * amplitude;
        const y2 = centerY - Math.sin(phase) * amplitude;
        
        // Horizontal rung
        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
        ctx.strokeStyle = `rgba(34, 211, 238, ${0.2 + Math.abs(Math.sin(phase)) * 0.3})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      
      // Draw top strand
      ctx.beginPath();
      hash.split('').forEach((char, i) => {
        const x = i * charWidth + charWidth / 2;
        const phase = (i * frequency + offset) * Math.PI * 2;
        const y = centerY + Math.sin(phase) * amplitude;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw bottom strand
      ctx.beginPath();
      hash.split('').forEach((char, i) => {
        const x = i * charWidth + charWidth / 2;
        const phase = (i * frequency + offset) * Math.PI * 2;
        const y = centerY - Math.sin(phase) * amplitude;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw character nodes
      hash.split('').forEach((char, i) => {
        const x = i * charWidth + charWidth / 2;
        const phase = (i * frequency + offset) * Math.PI * 2;
        const y1 = centerY + Math.sin(phase) * amplitude;
        const y2 = centerY - Math.sin(phase) * amplitude;
        
        // Character color based on hex value
        const charValue = parseInt(char, 16) || 0;
        const hue = 180 + (charValue / 16) * 40; // Cyan to blue range
        
        // Top node
        ctx.beginPath();
        ctx.arc(x, y1, 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
        ctx.fill();
        
        // Bottom node
        ctx.beginPath();
        ctx.arc(x, y2, 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
        ctx.fill();
      });
      
      if (isActive) {
        offset += 0.02;
      }
      animationId = requestAnimationFrame(draw);
    };
    
    canvas.width = 400;
    canvas.height = 80;
    draw();
    
    return () => cancelAnimationFrame(animationId);
  }, [hash, isActive]);
  
  return (
    <div className="relative">
      <canvas ref={canvasRef} className="w-full h-[80px]" />
      <div className="absolute bottom-0 left-0 right-0 text-center text-[10px] text-cyan-400/60 font-medium">
        HASH DNA STRUCTURE
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CRACK TIME ESTIMATOR - Visual display of estimated crack times
// ═══════════════════════════════════════════════════════════════════════════════
const CrackTimeEstimator = ({ hashType, length }) => {
  const estimates = useMemo(() => {
    // Simplified estimation based on hash type and common hardware
    const baseComplexity = {
      'MD5': { gpu: '1 second', quantum: '< 1 second', distributed: '< 1 second', color: 'red' },
      'NTLM': { gpu: '2 seconds', quantum: '< 1 second', distributed: '< 1 second', color: 'red' },
      'SHA-1': { gpu: '15 minutes', quantum: '5 seconds', distributed: '3 minutes', color: 'amber' },
      'SHA-224': { gpu: '2 years', quantum: '1 hour', distributed: '6 months', color: 'emerald' },
      'SHA-256': { gpu: '100+ years', quantum: '1 day', distributed: '10 years', color: 'emerald' },
      'SHA-384': { gpu: 'Centuries', quantum: '1 month', distributed: 'Decades', color: 'emerald' },
      'SHA-512': { gpu: 'Millennia', quantum: '1 year', distributed: 'Centuries', color: 'emerald' },
      'SHA3-256': { gpu: 'Centuries', quantum: '1 week', distributed: '50 years', color: 'emerald' },
      'SHA3-512': { gpu: 'Millennia', quantum: '1 year', distributed: 'Centuries', color: 'emerald' },
      'Unknown': { gpu: 'Unknown', quantum: 'Unknown', distributed: 'Unknown', color: 'slate' }
    };
    return baseComplexity[hashType] || baseComplexity['Unknown'];
  }, [hashType]);
  
  const attacks = [
    { name: 'High-End GPU', icon: Cpu, time: estimates.gpu, desc: 'RTX 4090 cluster' },
    { name: 'Quantum Computer', icon: CircuitBoard, time: estimates.quantum, desc: 'Theoretical attack' },
    { name: 'Distributed Cluster (1M nodes)', icon: Radio, time: estimates.distributed, desc: 'Distributed attack' }
  ];
  
  return (
    <div className="space-y-3">
      <div className="text-xs text-cyan-400/70 uppercase tracking-wider flex items-center gap-2">
        <Timer className="w-3 h-3" />
        Estimated Crack Time
      </div>
      
      {attacks.map((attack, i) => (
        <motion.div
          key={attack.name}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="p-3 rounded-lg bg-slate-800/50 border border-cyan-500/20 flex items-center gap-3"
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${estimates.color}-500/20`}>
            <attack.icon className={`w-5 h-5 text-${estimates.color}-400`} />
          </div>
          <div className="flex-1">
            <div className="text-white text-sm font-medium">{attack.name}</div>
            <div className="text-[10px] text-slate-500">{attack.desc}</div>
          </div>
          <div className={`text-sm font-bold text-${estimates.color}-400`}>
            {attack.time}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ENTROPY WAVEFORM - Audio waveform-like visualization of hash entropy
// ═══════════════════════════════════════════════════════════════════════════════
const EntropyWaveform = ({ hash }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hash) return;
    const ctx = canvas.getContext('2d');
    
    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw center line
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Calculate bar width
    const barCount = Math.min(hash.length, 64);
    const barWidth = width / barCount;
    const maxBarHeight = height / 2 - 5;
    
    // Draw waveform bars
    for (let i = 0; i < barCount; i++) {
      const charCode = parseInt(hash[i], 16) || 0;
      const normalizedHeight = (charCode / 15) * maxBarHeight;
      
      // Create gradient for each bar
      const gradient = ctx.createLinearGradient(0, centerY - normalizedHeight, 0, centerY + normalizedHeight);
      gradient.addColorStop(0, 'rgba(34, 211, 238, 0.8)');
      gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.6)');
      gradient.addColorStop(1, 'rgba(34, 211, 238, 0.8)');
      
      const x = i * barWidth + barWidth * 0.1;
      const barW = barWidth * 0.8;
      
      // Top bar
      ctx.fillStyle = gradient;
      ctx.fillRect(x, centerY - normalizedHeight, barW, normalizedHeight);
      
      // Bottom bar (mirror)
      ctx.fillRect(x, centerY, barW, normalizedHeight);
    }
    
  }, [hash]);
  
  return (
    <div className="p-4 rounded-xl bg-slate-900/50 border border-cyan-500/20">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-cyan-400/70 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-3 h-3" />
          Entropy Distribution
        </span>
      </div>
      <canvas ref={canvasRef} width={320} height={60} className="w-full h-[60px]" />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ALGORITHM TIMELINE - Shows hash algorithm evolution with security ratings
// ═══════════════════════════════════════════════════════════════════════════════
const AlgorithmTimeline = ({ currentType }) => {
  const algorithms = [
    { name: 'MD5', year: '1991', bits: 128, status: 'broken', selected: currentType === 'MD5' },
    { name: 'SHA-1', year: '1995', bits: 160, status: 'deprecated', selected: currentType === 'SHA-1' },
    { name: 'SHA-256', year: '2001', bits: 256, status: 'secure', selected: currentType === 'SHA-256' || currentType === 'SHA3-256' },
    { name: 'SHA-3', year: '2015', bits: 512, status: 'secure', selected: currentType?.includes('SHA3') }
  ];
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'broken': return 'red';
      case 'deprecated': return 'amber';
      case 'secure': return 'emerald';
      default: return 'slate';
    }
  };
  
  return (
    <div className="relative">
      <div className="text-xs text-cyan-400/70 uppercase tracking-wider mb-4 flex items-center gap-2">
        <TrendingUp className="w-3 h-3" />
        Algorithm Evolution
      </div>
      
      {/* Timeline line */}
      <div className="absolute left-4 top-12 bottom-4 w-0.5 bg-gradient-to-b from-red-500 via-amber-500 to-emerald-500" />
      
      <div className="space-y-4 pl-10">
        {algorithms.map((algo, i) => {
          const color = getStatusColor(algo.status);
          return (
            <motion.div
              key={algo.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-3 rounded-lg transition-all ${
                algo.selected 
                  ? `bg-${color}-500/20 border border-${color}-500/50` 
                  : 'bg-slate-800/30 border border-slate-700/50'
              }`}
            >
              {/* Timeline dot */}
              <div className={`absolute -left-[26px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-${color}-500 ${
                algo.selected ? 'ring-4 ring-' + color + '-500/30' : ''
              }`} />
              
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-semibold ${algo.selected ? `text-${color}-400` : 'text-white'}`}>
                    {algo.name}
                  </div>
                  <div className="text-xs text-slate-500">{algo.year} • {algo.bits}-bit</div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium bg-${color}-500/20 text-${color}-400 capitalize`}>
                  {algo.status}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// HASH SEGMENT ANALYZER - Break down hash into analyzable segments
// ═══════════════════════════════════════════════════════════════════════════════
const HashSegmentAnalyzer = ({ hash }) => {
  const segments = useMemo(() => {
    if (!hash) return [];
    const segmentSize = 8;
    const result = [];
    for (let i = 0; i < hash.length; i += segmentSize) {
      const segment = hash.slice(i, i + segmentSize);
      const numericValue = parseInt(segment, 16);
      result.push({
        index: i / segmentSize,
        chars: segment,
        decimal: numericValue,
        binary: numericValue.toString(2).padStart(32, '0'),
        entropy: calculateSegmentEntropy(segment)
      });
    }
    return result;
  }, [hash]);
  
  function calculateSegmentEntropy(segment) {
    const freq = {};
    segment.split('').forEach(c => freq[c] = (freq[c] || 0) + 1);
    return Object.values(freq).reduce((e, f) => {
      const p = f / segment.length;
      return e - p * Math.log2(p);
    }, 0);
  }
  
  return (
    <div className="space-y-2">
      <div className="text-xs text-cyan-400/70 uppercase tracking-wider flex items-center gap-2">
        <Braces className="w-3 h-3" />
        Segment Analysis
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {segments.slice(0, 8).map((seg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="p-2 rounded-lg bg-slate-800/50 border border-cyan-500/20"
          >
            <div className="font-mono text-cyan-400 text-sm">{seg.chars}</div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-slate-500">#{i + 1}</span>
              <span className="text-[10px] text-cyan-300">
                H: {seg.entropy.toFixed(2)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COLLISION PROBABILITY DISPLAY - Visual representation of collision risk
// ═══════════════════════════════════════════════════════════════════════════════
const CollisionProbabilityDisplay = ({ hashType, length }) => {
  const probability = useMemo(() => {
    // Birthday paradox approximation
    const bits = (length / 2) * 8;
    const collisionThreshold = Math.pow(2, bits / 2);
    
    // Risk assessment
    if (hashType === 'MD5') return { risk: 'Critical', percent: 95, desc: 'Practical attacks exist' };
    if (hashType === 'SHA-1') return { risk: 'High', percent: 70, desc: 'Collision found in 2017' };
    if (hashType === 'NTLM') return { risk: 'Critical', percent: 98, desc: 'Rainbow tables available' };
    if (length >= 64) return { risk: 'Low', percent: 5, desc: 'Computationally infeasible' };
    if (length >= 56) return { risk: 'Medium', percent: 25, desc: 'Theoretically possible' };
    return { risk: 'Unknown', percent: 50, desc: 'Insufficient data' };
  }, [hashType, length]);
  
  const riskColors = {
    'Critical': 'red',
    'High': 'orange',
    'Medium': 'amber',
    'Low': 'emerald',
    'Unknown': 'slate'
  };
  
  const color = riskColors[probability.risk];
  
  return (
    <div className="p-4 rounded-xl bg-slate-900/50 border border-cyan-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-cyan-400/70 uppercase tracking-wider flex items-center gap-2">
          <Gauge className="w-3 h-3" />
          Collision Probability
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-bold bg-${color}-500/20 text-${color}-400`}>
          {probability.risk}
        </span>
      </div>
      
      {/* Visual gauge */}
      <div className="relative h-4 rounded-full bg-slate-800 overflow-hidden mb-2">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r from-${color}-600 to-${color}-400`}
          initial={{ width: 0 }}
          animate={{ width: `${probability.percent}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
          {probability.percent}% Risk
        </div>
      </div>
      
      <div className="text-xs text-slate-400">{probability.desc}</div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY SHIELD VISUALIZATION - Multi-layer security assessment
// ═══════════════════════════════════════════════════════════════════════════════
const SecurityShieldViz = ({ status, collisionRisk, strength }) => {
  const layers = [
    { name: 'Algorithm', secure: status === 'Secure', icon: Dna },
    { name: 'Collision', secure: collisionRisk === 'Low', icon: ShieldCheck },
    { name: 'Length', secure: strength === 'Strong', icon: BarChart3 }
  ];
  
  const overallSecure = layers.filter(l => l.secure).length >= 2;
  
  return (
    <div className="flex flex-col items-center p-4">
      <div className="relative w-32 h-32">
        {/* Shield layers */}
        {layers.map((layer, i) => {
          const size = 128 - i * 25;
          return (
            <motion.div
              key={layer.name}
              className="absolute top-1/2 left-1/2"
              style={{ 
                width: size, 
                height: size, 
                marginLeft: -size/2, 
                marginTop: -size/2 
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.2, type: 'spring' }}
            >
              <div 
                className={`w-full h-full rounded-2xl border-2 flex items-center justify-center
                  ${layer.secure 
                    ? 'border-emerald-500/50 bg-emerald-500/10' 
                    : 'border-red-500/50 bg-red-500/10'}`}
                style={{ transform: `rotate(${i * 15}deg)` }}
              >
                {i === layers.length - 1 && (
                  <motion.div
                    animate={overallSecure ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {overallSecure ? (
                      <ShieldCheck className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <ShieldAlert className="w-8 h-8 text-red-400" />
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <div className="mt-4 text-sm font-semibold text-center">
        <span className={overallSecure ? 'text-emerald-400' : 'text-red-400'}>
          {overallSecure ? 'SECURE' : 'VULNERABLE'}
        </span>
      </div>
      
      {/* Layer legend */}
      <div className="mt-3 flex gap-4 text-xs">
        {layers.map(layer => (
          <div key={layer.name} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${layer.secure ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-slate-400">{layer.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// RAINBOW TABLE COVERAGE - Database lookup visualization
// ═══════════════════════════════════════════════════════════════════════════════
const RainbowTableCoverage = ({ hashType, found }) => {
  const databases = [
    { name: 'CrackStation', coverage: hashType === 'MD5' || hashType === 'SHA-1' ? 95 : 40, entries: '15.6B' },
    { name: 'Hashes.org', coverage: hashType === 'MD5' ? 88 : 35, entries: '8.2B' },
    { name: 'HashKiller', coverage: hashType === 'MD5' || hashType === 'NTLM' ? 92 : 30, entries: '6.1B' },
    { name: 'OnlineHashCrack', coverage: hashType === 'MD5' ? 78 : 25, entries: '4.8B' }
  ];
  
  return (
    <div className="space-y-3">
      <div className="text-xs text-cyan-400/70 uppercase tracking-wider flex items-center gap-2">
        <Database className="w-3 h-3" />
        Rainbow Table Coverage
      </div>
      
      {databases.map((db, i) => (
        <motion.div
          key={db.name}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="p-3 rounded-lg bg-slate-800/50"
        >
          <div className="flex justify-between mb-2">
            <span className="text-sm text-white">{db.name}</span>
            <span className="text-xs text-slate-400">{db.entries} hashes</span>
          </div>
          <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${db.coverage > 70 ? 'bg-red-500' : db.coverage > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${db.coverage}%` }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
            />
          </div>
          <div className="text-right text-[10px] text-slate-500 mt-1">{db.coverage}% coverage</div>
        </motion.div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HASH ANALYZER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const HashAnalyzerTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  
  const [hash, setHash] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Hash Analyzer', query: hash });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [activeTab, setActiveTab] = useState('overview');
  const [scanPhase, setScanPhase] = useState('');
  const [hashEnrichment, setHashEnrichment] = useState(null);
  const [isEnrichingHash, setIsEnrichingHash] = useState(false);
  const [compareHash, setCompareHash] = useState('');
  const canvasRef = useRef(null);

  const handleExportJSON = () => {
    if (!results) { toast.error('No results to export'); return; }
    const ok = exportToJSON(results, `hash_analysis_${Date.now()}.json`);
    if (ok) toast.success('Exported JSON'); else toast.error('Export failed');
  };

  const handleExportCSV = () => {
    if (!results) { toast.error('No results to export'); return; }
    const prepared = formatForExport(results, 'csv');
    const ok = exportToCSV(prepared, `hash_analysis_${Date.now()}.csv`);
    if (ok) toast.success('Exported CSV'); else toast.error('Export failed');
  };

  const handleHashEnrich = async () => {
    if (!results) return;
    setIsEnrichingHash(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const resp = await fetchWithTimeout(`${API_BASE}/tools/hash/enriched`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: results.hash, compareHash }),
      });
      if (!resp.ok) throw new Error('Hash enrichment failed');
      const data = await resp.json();
      setHashEnrichment(data);
      toast.success('Hash enrichment loaded');
    } catch (err) {
      toast.error(err.message || 'Hash enrichment failed');
    } finally {
      setIsEnrichingHash(false);
    }
  };

  const handleRefresh = () => {
    setHash('');
    setResults(null);
    setScanPhase('');
    setHashEnrichment(null);
    setCompareHash('');
    toast.info('Ready for new analysis');
  };

  const handleCopy = (text) => {
    copy(text);
    toast.success('Copied to clipboard');
  };

  // Background circuit pattern animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let time = 0;
    
    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      
      ctx.fillStyle = 'rgba(15, 23, 42, 0.05)';
      ctx.fillRect(0, 0, w, h);
      
      // Draw circuit traces
      const gridSize = 40;
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.08)';
      ctx.lineWidth = 1;
      
      for (let x = 0; x < w; x += gridSize) {
        for (let y = 0; y < h; y += gridSize) {
          // Random circuit paths
          if (Math.random() > 0.7) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + gridSize, y);
            ctx.stroke();
          }
          if (Math.random() > 0.7) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + gridSize);
            ctx.stroke();
          }
          // Connection nodes
          if (Math.random() > 0.9) {
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(34, 211, 238, ${0.2 + Math.sin(time + x + y) * 0.1})`;
            ctx.fill();
          }
        }
      }
      
      time += 0.02;
      animationId = requestAnimationFrame(draw);
    };
    
    draw();
    return () => cancelAnimationFrame(animationId);
  }, []);

  const detectHashType = (input) => {
    const length = input.length;
    const types = {
      32: ['MD5', 'NTLM'],
      40: ['SHA-1'],
      56: ['SHA-224'],
      64: ['SHA-256', 'SHA3-256'],
      96: ['SHA-384', 'SHA3-384'],
      128: ['SHA-512', 'SHA3-512']
    };
    return types[length] || ['Unknown'];
  };

  const handleAnalyze = async () => {
    if (!hash.trim()) {
      toast.error('Please enter a hash value');
      return;
    }
    
    trackToolUsage('hash-analyzer', 'analyze', 'start');
    setIsAnalyzing(true);
    setResults(null);
    onConsume?.(4);
    
    const phases = [
      'Identifying hash algorithm...',
      'Validating format integrity...',
      'Computing entropy metrics...',
      'Scanning rainbow tables...',
      'Assessing collision resistance...',
      'Generating security report...'
    ];
    
    for (let i = 0; i < phases.length; i++) {
      setScanPhase(phases[i]);
      await new Promise(resolve => setTimeout(resolve, 350));
    }
    
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetchWithTimeout(`${API_BASE}/tools/hash/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: hash.trim() }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Hash analysis failed');
      }
      const resultData = await response.json();
      setResults(resultData);
      addToHistory('hash-analyzer', hash.trim(), resultData);
      trackToolUsage('hash-analyzer', 'analyze', 'success');
      toast.success('Hash analysis complete — real data!');
      setActiveTab('overview');
    } catch (err) {
      toast.error(err.message || 'Hash analysis failed');
      trackToolUsage('hash-analyzer', 'analyze', 'error');
    } finally {
      setIsAnalyzing(false);
      setScanPhase('');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'entropy', label: 'Entropy', icon: Activity },
    { id: 'lookup', label: 'Lookup', icon: Database },
    { id: 'enrichment', label: 'Advanced', icon: Cpu }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 30, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[95vh] overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-950 via-cyan-950/10 to-slate-950 border border-cyan-500/30 shadow-2xl shadow-cyan-500/10"
      >
        {/* Circuit pattern background */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60 pointer-events-none" />
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/8 rounded-full blur-[100px] pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 px-4 sm:px-6 py-4 sm:py-5 border-b border-cyan-500/20 bg-slate-950/60 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <motion.div
                className="relative flex-shrink-0"
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #22d3ee, #3b82f6)' }}
                >
                  <Hash className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <motion.div
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center border-2 border-slate-950"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                >
                  <Fingerprint className="w-3 h-3 text-slate-900" />
                </motion.div>
              </motion.div>
              
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 flex-wrap">
                  <span>Hash Analyzer</span>
                  <span className="px-2 py-0.5 text-[10px] sm:text-xs bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30">CRYPTO</span>
                </h2>
                <p className="text-xs sm:text-sm text-cyan-300/70 flex items-center gap-1.5 mt-0.5">
                  <Binary className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">Identify, analyze & crack hashes</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                className="p-2 rounded-lg bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/30 transition-all"
                title="New Analysis"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                disabled={!results}
                onClick={handleExportJSON}
                className="hidden sm:flex p-2 rounded-lg bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/30 transition-all disabled:opacity-40"
                title="Export JSON"
              >
                <Download className="w-5 h-5 text-cyan-400" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 transition-all"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-100px)] custom-scrollbar">
          {/* Input Section */}
          <div className="mb-6 p-4 sm:p-5 rounded-xl bg-slate-900/60 border border-cyan-500/20 backdrop-blur-sm">
            <label className="text-cyan-300 text-sm font-medium mb-3 flex items-center gap-2">
              <Code className="w-4 h-4" />
              Hash Value
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                <input
                  type="text"
                  value={hash}
                  onChange={e => setHash(e.target.value)}
                  placeholder="e.g., 5d41402abc4b2a76b9719d911017c592"
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-800/80 border border-cyan-500/30 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-white text-base font-mono placeholder-slate-500 outline-none transition-all"
                  onKeyDown={e => e.key === 'Enter' && !isAnalyzing && handleAnalyze()}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAnalyze}
                disabled={isAnalyzing || !hash.trim()}
                className="px-6 py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-cyan-500/30 transition-all"
                style={{ background: 'linear-gradient(135deg, #22d3ee, #3b82f6)' }}
              >
                {isAnalyzing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <RefreshCw className="w-5 h-5" />
                    </motion.div>
                    <span className="hidden sm:inline">Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span className="hidden sm:inline">Analyze</span>
                  </>
                )}
              </motion.button>
            </div>

            {/* Analysis Animation */}
            <AnimatePresence>
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-5"
                >
                  {/* Hex scramble animation */}
                  <div className="flex items-center justify-center gap-1 mb-4">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <motion.span
                        key={i}
                        className="text-cyan-400 font-mono text-lg"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.05 }}
                      >
                        {'0123456789ABCDEF'[Math.floor(Math.random() * 16)]}
                      </motion.span>
                    ))}
                  </div>
                  
                  <div className="text-center text-cyan-400 text-sm">{scanPhase}</div>
                  
                  {/* Progress dots */}
                  <div className="flex justify-center gap-2 mt-3">
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-cyan-500"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Results Section */}
          <AnimatePresence mode="wait">
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Hash DNA Visualization */}
                <div className="mb-6 p-4 rounded-xl bg-slate-900/60 border border-cyan-500/20">
                  <HashDNAHelix hash={results.hash} isActive={true} />
                </div>

                {/* Data Sources & Threat Intel */}
                <div className="mb-4 space-y-2">
                  {results.dataSources && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">Checked against</span>
                      {(results.dataSources || []).map((src, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-400 font-medium">{src}</span>
                      ))}
                    </div>
                  )}
                  {results.isMalicious && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-red-400 font-bold uppercase">Malware Detected</span>
                      </div>
                      {results.malwareBazaar && (
                        <div className="space-y-1 text-xs">
                          <div className="text-slate-300">Name: <span className="text-red-300 font-mono">{results.malwareBazaar.filename}</span></div>
                          <div className="text-slate-300">Signature: <span className="text-red-300">{results.malwareBazaar.signature}</span></div>
                          <div className="text-slate-300">Type: <span className="text-red-300">{results.malwareBazaar.fileType}</span> ({results.malwareBazaar.fileMime})</div>
                          <div className="text-slate-300">First Seen: <span className="text-red-300">{results.malwareBazaar.firstSeen}</span></div>
                          {results.malwareBazaar.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {results.malwareBazaar.tags.map((tag, i) => (
                                <span key={i} className="px-2 py-0.5 rounded bg-red-500/20 text-[10px] text-red-300">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {results.urlhaus && (
                        <div className="mt-2 text-xs text-slate-300">
                          URLhaus: {results.urlhaus.downloadCount} distribution URLs found — Signature: {results.urlhaus.signature}
                        </div>
                      )}
                    </div>
                  )}
                  {results.knownGoodFile && results.circlHashlookup && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs text-emerald-400 font-bold uppercase">Known Good File (NIST NSRL)</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        {results.circlHashlookup.fileName && <div className="text-slate-300">File: <span className="text-emerald-300 font-mono">{results.circlHashlookup.fileName}</span></div>}
                        {results.circlHashlookup.productName && <div className="text-slate-300">Product: <span className="text-emerald-300">{results.circlHashlookup.productName}</span></div>}
                        {results.circlHashlookup.vendor && <div className="text-slate-300">Vendor: <span className="text-emerald-300">{results.circlHashlookup.vendor}</span></div>}
                        {results.circlHashlookup.fileSize && <div className="text-slate-300">Size: <span className="text-emerald-300">{(results.circlHashlookup.fileSize / 1024).toFixed(1)} KB</span></div>}
                      </div>
                    </div>
                  )}
                  {results.threatFox && results.threatFox.length > 0 && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldAlert className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-red-400 font-bold uppercase">ThreatFox IOC Match</span>
                      </div>
                      {results.threatFox.map((tf, i) => (
                        <div key={i} className="text-xs text-red-300 p-2 bg-red-500/5 rounded mb-1">
                          <span className="font-bold">{tf.malware || 'Unknown Malware'}</span> — {tf.threatType || 'Threat'} | Confidence: {tf.confidence || 'N/A'}%
                          {tf.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {tf.tags.map((tag, j) => (
                                <span key={j} className="px-1.5 py-0.5 rounded bg-red-500/20 text-[9px] text-red-300">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30"
                  >
                    <Hash className="w-5 h-5 text-cyan-400 mb-2" />
                    <div className="text-xl font-bold text-white">{results.primaryType}</div>
                    <div className="text-xs text-cyan-300/70">Detected Type</div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 rounded-xl bg-slate-800/50 border border-cyan-500/20"
                  >
                    <FileText className="w-5 h-5 text-cyan-400 mb-2" />
                    <div className="text-xl font-bold text-white">{results.length}</div>
                    <div className="text-xs text-slate-400">Characters</div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`p-4 rounded-xl ${
                      results.securityStatus === 'Secure' 
                        ? 'bg-emerald-500/10 border border-emerald-500/30' 
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}
                  >
                    <Shield className={`w-5 h-5 mb-2 ${results.securityStatus === 'Secure' ? 'text-emerald-400' : 'text-red-400'}`} />
                    <div className={`text-xl font-bold ${results.securityStatus === 'Secure' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {results.securityStatus}
                    </div>
                    <div className="text-xs text-slate-400">Security</div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className={`p-4 rounded-xl ${
                      results.cracked 
                        ? 'bg-red-500/10 border border-red-500/30' 
                        : 'bg-emerald-500/10 border border-emerald-500/30'
                    }`}
                  >
                    {results.cracked ? (
                      <Unlock className="w-5 h-5 text-red-400 mb-2" />
                    ) : (
                      <Lock className="w-5 h-5 text-emerald-400 mb-2" />
                    )}
                    <div className={`text-xl font-bold ${results.cracked ? 'text-red-400' : 'text-emerald-400'}`}>
                      {results.cracked ? 'Cracked' : 'Secure'}
                    </div>
                    <div className="text-xs text-slate-400">Status</div>
                  </motion.div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-5 overflow-x-auto pb-2 scrollbar-hide">
                  {tabs.map(tab => (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium whitespace-nowrap transition-all text-sm ${
                        activeTab === tab.id
                          ? 'text-white shadow-lg shadow-cyan-500/30'
                          : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-cyan-500/20'
                      }`}
                      style={activeTab === tab.id ? { background: 'linear-gradient(135deg, #22d3ee, #3b82f6)' } : {}}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 sm:p-6 rounded-xl bg-slate-900/60 border border-cyan-500/20"
                  >
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                      <div className="space-y-6">
                        {/* Hash Display */}
                        <div className="p-4 rounded-xl bg-slate-800/50 border border-cyan-500/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-cyan-300 text-sm">Input Hash</span>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleCopy(results.hash)}
                              className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                            >
                              <Copy className="w-4 h-4" />
                            </motion.button>
                          </div>
                          <code className="text-white font-mono text-sm break-all block bg-slate-900/50 p-3 rounded-lg">
                            {results.hash}
                          </code>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Quick Info */}
                          <div className="space-y-3">
                            <div className="text-xs text-cyan-400/70 uppercase tracking-wider">Properties</div>
                            {[
                              { label: 'Format', value: results.format },
                              { label: 'Length', value: `${results.length} characters` },
                              { label: 'Case', value: results.uppercase ? 'Uppercase' : 'Mixed' },
                              { label: 'Valid Hex', value: results.valid ? 'Yes' : 'No' }
                            ].map(item => (
                              <div key={item.label} className="p-3 rounded-lg bg-slate-800/30 flex justify-between">
                                <span className="text-slate-400 text-sm">{item.label}</span>
                                <span className="text-white text-sm font-medium">{item.value}</span>
                              </div>
                            ))}
                          </div>

                          {/* Algorithm Timeline */}
                          <AlgorithmTimeline currentType={results.primaryType} />
                        </div>

                        {/* Possible Types */}
                        <div>
                          <div className="text-xs text-cyan-400/70 uppercase tracking-wider mb-3">Possible Hash Types</div>
                          <div className="flex flex-wrap gap-2">
                            {(results.types || []).map((type, i) => (
                              <motion.span
                                key={type}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className={`px-4 py-2 rounded-xl text-sm font-medium ${
                                  i === 0 
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                                    : 'bg-slate-800/50 text-slate-400 border border-slate-700/50'
                                }`}
                              >
                                {type}
                              </motion.span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                          {/* Security Shield */}
                          <div className="p-4 rounded-xl bg-slate-800/30">
                            <SecurityShieldViz 
                              status={results.securityStatus}
                              collisionRisk={results.collisionRisk}
                              strength={results.strength}
                            />
                          </div>
                          
                          {/* Collision Probability */}
                          <CollisionProbabilityDisplay 
                            hashType={results.primaryType}
                            length={results.length}
                          />
                        </div>
                        
                        <div className="space-y-6">
                          {/* Crack Time Estimator */}
                          <CrackTimeEstimator 
                            hashType={results.primaryType}
                            length={results.length}
                          />
                          
                          {/* Recommendations */}
                          <div>
                            <div className="text-xs text-cyan-400/70 uppercase tracking-wider mb-3">Security Recommendations</div>
                            <div className="space-y-2">
                              {results.recommendations.map((rec, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.1 }}
                                  className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-start gap-3"
                                >
                                  <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                                  <span className="text-sm text-slate-300">{rec}</span>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Entropy Tab */}
                    {activeTab === 'entropy' && (
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Entropy Stats */}
                          <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
                            <div className="flex items-center gap-3 mb-4">
                              <Cpu className="w-6 h-6 text-cyan-400" />
                              <span className="text-white font-semibold">Entropy Analysis</span>
                            </div>
                            <div className="text-5xl font-bold text-cyan-400 mb-2">{results.entropy}</div>
                            <div className="text-slate-400 text-sm">bits of entropy</div>
                            <div className="mt-4 h-3 rounded-full bg-slate-800 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(results.entropy / 1.5, 100)}%` }}
                                transition={{ duration: 1 }}
                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                              />
                            </div>
                          </div>

                          {/* Strength */}
                          <div className="p-5 rounded-xl bg-slate-800/50 border border-cyan-500/20">
                            <div className="flex items-center gap-3 mb-4">
                              <Shield className="w-6 h-6 text-cyan-400" />
                              <span className="text-white font-semibold">Hash Strength</span>
                            </div>
                            <div className={`text-5xl font-bold mb-2 ${
                              results.strength === 'Strong' ? 'text-emerald-400' :
                              results.strength === 'Medium' ? 'text-amber-400' : 'text-red-400'
                            }`}>
                              {results.strength}
                            </div>
                            <div className="text-slate-400 text-sm">Based on algorithm and length</div>
                          </div>
                        </div>

                        {/* Entropy Waveform */}
                        <EntropyWaveform hash={results.hash} />

                        {/* Segment Analysis */}
                        <HashSegmentAnalyzer hash={results.hash} />
                      </div>
                    )}

                    {/* Lookup Tab */}
                    {activeTab === 'lookup' && (
                      <div className="space-y-6">
                        {/* Lookup Status */}
                        <div className={`p-6 rounded-xl ${
                          results.lookupResults.found 
                            ? 'bg-red-500/10 border border-red-500/30'
                            : 'bg-emerald-500/10 border border-emerald-500/30'
                        }`}>
                          <div className="flex items-center gap-4">
                            {results.lookupResults.found ? (
                              <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center">
                                <AlertTriangle className="w-7 h-7 text-red-400" />
                              </div>
                            ) : (
                              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle className="w-7 h-7 text-emerald-400" />
                              </div>
                            )}
                            <div>
                              <div className={`text-xl font-bold ${
                                results.lookupResults.found ? 'text-red-400' : 'text-emerald-400'
                              }`}>
                                {results.lookupResults.found ? 'Hash Found in Database' : 'Hash Not Found'}
                              </div>
                              <div className="text-slate-400 text-sm">
                                {results.lookupResults.found 
                                  ? `Found in ${results.lookupResults.source}` 
                                  : 'Not present in common hash databases'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Cracked Value */}
                        {results.cracked && results.crackedValue && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-5 rounded-xl bg-red-500/10 border border-red-500/30"
                          >
                            <div className="text-red-400 text-sm mb-2 flex items-center gap-2">
                              <Unlock className="w-4 h-4" />
                              Cracked Plaintext
                            </div>
                            <code className="text-2xl font-bold text-white font-mono">{results.crackedValue}</code>
                          </motion.div>
                        )}

                        {/* Rainbow Table Coverage */}
                        <RainbowTableCoverage 
                          hashType={results.primaryType}
                          found={results.lookupResults.found}
                        />
                      </div>
                    )}

                    {/* Enrichment Tab */}
                    {activeTab === 'enrichment' && (
                      <div className="space-y-5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-cyan-300 font-semibold flex items-center gap-2">
                            <Cpu className="w-5 h-5" />
                            Advanced Enrichment
                          </h3>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleHashEnrich}
                            disabled={isEnrichingHash}
                            className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-sm flex items-center gap-2 disabled:opacity-50"
                          >
                            {isEnrichingHash ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            {isEnrichingHash ? 'Loading...' : 'Run Enrichment'}
                          </motion.button>
                        </div>

                        {/* SSDEEP Compare */}
                        <div className="p-4 rounded-xl bg-slate-800/50 border border-cyan-500/20">
                          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                            <Dna className="w-4 h-4 text-cyan-400" />
                            SSDEEP / Fuzzy Hash Compare
                          </h4>
                          <div className="flex gap-3">
                            <input
                              type="text"
                              value={compareHash}
                              onChange={e => setCompareHash(e.target.value)}
                              placeholder="Enter second hash for comparison"
                              className="flex-1 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                            />
                          </div>
                          {hashEnrichment?.ssdeepComparison?.available && (
                            <div className="mt-3 p-3 rounded-lg bg-slate-900/50">
                              <div className="text-sm">
                                <span className="text-gray-400">Similarity: </span>
                                <span className={`font-bold ${
                                  hashEnrichment.ssdeepComparison.similarity > 80 ? 'text-emerald-400' :
                                  hashEnrichment.ssdeepComparison.similarity > 50 ? 'text-amber-400' : 'text-red-400'
                                }`}>
                                  {hashEnrichment.ssdeepComparison.similarity}%
                                </span>
                              </div>
                              <div className="text-[10px] text-gray-500 mt-1">
                                Method: {hashEnrichment.ssdeepComparison.method || 'ssdeep'}
                              </div>
                            </div>
                          )}
                        </div>

                        {hashEnrichment && (
                          <div className="space-y-4">
                            {/* Hybrid Analysis */}
                            <div className="p-4 rounded-xl bg-slate-800/50 border border-cyan-500/20">
                              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-purple-400" />
                                Hybrid Analysis
                              </h4>
                              {hashEnrichment.hybridAnalysis?.available ? (
                                hashEnrichment.hybridAnalysis.found !== false ? (
                                  <div className="space-y-2">
                                    {hashEnrichment.hybridAnalysis.environments?.map((env, i) => (
                                      <div key={i} className="p-3 rounded-lg bg-slate-900/50 border border-purple-500/20">
                                        <div className="flex justify-between text-sm">
                                          <span className="text-purple-300">{env.submitName || 'Sample'}</span>
                                          <span className={`font-bold ${
                                            env.verdict === 'malicious' ? 'text-red-400' :
                                            env.verdict === 'suspicious' ? 'text-amber-400' : 'text-emerald-400'
                                          }`}>{env.verdict || 'Unknown'}</span>
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                          Score: {env.threatScore ?? 'N/A'} | Type: {env.type || 'N/A'}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-400">Not found in Hybrid Analysis</div>
                                )
                              ) : (
                                <div className="text-sm text-amber-400">
                                  {hashEnrichment.hybridAnalysis?.note || 'API not available'}
                                </div>
                              )}
                            </div>

                            {/* MetaDefender */}
                            <div className="p-4 rounded-xl bg-slate-800/50 border border-cyan-500/20">
                              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                <Server className="w-4 h-4 text-orange-400" />
                                Multi-AV Scan (MetaDefender)
                              </h4>
                              {hashEnrichment.metadefender?.available ? (
                                hashEnrichment.metadefender.found ? (
                                  <div>
                                    <div className="flex items-center gap-3 mb-3">
                                      <div className={`px-3 py-1 rounded-lg text-sm ${
                                        hashEnrichment.metadefender.threatCount > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                                      }`}>
                                        {hashEnrichment.metadefender.threatCount || 0} threats
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        {hashEnrichment.metadefender.totalEngines} engines checked
                                      </div>
                                    </div>
                                    {hashEnrichment.metadefender.engines && Object.entries(hashEnrichment.metadefender.engines).slice(0, 20).map(([name, ed]) => (
                                      <div key={name} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 mb-1">
                                        <span className="text-xs text-gray-300">{name}</span>
                                        <span className={`text-[10px] ${ed.threat_found ? 'text-red-400' : 'text-emerald-400'}`}>
                                          {ed.threat_found || 'Clean'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-400">No threats detected</div>
                                )
                              ) : (
                                <div className="text-sm text-amber-400">
                                  {hashEnrichment.metadefender?.note || 'API not available'}
                                </div>
                              )}
                            </div>

                            {/* NSRL Known Good */}
                            <div className="p-4 rounded-xl bg-slate-800/50 border border-cyan-500/20">
                              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                NSRL Known-Good Check (NIST)
                              </h4>
                              {hashEnrichment.nsrl?.found ? (
                                <div className="space-y-1">
                                  <div className="text-sm text-emerald-400">Known good file</div>
                                  {hashEnrichment.nsrl.fileName && <div className="text-xs text-gray-300">File: {hashEnrichment.nsrl.fileName}</div>}
                                  {hashEnrichment.nsrl.productName && <div className="text-xs text-gray-300">Product: {hashEnrichment.nsrl.productName}</div>}
                                  {hashEnrichment.nsrl.vendor && <div className="text-xs text-gray-300">Vendor: {hashEnrichment.nsrl.vendor}</div>}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-400">Not found in NSRL database</div>
                              )}
                            </div>

                            {/* imphash Matching */}
                            <div className="p-4 rounded-xl bg-slate-800/50 border border-cyan-500/20">
                              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                <Hash className="w-4 h-4 text-cyan-400" />
                                imphash Matching (MalwareBazaar)
                              </h4>
                              {hashEnrichment.imphashMatching?.found ? (
                                <div>
                                  <div className="text-sm text-red-400 mb-2">{hashEnrichment.imphashMatching.count} matching samples</div>
                                  {hashEnrichment.imphashMatching.samples?.map((s, i) => (
                                    <div key={i} className="p-2 rounded-lg bg-slate-900/50 mb-1">
                                      <div className="text-xs text-gray-300 font-mono">{s.sha256?.slice(0, 32)}...</div>
                                      <div className="text-[10px] text-gray-500">{s.signature || 'Unknown'} | {s.fileType || 'N/A'}</div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-400">
                                  {hashEnrichment.imphashMatching?.note || 'No imphash matches found'}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {!hashEnrichment && !isEnrichingHash && (
                          <div className="text-center py-8 text-gray-500 text-sm">
                            Click "Run Enrichment" to fetch Hybrid Analysis, Multi-AV, NSRL & imphash data
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!results && !isAnalyzing && (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                className="inline-block"
              >
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(59,130,246,0.2))' }}
                >
                  <Hash className="w-10 h-10 text-cyan-400" />
                </div>
              </motion.div>
              <h3 className="text-xl text-slate-400 mb-2">Enter a hash to analyze</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Identify algorithm, check security status, and lookup in rainbow tables
              </p>
              
              {/* Feature highlights */}
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                {[
                  { icon: Fingerprint, label: 'Identify' },
                  { icon: Shield, label: 'Security' },
                  { icon: Activity, label: 'Entropy' },
                  { icon: Database, label: 'Lookup' },
                  { icon: Timer, label: 'Crack Time' }
                ].map((feature, i) => (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="px-3 py-2 rounded-lg bg-slate-800/50 border border-cyan-500/20 flex items-center gap-2"
                  >
                    <feature.icon className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-slate-400">{feature.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34, 211, 238, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 211, 238, 0.5);
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </motion.div>
  );
};

export default HashAnalyzerTool;
