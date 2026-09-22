import React, { useState, useMemo, useCallback, memo } from 'react';

const EXPORT_FORMATS = {
  emails: {
    label: 'Emails (.txt)',
    icon: '📧',
    extract: (entities) => entities.filter(e => e.type === 'email').map(e => e.value),
    format: (items) => items.join('\n'),
    filename: 'emails.txt',
  },
  domains: {
    label: 'Domains (.txt)',
    icon: '🌐',
    extract: (entities) => entities.filter(e => e.type === 'domain').map(e => e.value),
    format: (items) => items.join('\n'),
    filename: 'domains.txt',
  },
  ips: {
    label: 'IPs (.txt)',
    icon: '📡',
    extract: (entities) => entities.filter(e => e.type === 'ip').map(e => e.value),
    format: (items) => items.join('\n'),
    filename: 'ips.txt',
  },
  urls: {
    label: 'URLs (.txt)',
    icon: '🔗',
    extract: (entities) => entities.filter(e => e.type === 'url').map(e => e.value),
    format: (items) => items.join('\n'),
    filename: 'urls.txt',
  },
  phones: {
    label: 'Phones (.txt)',
    icon: '📱',
    extract: (entities) => entities.filter(e => e.type === 'phone').map(e => e.value),
    format: (items) => items.join('\n'),
    filename: 'phones.txt',
  },
  hashes: {
    label: 'Hashes (.txt)',
    icon: '#️⃣',
    extract: (entities) => entities.filter(e => e.type === 'hash').map(e => e.value),
    format: (items) => items.join('\n'),
    filename: 'hashes.txt',
  },
  wallets: {
    label: 'Wallets (.txt)',
    icon: '₿',
    extract: (entities) => entities.filter(e => e.type === 'wallet').map(e => e.value),
    format: (items) => items.join('\n'),
    filename: 'wallets.txt',
  },
  csv: {
    label: 'All Entities (.csv)',
    icon: '📊',
    extract: (entities) => entities,
    format: (items) => {
      const header = 'Type,Value,Normalized,Confidence,Risk,Sources,FirstSeen,LastSeen';
      const rows = items.map(e =>
        `"${e.type}","${e.value}","${e.normalizedValue}","${e.confidenceScore}","${e.riskScore}","${(e.toolsRun || []).join(';')}","${new Date(e.firstSeen).toISOString()}","${new Date(e.lastSeen).toISOString()}"`
      );
      return [header, ...rows].join('\n');
    },
    filename: 'entities.csv',
  },
  json: {
    label: 'Complete Export (.json)',
    icon: '📋',
    extract: (entities) => entities,
    format: (items) => JSON.stringify(items, null, 2),
    filename: 'entities_complete.json',
  },
  stix: {
    label: 'STIX 2.1 (.json)',
    icon: '🛡️',
    extract: (entities) => entities,
    format: (items) => {
      const bundle = {
        type: 'bundle',
        id: `bundle--${Date.now()}`,
        spec_version: '2.1',
        objects: items.map((e, i) => {
          const stixType = entityToStixType(e.type);
          return {
            type: stixType,
            id: `${stixType}--${e.normalizedValue.slice(0, 36)}`,
            created: new Date(e.firstSeen).toISOString(),
            modified: new Date(e.lastSeen).toISOString(),
            name: e.value,
            labels: [e.type],
            confidence: e.confidenceScore,
            ...(stixType === 'indicator' && {
              pattern: `[${e.type}:value = '${e.value}']`,
              pattern_type: 'stix',
            }),
          };
        }),
      };
      return JSON.stringify(bundle, null, 2);
    },
    filename: 'entities_stix.json',
  },
};

function entityToStixType(type) {
  const map = {
    email: 'indicator', ip: 'indicator', domain: 'indicator',
    url: 'indicator', hash: 'indicator', wallet: 'indicator',
    phone: 'observed-data', username: 'observed-data',
    person: 'identity', org: 'identity', address: 'observed-data',
  };
  return map[type] || 'observed-data';
}

const IocExportCenter = memo(({ entities, evidence }) => {
  const [selected, setSelected] = useState(new Set(Object.keys(EXPORT_FORMATS)));
  const [exporting, setExporting] = useState(false);
  const [exportLog, setExportLog] = useState([]);

  const toggle = (key) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleExport = async () => {
    setExporting(true);
    const results = [];
    for (const [key, format] of Object.entries(EXPORT_FORMATS)) {
      if (!selected.has(key)) continue;
      const items = format.extract(entities || []);
      if (items.length === 0) {
        results.push({ key, label: format.label, count: 0, status: 'skipped' });
        continue;
      }
      const content = format.format(items);
      downloadFile(content, format.filename, key === 'json' || key === 'stix' ? 'application/json' : 'text/plain');
      results.push({ key, label: format.label, count: items.length, status: 'downloaded' });
    }
    setExportLog(results);
    setExporting(false);
  };

  const totalByFormat = useMemo(() => {
    const counts = {};
    for (const [key, format] of Object.entries(EXPORT_FORMATS)) {
      counts[key] = format.extract(entities || []).length;
    }
    return counts;
  }, [entities]);

  const selectAll = () => setSelected(new Set(Object.keys(EXPORT_FORMATS)));
  const selectNone = () => setSelected(new Set());

  return (
    <div className="ioc-export-center">
      <div className="export-header">
        <h3>IOC Export Center</h3>
        <span className="entity-total">{entities?.length || 0} entities available</span>
      </div>

      <div className="export-controls">
        <button onClick={selectAll}>Select All</button>
        <button onClick={selectNone}>Clear</button>
        <button className="export-btn primary" onClick={handleExport} disabled={exporting || selected.size === 0}>
          {exporting ? 'Exporting...' : `Export (${selected.size})`}
        </button>
      </div>

      <div className="export-format-list">
        {Object.entries(EXPORT_FORMATS).map(([key, format]) => (
          <label key={key} className={`export-format-item ${selected.has(key) ? 'selected' : ''}`}>
            <input
              type="checkbox"
              checked={selected.has(key)}
              onChange={() => toggle(key)}
            />
            <span className="format-icon">{format.icon}</span>
            <span className="format-label">{format.label}</span>
            <span className="format-count">{totalByFormat[key]} items</span>
          </label>
        ))}
      </div>

      {exportLog.length > 0 && (
        <div className="export-log">
          <h4>Export Results</h4>
          {exportLog.map(e => (
            <div key={e.key} className={`export-log-item ${e.status}`}>
              <span>{e.status === 'downloaded' ? '✅' : '⏭️'}</span>
              <span>{e.label}</span>
              <span>{e.count} items {e.status === 'downloaded' ? 'downloaded' : '(empty)'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default IocExportCenter;
export { EXPORT_FORMATS };
