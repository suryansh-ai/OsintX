import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Plus, Copy, CheckCircle, X, Edit, Trash2,
  ChevronRight, ListChecks, Clock, Target, Shield,
  AlertTriangle, Search, BookOpen, Folder, Star
} from 'lucide-react';

const defaultTemplates = [
  {
    id: 'phishing',
    name: 'Phishing Investigation',
    description: 'Template for investigating phishing campaigns and email threats',
    icon: '🎣',
    color: 'blue',
    checklist: [
      { id: 1, task: 'Collect original email headers', category: 'Evidence Collection', completed: false },
      { id: 2, task: 'Analyze sender domain and IP', category: 'Evidence Collection', completed: false },
      { id: 3, task: 'Check URL reputation', category: 'Analysis', completed: false },
      { id: 4, task: 'Examine email attachments', category: 'Analysis', completed: false },
      { id: 5, task: 'Identify affected users', category: 'Impact Assessment', completed: false },
      { id: 6, task: 'Check for credential compromise', category: 'Impact Assessment', completed: false },
      { id: 7, task: 'Block malicious indicators', category: 'Remediation', completed: false },
      { id: 8, task: 'Notify affected users', category: 'Remediation', completed: false },
      { id: 9, task: 'Document findings', category: 'Documentation', completed: false },
      { id: 10, task: 'Create incident report', category: 'Documentation', completed: false },
    ],
    defaultPriority: 'high',
    defaultTags: ['phishing', 'email', 'social-engineering'],
    estimatedDuration: '2-4 hours'
  },
  {
    id: 'malware',
    name: 'Malware Analysis',
    description: 'Template for analyzing malicious software and payloads',
    icon: '🦠',
    color: 'red',
    checklist: [
      { id: 1, task: 'Isolate infected system', category: 'Containment', completed: false },
      { id: 2, task: 'Collect malware sample safely', category: 'Evidence Collection', completed: false },
      { id: 3, task: 'Calculate file hashes (MD5, SHA256)', category: 'Evidence Collection', completed: false },
      { id: 4, task: 'Check VirusTotal/threat intel', category: 'Analysis', completed: false },
      { id: 5, task: 'Perform static analysis', category: 'Analysis', completed: false },
      { id: 6, task: 'Perform dynamic analysis', category: 'Analysis', completed: false },
      { id: 7, task: 'Identify C2 infrastructure', category: 'Analysis', completed: false },
      { id: 8, task: 'Check for persistence mechanisms', category: 'Analysis', completed: false },
      { id: 9, task: 'Update detection rules', category: 'Remediation', completed: false },
      { id: 10, task: 'Create YARA rules', category: 'Remediation', completed: false },
      { id: 11, task: 'Scan network for similar infections', category: 'Remediation', completed: false },
      { id: 12, task: 'Document malware capabilities', category: 'Documentation', completed: false },
    ],
    defaultPriority: 'critical',
    defaultTags: ['malware', 'analysis', 'threat'],
    estimatedDuration: '4-8 hours'
  },
  {
    id: 'data-breach',
    name: 'Data Breach Response',
    description: 'Template for responding to data breach incidents',
    icon: '🔓',
    color: 'orange',
    checklist: [
      { id: 1, task: 'Identify scope of breach', category: 'Assessment', completed: false },
      { id: 2, task: 'Identify affected data types', category: 'Assessment', completed: false },
      { id: 3, task: 'Determine breach timeline', category: 'Assessment', completed: false },
      { id: 4, task: 'Identify attack vector', category: 'Investigation', completed: false },
      { id: 5, task: 'Collect forensic evidence', category: 'Investigation', completed: false },
      { id: 6, task: 'Contain the breach', category: 'Containment', completed: false },
      { id: 7, task: 'Secure affected systems', category: 'Containment', completed: false },
      { id: 8, task: 'Notify legal/compliance team', category: 'Notification', completed: false },
      { id: 9, task: 'Prepare regulatory notification', category: 'Notification', completed: false },
      { id: 10, task: 'Prepare customer notification', category: 'Notification', completed: false },
      { id: 11, task: 'Implement additional controls', category: 'Remediation', completed: false },
      { id: 12, task: 'Conduct post-incident review', category: 'Documentation', completed: false },
    ],
    defaultPriority: 'critical',
    defaultTags: ['breach', 'data-loss', 'compliance'],
    estimatedDuration: '8-24 hours'
  },
  {
    id: 'network-intrusion',
    name: 'Network Intrusion',
    description: 'Template for investigating unauthorized network access',
    icon: '🌐',
    color: 'purple',
    checklist: [
      { id: 1, task: 'Review IDS/IPS alerts', category: 'Detection', completed: false },
      { id: 2, task: 'Analyze firewall logs', category: 'Evidence Collection', completed: false },
      { id: 3, task: 'Review network flow data', category: 'Evidence Collection', completed: false },
      { id: 4, task: 'Identify compromised hosts', category: 'Analysis', completed: false },
      { id: 5, task: 'Trace lateral movement', category: 'Analysis', completed: false },
      { id: 6, task: 'Identify attacker TTPs', category: 'Analysis', completed: false },
      { id: 7, task: 'Block attacker IPs/domains', category: 'Containment', completed: false },
      { id: 8, task: 'Isolate compromised systems', category: 'Containment', completed: false },
      { id: 9, task: 'Reset affected credentials', category: 'Remediation', completed: false },
      { id: 10, task: 'Patch exploited vulnerabilities', category: 'Remediation', completed: false },
      { id: 11, task: 'Update detection signatures', category: 'Remediation', completed: false },
      { id: 12, task: 'Create incident timeline', category: 'Documentation', completed: false },
    ],
    defaultPriority: 'high',
    defaultTags: ['intrusion', 'network', 'apt'],
    estimatedDuration: '4-12 hours'
  },
  {
    id: 'insider-threat',
    name: 'Insider Threat',
    description: 'Template for investigating internal threats and data theft',
    icon: '👤',
    color: 'amber',
    checklist: [
      { id: 1, task: 'Review user access logs', category: 'Evidence Collection', completed: false },
      { id: 2, task: 'Analyze file access patterns', category: 'Evidence Collection', completed: false },
      { id: 3, task: 'Check email and communication logs', category: 'Evidence Collection', completed: false },
      { id: 4, task: 'Review DLP alerts', category: 'Evidence Collection', completed: false },
      { id: 5, task: 'Interview relevant personnel', category: 'Investigation', completed: false },
      { id: 6, task: 'Coordinate with HR/Legal', category: 'Coordination', completed: false },
      { id: 7, task: 'Preserve evidence chain of custody', category: 'Documentation', completed: false },
      { id: 8, task: 'Disable user access if needed', category: 'Containment', completed: false },
      { id: 9, task: 'Document all findings', category: 'Documentation', completed: false },
      { id: 10, task: 'Prepare for potential legal action', category: 'Documentation', completed: false },
    ],
    defaultPriority: 'high',
    defaultTags: ['insider', 'data-theft', 'hr'],
    estimatedDuration: '8-24 hours'
  },
  {
    id: 'ransomware',
    name: 'Ransomware Response',
    description: 'Template for responding to ransomware attacks',
    icon: '💰',
    color: 'red',
    checklist: [
      { id: 1, task: 'Isolate affected systems immediately', category: 'Containment', completed: false },
      { id: 2, task: 'Identify ransomware variant', category: 'Analysis', completed: false },
      { id: 3, task: 'Determine encryption scope', category: 'Assessment', completed: false },
      { id: 4, task: 'Check for available decryptors', category: 'Analysis', completed: false },
      { id: 5, task: 'Assess backup availability', category: 'Assessment', completed: false },
      { id: 6, task: 'Identify initial access vector', category: 'Investigation', completed: false },
      { id: 7, task: 'Search for additional infections', category: 'Investigation', completed: false },
      { id: 8, task: 'Notify executive team', category: 'Notification', completed: false },
      { id: 9, task: 'Engage incident response team', category: 'Coordination', completed: false },
      { id: 10, task: 'Report to law enforcement', category: 'Notification', completed: false },
      { id: 11, task: 'Begin restoration from backups', category: 'Recovery', completed: false },
      { id: 12, task: 'Implement additional controls', category: 'Remediation', completed: false },
    ],
    defaultPriority: 'critical',
    defaultTags: ['ransomware', 'encryption', 'incident'],
    estimatedDuration: '24-72 hours'
  }
];

