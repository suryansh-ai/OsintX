import { useState, useCallback, useRef , useEffect} from 'react';
import { useToolResult } from '../../context/ToolResultContext';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Image, Link, ExternalLink, Globe, Camera,
  ChevronDown, ChevronUp, Loader2, FileImage, AlertCircle,
  CheckCircle, Upload, Info
} from 'lucide-react';
import { useToast } from '../common/Toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ReverseImageSearchTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const [imageUrl, setImageUrl] = useState('');
  const [base64Preview, setBase64Preview] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState(null);
  const { setLastResult } = useToolResult();
  // Auto-register result with global Save to Case button
  useEffect(() => {
    if (result) {
      setLastResult({ data: result, toolName: 'ReverseImageSearch', query: '' });
    }
  }, [result]);
  useEffect(() => () => setLastResult(null), []);  const [showRaw, setShowRaw] = useState(false);
  const [activeEngine, setActiveEngine] = useState('all');
  const fileInputRef = useRef(null);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBase64Preview(ev.target.result);
      setImageUrl('');
      toast.info('Image loaded — enter a URL or upload to a hosting service first');
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleSearch = useCallback(async () => {
    const url = imageUrl.trim();
    if (!url && !base64Preview) {
      toast.error('Enter an image URL or upload an image');
      return;
    }
    if (url && !url.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|bmp|svg|tiff?)/i)) {
      toast.error('Enter a valid image URL (must end in image extension)');
      return;
    }
    onConsume?.(15);
    setIsSearching(true);
    setResult(null);
    try {
      const resp = await fetchWithTimeout(`${API_BASE}/tools/image/reverse-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: url || '',
          base64: base64Preview || '',
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Search failed');
      setResult(data);
      if (data.searches) {
        const engines = Object.values(data.searches).filter(s => s.success).length;
        toast.success(`Queried ${engines} reverse image engines`);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSearching(false);
    }
  }, [imageUrl, base64Preview, onConsume, toast]);

  const openSearchUrl = (url) => window.open(url, '_blank', 'noopener,noreferrer');
  const openExternal = (url) => window.open(url, '_blank', 'noopener,noreferrer');

  const engineMeta = {
    google: { name: 'Google Lens', icon: Camera, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    bing: { name: 'Bing Visual Search', icon: Search, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    yandex: { name: 'Yandex', icon: Globe, color: 'text-red-400', bg: 'bg-red-500/10' },
    tineye: { name: 'TinEye', icon: Image, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  };

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
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center shadow-lg shadow-green-900/30">
              <Image className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white tracking-wide">Reverse Image Search</h1>
              <p className="text-[10px] text-gray-500 tracking-[0.2em] uppercase">Google Lens · Bing · Yandex · TinEye</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* ── Input ── */}
          <div className="space-y-3">
            {/* URL input */}
            <div className="flex gap-2">
              <div className="relative flex-1 flex items-center rounded-xl bg-[#111827] border border-gray-800 focus-within:border-green-600/50 transition-all overflow-hidden">
                <Link className="w-4 h-4 text-gray-500 ml-4 flex-shrink-0" />
                <input
                  type="text"
                  value={imageUrl}
                  onChange={e => { setImageUrl(e.target.value); setBase64Preview(null); }}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 bg-transparent text-white text-sm px-3 py-4 outline-none placeholder-gray-600 font-mono"
                />
              </div>
              <button onClick={handleSearch} disabled={isSearching || (!imageUrl && !base64Preview)}
                className="px-5 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white text-sm font-medium hover:from-green-500 hover:to-teal-500 transition-all flex items-center gap-2 rounded-xl disabled:opacity-50">
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {isSearching ? '…' : 'Search'}
              </button>
            </div>

            {/* OR divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-800" />
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>

            {/* File upload */}
            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#111827] border border-gray-800 hover:border-green-600/30 transition-all text-sm text-gray-400 hover:text-gray-200">
                <Upload className="w-4 h-4" /> Upload Image
              </button>
              {base64Preview && (
                <div className="flex items-center gap-2 text-xs text-green-400">
                  <CheckCircle className="w-3 h-3" /> Image loaded
                  <button onClick={() => setBase64Preview(null)} className="text-red-400 hover:text-red-300 ml-1">Clear</button>
                </div>
              )}
            </div>

            {/* Image preview */}
            {base64Preview && (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <img src={base64Preview} alt="Uploaded" className="max-h-32 rounded-lg mx-auto" />
                <p className="text-[10px] text-gray-600 text-center mt-2">
                  Upload first to a hosting service (imgur, postimg, etc.) then enter the URL above
                </p>
              </div>
            )}
          </div>

          {/* ── Results ── */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} className="space-y-4">

                {/* Image metadata */}
                {result.metadata && (
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
                    <FileImage className="w-5 h-5 text-gray-500" />
                    <div className="text-xs text-gray-400">
                      <span className="text-gray-500">{result.metadata.contentType || 'Unknown type'}</span>
                      {result.metadata.fileSizeKB && (
                        <span className="text-gray-600 ml-3">{result.metadata.fileSizeKB} KB</span>
                      )}
                    </div>
                    {result.imageUrl && (
                      <button onClick={() => openExternal(result.imageUrl)}
                        className="ml-auto text-[10px] text-green-400 hover:text-green-300 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Open
                      </button>
                    )}
                  </div>
                )}

                {/* Engine tabs */}
                  <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5">
                    <button onClick={() => setActiveEngine('all')}
                      className="px-3 py-2 rounded-lg text-[11px] font-medium transition-all flex-1">
                      All Results
                    </button>
                    {Object.entries(result.searches || {}).map(([key, data]) => {
                      const meta = engineMeta[key] || {};
                      return (
                        <button key={key} onClick={() => setActiveEngine(key)}
                          className="px-3 py-2 rounded-lg text-[11px] font-medium transition-all flex-1 capitalize">
                          {meta.name || key}
                        </button>
                      );
                    })}
                  </div>

                {/* Engine results */}
                <div className="space-y-3">
                  {Object.entries(result.searches || {})
                    .filter(([key]) => activeEngine === 'all' || activeEngine === key)
                    .map(([engine, data]) => {
                      const meta = engineMeta[engine] || {};
                      return (
                        <div key={engine} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-white/[0.05] flex items-center justify-center">
                                <meta.icon className="w-4 h-4 text-gray-400" />
                              </div>
                              <div>
                                <span className="text-xs text-gray-300 font-medium capitalize">{meta.name || engine}</span>
                                {data.matchCount !== undefined && (
                                  <span className="text-[10px] text-gray-600 ml-2">{data.matchCount} matches</span>
                                )}
                              </div>
                            </div>
                            {data.success && data.url && (
                              <button onClick={() => openSearchUrl(data.url)}
                                className="text-[10px] text-green-400 hover:text-green-300 flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> Open Search
                              </button>
                            )}
                          </div>

                          {data.error && (
                            <p className="text-xs text-red-400">{data.error}</p>
                          )}

                          {data.results && data.results.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {data.results.slice(0, 5).map((r, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                  <Info className="w-3 h-3 text-gray-600 flex-shrink-0" />
                                  <a href={r} target="_blank" rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 truncate">{r}</a>
                                </div>
                              ))}
                              {data.results.length > 5 && (
                                <p className="text-[10px] text-gray-600">+{data.results.length - 5} more results</p>
                              )}
                            </div>
                          )}

                          {data.description && data.success && (
                            <p className="text-xs text-gray-500 mt-1">{data.description}</p>
                          )}
                        </div>
                      );
                    })}
                </div>

                {/* Raw JSON toggle */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex flex-wrap gap-1.5">
                    {(result.sources || []).map((s, i) => (
                      <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                        {s}
                      </span>
                    ))}
                  </div>
                  <button onClick={() => setShowRaw(!showRaw)}
                    className="flex items-center gap-2 text-[10px] text-gray-600 hover:text-gray-400 transition-colors">
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

export default ReverseImageSearchTool;
