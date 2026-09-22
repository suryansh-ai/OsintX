import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRole } from '../../../context/RoleContext';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Globe,
  Terminal,
  Lock,
  Eye,
  Database,
  Wifi,
  FileText,
  Shield,
  Activity,
  Layers,
  AlertTriangle,
  Zap,
  Filter,
  Grid,
  List,
  MessageCircle,
  Scan,
  Car,
  Wallet,
  Network,
  Users,
  MapPin
} from 'lucide-react';

const ToolAccess = () => {
  const { tools, getOutputDepth, getCorrelationLayers, getCreditMultiplier } = useRole();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedTool, setSelectedTool] = useState(null);

  const toolIcons = {
    'start-investigation': Zap,
    'case-management': Layers,
    'request-information': MessageCircle,
    'osint-library': Database,
    'dork-generator': Terminal,
    'bulk-ip-tracer': Globe,
    'location-tracker': MapPin,
    'coord-lookup': MapPin,
    'malware-scan': Shield,
    'comm-sandbox': Lock,
    'ipdr-enrichment': Network,
    'audio-analysis': FileText,
    'device-permissions': Scan,
    'evidence-locker': Database,
    'report-generator': FileText,
    'team-directory': Users,
    'audit-logs': Activity,
    'police-directory': Users,
  };

  const categories = [
    { id: 'all', name: 'All Tools', count: tools.length },
    { id: 'network', name: 'Network', count: tools.filter(t => t.category === 'network').length },
    { id: 'social', name: 'Social', count: tools.filter(t => t.category === 'social').length },
    { id: 'forensics', name: 'Forensics', count: tools.filter(t => t.category === 'forensics').length },
    { id: 'analysis', name: 'Analysis', count: tools.filter(t => t.category === 'analysis').length }
  ];

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 investigation-grid-student opacity-30" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 animate-signal-pulse" />
      
      {/* Restriction Banner */}
      <div className="relative z-50 bg-cyan-950/80 border-b border-cyan-500/30">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-300 text-sm font-mono">
            FIELD ACCESS: All tools available with restricted output depth
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-40 border-b border-cyan-900/50 bg-gray-950/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/dashboard/student"
                className="p-2 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-cyan-400 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-cyan-400 font-mono">TOOL ACCESS</h1>
                <p className="text-xs text-gray-500 font-mono">Investigation Tools Library</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 rounded-lg bg-gray-900 border border-gray-800 focus:border-cyan-500/50 outline-none text-gray-300 text-sm"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <div className="flex items-center gap-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {cat.name} ({cat.count})
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tools Grid */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-4 gap-4' : 'space-y-3'}>
          {filteredTools.map((tool, index) => {
            const IconComponent = toolIcons[tool.id] || Terminal;
            
            return viewMode === 'grid' ? (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedTool(tool)}
                className="glass-student rounded-xl p-4 border border-cyan-500/20 hover:border-cyan-500/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                    <IconComponent className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded block">
                      {tool.creditCost?.student || tool.creditCost}c
                    </span>
                  </div>
                </div>
                
                <h3 className="text-sm font-medium text-gray-200 mb-1">{tool.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{tool.shortDesc || tool.description?.substring(0, 60)}</p>
                
                {/* Depth & Correlation Info */}
                <div className="pt-3 border-t border-gray-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Output Depth</span>
                    <span className="text-xs font-mono text-cyan-400">
                      {tool.outputDepth?.student || 'restricted'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Correlation</span>
                    <span className="text-xs font-mono text-cyan-400">
                      {tool.correlationLayers?.student || 1} layer
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => setSelectedTool(tool)}
                className="glass-student rounded-xl p-4 border border-cyan-500/20 hover:border-cyan-500/50 transition-all cursor-pointer group flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors flex-shrink-0">
                  <IconComponent className="w-6 h-6 text-cyan-400" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-200">{tool.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{tool.shortDesc || tool.description}</p>
                </div>
                
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Depth</p>
                    <p className="text-xs font-mono text-cyan-400">{tool.outputDepth?.student || 'restricted'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Layers</p>
                    <p className="text-xs font-mono text-cyan-400">{tool.correlationLayers?.student || 1}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Cost</p>
                    <p className="text-xs font-mono text-amber-400">{tool.creditCost?.student || tool.creditCost}c</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredTools.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">No tools found matching your criteria</p>
          </div>
        )}
      </main>

      {/* Tool Detail Modal */}
      {selectedTool && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedTool(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl glass-student rounded-2xl border border-cyan-500/30 overflow-hidden"
          >
            <div className="p-6 border-b border-cyan-500/20">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  {(() => {
                    const Icon = toolIcons[selectedTool.id] || Terminal;
                    return <Icon className="w-7 h-7 text-cyan-400" />;
                  })()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedTool.name}</h2>
                  <p className="text-sm text-gray-500">{selectedTool.category || 'Investigation Tool'}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-400 text-sm">{selectedTool.description}</p>

              {/* Field Restrictions */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span className="font-mono text-amber-400">FIELD ACCESS RESTRICTIONS</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-gray-900/50">
                    <Layers className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Output Depth</p>
                    <p className="text-sm font-mono text-cyan-400">{selectedTool.outputDepth?.student || 'restricted'}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-900/50">
                    <Activity className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Correlation</p>
                    <p className="text-sm font-mono text-cyan-400">{selectedTool.correlationLayers?.student || 1} layer</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-900/50">
                    <Zap className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Credit Cost</p>
                    <p className="text-sm font-mono text-amber-400">{selectedTool.creditCost?.student}c</p>
                  </div>
                </div>
              </div>

              {/* Input */}
              <div>
                <label className="block text-xs text-gray-500 mb-2 font-mono">TARGET INPUT</label>
                <input
                  type="text"
                  placeholder={`Enter ${selectedTool.inputType || 'target data'}...`}
                  className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-800 focus:border-cyan-500/50 outline-none text-gray-300 font-mono"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedTool(null)}
                  className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button className="flex-1 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold flex items-center justify-center gap-2 hover:from-cyan-400 hover:to-blue-400 transition-all">
                  <Zap className="w-4 h-4" />
                  Execute (-{selectedTool.creditCost?.student}c)
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ToolAccess;
