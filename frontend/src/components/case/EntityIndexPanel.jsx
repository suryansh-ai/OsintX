import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';

const TYPE_LABELS = {
  email: '📧 Email', ip: '🌐 IP', domain: '🌍 Domain',
  url: '🔗 URL', phone: '📞 Phone', username: '👤 Username',
  hash: '#️⃣ Hash', wallet: '₿ Wallet', crypto: '₿ Crypto',
  address: '📍 Address', person: '👤 Person', org: '🏢 Org',
  social: '📱 Social', custom: '📌 Custom',
};

const TYPE_COLORS = {
  email: '#e74c3c', ip: '#3498db', domain: '#2ecc71',
  url: '#9b59b6', phone: '#f39c12', username: '#1abc9c',
  hash: '#e67e22', wallet: '#f1c40f', person: '#34495e',
  org: '#7f8c8d', address: '#16a085',
};

function extractEntitiesFromText(text) {
  const entities = [];
  if (!text) return entities;

  const emailRe = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const ipRe = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  const domainRe = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+\.[a-zA-Z]{2,})/g;
  const urlRe = /https?:\/\/[^\s"'<>]+/g;
  const phoneRe = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
  const hashRe = /\b(?:[a-fA-F0-9]{32}|[a-fA-F0-9]{40}|[a-fA-F0-9]{64})\b/g;
  const walletRe = /\b(?:0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z0-9]{26,33}|bc1[a-z0-9]{39,59})\b/g;

  const patterns = [
    { type: 'email', regex: emailRe },
    { type: 'ip', regex: ipRe },
    { type: 'domain', regex: domainRe },
    { type: 'url', regex: urlRe },
    { type: 'phone', regex: phoneRe },
    { type: 'hash', regex: hashRe },
    { type: 'wallet', regex: walletRe },
  ];

  for (const { type, regex } of patterns) {
    const matches = text.match(regex) || [];
    for (const match of matches) {
      const normalized = match.toLowerCase().trim();
      if (!entities.some(e => e.type === type && e.normalized === normalized)) {
        entities.push({ type, value: match, normalized });
      }
    }
  }
  return entities;
}

function buildEntityIndex(evidenceItems) {
  const index = new Map();
  for (const item of evidenceItems || []) {
    const text = [item.title, item.description, item.type, item.query, item.data, item.notes, item.content].filter(Boolean).join(' ');
    const found = extractEntitiesFromText(text);
    for (const e of found) {
      const key = `${e.type}:${e.normalized}`;
      if (index.has(key)) {
        const existing = index.get(key);
        existing.seenCount += 1;
        existing.lastSeen = Date.now();
        if (item.tool && !existing.toolsRun.includes(item.tool)) existing.toolsRun.push(item.tool);
        if (item.id && !existing.evidenceRefs.includes(item.id)) existing.evidenceRefs.push(item.id);
      } else {
        index.set(key, {
          type: e.type,
          value: e.value,
          normalizedValue: e.normalized,
          firstSeen: Date.now(),
          lastSeen: Date.now(),
          seenCount: 1,
          evidenceRefs: item.id ? [item.id] : [],
          toolsRun: item.tool ? [item.tool] : [],
          confidenceScore: Math.min(90, 40 + (item.tool ? 20 : 0) + (item.description ? 10 : 0) + (item.data ? 10 : 0)),
          riskScore: e.type === 'hash' || e.type === 'wallet' ? 60 : e.type === 'email' || e.type === 'domain' ? 40 : 30,
          verificationStatus: 'unreviewed',
          relatedEntities: [],
        });
      }
    }
  }
  return Array.from(index.values()).sort((a, b) => b.confidenceScore - a.confidenceScore);
}

