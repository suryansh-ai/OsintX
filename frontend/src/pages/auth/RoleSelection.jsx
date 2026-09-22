import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Shield,
  ArrowRight,
  Globe,
  Zap,
  Users,
  BookOpen,
  BadgeCheck,
  FileSearch,
  Scale
} from 'lucide-react';

const RoleSelection = () => {
  const navigate = useNavigate();
  const [hoveredRole, setHoveredRole] = useState(null);

  const handleRoleSelect = (role) => {
    // Store selected role in sessionStorage for use after login/signup
    sessionStorage.setItem('osintx_selected_role', role);
    // Navigate to login with role parameter
    navigate(`/login?role=${role}`);
  };

  const roles = [
    {
      id: 'student',
      title: 'Student / Researcher',
      subtitle: 'Educational & Research Access',
      icon: GraduationCap,
      color: 'cyan',
      gradient: 'from-cyan-500 to-blue-600',
      bgGradient: 'from-cyan-950/30 to-slate-950',
      borderColor: 'border-cyan-500/30',
      hoverBorder: 'hover:border-cyan-400/60',
      shadowColor: 'shadow-cyan-500/20',
      description: 'Perfect for students, researchers, and individuals learning OSINT techniques.',
      features: [
        { icon: BookOpen, text: 'Access to training modules' },
        { icon: FileSearch, text: 'Basic OSINT tools' },
        { icon: Users, text: 'Community support' }
      ]
    },
    {
      id: 'user',
      title: 'Law Enforcement',
      subtitle: 'Professional Investigation Access',
      icon: Shield,
      color: 'blue',
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-950/30 to-slate-950',
      borderColor: 'border-blue-500/30',
      hoverBorder: 'hover:border-blue-400/60',
      shadowColor: 'shadow-blue-500/20',
      description: 'Full access for law enforcement professionals and authorized investigators.',
      features: [
        { icon: BadgeCheck, text: 'Full tool access' },
        { icon: Scale, text: 'Case management' },
        { icon: Zap, text: 'Advanced features' }
      ]
    }
  ];

  const features = [
    { icon: Globe, text: '50+ OSINT Tools' },
    { icon: Zap, text: 'AI-Powered Analysis' },
    { icon: Users, text: 'Team Collaboration' },
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Left Side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center gap-4 mb-6">
              <img src="/images/logo.png" alt="OsintX" className="w-20 h-20 object-contain" style={{ filter: 'drop-shadow(0 0 15px rgba(34, 211, 238, 0.5))' }} />
              <div>
                <h1 className="text-3xl font-bold" style={{ fontFamily: "'Papyrus', 'Copperplate', fantasy", background: 'linear-gradient(135deg, #00ffff, #22d3ee, #7fffd4, #22d3ee, #00ffff)', backgroundSize: '300% 300%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'holoShift 4s ease-in-out infinite', letterSpacing: '0.1em' }}>OsintX</h1>
                <p className="text-slate-400 text-sm" style={{ fontFamily: "'Papyrus', fantasy", letterSpacing: '0.15em' }}>OSINT Investigation Platform</p>
              </div>
            </div>
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
              Intelligence at your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                fingertips
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-md">
              Access powerful OSINT tools, conduct investigations, and uncover insights with our comprehensive platform.
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-slate-300">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Side - Role Selection */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-12">
        <div className="min-h-full flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl py-8"
          >
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-10">
              <div className="inline-flex items-center gap-3 mb-2">
                <img src="/images/logo.png" alt="OsintX" className="w-16 h-16 object-contain" style={{ filter: 'drop-shadow(0 0 12px rgba(34, 211, 238, 0.5))' }} />
                <span className="text-2xl font-bold" style={{ fontFamily: "'Papyrus', 'Copperplate', fantasy", background: 'linear-gradient(135deg, #00ffff, #22d3ee, #7fffd4, #22d3ee, #00ffff)', backgroundSize: '300% 300%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'holoShift 4s ease-in-out infinite', letterSpacing: '0.1em' }}>OsintX</span>
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6"
              >
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-sm text-slate-400">Select Your Account Type</span>
              </motion.div>
              
              <h2 className="text-3xl font-bold text-white mb-3">Who are you?</h2>
              <p className="text-slate-400 max-w-md mx-auto">
                Choose your account type to get started. This will customize your experience and available features.
              </p>
            </div>

            {/* Role Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {roles.map((role, index) => {
                const IconComponent = role.icon;
                const isHovered = hoveredRole === role.id;
                
                return (
                  <motion.button
                    key={role.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    onClick={() => handleRoleSelect(role.id)}
                    onMouseEnter={() => setHoveredRole(role.id)}
                    onMouseLeave={() => setHoveredRole(null)}
                    className={`
                      relative rounded-2xl overflow-hidden text-left
                      bg-gradient-to-br ${role.bgGradient}
                      border-2 ${role.borderColor} ${role.hoverBorder}
                      transition-all duration-300
                      ${isHovered ? `scale-[1.02] shadow-xl ${role.shadowColor}` : ''}
                      group p-6
                    `}
                  >
                    {/* Glow effect on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    
                    {/* Icon and Title */}
                    <div className="relative z-10">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center mb-4 shadow-lg ${role.shadowColor}`}>
                        <IconComponent className="w-7 h-7 text-white" />
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-1">
                        {role.title}
                      </h3>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                        {role.subtitle}
                      </p>
                      <p className="text-sm text-slate-400 mb-4">
                        {role.description}
                      </p>

                      {/* Features */}
                      <div className="space-y-2 mb-4">
                        {role.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                            <feature.icon className={`w-4 h-4 text-${role.color}-400`} />
                            <span>{feature.text}</span>
                          </div>
                        ))}
                      </div>

                      {/* CTA */}
                      <div className={`flex items-center gap-2 text-${role.color}-400 font-medium`}>
                        <span>Continue as {role.id === 'student' ? 'Student' : 'Law Enforcement'}</span>
                        <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1`} />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Footer */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center text-slate-600 text-xs"
            >
              © 2026 <span style={{ fontFamily: "'Papyrus', 'Copperplate', fantasy", background: 'linear-gradient(135deg, #06b6d4, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textShadow: '0 0 15px rgba(34, 211, 238, 0.4)' }}>OsintX</span>. All rights reserved.
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
