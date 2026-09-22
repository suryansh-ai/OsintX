import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Copy, Download, RefreshCw, Info, Globe, Shield, Server, Mail, Lock, Eye, CheckCircle, AlertTriangle, Wifi } from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const catColors = {
  'JavaScript Frameworks': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'CSS Frameworks': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'CMS': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'CDN': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'Analytics': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Server': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Security': 'bg-red-500/20 text-red-300 border-red-500/30',
  'Fonts': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Email': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
};

const TechDetectorTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Tech Detector', query: query });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [activeTab, setActiveTab] = useState('technologies');
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5, speedX: (Math.random() - 0.5) * 0.3, speedY: (Math.random() - 0.5) * 0.3,
      color: ['#06b6d4', '#22d3ee', '#0ea5e9', '#38bdf8'][Math.floor(Math.random() * 4)],
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
    if (!query.trim()) { toast.error('Enter a domain or URL'); return; }
    trackToolUsage('techdetect', 'analyze', 'start');
    setIsSearching(true); setResults(null); onConsume?.(10);
    try {
      const resp = await fetch(`${API_BASE}/tools/techdetect/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: query.trim() }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || 'Analysis failed'); }
      const data = await resp.json();
      setResults(data);
      addToHistory('techdetect', query, data);
      toast.success(`Detected ${data.totalTechnologies} technologies`);
    } catch (err) { toast.error(err.message); }
    finally { setIsSearching(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }} onClick={e => e.stopPropagation()}
        className="relative w-full max-w-7xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-cyan-950/10 to-slate-950 border border-cyan-500/30 shadow-[0_0_100px_rgba(6,182,212,0.1)]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="relative z-10 flex flex-col max-h-[92vh]">
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30"><Wifi className="w-6 h-6 text-cyan-400" /></div>
              <div><h2 className="text-xl font-bold text-white">Technology Detector</h2><p className="text-sm text-slate-400">Detect web technologies, frameworks & security features</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div className="p-6 border-b border-white/5">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Globe className="absolute w-5 h-5 left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter domain or URL (e.g. github.com)" className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none" />
              </div>
              <button onClick={handleSearch} disabled={isSearching}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {isSearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {isSearching ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {isSearching && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                <p className="mt-4 text-slate-400">Analyzing website technologies...</p>
              </div>
            )}
            {results && !isSearching && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10"><p className="text-sm text-slate-400">Technologies</p><p className="text-2xl font-bold text-cyan-400">{results.totalTechnologies}</p></div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10"><p className="text-sm text-slate-400">Server</p><p className="text-lg font-bold text-blue-400">{results.technologies?.find(t => t.category === 'Web Server')?.name || 'Unknown'}</p></div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10"><p className="text-sm text-slate-400">Security Features</p>
                    <p className="text-2xl font-bold text-green-400">{results.securityFeatures?.length || 0}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10"><p className="text-sm text-slate-400">Email Services</p><p className="text-lg font-bold text-purple-400">{results.emailServices?.length || 0}</p></div>
                </div>
                <div className="flex gap-2">
                  {['technologies', 'security', 'server', 'raw'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${activeTab === tab ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:bg-white/5'}`}>
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => copy(JSON.stringify(results, null, 2))} className="p-2 rounded-lg hover:bg-white/10"><Copy className="w-4 h-4 text-slate-400" /></button>
                  <button onClick={() => exportToJSON(results, 'techdetect-results')} className="p-2 rounded-lg hover:bg-white/10"><Download className="w-4 h-4 text-slate-400" /></button>
                </div>
                {activeTab === 'technologies' && (
                  <div className="space-y-4">
                    {results.technologies && (() => {
                      const grouped = {};
                      results.technologies.forEach(t => { if (!grouped[t.category]) grouped[t.category] = []; grouped[t.category].push(t.name); });
                      return Object.entries(grouped).map(([category, techs]) => (
                        <div key={category} className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <p className="text-sm text-slate-400 mb-2 capitalize">{category}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {techs.map((t, i) => (
                              <span key={i} className={`px-3 py-1 text-sm rounded-lg border ${catColors[category] || 'bg-white/10 text-white border-white/20'}`}>{t}</span>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
                {activeTab === 'security' && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-sm text-slate-400 mb-3">Security Features</p>
                      <div className="flex flex-wrap gap-2">
                        {results.securityFeatures?.length > 0 ? results.securityFeatures.map((f, i) => (
                          <span key={i} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/15 text-green-300 border border-green-500/30 text-sm">
                            <CheckCircle className="w-3.5 h-3.5" /> {f}
                          </span>
                        )) : <p className="text-slate-500">No security features detected</p>}
                      </div>
                    </div>
                    {['SPF', 'DKIM', 'DMARC'].map(feat => (
                      <div key={feat} className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                        {results.securityFeatures?.includes(feat) ? <CheckCircle className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
                        <span className="text-sm text-white">{feat}</span>
                        <span className={`text-xs ${results.securityFeatures?.includes(feat) ? 'text-green-400' : 'text-red-400'}`}>
                          {results.securityFeatures?.includes(feat) ? 'Configured' : 'Not Found'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'server' && (
                  <div className="space-y-3">
                    {results.dns && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-sm text-slate-400 mb-2">DNS Records</p>
                        <div className="space-y-2 text-sm">
                          {results.dns.ipAddresses?.length > 0 && <div><span className="text-slate-500">A Records: </span><span className="text-white font-mono">{results.dns.ipAddresses.join(', ')}</span></div>}
                          {results.dns.nameservers?.length > 0 && <div><span className="text-slate-500">NS Records: </span><span className="text-white">{results.dns.nameservers.join(', ')}</span></div>}
                        </div>
                      </div>
                    )}
                    {results.shodanPorts?.length > 0 && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-sm text-slate-400 mb-2">Open Ports (Shodan)</p>
                        <div className="flex flex-wrap gap-1.5">{results.shodanPorts.map((p, i) => <span key={i} className="px-2 py-0.5 text-xs rounded bg-purple-500/20 text-purple-300">{p}</span>)}</div>
                      </div>
                    )}
                    {results.shodanCPEs?.length > 0 && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-sm text-slate-400 mb-2">CPEs (Shodan)</p>
                        <div className="flex flex-wrap gap-1.5">{results.shodanCPEs.map((c, i) => <span key={i} className="px-2 py-0.5 text-xs rounded bg-cyan-500/20 text-cyan-300 font-mono">{c}</span>)}</div>
                      </div>
                    )}
                    {results.emailServices?.length > 0 && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-sm text-slate-400 mb-2">Email Services</p>
                        <div className="flex flex-wrap gap-1.5">{results.emailServices.map((s, i) => <span key={i} className="px-2 py-0.5 text-xs rounded bg-indigo-500/20 text-indigo-300">{s}</span>)}</div>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'raw' && (
                  <pre className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs text-green-400 font-mono overflow-auto max-h-96 whitespace-pre-wrap">{JSON.stringify(results, null, 2)}</pre>
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

export default TechDetectorTool;
