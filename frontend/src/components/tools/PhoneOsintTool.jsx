import { useState, useRef, useCallback , useEffect} from 'react';
import { useToolResult } from '../../context/ToolResultContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Phone, Search, Globe, MapPin, Clock, Smartphone,
  Shield, AlertTriangle, CheckCircle, ExternalLink, Signal,
  Hash, User, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import { useToast } from '../common/Toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const typeColors = {
  mobile: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Mobile' },
  fixed_line: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Fixed Line' },
  fixed_line_or_mobile: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: 'Fixed/Mobile' },
  voip: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'VoIP' },
  toll_free: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Toll-Free' },
  premium_rate: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Premium Rate' },
  voicemail: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Voicemail' },
  unknown: { bg: 'bg-gray-500/10', text: 'text-gray-500', label: 'Unknown' },
};

const PhoneOsintTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('US');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const { setLastResult } = useToolResult();
  // Auto-register result with global Save to Case button
  useEffect(() => {
    if (result) {
      setLastResult({ data: result, toolName: 'PhoneOsint', query: phone });
    }
  }, [result]);
  useEffect(() => () => setLastResult(null), []);  const [showRaw, setShowRaw] = useState(false);

  const handleAnalyze = useCallback(async () => {
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    if (!cleaned) { toast.error('Enter a phone number'); return; }
    onConsume?.(15);
    setIsAnalyzing(true);
    setResult(null);
    try {
      const resp = await fetch(`${API_BASE}/tools/phone/osint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: cleaned, defaultRegion: region }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
      if (data.analysis?.valid) {
        toast.success(`Valid ${data.analysis.type} number`);
      } else {
        toast.error('Invalid phone number');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [phone, region, onConsume, toast]);

  const info = result?.analysis;
  const risk = result?.risk;
  const typeStyle = info ? (typeColors[info.type] || typeColors.unknown) : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 24 }} transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-lg h-auto max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0a0e17] border border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.3)]">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#0a0e17]/80 sticky top-0 z-10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-700 flex items-center justify-center shadow-lg shadow-blue-900/30">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white tracking-wide">Phone OSINT</h1>
              <p className="text-[10px] text-gray-500 tracking-[0.2em] uppercase">libphonenumber Deep Analysis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* ── Input ── */}
          <div className="flex gap-2">
            <div className="relative flex-1 flex items-center rounded-xl bg-[#111827] border border-gray-800 focus-within:border-blue-600/50 transition-all overflow-hidden">
              <span className="text-gray-500 text-sm pl-4 select-none">+</span>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                placeholder="14155552671"
                className="flex-1 bg-transparent text-white text-sm px-2 py-4 outline-none placeholder-gray-600 font-mono"
                autoFocus
              />
            </div>
            <select value={region} onChange={e => setRegion(e.target.value)}
              className="bg-[#111827] border border-gray-800 rounded-xl text-gray-400 text-xs px-3 py-2 outline-none focus:border-blue-600/50">
              <option value="US">US</option>
              <option value="GB">GB</option>
              <option value="IN">IN</option>
              <option value="DE">DE</option>
              <option value="FR">FR</option>
              <option value="AU">AU</option>
              <option value="BR">BR</option>
              <option value="JP">JP</option>
              <option value="RU">RU</option>
              <option value="CN">CN</option>
            </select>
            <button onClick={handleAnalyze} disabled={isAnalyzing}
              className="px-5 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-medium hover:from-blue-500 hover:to-cyan-500 transition-all flex items-center gap-2 rounded-xl disabled:opacity-50">
              <Search className="w-4 h-4" /> {isAnalyzing ? '…' : 'Scan'}
            </button>
          </div>

          {/* ── Results ── */}
          <AnimatePresence mode="wait">
            {result && info && (
              <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} className="space-y-4">

                {/* Validity banner */}
                <div className={`p-4 rounded-xl ${info.valid ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <div className="flex items-center gap-3">
                    {info.valid ? <CheckCircle className="w-6 h-6 text-emerald-400" /> : <AlertTriangle className="w-6 h-6 text-red-400" />}
                    <div>
                      <p className={`text-sm font-bold ${info.valid ? 'text-emerald-400' : 'text-red-400'}`}>
                        {info.valid ? 'Valid Phone Number' : 'Invalid Phone Number'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{info.international}</p>
                    </div>
                    {typeStyle && (
                      <span className={`ml-auto text-[10px] font-medium px-2.5 py-1 rounded-full ${typeStyle.bg} ${typeStyle.text} uppercase tracking-wider`}>
                        {typeStyle.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Globe, label: 'Country', value: info.country || '-' },
                    { icon: MapPin, label: 'Location', value: info.location || '-' },
                    { icon: Clock, label: 'Timezone', value: info.timezones?.[0] || '-' },
                    { icon: Smartphone, label: 'Carrier', value: info.carrier || 'Unknown' },
                    { icon: Hash, label: 'Country Code', value: `+${info.countryCode}` },
                    { icon: Signal, label: 'Type', value: typeStyle?.label || '-' },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-2 text-gray-500 text-[10px] uppercase tracking-wider mb-1.5">
                        <item.icon className="w-3 h-3" /> {item.label}
                      </div>
                      <p className="text-sm text-white font-mono">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Formats */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Formats</h5>
                  <div className="space-y-2">
                    {Object.entries(info.formats || {}).map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center text-xs py-1 border-b border-white/5 last:border-0">
                        <span className="text-gray-500 uppercase tracking-wider">{key}</span>
                        <code className="text-gray-300 text-[10px] truncate ml-4 max-w-[200px]">{val}</code>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk */}
                {risk && (
                  <div className={`p-4 rounded-xl border ${risk.riskLevel === 'low' ? 'bg-emerald-500/5 border-emerald-500/10' : risk.riskLevel === 'medium' ? 'bg-amber-500/5 border-amber-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-xs text-gray-500 uppercase tracking-wider">Risk Assessment</h5>
                      <span className={`text-xs font-medium ${risk.riskLevel === 'low' ? 'text-emerald-400' : risk.riskLevel === 'medium' ? 'text-amber-400' : 'text-red-400'}`}>
                        Score: {risk.riskScore}/100
                      </span>
                    </div>
                    {risk.flags?.length > 0 && (
                      <ul className="space-y-1">
                        {risk.flags.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                            <Info className="w-3 h-3 text-gray-600 mt-0.5 flex-shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Raw toggle */}
                <button onClick={() => setShowRaw(!showRaw)}
                  className="flex items-center gap-2 text-[10px] text-gray-600 hover:text-gray-400 transition-colors">
                  {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  Raw JSON
                </button>
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

export default PhoneOsintTool;
