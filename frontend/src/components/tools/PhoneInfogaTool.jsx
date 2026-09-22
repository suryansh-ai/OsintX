import { useState, useRef, useCallback , useEffect} from 'react';
import { useToolResult } from '../../context/ToolResultContext';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Phone, Search, Globe, MapPin, Clock, Smartphone,
  Shield, AlertTriangle, CheckCircle, ExternalLink, Signal,
  Hash, User, Info, ChevronDown, ChevronUp, Share2, MessageCircle,
  CreditCard, Radio, Activity, Fingerprint
} from 'lucide-react';
import { useToast } from '../common/Toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const riskColors = {
  low: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', label: 'Low Risk' },
  medium: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', label: 'Medium Risk' },
  high: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', label: 'High Risk' },
  invalid: { bg: 'bg-gray-500/10', border: 'border-gray-500/20', text: 'text-gray-400', label: 'Invalid' },
};

const PhoneInfogaTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('US');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const { setLastResult } = useToolResult();
  // Auto-register result with global Save to Case button
  useEffect(() => {
    if (result) {
      setLastResult({ data: result, toolName: 'PhoneInfoga', query: phone });
    }
  }, [result]);
  useEffect(() => () => setLastResult(null), []);  const [showRaw, setShowRaw] = useState(false);
  const [activeTab, setActiveTab] = useState('analysis');

  const handleAnalyze = useCallback(async () => {
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    if (!cleaned) { toast.error('Enter a phone number'); return; }
    onConsume?.(20);
    setIsAnalyzing(true);
    setResult(null);
    try {
      const resp = await fetchWithTimeout(`${API_BASE}/tools/phone/phoneinfoga`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: cleaned, defaultRegion: region }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
      if (data.analysis?.valid) {
        toast.success(`Valid number — ${data.sources?.length || 0} sources queried`);
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
  const riskStyle = risk ? riskColors[risk.riskLevel] || riskColors.low : null;
  const hasCarrier = result?.carrierInfo && Object.keys(result.carrierInfo).length > 0;
  const hasSpam = result?.spamCheck && Object.keys(result.spamCheck).length > 0;
  const hasFootprint = result?.onlineFootprint && Object.keys(result.onlineFootprint).length > 0;

  const tabs = [
    { id: 'analysis', label: 'Analysis', icon: Phone },
    { id: 'carrier', label: 'Carrier', icon: Radio },
    { id: 'footprint', label: 'Online', icon: Activity },
    { id: 'spam', label: 'Spam Check', icon: Shield },
  ];

  const openUrl = (url) => window.open(url, '_blank', 'noopener,noreferrer');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 24 }} transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-2xl h-auto max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0a0e17] border border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.3)]">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#0a0e17]/80 sticky top-0 z-10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-900/30">
              <Fingerprint className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white tracking-wide">PhoneInfoga</h1>
              <p className="text-[10px] text-gray-500 tracking-[0.2em] uppercase">Advanced Phone OSINT</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* ── Input ── */}
          <div className="flex gap-2">
            <div className="relative flex-1 flex items-center rounded-xl bg-[#111827] border border-gray-800 focus-within:border-purple-600/50 transition-all overflow-hidden">
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
              className="bg-[#111827] border border-gray-800 rounded-xl text-gray-400 text-xs px-3 py-2 outline-none focus:border-purple-600/50">
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
              className="px-5 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:from-purple-500 hover:to-pink-500 transition-all flex items-center gap-2 rounded-xl disabled:opacity-50">
              <Search className="w-4 h-4" /> {isAnalyzing ? '…' : 'Deep Scan'}
            </button>
          </div>

          {/* ── Sources badge ── */}
          {result?.sources && (
            <div className="flex flex-wrap gap-1.5">
              {result.sources.map((s, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* ── Results ── */}
          <AnimatePresence mode="wait">
            {result && info && (
              <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} className="space-y-4">

                {/* Validity banner */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    {info.valid ? <CheckCircle className="w-6 h-6 text-emerald-400" /> : <AlertTriangle className="w-6 h-6 text-red-400" />}
                    <div>
                      <p className="text-sm font-bold text-gray-300">
                        {info.valid ? 'Valid Phone Number' : 'Invalid Phone Number'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{info.international}</p>
                    </div>
                    {info.type && (
                      <span className="ml-auto text-[10px] font-medium px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 uppercase tracking-wider">
                        {info.type}
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Tab Navigation ── */}
                <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5">
                  {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                       className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all flex-1 justify-center">
                      <tab.icon className="w-3 h-3" /> {tab.label}
                    </button>
                  ))}
                </div>

                {/* ── Tab Content ── */}
                {activeTab === 'analysis' && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Globe, label: 'Country', value: info.country || '-' },
                      { icon: MapPin, label: 'Location', value: info.location || '-' },
                      { icon: Clock, label: 'Timezone', value: info.timezones?.[0] || '-' },
                      { icon: Smartphone, label: 'Carrier', value: info.carrier || 'Unknown' },
                      { icon: Hash, label: 'Country Code', value: info.countryCode || '-' },
                      { icon: Signal, label: 'Number Type', value: info.type || '-' },
                    ].map((item, i) => (
                      <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-2 text-gray-500 text-[10px] uppercase tracking-wider mb-1.5">
                          <item.icon className="w-3 h-3" /> {item.label}
                        </div>
                        <p className="text-sm text-white font-mono">{item.value}</p>
                      </div>
                    ))}
                    {/* Formats section */}
                    <div className="col-span-2 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Number Formats</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(info.formats || {}).map(([key, val]) => (
                          <div key={key} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg bg-white/[0.02]">
                            <span className="text-gray-500 uppercase w-20">{key}</span>
                            <code className="text-gray-300 font-mono text-[10px] break-all">{val}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'carrier' && (
                  <div className="space-y-3">
                    {hasCarrier ? (
                      Object.entries(result.carrierInfo).map(([key, val]) => (
                        <div key={key} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="flex items-center gap-2 text-gray-500 text-[10px] uppercase tracking-wider mb-1.5">
                            <Radio className="w-3 h-3" /> {key.replace(/_/g, ' ')}
                          </div>
                          <p className="text-sm text-white font-mono">{String(val)}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                        <Radio className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No carrier information available from free sources</p>
                        <p className="text-xs text-gray-600 mt-1">FreeCarrierLookup may be rate-limited</p>
                      </div>
                    )}
                    {/* Social presence */}
                    {result.socialPresence && (
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Social Media Presence</h5>
                        <div className="space-y-2">
                          {Object.entries(result.socialPresence).map(([platform, data]) => (
                            <div key={platform} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02]">
                              <span className="text-xs text-gray-400 capitalize">{platform}</span>
                              {data.url ? (
                                <button onClick={() => openUrl(data.url)}
                                  className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1">
                                  <ExternalLink className="w-3 h-3" /> Check
                                </button>
                              ) : (
                                <span className="text-[10px] text-gray-600">{data.note || data.description}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'footprint' && (
                  <div className="space-y-3">
                    {hasFootprint ? (
                      Object.entries(result.onlineFootprint).map(([source, data]) => (
                        <div key={source} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-400 uppercase tracking-wider">{source}</span>
                            {data.accessible ? (
                              <span className="text-[10px] text-emerald-500 ml-auto">Accessible</span>
                            ) : (
                              <span className="text-[10px] text-red-500 ml-auto">Blocked</span>
                            )}
                          </div>
                          {data.title && (
                            <p className="text-xs text-gray-500 truncate">{data.title}</p>
                          )}
                          {data.resultCount !== undefined && (
                            <p className="text-[10px] text-gray-600 mt-1">{data.resultCount} results found</p>
                          )}
                          {data.error && (
                            <p className="text-[10px] text-red-500 mt-1">{data.error}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                        <Activity className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No online footprint data</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'spam' && (
                  <div className="space-y-3">
                    {hasSpam ? (
                      Object.entries(result.spamCheck).map(([source, data]) => (
                        <div key={source} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-400 uppercase tracking-wider">{source}</span>
                            {data.spamDetected ? (
                              <span className="text-[10px] text-red-500 ml-auto flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Spam Reported
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-500 ml-auto">Clean</span>
                            )}
                          </div>
                          {data.title && <p className="text-xs text-gray-500 truncate">{data.title}</p>}
                          {data.spamScore > 0 && (
                            <div className="mt-2">
                              <div className="h-1.5 rounded-full bg-gray-800">
                                <div className="h-full rounded-full bg-red-500" style={{ width: `${Math.min(data.spamScore, 100)}%` }} />
                              </div>
                              <p className="text-[10px] text-gray-600 mt-1">Spam Score: {data.spamScore}/100</p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                        <Shield className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No spam database results</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Risk Assessment ── */}
                {risk && (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-500" />
                        <h5 className="text-xs text-gray-500 uppercase tracking-wider">Risk Assessment</h5>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-400">
                          {risk.riskLevel.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
                          Score: {risk.riskScore}/100
                        </span>
                      </div>
                    </div>
                    {risk.flags?.length > 0 && (
                      <ul className="space-y-1.5 mb-3">
                        {risk.flags.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                            <Info className="w-3 h-3 text-gray-600 mt-0.5 flex-shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    {risk.recommendations?.length > 0 && (
                      <div className="mt-2 pt-3 border-t border-white/5">
                        <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Recommendations</p>
                        <ul className="space-y-1">
                          {risk.recommendations.map((r, i) => (
                            <li key={i} className="flex items-start gap-2 text-[11px] text-amber-400/80">
                              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" /> {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Timestamp & Raw ── */}
                <div className="flex items-center justify-between">
                  {result?.timestamp && (
                    <span className="text-[10px] text-gray-600">
                      {new Date(result.timestamp).toLocaleString()}
                    </span>
                  )}
                  <button onClick={() => setShowRaw(!showRaw)}
                    className="flex items-center gap-2 text-[10px] text-gray-600 hover:text-gray-400 transition-colors ml-auto">
                    {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Raw JSON
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

export default PhoneInfogaTool;
