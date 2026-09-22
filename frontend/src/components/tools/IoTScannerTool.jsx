import { useState, useEffect, useRef } from 'react';
import { useToolResult } from '../../context/ToolResultContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio, X, Search, Zap, Shield, AlertTriangle, CheckCircle, FileText,
  Database, Cpu, Lock, Unlock, Eye, Copy, RefreshCw, Binary, Code,
  Terminal, Server, Clock, ChevronRight, Download, Activity, Layers,
  ShieldCheck, ShieldAlert, Key, Fingerprint, Timer, Gauge, BarChart3,
  TrendingUp, Wifi, WifiOff, Smartphone, Monitor, Router
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';

const ParticleBackground = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 1, alpha: Math.random() * 0.4 + 0.1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0; if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = `rgba(16, 185, 129, ${p.alpha})`; ctx.fill(); });
      animationId = requestAnimationFrame(draw);
    };
    const resize = () => { canvas.width = canvas.parentElement?.offsetWidth || 400; canvas.height = canvas.parentElement?.offsetHeight || 600; };
    resize(); window.addEventListener('resize', resize);
    animationId = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animationId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
};

const RiskBadge = ({ score }) => {
  if (score >= 50) return <span className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold">HIGH</span>;
  if (score >= 20) return <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-semibold">MEDIUM</span>;
  return <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-semibold">LOW</span>;
};

const IoTScannerTool = ({ onClose, onConsume }) => {
  const { addToast } = useToast();
  const { addToHistory } = useHistory();
  const { copyToClipboard } = useClipboard();
  const [targets, setTargets] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { setLastResult } = useToolResult();
  // Auto-register result with global Save to Case button
  useEffect(() => {
    if (result) {
      setLastResult({ data: result, toolName: 'IoTScanner', query: '' });
    }
  }, [result]);
  useEffect(() => () => setLastResult(null), []);  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleScan = async () => {
    if (!targets.trim()) { addToast('Please enter IP addresses', 'error'); return; }
    const ips = targets.split(/[\s,]+/).filter(Boolean);
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/tools/osint/iot-scanner`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets: ips }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); addToast(data.error, 'error'); }
      else { setResult(data); addToHistory({ type: 'iot-scanner', input: ips.join(', '), result: data }); }
      trackToolUsage('iot-scanner', { success: !data.error, count: ips.length });
    } catch (err) { setError(err.message); addToast('API request failed', 'error'); }
    finally { setLoading(false); if (onConsume) onConsume(15); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && e.ctrlKey) handleScan(); };

  const copyResult = () => { if (result) { copyToClipboard(JSON.stringify(result, null, 2)); addToast('Copied', 'success'); } };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050a14]/95 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl">
        <div className="absolute inset-0 pointer-events-none"><ParticleBackground /></div>

        <div className="relative z-10 flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Radio className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">IoT Device Scanner</h2>
              <p className="text-sm text-gray-400">Scan IPs for IoT devices, open ports, and known vulnerabilities via Shodan InternetDB</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyResult} disabled={!result} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-all"><Copy className="w-5 h-5" /></button>
            <button onClick={onClose} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="relative z-10 p-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Radio className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
              <textarea ref={inputRef} value={targets} onChange={e => setTargets(e.target.value)} onKeyDown={handleKeyDown} rows={2} placeholder="Enter IP addresses (comma/space separated, e.g. 8.8.8.8, 1.1.1.1)" className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-base transition-all resize-none" />
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleScan} disabled={loading || !targets.trim()} className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-50 transition-all flex items-center gap-2 self-end">
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              {loading ? 'Scanning...' : 'Scan'}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>{error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative z-10 mx-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" /> <span>{error}</span>
          </motion.div>
        )}</AnimatePresence>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 p-6 pt-0 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-400">Scanned {result.scanned_ips} IP(s)</span>
              </div>

              {result.results?.map((ipResult, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Server className="w-5 h-5 text-emerald-400" />
                      <span className="text-white font-mono font-medium">{ipResult.ip}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <RiskBadge score={ipResult.risk_score} />
                      <span className="text-sm text-gray-400">Risk: {ipResult.risk_score}%</span>
                    </div>
                  </div>

                  {ipResult.shodan?.error ? (
                    <p className="text-gray-500 italic text-sm">{ipResult.shodan.error}</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Open Ports</h4>
                        {ipResult.shodan?.ports?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {ipResult.shodan.ports.map((port, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">{port}</span>
                            ))}
                          </div>
                        ) : <span className="text-gray-500 text-sm">No ports detected</span>}
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Tags</h4>
                        {ipResult.shodan?.tags?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {ipResult.shodan.tags.map((tag, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs">{tag}</span>
                            ))}
                          </div>
                        ) : <span className="text-gray-500 text-sm">No tags</span>}
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Vulnerabilities</h4>
                        {ipResult.shodan?.vulns?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {ipResult.shodan.vulns.map((vuln, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">{vuln}</span>
                            ))}
                          </div>
                        ) : <span className="text-gray-500 text-sm">No known vulns</span>}
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">IoT Indicators</h4>
                        {ipResult.iot_indicators?.length > 0 ? (
                          <div className="space-y-1">
                            {ipResult.iot_indicators.map((ind, i) => (
                              <div key={i} className="text-xs text-gray-300">
                                <span className="text-emerald-400">Port {ind.port}</span> — {ind.service}
                              </div>
                            ))}
                          </div>
                        ) : <span className="text-gray-500 text-sm">No IoT indicators</span>}
                      </div>
                    </div>
                  )}

                  {ipResult.device_type_candidates?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <h4 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Possible Device Types</h4>
                      <div className="flex flex-wrap gap-2">
                        {ipResult.device_type_candidates.map((d, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">{d}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-3xl">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                  <Radio className="w-6 h-6 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-emerald-300 font-medium">Scanning IoT devices...</p>
                <p className="text-sm text-gray-500 mt-1">Querying Shodan InternetDB & port signatures</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default IoTScannerTool;
