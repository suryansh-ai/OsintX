import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Copy, Download, RefreshCw, Info, Link2, ArrowRight, Shield, CheckCircle, AlertTriangle, ExternalLink, Globe } from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const URLExpanderTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'U R L Expander', query: query });
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
      color: ['#6366f1', '#818cf8', '#4f46e5', '#3b82f6'][Math.floor(Math.random() * 4)],
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
    if (!query.trim()) { toast.error('Enter a short URL'); return; }
    trackToolUsage('urlexpander', 'expand', 'start');
    setIsSearching(true); setResults(null); onConsume?.(5);
    try {
      const resp = await fetch(`${API_BASE}/tools/urlexpander/expand`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: query.trim() }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || 'Expansion failed'); }
      const data = await resp.json();
      setResults(data);
      addToHistory('urlexpander', query, data);
      toast.success(`Expanded through ${data.redirectChain?.length || 0} redirects`);
    } catch (err) { toast.error(err.message); }
    finally { setIsSearching(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }} onClick={e => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950/10 to-slate-950 border border-indigo-500/30 shadow-[0_0_100px_rgba(99,102,241,0.1)]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="relative z-10 flex flex-col max-h-[92vh]">
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30"><Link2 className="w-6 h-6 text-indigo-400" /></div>
              <div><h2 className="text-xl font-bold text-white">URL Expander</h2><p className="text-sm text-slate-400">Unshorten URLs & trace redirect chains</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div className="p-6 border-b border-white/5">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Link2 className="absolute w-5 h-5 left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter short URL (e.g. https://bit.ly/abc)" className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-indigo-500/50 focus:outline-none" />
              </div>
              <button onClick={handleSearch} disabled={isSearching}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {isSearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {isSearching ? 'Expanding...' : 'Expand'}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {isSearching && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                <p className="mt-4 text-slate-400">Following redirect chain...</p>
              </div>
            )}
            {results && !isSearching && (
              <div className="space-y-6">
                {/* Summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400">Total Redirects</p>
                    <p className="text-2xl font-bold text-indigo-400">{results.totalRedirects}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400">Safety</p>
                    <p className={`text-lg font-bold ${results.safety?.urlhausStatus === 'MALICIOUS' ? 'text-red-400' : 'text-green-400'}`}>
                      {results.safety?.urlhausStatus === 'MALICIOUS' ? '⚠ MALICIOUS' : '✓ SAFE'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400">Final URL</p>
                    <p className="text-sm text-white font-mono truncate">{results.finalUrl}</p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => copy(results.finalUrl)} className="p-2 rounded-lg hover:bg-white/10 flex items-center gap-1 text-xs text-slate-400"><Copy className="w-4 h-4" /> Copy Final URL</button>
                  <button onClick={() => copy(JSON.stringify(results, null, 2))} className="p-2 rounded-lg hover:bg-white/10"><Copy className="w-4 h-4 text-slate-400" /></button>
                  <button onClick={() => exportToJSON(results, 'urlexpander-results')} className="p-2 rounded-lg hover:bg-white/10"><Download className="w-4 h-4 text-slate-400" /></button>
                </div>
                {/* Redirect chain */}
                <div>
                  <p className="text-sm text-slate-400 mb-3">Redirect Chain</p>
                  <div className="space-y-1">
                    {results.redirectChain?.map((hop, i) => (
                      <div key={i}>
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-white font-mono truncate">{hop.url}</p>
                                <p className="text-xs text-slate-500">{hop.server && `Server: ${hop.server}`}</p>
                              </div>
                            </div>
                            <span className={`flex-shrink-0 px-2 py-0.5 text-xs rounded font-mono ${hop.statusCode >= 300 && hop.statusCode < 400 ? 'bg-yellow-500/20 text-yellow-300' : hop.statusCode >= 200 && hop.statusCode < 300 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{hop.statusCode}</span>
                          </div>
                        </div>
                        {i < results.redirectChain.length - 1 && (
                          <div className="flex justify-center py-0.5"><ArrowRight className="w-4 h-4 text-indigo-500/50 rotate-90" /></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Domain analysis */}
                {results.analysis && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400 mb-2 flex items-center gap-2"><Globe className="w-4 h-4" /> Domain Analysis</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><p className="text-slate-500">Protocol</p><p className="text-white">{results.analysis.protocol}</p></div>
                      <div><p className="text-slate-500">Domain</p><p className="text-white">{results.analysis.finalDomain}</p></div>
                      <div><p className="text-slate-500">Path</p><p className="text-white font-mono text-xs">{results.analysis.path || '/'}</p></div>
                      <div><p className="text-slate-500">Domain Changed</p><p className="text-white">{results.analysis.domainChanged ? 'Yes' : 'No'}</p></div>
                    </div>
                  </div>
                )}
                <div className="text-xs text-slate-600 flex items-center gap-2"><Info className="w-3 h-3" /> Sources: {results.dataSources?.join(', ')} • {results.searchDuration}</div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default URLExpanderTool;
