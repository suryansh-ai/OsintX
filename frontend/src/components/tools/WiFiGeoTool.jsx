import { useState, useCallback , useEffect} from 'react';
import { useToolResult } from '../../context/ToolResultContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi, X, Search, RefreshCw, Copy, Download, ExternalLink, MapPin,
  Shield, Info, ChevronDown, ChevronUp, Navigation, Globe, Hash,
  AlertTriangle, CheckCircle, Cpu
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { exportToJSON } from '../../utils/export';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const borderColorMap = { emerald: 'border-emerald-500/20', blue: 'border-blue-500/20', cyan: 'border-cyan-500/20', purple: 'border-purple-500/20', teal: 'border-teal-500/20', orange: 'border-orange-500/20', amber: 'border-amber-500/20', yellow: 'border-yellow-500/20', slate: 'border-slate-500/20', pink: 'border-pink-500/20', red: 'border-red-500/20', green: 'border-green-500/20', indigo: 'border-indigo-500/20' };
const textColorMap = { emerald: 'text-emerald-400', blue: 'text-blue-400', cyan: 'text-cyan-400', purple: 'text-purple-400', teal: 'text-teal-400', orange: 'text-orange-400', amber: 'text-amber-400', yellow: 'text-yellow-400', slate: 'text-slate-400', pink: 'text-pink-400', red: 'text-red-400', green: 'text-green-400', indigo: 'text-indigo-400' };

