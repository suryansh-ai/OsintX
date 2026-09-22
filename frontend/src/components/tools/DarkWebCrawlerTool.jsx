import { useState, useCallback, useEffect } from 'react';
import { useToolResult } from '../../context/ToolResultContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, ExternalLink, ChevronDown, ChevronUp,
  Loader2, AlertTriangle, Shield,
  Skull, Eye, Server
} from 'lucide-react';
import { useToast } from '../common/Toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DarkWebCrawlerTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState(null);
  const { setLastResult } = useToolResult();
  // Auto-register result with global Save to Case button
  useEffect(() => {
    if (result) {
      setLastResult({ data: result, toolName: 'DarkWebCrawler', query });
    }
  }, [result, setLastResult, query]);
  useEffect(() => () => setLastResult(null), []);

  const [showRaw, setShowRaw] = useState(false);

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) { toast.error('Enter a search query'); return; }
    onConsume?.(18);
    setIsSearching(true);
    setResult(null);
    try {
      const resp = await fetch(`${API_BASE}/tools/darkweb/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Search failed');
      setResult(data);
      if (data.totalOnionFound > 0) {
        toast.success(`Found ${data.results?.length || 0} .onion sites`);
      } else {
        toast.info('No .onion sites found for query');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSearching(false);
    }
  }, [query, onConsume, toast]);

  const openUrl = (url) => window.open(url, '_blank', 'noopener,noreferrer');

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
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-800 to-red-950 flex items-center justify-center shadow-lg shadow-red-900/30">
              <Skull className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white tracking-wide">Dark Web Crawler</h1>
              <p className="text-[10px] text-gray-500 tracking-[0.2em] uppercase">Tor Index · Ahmia · OnionLand</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Input */}
          <div className="flex gap-2">
            <div className="relative flex-1 flex items-center rounded-xl bg-[#111827] border border-gray-800 focus-within:border-red-600/50 transition-all overflow-hidden">
              <Search className="w-4 h-4 text-gray-500 ml-4 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search term, email, username, etc."
                className="flex-1 bg-transparent text-white text-sm px-3 py-4 outline-none placeholder-gray-600 font-mono"
                autoFocus
              />
            </div>
            <button onClick={handleSearch} disabled={isSearching}
              className="px-5 py-4 bg-gradient-to-r from-red-700 to-red-900 text-white text-sm font-medium hover:from-red-600 hover:to-red-800 transition-all flex items-center gap-2 rounded-xl disabled:opacity-50">
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {isSearching ? 'Crawling...' : 'Search Dark Web'}
            </button>
          </div>

          {/* Results */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

                {/* Tor status + stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <Server className="w-4 h-4 mx-auto mb-1 text-indigo-400" />
                    <p className="text-xs text-gray-400 font-bold">
                      Tor {result.torAvailable ? 'Available' : 'Offline'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <p className="text-xl text-white font-bold">{result.totalOnionFound}</p>
                    <p className="text-[10px] text-gray-500">.onion Found</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <p className="text-xl text-indigo-400 font-bold">{result.elapsedSeconds}s</p>
                    <p className="text-[10px] text-gray-500">Elapsed</p>
                  </div>
                </div>

                {/* Search sources */}
                <div className="space-y-2">
                  {Object.entries(result.searches || {}).map(([engine, data]) => (
                    <div key={engine} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 uppercase tracking-wider">{engine}</span>
                        <span className="text-[10px] text-gray-400">
                          {data.success ? `${data.totalFound || 0} results` : 'Error'}
                        </span>
                      </div>
                      {data.error && <p className="text-[10px] text-red-400 mt-1">{data.error}</p>}
                    </div>
                  ))}
                </div>

                {/* .onion sites */}
                {result.onionSites?.length > 0 && (
                  <div>
                    <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Eye className="w-3 h-3" /> Discovered .onion Sites
                    </h5>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {result.onionSites.map((site, i) => (
                        <div key={site.url || i} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-red-500/20 transition-all">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-300 font-mono truncate">{site.url}</p>
                              {site.title && <p className="text-[10px] text-gray-500 truncate mt-0.5">{site.title}</p>}
                              <span className="text-[9px] text-gray-600">Source: {site.source}</span>
                            </div>
                            <button onClick={() => openUrl(site.url)}
                              className="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Crawled sites (if Tor available) */}
                {result.crawledSites?.length > 0 && (
                  <div>
                    <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Shield className="w-3 h-3" /> Crawled .onion Sites
                    </h5>
                    <div className="space-y-2">
                      {result.crawledSites.map((site, i) => (
                        <div key={site.url || i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                          {site.crawled ? (
                            <>
                              <div className="flex items-center justify-between">
                                <code className="text-xs text-gray-300 font-mono truncate">{site.url}</code>
                                <span className="text-[10px] text-emerald-500">{site.statusCode}</span>
                              </div>
                              {site.title && <p className="text-xs text-gray-500 mt-1 truncate">{site.title}</p>}
                              <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-600">
                                <span>Size: {site.contentLength} bytes</span>
                                <span>Type: {site.contentType?.split(';')[0] || 'Unknown'}</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-3 h-3 text-red-400" />
                              <span className="text-xs text-red-400">Failed to crawl: {site.error || 'Unknown error'}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sources */}
                <div className="flex flex-wrap gap-1.5">
                  {(result.sources || []).map((s, i) => (
                    <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">{s}</span>
                  ))}
                </div>

                {/* Raw toggle */}
                <div className="flex items-center justify-between pt-2">
                  {result?.timestamp && <span className="text-[10px] text-gray-600">{new Date(result.timestamp).toLocaleString()}</span>}
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

export default DarkWebCrawlerTool;
