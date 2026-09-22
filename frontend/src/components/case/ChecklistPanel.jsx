import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import caseService from '../../services/caseService';

const ChecklistPanel = memo(({ caseId, evidence, entities, onTaskUpdate }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchTasks = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    try {
      const res = await caseService.getTasks(caseId);
      if (res.success) {
        const mapped = (res.data || []).map(t => ({
          id: t.id || `task-${t._id}`,
          text: t.text,
          completed: t.completed || false,
          priority: t.priority || 'medium',
          createdAt: t.createdAt || Date.now(),
        }));
        setTasks(mapped);
      }
    } catch {
      const saved = localStorage.getItem(`checklist_${caseId}`);
      if (saved) { try { setTasks(JSON.parse(saved)); } catch {} }
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const persistLocally = useCallback((updated) => {
    try { localStorage.setItem(`checklist_${caseId}`, JSON.stringify(updated)); } catch {}
  }, [caseId]);

  const addTask = async () => {
    if (!newTask.trim()) return;
    const task = {
      id: `task-${Date.now()}`,
      text: newTask.trim(),
      completed: false,
      priority: 'medium',
    };
    setTasks(prev => {
      const updated = [task, ...prev];
      persistLocally(updated);
      return updated;
    });
    setNewTask('');
    if (onTaskUpdate) onTaskUpdate(task, 'created');
    try {
      const res = await caseService.addTask(caseId, { text: task.text, priority: task.priority });
      if (res.success && res.data) {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, id: res.data.id } : t));
      }
    } catch {}
  };

  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newCompleted = !task.completed;
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, completed: newCompleted } : t);
      persistLocally(updated);
      return updated;
    });
    if (onTaskUpdate) onTaskUpdate({ ...task, completed: newCompleted }, 'toggled');
    try {
      await caseService.updateTask(caseId, id, { completed: newCompleted });
    } catch {}
  };

  const deleteTask = (id) => {
    setTasks(prev => {
      const updated = prev.filter(t => t.id !== id);
      persistLocally(updated);
      return updated;
    });
  };

  const updatePriority = async (id, priority) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, priority } : t);
      persistLocally(updated);
      return updated;
    });
    try {
      await caseService.updateTask(caseId, id, { priority });
    } catch {}
  };

  const filtered = useMemo(() => {
    if (filter === 'active') return tasks.filter(t => !t.completed);
    if (filter === 'completed') return tasks.filter(t => t.completed);
    return tasks;
  }, [tasks, filter]);

  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    active: tasks.filter(t => !t.completed).length,
    high: tasks.filter(t => !t.completed && t.priority === 'high').length,
  }), [tasks]);

  const suggestTasks = () => {
    const suggestions = [];
    const entityCount = entities?.length || 0;
    if (entityCount > 10 && !tasks.some(t => t.text.toLowerCase().includes('dedup')))
      suggestions.push({ text: 'Deduplicate entities', category: 'review' });
    if (evidence?.length > 0 && !tasks.some(t => t.text.toLowerCase().includes('verif')))
      suggestions.push({ text: 'Verify unverified evidence', category: 'review' });
    const unverified = entities?.filter(e => e.verificationStatus === 'unreviewed').length;
    if (unverified > 5 && !tasks.some(t => t.text.toLowerCase().includes('review entity')))
      suggestions.push({ text: `Review ${unverified} unverified entities`, category: 'review' });
    return suggestions;
  };

  const addSuggestion = (s) => {
    const task = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: s.text,
      completed: false,
      priority: 'medium',
    };
    setTasks(prev => {
      const updated = [task, ...prev];
      persistLocally(updated);
      return updated;
    });
    caseService.addTask(caseId, { text: task.text, priority: task.priority }).catch(() => {});
  };

  if (loading) {
    return (
      <div className="checklist-panel">
        <div className="checklist-header"><h3>Checklist & Tasks</h3></div>
        <div className="py-8 text-center text-sm text-gray-500">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="checklist-panel">
      <div className="checklist-header">
        <h3>Checklist & Tasks</h3>
        <div className="checklist-stats">
          <span>{stats.active} active</span>
          <span>{stats.completed}/{stats.total} done</span>
          {stats.high > 0 && <span className="high-count">🔴 {stats.high} high</span>}
        </div>
      </div>

      <div className="add-task-row">
        <input
          type="text"
          placeholder="Add new task..."
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
        />
        <button onClick={addTask}>Add</button>
      </div>

      {suggestTasks().length > 0 && (
        <div className="task-suggestions">
          <span className="suggestion-label">Suggestions:</span>
          {suggestTasks().map((s, i) => (
            <button key={i} className="suggestion-chip" onClick={() => addSuggestion(s)}>
              + {s.text}
            </button>
          ))}
        </div>
      )}

      <div className="task-filter">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
        <button className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>Active</button>
        <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>Completed</button>
      </div>

      <div className="task-list">
        {filtered.map(task => (
          <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''} priority-${task.priority}`}>
            <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} />
            <span className="task-text" onClick={() => toggleTask(task.id)}>{task.text}</span>
            <div className="task-actions">
              <select
                value={task.priority}
                onChange={e => updatePriority(task.id, e.target.value)}
                onClick={e => e.stopPropagation()}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Med</option>
                <option value="high">🔴 High</option>
              </select>
              <button className="delete-btn" onClick={() => deleteTask(task.id)} title="Delete">✕</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="empty-state">No tasks yet</div>}
      </div>
    </div>
  );
});

export default ChecklistPanel;
