import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link as LinkIcon, Eye, AlertTriangle, Bell, Plus, X,
  Clock, CheckCircle, Search, Filter, Shield, Target,
  TrendingUp, Activity, ExternalLink, Settings
} from 'lucide-react';

const WatchlistIntegration = ({
  caseId,
  linkedWatchlistItems = [],
  alerts: persistedAlerts = [],
  onLinkItem,
  onUnlinkItem,
  onCreateAlert
}) => {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const demoWatchlistItems = [
    { id: 1, type: 'ip', value: '192.168.1.100', category: 'suspicious', addedDate: '2024-01-15', hits: 5, severity: 'high', notes: 'Known C2 server', linked: true },
    { id: 2, type: 'domain', value: 'malicious-site.com', category: 'malware', addedDate: '2024-01-10', hits: 12, severity: 'critical', notes: 'Phishing domain', linked: true },
    { id: 3, type: 'email', value: 'attacker@phish.com', category: 'phishing', addedDate: '2024-01-12', hits: 3, severity: 'high', notes: 'Spear phishing actor', linked: false },
    { id: 4, type: 'hash', value: 'a1b2c3d4e5f6...', category: 'malware', addedDate: '2024-01-08', hits: 8, severity: 'medium', notes: 'Ransomware payload', linked: false },
    { id: 5, type: 'ip', value: '10.0.0.55', category: 'infrastructure', addedDate: '2024-01-14', hits: 2, severity: 'medium', notes: 'Possible proxy', linked: true },
  ];

  const demoAlerts = [
    { id: 1, type: 'hit', item: 'malicious-site.com', message: 'Domain accessed from internal network', time: '5 mins ago', status: 'unread' },
    { id: 2, type: 'match', item: '192.168.1.100', message: 'IP found in new case evidence', time: '1 hour ago', status: 'read' },
    { id: 3, type: 'threshold', item: 'attacker@phish.com', message: 'Hit count threshold exceeded (3)', time: '3 hours ago', status: 'read' },
  ];

  const watchlistItems = linkedWatchlistItems.length > 0
    ? linkedWatchlistItems.map((item) => ({
        ...item,
        id: item.id || item._id || item.value,
        category: item.category || item.type || 'case',
        hits: item.hits || 0,
        severity: item.severity || 'medium',
        notes: item.notes || item.label || '',
        linked: true,
      }))
    : demoWatchlistItems;

  const [localAlerts, setLocalAlerts] = useState([]);
  const alerts = persistedAlerts.length > 0 ? persistedAlerts : (localAlerts.length > 0 ? localAlerts : demoAlerts);

  const [newAlert, setNewAlert] = useState({
    item: '',
    condition: 'any_hit',
    threshold: 5,
    notifyEmail: true,
    notifyDashboard: true
  });

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'suspicious', label: 'Suspicious', color: 'yellow' },
    { id: 'malware', label: 'Malware', color: 'red' },
    { id: 'phishing', label: 'Phishing', color: 'orange' },
    { id: 'infrastructure', label: 'Infrastructure', color: 'blue' },
  ];

  // Filter items
  const filteredItems = watchlistItems.filter(item => {
    const matchesSearch = item.value.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const linkedItems = watchlistItems.filter(item => item.linked);

  // Get type icon
  const getTypeIcon = (type) => {
    switch (type) {
      case 'ip': return '🌐';
      case 'domain': return '🔗';
      case 'email': return '📧';
      case 'hash': return '#️⃣';
      default: return '📌';
    }
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  // Handle link/unlink
  const handleToggleLink = (item) => {
    if (item.linked) {
      onUnlinkItem?.(item);
    } else {
      onLinkItem?.(item);
    }
  };

  // Handle create alert
  const handleCreateAlert = () => {
    const alert = {
      id: Date.now(),
      ...newAlert,
      createdAt: new Date().toISOString()
    };
    setLocalAlerts(prev => [alert, ...prev]);
    onCreateAlert?.(alert);
    setShowCreateAlert(false);
    setNewAlert({ item: '', condition: 'any_hit', threshold: 5, notifyEmail: true, notifyDashboard: true });
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
          <div className="flex items-center justify-between mb-2">
            <Eye className="w-5 h-5 text-amber-400" />
            <span className="text-xs text-gray-500">Linked</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{linkedItems.length}</p>
          <p className="text-xs text-gray-500">Watchlist Items</p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-xs text-gray-500">Active</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{alerts.filter(a => a.status === 'unread').length}</p>
          <p className="text-xs text-gray-500">Unread Alerts</p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-green-400" />
            <span className="text-xs text-gray-500">Total</span>
          </div>
          <p className="text-2xl font-bold text-green-400">
            {linkedItems.reduce((sum, item) => sum + item.hits, 0)}
          </p>
          <p className="text-xs text-gray-500">Total Hits</p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
          <div className="flex items-center justify-between mb-2">
            <Shield className="w-5 h-5 text-purple-400" />
            <span className="text-xs text-gray-500">Severity</span>
          </div>
          <p className="text-2xl font-bold text-purple-400">
            {linkedItems.filter(i => i.severity === 'critical' || i.severity === 'high').length}
          </p>
          <p className="text-xs text-gray-500">High/Critical</p>
        </div>
      </div>

      {/* Linked Items */}
      <div className="rounded-xl bg-gray-900/50 border border-amber-500/20">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-amber-400" />
            Linked Watchlist Items
          </h3>
          <button
            onClick={() => setShowLinkModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/30"
          >
            <Plus className="w-4 h-4" />
            Link Item
          </button>
        </div>

        <div className="p-4">
          {linkedItems.length > 0 ? (
            <div className="space-y-3">
              {linkedItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800"
                >
                  <span className="text-2xl">{getTypeIcon(item.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-white font-mono">{item.value}</code>
                      <span className={`text-[10px] px-2 py-0.5 rounded bg-${getSeverityColor(item.severity)}-500/20 text-${getSeverityColor(item.severity)}-400`}>
                        {item.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-amber-400">{item.hits}</p>
                    <p className="text-[10px] text-gray-500">Hits</p>
                  </div>
                  <button
                    onClick={() => handleToggleLink(item)}
                    className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Eye className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">No watchlist items linked to this case</p>
              <button
                onClick={() => setShowLinkModal(true)}
                className="mt-4 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-sm"
              >
                Link Watchlist Item
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      <div className="rounded-xl bg-gray-900/50 border border-amber-500/20">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            Watchlist Alerts
            {alerts.filter(a => a.status === 'unread').length > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-[10px] flex items-center justify-center text-white">
                {alerts.filter(a => a.status === 'unread').length}
              </span>
            )}
          </h3>
          <button
            onClick={() => setShowCreateAlert(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/30"
          >
            <Settings className="w-4 h-4" />
            Configure Alerts
          </button>
        </div>

        <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
          {alerts.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-start gap-3 p-3 rounded-lg ${
                alert.status === 'unread' ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-gray-800/50'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                alert.type === 'hit' ? 'bg-red-500/20 text-red-400' :
                alert.type === 'match' ? 'bg-amber-500/20 text-amber-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {alert.type === 'hit' ? <AlertTriangle className="w-4 h-4" /> :
                 alert.type === 'match' ? <Target className="w-4 h-4" /> :
                 <TrendingUp className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-xs text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    {alert.item}
                  </code>
                  <span className="text-xs text-gray-500">{alert.time}</span>
                </div>
                <p className="text-sm text-gray-300">{alert.message}</p>
              </div>
              {alert.status === 'unread' && (
                <div className="w-2 h-2 rounded-full bg-amber-400" />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Link Item Modal */}
      <AnimatePresence>
        {showLinkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowLinkModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl bg-gray-900 rounded-xl border border-amber-500/30"
            >
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="font-bold text-white">Link Watchlist Item</h3>
                <button onClick={() => setShowLinkModal(false)} className="text-gray-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4">
                {/* Search & Filter */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search watchlist..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                          selectedCategory === cat.id
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {filteredItems.map(item => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        item.linked
                          ? 'bg-green-500/10 border border-green-500/30'
                          : 'bg-gray-800/50 hover:bg-gray-800'
                      }`}
                      onClick={() => handleToggleLink(item)}
                    >
                      <span className="text-xl">{getTypeIcon(item.type)}</span>
                      <div className="flex-1">
                        <code className="text-sm text-white">{item.value}</code>
                        <p className="text-xs text-gray-500">{item.category} • {item.notes}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded bg-${getSeverityColor(item.severity)}-500/20 text-${getSeverityColor(item.severity)}-400`}>
                        {item.severity}
                      </span>
                      {item.linked ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Plus className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-gray-800 flex justify-end">
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Alert Modal */}
      <AnimatePresence>
        {showCreateAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCreateAlert(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-gray-900 rounded-xl border border-amber-500/30"
            >
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="font-bold text-white">Create Alert Rule</h3>
                <button onClick={() => setShowCreateAlert(false)} className="text-gray-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Watchlist Item</label>
                  <select
                    value={newAlert.item}
                    onChange={e => setNewAlert({ ...newAlert, item: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 outline-none"
                  >
                    <option value="">Select item...</option>
                    {linkedItems.map(item => (
                      <option key={item.id} value={item.value}>{item.value}</option>
                    ))}
                    <option value="*">All linked items</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Alert Condition</label>
                  <select
                    value={newAlert.condition}
                    onChange={e => setNewAlert({ ...newAlert, condition: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 outline-none"
                  >
                    <option value="any_hit">On any hit</option>
                    <option value="threshold">Hit threshold exceeded</option>
                    <option value="new_case">Found in new case</option>
                    <option value="severity_change">Severity changed</option>
                  </select>
                </div>

                {newAlert.condition === 'threshold' && (
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Threshold Value</label>
                    <input
                      type="number"
                      value={newAlert.threshold}
                      onChange={e => setNewAlert({ ...newAlert, threshold: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 outline-none"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm text-gray-400 block">Notifications</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAlert.notifyEmail}
                      onChange={e => setNewAlert({ ...newAlert, notifyEmail: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-gray-300">Email notification</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAlert.notifyDashboard}
                      onChange={e => setNewAlert({ ...newAlert, notifyDashboard: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-gray-300">Dashboard notification</span>
                  </label>
                </div>
              </div>

              <div className="p-4 border-t border-gray-800 flex gap-3">
                <button
                  onClick={() => setShowCreateAlert(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAlert}
                  disabled={!newAlert.item}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold disabled:opacity-50"
                >
                  Create Alert
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WatchlistIntegration;
