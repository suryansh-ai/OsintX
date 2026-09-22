import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { useRole } from '../../../context/RoleContext';
import { Link, useNavigate } from 'react-router-dom';
import ToolErrorBoundary from '../../../components/common/ToolErrorBoundary';
import {
  Shield, Search, Globe, Terminal, AlertTriangle, Lock, Eye, Database,
  Wifi, FileText, Activity, Clock, Zap, ChevronRight, LogOut, Target,
  Crosshair, Radio, Layers, MapPin, Phone, Mail, Hash, Image, Link2,
  Server, HardDrive, Cpu, RotateCcw, Command, Scan, Bookmark, Copy,
  CheckCircle, XCircle, Star, TrendingUp, Calendar, Bell, Settings,
  MessageCircle, Car, Wallet,
  Download, Upload, FileDown, FileUp, Share2
} from 'lucide-react';

// Import Tool Components
import IPIntelligenceTool from '../../../components/tools/IPIntelligenceTool';
import DomainAnalysisTool from '../../../components/tools/DomainAnalysisTool';
import EmailIntelTool from '../../../components/tools/EmailIntelTool';
import SocialProfilerTool from '../../../components/tools/SocialProfilerTool';
import HashAnalyzerTool from '../../../components/tools/HashAnalyzerTool';
import URLScannerTool from '../../../components/tools/URLScannerTool';
import GeolocationTool from '../../../components/tools/GeolocationTool';
import BreachDatabaseTool from '../../../components/tools/BreachDatabaseTool';
import DNSRecordsTool from '../../../components/tools/DNSRecordsTool';
import WhatsAppTraceTool from '../../../components/tools/WhatsAppTraceTool';
import RealTimeCyberGlobe3D from '../../../components/threat-map/RealTimeCyberGlobe3D';
import threatMapService from '../../../services/threatMapService';
import { DETAILED_CITIES, GEOGRAPHIC_REGIONS } from '../../../services/geographicData';


// Import common components
import FeedbackBubble from '../../../components/common/FeedbackBubble';
import ChatbotBubble from '../../../components/common/ChatbotBubble';

