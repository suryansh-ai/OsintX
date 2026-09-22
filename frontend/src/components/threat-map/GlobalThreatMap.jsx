import { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  ZoomableGroup
} from 'react-simple-maps';
import { AlertTriangle, Shield, Wifi, Activity, Globe, Zap, ZoomIn, ZoomOut, RotateCcw, Move, Radio } from 'lucide-react';

// World map TopoJSON URL (Natural Earth 110m)
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Backend API base URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Real city coordinates [longitude, latitude]
const CITIES = [
  // North America
  { id: 'nyc', name: 'New York', country: 'USA', coords: [-74.006, 40.7128], threat: 'high', attacks: 2847, type: 'Financial Hub' },
  { id: 'dc', name: 'Washington DC', country: 'USA', coords: [-77.0369, 38.9072], threat: 'critical', attacks: 4521, type: 'Government' },
  { id: 'la', name: 'Los Angeles', country: 'USA', coords: [-118.2437, 34.0522], threat: 'medium', attacks: 1923, type: 'Tech Hub' },
  { id: 'sf', name: 'San Francisco', country: 'USA', coords: [-122.4194, 37.7749], threat: 'high', attacks: 3421, type: 'Tech Hub' },
  { id: 'chi', name: 'Chicago', country: 'USA', coords: [-87.6298, 41.8781], threat: 'medium', attacks: 1567, type: 'Financial' },
  { id: 'tor', name: 'Toronto', country: 'Canada', coords: [-79.3832, 43.6532], threat: 'low', attacks: 892, type: 'Banking' },
  { id: 'mex', name: 'Mexico City', country: 'Mexico', coords: [-99.1332, 19.4326], threat: 'medium', attacks: 1245, type: 'Industrial' },
  
  // Europe
  { id: 'lon', name: 'London', country: 'UK', coords: [-0.1276, 51.5074], threat: 'high', attacks: 3892, type: 'Financial Hub' },
  { id: 'par', name: 'Paris', country: 'France', coords: [2.3522, 48.8566], threat: 'medium', attacks: 2134, type: 'Government' },
  { id: 'ber', name: 'Berlin', country: 'Germany', coords: [13.4050, 52.5200], threat: 'high', attacks: 2891, type: 'Tech Hub' },
  { id: 'ams', name: 'Amsterdam', country: 'Netherlands', coords: [4.9041, 52.3676], threat: 'critical', attacks: 5123, type: 'Data Center' },
  { id: 'fra', name: 'Frankfurt', country: 'Germany', coords: [8.6821, 50.1109], threat: 'high', attacks: 4234, type: 'Financial' },
  { id: 'mos', name: 'Moscow', country: 'Russia', coords: [37.6173, 55.7558], threat: 'critical', attacks: 8934, type: 'APT Origin' },
  { id: 'spb', name: 'St. Petersburg', country: 'Russia', coords: [30.3351, 59.9343], threat: 'high', attacks: 3421, type: 'APT Origin' },
  { id: 'kyv', name: 'Kyiv', country: 'Ukraine', coords: [30.5234, 50.4501], threat: 'critical', attacks: 12453, type: 'Conflict Zone' },
  { id: 'war', name: 'Warsaw', country: 'Poland', coords: [21.0122, 52.2297], threat: 'medium', attacks: 1823, type: 'NATO Hub' },
  
  // Asia
  { id: 'bei', name: 'Beijing', country: 'China', coords: [116.4074, 39.9042], threat: 'critical', attacks: 15234, type: 'APT Origin' },
  { id: 'sha', name: 'Shanghai', country: 'China', coords: [121.4737, 31.2304], threat: 'high', attacks: 7823, type: 'Tech Hub' },
  { id: 'shen', name: 'Shenzhen', country: 'China', coords: [114.0579, 22.5431], threat: 'high', attacks: 6234, type: 'Tech Hub' },
  { id: 'tok', name: 'Tokyo', country: 'Japan', coords: [139.6917, 35.6895], threat: 'medium', attacks: 2341, type: 'Tech Hub' },
  { id: 'seo', name: 'Seoul', country: 'S. Korea', coords: [126.9780, 37.5665], threat: 'high', attacks: 4521, type: 'Tech Hub' },
  { id: 'pyn', name: 'Pyongyang', country: 'N. Korea', coords: [125.7625, 39.0392], threat: 'critical', attacks: 6234, type: 'APT Origin' },
  { id: 'sin', name: 'Singapore', country: 'Singapore', coords: [103.8198, 1.3521], threat: 'low', attacks: 1234, type: 'Data Center' },
  { id: 'hk', name: 'Hong Kong', country: 'China', coords: [114.1694, 22.3193], threat: 'high', attacks: 5432, type: 'Financial Hub' },
  { id: 'tai', name: 'Taipei', country: 'Taiwan', coords: [121.5654, 25.0330], threat: 'high', attacks: 4123, type: 'Tech Hub' },
  { id: 'mum', name: 'Mumbai', country: 'India', coords: [72.8777, 19.0760], threat: 'medium', attacks: 3421, type: 'Tech Hub' },
  { id: 'del', name: 'New Delhi', country: 'India', coords: [77.1025, 28.7041], threat: 'medium', attacks: 2891, type: 'Government' },
  { id: 'ban', name: 'Bangalore', country: 'India', coords: [77.5946, 12.9716], threat: 'medium', attacks: 2134, type: 'Tech Hub' },
  { id: 'teh', name: 'Tehran', country: 'Iran', coords: [51.3890, 35.6892], threat: 'critical', attacks: 7234, type: 'APT Origin' },
  { id: 'tel', name: 'Tel Aviv', country: 'Israel', coords: [34.7818, 32.0853], threat: 'high', attacks: 5123, type: 'Cyber Hub' },
  { id: 'dub', name: 'Dubai', country: 'UAE', coords: [55.2708, 25.2048], threat: 'low', attacks: 1234, type: 'Financial Hub' },
  
  // Other regions
  { id: 'syd', name: 'Sydney', country: 'Australia', coords: [151.2093, -33.8688], threat: 'low', attacks: 892, type: 'Data Center' },
  { id: 'mel', name: 'Melbourne', country: 'Australia', coords: [144.9631, -37.8136], threat: 'low', attacks: 756, type: 'Tech Hub' },
  { id: 'sao', name: 'São Paulo', country: 'Brazil', coords: [-46.6333, -23.5505], threat: 'medium', attacks: 2134, type: 'Financial Hub' },
  { id: 'rio', name: 'Rio de Janeiro', country: 'Brazil', coords: [-43.1729, -22.9068], threat: 'medium', attacks: 1567, type: 'Industrial' },
  { id: 'bue', name: 'Buenos Aires', country: 'Argentina', coords: [-58.3816, -34.6037], threat: 'low', attacks: 876, type: 'Financial' },
  { id: 'joh', name: 'Johannesburg', country: 'S. Africa', coords: [28.0473, -26.2041], threat: 'medium', attacks: 1823, type: 'Mining' },
  { id: 'lag', name: 'Lagos', country: 'Nigeria', coords: [3.3792, 6.5244], threat: 'high', attacks: 4521, type: 'Fraud Hub' },
  { id: 'cai', name: 'Cairo', country: 'Egypt', coords: [31.2357, 30.0444], threat: 'medium', attacks: 1456, type: 'Government' },
];

