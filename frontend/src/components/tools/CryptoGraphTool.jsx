import { useState, useCallback , useEffect} from 'react';
import { useToolResult } from '../../context/ToolResultContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Wallet, ArrowRight, AlertCircle, Loader2, ExternalLink, Share2, Bitcoin
} from 'lucide-react';
import { useToast } from '../common/Toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CryptoGraphTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState('bitcoin');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { setLastResult } = useToolResult();
  // Auto-register result with global Save to Case button
  useEffect(() => {
    if (result) {
      setLastResult({ data: result, toolName: 'CryptoGraph', query: address });
    }
  }, [result]);
  useEffect(() => () => setLastResult(null), []);  const [error, setError] = useState(null);

  const handleSearch = useCallback(async () => {
    if (!address.trim()) { toast.error('Enter a wallet address'); return; }
    onConsume?.(18);
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await fetch(`${API_BASE}/tools/crypto/graph`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim(), chain }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Lookup failed');
      setResult(data);
      toast.success('Transaction graph generated');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [address, chain, onConsume, toast]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 24 }} transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-2xl h-auto max-h-[90vh] overflow-hidden rounded-2xl bg-[#0a0e17] border border-white/10">

        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#0a0e17]/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Bitcoin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white">Crypto Graph</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Transaction Flow Visualization</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-64px)]">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-xl bg-[#111827] border border-gray-800 focus-within:border-amber-500/50 transition-all overflow-hidden">
              <Wallet className="w-4 h-4 text-gray-600 ml-4 flex-shrink-0" />
              <input value={address} onChange={e => setAddress(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Wallet address (BTC/ETH)..." className="flex-1 bg-transparent text-white text-sm px-3 py-4 outline-none placeholder-gray-600 font-mono" autoFocus />
            </div>
            <select value={chain} onChange={e => setChain(e.target.value)}
              className="bg-[#111827] border border-gray-800 rounded-xl text-gray-300 text-sm px-3 py-2 outline-none focus:border-amber-500/50">
              <option value="bitcoin">BTC</option>
              <option value="ethereum">ETH</option>
            </select>
            <button onClick={handleSearch} disabled={isLoading}
              className="px-5 py-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-medium hover:from-amber-500 hover:to-orange-500 transition-all flex items-center gap-2 disabled:opacity-50">
              <Search className="w-4 h-4" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}

            {result && (
              <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Wallets', value: result.nodes?.filter(n => n.type === 'wallet')?.length || 0, color: 'text-amber-400' },
                    { label: 'Transactions', value: result.edges?.length || 0, color: 'text-orange-400' },
                  ].map((s) => (
                    <div key={s.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                      <Wallet className={`w-5 h-5 ${s.color} mx-auto mb-2`} />
                      <p className="text-xl font-bold text-white">{s.value}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {result.nodes?.length > 0 && (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Transaction Flow</h5>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {result.nodes.slice(0, 20).map((n, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-400 py-2 px-3 rounded-lg bg-white/[0.03] border border-white/5">
                          <Wallet className="w-3 h-3 text-amber-400 flex-shrink-0" />
                          <span className="font-mono text-[10px] truncate">{n.address || n.id}</span>
                          {n.balance !== undefined && (
                            <span className="ml-auto text-gray-500">{n.balance} BTC</span>
                          )}
                          {n.txCount !== undefined && (
                            <span className="text-gray-600">{n.txCount} txs</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.edges?.length > 0 && (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <ArrowRight className="w-3 h-3" /> Recent Transactions
                    </h5>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {result.edges.slice(0, 30).map((e, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] text-gray-400 py-1 px-2 rounded hover:bg-white/5">
                          <span className="font-mono truncate max-w-[120px]">{e.from?.slice(0, 12)}...</span>
                          <ArrowRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
                          <span className="font-mono truncate max-w-[120px]">{e.to?.slice(0, 12)}...</span>
                          {e.value && <span className="ml-auto text-gray-500">{e.value} BTC</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CryptoGraphTool;
