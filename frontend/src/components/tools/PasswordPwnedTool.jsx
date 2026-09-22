import { useState, useRef, useCallback , useEffect} from 'react';
import { useToolResult } from '../../context/ToolResultContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Shield, AlertTriangle, CheckCircle, Copy, RefreshCw,
  Key, Eye, EyeOff, ExternalLink, Search, Lock
} from 'lucide-react';
import { useToast } from '../common/Toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PasswordPwnedTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null);
  const { setLastResult } = useToolResult();
  // Auto-register result with global Save to Case button
  useEffect(() => {
    if (result) {
      setLastResult({ data: result, toolName: 'PasswordPwned', query: '' });
    }
  }, [result]);
  useEffect(() => () => setLastResult(null), []);
  const handleCheck = useCallback(async () => {
    if (!password) { toast.error('Enter a password to check'); return; }
    onConsume?.(10);
    setIsChecking(true);
    setResult(null);
    try {
      const resp = await fetch(`${API_BASE}/tools/password/pwned`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Check failed');
      setResult(data);
      if (data.pwned) {
        toast.error(`Pwned! Found ${data.pwnedCount.toLocaleString()} time(s)`);
      } else {
        toast.success('Not found in known breaches');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsChecking(false);
    }
  }, [password, onConsume, toast]);

  const getStrength = (count) => {
    if (count === 0) return { label: 'Not found', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    if (count < 10) return { label: 'Rarely pwned', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
    if (count < 1000) return { label: 'Commonly pwned', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
    if (count < 10000) return { label: 'Very common', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' };
    return { label: 'Extremely common', color: 'text-red-500', bg: 'bg-red-500/15', border: 'border-red-500/30' };
  };

  const strength = result ? getStrength(result.pwnedCount) : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 24 }} transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-lg h-auto max-h-[90vh] overflow-hidden rounded-2xl bg-[#0a0e17] border border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.3)]">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#0a0e17]/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white tracking-wide">Password Pwned</h1>
              <p className="text-[10px] text-gray-500 tracking-[0.2em] uppercase">HIBP k-Anonymity Check</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="relative group">
            <div className="relative flex items-center rounded-xl bg-[#111827] border border-gray-800 focus-within:border-emerald-600/50 transition-all duration-300 overflow-hidden">
              <Key className="w-4 h-4 text-gray-600 ml-4 flex-shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCheck()}
                placeholder="Enter password to check…"
                className="flex-1 bg-transparent text-white text-sm px-3 py-4 outline-none placeholder-gray-600 font-mono"
                autoFocus
              />
              <button onClick={() => setShowPassword(!showPassword)}
                className="p-2 text-gray-500 hover:text-gray-300 transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={handleCheck} disabled={isChecking}
                className="px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center gap-2 disabled:opacity-50">
                <Search className="w-4 h-4" /> {isChecking ? 'Checking…' : 'Check'}
              </button>
            </div>
          </div>

          <p className="text-[10px] text-gray-600 mt-3 flex items-center gap-1.5">
            <Lock className="w-3 h-3" /> Your password is never sent — only the first 5 chars of its SHA-1 hash
          </p>

          {/* ── Results ── */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} className="mt-6 space-y-4">

                {/* Main status card */}
                <div className={`p-5 rounded-xl ${result.pwned ? 'bg-red-500/10 border border-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                  <div className="flex items-center gap-3">
                    {result.pwned ? (
                      <AlertTriangle className="w-8 h-8 text-red-400" />
                    ) : (
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                    )}
                    <div>
                      <p className={`text-lg font-bold ${result.pwned ? 'text-red-400' : 'text-emerald-400'}`}>
                        {result.pwned ? 'Password has been pwned!' : 'Password not found in breaches'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Checked against {result.pwnedCount.toLocaleString() || 'known'} breach records
                      </p>
                    </div>
                  </div>

                  {/* Count ring */}
                  <div className="flex items-center justify-center gap-6 mt-5">
                    <div className="text-center">
                      <p className={`text-3xl font-bold ${strength.color}`}>
                        {result.pwnedCount.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-1">Times pwned</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-bold ${strength.color} px-3 py-1 rounded-full ${strength.bg} ${strength.border} border`}>
                        {strength.label}
                      </p>
                      <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-2">Severity</p>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Technical Details</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-gray-500">Hash Prefix (SHA-1)</span>
                      <span className="text-gray-300 font-mono text-[10px]">{result.sha1Prefix}…</span>
                    </div>
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-gray-500">API</span>
                      <span className="text-gray-300">Have I Been Pwned (k-Anonymity)</span>
                    </div>
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-gray-500">Privacy</span>
                      <span className="text-gray-300">Full password never leaves this device</span>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {result.pwned && (
                  <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/15">
                    <h5 className="text-xs text-orange-400 uppercase tracking-wider mb-2">Recommendations</h5>
                    <ul className="space-y-1.5 text-xs text-gray-400">
                      <li className="flex items-start gap-2">• Change this password immediately</li>
                      <li className="flex items-start gap-2">• Use a unique password for every account</li>
                      <li className="flex items-start gap-2">• Enable 2FA wherever possible</li>
                      <li className="flex items-start gap-2">• Consider a password manager</li>
                    </ul>
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

export default PasswordPwnedTool;
