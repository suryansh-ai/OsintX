import { useState, useCallback , useEffect} from 'react';
import { useToolResult } from '../../context/ToolResultContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Mail, Share2, AlertCircle, Loader2, Users, Database, Shield
} from 'lucide-react';
import { useToast } from '../common/Toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const BreachGraphTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { setLastResult } = useToolResult();
  // Auto-register result with global Save to Case button
  useEffect(() => {
    if (result) {
      setLastResult({ data: result, toolName: 'BreachGraph', query: email });
    }
  }, [result]);
  useEffect(() => () => setLastResult(null), []);  const [error, setError] = useState(null);

  const handleSearch = useCallback(async () => {
    if (!email || !email.includes('@')) { toast.error('Enter a valid email address'); return; }
    onConsume?.(15);
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await fetch(`${API_BASE}/tools/email/breach-graph`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Lookup failed');
      setResult(data);
      toast.success('Breach graph generated');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [email, onConsume, toast]);

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
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white">Breach Graph</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Email Breach Relationship Map</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-64px)]">
          <div className="flex items-center gap-2 rounded-xl bg-[#111827] border border-gray-800 focus-within:border-violet-500/50 transition-all overflow-hidden">
            <Mail className="w-4 h-4 text-gray-600 ml-4 flex-shrink-0" />
            <input value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="email@example.com" className="flex-1 bg-transparent text-white text-sm px-3 py-4 outline-none placeholder-gray-600" autoFocus />
            <button onClick={handleSearch} disabled={isLoading}
              className="px-5 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium hover:from-violet-500 hover:to-purple-500 transition-all flex items-center gap-2 disabled:opacity-50">
              <Search className="w-4 h-4" /> {isLoading ? 'Searching...' : 'Search'}
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Related Emails', value: result.nodes?.filter(n => n.type === 'email')?.length || 0, icon: Mail, color: 'text-blue-400' },
                    { label: 'Breaches', value: result.nodes?.filter(n => n.type === 'breach')?.length || 0, icon: Database, color: 'text-red-400' },
                    { label: 'Connections', value: result.edges?.length || 0, icon: Share2, color: 'text-violet-400' },
                    { label: 'Domains', value: result.nodes?.filter(n => n.type === 'domain')?.length || 0, icon: Shield, color: 'text-emerald-400' },
                  ].map((s) => (
                    <div key={s.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                      <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-2`} />
                      <p className="text-xl font-bold text-white">{s.value}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {result.nodes?.length > 0 && (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Graph Nodes</h5>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {result.nodes.map((n, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-400 py-1 px-2 rounded hover:bg-white/5">
                          <div className={`w-2 h-2 rounded-full ${n.type === 'email' ? 'bg-blue-400' : n.type === 'breach' ? 'bg-red-400' : 'bg-emerald-400'}`} />
                          <span className={n.type === 'email' ? 'text-blue-300' : n.type === 'breach' ? 'text-red-300' : 'text-emerald-300'}>
                            {n.label || n.id}
                          </span>
                          {n.breaches && <span className="text-gray-600 ml-auto">{n.breaches} breaches</span>}
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

export default BreachGraphTool;
