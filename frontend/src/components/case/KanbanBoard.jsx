import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layout, Plus, MoreVertical, Clock, User, Tag, AlertTriangle,
  ChevronRight, CheckCircle, Play, Pause, Archive, Eye, X,
  Search, Filter, SortAsc, Calendar, Folder, Star
} from 'lucide-react';

const statusColumns = [
  { id: 'open', label: 'Open', color: 'blue', icon: Folder },
  { id: 'in-progress', label: 'In Progress', color: 'amber', icon: Play },
  { id: 'pending', label: 'Pending', color: 'purple', icon: Pause },
  { id: 'resolved', label: 'Resolved', color: 'green', icon: CheckCircle },
  { id: 'closed', label: 'Closed', color: 'gray', icon: Archive },
];

const priorityColors = {
  critical: 'red',
  high: 'orange',
  medium: 'yellow',
  low: 'green'
};

const KanbanBoard = ({
  cases = [],
  onStatusChange,
  onViewCase,
  onCreateCase
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [draggedCase, setDraggedCase] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [showQuickCreate, setShowQuickCreate] = useState(null);
  const [newCase, setNewCase] = useState({ title: '', priority: 'medium' });

  const allCases = cases;

  // Filter cases
  const filteredCases = allCases.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'all' || c.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  // Group cases by status
  const casesByStatus = statusColumns.reduce((acc, col) => {
    acc[col.id] = filteredCases.filter(c => c.status === col.id);
    return acc;
  }, {});

  // Drag handlers
  const handleDragStart = (e, caseItem) => {
    setDraggedCase(caseItem);
    e.dataTransfer.effectAllowed = 'move';
    // Add visual feedback
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedCase(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    if (draggedCase && draggedCase.status !== columnId) {
      onStatusChange?.(draggedCase.id, columnId);
    }
    setDragOverColumn(null);
    setDraggedCase(null);
  };

  // Quick create case
  const handleQuickCreate = (status) => {
    if (!newCase.title.trim()) return;
    
    const caseData = {
      id: `CASE-${Date.now()}`,
      title: newCase.title,
      status,
      priority: newCase.priority,
      assignee: 'Unassigned',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tags: []
    };

    onCreateCase?.(caseData);
    setNewCase({ title: '', priority: 'medium' });
    setShowQuickCreate(null);
  };

  // Format due date
  const formatDueDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Overdue', color: 'red' };
    if (diffDays === 0) return { text: 'Today', color: 'amber' };
    if (diffDays === 1) return { text: 'Tomorrow', color: 'yellow' };
    if (diffDays <= 7) return { text: `${diffDays} days`, color: 'gray' };
    return { text: date.toLocaleDateString(), color: 'gray' };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Layout className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">Kanban Board</h3>
            <p className="text-xs text-gray-500">{filteredCases.length} cases • Drag to change status</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search cases..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-48 pl-10 pr-4 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-gray-300 outline-none"
            />
          </div>
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-gray-300 outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {statusColumns.map(col => {
          const count = casesByStatus[col.id]?.length || 0;
          const Icon = col.icon;
          return (
            <div key={col.id} className={`p-3 rounded-lg bg-${col.color}-500/10 border border-${col.color}-500/20`}>
              <div className="flex items-center justify-between mb-1">
                <Icon className={`w-4 h-4 text-${col.color}-400`} />
                <span className={`text-xl font-bold text-${col.color}-400`}>{count}</span>
              </div>
              <p className="text-xs text-gray-500">{col.label}</p>
            </div>
          );
        })}
      </div>

      {/* Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statusColumns.map(column => {
          const Icon = column.icon;
          const columnCases = casesByStatus[column.id] || [];
          const isDropTarget = dragOverColumn === column.id && draggedCase?.status !== column.id;

          return (
            <div
              key={column.id}
              className={`flex-shrink-0 w-72 rounded-xl transition-all ${
                isDropTarget ? 'ring-2 ring-amber-500 bg-amber-500/5' : ''
              }`}
              onDragOver={e => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className={`p-3 rounded-t-xl bg-${column.color}-500/10 border border-${column.color}-500/20 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 text-${column.color}-400`} />
                  <span className="font-bold text-white">{column.label}</span>
                  <span className={`w-6 h-6 rounded-full bg-${column.color}-500/20 flex items-center justify-center text-xs text-${column.color}-400`}>
                    {columnCases.length}
                  </span>
                </div>
                <button
                  onClick={() => setShowQuickCreate(column.id)}
                  className="p-1 rounded hover:bg-gray-800"
                >
                  <Plus className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Quick Create Form */}
              <AnimatePresence>
                {showQuickCreate === column.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-gray-900/50 border-x border-gray-800"
                  >
                    <input
                      type="text"
                      value={newCase.title}
                      onChange={e => setNewCase({ ...newCase, title: e.target.value })}
                      placeholder="Case title..."
                      autoFocus
                      className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white outline-none mb-2"
                      onKeyDown={e => e.key === 'Enter' && handleQuickCreate(column.id)}
                    />
                    <div className="flex gap-2">
                      <select
                        value={newCase.priority}
                        onChange={e => setNewCase({ ...newCase, priority: e.target.value })}
                        className="flex-1 px-2 py-1 rounded bg-gray-800 text-xs text-gray-300 outline-none"
                      >
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                      <button
                        onClick={() => handleQuickCreate(column.id)}
                        disabled={!newCase.title.trim()}
                        className="px-3 py-1 rounded bg-amber-500 text-white text-xs font-bold disabled:opacity-50"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setShowQuickCreate(null)}
                        className="px-3 py-1 rounded bg-gray-800 text-gray-400 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Cards */}
              <div className="p-2 space-y-2 bg-gray-900/30 rounded-b-xl border border-t-0 border-gray-800 min-h-[200px]">
                {columnCases.map((caseItem, i) => {
                  const dueInfo = formatDueDate(caseItem.dueDate);
                  return (
                    <motion.div
                      key={caseItem.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      draggable
                      onDragStart={e => handleDragStart(e, caseItem)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onViewCase?.(caseItem)}
                      className={`p-3 rounded-lg bg-gray-800/80 border border-gray-700 cursor-grab active:cursor-grabbing hover:border-amber-500/50 transition-all ${
                        draggedCase?.id === caseItem.id ? 'opacity-50' : ''
                      }`}
                    >
                      {/* Priority & ID */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded bg-${priorityColors[caseItem.priority]}-500/20 text-${priorityColors[caseItem.priority]}-400`}>
                          {caseItem.priority.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">{caseItem.id}</span>
                      </div>

                      {/* Title */}
                      <h4 className="text-sm text-white font-medium mb-2 line-clamp-2">{caseItem.title}</h4>

                      {/* Tags */}
                      {caseItem.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {caseItem.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">
                              #{tag}
                            </span>
                          ))}
                          {caseItem.tags.length > 2 && (
                            <span className="text-[10px] text-gray-500">+{caseItem.tags.length - 2}</span>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between text-[10px] text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {caseItem.assignee?.split(' ')[0] || 'Unassigned'}
                        </div>
                        <div className={`flex items-center gap-1 text-${dueInfo.color}-400`}>
                          <Clock className="w-3 h-3" />
                          {dueInfo.text}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {columnCases.length === 0 && !showQuickCreate && (
                  <div className="text-center py-8">
                    <p className="text-xs text-gray-600">No cases</p>
                    <button
                      onClick={() => setShowQuickCreate(column.id)}
                      className="mt-2 text-xs text-amber-400 hover:underline"
                    >
                      + Add case
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 py-2 border-t border-gray-800">
        <span className="text-xs text-gray-500">Priority:</span>
        {Object.entries(priorityColors).map(([priority, color]) => (
          <div key={priority} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full bg-${color}-400`} />
            <span className="text-xs text-gray-400 capitalize">{priority}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard;
