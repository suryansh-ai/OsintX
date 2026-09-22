import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';

const CaseSearchBar = memo(({ evidence, graph, timeline, entities, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(timer);
  }, [query]);

  const searchableData = useMemo(() => ({
    evidence: (evidence || []).map(e => ({
      id: e.id || e._id, type: 'evidence',
      title: e.title || e.type || 'Evidence',
      text: [e.title, e.description, e.type, e.query, e.notes, e.data].filter(Boolean).join(' '),
      date: e.date || e.timestamp || e.createdAt,
    })),
    entities: (entities || []).map(e => ({
      id: `${e.type}:${e.value}`, type: 'entity',
      title: `${e.type}: ${e.value}`,
      text: [e.value, e.type, e.normalizedValue].filter(Boolean).join(' '),
    })),
    timeline: (timeline || []).map(t => ({
      id: t.id, type: 'timeline',
      title: t.title || t.event || 'Event',
      text: [t.title, t.description, t.event, t.notes].filter(Boolean).join(' '),
      date: t.date || t.timestamp,
    })),
    graph: (graph?.nodes || []).map(n => ({
      id: n.id, type: 'graph',
      title: n.label || n.name || n.id,
      text: [n.label, n.name, n.id, n.type].filter(Boolean).join(' '),
    })),
  }), [evidence, entities, timeline, graph]);

  const handleSearch = useCallback((q) => {
    setQuery(q);
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); setShowResults(false); return; }
    const terms = debouncedQuery.toLowerCase().split(/\s+/).filter(Boolean);
    const matches = [];
    for (const section of Object.values(searchableData)) {
      for (const item of section) {
        const matchCount = terms.filter(t => item.text.toLowerCase().includes(t)).length;
        if (matchCount > 0) {
          matches.push({ ...item, matchCount, relevance: matchCount / terms.length + (item.date ? 0.1 : 0) });
        }
      }
    }
    matches.sort((a, b) => b.relevance - a.relevance);
    setResults(matches.slice(0, 20));
    setShowResults(true);
  }, [debouncedQuery, searchableData]);

  const handleNavigate = (item) => {
    setShowResults(false);
    if (onNavigate) onNavigate(item);
  };

  const groupedResults = useMemo(() => {
    const groups = { evidence: [], entity: [], timeline: [], graph: [] };
    for (const r of results) {
      if (groups[r.type]) groups[r.type].push(r);
    }
    return Object.entries(groups).filter(([, items]) => items.length > 0);
  }, [results]);

  return (
    <div className="case-search-bar">
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search evidence, entities, timeline..."
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
        />
        {query && <button className="clear-btn" onClick={() => { setQuery(''); setResults([]); setShowResults(false); }}>✕</button>}
      </div>

      {showResults && results.length > 0 && (
        <div className="search-results-dropdown">
          {groupedResults.map(([type, items]) => (
            <div key={type} className="search-result-group">
              <div className="result-group-header">{type.charAt(0).toUpperCase() + type.slice(1)} ({items.length})</div>
              {items.map((item, i) => (
                <div
                  key={`${item.id}-${i}`}
                  className="search-result-item"
                  onMouseDown={() => handleNavigate(item)}
                >
                  <span className="result-type-icon">
                    {type === 'evidence' ? '📄' : type === 'entity' ? '🔵' : type === 'timeline' ? '📅' : '🔗'}
                  </span>
                  <div className="result-content">
                    <span className="result-title">{item.title}</span>
                    {item.date && <span className="result-date">{formatDate(item.date)}</span>}
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div className="search-result-footer">{results.length} result{results.length !== 1 ? 's' : ''}</div>
        </div>
      )}
    </div>
  );
});

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default CaseSearchBar;
