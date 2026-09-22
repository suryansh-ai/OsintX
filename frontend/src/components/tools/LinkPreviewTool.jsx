import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Copy, Download, RefreshCw, Info, Link, Globe, Image, User, FileText, Tag } from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const LinkPreviewTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Link Preview', query: query });
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
      color: ['#8b5cf6', '#a78bfa', '#7c3aed', '#c084fc'][Math.floor(Math.random() * 4)],
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
    if (!query.trim()) { toast.error('Enter a URL'); return; }
    trackToolUsage('linkpreview', 'analyze', 'start');
    setIsSearching(true); setResults(null); onConsume?.(5);
    try {
      const resp = await fetch(`${API_BASE}/tools/linkpreview/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: query.trim() }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || 'Analysis failed'); }
      const data = await resp.json();
      setResults(data);
      addToHistory('linkpreview', query, data);
      toast.success('URL metadata extracted!');
    } catch (err) { toast.error(err.message); }
    finally { setIsSearching(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }} onClick={e => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-violet-950/10 to-slate-950 border border-violet-500/30 shadow-[0_0_100px_rgba(139,92,246,0.1)]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="relative z-10 flex flex-col max-h-[92vh]">
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/30"><Link className="w-6 h-6 text-violet-400" /></div>
              <div><h2 className="text-xl font-bold text-white">Link Preview</h2><p className="text-sm text-slate-400">Extract metadata, OpenGraph & Twitter cards from URLs</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div className="p-6 border-b border-white/5">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Globe className="absolute w-5 h-5 left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter URL (e.g. https://example.com)" className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-violet-500/50 focus:outline-none" />
              </div>
              <button onClick={handleSearch} disabled={isSearching}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {isSearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {isSearching ? 'Analyzing...' : 'Preview'}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {isSearching && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                <p className="mt-4 text-slate-400">Extracting metadata...</p>
              </div>
            )}
            {results && !isSearching && (
              <div className="space-y-6">
                {/* Preview Card */}
                {results.combined && (
                  <div className="rounded-xl bg-white/5 border border-violet-500/20 overflow-hidden">
                    {results.combined.image && (
                      <div className="h-48 bg-slate-800 overflow-hidden">
                        <img src={results.combined.image} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                      </div>
                    )}
                    <div className="p-5">
                      <p className="text-xs text-violet-400 mb-1">{results.combined.siteName || results.combined.type}</p>
                      <h3 className="text-lg font-bold text-white mb-1">{results.combined.title || 'No Title'}</h3>
                      <p className="text-sm text-slate-400">{results.combined.description || 'No description available'}</p>
                      {results.combined.author && <p className="text-xs text-slate-500 mt-2 flex items-center gap-1"><User className="w-3 h-3" /> {results.combined.author}</p>}
                      {results.combined.keywords && <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Tag className="w-3 h-3" /> {results.combined.keywords}</p>}
                    </div>
                  </div>
                )}
                {/* OpenGraph Tags */}
                {results.metaTags && (
                  <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400 mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Meta & OpenGraph Tags</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {Object.entries(results.metaTags).filter(([,v]) => v).map(([key, value]) => (
                        <div key={key} className="flex items-start gap-2">
                          <span className="text-slate-500 flex-shrink-0 min-w-[120px] font-mono text-xs">{key}</span>
                          <span className="text-white text-xs break-all">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Microlink */}
                {results.microlink?.date && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400 mb-2">Microlink Enrichment</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><p className="text-slate-500">Publisher</p><p className="text-white">{results.microlink.publisher || 'N/A'}</p></div>
                      <div><p className="text-slate-500">Language</p><p className="text-white">{results.microlink.lang || 'N/A'}</p></div>
                      <div><p className="text-slate-500">Date</p><p className="text-white">{results.microlink.date || 'N/A'}</p></div>
                      <div><p className="text-slate-500">Author</p><p className="text-white">{results.microlink.author || 'N/A'}</p></div>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <button onClick={() => copy(JSON.stringify(results, null, 2))} className="p-2 rounded-lg hover:bg-white/10"><Copy className="w-4 h-4 text-slate-400" /></button>
                  <button onClick={() => exportToJSON(results, 'linkpreview-results')} className="p-2 rounded-lg hover:bg-white/10"><Download className="w-4 h-4 text-slate-400" /></button>
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

export default LinkPreviewTool;
