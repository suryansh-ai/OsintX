import { Activity, Shield, Users, FileText } from 'lucide-react';

const getRiskColor = (level) => {
  switch (level?.toLowerCase()) {
    case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20';
    case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    case 'low': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  }
};

const getThreatColor = (score) => {
  if (score >= 80) return 'text-red-400';
  if (score >= 55) return 'text-orange-400';
  if (score >= 30) return 'text-yellow-400';
  return 'text-emerald-400';
};

const StatBlock = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/40">
    <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center flex-shrink-0">
      <Icon className={`w-4 h-4 ${color || 'text-cyan-400'}`} />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${color || 'text-gray-200'}`}>{value}</p>
    </div>
  </div>
);

const CaseAiSummaryCard = ({ caseData, summary }) => {
  const data = summary || caseData || {};
  const entityCount = data.entityCount ?? data.entities?.length ?? 0;
  const evidenceCount = data.evidenceCount ?? data.evidence?.length ?? 0;
  const riskLevel = data.riskLevel || data.risk_level || 'Unknown';
  const threatScore = data.threatScore ?? data.threat_score ?? 0;
  const topEntities = data.topEntities || data.top_entities || [];

  return (
    <div className="rounded-xl bg-slate-900/70 border border-slate-800/80 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/40">
        <Activity className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-gray-200 tracking-wide uppercase">Case Intelligence</h3>
        <span className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded border ${getRiskColor(riskLevel)}`}>
          {riskLevel}
        </span>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBlock icon={Users} label="Entities" value={entityCount} color="text-blue-400" />
          <StatBlock icon={FileText} label="Evidence" value={evidenceCount} color="text-violet-400" />
          <StatBlock icon={Shield} label="Risk Level" value={riskLevel} color={getThreatColor(threatScore)} />
          <StatBlock icon={Activity} label="Threat Score" value={`${threatScore}%`} color={getThreatColor(threatScore)} />
        </div>
        {topEntities.length > 0 && (
          <div>
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-2">Top Entities</p>
            <div className="flex flex-wrap gap-1.5">
              {topEntities.slice(0, 6).map((entity, i) => (
                <span
                  key={i}
                  className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700/40 text-gray-300 truncate max-w-[160px]"
                  title={typeof entity === 'string' ? entity : entity.value}
                >
                  {typeof entity === 'string' ? entity : entity.value}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseAiSummaryCard;
