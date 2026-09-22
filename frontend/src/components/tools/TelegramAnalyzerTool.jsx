import { useState, useCallback , useEffect} from 'react';
import { useToolResult } from '../../context/ToolResultContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, MessageCircle, Users, Hash, Clock,
  ChevronDown, ChevronUp, Loader2, AlertTriangle,
  CheckCircle, Info, ExternalLink, Eye, Send,
  UserCheck, Globe, FileText, Activity
} from 'lucide-react';
import { useToast } from '../common/Toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TelegramAnalyzerTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const [identifier, setIdentifier] = useState('');
  const [mode, setMode] = useState('channel');
  const [messageLimit, setMessageLimit] = useState(20);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const { setLastResult } = useToolResult();
  // Auto-register result with global Save to Case button
  useEffect(() => {
    if (result) {
      setLastResult({ data: result, toolName: 'Alpha_X Analyzer', query: '' });
    }
  }, [result]);
  useEffect(() => () => setLastResult(null), []);  const [showRaw, setShowRaw] = useState(false);
  const [error, setError] = useState(null);

  const modes = [
    { id: 'channel', label: 'Channel Info', icon: Eye },
    { id: 'group', label: 'Group Info', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
  ];

  const handleAnalyze = useCallback(async () => {
    const id = identifier.trim();
    if (!id) { toast.error('Enter an Alpha_X channel/group identifier'); return; }
    onConsume?.(15);
    setIsAnalyzing(true);
    setResult(null);
    setError(null);
    try {
      let endpoint = '';
      let body = {};
      if (mode === 'channel') {
        endpoint = '/analyze/channel';
        body = { channel: id };
      } else if (mode === 'group') {
        endpoint = '/analyze/group';
        body = { group: id };
      } else {
        endpoint = '/analyze/messages';
        body = { chat: id, limit: messageLimit };
      }
      const token = localStorage.getItem('token');
      const resp = await fetch(`${API_BASE}/telegram${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
      toast.success('Analysis complete');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [identifier, mode, messageLimit, onConsume, toast]);

  const placeholderMap = {
    channel: '@channel or provider channel URL',
    group: '@groupusername',
    messages: '@channel or @group',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 24 }} transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-2xl h-auto max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0a0e17] border border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.3)]">

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#0a0e17]/80 sticky top-0 z-10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center shadow-lg shadow-sky-900/30">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white tracking-wide">Alpha_X Analyzer</h1>
              <p className="text-[10px] text-gray-500 tracking-[0.2em] uppercase">Channel · Group · Messages</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Mode selector */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5">
            {modes.map(m => (
              <button key={m.id} onClick={() => { setMode(m.id); setResult(null); setError(null); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all flex-1 justify-center">
                <m.icon className="w-3 h-3" /> {m.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <div className="relative flex-1 flex items-center rounded-xl bg-[#111827] border border-gray-800 focus-within:border-sky-600/50 transition-all overflow-hidden">
              <Hash className="w-4 h-4 text-gray-500 ml-4 flex-shrink-0" />
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                placeholder={placeholderMap[mode]}
                className="flex-1 bg-transparent text-white text-sm px-3 py-4 outline-none placeholder-gray-600 font-mono"
                autoFocus
              />
            </div>
            {mode === 'messages' && (
              <input
                type="number"
                value={messageLimit}
                onChange={e => setMessageLimit(Math.min(100, Math.max(1, parseInt(e.target.value) || 20)))}
                className="w-16 bg-[#111827] border border-gray-800 rounded-xl text-gray-400 text-xs text-center py-2 outline-none focus:border-sky-600/50"
                min="1" max="100"
              />
            )}
            <button onClick={handleAnalyze} disabled={isAnalyzing}
              className="px-5 py-4 bg-gradient-to-r from-sky-600 to-blue-700 text-white text-sm font-medium hover:from-sky-500 hover:to-blue-600 transition-all flex items-center gap-2 rounded-xl disabled:opacity-50">
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {isAnalyzing ? '...' : 'Analyze'}
            </button>
          </div>

          {/* Results */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
                <p className="text-[10px] text-gray-500 mt-2">
                  Make sure you have connected your Alpha_X session in Alpha_X Settings
                </p>
              </motion.div>
            )}

            {result && (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} className="space-y-4">

                {/* Result data */}
                {result.data && (
                  <div className="space-y-3">
                    {typeof result.data === 'object' ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(result.data).filter(([k]) => !['text', 'message', 'messages', '_'].includes(k)).slice(0, 8).map(([key, val]) => (
                            <div key={key} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                                {key.replace(/_/g, ' ')}
                              </p>
                              <p className="text-sm text-white font-mono truncate">
                                {typeof val === 'object' ? JSON.stringify(val).slice(0, 100) : String(val)}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Show text/message content if present */}
                        {result.data.text && (
                          <div className="p-4 rounded-xl bg-black/30 border border-white/5">
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Content</p>
                            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                              {result.data.text}
                            </pre>
                          </div>
                        )}

                        {/* Show messages list if present */}
                        {result.data.messages && Array.isArray(result.data.messages) && (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Messages ({result.data.messages.length})</p>
                            {result.data.messages.map((msg, i) => (
                              <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                <div className="flex items-center gap-2 text-[10px] text-gray-600 mb-1">
                                  {msg.date && <span>{new Date(msg.date).toLocaleString()}</span>}
                                  {msg.from && <span>From: {msg.from}</span>}
                                </div>
                                <p className="text-xs text-gray-300">{msg.text || msg.message || JSON.stringify(msg)}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <p className="text-sm text-gray-300">{String(result.data)}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Raw fallback */}
                {!result.data && (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <pre className="text-xs text-gray-400 whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Timestamp */}
                <div className="flex items-center justify-between pt-2">
                  {result?.timestamp && (
                    <span className="text-[10px] text-gray-600">{new Date(result.timestamp).toLocaleString()}</span>
                  )}
                  <button onClick={() => setShowRaw(!showRaw)}
                    className="flex items-center gap-2 text-[10px] text-gray-600 hover:text-gray-400 transition-colors ml-auto">
                    {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />} Raw JSON
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

export default TelegramAnalyzerTool;
