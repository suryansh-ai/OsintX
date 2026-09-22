import { useState, useRef, useCallback , useEffect} from 'react';
import { useToolResult } from '../../context/ToolResultContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, MapPin, Globe, Search, RefreshCw, ExternalLink, Copy, Download,
  Thermometer, Wind, Eye, Navigation, Building, Info, Shield, AlertTriangle,
  BookOpen, Clock, Mountain, Flag, ChevronDown, ChevronUp
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { exportToJSON } from '../../utils/export';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const borderColorMap = { emerald: 'border-emerald-500/20', blue: 'border-blue-500/20', cyan: 'border-cyan-500/20', purple: 'border-purple-500/20', teal: 'border-teal-500/20', orange: 'border-orange-500/20', amber: 'border-amber-500/20', yellow: 'border-yellow-500/20', slate: 'border-slate-500/20', pink: 'border-pink-500/20', red: 'border-red-500/20', green: 'border-green-500/20', indigo: 'border-indigo-500/20' };
const textColorMap = { emerald: 'text-emerald-400', blue: 'text-blue-400', cyan: 'text-cyan-400', purple: 'text-purple-400', teal: 'text-teal-400', orange: 'text-orange-400', amber: 'text-amber-400', yellow: 'text-yellow-400', slate: 'text-slate-400', pink: 'text-pink-400', red: 'text-red-400', green: 'text-green-400', indigo: 'text-indigo-400' };
const bgColorMap = { emerald: 'bg-emerald-500/10', blue: 'bg-blue-500/10', cyan: 'bg-cyan-500/10', purple: 'bg-purple-500/10', teal: 'bg-teal-500/10', orange: 'bg-orange-500/10', amber: 'bg-amber-500/10', yellow: 'bg-yellow-500/10', slate: 'bg-slate-500/10', pink: 'bg-pink-500/10', red: 'bg-red-500/10', green: 'bg-green-500/10', indigo: 'bg-indigo-500/10' };

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

