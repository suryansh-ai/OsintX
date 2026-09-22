import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Zap, Copy, Download, RefreshCw, ExternalLink, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Clock, DollarSign, Activity, Shield, Link2,
  Fingerprint, Eye, Globe, Skull, Ban
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CryptoTracerTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();

  const [address, setAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Crypto Tracer', query: address });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [enrichedResults, setEnrichedResults] = useState(null);
  const [enriching, setEnriching] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 35 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5, speedX: (Math.random() - 0.5) * 0.3, speedY: (Math.random() - 0.5) * 0.3,
      color: ['#f7931a', '#627eea', '#26a17b', '#e84142'][Math.floor(Math.random() * 4)],
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

  const handleSearch = async () => {
    if (!address.trim()) { toast.error('Enter a wallet address'); return; }
    trackToolUsage('crypto', 'trace', 'start');
    setIsSearching(true); setResults(null); onConsume?.(15);
    try {
      const resp = await fetchWithTimeout(`${API_BASE}/tools/crypto/trace`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim() }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || 'Trace failed'); }
      const data = await resp.json();
      setResults(data); setActiveTab('overview');
      addToHistory('crypto', address, data);
      toast.success(`${data.type} wallet analyzed!`);
      trackToolUsage('crypto', 'trace', 'success');
      fetchEnriched(address.trim());
    } catch (err) { toast.error(err.message); trackToolUsage('crypto', 'trace', 'error'); }
    finally { setIsSearching(false); }
  };

  const fetchEnriched = async (addr) => {
    if (!addr) return;
    setEnriching(true);
    try {
      const resp = await fetchWithTimeout(`${API_BASE}/tools/crypto/enriched`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setEnrichedResults(data);
      }
    } catch (e) { /* enrichment is non-critical */ }
    finally { setEnriching(false); }
  };

  const isBTC = results?.type === 'Bitcoin';
  const isTRX = results?.type?.includes('Tron');
  const accentColor = isBTC ? 'amber' : isTRX ? 'red' : 'indigo';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }} onClick={e => e.stopPropagation()}
        className="relative w-full max-w-7xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-amber-950/10 to-slate-950 border border-amber-500/30 shadow-[0_0_100px_rgba(245,158,11,0.1)]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Header */}
        <div className="relative px-3 sm:px-6 py-3 sm:py-5 border-b border-amber-500/20 bg-slate-950/60 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-5 min-w-0 flex-1">
              <motion.div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center bg-gradient-to-br from-amber-600 to-orange-600 shadow-lg">
                <DollarSign className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </motion.div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span className="truncate">Crypto Tracer</span>
                  <span className="px-2 py-0.5 text-[10px] sm:text-xs bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">Blockchain</span>
                </h2>
                <p className="text-xs sm:text-sm text-amber-300/70 truncate">Bitcoin & Ethereum wallet intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => { setAddress(''); setResults(null); }} className="p-2 rounded-lg bg-white/5 hover:bg-amber-500/20 border border-white/10 transition-all"><RefreshCw className="w-4 h-4 text-amber-400" /></motion.button>
              <motion.button whileHover={{ scale: 1.05 }} disabled={!results} onClick={() => { if (results) { exportToJSON(results, `crypto_${results.address}_${Date.now()}.json`); toast.success('Exported'); } }} className="hidden sm:flex p-2 rounded-lg bg-white/5 hover:bg-emerald-500/20 border border-white/10 transition-all disabled:opacity-50"><Download className="w-4 h-4 text-emerald-400" /></motion.button>
              <div className="hidden sm:flex px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /><span className="text-lg font-bold text-amber-300">15</span><span className="text-xs text-amber-200/70">credits</span></div>
              <motion.button whileHover={{ scale: 1.1, rotate: 90 }} onClick={onClose} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 transition-all"><X className="w-4 h-4 text-gray-400" /></motion.button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative p-3 sm:p-6 overflow-y-auto max-h-[calc(92vh-80px)]">
          {/* Search */}
          <div className="mb-5 p-3 sm:p-6 rounded-2xl bg-slate-900/60 border border-amber-500/20 backdrop-blur-sm">
            <label className="text-amber-300 text-xs sm:text-sm font-medium mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4" />Wallet Address (BTC or ETH)</label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-2">
              <div className="flex-1 relative">
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa or 0x..." onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="w-full px-4 py-3 sm:py-4 rounded-xl bg-slate-800/80 border-2 border-amber-500/30 text-white text-sm sm:text-lg placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-all font-mono" />
              </div>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleSearch} disabled={isSearching || !address.trim()}
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg">
                {isSearching ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Search className="w-5 h-5" /></motion.div> : <Search className="w-5 h-5" />}
                <span>{isSearching ? 'Tracing...' : 'Trace'}</span>
              </motion.button>
            </div>
          </div>

          {/* Results */}
          <AnimatePresence>
            {results && (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                {/* Wallet Overview */}
                <div className="mb-5 p-5 rounded-2xl bg-gradient-to-r from-slate-900/80 via-amber-900/10 to-slate-900/80 border border-amber-500/20">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${isBTC ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : isTRX ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'}`}>{results.type}</span>
                        {results.isContract && <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">Contract</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs font-mono truncate max-w-xs">{results.address}</span>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { copy(results.address); toast.success('Copied!'); }} className="p-1 rounded hover:bg-white/10"><Copy className="w-3 h-3 text-gray-500" /></motion.button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${isBTC ? 'text-amber-400' : 'text-indigo-400'}`}>{results.balance}</div>
                      {results.balanceUSD && <div className="text-gray-400 text-sm">{results.balanceUSD}</div>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-white/5 text-center">
                      <div className="text-xl font-bold text-blue-400">{results.transactionCount || 0}</div>
                      <div className="text-xs text-gray-400">Transactions</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-white/5 text-center">
                      <div className="text-sm font-bold text-emerald-400 truncate">{results.totalReceived || 'N/A'}</div>
                      <div className="text-xs text-gray-400">Total Received</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-white/5 text-center">
                      <div className="text-sm font-bold text-red-400 truncate">{results.totalSent || 'N/A'}</div>
                      <div className="text-xs text-gray-400">Total Sent</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-white/5 text-center">
                      <div className="text-sm font-bold text-amber-400">{results.firstSeen ? new Date(results.firstSeen).toLocaleDateString() : 'N/A'}</div>
                      <div className="text-xs text-gray-400">First Seen</div>
                    </div>
                  </div>
                </div>

                {/* Risk Indicators */}
                {results.riskIndicators?.length > 0 && (
                  <div className="mb-5 p-4 rounded-2xl bg-slate-900/60 border border-red-500/20">
                    <h4 className="text-red-300 font-semibold mb-3 flex items-center gap-2"><Shield className="w-4 h-4" />Risk Indicators</h4>
                    <div className="space-y-2">
                      {results.riskIndicators.map((r, i) => (
                        <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${r.severity === 'high' ? 'bg-red-500/10 border border-red-500/20' : r.severity === 'medium' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                          <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${r.severity === 'high' ? 'text-red-400' : r.severity === 'medium' ? 'text-amber-400' : 'text-blue-400'}`} />
                          <div>
                            <div className="text-white text-sm font-medium">{r.indicator}</div>
                            <div className="text-gray-400 text-xs">{r.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Transactions */}
                {results.recentTransactions?.length > 0 && (
                  <div className="mb-5 p-4 rounded-2xl bg-slate-900/60 border border-blue-500/20">
                    <h4 className="text-blue-300 font-semibold mb-3 flex items-center gap-2"><Activity className="w-4 h-4" />Recent Transactions</h4>
                    <div className="space-y-2">
                      {results.recentTransactions.map((tx, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-white/5">
                          {tx.type === 'received' ? <ArrowDownRight className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <ArrowUpRight className="w-4 h-4 text-red-400 flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-xs font-mono truncate">{tx.hash}</div>
                            <div className="text-gray-500 text-xs">{tx.time ? new Date(tx.time).toLocaleString() : 'Unconfirmed'}</div>
                          </div>
                          <div className={`text-sm font-bold ${tx.type === 'received' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {tx.type === 'received' ? '+' : '-'}{tx.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Abuse Reports */}
                {results.abuseReport?.reported && (
                  <div className="mb-5 p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
                    <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Abuse Reports</h4>
                    <div className="text-red-300 text-sm">
                      <span className="font-bold">{results.abuseReport.count}</span> abuse report(s) found on BitcoinAbuse.com
                      {results.abuseReport.lastReport && <span className="text-gray-400 ml-2">— Last: {results.abuseReport.lastReport}</span>}
                    </div>
                  </div>
                )}

                {/* Token Balances (Tron TRC20) */}
                {results.tokenBalances?.length > 0 && (
                  <div className="mb-5 p-4 rounded-2xl bg-slate-900/60 border border-purple-500/20">
                    <h4 className="text-purple-300 font-semibold mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4" />Token Balances</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {results.tokenBalances.map((token, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-800/60 border border-white/5 text-center">
                          <div className="text-sm font-bold text-white">{token.balance}</div>
                          <div className="text-xs text-purple-300">{token.symbol || token.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Explorers */}
                {results.explorers?.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-emerald-500/20">
                    <h4 className="text-emerald-300 font-semibold mb-3 flex items-center gap-2"><Link2 className="w-4 h-4" />Block Explorers</h4>
                    <div className="flex flex-wrap gap-2">
                      {results.explorers.map((exp, i) => (
                        <a key={i} href={exp.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/40 transition-all text-sm">
                          <ExternalLink className="w-4 h-4" />{exp.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Enrichment: Wallet Labeling ── */}
                {enrichedResults?.walletLabeling?.labels?.length > 0 && (
                  <div className="mb-5 p-4 rounded-2xl bg-slate-900/60 border border-amber-500/20">
                    <h4 className="text-amber-300 font-semibold mb-3 flex items-center gap-2"><Fingerprint className="w-4 h-4" />Wallet Labeling</h4>
                    <div className="space-y-2">
                      {enrichedResults.walletLabeling.labels.map((l, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-white/5">
                          <span className="text-sm text-white">{l.label}</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${l.category === 'exchange' ? 'bg-blue-500/20 text-blue-400' : l.category === 'tumbler/mixer' ? 'bg-red-500/20 text-red-400' : l.category === 'darknet_market' ? 'bg-purple-500/20 text-purple-400' : l.category === 'ofac_sanctioned' ? 'bg-red-600/20 text-red-400' : 'bg-slate-500/20 text-slate-400'} border border-white/10`}>
                            {l.category.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Enrichment: Chain Hopping ── */}
                {enrichedResults?.chainHopping?.patterns?.length > 0 && (
                  <div className="mb-5 p-4 rounded-2xl bg-slate-900/60 border border-indigo-500/20">
                    <h4 className="text-indigo-300 font-semibold mb-3 flex items-center gap-2"><Globe className="w-4 h-4" />Chain Hopping Patterns</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {enrichedResults.chainHopping.patterns.map((p, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-800/40 border border-white/5 flex items-center gap-2">
                          <span className="text-xs font-mono text-amber-400">{p.from}</span>
                          <span className="text-xs text-gray-500">→</span>
                          <span className="text-xs font-mono text-emerald-400">{p.to}</span>
                          <span className="text-[10px] text-gray-500 ml-auto">{p.method}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Enrichment: Address Clustering ── */}
                {enrichedResults?.addressClustering?.commonOwnership?.length > 0 && (
                  <div className="mb-5 p-4 rounded-2xl bg-slate-900/60 border border-cyan-500/20">
                    <h4 className="text-cyan-300 font-semibold mb-3 flex items-center gap-2"><Eye className="w-4 h-4" />Address Clustering</h4>
                    <div className="space-y-2">
                      {enrichedResults.addressClustering.commonOwnership.map((co, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-800/40 border border-white/5">
                          <p className="text-xs text-gray-400">{co.note}</p>
                          <p className="text-xs font-mono text-white mt-1 truncate">{co.address}</p>
                          <span className="text-[10px] text-gray-600 mt-0.5">Confidence: {co.confidence}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Enrichment: Darknet Flags ── */}
                {enrichedResults?.darknetFlags?.flagged && (
                  <div className="mb-5 p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
                    <h4 className="text-red-400 font-semibold mb-3 flex items-center gap-2"><Skull className="w-4 h-4" />Darknet Market Flags</h4>
                    <div className="space-y-2">
                      {enrichedResults.darknetFlags.flags.map((f, i) => (
                        <div key={i} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                          <p className="text-sm text-red-300 font-medium">{f.market}</p>
                          <p className="text-xs text-red-400/70">{f.note}</p>
                          <span className="text-[10px] text-gray-500 mt-1">Confidence: {f.confidence} • Source: {f.source || 'walletexplorer.com'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Enrichment: OFAC Sanctions ── */}
                {enrichedResults?.ofacSanctions?.sanctioned && (
                  <div className="mb-5 p-4 rounded-2xl bg-red-600/10 border border-red-600/30">
                    <h4 className="text-red-400 font-semibold mb-3 flex items-center gap-2"><Ban className="w-4 h-4" />OFAC Sanctions</h4>
                    <div className="space-y-2">
                      {enrichedResults.ofacSanctions.matches.map((m, i) => (
                        <div key={i} className="p-3 rounded-xl bg-red-600/10 border border-red-600/20">
                          <p className="text-sm text-red-300 font-medium">{m.entity}</p>
                          <p className="text-xs text-gray-400 mt-1">Program: {m.program || enrichedResults.ofacSanctions.program}</p>
                          <span className="text-[10px] text-red-400/70">Confidence: {m.confidence}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {enriching && (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
                    <span className="ml-2 text-sm text-gray-400">Running enrichment...</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!results && !isSearching && (
            <div className="flex flex-col items-center justify-center py-16">
              <DollarSign className="w-16 h-16 text-amber-500/30 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Cryptocurrency Wallet Tracer</h3>
              <p className="text-gray-400 text-center max-w-md text-sm">Enter a Bitcoin, Ethereum, or Tron wallet address to view balance, transaction history, risk indicators, and blockchain analytics.</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CryptoTracerTool;