const EntityIndexPanel = memo(({ evidence, caseId, onSelectEntity }) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('confidence');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const entities = useMemo(() => buildEntityIndex(evidence || []), [evidence]);

  const stats = useMemo(() => {
    const byType = {};
    for (const e of entities) byType[e.type] = (byType[e.type] || 0) + 1;
    return { total: entities.length, byType };
  }, [entities]);

  const filtered = useMemo(() => {
    let result = [...entities];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(e => e.value.toLowerCase().includes(q) || e.type.toLowerCase().includes(q));
    }
    if (filterType !== 'all') result = result.filter(e => e.type === filterType);
    result.sort((a, b) => {
      if (sortBy === 'confidence') return (b.confidenceScore || 0) - (a.confidenceScore || 0);
      if (sortBy === 'risk') return (b.riskScore || 0) - (a.riskScore || 0);
      if (sortBy === 'recency') return (b.lastSeen || 0) - (a.lastSeen || 0);
      if (sortBy === 'count') return (b.seenCount || 0) - (a.seenCount || 0);
      return 0;
    });
    return result;
  }, [entities, debouncedSearch, filterType, sortBy]);

  const types = Object.keys(stats.byType);

  return (
    <div className="entity-index-panel space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          Central Entity Index
        </h3>
        <span className="text-sm text-gray-400">{stats.total} entities</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search entities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-2 text-sm text-gray-200 outline-none placeholder:text-gray-600 focus:border-amber-500/50"
          />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-2 text-sm text-gray-400 outline-none">
          <option value="all">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-2 text-sm text-gray-400 outline-none">
          <option value="confidence">Confidence</option>
          <option value="risk">Risk</option>
          <option value="recency">Last Seen</option>
          <option value="count">Seen Count</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((ent, i) => (
          <div
            key={`${ent.type}:${ent.normalizedValue}`}
            className={`rounded-xl border transition-all cursor-pointer ${
              expanded === i ? 'border-amber-500/50 bg-gray-800/80' : 'border-amber-500/20 bg-gray-900/50 hover:bg-gray-800/50'
            }`}
            onClick={() => setExpanded(expanded === i ? null : i)}
          >
            <div className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border"
                  style={{ borderColor: TYPE_COLORS[ent.type] || '#666', color: TYPE_COLORS[ent.type] || '#666' }}>
                  {TYPE_LABELS[ent.type] || ent.type}
                </span>
                <span className="flex-1" />
                <span className={`text-xs font-bold ${
                  ent.confidenceScore >= 80 ? 'text-emerald-400' : ent.confidenceScore >= 55 ? 'text-amber-400' : 'text-gray-500'
                }`}>{ent.confidenceScore}%</span>
                {ent.verificationStatus !== 'unreviewed' && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    ent.verificationStatus === 'verified' ? 'bg-emerald-500/20 text-emerald-400' :
                    ent.verificationStatus === 'disputed' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>{ent.verificationStatus}</span>
                )}
              </div>
              <p className="text-sm font-mono text-gray-200 truncate">{ent.value}</p>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                <span>seen {ent.seenCount}x</span>
                <span>•</span>
                <span>{ent.evidenceRefs.length} refs</span>
                {ent.toolsRun.length > 0 && (
                  <><span>•</span><span>{ent.toolsRun.join(', ')}</span></>
                )}
              </div>
            </div>

            {expanded === i && (
              <div className="px-3 pb-3 border-t border-gray-700/50 pt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-500">Risk:</span> <span className={`${ent.riskScore >= 70 ? 'text-red-400' : ent.riskScore >= 40 ? 'text-amber-400' : 'text-gray-400'}`}>{ent.riskScore}%</span></div>
                  <div><span className="text-gray-500">First seen:</span> <span className="text-gray-300">{formatTime(ent.firstSeen)}</span></div>
                  <div><span className="text-gray-500">Last seen:</span> <span className="text-gray-300">{formatTime(ent.lastSeen)}</span></div>
                  <div><span className="text-gray-500">Tools:</span> <span className="text-gray-300">{ent.toolsRun.join(', ') || 'none'}</span></div>
                </div>
                {onSelectEntity && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelectEntity(ent.type, ent.value); }}
                    className="w-full text-xs py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                  >
                    Investigate
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-xl p-12 bg-gray-900/50 border border-amber-500/20 text-center">
            <p className="text-gray-500">{search ? 'No entities match your search' : 'No entities indexed yet. Add evidence or run investigations to populate the index.'}</p>
          </div>
        )}
      </div>
    </div>
  );
});

function formatTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default EntityIndexPanel;
