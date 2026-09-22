import { useState, useCallback , useEffect} from 'react';
import { useToolResult } from '../../context/ToolResultContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Link2, Shield, AlertTriangle, CheckCircle,
  AlertCircle, Loader2, ExternalLink
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SafeBrowsingTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const [url, setUrl] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null);
  const { setLastResult } = useToolResult();
  // Auto-register result with global Save to Case button
  useEffect(() => {
    if (result) {
      setLastResult({ data: result, toolName: 'SafeBrowsing', query: url });
    }
  }, [result]);
  useEffect(() => () => setLastResult(null), []);  const [error, setError] = useState(null);

  const handleCheck = useCallback(async () => {
    if (!url.trim()) { toast.error('Enter a URL to check'); return; }
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    onConsume?.(10);
    setIsChecking(true);
    setError(null);
    setResult(null);
    try {
      const resp = await fetchWithTimeout(`${API_BASE}/tools/url/safe-browsing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Check failed');
      setResult(data);
      if (data.malicious) {
        toast.error('URL flagged as unsafe!');
      } else {
        toast.success('URL appears safe');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsChecking(false);
    }
  }, [url, onConsume, toast]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 24 }} transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-lg h-auto max-h-[90vh] overflow-hidden rounded-2xl bg-[#0a0e17] border border-white/10">

        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#0a0e17]/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white">Safe Browsing</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Google Safe Browsing Check</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 rounded-xl bg-[#111827] border border-gray-800 focus-within:border-emerald-500/50 transition-all overflow-hidden">
            <Link2 className="w-4 h-4 text-gray-600 ml-4 flex-shrink-0" />
            <input value={url} onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCheck()}
              placeholder="https://example.com" className="flex-1 bg-transparent text-white text-sm px-3 py-4 outline-none placeholder-gray-600 font-mono" autoFocus />
            <button onClick={handleCheck} disabled={isChecking}
              className="px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center gap-2 disabled:opacity-50">
              <Search className="w-4 h-4" /> {isChecking ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking...</> : 'Check'}
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
                <div className={`p-5 rounded-xl ${result.malicious ? 'bg-red-500/10 border border-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                  <div className="flex items-center gap-3">
                    {result.malicious ? (
                      <AlertTriangle className="w-8 h-8 text-red-400" />
                    ) : (
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                    )}
                    <div>
                      <p className={`text-lg font-bold ${result.malicious ? 'text-red-400' : 'text-emerald-400'}`}>
                        {result.malicious ? 'URL flagged as unsafe!' : 'URL appears safe'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 break-all">{result.checkedUrl || url}</p>
                    </div>
                  </div>
                </div>

                {result.threats?.length > 0 && (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Threats Found</h5>
                    <div className="space-y-2">
                      {result.threats.map((t, i) => (
                        <div key={i} className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                          <p className="text-xs text-red-400 font-medium">{t.threatType || 'Unknown threat'}</p>
                          {t.platform && <p className="text-[10px] text-gray-500 mt-0.5">Platform: {t.platform}</p>}
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

export default SafeBrowsingTool;
