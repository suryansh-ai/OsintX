import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  Eye,
  EyeOff,
  Shield,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  User,
  Mail,
  Lock,
  Sparkles,
  Users,
  CheckCircle,
  Target,
  FileSearch,
  GraduationCap
} from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signup, loginWithGoogle, loginWithGithub, isLoading, authError, clearError, isAuthenticated, user } = useAuth();

  // Get selected role from URL params or sessionStorage
  const urlRole = searchParams.get('role');
  const storedRole = sessionStorage.getItem('osintx_selected_role');
  const preSelectedRole = urlRole || storedRole || '';

  // Store role in sessionStorage if it came from URL
  useEffect(() => {
    if (urlRole) {
      sessionStorage.setItem('osintx_selected_role', urlRole);
    }
  }, [urlRole]);

  // Start at step 2 if role is pre-selected
  const [step, setStep] = useState(preSelectedRole ? 2 : 1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: preSelectedRole,
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(`/dashboard/${user.role}`);
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (authError) clearError();
  }, [formData]);

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.role) newErrors.role = 'Please select a role';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleBack = () => setStep(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    const result = await signup({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    });

    if (result.success) {
      navigate('/dashboard');
    }
  };

  const roles = [
    {
      id: 'student',
      title: 'Student/Individual',
      description: 'Access to basic OSINT tools and training resources',
      icon: Target,
      features: ['Basic search tools', 'Case viewing', 'Training modules'],
      color: 'cyan',
    },
    {
      id: 'user',
      title: 'Law Enforcement',
      description: 'Full access to all investigation tools and features',
      icon: FileSearch,
      features: ['All OSINT tools', 'Case management', 'Reports & exports', 'Team collaboration'],
      color: 'blue',
    },
  ];

  const getPasswordStrength = () => {
    const { password } = formData;
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.match(/[A-Z]/)) score++;
    if (password.match(/[0-9]/)) score++;
    if (password.match(/[^A-Za-z0-9]/)) score++;

    const levels = [
      { label: 'Weak', color: 'bg-red-500' },
      { label: 'Fair', color: 'bg-orange-500' },
      { label: 'Good', color: 'bg-yellow-500' },
      { label: 'Strong', color: 'bg-green-500' },
    ];

    return { score, ...levels[score - 1] || { label: 'Too short', color: 'bg-slate-600' } };
  };

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
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl" />

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
              Start your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                investigation journey
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-md">
              Join thousands of investigators using our platform to uncover digital intelligence and solve complex cases.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-3 gap-6"
          >
            {[
              { value: '50+', label: 'OSINT Tools' },
              { value: '10K+', label: 'Investigations' },
              { value: '99.9%', label: 'Uptime' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-12">
        <div className="min-h-full flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md py-8"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-2">
              <img src="/images/logo.png" alt="OsintX" className="w-16 h-16 object-contain" style={{ filter: 'drop-shadow(0 0 12px rgba(34, 211, 238, 0.5))' }} />
              <span className="text-2xl font-bold" style={{ fontFamily: "'Papyrus', 'Copperplate', fantasy", background: 'linear-gradient(135deg, #00ffff, #22d3ee, #7fffd4, #22d3ee, #00ffff)', backgroundSize: '300% 300%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'holoShift 4s ease-in-out infinite', letterSpacing: '0.1em' }}>OsintX</span>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                  step >= s 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25' 
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}>
                  {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                {s === 1 && (
                  <div className={`w-16 h-1 rounded-full transition-colors ${
                    step > 1 ? 'bg-gradient-to-r from-cyan-500 to-blue-600' : 'bg-slate-800'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            {/* Back to Role Selection - only show when role is pre-selected */}
            {preSelectedRole && step === 2 && (
              <Link 
                to="/select-role"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Change account type</span>
              </Link>
            )}
            
            {/* Role Badge - only show when role is pre-selected */}
            {preSelectedRole && step === 2 && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${
                formData.role === 'student' 
                  ? 'bg-cyan-500/10 border border-cyan-500/20' 
                  : 'bg-blue-500/10 border border-blue-500/20'
              }`}>
                {formData.role === 'student' ? (
                  <GraduationCap className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Shield className="w-4 h-4 text-blue-400" />
                )}
                <span className={`text-sm font-medium ${
                  formData.role === 'student' ? 'text-cyan-400' : 'text-blue-400'
                }`}>
                  {formData.role === 'student' ? 'Student / Researcher' : 'Law Enforcement'}
                </span>
              </div>
            )}
            
            <h2 className="text-2xl font-bold text-white mb-2">
              {step === 1 ? 'Choose your role' : 'Create your account'}
            </h2>
            <p className="text-slate-400">
              {step === 1 ? 'Select the access level that fits your needs' : 'Fill in your details to get started'}
            </p>
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

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  {/* Role Cards */}
                  {roles.map((role) => (
                    <motion.button
                      key={role.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: role.id })}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`w-full p-5 rounded-xl text-left transition-all ${
                        formData.role === role.id
                          ? 'bg-slate-800 border-2 border-cyan-500 shadow-lg shadow-cyan-500/10'
                          : 'bg-slate-800/50 border border-slate-700/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                          formData.role === role.id
                            ? role.color === 'cyan' ? 'bg-cyan-500/20' : 'bg-blue-500/20'
                            : 'bg-slate-700/50'
                        }`}>
                          <role.icon className={`w-6 h-6 ${
                            formData.role === role.id
                              ? role.color === 'cyan' ? 'text-cyan-400' : 'text-blue-400'
                              : 'text-slate-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-white">{role.title}</h3>
                            {formData.role === role.id && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center"
                              >
                                <CheckCircle className="w-4 h-4 text-white" />
                              </motion.div>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 mt-1">{role.description}</p>
                          
                          {formData.role === role.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              className="mt-4 flex flex-wrap gap-2"
                            >
                              {role.features.map((feature, i) => (
                                <span
                                  key={i}
                                  className={`px-3 py-1 rounded-full text-xs ${
                                    role.color === 'cyan'
                                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  }`}
                                >
                                  {feature}
                                </span>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}

                  {errors.role && (
                    <p className="text-sm text-red-400">{errors.role}</p>
                  )}

                  {/* Continue Button */}
                  <motion.button
                    type="button"
                    onClick={handleNext}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-3.5 mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Full Name
                    </label>
                    <div className={`relative rounded-xl transition-all duration-200 ${
                      focusedField === 'name' ? 'ring-2 ring-cyan-500/50' : ''
                    } ${errors.name ? 'ring-2 ring-red-500/50' : ''}`}>
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className={`w-5 h-5 transition-colors ${
                          focusedField === 'name' ? 'text-cyan-400' : 'text-slate-500'
                        }`} />
                      </div>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="John Doe"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                    {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address
                    </label>
                    <div className={`relative rounded-xl transition-all duration-200 ${
                      focusedField === 'email' ? 'ring-2 ring-cyan-500/50' : ''
                    } ${errors.email ? 'ring-2 ring-red-500/50' : ''}`}>
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className={`w-5 h-5 transition-colors ${
                          focusedField === 'email' ? 'text-cyan-400' : 'text-slate-500'
                        }`} />
                      </div>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="you@example.com"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                    {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Password
                    </label>
                    <div className={`relative rounded-xl transition-all duration-200 ${
                      focusedField === 'password' ? 'ring-2 ring-cyan-500/50' : ''
                    } ${errors.password ? 'ring-2 ring-red-500/50' : ''}`}>
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className={`w-5 h-5 transition-colors ${
                          focusedField === 'password' ? 'text-cyan-400' : 'text-slate-500'
                        }`} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                    {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
                    
                    {/* Password Strength */}
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-1.5 flex-1 rounded-full transition-colors ${
                                i <= getPasswordStrength().score ? getPasswordStrength().color : 'bg-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-400">{getPasswordStrength().label}</p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Confirm Password
                    </label>
                    <div className={`relative rounded-xl transition-all duration-200 ${
                      focusedField === 'confirmPassword' ? 'ring-2 ring-cyan-500/50' : ''
                    } ${errors.confirmPassword ? 'ring-2 ring-red-500/50' : ''}`}>
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className={`w-5 h-5 transition-colors ${
                          focusedField === 'confirmPassword' ? 'text-cyan-400' : 'text-slate-500'
                        }`} />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        onFocus={() => setFocusedField('confirmPassword')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <motion.button
                      type="button"
                      onClick={handleBack}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="flex-1 py-3.5 bg-slate-800 border border-slate-700 text-slate-300 font-semibold rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Back
                    </motion.button>

                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="flex-1 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-slate-400">
            Already have an account?{' '}
            <Link to={formData.role ? `/login?role=${formData.role}` : '/login'} className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>

          {/* OAuth Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/50" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-900 text-slate-500">Or sign up with</span>
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

export default Signup;
