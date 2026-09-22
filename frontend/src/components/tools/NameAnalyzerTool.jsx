import { useState, useEffect, useRef, useMemo } from 'react';
import { useToolResult } from '../../context/ToolResultContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, X, Search, Zap, Shield, AlertTriangle, CheckCircle, FileText,
  Database, Cpu, Lock, Unlock, Eye, Copy, RefreshCw, Binary, Code,
  Terminal, Server, Clock, ChevronRight, Download, Activity, Layers,
  ShieldCheck, ShieldAlert, Key, Fingerprint, Timer, Gauge, BarChart3,
  TrendingUp, Globe, Flag, Users, Hash, Bookmark, Info, HelpCircle
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
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 211, 238, ${p.alpha})`;
        ctx.fill();
      });
      animationId = requestAnimationFrame(draw);
    };
    const resize = () => { canvas.width = canvas.parentElement?.offsetWidth || 400; canvas.height = canvas.parentElement?.offsetHeight || 600; };
    resize(); window.addEventListener('resize', resize);
    animationId = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animationId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
};

const NameAnalyzerTool = ({ onClose, onConsume }) => {
  const { addToast } = useToast();
  const { addToHistory } = useHistory();
  const { copyToClipboard } = useClipboard();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { setLastResult } = useToolResult();
  // Auto-register result with global Save to Case button
  useEffect(() => {
    if (result) {
      setLastResult({ data: result, toolName: 'NameAnalyzer', query: name });
    }
  }, [result]);
  useEffect(() => () => setLastResult(null), []);  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleAnalyze = async () => {
    if (!name.trim()) { addToast('Please enter a name', 'error'); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/tools/osint/name-analyzer`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); addToast(data.error, 'error'); }
      else { setResult(data); addToHistory({ type: 'name-analyzer', input: name.trim(), result: data }); }
      trackToolUsage('name-analyzer', { success: !data.error });
    } catch (err) {
      setError(err.message); addToast('API request failed', 'error');
    } finally { setLoading(false); if (onConsume) onConsume(10); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleAnalyze(); };

  const copyResult = () => { if (result) { copyToClipboard(JSON.stringify(result, null, 2)); addToast('Copied to clipboard', 'success'); } };

  const handleExportJSON = () => { if (result) { exportToJSON(formatForExport(result), `name-analyzer-${Date.now()}`); addToast('Exported as JSON', 'success'); } };
  const handleExportCSV = () => { if (result) { exportToCSV(result, `name-analyzer-${Date.now()}`); addToast('Exported as CSV', 'success'); } };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050a14]/95 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl">
        <div className="absolute inset-0 pointer-events-none"><ParticleBackground /></div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Person Name Analyzer</h2>
              <p className="text-sm text-gray-400">Extract intelligence from names — gender, nationality, title & structure</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportJSON} disabled={!result} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-all"><Download className="w-5 h-5" /></button>
            <button onClick={copyResult} disabled={!result} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-all"><Copy className="w-5 h-5" /></button>
            <button onClick={onClose} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Input */}
        <div className="relative z-10 p-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input ref={inputRef} type="text" value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKeyDown} placeholder="Enter full name (e.g. John A. Smith Jr.)" className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 text-lg transition-all" />
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAnalyze} disabled={loading || !name.trim()} className="px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 disabled:opacity-50 transition-all flex items-center gap-2">
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              {loading ? 'Analyzing...' : 'Analyze'}
            </motion.button>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative z-10 mx-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" /> <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 p-6 pt-0 space-y-4">
              {/* Parsed Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2"><Bookmark className="w-4 h-4 text-violet-400" /> Parsed Name</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'First', value: result.parsed?.first },
                      { label: 'Middle', value: result.parsed?.middle },
                      { label: 'Last', value: result.parsed?.last },
                      { label: 'Suffix', value: result.parsed?.suffix },
                    ].map(item => (
                      <div key={item.label} className="p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                        <div className="text-white font-medium truncate">{item.value || <span className="text-gray-600">—</span>}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2"><Info className="w-4 h-4 text-cyan-400" /> Identity Traits</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-sm text-gray-400">Gender</span>
                      <span className="text-white font-medium capitalize">{result.gender || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-sm text-gray-400">Title</span>
                      <span className="text-white font-medium capitalize">{result.title || 'None detected'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-sm text-gray-400">Initials</span>
                      <span className="text-white font-medium">{result.initials || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-sm text-gray-400">Nickname</span>
                      <span className="text-white font-medium">{result.parsed?.nickname || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nationality & Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2"><Flag className="w-4 h-4 text-emerald-400" /> Possible Nationality</h3>
                  {result.possible_nationality?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {result.possible_nationality.map((n, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm capitalize">{n}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No nationality hints detected</p>
                  )}
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-amber-400" /> Analysis</h3>
                  {result.analysis?.length > 0 ? (
                    <ul className="space-y-2">
                      {result.analysis.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <ChevronRight className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">Standard name pattern</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-3xl">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
                  <User className="w-6 h-6 text-violet-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-violet-300 font-medium">Analyzing name...</p>
                <p className="text-sm text-gray-500 mt-1">Parsing components & checking databases</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default NameAnalyzerTool;
