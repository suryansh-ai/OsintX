import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Globe, Copy, Download, RefreshCw, Shield, Calendar, Server, User, Mail, Info, ExternalLink, Lock, CheckCircle } from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const WhoisLookupTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Whois Lookup', query: query });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5, speedX: (Math.random() - 0.5) * 0.3, speedY: (Math.random() - 0.5) * 0.3,
      color: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'][Math.floor(Math.random() * 4)],
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
    if (!query.trim()) { toast.error('Enter a domain'); return; }
    trackToolUsage('whois', 'search', 'start');
    setIsSearching(true); setResults(null); onConsume?.(10);
    try {
      const resp = await fetch(`${API_BASE}/tools/whois/lookup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: query.trim() }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || 'Lookup failed'); }
      const data = await resp.json();
      setResults(data);
      addToHistory('whois', query, data);
      toast.success(`WHOIS data retrieved for ${data.domain}`);
    } catch (err) { toast.error(err.message); }
    finally { setIsSearching(false); }
  };

  const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
      {Icon && <Icon className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm text-white break-all">{value || 'N/A'}</p>
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }} onClick={e => e.stopPropagation()}
        className="relative w-full max-w-7xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950/10 to-slate-950 border border-emerald-500/30 shadow-[0_0_100px_rgba(16,185,129,0.1)]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="relative z-10 flex flex-col max-h-[92vh]">
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30"><Globe className="w-6 h-6 text-emerald-400" /></div>
              <div><h2 className="text-xl font-bold text-white">WHOIS Lookup</h2><p className="text-sm text-slate-400">Domain registration & ownership data via RDAP</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div className="p-6 border-b border-white/5">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Globe className="absolute w-5 h-5 left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter domain (e.g. example.com)" className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none" />
              </div>
              <button onClick={handleSearch} disabled={isSearching}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {isSearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {isSearching ? 'Looking up...' : 'Lookup'}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {isSearching && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                <p className="mt-4 text-slate-400">Querying WHOIS databases...</p>
              </div>
            )}
            {results && !isSearching && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">{results.domain}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => copy(JSON.stringify(results, null, 2))} className="p-2 rounded-lg hover:bg-white/10"><Copy className="w-4 h-4 text-slate-400" /></button>
                    <button onClick={() => exportToJSON(results, 'whois-results')} className="p-2 rounded-lg hover:bg-white/10"><Download className="w-4 h-4 text-slate-400" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <InfoRow icon={Shield} label="Registrar" value={results.registrar} />
                  <InfoRow icon={Calendar} label="Created" value={results.dates?.created} />
                  <InfoRow icon={Calendar} label="Updated" value={results.dates?.updated} />
                  <InfoRow icon={Calendar} label="Expires" value={results.dates?.expires} />
                  <InfoRow icon={Lock} label="DNSSEC" value={results.dnssec ? 'Signed' : 'Unsigned'} />
                  <InfoRow icon={Server} label="Handle" value={results.handle} />
                </div>
                {/* Domain Age, Expiry & Privacy */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {results.domainAge && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <p className="text-xl font-bold text-emerald-400">{results.domainAge.formatted}</p>
                      <p className="text-xs text-slate-400">Domain Age ({results.domainAge.totalDays} days)</p>
                    </div>
                  )}
                  {results.expiryWarning && (
                    <div className={`p-3 rounded-xl text-center ${results.expiryWarning.severity === 'critical' ? 'bg-red-500/10 border border-red-500/30' : results.expiryWarning.severity === 'high' ? 'bg-orange-500/10 border border-orange-500/30' : results.expiryWarning.severity === 'medium' ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                      <p className={`text-sm font-bold ${results.expiryWarning.severity === 'critical' ? 'text-red-400' : results.expiryWarning.severity === 'high' ? 'text-orange-400' : results.expiryWarning.severity === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {results.expiryWarning.status === 'EXPIRED' ? `EXPIRED (${results.expiryWarning.daysAgo}d ago)` : `${results.expiryWarning.daysRemaining} days remaining`}
                      </p>
                      <p className="text-xs text-slate-400">Expiry Status</p>
                    </div>
                  )}
                  <div className={`p-3 rounded-xl text-center ${results.privacyProtection ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                    <p className={`text-sm font-bold ${results.privacyProtection ? 'text-blue-400' : 'text-amber-400'}`}>{results.privacyProtection ? 'Protected' : 'Exposed'}</p>
                    <p className="text-xs text-slate-400">WHOIS Privacy</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2"><User className="w-4 h-4" />Registrant</h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-white">{results.registrant?.name}</p>
                      <p className="text-slate-400">{results.registrant?.org}</p>
                      <p className="text-slate-400">{results.registrant?.country}</p>
                      <p className="text-slate-500">{results.registrant?.email}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2"><User className="w-4 h-4" />Admin Contact</h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-white">{results.admin?.name}</p>
                      <p className="text-slate-500">{results.admin?.email}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2"><User className="w-4 h-4" />Tech Contact</h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-white">{results.tech?.name}</p>
                      <p className="text-slate-500">{results.tech?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="text-sm font-semibold text-cyan-400 mb-3"><Server className="w-4 h-4 inline mr-2" />Nameservers</h4>
                    <div className="space-y-1">{results.nameservers?.map((ns, i) => <p key={i} className="text-sm text-white">{ns}</p>)}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="text-sm font-semibold text-amber-400 mb-3"><Mail className="w-4 h-4 inline mr-2" />MX Records</h4>
                    <div className="space-y-1">{results.dns?.mxRecords?.map((mx, i) => <p key={i} className="text-sm text-white">[{mx.priority}] {mx.exchange}</p>)}</div>
                  </div>
                </div>
                {results.status?.length > 0 && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="text-sm font-semibold text-slate-400 mb-2">Domain Status</h4>
                    <div className="flex flex-wrap gap-2">{results.status.map((s, i) => <span key={i} className="px-2 py-1 text-xs rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">{s}</span>)}</div>
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

export default WhoisLookupTool;
