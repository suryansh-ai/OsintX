import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Copy, Download, RefreshCw, Info, Shield, AlertTriangle, User, Globe, Calendar, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const InterpolNoticesTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Interpol Notices', query: name });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [expanded, setExpanded] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5, speedX: (Math.random() - 0.5) * 0.3, speedY: (Math.random() - 0.5) * 0.3,
      color: ['#ef4444', '#dc2626', '#b91c1c', '#f97316'][Math.floor(Math.random() * 4)],
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
    if (!name.trim() && !nationality.trim()) { toast.error('Enter a name or nationality'); return; }
    trackToolUsage('interpol', 'search', 'start');
    setIsSearching(true); setResults(null); setExpanded(null); onConsume?.(15);
    try {
      const resp = await fetch(`${API_BASE}/tools/interpol/search`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), nationality: nationality.trim() }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || 'Search failed'); }
      const data = await resp.json();
      setResults(data);
      addToHistory('interpol', name || nationality, data);
      toast.success(`Found ${data.totalResults} Red Notice(s)`);
    } catch (err) { toast.error(err.message); }
    finally { setIsSearching(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }} onClick={e => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-red-950/10 to-slate-950 border border-red-500/30 shadow-[0_0_100px_rgba(239,68,68,0.1)]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="relative z-10 flex flex-col max-h-[92vh]">
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30"><Shield className="w-6 h-6 text-red-400" /></div>
              <div><h2 className="text-xl font-bold text-white">Interpol Red Notices</h2><p className="text-sm text-slate-400">Search international wanted persons database</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div className="p-6 border-b border-white/5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <User className="absolute w-5 h-5 left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Name (e.g. John Smith)" className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-red-500/50 focus:outline-none" />
              </div>
              <div className="relative w-full sm:w-48">
                <Globe className="absolute w-5 h-5 left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={nationality} onChange={e => setNationality(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Country (e.g. US)" className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-red-500/50 focus:outline-none" />
              </div>
              <button onClick={handleSearch} disabled={isSearching}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {isSearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {isSearching && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                <p className="mt-4 text-slate-400">Querying Interpol database...</p>
              </div>
            )}
            {results && !isSearching && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-sm text-slate-400">Total Red Notices Found</p>
                  <p className="text-3xl font-bold text-red-400">{results.totalResults}</p>
                </div>
                <div className="space-y-3">
                  {results.notices?.map((notice, i) => (
                    <div key={notice.entityId || i} className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                      <button onClick={() => setExpanded(expanded === i ? null : i)} className="w-full p-4 flex items-center gap-4 text-left hover:bg-white/5">
                        {notice.thumbnail && <img src={notice.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover border border-white/10" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold">{notice.name}</p>
                          <p className="text-xs text-slate-400">
                            {notice.dateOfBirth && <span className="mr-3"><Calendar className="w-3 h-3 inline mr-1" />{notice.dateOfBirth}</span>}
                            {notice.nationalities?.length > 0 && <span><Globe className="w-3 h-3 inline mr-1" />{notice.nationalities.join(', ')}</span>}
                          </p>
                        </div>
                        {notice.arrestWarrants?.length > 0 && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-300 border border-red-500/30 flex-shrink-0">
                            <AlertTriangle className="w-3 h-3 inline mr-1" />{notice.arrestWarrants.length} warrant(s)
                          </span>
                        )}
                        {expanded === i ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                      </button>
                      {expanded === i && (
                        <div className="px-4 pb-4 border-t border-white/5 pt-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                            <div><p className="text-slate-500">Sex</p><p className="text-white">{notice.sex || 'N/A'}</p></div>
                            <div><p className="text-slate-500">Eye Color</p><p className="text-white">{notice.eyeColor || 'N/A'}</p></div>
                            <div><p className="text-slate-500">Hair Color</p><p className="text-white">{notice.hairColor || 'N/A'}</p></div>
                            <div><p className="text-slate-500">Height</p><p className="text-white">{notice.height ? `${notice.height}m` : 'N/A'}</p></div>
                          </div>
                          {notice.placeOfBirth && <p className="text-xs text-slate-400 mb-1">Place of Birth: {notice.placeOfBirth}</p>}
                          {notice.languages?.length > 0 && <p className="text-xs text-slate-400 mb-1">Languages: {notice.languages.join(', ')}</p>}
                          {notice.distinguishingMarks && <p className="text-xs text-slate-400 mb-1">Marks: {notice.distinguishingMarks}</p>}
                          {notice.arrestWarrants?.map((w, j) => (
                            <div key={j} className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs">
                              <p className="text-red-300 font-medium">Charge: {w.charge}</p>
                              <p className="text-slate-400">Issuing Country: {w.issuingCountry}</p>
                            </div>
                          ))}
                          {notice.detailUrl && <a href={notice.detailUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300"><ExternalLink className="w-3 h-3" /> Full Notice</a>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => copy(JSON.stringify(results, null, 2))} className="p-2 rounded-lg hover:bg-white/10"><Copy className="w-4 h-4 text-slate-400" /></button>
                  <button onClick={() => exportToJSON(results, 'interpol-results')} className="p-2 rounded-lg hover:bg-white/10"><Download className="w-4 h-4 text-slate-400" /></button>
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

export default InterpolNoticesTool;
