import { useState, useEffect, useRef } from 'react';
import { useToolResult } from '../../context/ToolResultContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, X, Search, Zap, Shield, AlertTriangle, CheckCircle, FileText,
  Database, Cpu, Lock, Unlock, Eye, Copy, RefreshCw, Binary, Code,
  Terminal, Server, Clock, ChevronRight, Download, Activity, Layers,
  ShieldCheck, ShieldAlert, Key, Fingerprint, Timer, Gauge, BarChart3,
  TrendingUp, Network, History, Bookmark, ExternalLink
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
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 0.5, alpha: Math.random() * 0.5 + 0.1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0; if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = `rgba(99, 102, 241, ${p.alpha})`; ctx.fill(); });
      animationId = requestAnimationFrame(draw);
    };
    const resize = () => { canvas.width = canvas.parentElement?.offsetWidth || 400; canvas.height = canvas.parentElement?.offsetHeight || 600; };
    resize(); window.addEventListener('resize', resize);
    animationId = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animationId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
};

const DNSHistoryTool = ({ onClose, onConsume }) => {
  const { addToast } = useToast();
  const { addToHistory } = useHistory();
  const { copyToClipboard } = useClipboard();
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { setLastResult } = useToolResult();
  // Auto-register result with global Save to Case button
  useEffect(() => {
    if (result) {
      setLastResult({ data: result, toolName: 'DNSHistory', query: domain });
    }
  }, [result]);
  useEffect(() => () => setLastResult(null), []);  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleLookup = async () => {
    if (!domain.trim()) { addToast('Please enter a domain', 'error'); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/tools/osint/dns-history`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); addToast(data.error, 'error'); }
      else { setResult(data); addToHistory({ type: 'dns-history', input: domain.trim(), result: data }); }
      trackToolUsage('dns-history', { success: !data.error });
    } catch (err) { setError(err.message); addToast('API request failed', 'error'); }
    finally { setLoading(false); if (onConsume) onConsume(14); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleLookup(); };

  const copyResult = () => { if (result) { copyToClipboard(JSON.stringify(result, null, 2)); addToast('Copied', 'success'); } };

  const countType = (type) => result?.current_records?.[type]?.length || 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050a14]/95 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl">
        <div className="absolute inset-0 pointer-events-none"><ParticleBackground /></div>

        <div className="relative z-10 flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">DNS History & Passive DNS</h2>
              <p className="text-sm text-gray-400">Historical DNS records via crt.sh, SecurityTrails, DNS Dumpster & Google DNS</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyResult} disabled={!result} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-all"><Copy className="w-5 h-5" /></button>
            <button onClick={onClose} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="relative z-10 p-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input ref={inputRef} type="text" value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={handleKeyDown} placeholder="Enter domain (e.g. example.com)" className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-lg transition-all" />
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleLookup} disabled={loading || !domain.trim()} className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-50 transition-all flex items-center gap-2">
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              {loading ? 'Querying...' : 'Lookup'}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>{error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative z-10 mx-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" /> <span>{error}</span>
          </motion.div>
        )}</AnimatePresence>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 p-6 pt-0 space-y-4">
              {/* Current Records Summary */}
              <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                {['A', 'AAAA', 'MX', 'NS', 'TXT', 'SOA', 'CNAME'].map(type => (
                  <div key={type} className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                    <div className="text-lg font-bold text-indigo-400">{countType(type)}</div>
                    <div className="text-xs text-gray-500">{type}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2"><Database className="w-4 h-4 text-indigo-400" /> Current Records</h3>
                  {result.current_records && Object.keys(result.current_records).length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {Object.entries(result.current_records).map(([type, records]) => (
                        <div key={type} className="p-3 rounded-xl bg-white/5 border border-white/5">
                          <div className="text-xs font-semibold text-indigo-400 mb-2">{type} Records ({records.length})</div>
                          {records.slice(0, 5).map((r, i) => (
                            <div key={i} className="text-xs text-gray-300 font-mono truncate mb-1">{r.data || r.name || JSON.stringify(r)}</div>
                          ))}
                          {records.length > 5 && <div className="text-xs text-gray-500">+{records.length - 5} more</div>}
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-gray-500 italic">No records found</p>}
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2"><Network className="w-4 h-4 text-cyan-400" /> Certificate History (crt.sh)</h3>
                  {result.certificate_history?.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {result.certificate_history.slice(0, 15).map((cert, i) => (
                        <div key={i} className="p-2 rounded-xl bg-white/5 border border-white/5">
                          <div className="text-xs text-white font-mono truncate">{cert.domain}</div>
                          <div className="text-xs text-gray-500">Issued: {cert.not_before?.split(' ')[0] || 'N/A'}</div>
                        </div>
                      ))}
                      {result.certificate_history.length > 15 && <div className="text-xs text-gray-500">+{result.certificate_history.length - 15} more</div>}
                    </div>
                  ) : <p className="text-gray-500 italic">No certificate history found</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2"><Server className="w-4 h-4 text-emerald-400" /> Subdomains (SecurityTrails)</h3>
                  {result.subdomain_history?.length > 0 ? (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {result.subdomain_history.filter(s => !s.error).slice(0, 20).map((s, i) => (
                        <div key={i} className="text-xs text-gray-300 font-mono truncate p-1">{s.domain || `${s.subdomain}.${result.domain}`}</div>
                      ))}
                    </div>
                  ) : <p className="text-gray-500 italic">No subdomains found</p>}
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2"><ExternalLink className="w-4 h-4 text-amber-400" /> Related Domains</h3>
                  {result.all_related_domains?.length > 0 ? (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {result.all_related_domains.slice(0, 30).map((d, i) => (
                        <div key={i} className="flex items-center justify-between p-1">
                          <span className="text-xs text-gray-300 font-mono truncate">{d.domain}</span>
                          <span className="text-xs text-gray-500 ml-2 shrink-0">{d.source}</span>
                        </div>
                      ))}
                      {result.all_related_domains.length > 30 && <div className="text-xs text-gray-500">+{result.all_related_domains.length - 30} more</div>}
                    </div>
                  ) : <p className="text-gray-500 italic">No related domains found</p>}
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
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <Globe className="w-6 h-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-indigo-300 font-medium">Querying DNS history...</p>
                <p className="text-sm text-gray-500 mt-1">Checking crt.sh, SecurityTrails & passive DNS sources</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default DNSHistoryTool;
