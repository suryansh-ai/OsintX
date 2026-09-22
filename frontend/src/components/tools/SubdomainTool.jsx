import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Zap, Globe, CheckCircle, XCircle, ExternalLink, Copy,
  Download, RefreshCw, Network, Server, Eye, Filter, BarChart3
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';
import { exportToJSON } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SubdomainTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();

  const [domain, setDomain] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Subdomain', query: domain });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [filterAlive, setFilterAlive] = useState('all');
  const [searchText, setSearchText] = useState('');
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 35 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5, speedX: (Math.random() - 0.5) * 0.3, speedY: (Math.random() - 0.5) * 0.3,
      color: ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6'][Math.floor(Math.random() * 4)],
    }));
    let id;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { ctx.beginPath(); ctx.fillStyle = p.color + '20'; ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); p.x += p.speedX; p.y += p.speedY; if (p.x < 0 || p.x > canvas.width) p.speedX *= -1; if (p.y < 0 || p.y > canvas.height) p.speedY *= -1; });
      id = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(id);
  }, []);

  const handleSearch = async () => {
    if (!domain.trim()) { toast.error('Enter a domain'); return; }
    trackToolUsage('subdomain', 'enumerate', 'start');
    setIsSearching(true); setResults(null); onConsume?.(14);
    try {
      const resp = await fetchWithTimeout(`${API_BASE}/tools/subdomain/enumerate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || 'Enumeration failed'); }
      const data = await resp.json();
      setResults(data);
      addToHistory('subdomain', domain, data);
      toast.success(`Found ${data.totalFound} subdomains!`);
      trackToolUsage('subdomain', 'enumerate', 'success');
    } catch (err) { toast.error(err.message); trackToolUsage('subdomain', 'enumerate', 'error'); }
    finally { setIsSearching(false); }
  };

  const filtered = results?.subdomains?.filter(s => {
    if (filterAlive === 'alive' && !s.alive) return false;
    if (filterAlive === 'dead' && s.alive !== false) return false;
    if (searchText && !s.subdomain.includes(searchText.toLowerCase())) return false;
    return true;
  }) || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }} onClick={e => e.stopPropagation()}
        className="relative w-full max-w-7xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950/15 to-slate-950 border border-emerald-500/30 shadow-[0_0_100px_rgba(16,185,129,0.1)]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Header */}
        <div className="relative px-3 sm:px-6 py-3 sm:py-5 border-b border-emerald-500/20 bg-slate-950/60 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-5 min-w-0 flex-1">
              <motion.div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-600 shadow-lg">
                <Network className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </motion.div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span className="truncate">Subdomain Finder</span>
                  <span className="px-2 py-0.5 text-[10px] sm:text-xs bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">CT Logs</span>
                </h2>
                <p className="text-xs sm:text-sm text-emerald-300/70 truncate">Certificate Transparency subdomain enumeration</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => { setDomain(''); setResults(null); }} className="p-2 rounded-lg bg-white/5 hover:bg-emerald-500/20 border border-white/10 transition-all"><RefreshCw className="w-4 h-4 text-emerald-400" /></motion.button>
              <motion.button whileHover={{ scale: 1.05 }} disabled={!results} onClick={() => { if (results) { exportToJSON(results, `subdomains_${results.domain}_${Date.now()}.json`); toast.success('Exported'); } }} className="hidden sm:flex p-2 rounded-lg bg-white/5 hover:bg-emerald-500/20 border border-white/10 transition-all disabled:opacity-50"><Download className="w-4 h-4 text-emerald-400" /></motion.button>
              <div className="hidden sm:flex px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /><span className="text-lg font-bold text-amber-300">14</span><span className="text-xs text-amber-200/70">credits</span></div>
              <motion.button whileHover={{ scale: 1.1, rotate: 90 }} onClick={onClose} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 transition-all"><X className="w-4 h-4 text-gray-400" /></motion.button>
            </div>
          </div>
        </div>

        <div className="relative p-3 sm:p-6 overflow-y-auto max-h-[calc(92vh-80px)]">
          {/* Search */}
          <div className="mb-5 p-3 sm:p-6 rounded-2xl bg-slate-900/60 border border-emerald-500/20 backdrop-blur-sm">
            <label className="text-emerald-300 text-xs sm:text-sm font-medium mb-2 flex items-center gap-2"><Globe className="w-4 h-4" />Target Domain</label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-2">
              <div className="flex-1 relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                <input type="text" value={domain} onChange={e => setDomain(e.target.value)} placeholder="example.com" onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl bg-slate-800/80 border-2 border-emerald-500/30 text-white text-sm sm:text-lg placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition-all" />
              </div>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleSearch} disabled={isSearching || !domain.trim()}
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg">
                {isSearching ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Search className="w-5 h-5" /></motion.div> : <Search className="w-5 h-5" />}
                <span>{isSearching ? 'Enumerating...' : 'Enumerate'}</span>
              </motion.button>
            </div>
          </div>

          <AnimatePresence>
            {results && (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/20 text-center">
                    <div className="text-2xl font-bold text-emerald-400">{results.totalFound}</div>
                    <div className="text-xs text-gray-400">Total Subdomains</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-green-500/20 text-center">
                    <div className="text-2xl font-bold text-green-400">{results.aliveCount}</div>
                    <div className="text-xs text-gray-400">Alive (Resolved)</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-amber-500/20 text-center">
                    <div className="text-sm font-bold text-amber-400">{results.searchDuration}</div>
                    <div className="text-xs text-gray-400">Search Time</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-blue-500/20 text-center">
                    <div className="text-lg font-bold text-blue-400">{Object.keys(results.sourceBreakdown || {}).length}</div>
                    <div className="text-xs text-gray-400">Sources</div>
                  </div>
                </div>

                {/* Sources */}
                <div className="mb-4 p-4 rounded-xl bg-slate-900/60 border border-emerald-500/10">
                  <h4 className="text-emerald-300 text-sm font-medium mb-2 flex items-center gap-2"><BarChart3 className="w-4 h-4" />Source Breakdown</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(results.sourceBreakdown || {}).map(([src, count]) => (
                      <span key={src} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 text-xs border border-emerald-500/20">
                        {src}: <span className="font-bold">{count}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Data Sources */}
                {results.dataSources?.length > 0 && (
                  <div className="mb-4 p-3 rounded-xl bg-slate-900/40 border border-white/5">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-xs text-gray-500">Data Sources:</span>
                      {results.dataSources.map((src, i) => (
                        <span key={i} className="px-2 py-0.5 text-[10px] rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{src}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filter */}
                <div className="mb-4 flex flex-col sm:flex-row gap-2">
                  <div className="flex gap-1">
                    {[{ id: 'all', label: 'All' }, { id: 'alive', label: 'Alive' }, { id: 'dead', label: 'Dead' }].map(f => (
                      <button key={f.id} onClick={() => setFilterAlive(f.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterAlive === f.id ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Filter subdomains..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800/60 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-emerald-500/30" />
                  </div>
                </div>

                {/* Subdomain List */}
                <div className="space-y-1">
                  {filtered.slice(0, 100).map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 1) }}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all group ${s.alive ? 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30' : s.alive === false ? 'bg-red-500/5 border-red-500/10 hover:border-red-500/20' : 'bg-slate-900/40 border-white/5 hover:border-white/10'}`}>
                      {s.alive ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : s.alive === false ? <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" /> : <Eye className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <span className="text-white text-sm font-mono truncate block">{s.subdomain}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {s.ips?.length > 0 && <span className="text-xs text-gray-500 font-mono">{s.ips.join(', ')}</span>}
                          {s.sources?.map((src, j) => (
                            <span key={j} className="px-1.5 py-0.5 text-[10px] rounded bg-slate-800/60 text-gray-500">{src}</span>
                          ))}
                        </div>
                      </div>
                      <a href={`https://${s.subdomain}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all">
                        <ExternalLink className="w-4 h-4 text-blue-400" />
                      </a>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => { copy(s.subdomain); toast.success('Copied!'); }} className="p-1.5 rounded-lg hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all">
                        <Copy className="w-4 h-4 text-gray-400" />
                      </motion.button>
                    </motion.div>
                  ))}
                  {filtered.length > 100 && (
                    <div className="text-center text-gray-500 text-sm py-4">Showing first 100 of {filtered.length} subdomains. Export for full list.</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!results && !isSearching && (
            <div className="flex flex-col items-center justify-center py-16">
              <Network className="w-16 h-16 text-emerald-500/30 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Subdomain Enumeration</h3>
              <p className="text-gray-400 text-center max-w-md text-sm">Discover all subdomains of a target domain using Certificate Transparency logs, HackerTarget, URLScan.io, and AlienVault OTX.</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SubdomainTool;