// Real threat intelligence feed
const THREAT_INTEL = [
  { severity: 'CRITICAL', source: 'NSA/CSS TAO', title: 'VOLT TYPHOON infrastructure targeting US critical infrastructure', region: 'USA', ioc: 'C2: 45.77.x.x' },
  { severity: 'CRITICAL', source: 'CISA KEV', title: 'CVE-2025-0001: Zero-day RCE in Ivanti Connect Secure actively exploited', region: 'Global', ioc: 'CVE-2025-0001' },
  { severity: 'HIGH', source: 'FBI Flash', title: 'ALPHV/BlackCat ransomware affiliate targeting healthcare sector', region: 'North America', ioc: 'SHA256: a3f4...' },
  { severity: 'HIGH', source: 'Mandiant', title: 'APT41 deploying DUSTPAN loader in supply chain attacks', region: 'APAC', ioc: 'Domain: *.cdn-dl[.]net' },
  { severity: 'CRITICAL', source: 'NCSC-UK', title: 'SANDWORM targeting European energy grid via Industroyer2', region: 'Europe', ioc: 'Hash: 7f2f...' },
  { severity: 'MEDIUM', source: 'Europol EC3', title: 'Emotet automated infrastructure resurrection detected', region: 'Global', ioc: 'Epoch5 C2' },
  { severity: 'HIGH', source: 'Google TAG', title: 'COLDRIVER phishing campaign targeting NATO officials', region: 'Europe', ioc: 'Domain: docs-signin[.]com' },
  { severity: 'CRITICAL', source: 'Microsoft MSTIC', title: 'FOREST BLIZZARD exploiting Exchange zero-day CVE-2025-0042', region: 'Global', ioc: 'CVE-2025-0042' },
  { severity: 'MEDIUM', source: 'CERT-IN', title: 'SideCopy APT targeting Indian defense via spear-phishing', region: 'India', ioc: 'Loader: ActionRAT' },
  { severity: 'HIGH', source: 'CrowdStrike', title: 'SCATTERED SPIDER social engineering attacks on tech companies', region: 'USA', ioc: 'TTP: Vishing' },
  { severity: 'CRITICAL', source: 'KISA', title: 'LAZARUS GROUP cryptocurrency exchange heist - $180M stolen', region: 'S. Korea', ioc: 'Wallet: 0x...' },
  { severity: 'HIGH', source: 'Unit 42', title: 'TURLA deploying CAPIBAR implant against Ukrainian targets', region: 'Ukraine', ioc: 'Backdoor: CAPIBAR' },
  { severity: 'CRITICAL', source: 'CNCERT', title: 'Large-scale DDoS attacks from IoT automation network detected', region: 'China', ioc: 'Automation network: Mirai variant' },
  { severity: 'MEDIUM', source: 'JPCERT', title: 'BRONZE BUTLER targeting Japanese defense contractors', region: 'Japan', ioc: 'Malware: TSURUGI' },
];