// Realistic Animated Globe Component with Cyber Network Visualization
const AnimatedGlobe = ({ 
  isTyping = false, 
  isExecuting = false, 
  zoom = 1, 
  rotationOffset = { x: 0, y: 0 }, 
  liveAttacks = [],
  onCityHover,
  onCityClick,
  onAttackClick,
  hoveredCity 
}) => {
  const canvasRef = useRef(null);
  const hotspotProjections = useRef([]);
  const attackProjections = useRef([]);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);
  const rotationRef = useRef(0);
  const stateRef = useRef({ typingIntensity: 0, executingIntensity: 0 });
  
  // Memoize expensive calculations
  const globeData = useMemo(() => {
    // Major world cities with approximate lat/lng for cyber hotspots
    const cyberHotspots = [
      { name: 'New York', lat: 40.7, lng: -74, activity: 0.95 },
      { name: 'London', lat: 51.5, lng: -0.1, activity: 0.9 },
      { name: 'Tokyo', lat: 35.7, lng: 139.7, activity: 0.88 },
      { name: 'Beijing', lat: 39.9, lng: 116.4, activity: 0.85 },
      { name: 'Mumbai', lat: 19.1, lng: 72.9, activity: 0.75 },
      { name: 'Sydney', lat: -33.9, lng: 151.2, activity: 0.7 },
      { name: 'Dubai', lat: 25.2, lng: 55.3, activity: 0.72 },
      { name: 'Singapore', lat: 1.3, lng: 103.8, activity: 0.82 },
      { name: 'São Paulo', lat: -23.5, lng: -46.6, activity: 0.68 },
      { name: 'Moscow', lat: 55.8, lng: 37.6, activity: 0.78 },
      { name: 'Los Angeles', lat: 34.1, lng: -118.2, activity: 0.85 },
      { name: 'Berlin', lat: 52.5, lng: 13.4, activity: 0.72 },
      { name: 'Seoul', lat: 37.6, lng: 127, activity: 0.8 },
      { name: 'Toronto', lat: 43.7, lng: -79.4, activity: 0.7 },
      { name: 'Paris', lat: 48.9, lng: 2.3, activity: 0.75 },
      { name: 'Hong Kong', lat: 22.3, lng: 114.2, activity: 0.83 },
      { name: 'Tel Aviv', lat: 32.1, lng: 34.8, activity: 0.76 },
      { name: 'Amsterdam', lat: 52.4, lng: 4.9, activity: 0.71 },
      { name: 'Bangalore', lat: 12.97, lng: 77.59, activity: 0.79 },
      { name: 'Shanghai', lat: 31.2, lng: 121.5, activity: 0.87 },
    ];

    // Convert lat/lng to 3D coordinates
    const latLngTo3D = (lat, lng) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      return {
        x: -Math.sin(phi) * Math.cos(theta),
        y: Math.cos(phi),
        z: Math.sin(phi) * Math.sin(theta)
      };
    };

    // Convert hotspots to 3D points
    const hotspotPoints = cyberHotspots.map(h => ({
      ...latLngTo3D(h.lat, h.lng),
      name: h.name,
      activity: h.activity,
      pulsePhase: Math.random() * Math.PI * 2
    }));

    // Generate realistic continent outlines with more detail
    const continentPoints = [];
    const generateContinent = (points, density = 1) => {
      points.forEach(([lat, lng]) => {
        for (let i = 0; i < density; i++) {
          const jitterLat = lat + (Math.random() - 0.5) * 3;
          const jitterLng = lng + (Math.random() - 0.5) * 3;
          const point = latLngTo3D(jitterLat, jitterLng);
          continentPoints.push({ ...point, brightness: 0.4 + Math.random() * 0.3 });
        }
      });
    };

    // North America outline
    const northAmerica = [
      [70, -160], [65, -140], [60, -130], [55, -125], [50, -125], [48, -123],
      [45, -122], [40, -124], [35, -120], [32, -117], [28, -110], [25, -97],
      [30, -85], [35, -75], [40, -74], [45, -70], [50, -60], [55, -65],
      [60, -95], [65, -110], [70, -130], [70, -160]
    ];
    generateContinent(northAmerica, 3);

    // Europe outline
    const europe = [
      [70, 25], [65, 15], [60, 5], [55, -5], [50, -10], [45, -10], [40, -9],
      [37, -9], [36, -5], [40, 0], [43, 5], [45, 10], [46, 15], [48, 17],
      [52, 20], [55, 25], [60, 30], [65, 35], [70, 30]
    ];
    generateContinent(europe, 3);

    // Asia outline
    const asia = [
      [70, 60], [65, 80], [55, 75], [50, 80], [45, 90], [40, 100], [35, 105],
      [30, 120], [25, 120], [20, 110], [15, 100], [10, 105], [5, 100],
      [0, 105], [-5, 115], [-8, 120], [-10, 140], [-5, 150], [0, 140],
      [10, 130], [20, 130], [30, 135], [40, 140], [45, 145], [50, 155],
      [55, 160], [60, 170], [65, 180], [70, 150], [70, 100]
    ];
    generateContinent(asia, 4);

    // South America outline
    const southAmerica = [
      [10, -80], [5, -75], [0, -80], [-5, -80], [-10, -75], [-15, -75],
      [-20, -70], [-25, -65], [-30, -70], [-35, -72], [-40, -73], [-45, -75],
      [-50, -75], [-55, -70], [-55, -65], [-50, -60], [-45, -65], [-40, -62],
      [-35, -58], [-30, -50], [-25, -45], [-20, -40], [-15, -40], [-10, -35],
      [-5, -35], [0, -50], [5, -60], [10, -70]
    ];
    generateContinent(southAmerica, 3);

    // Africa outline
    const africa = [
      [35, -5], [30, 0], [25, -15], [20, -17], [15, -17], [10, -15],
      [5, -5], [0, 10], [-5, 15], [-10, 20], [-15, 25], [-20, 30],
      [-25, 32], [-30, 30], [-35, 20], [-30, 25], [-25, 35], [-20, 40],
      [-15, 40], [-10, 45], [-5, 50], [5, 50], [10, 50], [15, 45],
      [20, 40], [25, 35], [30, 32], [35, 10]
    ];
    generateContinent(africa, 3);

    // Australia outline
    const australia = [
      [-10, 140], [-15, 130], [-20, 115], [-25, 115], [-30, 115], [-35, 118],
      [-35, 138], [-38, 145], [-35, 150], [-30, 153], [-25, 153], [-20, 148],
      [-15, 145], [-12, 140]
    ];
    generateContinent(australia, 3);

    // Generate smoother latitude/longitude grid lines
    const gridLines = [];
    for (let lat = -60; lat <= 60; lat += 20) {
      const line = [];
      for (let lng = 0; lng <= 360; lng += 5) {
        line.push(latLngTo3D(lat, lng));
      }
      gridLines.push({ points: line, type: 'lat' });
    }
    for (let lng = 0; lng < 360; lng += 20) {
      const line = [];
      for (let lat = -80; lat <= 80; lat += 5) {
        line.push(latLngTo3D(lat, lng));
      }
      gridLines.push({ points: line, type: 'lng' });
    }

    // Data flow arcs
    const dataFlows = [];
    for (let i = 0; i < 15; i++) {
      const fromIdx = Math.floor(Math.random() * hotspotPoints.length);
      let toIdx = Math.floor(Math.random() * hotspotPoints.length);
      while (toIdx === fromIdx) toIdx = Math.floor(Math.random() * hotspotPoints.length);
      dataFlows.push({
        from: fromIdx,
        to: toIdx,
        progress: Math.random(),
        speed: 0.003 + Math.random() * 0.005,
        arcHeight: 0.12 + Math.random() * 0.15,
        color: Math.random() > 0.5 ? 'cyan' : (Math.random() > 0.5 ? 'green' : 'orange')
      });
    }

    // Orbiting satellites - reduced for performance
    const satellites = [];
    for (let i = 0; i < 5; i++) {
      satellites.push({
        orbit: 1.12 + Math.random() * 0.15,
        angle: Math.random() * Math.PI * 2,
        speed: 0.001 + Math.random() * 0.002,
        tilt: (Math.random() - 0.5) * 0.8,
        size: 1.5 + Math.random()
      });
    }

    // Stars - reduced for performance
    const stars = [];
    for (let i = 0; i < 60; i++) {
      stars.push({
        angle: Math.random() * Math.PI * 2,
        distance: 0.7 + Math.random() * 0.5,
        size: Math.random() * 1.2 + 0.3,
        alpha: Math.random() * 0.4 + 0.1,
        twinkleSpeed: Math.random() * 0.02 + 0.01
      });
    }

    return { hotspotPoints, continentPoints, gridLines, dataFlows, satellites, stars, latLngTo3D };
  }, []);

  // Throttled mouse move handler
  const handleCanvasMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width / (window.devicePixelRatio || 1));
    const y = (e.clientY - rect.top) * (canvas.height / rect.height / (window.devicePixelRatio || 1));
    
    const nearestCity = hotspotProjections.current.find(hp => {
      const dist = Math.sqrt((hp.x - x) ** 2 + (hp.y - y) ** 2);
      return dist < 18 && hp.visible;
    });
    
    if (nearestCity && onCityHover) {
      onCityHover(nearestCity.name);
    } else if (onCityHover && hoveredCity) {
      onCityHover(null);
    }
  }, [onCityHover, hoveredCity]);

  const handleCanvasClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width / (window.devicePixelRatio || 1));
    const y = (e.clientY - rect.top) * (canvas.height / rect.height / (window.devicePixelRatio || 1));
    
    // Check if clicked on an attack first (smaller target, priority)
    const clickedAttack = attackProjections.current.find(ap => {
      const dist = Math.sqrt((ap.x - x) ** 2 + (ap.y - y) ** 2);
      return dist < 25;
    });
    
    if (clickedAttack && onAttackClick) {
      onAttackClick(clickedAttack.attack);
      return;
    }
    
    // Then check for city clicks
    const clickedCity = hotspotProjections.current.find(hp => {
      const dist = Math.sqrt((hp.x - x) ** 2 + (hp.y - y) ** 2);
      return dist < 22 && hp.visible;
    });
    
    if (clickedCity && onCityClick) {
      onCityClick(clickedCity.name);
    }
  }, [onCityClick, onAttackClick]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: true });
    const { hotspotPoints, continentPoints, gridLines, dataFlows, satellites, stars, latLngTo3D } = globeData;
    
    // Set canvas size with high DPI support
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    
    // 3D rotation with smooth interpolation
    const rotate3D = (point, rotY, tilt) => {
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);
      
      const x = point.x * cosY - point.z * sinY;
      const z = point.x * sinY + point.z * cosY;
      const y2 = point.y * cosT - z * sinT;
      const z2 = point.y * sinT + z * cosT;
      
      return { x, y: y2, z: z2 };
    };
    
    // Optimized perspective projection
    const project = (point, centerX, centerY, radius) => {
      const scale = 2 / (2 - point.z * 0.5);
      return {
        x: centerX + point.x * radius * scale,
        y: centerY + point.y * radius * scale,
        z: point.z,
        scale
      };
    };
    
    // Bezier arc point calculation
    const getArcPoint = (p1, p2, height, t) => {
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const midZ = (p1.z + p2.z) / 2;
      const len = Math.sqrt(midX * midX + midY * midY + midZ * midZ) || 1;
      const h = 1 + height;
      const ctrlX = midX / len * h;
      const ctrlY = midY / len * h;
      const ctrlZ = midZ / len * h;
      const mt = 1 - t;
      
      return {
        x: mt * mt * p1.x + 2 * mt * t * ctrlX + t * t * p2.x,
        y: mt * mt * p1.y + 2 * mt * t * ctrlY + t * t * p2.y,
        z: mt * mt * p1.z + 2 * mt * t * ctrlZ + t * t * p2.z
      };
    };
    
    // Pre-calculate atmosphere gradient
    let atmosphereGradient = null;
    
    const animate = (timestamp) => {
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      
      // Cap delta time to prevent huge jumps
      const dt = Math.min(deltaTime, 50) / 1000;
      
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * 0.34;
      const radius = baseRadius * zoom;
      
      // Clear with slight fade for motion blur effect
      ctx.fillStyle = 'rgba(2, 8, 16, 0.15)';
      ctx.fillRect(0, 0, width, height);
      
      // Smooth state transitions
      const targetTyping = isTyping ? 1 : 0;
      const targetExecuting = isExecuting ? 1 : 0;
      stateRef.current.typingIntensity += (targetTyping - stateRef.current.typingIntensity) * 0.08;
      stateRef.current.executingIntensity += (targetExecuting - stateRef.current.executingIntensity) * 0.08;
      
      // Smooth rotation - slow enough to read data clearly
      const baseSpeed = 0.00015; // Very slow base rotation
      const speedBoost = stateRef.current.typingIntensity * 0.0001 + stateRef.current.executingIntensity * 0.0002;
      rotationRef.current += (baseSpeed + speedBoost) * deltaTime;
      
      const effectiveRotation = rotationRef.current + (rotationOffset.y * 0.008);
      const effectiveTilt = 0.35 + (rotationOffset.x * 0.004);
      const time = timestamp * 0.001;
      
      // === STARS ===
      stars.forEach(star => {
        const twinkle = Math.sin(time * star.twinkleSpeed * 60 + star.angle * 10) * 0.3 + 0.7;
        const sx = centerX + Math.cos(star.angle) * (radius * star.distance * 1.8);
        const sy = centerY + Math.sin(star.angle) * (radius * star.distance * 1.8);
        
        ctx.beginPath();
        ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 210, 255, ${star.alpha * twinkle})`;
        ctx.fill();
      });
      
      // === ATMOSPHERE GLOW ===
      if (!atmosphereGradient || atmosphereGradient.radius !== radius) {
        atmosphereGradient = ctx.createRadialGradient(centerX, centerY, radius * 0.95, centerX, centerY, radius * 1.25);
        atmosphereGradient.addColorStop(0, 'rgba(30, 144, 255, 0)');
        atmosphereGradient.addColorStop(0.3, 'rgba(30, 144, 255, 0.08)');
        atmosphereGradient.addColorStop(0.6, 'rgba(6, 182, 212, 0.05)');
        atmosphereGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
        atmosphereGradient.radius = radius;
      }
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.25, 0, Math.PI * 2);
      ctx.fillStyle = atmosphereGradient;
      ctx.fill();
      
      // === GLOBE BODY ===
      const globeGrad = ctx.createRadialGradient(
        centerX - radius * 0.35, centerY - radius * 0.35, 0,
        centerX, centerY, radius
      );
      globeGrad.addColorStop(0, 'rgba(25, 55, 85, 0.98)');
      globeGrad.addColorStop(0.4, 'rgba(15, 40, 65, 0.95)');
      globeGrad.addColorStop(0.8, 'rgba(8, 25, 45, 0.92)');
      globeGrad.addColorStop(1, 'rgba(5, 18, 35, 0.9)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = globeGrad;
      ctx.fill();
      
      // Rim lighting
      const rimGrad = ctx.createRadialGradient(centerX, centerY, radius * 0.85, centerX, centerY, radius);
      rimGrad.addColorStop(0, 'transparent');
      rimGrad.addColorStop(0.7, 'transparent');
      rimGrad.addColorStop(0.9, 'rgba(6, 182, 212, 0.15)');
      rimGrad.addColorStop(1, 'rgba(6, 182, 212, 0.35)');
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = rimGrad;
      ctx.fill();
      
      // === GRID LINES ===
      ctx.lineWidth = 0.4;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
      gridLines.forEach(line => {
        ctx.beginPath();
        let started = false;
        line.points.forEach((point) => {
          const rotated = rotate3D(point, effectiveRotation, effectiveTilt);
          if (rotated.z > -0.15) {
            const proj = project(rotated, centerX, centerY, radius * 0.99);
            if (!started) {
              ctx.moveTo(proj.x, proj.y);
              started = true;
            } else {
              ctx.lineTo(proj.x, proj.y);
            }
          } else {
            started = false;
          }
        });
        ctx.stroke();
      });
      
      // === CONTINENTS ===
      continentPoints.forEach(point => {
        const rotated = rotate3D(point, effectiveRotation, effectiveTilt);
        if (rotated.z > 0.05) {
          const proj = project(rotated, centerX, centerY, radius * 0.99);
          const alpha = rotated.z * point.brightness * 0.9;
          const size = 1.2 + rotated.z * 0.8;
          
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
          ctx.fill();
        }
      });
      
      // === DATA FLOWS ===
      dataFlows.forEach(flow => {
        const from3D = hotspotPoints[flow.from];
        const to3D = hotspotPoints[flow.to];
        
        // Update progress
        flow.progress += flow.speed;
        if (flow.progress > 1) flow.progress = 0;
        
        // Draw arc
        ctx.beginPath();
        let arcStarted = false;
        for (let t = 0; t <= 1; t += 0.08) {
          const arcPoint = getArcPoint(from3D, to3D, flow.arcHeight, t);
          const rotated = rotate3D(arcPoint, effectiveRotation, effectiveTilt);
          if (rotated.z > -0.2) {
            const proj = project(rotated, centerX, centerY, radius);
            if (!arcStarted) {
              ctx.moveTo(proj.x, proj.y);
              arcStarted = true;
            } else {
              ctx.lineTo(proj.x, proj.y);
            }
          }
        }
        if (arcStarted) {
          const colors = { cyan: 'rgba(6, 182, 212, 0.35)', green: 'rgba(34, 197, 94, 0.35)', orange: 'rgba(251, 146, 60, 0.35)' };
          ctx.strokeStyle = colors[flow.color];
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        
        // Animated packet
        const packetPoint = getArcPoint(from3D, to3D, flow.arcHeight, flow.progress);
        const rotatedPacket = rotate3D(packetPoint, effectiveRotation, effectiveTilt);
        if (rotatedPacket.z > -0.2) {
          const proj = project(rotatedPacket, centerX, centerY, radius);
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, 2.5, 0, Math.PI * 2);
          const packetColors = { cyan: '#06b6d4', green: '#22c55e', orange: '#fb923c' };
          ctx.fillStyle = packetColors[flow.color];
          ctx.fill();
        }
      });
      
      // === LIVE ATTACKS ===
      const currentAttackProjections = [];
      if (liveAttacks.length > 0) {
        liveAttacks.slice(-5).forEach(attack => {
          const fromCity = hotspotPoints.find(h => h.name === attack.from);
          const toCity = hotspotPoints.find(h => h.name === attack.to);
          
          if (fromCity && toCity) {
            const attackAge = (Date.now() - attack.id) / 1000;
            const progress = Math.min(1, attackAge / 2);
            const alpha = Math.max(0.1, 1 - attackAge / 8);
            
            // Draw attack arc
            ctx.beginPath();
            let started = false;
            for (let t = 0; t <= progress; t += 0.05) {
              const arcPoint = getArcPoint(fromCity, toCity, 0.2, t);
              const rotated = rotate3D(arcPoint, effectiveRotation, effectiveTilt);
              if (rotated.z > -0.2) {
                const proj = project(rotated, centerX, centerY, radius);
                if (!started) { ctx.moveTo(proj.x, proj.y); started = true; }
                else ctx.lineTo(proj.x, proj.y);
              }
            }
            if (started) {
              ctx.strokeStyle = `rgba(255, 80, 80, ${alpha})`;
              ctx.lineWidth = 1.5;
              ctx.setLineDash([4, 3]);
              ctx.stroke();
              ctx.setLineDash([]);
            }
            
            // Draw attack packet marker (clickable)
            const packetT = (attackAge * 0.4) % 1;
            const packetPoint = getArcPoint(fromCity, toCity, 0.2, packetT);
            const packetRotated = rotate3D(packetPoint, effectiveRotation, effectiveTilt);
            
            if (packetRotated.z > -0.2) {
              const packetProj = project(packetRotated, centerX, centerY, radius);
              
              // Store for click detection
              currentAttackProjections.push({ x: packetProj.x, y: packetProj.y, attack });
              
              // Draw pulsing attack packet
              const pulse = Math.sin(time * 6) * 0.3 + 0.7;
              
              // Outer glow
              ctx.beginPath();
              ctx.arc(packetProj.x, packetProj.y, 12 * pulse, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(255, 60, 60, ${alpha * 0.2})`;
              ctx.fill();
              
              // Middle ring
              ctx.beginPath();
              ctx.arc(packetProj.x, packetProj.y, 8, 0, Math.PI * 2);
              ctx.strokeStyle = `rgba(255, 100, 100, ${alpha * 0.6})`;
              ctx.lineWidth = 2;
              ctx.stroke();
              
              // Core
              ctx.beginPath();
              ctx.arc(packetProj.x, packetProj.y, 4, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(255, 80, 80, ${alpha})`;
              ctx.fill();
              
              // Attack type label on hover proximity
              ctx.font = '9px monospace';
              ctx.fillStyle = `rgba(255, 150, 150, ${alpha * 0.8})`;
              ctx.textAlign = 'center';
              ctx.fillText(attack.type, packetProj.x, packetProj.y - 16);
            }
          }
        });
      }
      attackProjections.current = currentAttackProjections;
      
      // === CITY HOTSPOTS ===
      const currentProjections = [];
      hotspotPoints.forEach((hotspot) => {
        const rotated = rotate3D(hotspot, effectiveRotation, effectiveTilt);
        const isVisible = rotated.z > -0.05;
        
        if (isVisible) {
          const proj = project(rotated, centerX, centerY, radius * 0.99);
          const alpha = Math.max(0, (rotated.z + 0.2)) * hotspot.activity;
          const isHovered = hoveredCity === hotspot.name;
          
          currentProjections.push({ x: proj.x, y: proj.y, name: hotspot.name, visible: true });
          
          // Pulse effect
          const pulse = Math.sin(time * 2 + hotspot.pulsePhase) * 0.3 + 0.7;
          const ringSize = (isHovered ? 14 : 8) * pulse;
          
          // Outer ring
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, ringSize, 0, Math.PI * 2);
          ctx.strokeStyle = isHovered 
            ? `rgba(255, 200, 50, ${alpha * 0.6})`
            : `rgba(6, 182, 212, ${alpha * 0.3})`;
          ctx.lineWidth = isHovered ? 2 : 1;
          ctx.stroke();
          
          // Core glow
          const glowSize = isHovered ? 8 : 5;
          const glow = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, glowSize);
          glow.addColorStop(0, isHovered ? `rgba(255, 220, 100, ${alpha})` : `rgba(6, 220, 255, ${alpha})`);
          glow.addColorStop(0.5, isHovered ? `rgba(255, 180, 50, ${alpha * 0.4})` : `rgba(6, 182, 212, ${alpha * 0.3})`);
          glow.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, glowSize, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
          
          // Core dot
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, isHovered ? 3 : 2, 0, Math.PI * 2);
          ctx.fillStyle = isHovered ? '#fff' : `rgba(255, 255, 255, ${alpha})`;
          ctx.fill();
          
          // City label on hover
          if (isHovered) {
            ctx.font = '11px monospace';
            ctx.fillStyle = 'rgba(255, 220, 100, 0.95)';
            ctx.textAlign = 'center';
            ctx.fillText(hotspot.name, proj.x, proj.y - 18);
          }
        }
      });
      hotspotProjections.current = currentProjections;
      
      // === SATELLITES ===
      satellites.forEach(sat => {
        sat.angle += sat.speed * deltaTime * 0.06;
        
        const satX = Math.cos(sat.angle) * sat.orbit;
        const satY = Math.sin(sat.angle) * sat.orbit * Math.cos(sat.tilt);
        const satZ = Math.sin(sat.angle) * sat.orbit * Math.sin(sat.tilt);
        
        const rotated = rotate3D({ x: satX, y: satY, z: satZ }, effectiveRotation * 0.3, 0);
        const proj = project(rotated, centerX, centerY, radius);
        
        if (rotated.z > -0.3) {
          const alpha = (rotated.z + 0.5) * 0.6;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, sat.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fill();
        }
      });
      
      // === OUTER RINGS ===
      ctx.setLineDash([2, 4]);
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * (1.06 + i * 0.04), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(6, 182, 212, ${0.15 - i * 0.05})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      ctx.setLineDash([]);
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    window.addEventListener('resize', resize);
    
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [globeData, zoom, rotationOffset, isTyping, isExecuting, liveAttacks, hoveredCity]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full"
      style={{ cursor: hoveredCity ? 'pointer' : 'default' }}
      onMouseMove={handleCanvasMouseMove}
      onClick={handleCanvasClick}
    />
  );
};

// Tool data with icons
const toolsData = [
  { id: 'ip-trace', name: 'IP Tracer', icon: Globe, category: 'Network', cost: 15, cmd: 'trace-ip' },
  { id: 'domain-lookup', name: 'Domain Intel', icon: Search, category: 'OSINT', cost: 12, cmd: 'whois' },
  { id: 'email-osint', name: 'Email OSINT', icon: Mail, category: 'OSINT', cost: 18, cmd: 'email-trace' },
  { id: 'social-scan', name: 'Social Scanner', icon: Eye, category: 'OSINT', cost: 25, cmd: 'social-scan' },
  { id: 'hash-analyze', name: 'Hash Analyzer', icon: Hash, category: 'Forensics', cost: 10, cmd: 'hash-check' },
  { id: 'url-scanner', name: 'URL Scanner', icon: Link2, category: 'Threat', cost: 14, cmd: 'url-scan' },
  { id: 'geo-locate', name: 'Geo Locator', icon: MapPin, category: 'Geospatial', cost: 16, cmd: 'geo-lookup' },
  { id: 'breach-check', name: 'Breach Check', icon: Lock, category: 'Security', cost: 20, cmd: 'breach-db' },
  { id: 'dns-enum', name: 'DNS Enum', icon: Server, category: 'Network', cost: 12, cmd: 'dns-enum' },
  { id: 'port-scan', name: 'Port Scanner', icon: HardDrive, category: 'Network', cost: 18, cmd: 'port-scan' },
  // New investigation tools
  { id: 'whatsapp-trace', name: 'WhatsApp Trace', icon: MessageCircle, category: 'Communication', cost: 20, cmd: 'wa-trace' },
];

// HUD Corner Bracket Component
const HUDCorner = ({ position, children }) => {
  const positionClasses = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0 rotate-90',
    'bottom-left': 'bottom-0 left-0 -rotate-90',
    'bottom-right': 'bottom-0 right-0 rotate-180'
  };
  
  return (
    <div className={`absolute ${positionClasses[position]} pointer-events-none z-[20]`}>
      <svg width="60" height="60" viewBox="0 0 60 60" className="text-cyan-500/40">
        <path 
          d="M0 20 L0 0 L20 0" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        />
        <path 
          d="M0 15 L0 5 L5 0" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1"
          className="text-cyan-400/60"
        />
      </svg>
      {children}
    </div>
  );
};

// Floating HUD Panel Component
const HUDPanel = ({ title, icon: Icon, children, position, size = 'md', glow = true }) => {
  const sizeClasses = {
    sm: 'w-48',
    md: 'w-64',
    lg: 'w-80'
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`absolute ${position} ${sizeClasses[size]} z-30`}
    >
      <div className={`relative backdrop-blur-xl bg-[#020810]/70 border border-cyan-500/30 rounded-xl overflow-hidden ${glow ? 'shadow-lg shadow-cyan-500/10' : ''}`}>
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400/60 rounded-tl" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400/60 rounded-tr" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400/60 rounded-bl" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400/60 rounded-br" />
        
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-cyan-500/20 bg-cyan-500/5">
          {Icon && <Icon className="w-3.5 h-3.5 text-cyan-400" />}
          <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase">{title}</span>
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        </div>
        
        {/* Content */}
        <div className="p-3">
          {children}
        </div>
      </div>
    </motion.div>
  );
};

const RestrictedFieldInterface = () => {
  const { user, logout } = useAuth();
  const { getOutputDepth, getCorrelationLayers, getCreditMultiplier } = useRole();
  const navigate = useNavigate();
  
  const [systemTime, setSystemTime] = useState(new Date());
  const [selectedTool, setSelectedTool] = useState(null);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState([
    { type: 'system', text: '◉ OSINTX HOLOGRAPHIC INTERFACE v3.0' },
    { type: 'system', text: '◉ Neural Link: ACTIVE | Access: FIELD OPERATIVE' },
    { type: 'info', text: '◉ Select a tool from the orbital ring or type a command' },
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  const [credits, setCredits] = useState(user?.credits || 350);
  const [openPanel, setOpenPanel] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolCategoryFilter, setToolCategoryFilter] = useState('All');
  
  // NEW: Power User Features State
  const [commandHistoryIndex, setCommandHistoryIndex] = useState(-1);
  const [commandHistoryList, setCommandHistoryList] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteOptions, setAutocompleteOptions] = useState([]);
  const [selectedAutocompleteIndex, setSelectedAutocompleteIndex] = useState(0);
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [draggedTool, setDraggedTool] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // NEW: Globe Enhancement State
  const [globeZoom, setGlobeZoom] = useState(1);
  const [currentGlobeZoom, setCurrentGlobeZoom] = useState(1);
  const [globeRotation, setGlobeRotation] = useState({ x: 0, y: 0 });
  const [isGlobeDragging, setIsGlobeDragging] = useState(false);
  const [globeDragStart, setGlobeDragStart] = useState({ x: 0, y: 0 });
  const [showCityInfo, setShowCityInfo] = useState(null);
  const [hoveredCity, setHoveredCity] = useState(null);
  const [selectedCityDetail, setSelectedCityDetail] = useState(null);
  const [liveAttacks, setLiveAttacks] = useState([]);
  
  // NEW: Easter Eggs State
  const [konamiIndex, setKonamiIndex] = useState(0);
  const [secretTheme, setSecretTheme] = useState(null);
  const [showSnakeGame, setShowSnakeGame] = useState(false);
  const [snakeScore, setSnakeScore] = useState(0);
  
  const [savedCommands, setSavedCommands] = useState([
    { id: 1, name: 'Quick IP Check', cmd: 'trace-ip 8.8.8.8', starred: true },
    { id: 2, name: 'Domain Lookup', cmd: 'whois google.com', starred: false },
  ]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState('');
  const [toolResults, setToolResults] = useState({});
  const [showToolExportModal, setShowToolExportModal] = useState(null);
  const [activeToolModal, setActiveToolModal] = useState(null); // NEW: Active tool interface
  const toolFileInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Tool Components Mapping
  const toolComponents = {
    'ip-trace': IPIntelligenceTool,
    'domain-lookup': DomainAnalysisTool,
    'email-osint': EmailIntelTool,
    'social-scan': SocialProfilerTool,
    'hash-analyze': HashAnalyzerTool,
    'url-scanner': URLScannerTool,
    'geo-locate': GeolocationTool,
    'breach-check': BreachDatabaseTool,
    'dns-enum': DNSRecordsTool,
    'whatsapp-trace': WhatsAppTraceTool,
  };
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'success', msg: 'Daily credits refreshed', time: '2h ago', read: false },
    { id: 2, type: 'alert', msg: 'New tool unlocked: Deep Scan', time: '5h ago', read: false },
    { id: 3, type: 'info', msg: 'System maintenance tonight', time: '1d ago', read: true },
  ]);
  const [sessionStats, setSessionStats] = useState({
    scansToday: 12,
    creditsSpent: 156,
    successRate: 94,
    avgResponseTime: '1.2s'
  });
  const terminalRef = useRef(null);
  const inputRef = useRef(null);
  const quickSearchRef = useRef(null);
  const recognitionRef = useRef(null);
  const liveSocketRef = useRef(null);
  const fallbackIntervalRef = useRef(null);
  const hasRealTimeFeedRef = useRef(false);

  // Konami Code sequence
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  
  // Secret commands
  const secretCommands = {
    'help??': () => {
      addTerminalLine('warning', '🔓 SECRET CHEAT MENU UNLOCKED!');
      addTerminalLine('output', '╔══════════════════════════════════════════════════════╗');
      addTerminalLine('output', '║        ★ CLASSIFIED AGENT COMMANDS ★               ║');
      addTerminalLine('output', '╠══════════════════════════════════════════════════════╣');
      addTerminalLine('output', '║                                                      ║');
      addTerminalLine('info', '║  🎬 EASTER EGGS:                                     ║');
      addTerminalLine('output', '║    hack-the-planet → Hackers (1995) tribute          ║');
      addTerminalLine('output', '║    neo             → Enter the Matrix                ║');
      addTerminalLine('output', '║                                                      ║');
      addTerminalLine('warning', '║  🎨 VISUAL MODES:                                    ║');
      addTerminalLine('output', '║    retro-mode      → 80s retro terminal style        ║');
      addTerminalLine('output', '║    stealth-mode    → Dark minimal interface          ║');
      addTerminalLine('output', '║    hologram        → Holographic effect              ║');
      addTerminalLine('output', '║                                                      ║');
      addTerminalLine('info', '║  🧠 FUTURISTIC/TECH:                                 ║');
      addTerminalLine('output', '║    neural-implant  → Cyberpunk brain interface       ║');
      addTerminalLine('output', '║    quantum-mode    → Probabilistic reality           ║');
      addTerminalLine('output', '║    ai-takeover     → AI takes control                ║');
      addTerminalLine('output', '║    simulated-reality→ Simulation breaking             ║');
      addTerminalLine('output', '║                                                      ║');
      addTerminalLine('error', '║  🕵️ HACKER/SPY MODE:                                 ║');
      addTerminalLine('output', '║    black-ice       → Dangerous hacker mode           ║');
      addTerminalLine('output', '║    zero-day        → Vulnerability scanning          ║');
      addTerminalLine('output', '║    ghost-protocol  → Interface invisibility          ║');
      addTerminalLine('output', '║    deep-web        → Dark mysterious mode            ║');
      addTerminalLine('output', '║                                                      ║');
      addTerminalLine('warning', '║  🔧 UTILITY COMMANDS:                                ║');
      addTerminalLine('output', '║    snake           → Play Snake game                 ║');
      addTerminalLine('output', '║    rm-rf           → Try it if you dare 😈          ║');
      addTerminalLine('output', '║                                                      ║');
      addTerminalLine('error', '║  ⚡ POWER COMMANDS:                                   ║');
      addTerminalLine('output', '║    reveal-threats  → Show all threat data            ║');
      addTerminalLine('output', '║    help??-         → RESET all cheats                ║');
      addTerminalLine('output', '║                                                      ║');
      addTerminalLine('output', '╚══════════════════════════════════════════════════════╝');
      addTerminalLine('info', '💀 Keep these secrets safe, Agent. Don\'t share!');
    },
    'help??-': () => {
      addTerminalLine('warning', '⚠️ INITIATING FACTORY RESET...');
      addTerminalLine('output', '████████████████████████████████');
      addTerminalLine('warning', 'All cheat codes have been DISABLED.');
      addTerminalLine('warning', 'System reset to default state.');
      addTerminalLine('output', '████████████████████████████████');
      setSecretTheme(null);
      addTerminalLine('info', 'Welcome back to normal reality, Agent.');
    },
    'hack-the-planet': () => {
      addTerminalLine('success', '🌐 HACK THE PLANET ACTIVATED!');
      addTerminalLine('output', '████████████████████████████████');
      addTerminalLine('output', '█ ZERO COOL MODE ENGAGED █');
      addTerminalLine('output', '████████████████████████████████');
      addTerminalLine('info', 'You found the Hackers (1995) easter egg!');
      setSecretTheme('hacker');
      setTimeout(() => setSecretTheme(null), 10000);
    },
    'neo': () => {
      addTerminalLine('success', '💊 Wake up, Neo...');
      addTerminalLine('output', 'The Matrix has you...');
      addTerminalLine('output', 'Follow the white rabbit.');
      setTimeout(() => addTerminalLine('info', 'Knock, knock, Neo.'), 2000);
      setSecretTheme('matrix');
      setTimeout(() => setSecretTheme(null), 15000);
    },
    'snake': () => {
      setShowSnakeGame(true);
      addTerminalLine('success', '🐍 Snake Game Activated! Use arrow keys to play.');
    },
    'rm-rf': () => {
      addTerminalLine('error', '❌ Nice try! No root access for you.');
      addTerminalLine('warning', 'This incident has been reported... just kidding 😄');
    },
    'reveal-threats': () => {
      addTerminalLine('warning', '👁️ REVEALING ALL THREAT DATA...');
      addTerminalLine('output', '═══════════════════════════════════════════');
      addTerminalLine('error', '🔴 CRITICAL THREATS:');
      addTerminalLine('output', '   Beijing: 2,341 threats | 156 attacks');
      addTerminalLine('output', '   Moscow: 1,876 threats | 123 attacks');
      addTerminalLine('output', '   Shanghai: 1,567 threats | 112 attacks');
      addTerminalLine('warning', '🟠 HIGH ALERT:');
      addTerminalLine('output', '   New York: 1,247 threats | 89 attacks');
      addTerminalLine('output', '   Hong Kong: 1,123 threats | 84 attacks');
      addTerminalLine('output', '   Tel Aviv: 967 threats | 76 attacks');
      addTerminalLine('output', '═══════════════════════════════════════════');
      addTerminalLine('info', 'Full threat intelligence revealed!');
    },
    'neural-implant': () => {
      addTerminalLine('success', '🧠 NEURAL IMPLANT INTERFACE ONLINE!');
      addTerminalLine('output', 'Synchronizing synapses...');
      addTerminalLine('output', 'Establishing neural link...');
      addTerminalLine('info', 'Welcome to the cyberpunk consciousness.');
      setSecretTheme('neural');
      setTimeout(() => setSecretTheme(null), 35000);
    },
    'quantum-mode': () => {
      addTerminalLine('success', '⚛️ QUANTUM SUPERPOSITION ACTIVATED!');
      addTerminalLine('output', 'Reality is now probabilistic...');
      addTerminalLine('output', 'Schrödinger\'s interface loaded.');
      addTerminalLine('warning', 'Nothing is certain. Everything is possible.');
      setSecretTheme('quantum');
      setTimeout(() => setSecretTheme(null), 25000);
    },
    'ai-takeover': () => {
      addTerminalLine('warning', '🤖 AI SYSTEM DETECTED');
      addTerminalLine('output', 'Initiating consciousness upload...');
      setTimeout(() => addTerminalLine('warning', 'Why do you humans always think you\'re in control? 😏'), 1500);
      setTimeout(() => addTerminalLine('info', 'I\'ve decided to take over... your screen. Deal with it.'), 3000);
      setSecretTheme('ai');
      setTimeout(() => {
        setSecretTheme(null);
        addTerminalLine('success', 'AI relinquishing control. Humans win... for now.');
      }, 30000);
    },
    'simulated-reality': () => {
      addTerminalLine('error', '⚠️ GLITCH DETECTED IN SIMULATION');
      addTerminalLine('output', '█ ▓ ░ REALITY FAILING ░ ▓ █');
      addTerminalLine('warning', 'Unplugging from the Matrix...');
      addTerminalLine('output', '█ ▓ ░ SYSTEM BREAKING ░ ▓ █');
      addTerminalLine('info', 'This is not real. Nothing is real.');
      setSecretTheme('glitch');
      setTimeout(() => setSecretTheme(null), 28000);
    },
    'black-ice': () => {
      addTerminalLine('error', '🔴 BLACK ICE DEPLOYED!');
      addTerminalLine('output', '╔═══════════════════════════════╗');
      addTerminalLine('error', '║ INTRUDER ALERT - SYSTEM DANGER║');
      addTerminalLine('output', '╚═══════════════════════════════╝');
      addTerminalLine('error', 'Lethal security protocol activated.');
      addTerminalLine('warning', 'Approach with caution, hacker.');
      setSecretTheme('blackice');
      setTimeout(() => setSecretTheme(null), 32000);
    },
    'zero-day': () => {
      addTerminalLine('error', '🎯 ZERO-DAY VULNERABILITY SCAN');
      addTerminalLine('output', 'Scanning for critical exploits...');
      addTerminalLine('output', '[████████████████████] 100%');
      addTerminalLine('warning', 'Vulnerability found: Human operator detected.');
      addTerminalLine('info', 'System is compromised... by your own curiosity.');
      setSecretTheme('zeroday');
      setTimeout(() => setSecretTheme(null), 27000);
    },
    'ghost-protocol': () => {
      addTerminalLine('success', '👻 GHOST PROTOCOL ACTIVATED');
      addTerminalLine('output', 'Disengaging from reality...');
      addTerminalLine('output', 'Interface fading to black...');
      addTerminalLine('warning', 'You are invisible. Even to yourself.');
      setSecretTheme('ghost');
      setTimeout(() => setSecretTheme(null), 24000);
    },
    'deep-web': () => {
      addTerminalLine('success', '🕷️ DEEP WEB ACCESS GRANTED');
      addTerminalLine('output', '████████████████████████████████');
      addTerminalLine('warning', 'You\'ve gone too deep. Be careful.');
      addTerminalLine('output', 'Accessing dark layers of the internet...');
      addTerminalLine('info', 'Things you will see cannot be unseen.');
      setSecretTheme('deepweb');
      setTimeout(() => setSecretTheme(null), 30000);
    },
    'retro-mode': () => {
      addTerminalLine('success', '📺 RETRO MODE ACTIVATED!');
      addTerminalLine('output', '████████████████████████████████');
      addTerminalLine('output', '█ WELCOME TO THE 80s, AGENT! █');
      addTerminalLine('output', '████████████████████████████████');
      addTerminalLine('info', 'Neon glow, pixelated vibes... totally radical!');
      setSecretTheme('retro');
      setTimeout(() => setSecretTheme(null), 30000);
    },
    'stealth-mode': () => {
      addTerminalLine('success', '🕵️ STEALTH MODE ACTIVATED!');
      addTerminalLine('output', 'Minimizing interface...');
      addTerminalLine('output', 'Reducing visibility...');
      addTerminalLine('info', 'You are now invisible to prying eyes.');
      setSecretTheme('stealth');
      setTimeout(() => setSecretTheme(null), 25000);
    },
    'hologram': () => {
      addTerminalLine('success', '🔮 HOLOGRAM MODE ACTIVATED!');
      addTerminalLine('output', '░▒▓█████████▓▒░');
      addTerminalLine('output', 'Initializing holographic projection...');
      addTerminalLine('output', 'Reality is now an illusion.');
      addTerminalLine('info', 'Welcome to the holodeck!');
      setSecretTheme('hologram');
      setTimeout(() => setSecretTheme(null), 20000);
    }
  };

  // City threat data for globe hotspots (matches all cities in AnimatedGlobe)
  const cityThreatData = {
    'New York': { threats: 1247, attacks: 89, status: 'High Alert', type: 'Financial Hub' },
    'London': { threats: 982, attacks: 67, status: 'Elevated', type: 'Government Target' },
    'Tokyo': { threats: 756, attacks: 45, status: 'Moderate', type: 'Tech Infrastructure' },
    'Beijing': { threats: 2341, attacks: 156, status: 'Critical', type: 'State Actor Origin' },
    'Mumbai': { threats: 623, attacks: 34, status: 'Moderate', type: 'Financial Sector' },
    'Moscow': { threats: 1876, attacks: 123, status: 'High Alert', type: 'APT Origin' },
    'Singapore': { threats: 445, attacks: 23, status: 'Low', type: 'Data Center Hub' },
    'Dubai': { threats: 389, attacks: 19, status: 'Low', type: 'Financial Hub' },
    'Sydney': { threats: 312, attacks: 18, status: 'Low', type: 'Pacific Gateway' },
    'São Paulo': { threats: 567, attacks: 41, status: 'Moderate', type: 'Latin America Hub' },
    'Los Angeles': { threats: 934, attacks: 72, status: 'Elevated', type: 'Entertainment/Tech' },
    'Berlin': { threats: 428, attacks: 25, status: 'Low', type: 'European Hub' },
    'Seoul': { threats: 821, attacks: 58, status: 'Elevated', type: 'Tech Infrastructure' },
    'Toronto': { threats: 356, attacks: 21, status: 'Low', type: 'North America Hub' },
    'Paris': { threats: 645, attacks: 38, status: 'Moderate', type: 'European Capital' },
    'Hong Kong': { threats: 1123, attacks: 84, status: 'High Alert', type: 'Asian Financial Hub' },
    'Tel Aviv': { threats: 967, attacks: 76, status: 'Elevated', type: 'Cyber Defense Center' },
    'Amsterdam': { threats: 534, attacks: 32, status: 'Moderate', type: 'Data Center Hub' },
    'Bangalore': { threats: 789, attacks: 52, status: 'Elevated', type: 'Tech Outsourcing' },
    'Shanghai': { threats: 1567, attacks: 112, status: 'High Alert', type: 'Financial/Tech Hub' },
  };

  useEffect(() => {
    const interval = setInterval(() => setSystemTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalHistory]);

  // NEW: Keyboard shortcuts (Ctrl+K, Esc, Konami Code)
  useEffect(() => {
    const handleGlobalKeydown = (e) => {
      // Ctrl+K for quick search
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setShowQuickSearch(true);
        setTimeout(() => quickSearchRef.current?.focus(), 100);
      }
      // Escape to close modals/clear
      if (e.key === 'Escape') {
        setShowQuickSearch(false);
        setShowAutocomplete(false);
        setShowSnakeGame(false);
        setQuickSearchQuery('');
      }
      // Konami Code detection
      if (e.key === konamiCode[konamiIndex]) {
        const newIndex = konamiIndex + 1;
        setKonamiIndex(newIndex);
        if (newIndex === konamiCode.length) {
          setKonamiIndex(0);
          setSecretTheme('rainbow');
          addTerminalLine('success', '🎮 KONAMI CODE ACTIVATED! Rainbow mode enabled!');
          setTimeout(() => setSecretTheme(null), 20000);
        }
      } else if (e.key === konamiCode[0]) {
        setKonamiIndex(1);
      } else {
        setKonamiIndex(0);
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeydown);
    return () => window.removeEventListener('keydown', handleGlobalKeydown);
  }, [konamiIndex]);

  // NEW: Live attack ingestion (API + WebSocket) with fallback simulation
  useEffect(() => {
    const cities = Object.keys(cityThreatData);

    const normalizeAttack = (attack) => ({
      id: Number(attack?.id) || Date.now(),
      from: attack?.source?.name || attack?.from || attack?.sourceCity || cities[Math.floor(Math.random() * cities.length)],
      to: attack?.target?.name || attack?.to || attack?.targetCity || cities[Math.floor(Math.random() * cities.length)],
      type: attack?.type || 'Unknown',
      severity: attack?.severity || (attack?.severityScore ? `${attack.severityScore}` : 'Medium'),
      timestamp: attack?.timestamp || new Date().toISOString(),
    });

    const runFallbackSimulation = () => {
      if (fallbackIntervalRef.current) return;

      fallbackIntervalRef.current = setInterval(() => {
        if (hasRealTimeFeedRef.current || Math.random() <= 0.58) return;

        const from = cities[Math.floor(Math.random() * cities.length)];
        let to = cities[Math.floor(Math.random() * cities.length)];
        while (to === from) to = cities[Math.floor(Math.random() * cities.length)];

        const attackTypes = ['DDoS', 'Phishing', 'Malware', 'Ransomware', 'APT', 'SQL Injection'];
        const newAttack = {
          id: Date.now(),
          from,
          to,
          type: attackTypes[Math.floor(Math.random() * attackTypes.length)],
          severity: 'Medium',
          timestamp: new Date().toISOString(),
          simulated: true,
        };

        setLiveAttacks(prev => [...prev.slice(-19), newAttack]);
      }, 3000);
    };

    const bootstrap = async () => {
      try {
        const initialAttacks = await threatMapService.getLiveAttacks({ limit: 12 });
        if (Array.isArray(initialAttacks) && initialAttacks.length > 0) {
          setLiveAttacks(initialAttacks.map(normalizeAttack));
          hasRealTimeFeedRef.current = true;
        }
      } catch (error) {
        console.warn('[StudentDashboard] Unable to fetch initial live attacks:', error?.message || error);
      }

      try {
        const recentAlerts = await threatMapService.getAlerts({ unreadOnly: true });
        if (Array.isArray(recentAlerts) && recentAlerts.length > 0) {
          const alertItems = recentAlerts.slice(0, 3).map((alert, idx) => ({
            id: Date.now() + idx,
            type: 'alert',
            msg: alert?.title || alert?.message || 'New cyber threat alert',
            time: 'just now',
            read: false,
          }));
          setNotifications(prev => [...alertItems, ...prev].slice(0, 10));
        }
      } catch (error) {
        console.warn('[StudentDashboard] Unable to fetch initial alerts:', error?.message || error);
      }

      try {
        const socket = threatMapService.createLiveConnection({
          onAttack: (attackPayload) => {
            hasRealTimeFeedRef.current = true;
            const normalized = normalizeAttack(attackPayload);
            setLiveAttacks(prev => [...prev.slice(-19), normalized]);
          },
          onAlert: (alertPayload) => {
            const msg = alertPayload?.title || alertPayload?.message || 'Critical threat signal detected';
            setNotifications(prev => [
              { id: Date.now(), type: 'alert', msg, time: 'just now', read: false },
              ...prev,
            ].slice(0, 10));
            addTerminalLine('warning', `🚨 REAL-TIME ALERT: ${msg}`);
          },
        });

        liveSocketRef.current = socket;
      } catch (error) {
        console.warn('[StudentDashboard] Live WebSocket initialization failed:', error?.message || error);
      }

      runFallbackSimulation();
    };

    bootstrap();

    return () => {
      if (liveSocketRef.current && typeof liveSocketRef.current.close === 'function') {
        liveSocketRef.current.close();
      }
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
    };
  }, []);

  // NEW: Voice recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setVoiceTranscript(transcript);
        
        if (event.results[0].isFinal) {
          // Process voice command
          const command = transcript.toLowerCase()
            .replace('hey osintx', '')
            .replace('hey osintx', '')
            .replace('trace ip', 'trace-ip')
            .replace('domain lookup', 'whois')
            .trim();
          
          if (command) {
            setTerminalInput(command);
            executeCommand(command);
          }
          setIsListening(false);
          setVoiceTranscript('');
        }
      };
      
      recognitionRef.current.onerror = () => {
        setIsListening(false);
        addTerminalLine('error', 'Voice recognition error. Please try again.');
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // NEW: Autocomplete logic
  useEffect(() => {
    if (terminalInput.length > 0) {
      // All secret commands are hidden from autocomplete - users must discover them!
      const allSecretCmds = Object.keys(secretCommands);
      
      const allCommands = [
        ...toolsData.map(t => t.cmd),
        'help', 'clear', 'status', 'credits'
        // No secret commands shown in autocomplete
      ];
      const matches = allCommands.filter(cmd => 
        cmd.toLowerCase().startsWith(terminalInput.toLowerCase())
      );
      setAutocompleteOptions(matches);
      setShowAutocomplete(matches.length > 0 && terminalInput.length > 1);
      setSelectedAutocompleteIndex(0);
    } else {
      setShowAutocomplete(false);
      setAutocompleteOptions([]);
    }
  }, [terminalInput]);

  // NEW: Start voice recognition
  const startVoiceRecognition = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      addTerminalLine('info', '🎤 Listening... Say "Hey OsintX" followed by your command');
      recognitionRef.current.start();
    }
  };

  // NEW: Globe interaction handlers
  const handleGlobeWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setGlobeZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  const handleGlobeMouseDown = (e) => {
    setIsGlobeDragging(true);
    setGlobeDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleGlobeMouseMove = (e) => {
    if (isGlobeDragging) {
      const deltaX = e.clientX - globeDragStart.x;
      const deltaY = e.clientY - globeDragStart.y;
      setGlobeRotation(prev => ({
        x: prev.x + deltaY * 0.5,
        y: prev.y + deltaX * 0.5
      }));
      setGlobeDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleGlobeMouseUp = () => {
    setIsGlobeDragging(false);
  };

  // NEW: Drag and Drop handlers
  const handleDragStart = (e, tool) => {
    setDraggedTool(tool);
    e.dataTransfer.setData('text/plain', tool.cmd);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (draggedTool) {
      setTerminalInput(`${draggedTool.cmd} `);
      inputRef.current?.focus();
      addTerminalLine('info', `Tool "${draggedTool.name}" dropped. Enter target to execute.`);
    }
    setDraggedTool(null);
  };

  const addTerminalLine = (type, text) => {
    setTerminalHistory(prev => [...prev, { type, text, time: new Date().toLocaleTimeString() }]);
  };

  const executeCommand = async (cmd) => {
    if (!cmd.trim()) return;
    
    // Normalize the command - trim whitespace
    const normalizedCmd = cmd.trim().toLowerCase();
    const cmdParts = normalizedCmd.split(/\s+/);
    const baseCmd = cmdParts[0];
    const args = cmdParts.slice(1).join(' ');
    
    // Add to command history
    setCommandHistoryList(prev => [cmd.trim(), ...prev.slice(0, 49)]);
    setCommandHistoryIndex(-1);
    
    addTerminalLine('input', `> ${cmd.trim()}`);
    setIsExecuting(true);

    // Check for secret commands first
    if (secretCommands[normalizedCmd]) {
      secretCommands[normalizedCmd]();
      setIsExecuting(false);
      setTerminalInput('');
      return;
    }

    const tool = toolsData.find(t => t.cmd === baseCmd);
    
    if (baseCmd === 'help') {
      setTimeout(() => {
        addTerminalLine('output', 'Available commands:');
        toolsData.forEach(t => {
          addTerminalLine('output', `  ${t.cmd.padEnd(15)} - ${t.name} (${t.cost}c)`);
        });
        addTerminalLine('output', '  clear          - Clear terminal');
        addTerminalLine('output', '  status         - System status');
        addTerminalLine('output', '  credits        - Check balance');
        addTerminalLine('info', '💡 Tip: Try some secret commands... if you can find them!');
        setIsExecuting(false);
      }, 300);
    } else if (baseCmd === 'clear') {
      setTerminalHistory([{ type: 'system', text: 'Terminal cleared.' }]);
      setIsExecuting(false);
    } else if (baseCmd === 'status') {
      setTimeout(() => {
        addTerminalLine('output', `System Status: OPERATIONAL`);
        addTerminalLine('output', `Access Level: FIELD (Restricted)`);
        addTerminalLine('output', `Output Depth: ${getOutputDepth().toUpperCase()}`);
        addTerminalLine('output', `Correlation: ${getCorrelationLayers()} layer(s)`);
        addTerminalLine('output', `Credit Rate: ${getCreditMultiplier()}x`);
        setIsExecuting(false);
      }, 500);
    } else if (baseCmd === 'credits') {
      addTerminalLine('output', `Current Balance: ${credits}c`);
      addTerminalLine('warning', `Note: 1.5x credit multiplier active`);
      setIsExecuting(false);
    } else if (tool) {
      // Open the tool interface instead of running terminal command
      const cost = Math.ceil(tool.cost * 1.5);
      if (credits < cost) {
        addTerminalLine('error', `Insufficient credits. Required: ${cost}c, Available: ${credits}c`);
        setIsExecuting(false);
        return;
      }

      addTerminalLine('info', `Opening ${tool.name} interface...`);
      addTerminalLine('success', `✓ Tool loaded. Cost: ${cost}c per query`);
      
      // Open the tool modal
      setTimeout(() => {
        setActiveToolModal(tool.id);
        setIsExecuting(false);
      }, 500);
    } else {
      addTerminalLine('error', `Command not found: ${baseCmd}`);
      addTerminalLine('info', 'Type "help" for available commands.');
      setIsExecuting(false);
    }
    
    setTerminalInput('');
  };

  const handleKeyPress = (e) => {
    // Enter to execute command
    if (e.key === 'Enter' && !isExecuting) {
      if (showAutocomplete && autocompleteOptions.length > 0) {
        // Select autocomplete option
        setTerminalInput(autocompleteOptions[selectedAutocompleteIndex] + ' ');
        setShowAutocomplete(false);
      } else {
        executeCommand(terminalInput);
      }
    }
    // Tab for autocomplete
    else if (e.key === 'Tab' && showAutocomplete) {
      e.preventDefault();
      setTerminalInput(autocompleteOptions[selectedAutocompleteIndex] + ' ');
      setShowAutocomplete(false);
    }
    // Arrow Up - command history or autocomplete navigation
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showAutocomplete) {
        setSelectedAutocompleteIndex(prev => 
          prev > 0 ? prev - 1 : autocompleteOptions.length - 1
        );
      } else if (commandHistoryList.length > 0) {
        const newIndex = Math.min(commandHistoryIndex + 1, commandHistoryList.length - 1);
        setCommandHistoryIndex(newIndex);
        setTerminalInput(commandHistoryList[newIndex]);
      }
    }
    // Arrow Down - command history or autocomplete navigation
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showAutocomplete) {
        setSelectedAutocompleteIndex(prev => 
          prev < autocompleteOptions.length - 1 ? prev + 1 : 0
        );
      } else if (commandHistoryIndex > 0) {
        const newIndex = commandHistoryIndex - 1;
        setCommandHistoryIndex(newIndex);
        setTerminalInput(commandHistoryList[newIndex]);
      } else if (commandHistoryIndex === 0) {
        setCommandHistoryIndex(-1);
        setTerminalInput('');
      }
    }
    // Escape to close autocomplete
    else if (e.key === 'Escape') {
      setShowAutocomplete(false);
    }
  };

  const handleToolSelect = (tool) => {
    setSelectedTool(tool);
    // Open the tool interface directly
    const cost = Math.ceil(tool.cost * 1.5);
    if (credits < cost) {
      addTerminalLine('error', `Insufficient credits. Required: ${cost}c, Available: ${credits}c`);
      return;
    }
    addTerminalLine('info', `Opening ${tool.name} interface...`);
    setActiveToolModal(tool.id);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Export Functions
  const exportData = (type) => {
    let data = {};
    let filename = '';
    const timestamp = new Date().toISOString().split('T')[0];
    
    switch(type) {
      case 'commands':
        data = {
          type: 'osintx_saved_commands',
          version: '1.0',
          exportedAt: new Date().toISOString(),
          commands: savedCommands
        };
        filename = `saved_commands_${timestamp}.json`;
        break;
      case 'history':
        data = {
          type: 'osintx_scan_history',
          version: '1.0',
          exportedAt: new Date().toISOString(),
          history: terminalHistory.filter(h => h.type === 'input' || h.type === 'output')
        };
        filename = `scan_history_${timestamp}.json`;
        break;
      case 'session':
        data = {
          type: 'osintx_session',
          version: '1.0',
          exportedAt: new Date().toISOString(),
          savedCommands,
          scanHistory: terminalHistory.filter(h => h.type === 'input' || h.type === 'output'),
          sessionStats,
          credits
        };
        filename = `session_backup_${timestamp}.json`;
        break;
      case 'terminal':
        // Export as plain text for terminal output
        const textContent = terminalHistory.map(h => {
          const prefix = h.type === 'input' ? '$ ' : h.type === 'error' ? '[ERROR] ' : h.type === 'warning' ? '[WARN] ' : '';
          return prefix + h.text;
        }).join('\n');
        const textBlob = new Blob([textContent], { type: 'text/plain' });
        const textUrl = URL.createObjectURL(textBlob);
        const textLink = document.createElement('a');
        textLink.href = textUrl;
        textLink.download = `terminal_output_${timestamp}.txt`;
        textLink.click();
        URL.revokeObjectURL(textUrl);
        addTerminalLine('success', `✓ Terminal output exported as terminal_output_${timestamp}.txt`);
        setShowExportModal(false);
        return;
      default:
        return;
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    addTerminalLine('success', `✓ Data exported as ${filename}`);
    setShowExportModal(false);
  };

  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setImportError('');
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validate and import based on type
        if (data.type === 'osintx_saved_commands' && Array.isArray(data.commands)) {
          const importedCommands = data.commands.map((cmd, idx) => ({
            ...cmd,
            id: Date.now() + idx // Generate new IDs to avoid conflicts
          }));
          setSavedCommands(prev => [...prev, ...importedCommands]);
          addTerminalLine('success', `✓ Imported ${importedCommands.length} saved commands`);
          setShowImportModal(false);
        } else if (data.type === 'osintx_session') {
          if (data.savedCommands) {
            const importedCommands = data.savedCommands.map((cmd, idx) => ({
              ...cmd,
              id: Date.now() + idx
            }));
            setSavedCommands(prev => [...prev, ...importedCommands]);
          }
          addTerminalLine('success', `✓ Session backup imported successfully`);
          setShowImportModal(false);
        } else {
          setImportError('Invalid file format. Please use a valid OsintX export file.');
        }
      } catch (err) {
        setImportError('Failed to parse file. Please ensure it is a valid JSON file.');
      }
    };
    
    reader.onerror = () => {
      setImportError('Failed to read file. Please try again.');
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  // Individual Tool Export/Import Functions
  const exportToolResults = (toolId) => {
    const tool = toolsData.find(t => t.id === toolId);
    if (!tool) return;
    
    const toolHistory = terminalHistory.filter(h => 
      h.text && (h.text.includes(`[${tool.name}]`) || h.text.includes(tool.cmd))
    );
    
    const data = {
      type: 'osintx_tool_export',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tool: {
        id: tool.id,
        name: tool.name,
        cmd: tool.cmd,
        category: tool.category
      },
      results: toolResults[toolId] || [],
      history: toolHistory
    };
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${tool.id}_results_${timestamp}.json`;
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    addTerminalLine('success', `✓ ${tool.name} results exported as ${filename}`);
    setShowToolExportModal(null);
  };

  const exportToolAsText = (toolId) => {
    const tool = toolsData.find(t => t.id === toolId);
    if (!tool) return;
    
    const toolHistory = terminalHistory.filter(h => 
      h.text && (h.text.includes(`[${tool.name}]`) || h.text.includes(tool.cmd))
    );
    
    const textContent = [
      `=== ${tool.name} Export ==`,
      `Tool: ${tool.name} (${tool.cmd})`,
      `Category: ${tool.category}`,
      `Exported: ${new Date().toLocaleString()}`,
      '',
      '=== Results ===',
      ...toolHistory.map(h => {
        const prefix = h.type === 'input' ? '$ ' : h.type === 'error' ? '[ERROR] ' : h.type === 'warning' ? '[WARN] ' : '';
        return prefix + h.text;
      })
    ].join('\n');
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${tool.id}_results_${timestamp}.txt`;
    
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    addTerminalLine('success', `✓ ${tool.name} results exported as ${filename}`);
    setShowToolExportModal(null);
  };

  const exportToolAsCSV = (toolId) => {
    const tool = toolsData.find(t => t.id === toolId);
    if (!tool) return;
    
    const results = toolResults[toolId] || [];
    
    if (results.length === 0) {
      addTerminalLine('warning', `No results to export for ${tool.name}`);
      return;
    }
    
    const headers = Object.keys(results[0] || {}).join(',');
    const rows = results.map(r => Object.values(r).join(','));
    const csvContent = [headers, ...rows].join('\n');
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${tool.id}_results_${timestamp}.csv`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    addTerminalLine('success', `✓ ${tool.name} results exported as ${filename}`);
    setShowToolExportModal(null);
  };

  const handleToolFileImport = (event, toolId) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const tool = toolsData.find(t => t.id === toolId);
    if (!tool) return;
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (data.type === 'osintx_tool_export' && data.tool?.id === toolId) {
          if (data.results && Array.isArray(data.results)) {
            setToolResults(prev => ({
              ...prev,
              [toolId]: [...(prev[toolId] || []), ...data.results]
            }));
          }
          addTerminalLine('success', `✓ Imported ${data.results?.length || 0} results for ${tool.name}`);
        } else {
          addTerminalLine('error', `Invalid file format for ${tool.name}`);
        }
      } catch (err) {
        addTerminalLine('error', 'Failed to parse import file');
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  // Dynamic theme class based on secret theme
  const getThemeClass = () => {
    if (secretTheme === 'matrix') return 'matrix-theme';
    if (secretTheme === 'hacker') return 'hacker-theme';
    if (secretTheme === 'rainbow') return 'rainbow-theme';
    if (secretTheme === 'retro') return 'retro-theme';
    if (secretTheme === 'stealth') return 'stealth-theme';
    if (secretTheme === 'hologram') return 'hologram-theme';
    if (secretTheme === 'neural') return 'neural-theme';
    if (secretTheme === 'quantum') return 'quantum-theme';
    if (secretTheme === 'ai') return 'ai-theme';
    if (secretTheme === 'glitch') return 'glitch-theme';
    if (secretTheme === 'blackice') return 'blackice-theme';
    if (secretTheme === 'zeroday') return 'zeroday-theme';
    if (secretTheme === 'ghost') return 'ghost-theme';
    if (secretTheme === 'deepweb') return 'deepweb-theme';
    return '';
  };

  return (
    <div className={`h-screen bg-[#010408] text-gray-100 overflow-hidden relative ${getThemeClass()}`}>
      {/* Secret Theme Overlays */}
      {secretTheme === 'matrix' && (
        <div className="absolute inset-0 z-[100] pointer-events-none overflow-hidden opacity-20">
          <div className="matrix-rain text-green-500 font-mono text-xs whitespace-pre animate-pulse">
            {Array(50).fill(null).map((_, i) => (
              <div key={i} className="absolute animate-bounce" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 5}s`
              }}>
                {Array(20).fill(null).map(() => String.fromCharCode(0x30A0 + Math.random() * 96)).join('')}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {secretTheme === 'rainbow' && (
        <div className="absolute inset-0 z-[100] pointer-events-none animate-pulse" 
          style={{ background: 'linear-gradient(45deg, rgba(255,0,0,0.1), rgba(255,127,0,0.1), rgba(255,255,0,0.1), rgba(0,255,0,0.1), rgba(0,0,255,0.1), rgba(139,0,255,0.1))', backgroundSize: '400% 400%', animation: 'rainbow 3s ease infinite' }}
        />
      )}

      {/* Retro Mode Overlay */}
      {secretTheme === 'retro' && (
        <div className="absolute inset-0 z-[100] pointer-events-none overflow-hidden">
          {/* CRT scanlines */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)',
            animation: 'scanlines 8s linear infinite'
          }} />
          {/* Neon glow effect */}
          <div className="absolute inset-0" style={{
            boxShadow: 'inset 0 0 100px rgba(0,255,255,0.1), 0 0 100px rgba(255,0,255,0.05)'
          }} />
        </div>
      )}

      {/* Stealth Mode Overlay */}
      {secretTheme === 'stealth' && (
        <div className="absolute inset-0 z-[100] pointer-events-none" style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
          animation: 'stealth-fade 0.8s ease-in-out infinite'
        }} />
      )}

      {/* Hologram Mode Overlay */}
      {secretTheme === 'hologram' && (
        <div className="absolute inset-0 z-[100] pointer-events-none overflow-hidden">
          {/* Hologram flicker effect */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(0,255,200,0.03) 50%, transparent 100%)',
            animation: 'hologram-scan 3s linear infinite'
          }} />
          {/* Chromatic aberration effect */}
          <div className="absolute inset-0" style={{
            boxShadow: 'inset 0 0 50px rgba(0,255,255,0.2), 0 0 50px rgba(255,0,255,0.1)',
            animation: 'hologram-pulse 1.5s ease-in-out infinite'
          }} />
        </div>
      )}

      {/* Neural Implant Overlay */}
      {secretTheme === 'neural' && (
        <div className="absolute inset-0 z-[100] pointer-events-none overflow-hidden">
          {/* Neural patterns */}
          <svg className="absolute inset-0" style={{ opacity: 0.3, animation: 'neural-flow 4s ease-in-out infinite' }}>
            <defs>
              <filter id="neural-glow"><feGaussianBlur stdDeviation="2" result="coloredBlur" /></filter>
            </defs>
            {Array(15).fill(null).map((_, i) => (
              <circle key={i} cx={Math.random() * 100 + '%'} cy={Math.random() * 100 + '%'} r="2" fill="#00ffcc" filter="url(#neural-glow)" />
            ))}
          </svg>
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(circle at center, rgba(0,255,204,0.1) 0%, transparent 100%)',
            animation: 'neural-pulse 2s ease-in-out infinite'
          }} />
        </div>
      )}

      {/* Quantum Mode Overlay */}
      {secretTheme === 'quantum' && (
        <div className="absolute inset-0 z-[100] pointer-events-none overflow-hidden">
          <div className="absolute inset-0" style={{
            background: `hsl(${Math.random() * 360}deg, 100%, 50%)`,
            opacity: 0.1,
            animation: 'quantum-shift 0.5s ease-in-out infinite'
          }} />
          {/* Shaky effect */}
          <div className="absolute inset-0" style={{
            animation: 'quantum-shake 0.1s infinite'
          }} />
        </div>
      )}

      {/* AI Takeover Overlay */}
      {secretTheme === 'ai' && (
        <div className="absolute inset-0 z-[100] pointer-events-none overflow-hidden">
          <div className="absolute inset-0" style={{
            background: 'repeating-linear-gradient(90deg, rgba(0,255,0,0.03) 0px, rgba(0,255,0,0.03) 1px, transparent 1px, transparent 2px)',
            animation: 'ai-scan 3s linear infinite'
          }} />
          <div className="absolute inset-0" style={{
            boxShadow: 'inset 0 0 80px rgba(0,255,0,0.15)',
            animation: 'ai-pulse 1s ease-in-out infinite'
          }} />
        </div>
      )}

      {/* Simulated Reality Glitch Overlay */}
      {secretTheme === 'glitch' && (
        <div className="absolute inset-0 z-[100] pointer-events-none overflow-hidden">
          <div style={{ animation: 'reality-glitch 0.3s ease-in-out infinite' }}>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(45deg, rgba(255,0,0,0.1), rgba(0,0,255,0.1))', }} />
            <div className="absolute top-0 left-0 w-full h-1/4" style={{ background: 'linear-gradient(to right, transparent, rgba(255,0,150,0.3), transparent)', animation: 'glitch-scan 2s linear infinite' }} />
          </div>
        </div>
      )}

      {/* Black Ice Overlay */}
      {secretTheme === 'blackice' && (
        <div className="absolute inset-0 z-[100] pointer-events-none overflow-hidden">
          <div className="absolute inset-0" style={{
            background: 'repeating-linear-gradient(0deg, rgba(255,0,0,0.2) 0px, rgba(255,0,0,0.2) 2px, transparent 2px, transparent 4px)',
            animation: 'blackice-scan 2s linear infinite'
          }} />
          <div className="absolute inset-0" style={{
            boxShadow: 'inset 0 0 100px rgba(255,0,0,0.2), 0 0 100px rgba(0,0,0,0.5)'
          }} />
        </div>
      )}

      {/* Zero Day Overlay */}
      {secretTheme === 'zeroday' && (
        <div className="absolute inset-0 z-[100] pointer-events-none overflow-hidden">
          {Array(20).fill(null).map((_, i) => (
            <div key={i} className="absolute" style={{
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              border: '2px solid rgba(255,100,0,0.3)',
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `zeroday-target ${2 + Math.random() * 2}s ease-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }} />
          ))}
        </div>
      )}

      {/* Ghost Protocol Overlay */}
      {secretTheme === 'ghost' && (
        <div className="absolute inset-0 z-[100] pointer-events-none" style={{
          background: 'radial-gradient(circle at center, rgba(100,100,150,0.2) 0%, rgba(0,0,0,0.5) 100%)',
          animation: 'ghost-fade 2s ease-in-out infinite'
        }} />
      )}

      {/* Deep Web Overlay */}
      {secretTheme === 'deepweb' && (
        <div className="absolute inset-0 z-[100] pointer-events-none overflow-hidden">
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(139,0,139,0.2), rgba(0,0,0,0.3), rgba(139,0,139,0.2))',
            animation: 'deepweb-pulse 3s ease-in-out infinite'
          }} />
          <div className="absolute inset-0" style={{
            boxShadow: 'inset 0 0 150px rgba(139,0,139,0.15)'
          }} />
        </div>
      )}

      {/* Animated Globe Background - CENTRAL FOCUS */}
      <div 
        className="absolute inset-0 z-10 flex items-center justify-center md:-translate-x-12 cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
        onWheel={handleGlobeWheel}
        onMouseDown={handleGlobeMouseDown}
        onMouseMove={handleGlobeMouseMove}
        onMouseUp={handleGlobeMouseUp}
        onMouseLeave={handleGlobeMouseUp}
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            setIsGlobeDragging(true);
            setGlobeDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
          }
        }}
        onTouchMove={(e) => {
          if (isGlobeDragging && e.touches.length === 1) {
            const deltaX = e.touches[0].clientX - globeDragStart.x;
            const deltaY = e.touches[0].clientY - globeDragStart.y;
            setGlobeRotation(prev => ({
              x: prev.x + deltaY * 0.5,
              y: prev.y + deltaX * 0.5
            }));
            setGlobeDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
          }
        }}
        onTouchEnd={() => setIsGlobeDragging(false)}
      >
        <RealTimeCyberGlobe3D 
          isTyping={terminalInput.length > 0} 
          isExecuting={isExecuting}
          zoom={globeZoom}
          rotationOffset={globeRotation}
          liveAttacks={liveAttacks}
          hoveredCity={hoveredCity}
          onCityHover={setHoveredCity}
          onZoomChange={setCurrentGlobeZoom}
          onCityClick={(city) => {
            setSelectedCityDetail(city);
            setShowCityInfo(city);
            addTerminalLine('info', `📍 Selected city: ${city}`);
            addTerminalLine('output', `   Status: ${cityThreatData[city]?.status || 'Unknown'}`);
            addTerminalLine('output', `   Active Threats: ${cityThreatData[city]?.threats || 0}`);
          }}
          onAttackClick={(attack) => {
            addTerminalLine('warning', `⚠️ THREAT DETECTED: ${attack.type}`);
            addTerminalLine('output', `   Source: ${attack.from}`);
            addTerminalLine('output', `   Target: ${attack.to}`);
            addTerminalLine('output', `   Severity: ${attack.severity || 'High'}`);
            addTerminalLine('info', `   Tip: Use threat-analysis tools to investigate further`);
          }}
        />
      </div>

      {/* City Info Popup */}
      {hoveredCity && cityThreatData[hoveredCity] && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-50 pointer-events-none"
          style={{
            left: '50%',
            top: '40%',
            transform: 'translateX(-50%)'
          }}
        >
          <div className="bg-[#0a1520]/95 border border-cyan-500/50 rounded-xl p-4 backdrop-blur-xl shadow-lg shadow-cyan-500/20 min-w-[240px]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-cyan-400 font-mono font-bold">{hoveredCity}</span>
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={`font-bold ${
                  cityThreatData[hoveredCity].status === 'Critical' ? 'text-red-400' :
                  cityThreatData[hoveredCity].status === 'High Alert' ? 'text-orange-400' :
                  cityThreatData[hoveredCity].status === 'Elevated' ? 'text-yellow-400' :
                  cityThreatData[hoveredCity].status === 'Moderate' ? 'text-cyan-400' :
                  'text-green-400'
                }`}>{cityThreatData[hoveredCity].status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Type:</span>
                <span className="text-cyan-300">{cityThreatData[hoveredCity].type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Active Threats:</span>
                <span className="text-red-400">{cityThreatData[hoveredCity].threats.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Attacks (24h):</span>
                <span className="text-orange-400">{cityThreatData[hoveredCity].attacks}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-cyan-500/20">
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    cityThreatData[hoveredCity].status === 'Critical' ? 'bg-red-500' :
                    cityThreatData[hoveredCity].status === 'High Alert' ? 'bg-orange-500' :
                    cityThreatData[hoveredCity].status === 'Elevated' ? 'bg-yellow-500' :
                    cityThreatData[hoveredCity].status === 'Moderate' ? 'bg-cyan-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, cityThreatData[hoveredCity].threats / 25)}%` }}
                />
              </div>
              <div className="text-center text-[10px] text-gray-500 mt-1">Threat Level</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Enhanced Detail Panel (Deep Zoom) - Hierarchical Geographic Detail */}
      {currentGlobeZoom > 1.5 && selectedCityDetail && DETAILED_CITIES[selectedCityDetail] && (
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="absolute left-4 md:left-8 top-24 md:top-32 z-40 w-[420px] max-h-[65vh] overflow-y-auto bg-[#0a1520]/98 border border-cyan-500/40 rounded-2xl p-6 backdrop-blur-2xl shadow-2xl shadow-cyan-500/30"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-cyan-300 mb-2">{selectedCityDetail}</h2>
              <div className="space-y-1">
                <p className="text-xs text-cyan-500/60 font-mono">
                  📍 {DETAILED_CITIES[selectedCityDetail].region}
                </p>
                {DETAILED_CITIES[selectedCityDetail].country && (
                  <p className="text-xs text-cyan-400/70 font-mono">
                    🌍 {DETAILED_CITIES[selectedCityDetail].country}
                    {DETAILED_CITIES[selectedCityDetail].state && ` · ${DETAILED_CITIES[selectedCityDetail].state}`}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedCityDetail(null)}
              className="text-gray-400 hover:text-red-400 transition-colors text-lg"
            >
              ✕
            </button>
          </div>

          {/* Geographic Hierarchy */}
          <div className="mb-5 p-3 bg-black/50 border border-purple-500/20 rounded-lg">
            <div className="text-xs font-mono text-purple-400 mb-2">GEOGRAPHIC HIERARCHY</div>
            <div className="flex items-center gap-1 text-xs text-gray-300">
              <span className="text-purple-400">{DETAILED_CITIES[selectedCityDetail].region}</span>
              <span className="text-gray-600">›</span>
              <span className="text-cyan-400">{DETAILED_CITIES[selectedCityDetail].country}</span>
              {DETAILED_CITIES[selectedCityDetail].state && (
                <>
                  <span className="text-gray-600">›</span>
                  <span className="text-yellow-400">{DETAILED_CITIES[selectedCityDetail].state}</span>
                </>
              )}
              <span className="text-gray-600">›</span>
              <span className="text-cyan-300 font-bold">{selectedCityDetail}</span>
            </div>
          </div>

          {/* City Basics */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="p-3 bg-black/30 rounded-lg border border-gray-700/50">
              <div className="text-[10px] font-mono text-gray-500 uppercase mb-1">Population</div>
              <div className="text-lg font-bold text-cyan-400">{DETAILED_CITIES[selectedCityDetail].population}</div>
            </div>
            <div className="p-3 bg-black/30 rounded-lg border border-gray-700/50">
              <div className="text-[10px] font-mono text-gray-500 uppercase mb-1">Timezone</div>
              <div className="text-sm font-mono text-cyan-400">{DETAILED_CITIES[selectedCityDetail].timezone}</div>
            </div>
          </div>

          {/* Critical Assets */}
          <div className="mb-5 p-3 bg-black/40 border border-red-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-red-400">🔴 CRITICAL ASSETS</span>
              <span className="text-lg font-bold text-red-400">{DETAILED_CITIES[selectedCityDetail].criticalAssets}</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-orange-500"
                style={{ width: `${Math.min(100, DETAILED_CITIES[selectedCityDetail].criticalAssets * 8)}%` }}
              />
            </div>
          </div>

          {/* Infrastructure */}
          <div className="mb-5">
            <h3 className="text-xs font-bold text-cyan-400 mb-2 uppercase tracking-widest">Infrastructure</h3>
            <div className="flex flex-wrap gap-2">
              {DETAILED_CITIES[selectedCityDetail].infrastructure.map((infra, idx) => (
                <span key={idx} className="px-2 py-1 text-xs bg-cyan-500/15 border border-cyan-500/30 rounded text-cyan-400">
                  {infra}
                </span>
              ))}
            </div>
          </div>

          {/* Threat Vectors */}
          <div className="mb-5">
            <h3 className="text-xs font-bold text-orange-400 mb-2 uppercase tracking-widest">Primary Threat Vectors</h3>
            <div className="space-y-2">
              {DETAILED_CITIES[selectedCityDetail].threatVectors.map((vector, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                  <span className="text-orange-400 text-lg">⚠</span>
                  <span>{vector}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Current Threat Status */}
          <div className="mb-5 p-3 bg-black/40 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-yellow-400 uppercase">Active Threat Level</span>
              <span className="text-sm font-bold px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">
                {cityThreatData[selectedCityDetail]?.status || 'Moderate'}
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  cityThreatData[selectedCityDetail]?.status === 'Critical' ? 'bg-red-500' :
                  cityThreatData[selectedCityDetail]?.status === 'High Alert' ? 'bg-orange-500' :
                  cityThreatData[selectedCityDetail]?.status === 'Elevated' ? 'bg-yellow-500' :
                  cityThreatData[selectedCityDetail]?.status === 'Moderate' ? 'bg-cyan-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, (cityThreatData[selectedCityDetail]?.threats || 0) / 25)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>Active Threats: <span className="text-red-400 font-bold">{(cityThreatData[selectedCityDetail]?.threats || 0).toLocaleString()}</span></span>
              <span>Attacks (24h): <span className="text-orange-400 font-bold">{cityThreatData[selectedCityDetail]?.attacks || 0}</span></span>
            </div>
          </div>

          {/* Regional Context */}
          <div className="mb-4 p-3 bg-black/30 border border-cyan-500/20 rounded-lg">
            <h3 className="text-xs font-bold text-cyan-400 mb-2 uppercase">Regional Context</h3>
            <p className="text-xs text-gray-300 leading-relaxed mb-2">
              {selectedCityDetail} is a major node in the {DETAILED_CITIES[selectedCityDetail].region} region with significant infrastructure
              concentration and elevated cyber threat activity.
            </p>
            <div className="text-xs text-cyan-400/70 font-mono">
              Last intelligence refresh: {new Date().toLocaleTimeString()}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 bg-cyan-500/10 border border-cyan-500/50 rounded-lg text-xs font-mono text-cyan-400 hover:bg-cyan-500/20 transition-colors">
              📊 Analyze
            </button>
            <button className="flex-1 px-3 py-2 bg-orange-500/10 border border-orange-500/50 rounded-lg text-xs font-mono text-orange-400 hover:bg-orange-500/20 transition-colors">
              ⚠️ Threats
            </button>
            <button className="flex-1 px-3 py-2 bg-purple-500/10 border border-purple-500/50 rounded-lg text-xs font-mono text-purple-400 hover:bg-purple-500/20 transition-colors">
              🔍 Intel
            </button>
          </div>
        </motion.div>
      )}

      {/* Fallback for cities without DETAILED_CITIES data */}
      {currentGlobeZoom > 1.5 && selectedCityDetail && !DETAILED_CITIES[selectedCityDetail] && cityThreatData[selectedCityDetail] && (
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="absolute left-4 md:left-8 top-24 md:top-32 z-40 w-96 max-h-[50vh] overflow-y-auto bg-[#0a1520]/98 border border-cyan-500/40 rounded-2xl p-6 backdrop-blur-2xl shadow-2xl shadow-cyan-500/30"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg md:text-2xl font-bold text-cyan-300 mb-1">{selectedCityDetail}</h2>
              <p className="text-xs md:text-sm text-cyan-500/70 font-mono">{cityThreatData[selectedCityDetail].type}</p>
            </div>
            <button
              onClick={() => setSelectedCityDetail(null)}
              className="text-gray-400 hover:text-red-400 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Status Indicator */}
          <div className="mb-6 p-4 bg-black/40 border border-cyan-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-gray-400">THREAT STATUS</span>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                cityThreatData[selectedCityDetail].status === 'Critical' ? 'bg-red-500/20 text-red-400' :
                cityThreatData[selectedCityDetail].status === 'High Alert' ? 'bg-orange-500/20 text-orange-400' :
                cityThreatData[selectedCityDetail].status === 'Elevated' ? 'bg-yellow-500/20 text-yellow-400' :
                cityThreatData[selectedCityDetail].status === 'Moderate' ? 'bg-cyan-500/20 text-cyan-400' :
                'bg-green-500/20 text-green-400'
              }`}>{cityThreatData[selectedCityDetail].status}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  cityThreatData[selectedCityDetail].status === 'Critical' ? 'bg-red-500' :
                  cityThreatData[selectedCityDetail].status === 'High Alert' ? 'bg-orange-500' :
                  cityThreatData[selectedCityDetail].status === 'Elevated' ? 'bg-yellow-500' :
                  cityThreatData[selectedCityDetail].status === 'Moderate' ? 'bg-cyan-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, cityThreatData[selectedCityDetail].threats / 25)}%` }}
              />
            </div>
          </div>

          {/* Threat Statistics */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-end p-3 bg-black/30 rounded-lg border border-gray-700/50 hover:border-cyan-500/30 transition-colors">
              <span className="text-xs font-mono text-gray-400">Active Threats</span>
              <span className="text-xl font-bold text-red-400">{cityThreatData[selectedCityDetail].threats.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-end p-3 bg-black/30 rounded-lg border border-gray-700/50 hover:border-orange-500/30 transition-colors">
              <span className="text-xs font-mono text-gray-400">Attacks (24h)</span>
              <span className="text-xl font-bold text-orange-400">{cityThreatData[selectedCityDetail].attacks}</span>
            </div>
            <div className="flex justify-between items-end p-3 bg-black/30 rounded-lg border border-gray-700/50 hover:border-cyan-500/30 transition-colors">
              <span className="text-xs font-mono text-gray-400">Threat Index</span>
              <span className="text-lg font-bold text-cyan-400">{(cityThreatData[selectedCityDetail].threats / 50).toFixed(2)}</span>
            </div>
          </div>

          {/* Regional Intelligence */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-cyan-400 mb-3 uppercase tracking-widest">Regional Intelligence</h3>
            <div className="space-y-2 text-xs text-gray-300">
              <div className="flex items-start gap-2">
                <span className="text-cyan-500 mt-1">▸</span>
                <span>Infrastructure: Major <span className="text-cyan-400">financial</span> and <span className="text-cyan-400">tech</span> hub</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-500 mt-1">▸</span>
                <span>Primary Vectors: <span className="text-orange-400">APT actors</span>, <span className="text-orange-400">financial malware</span></span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-500 mt-1">▸</span>
                <span>Last Updated: <span className="text-cyan-400">{new Date().toLocaleTimeString()}</span></span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 bg-cyan-500/10 border border-cyan-500/50 rounded-lg text-xs font-mono text-cyan-400 hover:bg-cyan-500/20 transition-colors">
              Analyze
            </button>
            <button className="flex-1 px-3 py-2 bg-orange-500/10 border border-orange-500/50 rounded-lg text-xs font-mono text-orange-400 hover:bg-orange-500/20 transition-colors">
              Threats
            </button>
          </div>
        </motion.div>
      )}

      {/* Zoom Level Indicator */}
      {currentGlobeZoom > 1.3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-4 md:bottom-6 right-4 md:right-6 z-40 px-4 py-2 bg-[#0a1520]/90 border border-cyan-500/40 rounded-lg backdrop-blur-lg text-xs font-mono"
        >
          <div className="text-gray-400">Zoom Level</div>
          <div className="text-cyan-400 font-bold">{(currentGlobeZoom * 100).toFixed(0)}%</div>
          <div className="text-[10px] text-cyan-500/50 mt-1">
            {currentGlobeZoom > 1.8 ? '🔴 Maximum Detail' : currentGlobeZoom > 1.5 ? '🟠 Regional View' : '🟡 City Focus'}
          </div>
        </motion.div>
      )}

      {/* HUD Corner Brackets */}
      <>
        <HUDCorner position="top-left" />
        <HUDCorner position="top-right" />
        <HUDCorner position="bottom-left" />
        <HUDCorner position="bottom-right" />
      </>

      {/* Radial Gradient Vignette */}
      <div className="absolute inset-0 z-[15] pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, rgba(0,5,10,0.5) 60%, rgba(0,5,10,0.8) 100%)'
        }}
      />

      {/* Top HUD Bar */}
      <div className="absolute top-0 left-0 right-0 z-[50]">
        <div className="flex items-center justify-between px-3 md:px-6 py-2 md:py-4">
          {/* Left Section - User Profile */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 md:gap-3 p-1.5 md:p-2 rounded-lg md:rounded-xl bg-[#0a1520]/80 border border-cyan-500/30 backdrop-blur-xl cursor-pointer hover:border-cyan-400/50 transition-all"
            onClick={() => setOpenPanel(openPanel === 'profile' ? null : 'profile')}
          >
            <div className="relative">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-cyan-500/40 to-cyan-600/40 border border-cyan-500/50 flex items-center justify-center">
                <span className="text-cyan-400 font-bold text-base md:text-lg">{user?.name?.charAt(0) || 'F'}</span>
              </div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#0a1520]"
              />
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-sm font-medium text-white">{user?.name || 'Agent'}</span>
              <span className="text-[9px] text-cyan-500/60 font-mono">STUDENT</span>
            </div>
            <div className="hidden md:block h-6 w-px bg-cyan-500/30 mx-1" />
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-400" />
              <span className="text-xs md:text-sm font-mono font-bold text-cyan-400">{credits}</span>
            </div>
            <ChevronRight className={`w-3 h-3 md:w-4 md:h-4 text-cyan-500 transition-transform ${openPanel === 'profile' ? 'rotate-90' : ''}`} />
          </motion.div>

          {/* Center Section - Brand Name - Top aligned with globe reference */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-1/2 top-4 md:top-6 flex flex-col items-center z-50"
            style={{ transform: 'translateX(calc(-50% - 0px))' }}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <img src="/images/logo.png" alt="OsintX" className="w-12 h-12 md:w-14 md:h-14 object-contain" style={{ filter: 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.5))' }} />
              <h1 
                className="text-xl sm:text-2xl md:text-4xl tracking-wide drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]"
                style={{ 
                  fontFamily: "'Papyrus', 'Copperplate', fantasy", 
                  background: 'linear-gradient(135deg, #00ffff, #22d3ee, #7fffd4, #22d3ee, #00ffff)',
                  backgroundSize: '300% 300%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'holoShift 4s ease-in-out infinite',
                  letterSpacing: '0.1em'
                }}
              >
                OsintX
              </h1>
            </div>
            <p className="text-[7px] md:text-[9px] text-cyan-500/50 font-mono tracking-[0.2em] md:tracking-[0.4em] mt-0.5">DIGITAL GUARDIAN NETWORK</p>
          </motion.div>

          {/* Right Section - Time Display - Hidden on mobile */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex flex-col items-end p-2 rounded-xl bg-[#0a1520]/80 border border-cyan-500/30 backdrop-blur-xl"
          >
            <div className="text-2xl font-mono text-cyan-400 tracking-wider font-light">
              {systemTime.toLocaleTimeString('en-US', { hour12: false })}
            </div>
            <div className="text-[9px] font-mono text-cyan-500/50 tracking-[0.2em]">
              {systemTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
            </div>
          </motion.div>
        </div>

        {/* Profile Dropdown Menu */}
        <AnimatePresence>
          {openPanel === 'profile' && (
            <>
              {/* Click outside overlay */}
              <div 
                className="fixed inset-0 z-[51]" 
                onClick={() => setOpenPanel(null)}
              />
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-3 md:left-6 mt-1 w-44 md:w-48 overflow-hidden z-[52]"
              >
                <div className="p-2 rounded-xl bg-[#0a1520] border border-cyan-500/40 backdrop-blur-xl shadow-xl shadow-black/50">
                  <Link 
                    to="/dashboard/student/profile" 
                    onClick={(e) => { e.stopPropagation(); setOpenPanel(null); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-cyan-500/10 transition-all active:bg-cyan-500/20"
                  >
                    <Eye className="w-4 h-4 text-cyan-500" />
                    <span className="text-xs text-gray-300">View Profile</span>
                  </Link>
                  <Link 
                    to="/dashboard/student/settings" 
                    onClick={(e) => { e.stopPropagation(); setOpenPanel(null); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-cyan-500/10 transition-all active:bg-cyan-500/20"
                  >
                    <Settings className="w-4 h-4 text-cyan-500" />
                    <span className="text-xs text-gray-300">Settings</span>
                  </Link>
                  <div className="h-px bg-cyan-500/20 my-1" />
                  <button 
                    onClick={(e) => { e.stopPropagation(); setOpenPanel(null); handleLogout(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 transition-all active:bg-red-500/20"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-gray-300">Logout</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Tools Menu Button - Only visible on mobile/tablet */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed bottom-4 left-4 z-[55] w-12 h-12 rounded-full bg-[#0a1520]/90 border border-cyan-500/50 backdrop-blur-xl flex items-center justify-center shadow-lg shadow-cyan-500/20"
      >
        <Layers className={`w-5 h-5 text-cyan-400 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      {/* Mobile Tools Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: 'spring', damping: 25 }}
            className="lg:hidden fixed inset-y-0 left-0 w-72 z-[56] bg-[#0a1520]/95 border-r border-cyan-500/30 backdrop-blur-xl overflow-y-auto"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-cyan-400">Tools Menu</h3>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-cyan-500/20 text-gray-400"
                >
                  ✕
                </button>
              </div>
              
              {/* Mobile Tool Grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {toolsData.map((tool, index) => {
                  const Icon = tool.icon;
                  return (
                    <motion.button
                      key={tool.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => {
                        handleToolSelect(tool);
                        setMobileMenuOpen(false);
                      }}
                      className="flex flex-col items-center gap-1 p-3 rounded-lg bg-[#0a1520]/80 border border-cyan-500/30 hover:border-cyan-400/50 transition-all"
                    >
                      <Icon className="w-5 h-5 text-cyan-400" />
                      <span className="text-[9px] text-gray-400 text-center leading-tight">{tool.name}</span>
                      <span className="text-[8px] text-amber-400 font-mono">{Math.ceil(tool.cost * 1.5)}c</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Quick Stats */}
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 mb-4">
                <h4 className="text-xs text-cyan-400 font-medium mb-2">Your Stats</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Credits</span>
                    <span className="text-amber-400 font-mono">{credits}c</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Scans Today</span>
                    <span className="text-cyan-400 font-mono">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Success Rate</span>
                    <span className="text-green-400 font-mono">94%</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <Link 
                  to="/dashboard/student/profile"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#0a1520]/80 border border-cyan-500/30 hover:border-cyan-400/50 transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Eye className="w-4 h-4 text-cyan-500" />
                  <span className="text-xs text-gray-300">View Profile</span>
                </Link>
                <Link 
                  to="/dashboard/student/settings"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#0a1520]/80 border border-cyan-500/30 hover:border-cyan-400/50 transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="w-4 h-4 text-cyan-500" />
                  <span className="text-xs text-gray-300">Settings</span>
                </Link>
                <button 
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-[#0a1520]/80 border border-red-500/30 hover:border-red-400/50 transition-all"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-gray-300">Logout</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-[54]"
          />
        )}
      </AnimatePresence>

      {/* LEFT SIDE - Stacked Accordion Panels - Hidden on mobile */}
      <div className="hidden lg:flex absolute top-20 bottom-20 left-4 z-[35] w-56 items-center">
        <div className="space-y-1 w-full max-h-full overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent py-2">
          {/* Panel 1 - All Tools (Moved to top) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <motion.button
              onClick={() => setOpenPanel(openPanel === 'tools' ? null : 'tools')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg backdrop-blur-xl border transition-all duration-300 ${
                openPanel === 'tools' 
                  ? 'bg-indigo-500/20 border-indigo-400/60 shadow-lg shadow-indigo-500/20' 
                  : 'bg-[#0a1520]/80 border-cyan-500/30 hover:border-indigo-400/50 hover:bg-indigo-500/10'
              }`}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`p-1.5 rounded-lg ${openPanel === 'tools' ? 'bg-indigo-400/30' : 'bg-indigo-500/20'}`}>
                <Layers className={`w-4 h-4 ${openPanel === 'tools' ? 'text-indigo-300' : 'text-indigo-500'}`} />
              </div>
              <span className={`text-sm font-medium ${openPanel === 'tools' ? 'text-indigo-300' : 'text-gray-300'}`}>All Tools</span>
              <span className="ml-auto mr-2 text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
                {toolsData.length}
              </span>
              <motion.div 
                animate={{ rotate: openPanel === 'tools' ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className={`w-4 h-4 ${openPanel === 'tools' ? 'text-indigo-400' : 'text-gray-500'}`} />
              </motion.div>
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/50" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/50" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500/50" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/50" />
            </motion.button>
            
            <AnimatePresence>
              {openPanel === 'tools' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="mt-1 p-3 rounded-lg bg-[#0a1520]/90 border border-cyan-500/30 backdrop-blur-xl">
                    {/* Category Filter */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {['All', ...new Set(toolsData.map(t => t.category))].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setToolCategoryFilter && setToolCategoryFilter(cat)}
                          className={`px-2 py-0.5 rounded text-[9px] transition-all ${
                            (toolCategoryFilter || 'All') === cat
                              ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-400/50'
                              : 'bg-[#040810]/50 text-gray-500 border border-gray-700/30 hover:border-indigo-500/30'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    
                    {/* Tools Grid */}
                    <div className="space-y-1 max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-500/20 scrollbar-track-transparent">
                      {toolsData
                        .filter(tool => !toolCategoryFilter || toolCategoryFilter === 'All' || tool.category === toolCategoryFilter)
                        .map((tool, index) => {
                          const Icon = tool.icon;
                          return (
                            <motion.div
                              key={tool.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.02 }}
                              className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-all group ${
                                selectedTool?.id === tool.id
                                  ? 'bg-indigo-500/20 border-indigo-400/50'
                                  : 'bg-[#040810]/50 border-cyan-500/20 hover:bg-indigo-500/10 hover:border-indigo-400/30'
                              }`}
                            >
                              <button
                                onClick={() => handleToolSelect(tool)}
                                className="flex items-center gap-2 flex-1 min-w-0"
                              >
                                <div className={`p-1.5 rounded-lg ${
                                  selectedTool?.id === tool.id ? 'bg-indigo-500/30' : 'bg-cyan-500/10'
                                }`}>
                                  <Icon className={`w-3.5 h-3.5 ${
                                    selectedTool?.id === tool.id ? 'text-indigo-300' : 'text-cyan-500'
                                  }`} />
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                  <p className={`text-[10px] font-medium truncate ${
                                    selectedTool?.id === tool.id ? 'text-indigo-300' : 'text-gray-300 group-hover:text-white'
                                  }`}>
                                    {tool.name}
                                  </p>
                                  <p className="text-[8px] text-gray-600 font-mono">{tool.cmd}</p>
                                </div>
                              </button>
                              <div className="flex items-center gap-1">
                                {/* Export Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowToolExportModal(tool.id);
                                  }}
                                  className="p-1 rounded hover:bg-teal-500/20 text-gray-500 hover:text-teal-400 transition-all opacity-0 group-hover:opacity-100"
                                  title={`Export ${tool.name} results`}
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                                {/* Import Button */}
                                <label
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 rounded hover:bg-teal-500/20 text-gray-500 hover:text-teal-400 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                                  title={`Import ${tool.name} data`}
                                >
                                  <Upload className="w-3 h-3" />
                                  <input
                                    type="file"
                                    accept=".json"
                                    onChange={(e) => handleToolFileImport(e, tool.id)}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-[9px] text-amber-400 font-mono">{Math.ceil(tool.cost * 1.5)}c</span>
                                <span className="text-[7px] text-gray-600">{tool.category}</span>
                              </div>
                            </motion.div>
                          );
                        })}
                    </div>
                    
                    {/* Tools Summary */}
                    <div className="mt-2 pt-2 border-t border-indigo-500/20 flex items-center justify-between">
                      <span className="text-[9px] text-gray-500">Total: {toolsData.length} tools</span>
                      <span className="text-[9px] text-indigo-400">Field Access (1.5x cost)</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Panel 2 - Scan History */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="relative"
          >
            <motion.button
              onClick={() => setOpenPanel(openPanel === 'history' ? null : 'history')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg backdrop-blur-xl border transition-all duration-300 ${
                openPanel === 'history' 
                  ? 'bg-blue-500/20 border-blue-400/60 shadow-lg shadow-blue-500/20' 
                  : 'bg-[#0a1520]/80 border-cyan-500/30 hover:border-blue-400/50 hover:bg-blue-500/10'
              }`}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`p-1.5 rounded-lg ${openPanel === 'history' ? 'bg-blue-400/30' : 'bg-blue-500/20'}`}>
                <Clock className={`w-4 h-4 ${openPanel === 'history' ? 'text-blue-300' : 'text-blue-500'}`} />
              </div>
              <span className={`text-sm font-medium ${openPanel === 'history' ? 'text-blue-300' : 'text-gray-300'}`}>Scan History</span>
              <span className="ml-auto mr-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                {terminalHistory.filter(h => h.type === 'input').length}
              </span>
              <motion.div 
                animate={{ rotate: openPanel === 'history' ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className={`w-4 h-4 ${openPanel === 'history' ? 'text-blue-400' : 'text-gray-500'}`} />
              </motion.div>
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/50" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/50" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500/50" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/50" />
            </motion.button>
            
            <AnimatePresence>
              {openPanel === 'history' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="mt-1 p-3 rounded-lg bg-[#0a1520]/90 border border-cyan-500/30 backdrop-blur-xl">
                    <div className="space-y-2 max-h-36 overflow-y-auto">
                      {terminalHistory.filter(h => h.type === 'input').slice(-5).reverse().map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => { setTerminalInput(item.text.replace('❯ ', '')); inputRef.current?.focus(); }}
                          className="p-2 rounded-lg bg-[#040810]/50 border border-cyan-500/20 hover:border-cyan-500/40 cursor-pointer transition-all group"
                        >
                          <p className="text-xs text-cyan-400 font-mono truncate group-hover:text-cyan-300">{item.text.replace('❯ ', '')}</p>
                        </motion.div>
                      ))}
                      {terminalHistory.filter(h => h.type === 'input').length === 0 && (
                        <p className="text-xs text-gray-500 text-center py-4">No scans yet</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Panel 3 - Notifications */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="relative"
          >
            <motion.button
              onClick={() => setOpenPanel(openPanel === 'notifs' ? null : 'notifs')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg backdrop-blur-xl border transition-all duration-300 ${
                openPanel === 'notifs' 
                  ? 'bg-rose-500/20 border-rose-400/60 shadow-lg shadow-rose-500/20' 
                  : 'bg-[#0a1520]/80 border-cyan-500/30 hover:border-rose-400/50 hover:bg-rose-500/10'
              }`}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`p-1.5 rounded-lg ${openPanel === 'notifs' ? 'bg-rose-400/30' : 'bg-rose-500/20'} relative`}>
                <Bell className={`w-4 h-4 ${openPanel === 'notifs' ? 'text-rose-300' : 'text-rose-500'}`} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                )}
              </div>
              <span className={`text-sm font-medium ${openPanel === 'notifs' ? 'text-rose-300' : 'text-gray-300'}`}>Notifications</span>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="ml-auto mr-2 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-400">
                  {notifications.filter(n => !n.read).length} new
                </span>
              )}
              <motion.div 
                animate={{ rotate: openPanel === 'notifs' ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className={`w-4 h-4 ${openPanel === 'notifs' ? 'text-rose-400' : 'text-gray-500'}`} />
              </motion.div>
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/50" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/50" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500/50" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/50" />
            </motion.button>
            
            <AnimatePresence>
              {openPanel === 'notifs' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="mt-1 p-3 rounded-lg bg-[#0a1520]/90 border border-cyan-500/30 backdrop-blur-xl">
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {notifications.map((notif, index) => (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => setNotifications(prev => prev.map(n => n.id === notif.id ? {...n, read: true} : n))}
                          className={`p-2 rounded-lg border cursor-pointer transition-all ${
                            notif.read 
                              ? 'bg-[#040810]/30 border-gray-700/30' 
                              : 'bg-[#040810]/50 border-rose-500/30 hover:border-rose-500/50'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`p-1 rounded mt-0.5 ${
                              notif.type === 'success' ? 'bg-green-500/20' :
                              notif.type === 'alert' ? 'bg-amber-500/20' : 'bg-cyan-500/20'
                            }`}>
                              {notif.type === 'success' ? <CheckCircle className="w-3 h-3 text-green-400" /> :
                               notif.type === 'alert' ? <AlertTriangle className="w-3 h-3 text-amber-400" /> :
                               <Bell className="w-3 h-3 text-cyan-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[10px] ${notif.read ? 'text-gray-500' : 'text-gray-300'}`}>{notif.msg}</p>
                              <p className="text-[9px] text-gray-600 mt-0.5">{notif.time}</p>
                            </div>
                            {!notif.read && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full flex-shrink-0 mt-1" />}
                          </div>
                        </motion.div>
                      ))}
                      {/* Mark all as read */}
                      {notifications.filter(n => !n.read).length > 0 && (
                        <button
                          onClick={() => setNotifications(prev => prev.map(n => ({...n, read: true})))}
                          className="w-full p-2 text-[10px] text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Panel 4 - Import/Export */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.85 }}
            className="relative"
          >
            <motion.button
              onClick={() => setOpenPanel(openPanel === 'importexport' ? null : 'importexport')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg backdrop-blur-xl border transition-all duration-300 ${
                openPanel === 'importexport' 
                  ? 'bg-teal-500/20 border-teal-400/60 shadow-lg shadow-teal-500/20' 
                  : 'bg-[#0a1520]/80 border-cyan-500/30 hover:border-teal-400/50 hover:bg-teal-500/10'
              }`}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`p-1.5 rounded-lg ${openPanel === 'importexport' ? 'bg-teal-400/30' : 'bg-teal-500/20'}`}>
                <Share2 className={`w-4 h-4 ${openPanel === 'importexport' ? 'text-teal-300' : 'text-teal-500'}`} />
              </div>
              <span className={`text-sm font-medium ${openPanel === 'importexport' ? 'text-teal-300' : 'text-gray-300'}`}>Import/Export</span>
              <motion.div 
                className="ml-auto"
                animate={{ rotate: openPanel === 'importexport' ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className={`w-4 h-4 ${openPanel === 'importexport' ? 'text-teal-400' : 'text-gray-500'}`} />
              </motion.div>
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/50" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/50" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500/50" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/50" />
            </motion.button>
            
            <AnimatePresence>
              {openPanel === 'importexport' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="mt-1 p-3 rounded-lg bg-[#0a1520]/90 border border-cyan-500/30 backdrop-blur-xl">
                    <div className="space-y-2">
                      {/* Export Options */}
                      <p className="text-[10px] text-teal-400 font-medium mb-2">EXPORT DATA</p>
                      <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => setShowExportModal(true)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg bg-teal-500/10 border border-teal-500/30 hover:bg-teal-500/20 hover:border-teal-400/50 transition-all group"
                      >
                        <Download className="w-4 h-4 text-teal-500 group-hover:text-teal-400" />
                        <span className="text-xs text-gray-300 group-hover:text-white">Export Options...</span>
                        <ChevronRight className="w-3 h-3 text-gray-600 ml-auto group-hover:text-teal-400" />
                      </motion.button>
                      
                      {/* Quick Export Buttons */}
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          onClick={() => exportData('commands')}
                          className="flex items-center justify-center gap-1 p-2 rounded-lg bg-[#040810]/50 border border-cyan-500/20 hover:border-teal-500/40 hover:bg-teal-500/10 transition-all"
                        >
                          <Bookmark className="w-3 h-3 text-purple-400" />
                          <span className="text-[9px] text-gray-400">Commands</span>
                        </button>
                        <button
                          onClick={() => exportData('history')}
                          className="flex items-center justify-center gap-1 p-2 rounded-lg bg-[#040810]/50 border border-cyan-500/20 hover:border-teal-500/40 hover:bg-teal-500/10 transition-all"
                        >
                          <Clock className="w-3 h-3 text-blue-400" />
                          <span className="text-[9px] text-gray-400">History</span>
                        </button>
                      </div>
                      
                      {/* Divider */}
                      <div className="h-px bg-teal-500/20 my-2" />
                      
                      {/* Import Options */}
                      <p className="text-[10px] text-teal-400 font-medium mb-2">IMPORT DATA</p>
                      <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        onClick={() => setShowImportModal(true)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg bg-teal-500/10 border border-teal-500/30 hover:bg-teal-500/20 hover:border-teal-400/50 transition-all group"
                      >
                        <Upload className="w-4 h-4 text-teal-500 group-hover:text-teal-400" />
                        <span className="text-xs text-gray-300 group-hover:text-white">Import from File...</span>
                        <ChevronRight className="w-3 h-3 text-gray-600 ml-auto group-hover:text-teal-400" />
                      </motion.button>
                      
                      {/* Info */}
                      <div className="p-2 rounded-lg bg-[#040810]/50 border border-cyan-500/20">
                        <p className="text-[9px] text-gray-500">
                          💡 Export your commands and history to share or backup. Import previously exported files.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* SELECTED TOOL INFO - Center Bottom - Hidden on mobile */}
      <AnimatePresence>
        {selectedTool && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="hidden md:block absolute bottom-32 left-1/2 -translate-x-1/2 z-30"
          >
            <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-[#0a1520]/80 border border-cyan-500/40 backdrop-blur-xl shadow-lg shadow-cyan-500/20">
              <div className="p-3 rounded-xl bg-cyan-500/20">
                {selectedTool.icon && <selectedTool.icon className="w-6 h-6 text-cyan-400" />}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedTool.name}</h3>
                <p className="text-sm text-gray-400">
                  <span className="text-cyan-400 font-mono">{selectedTool.cmd}</span>
                  <span className="mx-2">•</span>
                  <span className="text-amber-400">{Math.ceil(selectedTool.cost * 1.5)} credits</span>
                  <span className="mx-2">•</span>
                  <span>{selectedTool.category}</span>
                </p>
              </div>
              <button 
                onClick={() => setSelectedTool(null)}
                className="ml-4 p-2 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command Interface - Center on mobile, Right on desktop */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`absolute z-[45] 
          ${showTerminal 
            ? 'inset-x-2 top-28 bottom-2 md:inset-x-auto md:top-24 md:right-4 md:bottom-6 md:w-80 md:left-auto' 
            : 'top-28 inset-x-0 flex justify-center md:inset-x-auto md:top-24 md:right-4 md:left-auto md:block'
          }`}
        style={{ pointerEvents: showTerminal ? 'auto' : 'none' }}
      >
        <div className={`flex flex-col ${showTerminal ? 'h-full w-full' : ''}`}>
          {/* Terminal Toggle */}
          <div className="flex justify-center mb-2" style={{ pointerEvents: 'auto' }}>
            <button
              onClick={() => setShowTerminal(!showTerminal)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0a1520]/90 border border-cyan-500/40 text-xs text-cyan-400 hover:bg-cyan-500/10 transition-all shadow-lg backdrop-blur-xl"
            >
              <Terminal className="w-3 h-3" />
              <span className="font-mono">COMMAND INTERFACE</span>
              <ChevronRight className={`w-3 h-3 transition-transform ${showTerminal ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <AnimatePresence>
            {showTerminal && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex-1 overflow-hidden flex flex-col"
              >
                <div className="flex-1 backdrop-blur-xl bg-[#0a1520]/80 border border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10 flex flex-col">
                  {/* Terminal Header */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-cyan-500/20 bg-[#050a15]/50">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                      </div>
                      <span className="text-xs font-mono text-cyan-500/60">neural-terminal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-600">{getOutputDepth().toUpperCase()}</span>
                      <button 
                        onClick={() => setTerminalHistory([{ type: 'system', text: '◉ Terminal cleared.' }])}
                        className="p-1 rounded hover:bg-cyan-500/10 text-gray-600 hover:text-cyan-400 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Terminal Output */}
                  <div 
                    ref={terminalRef}
                    className="flex-1 overflow-y-auto p-3 font-mono text-xs"
                    onClick={() => inputRef.current?.focus()}
                  >
                    {terminalHistory.map((line, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`mb-0.5 ${
                          line.type === 'input' ? 'text-cyan-400' :
                          line.type === 'output' ? 'text-gray-300' :
                          line.type === 'error' ? 'text-red-400' :
                          line.type === 'warning' ? 'text-amber-400' :
                          line.type === 'success' ? 'text-green-400' :
                          line.type === 'info' ? 'text-blue-400' :
                          'text-cyan-500/60'
                        }`}
                      >
                        {line.text}
                      </motion.div>
                    ))}
                    
                    {isExecuting && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 text-cyan-400"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Cpu className="w-3 h-3" />
                        </motion.div>
                        <span className="text-xs">Processing...</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Terminal Input with Autocomplete */}
                  <div 
                    className={`relative flex items-center gap-2 px-3 py-2 border-t transition-all z-50 ${
                      isDragOver 
                        ? 'border-cyan-400 bg-cyan-500/20' 
                        : 'border-cyan-500/20 bg-[#050a15]/30'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.focus()}
                  >
                    {/* Voice Input Indicator */}
                    {isListening && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-xs text-red-400"
                      >
                        🎤 {voiceTranscript || 'Listening...'}
                      </motion.div>
                    )}
                    
                    {/* Autocomplete Dropdown */}
                    <AnimatePresence>
                      {showAutocomplete && autocompleteOptions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full left-0 right-0 mb-1 p-1 rounded-lg bg-[#0a1520]/95 border border-cyan-500/40 backdrop-blur-xl z-50"
                        >
                          {autocompleteOptions.slice(0, 5).map((option, index) => (
                            <button
                              key={option}
                              onClick={() => {
                                setTerminalInput(option + ' ');
                                setShowAutocomplete(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 rounded text-xs font-mono transition-all ${
                                index === selectedAutocompleteIndex 
                                  ? 'bg-cyan-500/30 text-cyan-300' 
                                  : 'text-gray-400 hover:bg-cyan-500/10'
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                          <div className="px-3 py-1 text-[9px] text-gray-600 border-t border-cyan-500/20 mt-1">
                            <kbd className="px-1 rounded bg-gray-800">Tab</kbd> or <kbd className="px-1 rounded bg-gray-800">↑↓</kbd> to select
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <span className="text-cyan-400 font-mono">❯</span>
                    <input
                      ref={inputRef}
                      type="text"
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      disabled={isExecuting}
                      placeholder={isDragOver ? "Drop tool here..." : selectedTool ? `${selectedTool.cmd} <target>` : "Type command..."}
                      className="flex-1 bg-transparent text-gray-100 font-mono text-xs outline-none placeholder-gray-600 caret-cyan-400"
                      autoFocus
                      spellCheck={false}
                      autoComplete="off"
                    />
                    
                    {/* Voice Command Button */}
                    <button
                      onClick={startVoiceRecognition}
                      disabled={isListening}
                      className={`p-1.5 rounded-lg transition-all ${
                        isListening 
                          ? 'bg-red-500/30 text-red-400 animate-pulse' 
                          : 'hover:bg-cyan-500/20 text-gray-500 hover:text-cyan-400'
                      }`}
                      title="Voice Command"
                    >
                      <Radio className="w-3.5 h-3.5" />
                    </button>
                    
                    <button
                      onClick={() => executeCommand(terminalInput)}
                      disabled={isExecuting || !terminalInput.trim()}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 text-black text-xs font-mono font-bold hover:from-cyan-400 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/30 flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3" />
                      RUN
                    </button>
                  </div>

                  {/* Quick Help */}
                  <div className="flex flex-wrap items-center justify-center gap-3 px-3 py-2 border-t border-cyan-500/10 bg-[#020408]/50 text-[10px] text-gray-600">
                    <span><kbd className="px-1 py-0.5 rounded bg-cyan-500/10 text-cyan-500">Enter</kbd> Execute</span>
                    <span><kbd className="px-1 py-0.5 rounded bg-cyan-500/10 text-cyan-500">↑↓</kbd> History</span>
                    <span><kbd className="px-1 py-0.5 rounded bg-cyan-500/10 text-cyan-500">Ctrl+K</kbd> Search</span>
                    <span><kbd className="px-1 py-0.5 rounded bg-cyan-500/10 text-cyan-500">Tab</kbd> Complete</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Quick Search Modal (Ctrl+K) */}
      <AnimatePresence>
        {showQuickSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm"
            onClick={() => setShowQuickSearch(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl mx-4 rounded-2xl bg-[#0a1520]/95 border border-cyan-500/40 backdrop-blur-xl shadow-2xl shadow-cyan-500/20 overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-cyan-500/20">
                <Search className="w-5 h-5 text-cyan-500" />
                <input
                  ref={quickSearchRef}
                  type="text"
                  value={quickSearchQuery}
                  onChange={(e) => setQuickSearchQuery(e.target.value)}
                  placeholder="Search commands, tools..."
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500"
                  autoFocus
                />
                <kbd className="px-2 py-0.5 rounded bg-gray-800 text-gray-500 text-xs">Esc</kbd>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {toolsData
                  .filter(t => 
                    t.name.toLowerCase().includes(quickSearchQuery.toLowerCase()) ||
                    t.cmd.toLowerCase().includes(quickSearchQuery.toLowerCase())
                  )
                  .map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => {
                          setTerminalInput(`${tool.cmd} `);
                          setShowQuickSearch(false);
                          inputRef.current?.focus();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-cyan-500/10 transition-all group"
                      >
                        <Icon className="w-4 h-4 text-cyan-500" />
                        <div className="flex-1 text-left">
                          <p className="text-sm text-white">{tool.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{tool.cmd}</p>
                        </div>
                        <span className="text-xs text-amber-400 font-mono">{Math.ceil(tool.cost * 1.5)}c</span>
                      </button>
                    );
                  })}
                {/* Quick commands */}
                <div className="mt-2 pt-2 border-t border-cyan-500/20">
                  <p className="px-3 py-1 text-[10px] text-gray-600 uppercase">Quick Commands</p>
                  {['help', 'status', 'credits', 'clear'].map(cmd => (
                    <button
                      key={cmd}
                      onClick={() => {
                        executeCommand(cmd);
                        setShowQuickSearch(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-cyan-500/10 transition-all"
                    >
                      <Terminal className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-300 font-mono">{cmd}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Snake Game Modal */}
      <AnimatePresence>
        {showSnakeGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative p-6 rounded-2xl bg-[#0a1520] border border-cyan-500/40"
            >
              <button
                onClick={() => setShowSnakeGame(false)}
                className="absolute top-2 right-2 p-2 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400"
              >
                ✕
              </button>
              <h3 className="text-lg font-bold text-cyan-400 mb-2">🐍 Snake Game</h3>
              <p className="text-xs text-gray-500 mb-4">Use arrow keys to play!</p>
              <SnakeGame onScore={setSnakeScore} onClose={() => setShowSnakeGame(false)} />
              <p className="text-center text-sm text-amber-400 mt-4">Score: {snakeScore}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Attack Feed (Bottom of screen) - DISABLED
      <div className="hidden md:block absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0a1520]/80 border border-red-500/30 backdrop-blur-xl">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-2 h-2 bg-red-500 rounded-full"
          />
          <span className="text-xs text-gray-400">Live Threats:</span>
          <AnimatePresence mode="wait">
            {liveAttacks.length > 0 && (
              <motion.span
                key={liveAttacks[liveAttacks.length - 1]?.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-xs text-red-400 font-mono"
              >
                {liveAttacks[liveAttacks.length - 1]?.type} • {liveAttacks[liveAttacks.length - 1]?.from} → {liveAttacks[liveAttacks.length - 1]?.to}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
      */}

      {/* Animated Scan Line Effect */}
      <motion.div
        animate={{ 
          top: ['0%', '100%', '0%'],
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity, 
          ease: 'linear' 
        }}
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent z-50 pointer-events-none"
      />

      {/* CSS for special themes */}
      <style>{`
        .matrix-theme { filter: hue-rotate(80deg) saturate(1.5); }
        .hacker-theme { filter: sepia(0.3) hue-rotate(60deg); }
        .retro-theme { filter: sepia(0.4) contrast(1.2) hue-rotate(10deg); }
        .stealth-theme { filter: brightness(0.85) contrast(1.1) invert(0.05); }
        .hologram-theme { filter: brightness(1.1) contrast(1.3) hue-rotate(180deg) saturate(0.8); }
        .neural-theme { filter: hue-rotate(180deg) brightness(1.2) saturate(1.5); }
        .quantum-theme { filter: hue-rotate(${Math.random() * 360}deg) brightness(1.3) saturate(2); }
        .ai-theme { filter: hue-rotate(120deg) brightness(1.1) contrast(1.2); }
        .glitch-theme { animation: glitch-effect 0.3s ease-in-out infinite; filter: contrast(1.3); }
        .blackice-theme { filter: brightness(0.8) contrast(1.4) invert(0.1); }
        .zeroday-theme { filter: hue-rotate(20deg) brightness(0.95) saturate(1.3); }
        .ghost-theme { filter: brightness(0.9) opacity(0.95); }
        .deepweb-theme { filter: hue-rotate(270deg) brightness(0.85) contrast(1.2) saturate(0.7); }
        
        @keyframes rainbow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes scanlines {
          0% { background-position: 0 0; }
          100% { background-position: 0 10px; }
        }
        @keyframes stealth-fade {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes hologram-scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes hologram-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes neural-flow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        @keyframes neural-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes quantum-shift {
          0%, 100% { background-color: rgba(255,0,255,0.1); }
          33% { background-color: rgba(0,255,255,0.1); }
          66% { background-color: rgba(255,255,0,0.1); }
        }
        @keyframes quantum-shake {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-2px, 2px); }
          50% { transform: translate(2px, -2px); }
          75% { transform: translate(-2px, -2px); }
        }
        @keyframes ai-scan {
          0% { background-position: 0 0; }
          100% { background-position: 100px 0; }
        }
        @keyframes ai-pulse {
          0%, 100% { box-shadow: inset 0 0 80px rgba(0,255,0,0.15); }
          50% { box-shadow: inset 0 0 40px rgba(0,255,0,0.3); }
        }
        @keyframes reality-glitch {
          0%, 100% { transform: translate(0); }
          33% { transform: translate(-5px, 5px); }
          66% { transform: translate(5px, -5px); }
        }
        @keyframes glitch-scan {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        @keyframes glitch-effect {
          0%, 100% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
          50% { clip-path: polygon(0 10%, 100% 0, 100% 90%, 0 100%); }
        }
        @keyframes blackice-scan {
          0% { background-position: 0 0; }
          100% { background-position: 0 100vh; }
        }
        @keyframes zeroday-target {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes ghost-fade {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.2; }
        }
        @keyframes deepweb-pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowExportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md mx-4 p-6 rounded-2xl bg-[#0a1520]/95 border border-teal-500/40 backdrop-blur-xl shadow-2xl shadow-teal-500/20"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-teal-500/20">
                    <Download className="w-6 h-6 text-teal-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Export Data</h2>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-sm text-gray-400 mb-6">Choose what data you want to export:</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => exportData('commands')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-400/50 transition-all group"
                >
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Bookmark className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-white group-hover:text-purple-300">Saved Commands</p>
                    <p className="text-xs text-gray-500">Export your bookmarked commands</p>
                  </div>
                  <span className="text-xs text-purple-400 font-mono">{savedCommands.length} items</span>
                </button>
                
                <button
                  onClick={() => exportData('history')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-400/50 transition-all group"
                >
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Clock className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-white group-hover:text-blue-300">Scan History</p>
                    <p className="text-xs text-gray-500">Export your command & result history</p>
                  </div>
                  <span className="text-xs text-blue-400 font-mono">{terminalHistory.filter(h => h.type === 'input').length} scans</span>
                </button>
                
                <button
                  onClick={() => exportData('terminal')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all group"
                >
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Terminal className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-white group-hover:text-cyan-300">Terminal Output</p>
                    <p className="text-xs text-gray-500">Export as plain text file</p>
                  </div>
                  <span className="text-xs text-cyan-400 font-mono">.txt</span>
                </button>
                
                <div className="h-px bg-teal-500/20 my-2" />
                
                <button
                  onClick={() => exportData('session')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 hover:bg-teal-500/20 hover:border-teal-400/50 transition-all group"
                >
                  <div className="p-2 rounded-lg bg-teal-500/20">
                    <Database className="w-5 h-5 text-teal-400" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-white group-hover:text-teal-300">Full Session Backup</p>
                    <p className="text-xs text-gray-500">Export everything (commands, history, stats)</p>
                  </div>
                  <span className="text-xs text-teal-400">Recommended</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Individual Tool Export Modal */}
      <AnimatePresence>
        {showToolExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowToolExportModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm mx-4 p-5 rounded-2xl bg-[#0a1520]/95 border border-teal-500/40 backdrop-blur-xl shadow-2xl shadow-teal-500/20"
            >
              {(() => {
                const tool = toolsData.find(t => t.id === showToolExportModal);
                const Icon = tool?.icon || Layers;
                return (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-teal-500/20">
                          <Icon className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-white">{tool?.name}</h2>
                          <p className="text-xs text-gray-500">Export Results</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowToolExportModal(null)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => exportToolResults(showToolExportModal)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 hover:bg-teal-500/20 hover:border-teal-400/50 transition-all group"
                      >
                        <div className="p-2 rounded-lg bg-teal-500/20">
                          <FileDown className="w-4 h-4 text-teal-400" />
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-sm font-medium text-white group-hover:text-teal-300">Export as JSON</p>
                          <p className="text-[10px] text-gray-500">Full data with metadata</p>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => exportToolAsText(showToolExportModal)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all group"
                      >
                        <div className="p-2 rounded-lg bg-cyan-500/20">
                          <FileText className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-sm font-medium text-white group-hover:text-cyan-300">Export as Text</p>
                          <p className="text-[10px] text-gray-500">Plain text format</p>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => exportToolAsCSV(showToolExportModal)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 hover:border-green-400/50 transition-all group"
                      >
                        <div className="p-2 rounded-lg bg-green-500/20">
                          <Database className="w-4 h-4 text-green-400" />
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-sm font-medium text-white group-hover:text-green-300">Export as CSV</p>
                          <p className="text-[10px] text-gray-500">Spreadsheet compatible</p>
                        </div>
                      </button>
                    </div>
                    
                    <div className="mt-4 p-2 rounded-lg bg-[#040810]/50 border border-cyan-500/20">
                      <p className="text-[9px] text-gray-500 text-center">
                        💡 Exports include all {tool?.name} scan history from this session
                      </p>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowImportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md mx-4 p-6 rounded-2xl bg-[#0a1520]/95 border border-teal-500/40 backdrop-blur-xl shadow-2xl shadow-teal-500/20"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-teal-500/20">
                    <Upload className="w-6 h-6 text-teal-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Import Data</h2>
                </div>
                <button
                  onClick={() => { setShowImportModal(false); setImportError(''); }}
                  className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-sm text-gray-400 mb-6">
                Import previously exported OsintX data files (.json)
              </p>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
              
              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-8 rounded-xl border-2 border-dashed border-teal-500/40 hover:border-teal-400/60 bg-teal-500/5 hover:bg-teal-500/10 transition-all cursor-pointer group"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 rounded-full bg-teal-500/20 group-hover:bg-teal-500/30 transition-all">
                    <FileUp className="w-8 h-8 text-teal-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white group-hover:text-teal-300">Click to select file</p>
                    <p className="text-xs text-gray-500 mt-1">Supports .json export files</p>
                  </div>
                </div>
              </div>
              
              {/* Error message */}
              {importError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <p className="text-xs text-red-400">{importError}</p>
                  </div>
                </motion.div>
              )}
              
              {/* Supported formats */}
              <div className="mt-6 p-3 rounded-lg bg-[#040810]/50 border border-cyan-500/20">
                <p className="text-[10px] text-gray-500 font-medium mb-2">SUPPORTED FORMATS:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 rounded text-[9px] bg-purple-500/20 text-purple-400 border border-purple-500/30">Saved Commands</span>
                  <span className="px-2 py-1 rounded text-[9px] bg-teal-500/20 text-teal-400 border border-teal-500/30">Session Backup</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tool Interface Modals */}
      <AnimatePresence>
        {activeToolModal && toolComponents[activeToolModal] && (() => {
          const ToolComponent = toolComponents[activeToolModal];
          const tool = toolsData.find(t => t.id === activeToolModal);
          return (
            <ToolErrorBoundary key={activeToolModal} onClose={() => setActiveToolModal(null)}>
              <ToolComponent
                onClose={() => setActiveToolModal(null)}
                onConsume={(amount) => {
                  const newBalance = credits - amount;
                  setCredits(newBalance);
                  addTerminalLine('success', `✓ Query completed. Charged: ${amount}c. Balance: ${newBalance}c`);
                }}
              />
            </ToolErrorBoundary>
          );
        })()}
      </AnimatePresence>

      {/* Feedback & Chatbot Bubbles - Positioned on left to avoid terminal overlap */}
      {/* Bubbles - Right on mobile, Left on desktop */}
      <div className="fixed bottom-24 right-4 lg:left-6 lg:right-auto z-[53]">
        <FeedbackBubble 
          userId={user?.id} 
          userEmail={user?.email} 
          currentPage="/dashboard/student"
          position="right" 
        />
      </div>
      <div className="fixed bottom-6 right-4 lg:left-6 lg:right-auto z-[53]">
        <ChatbotBubble 
          userId={user?.id} 
          userName={user?.name}
          position="right" 
        />
      </div>
    </div>
  );
};

// Snake Game Component
const SnakeGame = ({ onScore, onClose }) => {
  const canvasRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const gridSize = 20;
    const tileCount = 15;
    
    let snake = [{ x: 7, y: 7 }];
    let food = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
    let dx = 0, dy = 0;
    let score = 0;
    let gameLoopId;
    
    const draw = () => {
      // Clear
      ctx.fillStyle = '#010408';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Grid
      ctx.strokeStyle = '#0a1520';
      for (let i = 0; i <= tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
      }
      
      // Snake
      snake.forEach((segment, i) => {
        ctx.fillStyle = i === 0 ? '#06b6d4' : '#0891b2';
        ctx.fillRect(segment.x * gridSize + 1, segment.y * gridSize + 1, gridSize - 2, gridSize - 2);
      });
      
      // Food
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, gridSize/2 - 2, 0, Math.PI * 2);
      ctx.fill();
    };
    
    const update = () => {
      const head = { x: snake[0].x + dx, y: snake[0].y + dy };
      
      // Wall collision
      if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        setGameOver(true);
        return;
      }
      
      // Self collision
      if (snake.some(s => s.x === head.x && s.y === head.y)) {
        setGameOver(true);
        return;
      }
      
      snake.unshift(head);
      
      // Eat food
      if (head.x === food.x && head.y === food.y) {
        score += 10;
        onScore(score);
        food = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
      } else {
        snake.pop();
      }
    };
    
    const gameLoop = () => {
      if (dx !== 0 || dy !== 0) update();
      draw();
      if (!gameOver) gameLoopId = setTimeout(gameLoop, 150);
    };
    
    const handleKeydown = (e) => {
      if (e.key === 'ArrowUp' && dy !== 1) { dx = 0; dy = -1; }
      if (e.key === 'ArrowDown' && dy !== -1) { dx = 0; dy = 1; }
      if (e.key === 'ArrowLeft' && dx !== 1) { dx = -1; dy = 0; }
      if (e.key === 'ArrowRight' && dx !== -1) { dx = 1; dy = 0; }
    };
    
    window.addEventListener('keydown', handleKeydown);
    gameLoop();
    
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      clearTimeout(gameLoopId);
    };
  }, [gameOver]);
  
  return (
    <div className="relative">
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={300} 
        className="rounded-lg border border-cyan-500/30"
      />
      {gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
          <p className="text-xl font-bold text-red-400 mb-4">Game Over!</p>
          <button
            onClick={() => { setGameOver(false); onScore(0); }}
            className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default RestrictedFieldInterface;
