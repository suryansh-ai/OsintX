import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Filter, Download, Plus, ChevronRight, Calendar,
  Tag, AlertTriangle, CheckCircle, Play, Pause, Flag,
  X, Search, Edit, Trash2, Star, Bookmark
} from 'lucide-react';
import { sanitizeString, stringifySanitized } from '../../utils/resultSanitizer';

const eventTypes = [
  { id: 'system', label: 'System', color: 'blue' },
  { id: 'action', label: 'Action', color: 'green' },
  { id: 'evidence', label: 'Evidence', color: 'purple' },
  { id: 'note', label: 'Note', color: 'cyan' },
  { id: 'status', label: 'Status Change', color: 'amber' },
  { id: 'analysis', label: 'Analysis', color: 'pink' },
  { id: 'milestone', label: 'Milestone', color: 'yellow' },
  { id: 'alert', label: 'Alert', color: 'red' },
];

const AdvancedTimeline = ({ 
  timeline = [], 
  onAddEvent, 
  onEditEvent, 
  onDeleteEvent,
  onExport,
  onMarkMilestone 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    event: '',
    type: 'action',
    notes: '',
    attachments: [],
    isMilestone: false
  });
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grouped'

  // Filter timeline
  const filteredTimeline = timeline.filter(item => {
    const matchesSearch = sanitizeString(item.event || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    
    let matchesDate = true;
    if (dateRange.start) {
      matchesDate = matchesDate && new Date(item.time) >= new Date(dateRange.start);
    }
    if (dateRange.end) {
      matchesDate = matchesDate && new Date(item.time) <= new Date(dateRange.end);
    }

    return matchesSearch && matchesType && matchesDate;
  });

  // Group by date
  const groupedTimeline = filteredTimeline.reduce((groups, item) => {
    const date = new Date(item.time).toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
    return groups;
  }, {});

  // Handle add event
  const handleAddEvent = () => {
    if (!newEvent.event.trim()) return;

    const event = {
      id: `event-${Date.now()}`,
      time: new Date().toISOString(),
      event: sanitizeString(newEvent.event),
      type: newEvent.type,
      notes: sanitizeString(newEvent.notes),
      attachments: newEvent.attachments,
      isMilestone: newEvent.isMilestone,
      user: 'Current User'
    };

    onAddEvent?.(event);
    setNewEvent({ event: '', type: 'action', notes: '', attachments: [], isMilestone: false });
    setShowAddEvent(false);
  };

  // Handle edit event
  const handleEditEvent = () => {
    if (!showEditEvent) return;
    onEditEvent?.(showEditEvent.id, showEditEvent);
    setShowEditEvent(null);
  };

  // Export timeline
  const handleExport = (format) => {
    const data = filteredTimeline.map(item => ({
      Time: new Date(item.time).toLocaleString(),
      Event: sanitizeString(item.event),
      Type: item.type,
      Notes: sanitizeString(item.notes || ''),
      Milestone: item.isMilestone ? 'Yes' : 'No'
    }));

    if (format === 'csv') {
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map(row => Object.values(row).join(','));
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timeline_${Date.now()}.csv`;
      a.click();
    } else {
      const blob = new Blob([stringifySanitized(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timeline_${Date.now()}.json`;
      a.click();
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-gray-300 outline-none focus:border-amber-500/50"
            />
          </div>
          
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-gray-300 outline-none"
          >
            <option value="all">All Types</option>
            {eventTypes.map(type => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>

          <input
            type="date"
            value={dateRange.start}
            onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-gray-300 outline-none"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-gray-300 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-gray-800">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs ${viewMode === 'list' ? 'bg-amber-500 text-white' : 'bg-gray-800 text-gray-400'}`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-1.5 text-xs ${viewMode === 'grouped' ? 'bg-amber-500 text-white' : 'bg-gray-800 text-gray-400'}`}
            >
              Grouped
            </button>
          </div>
          <button
            onClick={() => handleExport('csv')}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddEvent(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-3 rounded-lg bg-gray-800/50 text-center">
          <p className="text-2xl font-bold text-amber-400">{filteredTimeline.length}</p>
          <p className="text-xs text-gray-500">Total Events</p>
        </div>
        <div className="p-3 rounded-lg bg-gray-800/50 text-center">
          <p className="text-2xl font-bold text-yellow-400">
            {filteredTimeline.filter(e => e.isMilestone).length}
          </p>
          <p className="text-xs text-gray-500">Milestones</p>
        </div>
        <div className="p-3 rounded-lg bg-gray-800/50 text-center">
          <p className="text-2xl font-bold text-green-400">
            {filteredTimeline.filter(e => e.type === 'action').length}
          </p>
          <p className="text-xs text-gray-500">Actions</p>
        </div>
        <div className="p-3 rounded-lg bg-gray-800/50 text-center">
          <p className="text-2xl font-bold text-red-400">
            {filteredTimeline.filter(e => e.type === 'alert').length}
          </p>
          <p className="text-xs text-gray-500">Alerts</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-xl bg-gray-900/50 border border-amber-500/20 p-6">
        {viewMode === 'list' ? (
          <div className="space-y-4">
            {filteredTimeline.map((item, i) => {
              const typeConfig = eventTypes.find(t => t.id === item.type) || eventTypes[0];
              return (
                <motion.div
                  key={item.id || i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex gap-4 ${item.isMilestone ? 'relative' : ''}`}
                >
                  {/* Milestone marker */}
                  {item.isMilestone && (
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center">
                      <Star className="w-2 h-2 text-yellow-900" />
                    </div>
                  )}
                  
                  {/* Timeline dot and line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full bg-${typeConfig.color}-400`} />
                    {i < filteredTimeline.length - 1 && (
                      <div className="w-px flex-1 bg-gray-800" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 pb-6 ${item.isMilestone ? 'bg-yellow-500/5 -mx-2 px-2 py-2 rounded-lg border border-yellow-500/20' : ''}`}>
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-white">{sanitizeString(item.event)}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded bg-${typeConfig.color}-500/20 text-${typeConfig.color}-400`}>
                          {typeConfig.label}
                        </span>
                        {item.isMilestone && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
                            <Star className="w-2 h-2" /> Milestone
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{formatTimeAgo(item.time)}</span>
                        <button
                          onClick={() => onMarkMilestone?.(item.id)}
                          className={`p-1 rounded transition-colors ${item.isMilestone ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`}
                          title="Mark as milestone"
                        >
                          <Star className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setShowEditEvent(item)}
                          className="p-1 rounded text-gray-600 hover:text-white"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onDeleteEvent?.(item.id)}
                          className="p-1 rounded text-gray-600 hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {item.notes && (
                      <p className="text-xs text-gray-400 mt-1">{sanitizeString(item.notes)}</p>
                    )}
                    <p className="text-[10px] text-gray-600 mt-1">
                      {new Date(item.time).toLocaleString()} • {item.user || 'System'}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Grouped View */
          <div className="space-y-6">
            {Object.entries(groupedTimeline).map(([date, events]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-medium text-white">{date}</h3>
                  <span className="text-xs text-gray-500">({events.length} events)</span>
                </div>
                <div className="space-y-2 ml-6">
                  {events.map((item, i) => {
                    const typeConfig = eventTypes.find(t => t.id === item.type) || eventTypes[0];
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          item.isMilestone ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-gray-800/50'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full bg-${typeConfig.color}-400`} />
                        <span className="text-xs text-gray-500 w-16">{formatTime(item.time)}</span>
                        <span className="text-sm text-gray-300 flex-1">{sanitizeString(item.event)}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded bg-${typeConfig.color}-500/20 text-${typeConfig.color}-400`}>
                          {typeConfig.label}
                        </span>
                        {item.isMilestone && <Star className="w-3 h-3 text-yellow-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredTimeline.length === 0 && (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">No events match your filters</p>
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAddEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowAddEvent(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-gray-900 rounded-xl border border-amber-500/30"
            >
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="font-bold text-white">Add Timeline Event</h3>
                <button onClick={() => setShowAddEvent(false)} className="text-gray-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Event Description *</label>
                  <input
                    type="text"
                    value={newEvent.event}
                    onChange={e => setNewEvent({ ...newEvent, event: e.target.value })}
                    placeholder="What happened?"
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Event Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {eventTypes.map(type => (
                      <button
                        key={type.id}
                        onClick={() => setNewEvent({ ...newEvent, type: type.id })}
                        className={`p-2 rounded-lg text-xs transition-colors ${
                          newEvent.type === type.id
                            ? `bg-${type.color}-500/20 border border-${type.color}-500/50 text-${type.color}-400`
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Notes</label>
                  <textarea
                    value={newEvent.notes}
                    onChange={e => setNewEvent({ ...newEvent, notes: e.target.value })}
                    placeholder="Additional details..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm outline-none resize-none focus:border-amber-500/50"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newEvent.isMilestone}
                    onChange={e => setNewEvent({ ...newEvent, isMilestone: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-yellow-500"
                  />
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-gray-300">Mark as milestone</span>
                </label>
              </div>
              <div className="p-4 border-t border-gray-800 flex gap-3">
                <button
                  onClick={() => setShowAddEvent(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEvent}
                  disabled={!newEvent.event.trim()}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold disabled:opacity-50"
                >
                  Add Event
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Event Modal */}
      <AnimatePresence>
        {showEditEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowEditEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-gray-900 rounded-xl border border-amber-500/30"
            >
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="font-bold text-white">Edit Event</h3>
                <button onClick={() => setShowEditEvent(null)} className="text-gray-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Event Description</label>
                  <input
                    type="text"
                    value={sanitizeString(showEditEvent.event)}
                    onChange={e => setShowEditEvent({ ...showEditEvent, event: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Notes</label>
                  <textarea
                    value={sanitizeString(showEditEvent.notes || '')}
                    onChange={e => setShowEditEvent({ ...showEditEvent, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm outline-none resize-none focus:border-amber-500/50"
                  />
                </div>
              </div>
              <div className="p-4 border-t border-gray-800 flex gap-3">
                <button
                  onClick={() => setShowEditEvent(null)}
                  className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditEvent}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedTimeline;
