/**
 * SettingsPanel — Unified cyber-investigator settings hub.
 * Embedded inside CyberAvatarDashboard via the "Settings" nav tab.
 *
 * Sections:
 *   1. Profile & Identity
 *   2. Security & Authentication
 *   3. Alpha_X MTProto Integration
 *   4. Appearance & Display
 *   5. Notifications
 *   6. Data & Export
 *   7. Advanced / Developer
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../context/SettingsContext';
import { useTelegram } from '../../../context/TelegramContext';
import { useCredits } from '../../../context/CreditContext';
import { useActivity } from '../../../context/ActivityContext';
import { useSession } from '../../../context/SessionContext';
import { AiProviderStatus } from '../../../components/ai';
import AiModelManagerPanel from '../../../components/ai/AiModelManagerPanel';
import {
  User, Shield, Send, Monitor, Bell, Database, Code,
  Save, Lock, Eye, EyeOff, Phone, Key, CheckCircle,
  AlertTriangle, Clock, Loader, Trash2, RefreshCw,
  ChevronRight, Mail, Zap, Download, Upload, Copy, Terminal,
  Fingerprint, Globe, Volume2, VolumeX, Moon, Sun, Settings,
  Brain, Cpu, Cloud, Plus, Minus, Server
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/* ───────── Tiny Toggle ───────── */
const Toggle = ({ value, onChange, disabled }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!value)}
    disabled={disabled}
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
      value ? 'bg-cyan-500/80' : 'bg-slate-600'
    } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
        value ? 'translate-x-5' : ''
      }`}
    />
  </button>
);

/* ───────── Setting Row ───────── */
const SettingRow = ({ icon: Icon, label, description, children, accent = 'cyan' }) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-800/60 last:border-0">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      {Icon && (
        <div className={`w-8 h-8 rounded-lg bg-${accent}-500/10 flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 text-${accent}-400`} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate">{label}</p>
        {description && <p className="text-xs text-gray-500 truncate">{description}</p>}
      </div>
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

/* ───────── Section Card ───────── */
const SectionCard = ({ id, icon: Icon, title, tag, children }) => (
  <section id={id} className="rounded-xl bg-slate-900/70 border border-slate-800/80 overflow-hidden">
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/40">
      <Icon className="w-4 h-4 text-cyan-400" />
      <h3 className="text-sm font-semibold text-gray-200 tracking-wide uppercase">{title}</h3>
      {tag && (
        <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          {tag}
        </span>
      )}
    </div>
    <div className="px-5 py-4">{children}</div>
  </section>
);

/* ───────── Alpha_X Status Indicator ───────── */
const TelegramStatusDot = ({ status }) => {
  if (status.loading) return <span className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />;
  if (!status.configured) return <span className="w-2 h-2 rounded-full bg-yellow-400" />;
  if (status.expiringSoon) return <span className="w-2 h-2 rounded-full bg-orange-400" />;
  return <span className="w-2 h-2 rounded-full bg-emerald-400" />;
};

/* ───────── Alpha_X Login Flow (embedded) ───────── */
const TelegramLoginInline = () => {
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

  // Error banner
  const errorBanner = loginState.error && (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 mt-3">
      <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
      <p className="text-xs text-red-300">{loginState.error}</p>
    </div>
  );

  // Step 1: Phone
  if (loginState.step === 'idle' || loginState.step === 'error') {
    return (
      <form onSubmit={handleSendCode} className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91XXXXXXXXXX"
              className="w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 font-mono"
              autoComplete="tel"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !phone.trim()}
            className="px-4 py-2.5 rounded-lg bg-cyan-600/80 hover:bg-cyan-500/80 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send OTP
          </button>
        </div>
        <p className="text-[11px] text-gray-600 font-mono">Include country code (e.g., +91 for India, +1 for US)</p>
        {errorBanner}
      </form>
    );
  }

  // Step 2: OTP
  if (loginState.step === 'codeSent' || loginState.step === 'verifying') {
    return (
      <form onSubmit={handleVerifyCode} className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          OTP sent to <span className="text-white font-mono">{loginState.phone}</span>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter OTP"
              maxLength={8}
              className="w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 font-mono tracking-widest text-center"
              autoFocus
              autoComplete="one-time-code"
            />
          </div>
          <button
            type="button"
            onClick={resetLogin}
            className="px-3 py-2.5 rounded-lg bg-slate-700 text-gray-300 text-sm hover:bg-slate-600 transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="px-4 py-2.5 rounded-lg bg-cyan-600/80 hover:bg-cyan-500/80 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loginState.step === 'verifying' ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Verify
          </button>
        </div>
        {errorBanner}
      </form>
    );
  }

  // Step 2b: 2FA
  if (loginState.step === 'needs2FA') {
    return (
      <form onSubmit={handleVerify2FA} className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-yellow-400">
          <Lock className="w-3.5 h-3.5" />
          Two-Factor Authentication required
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Cloud password"
              className="w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              autoFocus
            />
          </div>
          <button
            type="button"
            onClick={resetLogin}
            className="px-3 py-2.5 rounded-lg bg-slate-700 text-gray-300 text-sm hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !password}
            className="px-4 py-2.5 rounded-lg bg-cyan-600/80 hover:bg-cyan-500/80 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            Submit
          </button>
        </div>
        {errorBanner}
      </form>
    );
  }

  // Success
  if (loginState.step === 'success') {
    return (
      <div className="flex items-center gap-3 py-2">
        <CheckCircle className="w-5 h-5 text-emerald-400" />
        <span className="text-sm text-emerald-300 font-medium">Connected successfully — no local expiry timer</span>
      </div>
    );
  }

  return null;
};

/* ═══════════════════════════════════════════════════════════════════════
   MAIN SETTINGS PANEL
   ═══════════════════════════════════════════════════════════════════════ */

const SettingsPanel = () => {
  const { user, token, updateUser, logout } = useAuth();
  const { settings, updateSetting, toggleSetting, resetSettings, exportSettings, importSettings } = useSettings();
  const { status: tgStatus, revokeSession: tgRevoke, refreshStatus: tgRefresh, resetLogin } = useTelegram();
  const { credits } = useCredits();
  const { getActivityStats } = useSession();

  const [activeNav, setActiveNav] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null); // { type: 'ok'|'err', text }
  const [showPw, setShowPw] = useState(false);
  const [tgRevoking, setTgRevoking] = useState(false);

  const [profile, setProfile] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    organization: user?.organization || '',
    bio: user?.bio || '',
  });

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });

  const loginStats = getActivityStats?.() || {};

  // Flash save message
  useEffect(() => {
    if (saveMsg) {
      const t = setTimeout(() => setSaveMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [saveMsg]);

  /* ── Handlers ── */

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: profile.username,
          username: profile.username,
          bio: profile.bio,
          organization: profile.organization,
          phone: profile.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      updateUser?.(data.user);
      setIsEditing(false);
      setSaveMsg({ type: 'ok', text: 'Profile saved' });
    } catch (err) {
      setSaveMsg({ type: 'err', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (pw.next !== pw.confirm) {
      setSaveMsg({ type: 'err', text: 'Passwords do not match' });
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/auth/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password change failed');
      setPw({ current: '', next: '', confirm: '' });
      setSaveMsg({ type: 'ok', text: 'Password updated' });
    } catch (err) {
      setSaveMsg({ type: 'err', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTgRevoke = async () => {
    if (!window.confirm('Disconnect Alpha_X session? You will need to re-login.')) return;
    setTgRevoking(true);
    await tgRevoke();
    resetLogin();
    setTgRevoking(false);
  };

  // ── AI Settings: fetch from backend on mount ──
  const aiSettingsKeys = [
    'localAiEnabled', 'ollamaEndpoint', 'preferredLocalModel', 'browserAiEnabled',
    'cloudAiEnabled', 'groqApiKey', 'geminiApiKey', 'huggingFaceToken',
    'redactSensitiveBeforeCloud', 'allowCloudPerCase', 'maxAutomationDepth', 'autoSaveVerifiedEvidence',
    'requireApprovalBeforeRecursivePivots',
  ];

  const [aiLastSynced, setAiLastSynced] = useState(null);
  const [aiSyncLoading, setAiSyncLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/ai/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled || !json?.data) return;
        const merged = {};
        for (const key of aiSettingsKeys) {
          if (json.data[key] !== undefined) merged[key] = json.data[key];
        }
        updateSettings(merged);
        setAiLastSynced(Date.now());
      } catch { /* backend may be offline */ }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const handleSaveAiSettings = useCallback(async () => {
    if (!token) return;
    setAiSyncLoading(true);
    try {
      const body = {};
      for (const key of aiSettingsKeys) body[key] = settings[key];
      const res = await fetch(`${API_BASE}/ai/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAiLastSynced(Date.now());
      setSaveMsg({ type: 'ok', text: 'AI settings saved to server' });
    } catch (err) {
      setSaveMsg({ type: 'err', text: `Failed to save AI settings: ${err.message}` });
    } finally {
      setAiSyncLoading(false);
    }
  }, [token, settings, aiSettingsKeys]);

  const handleExport = () => {
    const blob = new Blob([exportSettings()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'osintx-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    setSaveMsg({ type: 'ok', text: 'Settings exported' });
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (importSettings(ev.target.result)) {
          setSaveMsg({ type: 'ok', text: 'Settings imported' });
        } else {
          setSaveMsg({ type: 'err', text: 'Invalid settings file' });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  /* ── Side navigation ── */
  const navSections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'telegram', label: 'Alpha_X', icon: Send, dot: <TelegramStatusDot status={tgStatus} /> },
    { id: 'appearance', label: 'Appearance', icon: Monitor },
    { id: 'notifications', label: 'Alerts', icon: Bell },
    { id: 'data', label: 'Data & Export', icon: Database },
    { id: 'advanced', label: 'Advanced', icon: Code },
    { id: 'ai', label: 'AI', icon: Zap },
  ];

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="flex gap-6 min-h-[calc(100vh-12rem)]">
      {/* ── LEFT NAV ──────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-52 flex-shrink-0">
        <div className="sticky top-24 space-y-1">
          {/* Operator badge */}
          <div className="flex items-center gap-3 px-3 py-3 mb-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-slate-700 flex items-center justify-center">
              <User className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-200 truncate">{user?.username || 'Operator'}</p>
              <p className="text-[10px] text-gray-500 font-mono truncate">{user?.role || 'user'}</p>
            </div>
          </div>

          {/* Nav items */}
          {navSections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveNav(s.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                activeNav === s.id
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              <s.icon className="w-3.5 h-3.5" />
              <span className="flex-1 text-left">{s.label}</span>
              {s.dot}
            </button>
          ))}

          {/* Bottom links */}
          <div className="pt-4 mt-4 border-t border-slate-800/60 space-y-1">
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export Config
            </button>
            <button
              onClick={handleImport}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Import Config
            </button>
          </div>
        </div>
      </aside>

      {/* ── MOBILE NAV ──────────────────────────────────────────────── */}
      <div className="lg:hidden flex gap-1 overflow-x-auto pb-2 mb-4 scrollbar-none -mx-1 px-1 flex-shrink-0">
        {navSections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveNav(s.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeNav === s.id
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                : 'text-gray-400 hover:text-gray-200 bg-slate-800/40 border border-transparent'
            }`}
          >
            <s.icon className="w-3.5 h-3.5" />
            {s.label}
            {s.dot}
          </button>
        ))}
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Save/Error toast */}
        {saveMsg && (
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border ${
              saveMsg.type === 'ok'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            {saveMsg.type === 'ok' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {saveMsg.text}
          </div>
        )}

        {/* ═══ PROFILE ═══════════════════════════════════════════════ */}
        {activeNav === 'profile' && (
          <div className="space-y-5">
            <SectionCard id="identity" icon={User} title="Identity">
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { key: 'username', label: 'Username', type: 'text', icon: User },
                  { key: 'email', label: 'Email', type: 'email', icon: Mail, disabled: true },
                  { key: 'phone', label: 'Phone', type: 'tel', icon: Phone },
                  { key: 'organization', label: 'Organization', type: 'text', icon: Globe },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-[11px] text-gray-500 font-mono mb-1.5 uppercase tracking-wider">{f.label}</label>
                    <div className="relative">
                      <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input
                        type={f.type}
                        value={profile[f.key]}
                        onChange={(e) => setProfile({ ...profile, [f.key]: e.target.value })}
                        disabled={f.disabled || !isEditing}
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 disabled:opacity-50 font-mono transition-colors"
                      />
                    </div>
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-gray-500 font-mono mb-1.5 uppercase tracking-wider">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    disabled={!isEditing}
                    rows={3}
                    className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 disabled:opacity-50 resize-none transition-colors"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600/80 text-white text-xs font-medium hover:bg-cyan-500/80 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setProfile({
                          username: user?.username || '',
                          email: user?.email || '',
                          phone: user?.phone || '',
                          organization: user?.organization || '',
                          bio: user?.bio || '',
                        });
                      }}
                      className="px-4 py-2 rounded-lg bg-slate-700 text-gray-300 text-xs font-medium hover:bg-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-gray-300 text-xs font-medium hover:bg-slate-700 border border-slate-700 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Edit Profile
                  </button>
                )}
              </div>
            </SectionCard>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Credits', value: credits?.balance ?? 0, color: 'cyan' },
                { label: 'Sessions', value: loginStats?.totalLogins || 0, color: 'violet' },
                { label: 'Role', value: user?.role || 'user', color: 'amber', mono: true },
              ].map((s) => (
                <div key={s.label} className="px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                  <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">{s.label}</p>
                  <p className={`text-lg font-bold text-${s.color}-400 ${s.mono ? 'font-mono text-sm' : ''} mt-0.5`}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ SECURITY ══════════════════════════════════════════════ */}
        {activeNav === 'security' && (
          <div className="space-y-5">
            <SectionCard id="password" icon={Key} title="Change Password">
              <div className="max-w-sm space-y-3">
                {[
                  { key: 'current', label: 'Current Password', placeholder: 'Current password' },
                  { key: 'next', label: 'New Password', placeholder: 'New password' },
                  { key: 'confirm', label: 'Confirm', placeholder: 'Confirm new password' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-[11px] text-gray-500 font-mono mb-1.5 uppercase tracking-wider">{f.label}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={pw[f.key]}
                        onChange={(e) => setPw({ ...pw, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 font-mono transition-colors"
                      />
                      {f.key === 'current' && (
                        <button
                          type="button"
                          onClick={() => setShowPw(!showPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                        >
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={handlePasswordChange}
                  disabled={!pw.current || !pw.next || !pw.confirm || isSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600/80 text-white text-xs font-medium hover:bg-cyan-500/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-1"
                >
                  {isSaving ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                  Update Password
                </button>
              </div>
            </SectionCard>

            <SectionCard id="sec-settings" icon={Shield} title="Security Controls">
              <div className="space-y-1">
                <SettingRow icon={Fingerprint} label="Two-Factor Authentication" description="Extra verification on login">
                  <Toggle value={settings.twoFactor || false} onChange={(v) => updateSetting('twoFactor', v)} />
                </SettingRow>
                <SettingRow icon={Bell} label="Login Alerts" description="Notify on new sign-ins">
                  <Toggle value={settings.loginAlerts ?? true} onChange={(v) => updateSetting('loginAlerts', v)} />
                </SettingRow>
              </div>
            </SectionCard>

            <SectionCard id="sessions" icon={Globe} title="Active Sessions">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-200">Current Session</p>
                    <p className="text-[10px] text-gray-500 font-mono">Windows · Browser · Active now</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ACTIVE
                </span>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ═══ ALPHA_X MTProto ═══════════════════════════════════════ */}
        {activeNav === 'telegram' && (
          <div className="space-y-5">
            {/* Status banner */}
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                tgStatus.loading
                  ? 'bg-slate-800/40 border-slate-700/40'
                  : tgStatus.configured
                    ? tgStatus.expiringSoon
                      ? 'bg-orange-500/5 border-orange-500/20'
                      : 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-yellow-500/5 border-yellow-500/20'
              }`}
            >
              <TelegramStatusDot status={tgStatus} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium ${
                  tgStatus.loading ? 'text-gray-400' :
                  tgStatus.configured ? (tgStatus.expiringSoon ? 'text-orange-300' : 'text-emerald-300') :
                  (tgStatus.expired ? 'text-yellow-300' : 'text-yellow-300')
                }`}>
                  {tgStatus.loading ? 'Checking session…' :
                   tgStatus.configured ? (tgStatus.expiringSoon && tgStatus.daysRemaining !== null
                     ? `Session expiring — ${tgStatus.daysRemaining}d remaining`
                     : 'Alpha_X connected') :
                   (tgStatus.expired ? 'Session expired — re-login required' : 'Not connected')}
                </p>
                {tgStatus.configured && tgStatus.phone && (
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                    {tgStatus.phone} · no local expiry
                    {tgStatus.lastUsed && ` · Last: ${new Date(tgStatus.lastUsed).toLocaleDateString()}`}
                  </p>
                )}
              </div>
              {tgStatus.configured && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => tgRefresh()}
                    className="p-2 rounded-lg bg-slate-800/60 text-gray-400 hover:text-white transition-colors"
                    title="Refresh status"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleTgRevoke}
                    disabled={tgRevoking}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    title="Revoke session"
                  >
                    {tgRevoking ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {/* Session details or login */}
            <SectionCard
              id="tg-session"
              icon={Send}
              title={tgStatus.configured ? 'Active Session' : 'Connect Alpha_X'}
              tag="MTProto"
            >
              {tgStatus.configured ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Phone', value: tgStatus.phone, mono: true },
                    { label: 'Local Expiry', value: 'None', color: 'text-emerald-400' },
                    { label: 'Policy', value: tgStatus.expiresAt ? new Date(tgStatus.expiresAt).toLocaleDateString() : 'Until revoke/restart' },
                    { label: 'Last Used', value: tgStatus.lastUsed ? new Date(tgStatus.lastUsed).toLocaleDateString() : 'Never' },
                  ].map((d) => (
                    <div key={d.label} className="px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/40">
                      <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">{d.label}</p>
                      <p className={`text-sm font-semibold mt-0.5 ${d.color || 'text-gray-200'} ${d.mono ? 'font-mono' : ''}`}>
                        {d.value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <TelegramLoginInline />
              )}
            </SectionCard>

            {/* How it works — collapsed info */}
            <SectionCard id="tg-info" icon={Zap} title="How It Works">
              <div className="space-y-2.5">
                {[
                  { icon: Phone, text: 'Enter your Alpha_X phone number and receive an OTP via Alpha_X' },
                  { icon: Shield, text: 'Backend logs in using MTProto protocol as a user account' },
                  { icon: Lock, text: 'Session is AES-encrypted and kept without a local expiry timer' },
                  { icon: Send, text: 'Tools query approved providers and parse the structured replies' },
                  { icon: Clock, text: 'Reconfigure only if you revoke it, restart an in-memory server, or Alpha_X invalidates it' },
                ].map(({ icon: I, text }, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded bg-slate-800/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <I className="w-3 h-3 text-cyan-500/70" />
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Dev hint */}
            <div className="px-4 py-2.5 rounded-lg bg-slate-900/30 border border-slate-800/40">
              <p className="text-[10px] text-gray-600 font-mono leading-relaxed">
                ENV: provider API credentials required in backend config.
                Obtain credentials from{' '}
                <a href="https://my.telegram.org" target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:text-cyan-500 underline underline-offset-2">
                  provider portal
                </a>
              </p>
            </div>
          </div>
        )}

        {/* ═══ APPEARANCE ════════════════════════════════════════════ */}
        {activeNav === 'appearance' && (
          <div className="space-y-5">
            <SectionCard id="display" icon={Monitor} title="Display">
              <div className="space-y-1">
                <SettingRow icon={settings.theme === 'dark' ? Moon : Sun} label="Theme" description={`Currently: ${settings.theme}`}>
                  <select
                    value={settings.theme}
                    onChange={(e) => updateSetting('theme', e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/40"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="system">System</option>
                  </select>
                </SettingRow>
                <SettingRow icon={Monitor} label="Font Size" description={settings.fontSize}>
                  <select
                    value={settings.fontSize}
                    onChange={(e) => updateSetting('fontSize', e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/40"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </SettingRow>
                <SettingRow icon={Zap} label="Compact Mode" description="Reduce spacing for data density">
                  <Toggle value={settings.compactMode} onChange={(v) => updateSetting('compactMode', v)} />
                </SettingRow>
                <SettingRow icon={Eye} label="Animations" description="Enable UI transitions">
                  <Toggle value={settings.enableAnimations} onChange={(v) => updateSetting('enableAnimations', v)} />
                </SettingRow>
                <SettingRow icon={Eye} label="Reduced Motion" description="Minimize movement for accessibility">
                  <Toggle value={settings.reducedMotion} onChange={(v) => updateSetting('reducedMotion', v)} />
                </SettingRow>
                <SettingRow icon={Fingerprint} label="High Contrast" description="Enhanced color contrast">
                  <Toggle value={settings.highContrast} onChange={(v) => updateSetting('highContrast', v)} />
                </SettingRow>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ═══ NOTIFICATIONS ═════════════════════════════════════════ */}
        {activeNav === 'notifications' && (
          <div className="space-y-5">
            <SectionCard id="alerts" icon={Bell} title="Alert Preferences">
              <div className="space-y-1">
                <SettingRow icon={Bell} label="Push Notifications" description="Browser push alerts">
                  <Toggle value={settings.enableNotifications} onChange={(v) => updateSetting('enableNotifications', v)} />
                </SettingRow>
                <SettingRow icon={settings.enableSounds ? Volume2 : VolumeX} label="Sound Effects" description="Audible notifications">
                  <Toggle value={settings.enableSounds} onChange={(v) => updateSetting('enableSounds', v)} />
                </SettingRow>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ═══ DATA & EXPORT ═════════════════════════════════════════ */}
        {activeNav === 'data' && (
          <div className="space-y-5">
            <SectionCard id="data-mgmt" icon={Database} title="Data Management">
              <div className="space-y-1">
                <SettingRow icon={Save} label="Auto-Save Results" description="Persist investigation results">
                  <Toggle value={settings.autoSaveResults} onChange={(v) => updateSetting('autoSaveResults', v)} />
                </SettingRow>
                <SettingRow icon={Database} label="Cache Results" description="Local caching for faster lookups">
                  <Toggle value={settings.cacheResults} onChange={(v) => updateSetting('cacheResults', v)} />
                </SettingRow>
                <SettingRow icon={Lock} label="Save Sensitive Data" description="Store passwords / tokens locally">
                  <Toggle value={settings.saveSensitiveData} onChange={(v) => updateSetting('saveSensitiveData', v)} />
                </SettingRow>
                <SettingRow icon={Eye} label="Analytics" description="Send anonymous usage stats">
                  <Toggle value={settings.analyticsEnabled} onChange={(v) => updateSetting('analyticsEnabled', v)} />
                </SettingRow>
                <SettingRow icon={Download} label="Default Export Format" description={settings.defaultExportFormat?.toUpperCase()}>
                  <select
                    value={settings.defaultExportFormat}
                    onChange={(e) => updateSetting('defaultExportFormat', e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/40"
                  >
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                    <option value="pdf">PDF</option>
                  </select>
                </SettingRow>
              </div>
            </SectionCard>

            <SectionCard id="export-import" icon={Copy} title="Configuration">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-gray-300 text-xs font-medium border border-slate-700 hover:bg-slate-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Settings
                </button>
                <button
                  onClick={handleImport}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-gray-300 text-xs font-medium border border-slate-700 hover:bg-slate-700 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Import Settings
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Reset all settings to defaults?')) {
                      resetSettings();
                      setSaveMsg({ type: 'ok', text: 'Settings reset to defaults' });
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20 hover:bg-red-500/20 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset Defaults
                </button>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ═══ ADVANCED ══════════════════════════════════════════════ */}
        {activeNav === 'advanced' && (
          <div className="space-y-5">
            <SectionCard id="dev" icon={Terminal} title="Developer Options">
              <div className="space-y-1">
                <SettingRow icon={Code} label="Debug Mode" description="Extra console logging">
                  <Toggle value={settings.debugMode} onChange={(v) => updateSetting('debugMode', v)} />
                </SettingRow>
                <SettingRow icon={Zap} label="Keyboard Shortcuts" description="Enable hotkey bindings">
                  <Toggle value={settings.keyboardShortcuts} onChange={(v) => updateSetting('keyboardShortcuts', v)} />
                </SettingRow>
                <SettingRow icon={Clock} label="API Timeout" description={`${(settings.apiTimeout / 1000)}s`}>
                  <select
                    value={settings.apiTimeout}
                    onChange={(e) => updateSetting('apiTimeout', Number(e.target.value))}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/40"
                  >
                    <option value={15000}>15s</option>
                    <option value={30000}>30s</option>
                    <option value={60000}>60s</option>
                    <option value={120000}>120s</option>
                  </select>
                </SettingRow>
                <SettingRow icon={RefreshCw} label="Max Retries" description={`${settings.maxRetries} attempts`}>
                  <select
                    value={settings.maxRetries}
                    onChange={(e) => updateSetting('maxRetries', Number(e.target.value))}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/40"
                  >
                    <option value={1}>1</option>
                    <option value={3}>3</option>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                  </select>
                </SettingRow>
                <SettingRow icon={Database} label="History Limit" description={`${settings.maxHistoryItems} items`}>
                  <select
                    value={settings.maxHistoryItems}
                    onChange={(e) => updateSetting('maxHistoryItems', Number(e.target.value))}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/40"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                  </select>
                </SettingRow>
                <SettingRow icon={Zap} label="Batch Size" description={`${settings.batchSize} per request`}>
                  <select
                    value={settings.batchSize}
                    onChange={(e) => updateSetting('batchSize', Number(e.target.value))}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/40"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </SettingRow>
              </div>
            </SectionCard>

            {/* System info */}
            <div className="px-4 py-3 rounded-lg bg-slate-900/40 border border-slate-800/40 font-mono text-[10px] text-gray-600 leading-relaxed space-y-0.5">
              <p>OsintX Platform · Build: {new Date().toISOString().slice(0, 10)}</p>
              <p>Env: {import.meta.env.MODE} · API: {API_BASE}</p>
              <p>User: {user?.email || 'N/A'} · Role: {user?.role || 'user'}</p>
            </div>
          </div>
        )}

        {/* ═══ AI & AUTOMATION ═════════════════════════════════════ */}
        {activeNav === 'ai' && (
          <div className="space-y-5">
            {/* Provider Status */}
            <AiProviderStatus />

            {/* Sync status + Save button */}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-slate-900/40 border border-slate-800/60">
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI settings: {aiLastSynced ? `synced ${new Date(aiLastSynced).toLocaleTimeString()}` : 'loaded locally'}</span>
              </div>
              <button
                onClick={handleSaveAiSettings}
                disabled={aiSyncLoading || !token}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/80 text-white text-[11px] font-medium hover:bg-cyan-500/80 transition-colors disabled:opacity-40"
              >
                {aiSyncLoading ? <Loader className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save to Server
              </button>
            </div>

            <SectionCard id="ai-local" icon={Zap} title="AI & Automation">
              {/* Local AI */}
              <SettingRow icon={Cpu} label="Local AI Enabled" description="Use local AI models for investigation assistance">
                <Toggle value={settings.localAiEnabled} onChange={(v) => updateSetting('localAiEnabled', v)} />
              </SettingRow>
              {settings.localAiEnabled && (
                <>
                  <SettingRow icon={Terminal} label="Ollama Endpoint" description="Local Ollama API endpoint (default: http://127.0.0.1:11434)">
                    <input
                      type="text"
                      value={settings.ollamaEndpoint}
                      onChange={(e) => updateSetting('ollamaEndpoint', e.target.value)}
                      className="w-48 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-cyan-500/40"
                    />
                  </SettingRow>
                  <SettingRow icon={Zap} label="Preferred Local Model" description="Ollama model name (e.g. qwen2.5:3b, llama3.2:3b)">
                    <input
                      type="text"
                      value={settings.preferredLocalModel}
                      onChange={(e) => updateSetting('preferredLocalModel', e.target.value)}
                      className="w-48 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-cyan-500/40"
                    />
                  </SettingRow>
                </>
              )}
              <SettingRow icon={Globe} label="Browser AI Enabled" description="Use browser-based AI (Transformers.js) for classification">
                <Toggle value={settings.browserAiEnabled} onChange={(v) => updateSetting('browserAiEnabled', v)} />
              </SettingRow>

              {/* Cloud AI divider */}
              <div className="flex items-center gap-3 py-2 mt-4 mb-1">
                <div className="h-px flex-1 bg-slate-800/80" />
                <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Cloud AI Providers</span>
                <div className="h-px flex-1 bg-slate-800/80" />
              </div>

              <SettingRow icon={Cloud} label="Cloud AI Enabled" description="Enable optional cloud AI providers (requires API keys)">
                <Toggle value={settings.cloudAiEnabled} onChange={(v) => updateSetting('cloudAiEnabled', v)} />
              </SettingRow>
              {settings.cloudAiEnabled && (
                <>
                  <SettingRow icon={Zap} label="Groq API Key" description="Optional: Groq API key for fast inference">
                    <input
                      type="password"
                      value={settings.groqApiKey}
                      onChange={(e) => updateSetting('groqApiKey', e.target.value)}
                      placeholder="gsk_..."
                      className="w-48 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-cyan-500/40 placeholder:text-gray-600"
                    />
                  </SettingRow>
                  <SettingRow icon={Zap} label="Gemini API Key" description="Optional: Google Gemini API key">
                    <input
                      type="password"
                      value={settings.geminiApiKey}
                      onChange={(e) => updateSetting('geminiApiKey', e.target.value)}
                      placeholder="AIza..."
                      className="w-48 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-cyan-500/40 placeholder:text-gray-600"
                    />
                  </SettingRow>
                  <SettingRow icon={Zap} label="Hugging Face Token" description="Optional: Hugging Face inference token">
                    <input
                      type="password"
                      value={settings.huggingFaceToken}
                      onChange={(e) => updateSetting('huggingFaceToken', e.target.value)}
                      placeholder="hf_..."
                      className="w-48 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-cyan-500/40 placeholder:text-gray-600"
                    />
                  </SettingRow>
                  <SettingRow icon={Shield} label="Redact Sensitive Data Before Cloud" description="Remove emails, IPs, keys before sending to cloud AI">
                    <Toggle value={settings.redactSensitiveBeforeCloud} onChange={(v) => updateSetting('redactSensitiveBeforeCloud', v)} />
                  </SettingRow>
                  <SettingRow icon={Globe} label="Allow Cloud AI Per Case" description="Enable cloud AI per-case instead of globally (requires cloud AI enabled)">
                    <Toggle value={settings.allowCloudPerCase ?? false} onChange={(v) => updateSetting('allowCloudPerCase', v)} />
                  </SettingRow>
                </>
              )}

              {/* Automation divider */}
              <div className="flex items-center gap-3 py-2 mt-4 mb-1">
                <div className="h-px flex-1 bg-slate-800/80" />
                <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Automation Settings</span>
                <div className="h-px flex-1 bg-slate-800/80" />
              </div>

              <SettingRow icon={Zap} label="Maximum Automation Depth" description="How deep recursive investigation can go (1-3)">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateSetting('maxAutomationDepth', Math.max(1, (settings.maxAutomationDepth || 2) - 1))}
                    className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-gray-400 hover:text-white hover:border-cyan-500/40 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-xs font-mono text-gray-200 tabular-nums">{settings.maxAutomationDepth ?? 2}</span>
                  <button
                    type="button"
                    onClick={() => updateSetting('maxAutomationDepth', Math.min(3, (settings.maxAutomationDepth || 2) + 1))}
                    className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-gray-400 hover:text-white hover:border-cyan-500/40 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </SettingRow>
              <SettingRow icon={Save} label="Auto-Save Verified Evidence" description="Automatically save verified tool results to case">
                <Toggle value={settings.autoSaveVerifiedEvidence} onChange={(v) => updateSetting('autoSaveVerifiedEvidence', v)} />
              </SettingRow>
              <SettingRow icon={Shield} label="Require Approval Before Recursive Pivots" description="Ask before automatically pivoting to new entities">
                <Toggle value={settings.requireApprovalBeforeRecursivePivots} onChange={(v) => updateSetting('requireApprovalBeforeRecursivePivots', v)} />
              </SettingRow>
            </SectionCard>

            {/* Model Manager */}
            <SectionCard id="ai-models" icon={Brain} title="AI Model Manager">
              <AiModelManagerPanel />
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;
