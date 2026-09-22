import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Copy, Download, RefreshCw, Info, Leaf, Gauge, Globe, Zap, Server, BarChart3 } from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const WebCarbonTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Web Carbon', query: query });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 25 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5, speedX: (Math.random() - 0.5) * 0.3, speedY: (Math.random() - 0.5) * 0.3,
      color: ['#22c55e', '#4ade80', '#16a34a', '#86efac'][Math.floor(Math.random() * 4)],
    }));
    let id;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { ctx.beginPath(); ctx.fillStyle = p.color + '15'; ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); p.x += p.speedX; p.y += p.speedY; if (p.x < 0 || p.x > canvas.width) p.speedX *= -1; if (p.y < 0 || p.y > canvas.height) p.speedY *= -1; });
      id = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(id);
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) { toast.error('Enter a website URL'); return; }
    trackToolUsage('webcarbon', 'analyze', 'start');
    setIsSearching(true); setResults(null); onConsume?.(10);
    try {
      const resp = await fetch(`${API_BASE}/tools/webcarbon/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: query.trim() }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || 'Analysis failed'); }
      const data = await resp.json();
      setResults(data);
      addToHistory('webcarbon', query, data);
      toast.success('Carbon footprint analyzed!');
    } catch (err) { toast.error(err.message); }
    finally { setIsSearching(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }} onClick={e => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-green-950/10 to-slate-950 border border-green-500/30 shadow-[0_0_100px_rgba(34,197,94,0.1)]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="relative z-10 flex flex-col max-h-[92vh]">
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/30"><Leaf className="w-6 h-6 text-green-400" /></div>
              <div><h2 className="text-xl font-bold text-white">Web Carbon Analyzer</h2><p className="text-sm text-slate-400">Website carbon footprint & performance metrics</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div className="p-6 border-b border-white/5">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Globe className="absolute w-5 h-5 left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter website URL (e.g. example.com)" className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-green-500/50 focus:outline-none" />
              </div>
              <button onClick={handleSearch} disabled={isSearching}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {isSearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {isSearching ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {isSearching && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                <p className="mt-4 text-slate-400">Measuring carbon footprint...</p>
              </div>
            )}
            {results && !isSearching && (
              <div className="space-y-6">
                {/* Carbon Stats */}
                {results.carbon && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className={`p-4 rounded-xl border ${results.carbon.isGreen ? 'bg-green-500/10 border-green-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                      <p className="text-sm text-slate-400 flex items-center gap-2"><Leaf className="w-4 h-4" /> Green Hosted</p>
                      <p className={`text-2xl font-bold ${results.carbon.isGreen ? 'text-green-400' : 'text-amber-400'}`}>{results.carbon.isGreen ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-sm text-slate-400">CO₂ per View</p>
                      <p className="text-2xl font-bold text-white">{results.carbon.co2PerView ? `${results.carbon.co2PerView.toFixed(2)}g` : 'N/A'}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-sm text-slate-400">Cleaner Than</p>
                      <p className="text-2xl font-bold text-green-400">{results.carbon.cleanerThan ? `${(results.carbon.cleanerThan * 100).toFixed(0)}%` : 'N/A'}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-sm text-slate-400">Rating</p>
                      <p className="text-2xl font-bold text-violet-400">{results.carbon.rating || 'N/A'}</p>
                    </div>
                  </div>
                )}
                {/* Page Metrics */}
                {results.pageMetrics && (
                  <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400 mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Page Metrics</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><p className="text-slate-500">HTML Size</p><p className="text-white">{results.pageMetrics.htmlSizeKB} KB</p></div>
                      <div><p className="text-slate-500">Scripts</p><p className="text-white">{results.pageMetrics.scriptTags}</p></div>
                      <div><p className="text-slate-500">Stylesheets</p><p className="text-white">{results.pageMetrics.stylesheetLinks}</p></div>
                      <div><p className="text-slate-500">Images</p><p className="text-white">{results.pageMetrics.imageTags}</p></div>
                      <div><p className="text-slate-500">Iframes</p><p className="text-white">{results.pageMetrics.iframeTags}</p></div>
                      <div><p className="text-slate-500">Total Elements</p><p className="text-white">{results.pageMetrics.totalElements}</p></div>
                      <div><p className="text-slate-500">Encoding</p><p className="text-white">{results.pageMetrics.contentEncoding || 'none'}</p></div>
                      <div><p className="text-slate-500">Cache</p><p className="text-white text-xs">{results.pageMetrics.cacheControl || 'N/A'}</p></div>
                    </div>
                  </div>
                )}
                {/* Infrastructure */}
                {results.infrastructure && (
                  <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400 mb-3 flex items-center gap-2"><Server className="w-4 h-4" /> Infrastructure</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {results.infrastructure.ipAddresses?.length > 0 && (
                        <div><p className="text-slate-500">IP Addresses</p><p className="text-white font-mono text-xs">{results.infrastructure.ipAddresses.join(', ')}</p></div>
                      )}
                      {results.infrastructure.ports?.length > 0 && (
                        <div><p className="text-slate-500">Open Ports</p><p className="text-white">{results.infrastructure.ports.join(', ')}</p></div>
                      )}
                      {results.infrastructure.hostnames?.length > 0 && (
                        <div><p className="text-slate-500">Hostnames</p><p className="text-white text-xs">{results.infrastructure.hostnames.join(', ')}</p></div>
                      )}
                      {results.infrastructure.vulns?.length > 0 && (
                        <div><p className="text-red-400">Vulnerabilities</p><p className="text-red-300 text-xs">{results.infrastructure.vulns.join(', ')}</p></div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <button onClick={() => copy(JSON.stringify(results, null, 2))} className="p-2 rounded-lg hover:bg-white/10"><Copy className="w-4 h-4 text-slate-400" /></button>
                  <button onClick={() => exportToJSON(results, 'webcarbon-results')} className="p-2 rounded-lg hover:bg-white/10"><Download className="w-4 h-4 text-slate-400" /></button>
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-2"><Info className="w-3 h-3" /> Sources: {results.dataSources?.join(', ')} • {results.searchDuration}</div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WebCarbonTool;
