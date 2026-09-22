import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelegram } from '../../../context/TelegramContext';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Shield, Key, CheckCircle, AlertTriangle,
  Clock, RefreshCw, Loader, Send, Lock, Trash2, Zap, MessageSquare
} from 'lucide-react';

// ─── Status Banner ─────────────────────────────────────────────────────

const StatusBanner = ({ status }) => {
  if (status.loading) return null;

  if (!status.configured) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
        <div>
          <p className="text-yellow-300 font-medium text-sm">
            {status.expired ? 'Alpha_X session expired' : 'Alpha_X not configured'}
          </p>
          <p className="text-yellow-300/70 text-xs mt-0.5">
            {status.expired
              ? 'Alpha_X rejected the saved session. Please re-login with a new OTP.'
              : 'Enter your phone number and OTP below to connect.'}
          </p>
        </div>
      </div>
    );
  }

  if (status.expiringSoon && status.daysRemaining !== null) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
        <Clock className="w-5 h-5 text-orange-400 flex-shrink-0" />
        <div>
          <p className="text-orange-300 font-medium text-sm">
            Session expiring soon — {status.daysRemaining} day{status.daysRemaining !== 1 ? 's' : ''} remaining
          </p>
          <p className="text-orange-300/70 text-xs mt-0.5">
            Please reconfigure with a new number before it expires to avoid disruption.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
      <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-emerald-300 font-medium text-sm">Alpha_X connected</p>
        <p className="text-emerald-300/70 text-xs mt-0.5">
          Phone: {status.phone} · no local expiry
          {status.lastUsed && ` · Last used: ${new Date(status.lastUsed).toLocaleDateString()}`}
        </p>
      </div>
    </div>
  );
};

// ─── Login Form ────────────────────────────────────────────────────────

const LoginForm = () => {
  const { loginState, sendCode, verifyCode, verify2FA, resetLogin } = useTelegram();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    await sendCode(phone.trim());
    setLoading(false);
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    await verifyCode(code.trim());
    setLoading(false);
    setCode('');
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    await verify2FA(password);
    setLoading(false);
    setPassword('');
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {/* Step 1: Enter phone */}
        {(loginState.step === 'idle' || loginState.step === 'error') && (
          <motion.form
            key="phone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSendCode}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number (with country code)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91XXXXXXXXXX"
                  className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 font-mono"
                  autoComplete="tel"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                Include country code (e.g., +91 for India, +1 for US)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !phone.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              Send OTP Code
            </button>
          </motion.form>
        )}

        {/* Step 2: Enter OTP */}
        {(loginState.step === 'codeSent' || loginState.step === 'verifying') && (
          <motion.form
            key="code"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleVerifyCode}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              OTP sent to <span className="text-white font-mono">{loginState.phone}</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Enter OTP Code
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="12345"
                  maxLength={8}
                  className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 font-mono text-center text-xl tracking-[0.3em]"
                  autoFocus
                  autoComplete="one-time-code"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetLogin}
                className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-gray-300 font-medium transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginState.step === 'verifying' ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                Verify
              </button>
            </div>
          </motion.form>
        )}

        {/* Step 2b: 2FA Password */}
        {loginState.step === 'needs2FA' && (
          <motion.form
            key="2fa"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleVerify2FA}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-sm text-yellow-400 mb-2">
              <Lock className="w-4 h-4" />
              Two-Factor Authentication required
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cloud Password (2FA)
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your Alpha_X cloud password"
                  className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetLogin}
                className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-gray-300 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !password}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Shield className="w-5 h-5" />
                )}
                Submit
              </button>
            </div>
          </motion.form>
        )}

        {/* Success */}
        {loginState.step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 py-6"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-emerald-300 font-medium">Alpha_X connected successfully!</p>
            <p className="text-gray-500 text-sm">Session remains active until server restart, revoke, or Alpha_X invalidates it</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {loginState.error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
        >
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{loginState.error}</p>
        </motion.div>
      )}
    </div>
  );
};

// ─── Active Session Card ───────────────────────────────────────────────

const ActiveSessionCard = () => {
  const { status, revokeSession, resetLogin } = useTelegram();
  const [revoking, setRevoking] = useState(false);

  const handleRevoke = async () => {
    if (!window.confirm('This will disconnect your Alpha_X session. You will need to re-login.')) return;
    setRevoking(true);
    await revokeSession();
    resetLogin();
    setRevoking(false);
  };

  if (!status.configured) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <p className="text-xs text-gray-500 mb-1">Phone Number</p>
          <p className="text-white font-mono">{status.phone}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <p className="text-xs text-gray-500 mb-1">Local Expiry</p>
          <p className="font-mono font-bold text-lg text-emerald-400">
            None
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <p className="text-xs text-gray-500 mb-1">Session Policy</p>
          <p className="text-gray-300 text-sm">
            {status.expiresAt ? new Date(status.expiresAt).toLocaleString() : 'Until revoke/server restart'}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <p className="text-xs text-gray-500 mb-1">Last Used</p>
          <p className="text-gray-300 text-sm">
            {status.lastUsed ? new Date(status.lastUsed).toLocaleString() : 'Never'}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleRevoke}
          disabled={revoking}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          {revoking ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Revoke Session
        </button>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-gray-300 hover:bg-slate-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Status
        </button>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────

const TelegramSettings = ({ embedded }) => {
  const { status } = useTelegram();
  const navigate = useNavigate();

  const content = (
    <div className={embedded ? 'space-y-8' : 'max-w-2xl mx-auto px-6 py-8 space-y-8'}>
      {/* Status Banner */}
      <StatusBanner status={status} />

        {/* Session Info or Login Form */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold">
              {status.configured ? 'Active Session' : 'Connect Alpha_X'}
            </h2>
          </div>

          {status.configured ? <ActiveSessionCard /> : <LoginForm />}
        </div>

        {/* How it works */}
        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">How it works</h3>
          <div className="space-y-3">
            {[
              { icon: Phone, text: 'Enter your Alpha_X phone number and receive an OTP' },
              { icon: Shield, text: 'Backend logs into Alpha_X using the MTProto protocol' },
              { icon: Key, text: 'Session is encrypted and kept without a local expiry timer' },
              { icon: MessageSquare, text: 'Tools query approved providers and parse the replies' },
              { icon: Clock, text: 'Reconfigure only if you revoke it, restart an in-memory server, or Alpha_X invalidates it' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-sm text-gray-400">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Env vars hint for developer */}
        <div className="rounded-xl bg-slate-900/30 border border-slate-800/50 p-4">
          <p className="text-xs text-gray-600 font-mono">
            Requires provider API credentials in backend .env
            <br />
            Get these from{' '}
            <a
              href="https://my.telegram.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-600 hover:text-cyan-500"
            >
              provider portal
            </a>
          </p>
        </div>
      </div>
  );

  if (embedded) return content;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Alpha_X Configuration</h1>
              <p className="text-xs text-gray-500">Connect your Alpha_X account for investigation tools</p>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-6 py-8">
        {content}
      </div>
    </div>
  );
};

export default TelegramSettings;
