import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import {
  GitBranch, Play, CheckCircle, AlertTriangle, RotateCcw,
  SkipForward, XCircle, RefreshCw, Layers, Info, ArrowRight,
  Target, Eye
} from 'lucide-react';

const STATES = [
  { id: 'not_started', label: 'Not Started', icon: Play, color: 'text-gray-400', bg: 'bg-gray-800', border: 'border-gray-700' },
  { id: 'running', label: 'Running', icon: RefreshCw, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  { id: 'findings_found', label: 'Findings Found', icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  { id: 'needs_review', label: 'Needs Review', icon: Eye, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { id: 'verified', label: 'Verified', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  { id: 'dead_end', label: 'Dead End', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  { id: 'duplicate_loop', label: 'Duplicate Loop', icon: RotateCcw, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { id: 'failed', label: 'Failed', icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  { id: 'skipped', label: 'Skipped', icon: SkipForward, color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-600/30' },
];

const TRANSITIONS = {
  not_started: ['running', 'skipped'],
  running: ['findings_found', 'dead_end', 'duplicate_loop', 'failed', 'needs_review'],
  findings_found: ['needs_review', 'verified', 'dead_end'],
  needs_review: ['verified', 'dead_end', 'duplicate_loop', 'running'],
  verified: ['needs_review', 'running'],
  dead_end: ['running', 'skipped'],
  duplicate_loop: ['running', 'skipped'],
  failed: ['running', 'skipped'],
  skipped: ['running'],
};

const STATE_REASONS = {
  dead_end: 'No new verified entities found. All compatible sources returned no new intelligence.',
  duplicate_loop: 'Branch returned an already investigated entity. Same data keeps recurring.',
  needs_review: 'Source returned partial data with medium or low confidence. Analyst review required.',
  skipped: 'No compatible free tool available for this entity type.',
  failed: 'Tool execution failed or all sources were unavailable.',
  findings_found: 'New entities, evidence, or relationships were discovered.',
  verified: 'Findings were reviewed and confirmed by analyst.',
  running: 'Investigation tools are currently executing.',
  not_started: 'Branch has been created but no investigation has been run yet.',
};

const StateMachinePanel = memo(function StateMachinePanel({ caseId }) {
  const [branches] = useState([
    { id: 'email-1', label: 'Email Attribution', state: 'findings_found', entity: 'admin@example.com', updatedAt: '2026-05-30T10:00:00Z', findings: 3 },
    { id: 'domain-1', label: 'Domain Investigation', state: 'running', entity: 'suspicious.com', updatedAt: '2026-05-30T11:00:00Z', findings: 1 },
    { id: 'phone-1', label: 'Phone Trace', state: 'dead_end', entity: '+1234567890', updatedAt: '2026-05-29T15:00:00Z', findings: 0 },
  ]);

  const [selectedBranch, setSelectedBranch] = useState(branches[0]?.id || null);

  const currentBranch = branches.find(b => b.id === selectedBranch);

  const handleTransition = (branchId, toState) => {
    // future: call caseService.transitionBranch(caseId, branchId, toState)
  };

  const StateNode = ({ stateId, isCurrent, isReachable, onClick }) => {
    const state = STATES.find(s => s.id === stateId);
    if (!state) return null;
    const Icon = state.icon;
    return (
      <button
        onClick={onClick}
        disabled={!isReachable && !isCurrent}
        className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all w-20 ${
          isCurrent
            ? `${state.bg} ${state.border} ring-1 ring-${state.color.replace('text-', '')}/30`
            : isReachable
              ? 'bg-gray-800/30 border-gray-700/30 hover:border-gray-600/50 cursor-pointer opacity-90'
              : 'bg-gray-800/10 border-gray-800/30 opacity-40 cursor-not-allowed'
        }`}
      >
        <Icon className={`w-4 h-4 ${state.color}`} />
        <span className={`text-[8px] text-center leading-tight ${state.color}`}>{state.label}</span>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <GitBranch className="w-5 h-5 text-cyan-400" />
        <h3 className="text-sm font-semibold text-gray-200">Investigation State Machine</h3>
      </div>

      <div className="grid grid-cols-[240px_1fr] gap-4">
        <div className="space-y-1">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Branches</p>
          {branches.map(branch => {
            const state = STATES.find(s => s.id === branch.state);
            const Icon = state?.icon || GitBranch;
            return (
              <button
                key={branch.id}
                onClick={() => setSelectedBranch(branch.id)}
                className={`w-full text-left p-2 rounded-lg border transition-colors ${
                  selectedBranch === branch.id
                    ? 'bg-gray-700/30 border-gray-600/50'
                    : 'bg-gray-800/30 border-gray-700/30 hover:border-gray-600/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-3 h-3 ${state?.color || 'text-gray-400'}`} />
                  <span className="text-xs text-gray-300 truncate">{branch.label}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-1 py-0.5 rounded ${state?.bg || 'bg-gray-800'} ${state?.color || 'text-gray-400'}`}>
                    {state?.label || branch.state}
                  </span>
                  {branch.findings > 0 && (
                    <span className="text-[10px] text-emerald-400">{branch.findings} findings</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="bg-gray-800/20 border border-gray-700/30 rounded-lg p-4">
          {currentBranch ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-200">{currentBranch.label}</h4>
                  <p className="text-xs text-gray-500">{currentBranch.entity}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded ${
                  STATES.find(s => s.id === currentBranch.state)?.bg || 'bg-gray-800'
                } ${
                  STATES.find(s => s.id === currentBranch.state)?.color || 'text-gray-400'
                }`}>
                  {STATES.find(s => s.id === currentBranch.state)?.label || currentBranch.state}
                </span>
              </div>

              <div className="flex items-center justify-center gap-1 mb-4 flex-wrap">
                {STATES.map((state, idx) => {
                  const isCurrent = state.id === currentBranch.state;
                  const isReachable = (TRANSITIONS[currentBranch.state] || []).includes(state.id);
                  return (
                    <div key={state.id} className="flex items-center">
                      <StateNode
                        stateId={state.id}
                        isCurrent={isCurrent}
                        isReachable={isReachable}
                        onClick={() => handleTransition(currentBranch.id, state.id)}
                      />
                      {idx < STATES.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-gray-700 mx-0.5 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-400">
                    {STATE_REASONS[currentBranch.state] || 'No additional information.'}
                  </p>
                </div>
              </div>

              {currentBranch.findings > 0 && (
                <div className="mt-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                  <p className="text-xs text-emerald-400 font-medium mb-1">Findings ({currentBranch.findings})</p>
                  <p className="text-[10px] text-gray-400">
                    New entities, evidence, or relationships were discovered during this investigation.
                  </p>
                </div>
              )}

              <p className="text-[10px] text-gray-600 mt-3">
                Updated: {new Date(currentBranch.updatedAt).toLocaleString()}
              </p>
            </>
          ) : (
            <div className="text-center py-8">
              <GitBranch className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Select a branch to view state</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default StateMachinePanel;