const Section = ({ title, icon: Icon, children, color = 'cyan', defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  const borderClass = borderColorMap[color] || 'border-cyan-500/20';
  const textClass = textColorMap[color] || 'text-cyan-400';
  return (
    <div className={'rounded-xl bg-slate-900/60 border ' + borderClass + ' overflow-hidden'}>
      <button onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
        <span className={'text-xs ' + textClass + ' uppercase tracking-wider flex items-center gap-2 font-semibold'}>
          {Icon && <Icon className="w-3.5 h-3.5" />}{title}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const WiFiGeoTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  const [mode, setMode] = useState('bssid'); // 'bssid' | 'ssid'
  const [bssid, setBssid] = useState('');
  const [ssid, setSsid] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState(null);
  const { setLastResult } = useToolResult();
  // Auto-register result with global Save to Case button
  useEffect(() => {
    if (result) {
      setLastResult({ data: result, toolName: 'WiFiGeo', query: bssid });
    }
  }, [result]);
  useEffect(() => () => setLastResult(null), []);
  const handleSearch = useCallback(async () => {
    const cleanBssid = bssid.trim();
    const cleanSsid = ssid.trim();
    if (mode === 'bssid' && !cleanBssid) { toast.error('Enter a BSSID (MAC address)'); return; }
    if (mode === 'ssid' && !cleanSsid) { toast.error('Enter an SSID (network name)'); return; }
    onConsume?.(10);
    setIsSearching(true);
    setResult(null);
    try {
      const resp = await fetchWithTimeout(`${API_BASE}/tools/wifi/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bssid: mode === 'bssid' ? cleanBssid : '',
          ssid: mode === 'ssid' ? cleanSsid : '',
        }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.error || 'Lookup failed');
      setResult(data);
      addToHistory('wifi-geo', mode === 'bssid' ? cleanBssid : cleanSsid, data);
      if (data.success) {
        toast.success(data.geolocation ? 'Location found!' : `${data.wigleResults?.length || 0} networks found`);
      } else {
        toast.warning(data.message || 'No location data found');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSearching(false);
    }
  }, [bssid, ssid, mode, onConsume, toast, addToHistory]);

  const geo = result?.geolocation;
  const address = result?.address;
  const vendor = result?.vendor;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }} transition={{ type: 'spring', damping: 18 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-cyan-950/10 to-slate-950 border border-cyan-500/30 shadow-[0_0_80px_rgba(6,182,212,0.1)]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <Wifi className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">WiFi Geolocation</h2>
              <p className="text-sm text-slate-400">BSSID/SSID lookup · MAC vendor · Address resolution</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {result && (
              <>
                <button onClick={() => copy(JSON.stringify(result, null, 2))}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={() => exportToJSON(result, 'wifi-geo')}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-5 border-b border-white/5 space-y-3">
          {/* Mode toggle */}
          <div className="flex gap-2">
            {[
              { id: 'bssid', label: 'BSSID (MAC)', desc: 'e.g. 00:1A:2B:3C:4D:5E' },
              { id: 'ssid', label: 'SSID (Name)', desc: 'e.g. MyHomeNetwork' },
            ].map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                  mode === m.id
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                }`}>
                {m.label}
                <span className="block text-xs opacity-60 mt-0.5">{m.desc}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              {mode === 'bssid' ? (
                <Hash className="absolute w-5 h-5 left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              ) : (
                <Wifi className="absolute w-5 h-5 left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              )}
              {mode === 'bssid' ? (
                <input value={bssid} onChange={e => setBssid(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="00:1A:2B:3C:4D:5E or 00-1A-2B-3C-4D-5E"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none text-sm font-mono" />
              ) : (
                <input value={ssid} onChange={e => setSsid(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Network name (SSID)"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none text-sm" />
              )}
            </div>
            <button onClick={handleSearch} disabled={isSearching}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 text-sm">
              {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {isSearching ? 'Locating...' : 'Locate'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 max-h-[calc(92vh-240px)] space-y-4">
          {isSearching && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-14 h-14 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Querying WiFi geolocation databases...</p>
            </div>
          )}

          {result && !isSearching && (
            <>
              {/* Location found banner */}
              {geo && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="text-white font-semibold">Location Found</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-emerald-400" />
                    <span className="text-white font-mono text-sm">
                      {typeof geo.lat === 'number' ? geo.lat.toFixed(6) : geo.lat},
                      {typeof geo.lon === 'number' ? geo.lon.toFixed(6) : geo.lon}
                    </span>
                  </div>
                  {geo.range && (
                    <span className="text-slate-400 text-sm">±{geo.range}m accuracy</span>
                  )}
                  <span className="text-xs text-slate-500">via {geo.source}</span>
                  <div className="ml-auto flex gap-2">
                    <a href={`https://maps.google.com/?q=${geo.lat},${geo.lon}`}
                      target="_blank" rel="noopener noreferrer"
                      className="px-2 py-1 text-xs rounded-lg bg-white/10 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Google Maps
                    </a>
                    <a href={`https://www.openstreetmap.org/?mlat=${geo.lat}&mlon=${geo.lon}&zoom=16`}
                      target="_blank" rel="noopener noreferrer"
                      className="px-2 py-1 text-xs rounded-lg bg-white/10 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> OpenStreetMap
                    </a>
                  </div>
                </div>
              )}

              {/* No location */}
              {!geo && !result.wigleResults?.length && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-white text-sm font-semibold">No location data found</p>
                    <p className="text-slate-400 text-xs mt-0.5">{result.message || 'This network is not in any public database'}</p>
                    {result.manualLookup?.wigle && (
                      <a href={result.manualLookup.wigle} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-amber-400 hover:underline flex items-center gap-1 mt-1">
                        <ExternalLink className="w-3 h-3" /> Check manually on WiGLE
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Address */}
              {address && (
                <Section title="Resolved Address" icon={MapPin} color="cyan">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {[
                      ['Road', address.road],
                      ['Suburb', address.suburb],
                      ['City', address.city],
                      ['State', address.state],
                      ['Country', address.country],
                      ['Postcode', address.postcode],
                    ].filter(([, v]) => v).map(([k, v]) => (
                      <div key={k} className="p-2 rounded-lg bg-white/5">
                        <p className="text-xs text-slate-500">{k}</p>
                        <p className="text-sm text-white">{v}</p>
                      </div>
                    ))}
                  </div>
                  {address.displayName && (
                    <p className="text-xs text-slate-500 mt-2">{address.displayName}</p>
                  )}
                </Section>
              )}

              {/* MAC Vendor */}
              {vendor && (
                <Section title="MAC Vendor / OUI" icon={Cpu} color="purple">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {[
                      ['Vendor', vendor.vendor],
                      ['OUI', vendor.oui],
                      ['Country', vendor.country],
                      ['Type', vendor.type],
                      ['Source', vendor.source],
                    ].filter(([, v]) => v).map(([k, v]) => (
                      <div key={k} className="p-2 rounded-lg bg-white/5">
                        <p className="text-xs text-slate-500">{k}</p>
                        <p className="text-sm text-white">{v}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* BSSID details */}
              {result.bssid && (
                <Section title="Network Details" icon={Wifi} color="teal">
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="p-2 rounded-lg bg-white/5">
                      <p className="text-xs text-slate-500">BSSID</p>
                      <p className="text-sm text-white font-mono">{result.bssid}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5">
                      <p className="text-xs text-slate-500">OUI Prefix</p>
                      <p className="text-sm text-white font-mono">{result.oui}</p>
                    </div>
                    {geo?.channel && (
                      <div className="p-2 rounded-lg bg-white/5">
                        <p className="text-xs text-slate-500">Channel</p>
                        <p className="text-sm text-white">{geo.channel}</p>
                      </div>
                    )}
                    {geo?.encryption && (
                      <div className="p-2 rounded-lg bg-white/5">
                        <p className="text-xs text-slate-500">Encryption</p>
                        <p className="text-sm text-white">{geo.encryption}</p>
                      </div>
                    )}
                    {geo?.firstSeen && (
                      <div className="p-2 rounded-lg bg-white/5">
                        <p className="text-xs text-slate-500">First Seen</p>
                        <p className="text-sm text-white">{geo.firstSeen}</p>
                      </div>
                    )}
                    {geo?.lastSeen && (
                      <div className="p-2 rounded-lg bg-white/5">
                        <p className="text-xs text-slate-500">Last Seen</p>
                        <p className="text-sm text-white">{geo.lastSeen}</p>
                      </div>
                    )}
                  </div>
                </Section>
              )}

              {/* WiGLE results for SSID search */}
              {result.wigleResults?.length > 0 && (
                <Section title={`WiGLE Results (${result.wigleResults.length})`} icon={Globe} color="blue">
                  <div className="space-y-2 mt-2 max-h-64 overflow-y-auto">
                    {result.wigleResults.map((n, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-white font-medium">{n.ssid || result.ssid}</p>
                          {n.bssid && <span className="text-xs text-slate-400 font-mono">{n.bssid}</span>}
                        </div>
                        {(n.lat && n.lon) && (
                          <p className="text-xs text-slate-500 mt-1 font-mono">
                            {typeof n.lat === 'number' ? n.lat.toFixed(5) : n.lat},
                            {typeof n.lon === 'number' ? n.lon.toFixed(5) : n.lon}
                            {n.city && ` — ${n.city}`}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              <div className="text-xs text-slate-600 flex items-center gap-2 pt-1">
                <Info className="w-3 h-3" />
                Sources: {result.dataSources?.join(', ')} · {result.searchDuration}
              </div>
            </>
          )}

          {!result && !isSearching && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                <Wifi className="w-12 h-12 text-cyan-400" />
              </div>
              <div>
                <p className="text-white font-semibold">WiFi Geolocation</p>
                <p className="text-slate-400 text-sm mt-1">Locate a WiFi network by its BSSID or SSID</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 max-w-xs">
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">📍 GPS coordinates</div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">🏢 Street address</div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">🔌 MAC vendor</div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">📡 Network details</div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WiFiGeoTool;
