import { useState, useRef, useCallback , useEffect} from 'react';
import { useToolResult } from '../../context/ToolResultContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Upload, Image, Search, ExternalLink, AlertCircle, CheckCircle, Loader2, Camera
} from 'lucide-react';
import { useToast } from '../common/Toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AvatarReverseTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState(null);
  const { setLastResult } = useToolResult();
  // Auto-register result with global Save to Case button
  useEffect(() => {
    if (result) {
      setLastResult({ data: result, toolName: 'AvatarReverse', query: '' });
    }
  }, [result]);
  useEffect(() => () => setLastResult(null), []);  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  };

  const handleSearch = useCallback(async () => {
    if (!file) { toast.error('Upload an avatar image first'); return; }
    onConsume?.(15);
    setIsSearching(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('image', file);
      const resp = await fetch(`${API_BASE}/tools/avatar/reverse`, {
        method: 'POST',
        body: form,
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Search failed');
      setResult(data);
      toast.success('Reverse image search complete');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSearching(false);
    }
  }, [file, onConsume, toast]);

  const getEngineIcon = (engine) => {
    if (engine?.toLowerCase().includes('google')) return '🔍';
    if (engine?.toLowerCase().includes('yandex')) return '🌐';
    if (engine?.toLowerCase().includes('bing')) return '🔎';
    if (engine?.toLowerCase().includes('tineye')) return '👁';
    return '🔗';
  };

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
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white">Avatar Reverse Search</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Find Profile Pics Across Platforms</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-64px)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-pink-500/50 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[200px]"
              onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              {preview ? (
                <img src={preview} alt="Preview" className="max-h-40 rounded-lg object-contain" />
              ) : (
                <>
                  <Upload className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Upload avatar/profile picture</p>
                </>
              )}
            </div>

            <div className="space-y-3">
              {file && !result && (
                <button onClick={handleSearch} disabled={isSearching}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-medium hover:from-pink-500 hover:to-rose-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSearching ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</> : <><Search className="w-4 h-4" /> Reverse Search</>}
                </button>
              )}

              {result && (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                  {(() => {
                    const engineNames = { google: 'Google Lens', yandex: 'Yandex', bing: 'Bing' };
                    const engines = Object.entries(result.searches || {}).map(([key, val]) => ({
                      name: engineNames[key] || val.source || key,
                      matchCount: val.matchCount || val.matches?.length || 0,
                      matches: val.matches || [],
                    }));
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Total matches: {result.totalMatches || 0}</span>
                        </div>
                        {engines.map((e, i) => (
                          <div key={i} className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">{getEngineIcon(e.name)} {e.name}</span>
                              {e.matchCount > 0 && <span className="text-xs text-gray-500">{e.matchCount} matches</span>}
                            </div>
                            {e.matches.length > 0 && (
                              <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                                {e.matches.slice(0, 5).map((m, j) => (
                                  <a key={j} href={m.url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300 truncate">
                                    <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                                    {m.url?.substring(0, 60)}...
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AvatarReverseTool;
