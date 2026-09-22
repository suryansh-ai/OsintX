import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Copy, Download, RefreshCw, Info, Scale, AlertTriangle, Globe, Calendar, Building2, FileText, ChevronDown, ChevronUp, ExternalLink, Shield, UserCheck } from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SanctionsSearchTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Sanctions Search', query: name });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [enrichment, setEnrichment] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [activeTab, setActiveTab] = useState('sanctions');
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 25 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5, speedX: (Math.random() - 0.5) * 0.3, speedY: (Math.random() - 0.5) * 0.3,
      color: ['#f43f5e', '#fb7185', '#e11d48', '#fda4af'][Math.floor(Math.random() * 4)],
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

  useEffect(() => {
    if (!results?.query?.name) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    fetch(`${API_BASE}/tools/sanctions/enriched`, {
      signal: controller.signal,
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: results.query.name }),
    }).then(r => r.json()).then(d => setEnrichment(d)).catch(() => {});
    return () => { controller.abort(); clearTimeout(timer); };
  }, [results]);

  const handleSearch = async () => {
    if (!name.trim()) { toast.error('Enter a name or entity'); return; }
    trackToolUsage('sanctions', 'search', 'start');
    setIsSearching(true); setResults(null); setExpanded(null); setEnrichment(null); onConsume?.(15);
    try {
      const resp = await fetchWithTimeout(`${API_BASE}/tools/sanctions/search`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), country: country.trim() }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || 'Search failed'); }
      const data = await resp.json();
      setResults(data);
      addToHistory('sanctions', name, data);
      toast.success(`Found ${data.totalSanctions} sanction match(es)`);
    } catch (err) { toast.error(err.message); }
    finally { setIsSearching(false); }
  };

  const tabs = [
    { id: 'sanctions', label: 'Sanctions', icon: Scale },
    { id: 'ofac', label: 'OFAC', icon: Shield },
    { id: 'eu', label: 'EU', icon: Globe },
    { id: 'un', label: 'UN', icon: Globe },
    { id: 'pep', label: 'PEP Flag', icon: UserCheck },
    { id: 'news', label: 'Adverse Media', icon: FileText },
  ];

  const enrichmentData = enrichment || {};
  const ofac = enrichmentData.ofac || {};
  const eu = enrichmentData.eu || {};
  const un = enrichmentData.un || {};
  const pep = enrichmentData.pep || {};
  const adverseMedia = enrichmentData.adverseMedia || {};

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }} onClick={e => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-rose-950/10 to-slate-950 border border-rose-500/30 shadow-[0_0_100px_rgba(244,63,94,0.1)]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="relative z-10 flex flex-col max-h-[92vh]">
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30"><Scale className="w-6 h-6 text-rose-400" /></div>
              <div><h2 className="text-xl font-bold text-white">Sanctions Search</h2><p className="text-sm text-slate-400">OpenSanctions, OFAC, EU, UN + PEP flagging</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div className="p-6 border-b border-white/5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Building2 className="absolute w-5 h-5 left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Person or entity name" className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-rose-500/50 focus:outline-none" />
              </div>
              <div className="relative w-full sm:w-48">
                <Globe className="absolute w-5 h-5 left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={country} onChange={e => setCountry(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Country (opt.)" className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-rose-500/50 focus:outline-none" />
              </div>
              <button onClick={handleSearch} disabled={isSearching}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {isSearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {isSearching && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                <p className="mt-4 text-slate-400">Searching sanctions databases...</p>
              </div>
            )}
            {results && !isSearching && (
              <div className="space-y-6">
                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className={`p-3 rounded-xl border ${results.totalSanctions > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                    <p className="text-xs text-slate-400">OpenSanctions</p>
                    <p className={`text-xl font-bold ${results.totalSanctions > 0 ? 'text-red-400' : 'text-green-400'}`}>{results.totalSanctions}</p>
                  </div>
                  <div className={`p-3 rounded-xl border ${ofac.total > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
                    <p className="text-xs text-slate-400">OFAC SDN</p>
                    <p className={`text-xl font-bold ${ofac.total > 0 ? 'text-red-400' : 'text-white'}`}>{ofac.total || 0}</p>
                  </div>
                  <div className={`p-3 rounded-xl border ${eu.total > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
                    <p className="text-xs text-slate-400">EU Sanctions</p>
                    <p className={`text-xl font-bold ${eu.total > 0 ? 'text-red-400' : 'text-white'}`}>{eu.total || 0}</p>
                  </div>
                  <div className={`p-3 rounded-xl border ${pep.isPep ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/10'}`}>
                    <p className="text-xs text-slate-400">PEP Flag</p>
                    <p className={`text-xl font-bold ${pep.isPep ? 'text-amber-400' : 'text-white'}`}>{pep.isPep ? 'YES' : 'No'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-slate-400">Interpol</p>
                    <p className="text-xl font-bold text-amber-400">{results.interpolRedNotices?.length || 0}</p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 rounded-xl bg-slate-900/60 border border-white/10 overflow-x-auto">
                  {tabs.map(tab => (
                    <motion.button key={tab.id} whileHover={{ scale: 1.02 }} onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                      <tab.icon className="w-3 h-3" />{tab.label}
                    </motion.button>
                  ))}
                </div>

                {activeTab === 'sanctions' && (
                  <div>
                    {results.sanctions?.length > 0 ? (
                      <div className="space-y-3">
                        {results.sanctions.map((s, i) => (
                          <div key={s.id || i} className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                            <button onClick={() => setExpanded(expanded === i ? null : i)} className="w-full p-4 flex items-center gap-3 text-left hover:bg-white/5">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-white font-semibold">{s.name}</p>
                                  <span className="px-2 py-0.5 text-xs rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">{s.schema}</span>
                                  {s.score && <span className="text-xs text-slate-500">Score: {s.score.toFixed(1)}</span>}
                                </div>
                                <p className="text-xs text-slate-400">{s.properties.nationality?.join(', ') || ''}{s.properties.birthDate?.length > 0 && ` • Born: ${s.properties.birthDate[0]}`}</p>
                              </div>
                              {s.datasets?.length > 0 && <span className="text-xs text-slate-500 flex-shrink-0">{s.datasets.length} list(s)</span>}
                              {expanded === i ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </button>
                            {expanded === i && (
                              <div className="px-4 pb-4 border-t border-white/5 pt-3 text-sm">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                                  {s.properties.names?.length > 0 && <div><p className="text-slate-500">All Names</p><p className="text-white text-xs">{s.properties.names.join(' | ')}</p></div>}
                                  {s.properties.country?.length > 0 && <div><p className="text-slate-500">Countries</p><p className="text-white">{s.properties.country.join(', ')}</p></div>}
                                  {s.properties.address?.length > 0 && <div><p className="text-slate-500">Addresses</p><p className="text-white text-xs">{s.properties.address.join('; ')}</p></div>}
                                  {s.properties.idNumber?.length > 0 && <div><p className="text-slate-500">ID Numbers</p><p className="text-white font-mono text-xs">{s.properties.idNumber.join(', ')}</p></div>}
                                </div>
                                {s.datasets?.length > 0 && <div><p className="text-slate-500 text-xs mb-1">Sanction Lists</p><div className="flex flex-wrap gap-1.5">{s.datasets.map((d, j) => <span key={j} className="px-2 py-0.5 text-xs rounded-full bg-red-500/10 text-red-300 border border-red-500/20">{d}</span>)}</div></div>}
                                <p className="text-xs text-slate-600 mt-2">First seen: {s.firstSeen || 'N/A'} • Last seen: {s.lastSeen || 'N/A'}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-slate-500 text-center py-8">No sanctions matches found</p>}
                    {results.interpolRedNotices?.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-slate-400 mb-3">Interpol Red Notices</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {results.interpolRedNotices.map((n, i) => (
                            <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                              {n.thumbnail && <img src={n.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                              <div className="min-w-0"><p className="text-white text-sm font-semibold">{n.name}</p><p className="text-xs text-slate-400">{n.dateOfBirth} • {n.nationalities?.join(', ')}</p></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'ofac' && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-rose-400" />OFAC SDN List ({ofac.total || 0} matches)</h4>
                    {ofac.matches?.length > 0 ? (
                      <div className="space-y-2">{ofac.matches.map((m, i) => (
                        <div key={i} className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20"><p className="text-white text-sm font-medium">{m.name}</p><p className="text-xs text-slate-400">{m.type} • {m.program}</p></div>
                      ))}</div>
                    ) : <p className="text-slate-500 text-sm">{ofac.error || 'No OFAC matches found'}</p>}
                  </div>
                )}

                {activeTab === 'eu' && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2"><Globe className="w-4 h-4 text-blue-400" />EU Consolidated Sanctions ({eu.total || 0} matches)</h4>
                    {eu.matches?.length > 0 ? (
                      <div className="space-y-2">{eu.matches.map((m, i) => (
                        <div key={i} className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"><p className="text-white text-sm">{m.name}</p></div>
                      ))}</div>
                    ) : <p className="text-slate-500 text-sm">No EU sanctions matches found</p>}
                  </div>
                )}

                {activeTab === 'un' && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2"><Globe className="w-4 h-4 text-amber-400" />UN Sanctions Consolidated List ({un.total || 0} matches)</h4>
                    {un.matches?.length > 0 ? (
                      <div className="space-y-2">{un.matches.map((m, i) => (
                        <div key={i} className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"><p className="text-white text-sm">{m.name}</p></div>
                      ))}</div>
                    ) : <p className="text-slate-500 text-sm">No UN sanctions matches found</p>}
                  </div>
                )}

                {activeTab === 'pep' && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2"><UserCheck className="w-4 h-4 text-amber-400" />Politically Exposed Persons Flagging</h4>
                    <div className={`p-4 rounded-xl ${pep.isPep ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-emerald-500/10 border border-emerald-500/30'} mb-3`}>
                      <p className={`text-lg font-bold ${pep.isPep ? 'text-amber-400' : 'text-emerald-400'}`}>{pep.isPep ? '⚠️ PEP DETECTED' : '✓ No PEP flags'}</p>
                      <p className="text-xs text-slate-400 mt-1">Confidence: {pep.confidence || 'low'}</p>
                    </div>
                    {pep.matchedTerms?.length > 0 && <div><p className="text-slate-400 text-xs mb-1">Matched terms:</p><div className="flex flex-wrap gap-1">{pep.matchedTerms.map((t, i) => <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">{t}</span>)}</div></div>}
                  </div>
                )}

                {activeTab === 'news' && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-cyan-400" />Adverse Media Search ({adverseMedia.total || 0} articles)</h4>
                    {adverseMedia.articles?.length > 0 ? (
                      <div className="space-y-2">{adverseMedia.articles.map((a, i) => (
                        <div key={i} className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                          <p className="text-white text-sm font-medium">{a.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{a.description?.slice(0, 200)}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500"><span>{a.source}</span>{a.url && <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 flex items-center gap-1"><ExternalLink className="w-3 h-3" />Source</a>}</div>
                        </div>
                      ))}</div>
                    ) : <p className="text-slate-500 text-sm">No adverse media articles found</p>}
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <button onClick={() => copy(JSON.stringify({ ...results, enrichment }, null, 2))} className="p-2 rounded-lg hover:bg-white/10"><Copy className="w-4 h-4 text-slate-400" /></button>
                  <button onClick={() => exportToJSON({ ...results, enrichment }, 'sanctions-results')} className="p-2 rounded-lg hover:bg-white/10"><Download className="w-4 h-4 text-slate-400" /></button>
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-2"><Info className="w-3 h-3" /> {results.disclaimer} • {results.searchDuration}</div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SanctionsSearchTool;