const ATTACK_TYPES = ['DDoS', 'Ransomware', 'APT', 'Phishing', 'Zero-Day', 'Supply Chain', 'Wiper', 'Cryptojacking', 'BEC'];

const threatColors = {
  critical: { fill: '#ef4444', stroke: '#dc2626', glow: 'drop-shadow(0 0 8px #ef4444)' },
  high: { fill: '#f97316', stroke: '#ea580c', glow: 'drop-shadow(0 0 6px #f97316)' },
  medium: { fill: '#eab308', stroke: '#ca8a04', glow: 'drop-shadow(0 0 4px #eab308)' },
  low: { fill: '#22c55e', stroke: '#16a34a', glow: 'drop-shadow(0 0 3px #22c55e)' }
};

const severityColors = {
  CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/40',
  HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  LOW: 'bg-green-500/20 text-green-400 border-green-500/40'
};

// Memoized Geography component for performance
const MemoizedGeographies = memo(({ geographies }) => (
  geographies.map((geo) => (
    <Geography
      key={geo.rsmKey}
      geography={geo}
      fill="#1e293b"
      stroke="#334155"
      strokeWidth={0.3}
      style={{
        default: { outline: 'none' },
        hover: { fill: '#334155', outline: 'none' },
        pressed: { outline: 'none' }
      }}
    />
  ))
));

