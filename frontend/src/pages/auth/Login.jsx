import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import CaptchaWidget from '../../components/common/CaptchaWidget';
import { 
  Eye, 
  EyeOff, 
  Shield, 
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  Globe,
  GraduationCap
} from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, demoLogin, loginWithGoogle, loginWithGithub, isLoading, authError, clearError, isAuthenticated, user } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaError, setCaptchaError] = useState(false);

  // Get selected role from URL params or sessionStorage
  const urlRole = searchParams.get('role');
  const storedRole = sessionStorage.getItem('osintx_selected_role');
  const selectedRole = urlRole || storedRole || 'student';

  // Store role in sessionStorage if it came from URL
  useEffect(() => {
    if (urlRole) {
      sessionStorage.setItem('osintx_selected_role', urlRole);
    }
  }, [urlRole]);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(`/dashboard/${user.role}`);
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (authError) clearError();
  }, [email, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Check CAPTCHA token (optional - can be disabled if not configured)
    if (!captchaToken && import.meta.env.VITE_CAPTCHA_PROVIDER) {
      setCaptchaError(true);
      return;
    }
    const result = await login(email, password, captchaToken);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  const handleCaptchaVerify = (token) => {
    setCaptchaToken(token);
    setCaptchaError(false);
  };

  const handleCaptchaError = () => {
    setCaptchaToken(null);
    setCaptchaError(true);
  };

  const handleCaptchaExpired = () => {
    setCaptchaToken(null);
  };

  const handleDemoLogin = async (role) => {
    clearError();
    const result = await demoLogin(role);
    if (result.success) {
      navigate(`/dashboard/${role}`);
    }
  };

  const features = [
    { icon: Globe, text: '50+ OSINT Tools' },
    { icon: Shield, text: 'AI-Powered Analysis' },
    { icon: GraduationCap, text: 'Team Collaboration' },
  ];

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
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
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
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

      {/* Right Side - Login Form */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-12">
        <div className="min-h-full flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md py-8"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center gap-3 mb-2">
              <img src="/images/logo.png" alt="OsintX" className="w-16 h-16 object-contain" style={{ filter: 'drop-shadow(0 0 12px rgba(34, 211, 238, 0.5))' }} />
              <span className="text-2xl font-bold" style={{ fontFamily: "'Papyrus', 'Copperplate', fantasy", background: 'linear-gradient(135deg, #00ffff, #22d3ee, #7fffd4, #22d3ee, #00ffff)', backgroundSize: '300% 300%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'holoShift 4s ease-in-out infinite', letterSpacing: '0.1em' }}>OsintX</span>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            {/* Back to Role Selection */}
            <Link 
              to="/select-role"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Change account type</span>
            </Link>
            
            {/* Role Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${
              selectedRole === 'student' 
                ? 'bg-cyan-500/10 border border-cyan-500/20' 
                : 'bg-blue-500/10 border border-blue-500/20'
            }`}>
              {selectedRole === 'student' ? (
                <GraduationCap className="w-4 h-4 text-cyan-400" />
              ) : (
                <Shield className="w-4 h-4 text-blue-400" />
              )}
              <span className={`text-sm font-medium ${
                selectedRole === 'student' ? 'text-cyan-400' : 'text-blue-400'
              }`}>
                {selectedRole === 'student' ? 'Student / Researcher' : 'Law Enforcement'}
              </span>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
            <p className="text-slate-400">Sign in to continue your investigation</p>
          </div>

          {/* Error Message */}
          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{authError}</p>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <div className={`relative rounded-xl transition-all duration-200 ${
                focusedField === 'email' ? 'ring-2 ring-cyan-500/50' : ''
              }`}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className={`w-5 h-5 transition-colors ${
                    focusedField === 'email' ? 'text-cyan-400' : 'text-slate-500'
                  }`} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className={`relative rounded-xl transition-all duration-200 ${
                focusedField === 'password' ? 'ring-2 ring-cyan-500/50' : ''
              }`}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className={`w-5 h-5 transition-colors ${
                    focusedField === 'password' ? 'text-cyan-400' : 'text-slate-500'
                  }`} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* CAPTCHA Widget */}
            <div className="flex justify-center">
              <CaptchaWidget
                onVerify={handleCaptchaVerify}
                onError={handleCaptchaError}
                onExpired={handleCaptchaExpired}
                theme="dark"
                showStatus={false}
              />
            </div>

            {/* CAPTCHA Error */}
            {captchaError && (
              <p className="text-red-400 text-sm text-center">Please complete the CAPTCHA verification</p>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* OAuth Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/50" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-900 text-slate-500">Or continue with</span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              type="button"
              onClick={loginWithGoogle}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800 transition-all text-white font-medium disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </motion.button>

            <motion.button
              type="button"
              onClick={loginWithGithub}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800 transition-all text-white font-medium disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </motion.button>
          </div>

          {/* Demo Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/50" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-900 text-slate-500">Try a demo account</span>
            </div>
          </div>

          {/* Demo Login Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              type="button"
              onClick={() => handleDemoLogin('student')}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-cyan-500/10 border border-cyan-500/40 hover:bg-cyan-500/20 transition-all text-cyan-300 font-medium disabled:opacity-50"
            >
              <GraduationCap className="w-5 h-5" />
              Demo Student
            </motion.button>

            <motion.button
              type="button"
              onClick={() => handleDemoLogin('user')}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-blue-500/10 border border-blue-500/40 hover:bg-blue-500/20 transition-all text-blue-300 font-medium disabled:opacity-50"
            >
              <Shield className="w-5 h-5" />
              Demo Investigator
            </motion.button>
          </div>
          <p className="mt-2 text-center text-xs text-slate-600">
            Instant access — no credentials needed
          </p>

          {/* Signup Link */}
          <p className="mt-6 text-center text-slate-400">
            Don't have an account?{' '}
            <Link to={`/signup?role=${selectedRole}`} className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              Create one
            </Link>
          </p>

          {/* Footer */}
          <p className="mt-8 text-center text-slate-600 text-xs">
            © 2026 <span style={{ fontFamily: "'Papyrus', 'Copperplate', fantasy", background: 'linear-gradient(135deg, #06b6d4, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textShadow: '0 0 15px rgba(34, 211, 238, 0.4)' }}>OsintX</span>. All rights reserved.
          </p>
        </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
