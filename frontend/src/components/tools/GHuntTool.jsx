import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, X, Zap, User, Globe, Shield, AlertTriangle, CheckCircle,
  ExternalLink, Copy, Download, RefreshCw, MapPin, Camera, Calendar,
  Youtube, MessageCircle, Search, Eye, Lock, ChevronRight,
  Activity, Clock, FileText, Layers, Crosshair, Radio, Fingerprint,
  Monitor, Gamepad2, Map, Cloud, Video, HardDrive, Phone
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/* ─── Hex-grid animated background ────────────────────────────────── */
const HexGridCanvas = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId, time = 0;
    let alive = true;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const hexSize = 28, hexH = hexSize * Math.sqrt(3);
    const drawHex = (cx, cy, opacity, pulse) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + hexSize * Math.cos(angle), y = cy + hexSize * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      const glow = pulse ? 0.12 + Math.sin(time * 0.02 + cx * 0.01) * 0.08 : 0;
      ctx.strokeStyle = `rgba(234, 88, 12, ${opacity * 0.15 + glow})`;
      ctx.lineWidth = 0.6;
      ctx.stroke();
      if (pulse && glow > 0.05) { ctx.fillStyle = `rgba(234, 88, 12, ${glow * 0.25})`; ctx.fill(); }
    };
    const animate = () => {
      if (!alive) return;
      time++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cols = Math.ceil(canvas.width / (hexSize * 1.5)) + 2;
      const rows = Math.ceil(canvas.height / hexH) + 2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cx = c * hexSize * 1.5, cy = r * hexH + (c % 2 === 1 ? hexH / 2 : 0);
          const dist = Math.sqrt((cx - canvas.width / 2) ** 2 + (canvas.height / 2) ** 2);
          const maxD = Math.sqrt((canvas.width / 2) ** 2 + (canvas.height / 2) ** 2);
          drawHex(cx, cy, 1 - dist / maxD, Math.sin(time * 0.008 + dist * 0.005) > 0.6);
        }
      }
      const beamY = (time * 1.2) % (canvas.height + 100) - 50;
      const grad = ctx.createLinearGradient(0, beamY - 30, 0, beamY + 30);
      grad.addColorStop(0, 'rgba(234,88,12,0)');
      grad.addColorStop(0.5, 'rgba(234,88,12,0.06)');
      grad.addColorStop(1, 'rgba(234,88,12,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, beamY - 30, canvas.width, 60);
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => { alive = false; cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

/* ─── Severity color ──────────────────────────────────────────────── */
const sevColor = (s) => {
  switch (s) {
    case 'critical': return { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-500' };
    case 'high': return { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30', dot: 'bg-orange-500' };
    case 'medium': return { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-400' };
    default: return { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20', dot: 'bg-sky-400' };
  }
};

/* ─── Ring gauge ──────────────────────────────────────────────────── */
const RingGauge = ({ value, label, size = 80, strokeWidth = 6, color = '#ea580c' }) => {
  const r = (size - strokeWidth) / 2, circ = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="drop-shadow-lg">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#1e293b" strokeWidth={strokeWidth} fill="none" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round" strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (value / 100) * circ }} transition={{ duration: 1.6, ease: 'easeOut' }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        <text x="50%" y="50%" textAnchor="middle" dy="0.35em" className="fill-white font-bold" style={{ fontSize: size * 0.26 }}>{value}</text>
      </svg>
      <span className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</span>
    </div>
  );
};

/* ─── GHunt-style terminal line ───────────────────────────────────── */
const TermLine = ({ icon, label, value, positive = true, isLink = false, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}
    className="flex items-start gap-2 py-1.5">
    <span className="text-sm flex-shrink-0 w-5 text-center">{icon || (positive ? '✅' : '❌')}</span>
    <span className="text-gray-400 text-sm">{label}</span>
    {value !== undefined && value !== null && (
      isLink ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 text-sm truncate ml-1 underline decoration-orange-600/30">{value}</a>
      ) : (
        <span className="text-white text-sm ml-1 font-medium">{String(value)}</span>
      )
    )}
  </motion.div>
);

/* ─── Section header ──────────────────────────────────────────────── */
const SectionHeader = ({ emoji, title, delay = 0 }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}
    className="flex items-center gap-2 mt-6 mb-3 pt-4 border-t border-orange-900/20 first:border-0 first:mt-0 first:pt-0">
    <span className="text-lg">{emoji}</span>
    <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider">{title}</h3>
  </motion.div>
);

/* ═════════════════════════════════════════════════════════════════════ */
/*  GHuntTool — Google Account Intelligence                            */
/* ═════════════════════════════════════════════════════════════════════ */
const GHuntTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();

  const [email, setEmail] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'G Hunt', query: email });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);
  const [activeSection, setActiveSection] = useState('terminal');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanPhase, setScanPhase] = useState('');
  const [enrichedResults, setEnrichedResults] = useState(null);
  const [enriching, setEnriching] = useState(false);

  // Track mounted state to prevent state updates after unmount
  const mountedRef = useRef(true);
  const intervalRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  /* ── Auto-enrich: fetch GaiaID, Photos, YouTube, Scholar, Play ── */
  const fetchEnriched = useCallback(async (targetEmail) => {
    if (!targetEmail) return;
    setEnriching(true);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 60000);
      const resp = await fetch(`${API_BASE}/tools/ghunt/enriched`, {
        signal: controller.signal,
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });
      clearTimeout(timer);
      if (resp.ok) {
        const data = await resp.json();
        if (mountedRef.current) setEnrichedResults(data);
      }
    } catch (e) {
      // enrichment is non-critical
    } finally {
      if (mountedRef.current) setEnriching(false);
    }
  }, []);

  useEffect(() => {
    if (results && email) fetchEnriched(email);
  }, [results, email, fetchEnriched]);

  /* ── Scan ─────────────────────────────────────────────────────── */
  const handleScan = useCallback(async () => {
    const target = email.trim().toLowerCase();
    if (!target || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      toast.error('Enter a valid email address'); return;
    }
    trackToolUsage('ghunt', 'analyze', 'start');
    setIsScanning(true); setResults(null); setScanProgress(0); onConsume?.(20);

    const phases = [
      'Initializing GHunt 2.3.3…',
      'Loading stored session…',
      'Authenticating with Google…',
      'Querying Google Account data…',
      'Fetching profile photos…',
      'Checking activated services…',
      'Scanning Play Games profile…',
      'Scanning Google Maps data…',
      'Checking Google Calendar…',
      'Querying Google Chat data…',
      'Compiling intelligence report…',
    ];
    let idx = 0;
    setScanPhase(phases[0]);
    if (intervalRef.current) clearInterval(intervalRef.current);
    const interval = setInterval(() => {
      if (!mountedRef.current) { clearInterval(interval); return; }
      idx++;
      if (idx < phases.length) { setScanPhase(phases[idx]); setScanProgress(Math.round(((idx + 1) / phases.length) * 100)); }
    }, 800);
    intervalRef.current = interval;

    // Create abort controller so fetch can be cancelled on unmount
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const timeoutTimer = setTimeout(() => controller.abort(), 180000);
      const resp = await fetch(`${API_BASE}/tools/ghunt/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: target }),
        signal: controller.signal,
      });
      clearTimeout(timeoutTimer);
      clearInterval(interval);
      intervalRef.current = null;
      if (!mountedRef.current) return;
      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        if (e.authRequired) {
          throw new Error('GHunt not authenticated — run "docker exec -it osintx-backend ghunt login" to configure');
        }
        throw new Error(e.error || 'Analysis failed');
      }
      const data = await resp.json();
      if (!mountedRef.current) return;
      setScanProgress(100); setResults(data); setActiveSection('terminal');
      addToHistory('ghunt', target, data);
      if (data.targetNotFound) {
        toast.error('Target Google account not found');
      } else {
        toast.success('GHunt analysis complete');
      }
      trackToolUsage('ghunt', 'analyze', 'success');
    } catch (err) {
      clearInterval(interval);
      intervalRef.current = null;
      if (!mountedRef.current) return;
      if (err.name !== 'AbortError') {
        toast.error(err.message);
        trackToolUsage('ghunt', 'analyze', 'error');
      }
    } finally {
      if (mountedRef.current) { setIsScanning(false); setScanPhase(''); }
    }
  }, [email, onConsume, addToHistory, toast]);

  /* ── Export ───────────────────────────────────────────────────── */
  const handleExport = (fmt) => {
    if (!results) return;
    const data = formatForExport({ tool: 'GHunt', target: email, ...results });
    fmt === 'json' ? exportToJSON(data, `ghunt_${email}`) : exportToCSV(data, `ghunt_${email}`);
    toast.success(`Exported as ${fmt.toUpperCase()}`);
  };

  /* ── Sidebar sections ────────────────────────────────────────── */
  const sections = [
    { id: 'terminal', icon: Monitor, label: 'Terminal' },
    { id: 'identity', icon: User, label: 'Identity' },
    { id: 'intel', icon: Globe, label: 'Intel' },
    { id: 'services', icon: Cloud, label: 'Services' },
    { id: 'calendar', icon: Calendar, label: 'Calendar' },
    { id: 'maps', icon: Map, label: 'Maps' },
    { id: 'gaia', icon: Fingerprint, label: 'GaiaID' },
    { id: 'photos', icon: Camera, label: 'Photos' },
    { id: 'youtube', icon: Youtube, label: 'YouTube' },
    { id: 'scholar', icon: FileText, label: 'Scholar' },
    { id: 'play', icon: Gamepad2, label: 'Play Store' },
  ];

  const ga = results?.googleAccount;
  const r = results;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl" onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 24 }} transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-[1440px] h-[94vh] overflow-hidden rounded-2xl bg-[#0a0e17] border border-orange-600/20 shadow-[0_0_120px_rgba(234,88,12,0.08),inset_0_1px_0_rgba(255,255,255,0.03)]">
        <HexGridCanvas />

        {/* ── Top bar ─────────────────────────────────────────── */}
        <div className="relative z-10 flex items-center justify-between px-5 py-3 border-b border-orange-900/30 bg-[#0a0e17]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-600 to-red-700 flex items-center justify-center shadow-lg shadow-orange-900/30">
              <Fingerprint className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white tracking-wide">GHunt</h1>
              <p className="text-[10px] text-gray-500 tracking-[0.2em] uppercase">Google Account Intelligence</p>
            </div>
            <span className="ml-2 px-2 py-0.5 rounded text-[9px] font-medium tracking-wider uppercase bg-orange-600/15 text-orange-400 border border-orange-600/25">v2.3.3</span>
          </div>
          <div className="flex items-center gap-2">
            {results && (
              <>
                <button onClick={() => handleExport('json')} className="px-2.5 py-1.5 rounded-lg text-[11px] text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-center gap-1.5"><Download className="w-3 h-3" /> JSON</button>
                <button onClick={() => handleExport('csv')} className="px-2.5 py-1.5 rounded-lg text-[11px] text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-center gap-1.5"><Download className="w-3 h-3" /> CSV</button>
              </>
            )}
            <button onClick={() => { setResults(null); setEmail(''); }} className="p-1.5 rounded-lg text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 transition-all"><RefreshCw className="w-3.5 h-3.5" /></button>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20"><Zap className="w-3 h-3 text-amber-400" /><span className="text-[10px] font-bold text-amber-400">20</span></div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="relative z-10 flex h-[calc(100%-52px)]">
          {/* ── Sidebar ──────────────────────────────────────────── */}
          {results && (
            <motion.nav initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              className="w-16 flex-shrink-0 border-r border-orange-900/20 bg-[#080c14]/60 backdrop-blur-sm flex flex-col items-center py-4 gap-1">
              {sections.map(({ id, icon: Icon, label }) => (
                <button key={id} onClick={() => setActiveSection(id)}
                  className={`group relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200
                    ${activeSection === id ? 'bg-orange-600/20 text-orange-400 shadow-[0_0_12px_rgba(234,88,12,0.15)]' : 'text-gray-600 hover:text-gray-300 hover:bg-white/5'}`}>
                  <Icon className="w-4 h-4" />
                  <span className="absolute left-14 px-2 py-1 rounded bg-gray-900 text-[10px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-gray-800">{label}</span>
                  {activeSection === id && <motion.div layoutId="ghunt-nav" className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r bg-orange-500" />}
                </button>
              ))}
            </motion.nav>
          )}

          {/* ── Main content ──────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">

            {/* ── Empty state / input ──────────────────────────────── */}
            {!results && !isScanning && (
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full px-6">
                {/* ASCII art banner */}
                <pre className="text-orange-600/50 text-[8px] sm:text-[10px] leading-tight font-mono mb-6 select-none whitespace-pre">{`
         .d8888b.  888    888                   888    
        d88P  Y88b 888    888                   888    
        888    888 888    888                   888    
        888        8888888888 888  888 88888b.  888888 
        888  88888 888    888 888  888 888 "88b 888    
        888    888 888    888 888  888 888  888 888    
        Y88b  d88P 888    888 Y88b 888 888  888 Y88b.  
         "Y8888P88 888    888  "Y88888 888  888  "Y888 v2
                `}</pre>
                <p className="text-xs text-gray-500 mb-8 tracking-wider">Spider Edition — Google Account Intelligence</p>
                <div className="w-full max-w-lg">
                  <div className="relative group">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-600/20 via-red-600/20 to-orange-600/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex items-center rounded-xl bg-[#111827] border border-gray-800 focus-within:border-orange-600/50 transition-all duration-300 overflow-hidden">
                      <Mail className="w-4 h-4 text-gray-600 ml-4 flex-shrink-0" />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleScan()}
                        placeholder="target@gmail.com"
                        className="flex-1 bg-transparent text-white text-sm px-3 py-4 outline-none placeholder-gray-600" autoFocus />
                       <button onClick={handleScan} disabled={isScanning}
                         className={`px-6 py-4 text-white text-sm font-medium transition-all flex items-center gap-2 ${isScanning ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-500 hover:to-red-600'}`}>
                         <Crosshair className="w-4 h-4" /> {isScanning ? 'Scanning...' : 'Investigate'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-6 text-[10px] text-gray-600 uppercase tracking-[0.15em]">
                    <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> Passive recon</span>
                    <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> No credentials stored</span>
                    <span className="flex items-center gap-1.5"><Eye className="w-3 h-3" /> OSINT only</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Scanning progress ───────────────────────────────── */}
            {isScanning && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full px-6">
                <pre className="text-orange-600/40 text-[7px] sm:text-[9px] leading-tight font-mono mb-8 select-none whitespace-pre">{`
         .d8888b.  888    888                   888    
        d88P  Y88b 888    888                   888    
        888        8888888888 888  888 88888b.  888888 
        888  88888 888    888 888  888 888 "88b 888    
         "Y8888P88 888    888  "Y88888 888  888  "Y888
                `}</pre>
                <div className="w-80 mb-6">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Scanning...</span><span>{scanProgress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-orange-600 to-red-600"
                      animate={{ width: `${scanProgress}%` }} transition={{ duration: 0.3 }} />
                  </div>
                </div>
                <p className="text-sm text-orange-400/80 font-mono">{scanPhase}</p>
                <p className="text-[10px] text-gray-600 mt-2 font-mono">Target: {email}</p>
              </motion.div>
            )}

            {/* ── Results ─────────────────────────────────────────── */}
            {results && (
              <div className="p-6">
                <AnimatePresence mode="wait">

                  {/* === TERMINAL VIEW — matches real GHunt output === */}
                  {activeSection === 'terminal' && (
                    <motion.div key="terminal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <div className="bg-[#080c14] rounded-xl border border-orange-900/20 p-5 font-mono text-sm overflow-x-auto">
                        <pre className="text-orange-500/70 text-[9px] leading-tight mb-4 select-none">{`
         .d8888b.  888    888                   888    
        d88P  Y88b 888    888                   888    
        888    888 888    888                   888    
        888        8888888888 888  888 88888b.  888888 
        888  88888 888    888 888  888 888 "88b 888    
        888    888 888    888 888  888 888  888 888    
        Y88b  d88P 888    888 Y88b 888 888  888 Y88b.  
         "Y8888P88 888    888  "Y88888 888  888  "Y888 v2`}</pre>

                        <div className="text-gray-500 text-xs mb-1 ml-12">By: mxrch (@mxrchreborn)</div>
                        <div className="text-gray-600 text-xs mb-4 ml-5">Support my work on GitHub Sponsors !</div>
                        <div className="text-center text-orange-400 text-xs mb-6">&gt; {r.toolVersion || 'GHunt 2.3.3'} ({r.toolEdition || 'Spider Edition'}) &lt;</div>

                        <TermLine icon="[+]" label="Stored session loaded !" delay={0.1} />
                        <TermLine icon="[+]" label="Authenticated !" delay={0.15} />

                        {/* -- Google Account Data -- */}
                        <SectionHeader emoji="🙋" title="Google Account data" delay={0.2} />

                        {ga?.profilePhoto?.isCustom ? (
                          <>
                            <TermLine icon="[+]" label="Custom profile picture !" delay={0.25} />
                            {ga.profilePhoto.url && (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="ml-7 mb-2">
                                <span className="text-gray-500 text-sm">=&gt; </span>
                                <a href={ga.profilePhoto.url} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 text-sm underline decoration-orange-600/30 break-all">{ga.profilePhoto.url}</a>
                              </motion.div>
                            )}
                            {ga.profilePhoto.url && (
                              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }} className="ml-7 mb-3">
                                <img src={ga.profilePhoto.url} alt="Profile" className="w-20 h-20 rounded-xl border border-orange-600/20 object-cover" onError={e => e.target.style.display = 'none'} />
                              </motion.div>
                            )}
                          </>
                        ) : (
                          <TermLine icon="[-]" positive={false} label="Default profile picture" delay={0.25} />
                        )}

                        {ga?.coverPhoto?.isDefault ? (
                          <TermLine icon="[-]" positive={false} label="Default cover picture" delay={0.35} />
                        ) : (
                          <TermLine icon="[+]" label="Custom cover picture !" delay={0.35} />
                        )}

                        <div className="h-2" />
                        {ga?.lastProfileEdit && <TermLine icon="📅" label="Last profile edit :" value={ga.lastProfileEdit} delay={0.4} />}
                        <div className="h-2" />
                        <TermLine icon="📧" label="Email :" value={ga?.email} delay={0.45} />
                        <TermLine icon="🆔" label="Gaia ID :" value={ga?.gaiaId || 'Not found'} delay={0.5} />

                        {ga?.name && (
                          <TermLine icon="👤" label="Name :" value={ga.name} delay={0.52} />
                        )}

                        {/* User Types */}
                        {ga?.userTypes?.length > 0 && (
                          <>
                            <div className="h-2" />
                            <TermLine icon="👥" label="User types :" delay={0.55} />
                            {ga.userTypes.map((ut, i) => (
                              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.58 + i * 0.05 }}
                                className="ml-7 text-sm text-gray-400 py-0.5">
                                - <span className="text-white font-medium">{ut.type}</span> <span className="text-gray-500">({ut.description})</span>
                              </motion.div>
                            ))}
                          </>
                        )}

                        {/* -- Google Chat Extended Data -- */}
                        <SectionHeader emoji="📞" title="Google Chat Extended Data" delay={0.65} />
                        <TermLine icon=" " label="Entity Type :" value={r.googleChat?.entityType || 'Not found.'} delay={0.7} />
                        <TermLine icon=" " label="Customer ID :" value={r.googleChat?.customerId || 'Not found.'} delay={0.75} />

                        {/* -- Google Plus Extended Data -- */}
                        <SectionHeader emoji="🌐" title="Google Plus Extended Data" delay={0.8} />
                        <TermLine icon=" " label="Enterprise User :" value={r.googlePlus?.isEnterpriseUser ? 'True' : 'False'} delay={0.85} />

                        {/* -- Activated Services -- */}
                        {r.activatedServices?.some(s => s.active) && (
                          <>
                            <div className="h-3" />
                            <TermLine icon="[+]" label="Activated Google services :" delay={0.9} />
                            {r.activatedServices.filter(s => s.active).map((svc, i) => (
                              <motion.div key={svc.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.93 + i * 0.04 }} className="ml-7 text-sm text-gray-400 py-0.5">
                                - <span className="text-white">{svc.name}</span>
                              </motion.div>
                            ))}
                          </>
                        )}



                        {/* -- Play Games -- */}
                        <SectionHeader emoji="🎮" title="Play Games data" delay={1.15} />
                        {r.playGames?.hasPlayerProfile ? (
                          <>
                            <TermLine icon="[+]" label="Player profile found !" delay={1.18} />
                            <TermLine icon=" " label="Display Name :" value={r.playGames.displayName} delay={1.2} />
                            {r.playGames.playerId && <TermLine icon=" " label="Player ID :" value={r.playGames.playerId} delay={1.22} />}
                            {r.playGames.avatarUrl && (
                              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.24 }} className="ml-7 mb-2">
                                <img src={r.playGames.avatarUrl} alt="Play Games" className="w-12 h-12 rounded-lg border border-orange-600/20 object-cover" onError={e => e.target.style.display = 'none'} />
                              </motion.div>
                            )}
                          </>
                        ) : (
                          <TermLine icon="[-]" positive={false} label="No player profile found." delay={1.18} />
                        )}

                        {/* -- Maps Data -- */}
                        <SectionHeader emoji="🗺️" title="Maps data" delay={1.28} />
                        {r.mapsData?.profileUrl && (
                          <>
                            <TermLine icon=" " label="Profile page :" delay={1.3} />
                            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.32 }}
                              className="ml-7 text-sm text-gray-400 py-0.5">
                              =&gt; <a href={r.mapsData.profileUrl} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 underline decoration-orange-600/30">{r.mapsData.profileUrl}</a>
                            </motion.div>
                          </>
                        )}
                        {r.mapsData?.hasContributions ? (
                          <>
                            <TermLine icon="[+]" label="Reviews :" value={r.mapsData.reviewCount} delay={1.34} />
                            <TermLine icon="[+]" label="Photos :" value={r.mapsData.photoCount} delay={1.36} />
                          </>
                        ) : (
                          <TermLine icon="[-]" positive={false} label="No review." delay={1.34} />
                        )}

                        {/* -- Calendar Data -- */}
                        <SectionHeader emoji="🗓️" title="Calendar data" delay={1.4} />
                        {r.calendarData?.found ? (
                          <>
                            <TermLine icon="[+]" label="Public Google Calendar found !" delay={1.42} />
                            {r.calendarData.timeZone && <TermLine icon=" " label="Time Zone :" value={r.calendarData.timeZone} delay={1.44} />}
                            {r.calendarData.events?.length > 0 ? (
                              <TermLine icon="[+]" label={`${r.calendarData.events.length} event(s) found`} delay={1.46} />
                            ) : (
                              <TermLine icon="=>" label="No recent events found." delay={1.46} />
                            )}
                          </>
                        ) : (
                          <TermLine icon="[-]" positive={false} label="No public calendar found." delay={1.42} />
                        )}

                        {/* -- Data sources footer -- */}
                        <div className="mt-6 pt-4 border-t border-orange-900/20 flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] text-emerald-400 uppercase tracking-wider">Real GHunt Data</span>
                          </div>
                          <div className="flex-1 text-right">
                            <p className="text-[10px] text-gray-600 uppercase tracking-wider">Data Sources</p>
                            <p className="text-xs text-gray-400 mt-1">{r.dataSources?.join(' · ')}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* === IDENTITY === */}
                  {activeSection === 'identity' && (
                    <motion.div key="identity" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h4 className="text-xs text-gray-500 uppercase tracking-[0.15em] mb-6 flex items-center gap-2"><User className="w-3 h-3" /> Identity Dossier</h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Profile card */}
                        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="flex items-start gap-4 mb-4">
                            {ga?.profilePhoto?.url ? (
                              <img src={ga.profilePhoto.url} alt="" className="w-20 h-20 rounded-xl object-cover border border-orange-600/20" onError={e => e.target.style.display = 'none'} />
                            ) : (
                              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-orange-600/10 to-red-600/10 border border-orange-600/20 flex items-center justify-center">
                                <User className="w-10 h-10 text-orange-500/30" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-white font-medium text-lg">{ga?.name || r.profile?.name || 'Unknown'}</p>
                              <p className="text-sm text-gray-500">{ga?.email}</p>
                              {ga?.gaiaId && <p className="text-xs text-gray-600 mt-1 font-mono">Gaia: {ga.gaiaId}</p>}
                            </div>
                          </div>
                          {r.profile?.bio && <p className="text-sm text-gray-400 leading-relaxed border-t border-white/5 pt-3">{r.profile.bio}</p>}
                          {r.profile?.location && <div className="flex items-center gap-2 mt-3 text-xs text-gray-500"><MapPin className="w-3 h-3" /> {r.profile.location}</div>}
                        </div>

                        {/* Account details */}
                        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                          <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-4">Account Details</h5>
                          <div className="space-y-3">
                            {[
                              { label: 'Email', value: ga?.email, icon: Mail },
                              { label: 'Gaia ID', value: ga?.gaiaId || '—', icon: Fingerprint },
                              { label: 'Last Edit', value: ga?.lastProfileEdit || '—', icon: Clock },
                              { label: 'Profile Photo', value: ga?.profilePhoto?.isCustom ? 'Custom (Google)' : 'Default', icon: Camera },
                              { label: 'Cover Photo', value: ga?.coverPhoto?.isDefault ? 'Default' : 'Custom', icon: Camera },
                              { label: 'First Name', value: ga?.firstName || '—', icon: User },
                              { label: 'Last Name', value: ga?.lastName || '—', icon: User },
                            ].map(row => (
                              <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-white/[0.03] last:border-0">
                                <span className="text-xs text-gray-500 flex items-center gap-2"><row.icon className="w-3 h-3" /> {row.label}</span>
                                <span className="text-xs text-gray-300 font-medium truncate ml-4 max-w-[200px]">{row.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* User types */}
                        {ga?.userTypes?.length > 0 && (
                          <div className="lg:col-span-2 p-5 rounded-xl bg-white/[0.02] border border-white/5">
                            <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3">User Types</h5>
                            <div className="space-y-2">
                              {ga.userTypes.map((ut, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-orange-600/5 border border-orange-600/10">
                                  <span className="text-xs text-orange-400 font-bold uppercase font-mono">{ut.type}</span>
                                  <span className="text-xs text-gray-400">{ut.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Cover Photo */}
                        {ga?.coverPhoto?.url && !ga?.coverPhoto?.isDefault && (
                          <div className="lg:col-span-2 p-5 rounded-xl bg-white/[0.02] border border-white/5">
                            <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Cover Photo</h5>
                            <img src={ga.coverPhoto.url} alt="Cover" className="w-full h-40 rounded-lg object-cover border border-orange-600/20" onError={e => e.target.style.display = 'none'} />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* === ENHANCED INTELLIGENCE === */}
                  {activeSection === 'intel' && (
                    <motion.div key="intel" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h4 className="text-xs text-gray-500 uppercase tracking-[0.15em] mb-6 flex items-center gap-2"><Globe className="w-3 h-3" /> Multi-Source OSINT</h4>

                      {!r.enhancedIntelligence || r.enhancedIntelligence.error ? (
                        <div className="text-center py-16 text-gray-600">
                          <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">Enhanced intelligence unavailable</p>
                          <p className="text-xs text-gray-700 mt-1">{r.enhancedIntelligence?.detail || 'Run deep analysis for richer data'}</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Summary card */}
                          {r.enhancedIntelligence.summary && (
                            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wider">Risk Score</p>
                                  <div className="flex items-center gap-3 mt-2">
                                    <span className={`text-2xl font-bold ${r.enhancedIntelligence.summary.riskLevel === 'HIGH' ? 'text-red-400' : r.enhancedIntelligence.summary.riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}`}>
                                      {r.enhancedIntelligence.summary.riskScore}
                                    </span>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${r.enhancedIntelligence.summary.riskLevel === 'HIGH' ? 'bg-red-500/20 text-red-400' : r.enhancedIntelligence.summary.riskLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                      {r.enhancedIntelligence.summary.riskLevel}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500 uppercase tracking-wider">Platforms Found</p>
                                  <p className="text-2xl font-bold text-white mt-1">{r.enhancedIntelligence.summary.totalPlatformsFound}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500 uppercase tracking-wider">Sources</p>
                                  <p className="text-2xl font-bold text-white mt-1">{r.enhancedIntelligence.summary.dataSourcesAccessed}</p>
                                </div>
                              </div>
                              {r.enhancedIntelligence.summary.keyFindings?.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-white/5">
                                  <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Key Findings</p>
                                  <div className="space-y-1">
                                    {r.enhancedIntelligence.summary.keyFindings.map((f, i) => (
                                      <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                                        <CheckCircle className="w-3 h-3 text-orange-400" /> {f}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* YouTube channels */}
                          {r.enhancedIntelligence.youtube?.found && (
                            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                              <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Youtube className="w-3.5 h-3.5 text-red-400" /> YouTube Channels</h5>
                              <div className="space-y-3">
                                {r.enhancedIntelligence.youtube.channels.map((ch, i) => (
                                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-white font-medium truncate">{ch.name}</p>
                                      {ch.subscribers && <p className="text-xs text-gray-500 mt-0.5">{ch.subscribers} subscribers</p>}
                                    </div>
                                    <a href={ch.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-1">
                                      <ExternalLink className="w-3 h-3" /> View
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* EmailRep */}
                          {r.enhancedIntelligence.emailRep?.found && (
                            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                              <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-orange-400" /> EmailRep.io Reputation</h5>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                  { label: 'Reputation', value: r.enhancedIntelligence.emailRep.reputation, color: r.enhancedIntelligence.emailRep.reputation === 'high' ? 'text-red-400' : 'text-emerald-400' },
                                  { label: 'Suspicious', value: r.enhancedIntelligence.emailRep.suspicious ? 'Yes' : 'No', color: r.enhancedIntelligence.emailRep.suspicious ? 'text-red-400' : 'text-emerald-400' },
                                  { label: 'Credentials Leaked', value: r.enhancedIntelligence.emailRep.credentialsLeaked ? 'Yes' : 'No', color: r.enhancedIntelligence.emailRep.credentialsLeaked ? 'text-red-400' : 'text-emerald-400' },
                                  { label: 'Malicious Activity', value: r.enhancedIntelligence.emailRep.maliciousActivity ? 'Yes' : 'No', color: r.enhancedIntelligence.emailRep.maliciousActivity ? 'text-red-400' : 'text-emerald-400' },
                                ].map(item => (
                                  <div key={item.label} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.03] text-center">
                                    <p className={`text-sm font-bold ${item.color}`}>{String(item.value ?? '—')}</p>
                                    <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-1">{item.label}</p>
                                  </div>
                                ))}
                              </div>
                              {r.enhancedIntelligence.emailRep.profiles?.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-white/5">
                                  <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Linked Profiles</p>
                                  <div className="flex flex-wrap gap-1">
                                    {r.enhancedIntelligence.emailRep.profiles.map((p, i) => (
                                      <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-orange-600/10 text-orange-400 border border-orange-600/20">{p}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* HIBP Breaches */}
                          {r.enhancedIntelligence.hibpBreaches?.found && (
                            <div className="p-5 rounded-xl bg-white/[0.02] border border-red-500/10">
                              <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Data Breaches (HIBP)</h5>
                              <p className="text-xs text-red-400/80 mb-3">{r.enhancedIntelligence.hibpBreaches.breachCount} breach(es) found</p>
                              <div className="space-y-2">
                                {r.enhancedIntelligence.hibpBreaches.breaches?.map((b, i) => (
                                  <div key={i} className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm text-white font-medium">{b.name}</p>
                                      <span className="text-[10px] text-gray-500">{b.date}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{b.domain} — {b.pwnCount?.toLocaleString()} records</p>
                                    {b.dataClasses?.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {b.dataClasses.map((dc, j) => (
                                          <span key={j} className="px-1.5 py-0.5 rounded text-[9px] bg-red-500/10 text-red-400/80 border border-red-500/20">{dc}</span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Gravatar */}
                          {r.enhancedIntelligence.gravatar?.found && (
                            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                              <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><User className="w-3.5 h-3.5 text-sky-400" /> Gravatar Profile</h5>
                              <div className="flex items-start gap-4">
                                {r.enhancedIntelligence.gravatar.avatarUrl && (
                                  <img src={r.enhancedIntelligence.gravatar.avatarUrl} alt="" className="w-16 h-16 rounded-xl border border-white/10 object-cover" onError={e => e.target.style.display = 'none'} />
                                )}
                                <div className="flex-1">
                                  <p className="text-white font-medium">{r.enhancedIntelligence.gravatar.displayName || 'Unknown'}</p>
                                  {r.enhancedIntelligence.gravatar.location && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {r.enhancedIntelligence.gravatar.location}</p>}
                                  {r.enhancedIntelligence.gravatar.aboutMe && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{r.enhancedIntelligence.gravatar.aboutMe}</p>}
                                </div>
                              </div>
                              {r.enhancedIntelligence.gravatar.accounts?.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-white/5">
                                  <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Linked Accounts</p>
                                  {r.enhancedIntelligence.gravatar.accounts.map((a, i) => (
                                    <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="block text-xs text-orange-400 hover:text-orange-300 py-0.5 truncate">{a.domain}</a>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Blogger */}
                          {r.enhancedIntelligence.blogger?.found && (
                            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                              <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-orange-400" /> Blogger / Blogspot</h5>
                              <div className="space-y-2">
                                {r.enhancedIntelligence.blogger.blogs.map((b, i) => (
                                  <a key={i} href={b.url} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-lg bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-colors">
                                    <p className="text-sm text-white font-medium truncate">{b.title || b.url}</p>
                                    <p className="text-xs text-gray-500 mt-0.5 truncate">{b.url}</p>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* DuckDuckGo Mentions */}
                          {r.enhancedIntelligence.duckduckGoMentions?.found && (
                            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                              <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Search className="w-3.5 h-3.5 text-orange-400" /> Web Mentions (DuckDuckGo)</h5>
                              <div className="space-y-2">
                                {r.enhancedIntelligence.duckduckGoMentions.mentions.map((m, i) => (
                                  <a key={i} href={m.url} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-lg bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-colors">
                                    <p className="text-xs text-gray-400 line-clamp-2">{m.snippet}</p>
                                    <p className="text-[10px] text-orange-400/70 mt-1 truncate">{m.url}</p>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Certificate Transparency */}
                          {r.enhancedIntelligence.certificateTransparency?.found && (
                            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                              <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-emerald-400" /> Certificate Transparency (crt.sh)</h5>
                              <p className="text-xs text-gray-500 mb-2">{r.enhancedIntelligence.certificateTransparency.certificateCount} certificate(s) found for {r.enhancedIntelligence.email?.split('@')[1]}</p>
                              {r.enhancedIntelligence.certificateTransparency.subdomains?.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {r.enhancedIntelligence.certificateTransparency.subdomains.slice(0, 20).map((s, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">{s}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Cross-Platform Correlation */}
                          {r.enhancedIntelligence.crossPlatformCorrelation?.profiles?.length > 0 && (
                            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                              <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Layers className="w-3.5 h-3.5 text-orange-400" /> Cross-Platform Identity</h5>
                              <div className="space-y-2">
                                {r.enhancedIntelligence.crossPlatformCorrelation.profiles.map((p, i) => (
                                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-7 h-7 rounded-lg bg-orange-600/10 border border-orange-600/20 flex items-center justify-center flex-shrink-0">
                                        <span className="text-[10px] font-bold text-orange-400 uppercase">{p.platform?.charAt(0) || '?'}</span>
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm text-white font-medium truncate">{p.name || p.title || p.platform}</p>
                                        <p className="text-[10px] text-gray-600 uppercase tracking-wider">{p.platform}</p>
                                      </div>
                                    </div>
                                    {p.url && (
                                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-1 ml-3">
                                        <ExternalLink className="w-3 h-3" /> Open
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Social media presence summary */}
                          {r.enhancedIntelligence.crossPlatformCorrelation?.socialMediaPresence?.length > 0 && (
                            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                              <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Radio className="w-3.5 h-3.5 text-orange-400" /> Social Media Presence</h5>
                              <div className="flex flex-wrap gap-2">
                                {r.enhancedIntelligence.crossPlatformCorrelation.socialMediaPresence.map((p, i) => (
                                  <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-600/10 text-orange-400 border border-orange-600/20">{p}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Google Dork Queries — auto-executed */}
                          {r.enhancedIntelligence.googleDorks?.length > 0 && (
                            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                              <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Crosshair className="w-3.5 h-3.5 text-orange-400" /> Web Dork Results</h5>
                              <p className="text-[10px] text-gray-600 mb-3">Auto-executed via DuckDuckGo — click query name to open in Google</p>
                              <div className="space-y-3">
                                {r.enhancedIntelligence.googleDorks.map((dork, i) => {
                                  const s = dork.search;
                                  const found = s?.executed && s?.resultCount > 0;
                                  return (
                                    <div key={i} className={`p-3 rounded-lg border transition-all ${found ? 'bg-orange-600/[0.04] border-orange-600/15' : 'bg-white/[0.01] border-white/[0.03]'}`}>
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-2">
                                            <a href={dork.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-300 font-medium hover:text-orange-400 transition-colors truncate">
                                              {dork.description}
                                            </a>
                                            {s?.executed === false && (
                                              <span className="text-[9px] text-gray-600 flex-shrink-0">(skipped)</span>
                                            )}
                                          </div>
                                          <p className="text-[10px] text-gray-600 mt-0.5 font-mono truncate">{dork.query}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          {found ? (
                                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                              {s.resultCount} found
                                            </span>
                                          ) : s?.executed ? (
                                            <span className="text-[10px] text-gray-600">—</span>
                                          ) : null}
                                          <a href={dork.url} target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded text-[10px] bg-orange-600/10 text-orange-400 hover:bg-orange-600/20 border border-orange-600/20 transition-colors flex items-center gap-1">
                                            <Search className="w-2.5 h-2.5" />
                                          </a>
                                        </div>
                                      </div>
                                      {found && s.results?.length > 0 && (
                                        <div className="mt-2 space-y-1.5 pl-1">
                                          {s.results.slice(0, 3).map((r, j) => (
                                            <a key={j} href={r.url} target="_blank" rel="noopener noreferrer" className="block p-2 rounded bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] group">
                                              <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{r.snippet}</p>
                                              <p className="text-[9px] text-orange-500/60 mt-0.5 truncate">{r.url}</p>
                                            </a>
                                          ))}
                                          {s.resultCount > 3 && (
                                            <p className="text-[9px] text-gray-600 pl-1">+{s.resultCount - 3} more results</p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Data sources footer */}
                          {r.enhancedIntelligence.sourcesUsed?.length > 0 && (
                            <div className="flex items-center gap-2 text-[10px] text-gray-600 uppercase tracking-wider pt-2">
                              <span className="text-emerald-400">●</span>
                              Sources: {r.enhancedIntelligence.sourcesUsed.join(' · ')}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* === SERVICES === */}
                  {activeSection === 'services' && (
                    <motion.div key="services" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h4 className="text-xs text-gray-500 uppercase tracking-[0.15em] mb-6 flex items-center gap-2"><Cloud className="w-3 h-3" /> Google Ecosystem</h4>

                      {/* Activated services grid */}
                      <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Activated Services</h5>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
                        {(r.activatedServices || []).map((svc, i) => (
                          <motion.div key={svc.name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className={`p-4 rounded-xl border transition-all ${svc.active
                              ? 'bg-orange-600/[0.06] border-orange-600/20 shadow-[inset_0_1px_0_rgba(234,88,12,0.1)]'
                              : 'bg-white/[0.01] border-white/5'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">{svc.icon}</span>
                              <span className="text-xs text-gray-400 font-medium">{svc.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {svc.active ? <CheckCircle className="w-4 h-4 text-orange-400" /> : <X className="w-4 h-4 text-gray-700" />}
                              <span className={`text-sm font-medium ${svc.active ? 'text-orange-400' : 'text-gray-600'}`}>
                                {svc.active ? 'Active' : 'Not found'}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Google Chat */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                          <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3">📞 Google Chat Extended Data</h5>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs py-1"><span className="text-gray-500">Entity Type</span><span className="text-gray-300">{r.googleChat?.entityType || '—'}</span></div>
                            <div className="flex justify-between text-xs py-1"><span className="text-gray-500">Presence</span><span className="text-gray-300">{r.googleChat?.presence || '—'}</span></div>
                            <div className="flex justify-between text-xs py-1"><span className="text-gray-500">DND State</span><span className="text-gray-300">{r.googleChat?.dndState || '—'}</span></div>
                            <div className="flex justify-between text-xs py-1"><span className="text-gray-500">Customer ID</span><span className="text-gray-300">{r.googleChat?.customerId || 'Not found.'}</span></div>
                          </div>
                        </div>
                        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                          <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3">🌐 Google Plus Extended Data</h5>
                          <div className="flex justify-between text-xs py-1"><span className="text-gray-500">Enterprise User</span><span className="text-gray-300">{r.googlePlus?.isEnterpriseUser ? 'True' : 'False'}</span></div>
                          {r.googlePlus?.contentRestriction && <div className="flex justify-between text-xs py-1"><span className="text-gray-500">Content Restriction</span><span className="text-gray-300">{r.googlePlus.contentRestriction}</span></div>}
                        </div>
                      </div>

                      {/* Play Games + Maps */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                          <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3">🎮 Play Games</h5>
                          {r.playGames?.hasPlayerProfile ? (
                            <div className="space-y-2">
                              {r.playGames.avatarUrl && (
                                <div className="flex justify-center mb-3">
                                  <img src={r.playGames.avatarUrl} alt="Play Games" className="w-14 h-14 rounded-xl border border-orange-600/20 object-cover" onError={e => e.target.style.display = 'none'} />
                                </div>
                              )}
                              <div className="flex justify-between text-xs py-1"><span className="text-gray-500">Player ID</span><span className="text-gray-300 font-mono text-[10px]">{r.playGames.playerId}</span></div>
                              <div className="flex justify-between text-xs py-1"><span className="text-gray-500">Display Name</span><span className="text-white font-medium">{r.playGames.displayName}</span></div>
                              {r.playGames.level && <div className="flex justify-between text-xs py-1"><span className="text-gray-500">Level</span><span className="text-orange-400 font-medium">{r.playGames.level}</span></div>}
                              {r.playGames.xp && <div className="flex justify-between text-xs py-1"><span className="text-gray-500">XP</span><span className="text-orange-400 font-medium">{r.playGames.xp}</span></div>}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-600">No player profile found.</p>
                          )}
                        </div>
                        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                          <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3">🗺️ Maps Contributions</h5>
                          {r.mapsData?.hasContributions ? (
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs py-1"><span className="text-gray-500">Reviews</span><span className="text-white font-medium">{r.mapsData.reviewCount}</span></div>
                              <div className="flex justify-between text-xs py-1"><span className="text-gray-500">Photos</span><span className="text-white font-medium">{r.mapsData.photoCount}</span></div>
                              {r.mapsData.profileUrl && (
                                <a href={r.mapsData.profileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 mt-2 text-[10px] text-orange-500/70 hover:text-orange-400 transition-colors">
                                  <ExternalLink className="w-3 h-3" /> View Maps Profile
                                </a>
                              )}
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs text-gray-600 mb-2">No Maps contributions found.</p>
                              {r.mapsData?.profileUrl && (
                                <a href={r.mapsData.profileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[10px] text-orange-500/70 hover:text-orange-400 transition-colors">
                                  <ExternalLink className="w-3 h-3" /> View Maps Profile
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Calendar */}
                      {r.calendarData?.found && (
                        <div className="mt-4 p-5 rounded-xl bg-white/[0.02] border border-white/5">
                          <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3">🗓️ Google Calendar</h5>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs py-1"><span className="text-gray-500">Calendar ID</span><span className="text-gray-300 font-mono text-[10px]">{r.calendarData.id}</span></div>
                            <div className="flex justify-between text-xs py-1"><span className="text-gray-500">Time Zone</span><span className="text-gray-300">{r.calendarData.timeZone}</span></div>
                            {r.calendarData.lastUpdated && <div className="flex justify-between text-xs py-1"><span className="text-gray-500">Last Updated</span><span className="text-gray-300">{r.calendarData.lastUpdated}</span></div>}
                            <div className="flex justify-between text-xs py-1"><span className="text-gray-500">Events Found</span><span className="text-gray-300">{r.calendarData.events?.length || 0}</span></div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* === CALENDAR VIEW === */}
                  {activeSection === 'calendar' && (
                    <motion.div key="calendar" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h4 className="text-xs text-gray-500 uppercase tracking-[0.15em] mb-6 flex items-center gap-2"><Calendar className="w-3 h-3" /> Google Calendar</h4>
                      {r.calendarData?.found ? (
                        <div className="space-y-4">
                          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                            <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Calendar Details</h5>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs py-1"><span className="text-gray-500">Calendar ID</span><span className="text-gray-300 font-mono text-[10px]">{r.calendarData.id}</span></div>
                              <div className="flex justify-between text-xs py-1"><span className="text-gray-500">Summary</span><span className="text-gray-300">{r.calendarData.summary}</span></div>
                              <div className="flex justify-between text-xs py-1"><span className="text-gray-500">Time Zone</span><span className="text-white font-medium">{r.calendarData.timeZone}</span></div>
                              {r.calendarData.lastUpdated && <div className="flex justify-between text-xs py-1"><span className="text-gray-500">Last Updated</span><span className="text-gray-300">{r.calendarData.lastUpdated}</span></div>}
                            </div>
                          </div>
                          {r.calendarData.events?.length > 0 ? (
                            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                              <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Recent Events ({r.calendarData.events.length})</h5>
                              <div className="space-y-2">
                                {r.calendarData.events.map((evt, i) => (
                                  <div key={i} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                                    <p className="text-sm text-white font-medium">{evt.summary || 'Untitled Event'}</p>
                                    {evt.start && <p className="text-xs text-gray-500 mt-1">{evt.start.dateTime || evt.start.date}</p>}
                                    {evt.location && <p className="text-xs text-gray-600 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {evt.location}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-16 text-gray-600">
                              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                              <p className="text-sm">No recent events found</p>
                              <p className="text-xs text-gray-700 mt-1">Public calendar exists but has no visible events</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-16 text-gray-600">
                          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">No public calendar found</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* === MAPS DETAIL VIEW === */}
                  {activeSection === 'maps' && (
                    <motion.div key="maps" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h4 className="text-xs text-gray-500 uppercase tracking-[0.15em] mb-6 flex items-center gap-2"><Map className="w-3 h-3" /> Google Maps Data</h4>
                      <div className="space-y-4">
                        {r.mapsData?.profileUrl && (
                          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                            <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Maps Profile</h5>
                            <a href={r.mapsData.profileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 transition-colors">
                              <ExternalLink className="w-4 h-4" /> {r.mapsData.profileUrl}
                            </a>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                            <p className="text-3xl font-bold text-white">{r.mapsData?.reviewCount || 0}</p>
                            <p className="text-[10px] text-gray-600 uppercase mt-1">Reviews</p>
                          </div>
                          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                            <p className="text-3xl font-bold text-white">{r.mapsData?.photoCount || 0}</p>
                            <p className="text-[10px] text-gray-600 uppercase mt-1">Photos</p>
                          </div>
                        </div>
                        {r.mapsData?.reviews?.length > 0 && (
                          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                            <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Recent Reviews</h5>
                            <div className="space-y-3">
                              {r.mapsData.reviews.slice(0, 10).map((rev, i) => (
                                <div key={i} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                                  <p className="text-sm text-white">{rev.comment || rev.text || 'No text'}</p>
                                  {rev.rating && <span className="text-xs text-amber-400">{'⭐'.repeat(rev.rating)}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {(!r.mapsData?.hasContributions) && (
                          <div className="text-center py-12 text-gray-600">
                            <Map className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No Maps contributions found</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* === GAIA ID ENRICHMENT === */}
                  {activeSection === 'gaia' && (
                    <motion.div key="gaia" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h4 className="text-xs text-gray-500 uppercase tracking-[0.15em] mb-6 flex items-center gap-2"><Fingerprint className="w-3 h-3" /> Gaia ID Resolution</h4>
                      {enriching ? (
                        <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 text-orange-400 animate-spin" /></div>
                      ) : enrichedResults?.gaiaIdResolution ? (
                        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-white/5">
                              <span className="text-xs text-gray-500">Gaia ID</span>
                              <span className="text-sm text-white font-mono">{enrichedResults.gaiaIdResolution.gaiaId || 'Not found'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-white/5">
                              <span className="text-xs text-gray-500">Found</span>
                              <span className={`text-sm font-bold ${enrichedResults.gaiaIdResolution.found ? 'text-emerald-400' : 'text-red-400'}`}>
                                {enrichedResults.gaiaIdResolution.found ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <div className="flex justify-between py-2">
                              <span className="text-xs text-gray-500">Method</span>
                              <span className="text-sm text-gray-300 capitalize">{enrichedResults.gaiaIdResolution.method || 'epieos'}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-16 text-gray-500 text-sm">No Gaia ID enrichment data</div>
                      )}
                    </motion.div>
                  )}

                  {/* === GOOGLE PHOTOS === */}
                  {activeSection === 'photos' && (
                    <motion.div key="photos" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h4 className="text-xs text-gray-500 uppercase tracking-[0.15em] mb-6 flex items-center gap-2"><Camera className="w-3 h-3" /> Google Photos</h4>
                      {enriching ? (
                        <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 text-orange-400 animate-spin" /></div>
                      ) : enrichedResults?.googlePhotos?.found ? (
                        <div className="space-y-3">
                          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                            <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Public Albums</h5>
                            {enrichedResults.googlePhotos.albums.map((a, i) => (
                              <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] mb-2 last:mb-0">
                                <span className="text-sm text-white truncate">{a.title}</span>
                                <ExternalLink className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 ml-2" />
                              </a>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                              <p className="text-2xl font-bold text-white">{enrichedResults.googlePhotos.albums.length}</p>
                              <p className="text-[10px] text-gray-500 uppercase mt-1">Albums</p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                              <p className="text-2xl font-bold text-white">{enrichedResults.googlePhotos.photoCount || 0}</p>
                              <p className="text-[10px] text-gray-500 uppercase mt-1">Photos</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-16 text-gray-500 text-sm">
                          <Camera className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          <p>No public Google Photos albums found</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* === YOUTUBE COMMENTS === */}
                  {activeSection === 'youtube' && (
                    <motion.div key="youtube" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h4 className="text-xs text-gray-500 uppercase tracking-[0.15em] mb-6 flex items-center gap-2"><Youtube className="w-3 h-3 text-red-400" /> YouTube Activity</h4>
                      {enriching ? (
                        <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 text-orange-400 animate-spin" /></div>
                      ) : enrichedResults?.youtubeComments?.found ? (
                        <div className="space-y-4">
                          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                            <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Channels ({enrichedResults.youtubeComments.channels.length})</h5>
                            {enrichedResults.youtubeComments.channels.map((ch, i) => (
                              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.03] mb-2 last:mb-0">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm text-white truncate">{ch.name}</p>
                                  <p className="text-xs text-gray-500">{ch.subscribers} subscribers</p>
                                </div>
                                <a href={ch.url} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 ml-3">
                                  <ExternalLink className="w-3 h-3" /> View
                                </a>
                              </div>
                            ))}
                          </div>
                          {enrichedResults.youtubeComments.comments?.length > 0 && (
                            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                              <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Recent Comments</h5>
                              <div className="space-y-2">
                                {enrichedResults.youtubeComments.comments.map((c, i) => (
                                  <div key={i} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                                    <p className="text-xs text-gray-300 line-clamp-2">{c.text}</p>
                                    <p className="text-[10px] text-gray-600 mt-1">{c.platform}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-16 text-gray-500 text-sm">
                          <Youtube className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          <p>No YouTube channels or comments found</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* === GOOGLE SCHOLAR === */}
                  {activeSection === 'scholar' && (
                    <motion.div key="scholar" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h4 className="text-xs text-gray-500 uppercase tracking-[0.15em] mb-6 flex items-center gap-2"><FileText className="w-3 h-3" /> Google Scholar</h4>
                      {enriching ? (
                        <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 text-orange-400 animate-spin" /></div>
                      ) : enrichedResults?.googleScholar?.found ? (
                        <div className="space-y-4">
                          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-lg text-white font-medium">{enrichedResults.googleScholar.profile?.name}</p>
                                <a href={enrichedResults.googleScholar.profile?.url} target="_blank" rel="noopener noreferrer"
                                  className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 mt-1">
                                  <ExternalLink className="w-3 h-3" /> View Profile
                                </a>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                              <p className="text-2xl font-bold text-orange-400">{enrichedResults.googleScholar.publications}</p>
                              <p className="text-[10px] text-gray-500 uppercase mt-1">Publications</p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                              <p className="text-2xl font-bold text-blue-400">{enrichedResults.googleScholar.citations}</p>
                              <p className="text-[10px] text-gray-500 uppercase mt-1">Citations</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-16 text-gray-500 text-sm">
                          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          <p>No Google Scholar profile found</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* === GOOGLE PLAY DEVELOPER === */}
                  {activeSection === 'play' && (
                    <motion.div key="play" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h4 className="text-xs text-gray-500 uppercase tracking-[0.15em] mb-6 flex items-center gap-2"><Gamepad2 className="w-3 h-3" /> Google Play Developer</h4>
                      {enriching ? (
                        <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 text-orange-400 animate-spin" /></div>
                      ) : enrichedResults?.googlePlay?.found ? (
                        <div className="space-y-4">
                          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-lg text-white font-medium">{enrichedResults.googlePlay.devName || 'Developer'}</p>
                                <a href={enrichedResults.googlePlay.apps?.[0]?.url} target="_blank" rel="noopener noreferrer"
                                  className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 mt-1">
                                  <ExternalLink className="w-3 h-3" /> Google Play Page
                                </a>
                              </div>
                            </div>
                          </div>
                          {enrichedResults.googlePlay.apps?.length > 0 && (
                            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                              <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Published Apps</h5>
                              <div className="space-y-2">
                                {enrichedResults.googlePlay.apps.map((app, i) => (
                                  <a key={i} href={app.url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04]">
                                    <span className="text-sm text-white truncate">{app.name || app.title}</span>
                                    <ExternalLink className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 ml-2" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-16 text-gray-500 text-sm">
                          <Gamepad2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          <p>No Google Play Developer profile found</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(234,88,12,0.2); border-radius: 99px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(234,88,12,0.4); }
        `}</style>
      </motion.div>
    </motion.div>
  );
};

export default GHuntTool;