const CaseTemplates = ({ 
  onCreateFromTemplate,
  onSaveTemplate,
  customTemplates = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showPreview, setShowPreview] = useState(null);
  const [activeTab, setActiveTab] = useState('default');

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    icon: '📋',
    color: 'gray',
    checklist: [],
    defaultPriority: 'medium',
    defaultTags: [],
    estimatedDuration: ''
  });

  const [newChecklistItem, setNewChecklistItem] = useState({ task: '', category: '' });

  const allTemplates = activeTab === 'default' ? defaultTemplates : customTemplates;

  // Filter templates
  const filteredTemplates = allTemplates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get color class
  const getColorClass = (color, type = 'bg') => {
    const colors = {
      blue: type === 'bg' ? 'bg-blue-500/20 border-blue-500/30' : 'text-blue-400',
      red: type === 'bg' ? 'bg-red-500/20 border-red-500/30' : 'text-red-400',
      orange: type === 'bg' ? 'bg-orange-500/20 border-orange-500/30' : 'text-orange-400',
      purple: type === 'bg' ? 'bg-purple-500/20 border-purple-500/30' : 'text-purple-400',
      amber: type === 'bg' ? 'bg-amber-500/20 border-amber-500/30' : 'text-amber-400',
      green: type === 'bg' ? 'bg-green-500/20 border-green-500/30' : 'text-green-400',
      gray: type === 'bg' ? 'bg-gray-500/20 border-gray-500/30' : 'text-gray-400',
    };
    return colors[color] || colors.gray;
  };

  // Handle create from template
  const handleCreateFromTemplate = (template) => {
    onCreateFromTemplate?.(template);
    setSelectedTemplate(null);
  };

  // Add checklist item
  const handleAddChecklistItem = () => {
    if (!newChecklistItem.task.trim()) return;
    setNewTemplate(prev => ({
      ...prev,
      checklist: [...prev.checklist, {
        id: Date.now(),
        task: newChecklistItem.task,
        category: newChecklistItem.category || 'General',
        completed: false
      }]
    }));
    setNewChecklistItem({ task: '', category: '' });
  };

  // Remove checklist item
  const handleRemoveChecklistItem = (id) => {
    setNewTemplate(prev => ({
      ...prev,
      checklist: prev.checklist.filter(item => item.id !== id)
    }));
  };

  // Save custom template
  const handleSaveTemplate = () => {
    if (!newTemplate.name.trim() || newTemplate.checklist.length === 0) return;
    
    const template = {
      id: `custom-${Date.now()}`,
      ...newTemplate,
      createdAt: new Date().toISOString()
    };

    onSaveTemplate?.(template);
    setShowCreateTemplate(false);
    setNewTemplate({
      name: '',
      description: '',
      icon: '📋',
      color: 'gray',
      checklist: [],
      defaultPriority: 'medium',
      defaultTags: [],
      estimatedDuration: ''
    });
  };

  // Group checklist by category
  const groupChecklist = (checklist) => {
    return checklist.reduce((groups, item) => {
      const category = item.category || 'General';
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
      return groups;
    }, {});
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">Case Templates</h3>
            <p className="text-xs text-gray-500">Start investigations with pre-built checklists</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateTemplate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {/* Search & Tabs */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-gray-300 outline-none focus:border-amber-500/50"
          />
        </div>
        <div className="flex rounded-lg overflow-hidden border border-gray-800">
          <button
            onClick={() => setActiveTab('default')}
            className={`px-4 py-2 text-sm ${activeTab === 'default' ? 'bg-amber-500 text-white' : 'bg-gray-800 text-gray-400'}`}
          >
            Default ({defaultTemplates.length})
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 text-sm ${activeTab === 'custom' ? 'bg-amber-500 text-white' : 'bg-gray-800 text-gray-400'}`}
          >
            Custom ({customTemplates.length})
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredTemplates.map((template, i) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${getColorClass(template.color)}`}
            onClick={() => setShowPreview(template)}
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="text-3xl">{template.icon}</span>
              <div className="flex-1">
                <h4 className="font-bold text-white">{template.name}</h4>
                <p className="text-xs text-gray-400 mt-1">{template.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-gray-500">
                  <ListChecks className="w-3 h-3" />
                  {template.checklist.length} tasks
                </span>
                <span className="flex items-center gap-1 text-gray-500">
                  <Clock className="w-3 h-3" />
                  {template.estimatedDuration}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded ${
                template.defaultPriority === 'critical' ? 'bg-red-500/20 text-red-400' :
                template.defaultPriority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                template.defaultPriority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {template.defaultPriority}
              </span>
            </div>

            <div className="flex flex-wrap gap-1 mt-3">
              {template.defaultTags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded bg-gray-800 text-[10px] text-gray-400">
                  #{tag}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Folder className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500">No templates found</p>
        </div>
      )}

      {/* Template Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl bg-gray-900 rounded-xl border border-amber-500/30 max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className={`p-6 ${getColorClass(showPreview.color)}`}>
                <div className="flex items-start gap-4">
                  <span className="text-5xl">{showPreview.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">{showPreview.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{showPreview.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <span className="flex items-center gap-1 text-gray-400">
                        <ListChecks className="w-4 h-4" />
                        {showPreview.checklist.length} tasks
                      </span>
                      <span className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-4 h-4" />
                        {showPreview.estimatedDuration}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setShowPreview(null)} className="text-gray-500 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-amber-400" />
                  Investigation Checklist
                </h4>

                <div className="space-y-4">
                  {Object.entries(groupChecklist(showPreview.checklist)).map(([category, items]) => (
                    <div key={category}>
                      <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-2">{category}</h5>
                      <div className="space-y-2">
                        {items.map((item, i) => (
                          <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50">
                            <div className="w-5 h-5 rounded border border-gray-600 flex items-center justify-center text-[10px] text-gray-500">
                              {i + 1}
                            </div>
                            <span className="text-sm text-gray-300">{item.task}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <h4 className="font-bold text-white mb-2">Default Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {showPreview.defaultTags.map(tag => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-800 flex gap-3">
                <button
                  onClick={() => setShowPreview(null)}
                  className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleCreateFromTemplate(showPreview);
                    setShowPreview(null);
                  }}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Case from Template
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Template Modal */}
      <AnimatePresence>
        {showCreateTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCreateTemplate(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl bg-gray-900 rounded-xl border border-amber-500/30 max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="font-bold text-white">Create Custom Template</h3>
                <button onClick={() => setShowCreateTemplate(false)} className="text-gray-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Template Name *</label>
                    <input
                      type="text"
                      value={newTemplate.name}
                      onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      placeholder="e.g., APT Investigation"
                      className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Icon</label>
                    <input
                      type="text"
                      value={newTemplate.icon}
                      onChange={e => setNewTemplate({ ...newTemplate, icon: e.target.value })}
                      placeholder="📋"
                      className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Description</label>
                  <textarea
                    value={newTemplate.description}
                    onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    placeholder="Brief description of when to use this template..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Default Priority</label>
                    <select
                      value={newTemplate.defaultPriority}
                      onChange={e => setNewTemplate({ ...newTemplate, defaultPriority: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm outline-none"
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Est. Duration</label>
                    <input
                      type="text"
                      value={newTemplate.estimatedDuration}
                      onChange={e => setNewTemplate({ ...newTemplate, estimatedDuration: e.target.value })}
                      placeholder="e.g., 2-4 hours"
                      className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm outline-none"
                    />
                  </div>
                </div>

                {/* Checklist Builder */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Checklist Items *</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newChecklistItem.task}
                      onChange={e => setNewChecklistItem({ ...newChecklistItem, task: e.target.value })}
                      placeholder="Task description..."
                      className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm outline-none"
                      onKeyDown={e => e.key === 'Enter' && handleAddChecklistItem()}
                    />
                    <input
                      type="text"
                      value={newChecklistItem.category}
                      onChange={e => setNewChecklistItem({ ...newChecklistItem, category: e.target.value })}
                      placeholder="Category"
                      className="w-32 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm outline-none"
                    />
                    <button
                      onClick={handleAddChecklistItem}
                      disabled={!newChecklistItem.task.trim()}
                      className="p-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {newTemplate.checklist.map((item, i) => (
                      <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/50">
                        <span className="text-xs text-gray-500 w-6">{i + 1}.</span>
                        <span className="text-sm text-gray-300 flex-1">{item.task}</span>
                        <span className="text-xs text-gray-500">{item.category}</span>
                        <button
                          onClick={() => handleRemoveChecklistItem(item.id)}
                          className="p-1 rounded text-gray-500 hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-800 flex gap-3">
                <button
                  onClick={() => setShowCreateTemplate(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={!newTemplate.name.trim() || newTemplate.checklist.length === 0}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold disabled:opacity-50"
                >
                  Save Template
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CaseTemplates;
