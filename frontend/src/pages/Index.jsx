import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Shield,
  Crosshair,
  Activity,
  Radio,
  Zap,
  ChevronRight,
  Lock,
  Eye,
  Target,
  Wifi,
  Database,
  Cpu,
  Server,
  Terminal,
  Fingerprint,
  Scan,
  Sparkles,
  Binary,
  Network,
  Users,
  Home,
  LogIn
} from 'lucide-react';

// Particle system component
const ParticleField = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];
    let mouseX = 0;
    let mouseY = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.2,
        color: Math.random() > 0.5 ? 'cyan' : 'purple'
      });
    }

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      ctx.fillStyle = 'rgba(3, 7, 18, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        // Mouse attraction
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          p.vx += dx * 0.00005;
          p.vy += dy * 0.00005;
        }

        p.x += p.vx;
        p.y += p.vy;

        p.vx *= 0.99;
        p.vy *= 0.99;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color === 'cyan' 
          ? `rgba(34, 211, 238, ${p.opacity})`
          : `rgba(168, 85, 247, ${p.opacity})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const gradient = ctx.createLinearGradient(p.x, p.y, p2.x, p2.y);
            gradient.addColorStop(0, `rgba(34, 211, 238, ${0.1 * (1 - dist / 100)})`);
            gradient.addColorStop(1, `rgba(168, 85, 247, ${0.1 * (1 - dist / 100)})`);
            ctx.strokeStyle = gradient;
            ctx.stroke();
          }
        }
      });

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0" />;
};

// Holographic badge
const HoloBadge = ({ children }) => (
  <div className="relative px-5 py-2.5 rounded-full overflow-hidden bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 backdrop-blur-sm">
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
      animate={{ x: ['-100%', '200%'] }}
      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
    />
    <span className="relative z-10">{children}</span>
  </div>
);

// Glowing orb
const GlowingOrb = ({ size = 300, color = 'cyan', x, y, delay = 0 }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl pointer-events-none ${
      color === 'cyan' ? 'bg-cyan-500/20' : 'bg-purple-500/20'
    }`}
    style={{ width: size, height: size, left: x, top: y }}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.3, 0.5, 0.3],
    }}
    transition={{ duration: 4, repeat: Infinity, delay }}
  />
);

// Hex grid
const HexGrid = () => (
  <div className="absolute inset-0 overflow-hidden opacity-10">
    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
          <polygon
            points="24.8,22 37.3,29.2 37.3,43.6 24.8,50.8 12.3,43.6 12.3,29.2"
            fill="none"
            stroke="rgba(34, 211, 238, 0.3)"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hexagons)" />
    </svg>
  </div>
);

// Feature card
const FeatureCard = ({ icon: Icon, title, description, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.6 }}
    whileHover={{ scale: 1.03, rotateY: 3 }}
    className="group relative p-6 rounded-2xl overflow-hidden cursor-pointer"
    style={{ transformStyle: 'preserve-3d' }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl" />
    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="absolute inset-[1px] rounded-2xl border border-white/10 group-hover:border-cyan-500/30 transition-colors duration-500" />
    
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100"
      initial={{ x: '-100%' }}
      whileHover={{ x: '200%' }}
      transition={{ duration: 0.8 }}
    />

    <div className="relative z-10">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
        <Icon className="w-7 h-7 text-cyan-400 group-hover:text-cyan-300" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>

    <div className="absolute top-0 right-0 w-20 h-20 border-t border-r border-cyan-500/20 rounded-tr-2xl" />
    <div className="absolute bottom-0 left-0 w-20 h-20 border-b border-l border-purple-500/20 rounded-bl-2xl" />
  </motion.div>
);

// Animated stat counter
const AnimatedStat = ({ value, label, suffix = '', delay = 0 }) => {
  const [count, setCount] = useState(0);
  const numericValue = parseInt(value.replace(/\D/g, '')) || 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 2000;
      const steps = 60;
      const increment = numericValue / steps;
      let current = 0;
      const counter = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
          setCount(numericValue);
          clearInterval(counter);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(counter);
    }, delay);
    return () => clearTimeout(timer);
  }, [numericValue, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay / 1000, duration: 0.5 }}
      className="text-center"
    >
      <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
        {count}{suffix}
      </div>
      <div className="text-sm text-gray-500 mt-2 font-mono uppercase tracking-wider">{label}</div>
    </motion.div>
  );
};

