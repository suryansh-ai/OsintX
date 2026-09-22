import { useMemo, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { FileText, Globe, Shield, Siren, Loader, RefreshCw, CheckCircle, XCircle, AlertTriangle, Info, Target, Search, Link, Layers } from 'lucide-react';

const ICON_MAP = {
  search: Search, link: Link, target: Target, check: CheckCircle, shield: Shield, layers: Layers,
};

const STYLE_NAMES = {
  executive: { label: 'Executive', desc: 'Professional, readable, for all audiences' },
  technical: { label: 'Technical', desc: 'Detailed, data-rich, for analysts' },
  simplified: { label: 'Simplified', desc: 'Minimal, easy-to-read summary' },
};

function StatCard({ label, value, icon }) {
  const Icon = ICON_MAP[icon] || Info;
  return (
    <div className="rounded-lg bg-white/10 px-3 py-2.5 text-center border border-white/5">
      <Icon className="h-3.5 w-3.5 mx-auto mb-1 text-amber-300/80" />
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-[9px] uppercase tracking-wide text-white/50">{label}</div>
    </div>
  );
}

function TimelineEvent({ event, index }) {
  const colors = { tool: 'bg-amber-400', lead: 'bg-emerald-400', pivot: 'bg-violet-400', indicator: 'bg-cyan-400' };
  const dotColor = colors[event.type] || 'bg-gray-500';
  return (
    <div className="flex gap-3 pb-2.5 relative">
      <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor} border-2 border-gray-950 z-10`} style={{ marginLeft: '6px' }} />
      <div className="flex-1 min-w-0">
        <span className="text-[10px] text-gray-500 font-mono">#{String(event.index).padStart(2, '0')}</span>
        <p className="text-xs text-gray-300 leading-relaxed">{event.text}</p>
      </div>
    </div>
  );
}

function ToolCard({ tool, runs, avgScore, entities }) {
  const severity = avgScore >= 70 ? 'text-emerald-400' : avgScore >= 40 ? 'text-amber-400' : 'text-gray-400';
  return (
    <div className="rounded-lg border border-gray-700/30 bg-gray-800/30 px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-200">{tool}</span>
        <span className={`text-[10px] font-mono ${severity}`}>{avgScore}%</span>
      </div>
      <div className="flex items-center gap-2 text-[9px] text-gray-500 mt-0.5">
        <span>{runs} run(s)</span>
        <span className="truncate max-w-[200px]">{entities}</span>
      </div>
    </div>
  );
}

export default function ProfessionalReport({ report, onRegenerate, loading }) {
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [narrative, setNarrative] = useState('');

  useEffect(() => {
    if (report?.sections) {
      const execSection = report.sections.find(s => s.id === 'executive_summary');
      if (execSection?.body) setNarrative(execSection.body);
      else setNarrative('');
    }
  }, [report]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-3 text-cyan-400" />
          <p className="text-xs text-gray-500">Generating report...</p>
        </div>
      </div>
    );
  }

  if (!report || !report.sections?.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center max-w-xs">
          <FileText className="h-10 w-10 mx-auto mb-3 text-gray-700" />
          <p className="text-xs text-gray-500 mb-2">No report data yet. Investigate entities first, then generate the report.</p>
        </div>
      </div>
    );
  }

  const { sections, stats, style, entityValue, generatedAt } = report;
  const styleInfo = STYLE_NAMES[style] || STYLE_NAMES.executive;

  return (
    <div className="space-y-4 pb-6">
      {/* Report Controls */}
      <div className="flex items-center justify-between bg-gray-900/80 rounded-lg border border-gray-700/30 px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className={`h-2 w-2 rounded-full ${stats?.findings > 0 ? 'bg-emerald-400' : 'bg-gray-500'}`} />
          {styleInfo.label} Report
          <span className="text-gray-600">·</span>
          <span className="font-mono text-[10px]">{entityValue?.slice(0, 20)}</span>
        </div>
        <button
          onClick={onRegenerate}
          disabled={loading || narrativeLoading}
          className="flex items-center gap-1.5 rounded bg-cyan-500/10 px-2.5 py-1 text-[10px] text-cyan-400 hover:bg-cyan-500/20 transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* HEADER */}
      <div className="rounded-xl bg-gradient-to-br from-slate-900 via-gray-900 to-gray-950 border border-gray-700/40 p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400/80 font-medium" style={{ fontFamily: "'Papyrus', 'Copperplate', fantasy" }}>OsintX Investigation Report</p>
            <h1 className="text-xl font-bold text-white mt-1">{report.sections.find(s => s.id === 'header')?.title || 'Investigation Report'}</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Target: <span className="text-cyan-300 font-mono">{entityValue}</span>
            </p>
          </div>
          <span className="text-[9px] text-gray-600 font-mono whitespace-nowrap">{new Date(generatedAt).toLocaleString()}</span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
          {sections.find(s => s.id === 'statistics')?.stats?.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>
      </div>

      {/* EXECUTIVE SUMMARY */}
      <div className="rounded-xl border border-gray-700/30 bg-gray-900/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-amber-400" />
            Executive Summary
          </h2>
        </div>
        {narrative ? (
          <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
            {narrative.split('\n').filter(Boolean).map((line, i) => (
              <p key={i} className="mb-2 last:mb-0">{line}</p>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-500 italic">
            Investigated <strong className="text-gray-300">{stats?.entityCount || 0}</strong> entities across{' '}
            <strong className="text-gray-300">{stats?.typeDistribution?.length || 0}</strong> types with{' '}
            <strong className={stats?.findings > 0 ? 'text-emerald-400' : 'text-gray-300'}>{stats?.findings || 0}</strong> confirmed findings.
            Average confidence: <strong className="text-gray-300">{stats?.avgConfidence || 0}%</strong>.
            {stats?.actionableLeads > 0 && ` ${stats.actionableLeads} lead(s) remain actionable.`}
          </div>
        )}
      </div>

      {/* KEY FINDINGS */}
      {sections.filter(s => s.id === 'key_findings').map(section => (
        <div key={section.id} className="rounded-xl border border-gray-700/30 bg-gray-900/50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800/60">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              {section.title}
            </h2>
            <span className="text-[10px] text-gray-500">{section.count} item(s)</span>
          </div>
          {section.type === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-800/40 text-gray-400 uppercase text-[9px] tracking-wider">
                    {section.headers.map((h, i) => (
                      <th key={i} className="px-3 py-2 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/30">
                  {section.rows.map((row, ri) => (
                    <tr key={ri} className="hover:bg-gray-800/20 transition-colors">
                      {row.map((cell, ci) => {
                        const isConf = ci === 2 || String(cell).includes('%');
                        const confVal = isConf ? parseInt(cell) : null;
                        const severity = confVal >= 70 ? 'text-emerald-400' : confVal >= 40 ? 'text-amber-400' : 'text-gray-400';
                        return (
                          <td key={ci} className={`px-3 py-2 ${isConf ? severity : 'text-gray-300'} ${ci === 1 ? 'font-mono max-w-[200px] truncate' : ''}`}>
                            {cell}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : section.type === 'simplified_list' ? (
            <div className="p-3 space-y-2">
              {section.rows?.map((row, ri) => (
                <div key={ri} className="flex items-center gap-2 text-xs text-gray-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />
                  <span className="font-medium text-gray-200 min-w-[60px]">{row[0]}</span>
                  <span>{row[1]}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ))}

      {/* LEADS */}
      {sections.filter(s => s.id === 'leads').map(section => (
        <div key={section.id} className="rounded-xl border border-gray-700/30 bg-gray-900/50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800/60">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Link className="h-3.5 w-3.5 text-violet-400" />
              {section.title}
            </h2>
            <span className="text-[10px] text-gray-500">{section.count} lead(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-800/40 text-gray-400 uppercase text-[9px] tracking-wider">
                  {section.headers.map((h, i) => <th key={i} className="px-3 py-2 text-left font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30">
                {section.rows.map((row, ri) => (
                  <tr key={ri} className="hover:bg-gray-800/20 transition-colors">
                    {row.map((cell, ci) => (
                      <td key={ci} className={`px-3 py-2 ${ci === 1 ? 'font-mono text-gray-200' : 'text-gray-400'} ${ci === 2 ? (parseInt(cell) >= 60 ? 'text-emerald-400' : parseInt(cell) >= 40 ? 'text-amber-400' : 'text-gray-400') : ''}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* TECHNICAL CHAIN / SIMPLIFIED LIST */}
      {sections.filter(s => ['technical_chain', 'entities_simplified'].includes(s.id)).map(section => (
        <div key={section.id} className="rounded-xl border border-gray-700/30 bg-gray-900/50 p-4">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-blue-400" />
            {section.title}
          </h2>
          <div className="space-y-2">
            {section.items?.map((item, i) => (
              <div key={i} className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap bg-gray-800/20 rounded-lg px-3 py-2">
                {item.split('\n').map((line, li) => <p key={li}>{line}</p>)}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* CHRONOLOGY */}
      {sections.filter(s => s.id === 'chronology').map(section => (
        <div key={section.id} className="rounded-xl border border-gray-700/30 bg-gray-900/50 p-4">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-amber-400" />
            {section.title}
          </h2>
          <div className="relative pl-3">
            <div className="absolute left-[10px] top-1 bottom-0 w-px bg-gray-800" />
            {section.events?.map((event, i) => (
              <TimelineEvent key={i} event={event} index={i} />
            ))}
          </div>
        </div>
      ))}

      {/* TOOLS USED */}
      {sections.filter(s => s.id === 'tools').map(section => (
        <div key={section.id} className="rounded-xl border border-gray-700/30 bg-gray-900/50 p-4">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-sky-400" />
            {section.title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {section.items?.map((item, i) => (
              <ToolCard key={i} {...item} />
            ))}
          </div>
        </div>
      ))}

      {/* RECOMMENDATIONS */}
      {sections.filter(s => s.id === 'recommendations').map(section => (
        <div key={section.id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <h2 className="text-sm font-semibold text-amber-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            {section.title}
          </h2>
          <div className="space-y-1.5">
            {section.items?.map((item, i) => (
              <div key={i} className="flex gap-2 text-xs text-gray-300">
                <span className="text-amber-400 mt-0.5">→</span>
                <span>{item.replace(/^- /, '')}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* FOOTER */}
      <div className="text-center text-[9px] text-gray-600 pt-4 border-t border-gray-800/40">
        {sections.find(s => s.id === 'footer')?.text || 'OsintX — Confidential Investigation Material'}
      </div>
    </div>
  );
}