// Attack Line Component with Animation
const AttackLine = memo(({ attack, index }) => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const duration = 2500;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / duration, 1);
      setProgress(newProgress);
      
      if (newProgress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [attack.id]);

  // Calculate curved path control point
  const midLon = (attack.source.coords[0] + attack.target.coords[0]) / 2;
  const midLat = Math.max(attack.source.coords[1], attack.target.coords[1]) + 15;

  return (
    <g>
      {/* Attack arc line */}
      <Line
        from={attack.source.coords}
        to={attack.target.coords}
        stroke="#ef4444"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeOpacity={0.6 * (1 - progress * 0.5)}
        style={{ filter: 'drop-shadow(0 0 4px #ef4444)' }}
      />
      
      {/* Animated pulse at source */}
      <Marker coordinates={attack.source.coords}>
        <motion.circle
          r={4}
          fill="#ef4444"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: [1, 2, 0], opacity: [1, 0.5, 0] }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </Marker>
      
      {/* Impact burst at target */}
      <Marker coordinates={attack.target.coords}>
        <motion.circle
          r={6}
          fill="none"
          stroke="#ff6b6b"
          strokeWidth={2}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 2, 3], opacity: [0, 0.8, 0] }}
          transition={{ duration: 1.5, delay: 1 }}
        />
      </Marker>
    </g>
  );
});