const StatCard = ({ label, value, sub, color = 'cyan' }) => {
  const bgClass = bgColorMap[color] || 'bg-cyan-500/10';
  const borderClass = borderColorMap[color] || 'border-cyan-500/20';
  const textClass = textColorMap[color] || 'text-cyan-400';
  return (
    <div className={'p-3 rounded-xl ' + bgClass + ' border ' + borderClass + ' text-center'}>
      <p className={'text-lg font-bold ' + textClass}>{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  );
};

const GeoAITool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  const [query, setQuery] = useState('');
  const [radius, setRadius] = useState(1000);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const { setLastResult } = useToolResult();
  // Auto-register result with global Save to Case button
  useEffect(() => {
    if (result) {
      setLastResult({ data: result, toolName: 'GeoAI', query: query });
    }
  }, [result]);
  useEffect(() => () => setLastResult(null), []);  const [activeTab, setActiveTab] = useState('overview');

  const handleAnalyze = useCallback(async () => {
    if (!query.trim()) { toast.error('Enter a location, coordinates, or place name'); return; }
    onConsume?.(15);
    setIsAnalyzing(true);
    setResult(null);
    try {
      const resp = await fetchWithTimeout(`${API_BASE}/tools/geo/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), radius }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.error || 'Analysis failed');
      setResult(data);
      addToHistory('geo-ai', query, data);
      toast.success(`Location resolved — ${data.dataSources?.length || 0} sources queried`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [query, radius, onConsume, toast, addToHistory]);

  const tabs = ['overview', 'pois', 'weather', 'country', 'wikipedia'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }} transition={{ type: 'spring', damping: 18 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950/10 to-slate-950 border border-emerald-500/30 shadow-[0_0_80px_rgba(16,185,129,0.1)]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <MapPin className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Geo Intelligence</h2>
              <p className="text-sm text-slate-400">Location analysis — POIs, weather, country intel, Wikipedia</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {result && (
              <>
                <button onClick={() => copy(JSON.stringify(result, null, 2))}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={() => exportToJSON(result, 'geo-intelligence')}
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
          <div className="flex gap-3">
            <div className="relative flex-1">
              <MapPin className="absolute w-5 h-5 left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                placeholder="Eiffel Tower Paris  |  48.8582, 2.2945  |  Times Square New York"
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none text-sm" />
            </div>
            <select value={radius} onChange={e => setRadius(Number(e.target.value))}
              className="px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm focus:outline-none focus:border-emerald-500/50">
              <option value={200}>200m</option>
              <option value={500}>500m</option>
              <option value={1000}>1km</option>
              <option value={2000}>2km</option>
              <option value={5000}>5km</option>
            </select>
            <button onClick={handleAnalyze} disabled={isAnalyzing}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 text-sm">
              {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
          <p className="text-xs text-slate-600">
            Accepts: place names, addresses, coordinates (lat,lon), or DMS format
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 max-h-[calc(92vh-200px)]">
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Querying {['Nominatim', 'Overpass', 'wttr.in', 'Wikipedia', 'restcountries'][Math.floor(Date.now() / 1000) % 5]}...</p>
            </div>
          )}

          {result && !isAnalyzing && (
            <div className="space-y-5">
              {/* Coordinates banner */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-emerald-400" />
                  <span className="text-white font-mono text-sm">
                    {result.coordinates?.lat?.toFixed(6)}, {result.coordinates?.lon?.toFixed(6)}
                  </span>
                </div>
                {result.address?.city && (
                  <span className="text-slate-300 text-sm">{result.address.city}, {result.address.country}</span>
                )}
                {result.elevation && (
                  <span className="text-slate-400 text-sm flex items-center gap-1">
                    <Mountain className="w-4 h-4" />{result.elevation.meters}m
                  </span>
                )}
                <div className="ml-auto flex gap-2">
                  {Object.entries(result.mapLinks || {}).slice(0, 3).map(([name, url]) => (
                    <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                      className="px-2 py-1 text-xs rounded-lg bg-white/10 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      {name === 'openStreetMap' ? 'OSM' : name === 'googleMaps' ? 'Google' : name === 'googleSatellite' ? 'Satellite' : name}
                    </a>
                  ))}
                </div>
              </div>

              {/* Intelligence summary */}
              {result.intelligenceSummary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {result.intelligenceSummary.observations?.length > 0 && (
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <p className="text-xs text-blue-400 font-semibold mb-2 flex items-center gap-1">
                        <Info className="w-3 h-3" /> Observations
                      </p>
                      <ul className="space-y-1">
                        {result.intelligenceSummary.observations.map((o, i) => (
                          <li key={i} className="text-xs text-slate-300">• {o}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.intelligenceSummary.riskFactors?.length > 0 && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <p className="text-xs text-red-400 font-semibold mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Risk Factors
                      </p>
                      <ul className="space-y-1">
                        {result.intelligenceSummary.riskFactors.map((r, i) => (
                          <li key={i} className="text-xs text-slate-300">• {r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.intelligenceSummary.strategicNotes?.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <p className="text-xs text-amber-400 font-semibold mb-2 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Strategic Notes
                      </p>
                      <ul className="space-y-1">
                        {result.intelligenceSummary.strategicNotes.map((s, i) => (
                          <li key={i} className="text-xs text-slate-300">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-1 flex-wrap">
                {tabs.map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-400 hover:bg-white/5'
                    }`}>
                    {tab === 'pois' ? `POIs (${result.poiCount || 0})` :
                     tab === 'wikipedia' ? `Wikipedia (${result.wikipediaNearby?.length || 0})` :
                     tab}
                  </button>
                ))}
              </div>

              {/* Tab: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {result.address && (
                    <Section title="Address" icon={MapPin} color="emerald">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {[
                          ['Road', result.address.road],
                          ['Suburb', result.address.suburb],
                          ['City', result.address.city],
                          ['State', result.address.state],
                          ['Country', result.address.country],
                          ['Postcode', result.address.postcode],
                        ].filter(([, v]) => v).map(([k, v]) => (
                          <div key={k} className="p-2 rounded-lg bg-white/5">
                            <p className="text-xs text-slate-500">{k}</p>
                            <p className="text-sm text-white">{v}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">{result.address.displayName}</p>
                    </Section>
                  )}
                  {result.timezone && (
                    <Section title="Timezone" icon={Clock} color="blue">
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="p-2 rounded-lg bg-white/5">
                          <p className="text-xs text-slate-500">Timezone</p>
                          <p className="text-sm text-white">{result.timezone.timeZone}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5">
                          <p className="text-xs text-slate-500">Local Time</p>
                          <p className="text-sm text-white">{result.timezone.currentLocalTime?.split('T')[1]?.split('.')[0]}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5">
                          <p className="text-xs text-slate-500">UTC Offset</p>
                          <p className="text-sm text-white">{result.timezone.currentUtcOffset > 0 ? '+' : ''}{result.timezone.currentUtcOffset / 3600}h</p>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5">
                          <p className="text-xs text-slate-500">DST Active</p>
                          <p className="text-sm text-white">{result.timezone.isDayLightSavingActive ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </Section>
                  )}
                  <div className="text-xs text-slate-600 flex items-center gap-2">
                    <Info className="w-3 h-3" />
                    Sources: {result.dataSources?.join(', ')}
                  </div>
                </div>
              )}

              {/* Tab: POIs */}
              {activeTab === 'pois' && (
                <div className="space-y-2">
                  {result.poiCategories && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {Object.entries(result.poiCategories).map(([type, names]) => (
                        <span key={type} className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                          {type} ({names.length})
                        </span>
                      ))}
                    </div>
                  )}
                  {result.pointsOfInterest?.length > 0 ? (
                    <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                      {result.pointsOfInterest.map((poi, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-emerald-500/20 transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <Building className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm text-white truncate">{poi.name}</p>
                              <p className="text-xs text-slate-500 capitalize">{poi.type?.replace(/_/g, ' ')}</p>
                            </div>
                          </div>
                          <span className="text-xs text-slate-400 shrink-0 ml-2">
                            {poi.distanceM < 1000 ? `${poi.distanceM}m` : `${poi.distanceKm}km`}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm text-center py-8">No POIs found within {radius}m radius</p>
                  )}
                </div>
              )}

              {/* Tab: Weather */}
              {activeTab === 'weather' && result.weather && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Temperature" value={`${result.weather.temperature?.c}°C`} sub={`${result.weather.temperature?.f}°F`} color="orange" />
                  <StatCard label="Feels Like" value={`${result.weather.feelsLike?.c}°C`} color="amber" />
                  <StatCard label="Humidity" value={`${result.weather.humidity}%`} color="blue" />
                  <StatCard label="UV Index" value={result.weather.uvIndex} color="yellow" />
                  <StatCard label="Wind" value={`${result.weather.windSpeed?.kmh} km/h`} sub={result.weather.windDirection} color="cyan" />
                  <StatCard label="Visibility" value={`${result.weather.visibility} km`} color="teal" />
                  <StatCard label="Cloud Cover" value={`${result.weather.cloudCover}%`} color="slate" />
                  <StatCard label="Pressure" value={`${result.weather.pressure} hPa`} color="purple" />
                  <div className="col-span-full p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-lg text-white">{result.weather.description}</p>
                    <p className="text-xs text-slate-500 mt-1">Near {result.weather.nearestArea}, {result.weather.country}</p>
                  </div>
                </div>
              )}

              {/* Tab: Country */}
              {activeTab === 'country' && result.countryIntelligence && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-4xl">{result.countryIntelligence.flagEmoji}</span>
                    <div>
                      <p className="text-xl font-bold text-white">{result.countryIntelligence.name}</p>
                      <p className="text-sm text-slate-400">{result.countryIntelligence.officialName}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      ['Capital', result.countryIntelligence.capital],
                      ['Population', result.countryIntelligence.population?.toLocaleString()],
                      ['Area', `${result.countryIntelligence.area?.toLocaleString()} km²`],
                      ['Region', result.countryIntelligence.region],
                      ['Subregion', result.countryIntelligence.subregion],
                      ['Languages', result.countryIntelligence.languages?.join(', ')],
                      ['Currencies', result.countryIntelligence.currencies?.join(', ')],
                      ['Driving Side', result.countryIntelligence.drivingSide],
                      ['UN Member', result.countryIntelligence.unMember ? 'Yes' : 'No'],
                      ['Landlocked', result.countryIntelligence.landlocked ? 'Yes' : 'No'],
                      ['TLD', result.countryIntelligence.tld?.join(', ')],
                      ['Borders', result.countryIntelligence.borders?.join(', ')],
                    ].filter(([, v]) => v).map(([k, v]) => (
                      <div key={k} className="p-2 rounded-lg bg-white/5">
                        <p className="text-xs text-slate-500">{k}</p>
                        <p className="text-sm text-white">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Wikipedia */}
              {activeTab === 'wikipedia' && (
                <div className="space-y-2">
                  {result.wikipediaNearby?.length > 0 ? (
                    result.wikipediaNearby.map((article, i) => (
                      <a key={i} href={article.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-colors group">
                        <div className="flex items-center gap-2 min-w-0">
                          <BookOpen className="w-4 h-4 text-blue-400 shrink-0" />
                          <p className="text-sm text-white group-hover:text-blue-300 transition-colors truncate">{article.title}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-xs text-slate-500">
                            {article.distanceM < 1000 ? `${article.distanceM}m` : `${(article.distanceM / 1000).toFixed(1)}km`}
                          </span>
                          <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-blue-400" />
                        </div>
                      </a>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm text-center py-8">No Wikipedia articles found nearby</p>
                  )}
                </div>
              )}
            </div>
          )}

          {!result && !isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <Globe className="w-12 h-12 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Geospatial Intelligence</p>
                <p className="text-slate-400 text-sm mt-1">Enter any location — address, coordinates, or landmark</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs text-slate-500 max-w-sm">
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">📍 POI mapping</div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">🌤 Live weather</div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">🏛 Country intel</div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">📖 Wikipedia</div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">🕐 Timezone</div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">⛰ Elevation</div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GeoAITool;
