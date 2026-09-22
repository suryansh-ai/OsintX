import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Check, AlertCircle, RefreshCw, Trash2, GripVertical,
  Brain, Power, PowerOff, Loader, ChevronDown, ChevronUp,
} from 'lucide-react';

const PROVIDERS = [
  { id: 'openai', label: 'OpenAI', needsKey: true, needsEndpoint: false, color: 'emerald' },
  { id: 'groq', label: 'Groq', needsKey: true, needsEndpoint: false, color: 'purple' },
  { id: 'gemini', label: 'Gemini', needsKey: true, needsEndpoint: false, color: 'amber' },
  { id: 'anthropic', label: 'Anthropic', needsKey: true, needsEndpoint: false, color: 'blue' },
  { id: 'huggingface', label: 'HuggingFace', needsKey: true, needsEndpoint: false, color: 'orange' },
  { id: 'openrouter', label: 'OpenRouter', needsKey: true, needsEndpoint: false, color: 'cyan' },
  { id: 'ollama', label: 'Ollama (Local)', needsKey: false, needsEndpoint: true, color: 'violet' },
  { id: 'custom', label: 'Custom API', needsKey: false, needsEndpoint: true, color: 'gray' },
];

const DEFAULT_MODELS = {
  openai: 'gpt-4o',
  groq: 'llama-3.1-8b-instant',
  gemini: 'gemini-2.0-flash',
  anthropic: 'claude-3-5-sonnet-20241022',
  huggingface: 'mistralai/Mistral-7B-Instruct-v0.3',
  openrouter: 'openai/gpt-4o',
  ollama: 'qwen2.5:3b',
  custom: '',
};

