import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Copy, Download, RefreshCw, Info, Plane, Navigation, Globe, Radio, Wind, History, User, Map, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SectionCard = ({ title, icon: Icon, children, defaultOpen = true, color = 'blue' }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-xl bg-slate-900/60 border border-${color}-500/20 overflow-hidden`}>
      <button onClick={()=>setOpen(!open)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
        <span className={`text-xs text-${color}-400/80 uppercase tracking-wider flex items-center gap-2 font-medium`}>
          {Icon && <Icon className="w-3.5 h-3.5" />} {title}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.2}}>
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const InfoRow = ({ label, value, mono }) => {
  if (!value && value !== 0 && value !== false) return null;
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50 last:border-0">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className={`text-white text-sm ${mono ? 'font-mono' : ''}`}>{String(value)}</span>
    </div>
  );
};

const FlightTrackerTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  const [callsign, setCallsign] = useState('');
  const [icao24, setIcao24] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Flight Tracker', query: '' });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [enriched, setEnriched] = useState(null);
  const [showRadar, setShowRadar] = useState(false);
  const [activeTab, setActiveTab] = useState('live');
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 20 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5, speedX: (Math.random() - 0.5) * 0.3, speedY: (Math.random() - 0.5) * 0.3,
      color: ['#3b82f6', '#60a5fa', '#2563eb', '#93c5fd'][Math.floor(Math.random() * 4)],
    }));
    let id;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { ctx.beginPath(); ctx.fillStyle = p.color + '15'; ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); p.x += p.speedX; p.y += p.speedY; if (p.x < 0 || p.x > canvas.width) p.speedX *= -1; if (p.y < 0 || p.y > canvas.height) p.speedY *= -1; });
      id = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(id);
  }, []);

  const fetchEnriched = async (hex) => {
    if (!hex) return;
    try {
      const resp = await fetch(`${API_BASE}/tools/flight/enriched`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icao24: hex }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setEnriched(data);
      }
    } catch { }
  };

  const handleSearch = async () => {
    if (!callsign.trim() && !icao24.trim()) { toast.error('Enter a callsign or ICAO24 hex code'); return; }
    trackToolUsage('flight', 'track', 'start');
    setIsSearching(true); setResults(null); setEnriched(null); onConsume?.(10);
    try {
      const resp = await fetch(`${API_BASE}/tools/flight/track`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callsign: callsign.trim(), icao24: icao24.trim() }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || 'Tracking failed'); }
      const data = await resp.json();
      setResults(data);
      addToHistory('flight', callsign || icao24, data);
      toast.success(`Found ${data.totalFlights} flight(s)`);
      if (data.flights?.[0]?.icao24) fetchEnriched(data.flights[0].icao24);
    } catch (err) { toast.error(err.message); }
    finally { setIsSearching(false); }
  };

  const tabs = [
    { id: 'live', label: 'Live', icon: Radio },
    { id: 'history', label: 'History', icon: History },
    { id: 'owner', label: 'Owner', icon: User },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }} onClick={e => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950/10 to-slate-950 border border-blue-500/30 shadow-[0_0_100px_rgba(59,130,246,0.1)]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="relative z-10 flex flex-col max-h-[92vh]">
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30"><Plane className="w-6 h-6 text-blue-400" /></div>
              <div><h2 className="text-xl font-bold text-white">Flight Tracker</h2><p className="text-sm text-slate-400">Live aircraft tracking + enrichment</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div className="p-6 border-b border-white/5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Plane className="absolute w-5 h-5 left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={callsign} onChange={e => setCallsign(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Callsign (e.g. DLH1234)" className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none font-mono" />
              </div>
              <div className="relative w-full sm:w-56">
                <Radio className="absolute w-5 h-5 left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={icao24} onChange={e => setIcao24(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="ICAO24 hex (e.g. a1b2c3)" className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none font-mono" />
              </div>
              <button onClick={handleSearch} disabled={isSearching}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {isSearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {isSearching ? 'Tracking...' : 'Track'}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {isSearching && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <p className="mt-4 text-slate-400">Scanning airspace...</p>
              </div>
            )}
            {results && !isSearching && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400">Flights Found</p>
                    <p className="text-3xl font-bold text-blue-400">{results.totalFlights}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400">Timestamp</p>
                    <p className="text-sm font-mono text-white">{results.timestamp ? new Date(results.timestamp).toLocaleString() : 'N/A'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400">Sources</p>
                    <p className="text-sm text-white">{results.dataSources?.join(', ')}</p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-transparent'}`}>
                      <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                  ))}
                  <button onClick={() => setShowRadar(!showRadar)}
                    className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-all ${showRadar ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-transparent'}`}>
                    <Map className="w-4 h-4" /> Radar {showRadar ? 'ON' : 'OFF'}
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                    {activeTab === 'live' && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-slate-400 border-b border-white/10">
                            <tr>
                              <th className="py-3 px-3">Callsign</th>
                              <th className="py-3 px-3">ICAO24</th>
                              <th className="py-3 px-3">Country</th>
                              <th className="py-3 px-3">Altitude</th>
                              <th className="py-3 px-3">Velocity</th>
                              <th className="py-3 px-3">Heading</th>
                              <th className="py-3 px-3">Lat/Lon</th>
                              <th className="py-3 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.flights?.map((f, i) => (
                              <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                <td className="py-2.5 px-3 font-mono text-blue-400">{f.callsign || 'N/A'}</td>
                                <td className="py-2.5 px-3 font-mono text-slate-300">{f.icao24}</td>
                                <td className="py-2.5 px-3 text-white">{f.originCountry}</td>
                                <td className="py-2.5 px-3 text-white">{f.altitude ? `${Math.round(f.altitude)}m` : 'N/A'}</td>
                                <td className="py-2.5 px-3 text-white">{f.velocity ? `${Math.round(f.velocity * 3.6)} km/h` : 'N/A'}</td>
                                <td className="py-2.5 px-3 text-white">{f.heading ? `${Math.round(f.heading)}°` : 'N/A'}</td>
                                <td className="py-2.5 px-3 font-mono text-xs text-slate-400">
                                  {f.latitude && f.longitude ? (
                                    <a href={`https://www.google.com/maps?q=${f.latitude},${f.longitude}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                                      {f.latitude.toFixed(3)}, {f.longitude.toFixed(3)}
                                    </a>
                                  ) : 'N/A'}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded-full text-xs ${f.onGround ? 'bg-amber-500/20 text-amber-300' : 'bg-green-500/20 text-green-300'}`}>
                                    {f.onGround ? 'Ground' : 'Airborne'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {activeTab === 'history' && (
                      <div className="space-y-3">
                        {enriched?.history?.flights?.length > 0 ? (
                          enriched.history.flights.slice(0, 20).map((fh, i) => (
                            <div key={i} className="p-3 rounded-xl bg-white/5 border border-blue-500/20">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Departure: {fh.estDepartureAirport || 'N/A'}</span>
                                <span className="text-slate-400">Arrival: {fh.estArrivalAirport || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between text-xs text-slate-500 mt-1">
                                <span>Departure: {fh.firstSeen ? new Date(fh.firstSeen * 1000).toLocaleString() : 'N/A'}</span>
                                <span>Arrival: {fh.lastSeen ? new Date(fh.lastSeen * 1000).toLocaleString() : 'N/A'}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center text-slate-400">
                            <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p>No flight history available for this aircraft</p>
                            <p className="text-xs text-slate-500 mt-1">History is fetched via OpenSky API when an ICAO24 is provided</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'owner' && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <SectionCard title="Aircraft Registration" icon={Globe} color="blue">
                          <InfoRow label="ICAO24" value={results.flights?.[0]?.icao24 || 'N/A'} mono />
                          <InfoRow label="Country" value={results.flights?.[0]?.originCountry} />
                          <InfoRow label="Operator" value={enriched?.registration?.data?.operator || 'Unknown'} />
                          <InfoRow label="Owner" value={enriched?.registration?.data?.owner || 'Unknown'} />
                          <InfoRow label="Type" value={enriched?.registration?.data?.type || 'N/A'} />
                        </SectionCard>
                        <SectionCard title="Aircraft Details" icon={Plane} color="emerald">
                          <InfoRow label="Manufacturer" value={enriched?.registration?.data?.manufacturer || 'N/A'} />
                          <InfoRow label="Model" value={enriched?.registration?.data?.model || 'N/A'} />
                          <InfoRow label="Registration" value={enriched?.registration?.data?.registration || 'N/A'} />
                          <InfoRow label="First Flight" value={enriched?.registration?.data?.firstFlight || 'N/A'} />
                          <InfoRow label="Age" value={enriched?.registration?.data?.age || 'N/A'} />
                        </SectionCard>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Radar overlay section */}
                {showRadar && results.flights?.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Map className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-300">Live Radar Overlay</span>
                    </div>
                    <div className="relative w-full h-64 rounded-lg bg-slate-950 overflow-hidden border border-white/10">
                      <canvas id="radar-canvas" className="w-full h-full" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <Navigation className="w-8 h-8 text-emerald-400 mx-auto animate-pulse" />
                          <p className="text-xs text-slate-400 mt-2">{results.flights.length} aircraft tracked</p>
                          <p className="text-xs text-slate-500">Open <a href={`https://www.google.com/maps?q=${results.flights[0].latitude},${results.flights[0].longitude}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Google Maps</a> for positions</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <button onClick={() => copy(JSON.stringify(results, null, 2))} className="p-2 rounded-lg hover:bg-white/10"><Copy className="w-4 h-4 text-slate-400" /></button>
                  <button onClick={() => exportToJSON(results, 'flight-tracker-results')} className="p-2 rounded-lg hover:bg-white/10"><Download className="w-4 h-4 text-slate-400" /></button>
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-2"><Info className="w-3 h-3" /> Sources: {results.dataSources?.join(', ')} • {results.searchDuration}</div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FlightTrackerTool;