// Floating 3D elements
const FloatingElements = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-cyan-400 rounded-full"
        style={{
          left: `${20 + Math.random() * 60}%`,
          top: `${20 + Math.random() * 60}%`,
        }}
        animate={{
          y: [0, -30, 0],
          opacity: [0.2, 0.8, 0.2],
          scale: [1, 1.5, 1],
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          delay: i * 0.5,
        }}
      />
    ))}
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const [activeInvestigations, setActiveInvestigations] = useState(2847);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    const invInterval = setInterval(() => {
      setActiveInvestigations(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 2000);
    return () => {
      clearInterval(timeInterval);
      clearInterval(invInterval);
    };
  }, []);

  const features = [
    { icon: Globe, title: 'Global Intelligence', description: 'Access 50+ worldwide data sources with real-time correlation capabilities.' },
    { icon: Fingerprint, title: 'Digital Forensics', description: 'Advanced fingerprint matching, face recognition, and biometric analysis.' },
    { icon: Database, title: 'Data Mining', description: 'Deep dive into breach databases, dark web monitoring, and SOCMINT.' },
    { icon: Shield, title: 'Threat Detection', description: 'AI-powered threat assessment with predictive analysis and risk scoring.' },
    { icon: Terminal, title: 'Case Management', description: 'Comprehensive investigation workflow with evidence tracking.' },
    { icon: Scan, title: 'Asset Discovery', description: 'Discover hidden connections and visualize complex networks.' },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-hidden relative">
      <ParticleField />
      <HexGrid />
      <FloatingElements />

      <GlowingOrb size={500} color="cyan" x="10%" y="20%" delay={0} />
      <GlowingOrb size={400} color="purple" x="70%" y="60%" delay={2} />
      <GlowingOrb size={300} color="cyan" x="80%" y="10%" delay={1} />

      {/* Scan lines */}
      <div className="fixed inset-0 pointer-events-none z-10 opacity-[0.02]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)'
        }}
      />

      <motion.div
        className="fixed left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent z-20 pointer-events-none"
        animate={{ top: ['-10%', '110%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header - Sticky Navbar */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#030712]/80 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <motion.div
              className="flex items-center gap-4"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
                <img src="/images/logo.png" alt="OsintX" className="relative w-14 h-14 object-contain" style={{ filter: 'drop-shadow(0 0 15px rgba(34, 211, 238, 0.6))' }} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-wide" style={{ fontFamily: "'Papyrus', 'Copperplate', fantasy", background: 'linear-gradient(135deg, #00ffff, #22d3ee, #7fffd4, #22d3ee, #00ffff)', backgroundSize: '300% 300%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'holoShift 4s ease-in-out infinite', letterSpacing: '0.1em' }}>
                  OsintX
                </h1>
                <p className="text-xs text-gray-500 font-mono">OSINT INVESTIGATION PLATFORM</p>
              </div>
            </motion.div>

            <motion.nav
              className="hidden md:flex items-center gap-8"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <Link 
                to="/" 
                className="flex items-center gap-2 text-cyan-400 font-medium transition-colors"
              >
                <Home className="w-4 h-4" />
                Home
              </Link>
            </motion.nav>

            <motion.div
              className="flex items-center gap-4"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-gray-400 font-mono">SYSTEMS ONLINE</span>
                </div>
                <div className="w-px h-4 bg-slate-700" />
                <span className="text-xs text-cyan-400 font-mono">
                  {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                </span>
              </div>

              <Link
                to="/select-role"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/25"
              >
                <LogIn className="w-4 h-4" />
                Get Started
              </Link>
            </motion.div>
          </div>
        </header>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-8"
            >
              <HoloBadge>
                <span className="flex items-center gap-2 text-sm">
                  <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="text-gray-400">
                    <span className="text-cyan-400 font-bold font-mono">{activeInvestigations.toLocaleString()}</span>
                    {' '}Active Investigations Worldwide
                  </span>
                </span>
              </HoloBadge>
            </motion.div>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 1 }}
            >
              <h2 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Next-Gen
                </span>
                <br />
                <span className="text-white">Intelligence Platform</span>
              </h2>
            </motion.div>

            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Professional OSINT investigation tools with AI-powered analysis, 
              real-time intelligence feeds, and military-grade security.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              {/* Login Button */}
              <motion.button
                onClick={() => navigate('/select-role')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-8 py-4 rounded-2xl overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600"
                  animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  style={{ backgroundSize: '200% 200%' }}
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
                <div className="absolute inset-0 rounded-2xl shadow-lg shadow-cyan-500/30" />
                <span className="relative z-10 flex items-center gap-3 text-white font-bold text-lg">
                  <Lock className="w-5 h-5" />
                  Login
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
            >
              <AnimatedStat value="50" label="Data Sources" suffix="+" delay={1200} />
              <AnimatedStat value="99" label="Uptime" suffix=".9%" delay={1400} />
              <AnimatedStat value="2" label="Response Time" suffix="s" delay={1600} />
              <AnimatedStat value="256" label="Bit Encryption" suffix="" delay={1800} />
            </motion.div>
          </div>
        </main>

        {/* Features */}
        <section className="px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="text-gray-400">Enterprise-Grade</span>{' '}
                <span className="text-cyan-400">OSINT Tools</span>
              </h3>
              <p className="text-gray-500 max-w-2xl mx-auto">
                21 professional investigation tools designed for law enforcement, 
                security researchers, and intelligence professionals.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <FeatureCard
                  key={feature.title}
                  {...feature}
                  delay={0.1 + i * 0.1}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="p-8 border-t border-slate-800/50">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src="/images/logo.png" alt="OsintX" className="w-8 h-8 object-contain" style={{ filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.4))' }} />
              <span className="text-sm text-gray-500 font-mono">
                © 2026 <span style={{ fontFamily: "'Papyrus', 'Copperplate', fantasy", background: 'linear-gradient(135deg, #06b6d4, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textShadow: '0 0 15px rgba(34, 211, 238, 0.4)' }}>OsintX</span> • OSINT INVESTIGATION PLATFORM
              </span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-xs text-gray-600 font-mono flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                ALL SYSTEMS OPERATIONAL
              </span>
            </div>
          </div>
        </footer>
      </div>

      <div className="fixed inset-0 pointer-events-none z-30 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
    </div>
  );
};

export default Index;
