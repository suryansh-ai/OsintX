import { useState, useEffect, useRef } from 'react';
import { useToolResult } from '../../context/ToolResultContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, X, Search, Zap, Shield, AlertTriangle, CheckCircle, FileText,
  Database, Cpu, Lock, Unlock, Eye, Copy, RefreshCw, Binary, Code,
  Terminal, Server, Clock, ChevronRight, Download, Activity, Layers,
  ShieldCheck, ShieldAlert, Key, Fingerprint, Timer, Gauge, BarChart3,
  TrendingUp, Globe, Link, BookOpen, ExternalLink, CalendarDays
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';

const ParticleBackground = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    const particles = Array.from({ length: 35 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 1, alpha: Math.random() * 0.4 + 0.1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0; if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = `rgba(168, 85, 247, ${p.alpha})`; ctx.fill(); });
      animationId = requestAnimationFrame(draw);
    };
    const resize = () => { canvas.width = canvas.parentElement?.offsetWidth || 400; canvas.height = canvas.parentElement?.offsetHeight || 600; };
    resize(); window.addEventListener('resize', resize);
    animationId = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animationId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
};

const CalendarScannerTool = ({ onClose, onConsume }) => {
  const { addToast } = useToast();
  const { addToHistory } = useHistory();
  const { copyToClipboard } = useClipboard();
  const [domain, setDomain] = useState('');
  const [icsUrl, setIcsUrl] = useState('');
  const [mode, setMode] = useState('domain');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { setLastResult } = useToolResult();
  // Auto-register result with global Save to Case button
  useEffect(() => {
    if (result) {
      setLastResult({ data: result, toolName: 'CalendarScanner', query: domain });
    }
  }, [result]);
  useEffect(() => () => setLastResult(null), []);  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleScan = async () => {
    const input = { mode };
    if (mode === 'ics') {
      if (!icsUrl.trim()) { addToast('Please enter an ICS URL', 'error'); return; }
      input.ics_url = icsUrl.trim();
    } else {
      if (!domain.trim()) { addToast('Please enter a domain', 'error'); return; }
      input.domain = domain.trim();
    }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/tools/osint/calendar-scanner`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); addToast(data.error, 'error'); }
      else { setResult(data); addToHistory({ type: 'calendar-scanner', input: JSON.stringify(input), result: data }); }
      trackToolUsage('calendar-scanner', { success: !data.error });
    } catch (err) { setError(err.message); addToast('API request failed', 'error'); }
    finally { setLoading(false); if (onConsume) onConsume(12); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleScan(); };

  const copyResult = () => { if (result) { copyToClipboard(JSON.stringify(result, null, 2)); addToast('Copied', 'success'); } };

  const riskColor = result?.risk_assessment === 'high' ? 'text-red-400' : result?.risk_assessment === 'medium' ? 'text-amber-400' : 'text-emerald-400';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050a14]/95 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl">
        <div className="absolute inset-0 pointer-events-none"><ParticleBackground /></div>

        <div className="relative z-10 flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <CalendarDays className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Public Calendar Scanner</h2>
              <p className="text-sm text-gray-400">Discover exposed calendars, .ics files & booking systems on domains</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyResult} disabled={!result} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-all"><Copy className="w-5 h-5" /></button>
            <button onClick={onClose} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="relative z-10 p-6">
          <div className="flex gap-3 mb-4">
            <button onClick={() => setMode('domain')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${mode === 'domain' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'}`}>Domain Scan</button>
            <button onClick={() => setMode('ics')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${mode === 'ics' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'}`}>ICS Parser</button>
          </div>

          {mode === 'domain' ? (
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input ref={inputRef} type="text" value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={handleKeyDown} placeholder="Enter domain (e.g. example.com)" className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-lg transition-all" />
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleScan} disabled={loading || !domain.trim()} className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 disabled:opacity-50 transition-all flex items-center gap-2">
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {loading ? 'Scanning...' : 'Scan'}
              </motion.button>
            </div>
          ) : (
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input ref={inputRef} type="text" value={icsUrl} onChange={e => setIcsUrl(e.target.value)} onKeyDown={handleKeyDown} placeholder="Enter .ics file URL (e.g. https://example.com/calendar.ics)" className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-lg transition-all" />
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleScan} disabled={loading || !icsUrl.trim()} className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 disabled:opacity-50 transition-all flex items-center gap-2">
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                {loading ? 'Parsing...' : 'Parse ICS'}
              </motion.button>
            </div>
          )}
        </div>

        <AnimatePresence>{error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative z-10 mx-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" /> <span>{error}</span>
          </motion.div>
        )}</AnimatePresence>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 p-6 pt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-purple-400" /> Risk Assessment</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`text-lg font-bold capitalize ${riskColor}`}>{result.risk_assessment || 'unknown'}</div>
                  </div>
                  {result.provider_detected && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="text-xs text-gray-500">Provider</div>
                      <div className="text-white font-medium">{result.provider_detected}</div>
                    </div>
                  )}
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2"><ExternalLink className="w-4 h-4 text-cyan-400" /> Findings</h3>
                  {result.findings?.length > 0 ? (
                    <ul className="space-y-2">
                      {result.findings.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300 p-2 rounded-xl bg-white/5">
                          <ChevronRight className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                          <span className="break-all">{f}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-gray-500 italic">No findings</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2"><Link className="w-4 h-4 text-violet-400" /> Calendar Endpoints</h3>
                  {result.calendar_endpoints?.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {result.calendar_endpoints.map((ep, i) => (
                        <div key={i} className="p-2 rounded-xl bg-white/5 border border-white/5 text-xs">
                          <div className="text-white font-mono truncate">{ep.url}</div>
                          <div className="text-gray-500">Status: {ep.status} | {ep.content_type}</div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-gray-500 italic">No endpoints found</p>}
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-emerald-400" /> Events & Exposed Data</h3>
                  {result.events?.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {result.events.map((ev, i) => (
                        <div key={i} className="p-2 rounded-xl bg-white/5 border border-white/5 text-xs">
                          <div className="text-white truncate">{ev.SUMMARY || ev.DTSTART || 'Event ' + (i + 1)}</div>
                          {ev.LOCATION && <div className="text-gray-500">Location: {ev.LOCATION}</div>}
                        </div>
                      ))}
                    </div>
                  ) : result.ics_files?.length > 0 ? (
                    <div className="space-y-2">
                      {result.ics_files.map((url, i) => (
                        <div key={i} className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                          <AlertTriangle className="w-3 h-3 inline mr-1" /> Exposed ICS: {url}
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-gray-500 italic">No events or ICS files</p>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-3xl">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                  <CalendarDays className="w-6 h-6 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-purple-300 font-medium">Scanning calendar endpoints...</p>
                <p className="text-sm text-gray-500 mt-1">Checking common calendar paths & ICS files</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default CalendarScannerTool;