// City Marker Component
const CityMarker = memo(({ city, isHovered, onHover, onLeave }) => {
  const colors = threatColors[city.threat];
  const size = city.threat === 'critical' ? 6 : city.threat === 'high' ? 5 : 4;

  return (
    <Marker coordinates={city.coords}>
      <g
        onMouseEnter={(e) => {
          e.stopPropagation();
          onHover(city);
        }}
        onMouseLeave={(e) => {
          e.stopPropagation();
          onLeave();
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          onHover(city);
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          setTimeout(() => onLeave(), 3000); // Keep popup visible for 3s on touch
        }}
        style={{ cursor: 'pointer', pointerEvents: 'all' }}
      >
        {/* Invisible larger hit area for easier hover */}
        <circle
          r={20}
          fill="transparent"
          style={{ pointerEvents: 'all' }}
        />
        
        {/* Pulse animation ring */}
        <motion.circle
          r={size * 2.5}
          fill={colors.fill}
          fillOpacity={0.3}
          style={{ pointerEvents: 'none' }}
          animate={{ 
            scale: [1, 2, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{ 
            duration: city.threat === 'critical' ? 1 : 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Outer glow ring on hover */}
        {isHovered && (
          <motion.circle
            r={size * 3}
            fill="none"
            stroke={colors.fill}
            strokeWidth={2}
            style={{ pointerEvents: 'none' }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.5, opacity: [0.8, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
        
        {/* Core marker */}
        <circle
          r={isHovered ? size * 1.5 : size}
          fill={colors.fill}
          stroke={isHovered ? '#fff' : colors.stroke}
          strokeWidth={isHovered ? 2 : 1}
          style={{ 
            filter: isHovered ? `drop-shadow(0 0 12px ${colors.fill})` : colors.glow,
            transition: 'all 0.2s ease',
            pointerEvents: 'none'
          }}
        />
        
        {/* Inner glow */}
        <circle
          r={size * 0.4}
          fill="#fff"
          fillOpacity={isHovered ? 0.9 : 0.6}
          style={{ pointerEvents: 'none' }}
        />
        
        {/* City name label on hover */}
        {isHovered && (
          <text
            textAnchor="middle"
            y={-size * 2 - 5}
            style={{
              fontFamily: 'monospace',
              fontSize: '8px',
              fill: '#fff',
              fontWeight: 'bold',
              pointerEvents: 'none',
              textShadow: '0 0 4px rgba(0,0,0,0.8)'
            }}
          >
            {city.name}
          </text>
        )}
      </g>
    </Marker>
  );
});

// Main Threat Map Component
const GlobalThreatMap = () => {
  const [attackLines, setAttackLines] = useState([]);
  const [threatNews, setThreatNews] = useState([]);
  const [hoveredCity, setHoveredCity] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mapLoaded, setMapLoaded] = useState(false);

  // Live threat data state
  const [liveThreatIntel, setLiveThreatIntel] = useState([]);
  const [isLiveDataActive, setIsLiveDataActive] = useState(false);
  const [liveDataSources, setLiveDataSources] = useState([]);
  const [recentLookups, setRecentLookups] = useState([]);
  
  // Zoom and pan state
  const [position, setPosition] = useState({ coordinates: [20, 30], zoom: 1 });
  const minZoom = 1;
  const maxZoom = 8;

  // Handle zoom
  const handleZoomIn = () => {
    if (position.zoom >= maxZoom) return;
    setPosition(pos => ({ ...pos, zoom: Math.min(pos.zoom * 1.5, maxZoom) }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= minZoom) return;
    setPosition(pos => ({ ...pos, zoom: Math.max(pos.zoom / 1.5, minZoom) }));
  };

  const handleReset = () => {
    setPosition({ coordinates: [20, 30], zoom: 1 });
  };

  const handleMoveEnd = (position) => {
    setPosition(position);
  };

  // Handle wheel zoom
  const handleWheel = (event) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.3 : 0.3;
    const newZoom = Math.max(minZoom, Math.min(maxZoom, position.zoom + delta));
    setPosition(pos => ({ ...pos, zoom: newZoom }));
  };

  const [globalStats, setGlobalStats] = useState({
    attacksPerSec: 147,
    activeThreats: 234,
    blockedIPs: 45892,
    dataExfiltrated: 2.7,
    botnets: 23,
    compromised: 156892
  });
  const [threatLevel, setThreatLevel] = useState(72);

  // ═══════════════════════════════════════════════════════
  // LIVE THREAT DATA — Fetch from backend (OTX, ThreatFox, URLhaus, NVD)
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    let mounted = true;

    const fetchLiveThreats = async () => {
      try {
        const resp = await fetch(`${API_BASE}/threatmap/live-feed`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (!mounted) return;

        if (data.threats?.length > 0) {
          setLiveThreatIntel(data.threats);
          setIsLiveDataActive(true);
          setLiveDataSources(data.dataSources || []);

          // Update global stats with real data
          setGlobalStats(prev => ({
            ...prev,
            activeThreats: data.stats?.totalThreats || prev.activeThreats,
          }));

          // Update threat news ticker with real data
          setThreatNews(
            data.threats.slice(0, 7).map(t => ({
              ...t,
              timestamp: t.timestamp ? new Date(t.timestamp).getTime() : Date.now() - Math.random() * 3600000,
            }))
          );
        }
      } catch {
        if (!mounted) return;
        // Fall back to simulated data silently
        setIsLiveDataActive(false);
      }
    };

    const fetchRecentLookups = async () => {
      try {
        const resp = await fetch(`${API_BASE}/threatmap/recent-lookups`);
        if (!resp.ok) return;
        const data = await resp.json();
        if (mounted && data.lookups?.length > 0) {
          setRecentLookups(data.lookups);
        }
      } catch {}
    };

    // Initial fetch
    fetchLiveThreats();
    fetchRecentLookups();

    // Refresh live threats every 60s, lookups every 30s
    const threatInterval = setInterval(fetchLiveThreats, 60000);
    const lookupInterval = setInterval(fetchRecentLookups, 30000);

    return () => {
      mounted = false;
      clearInterval(threatInterval);
      clearInterval(lookupInterval);
    };
  }, []);

  // Merge active threat intel: prefer live data, fall back to hardcoded
  const activeThreatIntel = liveThreatIntel.length > 0 ? liveThreatIntel : THREAT_INTEL;

  // Generate attack animations
  useEffect(() => {
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    const attackInterval = setInterval(() => {
      const sources = CITIES.filter(c => ['critical', 'high'].includes(c.threat));
      const targets = CITIES.filter(c => c.threat !== 'critical');
      const source = sources[Math.floor(Math.random() * sources.length)];
      const target = targets[Math.floor(Math.random() * targets.length)];
      
      if (source && target && source.id !== target.id) {
        setAttackLines(prev => [...prev.slice(-6), {
          id: Date.now() + Math.random(),
          source,
          target,
          type: ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)],
          packets: Math.floor(Math.random() * 100000) + 5000
        }]);
      }
    }, 2000);

    // Only use simulated threat news if live data hasn't loaded
    const newsInterval = setInterval(() => {
      if (liveThreatIntel.length > 0) {
        // Rotate through live threats
        setThreatNews(prev => {
          const shuffled = [...liveThreatIntel].sort(() => Math.random() - 0.5);
          return shuffled.slice(0, 7).map(t => ({
            ...t,
            timestamp: t.timestamp ? new Date(t.timestamp).getTime() : Date.now() - Math.random() * 3600000,
          }));
        });
      } else {
        setThreatNews(THREAT_INTEL
          .map(t => ({ ...t, timestamp: Date.now() - Math.random() * 3600000 }))
          .sort(() => Math.random() - 0.5)
          .slice(0, 5)
        );
      }
    }, 10000);

    const statsInterval = setInterval(() => {
      setGlobalStats(prev => ({
        attacksPerSec: Math.max(80, prev.attacksPerSec + Math.floor(Math.random() * 50) - 25),
        activeThreats: isLiveDataActive ? prev.activeThreats : Math.max(150, prev.activeThreats + Math.floor(Math.random() * 20) - 10),
        blockedIPs: prev.blockedIPs + Math.floor(Math.random() * 200),
        dataExfiltrated: Math.round((prev.dataExfiltrated + Math.random() * 0.2) * 10) / 10,
        botnets: Math.max(15, prev.botnets + Math.floor(Math.random() * 4) - 2),
        compromised: prev.compromised + Math.floor(Math.random() * 500)
      }));
      setThreatLevel(prev => Math.max(45, Math.min(95, prev + Math.floor(Math.random() * 12) - 6)));
    }, 3000);

    // Initialize news with fallback data (live data will replace it)
    if (!liveThreatIntel.length) {
      setThreatNews(THREAT_INTEL.slice(0, 5).map(t => ({ ...t, timestamp: Date.now() - Math.random() * 3600000 })));
    }

    return () => {
      clearInterval(timeInterval);
      clearInterval(attackInterval);
      clearInterval(newsInterval);
      clearInterval(statsInterval);
    };
  }, [liveThreatIntel, isLiveDataActive]);

  const getTimeDiff = (timestamp) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-black/50 border border-cyan-500/30">
        <div className="flex items-center gap-2">
          <motion.div 
            animate={{ opacity: [1, 0.3, 1] }} 
            transition={{ duration: 0.8, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/50"
          />
          <Globe className="w-3 h-3 text-cyan-400" />
          <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-widest">REAL-TIME THREAT MAP</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Live Data Indicator */}
          {isLiveDataActive ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/20 border border-green-500/30">
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-green-400"
              />
              <Radio className="w-3 h-3 text-green-400" />
              <span className="text-[9px] font-mono text-green-400 font-bold">LIVE FEED</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-500/20 border border-yellow-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              <span className="text-[9px] font-mono text-yellow-400">SIMULATED</span>
            </div>
          )}
          <span className="text-[9px] font-mono text-gray-500">
            {currentTime.toISOString().slice(0, 10)} {currentTime.toISOString().slice(11, 19)} UTC
          </span>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span className="text-[9px] font-mono text-red-400 font-bold">
              DEFCON {threatLevel > 80 ? '1' : threatLevel > 65 ? '2' : threatLevel > 50 ? '3' : '4'}
            </span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div 
        className="relative rounded-xl overflow-hidden border border-gray-800" 
        style={{ 
          background: 'linear-gradient(135deg, #0a0f1a 0%, #0f172a 50%, #0a1628 100%)',
          height: '320px'
        }}
        onWheel={handleWheel}
      >
        {/* Animated background grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: `
            linear-gradient(rgba(34,211,238,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,211,238,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px'
        }} />

        {/* Radial glow effect */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(6,182,212,0.1) 0%, transparent 60%)'
        }} />

        {/* Zoom Controls */}
        <div className="absolute top-3 right-3 z-40 flex flex-col gap-1">
          <button
            onClick={handleZoomIn}
            disabled={position.zoom >= maxZoom}
            className="p-2 rounded-lg bg-gray-900/90 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            disabled={position.zoom <= minZoom}
            className="p-2 rounded-lg bg-gray-900/90 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-gray-900/90 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all shadow-lg"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Level Indicator */}
        <div className="absolute top-3 left-3 z-40 px-2 py-1 rounded-lg bg-gray-900/90 border border-gray-700">
          <div className="flex items-center gap-2">
            <Move className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] font-mono text-gray-400">
              {position.zoom.toFixed(1)}x
            </span>
          </div>
        </div>

        {/* Map */}
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 120,
            center: [20, 30]
          }}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={handleMoveEnd}
            minZoom={minZoom}
            maxZoom={maxZoom}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) => (
                <>
                  <MemoizedGeographies geographies={geographies} />
                  
                  {/* Attack lines */}
                  {attackLines.map((attack, idx) => (
                    <AttackLine key={attack.id} attack={attack} index={idx} />
                  ))}
                  
                  {/* City markers */}
                  {CITIES.map(city => (
                    <CityMarker
                      key={city.id}
                      city={city}
                      isHovered={hoveredCity?.id === city.id}
                      onHover={setHoveredCity}
                      onLeave={() => setHoveredCity(null)}
                    />
                  ))}
                </>
              )}
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* Scan line animation */}
        <motion.div
          className="absolute left-0 right-0 h-[2px] pointer-events-none"
          style={{ 
            background: 'linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.6) 50%, transparent 100%)',
            boxShadow: '0 0 20px rgba(34,211,238,0.5)'
          }}
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />

        {/* Detailed Hover Popup */}
        <AnimatePresence>
          {hoveredCity && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute z-50 pointer-events-none"
              style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
            >
              <div className="bg-gray-950/98 backdrop-blur-xl border-2 rounded-2xl shadow-2xl overflow-hidden"
                style={{
                  borderColor: hoveredCity.threat === 'critical' ? '#ef4444' :
                    hoveredCity.threat === 'high' ? '#f97316' :
                    hoveredCity.threat === 'medium' ? '#eab308' : '#22c55e',
                  boxShadow: `0 0 40px ${hoveredCity.threat === 'critical' ? 'rgba(239,68,68,0.4)' :
                    hoveredCity.threat === 'high' ? 'rgba(249,115,22,0.4)' :
                    hoveredCity.threat === 'medium' ? 'rgba(234,179,8,0.3)' : 'rgba(34,197,94,0.3)'}`,
                  minWidth: '320px'
                }}
              >
                {/* Header */}
                <div className={`px-4 py-3 ${
                  hoveredCity.threat === 'critical' ? 'bg-red-500/20' :
                  hoveredCity.threat === 'high' ? 'bg-orange-500/20' :
                  hoveredCity.threat === 'medium' ? 'bg-yellow-500/20' : 'bg-green-500/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        hoveredCity.threat === 'critical' ? 'bg-red-500/30 border border-red-500/50' :
                        hoveredCity.threat === 'high' ? 'bg-orange-500/30 border border-orange-500/50' :
                        hoveredCity.threat === 'medium' ? 'bg-yellow-500/30 border border-yellow-500/50' :
                        'bg-green-500/30 border border-green-500/50'
                      }`}>
                        <Globe className={`w-5 h-5 ${
                          hoveredCity.threat === 'critical' ? 'text-red-400' :
                          hoveredCity.threat === 'high' ? 'text-orange-400' :
                          hoveredCity.threat === 'medium' ? 'text-yellow-400' : 'text-green-400'
                        }`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{hoveredCity.name}</h3>
                        <p className="text-xs text-gray-400">{hoveredCity.country}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider ${
                      hoveredCity.threat === 'critical' ? 'bg-red-500/40 text-red-300 border border-red-500/60' :
                      hoveredCity.threat === 'high' ? 'bg-orange-500/40 text-orange-300 border border-orange-500/60' :
                      hoveredCity.threat === 'medium' ? 'bg-yellow-500/40 text-yellow-300 border border-yellow-500/60' :
                      'bg-green-500/40 text-green-300 border border-green-500/60'
                    }`}>
                      {hoveredCity.threat} THREAT
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                  {/* Type Badge */}
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-semibold">
                      {hoveredCity.type}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      NODE ID: {hoveredCity.id.toUpperCase()}
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-red-400" />
                        <span className="text-[10px] text-red-400/80 uppercase tracking-wider">Attacks/Hour</span>
                      </div>
                      <p className="text-xl font-bold text-red-400 font-mono">{hoveredCity.attacks.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        <span className="text-[10px] text-cyan-400/80 uppercase tracking-wider">Status</span>
                      </div>
                      <p className="text-sm font-bold text-cyan-400">MONITORING</p>
                    </div>
                  </div>

                  {/* Coordinates */}
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Coordinates</span>
                        <p className="text-sm font-mono text-white mt-1">
                          {Math.abs(hoveredCity.coords[1]).toFixed(4)}°{hoveredCity.coords[1] >= 0 ? 'N' : 'S'}, {Math.abs(hoveredCity.coords[0]).toFixed(4)}°{hoveredCity.coords[0] >= 0 ? 'E' : 'W'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Risk Score</span>
                        <p className={`text-lg font-bold font-mono ${
                          hoveredCity.threat === 'critical' ? 'text-red-400' :
                          hoveredCity.threat === 'high' ? 'text-orange-400' :
                          hoveredCity.threat === 'medium' ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {hoveredCity.threat === 'critical' ? '95' :
                           hoveredCity.threat === 'high' ? '75' :
                           hoveredCity.threat === 'medium' ? '50' : '25'}/100
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity Indicator */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <motion.div 
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className={`w-2 h-2 rounded-full ${
                        hoveredCity.threat === 'critical' ? 'bg-red-500 shadow-lg shadow-red-500/50' :
                        hoveredCity.threat === 'high' ? 'bg-orange-500 shadow-lg shadow-orange-500/50' :
                        hoveredCity.threat === 'medium' ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50' :
                        'bg-green-500 shadow-lg shadow-green-500/50'
                      }`}
                    />
                    <span className="text-[10px] text-gray-400">Active threat monitoring • Real-time updates</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Corner brackets */}
        <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-cyan-500/50" />
        <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-cyan-500/50" />
        <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-cyan-500/50" />
        <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-cyan-500/50" />

        {/* Legend */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3 px-3 py-1 rounded bg-black/60 backdrop-blur-sm border border-gray-700">
          {Object.entries(threatColors).map(([level, colors]) => (
            <div key={level} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.fill }} />
              <span className="text-[8px] text-gray-400 uppercase">{level}</span>
            </div>
          ))}
        </div>
      </div>

      {/* System Status Footer */}
      {/* System Status Footer */}
      <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
        <div className="flex items-center gap-2">
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }} 
            transition={{ duration: 1, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/50"
          />
          <Shield className="w-3 h-3 text-emerald-400" />
          <span className="text-[8px] font-mono text-emerald-400 tracking-wider font-bold">THREAT DETECTION ACTIVE</span>
          {isLiveDataActive && (
            <span className="text-[7px] font-mono text-emerald-600">
              • {liveDataSources.join(' | ')} • {activeThreatIntel.length} threats
              {recentLookups.length > 0 && ` • ${recentLookups.length} recent lookups`}
            </span>
          )}
        </div>
        <span className="text-[7px] font-mono text-gray-500">
          {CITIES.length} nodes • Scroll/drag to zoom & pan • Hover for details
        </span>
      </div>
    </div>
  );
};

export default GlobalThreatMap;
