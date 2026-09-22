import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Zap, Shield, AlertTriangle, ExternalLink, Copy, Download,
  RefreshCw, Bug, ChevronRight, Clock, AlertCircle, CheckCircle, Info, Activity, Globe, Crosshair
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const severityColors = {
  CRITICAL: { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300 border-red-500/40' },
  HIGH: { bg: 'bg-orange-500/15', border: 'border-orange-500/30', text: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  MEDIUM: { bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  LOW: { bg: 'bg-blue-500/15', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  NONE: { bg: 'bg-gray-500/15', border: 'border-gray-500/30', text: 'text-gray-400', badge: 'bg-gray-500/20 text-gray-300 border-gray-500/40' },
};

const CVELookupTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'C V E Lookup', query: query });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [enrichment, setEnrichment] = useState(null);
  const [expandedCVE, setExpandedCVE] = useState(null);
  const [activeTab, setActiveTab] = useState('cves');
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5, speedX: (Math.random() - 0.5) * 0.3, speedY: (Math.random() - 0.5) * 0.3,
      color: ['#ef4444', '#f97316', '#eab308', '#22c55e'][Math.floor(Math.random() * 4)],
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

  useEffect(() => {
    if (!results?.vulnerabilities?.[0]?.id) return;
    const firstCve = results.vulnerabilities[0].id;
    if (!/^CVE-\d{4}-\d{4,}$/i.test(firstCve)) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    fetch(`${API_BASE}/tools/cve/enriched`, {
      signal: controller.signal,
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cveId: firstCve }),
    }).then(r => r.json()).then(d => setEnrichment(d)).catch(() => {});
    return () => { controller.abort(); clearTimeout(timer); };
  }, [results]);

  const handleSearch = async () => {
    if (!query.trim()) { toast.error('Enter a search query or CVE ID'); return; }
    trackToolUsage('cve', 'search', 'start');
    setIsSearching(true); setResults(null); setExpandedCVE(null); setEnrichment(null); onConsume?.(10);
    try {
      const resp = await fetchWithTimeout(`${API_BASE}/tools/cve/search`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || 'Search failed'); }
      const data = await resp.json();
      setResults(data);
      addToHistory('cve', query, data);
      toast.success(`Found ${data.totalResults} vulnerabilities!`);
      trackToolUsage('cve', 'search', 'success');
    } catch (err) { toast.error(err.message); trackToolUsage('cve', 'search', 'error'); }
    finally { setIsSearching(false); }
  };

  const enr = enrichment || {};
  const exploitdb = enr.exploitdb || {};
  const metasploit = enr.metasploit || {};
  const mitreAttack = enr.mitreAttack || {};
  const epss = enr.epss || {};

  const tabs = [
    { id: 'cves', label: 'CVEs', icon: Bug },
    { id: 'exploits', label: 'Exploit-DB', icon: Crosshair },
    { id: 'metasploit', label: 'Metasploit', icon: Shield },
    { id: 'mitre', label: 'ATT&CK', icon: Activity },
    { id: 'epss', label: 'EPSS Score', icon: AlertTriangle },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }} onClick={e => e.stopPropagation()}
        className="relative w-full max-w-7xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-red-950/10 to-slate-950 border border-red-500/30 shadow-[0_0_100px_rgba(239,68,68,0.1)]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Header */}
        <div className="relative px-3 sm:px-6 py-3 sm:py-5 border-b border-red-500/20 bg-slate-950/60 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-5 min-w-0 flex-1">
              <motion.div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center bg-gradient-to-br from-red-600 to-orange-600 shadow-lg">
                <Bug className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </motion.div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span className="truncate">CVE Lookup</span>
                  <span className="px-2 py-0.5 text-[10px] sm:text-xs bg-red-500/20 text-red-300 rounded-full border border-red-500/30">NVD + Enrichment</span>
                </h2>
                <p className="text-xs sm:text-sm text-red-300/70 truncate">NVD, Exploit-DB, Metasploit, MITRE ATT&CK, EPSS</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => { setQuery(''); setResults(null); setEnrichment(null); }} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 transition-all"><RefreshCw className="w-4 h-4 text-red-400" /></motion.button>
              <motion.button whileHover={{ scale: 1.05 }} disabled={!results} onClick={() => { if (results) { exportToJSON({ ...results, enrichment }, `cve_${query}_${Date.now()}.json`); toast.success('Exported'); } }} className="hidden sm:flex p-2 rounded-lg bg-white/5 hover:bg-emerald-500/20 border border-white/10 transition-all disabled:opacity-50"><Download className="w-4 h-4 text-emerald-400" /></motion.button>
              <div className="hidden sm:flex px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /><span className="text-lg font-bold text-amber-300">10</span><span className="text-xs text-amber-200/70">credits</span></div>
              <motion.button whileHover={{ scale: 1.1, rotate: 90 }} onClick={onClose} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 transition-all"><X className="w-4 h-4 text-gray-400" /></motion.button>
            </div>
          </div>
        </div>

        <div className="relative p-3 sm:p-6 overflow-y-auto max-h-[calc(92vh-80px)]">
          {/* Search */}
          <div className="mb-5 p-3 sm:p-6 rounded-2xl bg-slate-900/60 border border-red-500/20 backdrop-blur-sm">
            <label className="text-red-300 text-xs sm:text-sm font-medium mb-2 flex items-center gap-2"><Bug className="w-4 h-4" />Search CVEs (ID, keyword, or product)</label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400" />
                <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="CVE-2024-1234 or apache log4j" onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl bg-slate-800/80 border-2 border-red-500/30 text-white text-sm sm:text-lg placeholder-gray-500 focus:outline-none focus:border-red-400 transition-all" />
              </div>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleSearch} disabled={isSearching || !query.trim()}
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg">
                {isSearching ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Search className="w-5 h-5" /></motion.div> : <Search className="w-5 h-5" />}
                <span>{isSearching ? 'Searching...' : 'Search'}</span>
              </motion.button>
            </div>
          </div>

          <AnimatePresence>
            {results && (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                {/* Stats + tabs */}
                <div className="mb-5 grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-gray-500/20 text-center">
                    <div className="text-xl font-bold text-white">{results.totalResults}</div>
                    <div className="text-xs text-gray-400">Total CVEs</div>
                  </div>
                  {Object.entries(results.severityBreakdown || {}).map(([sev, count]) => (
                    <div key={sev} className={`p-3 rounded-xl ${severityColors[sev]?.bg} border ${severityColors[sev]?.border} text-center`}>
                      <div className={`text-xl font-bold ${severityColors[sev]?.text}`}>{count}</div>
                      <div className="text-xs text-gray-400">{sev}</div>
                    </div>
                  ))}
                </div>

                {(results.knownExploitedCount > 0 || results.epss) && (
                  <div className="mb-5 flex flex-wrap gap-3">
                    {results.knownExploitedCount > 0 && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/40 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <div><div className="text-red-400 font-bold text-sm">{results.knownExploitedCount} Known Exploited</div><div className="text-xs text-red-300/70">CISA KEV Catalog</div></div>
                      </div>
                    )}
                    {results.epss && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-amber-400" />
                        <div><div className="text-amber-400 font-bold text-sm">{results.epss.probability} exploit probability</div><div className="text-xs text-amber-300/70">EPSS Score: {results.epss.score} | Percentile: {results.epss.percentile}</div></div>
                      </div>
                    )}
                    {results.dataSources && (
                      <div className="flex flex-wrap items-center gap-1 ml-auto">
                        {results.dataSources.map((src, i) => (<span key={i} className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[9px] text-cyan-400">{src}</span>))}
                      </div>
                    )}
                  </div>
                )}

                {/* Enrichment tabs */}
                <div className="flex gap-1 mb-4 p-1 rounded-xl bg-slate-900/60 border border-red-500/10 overflow-x-auto">
                  {tabs.map(tab => (
                    <motion.button key={tab.id} whileHover={{ scale: 1.02 }} onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                      <tab.icon className="w-3 h-3" />{tab.label}
                    </motion.button>
                  ))}
                </div>

                {activeTab === 'cves' && (
                  <div className="space-y-3">
                    {results.vulnerabilities?.map((vuln, i) => {
                      const sc = severityColors[vuln.severity] || severityColors.NONE;
                      const isExpanded = expandedCVE === vuln.id;
                      return (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                          className={`rounded-2xl ${sc.bg} border ${sc.border} overflow-hidden`}>
                          <button onClick={() => setExpandedCVE(isExpanded ? null : vuln.id)} className="w-full p-4 text-left flex items-start gap-3">
                            <div className={`px-2 py-1 rounded-lg text-xs font-bold border ${sc.badge} flex-shrink-0 mt-0.5`}>{vuln.cvssScore ? vuln.cvssScore.toFixed(1) : 'N/A'}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-white font-bold text-sm">{vuln.id}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${sc.badge}`}>{vuln.severity}</span>
                                {vuln.knownExploited && (<span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/30 text-red-300 border border-red-500/50 animate-pulse">CISA KEV</span>)}
                                {vuln.epss && parseFloat(vuln.epss.score) > 0.1 && (<span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">EPSS {vuln.epss.probability}</span>)}
                              </div>
                              <p className="text-gray-400 text-xs mt-1 line-clamp-2">{vuln.description}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{vuln.published ? new Date(vuln.published).toLocaleDateString() : 'N/A'}</span>
                                {vuln.weaknesses?.length > 0 && <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" />{vuln.weaknesses[0]}</span>}
                              </div>
                            </div>
                            <ChevronRight className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                          <AnimatePresence>{isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              className="border-t border-white/5 px-4 pb-4 overflow-hidden">
                              <div className="pt-3 space-y-3">
                                <p className="text-gray-300 text-sm">{vuln.description}</p>
                                {vuln.cvssVector && <div className="flex items-center gap-2"><span className="text-xs text-gray-500">CVSS Vector:</span><code className="text-xs text-cyan-400 font-mono bg-slate-800/60 px-2 py-1 rounded">{vuln.cvssVector}</code></div>}
                                <div className="grid sm:grid-cols-2 gap-2 text-xs"><div><span className="text-gray-500">Exploitability:</span><span className="text-amber-400">{vuln.exploitabilityScore ?? 'N/A'}</span></div><div><span className="text-gray-500">Impact:</span><span className="text-red-400">{vuln.impactScore ?? 'N/A'}</span></div></div>
                                {vuln.knownExploited && vuln.kevData && (
                                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                                    <h5 className="text-xs text-red-400 font-bold mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />CISA Known Exploited Vulnerability</h5>
                                    <div className="grid sm:grid-cols-2 gap-1 text-xs">
                                      <div><span className="text-gray-500">Added to KEV:</span><span className="text-red-300">{vuln.kevData.dateAdded}</span></div>
                                      <div><span className="text-gray-500">Due Date:</span><span className="text-red-300">{vuln.kevData.dueDate}</span></div>
                                      {vuln.kevData.vendor && <div><span className="text-gray-500">Vendor:</span><span className="text-red-300">{vuln.kevData.vendor}</span></div>}
                                      {vuln.kevData.product && <div><span className="text-gray-500">Product:</span><span className="text-red-300">{vuln.kevData.product}</span></div>}
                                      {vuln.kevData.ransomwareUse && vuln.kevData.ransomwareUse !== 'Unknown' && (<div className="sm:col-span-2"><span className="text-gray-500">Ransomware Use:</span><span className="text-red-300 font-bold">{vuln.kevData.ransomwareUse}</span></div>)}
                                    </div>
                                    {vuln.kevData.requiredAction && <p className="text-xs text-red-300/80 mt-1">Action: {vuln.kevData.requiredAction}</p>}
                                  </div>
                                )}
                                {vuln.epss && (<div className="flex items-center gap-3 text-xs"><span className="text-gray-500">EPSS:</span><span className="text-amber-400 font-bold">{vuln.epss.probability} probability</span><span className="text-gray-500">|</span><span className="text-gray-400">Percentile: {vuln.epss.percentile}</span></div>)}
                                {vuln.affectedProducts?.length > 0 && <div><h5 className="text-xs text-gray-500 mb-1">Affected Products:</h5><div className="flex flex-wrap gap-1">{vuln.affectedProducts.map((p, j) => (<span key={j} className="px-2 py-1 text-xs rounded-lg bg-slate-800/60 text-gray-300 border border-white/5">{p.vendor}/{p.product} ({p.versions})</span>))}</div></div>}
                                {vuln.references?.length > 0 && <div><h5 className="text-xs text-gray-500 mb-1">References:</h5>{vuln.references.map((r, j) => (<a key={j} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs mb-0.5"><ExternalLink className="w-3 h-3" />{r.url}</a>))}</div>}
                              </div>
                            </motion.div>
                          )}</AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {activeTab === 'exploits' && (
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-red-500/10">
                    <h4 className="text-red-300 font-semibold mb-3 flex items-center gap-2"><Crosshair className="w-5 h-5" />Exploit-DB Results ({exploitdb.total || 0} exploits)</h4>
                    {exploitdb.exploits?.length > 0 ? (
                      <div className="space-y-2">{exploitdb.exploits.map((ex, i) => (
                        <div key={i} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                          <p className="text-white text-sm font-medium">{ex.title || `Exploit #${ex.eid}`}</p>
                          {ex.url && <a href={ex.url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 flex items-center gap-1 mt-1"><ExternalLink className="w-3 h-3" />View on Exploit-DB</a>}
                        </div>
                      ))}</div>
                    ) : <p className="text-gray-500 text-sm">No public exploits found in Exploit-DB</p>}
                  </div>
                )}

                {activeTab === 'metasploit' && (
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-red-500/10">
                    <h4 className="text-red-300 font-semibold mb-3 flex items-center gap-2"><Shield className="w-5 h-5" />Metasploit Module Status</h4>
                    <div className={`p-4 rounded-xl mb-4 ${metasploit.hasModule ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-800/60 border border-gray-500/20'}`}>
                      <p className={`text-lg font-bold ${metasploit.hasModule ? 'text-emerald-400' : 'text-gray-400'}`}>{metasploit.hasModule ? '✓ Module Available' : 'No Metasploit module found'}</p>
                      <p className="text-xs text-gray-500 mt-1">{metasploit.total || 0} module(s) available</p>
                    </div>
                    {metasploit.modules?.length > 0 && <div className="space-y-2">{metasploit.modules.map((m, i) => (<div key={i} className="p-3 rounded-lg bg-slate-800/60 border border-white/10"><p className="text-white text-sm">{m.title}</p>{m.url && <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 flex items-center gap-1 mt-1"><ExternalLink className="w-3 h-3" />View Module</a>}</div>))}</div>}
                  </div>
                )}

                {activeTab === 'mitre' && (
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-red-500/10">
                    <h4 className="text-red-300 font-semibold mb-3 flex items-center gap-2"><Activity className="w-5 h-5" />MITRE ATT&CK Mapping ({mitreAttack.total || 0} techniques)</h4>
                    {mitreAttack.techniques?.length > 0 ? (
                      <div className="space-y-2">{mitreAttack.techniques.map((t, i) => (
                        <div key={i} className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                          <div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded bg-violet-500/30 text-violet-300 text-xs font-mono font-bold">{t.id}</span></div>
                          {t.url && <a href={t.url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 flex items-center gap-1 mt-1"><ExternalLink className="w-3 h-3" />View on MITRE ATT&CK</a>}
                        </div>
                      ))}</div>
                    ) : <p className="text-gray-500 text-sm">No MITRE ATT&CK mapping found for this CVE</p>}
                  </div>
                )}

                {activeTab === 'epss' && (
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-red-500/10">
                    <h4 className="text-red-300 font-semibold mb-3 flex items-center gap-2"><AlertTriangle className="w-5 h-5" />EPSS Score</h4>
                    {epss.score != null ? (
                      <div>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center"><p className="text-2xl font-bold text-amber-400">{(epss.score * 100).toFixed(2)}%</p><p className="text-xs text-gray-400">Exploit Probability</p></div>
                          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center"><p className="text-2xl font-bold text-blue-400">{(epss.percentile * 100).toFixed(1)}%</p><p className="text-xs text-gray-400">Percentile</p></div>
                          <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 text-center"><p className="text-2xl font-bold text-violet-400">{epss.rating || 'N/A'}</p><p className="text-xs text-gray-400">Rating</p></div>
                        </div>
                        <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, epss.score * 100)}%` }}
                            className={`h-full rounded-full ${epss.score >= 0.5 ? 'bg-red-500' : epss.score >= 0.2 ? 'bg-orange-500' : epss.score >= 0.05 ? 'bg-amber-500' : 'bg-blue-500'}`} />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">EPSS predicts the probability that a CVE will be exploited in the wild within 30 days.</p>
                      </div>
                    ) : <p className="text-gray-500 text-sm">EPSS score not available for this CVE</p>}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!results && !isSearching && (
            <div className="flex flex-col items-center justify-center py-16">
              <Bug className="w-16 h-16 text-red-500/30 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">CVE Vulnerability Search</h3>
              <p className="text-gray-400 text-center max-w-md text-sm">Search NVD, Exploit-DB, Metasploit, MITRE ATT&CK & EPSS for vulnerability intelligence.</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CVELookupTool;
