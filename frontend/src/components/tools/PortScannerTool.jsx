import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Copy, Download, RefreshCw, Shield, Globe, Info, Server, AlertTriangle, CheckCircle, Wifi } from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';
import { exportToJSON } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const riskBg = { CRITICAL: 'bg-red-500/20 border-red-500/40 text-red-300', HIGH: 'bg-orange-500/20 border-orange-500/40 text-orange-300', MEDIUM: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300', LOW: 'bg-green-500/20 border-green-500/40 text-green-300' };

const PortScannerTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Port Scanner', query: query });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [activeTab, setActiveTab] = useState('ports');
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5, speedX: (Math.random() - 0.5) * 0.3, speedY: (Math.random() - 0.5) * 0.3,
      color: ['#a855f7', '#7c3aed', '#6366f1', '#818cf8'][Math.floor(Math.random() * 4)],
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
    if (!query.trim()) { toast.error('Enter an IP address or domain'); return; }
    trackToolUsage('portscan', 'scan', 'start');
    setIsSearching(true); setResults(null); onConsume?.(10);
    try {
      const resp = await fetchWithTimeout(`${API_BASE}/tools/portscan/scan`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: query.trim() }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || 'Scan failed'); }
      const data = await resp.json();
      setResults(data);
      addToHistory('portscan', query, data);
      toast.success(`Found ${data.totalOpenPorts} open ports${data.vulns?.length ? `, ${data.vulns.length} CVEs` : ''}`);
    } catch (err) { toast.error(err.message); }
    finally { setIsSearching(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }} onClick={e => e.stopPropagation()}
        className="relative w-full max-w-7xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-purple-950/10 to-slate-950 border border-purple-500/30 shadow-[0_0_100px_rgba(168,85,247,0.1)]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="relative z-10 flex flex-col max-h-[92vh]">
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30"><Wifi className="w-6 h-6 text-purple-400" /></div>
              <div><h2 className="text-xl font-bold text-white">Port Scanner</h2><p className="text-sm text-slate-400">Discover open ports, services & vulnerabilities</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div className="p-6 border-b border-white/5">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Server className="absolute w-5 h-5 left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter IP address or domain" className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-purple-500/50 focus:outline-none" />
              </div>
              <button onClick={handleSearch} disabled={isSearching}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {isSearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {isSearching ? 'Scanning...' : 'Scan'}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {isSearching && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <p className="mt-4 text-slate-400">Scanning ports via Shodan InternetDB...</p>
              </div>
            )}
            {results && !isSearching && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10"><p className="text-sm text-slate-400">Resolved IP</p><p className="text-lg font-bold text-purple-400 font-mono">{results.resolvedIP}</p></div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10"><p className="text-sm text-slate-400">Open Ports</p><p className="text-2xl font-bold text-blue-400">{results.totalOpenPorts}</p></div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10"><p className="text-sm text-slate-400">CVEs</p><p className="text-2xl font-bold text-red-400">{results.vulns?.length || 0}</p></div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10"><p className="text-sm text-slate-400">Exposure Score</p><p className="text-2xl font-bold text-amber-400">{results.exposureScore ?? 'N/A'}</p></div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10"><p className="text-sm text-slate-400">Security</p>
                    <p className={`text-lg font-bold ${results.overallRisk === 'CRITICAL' ? 'text-red-400' : results.overallRisk === 'HIGH' ? 'text-orange-400' : results.overallRisk === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'}`}>{results.overallRisk}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {['ports', 'cves', 'details'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${activeTab === tab ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-slate-400 hover:bg-white/5'}`}>
                      {tab === 'cves' ? 'CVEs' : tab}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => copy(JSON.stringify(results, null, 2))} className="p-2 rounded-lg hover:bg-white/10"><Copy className="w-4 h-4 text-slate-400" /></button>
                  <button onClick={() => exportToJSON(results, 'portscan-results')} className="p-2 rounded-lg hover:bg-white/10"><Download className="w-4 h-4 text-slate-400" /></button>
                </div>
                {activeTab === 'ports' && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {results.ports?.map((p, i) => (
                      <div key={i} className={`p-3 rounded-lg border ${riskBg[p.risk] || 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-mono font-bold">{p.port}</span>
                            <span className="text-sm opacity-70">{p.service}</span>
                            {p.protocol && <span className="text-xs opacity-50">{p.protocol}</span>}
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${riskBg[p.risk]}`}>{p.risk}</span>
                        </div>
                        {p.description && <p className="text-xs text-slate-400 mb-0.5">{p.description}</p>}
                        {p.attackVector && <p className="text-xs text-red-300/60"><span className="text-red-400/80">Attacks:</span> {p.attackVector}</p>}
                      </div>
                    ))}
                    {!results.ports?.length && <p className="text-slate-500 text-center py-8">No open ports detected</p>}
                  </div>
                )}
                {activeTab === 'cves' && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {results.vulns?.map((cve, i) => (
                      <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                        <span className="text-sm text-red-300 font-mono">{cve.id || cve}</span>
                        <a href={cve.url || `https://nvd.nist.gov/vuln/detail/${cve.id || cve}`} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">NVD →</a>
                      </div>
                    ))}
                    {!results.vulns?.length && <p className="text-slate-500 text-center py-8">No CVEs found</p>}
                  </div>
                )}
                {activeTab === 'details' && (
                  <div className="space-y-3">
                    {results.location && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-sm text-slate-400 mb-2">Location</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div><p className="text-slate-500">Country</p><p className="text-white">{results.location.country || 'N/A'}</p></div>
                          <div><p className="text-slate-500">City</p><p className="text-white">{results.location.city || 'N/A'}</p></div>
                          <div><p className="text-slate-500">ISP</p><p className="text-white">{results.location.isp || 'N/A'}</p></div>
                          <div><p className="text-slate-500">ASN</p><p className="text-white">{results.location.asn || 'N/A'}</p></div>
                        </div>
                      </div>
                    )}
                    {results.hostnames?.length > 0 && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-sm text-slate-400 mb-2">Hostnames</p>
                        <div className="flex flex-wrap gap-1.5">{results.hostnames.map((h, i) => <span key={i} className="px-2 py-0.5 text-xs rounded bg-purple-500/20 text-purple-300">{h}</span>)}</div>
                      </div>
                    )}
                    {results.cpes?.length > 0 && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-sm text-slate-400 mb-2">CPEs / Technologies</p>
                        <div className="flex flex-wrap gap-1.5">{results.cpes.map((t, i) => <span key={i} className="px-2 py-0.5 text-xs rounded bg-blue-500/15 text-blue-300 font-mono">{t}</span>)}</div>
                      </div>
                    )}
                  </div>
                )}
                {results.recommendations?.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <p className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-2"><Shield className="w-4 h-4" /> Security Recommendations</p>
                    <div className="space-y-2">
                      {results.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-amber-200/80">
                          <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
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

export default PortScannerTool;