const COLORS = {
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', dot: 'bg-purple-500' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-500' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-500' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-500' },
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', dot: 'bg-cyan-500' },
  violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400', dot: 'bg-violet-500' },
  gray: { bg: 'bg-gray-500/10', border: 'border-gray-500/20', text: 'text-gray-400', dot: 'bg-gray-500' },
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AiModelManagerPanel() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ provider: 'openai', label: '', modelName: '', apiKey: '', endpoint: '' });
  const [error, setError] = useState('');

  const fetchModels = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE}/ai/models`, { credentials: 'include' });
      const json = await resp.json();
      if (json.success) setModels(json.data);
    } catch (e) {
      console.error('Failed to load AI models:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  const handleAdd = async () => {
    if (!form.label || !form.modelName) { setError('Label and model name required'); return; }
    const provider = PROVIDERS.find(p => p.id === form.provider);
    if (provider?.needsKey && !form.apiKey) { setError('API key required for this provider'); return; }
    if (provider?.needsEndpoint && !form.endpoint) { setError('Endpoint URL required for this provider'); return; }
    setSaving(true); setError('');
    try {
      const resp = await fetch(`${API_BASE}/ai/models`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await resp.json();
      if (json.success) {
        setModels(prev => [...prev, json.data]);
        setShowAdd(false);
        setForm({ provider: 'openai', label: '', modelName: '', apiKey: '', endpoint: '' });
      } else {
        setError(json.error || 'Failed to add model');
      }
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (modelId, isActive) => {
    try {
      const resp = await fetch(`${API_BASE}/ai/models/${modelId}/toggle`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      const json = await resp.json();
      if (json.success) {
        setModels(prev => prev.map(m => m._id === modelId ? { ...m, isActive } : m));
      }
    } catch { /* ignore */ }
  };

  const handleTest = async (modelId) => {
    setTestingId(modelId);
    try {
      const resp = await fetch(`${API_BASE}/ai/models/${modelId}/test`, { method: 'POST', credentials: 'include' });
      const json = await resp.json();
      if (json.success) {
        setModels(prev => prev.map(m =>
          m._id === modelId ? { ...m, lastTestOk: json.data.ok, lastTestError: json.data.error, lastTestedAt: new Date().toISOString() } : m
        ));
      }
    } catch { /* ignore */ }
    finally { setTestingId(null); }
  };

  const handleDelete = async (modelId) => {
    try {
      const resp = await fetch(`${API_BASE}/ai/models/${modelId}`, { method: 'DELETE', credentials: 'include' });
      const json = await resp.json();
      if (json.success) setModels(prev => prev.filter(m => m._id !== modelId));
    } catch { /* ignore */ }
  };

  const handleMoveUp = async (idx) => {
    if (idx === 0) return;
    const reordered = [...models];
    [reordered[idx - 1], reordered[idx]] = [reordered[idx], reordered[idx - 1]];
    setModels(reordered);
    const orderedIds = reordered.map(m => m._id);
    await fetch(`${API_BASE}/ai/models/reorder/all`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds }),
    });
  };

  const handleMoveDown = async (idx) => {
    if (idx === models.length - 1) return;
    const reordered = [...models];
    [reordered[idx], reordered[idx + 1]] = [reordered[idx + 1], reordered[idx]];
    setModels(reordered);
    const orderedIds = reordered.map(m => m._id);
    await fetch(`${API_BASE}/ai/models/reorder/all`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Brain className="w-5 h-5 text-amber-400" />
          AI Models
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {models.filter(m => m.isActive).length}/{models.length} active
          </span>
          <button
            onClick={() => setShowAdd(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Model
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Configured models are tried in priority order. The first model to respond successfully is used for all AI features.
        Add multiple models to set up automatic fallback.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 text-amber-400 animate-spin" />
        </div>
      ) : models.length === 0 ? (
        <div className="rounded-xl p-8 bg-gray-900/50 border border-dashed border-gray-700 text-center">
          <Brain className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-1">No AI models configured</p>
          <p className="text-xs text-gray-600">Add a model API key above to enable AI-powered features</p>
        </div>
      ) : (
        <div className="space-y-2">
          {models.map((model, idx) => {
            const prov = PROVIDERS.find(p => p.id === model.provider);
            const c = COLORS[prov?.color || 'gray'];
            return (
              <div key={model._id}
                className={`rounded-xl p-4 ${c.bg} ${c.border} border transition-all ${model.isActive ? 'opacity-100' : 'opacity-50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => handleMoveUp(idx)} className="text-gray-600 hover:text-white transition-colors disabled:opacity-20" disabled={idx === 0}>
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleMoveDown(idx)} className="text-gray-600 hover:text-white transition-colors disabled:opacity-20" disabled={idx === models.length - 1}>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${c.dot} ${model.lastTestOk === false ? 'bg-red-500' : model.lastTestOk ? c.dot : 'bg-gray-600'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{model.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${c.bg} ${c.text}`}>{model.provider}</span>
                      {model.lastTestOk === true && <Check className="w-3 h-3 text-emerald-400" />}
                      {model.lastTestOk === false && <AlertCircle className="w-3 h-3 text-red-400" />}
                    </div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">{model.modelName}{model.usageCount ? ` • ${model.usageCount} calls` : ''}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleTest(model._id)}
                      disabled={testingId === model._id}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-all"
                      title="Test connection"
                    >
                      {testingId === model._id ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleToggle(model._id, !model.isActive)}
                      className={`p-1.5 rounded-lg transition-all ${model.isActive ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-gray-600 hover:bg-white/10'}`}
                      title={model.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {model.isActive ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDelete(model._id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {model.lastTestError && model.lastTestOk === false && (
                  <div className="mt-2 text-[11px] text-red-400/80 bg-red-500/10 rounded-lg px-3 py-1.5">
                    {model.lastTestError}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="rounded-xl p-5 bg-gray-900 border border-amber-500/30 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">Add AI Model</span>
              <button onClick={() => { setShowAdd(false); setError(''); }} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Provider</label>
                <select value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value, modelName: DEFAULT_MODELS[e.target.value] || '' })}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-sm outline-none focus:border-amber-500/50"
                >
                  {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Label</label>
                <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })}
                  placeholder="My OpenAI Key"
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-sm outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Model Name</label>
                <input value={form.modelName} onChange={e => setForm({ ...form, modelName: e.target.value })}
                  placeholder={DEFAULT_MODELS[form.provider] || 'gpt-4o'}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-sm font-mono outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">API Key {PROVIDERS.find(p => p.id === form.provider)?.needsKey ? <span className="text-red-400">*</span> : <span className="text-gray-600">(optional)</span>}</label>
                <input value={form.apiKey} onChange={e => setForm({ ...form, apiKey: e.target.value })}
                  type="password" placeholder="sk-..."
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-sm font-mono outline-none focus:border-amber-500/50"
                />
              </div>
              {PROVIDERS.find(p => p.id === form.provider)?.needsEndpoint && (
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">Endpoint URL <span className="text-red-400">*</span></label>
                  <input value={form.endpoint} onChange={e => setForm({ ...form, endpoint: e.target.value })}
                    placeholder={form.provider === 'ollama' ? 'http://127.0.0.1:11434' : 'https://...'}
                    className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-sm font-mono outline-none focus:border-amber-500/50"
                  />
                </div>
              )}
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowAdd(false); setError(''); }} className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition-all">Cancel</button>
              <button onClick={handleAdd} disabled={saving}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving && <Loader className="w-3 h-3 animate-spin" />}
                Add Model
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
