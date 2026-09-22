import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Zap, Clock, ExternalLink, Copy, Download, RefreshCw, Globe, Archive, ChevronRight, AlertCircle, CheckCircle, Info, Calendar, BarChart3 } from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const WaybackTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Wayback', query: query });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [activeTab, setActiveTab] = useState('overview');
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5, speedX: (Math.random() - 0.5) * 0.3, speedY: (Math.random() - 0.5) * 0.3,
      color: ['#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e'][Math.floor(Math.random() * 4)],
    }));
    let id;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { ctx.beginPath(); ctx.fillStyle = p.color + '18'; ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); p.x += p.speedX; p.y += p.speedY; if (p.x < 0 || p.x > canvas.width) p.speedX *= -1; if (p.y < 0 || p.y > canvas.height) p.speedY *= -1; });
      id = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(id);
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) { toast.error('Enter a URL to search'); return; }
    trackToolUsage('wayback', 'search', 'start');
    setIsSearching(true); setResults(null); onConsume?.(10);
    try {
      const resp = await fetch(`${API_BASE}/tools/wayback/lookup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: query.trim() }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || 'Lookup failed'); }
      const data = await resp.json();
      setResults(data);
      addToHistory('wayback', query, data);
      toast.success(data.isArchived ? `Found ${data.totalCaptures} snapshots!` : 'No archives found');
    } catch (err) { toast.error(err.message); }
    finally { setIsSearching(false); }
  };

  const tabs = ['overview', 'snapshots', 'timeline'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }} onClick={e => e.stopPropagation()}
        className="relative w-full max-w-7xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950/10 to-slate-950 border border-blue-500/30 shadow-[0_0_100px_rgba(59,130,246,0.1)]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="relative z-10 flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30"><Archive className="w-6 h-6 text-blue-400" /></div>
              <div><h2 className="text-xl font-bold text-white">Wayback Machine</h2><p className="text-sm text-slate-400">Internet Archive — Browse website snapshots over time</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          {/* Search */}
          <div className="p-6 border-b border-white/5">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Globe className="absolute w-5 h-5 left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter URL (e.g. example.com)" className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none" />
              </div>
              <button onClick={handleSearch} disabled={isSearching}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {isSearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
          {/* Results */}
          <div className="flex-1 overflow-y-auto p-6">
            {isSearching && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <p className="mt-4 text-slate-400">Searching the Wayback Machine...</p>
              </div>
            )}
            {results && !isSearching && (
              <div className="space-y-6">
                {/* Status Card */}
                <div className={`p-4 rounded-xl border ${results.isArchived ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <div className="flex items-center gap-3">
                    {results.isArchived ? <CheckCircle className="w-6 h-6 text-green-400" /> : <AlertCircle className="w-6 h-6 text-red-400" />}
                    <div>
                      <p className="text-white font-semibold">{results.isArchived ? 'URL is archived!' : 'URL not found in archives'}</p>
                      <p className="text-sm text-slate-400">{results.url} — {results.totalCaptures} captures total</p>
                    </div>
                    <div className="ml-auto flex gap-2">
                      <button onClick={() => copy(JSON.stringify(results, null, 2))} className="p-2 rounded-lg hover:bg-white/10"><Copy className="w-4 h-4 text-slate-400" /></button>
                      <button onClick={() => exportToJSON(results, 'wayback-results')} className="p-2 rounded-lg hover:bg-white/10"><Download className="w-4 h-4 text-slate-400" /></button>
                    </div>
                  </div>
                </div>
                {/* Tabs */}
                <div className="flex gap-2">
                  {tabs.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${activeTab === tab ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'text-slate-400 hover:bg-white/5'}`}>
                      {tab}
                    </button>
                  ))}
                </div>
                {/* Tab Content */}
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-sm text-slate-400">Total Captures</p>
                        <p className="text-2xl font-bold text-blue-400">{results.totalCaptures?.toLocaleString()}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-sm text-slate-400">First Archived</p>
                        <p className="text-2xl font-bold text-green-400">{results.firstCapture || 'N/A'}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-sm text-slate-400">Last Archived</p>
                        <p className="text-2xl font-bold text-purple-400">{results.lastCapture || 'N/A'}</p>
                      </div>
                      {results.archiveAge && (
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <p className="text-sm text-slate-400">Archive Age</p>
                          <p className="text-2xl font-bold text-amber-400">{results.archiveAge.formatted}</p>
                        </div>
                      )}
                    </div>
                    {results.closestSnapshot && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-sm text-slate-400 mb-2">Closest Snapshot</p>
                        <a href={results.closestSnapshot.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-2">
                          {results.closestSnapshot.url} <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                    {results.contentTypes && Object.keys(results.contentTypes).length > 0 && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-sm text-slate-400 mb-2">Content Types</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(results.contentTypes).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                            <span key={type} className="px-2 py-1 text-xs rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">{type}: {count}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {results.statusDistribution && Object.keys(results.statusDistribution).length > 0 && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-sm text-slate-400 mb-2">HTTP Status Distribution</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(results.statusDistribution).map(([status, count]) => (
                            <span key={status} className={`px-2 py-1 text-xs rounded border ${status === '200' ? 'bg-green-500/10 text-green-300 border-green-500/20' : status.startsWith('3') ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20' : 'bg-red-500/10 text-red-300 border-red-500/20'}`}>{status}: {count}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'snapshots' && (
                  <div className="space-y-2">
                    {results.recentSnapshots?.map((snap, i) => (
                      <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-blue-400" />
                          <span className="text-white text-sm">{snap.date}</span>
                          <span className={`px-2 py-0.5 text-xs rounded ${snap.status === '200' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{snap.status}</span>
                          <span className="text-xs text-slate-500">{snap.mimeType}</span>
                          <span className="text-xs text-slate-500">{snap.size}</span>
                        </div>
                        <a href={snap.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300"><ExternalLink className="w-4 h-4" /></a>
                      </div>
                    ))}
                    {(!results.recentSnapshots || results.recentSnapshots.length === 0) && <p className="text-slate-500 text-center py-8">No snapshots found</p>}
                  </div>
                )}
                {activeTab === 'timeline' && (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400 mb-4">Captures per year</p>
                    {Object.entries(results.yearlyBreakdown || {}).sort(([a], [b]) => a.localeCompare(b)).map(([year, count]) => (
                      <div key={year} className="flex items-center gap-3">
                        <span className="text-sm text-slate-300 w-16">{year}</span>
                        <div className="flex-1 bg-white/5 rounded-full h-4 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full"
                            style={{ width: `${Math.min(100, (count / Math.max(...Object.values(results.yearlyBreakdown || { 0: 1 }))) * 100)}%` }} />
                        </div>
                        <span className="text-sm text-blue-400 w-16 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Sources */}
                <div className="text-xs text-slate-600 flex items-center gap-2 mt-4">
                  <Info className="w-3 h-3" /> Sources: {results.dataSources?.join(', ')} • {results.searchDuration}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WaybackTool;
