import { useState, useEffect, useRef } from 'react';
import { useToolResult } from '../../context/ToolResultContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image, X, Search, Zap, Shield, AlertTriangle, CheckCircle, FileText,
  Database, Cpu, Lock, Unlock, Eye, Copy, RefreshCw, Binary, Code,
  Terminal, Server, Clock, ChevronRight, Download, Activity, Layers,
  ShieldCheck, ShieldAlert, Key, Fingerprint, Timer, Gauge, BarChart3,
  TrendingUp, Scan, FileImage, EyeOff, ZoomIn
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
    const particles = Array.from({ length: 35 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 1, alpha: Math.random() * 0.4 + 0.1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0; if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = `rgba(34, 211, 238, ${p.alpha})`; ctx.fill(); });
      animationId = requestAnimationFrame(draw);
    };
    const resize = () => { canvas.width = canvas.parentElement?.offsetWidth || 400; canvas.height = canvas.parentElement?.offsetHeight || 600; };
    resize(); window.addEventListener('resize', resize);
    animationId = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animationId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
};

const SteganographyTool = ({ onClose, onConsume }) => {
  const { addToast } = useToast();
  const { addToHistory } = useHistory();
  const { copyToClipboard } = useClipboard();
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageB64, setImageB64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { setLastResult } = useToolResult();
  // Auto-register result with global Save to Case button
  useEffect(() => {
    if (result) {
      setLastResult({ data: result, toolName: 'Steganography', query: '' });
    }
  }, [result]);
  useEffect(() => () => setLastResult(null), []);  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setResult(null); setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target.result.split(',')[1];
      setImageB64(b64);
      setImagePreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imageB64) { addToast('Please select an image', 'error'); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/tools/osint/steganography-detect`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageB64, filename: imageFile?.name || 'image.png' }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); addToast(data.error, 'error'); }
      else { setResult(data); addToHistory({ type: 'steganography', input: imageFile?.name, result: data }); }
      trackToolUsage('steganography', { success: !data.error });
    } catch (err) { setError(err.message); addToast('API request failed', 'error'); }
    finally { setLoading(false); if (onConsume) onConsume(18); }
  };

  const copyResult = () => { if (result) { copyToClipboard(JSON.stringify(result, null, 2)); addToast('Copied', 'success'); } };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050a14]/95 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl">
        <div className="absolute inset-0 pointer-events-none"><ParticleBackground /></div>

        <div className="relative z-10 flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <EyeOff className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Steganography Detection</h2>
              <p className="text-sm text-gray-400">Detect hidden data in images using LSB analysis & steganography algorithms</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyResult} disabled={!result} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-all"><Copy className="w-5 h-5" /></button>
            <button onClick={onClose} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="relative z-10 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex flex-col items-center justify-center min-h-[200px]">
                {imagePreview ? (
                  <div className="relative w-full">
                    <img src={imagePreview} alt="Preview" className="max-h-52 mx-auto rounded-xl border border-white/10" />
                    <button onClick={() => { setImageFile(null); setImagePreview(null); setImageB64(null); setResult(null); }} className="mt-3 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm hover:bg-red-500/20 transition-all">Remove</button>
                  </div>
                ) : (
                  <div className="text-center cursor-pointer" onClick={() => fileRef.current?.click()}>
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-cyan-500/10 border-2 border-dashed border-cyan-500/30 flex items-center justify-center">
                      <FileImage className="w-8 h-8 text-cyan-400" />
                    </div>
                    <p className="text-gray-400">Click to upload image</p>
                    <p className="text-xs text-gray-600 mt-1">PNG, JPG, BMP, GIF supported</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
                <Scan className="w-16 h-16 text-cyan-400/50" />
                <p className="text-gray-400 text-center text-sm">Upload an image to scan for hidden messages,<br />LSB steganography, and suspicious metadata</p>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAnalyze} disabled={loading || !imageB64} className="px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 disabled:opacity-50 transition-all flex items-center gap-2">
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                  {loading ? 'Scanning...' : 'Scan for Hidden Data'}
                </motion.button>
              </div>
            </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2"><FileImage className="w-4 h-4 text-cyan-400" /> File Info</h3>
                  {result.file_info ? (
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(result.file_info).map(([k, v]) => (
                        <div key={k} className="p-2 rounded-xl bg-white/5 border border-white/5">
                          <div className="text-xs text-gray-500 capitalize mb-1">{k.replace(/_/g, ' ')}</div>
                          <div className="text-white text-sm font-medium truncate">{String(v)}</div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-gray-500 italic">No file info</p>}
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2"><Lock className="w-4 h-4 text-rose-400" /> Hidden Data</h3>
                  {result.hidden_text ? (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                      <div className="text-rose-400 text-sm font-medium mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> HIDDEN MESSAGE DETECTED</div>
                      <p className="text-white bg-black/30 p-3 rounded-lg font-mono text-sm break-all">{result.hidden_text}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-400">No hidden text detected via LSB extraction</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-violet-400" /> LSB Analysis</h3>
                  {result.lsb_analysis ? (
                    <div className="space-y-2">
                      {Object.entries(result.lsb_analysis).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                          <span className="text-sm text-gray-400 capitalize">{k.replace(/_/g, ' ')}</span>
                          <span className="text-sm text-white font-medium">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-gray-500 italic">Pillow not available</p>}
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> Suspicious Indicators</h3>
                  {result.suspicious_indicators?.length > 0 ? (
                    <ul className="space-y-2">
                      {result.suspicious_indicators.map((ind, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-amber-300 p-2 rounded-xl bg-amber-500/5 border border-amber-500/10">
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{ind}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-gray-500 italic">No suspicious indicators found</p>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-3xl">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
                  <Scan className="w-6 h-6 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-cyan-300 font-medium">Scanning for hidden data...</p>
                <p className="text-sm text-gray-500 mt-1">Analyzing LSB layers & metadata</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default SteganographyTool;
