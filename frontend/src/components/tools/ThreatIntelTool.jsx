import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Shield, Copy, Download, RefreshCw, AlertTriangle, Globe, Info, ExternalLink, AlertCircle, CheckCircle, Activity, Target, Eye, Radio, Users } from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';
import { exportToJSON } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const riskColors = { CRITICAL: 'text-red-400 bg-red-500/20 border-red-500/40', HIGH: 'text-orange-400 bg-orange-500/20 border-orange-500/40', MEDIUM: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40', LOW: 'text-green-400 bg-green-500/20 border-green-500/40', CLEAN: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40' };

const ThreatIntelTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Threat Intel', query: query });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [enrichment, setEnrichment] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 35 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5, speedX: (Math.random() - 0.5) * 0.4, speedY: (Math.random() - 0.5) * 0.4,
      color: ['#ef4444', '#f97316', '#eab308', '#22c55e'][Math.floor(Math.random() * 4)],
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

  useEffect(() => {
    if (!query.trim()) return;
    const tag = results?.otx?.pulses?.[0]?.tags?.[0] || query;
    const controller = new AbortController();
    fetch(`${API_BASE}/tools/threatintel/enriched`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ indicator: query.trim(), tag }),
      signal: controller.signal,
    }).then(r => r.json()).then(d => setEnrichment(d)).catch(() => {});
    const timer = setTimeout(() => controller.abort(), 30000);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [results]);

  const handleSearch = async () => {
    if (!query.trim()) { toast.error('Enter an IP, domain, hash, or URL'); return; }
    trackToolUsage('threatintel', 'lookup', 'start');
    setIsSearching(true); setResults(null); setEnrichment(null); onConsume?.(15);
    try {
      const resp = await fetchWithTimeout(`${API_BASE}/tools/threatintel/lookup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indicator: query.trim() }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || 'Search failed'); }
      const data = await resp.json();
      setResults(data);
      addToHistory('threatintel', query, data);
      toast.success(`Threat analysis complete — Risk: ${data.riskScore}/100`);
    } catch (err) { toast.error(err.message); }
    finally { setIsSearching(false); }
  };

  const getRiskLevel = score => { if (score >= 80) return 'CRITICAL'; if (score >= 60) return 'HIGH'; if (score >= 30) return 'MEDIUM'; if (score > 0) return 'LOW'; return 'CLEAN'; };

  const enr = enrichment || {};
  const otxPulses = enr.otxPulses || {};
  const iocToActor = enr.iocToActor || {};
  const controllerIntel = enr.botnetCC || {};
  const ransomwareTracker = enr.ransomwareTracker || {};

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'threats', label: 'Threats' },
    { id: 'dns', label: 'Passive DNS' },
    { id: 'otx', label: 'OTX Pulses' },
    { id: 'actors', label: 'Threat Actors' },
    { id: 'controllers', label: 'C&C Trackers' },
    { id: 'ransomware', label: 'Ransomware' },
    { id: 'raw', label: 'Raw' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }} onClick={e => e.stopPropagation()}
        className="relative w-full max-w-7xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-red-950/10 to-slate-950 border border-red-500/30 shadow-[0_0_100px_rgba(239,68,68,0.1)]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="relative z-10 flex flex-col max-h-[92vh]">
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30"><Shield className="w-6 h-6 text-red-400" /></div>
              <div><h2 className="text-xl font-bold text-white">Threat Intelligence</h2><p className="text-sm text-slate-400">IPs, domains, hashes + OTX, actors, C&C, ransomware</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div className="p-6 border-b border-white/5">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Target className="absolute w-5 h-5 left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter IP, domain, hash, or URL" className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-red-500/50 focus:outline-none" />
              </div>
              <button onClick={handleSearch} disabled={isSearching}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {isSearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {isSearching ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {isSearching && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                <p className="mt-4 text-slate-400">Querying threat intelligence feeds...</p>
              </div>
            )}
            {results && !isSearching && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-xs text-slate-400">Risk Score</p>
                    <div className="mt-1 relative w-16 h-16 mx-auto">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="none" className="text-white/10" />
                        <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="none" strokeDasharray={`${results.riskScore * 2.14} 214`}
                          className={results.riskScore >= 60 ? 'text-red-500' : results.riskScore >= 30 ? 'text-yellow-500' : 'text-green-500'} strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{results.riskScore}</span>
                    </div>
                    <p className={`text-xs font-medium mt-1 ${riskColors[getRiskLevel(results.riskScore)]?.split(' ')[0]}`}>{getRiskLevel(results.riskScore)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10"><p className="text-xs text-slate-400">Type</p><p className="text-lg font-bold text-blue-400 capitalize">{results.indicatorType}</p></div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10"><p className="text-xs text-slate-400">Threats</p><p className="text-lg font-bold text-red-400">{results.threats?.length || 0}</p></div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10"><p className="text-xs text-slate-400">OTX Pulses</p><p className="text-lg font-bold text-purple-400">{results.otx?.pulseCount || 0}</p></div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10"><p className="text-xs text-slate-400">Ransomware Groups</p><p className="text-lg font-bold text-rose-400">{ransomwareTracker.total || 0}</p></div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 rounded-xl bg-slate-900/60 border border-white/10 overflow-x-auto">
                  {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${activeTab === tab.id ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'text-slate-400 hover:bg-white/5'}`}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activeTab === 'overview' && (
                  <div className="space-y-3">
                    {results.ipInfo && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-sm text-slate-400 mb-2 flex items-center gap-2"><Globe className="w-4 h-4" />Geolocation</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div><p className="text-slate-500">Country</p><p className="text-white">{results.ipInfo.country || 'N/A'}</p></div>
                          <div><p className="text-slate-500">City</p><p className="text-white">{results.ipInfo.city || 'N/A'}</p></div>
                          <div><p className="text-slate-500">ISP</p><p className="text-white">{results.ipInfo.isp || 'N/A'}</p></div>
                          <div><p className="text-slate-500">Org</p><p className="text-white">{results.ipInfo.org || 'N/A'}</p></div>
                        </div>
                      </div>
                    )}
                    {results.otx?.pulses?.length > 0 && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-sm text-slate-400 mb-2 flex items-center gap-2"><Activity className="w-4 h-4" />Top OTX Pulses</p>
                        <div className="space-y-2">{results.otx.pulses.slice(0, 8).map((p, i) => (
                          <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/10 text-sm">
                            <p className="text-white font-medium">{p.name}</p>
                            <p className="text-slate-500 text-xs">{p.created}</p>
                          </div>
                        ))}</div>
                      </div>
                    )}
                    {ransomwareTracker.groups?.length > 0 && (
                      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
                        <p className="text-sm text-rose-400 mb-2 font-medium flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Active Ransomware Groups</p>
                        <div className="flex flex-wrap gap-2">{ransomwareTracker.groups.slice(0, 10).map((g, i) => (<span key={i} className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-xs border border-rose-500/30">{g.name}</span>))}</div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'threats' && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {results.threats?.length ? results.threats.map((t, i) => (
                      <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" /><span className="font-medium text-white">{t.source}</span><span className="text-xs text-slate-500">{t.type}</span></div>
                          {t.threat && <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-300">{t.threat}</span>}
                        </div>
                        {t.signature && <p className="text-xs text-slate-400 mt-1">Signature: {t.signature}</p>}
                        {t.malware && <p className="text-xs text-slate-400 mt-1">Malware: {t.malware}</p>}
                      </div>
                    )) : <p className="text-slate-500 text-center py-8">No threats detected</p>}
                  </div>
                )}

                {activeTab === 'dns' && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {results.otx?.passiveDns?.length ? results.otx.passiveDns.map((r, i) => (
                      <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10 flex justify-between text-sm">
                        <span className="text-white font-mono">{r.hostname || r.address}</span>
                        <span className="text-slate-500">{r.recordType} • {r.firstSeen}</span>
                      </div>
                    )) : <p className="text-slate-500 text-center py-8">No passive DNS records</p>}
                  </div>
                )}

                {activeTab === 'otx' && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    <h4 className="text-purple-400 font-medium text-sm mb-2">AlienVault OTX Pulses by Tag ({otxPulses.total || 0})</h4>
                    {otxPulses.pulses?.length > 0 ? otxPulses.pulses.map((p, i) => (
                      <div key={i} className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <p className="text-white font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{p.description?.slice(0, 200)}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <span>Author: {p.author}</span>
                          {p.indicators > 0 && <span>• {p.indicators} indicators</span>}
                          {p.created && <span>• {new Date(p.created).toLocaleDateString()}</span>}
                        </div>
                        {p.tags?.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{p.tags.slice(0, 5).map((t, j) => <span key={j} className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300">{t}</span>)}</div>}
                      </div>
                    )) : <p className="text-slate-500 text-center py-8">No OTX pulses found for this tag</p>}
                  </div>
                )}

                {activeTab === 'actors' && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    <h4 className="text-amber-400 font-medium text-sm mb-2">IoC to Threat Actor Mapping ({iocToActor.total || 0})</h4>
                    {iocToActor.actors?.length > 0 ? iocToActor.actors.map((a, i) => (
                      <div key={i} className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-white font-medium text-sm">{a.pulseName}</p>
                        <p className="text-xs text-slate-400">Author: {a.author} • TLP: {a.tlp || 'Unknown'}</p>
                        {a.tags?.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{a.tags.slice(0, 6).map((t, j) => <span key={j} className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300">{t}</span>)}</div>}
                        {a.targetedCountries?.length > 0 && <p className="text-xs text-slate-400 mt-1">Targeted: {a.targetedCountries.join(', ')}</p>}
                      </div>
                    )) : <p className="text-slate-500 text-center py-8">No threat actor mapping found</p>}
                  </div>
                )}

                {activeTab === 'controllers' && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    <h4 className="text-cyan-400 font-medium text-sm mb-2">C&C Trackers ({controllerIntel.total || 0})</h4>
                    {controllerIntel.controllers?.length > 0 ? controllerIntel.controllers.map((c, i) => (
                      <div key={i} className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono text-sm font-bold">{c.ip || c.host}</span>
                          {c.port && <span className="text-xs text-slate-400">:{c.port}</span>}
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${c.status === 'online' ? 'bg-red-500/30 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{c.status || 'unknown'}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {c.malware && <span>Malware: {c.malware} • </span>}
                          {c.source}
                          {c.firstSeen && <span> • First: {c.firstSeen}</span>}
                          {c.lastSeen && <span> • Last: {c.lastSeen}</span>}
                        </p>
                        {c.threat && <span className="text-xs text-red-400 mt-0.5 block">Threat: {c.threat}</span>}
                      </div>
                    )) : <p className="text-slate-500 text-center py-8">No C&C controllers found</p>}
                  </div>
                )}

                {activeTab === 'ransomware' && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    <h4 className="text-rose-400 font-medium text-sm mb-2">Ransomware Group Tracker ({ransomwareTracker.total || 0})</h4>
                    {ransomwareTracker.groups?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{ransomwareTracker.groups.map((g, i) => (
                        <div key={i} className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-400" /><span className="text-white font-bold text-sm">{g.name}</span></div>
                          <p className="text-xs text-slate-400 mt-1">{g.description?.slice(0, 150)}</p>
                          <div className="flex flex-wrap gap-1 mt-2 text-[10px]">
                            {g.countries?.length > 0 && g.countries.slice(0, 3).map((c, j) => <span key={j} className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">{c}</span>)}
                            {g.locations?.length > 0 && g.locations.slice(0, 3).map((l, j) => <span key={j} className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">{l}</span>)}
                          </div>
                          {g.firstSeen && <p className="text-xs text-slate-500 mt-1">Active since: {g.firstSeen}</p>}
                        </div>
                      ))}</div>
                    ) : <p className="text-slate-500 text-center py-8">No ransomware group data available</p>}
                  </div>
                )}

                {activeTab === 'raw' && (
                  <pre className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs text-green-400 font-mono overflow-auto max-h-96 whitespace-pre-wrap">{JSON.stringify({ ...results, enrichment }, null, 2)}</pre>
                )}

                <div className="flex gap-2 justify-end">
                  <button onClick={() => copy(JSON.stringify({ ...results, enrichment }, null, 2))} className="p-2 rounded-lg hover:bg-white/10"><Copy className="w-4 h-4 text-slate-400" /></button>
                  <button onClick={() => exportToJSON({ ...results, enrichment }, 'threatintel-results')} className="p-2 rounded-lg hover:bg-white/10"><Download className="w-4 h-4 text-slate-400" /></button>
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

export default ThreatIntelTool;
