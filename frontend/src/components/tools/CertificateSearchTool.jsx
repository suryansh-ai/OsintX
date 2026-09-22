import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Lock, Copy, Download, RefreshCw, Shield, Calendar, Globe, Info, ExternalLink, CheckCircle, AlertCircle, AlertTriangle, Clock } from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CertificateSearchTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Certificate Search', query: query });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [activeTab, setActiveTab] = useState('live');
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5, speedX: (Math.random() - 0.5) * 0.3, speedY: (Math.random() - 0.5) * 0.3,
      color: ['#f59e0b', '#ef4444', '#22c55e', '#3b82f6'][Math.floor(Math.random() * 4)],
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
    trackToolUsage('certificate', 'search', 'start');
    setIsSearching(true); setResults(null); onConsume?.(12);
    try {
      const resp = await fetch(`${API_BASE}/tools/certificate/search`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: query.trim() }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || 'Search failed'); }
      const data = await resp.json();
      setResults(data);
      addToHistory('certificate', query, data);
      toast.success(`Found ${data.totalCertificates} certificates, ${data.uniqueSubdomains} subdomains`);
    } catch (err) { toast.error(err.message); }
    finally { setIsSearching(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }} onClick={e => e.stopPropagation()}
        className="relative w-full max-w-7xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-amber-950/10 to-slate-950 border border-amber-500/30 shadow-[0_0_100px_rgba(245,158,11,0.1)]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="relative z-10 flex flex-col max-h-[92vh]">
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30"><Lock className="w-6 h-6 text-amber-400" /></div>
              <div><h2 className="text-xl font-bold text-white">Certificate Search</h2><p className="text-sm text-slate-400">SSL/TLS Certificate Transparency & live cert analysis</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div className="p-6 border-b border-white/5">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Globe className="absolute w-5 h-5 left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter domain (e.g. google.com)" className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none" />
              </div>
              <button onClick={handleSearch} disabled={isSearching}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {isSearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {isSearching && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                <p className="mt-4 text-slate-400">Querying Certificate Transparency logs...</p>
              </div>
            )}
            {results && !isSearching && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400">Total Certificates</p>
                    <p className="text-2xl font-bold text-amber-400">{results.totalCertificates}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400">Unique Subdomains</p>
                    <p className="text-2xl font-bold text-blue-400">{results.uniqueSubdomains}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400">Live Certificate</p>
                    <p className={`text-2xl font-bold ${results.liveCertificate?.isExpired ? 'text-red-400' : 'text-green-400'}`}>
                      {results.liveCertificate ? (results.liveCertificate.isExpired ? 'EXPIRED' : `${results.liveCertificate.daysRemaining}d left`) : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {['live', 'certificates', 'domains'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${activeTab === tab ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:bg-white/5'}`}>
                      {tab === 'live' ? 'Live Cert' : tab}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => copy(JSON.stringify(results, null, 2))} className="p-2 rounded-lg hover:bg-white/10"><Copy className="w-4 h-4 text-slate-400" /></button>
                  <button onClick={() => exportToJSON(results, 'certificate-results')} className="p-2 rounded-lg hover:bg-white/10"><Download className="w-4 h-4 text-slate-400" /></button>
                </div>
                {activeTab === 'live' && results.liveCertificate && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10"><p className="text-xs text-slate-500">Issuer</p><p className="text-sm text-white">{results.liveCertificate.issuer?.O || results.liveCertificate.issuer?.CN}</p></div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10"><p className="text-xs text-slate-500">Key Size</p><p className="text-sm text-white">{results.liveCertificate.bits} bits</p></div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10"><p className="text-xs text-slate-500">Valid From</p><p className="text-sm text-white">{results.liveCertificate.validFrom}</p></div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10"><p className="text-xs text-slate-500">Valid To</p><p className="text-sm text-white">{results.liveCertificate.validTo}</p></div>
                    <div className="col-span-full p-3 rounded-lg bg-white/5 border border-white/10"><p className="text-xs text-slate-500">Fingerprint</p><p className="text-xs text-white font-mono break-all">{results.liveCertificate.fingerprint}</p></div>
                    {results.liveCertificate.altNames?.length > 0 && (
                      <div className="col-span-full p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-xs text-slate-500 mb-2">Subject Alt Names ({results.liveCertificate.altNames.length})</p>
                        <div className="flex flex-wrap gap-1">{results.liveCertificate.altNames.map((n, i) => <span key={i} className="px-2 py-0.5 text-xs rounded bg-amber-500/20 text-amber-300">{n}</span>)}</div>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'certificates' && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {results.certificates?.map((cert, i) => (
                      <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-white font-medium">{cert.commonName}</p>
                            <p className="text-xs text-slate-500">{cert.issuer}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400">{cert.notBefore} → {cert.notAfter}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'domains' && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400 mb-3">Discovered Domains ({results.discoveredDomains?.length})</p>
                    <div className="flex flex-wrap gap-1.5 max-h-96 overflow-y-auto">
                      {results.discoveredDomains?.map((d, i) => (
                        <span key={i} className="px-2 py-1 text-xs rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 cursor-pointer hover:bg-blue-500/25"
                          onClick={() => copy(d)}>{d}</span>
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

export default CertificateSearchTool;
