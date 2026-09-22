import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Zap, Globe, Shield, CheckCircle, XCircle, ExternalLink,
  Copy, Download, RefreshCw, Code, Server, Lock, Eye, AlertTriangle, FileText, Activity
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';
import { exportToJSON } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const WebProfilerTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();

  const [url, setUrl] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Web Profiler', query: url });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [enrichment, setEnrichment] = useState(null);
  const [activeTab, setActiveTab] = useState('tech');
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 35 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5, speedX: (Math.random() - 0.5) * 0.3, speedY: (Math.random() - 0.5) * 0.3,
      color: ['#06b6d4', '#0ea5e9', '#3b82f6', '#8b5cf6'][Math.floor(Math.random() * 4)],
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

  useEffect(() => {
    if (!results?.url) return;
    const controller = new AbortController();
    fetch(`${API_BASE}/tools/webprofiler/enriched`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: results.url }),
      signal: controller.signal,
    }).then(r => r.json()).then(d => setEnrichment(d)).catch(() => {});
    const timer = setTimeout(() => controller.abort(), 30000);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [results]);

  const handleSearch = async () => {
    if (!url.trim()) { toast.error('Enter a URL'); return; }
    trackToolUsage('webprofiler', 'analyze', 'start');
    setIsSearching(true); setResults(null); setEnrichment(null); onConsume?.(12);
    try {
      const resp = await fetchWithTimeout(`${API_BASE}/tools/webprofiler/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || 'Analysis failed'); }
      const data = await resp.json();
      setResults(data); setActiveTab('tech');
      addToHistory('webprofiler', url, data);
      toast.success(`Detected ${data.techCount} technologies!`);
      trackToolUsage('webprofiler', 'analyze', 'success');
    } catch (err) { toast.error(err.message); trackToolUsage('webprofiler', 'analyze', 'error'); }
    finally { setIsSearching(false); }
  };

  const tabs = [
    { id: 'tech', label: 'Technologies', icon: Code },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'headers', label: 'Headers', icon: Server },
    { id: 'files', label: 'Files', icon: FileText },
    { id: 'cms', label: 'CMS', icon: Globe },
    { id: 'jsdetect', label: 'JS Detection', icon: Code },
    { id: 'cookies', label: 'Cookie Audit', icon: Lock },
    { id: 'csp', label: 'CSP Grade', icon: Shield },
    { id: 'perf', label: 'Performance', icon: Activity },
  ];

  const gradeColors = { A: 'text-emerald-400', B: 'text-blue-400', C: 'text-amber-400', D: 'text-red-400' };

  const techCategoryGroups = {};
  results?.technologies?.forEach(t => {
    if (!techCategoryGroups[t.category]) techCategoryGroups[t.category] = [];
    techCategoryGroups[t.category].push(t);
  });

  const csp = enrichment?.cspAnalysis || {};
  const perf = enrichment?.performance || {};
  const carbon = enrichment?.carbon || {};
  const cmsFp = enrichment?.cmsFingerprint || {};
  const jsDetect = enrichment?.jsDetect || {};
  const cookieAudit = enrichment?.cookieAudit || {};

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }} onClick={e => e.stopPropagation()}
        className="relative w-full max-w-7xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-cyan-950/20 to-slate-950 border border-cyan-500/30 shadow-[0_0_100px_rgba(6,182,212,0.1)]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Header */}
        <div className="relative px-3 sm:px-6 py-3 sm:py-5 border-b border-cyan-500/20 bg-slate-950/60 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-5 min-w-0 flex-1">
              <motion.div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center bg-gradient-to-br from-cyan-600 to-blue-600 shadow-lg">
                <Code className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </motion.div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span className="truncate">Web Profiler</span>
                  <span className="px-2 py-0.5 text-[10px] sm:text-xs bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30">Tech Detect</span>
                </h2>
                <p className="text-xs sm:text-sm text-cyan-300/70 truncate">Website technology & security analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => { setUrl(''); setResults(null); setEnrichment(null); }} className="p-2 rounded-lg bg-white/5 hover:bg-cyan-500/20 border border-white/10 transition-all"><RefreshCw className="w-4 h-4 text-cyan-400" /></motion.button>
              <motion.button whileHover={{ scale: 1.05 }} disabled={!results} onClick={() => { if (results) { exportToJSON(results, `webprofiler_${results.domain}_${Date.now()}.json`); toast.success('Exported'); } }} className="hidden sm:flex p-2 rounded-lg bg-white/5 hover:bg-emerald-500/20 border border-white/10 transition-all disabled:opacity-50"><Download className="w-4 h-4 text-emerald-400" /></motion.button>
              <div className="hidden sm:flex px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /><span className="text-lg font-bold text-amber-300">12</span><span className="text-xs text-amber-200/70">credits</span></div>
              <motion.button whileHover={{ scale: 1.1, rotate: 90 }} onClick={onClose} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 transition-all"><X className="w-4 h-4 text-gray-400" /></motion.button>
            </div>
          </div>
        </div>

        <div className="relative p-3 sm:p-6 overflow-y-auto max-h-[calc(92vh-80px)]">
          {/* Search */}
          <div className="mb-5 p-3 sm:p-6 rounded-2xl bg-slate-900/60 border border-cyan-500/20 backdrop-blur-sm">
            <label className="text-cyan-300 text-xs sm:text-sm font-medium mb-2 flex items-center gap-2"><Globe className="w-4 h-4" />Target Website URL</label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-2">
              <div className="flex-1 relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="example.com" onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl bg-slate-800/80 border-2 border-cyan-500/30 text-white text-sm sm:text-lg placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-all" />
              </div>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleSearch} disabled={isSearching || !url.trim()}
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg">
                {isSearching ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Search className="w-5 h-5" /></motion.div> : <Search className="w-5 h-5" />}
                <span>{isSearching ? 'Profiling...' : 'Profile'}</span>
              </motion.button>
            </div>
          </div>

          <AnimatePresence>
            {results && (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                {/* Site Overview */}
                <div className="mb-5 p-5 rounded-2xl bg-gradient-to-r from-slate-900/80 via-cyan-900/10 to-slate-900/80 border border-cyan-500/20">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-bold text-white truncate">{results.title || results.domain}</h3>
                      <p className="text-gray-400 text-sm truncate">{results.url}</p>
                      {results.description && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{results.description}</p>}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-cyan-400">{results.techCount}</div>
                        <div className="text-xs text-gray-400">Technologies</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${gradeColors[results.securityScore?.grade] || 'text-gray-400'}`}>{results.securityScore?.grade}</div>
                        <div className="text-xs text-gray-400">Security</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-emerald-400">{results.ssl?.enabled ? '🔒 HTTPS' : '⚠️ HTTP'}</div>
                        <div className="text-xs text-gray-400">SSL</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-4 p-1 rounded-xl bg-slate-900/60 border border-cyan-500/10 overflow-x-auto">
                  {tabs.map(tab => (
                    <motion.button key={tab.id} whileHover={{ scale: 1.02 }} onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                      <tab.icon className="w-4 h-4" />{tab.label}
                    </motion.button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {activeTab === 'tech' && (
                    <motion.div key="tech" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                      {Object.entries(techCategoryGroups).map(([cat, techs]) => (
                        <div key={cat} className="p-4 rounded-2xl bg-slate-900/60 border border-cyan-500/10">
                          <h4 className="text-cyan-300 font-semibold mb-3 text-sm">{cat}</h4>
                          <div className="flex flex-wrap gap-2">
                            {techs.map((t, i) => (
                              <span key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm">
                                <Code className="w-3 h-3" />{t.name}{t.version && <span className="text-xs text-cyan-400/60">{t.version}</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                      {results.techCount === 0 && <div className="p-8 text-center text-gray-500">No technologies detected. Site may use server-side rendering without fingerprints.</div>}
                    </motion.div>
                  )}

                  {activeTab === 'security' && (
                    <motion.div key="security" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div className="p-5 rounded-2xl bg-slate-900/60 border border-cyan-500/10">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-cyan-300 font-semibold flex items-center gap-2"><Shield className="w-5 h-5" />Security Headers ({results.securityScore?.score}/{results.securityScore?.total})</h4>
                          <span className={`text-2xl font-bold ${gradeColors[results.securityScore?.grade]}`}>Grade: {results.securityScore?.grade}</span>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(results.securityHeaders || {}).map(([header, info]) => (
                            <div key={header} className={`flex items-start gap-3 p-3 rounded-xl border ${info.present ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                              {info.present ? <CheckCircle className="w-4 h-4 text-emerald-400 mt-1 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />}
                              <div className="flex-1 min-w-0">
                                <div className="text-white text-sm font-medium">{header}</div>
                                {info.value && <div className="text-gray-400 text-xs font-mono truncate mt-0.5">{info.value}</div>}
                                {!info.present && <div className="text-red-400/70 text-xs mt-0.5">Missing — severity: {info.severity}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'headers' && (
                    <motion.div key="headers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div className="p-5 rounded-2xl bg-slate-900/60 border border-cyan-500/10">
                        <h4 className="text-cyan-300 font-semibold mb-3 flex items-center gap-2"><Server className="w-5 h-5" />Response Headers</h4>
                        <div className="space-y-1 max-h-96 overflow-y-auto">
                          {Object.entries(results.serverHeaders || {}).map(([key, val]) => (
                            <div key={key} className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/5 group">
                              <span className="text-cyan-400 text-xs font-mono w-48 flex-shrink-0 break-all">{key}</span>
                              <span className="text-gray-300 text-xs font-mono break-all flex-1">{val}</span>
                              <motion.button whileTap={{ scale: 0.9 }} onClick={() => { copy(`${key}: ${val}`); toast.success('Copied'); }} className="opacity-0 group-hover:opacity-100 p-1">
                                <Copy className="w-3 h-3 text-gray-500" />
                              </motion.button>
                            </div>
                          ))}
                        </div>
                      </div>
                      {results.ipAddresses?.length > 0 && (
                        <div className="mt-4 p-4 rounded-2xl bg-slate-900/60 border border-cyan-500/10">
                          <h4 className="text-cyan-300 font-semibold mb-2 text-sm">IP Addresses</h4>
                          <div className="flex flex-wrap gap-2">
                            {results.ipAddresses.map((ip, i) => (
                              <span key={i} className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-mono border border-blue-500/20">{ip}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'files' && (
                    <motion.div key="files" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                      <div className={`p-4 rounded-2xl border ${results.robots?.found ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-900/60 border-gray-500/20'}`}>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">{results.robots?.found ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-gray-400" />}<span className="text-white">robots.txt</span></h4>
                        {results.robots?.found ? <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto bg-slate-800/60 p-3 rounded-lg">{results.robots.content}</pre> : <p className="text-gray-500 text-sm">Not found</p>}
                      </div>
                      <div className={`p-4 rounded-2xl border ${results.securityTxt?.found ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-900/60 border-gray-500/20'}`}>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">{results.securityTxt?.found ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-gray-400" />}<span className="text-white">security.txt</span></h4>
                        {results.securityTxt?.found ? <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto bg-slate-800/60 p-3 rounded-lg">{results.securityTxt.content}</pre> : <p className="text-gray-500 text-sm">Not found</p>}
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-900/60 border border-gray-500/20">
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><span className={results.hasFavicon ? 'text-emerald-400' : 'text-gray-400'}>{results.hasFavicon ? '✓' : '✗'}</span><span className="text-white">favicon.ico</span></h4>
                        <p className="text-gray-500 text-sm">{results.hasFavicon ? 'Present' : 'Not found'}</p>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'cms' && (
                    <motion.div key="cms" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div className="p-5 rounded-2xl bg-slate-900/60 border border-cyan-500/10">
                        <h4 className="text-cyan-300 font-semibold mb-3 flex items-center gap-2"><Globe className="w-5 h-5" />CMS Fingerprinting</h4>
                        <div className="mb-3">
                          <p className="text-gray-400 text-sm">Detected CMS: <span className="text-white font-bold">{cmsFp.cms || 'None detected'}</span></p>
                          {cmsFp.confidence > 0 && <div className="mt-2"><div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${cmsFp.confidence}%` }} className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" /></div><p className="text-xs text-gray-500 mt-1">{cmsFp.confidence}% confidence</p></div>}
                        </div>
                        {cmsFp.adminUrls?.length > 0 && <div><p className="text-gray-400 text-sm mb-1">Admin URLs found:</p><div className="space-y-1">{cmsFp.adminUrls.map((u, i) => <div key={i} className="text-xs text-cyan-400 font-mono truncate bg-slate-800/60 p-2 rounded-lg">{u}</div>)}</div></div>}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'jsdetect' && (
                    <motion.div key="jsdetect" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div className="p-5 rounded-2xl bg-slate-900/60 border border-cyan-500/10">
                        <h4 className="text-cyan-300 font-semibold mb-3 flex items-center gap-2"><Code className="w-5 h-5" />JavaScript Frameworks Detected ({jsDetect.frameworks?.length || 0})</h4>
                        {jsDetect.frameworks?.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{jsDetect.frameworks.map((fw, i) => (
                            <div key={i} className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                              <p className="text-white font-medium text-sm">{fw.name}</p>
                              <p className="text-xs text-cyan-400/70">{fw.category}</p>
                            </div>
                          ))}</div>
                        ) : <p className="text-gray-500 text-sm">No JavaScript frameworks detected</p>}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'cookies' && (
                    <motion.div key="cookies" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div className="p-5 rounded-2xl bg-slate-900/60 border border-cyan-500/10">
                        <h4 className="text-cyan-300 font-semibold mb-3 flex items-center gap-2"><Lock className="w-5 h-5" />Cookie Security Audit</h4>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center"><p className="text-2xl font-bold text-emerald-400">{cookieAudit.secureCookies || 0}</p><p className="text-xs text-gray-400">Secure</p></div>
                          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center"><p className="text-2xl font-bold text-blue-400">{cookieAudit.httpOnlyCookies || 0}</p><p className="text-xs text-gray-400">HttpOnly</p></div>
                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center"><p className="text-2xl font-bold text-amber-400">{cookieAudit.sameSiteCookies || 0}</p><p className="text-xs text-gray-400">SameSite</p></div>
                        </div>
                        {cookieAudit.issues?.length > 0 && (
                          <div><p className="text-red-400 text-sm font-medium mb-2">Issues ({cookieAudit.issues.length})</p><div className="space-y-1">{cookieAudit.issues.slice(0, 10).map((iss, i) => (
                            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/20"><XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" /><div><p className="text-xs text-white">{iss.cookie || 'Unknown'}</p><p className="text-xs text-red-400/70">{iss.issue}</p></div></div>
                          ))}</div></div>
                        )}
                        {(!cookieAudit.issues || cookieAudit.issues.length === 0) && <p className="text-emerald-400 text-sm">No cookie issues found</p>}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'csp' && (
                    <motion.div key="csp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div className="p-5 rounded-2xl bg-slate-900/60 border border-cyan-500/10">
                        <h4 className="text-cyan-300 font-semibold mb-3 flex items-center gap-2"><Shield className="w-5 h-5" />Content Security Policy Analysis</h4>
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`text-5xl font-bold ${csp.grade === 'A' ? 'text-emerald-400' : csp.grade === 'B' ? 'text-blue-400' : csp.grade === 'C' ? 'text-amber-400' : csp.grade === 'D' ? 'text-orange-400' : 'text-red-400'}`}>{csp.grade || 'N/A'}</div>
                          <div><p className="text-white text-sm">{csp.present ? 'CSP is configured' : 'No CSP header found'}</p><p className="text-xs text-gray-400">Grade based on directives, unsafe-* usage, and coverage</p></div>
                        </div>
                        {csp.issues?.length > 0 && <div><p className="text-red-400 text-sm font-medium mb-2">CSP Issues ({csp.issues.length})</p><div className="space-y-1">{csp.issues.map((issue, i) => <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/20"><AlertTriangle className="w-3 h-3 text-red-400" /><span className="text-xs text-red-300">{issue}</span></div>)}</div></div>}
                        {csp.directives && Object.keys(csp.directives).length > 0 && <div className="mt-4"><p className="text-gray-400 text-sm mb-2">Directives</p><div className="space-y-1">{Object.entries(csp.directives).map(([dir, vals]) => <div key={dir} className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/60"><span className="text-cyan-400 text-xs font-mono">{dir}</span><span className="text-gray-400 text-xs font-mono">{vals.join(' ')}</span></div>)}</div></div>}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'perf' && (
                    <motion.div key="perf" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div className="p-5 rounded-2xl bg-slate-900/60 border border-cyan-500/10">
                        <h4 className="text-cyan-300 font-semibold mb-3 flex items-center gap-2"><Activity className="w-5 h-5" />Performance & Carbon Audit</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                          {perf.dnsTime != null && <div className="p-3 rounded-xl bg-slate-800/60 border border-white/10 text-center"><p className="text-lg font-bold text-cyan-400">{perf.dnsTime}ms</p><p className="text-xs text-gray-400">DNS</p></div>}
                          {perf.connectTime != null && <div className="p-3 rounded-xl bg-slate-800/60 border border-white/10 text-center"><p className="text-lg font-bold text-cyan-400">{perf.connectTime}ms</p><p className="text-xs text-gray-400">Connect</p></div>}
                          {perf.sslTime != null && <div className="p-3 rounded-xl bg-slate-800/60 border border-white/10 text-center"><p className="text-lg font-bold text-cyan-400">{perf.sslTime}ms</p><p className="text-xs text-gray-400">SSL</p></div>}
                          {perf.ttfb != null && <div className="p-3 rounded-xl bg-slate-800/60 border border-white/10 text-center"><p className="text-lg font-bold text-amber-400">{perf.ttfb}ms</p><p className="text-xs text-gray-400">TTFB</p></div>}
                          {perf.totalTime != null && <div className="p-3 rounded-xl bg-slate-800/60 border border-white/10 text-center"><p className="text-lg font-bold text-amber-400">{perf.totalTime}ms</p><p className="text-xs text-gray-400">Total</p></div>}
                          {perf.pageSize != null && <div className="p-3 rounded-xl bg-slate-800/60 border border-white/10 text-center"><p className="text-lg font-bold text-emerald-400">{(perf.pageSize / 1024).toFixed(1)}KB</p><p className="text-xs text-gray-400">Page Size</p></div>}
                        </div>
                        {carbon.co2grams != null && (
                          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"><h5 className="text-emerald-400 font-medium text-sm mb-2">Carbon Footprint</h5><div className="grid grid-cols-3 gap-3"><div className="text-center"><p className="text-lg font-bold text-emerald-400">{(carbon.co2grams * 1000).toFixed(2)}mg</p><p className="text-xs text-gray-400">CO2</p></div><div className="text-center"><p className="text-lg font-bold text-emerald-400">{carbon.rating || 'N/A'}</p><p className="text-xs text-gray-400">Rating</p></div><div className="text-center"><p className="text-lg font-bold text-emerald-400">{carbon.treesEquivalent != null ? carbon.treesEquivalent.toFixed(6) : 'N/A'}</p><p className="text-xs text-gray-400">Tree equiv</p></div></div></div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {!results && !isSearching && (
            <div className="flex flex-col items-center justify-center py-16">
              <Code className="w-16 h-16 text-cyan-500/30 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Website Technology Profiler</h3>
              <p className="text-gray-400 text-center max-w-md text-sm">Detect CMS, frameworks, JavaScript libraries, web servers, CDNs, analytics, security headers, and more.</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WebProfilerTool;
