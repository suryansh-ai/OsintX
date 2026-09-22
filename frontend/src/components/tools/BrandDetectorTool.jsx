import { useState, useEffect, useRef } from 'react';
import { useToolResult } from '../../context/ToolResultContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Zap, Shield, AlertTriangle, CheckCircle, FileText,
  Database, Cpu, Lock, Unlock, Eye, Copy, RefreshCw, Binary, Code,
  Terminal, Server, Clock, ChevronRight, Download, Activity, Layers,
  ShieldCheck, ShieldAlert, Key, Fingerprint, Timer, Gauge, BarChart3,
  TrendingUp, Globe, Tag, Image, Link, Building, Store
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
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 0.5, alpha: Math.random() * 0.5 + 0.1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0; if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = `rgba(251, 146, 60, ${p.alpha})`; ctx.fill(); });
      animationId = requestAnimationFrame(draw);
    };
    const resize = () => { canvas.width = canvas.parentElement?.offsetWidth || 400; canvas.height = canvas.parentElement?.offsetHeight || 600; };
    resize(); window.addEventListener('resize', resize);
    animationId = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animationId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
};

const BrandIcon = ({ category }) => {
  const colors = {
    technology: 'from-blue-500 to-cyan-500',
    social_media: 'from-pink-500 to-rose-500',
    media_entertainment: 'from-purple-500 to-indigo-500',
    automotive: 'from-amber-500 to-orange-500',
    finance: 'from-emerald-500 to-teal-500',
    retail_ecommerce: 'from-red-500 to-orange-500',
    food_beverage: 'from-yellow-500 to-amber-500',
    healthcare_pharma: 'from-green-500 to-emerald-500',
    telecom: 'from-sky-500 to-blue-500',
  };
  return <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors[category] || 'from-gray-500 to-gray-600'} flex items-center justify-center text-white text-xs font-bold`}>{category?.[0]?.toUpperCase() || '?'}</div>;
};

const BrandDetectorTool = ({ onClose, onConsume }) => {
  const { addToast } = useToast();
  const { addToHistory } = useHistory();
  const { copyToClipboard } = useClipboard();
  const [text, setText] = useState('');
  const [domain, setDomain] = useState('');
  const [mode, setMode] = useState('text');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { setLastResult } = useToolResult();
  // Auto-register result with global Save to Case button
  useEffect(() => {
    if (result) {
      setLastResult({ data: result, toolName: 'BrandDetector', query: text });
    }
  }, [result]);
  useEffect(() => () => setLastResult(null), []);  const [error, setError] = useState(null);
  const textRef = useRef(null);

  useEffect(() => { textRef.current?.focus(); }, []);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleDetect = async () => {
    const input = { mode };
    if (mode === 'domain') {
      if (!domain.trim()) { addToast('Please enter a domain', 'error'); return; }
      input.domain = domain.trim();
    } else {
      if (!text.trim()) { addToast('Please enter text', 'error'); return; }
      input.text = text.trim();
    }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/tools/osint/brand-detector`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); addToast(data.error, 'error'); }
      else { setResult(data); addToHistory({ type: 'brand-detector', input: JSON.stringify(input), result: data }); }
      trackToolUsage('brand-detector', { success: !data.error });
    } catch (err) { setError(err.message); addToast('API request failed', 'error'); }
    finally { setLoading(false); if (onConsume) onConsume(10); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && e.ctrlKey) handleDetect(); };

  const copyResult = () => { if (result) { copyToClipboard(JSON.stringify(result, null, 2)); addToast('Copied', 'success'); } };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050a14]/95 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl">
        <div className="absolute inset-0 pointer-events-none"><ParticleBackground /></div>

        <div className="relative z-10 flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Tag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Brand & Logo Detection</h2>
              <p className="text-sm text-gray-400">Identify brand names, trademarks & logos in text or from domains</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyResult} disabled={!result} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-all"><Copy className="w-5 h-5" /></button>
            <button onClick={onClose} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="relative z-10 p-6">
          <div className="flex gap-3 mb-4">
            <button onClick={() => setMode('text')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${mode === 'text' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'}`}>Text Analysis</button>
            <button onClick={() => setMode('domain')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${mode === 'domain' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'}`}>Domain Lookup</button>
          </div>

          {mode === 'text' ? (
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
                <textarea ref={textRef} value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown} rows={4} placeholder="Paste text to identify brand mentions (Ctrl+Enter to submit)..." className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 text-base transition-all resize-none" />
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleDetect} disabled={loading || !text.trim()} className="px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 disabled:opacity-50 transition-all flex items-center gap-2 self-end">
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {loading ? 'Detecting...' : 'Detect'}
              </motion.button>
            </div>
          ) : (
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input type="text" value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleDetect(); }} placeholder="Enter domain (e.g. apple.com)" className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 text-lg transition-all" />
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleDetect} disabled={loading || !domain.trim()} className="px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 disabled:opacity-50 transition-all flex items-center gap-2">
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {loading ? 'Detecting...' : 'Detect'}
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
              {result.source === 'domain' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2"><Building className="w-4 h-4 text-orange-400" /> Domain Brand Match</h3>
                    {result.brand_name && <div className="text-2xl font-bold text-white mb-2">{result.brand_name}</div>}
                    {result.logo_url && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                        <img src={result.logo_url} alt="Logo" className="w-12 h-12 object-contain rounded-lg" onError={(e) => { e.target.style.display = 'none'; }} />
                        <div className="text-xs text-gray-400 truncate">{result.logo_url}</div>
                      </div>
                    )}
                  </div>

                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2"><Link className="w-4 h-4 text-cyan-400" /> Possible Brands</h3>
                    {result.possible_brands?.length > 0 ? (
                      <div className="space-y-2">
                        {result.possible_brands.map((b, i) => (
                          <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
                            <BrandIcon category={b.category} />
                            <div>
                              <div className="text-sm text-white font-medium">{b.name}</div>
                              <div className="text-xs text-gray-500 capitalize">{b.category?.replace(/_/g, ' ')}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-gray-500 italic">No brands matched</p>}
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2"><Tag className="w-4 h-4 text-orange-400" /> Brands Found ({result.total_brands})</h3>
                  {result.brands_found?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {result.brands_found.map((b, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                          <BrandIcon category={b.category} />
                          <div className="flex-1">
                            <div className="text-white font-medium">{b.name}</div>
                            <div className="text-xs text-gray-500 capitalize">{b.category?.replace(/_/g, ' ')}</div>
                            <div className="text-xs text-gray-600">Confidence: {b.confidence}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-gray-500 italic">No brands detected in text</p>}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-3xl">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
                  <Tag className="w-6 h-6 text-orange-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-orange-300 font-medium">Detecting brands...</p>
                <p className="text-sm text-gray-500 mt-1">Matching against brand database & checking Clearbit</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default BrandDetectorTool;
