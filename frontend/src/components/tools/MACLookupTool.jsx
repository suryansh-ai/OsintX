import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Zap, Wifi, Copy, Download, RefreshCw, CheckCircle,
  Info, Server, Globe, Cpu, Radio, Shield
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MACLookupTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();

  const [mac, setMac] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'M A C Lookup', query: '' });
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
      color: ['#8b5cf6', '#6366f1', '#a855f7', '#c084fc'][Math.floor(Math.random() * 4)],
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
    if (!mac.trim()) { toast.error('Enter a MAC address'); return; }
    trackToolUsage('mac', 'lookup', 'start');
    setIsSearching(true); setResults(null); onConsume?.(8);
    try {
      const resp = await fetch(`${API_BASE}/tools/mac/lookup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac: mac.trim() }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || 'Lookup failed'); }
      const data = await resp.json();
      setResults(data);
      addToHistory('mac', mac, data);
      toast.success(`Vendor: ${data.vendor}`);
      trackToolUsage('mac', 'lookup', 'success');
    } catch (err) { toast.error(err.message); trackToolUsage('mac', 'lookup', 'error'); }
    finally { setIsSearching(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }} onClick={e => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-violet-950/15 to-slate-950 border border-violet-500/30 shadow-[0_0_100px_rgba(139,92,246,0.1)]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Header */}
        <div className="relative px-3 sm:px-6 py-3 sm:py-5 border-b border-violet-500/20 bg-slate-950/60 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-5 min-w-0 flex-1">
              <motion.div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg">
                <Wifi className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </motion.div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span className="truncate">MAC Lookup</span>
                  <span className="px-2 py-0.5 text-[10px] sm:text-xs bg-violet-500/20 text-violet-300 rounded-full border border-violet-500/30">OUI</span>
                </h2>
                <p className="text-xs sm:text-sm text-violet-300/70 truncate">Device vendor identification from MAC address</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => { setMac(''); setResults(null); }} className="p-2 rounded-lg bg-white/5 hover:bg-violet-500/20 border border-white/10 transition-all"><RefreshCw className="w-4 h-4 text-violet-400" /></motion.button>
              <motion.button whileHover={{ scale: 1.05 }} disabled={!results} onClick={() => { if (results) { exportToJSON(results, `mac_${results.macAddress}_${Date.now()}.json`); toast.success('Exported'); } }} className="hidden sm:flex p-2 rounded-lg bg-white/5 hover:bg-emerald-500/20 border border-white/10 transition-all disabled:opacity-50"><Download className="w-4 h-4 text-emerald-400" /></motion.button>
              <div className="hidden sm:flex px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /><span className="text-lg font-bold text-amber-300">8</span><span className="text-xs text-amber-200/70">credits</span></div>
              <motion.button whileHover={{ scale: 1.1, rotate: 90 }} onClick={onClose} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 transition-all"><X className="w-4 h-4 text-gray-400" /></motion.button>
            </div>
          </div>
        </div>

        <div className="relative p-3 sm:p-6 overflow-y-auto max-h-[calc(92vh-80px)]">
          {/* Search */}
          <div className="mb-5 p-3 sm:p-6 rounded-2xl bg-slate-900/60 border border-violet-500/20 backdrop-blur-sm">
            <label className="text-violet-300 text-xs sm:text-sm font-medium mb-2 flex items-center gap-2"><Wifi className="w-4 h-4" />MAC Address</label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-2">
              <div className="flex-1 relative">
                <Wifi className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" />
                <input type="text" value={mac} onChange={e => setMac(e.target.value)} placeholder="AA:BB:CC:DD:EE:FF" onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl bg-slate-800/80 border-2 border-violet-500/30 text-white text-sm sm:text-lg placeholder-gray-500 focus:outline-none focus:border-violet-400 transition-all font-mono" />
              </div>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleSearch} disabled={isSearching || !mac.trim()}
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg">
                {isSearching ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Search className="w-5 h-5" /></motion.div> : <Search className="w-5 h-5" />}
                <span>{isSearching ? 'Looking up...' : 'Lookup'}</span>
              </motion.button>
            </div>
          </div>

          <AnimatePresence>
            {results && (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Main Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900/80 via-violet-900/10 to-slate-900/80 border border-violet-500/20">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg">
                      <Cpu className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-2xl font-bold text-white mb-1">{results.vendor}</h3>
                      <p className="text-violet-300 text-sm">{results.deviceType}</p>
                      <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                        <span className="font-mono text-gray-400 text-sm">{results.macAddress}</span>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { copy(results.macAddress); toast.success('Copied!'); }} className="p-1 rounded hover:bg-white/10"><Copy className="w-3 h-3 text-gray-500" /></motion.button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { label: 'OUI Prefix', value: results.oui, icon: Radio, color: 'violet' },
                    { label: 'MAC Prefix', value: results.macPrefix, icon: Server, color: 'blue' },
                    { label: 'Block Type', value: results.blockType, icon: Shield, color: 'emerald' },
                    { label: 'Country', value: results.country || 'N/A', icon: Globe, color: 'amber' },
                    { label: 'Address Type', value: results.additionalInfo?.addressType || 'N/A', icon: Info, color: 'cyan' },
                    { label: 'Block Size', value: results.additionalInfo?.blockSize || 'N/A', icon: Info, color: 'purple' },
                  ].map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      className={`p-4 rounded-xl bg-slate-900/60 border border-${item.color}-500/20`}>
                      <div className="flex items-center gap-3">
                        <item.icon className={`w-5 h-5 text-${item.color}-400 flex-shrink-0`} />
                        <div>
                          <div className="text-xs text-gray-500">{item.label}</div>
                          <div className="text-white font-medium text-sm font-mono">{item.value}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Flags */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-violet-500/10">
                  <h4 className="text-violet-300 text-sm font-medium mb-3">Address Properties</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1.5 rounded-lg text-xs border ${results.isMulticast ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {results.isMulticast ? '📡 Multicast' : '📍 Unicast'}
                    </span>
                    <span className={`px-3 py-1.5 rounded-lg text-xs border ${results.isLocallyAdministered ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {results.isLocallyAdministered ? '🏠 Locally Administered' : '🌐 IEEE Registered (Universal)'}
                    </span>
                  </div>
                </div>

                {/* Data Sources */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-gray-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400 text-xs"><Info className="w-3 h-3" />Sources: {results.dataSources?.join(', ')}</div>
                    <div className="text-gray-500 text-xs">{results.searchDuration}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!results && !isSearching && (
            <div className="flex flex-col items-center justify-center py-16">
              <Wifi className="w-16 h-16 text-violet-500/30 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">MAC Address Lookup</h3>
              <p className="text-gray-400 text-center max-w-md text-sm">Identify the device manufacturer/vendor from a MAC address. Supports formats like AA:BB:CC:DD:EE:FF, AA-BB-CC-DD-EE-FF, or AABBCCDDEEFF.</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MACLookupTool;
