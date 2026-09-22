import { useState, useEffect, useRef } from 'react';
import { useToolResult } from '../../context/ToolResultContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, X, Search, Zap, Shield, AlertTriangle, CheckCircle, FileText,
  Database, Cpu, Lock, Unlock, Eye, Copy, RefreshCw, Binary, Code,
  Terminal, Server, Clock, ChevronRight, Download, Activity, Layers,
  ShieldCheck, ShieldAlert, Key, Fingerprint, Timer, Gauge, BarChart3,
  TrendingUp, Smile, Frown, Meh, Heart, Brain, BookOpen
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
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 1, alpha: Math.random() * 0.4 + 0.1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0; if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = `rgba(251, 191, 36, ${p.alpha})`; ctx.fill(); });
      animationId = requestAnimationFrame(draw);
    };
    const resize = () => { canvas.width = canvas.parentElement?.offsetWidth || 400; canvas.height = canvas.parentElement?.offsetHeight || 600; };
    resize(); window.addEventListener('resize', resize);
    animationId = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animationId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
};

const SentimentGauge = ({ polarity }) => {
  const normalized = Math.max(-1, Math.min(1, polarity || 0));
  const degrees = ((normalized + 1) / 2) * 180;
  const color = normalized > 0.05 ? '#22c55e' : normalized < -0.05 ? '#ef4444' : '#f59e0b';
  return (
    <div className="relative w-32 h-16 mx-auto">
      <svg viewBox="0 0 120 60" className="w-full">
        <path d="M 10 50 A 50 50 0 0 1 110 50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" strokeLinecap="round" />
        <path d="M 10 50 A 50 50 0 0 1 110 50" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(degrees / 180) * 157} 157`} />
        <circle cx={10 + degrees / 180 * 100} cy={50 - Math.sin(degrees * Math.PI / 180) * 50} r="5" fill={color} />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 text-center">
        <span className="text-lg font-bold" style={{ color }}>{normalized.toFixed(2)}</span>
      </div>
    </div>
  );
};

const SentimentAnalyzerTool = ({ onClose, onConsume }) => {
  const { addToast } = useToast();
  const { addToHistory } = useHistory();
  const { copyToClipboard } = useClipboard();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { setLastResult } = useToolResult();
  // Auto-register result with global Save to Case button
  useEffect(() => {
    if (result) {
      setLastResult({ data: result, toolName: 'SentimentAnalyzer', query: text });
    }
  }, [result]);
  useEffect(() => () => setLastResult(null), []);  const [error, setError] = useState(null);
  const textRef = useRef(null);

  useEffect(() => { textRef.current?.focus(); }, []);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleAnalyze = async () => {
    if (!text.trim()) { addToast('Please enter text', 'error'); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/tools/osint/sentiment-analyzer`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); addToast(data.error, 'error'); }
      else { setResult(data); addToHistory({ type: 'sentiment-analyzer', input: text.trim().slice(0, 100), result: data }); }
      trackToolUsage('sentiment-analyzer', { success: !data.error });
    } catch (err) { setError(err.message); addToast('API request failed', 'error'); }
    finally { setLoading(false); if (onConsume) onConsume(12); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && e.ctrlKey) handleAnalyze(); };

  const copyResult = () => { if (result) { copyToClipboard(JSON.stringify(result, null, 2)); addToast('Copied', 'success'); } };

  const getEmotionIcon = (emotion) => {
    const icons = { joy: '😊', sadness: '😢', anger: '😠', fear: '😨', surprise: '😮', disgust: '🤢', trust: '🤝', anticipation: '🤔', neutral: '😐' };
    return icons[emotion] || '😐';
  };

  const getSentimentIcon = (label) => {
    if (label === 'positive') return <Smile className="w-5 h-5 text-green-400" />;
    if (label === 'negative') return <Frown className="w-5 h-5 text-red-400" />;
    return <Meh className="w-5 h-5 text-amber-400" />;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050a14]/95 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl">
        <div className="absolute inset-0 pointer-events-none"><ParticleBackground /></div>

        <div className="relative z-10 flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Sentiment & Emotion Analysis</h2>
              <p className="text-sm text-gray-400">Analyze text for sentiment polarity, emotions, subjectivity & readability</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { if (result) { exportToJSON(formatForExport(result), `sentiment-${Date.now()}`); addToast('Exported', 'success'); } }} disabled={!result} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-all"><Download className="w-5 h-5" /></button>
            <button onClick={copyResult} disabled={!result} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-all"><Copy className="w-5 h-5" /></button>
            <button onClick={onClose} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="relative z-10 p-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <MessageCircle className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
              <textarea ref={textRef} value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown} rows={4} placeholder="Paste text to analyze (Ctrl+Enter to submit)..." className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-base transition-all resize-none" />
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAnalyze} disabled={loading || !text.trim()} className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 disabled:opacity-50 transition-all flex items-center gap-2 self-end">
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              {loading ? 'Analyzing...' : 'Analyze'}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>{error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative z-10 mx-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" /> <span>{error}</span>
          </motion.div>
        )}</AnimatePresence>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 p-6 pt-0 space-y-4">
              {/* Sentiment Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm col-span-1 text-center">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Overall Sentiment</h3>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {getSentimentIcon(result.sentiment?.label)}
                    <span className={`text-xl font-bold capitalize ${result.sentiment?.label === 'positive' ? 'text-green-400' : result.sentiment?.label === 'negative' ? 'text-red-400' : 'text-amber-400'}`}>{result.sentiment?.label || 'neutral'}</span>
                  </div>
                  {result.sentiment?.textblob && <SentimentGauge polarity={result.sentiment.textblob.polarity} />}
                  <div className="mt-2 text-xs text-gray-500">Polarity: {result.sentiment?.textblob?.polarity || 'N/A'}</div>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2"><Brain className="w-4 h-4 text-amber-400" /> VADER Scores</h3>
                  {result.sentiment?.vader ? (
                    <div className="space-y-2">
                      {[
                        { label: 'Compound', value: result.sentiment.vader.compound, color: 'text-amber-400' },
                        { label: 'Positive', value: result.sentiment.vader.positive, color: 'text-green-400' },
                        { label: 'Negative', value: result.sentiment.vader.negative, color: 'text-red-400' },
                        { label: 'Neutral', value: result.sentiment.vader.neutral, color: 'text-gray-400' },
                      ].map(item => (
                        <div key={item.label} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                          <span className="text-sm text-gray-400">{item.label}</span>
                          <span className={`text-sm font-semibold ${item.color}`}>{item.value.toFixed(3)}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-gray-500 italic">VADER not available</p>}
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-sky-400" /> Readability</h3>
                  {result.readability ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-sm text-gray-400">Score</span>
                        <span className="text-sm font-semibold text-white">{result.readability.flesch_reading_ease}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-sm text-gray-400">Level</span>
                        <span className="text-sm font-semibold text-white capitalize">{result.readability.level}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-sm text-gray-400">Words</span>
                        <span className="text-sm font-semibold text-white">{result.word_count}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-sm text-gray-400">Sentences</span>
                        <span className="text-sm font-semibold text-white">{result.sentence_count}</span>
                      </div>
                    </div>
                  ) : <p className="text-gray-500 italic">Not available</p>}
                </div>
              </div>

              {/* Emotions & Subjectivity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2"><Heart className="w-4 h-4 text-rose-400" /> Emotions Detected</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {result.emotions && Object.entries(result.emotions).filter(([k]) => k !== 'dominant').map(([emotion, count]) => (
                      <span key={emotion} className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm capitalize flex items-center gap-1">
                        <span>{getEmotionIcon(emotion)}</span> {emotion} ({count})
                      </span>
                    ))}
                  </div>
                  {result.emotions?.dominant && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-center gap-2">
                      <Brain className="w-4 h-4" /> Dominant emotion: <strong className="capitalize">{result.emotions.dominant}</strong> {getEmotionIcon(result.emotions.dominant)}
                    </div>
                  )}
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-400" /> Text Properties</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-sm text-gray-400">Subjectivity</span>
                      <span className="text-white font-medium capitalize">{result.subjectivity || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-sm text-gray-400">VADER Label</span>
                      <span className={`font-medium capitalize ${result.sentiment?.vader_label === 'positive' ? 'text-green-400' : result.sentiment?.vader_label === 'negative' ? 'text-red-400' : 'text-amber-400'}`}>{result.sentiment?.vader_label || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-sm text-gray-400">Avg Words/Sentence</span>
                      <span className="text-white font-medium">{result.readability?.avg_words_per_sentence || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-sm text-gray-400">Avg Syllables/Word</span>
                      <span className="text-white font-medium">{result.readability?.avg_syllables_per_word || 'N/A'}</span>
                    </div>
                  </div>
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
                  <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                  <Brain className="w-6 h-6 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-amber-300 font-medium">Analyzing sentiment...</p>
                <p className="text-sm text-gray-500 mt-1">Processing language features & emotional cues</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default SentimentAnalyzerTool;
