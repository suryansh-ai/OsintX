import { useState, useCallback , useEffect} from 'react';
import { useToolResult } from '../../context/ToolResultContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Globe, Server, ChevronDown, ChevronUp,
  Loader2, AlertTriangle, CheckCircle, Info, ExternalLink,
  Network, Shield, Activity, Clock, List
} from 'lucide-react';
import { useToast } from '../common/Toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DNSBruteForceTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const [domain, setDomain] = useState('');
  const [scanType, setScanType] = useState('common');
  const [useCrtsh, setUseCrtsh] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  const { setLastResult } = useToolResult();
  // Auto-register result with global Save to Case button
  useEffect(() => {
    if (result) {
      setLastResult({ data: result, toolName: 'DNSBruteForce', query: domain });
    }
  }, [result]);
  useEffect(() => () => setLastResult(null), []);  const [showRaw, setShowRaw] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);

  const handleScan = useCallback(async () => {
    const d = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
    if (!d || !d.includes('.')) { toast.error('Enter a valid domain (e.g., example.com)'); return; }
    onConsume?.(12);
    setIsScanning(true);
    setResult(null);
    setSelectedSub(null);
    try {
      const resp = await fetch(`${API_BASE}/tools/dns/bruteforce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: d, scanType, useCrtsh }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Scan failed');
      setResult(data);
      toast.success(`Found ${data.subdomains?.length || 0} subdomains in ${data.time || 'N/A'}s`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsScanning(false);
    }
  }, [domain, scanType, useCrtsh, onConsume, toast]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 24 }} transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-3xl h-auto max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0a0e17] border border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.3)]">

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#0a0e17]/80 sticky top-0 z-10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/30">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white tracking-wide">DNS Brute-force</h1>
              <p className="text-[10px] text-gray-500 tracking-[0.2em] uppercase">Subdomain Discovery</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Input */}
          <div className="flex gap-2">
            <div className="relative flex-1 flex items-center rounded-xl bg-[#111827] border border-gray-800 focus-within:border-indigo-600/50 transition-all overflow-hidden">
              <Globe className="w-4 h-4 text-gray-500 ml-4 flex-shrink-0" />
              <input
                type="text"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleScan()}
                placeholder="example.com"
                className="flex-1 bg-transparent text-white text-sm px-3 py-4 outline-none placeholder-gray-600 font-mono"
                autoFocus
              />
            </div>
            <button onClick={handleScan} disabled={isScanning}
              className="px-5 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium hover:from-indigo-500 hover:to-violet-500 transition-all flex items-center gap-2 rounded-xl disabled:opacity-50">
              {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {isScanning ? 'Scanning...' : 'Brute-force'}
            </button>
          </div>

          {/* Options */}
          <div className="flex gap-3 items-center">
            <select value={scanType} onChange={e => setScanType(e.target.value)}
              className="bg-[#111827] border border-gray-800 rounded-xl text-gray-400 text-xs px-3 py-2 outline-none focus:border-indigo-600/50">
              <option value="common">Common (186 subs)</option>
              <option value="extended">Extended (1500+ subs)</option>
            </select>
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
              <input type="checkbox" checked={useCrtsh} onChange={e => setUseCrtsh(e.target.checked)}
                className="rounded bg-gray-800 border-gray-700 text-indigo-500 focus:ring-indigo-500" />
              crt.sh
            </label>
          </div>

          {/* Results */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

                {/* Stats bar */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <p className="text-xl text-white font-bold">{result.totalFound}</p>
                    <p className="text-[10px] text-gray-500">Found</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <p className="text-xl text-white font-bold">{result.totalChecked}</p>
                    <p className="text-[10px] text-gray-500">Checked</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <p className="text-xl text-indigo-400 font-bold">{result.elapsedSeconds}s</p>
                    <p className="text-[10px] text-gray-500">Time</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <p className="text-xl text-gray-400 font-bold">{result.wordlistSize}</p>
                    <p className="text-[10px] text-gray-500">Wordlist</p>
                  </div>
                </div>

                {/* Subdomain list */}
                {result.subdomains?.length > 0 ? (
                  <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                    {result.subdomains.map((sub, i) => (
                      <div key={sub.subdomain}
                        onClick={() => setSelectedSub(selectedSub?.subdomain === sub.subdomain ? null : sub)}
                        className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer transition-all hover:border-indigo-500/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5 text-gray-500" />
                            <code className="text-xs font-mono text-gray-300">
                              {sub.fqdn}
                            </code>
                          </div>
                          <div className="flex items-center gap-2">
                            {sub.records.a && <span className="text-[9px] text-emerald-500 px-1.5 py-0.5 rounded bg-emerald-500/10">A</span>}
                            {sub.records.aaaa && <span className="text-[9px] text-cyan-500 px-1.5 py-0.5 rounded bg-cyan-500/10">AAAA</span>}
                            {sub.records.cname && <span className="text-[9px] text-amber-500 px-1.5 py-0.5 rounded bg-amber-500/10">CNAME</span>}
                            {sub.records.mx && <span className="text-[9px] text-purple-500 px-1.5 py-0.5 rounded bg-purple-500/10">MX</span>}
                            {sub.records.txt && <span className="text-[9px] text-pink-500 px-1.5 py-0.5 rounded bg-pink-500/10">TXT</span>}
                          </div>
                        </div>
                        {/* Expanded details */}
                        <AnimatePresence>
                          {selectedSub?.subdomain === sub.subdomain && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              className="mt-2 pt-2 border-t border-white/5 space-y-1 overflow-hidden">
                              {Object.entries(sub.records).map(([type, addrs]) =>
                                addrs.length > 0 && (
                                  <div key={type} className="flex items-start gap-2 text-[10px]">
                                    <span className="text-gray-500 uppercase w-10 flex-shrink-0">{type}</span>
                                    <div className="flex flex-wrap gap-1">
                                      {addrs.map((addr, j) => (
                                        <code key={j} className="text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">
                                          {addr.length > 80 ? addr.substring(0, 80) + '...' : addr}
                                        </code>
                                      ))}
                                    </div>
                                  </div>
                                )
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 text-sm">No subdomains found</div>
                )}

                {/* Sources */}
                <div className="flex flex-wrap gap-1.5">
                  {(result.sources || []).map((s, i) => (
                    <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{s}</span>
                  ))}
                </div>

                {/* Raw toggle */}
                <div className="flex items-center justify-between pt-2">
                  {result?.timestamp && <span className="text-[10px] text-gray-600">{new Date(result.timestamp).toLocaleString()}</span>}
                  <button onClick={() => setShowRaw(!showRaw)}
                    className="flex items-center gap-2 text-[10px] text-gray-600 hover:text-gray-400 transition-colors ml-auto">
                    {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />} Raw JSON
                  </button>
                </div>
                {showRaw && (
                  <pre className="text-[10px] text-gray-500 bg-black/30 rounded-xl p-4 overflow-x-auto max-h-48 leading-relaxed">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DNSBruteForceTool;
