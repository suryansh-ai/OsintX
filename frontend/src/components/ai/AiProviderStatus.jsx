import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Cpu, Cloud, RefreshCw, CheckCircle, XCircle, Loader } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const statusDot = (available) => (
  <span className={`w-2 h-2 rounded-full ${available === null ? 'bg-gray-600 animate-pulse' : available ? 'bg-emerald-400' : 'bg-red-400'}`} />
);

const AiProviderStatus = ({ onStatusChange }) => {
  const { token } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/ai/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStatus(data.providers || {});
      onStatusChange?.(data.providers);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, [token]);

  if (!token) return null;

  const providers = [
    { id: 'deterministic', icon: Cpu, label: 'Deterministic', color: 'text-emerald-400' },
    { id: 'ollama', icon: Cpu, label: 'Ollama', color: 'text-blue-400' },
    { id: 'groq', icon: Cloud, label: 'Groq', color: 'text-purple-400' },
    { id: 'gemini', icon: Cloud, label: 'Gemini', color: 'text-amber-400' },
    { id: 'huggingface', icon: Cloud, label: 'HuggingFace', color: 'text-yellow-400' },
  ];

  return (
    <div className="rounded-xl bg-slate-900/70 border border-slate-800/80 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/40">
        <Cpu className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-gray-200 tracking-wide uppercase">Provider Status</h3>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="ml-auto p-1 rounded text-gray-500 hover:text-cyan-400 hover:bg-slate-800 transition-colors disabled:opacity-40"
          title="Refresh provider status"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="p-4 space-y-2">
        {error && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
            <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
            Failed to check providers: {error}
          </div>
        )}
        {providers.map((p) => {
          const s = status?.[p.id];
          const available = s ? (s.available ?? null) : null;
          return (
            <div key={p.id} className="flex items-center gap-3 py-1.5">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <p.icon className={`w-3.5 h-3.5 ${p.color}`} />
                <span className="text-xs text-gray-300">{p.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {available === null && loading ? (
                  <Loader className="w-3 h-3 text-gray-500 animate-spin" />
                ) : available ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <CheckCircle className="w-3 h-3" />
                    Available
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-red-400">
                    <XCircle className="w-3 h-3" />
                    Offline
                  </span>
                )}
                {s?.models?.length > 0 && (
                  <span className="text-[9px] text-gray-500 ml-1">({s.models.length})</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AiProviderStatus;
