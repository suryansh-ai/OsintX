import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Lightbulb, Target, TrendingUp, AlertTriangle,
  CheckCircle, Clock, Link as LinkIcon, X, Zap, Sparkles,
  Shield, Activity, Eye, RefreshCw, ChevronRight
} from 'lucide-react';

const getThreatLevel = (score) => {
  if (score >= 80) return 'Critical';
  if (score >= 55) return 'High';
  if (score >= 30) return 'Medium';
  return 'Low';
};

const getEntityType = (value) => {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email';
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)) return 'IP';
  if (/^[a-f0-9]{32,}$/i.test(value)) return 'Hash';
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value)) return 'Domain';
  return 'Indicator';
};

const collectEntities = (items) => {
  const counts = new Map();
  const pattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|(?:\d{1,3}\.){3}\d{1,3}|[a-f0-9]{32,}|[a-z0-9.-]+\.[a-z]{2,}/gi;

  items.forEach((item) => {
    const text = [
      item.query,
      item.tool,
      item.type,
      item.notes,
      item.title,
      item.description,
      typeof item.data === 'string' ? item.data : JSON.stringify(item.data || {}),
    ].filter(Boolean).join(' ');

    for (const match of text.match(pattern) || []) {
      const value = match.toLowerCase();
      counts.set(value, (counts.get(value) || 0) + 1);
    }
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([value, occurrences]) => ({
      type: getEntityType(value),
      value,
      risk: occurrences >= 5 ? 'critical' : occurrences >= 3 ? 'high' : occurrences >= 2 ? 'medium' : 'low',
      occurrences,
    }));
};

const buildCaseInsights = (caseData, evidence, timeline) => {
  const evidenceCount = evidence.length;
  const timelineCount = timeline.length;
  const verifiedCount = evidence.filter(item => item.verified).length;
  const unverifiedCount = Math.max(0, evidenceCount - verifiedCount);
  const priorityWeight = { critical: 30, high: 20, medium: 10, low: 4 };
  const statusWeight = { active: 8, paused: 4, completed: 0, archived: 0 };
  const riskScore = Math.min(100, Math.round(
    (priorityWeight[caseData?.priority] || 8) +
    (statusWeight[caseData?.status] || 0) +
    evidenceCount * 6 +
    unverifiedCount * 3 +
    timelineCount * 1.5
  ));
  const confidence = Math.min(96, Math.round(35 + evidenceCount * 5 + verifiedCount * 8 + timelineCount * 2));
  const entities = collectEntities(evidence);

  const patterns = [
    evidenceCount > 0 && {
      id: 'evidence-density',
      type: 'Evidence',
      description: `${evidenceCount} evidence item${evidenceCount === 1 ? '' : 's'} collected for this case`,
      confidence: Math.min(95, 55 + evidenceCount * 5),
      entities: evidence.slice(0, 4).map(item => item.query || item.tool || item.type || 'Evidence item'),
    },
    entities.length > 0 && {
      id: 'indicator-clustering',
      type: 'Indicator',
      description: `${entities.length} recurring indicator${entities.length === 1 ? '' : 's'} extracted from evidence`,
      confidence: Math.min(92, 60 + entities.length * 4),
      entities: entities.slice(0, 4).map(entity => entity.value),
    },
    timelineCount > 2 && {
      id: 'timeline-activity',
      type: 'Timeline',
      description: 'Case activity has enough timeline events for sequence review',
      confidence: Math.min(90, 50 + timelineCount * 4),
      entities: timeline.slice(-4).map(item => item.event || item.type || 'Timeline event'),
    },
  ].filter(Boolean);

  const suggestions = [
    unverifiedCount > 0 && { id: 'verify-evidence', type: 'evidence', text: `Verify ${unverifiedCount} unverified evidence item${unverifiedCount === 1 ? '' : 's'}`, priority: 'high', status: 'pending' },
    entities.length > 0 && { id: 'pivot-indicators', type: 'search', text: 'Run pivot searches on the strongest extracted indicators', priority: riskScore >= 55 ? 'high' : 'medium', status: 'pending' },
    timelineCount < 3 && { id: 'build-timeline', type: 'note', text: 'Add key events to strengthen the investigation timeline', priority: 'medium', status: 'pending' },
    evidenceCount === 0 && { id: 'collect-evidence', type: 'evidence', text: 'Add initial evidence before running deeper analysis', priority: 'high', status: 'pending' },
    riskScore >= 70 && { id: 'escalate-case', type: 'escalation', text: 'Escalate this case for senior review based on current risk', priority: 'high', status: 'pending' },
  ].filter(Boolean);

  return {
    riskScore,
    threatLevel: getThreatLevel(riskScore),
    confidence,
    patterns,
    suggestions,
    relatedCases: [],
    entities,
    nextSteps: [
      evidenceCount === 0 ? 'Collect initial evidence' : 'Review and verify collected evidence',
      entities.length > 0 ? 'Pivot on high-signal indicators' : 'Extract indicators from evidence',
      timelineCount < 3 ? 'Document the investigation timeline' : 'Review timeline ordering',
      'Prepare findings for report generation',
    ],
  };
};

const AIInsightsPanel = ({ 
  caseData,
  evidence = [],
  timeline = [],
  onApplySuggestion,
  onRunAnalysis
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('suggestions');
  const derivedInsights = useMemo(
    () => buildCaseInsights(caseData, evidence, timeline),
    [caseData, evidence, timeline]
  );
  const [insights, setInsights] = useState(derivedInsights);

  useEffect(() => {
    setInsights(prev => ({
      ...derivedInsights,
      suggestions: derivedInsights.suggestions.map(suggestion => {
        const existing = prev.suggestions?.find(item => item.id === suggestion.id);
        return existing?.status === 'applied' ? { ...suggestion, status: 'applied' } : suggestion;
      }),
    }));
  }, [derivedInsights]);

  // Run AI analysis
  const runAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update insights with "new" findings
    setInsights(prev => ({
      ...prev,
      riskScore: Math.min(100, prev.riskScore + Math.floor(Math.random() * 10)),
      confidence: Math.min(100, prev.confidence + Math.floor(Math.random() * 5))
    }));
    
    setIsAnalyzing(false);
    onRunAnalysis?.();
  };

  // Apply suggestion
  const handleApplySuggestion = (suggestion) => {
    setInsights(prev => ({
      ...prev,
      suggestions: prev.suggestions.map(s => 
        s.id === suggestion.id ? { ...s, status: 'applied' } : s
      )
    }));
    onApplySuggestion?.(suggestion);
  };

  // Get risk color
  const getRiskColor = (risk) => {
    switch (risk) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-4">
      {/* AI Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">AI Insights</h3>
            <p className="text-xs text-gray-500">Powered by machine learning analysis</p>
          </div>
        </div>
        <button
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Re-analyze
            </>
          )}
        </button>
      </div>

      {/* Risk Score Card */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Risk Score</span>
            <Activity className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-3xl font-bold text-red-400">{insights.riskScore}</p>
          <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${insights.riskScore}%` }}
              className="h-full bg-gradient-to-r from-red-500 to-orange-500"
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Threat Level</span>
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{insights.threatLevel}</p>
          <p className="text-xs text-gray-500 mt-1">Based on indicators</p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">AI Confidence</span>
            <Target className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-green-400">{insights.confidence}%</p>
          <p className="text-xs text-gray-500 mt-1">Analysis accuracy</p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Patterns Found</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-purple-400">{insights.patterns.length}</p>
          <p className="text-xs text-gray-500 mt-1">Detected patterns</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
        {[
          { id: 'suggestions', label: 'Suggestions', icon: Lightbulb },
          { id: 'patterns', label: 'Patterns', icon: Eye },
          { id: 'entities', label: 'Entities', icon: Target },
          { id: 'related', label: 'Related Cases', icon: LinkIcon },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-500/20 text-purple-400 border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div className="space-y-3">
          {insights.suggestions.map((suggestion, i) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-xl border ${
                suggestion.status === 'applied'
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-gray-900/50 border-amber-500/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  suggestion.type === 'action' ? 'bg-blue-500/20 text-blue-400' :
                  suggestion.type === 'evidence' ? 'bg-purple-500/20 text-purple-400' :
                  suggestion.type === 'search' ? 'bg-amber-500/20 text-amber-400' :
                  suggestion.type === 'note' ? 'bg-cyan-500/20 text-cyan-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded bg-${getPriorityColor(suggestion.priority)}-500/20 text-${getPriorityColor(suggestion.priority)}-400`}>
                      {suggestion.priority.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-gray-500 capitalize">{suggestion.type}</span>
                  </div>
                  <p className="text-sm text-gray-300">{suggestion.text}</p>
                </div>
                {suggestion.status === 'applied' ? (
                  <div className="flex items-center gap-1 text-green-400 text-xs">
                    <CheckCircle className="w-4 h-4" />
                    Applied
                  </div>
                ) : (
                  <button
                    onClick={() => handleApplySuggestion(suggestion)}
                    className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 text-xs hover:bg-purple-500/30"
                  >
                    Apply
                  </button>
                )}
              </div>
            </motion.div>
          ))}

          {/* Next Steps */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <ChevronRight className="w-4 h-4 text-purple-400" />
              Recommended Next Steps
            </h4>
            <div className="space-y-2">
              {insights.nextSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px] text-purple-400">
                    {i + 1}
                  </div>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Patterns Tab */}
      {activeTab === 'patterns' && (
        <div className="space-y-3">
          {insights.patterns.map((pattern, i) => (
            <motion.div
              key={pattern.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl bg-gray-900/50 border border-amber-500/20"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-white">{pattern.type} Pattern</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-20 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                      style={{ width: `${pattern.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs text-green-400">{pattern.confidence}%</span>
                </div>
              </div>
              <p className="text-sm text-gray-300 mb-3">{pattern.description}</p>
              <div className="flex flex-wrap gap-2">
                {pattern.entities.map((entity, j) => (
                  <span key={j} className="px-2 py-1 rounded bg-gray-800 text-xs text-gray-400">
                    {entity}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Entities Tab */}
      {activeTab === 'entities' && (
        <div className="rounded-xl bg-gray-900/50 border border-amber-500/20 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-xs text-gray-500">Type</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500">Value</th>
                <th className="px-4 py-3 text-center text-xs text-gray-500">Risk</th>
                <th className="px-4 py-3 text-center text-xs text-gray-500">Occurrences</th>
              </tr>
            </thead>
            <tbody>
              {insights.entities.map((entity, i) => (
                <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      entity.type === 'IP' ? 'bg-blue-500/20 text-blue-400' :
                      entity.type === 'Domain' ? 'bg-purple-500/20 text-purple-400' :
                      entity.type === 'Email' ? 'bg-cyan-500/20 text-cyan-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {entity.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-white">{entity.value}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded bg-${getRiskColor(entity.risk)}-500/20 text-${getRiskColor(entity.risk)}-400`}>
                      {entity.risk.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-400">{entity.occurrences}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Related Cases Tab */}
      {activeTab === 'related' && (
        <div className="space-y-3">
          {insights.relatedCases.map((relatedCase, i) => (
            <motion.div
              key={relatedCase.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl bg-gray-900/50 border border-amber-500/20 flex items-center gap-4"
            >
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-mono">{relatedCase.id}</p>
                <p className="text-sm text-white">{relatedCase.title}</p>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  relatedCase.similarity >= 80 ? 'text-green-400' :
                  relatedCase.similarity >= 60 ? 'text-yellow-400' :
                  'text-gray-400'
                }`}>
                  {relatedCase.similarity}%
                </div>
                <p className="text-[10px] text-gray-500">Similarity</p>
              </div>
              <button className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white text-xs">
                View Case
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Loading Overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <p className="text-white font-bold mb-2">AI Analysis in Progress</p>
              <p className="text-gray-400 text-sm">Analyzing patterns, entities, and relationships...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIInsightsPanel;
