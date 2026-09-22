import { useState, useCallback, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import {
  Bell, Plus, Trash2, EyeOff, Eye, RefreshCw, Loader2,
  AlertTriangle, CheckCircle, Info, Clock, Filter,
  Activity, Zap, Shield, ToggleLeft, ToggleRight
} from 'lucide-react';
import caseService from '../../services/caseService';

const SEVERITY_COLORS = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/30',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  low: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
};

const WatchedEntityRow = memo(function WatchedEntityRow({ watch, onToggle, onDelete, onCheck, onAcknowledge }) {
  const unacknowledged = (watch.changesDetected || []).filter(c => !c.acknowledged);
  const severityClass = SEVERITY_COLORS[watch.severity] || SEVERITY_COLORS.low;

  return (
    <div className={`bg-gray-800/30 border rounded-lg p-3 ${severityClass.split(' ')[2] || 'border-gray-700/30'}`}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-200 font-medium truncate">{watch.label || watch.entityValue}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${severityClass.split(' ').slice(0, 2).join(' ')}`}>
              {watch.severity}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-gray-500">{watch.entityType}</span>
            <span className="text-[10px] text-gray-600">•</span>
            <span className="text-[10px] text-gray-500">{watch.checkInterval}</span>
            {watch.lastCheckAt && (
              <>
                <span className="text-[10px] text-gray-600">•</span>
                <span className="text-[10px] text-gray-500">Checked: {new Date(watch.lastCheckAt).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {unacknowledged.length > 0 && (
            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full">
              {unacknowledged.length}
            </span>
          )}
          <button onClick={() => onCheck(watch._id)} className="p-1.5 text-gray-600 hover:text-cyan-400 transition-colors" title="Check now">
            <RefreshCw className="w-3 h-3" />
          </button>
          <button onClick={() => onToggle(watch._id, !watch.isActive)} className="p-1.5 text-gray-600 hover:text-gray-300 transition-colors" title={watch.isActive ? 'Pause' : 'Activate'}>
            {watch.isActive ? <ToggleRight className="w-3 h-3 text-green-400" /> : <ToggleLeft className="w-3 h-3" />}
          </button>
          <button onClick={() => onDelete(watch._id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors" title="Remove">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      {unacknowledged.length > 0 && (
        <div className="mt-2 space-y-1 border-t border-gray-700/20 pt-2">
          {unacknowledged.slice(0, 3).map((change, ci) => (
            <div key={ci} className="flex items-start gap-2">
              <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-[10px] text-gray-400 flex-1">{change.summary}</p>
              <button
                onClick={() => onAcknowledge(watch._id, ci)}
                className="text-[10px] text-gray-600 hover:text-gray-400 shrink-0"
              >
                Ack
              </button>
            </div>
          ))}
          {unacknowledged.length > 3 && (
            <p className="text-[10px] text-gray-600">+{unacknowledged.length - 3} more</p>
          )}
        </div>
      )}
    </div>
  );
});

const WatchtowerPanel = memo(function WatchtowerPanel({ caseId }) {
  const [watchedEntities, setWatchedEntities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingId, setCheckingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ entityType: 'email', entityValue: '', label: '', severity: 'medium', checkInterval: 'daily' });
  const [error, setError] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('all');

  const loadWatched = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    try {
      const res = await caseService.getWatchedEntities(caseId);
      if (res?.success) setWatchedEntities(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load watchtower');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { loadWatched(); }, [loadWatched]);

  const handleAdd = useCallback(async () => {
    if (!formData.entityValue.trim()) return;
    try {
      const res = await caseService.addWatchItem(caseId, formData);
      if (res?.success) {
        setWatchedEntities(prev => [res.data, ...prev]);
        setShowAddForm(false);
        setFormData({ entityType: 'email', entityValue: '', label: '', severity: 'medium', checkInterval: 'daily' });
      }
    } catch (err) {
      setError(err.message || 'Failed to add watch item');
    }
  }, [caseId, formData]);

  const handleToggle = useCallback(async (watchId, isActive) => {
    try {
      const res = await caseService.updateWatchItem(caseId, watchId, { isActive });
      if (res?.success) {
        setWatchedEntities(prev => prev.map(w => w._id === watchId ? { ...w, isActive } : w));
      }
    } catch (err) {
      setError(err.message || 'Toggle failed');
    }
  }, [caseId]);

  const handleDelete = useCallback(async (watchId) => {
    try {
      await caseService.removeWatchItem(caseId, watchId);
      setWatchedEntities(prev => prev.filter(w => w._id !== watchId));
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  }, [caseId]);

  const handleCheck = useCallback(async (watchId) => {
    setCheckingId(watchId);
    try {
      const res = await caseService.checkWatchItem(caseId, watchId);
      if (res?.success) {
        setWatchedEntities(prev => prev.map(w => w._id === watchId ? { ...w, changesDetected: [...(res.data.changes || []), ...(w.changesDetected || [])], lastCheckAt: new Date(), alertCount: res.data.alertCount } : w));
      }
    } catch (err) {
      setError(err.message || 'Check failed');
    } finally {
      setCheckingId(null);
    }
  }, [caseId]);

  const handleAcknowledge = useCallback(async (watchId, changeIndex) => {
    try {
      const res = await caseService.acknowledgeWatchChange(caseId, watchId, changeIndex);
      if (res?.success) {
        setWatchedEntities(prev => prev.map(w => {
          if (w._id !== watchId) return w;
          const changes = [...(w.changesDetected || [])];
          if (changes[changeIndex]) changes[changeIndex] = { ...changes[changeIndex], acknowledged: true };
          return { ...w, changesDetected: changes };
        }));
      }
    } catch (err) {
      setError(err.message || 'Acknowledge failed');
    }
  }, [caseId]);

  const filtered = severityFilter === 'all' ? watchedEntities : watchedEntities.filter(w => w.severity === severityFilter);
  const activeAlerts = watchedEntities.reduce((sum, w) => sum + (w.changesDetected || []).filter(c => !c.acknowledged).length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-semibold text-gray-200">Entity Watchtower</h3>
          {activeAlerts > 0 && (
            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
              {activeAlerts} alert{activeAlerts > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAddForm(prev => !prev)}
          className="flex items-center gap-1.5 bg-cyan-500/15 text-cyan-400 px-3 py-1.5 rounded-lg text-[11px] font-medium hover:bg-cyan-500/25 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Watch
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {showAddForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-gray-500 mb-1">Entity Type</p>
              <select
                value={formData.entityType}
                onChange={e => setFormData(prev => ({ ...prev, entityType: e.target.value }))}
                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-cyan-500/50"
              >
                {['email', 'domain', 'ip', 'url', 'phone', 'username', 'crypto', 'hash', 'person', 'organization'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 mb-1">Check Interval</p>
              <select
                value={formData.checkInterval}
                onChange={e => setFormData(prev => ({ ...prev, checkInterval: e.target.value }))}
                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-cyan-500/50"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 mb-1">Entity Value *</p>
            <input
              type="text"
              value={formData.entityValue}
              onChange={e => setFormData(prev => ({ ...prev, entityValue: e.target.value }))}
              placeholder="email@example.com, 1.2.3.4, example.com..."
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-gray-500 mb-1">Label (optional)</p>
              <input
                type="text"
                value={formData.label}
                onChange={e => setFormData(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Friendly name"
                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 mb-1">Severity</p>
              <select
                value={formData.severity}
                onChange={e => setFormData(prev => ({ ...prev, severity: e.target.value }))}
                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-cyan-500/50"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button onClick={() => setShowAddForm(false)} className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 transition-colors">Cancel</button>
            <button onClick={handleAdd} disabled={!formData.entityValue.trim()} className="text-xs bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-lg hover:bg-cyan-500/30 disabled:opacity-40 transition-colors">
              Add to Watchtower
            </button>
          </div>
        </motion.div>
      )}

      <div className="flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-gray-500" />
        {['all', 'critical', 'high', 'medium', 'low'].map(s => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className={`text-[10px] px-2 py-1 rounded-lg border transition-colors ${
              severityFilter === s
                ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                : 'border-gray-700/50 text-gray-500 hover:text-gray-300'
            }`}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">{watchedEntities.length === 0 ? 'No watched entities' : 'No matches'}</p>
          {watchedEntities.length === 0 && (
            <button onClick={() => setShowAddForm(true)} className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
              Add your first entity to watch
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(watch => (
            <WatchedEntityRow
              key={watch._id}
              watch={watch}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onCheck={handleCheck}
              onAcknowledge={handleAcknowledge}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default WatchtowerPanel;
