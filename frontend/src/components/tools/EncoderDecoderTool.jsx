import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Download, RefreshCw, Info, Hash, ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const OPERATIONS = [
  { value: 'base64_encode', label: 'Base64 Encode', cat: 'Encoding' },
  { value: 'base64_decode', label: 'Base64 Decode', cat: 'Decoding' },
  { value: 'url_encode', label: 'URL Encode', cat: 'Encoding' },
  { value: 'url_decode', label: 'URL Decode', cat: 'Decoding' },
  { value: 'hex_encode', label: 'Hex Encode', cat: 'Encoding' },
  { value: 'hex_decode', label: 'Hex Decode', cat: 'Decoding' },
  { value: 'html_encode', label: 'HTML Encode', cat: 'Encoding' },
  { value: 'html_decode', label: 'HTML Decode', cat: 'Decoding' },
  { value: 'binary_encode', label: 'Binary Encode', cat: 'Encoding' },
  { value: 'binary_decode', label: 'Binary Decode', cat: 'Decoding' },
  { value: 'rot13', label: 'ROT13', cat: 'Cipher' },
  { value: 'reverse', label: 'Reverse', cat: 'Transform' },
  { value: 'morse_encode', label: 'Morse Encode', cat: 'Encoding' },
  { value: 'morse_decode', label: 'Morse Decode', cat: 'Decoding' },
  { value: 'md5', label: 'MD5 Hash', cat: 'Hash' },
  { value: 'sha1', label: 'SHA-1 Hash', cat: 'Hash' },
  { value: 'sha256', label: 'SHA-256 Hash', cat: 'Hash' },
  { value: 'sha512', label: 'SHA-512 Hash', cat: 'Hash' },
];

const EncoderDecoderTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  const [input, setInput] = useState('');
  const [operation, setOperation] = useState('base64_encode');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Encoder Decoder', query: input });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [history, setLocalHistory] = useState([]);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 25 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5, speedX: (Math.random() - 0.5) * 0.3, speedY: (Math.random() - 0.5) * 0.3,
      color: ['#f59e0b', '#eab308', '#fbbf24', '#f97316'][Math.floor(Math.random() * 4)],
    }));
    let id;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { ctx.beginPath(); ctx.fillStyle = p.color + '12'; ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); p.x += p.speedX; p.y += p.speedY; if (p.x < 0 || p.x > canvas.width) p.speedX *= -1; if (p.y < 0 || p.y > canvas.height) p.speedY *= -1; });
      id = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(id);
  }, []);

  const handleProcess = async () => {
    if (!input.trim()) { toast.error('Enter text to process'); return; }
    trackToolUsage('encoder', 'process', 'start');
    setIsProcessing(true); onConsume?.(3);
    try {
      const resp = await fetch(`${API_BASE}/tools/encoder/process`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input.trim(), operation }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || 'Processing failed'); }
      const data = await resp.json();
      setResults(data);
      addToHistory('encoder', `${operation}: ${input.substring(0, 30)}`, data);
      setLocalHistory(p => [{ op: operation, input: input.substring(0, 50), output: data.result?.substring(0, 50), time: new Date().toLocaleTimeString() }, ...p].slice(0, 20));
      toast.success('Processed successfully');
    } catch (err) { toast.error(err.message); }
    finally { setIsProcessing(false); }
  };

  const swapOutput = () => { if (results?.result) { setInput(results.result); setResults(null); } };

  const opLabel = OPERATIONS.find(o => o.value === operation)?.label || operation;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }} onClick={e => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-amber-950/10 to-slate-950 border border-yellow-500/30 shadow-[0_0_100px_rgba(234,179,8,0.1)]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="relative z-10 flex flex-col max-h-[92vh]">
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30"><Hash className="w-6 h-6 text-yellow-400" /></div>
              <div><h2 className="text-xl font-bold text-white">Encoder / Decoder</h2><p className="text-sm text-slate-400">Base64, URL, Hex, HTML, Binary, Morse, Hashing & more</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Operation select */}
            <div>
              <p className="text-sm text-slate-400 mb-2">Operation</p>
              <div className="flex flex-wrap gap-1.5">
                {OPERATIONS.map(op => (
                  <button key={op.value} onClick={() => setOperation(op.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${operation === op.value ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'}`}>
                    {op.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Input / Output */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400 mb-2">Input</p>
                <textarea value={input} onChange={e => setInput(e.target.value)} rows={8}
                  placeholder="Enter text to encode/decode/hash..."
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-yellow-500/50 focus:outline-none font-mono text-sm resize-none" />
                <p className="text-xs text-slate-600 mt-1">{input.length} chars</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-400">Output</p>
                  <div className="flex gap-1">
                    <button onClick={swapOutput} title="Use as input" className="p-1 rounded hover:bg-white/10"><ArrowLeft className="w-3.5 h-3.5 text-slate-400" /></button>
                    <button onClick={() => results?.result && copy(results.result)} className="p-1 rounded hover:bg-white/10"><Copy className="w-3.5 h-3.5 text-slate-400" /></button>
                  </div>
                </div>
                <textarea readOnly value={results?.result || ''} rows={8}
                  placeholder="Result will appear here..."
                  className="w-full p-4 rounded-xl bg-black/30 border border-white/10 text-green-400 placeholder-slate-600 font-mono text-sm resize-none" />
                {results && <p className="text-xs text-slate-600 mt-1">{results.result?.length} chars • {results.operation} • {results.processingTime}</p>}
              </div>
            </div>
            <div className="flex items-center justify-center">
              <button onClick={handleProcess} disabled={isProcessing}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                {isProcessing ? 'Processing...' : `Apply ${opLabel}`}
              </button>
            </div>
            {/* History */}
            {history.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-slate-400 mb-2">Recent Operations</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {history.map((h, i) => (
                    <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                      <span className="text-yellow-300">{OPERATIONS.find(o => o.value === h.op)?.label}</span>
                      <span className="text-slate-500 font-mono truncate max-w-[200px]">{h.input}</span>
                      <span className="text-slate-600">{h.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EncoderDecoderTool;
