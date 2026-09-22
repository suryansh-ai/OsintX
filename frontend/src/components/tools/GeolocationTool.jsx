import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  MapPin, X, Search, Zap, Globe, Navigation, Compass, Map,
  Target, Building, Wifi, Clock, Cloud, Thermometer, Wind,
  Sun, Moon, Eye, Copy, ExternalLink, Crosshair, RefreshCw,
  Satellite, Radio, Signal, Activity, Layers, ChevronRight,
  ArrowUp, LocateFixed, Mountain, Waves, Navigation2
} from 'lucide-react';
import { Download } from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';

// ═══════════════════════════════════════════════════════════════════════════════
// 3D GLOBE VISUALIZATION - Interactive rotating earth with location marker
// ═══════════════════════════════════════════════════════════════════════════════
const GlobeVisualization = ({ latitude, longitude, isLocating }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let rotation = 0;
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 20;
      
      // Draw globe background glow
      const glowGradient = ctx.createRadialGradient(centerX, centerY, radius * 0.8, centerX, centerY, radius * 1.3);
      glowGradient.addColorStop(0, 'rgba(34, 197, 94, 0.1)');
      glowGradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw globe sphere
      const sphereGradient = ctx.createRadialGradient(
        centerX - radius * 0.3, centerY - radius * 0.3, 0,
        centerX, centerY, radius
      );
      sphereGradient.addColorStop(0, 'rgba(34, 197, 94, 0.15)');
      sphereGradient.addColorStop(0.7, 'rgba(20, 83, 45, 0.1)');
      sphereGradient.addColorStop(1, 'rgba(15, 23, 42, 0.8)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = sphereGradient;
      ctx.fill();
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw latitude lines
      for (let i = -2; i <= 2; i++) {
        const latRadius = radius * Math.cos(i * 0.4);
        const yOffset = radius * Math.sin(i * 0.4) * 0.3;
        
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + yOffset, latRadius, latRadius * 0.3, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      // Draw longitude lines
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI + rotation;
        const x1 = centerX + Math.sin(angle) * radius;
        const controlX = centerX + Math.sin(angle) * radius * 0.5;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - radius);
        ctx.quadraticCurveTo(x1, centerY, centerX, centerY + radius);
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      // Draw location marker if we have coordinates
      if (latitude && longitude) {
        // Convert lat/long to x/y position on globe
        const latRad = (latitude * Math.PI) / 180;
        const lonRad = ((longitude + rotation * 57.3) * Math.PI) / 180;
        
        const markerX = centerX + radius * 0.8 * Math.cos(latRad) * Math.sin(lonRad);
        const markerY = centerY - radius * 0.8 * Math.sin(latRad) * 0.4;
        
        // Only show if on the "visible" side of globe
        if (Math.cos(lonRad) > -0.3) {
          // Pulsing ring
          const pulseSize = 8 + Math.sin(Date.now() * 0.005) * 4;
          ctx.beginPath();
          ctx.arc(markerX, markerY, pulseSize, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
          ctx.fill();
          
          // Core marker
          ctx.beginPath();
          ctx.arc(markerX, markerY, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#22c55e';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
      
      // Draw scanning effect when locating
      if (isLocating) {
        const scanAngle = (Date.now() * 0.003) % (Math.PI * 2);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, scanAngle, scanAngle + 0.5);
        ctx.closePath();
        const scanGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        scanGradient.addColorStop(0, 'rgba(34, 197, 94, 0.4)');
        scanGradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
        ctx.fillStyle = scanGradient;
        ctx.fill();
      }
      
      rotation += 0.005;
      animationId = requestAnimationFrame(draw);
    };
    
    canvas.width = 220;
    canvas.height = 220;
    draw();
    
    return () => cancelAnimationFrame(animationId);
  }, [latitude, longitude, isLocating]);
  
  return (
    <div className="relative">
      <canvas ref={canvasRef} className="w-[220px] h-[220px]" />
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-green-400/60 font-medium uppercase tracking-wider">
        Global Position
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SATELLITE CONSTELLATION - Orbiting satellites around target
// ═══════════════════════════════════════════════════════════════════════════════
const SatelliteConstellation = ({ isActive, signalStrength = 85 }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let time = 0;
    
    const satellites = [
      { orbit: 0.9, speed: 0.8, phase: 0 },
      { orbit: 0.75, speed: 1.2, phase: Math.PI / 3 },
      { orbit: 0.6, speed: 1.5, phase: Math.PI * 2 / 3 },
      { orbit: 0.85, speed: 0.6, phase: Math.PI },
      { orbit: 0.7, speed: 1.0, phase: Math.PI * 4 / 3 }
    ];
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.min(centerX, centerY) - 15;
      
      // Draw orbit rings
      satellites.forEach((sat, i) => {
        const orbitRadius = maxRadius * sat.orbit;
        ctx.beginPath();
        ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(34, 197, 94, ${0.1 + i * 0.03})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
      
      // Draw center (Earth)
      const earthGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 15);
      earthGradient.addColorStop(0, '#22c55e');
      earthGradient.addColorStop(1, '#14532d');
      ctx.beginPath();
      ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
      ctx.fillStyle = earthGradient;
      ctx.fill();
      
      // Draw satellites and their signals
      satellites.forEach((sat, i) => {
        const angle = time * sat.speed + sat.phase;
        const orbitRadius = maxRadius * sat.orbit;
        const x = centerX + Math.cos(angle) * orbitRadius;
        const y = centerY + Math.sin(angle) * orbitRadius * 0.4; // Elliptical orbit
        
        // Draw signal line to center if active
        if (isActive) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(centerX, centerY);
          ctx.strokeStyle = `rgba(34, 197, 94, ${0.3 + Math.sin(time * 3 + i) * 0.2})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        
        // Draw satellite
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? '#22c55e' : '#64748b';
        ctx.fill();
        
        // Satellite glow when active
        if (isActive) {
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
          ctx.fill();
        }
      });
      
      // Signal strength indicator at center
      if (isActive) {
        const pulseRadius = 20 + Math.sin(time * 4) * 5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(34, 197, 94, ${0.3 - pulseRadius / 100})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      time += 0.02;
      animationId = requestAnimationFrame(draw);
    };
    
    canvas.width = 180;
    canvas.height = 180;
    draw();
    
    return () => cancelAnimationFrame(animationId);
  }, [isActive, signalStrength]);
  
  return (
    <div className="relative">
      <canvas ref={canvasRef} className="w-[180px] h-[180px]" />
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <Satellite className="w-3 h-3 text-green-400" />
        <span className="text-[10px] text-green-400">5 SATS</span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TRIANGULATION VISUALIZER - Shows location triangulation from multiple sources
// ═══════════════════════════════════════════════════════════════════════════════
const TriangulationVisualizer = ({ isActive, accuracy }) => {
  const [phase, setPhase] = useState(0);
  
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setPhase(p => (p + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, [isActive]);
  
  const towers = [
    { x: 50, y: 15, label: 'GPS' },
    { x: 10, y: 85, label: 'Cell' },
    { x: 90, y: 85, label: 'WiFi' }
  ];
  
  return (
    <div className="relative w-full h-32">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Triangulation lines */}
        <motion.polygon
          points={towers.map(t => `${t.x},${t.y}`).join(' ')}
          fill="none"
          stroke="rgba(34, 197, 94, 0.3)"
          strokeWidth="0.5"
          strokeDasharray="2 2"
        />
        
        {/* Signal waves from each tower */}
        {towers.map((tower, i) => (
          <g key={i}>
            {/* Tower icon */}
            <circle cx={tower.x} cy={tower.y} r="3" fill="#22c55e" />
            <text x={tower.x} y={tower.y + 10} fill="#22c55e" fontSize="6" textAnchor="middle">
              {tower.label}
            </text>
            
            {/* Expanding signal rings */}
            {isActive && [0, 1, 2].map(ring => (
              <motion.circle
                key={ring}
                cx={tower.x}
                cy={tower.y}
                r={5}
                fill="none"
                stroke="#22c55e"
                strokeWidth="0.5"
                initial={{ r: 5, opacity: 0.8 }}
                animate={{ 
                  r: [5, 40], 
                  opacity: [0.6, 0] 
                }}
                transition={{
                  duration: 2,
                  delay: ring * 0.6 + i * 0.2,
                  repeat: Infinity
                }}
              />
            ))}
            
            {/* Line to center target */}
            {isActive && (
              <motion.line
                x1={tower.x}
                y1={tower.y}
                x2={50}
                y2={55}
                stroke="#22c55e"
                strokeWidth="0.5"
                strokeDasharray="3 2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: i * 0.3 }}
              />
            )}
          </g>
        ))}
        
        {/* Target center point */}
        <motion.circle
          cx={50}
          cy={55}
          r={isActive ? 4 : 2}
          fill="#22c55e"
          animate={isActive ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        />
        
        {/* Accuracy circle */}
        {isActive && (
          <circle
            cx={50}
            cy={55}
            r={15}
            fill="rgba(34, 197, 94, 0.1)"
            stroke="rgba(34, 197, 94, 0.5)"
            strokeWidth="0.5"
            strokeDasharray="2 2"
          />
        )}
      </svg>
      
      {isActive && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] text-green-400">
          Accuracy: ±{accuracy || '5km'}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// NETWORK HOP TRACER - Visualizes network path to target
// ═══════════════════════════════════════════════════════════════════════════════
const NetworkHopTracer = ({ hops, isTracing }) => {
  const defaultHops = [
    { ip: 'Your Device', latency: 0, location: 'Local' },
    { ip: '192.168.1.1', latency: 2, location: 'Router' },
    { ip: 'ISP Gateway', latency: 15, location: 'Regional' },
    { ip: 'Internet Exchange', latency: 28, location: 'IXP' },
    { ip: 'Target Server', latency: 45, location: 'Destination' }
  ];
  
  const hopData = hops || defaultHops;
  
  return (
    <div className="space-y-2">
      {hopData.map((hop, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: isTracing ? index * 0.3 : index * 0.1 }}
          className="flex items-center gap-3"
        >
          {/* Hop number */}
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-xs text-green-400 font-bold">
            {index + 1}
          </div>
          
          {/* Connection line */}
          {index < hopData.length - 1 && (
            <div className="absolute left-3 top-6 w-0.5 h-6 bg-green-500/30" />
          )}
          
          {/* Hop info */}
          <div className="flex-1 px-3 py-2 rounded-lg bg-slate-800/50 border border-green-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {index === 0 ? <LocateFixed className="w-3 h-3 text-green-400" /> :
               index === hopData.length - 1 ? <Target className="w-3 h-3 text-green-400" /> :
               <Radio className="w-3 h-3 text-green-400/60" />}
              <span className="text-xs text-white font-mono">{hop.ip}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-400">{hop.location}</span>
              <span className={`text-xs font-medium ${hop.latency < 20 ? 'text-emerald-400' : hop.latency < 50 ? 'text-amber-400' : 'text-red-400'}`}>
                {hop.latency}ms
              </span>
            </div>
          </div>
          
          {/* Signal animation */}
          {isTracing && index < hopData.length - 1 && (
            <motion.div
              className="w-2 h-2 bg-green-400 rounded-full absolute"
              animate={{ x: [0, 200] }}
              transition={{ duration: 1, delay: index * 0.3, repeat: Infinity }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COORDINATE DISPLAY - Stylized lat/long display
// ═══════════════════════════════════════════════════════════════════════════════
const CoordinateDisplay = ({ latitude, longitude, onCopy }) => {
  const formatCoord = (value, isLat) => {
    const abs = Math.abs(value);
    const deg = Math.floor(abs);
    const min = Math.floor((abs - deg) * 60);
    const sec = ((abs - deg - min / 60) * 3600).toFixed(2);
    const dir = isLat ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'W');
    return { deg, min, sec, dir };
  };
  
  const lat = formatCoord(latitude, true);
  const lon = formatCoord(longitude, false);
  
  return (
    <div className="p-4 rounded-xl bg-slate-900/80 border border-green-500/30">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-green-400/70 uppercase tracking-wider flex items-center gap-1">
          <Crosshair className="w-3 h-3" />
          Coordinates
        </span>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onCopy(`${latitude}, ${longitude}`)}
          className="p-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 transition-colors"
        >
          <Copy className="w-3 h-3 text-green-400" />
        </motion.button>
      </div>
      
      <div className="space-y-2">
        {/* Latitude */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 w-8">LAT</span>
          <div className="flex-1 font-mono text-lg">
            <span className="text-white">{lat.deg}°</span>
            <span className="text-green-300">{lat.min}'</span>
            <span className="text-green-400">{lat.sec}"</span>
            <span className="text-emerald-400 ml-1 font-bold">{lat.dir}</span>
          </div>
        </div>
        
        {/* Longitude */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 w-8">LON</span>
          <div className="flex-1 font-mono text-lg">
            <span className="text-white">{lon.deg}°</span>
            <span className="text-green-300">{lon.min}'</span>
            <span className="text-green-400">{lon.sec}"</span>
            <span className="text-emerald-400 ml-1 font-bold">{lon.dir}</span>
          </div>
        </div>
        
        {/* Decimal format */}
        <div className="pt-2 border-t border-green-500/20">
          <div className="text-xs font-mono text-slate-400">
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TIME ZONE WHEEL - Visual timezone offset display
// ═══════════════════════════════════════════════════════════════════════════════
const TimeZoneWheel = ({ timezone, localTime }) => {
  const canvasRef = useRef(null);
  const offset = timezone?.offset || 0;
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 50;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw outer ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
    ctx.lineWidth = 8;
    ctx.stroke();
    
    // Draw UTC highlight arc
    const utcAngle = -Math.PI / 2; // 12 o'clock position
    const offsetAngle = utcAngle + (offset / 12) * Math.PI;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, utcAngle, offsetAngle, offset < 0);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 8;
    ctx.stroke();
    
    // Draw hour markers
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
      const innerR = i % 6 === 0 ? radius - 15 : radius - 10;
      const outerR = radius - 5;
      
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(angle) * innerR, centerY + Math.sin(angle) * innerR);
      ctx.lineTo(centerX + Math.cos(angle) * outerR, centerY + Math.sin(angle) * outerR);
      ctx.strokeStyle = i % 6 === 0 ? '#22c55e' : 'rgba(34, 197, 94, 0.3)';
      ctx.lineWidth = i % 6 === 0 ? 2 : 1;
      ctx.stroke();
    }
    
  }, [offset]);
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <canvas ref={canvasRef} width={120} height={120} className="w-[120px] h-[120px]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-white">{localTime}</div>
          <div className="text-[10px] text-green-400">{timezone?.abbr || 'UTC'}</div>
        </div>
      </div>
      <div className="mt-2 text-xs text-slate-400">
        UTC{offset >= 0 ? '+' : ''}{offset}:00
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// WEATHER WIDGET - Animated weather display
// ═══════════════════════════════════════════════════════════════════════════════
const WeatherWidget = ({ weather }) => {
  const getWeatherIcon = (condition) => {
    const lower = condition?.toLowerCase() || '';
    if (lower.includes('sun') || lower.includes('clear')) return Sun;
    if (lower.includes('cloud')) return Cloud;
    if (lower.includes('rain')) return Waves;
    if (lower.includes('wind')) return Wind;
    return Cloud;
  };
  
  const WeatherIcon = getWeatherIcon(weather?.condition);
  
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <WeatherIcon className="w-10 h-10 text-blue-400" />
          </motion.div>
          <div>
            <div className="text-3xl font-bold text-white">{weather?.temp}°C</div>
            <div className="text-xs text-blue-300">{weather?.condition}</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded-lg bg-slate-800/50 flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-blue-400" />
          <div>
            <div className="text-[10px] text-slate-500">Humidity</div>
            <div className="text-sm text-white">{weather?.humidity}%</div>
          </div>
        </div>
        <div className="p-2 rounded-lg bg-slate-800/50 flex items-center gap-2">
          <Wind className="w-4 h-4 text-blue-400" />
          <div>
            <div className="text-[10px] text-slate-500">Wind</div>
            <div className="text-sm text-white">{weather?.wind}</div>
          </div>
        </div>
        <div className="p-2 rounded-lg bg-slate-800/50 flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-400" />
          <div>
            <div className="text-[10px] text-slate-500">Sunrise</div>
            <div className="text-sm text-white">{weather?.sunrise}</div>
          </div>
        </div>
        <div className="p-2 rounded-lg bg-slate-800/50 flex items-center gap-2">
          <Moon className="w-4 h-4 text-indigo-400" />
          <div>
            <div className="text-[10px] text-slate-500">Sunset</div>
            <div className="text-sm text-white">{weather?.sunset}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// NETWORK SECURITY INDICATORS
// ═══════════════════════════════════════════════════════════════════════════════
const SecurityIndicators = ({ network }) => {
  const indicators = [
    { label: 'VPN', detected: network?.vpn, icon: '🛡️' },
    { label: 'Proxy', detected: network?.proxy, icon: '🔄' },
    { label: 'Tor', detected: network?.tor, icon: '🧅' },
    { label: 'Hosting', detected: network?.hosting, icon: '🖥️' }
  ];
  
  return (
    <div className="grid grid-cols-4 gap-2">
      {indicators.map(ind => (
        <motion.div
          key={ind.label}
          whileHover={{ scale: 1.05 }}
          className={`p-3 rounded-xl text-center transition-all ${
            ind.detected 
              ? 'bg-amber-500/20 border border-amber-500/40' 
              : 'bg-emerald-500/10 border border-emerald-500/30'
          }`}
        >
          <div className="text-lg mb-1">{ind.icon}</div>
          <div className="text-[10px] text-slate-400">{ind.label}</div>
          <div className={`text-xs font-bold ${ind.detected ? 'text-amber-400' : 'text-emerald-400'}`}>
            {ind.detected ? 'YES' : 'NO'}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN GEOLOCATION TOOL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const GeolocationTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  
  const [input, setInput] = useState('');
  const [inputType, setInputType] = useState('ip');
  const [isLocating, setIsLocating] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Geolocation', query: input });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [activeTab, setActiveTab] = useState('overview');
  const [scanPhase, setScanPhase] = useState('');
  const canvasRef = useRef(null);
  const [geoEnriched, setGeoEnriched] = useState(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [showSatellite, setShowSatellite] = useState(false);

  const handleExportJSON = () => {
    if (!results) { toast.error('No results to export'); return; }
    const ok = exportToJSON(results, `geolocation_${Date.now()}.json`);
    if (ok) toast.success('Exported JSON'); else toast.error('Export failed');
  };

  const handleExportCSV = () => {
    if (!results) { toast.error('No results to export'); return; }
    const prepared = formatForExport(results, 'csv');
    const ok = exportToCSV(prepared, `geolocation_${Date.now()}.csv`);
    if (ok) toast.success('Exported CSV'); else toast.error('Export failed');
  };

  const handleRefresh = () => {
    setInput('');
    setResults(null);
    setScanPhase('');
    toast.info('Ready for new search');
  };

  const handleCopyCoords = (text) => {
    copy(text);
    toast.success('Coordinates copied');
  };

  // Background grid animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let offset = 0;
    
    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      
      ctx.clearRect(0, 0, w, h);
      
      // Draw moving grid
      const gridSize = 50;
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.08)';
      ctx.lineWidth = 1;
      
      for (let x = (offset % gridSize); x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      
      for (let y = (offset % gridSize); y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      
      offset += 0.3;
      animationId = requestAnimationFrame(draw);
    };
    
    draw();
    return () => cancelAnimationFrame(animationId);
  }, []);

  const handleLocate = async () => {
    if (!input.trim()) {
      toast.error('Please enter an IP address, coordinates, or address');
      return;
    }
    
    trackToolUsage('geolocation', 'locate', 'start');
    setIsLocating(true);
    setResults(null);
    onConsume?.(5);
    
    const phases = [
      'Initializing GPS satellites...',
      'Triangulating position...',
      'Resolving network path...',
      'Fetching location data...',
      'Compiling intelligence...'
    ];
    
    for (let i = 0; i < phases.length; i++) {
      setScanPhase(phases[i]);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE}/tools/geolocation/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input.trim(), type: inputType }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Geolocation lookup failed');
      }
      const resultData = await response.json();
      setResults(resultData);
      addToHistory('geolocation', input, resultData);
      trackToolUsage('geolocation', 'locate', 'success');
      toast.success('Location acquired — real data!');
      setActiveTab('overview');
      if (resultData.latitude && resultData.longitude) {
        setIsEnriching(true);
        try {
          const enrichResp = await fetch(`${API_BASE}/tools/geo/enriched`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: resultData.latitude, lon: resultData.longitude }),
          });
          if (enrichResp.ok) {
            const enrichData = await enrichResp.json();
            setGeoEnriched(enrichData);
          }
        } catch (e) {
          console.log('[Geo Enrich]', e.message);
        } finally {
          setIsEnriching(false);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Geolocation lookup failed');
      trackToolUsage('geolocation', 'locate', 'error');
    } finally {
      setIsLocating(false);
      setScanPhase('');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Globe },
    { id: 'satellite', label: 'Satellite & POI', icon: Satellite },
    { id: 'network', label: 'Network', icon: Wifi },
    { id: 'time', label: 'Time & Weather', icon: Clock },
    { id: 'trace', label: 'Trace Route', icon: Activity }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 30, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[95vh] overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-950 via-green-950/10 to-slate-950 border border-green-500/30 shadow-2xl shadow-green-500/10"
      >
        {/* Grid background */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-50 pointer-events-none" />
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-green-500/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/8 rounded-full blur-[100px] pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 px-4 sm:px-6 py-4 sm:py-5 border-b border-green-500/20 bg-slate-950/60 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <motion.div
                className="relative flex-shrink-0"
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #14b8a6)' }}
                >
                  <Globe className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <motion.div
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-400 flex items-center justify-center border-2 border-slate-950"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                >
                  <Navigation className="w-3 h-3 text-slate-900" />
                </motion.div>
              </motion.div>
              
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 flex-wrap">
                  <span>Geolocation Tracker</span>
                  <span className="px-2 py-0.5 text-[10px] sm:text-xs bg-green-500/20 text-green-300 rounded-full border border-green-500/30">OSINT</span>
                </h2>
                <p className="text-xs sm:text-sm text-green-300/70 flex items-center gap-1.5 mt-0.5">
                  <Satellite className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">IP & coordinate intelligence</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                className="p-2 rounded-lg bg-white/5 hover:bg-green-500/20 border border-white/10 hover:border-green-500/30 transition-all"
                title="New Search"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                disabled={!results}
                onClick={handleExportJSON}
                className="hidden sm:flex p-2 rounded-lg bg-white/5 hover:bg-green-500/20 border border-white/10 hover:border-green-500/30 transition-all disabled:opacity-40"
                title="Export JSON"
              >
                <Download className="w-5 h-5 text-green-400" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 transition-all"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-100px)] custom-scrollbar">
          {/* Input Section */}
          <div className="mb-6 p-4 sm:p-5 rounded-xl bg-slate-900/60 border border-green-500/20 backdrop-blur-sm">
            {/* Input Type Toggle */}
            <div className="flex gap-2 mb-4">
              {[
                { id: 'ip', label: 'IP Address', icon: Wifi },
                { id: 'coords', label: 'Coordinates', icon: Crosshair },
                { id: 'address', label: 'Address', icon: Building }
              ].map(type => (
                <motion.button
                  key={type.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setInputType(type.id)}
                  className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                    inputType === type.id
                      ? 'text-white shadow-lg shadow-green-500/30'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-green-500/20'
                  }`}
                  style={inputType === type.id ? { background: 'linear-gradient(135deg, #22c55e, #14b8a6)' } : {}}
                >
                  <type.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{type.label}</span>
                  <span className="sm:hidden">{type.id === 'ip' ? 'IP' : type.id === 'coords' ? 'Coords' : 'Addr'}</span>
                </motion.button>
              ))}
            </div>

            {/* Input field */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={
                    inputType === 'ip' ? '8.8.8.8 or 2001:4860:4860::8888' :
                    inputType === 'coords' ? '37.7749, -122.4194' :
                    '1600 Amphitheatre Parkway, CA'
                  }
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-800/80 border border-green-500/30 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 text-white text-base placeholder-slate-500 outline-none transition-all"
                  onKeyDown={e => e.key === 'Enter' && !isLocating && handleLocate()}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLocate}
                disabled={isLocating || !input.trim()}
                className="px-6 py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-green-500/30 transition-all"
                style={{ background: 'linear-gradient(135deg, #22c55e, #14b8a6)' }}
              >
                {isLocating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Compass className="w-5 h-5" />
                    </motion.div>
                    <span className="hidden sm:inline">Locating...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5" />
                    <span className="hidden sm:inline">Locate</span>
                  </>
                )}
              </motion.button>
            </div>

            {/* Locating Animation */}
            <AnimatePresence>
              {isLocating && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6"
                >
                  <div className="flex items-center justify-center gap-8">
                    <SatelliteConstellation isActive={true} />
                    <TriangulationVisualizer isActive={true} accuracy="5km" />
                  </div>
                  <div className="text-center mt-4">
                    <div className="text-green-400 font-medium">{scanPhase}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Results Section */}
          <AnimatePresence mode="wait">
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Location Header */}
                <div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex-shrink-0 hidden lg:block">
                      <GlobeVisualization 
                        latitude={results.location.latitude} 
                        longitude={results.location.longitude}
                        isLocating={false}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                            <MapPin className="w-6 h-6 text-green-400" />
                            {results.address.city}, {results.address.regionCode}
                          </h3>
                          <p className="text-green-300/70 mt-1">
                            {results.address.country} • {results.address.continent}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            className="px-4 py-2 rounded-lg bg-green-500/20 text-green-300 border border-green-500/30 flex items-center gap-2 text-sm"
                          >
                            <Map className="w-4 h-4" />
                            <span className="hidden sm:inline">View Map</span>
                          </motion.button>
                        </div>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-4">
                        <CoordinateDisplay 
                          latitude={results.location.latitude}
                          longitude={results.location.longitude}
                          onCopy={handleCopyCoords}
                        />
                        <div className="p-4 rounded-xl bg-slate-900/80 border border-green-500/30 space-y-2">
                          <div className="text-xs text-green-400/70 uppercase tracking-wider mb-2">Quick Info</div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">IP Address</span>
                            <span className="text-white font-mono">{results.ip}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">ISP</span>
                            <span className="text-white">{results.network.isp}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Accuracy</span>
                            <span className="text-green-400">{results.location.accuracy}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Sources & Elevation */}
                <div className="mb-4 space-y-2">
                  {results.dataSources && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">Located via</span>
                      {results.dataSources.map((src, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] text-green-400 font-medium">{src}</span>
                      ))}
                    </div>
                  )}
                  {(results.location.elevation || results.network?.openPorts?.length > 0) && (
                    <div className="flex flex-wrap items-center gap-3">
                      {results.location.elevation && (
                        <span className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">Elevation: {results.location.elevation} ({results.location.elevationFt})</span>
                      )}
                      {results.network?.openPorts?.length > 0 && (
                        <span className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">{results.network.openPorts.length} open ports (Shodan)</span>
                      )}
                      {results.network?.vpn && (
                        <span className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400">VPN Detected</span>
                      )}
                      {results.network?.tor && (
                        <span className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">Tor Exit Node</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-5 overflow-x-auto pb-2 scrollbar-hide">
                  {tabs.map(tab => (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium whitespace-nowrap transition-all text-sm ${
                        activeTab === tab.id
                          ? 'text-white shadow-lg shadow-green-500/30'
                          : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-green-500/20'
                      }`}
                      style={activeTab === tab.id ? { background: 'linear-gradient(135deg, #22c55e, #14b8a6)' } : {}}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 sm:p-6 rounded-xl bg-slate-900/60 border border-green-500/20"
                  >
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Address Details */}
                        <div className="p-4 rounded-xl bg-slate-800/50 border border-green-500/20">
                          <h4 className="text-green-300 font-semibold mb-4 flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            Location Details
                          </h4>
                          <div className="space-y-3">
                            {[
                              { label: 'City', value: results.address.city },
                              { label: 'Region', value: `${results.address.region} (${results.address.regionCode})` },
                              { label: 'Country', value: `${results.address.country} (${results.address.countryCode})` },
                              { label: 'Postal Code', value: results.address.postal },
                              { label: 'Continent', value: results.address.continent }
                            ].map(item => (
                              <div key={item.label} className="flex justify-between text-sm">
                                <span className="text-slate-400">{item.label}</span>
                                <span className="text-white">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Country Info */}
                        <div className="p-4 rounded-xl bg-slate-800/50 border border-green-500/20">
                          <h4 className="text-green-300 font-semibold mb-4 flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            Country Info
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-slate-900/50 text-center">
                              <div className="text-3xl mb-1">🇺🇸</div>
                              <div className="text-xs text-slate-400">{results.address.countryCode}</div>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-900/50">
                              <div className="text-xs text-slate-400">Currency</div>
                              <div className="text-white font-semibold">{results.currency.symbol} {results.currency.code}</div>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-900/50">
                              <div className="text-xs text-slate-400">Calling Code</div>
                              <div className="text-white font-semibold">{results.callingCode}</div>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-900/50">
                              <div className="text-xs text-slate-400">Language</div>
                              <div className="text-white font-semibold">{results.languages[0]}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Satellite & POI Tab */}
                    {activeTab === 'satellite' && (
                      <div className="space-y-6">
                        {/* Map Layer Toggle */}
                        <div className="flex items-center gap-3 mb-4">
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setShowSatellite(!showSatellite)}
                            className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-all ${
                              showSatellite
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800/50 text-slate-400 border border-green-500/20'
                            }`}
                          >
                            <Satellite className="w-4 h-4" />
                            {showSatellite ? 'Satellite View' : 'Map View'}
                          </motion.button>
                          {results?.latitude && results?.longitude && (
                            <a
                              href={`https://www.openstreetmap.org/?mlat=${results.latitude}&mlon=${results.longitude}#map=15/${results.latitude}/${results.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 rounded-xl bg-slate-800/50 text-slate-400 border border-green-500/20 flex items-center gap-2 text-sm hover:text-white transition-all"
                            >
                              <ExternalLink className="w-4 h-4" />
                              OpenStreetMap
                            </a>
                          )}
                        </div>

                        {/* Map Preview */}
                        {results?.latitude && results?.longitude && (
                          <div className="rounded-xl overflow-hidden border border-green-500/20 h-64 relative bg-slate-800/50">
                            <img
                              src={showSatellite
                                ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/${Math.floor((90 - results.latitude) / (180 / Math.pow(2, 12)))}/${Math.floor((180 + results.longitude) / (360 / Math.pow(2, 12)))}.png`
                                : `https://tile.openstreetmap.org/12/${Math.floor((180 + results.longitude) / (360 / Math.pow(2, 12)))}/${Math.floor((90 - results.latitude) / (180 / Math.pow(2, 12)))}.png`
                              }
                              alt="Map"
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <div className="absolute inset-0 border-2 border-green-400/30 rounded-xl pointer-events-none" />
                            <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/60 text-xs text-green-300">
                              {showSatellite ? 'Satellite (ArcGIS)' : 'OpenStreetMap'} — Zoom 12
                            </div>
                          </div>
                        )}

                        {/* POI List */}
                        <div className="p-4 rounded-xl bg-slate-800/50 border border-green-500/20">
                          <h4 className="text-green-300 font-semibold mb-4 flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            Near me — Points of Interest
                            {isEnriching && <RefreshCw className="w-3 h-3 animate-spin ml-2" />}
                          </h4>
                          {!geoEnriched && !isEnriching && (
                            <p className="text-sm text-slate-500">POI data loads automatically after lookup.</p>
                          )}
                          {isEnriching && (
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Querying OpenStreetMap...
                            </div>
                          )}
                          {geoEnriched?.poi?.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                              {geoEnriched.poi.slice(0, 30).map((p, i) => (
                                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/50 border border-green-500/10">
                                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-4 h-4 text-emerald-400" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm text-white truncate">{p.name}</div>
                                    <div className="text-[10px] text-slate-500 capitalize">{p.type} {p.distance ? `· ${Math.round(p.distance)}m` : ''}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {geoEnriched?.poi?.length === 0 && !isEnriching && (
                            <p className="text-sm text-slate-500">No POI found within 5km radius.</p>
                          )}
                        </div>

                        {/* Data Sources */}
                        <div className="flex flex-wrap gap-2">
                          {geoEnriched?.sources?.map(s => (
                            <span key={s} className="px-2 py-1 rounded-md bg-slate-800/50 border border-green-500/20 text-[10px] text-slate-400">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Network Tab */}
                    {activeTab === 'network' && (
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Network Details */}
                          <div className="p-4 rounded-xl bg-slate-800/50 border border-green-500/20">
                            <h4 className="text-green-300 font-semibold mb-4 flex items-center gap-2">
                              <Wifi className="w-4 h-4" />
                              Network Details
                            </h4>
                            <div className="space-y-3">
                              {[
                                { label: 'IP Address', value: results.ip },
                                { label: 'ISP', value: results.network.isp },
                                { label: 'Organization', value: results.network.org },
                                { label: 'ASN', value: results.network.asn },
                                { label: 'Domain', value: results.network.domain },
                                { label: 'Type', value: results.network.type }
                              ].map(item => (
                                <div key={item.label} className="flex justify-between text-sm">
                                  <span className="text-slate-400">{item.label}</span>
                                  <span className="text-white font-mono">{item.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Security Indicators */}
                          <div className="p-4 rounded-xl bg-slate-800/50 border border-green-500/20">
                            <h4 className="text-green-300 font-semibold mb-4 flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              Security Indicators
                            </h4>
                            <SecurityIndicators network={results.network} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Time & Weather Tab */}
                    {activeTab === 'time' && (
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Time Zone */}
                          <div className="p-4 rounded-xl bg-slate-800/50 border border-green-500/20">
                            <h4 className="text-green-300 font-semibold mb-4 flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Time Zone
                            </h4>
                            <div className="flex flex-col items-center">
                              <TimeZoneWheel 
                                timezone={results.timezone}
                                localTime={results.timezone.localTime}
                              />
                              <div className="mt-4 text-center">
                                <div className="text-sm text-slate-400">{results.timezone.name}</div>
                                <div className="text-xs text-slate-500 mt-1">
                                  DST: {results.timezone.isDST ? 'Active' : 'Inactive'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Weather */}
                          <WeatherWidget weather={results.weather} />
                        </div>

                        {/* Historical Weather & Sunrise/Sunset */}
                        {(geoEnriched?.historicalWeather || geoEnriched?.sunriseSunset) && (
                          <div className="grid md:grid-cols-2 gap-6">
                            {geoEnriched?.sunriseSunset && (
                              <div className="p-4 rounded-xl bg-slate-800/50 border border-amber-500/20">
                                <h4 className="text-amber-300 font-semibold mb-4 flex items-center gap-2">
                                  <Sun className="w-4 h-4" />
                                  Sunrise & Sunset
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                  {[
                                    { label: 'Sunrise', value: new Date(geoEnriched.sunriseSunset.sunrise).toLocaleTimeString(), icon: Sun },
                                    { label: 'Sunset', value: new Date(geoEnriched.sunriseSunset.sunset).toLocaleTimeString(), icon: Moon },
                                    { label: 'Solar Noon', value: new Date(geoEnriched.sunriseSunset.solarNoon).toLocaleTimeString(), icon: Clock },
                                    { label: 'Day Length', value: `${Math.round(parseInt(geoEnriched.sunriseSunset.dayLength) / 3600)}h ${Math.round((parseInt(geoEnriched.sunriseSunset.dayLength) % 3600) / 60)}m`, icon: Clock },
                                    { label: 'Civil Dawn', value: new Date(geoEnriched.sunriseSunset.civilTwilightBegin).toLocaleTimeString(), icon: Sun },
                                    { label: 'Civil Dusk', value: new Date(geoEnriched.sunriseSunset.civilTwilightEnd).toLocaleTimeString(), icon: Sun },
                                  ].map(item => (
                                    <div key={item.label} className="p-2 rounded-lg bg-slate-900/50 flex items-center gap-2">
                                      <item.icon className="w-4 h-4 text-amber-400" />
                                      <div>
                                        <div className="text-[10px] text-slate-500">{item.label}</div>
                                        <div className="text-sm text-white">{item.value}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {geoEnriched?.historicalWeather && !geoEnriched.historicalWeather.error && (
                              <div className="p-4 rounded-xl bg-slate-800/50 border border-blue-500/20">
                                <h4 className="text-blue-300 font-semibold mb-4 flex items-center gap-2">
                                  <Cloud className="w-4 h-4" />
                                  Historical Weather — {geoEnriched.historicalWeather.date}
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-3 rounded-lg bg-slate-900/50 text-center">
                                    <Thermometer className="w-4 h-4 text-red-400 mx-auto mb-1" />
                                    <div className="text-[10px] text-slate-500">Max Temp</div>
                                    <div className="text-lg font-bold text-white">{geoEnriched.historicalWeather.tempMax}°C</div>
                                  </div>
                                  <div className="p-3 rounded-lg bg-slate-900/50 text-center">
                                    <Thermometer className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                                    <div className="text-[10px] text-slate-500">Min Temp</div>
                                    <div className="text-lg font-bold text-white">{geoEnriched.historicalWeather.tempMin}°C</div>
                                  </div>
                                  <div className="p-3 rounded-lg bg-slate-900/50 text-center">
                                    <Waves className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                                    <div className="text-[10px] text-slate-500">Precipitation</div>
                                    <div className="text-lg font-bold text-white">{geoEnriched.historicalWeather.precipitation ?? 0} mm</div>
                                  </div>
                                  <div className="p-3 rounded-lg bg-slate-900/50 text-center">
                                    <Wind className="w-4 h-4 text-green-400 mx-auto mb-1" />
                                    <div className="text-[10px] text-slate-500">Wind Speed</div>
                                    <div className="text-lg font-bold text-white">{geoEnriched.historicalWeather.windSpeed ?? 0} km/h</div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Trace Route Tab */}
                    {activeTab === 'trace' && (
                      <div>
                        <h4 className="text-green-300 font-semibold mb-4 flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Network Path Trace
                        </h4>
                        <NetworkHopTracer hops={results.networkHops} isTracing={false} />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!results && !isLocating && (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                animate={{ y: [0, -10, 0], rotateY: [0, 360] }}
                transition={{ 
                  y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                  rotateY: { duration: 20, repeat: Infinity, ease: 'linear' }
                }}
                className="inline-block"
              >
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(20,184,166,0.2))' }}
                >
                  <Globe className="w-10 h-10 text-green-400" />
                </div>
              </motion.div>
              <h3 className="text-xl text-slate-400 mb-2">Enter an IP or location</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Track IP addresses, coordinates, or physical addresses with satellite precision
              </p>
              
              {/* Feature highlights */}
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                {[
                  { icon: Satellite, label: 'GPS Tracking' },
                  { icon: Wifi, label: 'Network Intel' },
                  { icon: Clock, label: 'Time Zones' },
                  { icon: Cloud, label: 'Weather' },
                  { icon: Activity, label: 'Trace Route' }
                ].map((feature, i) => (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="px-3 py-2 rounded-lg bg-slate-800/50 border border-green-500/20 flex items-center gap-2"
                  >
                    <feature.icon className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-slate-400">{feature.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34, 197, 94, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 197, 94, 0.5);
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </motion.div>
  );
};

export default GeolocationTool;
