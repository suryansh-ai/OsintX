import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Copy, Download, RefreshCw, Info, FileText, Mail, AlertTriangle, CheckCircle, Shield, Eye, Globe, ExternalLink } from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PasteSearchTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Paste Search', query: query });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [enrichedResults, setEnrichedResults] = useState(null);
  const [enriching, setEnriching] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 25 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5, speedX: (Math.random() - 0.5) * 0.3, speedY: (Math.random() - 0.5) * 0.3,
      color: ['#f97316', '#fb923c', '#f59e0b', '#fbbf24'][Math.floor(Math.random() * 4)],
    }));
    let id;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { ctx.beginPath(); ctx.fillStyle = p.color + '12'; ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); p.x += p.speedX; p.y += p.speedY; if (p.x < 0 || p.x > canvas.width) p.speedX *= -1; if (p.y < 0 || p.y > canvas.height) p.speedY *= -1; });
      id = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(id);
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) { toast.error('Enter an email or domain'); return; }
    trackToolUsage('paste', 'search', 'start');
    setIsSearching(true); setResults(null); onConsume?.(8);
    try {
      const resp = await fetch(`${API_BASE}/tools/paste/search`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || 'Search failed'); }
      const data = await resp.json();
      setResults(data);
      addToHistory('paste', query, data);
      toast.success(`Found ${data.totalLeaks || 0} leak records`);
      fetchEnriched(query.trim());
    } catch (err) { toast.error(err.message); }
    finally { setIsSearching(false); }
  };

  const fetchEnriched = async (q) => {
    if (!q) return;
    setEnriching(true);
    try {
      const resp = await fetch(`${API_BASE}/tools/paste/enriched`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setEnrichedResults(data);
      }
    } catch (e) { /* enrichment is non-critical */ }
    finally { setEnriching(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }} onClick={e => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-orange-950/10 to-slate-950 border border-orange-500/30 shadow-[0_0_100px_rgba(249,115,22,0.1)]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="relative z-10 flex flex-col max-h-[92vh]">
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30"><FileText className="w-6 h-6 text-orange-400" /></div>
              <div><h2 className="text-xl font-bold text-white">Paste & Leak Search</h2><p className="text-sm text-slate-400">Search stealer logs, breach pastes & email reputation</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div className="p-6 border-b border-white/5">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Mail className="absolute w-5 h-5 left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter email address or domain" className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-orange-500/50 focus:outline-none" />
              </div>
              <button onClick={handleSearch} disabled={isSearching}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {isSearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {isSearching && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                <p className="mt-4 text-slate-400">Searching leak databases & paste sites...</p>
              </div>
            )}
            {results && !isSearching && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10"><p className="text-sm text-slate-400">Total Leaks</p><p className="text-2xl font-bold text-orange-400">{results.totalLeaks || 0}</p></div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10"><p className="text-sm text-slate-400">Query Type</p>
                    <p className="text-lg font-bold text-blue-400">{results.queryType || 'N/A'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10"><p className="text-sm text-slate-400">Email Reputation</p>
                    <p className="text-lg font-bold text-blue-400">{results.emailReputation?.reputation || 'N/A'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10"><p className="text-sm text-slate-400">Domain Threats</p>
                    <p className="text-lg font-bold text-purple-400">{results.domainThreats?.totalUrls || 0}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {['overview', 'leaks', 'reputation', 'raw'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${activeTab === tab ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' : 'text-slate-400 hover:bg-white/5'}`}>
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => copy(JSON.stringify(results, null, 2))} className="p-2 rounded-lg hover:bg-white/10"><Copy className="w-4 h-4 text-slate-400" /></button>
                  <button onClick={() => exportToJSON(results, 'paste-results')} className="p-2 rounded-lg hover:bg-white/10"><Download className="w-4 h-4 text-slate-400" /></button>
                </div>
                {activeTab === 'overview' && (
                  <div className="space-y-3">
                    {results.leaks?.filter(l => l.source === 'Hudson Rock').length > 0 && (
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <p className="text-sm text-red-300 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Stealer Log Exposure</p>
                        <div className="space-y-2">{results.leaks.filter(l => l.source === 'Hudson Rock').map((s, i) => (
                          <div key={i} className="p-2 rounded-lg bg-black/30 text-sm">
                            <p className="text-white">{s.computer || 'Unknown Computer'}</p>
                            <p className="text-xs text-slate-500">OS: {s.os || 'N/A'} • Date: {s.date || 'N/A'}</p>
                          </div>
                        ))}</div>
                      </div>
                    )}
                    {results.leaks?.filter(l => l.source === 'HIBP Paste').length > 0 && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-sm text-slate-400 mb-2">Breach Pastes ({results.leaks.filter(l => l.source === 'HIBP Paste').length})</p>
                        <div className="space-y-2">{results.leaks.filter(l => l.source === 'HIBP Paste').slice(0, 10).map((p, i) => (
                          <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/10 flex justify-between text-sm">
                            <span className="text-white">{p.pasteSite || p.title || 'Unnamed Paste'}</span>
                            <span className="text-slate-500">{p.date || 'N/A'}</span>
                          </div>
                        ))}</div>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'leaks' && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {results.leaks?.length > 0 ? results.leaks.map((l, i) => (
                      <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-white font-medium">{l.source}</span>
                          <span className="text-xs text-slate-500">{l.type}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {l.computer && `Computer: ${l.computer} • `}
                          {l.title && `Title: ${l.title} • `}
                          {l.date && `Date: ${l.date}`}
                        </p>
                      </div>
                    )) : <p className="text-slate-500 text-center py-8">No leaks found</p>}
                  </div>
                )}
                {activeTab === 'reputation' && results.emailReputation && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(results.emailReputation).map(([k, v]) => (
                      <div key={k} className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-xs text-slate-500 capitalize">{k.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-white">{typeof v === 'boolean' ? (v ? '✓ Yes' : '✗ No') : String(v || 'N/A')}</p>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'raw' && (
                  <pre className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs text-green-400 font-mono overflow-auto max-h-96 whitespace-pre-wrap">{JSON.stringify(results, null, 2)}</pre>
                )}

                {/* ── Enrichment: Extended Paste Search ── */}
                {enrichedResults && !enriching && (
                  <div className="mt-6 space-y-4">
                    <h4 className="text-sm text-orange-400 font-medium uppercase tracking-wider flex items-center gap-2"><Globe className="w-4 h-4" />Extended Paste Search</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {/* PSBDMP */}
                      <div className={`p-4 rounded-xl border ${enrichedResults.psbdmp?.found ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase text-slate-400">PSBDMP</span>
                          {enrichedResults.psbdmp?.found && <span className="text-xs text-red-400 font-bold">{enrichedResults.psbdmp.total} found</span>}
                        </div>
                        {enrichedResults.psbdmp?.pastes?.slice(0, 5).map((p, i) => (
                          <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" className="block p-2 rounded-lg bg-white/5 mb-1 text-xs hover:bg-white/10">
                            <span className="text-white truncate block">{p.title || p.id}</span>
                            {p.snippet && <span className="text-slate-500 truncate block text-[10px]">{p.snippet.slice(0, 60)}...</span>}
                          </a>
                        )) || <p className="text-xs text-slate-500">No results</p>}
                      </div>
                      {/* Pastebin */}
                      <div className={`p-4 rounded-xl border ${enrichedResults.pastebin?.found ? 'bg-orange-500/10 border-orange-500/20' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase text-slate-400">Pastebin</span>
                          {enrichedResults.pastebin?.found && <span className="text-xs text-orange-400 font-bold">{enrichedResults.pastebin.total} found</span>}
                        </div>
                        {enrichedResults.pastebin?.pastes?.slice(0, 5).map((p, i) => (
                          <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" className="block p-2 rounded-lg bg-white/5 mb-1 text-xs hover:bg-white/10">
                            <span className="text-white truncate block">{p.title}</span>
                            <span className="text-slate-500 text-[10px]">{p.id}</span>
                          </a>
                        )) || <p className="text-xs text-slate-500">No results</p>}
                      </div>
                      {/* Rentry */}
                      <div className={`p-4 rounded-xl border ${enrichedResults.rentry?.found ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase text-slate-400">Rentry.co</span>
                          {enrichedResults.rentry?.found && <span className="text-xs text-emerald-400 font-bold">{enrichedResults.rentry.total} found</span>}
                        </div>
                        {enrichedResults.rentry?.pastes?.slice(0, 5).map((p, i) => (
                          <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" className="block p-2 rounded-lg bg-white/5 mb-1 text-xs hover:bg-white/10">
                            <span className="text-white truncate block">{p.title}</span>
                          </a>
                        )) || <p className="text-xs text-slate-500">No results</p>}
                      </div>
                      {/* Ghostbin */}
                      <div className={`p-4 rounded-xl border ${enrichedResults.ghostbin?.found ? 'bg-purple-500/10 border-purple-500/20' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase text-slate-400">Ghostbin</span>
                          {enrichedResults.ghostbin?.found && <span className="text-xs text-purple-400 font-bold">{enrichedResults.ghostbin.total} found</span>}
                        </div>
                        {enrichedResults.ghostbin?.pastes?.slice(0, 5).map((p, i) => (
                          <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" className="block p-2 rounded-lg bg-white/5 mb-1 text-xs hover:bg-white/10">
                            <span className="text-white truncate block">{p.id}</span>
                          </a>
                        )) || <p className="text-xs text-slate-500">No results</p>}
                      </div>
                      {/* Snipboard */}
                      <div className={`p-4 rounded-xl border ${enrichedResults.snipboard?.found ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase text-slate-400">Snipboard</span>
                          {enrichedResults.snipboard?.found && <span className="text-xs text-cyan-400 font-bold">{enrichedResults.snipboard.total} found</span>}
                        </div>
                        {enrichedResults.snipboard?.pastes?.slice(0, 5).map((p, i) => (
                          <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" className="block p-2 rounded-lg bg-white/5 mb-1 text-xs hover:bg-white/10">
                            <span className="text-white truncate block">{p.id}</span>
                          </a>
                        )) || <p className="text-xs text-slate-500">No results</p>}
                      </div>
                    </div>
                  </div>
                )}
                {enriching && (
                  <div className="flex items-center justify-center py-4 mt-4">
                    <RefreshCw className="w-5 h-5 text-orange-400 animate-spin" />
                    <span className="ml-2 text-sm text-slate-400">Searching additional paste sites...</span>
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

export default PasteSearchTool;
