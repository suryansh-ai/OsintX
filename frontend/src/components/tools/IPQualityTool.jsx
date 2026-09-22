import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Copy, Download, RefreshCw, Info, ShieldAlert, Globe, Server, AlertTriangle, CheckCircle, Wifi } from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const IPQualityTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'I P Quality', query: query });
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
      color: ['#f59e0b', '#fbbf24', '#d97706', '#fcd34d'][Math.floor(Math.random() * 4)],
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
    if (!query.trim()) { toast.error('Enter an IP address'); return; }
    trackToolUsage('ipquality', 'check', 'start');
    setIsSearching(true); setResults(null); onConsume?.(10);
    try {
      const resp = await fetch(`${API_BASE}/tools/ipquality/check`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: query.trim() }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || 'Check failed'); }
      const data = await resp.json();
      setResults(data);
      addToHistory('ipquality', query, data);
      toast.success('IP fraud check complete!');
    } catch (err) { toast.error(err.message); }
    finally { setIsSearching(false); }
  };

  const riskFlags = results?.riskAssessment ? Object.entries(results.riskAssessment).filter(([k]) => k !== 'riskScore') : [];
  const activeRisks = riskFlags.filter(([,v]) => v === true);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }} onClick={e => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-amber-950/10 to-slate-950 border border-amber-500/30 shadow-[0_0_100px_rgba(245,158,11,0.1)]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="relative z-10 flex flex-col max-h-[92vh]">
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30"><ShieldAlert className="w-6 h-6 text-amber-400" /></div>
              <div><h2 className="text-xl font-bold text-white">IP Quality & Fraud Score</h2><p className="text-sm text-slate-400">VPN/proxy/automation detection & risk scoring</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div className="p-6 border-b border-white/5">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Wifi className="absolute w-5 h-5 left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter IP address (e.g. 8.8.8.8)" className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none font-mono" />
              </div>
              <button onClick={handleSearch} disabled={isSearching}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {isSearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {isSearching ? 'Checking...' : 'Check'}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {isSearching && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                <p className="mt-4 text-slate-400">Running fraud checks...</p>
              </div>
            )}
            {results && !isSearching && (
              <div className="space-y-6">
                {/* Risk Score */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl border ${activeRisks.length > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                    <p className="text-sm text-slate-400">Risk Level</p>
                    <p className={`text-2xl font-bold ${activeRisks.length > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {activeRisks.length > 2 ? 'HIGH' : activeRisks.length > 0 ? 'MEDIUM' : 'LOW'}
                    </p>
                    {results.riskAssessment?.riskScore != null && <p className="text-xs text-slate-500 mt-1">Score: {results.riskAssessment.riskScore}</p>}
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400">Active Flags</p>
                    <p className="text-2xl font-bold text-amber-400">{activeRisks.length} / {riskFlags.length}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400">IP</p>
                    <p className="text-lg font-bold text-white font-mono">{results.ip}</p>
                  </div>
                </div>
                {/* Risk Flags */}
                <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-sm text-slate-400 mb-3 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Risk Flags</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {riskFlags.map(([key, val]) => (
                      <div key={key} className={`p-3 rounded-lg flex items-center gap-2 ${val ? 'bg-red-500/10 border border-red-500/30' : 'bg-green-500/5 border border-green-500/20'}`}>
                        {val ? <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
                        <span className="text-sm text-white capitalize">{key.replace('is', '')}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Company / ASN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.company && (
                    <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-sm text-slate-400 mb-3 flex items-center gap-2"><Server className="w-4 h-4" /> Company</p>
                      <div className="space-y-2 text-sm">
                        <div><p className="text-slate-500">Name</p><p className="text-white">{results.company.name || 'N/A'}</p></div>
                        <div><p className="text-slate-500">Type</p><p className="text-white">{results.company.type || 'N/A'}</p></div>
                        <div><p className="text-slate-500">Domain</p><p className="text-white">{results.company.domain || 'N/A'}</p></div>
                        <div><p className="text-slate-500">Network</p><p className="text-white font-mono text-xs">{results.company.network || 'N/A'}</p></div>
                      </div>
                    </div>
                  )}
                  {results.asn && (
                    <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-sm text-slate-400 mb-3 flex items-center gap-2"><Globe className="w-4 h-4" /> ASN Info</p>
                      <div className="space-y-2 text-sm">
                        <div><p className="text-slate-500">ASN</p><p className="text-white">{results.asn.asn || 'N/A'}</p></div>
                        <div><p className="text-slate-500">Organization</p><p className="text-white">{results.asn.org || 'N/A'}</p></div>
                        <div><p className="text-slate-500">ISP</p><p className="text-white">{results.asn.isp || 'N/A'}</p></div>
                        <div><p className="text-slate-500">Route</p><p className="text-white font-mono text-xs">{results.asn.route || 'N/A'}</p></div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Location */}
                {results.location && (
                  <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400 mb-3">Location</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><p className="text-slate-500">Country</p><p className="text-white">{results.location.country} ({results.location.countryCode})</p></div>
                      <div><p className="text-slate-500">City</p><p className="text-white">{results.location.city || 'N/A'}</p></div>
                      <div><p className="text-slate-500">State</p><p className="text-white">{results.location.state || 'N/A'}</p></div>
                      <div><p className="text-slate-500">Timezone</p><p className="text-white">{results.location.timezone || 'N/A'}</p></div>
                    </div>
                  </div>
                )}
                {/* Open Ports & Vulns */}
                {(results.openPorts?.length > 0 || results.vulnerabilities?.length > 0) && (
                  <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400 mb-3">Infrastructure Exposure</p>
                    {results.openPorts?.length > 0 && (
                      <div className="mb-2"><p className="text-xs text-slate-500">Open Ports</p><div className="flex flex-wrap gap-1.5 mt-1">{results.openPorts.map(p => <span key={p} className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-300 font-mono">{p}</span>)}</div></div>
                    )}
                    {results.vulnerabilities?.length > 0 && (
                      <div><p className="text-xs text-red-400">Vulnerabilities</p><div className="flex flex-wrap gap-1.5 mt-1">{results.vulnerabilities.map(v => <span key={v} className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-300 font-mono">{v}</span>)}</div></div>
                    )}
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <button onClick={() => copy(JSON.stringify(results, null, 2))} className="p-2 rounded-lg hover:bg-white/10"><Copy className="w-4 h-4 text-slate-400" /></button>
                  <button onClick={() => exportToJSON(results, 'ipquality-results')} className="p-2 rounded-lg hover:bg-white/10"><Download className="w-4 h-4 text-slate-400" /></button>
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

export default IPQualityTool;
