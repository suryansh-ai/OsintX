import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useCases } from '../../../context/CaseContext';
import { useActivity } from '../../../context/ActivityContext';
import { useCredits } from '../../../context/CreditContext';
import { useToast } from '../../../components/common/Toast';
import { exportToJSON, exportToCSV, formatForExport } from '../../../utils/export';
import caseService from '../../../services/caseService';
import { sanitizeResultData, sanitizeString, sanitizeToolName, stringifySanitized } from '../../../utils/resultSanitizer';
import {
  ArrowLeft,
  Target,
  Clock,
  BarChart3,
  TrendingUp,
  Users,
  Zap,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  FileText,
  Plus,
  Download,
  Upload,
  Edit,
  Trash2,
  Search,
  Filter,
  Link as LinkIcon,
  Image,
  File,
  MessageSquare,
  Send,
  Calendar,
  Tag,
  MapPin,
  Globe,
  Shield,
  Eye,
  Copy,
  Share2,
  Bookmark,
  ChevronRight,
  Hash,
  Database,
  Network,
  Activity,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  MoreVertical,
  Settings,
  RefreshCw,
  Save,
  ExternalLink,
  Paperclip,
  FolderOpen,
  Brain,
  GitMerge,
  GitBranch,
  FileSpreadsheet,
  Wrench,
  Layout,
  Bell,
  GitCompare,
  History,
  ChevronDown
} from 'lucide-react';

// Import AI components
import { CaseAiSummaryCard } from '../../../components/ai';

// Import case management components
import {
  InvestigationGraph,
  ReportHub,
  EvidenceManager,
  AdvancedTimeline,
  CollaborationPanel,
  AIInsightsPanel,
  WatchlistIntegration,
  CaseTemplates,
  ToolIntegration,
  EntityIndexPanel,
  IocExportCenter,
  ChecklistPanel,
  AnalystReviewDashboard,
  EvidenceGallery,
  ConfidenceExplanation,
  InvestigationBranchPanel,
  ChangeDetectionPanel,
  AuditTrailPanel,
  LeadQueuePanel,
  StateMachinePanel,
  WatchtowerPanel,
  CaseComparePanel,
} from '../../../components/case';

const POC_GENERATION_STEPS = [
  'Normalizing case evidence...',
  'Extracting observables, identifiers, and media artifacts...',
  'Mapping relationships and visual evidence...',
  'Building chained proof scenarios...',
  'Running free local correlation analysis...',
  'Formatting advanced investigator report...'
];

const escapeMarkdownCell = (value) => sanitizeString(String(value ?? 'N/A')).replace(/\|/g, '\\|').replace(/\n/g, ' ');

const escapeHtml = (value) => sanitizeString(String(value ?? ''))
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const makeMarkdownTable = (headers, rows) => {
  if (!rows.length) return '_No records available._';
  const header = `| ${headers.map(escapeMarkdownCell).join(' | ')} |`;
  const divider = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map(row => `| ${row.map(escapeMarkdownCell).join(' | ')} |`).join('\n');
  return [header, divider, body].join('\n');
};

const renderInlineText = (text) => {
  const safe = sanitizeString(String(text || ''));
  const parts = safe.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold text-gray-950">{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
};

const severityBadgeClass = (value) => {
  const level = String(value || '').toLowerCase();
  if (level === 'critical') return 'bg-red-100 text-red-700 border-red-200';
  if (level === 'high') return 'bg-orange-100 text-orange-700 border-orange-200';
  if (level === 'medium') return 'bg-amber-100 text-amber-700 border-amber-200';
  return '';
};

const parseMarkdownTable = (lines, startIndex) => {
  const tableLines = [];
  let index = startIndex;
  while (index < lines.length && lines[index].trim().startsWith('|')) {
    tableLines.push(lines[index]);
    index += 1;
  }

  const rows = tableLines
    .filter((line, lineIndex) => lineIndex !== 1)
    .map(line => line.split('|').slice(1, -1).map(cell => sanitizeString(cell.trim())));

  return { rows, nextIndex: index };
};

const markdownToProfessionalHtml = (markdown = '') => {
  const lines = markdown.split('\n');
  let html = '';

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('|') && lines[i + 1]?.trim().startsWith('|')) {
      const { rows, nextIndex } = parseMarkdownTable(lines, i);
      const [header = [], ...body] = rows;
      html += '<table><thead><tr>' + header.map(cell => `<th>${escapeHtml(cell)}</th>`).join('') + '</tr></thead><tbody>';
      html += body.map(row => '<tr>' + row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('') + '</tr>').join('');
      html += '</tbody></table>';
      i = nextIndex - 1;
      continue;
    }

    if (line === '---') {
      html += '<hr />';
      continue;
    }

    if (line.startsWith('### ')) {
      html += `<h3>${escapeHtml(line.slice(4))}</h3>`;
      continue;
    }
    if (line.startsWith('## ')) {
      html += `<h2>${escapeHtml(line.slice(3))}</h2>`;
      continue;
    }
    if (line.startsWith('# ')) {
      html += `<h1>${escapeHtml(line.slice(2))}</h1>`;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i += 1;
      }
      i -= 1;
      html += '<ul>' + items.map(item => `<li>${escapeHtml(item).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}</li>`).join('') + '</ul>';
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      i -= 1;
      html += '<ol>' + items.map(item => `<li>${escapeHtml(item).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}</li>`).join('') + '</ol>';
      continue;
    }

    html += `<p>${escapeHtml(line).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}</p>`;
  }

  return html;
};

const PocReportPreview = ({ markdown = '', stats }) => {
  const lines = markdown.split('\n');
  const blocks = [];
  let currentHeading = '';

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('|') && lines[i + 1]?.trim().startsWith('|')) {
      const { rows, nextIndex } = parseMarkdownTable(lines, i);
      const [header = [], ...body] = rows;
      const compact = currentHeading.toLowerCase().includes('sensitive data');
      blocks.push(
        <div key={`table-${i}`} className={`${compact ? 'my-3' : 'my-5'} overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm`}>
          <table className={`w-full text-left ${compact ? 'text-xs' : 'text-sm'}`}>
            <thead className="bg-slate-950 text-white">
              <tr>{header.map((cell, cellIndex) => <th key={cellIndex} className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} font-semibold`}>{cell}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {body.map((row, rowIndex) => (
                <tr key={rowIndex} className="odd:bg-white even:bg-slate-50/70">
                  {row.map((cell, cellIndex) => {
                    const badgeClass = cellIndex === 0 ? severityBadgeClass(cell) : '';
                    return (
                      <td key={cellIndex} className={`${compact ? 'px-3 py-1.5 leading-5' : 'px-4 py-3'} text-slate-700 align-top`}>
                        {badgeClass
                          ? <span className={`inline-flex rounded-full border ${compact ? 'px-2 py-0.5' : 'px-2.5 py-1'} text-xs font-semibold ${badgeClass}`}>{cell}</span>
                          : renderInlineText(cell)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      i = nextIndex - 1;
      continue;
    }

    if (line === '---') {
      blocks.push(<div key={`hr-${i}`} className="my-8 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />);
      continue;
    }

    if (line.startsWith('# ')) {
      currentHeading = line.slice(2);
      blocks.push(<h1 key={i} className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950">{line.slice(2)}</h1>);
      continue;
    }
    if (line.startsWith('## ')) {
      currentHeading = line.slice(3);
      blocks.push(<h2 key={i} className="mt-8 mb-3 text-xl sm:text-2xl font-bold text-slate-950 border-b border-slate-200 pb-2">{line.slice(3)}</h2>);
      continue;
    }
    if (line.startsWith('### ')) {
      currentHeading = line.slice(4);
      blocks.push(<h3 key={i} className="mt-6 mb-2 text-lg font-semibold text-amber-800">{line.slice(4)}</h3>);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i += 1;
      }
      i -= 1;
      blocks.push(
        <ul key={`ul-${i}`} className="my-3 space-y-2">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex gap-3 text-sm leading-6 text-slate-700">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
              <span>{renderInlineText(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      i -= 1;
      blocks.push(
        <ol key={`ol-${i}`} className="my-3 space-y-2">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex gap-3 text-sm leading-6 text-slate-700">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shrink-0">{itemIndex + 1}</span>
              <span>{renderInlineText(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    blocks.push(<p key={i} className="my-3 text-sm sm:text-base leading-7 text-slate-700">{renderInlineText(line)}</p>);
  }

  return (
    <article className="rounded-2xl bg-white text-slate-950 shadow-xl max-w-5xl mx-auto overflow-hidden">
      <div className="bg-slate-950 px-6 sm:px-8 py-6 text-white">
        <p className="text-xs uppercase tracking-[0.24em] text-amber-300">Cyber Security Investigation</p>
                        <h1 className="mt-2 text-2xl sm:text-3xl font-bold" style={{ fontFamily: "'Papyrus', 'Copperplate', fantasy" }}>OsintX Report</h1>
        {stats && (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {[
              ['Evidence', stats.evidenceCount],
              ['Indicators', stats.observableCount],
              ['Images', stats.imageCount || 0],
              ['Sensitive', stats.sensitiveCount || 0],
              ['Links', stats.correlationCount],
              ['Risk', `${stats.riskScore}/100`],
              ['Confidence', stats.confidence]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-white/10 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
                <p className="text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="px-6 sm:px-8 py-7">{blocks}</div>
    </article>
  );
};

const cleanTextBlock = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return sanitizeString(value);
  return stringifySanitized(sanitizeResultData(value));
};

const collectEvidenceText = (item = {}) => [
  item.title,
  item.type,
  item.tool,
  item.query,
  item.description,
  item.source,
  item.url,
  item.notes,
  item.file?.originalName,
  item.file?.name,
  item.file?.mimeType,
  cleanTextBlock(item.data)
].filter(Boolean).map(cleanTextBlock).join('\n');

const uniqueLimited = (items, limit = 25) => [...new Set(items.filter(Boolean))].slice(0, limit);

const formatReportDate = (value) => {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not recorded' : date.toLocaleString();
};

const extractObservables = (text = '') => {
  const source = text || '';
  const urls = uniqueLimited(source.match(/https?:\/\/[^\s"'<>),]+/gi) || []);
  const emails = uniqueLimited(source.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi) || []);
  const ips = uniqueLimited(source.match(/\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g) || []);
  const hashes = uniqueLimited(source.match(/\b(?:[a-f0-9]{32}|[a-f0-9]{40}|[a-f0-9]{64})\b/gi) || []);
  const phones = uniqueLimited(source.match(/(?:\+?\d[\d\s().-]{7,}\d)/g) || []);
  const secrets = uniqueLimited((source.match(/\b(?:password|passwd|pwd|api[_\s-]?key|token|secret|access[_\s-]?key)\s*[:=]\s*["']?[^\s"',;]{4,}/gi) || [])
    .map(value => value.replace(/\s+/g, ' ').trim()), 20);
  const domains = uniqueLimited((source.match(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b/gi) || [])
    .filter(domain => !emails.some(email => email.toLowerCase().includes(`@${domain.toLowerCase()}`)))
    .filter(domain => !urls.some(url => url.toLowerCase().includes(domain.toLowerCase()))));

  return { urls, emails, ips, domains, hashes, phones, secrets };
};

const imageUrlPattern = /^https?:\/\/[^\s"'<>]+\.(?:png|jpe?g|webp|gif|bmp|tiff?)(?:[?#].*)?$/i;
const dataImagePattern = /^data:image\/[a-z0-9.+-]+;base64,/i;
const imageFieldPattern = /(image|photo|avatar|thumbnail|screenshot|picture|media|visual|profilephoto|ogimage)/i;

const isImageArtifactValue = (value) => {
  const text = String(value || '').trim();
  if (!text) return false;
  return imageUrlPattern.test(text) || dataImagePattern.test(text);
};

const normalizeImageArtifact = (value) => String(value || '').trim().replace(/[),.;]+$/g, '');

const extractImageArtifacts = (value, context = {}, depth = 0, found = []) => {
  if (value == null || depth > 5) return found;

  if (typeof value === 'string') {
    const direct = normalizeImageArtifact(value);
    if (isImageArtifactValue(direct)) {
      found.push({
        url: direct,
        label: context.label || 'Image artifact',
        source: context.source || 'Case evidence',
        evidenceId: context.evidenceId,
        evidenceTitle: context.evidenceTitle,
        fieldPath: context.path || 'data',
        kind: dataImagePattern.test(direct) ? 'Embedded image data' : 'Remote image URL',
      });
    }
    (value.match(/https?:\/\/[^\s"'<>]+\.(?:png|jpe?g|webp|gif|bmp|tiff?)(?:[?#][^\s"'<>]*)?/gi) || []).forEach(url => {
      found.push({
        url: normalizeImageArtifact(url),
        label: context.label || 'Image reference',
        source: context.source || 'Case evidence',
        evidenceId: context.evidenceId,
        evidenceTitle: context.evidenceTitle,
        fieldPath: context.path || 'text',
        kind: 'Referenced image URL',
      });
    });
    return found;
  }

  if (Array.isArray(value)) {
    value.slice(0, 80).forEach((entry, index) => extractImageArtifacts(entry, { ...context, path: `${context.path || 'data'}[${index}]` }, depth + 1, found));
    return found;
  }

  if (typeof value === 'object') {
    Object.entries(value).slice(0, 160).forEach(([key, entry]) => {
      const label = imageFieldPattern.test(key) ? key : context.label;
      extractImageArtifacts(entry, {
        ...context,
        label,
        path: context.path ? `${context.path}.${key}` : key,
      }, depth + 1, found);
    });
  }

  return found;
};

const uniqueImageArtifacts = (items = [], limit = 60) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.url}:${item.evidenceId || item.evidenceTitle || ''}`;
    if (!item.url || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
};

const countObservables = (observables = {}) => Object.values(observables).reduce((sum, values) => sum + (values?.length || 0), 0);

const mergeObservables = (items) => {
  const merged = { urls: [], emails: [], ips: [], domains: [], hashes: [], phones: [], secrets: [] };
  items.forEach(item => {
    Object.entries(item.observables || {}).forEach(([key, values]) => {
      merged[key] = uniqueLimited([...(merged[key] || []), ...(values || [])], 100);
    });
  });
  return merged;
};

const mergeImageArtifacts = (items) => uniqueImageArtifacts(items.flatMap(item => item.imageArtifacts || []), 80);

const buildEntityRelationshipRows = (chain) => {
  const rows = [];
  chain.forEach(item => {
    const primary = [
      ...item.observables.emails,
      ...item.observables.domains,
      ...item.observables.ips,
      ...item.observables.urls,
      ...item.observables.phones,
      ...item.observables.hashes,
    ].slice(0, 5);
    primary.forEach(value => {
      rows.push([
        value,
        item.domain,
        `Step ${item.step}`,
        item.source,
        item.imageCount ? `${item.imageCount} related image artifact(s)` : item.interpretation,
      ]);
    });
  });
  return rows.slice(0, 40);
};

const buildEvidenceQualityRows = (chain) => chain.map(item => {
  const signals = [
    item.observableTotal ? `${item.observableTotal} observable(s)` : null,
    item.imageCount ? `${item.imageCount} image artifact(s)` : null,
    item.collectedAt && item.collectedAt !== 'Not recorded' ? 'timestamped' : null,
  ].filter(Boolean);
  const score = Math.min(100, 35 + Math.min(35, item.observableTotal * 8) + Math.min(20, item.imageCount * 10) + (item.collectedAt && item.collectedAt !== 'Not recorded' ? 10 : 0));
  return [
    `Step ${item.step}`,
    item.title,
    `${score}/100`,
    signals.join(', ') || 'manual review required',
    score >= 75 ? 'Strong' : score >= 55 ? 'Moderate' : 'Needs analyst review',
  ];
});

const maskSensitiveValue = (value, type) => {
  const text = sanitizeString(String(value || ''));
  if (!text) return 'N/A';
  if (type === 'Secret' || type === 'Credential') {
    const [label, raw = ''] = text.split(/[:=]/);
    const secret = raw.trim().replace(/^["']|["']$/g, '');
    if (!secret) return text;
    return `${label.trim()}: ${secret.slice(0, 2)}${'*'.repeat(Math.max(4, Math.min(secret.length - 2, 10)))}`;
  }
  if (type === 'Phone' && text.length > 6) return `${text.slice(0, 3)}***${text.slice(-3)}`;
  return text;
};

const classifySensitiveFindings = (chain) => {
  const findings = [];
  const addFinding = (item, type, value, severity, handling) => {
    findings.push({
      severity,
      type,
      value: maskSensitiveValue(value, type),
      evidence: `Step ${item.step}: ${item.title}`,
      handling
    });
  };

  chain.forEach(item => {
    (item.observables.secrets || []).forEach(value => addFinding(item, 'Secret', value, 'Critical', 'Restrict access, rotate/revoke if live, and store only in protected case evidence.'));
    (item.observables.emails || []).forEach(value => addFinding(item, 'Email', value, 'High', 'Treat as personally identifiable information and validate account ownership before attribution.'));
    (item.observables.phones || []).forEach(value => addFinding(item, 'Phone', value, 'High', 'Treat as personally identifiable information and avoid external disclosure without authorization.'));
    (item.observables.hashes || []).forEach(value => addFinding(item, 'Hash', value, 'Medium', 'Preserve as file/integrity evidence and correlate against malware or breach intelligence.'));
    (item.observables.ips || []).forEach(value => addFinding(item, 'IP Address', value, 'Medium', 'Correlate with ownership, logs, and timestamps before attribution.'));
    (item.observables.urls || []).forEach(value => addFinding(item, 'URL', value, 'Medium', 'Open only in a controlled analysis environment and capture redirects/screenshots.'));
    (item.observables.domains || []).forEach(value => addFinding(item, 'Domain', value, 'Medium', 'Correlate DNS, WHOIS, passive DNS, and reputation sources.'));
  });

  const seen = new Set();
  return findings.filter(item => {
    const key = `${item.type}:${item.value}:${item.evidence}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const inferEvidenceDomain = (item, observables) => {
  const text = `${item.type || ''} ${item.tool || ''} ${item.title || ''} ${item.file?.mimeType || ''}`.toLowerCase();
  if (text.includes('image') || text.includes('photo') || text.includes('exif')) return 'Image / Media';
  if (text.includes('domain') || observables.domains.length || observables.urls.length) return 'Domain / Web';
  if (text.includes('ip') || text.includes('network') || observables.ips.length) return 'Network / Infrastructure';
  if (text.includes('email') || text.includes('phone') || text.includes('name') || observables.emails.length || observables.phones.length) return 'Identity / Account';
  if (text.includes('hash') || text.includes('file') || observables.hashes.length) return 'File / Hash';
  return 'General Evidence';
};

const buildEvidenceChain = (caseData = {}) => {
  const evidence = sanitizeResultData(caseData.evidence || []);
  return [...evidence]
    .sort((a, b) => new Date(a.addedAt || a.savedAt || a.createdAt || 0) - new Date(b.addedAt || b.savedAt || b.createdAt || 0))
    .map((item, index) => {
      const text = collectEvidenceText(item);
      const observables = extractObservables(text);
      const itemId = item._id || item.id || `EV-${index + 1}`;
      const title = sanitizeString(item.title || item.query || item.tool || `Evidence ${index + 1}`);
      const imageArtifacts = uniqueImageArtifacts(extractImageArtifacts(item, {
        evidenceId: itemId,
        evidenceTitle: title,
        source: sanitizeString(item.source || item.tool || 'Case evidence'),
      }), 20);
      const domain = inferEvidenceDomain(item, observables);
      const observableTotal = countObservables(observables);
      return {
        step: index + 1,
        id: itemId,
        title,
        type: sanitizeString(item.type || 'evidence'),
        domain: imageArtifacts.length ? 'Image / Media' : domain,
        source: sanitizeString(item.source || item.tool || 'Case evidence'),
        collectedAt: item.addedAt || item.savedAt || item.createdAt || 'Not recorded',
        description: sanitizeString(item.description || item.notes || 'No description provided.'),
        observables,
        imageArtifacts,
        imageCount: imageArtifacts.length,
        observableTotal,
        interpretation: observableTotal || imageArtifacts.length
          ? `${imageArtifacts.length ? 'Image / Media' : domain} evidence with ${observableTotal} extracted observable(s) and ${imageArtifacts.length} image artifact(s) available for correlation.`
          : `${domain} evidence retained for contextual, chain-of-custody, or manual review value.`
      };
    });
};

const buildCorrelationRows = (chain) => {
  const seen = {};
  chain.forEach(item => {
    Object.entries(item.observables).forEach(([kind, values]) => {
      values.forEach(value => {
        const key = `${kind}:${value.toLowerCase()}`;
        if (!seen[key]) seen[key] = { type: kind.replace(/s$/, '').toUpperCase(), value, evidence: [] };
        seen[key].evidence.push(`Step ${item.step}`);
      });
    });
  });

  return Object.values(seen)
    .filter(item => item.evidence.length > 1)
    .map(item => [item.type, item.value, item.evidence.join(' -> '), 'Repeated across evidence chain']);
};

const buildPocScenario = (item) => {
  const observableSummary = Object.entries(item.observables)
    .filter(([, values]) => values.length)
    .map(([type, values]) => `${type === 'ips' ? 'IP address' : type.replace(/s$/, '')} evidence (${values.slice(0, 3).map(value => maskSensitiveValue(value, type === 'secrets' ? 'Secret' : type === 'phones' ? 'Phone' : '')).join(', ')})`)
    .join('; ') || 'No machine-extracted indicators were found in this item. The item remains relevant for context, custody, or manual review.';
  const sensitiveFindings = classifySensitiveFindings([item]);
  const sensitiveSummary = sensitiveFindings.length
    ? sensitiveFindings.map(finding => `${finding.severity} ${finding.type}: ${finding.value}`).join('; ')
    : 'No sensitive data was automatically highlighted in this evidence item.';

  const validationByDomain = {
    'Domain / Web': ['Resolve DNS and WHOIS records from trusted sources.', 'Capture page metadata, redirects, headers, and screenshots.', 'Compare domain/url references with other case evidence.'],
    'Network / Infrastructure': ['Validate IP ownership, ASN, geolocation, and reputation.', 'Check passive DNS and related infrastructure history.', 'Correlate timestamps against observed case activity.'],
    'Identity / Account': ['Verify email/phone/name references across saved OSINT records.', 'Check breach, profile, and communication evidence for consistent identifiers.', 'Document confidence and unresolved identity gaps.'],
    'Image / Media': ['Review profile photos, avatars, EXIF, OCR, visual markers, and reverse-image results.', 'Compare embedded timestamps/locations with the case timeline.', 'Preserve original image references and generated derivatives separately.'],
    'File / Hash': ['Verify hash values against original file metadata.', 'Check reputation and malware intelligence sources where applicable.', 'Document exact file name, size, hash, and collection context.']
  };

  const imageSummary = item.imageArtifacts?.length
    ? ` Visual evidence includes ${item.imageArtifacts.length} extracted image artifact(s): ${item.imageArtifacts.slice(0, 3).map(image => image.label || image.kind).join(', ')}.`
    : '';
  const steps = validationByDomain[item.domain] || ['Review the evidence content and source reliability.', 'Cross-reference extracted identifiers against other case artifacts.', 'Record confidence, open questions, and next validation steps.'];

  return [
    `### POC ${item.step}: ${item.title}`,
    `This POC examines a ${item.domain.toLowerCase()} artifact collected from ${item.source}. The evidence basis is: ${item.description}`,
    '',
    `The automated review identified ${observableSummary}.${imageSummary} These indicators should be treated as investigative leads until independently validated and documented by the investigator.`,
    '',
    `**Sensitive Material Identified:** ${sensitiveSummary}`,
    '',
    `**Investigator Validation Plan**`,
    ...steps.map((step, index) => `  ${index + 1}. ${step}`),
    '',
    `**Expected Proof:** A reproducible, timestamped confirmation showing whether this item supports, refutes, or contextualizes the active case hypothesis.`,
    '',
    `**Investigator Confidence:** ${item.observableTotal >= 3 ? 'High' : item.observableTotal >= 1 ? 'Medium' : 'Needs manual review'}`
  ].join('\n');
};

const buildProfessionalPocMarkdown = async (caseData = {}, style = 'executive') => {
  const cleanCase = sanitizeResultData(caseData || {});
  const chain = buildEvidenceChain(cleanCase);
  const observables = mergeObservables(chain);
  const imageArtifacts = mergeImageArtifacts(chain);
  const correlationRows = buildCorrelationRows(chain);
  const entityRows = buildEntityRelationshipRows(chain);
  const qualityRows = buildEvidenceQualityRows(chain);
  const sensitiveFindings = classifySensitiveFindings(chain);
  const evidenceCount = chain.length;
  const observableCount = countObservables(observables);
  const imageCount = imageArtifacts.length;
  const sensitiveCount = sensitiveFindings.length;
  const priority = sanitizeString(cleanCase.priority || 'medium');
  const riskBase = { low: 25, medium: 45, high: 70, critical: 85 }[priority] || 45;
  const riskScore = Math.min(100, riskBase + Math.min(20, observableCount * 2) + Math.min(10, evidenceCount));
  const confidence = evidenceCount >= 5 && correlationRows.length ? 'High' : evidenceCount >= 2 || observableCount >= 3 ? 'Medium' : 'Preliminary';
  const generatedAt = new Date().toISOString();
  const caseTitle = sanitizeString(cleanCase.title || 'Investigation Case');
  const caseIdentifier = sanitizeString(cleanCase.caseId || cleanCase.id || cleanCase._id || 'N/A');

  const aiNote = await generateFreeAiAnalyticalNote(cleanCase, chain, observables);
  const indicatorRows = Object.entries(observables).flatMap(([type, values]) =>
    values.map(value => [
      (type === 'ips' ? 'IP ADDRESS' : type.replace(/s$/, '').toUpperCase()),
      maskSensitiveValue(value, type === 'secrets' ? 'Secret' : type === 'phones' ? 'Phone' : ''),
      'Extracted from case evidence',
      type === 'secrets' ? 'Restrict / rotate / verify' : 'Review / correlate'
    ])
  );
  const sensitiveRows = sensitiveFindings.map(item => [
    item.severity,
    item.type,
    item.value,
    item.evidence,
    item.handling
  ]);
  const imageRows = imageArtifacts.map((image, index) => [
    `IMG-${String(index + 1).padStart(2, '0')}`,
    image.label || image.kind || 'Image artifact',
    image.evidenceTitle || image.evidenceId || 'Case evidence',
    image.source || 'Evidence data',
    image.url.length > 120 ? `${image.url.slice(0, 117)}...` : image.url,
    image.kind || 'Image reference'
  ]);

  const chainRows = chain.map(item => [
    `Step ${item.step}`,
    item.title,
    item.domain,
    item.source,
    `${item.observableTotal} indicators / ${item.imageCount || 0} images`,
    formatReportDate(item.collectedAt)
  ]);

  const foundTypes = Object.entries(observables).filter(([, v]) => v.length).map(([k, v]) => `${k.replace(/s$/, '')} (${v.length})`).join(', ') || 'None';
  const topDomains = uniqueLimited(chain.map(item => item.domain), 10).join(', ') || 'Not enough evidence';

  const sections = [];

  if (style === 'simplified') {
    const statusMap = { active: 'In Progress', closed: 'Closed', archived: 'Archived' };
    sections.push(
      `# Investigator Brief: ${caseTitle}`,
      `*Generated ${new Date(generatedAt).toLocaleString()} — Case ${caseIdentifier}*`,
      '',
      '---',
      '',
      '## What Is This Case About?',
      cleanCase.description ? sanitizeString(cleanCase.description) : `Case ${caseIdentifier} is an investigation with ${evidenceCount} evidence item(s).`,
      '',
      aiNote ? `### Key Insight\n${aiNote}\n` : '',
      '## What Did We Find?',
      ...(evidenceCount > 0 ? [
        `- **${evidenceCount}** piece(s) of evidence were examined.`,
        `- **${observableCount}** observable indicator(s) extracted: ${foundTypes}.`,
        `- **${imageCount}** image(s) found across the evidence.`,
        `- **${sensitiveCount}** sensitive data item(s) identified requiring special handling.`,
      ] : [
        '- No evidence has been added to this case yet.',
        '- Add evidence items to generate findings.',
      ]),
      '',
      '## Key Numbers',
      makeMarkdownTable(['Metric', 'Value'], [
        ['Evidence Reviewed', evidenceCount],
        ['Indicators Found', observableCount],
        ['Images', imageCount],
        ['Sensitive Items', sensitiveCount],
        ['Risk Level', `${priority.toUpperCase()} (${riskScore}/100)`],
        ['Confidence', confidence],
      ]),
      '',
      ...(chain.length > 0 ? [
        '## Evidence Summary',
        ...chain.slice(0, 10).map((item, i) => `${i + 1}. **${item.title}** — ${item.domain} — ${item.observableTotal} indicator(s)`),
        '',
      ] : []),
      '',
      '## What Should Be Done?',
      ...(sensitiveCount > 0 ? ['- Handle sensitive data according to the handling guidance provided.'] : []),
      ...(imageCount > 0 ? [`- Review ${imageCount} extracted image(s) and save relevant ones.`] : []),
      ...(correlationRows.length > 0 ? [`- Investigate ${correlationRows.length} cross-evidence link(s) for case relevance.`] : []),
      ...(evidenceCount > 0 ? ['- Verify each evidence item through manual review.', '- Run updated OSINT checks on extracted indicators.'] : ['- Add evidence to the case to generate actionable recommendations.']),
      '- Save the final report to the case as a verified evidence item.',
      '',
      '---',
      '',
      `*OsintX Brief — ${caseTitle} — ${new Date(generatedAt).toLocaleString()}*`,
      '',
      `*Confidential investigation material.*`
    );
  } else if (style === 'executive') {
    sections.push(
      `# OsintX Report`,
      `## ${caseTitle}`,
      '',
      `*Professional investigation report generated on ${new Date(generatedAt).toLocaleString()}*`,
      '',
      `| | |`,
      `|---|---|`,
      `| **Case ID** | ${caseIdentifier} |`,
      `| **Status** | ${sanitizeString(cleanCase.status || 'active')} |`,
      `| **Priority** | ${priority.toUpperCase()} |`,
      `| **Risk Score** | ${riskScore}/100 |`,
      `| **Confidence** | ${confidence} |`,
      `| **Evidence Reviewed** | ${evidenceCount} |`,
      `| **Indicators Extracted** | ${observableCount} |`,
      `| **Images** | ${imageCount} |`,
      `| **Sensitive Items** | ${sensitiveCount} |`,
      '',
      '---',
      '',
      '## Executive Summary',
      cleanCase.description ? sanitizeString(cleanCase.description) : `Investigation into ${caseTitle} covering ${evidenceCount} evidence item(s) across ${Object.keys(observables).filter(k => observables[k]?.length).length} indicator classes.`,
      '',
      aiNote ? `### Analytical Note\n${aiNote}\n` : '',
      `**Assessment:** ${confidence.toLowerCase()} confidence — Risk score ${riskScore}/100`,
      '',
      '## Key Findings',
      ...(evidenceCount > 0 ? [
        `- **${evidenceCount}** evidence item(s) reviewed across domains: ${topDomains}.`,
        `- **${observableCount}** observable indicator(s) extracted: ${foundTypes}.`,
        ...(imageCount > 0 ? [`- **${imageCount}** image artifact(s) available for visual review.`] : []),
        ...(sensitiveCount > 0 ? [`- **${sensitiveCount}** sensitive data item(s) requiring handling.`] : []),
        ...(correlationRows.length > 0 ? [`- **${correlationRows.length}** cross-evidence correlation(s) identified.`] : []),
      ] : ['- No evidence has been added to this case.']),
      '',
      '## Evidence Overview',
      chain.length ? makeMarkdownTable(['Step', 'Evidence', 'Domain', 'Source', 'Indicators'], chain.map(r => [r[0], r[1], r[2], r[3], r[4]])) : 'No evidence chain available.',
      '',
      ...(indicatorRows.length > 0 ? [
        '## Indicators of Interest',
        makeMarkdownTable(['Type', 'Value', 'Context'], indicatorRows.map(r => [r[0], r[1], r[2]])),
        '',
      ] : []),
      ...(imageRows.length > 0 ? [
        '## Visual Evidence',
        makeMarkdownTable(['ID', 'Artifact', 'Source'], imageRows.map(r => [r[0], r[1], r[3]])),
        '',
      ] : []),
      ...(sensitiveRows.length > 0 ? [
        '## Sensitive Data Notice',
        makeMarkdownTable(['Severity', 'Type', 'Handling'], sensitiveRows.map(r => [r[0], r[1], r[4]])),
        '',
      ] : []),
      '## Recommended Actions',
      ...(sensitiveCount > 0 ? ['- Handle identified sensitive data per the required action (restrict, rotate, or verify).'] : []),
      ...(imageCount > 0 ? [`- Review ${imageCount} image artifact(s) and save relevant ones as evidence.`] : []),
      ...(correlationRows.length > 0 ? [`- Investigate ${correlationRows.length} cross-evidence correlation(s).`] : []),
      ...(evidenceCount > 0 ? [
        '- Verify each evidence item manually.',
        '- Run updated OSINT tool checks on extracted indicators.',
      ] : ['- Add evidence to the case to generate actionable recommendations.']),
      '- Export and save the final report as a case evidence item.',
      '',
      '---',
      '',
      `*OsintX Executive Report — ${caseTitle} (${caseIdentifier}) — ${new Date(generatedAt).toLocaleString()}*`,
      '',
      `*Confidential investigation material.*`
    );
  } else {
    sections.push(
      `# OsintX Report`,
      `## ${caseTitle}`,
      '',
      `*This report was automatically generated by OsintX case automation on ${new Date(generatedAt).toLocaleString()}. It contains investigator-ready POC material derived from case evidence, observables, and automated correlation analysis.*`,
      '',
      `| | |`,
      `|---|---|`,
      `| **Case ID** | ${caseIdentifier} |`,
      `| **Generated** | ${new Date(generatedAt).toLocaleString()} |`,
      `| **Status** | ${sanitizeString(cleanCase.status || 'active')} |`,
      `| **Priority** | ${priority.toUpperCase()} |`,
      `| **Evidence Items Reviewed** | ${evidenceCount} |`,
      `| **Extracted Observables** | ${observableCount} |`,
      `| **Extracted Image Artifacts** | ${imageCount} |`,
      `| **Sensitive Findings Highlighted** | ${sensitiveCount} |`,
      `| **Analysis Mode** | Free local correlation engine${aiNote ? ' + browser-native AI enhancement' : ' (no paid API required)'} |`,
      '',
      '---',
      '',
      '## 1. Executive Summary',
      cleanCase.description ? sanitizeString(cleanCase.description) : 'This POC report was generated from the available case record, evidence catalog, timeline, and saved tool outputs.',
      '',
      `The current evidence chain supports a **${confidence.toLowerCase()} confidence** assessment with an estimated case risk score of **${riskScore}/100**. The report below converts the case material into a reproducible POC format suitable for investigator review, internal reporting, and case evidence preservation.`,
      '',
      aiNote ? `### AI-Assisted Analytical Note\n${aiNote}\n` : '',
      '## 2. Scope And Source Material',
      makeMarkdownTable(['Metric', 'Value'], [
        ['Case title', caseTitle],
        ['Case identifier', caseIdentifier],
        ['Evidence reviewed', evidenceCount],
        ['Image artifacts', imageCount],
        ['Sensitive findings highlighted', sensitiveCount],
        ['Timeline entries', (cleanCase.timeline || []).length],
        ['Notes', (cleanCase.notes || []).length],
        ['Watchlist items', (cleanCase.watchlist || []).length],
        ['Progress', `${cleanCase.progress || 0}%`]
      ]),
      '',
      '## 3. Methodology',
      '1. Normalize case and evidence data into a consistent review structure.',
      '2. Extract observable indicators including domains, URLs, IP addresses, emails, phones, and hashes.',
      '3. Classify each evidence item by investigation domain.',
      '4. Build a step-by-step evidence chain from collection timestamps and saved case order.',
      '5. Extract and arrange visual artifacts from profile photos, avatars, screenshots, thumbnails, and image URLs.',
      '6. Generate validation POCs for each evidence item using non-invasive, investigator-safe checks.',
      '7. Highlight sensitive data classes and apply handling guidance for each identified item.',
      '8. Preserve confidence, open questions, and recommended next actions for review.',
      '',
      '## 4. Chained Evidence Map',
      makeMarkdownTable(['Step', 'Evidence', 'Domain', 'Source', 'Observables', 'Collected'], chainRows),
      '',
      '## 5. Visual Evidence Register',
      imageRows.length
        ? makeMarkdownTable(['ID', 'Artifact', 'Evidence Location', 'Source', 'Image Reference', 'Classification'], imageRows)
        : 'No profile photos, avatars, screenshots, thumbnails, or image URLs were automatically extracted from saved evidence.',
      '',
      '## 6. Sensitive Data Highlights',
      sensitiveRows.length
        ? makeMarkdownTable(['Severity', 'Sensitive Data Type', 'Highlighted Value', 'Evidence Location', 'Required Handling'], sensitiveRows)
        : 'No sensitive data was automatically highlighted. Continue manual review for embedded credentials, personal identifiers, and protected case material.',
      '',
      '## 7. Indicator Register',
      makeMarkdownTable(['Type', 'Value', 'Context', 'Action'], indicatorRows),
      '',
      '## 8. Entity Index',
      (() => {
        const entityTypes = {
          emails: 'Email', domains: 'Domain', ips: 'IP Address', urls: 'URL',
          phones: 'Phone', hashes: 'Hash', secrets: 'Credential / Secret'
        };
        const entityIndexRows = Object.entries(entityTypes).flatMap(([key, label]) => {
          const values = observables[key];
          if (!values || !values.length) return [];
          return values.map(v => [label, maskSensitiveValue(v, key === 'secrets' ? 'Secret' : key === 'phones' ? 'Phone' : ''), `Count: ${values.length}`, 'Extracted from case evidence']);
        });
        return entityIndexRows.length
          ? makeMarkdownTable(['Type', 'Value', 'Occurrences', 'Source'], entityIndexRows)
          : 'No deduplicated entities were extracted from the case evidence.';
      })(),
      '',
      '## 9. Entity Relationship Map',
      entityRows.length
        ? makeMarkdownTable(['Entity', 'Domain', 'Evidence Step', 'Source', 'Relationship Context'], entityRows)
        : 'No entity relationship rows were generated because the case does not yet contain extractable indicators.',
      '',
      '## 10. Cross-Evidence Correlations',
      correlationRows.length
        ? makeMarkdownTable(['Type', 'Value', 'Linked Evidence', 'Assessment'], correlationRows)
        : 'No repeated indicators were automatically detected across multiple evidence items. Manual review may still identify contextual relationships.',
      '',
      '## 11. Source Reliability Matrix',
      (() => {
        const reliabilityMap = { manual: 'User-provided', tool: 'Tool-enriched', api: 'Public API source', osint: 'Open-source intelligence', external: 'Third-party data', direct: 'Direct evidence' };
        const sourceRows = uniqueLimited(chain.map(item => item.source), 20).map(source => {
          const key = Object.keys(reliabilityMap).find(k => source.toLowerCase().includes(k)) || 'external';
          return [source, reliabilityMap[key] || 'External source', 'Review source methodology for accuracy', 'Cross-reference with other evidence'];
        });
        return sourceRows.length
          ? makeMarkdownTable(['Source', 'Reliability Class', 'Validation Guidance', 'Recommended Action'], sourceRows)
          : 'No source reliability data available.';
      })(),
      '',
      '## 12. Evidence Quality And Scoring',
      qualityRows.length
        ? makeMarkdownTable(['Step', 'Evidence', 'Score', 'Available Signals', 'Assessment'], qualityRows)
        : 'No evidence quality matrix is available until evidence is added to the case.',
      '',
      '## 13. Detailed POCs',
      chain.length ? chain.map(buildPocScenario).join('\n\n') : 'No evidence is currently available. Add evidence before generating a complete POC chain.',
      '',
      '## 14. Findings And Confidence Explanation',
      `- **Primary confidence level:** ${confidence}`,
      `- **Confidence reasoning:** ${
        confidence === 'High'
          ? 'The case contains 5+ evidence items with cross-evidence correlations and multiple observable classes, supporting a strong correlation assessment.'
          : confidence === 'Medium'
            ? 'The case has at least 2 evidence items or 3+ observables, providing moderate correlation signals but requiring additional validation.'
            : 'The case has fewer than 2 evidence items or insufficient observables. Manual analyst review and additional data collection are recommended before drawing conclusions.'
      }`,
      `- **Risk score:** ${riskScore}/100`,
      `- **Image artifacts arranged:** ${imageCount}`,
      `- **Sensitive findings highlighted:** ${sensitiveCount}`,
      `- **Strongest evidence domains:** ${topDomains}`,
      `- **Most common observable classes:** ${foundTypes}`,
      '',
      '## 15. Recommended Next Actions',
      '- Preserve original evidence and generated derivatives separately.',
      '- Restrict access to highlighted sensitive data and avoid unnecessary redistribution.',
      '- Rotate or revoke any confirmed live secrets, credentials, tokens, or access keys.',
      '- Save extracted profile photos, avatars, screenshots, and image URLs as dedicated image evidence when they materially support attribution or correlation.',
      '- Re-run relevant OSINT tools for stale domains, IPs, emails, phone numbers, hashes, and media artifacts.',
      '- Add investigator notes for every manual validation result.',
      '- Link related evidence items in the Evidence tab to strengthen chain-of-custody review.',
      '- Export the final POC after investigator edits and save the approved version back into the case.',
      '',
      '## 16. Investigator Checklist',
      (() => {
        const items = [
          evidenceCount === 0 ? 'Add initial evidence to the case before generating a POC' : null,
          observableCount === 0 ? 'No observables detected — review evidence for extractable indicators' : null,
          sensitiveCount > 0 ? `Review and handle ${sensitiveCount} sensitive data finding(s) per handling guidance` : null,
          imageCount > 0 ? `Review ${imageCount} extracted image artifact(s) and save relevant ones as evidence` : null,
          correlationRows.length === 0 && evidenceCount > 1 ? 'Manual cross-reference evidence items for contextual relationships' : null,
          correlationRows.length > 0 ? `Investigate ${correlationRows.length} cross-evidence correlation(s) for case relevance` : null,
          evidenceCount >= 2 ? 'Verify ownership of identified entities' : null,
          evidenceCount >= 1 ? 'Run reverse image search on extracted profile photos' : null,
          evidenceCount >= 1 ? 'Validate domain registrations and IP ASN assignments' : null,
          'Mark each evidence item as verified, disputed, or needs-review after manual validation',
          'Generate final export after all evidence items are reviewed and verified',
          'Save a copy of this POC back to the case evidence for audit trail'
        ].filter(Boolean);
        return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
      })(),
      '',
      '## 17. Chain Of Custody Statement',
      'This report was generated from evidence already present inside the case record. It should be reviewed and edited by the investigator before external use. Saved copies should be treated as derived evidence and retained with generation timestamp, author, and source case identifier.',
      '',
      '---',
      '',
      `*OsintX Report — ${caseTitle} (${caseIdentifier}) — Generated ${new Date(generatedAt).toLocaleString()}*`,
      '',
      `*This document contains confidential investigation material. Handle in accordance with applicable data protection and disclosure requirements.*`
    );
  }

  return {
    markdown: sections.filter(Boolean).join('\n'),
    stats: { evidenceCount, observableCount, sensitiveCount, imageCount, imageArtifacts, correlationCount: correlationRows.length, riskScore, confidence, generatedAt }
  };
};

const generateFreeAiAnalyticalNote = async (caseData, chain, observables) => {
  if (typeof window === 'undefined') return '';
  const languageModel = window.LanguageModel || window.ai?.languageModel;
  if (!languageModel?.create) return '';

  try {
    const session = await languageModel.create({
      systemPrompt: 'You summarize OSINT case evidence for investigator review. Stay factual, avoid speculation, and do not provide exploit instructions.'
    });
    const prompt = [
      `Case: ${caseData.title || 'Untitled'}`,
      `Description: ${caseData.description || 'N/A'}`,
      `Evidence count: ${chain.length}`,
      `Observables: ${stringifySanitized(observables)}`,
      'Write one concise analytical note with confidence, correlations, and investigator next steps.'
    ].join('\n');
    const response = await session.prompt(prompt);
    return sanitizeString(String(response || '')).slice(0, 1800);
  } catch {
    return '';
  }
};

const downloadTextFile = (content, filename, mimeType = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const CaseDetailPage = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { 
    cases,
    isLoading,
    updateCase, 
    deleteCase, 
    addEvidence, 
    removeEvidence,
    downloadEvidenceFile,
    addNote, 
    addTimelineEvent,
    addTeamMember,
    removeTeamMember,
    updateTeamMemberRole,
    addToWatchlist,
    removeFromWatchlist,
    refreshCase,
  } = useCases();
  const { logActivity, addNotification } = useActivity();
  const toast = useToast();
  const { credits, consumeCredits } = useCredits();

  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showAddEvidence, setShowAddEvidence] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newEvidence, setNewEvidence] = useState({ title: '', type: 'document', description: '', source: '' });
  const [editedCase, setEditedCase] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showReportHub, setShowReportHub] = useState(false);
  const [showPocReport, setShowPocReport] = useState(false);
  const [isGeneratingPoc, setIsGeneratingPoc] = useState(false);
  const [pocGenerationStep, setPocGenerationStep] = useState(0);
  const [pocDraft, setPocDraft] = useState('');
  const [pocStats, setPocStats] = useState(null);
  const [pocViewMode, setPocViewMode] = useState('preview');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [pocReportStyle, setPocReportStyle] = useState('executive');
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const downloadMenuRef = useRef(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const fileInputRef = useRef(null);

  // Find the case — support both MongoDB _id and human-readable caseId
  const caseData = cases.find(c => 
    c.id === caseId || 
    c._id === caseId || 
    c.caseId === caseId ||
    (c._id && c._id.toString() === caseId)
  );

  // Refresh from backend if not found locally (e.g. direct URL navigation)
  useEffect(() => {
    if (!caseData && caseId && !isLoading) {
      refreshCase(caseId);
    }
  }, [caseId, caseData, isLoading]);

  useEffect(() => {
    if (caseData) {
      setEditedCase({ ...caseData });
      logActivity('Viewed case details', { caseId: caseData.id || caseData._id, type: 'view' });
    }
  }, [caseId, caseData?.id, caseData?._id, logActivity]);

  // Close download dropdown on outside click
  useEffect(() => {
    if (!showDownloadMenu) return;
    const handleClick = (e) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) setShowDownloadMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDownloadMenu]);

  // Case-wide search
  const globalSearchResults = useMemo(() => {
    if (!globalSearch.trim()) return [];
    const q = globalSearch.toLowerCase();
    const results = [];
    const addIfMatch = (item, type, source, label) => {
      const searchable = JSON.stringify(item).toLowerCase();
      if (searchable.includes(q)) results.push({ type, source, label, id: item._id || item.id, item });
    };
    (caseData?.evidence || []).forEach(e => addIfMatch(e, 'evidence', 'Evidence', e.title));
    (caseData?.notes || []).forEach(n => addIfMatch(n, 'note', 'Notes', n.title || n.text?.slice(0, 80)));
    (caseData?.timeline || []).forEach(t => addIfMatch(t, 'timeline', 'Timeline', t.event || t.label));
    (caseData?.entitiesSnapshot || caseData?.leadsSnapshot || []).forEach(e => addIfMatch(e, 'entity', 'Entities', e.value));
    (caseData?.leadsSnapshot || []).forEach(l => addIfMatch(l, 'lead', 'Leads', l.value));
    return results.sort((a, b) => a.type.localeCompare(b.type)).slice(0, 50);
  }, [globalSearch, caseData]);

  if (!caseData) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          {isLoading ? (
            <>
              <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading case...</p>
            </>
          ) : (
            <>
              <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Case Not Found</h2>
              <p className="text-gray-400 mb-6">The case you're looking for doesn't exist or has been deleted.</p>
              <Link 
                to="/dashboard/user/cases"
                className="px-6 py-3 rounded-lg bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors"
              >
                Back to Cases
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  const priorityColors = {
    high: 'text-red-400 bg-red-500/10 border-red-500/30',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    low: 'text-green-400 bg-green-500/10 border-green-500/30'
  };

  const statusColors = {
    active: 'text-green-400 bg-green-500/20 border-green-500/30',
    paused: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    completed: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30'
  };

  const statusIcons = {
    active: Play,
    paused: Pause,
    completed: CheckCircle
  };

  const evidenceTypeIcons = {
    document: FileText,
    image: Image,
    link: LinkIcon,
    data: Database,
    network: Network
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  // Resolve the correct ID to use for context operations
  const resolvedCaseId = caseData?._id || caseData?.caseId || caseId;

  // Handlers
  const handleStatusChange = (newStatus) => {
    updateCase(resolvedCaseId, { status: newStatus });
    addTimelineEvent(resolvedCaseId, `Status changed to ${newStatus}`, 'status');
    logActivity(`Changed case status to ${newStatus}`, { caseId: resolvedCaseId, type: 'case' });
    addNotification(`Case status updated to ${newStatus}`, 'info');
  };

  const handleSaveChanges = () => {
    updateCase(resolvedCaseId, editedCase);
    addTimelineEvent(resolvedCaseId, 'Case details updated', 'action');
    logActivity('Updated case details', { caseId: resolvedCaseId, type: 'case' });
    addNotification('Case updated successfully', 'success');
    setIsEditing(false);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNote(resolvedCaseId, newNote);
    setNewNote('');
    setShowAddNote(false);
    addNotification('Note added successfully', 'success');
  };

  const handleAddEvidence = () => {
    if (!newEvidence.title.trim()) return;
    addEvidence(resolvedCaseId, {
      ...newEvidence,
      tool: newEvidence.source || 'manual',
      query: newEvidence.title,
      data: { description: newEvidence.description },
      savedAt: new Date().toISOString(),
    });
    addTimelineEvent(resolvedCaseId, `Evidence added: ${newEvidence.title}`, 'tool');
    logActivity('Added evidence to case', { caseId: resolvedCaseId, evidence: newEvidence.title, type: 'evidence' });
    setNewEvidence({ title: '', type: 'document', description: '', source: '' });
    setShowAddEvidence(false);
    addNotification('Evidence added successfully', 'success');
  };

  const handleDeleteCase = () => {
    deleteCase(resolvedCaseId);
    logActivity('Deleted case', { caseId: resolvedCaseId, type: 'case' });
    addNotification('Case deleted successfully', 'warning');
    navigate('/dashboard/user/cases');
  };

  const handleExportCase = (format) => {
    const exportData = {
      ...caseData,
      exportedAt: new Date().toISOString()
    };
    
    if (format === 'json') {
      exportToJSON(exportData, `case_${caseId}_${Date.now()}.json`);
    } else if (format === 'csv') {
      const flatData = {
        ID: caseData.id,
        Title: caseData.title,
        Description: caseData.description,
        Status: caseData.status,
        Priority: caseData.priority,
        Progress: caseData.progress,
        DataPoints: caseData.dataPoints,
        Correlations: caseData.correlations,
        CreditsSpent: caseData.creditsSpent,
        Created: caseData.created,
        LastActivity: caseData.lastActivity
      };
      exportToCSV([flatData], `case_${caseId}_${Date.now()}.csv`);
    } else if (format === 'html') {
      const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Case Report</title>'
        + '<style>body{font-family:Inter,Arial,sans-serif;background:#f8fafc;color:#0f172a;padding:32px}'
        + 'main{max-width:980px;margin:auto;background:white;border:1px solid #e2e8f0;border-radius:18px;padding:42px;box-shadow:0 20px 60px rgba(15,23,42,.12)}'
        + 'h1{font-size:34px;margin:0 0 18px;color:#0f172a}h2{font-size:24px;margin:34px 0 14px;color:#111827;border-bottom:1px solid #e5e7eb;padding-bottom:8px}'
        + 'table{width:100%;border-collapse:collapse;margin:14px 0;border:1px solid #e2e8f0}th{background:#0f172a;color:white;padding:9px 10px;text-align:left;font-size:12px}'
        + 'td{padding:7px 10px;border-top:1px solid #e2e8f0;font-size:12px;color:#334155}'
        + 'strong{color:#0f172a}hr{border:0;border-top:1px solid #e5e7eb;margin:28px 0}</style></head>'
        + '<body><main><h1>Case Report: ' + escapeHtml(caseData.title || 'Untitled') + '</h1>'
        + '<p><strong>ID:</strong> ' + escapeHtml(caseData.id || '') + '</p>'
        + '<p><strong>Status:</strong> ' + escapeHtml(caseData.status || '') + '</p>'
        + '<p><strong>Priority:</strong> ' + escapeHtml(caseData.priority || '') + '</p>'
        + '<p><strong>Progress:</strong> ' + (caseData.progress || 0) + '%</p>'
        + '<p><strong>Description:</strong> ' + escapeHtml(caseData.description || '') + '</p>'
        + '<hr /><h2>Evidence</h2><table><thead><tr><th>Title</th><th>Type</th><th>Source</th><th>Status</th></tr></thead><tbody>'
        + (caseData.evidence || []).slice(0, 50).map(e => '<tr><td>' + escapeHtml(e.title || '') + '</td><td>' + escapeHtml(e.type || '') + '</td><td>' + escapeHtml(e.source || e.tool || '') + '</td><td>' + (e.verified ? 'Verified' : 'Unreviewed') + '</td></tr>').join('')
        + '</tbody></table></main></body></html>';
      downloadTextFile(html, `case_${caseId}_${Date.now()}.html`, 'text/html');
    } else if (format === 'md') {
      const md = [
        `# Case Report: ${caseData.title || 'Untitled'}`,
        '',
        `**ID:** ${caseData.id || ''}`,
        `**Status:** ${caseData.status || ''}`,
        `**Priority:** ${caseData.priority || ''}`,
        `**Progress:** ${caseData.progress || 0}%`,
        '',
        `## Description`,
        caseData.description || 'No description provided.',
        '',
        `## Evidence (${(caseData.evidence || []).length})`,
        ...(caseData.evidence || []).slice(0, 50).map(e => `- **${e.title || 'Evidence'}** (${e.type || 'unknown'}) — ${e.verified ? 'Verified' : 'Unreviewed'}${e.source ? ' — Source: ' + e.source : ''}`),
        '',
        `Exported from OsintX on ${new Date().toISOString()}.`
      ].join('\n');
      downloadTextFile(md, `case_${caseId}_${Date.now()}.md`, 'text/markdown');
    }
    addNotification(`Case exported as ${format.toUpperCase()}`, 'success');
  };

  const handleExportBundle = () => {
    const bundle = {
      caseId: caseData.id,
      title: caseData.title,
      description: caseData.description,
      status: caseData.status,
      priority: caseData.priority,
      progress: caseData.progress,
      created: caseData.created,
      lastActivity: caseData.lastActivity,
      tags: caseData.tags || [],
      evidence: caseData.evidence || [],
      timeline: caseData.timeline || [],
      notes: caseData.notes || [],
      leads: caseData.leadsSnapshot || caseData.entitiesSnapshot || [],
      entities: (() => { const set = new Set(); const items = caseData.leadsSnapshot || caseData.entitiesSnapshot || []; items.forEach(e => set.add(`${e.entityType || e.type}:${e.value}`)); return [...set].map(s => { const [type, ...rest] = s.split(':'); return { type, value: rest.join(':') }; }); })(),
      correlations: caseData.correlations || [],
      metadata: {
        exportedAt: new Date().toISOString(),
        appVersion: 'OsintX 2.0',
        exportType: 'full-bundle',
        evidenceCount: (caseData.evidence || []).length,
        entityCount: (caseData.leadsSnapshot || caseData.entitiesSnapshot || []).length,
        noteCount: (caseData.notes || []).length
      }
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `case_bundle_${caseData.id || caseId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification('Case bundle exported successfully', 'success');
  };

  const handleDeduplicate = async () => {
    try {
      addNotification('Running smart deduplication...', 'info');
      const result = await caseService.deduplicate(resolvedCaseId);
      if (result?.data || result?.success) {
        const stats = result.data || result.stats;
        const totalRemoved = stats?.totalRemoved ?? stats?.evidence?.removed ?? 0;
        if (totalRemoved > 0) {
          addNotification(`Deduplication complete: ${totalRemoved} duplicate items removed`, 'success');
        } else {
          addNotification('No duplicates found — case is clean', 'info');
        }
        refreshCase(resolvedCaseId);
      }
    } catch (err) {
      console.error('Deduplication failed:', err);
      addNotification('Deduplication failed — see console', 'error');
    }
  };

  const handleGeneratePocReport = async () => {
    setShowPocReport(true);
    setPocViewMode('preview');
    setPocDraft('');
    setPocStats(null);
    setIsGeneratingPoc(true);
    setPocGenerationStep(0);

    try {
      for (let i = 0; i < POC_GENERATION_STEPS.length; i += 1) {
        setPocGenerationStep(i);
        await new Promise(resolve => setTimeout(resolve, 220));
      }

      const result = await buildProfessionalPocMarkdown(caseData);
      setPocDraft(result.markdown);
      setPocStats(result.stats);
      setPocGenerationStep(POC_GENERATION_STEPS.length - 1);

      updateCase(resolvedCaseId, {
        dataPoints: Math.max(caseData.dataPoints || 0, result.stats.evidenceCount + result.stats.observableCount),
        correlations: Math.max(caseData.correlations || 0, result.stats.correlationCount),
        progress: Math.min(Math.max(caseData.progress || 0, result.stats.evidenceCount ? 35 : 10) + 5, 100)
      });
      addTimelineEvent(resolvedCaseId, 'Professional POC report generated', 'analysis');
      logActivity('Generated POC report', { caseId: resolvedCaseId, type: 'analysis' });
      addNotification('POC report generated. Review and edit before saving.', 'success');
    } catch (error) {
      console.error('POC generation failed:', error);
      addNotification('Failed to generate POC report', 'error');
    } finally {
      setIsGeneratingPoc(false);
    }
  };

  const buildFullHtmlReport = (markdown) => {
    const reportHtml = markdownToProfessionalHtml(markdown);
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OsintX Report</title>'
      + '<style>'
      + '@page{margin:20mm 15mm}'
      + 'body{font-family:Inter,Arial,sans-serif;background:#f1f5f9;color:#0f172a;margin:0;padding:24px}'
      + '.report{max-width:1024px;margin:0 auto;background:white;border:1px solid #e2e8f0;border-radius:16px;padding:48px;box-shadow:0 20px 60px rgba(15,23,42,.12);position:relative;overflow:hidden}'
      + '.watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:90px;font-weight:900;color:rgba(15,23,42,.04);pointer-events:none;z-index:0;white-space:nowrap;letter-spacing:8px;font-family:Arial,sans-serif;text-transform:uppercase}'
      + '@media print{body{background:white;padding:0}.report{box-shadow:none;border:none;border-radius:0;padding:20px 0}.watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:90px;color:rgba(15,23,42,.045)}h2{break-inside:avoid}table{break-inside:avoid}tr{page-break-inside:avoid}}'
      + 'h1{font-size:32px;margin:0 0 6px;color:#0f172a;letter-spacing:-.5px;border-bottom:3px solid #0f172a;padding-bottom:12px}h2{font-size:22px;margin:32px 0 12px;color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:8px}h3{font-size:17px;margin:24px 0 10px;color:#92400e}p,li{font-size:13.5px;line-height:1.7;color:#334155}hr{border:0;border-top:1px solid #e2e8f0;margin:24px 0}'
      + 'table{width:100%;border-collapse:collapse;margin:12px 0;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;font-size:12px}th{background:#0f172a;color:white;text-align:left;padding:8px 10px;font-size:11.5px;font-weight:600}td{padding:6px 10px;border-top:1px solid #e2e8f0;color:#1e293b;line-height:1.45}tr:nth-child(even){background:#f8fafc}'
      + 'ul,ol{padding-left:20px}strong{color:#0f172a}'
      + '.brand-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;border-bottom:2px solid #0f172a;padding-bottom:16px}.brand-logo{font-size:26px;font-weight:900;color:#0f172a;letter-spacing:-.5px;text-transform:uppercase}.brand-tag{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1.5px}'
      + '.footer-note{margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center}'
      + '</style></head>'
      + '<body>'
      + '<div class="watermark">OsintX</div>'
      + '<div class="report">'
      + '<div class="brand-header"><div><div class="brand-logo">OsintX Report</div><div class="brand-tag">Investigation POC Document</div></div></div>'
      + `${reportHtml}`
      + '<div class="footer-note">OsintX — Confidential Investigation Material — Handle in accordance with applicable data protection requirements</div>'
      + '</div></body></html>';
  };

  const handleDownloadPocReport = (format = 'md') => {
    if (!pocDraft) return;
    const base = `case_${caseData.caseId || caseData.id || caseId}_poc_${Date.now()}`;

    if (format === 'html') {
      downloadTextFile(buildFullHtmlReport(pocDraft), `${base}.html`, 'text/html');
      return;
    }
    if (format === 'pdf') {
      const printWin = window.open('', '_blank');
      if (!printWin) { toast.error('Popup blocked — allow popups for PDF export'); return; }
      printWin.document.write(buildFullHtmlReport(pocDraft));
      printWin.document.close();
      printWin.focus();
      printWin.print();
      return;
    }
    if (format === 'docx') {
      const docxHtml = buildFullHtmlReport(pocDraft)
        .replace('</style>', 'table{font-size:11pt}td,th{padding:4px 8px;border:1px solid #ccc}@page{size:A4;margin:2cm}' +
          'body{padding:0;background:white}.report{box-shadow:none;border:none;border-radius:0;padding:0;max-width:100%}</style>');
      const docxBlob = new Blob([docxHtml], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(docxBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${base}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }
    downloadTextFile(pocDraft, `${base}.md`, 'text/markdown');
  };

  const handleSavePocReportToCase = async () => {
    try {
      if (!pocDraft.trim()) {
        addNotification('Generate a POC report first', 'error');
        toast.error('Generate a POC report first');
        return;
      }

      const targetCaseId = resolvedCaseId;
      const caseTitle = caseData?.title || 'Untitled Case';
      const existingEvidence = caseData?.evidence || [];

      const result = await addEvidence(targetCaseId, {
        title: `Professional POC Report - ${new Date().toLocaleDateString()}`,
        type: 'poc_report',
        tool: 'POC Generator',
        query: caseTitle,
        description: 'Generated professional proof-of-case report derived from full case data, evidence, timeline, and observables.',
        source: 'Case POC Automation',
        data: {
          reportMarkdown: pocDraft,
          stats: pocStats,
          imageArtifacts: pocStats?.imageArtifacts || [],
          generatedAt: new Date().toISOString(),
          caseId: caseData?.caseId || caseData?.id || caseId
        },
        tags: ['poc', 'report', 'analysis'],
        verified: true,
        savedAt: new Date().toISOString(),
        chainOfCustody: [{
          action: 'Generated and saved POC report',
          timestamp: new Date().toISOString(),
          actor: 'Current investigator',
          source: 'Case detail page'
        }]
      });

      if (result?.success === false) {
        const errMsg = result.error || 'Failed to save POC report';
        addNotification(errMsg, 'error');
        toast.error(errMsg);
        return;
      }

      const existingImageKeys = new Set((existingEvidence)
        .filter(item => item.type === 'image' || item.data?.generatedFromPoc)
        .flatMap(item => [
          item.url,
          item.data?.imageUrl,
          item.data?.url,
        ].filter(Boolean)));
      const newImageArtifacts = uniqueImageArtifacts(pocStats?.imageArtifacts || [], 25)
        .filter(artifact => !existingImageKeys.has(artifact.url));

      for (const [index, artifact] of newImageArtifacts.entries()) {
        const imageResult = await addEvidence(targetCaseId, {
          title: `Extracted Image Artifact ${index + 1} - ${sanitizeString(artifact.label || artifact.kind || 'Visual Evidence')}`,
          type: 'image',
          tool: 'POC Generator',
          query: artifact.evidenceTitle || caseTitle,
          description: `Image artifact extracted from ${artifact.evidenceTitle || 'case evidence'} during POC generation. Source field: ${artifact.fieldPath || 'data'}.`,
          source: artifact.source || 'Case POC Automation',
          url: artifact.url,
          data: {
            imageUrl: artifact.url,
            label: artifact.label,
            kind: artifact.kind,
            sourceEvidenceId: artifact.evidenceId,
            sourceEvidenceTitle: artifact.evidenceTitle,
            fieldPath: artifact.fieldPath,
            generatedFromPoc: true,
            generatedAt: new Date().toISOString()
          },
          tags: ['image', 'visual-evidence', 'poc-extracted'],
          verified: false,
          savedAt: new Date().toISOString(),
          linkedTo: [artifact.evidenceId].filter(Boolean)
        });
        if (imageResult?.success === false) {
          console.warn('Failed to save extracted image artifact:', imageResult.error);
        }
      }

      addTimelineEvent(targetCaseId, 'POC report saved to case evidence', 'evidence');
      logActivity('Saved POC report to case evidence', { caseId: targetCaseId, type: 'evidence' });
      const successMsg = `POC report saved to case evidence${newImageArtifacts.length ? ` with ${newImageArtifacts.length} image artifact(s)` : ''}`;
      addNotification(successMsg, 'success');
      toast.success(successMsg);
    } catch (error) {
      console.error('[POC Save] Error:', error);
      const errMsg = error?.message || 'Failed to save POC report';
      addNotification(errMsg, 'error');
      toast.error(errMsg);
    }
  };

  const evidenceItems = caseData?.evidence || [];
  const leads = caseData?.leadsSnapshot || caseData?.entitiesSnapshot || [];

  const computeAutoNotes = (evidenceItems) => {
    if (!evidenceItems?.length) return [];
    const suggestions = [];
    const types = new Set(evidenceItems.map(e => e.type));
    const tools = new Set(evidenceItems.map(e => e.tool).filter(Boolean));
    const allText = evidenceItems.map(e => [e.title, e.description, e.data].filter(Boolean).join(' ')).join(' ');

    if (types.has('email')) suggestions.push({ id: 'auto-note-email', text: 'Email evidence — verify sender headers, SPF/DKIM/DMARC, and check for phishing indicators.', sensitive: false });
    if (types.has('domain')) suggestions.push({ id: 'auto-note-domain', text: 'Domain evidence — resolve DNS records, check WHOIS registration, and assess reputation.', sensitive: false });
    if (types.has('ip')) suggestions.push({ id: 'auto-note-ip', text: 'IP evidence — check geolocation, ASN ownership, and cross-reference threat intelligence feeds.', sensitive: false });
    if (types.has('phone')) suggestions.push({ id: 'auto-note-phone', text: 'Phone evidence — validate carrier, check reporting databases, and correlate with case identifiers.', sensitive: true });
    if (types.has('hash')) suggestions.push({ id: 'auto-note-hash', text: 'Hash evidence — compare against malware databases and verify file integrity.', sensitive: false });
    if (types.has('wallet') || tools.has('wallet')) suggestions.push({ id: 'auto-note-wallet', text: 'Cryptocurrency wallet — trace transactions on blockchain explorer and check for known addresses.', sensitive: false });
    if (types.has('url') || types.has('link')) suggestions.push({ id: 'auto-note-url', text: 'URL evidence — capture redirect chain, page metadata, and screenshots in a sandboxed environment.', sensitive: false });
    if (types.has('image')) suggestions.push({ id: 'auto-note-image', text: 'Image evidence — extract EXIF metadata, perform reverse image search, and check for manipulation.', sensitive: false });

    const emailCount = (allText.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi) || []).length;
    const domainCount = (allText.match(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b/gi) || []).length;
    const ipCount = (allText.match(/\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g) || []).length;
    if (emailCount > 3) suggestions.push({ id: 'auto-note-multi-email', text: `Multiple email addresses detected (${emailCount}) — prioritize correlation with known breach data and identity mapping.`, sensitive: true });
    if (domainCount > 3) suggestions.push({ id: 'auto-note-multi-domain', text: `Multiple domains detected (${domainCount}) — check for domain generation algorithm (DGA) patterns and bulk registration.`, sensitive: false });
    if (ipCount > 3) suggestions.push({ id: 'auto-note-multi-ip', text: `Multiple IP addresses detected (${ipCount}) — analyze for scanning behavior, proxy/VPN usage, and geographical distribution.`, sensitive: false });

    if (/password|secret|token|api_key|pii|ssn|credential/i.test(allText)) suggestions.push({ id: 'auto-note-sensitive', text: 'Sensitive data patterns detected — ensure proper classification, restricted access, and avoid unnecessary redistribution.', sensitive: true });
    if (/bitcoin|0x[a-fA-F0-9]{40}|wallet|blockchain/i.test(allText)) suggestions.push({ id: 'auto-note-crypto', text: 'Cryptocurrency artifacts found — document wallet addresses and transaction hashes for financial forensics.', sensitive: false });

    return suggestions.slice(0, 8);
  };

  const autoNotes = useMemo(() => computeAutoNotes(evidenceItems), [evidenceItems]);

  const getEvidenceQuality = (item) => {
    let score = 0;
    if (item.title) score += 15;
    if (item.description) score += 15;
    if (item.source) score += 10;
    if (item.addedAt || item.savedAt) score += 10;
    if (item.tags?.length) score += 10;
    if (item.chainOfCustody?.length) score += 15;
    if (item.linkedEvidence?.length) score += 10;
    if (item.verified) score += 15;
    return Math.min(100, score);
  };

  const caseIntelligence = useMemo(() => {
    const ev = evidenceItems;
    const allText = ev.map(e => [e.title, e.description, e.type, e.tool, e.query, e.notes, typeof e.data === 'string' ? e.data : ''].filter(Boolean).join(' ')).join(' ');

    const emails = new Set((allText.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi) || []).map(m => m.toLowerCase()));
    const domains = new Set((allText.match(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b/gi) || []).map(m => m.toLowerCase()));
    const ips = new Set((allText.match(/\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g) || []).map(m => m.toLowerCase()));
    const phones = new Set((allText.match(/(?:\+?\d[\d\s().-]{7,}\d)/g) || []).map(m => m.toLowerCase()));
    const usernames = new Set((allText.match(/\B@\w+/g) || []).map(m => m.toLowerCase()));
    const hashes = new Set((allText.match(/\b(?:[a-f0-9]{32}|[a-f0-9]{40}|[a-f0-9]{64})\b/gi) || []).map(m => m.toLowerCase()));
    const wallets = new Set((allText.match(/0x[a-fA-F0-9]{40}/g) || []).map(m => m.toLowerCase()));
    const urls = new Set((allText.match(/https?:\/\/[^\s"'<>),]+/gi) || []).map(m => m.toLowerCase()));

    const allEntities = new Set([...emails, ...domains, ...ips, ...phones, ...usernames, ...hashes, ...wallets, ...urls]);
    const entityCount = allEntities.size;

    const evidenceQualityScore = ev.length > 0
      ? Math.round(ev.reduce((sum, item) => sum + getEvidenceQuality(item), 0) / ev.length)
      : 0;

    const sensitiveCount = (allText.match(/password|secret|token|api_key|pii|ssn|credential|confidential/i) || []).length;
    const credentialExposure = (allText.match(/(?:password|passwd|pwd|api[_\s-]?key|token|secret|access[_\s-]?key)\s*[:=]\s*["']?[^\s"',;]{4,}/gi) || []).length;
    const maliciousCount = ev.filter(e => e.tags?.some(t => ['malware', 'phishing', 'c2', 'ransomware', 'apt', 'exfiltration'].includes(t))).length;
    const cryptoCount = wallets.size + (allText.match(/bitcoin|wallet|blockchain/i) || []).length;
    const unresolvedLeads = leads.filter(l => !['resolved', 'ignored'].includes(l.status || '')).length;

    const riskScore = Math.min(100,
      sensitiveCount * 20 +
      credentialExposure * 30 +
      maliciousCount * 25 +
      cryptoCount * 20 +
      unresolvedLeads * 10
    );

    const topEntityTypes = [
      { type: 'email', count: emails.size },
      { type: 'domain', count: domains.size },
      { type: 'ip', count: ips.size },
      { type: 'phone', count: phones.size },
      { type: 'username', count: usernames.size },
      { type: 'hash', count: hashes.size },
      { type: 'wallet', count: wallets.size },
      { type: 'url', count: urls.size },
    ].filter(e => e.count > 0).sort((a, b) => b.count - a.count);

    const leadStatusCounts = {
      new: leads.filter(l => l.status === 'new').length,
      accepted: leads.filter(l => l.status === 'accepted').length,
      investigating: leads.filter(l => l.status === 'investigating').length,
      resolved: leads.filter(l => l.status === 'resolved').length,
      ignored: leads.filter(l => l.status === 'ignored').length,
    };

    return { entityCount, evidenceQualityScore, riskScore, topEntityTypes, leadStatusCounts, evidenceQualityScoreLabel: `${evidenceQualityScore}/100` };
  }, [evidenceItems, leads]);

  useEffect(() => {
    if (evidenceItems?.length) {
      console.debug(`[CaseIntelligence] Refreshed: ${evidenceItems.length} evidence items, ${caseIntelligence.entityCount} entities, risk ${caseIntelligence.riskScore}`);
    }
  }, [evidenceItems?.length, caseIntelligence.entityCount, caseIntelligence.riskScore]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'evidence', label: 'Evidence', icon: FileText, count: caseData.evidence?.length || 0 },
    { id: 'timeline', label: 'Timeline', icon: Clock, count: caseData.timeline?.length || 0 },
    { id: 'notes', label: 'Notes', icon: MessageSquare, count: caseData.notes?.length || 0 },
    { id: 'graph', label: 'Investigation Graph', icon: GitBranch },
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'collab', label: 'Team', icon: Users, count: caseData.team?.length || 0 },
    { id: 'ai', label: 'AI Insights', icon: Brain },
    { id: 'entities', label: 'Entities', icon: Hash, count: (caseData?.entitiesSnapshot?.length || 0) },
    { id: 'review', label: 'Review', icon: Shield, count: (caseData?.evidence || []).filter(e => e.verificationStatus !== 'verified').length },
    { id: 'checklist', label: 'Checklist', icon: CheckCircle2 },
    { id: 'gallery', label: 'Gallery', icon: Image, count: (caseData?.evidence || []).filter(e => e.type === 'image' || e.type === 'screenshot' || e.imageUrl).length },
    { id: 'leads', label: 'Leads', icon: Target, count: (caseData?.leadsSnapshot?.length || 0) },
    { id: 'watchlist', label: 'Watchlist', icon: Eye },
    { id: 'export', label: 'Export', icon: Download },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'branches', label: 'Branches', icon: GitBranch },
    { id: 'audit', label: 'Audit Trail', icon: History },
    { id: 'change', label: 'Changes', icon: Activity },
    { id: 'confidence', label: 'Confidence', icon: TrendingUp },
    { id: 'templates', label: 'Templates', icon: Layout },
    { id: 'state-machine', label: 'State Machine', icon: GitBranch },
    { id: 'watchtower', label: 'Watchtower', icon: Bell },
    { id: 'compare', label: 'Compare', icon: GitCompare }
  ];

  const StatusIcon = statusIcons[caseData.status];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(245, 158, 11, 0.1), transparent 50%), radial-gradient(circle at 80% 50%, rgba(234, 88, 12, 0.1), transparent 50%)'
      }} />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />

      {/* Header */}
      <header className="z-40 border-b border-amber-900/30 bg-gray-950/95 backdrop-blur-sm sticky top-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <Link 
                to="/dashboard/user/cases"
                className="p-2 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-amber-400 transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-mono text-amber-500 hidden sm:inline">{caseData.id}</span>
                  <span className={`text-xs font-mono px-1.5 sm:px-2 py-0.5 rounded border ${statusColors[caseData.status]} flex items-center gap-1`}>
                    <StatusIcon className="w-3 h-3" />
                    <span className="hidden sm:inline">{caseData.status.toUpperCase()}</span>
                  </span>
                  <span className={`text-xs font-mono px-1.5 sm:px-2 py-0.5 rounded border ${priorityColors[caseData.priority]}`}>
                    {caseData.priority.toUpperCase()}
                  </span>
                </div>
                <h1 className="text-base sm:text-xl font-bold text-white truncate">{caseData.title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-1 sm:gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 font-bold text-sm sm:text-base">{credits}</span>
                <span className="text-xs text-amber-400/70 hidden sm:inline">credits</span>
              </div>
              
              <div className="hidden sm:flex items-center gap-2">
                {/* Status buttons */}
                {caseData.status !== 'active' && (
                  <button
                    onClick={() => handleStatusChange('active')}
                    className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                    title="Set Active"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}
                {caseData.status === 'active' && (
                  <button
                    onClick={() => handleStatusChange('paused')}
                    className="p-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                    title="Pause"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                )}
                {caseData.status !== 'completed' && (
                  <button
                    onClick={() => handleStatusChange('completed')}
                    className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                    title="Mark Complete"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
                
                <div className="w-px h-6 bg-gray-800" />
                
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`p-2 rounded-lg transition-colors ${isEditing ? 'bg-amber-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                  title="Edit Case"
                >
                  <Edit className="w-4 h-4" />
                </button>
                
                <button
                  onClick={handleExportBundle}
                  className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-amber-400 transition-colors"
                  title="Export Full Bundle"
                >
                  <FolderOpen className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDeduplicate}
                  className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
                  title="Smart Deduplication"
                >
                  <GitMerge className="w-4 h-4" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
                    title="Export Case"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {showExportMenu && (
                    <div className="absolute right-0 top-full mt-1 z-50 w-32 rounded-lg border border-gray-700/50 bg-gray-900 shadow-xl shadow-black/40 py-1">
                      <button onClick={() => { handleExportCase('json'); setShowExportMenu(false); }} className="block w-full px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-gray-800 transition-colors">Export JSON</button>
                      <button onClick={() => { handleExportCase('csv'); setShowExportMenu(false); }} className="block w-full px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-gray-800 transition-colors">Export CSV</button>
                      <button onClick={() => { handleExportCase('md'); setShowExportMenu(false); }} className="block w-full px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-gray-800 transition-colors">Export Markdown</button>
                      <button onClick={() => { handleExportCase('html'); setShowExportMenu(false); }} className="block w-full px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-gray-800 transition-colors">Export HTML</button>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  title="Delete Case"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              {/* Mobile Action Buttons */}
              <div className="flex sm:hidden items-center gap-1">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`p-2 rounded-lg transition-colors ${isEditing ? 'bg-amber-500 text-white' : 'bg-gray-800 text-gray-400'}`}
                  title="Edit Case"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 rounded-lg bg-red-500/20 text-red-400"
                  title="Delete Case"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Progress Bar */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-gray-900/50 border border-amber-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Investigation Progress</span>
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-amber-400">{caseData.progress}%</span>
              <button
                onClick={() => setShowReportHub(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold hover:from-amber-400 hover:to-orange-400 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Generate POCs
              </button>
            </div>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${caseData.progress}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
            />
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative mb-3">
          <div className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/50 px-3 py-2">
            <Search className="w-4 h-4 text-gray-500 shrink-0" />
            <input
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              onFocus={() => setShowGlobalSearch(true)}
              onBlur={() => setTimeout(() => setShowGlobalSearch(false), 200)}
              className="flex-1 bg-transparent text-sm text-gray-200 outline-none placeholder:text-gray-600"
              placeholder="Search across evidence, notes, timeline, entities, leads..."
            />
            {globalSearch && (
              <button onClick={() => { setGlobalSearch(''); setShowGlobalSearch(false); }} className="text-gray-500 hover:text-gray-300 transition-colors">
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
          {showGlobalSearch && globalSearch && globalSearchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 shadow-xl shadow-black/40 custom-scrollbar">
              <div className="p-1 space-y-0.5">
                {globalSearchResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveTab(r.type === 'evidence' ? 'evidence' : r.type === 'note' ? 'notes' : r.type === 'timeline' ? 'timeline' : 'overview'); setGlobalSearch(''); setShowGlobalSearch(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                      r.type === 'evidence' ? 'bg-amber-500/20 text-amber-400' :
                      r.type === 'note' ? 'bg-cyan-500/20 text-cyan-400' :
                      r.type === 'timeline' ? 'bg-emerald-500/20 text-emerald-400' :
                      r.type === 'entity' ? 'bg-violet-500/20 text-violet-400' : 'bg-gray-700 text-gray-400'
                    }`}>{r.source}</span>
                    <span className="truncate flex-1">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {showGlobalSearch && globalSearch && globalSearchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border border-gray-800 bg-gray-900 shadow-xl shadow-black/40 p-4 text-center text-xs text-gray-500">
              No results found for "{globalSearch}"
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 border-b border-gray-800 mb-4 sm:mb-6 overflow-x-auto scrollbar-hide pb-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-xs sm:text-sm font-medium">{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                  {/* Description */}
                  <div className="rounded-xl p-4 sm:p-6 bg-gray-900/50 border border-amber-500/20">
                    <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                      <Info className="w-5 h-5 text-amber-400" />
                      Description
                    </h3>
                    {isEditing ? (
                      <textarea
                        value={editedCase?.description || ''}
                        onChange={(e) => setEditedCase({ ...editedCase, description: e.target.value })}
                        className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 resize-none h-32 outline-none focus:border-amber-500/50"
                      />
                    ) : (
                      <p className="text-gray-300">{caseData.description}</p>
                    )}
                  </div>

                  {/* Recent Activity */}
                  <div className="rounded-xl p-6 bg-gray-900/50 border border-amber-500/20">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-amber-400" />
                      Recent Activity
                    </h3>
                    <div className="space-y-3">
                      {caseData.timeline?.slice(0, 5).map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
                          <div className={`w-2 h-2 rounded-full ${
                            item.type === 'system' ? 'bg-blue-400' :
                            item.type === 'action' ? 'bg-green-400' :
                            item.type === 'evidence' ? 'bg-purple-400' :
                            item.type === 'note' ? 'bg-cyan-400' : 'bg-amber-400'
                          }`} />
                          <span className="text-sm text-gray-300 flex-1">{item.event}</span>
                          <span className="text-xs text-gray-500">{formatTimeAgo(item.time)}</span>
                        </div>
                      ))}
                      {(!caseData.timeline || caseData.timeline.length === 0) && (
                        <p className="text-gray-500 text-center py-4">No activity recorded yet</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Case Health Score */}
                  <div className="rounded-xl p-6 bg-gray-900/50 border border-amber-500/20">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-amber-400" />
                      Case Health
                    </h3>
                    <div className="space-y-4">
                      {(() => {
                        const eCount = caseData.evidence?.length || 0;
                        const tCount = caseData.timeline?.length || 0;
                        const nCount = caseData.notes?.length || 0;
                        const verifiedCount = (caseData.evidence || []).filter(e => e.verified).length;
                        const totalItems = eCount + tCount + nCount + (caseData.entitiesSnapshot?.length || 0) + (caseData.leadsSnapshot?.length || 0);
                        const healthScore = Math.min(100, Math.round(
                          (eCount * 4) + (tCount * 2) + (nCount * 1.5) +
                          (verifiedCount * 6) + (caseData.progress || 0) * 0.3
                        ));
                        const completeness = Math.min(100, Math.round(
                          Math.min(eCount / 3, 1) * 25 +
                          Math.min(tCount / 5, 1) * 20 +
                          Math.min(nCount / 2, 1) * 15 +
                          Math.min(verifiedCount / Math.max(eCount, 1), 1) * 25 +
                          Math.min(totalItems / 10, 1) * 15
                        ));
                        const healthColor = healthScore >= 70 ? 'text-emerald-400' : healthScore >= 40 ? 'text-amber-400' : 'text-red-400';
                        const healthLabel = healthScore >= 70 ? 'Strong' : healthScore >= 40 ? 'Moderate' : 'Weak';
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold text-white">{caseData.progress}%</span>
                              <span className={`text-xs font-semibold ${healthColor}`}>{healthLabel}</span>
                            </div>
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${healthScore}%` }} className="h-full rounded-full" style={{ background: healthScore >= 70 ? 'linear-gradient(90deg, #10b981, #34d399)' : healthScore >= 40 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #ef4444, #f87171)' }} />
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mt-3">
                              <div><span className="text-white font-semibold">{eCount}</span> evidence</div>
                              <div><span className="text-white font-semibold">{verifiedCount}/{eCount}</span> verified</div>
                              <div><span className="text-white font-semibold">{tCount}</span> timeline</div>
                              <div><span className="text-white font-semibold">{nCount}</span> notes</div>
                            </div>
                            {completeness < 100 && (
                              <div className="mt-3 pt-3 border-t border-gray-800">
                                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                  <span>Evidence Completeness</span>
                                  <span>{completeness}%</span>
                                </div>
                                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${completeness}%` }} className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" />
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Case Details */}
                  <div className="rounded-xl p-6 bg-gray-900/50 border border-amber-500/20">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-amber-400" />
                      Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Case ID</p>
                        <p className="text-sm text-gray-300 font-mono">{caseData.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Created</p>
                        <p className="text-sm text-gray-300">{caseData.created}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Last Activity</p>
                        <p className="text-sm text-gray-300">{formatTimeAgo(caseData.lastActivity)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Priority</p>
                        {isEditing ? (
                          <select
                            value={editedCase?.priority || 'medium'}
                            onChange={(e) => setEditedCase({ ...editedCase, priority: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 outline-none"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        ) : (
                          <span className={`text-xs font-mono px-2 py-1 rounded border ${priorityColors[caseData.priority]}`}>
                            {caseData.priority.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Team */}
                  <div className="rounded-xl p-6 bg-gray-900/50 border border-amber-500/20">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-amber-400" />
                      Team Members
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {caseData.team?.map((member, i) => (
                        <div key={typeof member === 'object' ? member.id : i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                              <span className="text-sm text-white font-bold">
                                {typeof member === 'object' ? member.avatar : member}
                              </span>
                            </div>
                            {typeof member === 'object' && member.online && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-gray-800" />
                            )}
                          </div>
                          <div>
                            <span className="text-sm text-gray-300">
                              {typeof member === 'object' ? member.name : `Member ${i + 1}`}
                            </span>
                            {typeof member === 'object' && (
                              <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                            )}
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={() => setActiveTab('collab')}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-700 text-gray-500 hover:border-amber-500/50 hover:text-amber-400 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm">Add</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="rounded-xl p-6 bg-gray-900/50 border border-amber-500/20">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-400" />
                      Quick Actions
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowAddEvidence(true)}
                        className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-800/50 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Evidence
                      </button>
                      <button
                        onClick={() => setShowAddNote(true)}
                        className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-800/50 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Add Note
                      </button>
                      <button
                        onClick={() => handleExportCase('json')}
                        className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-800/50 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Export Case
                      </button>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveChanges}
                        className="flex-1 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold"
                      >
                        <Save className="w-4 h-4 inline mr-2" />
                        Save
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Evidence Tab - Enhanced */}
            {activeTab === 'evidence' && (
              <EvidenceManager
                evidence={caseData.evidence || []}
                autoNotes={autoNotes}
                onAddEvidence={(evidence) => {
                  addEvidence(resolvedCaseId, {
                    ...evidence,
                    id: `EVD-${Date.now()}`,
                    addedAt: new Date().toISOString(),
                    addedBy: 'Current User'
                  });
                  addTimelineEvent(resolvedCaseId, `Evidence added: ${evidence.title}`, 'evidence');
                  addNotification('Evidence added successfully', 'success');
                }}
                onDeleteEvidence={async (evidenceId) => {
                  const result = await removeEvidence(resolvedCaseId, evidenceId);
                  if (result.success) {
                    addTimelineEvent(resolvedCaseId, 'Evidence deleted', 'evidence');
                    addNotification('Evidence deleted', 'warning');
                  } else {
                    addNotification(result.error || 'Failed to delete evidence', 'error');
                  }
                }}
                onDownloadEvidence={async (evidenceId) => {
                  const result = await downloadEvidenceFile(resolvedCaseId, evidenceId);
                  addNotification(result.success ? 'Evidence file downloaded' : (result.error || 'Failed to download evidence file'), result.success ? 'success' : 'error');
                }}
                onLinkEvidence={(sourceId, targetId) => {
                  const evidence = caseData.evidence || [];
                  const updated = evidence.map(e => {
                    if (e.id === sourceId) {
                      const links = e.linkedTo || [];
                      return { ...e, linkedTo: [...links, targetId] };
                    }
                    return e;
                  });
                  updateCase(resolvedCaseId, { evidence: updated });
                }}
                onUpdateEvidence={(evidenceId, updates) => {
                  const evidence = caseData.evidence || [];
                  const updated = evidence.map(e => e.id === evidenceId ? { ...e, ...updates } : e);
                  updateCase(resolvedCaseId, { evidence: updated });
                }}
                onUpdateReviewStatus={(evidenceId, status) => {
                  const evidence = caseData.evidence || [];
                  const updated = evidence.map(e => e.id === evidenceId ? { ...e, reviewStatus: status } : e);
                  updateCase(resolvedCaseId, { evidence: updated });
                }}
                onUpdateTags={(evidenceId, tags) => {
                  const evidence = caseData.evidence || [];
                  const updated = evidence.map(e => e.id === evidenceId ? { ...e, tags: [...new Set([...(e.tags || []), ...tags])] } : e);
                  updateCase(resolvedCaseId, { evidence: updated });
                }}
                onUpdateChainOfCustody={(evidenceId, entry) => {
                  const evidence = caseData.evidence || [];
                  const updated = evidence.map(e => {
                    if (e.id === evidenceId) {
                      const chain = e.chainOfCustody || [];
                      return { ...e, chainOfCustody: [...chain, entry] };
                    }
                    return e;
                  });
                  updateCase(resolvedCaseId, { evidence: updated });
                }}
              />
            )}

            {/* Timeline Tab - Enhanced */}
            {activeTab === 'timeline' && (
              <AdvancedTimeline
                timeline={caseData.timeline || []}
                onAddEvent={(event) => {
                  addTimelineEvent(resolvedCaseId, event.event, event.type);
                  addNotification('Timeline event added', 'success');
                }}
                onEditEvent={(eventId, updates) => {
                  const timeline = caseData.timeline || [];
                  const updated = timeline.map(e => e.id === eventId ? { ...e, ...updates } : e);
                  updateCase(resolvedCaseId, { timeline: updated });
                }}
                onDeleteEvent={(eventId) => {
                  const timeline = caseData.timeline || [];
                  updateCase(resolvedCaseId, { timeline: timeline.filter(e => e.id !== eventId) });
                }}
                onMarkMilestone={(eventId) => {
                  const timeline = caseData.timeline || [];
                  const updated = timeline.map(e => 
                    e.id === eventId ? { ...e, isMilestone: !e.isMilestone } : e
                  );
                  updateCase(resolvedCaseId, { timeline: updated });
                }}
              />
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowAddNote(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold"
                  >
                    <Plus className="w-4 h-4" />
                    Add Note
                  </button>
                </div>

                <div className="space-y-4">
                  {(caseData.notes || []).map((note, i) => {
                    const entityPatterns = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b|https?:\/\/[^\s]+|0x[a-fA-F0-9]{40}|[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+|\+?\d[\d\s\-()]{7,18}/g;
                    const text = note.content || '';
                    const entities = [...text.matchAll(entityPatterns)].map(m => ({ value: m[0], index: m.index }));
                    const hasEntities = entities.length > 0;
                    const parts = [];
                    if (hasEntities) {
                      let lastIdx = 0;
                      entities.forEach((ent, idx) => {
                        if (ent.index > lastIdx) parts.push(<span key={`t${idx}`} className="text-gray-300">{text.slice(lastIdx, ent.index)}</span>);
                        parts.push(
                          <span key={`e${idx}`} className="group relative inline">
                            <span className="px-0.5 rounded bg-amber-500/20 text-amber-300 border-b border-dashed border-amber-500/40 cursor-help font-mono text-[11px]">{ent.value}</span>
                            <span className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-20">
                              <span className="bg-gray-800 text-[9px] text-gray-300 px-2 py-1 rounded shadow whitespace-nowrap border border-gray-700">
                                Detected entity — click to search
                              </span>
                            </span>
                          </span>
                        );
                        lastIdx = ent.index + ent.value.length;
                      });
                      if (lastIdx < text.length) parts.push(<span key="end" className="text-gray-300">{text.slice(lastIdx)}</span>);
                    }
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-xl p-4 bg-gray-900/50 border border-amber-500/20"
                      >
                        <div className="text-sm leading-relaxed mb-3 whitespace-pre-wrap break-words">
                          {hasEntities ? parts : <span className="text-gray-300">{text}</span>}
                        </div>
                        {hasEntities && (
                          <div className="flex flex-wrap gap-1 mb-2 border-t border-gray-800 pt-2">
                            <span className="text-[9px] text-gray-500 uppercase mr-1">Entities:</span>
                            {entities.slice(0, 8).map((ent, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">{ent.value}</span>
                            ))}
                            {entities.length > 8 && <span className="text-[9px] text-gray-600">+{entities.length - 8}</span>}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatTimeAgo(note.createdAt)}</span>
                          <span>{note.author}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {(!caseData.notes || caseData.notes.length === 0) && (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No notes added yet</p>
                    <button
                      onClick={() => setShowAddNote(true)}
                      className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    >
                      Add First Note
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <CaseAiSummaryCard caseData={caseData} summary={caseIntelligence} />
                <div className="grid lg:grid-cols-2 gap-6">
                {/* Progress Over Time */}
                <div className="rounded-xl p-6 bg-gray-900/50 border border-amber-500/20">
                  <h3 className="text-lg font-bold text-white mb-4">Investigation Metrics</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-400">Data Collection</span>
                        <span className="text-sm text-amber-400">{Math.min(caseData.dataPoints / 5, 100)}%</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(caseData.dataPoints / 5, 100)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-400">Correlation Analysis</span>
                        <span className="text-sm text-blue-400">{Math.min(caseData.correlations * 2, 100)}%</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(caseData.correlations * 2, 100)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-400">Evidence Gathered</span>
                        <span className="text-sm text-purple-400">{Math.min((caseData.evidence?.length || 0) * 10, 100)}%</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min((caseData.evidence?.length || 0) * 10, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resource Usage */}
                <div className="rounded-xl p-6 bg-gray-900/50 border border-amber-500/20">
                  <h3 className="text-lg font-bold text-white mb-4">Resource Usage</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-gray-800/50 text-center">
                      <p className="text-3xl font-bold text-amber-400 mb-1">{caseData.creditsSpent}</p>
                      <p className="text-xs text-gray-500">Credits Used</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-800/50 text-center">
                      <p className="text-3xl font-bold text-blue-400 mb-1">{caseData.dataPoints}</p>
                      <p className="text-xs text-gray-500">Data Points</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-800/50 text-center">
                      <p className="text-3xl font-bold text-purple-400 mb-1">{caseData.timeline?.length || 0}</p>
                      <p className="text-xs text-gray-500">Actions Taken</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-800/50 text-center">
                      <p className="text-3xl font-bold text-green-400 mb-1">{caseData.team?.length || 0}</p>
                      <p className="text-xs text-gray-500">Team Size</p>
                    </div>
                  </div>
                </div>

                {/* Activity Heatmap */}
                <div className="lg:col-span-2 rounded-xl p-6 bg-gray-900/50 border border-amber-500/20">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-amber-400" />
                    Activity Heatmap
                  </h3>
                  {(() => {
                    const timeline = caseData.timeline || [];
                    const evidence = caseData.evidence || [];
                    const all = [
                      ...timeline.map(e => ({ date: e.time || e.timestamp || e.date, type: 'event' })),
                      ...evidence.map(e => ({ date: e.addedAt || e.savedAt || e.createdAt, type: 'evidence' }))
                    ].filter(e => e.date);
                    const days = {};
                    all.forEach(e => {
                      const d = new Date(e.date).toISOString().slice(0, 10);
                      if (!days[d]) days[d] = { total: 0, events: 0, evidence: 0 };
                      days[d].total++;
                      days[d][e.type === 'event' ? 'events' : 'evidence']++;
                    });
                    const sorted = Object.entries(days).sort(([a], [b]) => a.localeCompare(b)).slice(-28);
                    const maxCount = Math.max(1, ...sorted.map(([, v]) => v.total));
                    if (!sorted.length) {
                      return <p className="text-sm text-gray-500 text-center py-8">No activity data available yet.</p>;
                    }
                    return (
                      <div className="flex flex-wrap gap-1.5">
                        {sorted.map(([date, data]) => {
                          const intensity = Math.min(100, Math.round((data.total / maxCount) * 100));
                          const bg = intensity >= 80 ? 'bg-emerald-500/40' : intensity >= 50 ? 'bg-amber-500/30' : intensity >= 20 ? 'bg-amber-500/15' : 'bg-gray-800';
                          return (
                            <div key={date} className="group relative">
                              <div className={`w-8 h-8 rounded ${bg} flex items-center justify-center text-[9px] text-gray-400 font-medium cursor-default transition-transform hover:scale-110`} title={`${date}: ${data.total} activities`}>
                                {new Date(date).getDate()}
                              </div>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                                <div className="bg-gray-800 text-xs text-gray-200 px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                  {date} — {data.total} ({data.events} events, {data.evidence} evidence)
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Intelligence Dashboard */}
                <div className="lg:col-span-2 rounded-xl p-6 bg-gray-900/50 border border-amber-500/20">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-amber-400" />
                    Intelligence Dashboard
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {(() => {
                      const ev = caseData.evidence || [];
                      const byType = {};
                      ev.forEach(e => { byType[e.type] = (byType[e.type] || 0) + 1; });
                      const entityCount = caseData.entitiesSnapshot?.length || 0;
                      const leadCount = caseData.leadsSnapshot?.length || 0;
                      return (
                        <>
                          <div className="rounded-lg bg-gray-800/40 p-3 border border-gray-700/30">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Evidence Types</p>
                            <div className="space-y-1">
                              {Object.entries(byType).slice(0, 5).map(([t, c]) => (
                                <div key={t} className="flex justify-between text-xs text-gray-400"><span className="capitalize">{t}</span><span className="text-white font-medium">{c}</span></div>
                              ))}
                              {!Object.keys(byType).length && <p className="text-xs text-gray-600">No evidence</p>}
                            </div>
                          </div>
                          <div className="rounded-lg bg-gray-800/40 p-3 border border-gray-700/30">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Entities</p>
                            <p className="text-2xl font-bold text-amber-400">{entityCount}</p>
                            <p className="text-[10px] text-gray-500 mt-1">indexed entities</p>
                          </div>
                          <div className="rounded-lg bg-gray-800/40 p-3 border border-gray-700/30">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Open Leads</p>
                            <p className="text-2xl font-bold text-blue-400">{leadCount}</p>
                            <p className="text-[10px] text-gray-500 mt-1">active leads</p>
                          </div>
                          <div className="rounded-lg bg-gray-800/40 p-3 border border-gray-700/30">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Source Reliability</p>
                            <p className="text-2xl font-bold text-emerald-400">
                              {ev.length ? Math.round(ev.filter(e => e.verified || e.reviewStatus === 'verified').length / ev.length * 100) : 0}%
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1">verified rate</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Efficiency Score */}
                <div className="lg:col-span-2 rounded-xl p-6 bg-gray-900/50 border border-amber-500/20">
                  <h3 className="text-lg font-bold text-white mb-4">Efficiency Analysis</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-400 mb-1">
                        {caseData.creditsSpent > 0 ? (caseData.dataPoints / caseData.creditsSpent * 10).toFixed(1) : '0.0'}
                      </p>
                      <p className="text-xs text-gray-500">Data per 10 Credits</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400 mb-1">
                        {caseData.dataPoints > 0 ? (caseData.correlations / caseData.dataPoints * 100).toFixed(1) : '0.0'}%
                      </p>
                      <p className="text-xs text-gray-500">Correlation Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-400 mb-1">
                        {((caseData.progress / 100) * (caseData.correlations + caseData.dataPoints)).toFixed(0)}
                      </p>
                      <p className="text-xs text-gray-500">Weighted Score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400 mb-1">
                        {caseData.progress}%
                      </p>
                      <p className="text-xs text-gray-500">Completion</p>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            )}

            {/* Investigation Graph Tab */}
            {activeTab === 'graph' && (
              <div className="space-y-3">
                {/* Graph filters toolbar */}
                <div className="flex flex-wrap items-center gap-2 rounded-xl bg-gray-900/50 border border-amber-500/20 px-3 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 shrink-0">Filters</span>
                  {['email', 'domain', 'ip', 'phone', 'username', 'wallet', 'hash', 'url'].map(type => {
                    const hasEntity = (caseData?.leadsSnapshot || caseData?.entitiesSnapshot || []).some(e => (e.entityType || e.type) === type);
                    if (!hasEntity) return null;
                    return (
                      <label key={type} className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-gray-800/50 text-gray-400 hover:bg-gray-800 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-2.5 h-2.5 accent-amber-500" />
                        {type}
                      </label>
                    );
                  })}
                  <div className="ml-auto flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[9px] text-gray-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>High</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-gray-600">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Medium</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-gray-600">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span>Low</span>
                    </div>
                  </div>
                </div>
                <InvestigationGraph
                  caseId={resolvedCaseId}
                  evidence={caseData.evidence || []}
                  initialNodes={caseData.graphNodes || []}
                  initialEdges={caseData.graphEdges || []}
                  onSaveGraph={({ nodes, edges }) => {
                    updateCase(resolvedCaseId, { graphNodes: nodes, graphEdges: edges });
                    addTimelineEvent(resolvedCaseId, 'Investigation graph updated', 'edit');
                    addNotification('Investigation graph saved', 'success');
                  }}
                />
              </div>
            )}

            {/* Tool Integration Tab */}
            {activeTab === 'tools' && (
              <ToolIntegration
                caseId={resolvedCaseId}
                savedResults={caseData.toolResults || []}
                onSaveResult={async (result) => {
                  const cleanResult = {
                    ...result,
                    tool: sanitizeToolName(result.tool),
                    query: sanitizeString(result.query),
                    summary: sanitizeString(result.summary),
                    data: sanitizeResultData(result.data),
                  };
                  const results = caseData.toolResults || [];
                  await updateCase(resolvedCaseId, { toolResults: [...results, cleanResult] });
                  const resultStatus = String(cleanResult.data?.status || cleanResult.status || '').toLowerCase();
                  const evidenceReady = cleanResult.data?.evidenceReady;
                  const isBlockedEvidence = resultStatus === 'failed' || resultStatus === 'unavailable' || (cleanResult.data?.success === false && evidenceReady === false);
                  if (isBlockedEvidence) {
                    addTimelineEvent(resolvedCaseId, `Tool result not evidence-ready: ${cleanResult.tool}`, 'tool');
                    addNotification('Tool result saved to case tools, but not added as evidence because it failed or is unavailable', 'warning');
                    return;
                  }
                  const evidenceResult = await addEvidence(resolvedCaseId, {
                    id: `EVD-${Date.now()}`,
                    title: `Tool Result: ${cleanResult.query}`,
                    type: 'data',
                    tool: cleanResult.tool,
                    query: cleanResult.query,
                    description: cleanResult.summary,
                    source: cleanResult.tool,
                    data: cleanResult.data,
                    tags: ['tool-result', cleanResult.tool, resultStatus === 'partial' ? 'partial' : null].filter(Boolean),
                    verified: Boolean(evidenceReady && cleanResult.data?.verifiedFindings?.length),
                    addedAt: new Date().toISOString()
                  });
                  if (evidenceResult.success) {
                    addTimelineEvent(resolvedCaseId, `Tool result saved: ${cleanResult.tool}`, 'evidence');
                    addNotification('Tool result saved to case evidence', 'success');
                  } else {
                    addNotification(evidenceResult.error || 'Failed to save tool result to evidence', 'error');
                  }
                }}
                onQuickInvestigate={(query) => {
                  logActivity('Quick investigate from case', { caseId, query, type: 'investigation' });
                }}
              />
            )}

            {/* Collaboration Tab */}
            {activeTab === 'collab' && (
              <CollaborationPanel
                caseId={caseId}
                caseTitle={caseData.title}
                teamMembers={caseData.team || []}
                currentUser={{ name: 'Current User', role: 'admin' }}
                onAddMember={(member) => {
                  const result = addTeamMember(resolvedCaseId, member);
                  if (result.success) {
                    addNotification(`${member.name || member.email} added to case`, 'success');
                  } else {
                    addNotification(result.error || 'Failed to add member', 'error');
                  }
                }}
                onRemoveMember={(memberId) => {
                  const result = removeTeamMember(resolvedCaseId, memberId);
                  if (result.success) {
                    addNotification('Team member removed', 'success');
                  }
                }}
                onUpdateRole={(memberId, newRole) => {
                  const result = updateTeamMemberRole(resolvedCaseId, memberId, newRole);
                  if (result.success) {
                    addNotification('Role updated', 'success');
                  }
                }}
                onSendMessage={(message) => {
                  logActivity('Sent case message', { caseId: resolvedCaseId, type: 'collaboration' });
                }}
              />
            )}

            {/* AI Insights Tab */}
            {activeTab === 'ai' && (
              <AIInsightsPanel
                caseData={caseData}
                evidence={caseData.evidence || []}
                timeline={caseData.timeline || []}
                onApplySuggestion={(suggestion) => {
                  addTimelineEvent(resolvedCaseId, `Applied AI suggestion: ${suggestion.text}`, 'ai');
                  logActivity('Applied AI suggestion', { caseId, suggestion: suggestion.text, type: 'ai' });
                }}
                onRunAnalysis={() => {
                  if (credits < 5) {
                    addNotification('Insufficient credits for AI analysis', 'error');
                    return;
                  }
                  consumeCredits(5);
                  addTimelineEvent(resolvedCaseId, 'AI analysis completed', 'analysis');
                  addNotification('AI analysis complete', 'success');
                }}
              />
            )}

            {/* Entity Index Tab */}
            {activeTab === 'entities' && (
              <EntityIndexPanel
                evidence={caseData.evidence || []}
                caseId={resolvedCaseId}
                onSelectEntity={(type, value) => {
                  setGlobalSearch(`${type}: ${value}`);
                  addNotification(`Selected entity: ${type}:${value}`, 'info');
                }}
              />
            )}

            {/* Lead Queue Tab */}
            {activeTab === 'leads' && (
              <LeadQueuePanel caseId={resolvedCaseId} />
            )}

            {/* Analyst Review Dashboard Tab */}
            {activeTab === 'review' && (
              <AnalystReviewDashboard
                evidence={caseData.evidence || []}
                entities={caseData.entitiesSnapshot || caseData.leadsSnapshot || []}
                auditLog={caseData.auditLog || []}
                tasks={caseData.checklist || []}
              />
            )}

            {/* Checklist Tab */}
            {activeTab === 'checklist' && (
              <ChecklistPanel
                caseId={resolvedCaseId}
                evidence={caseData.evidence || []}
                entities={caseData.entitiesSnapshot || caseData.leadsSnapshot || []}
                onTaskUpdate={(task, action) => {
                  addTimelineEvent(resolvedCaseId, `Task ${action}: ${task.text}`, 'checklist');
                }}
              />
            )}

            {/* Visual Evidence Gallery Tab */}
            {activeTab === 'gallery' && (
              <EvidenceGallery
                evidence={caseData.evidence || []}
              />
            )}

            {/* IOC Export Center Tab */}
            {activeTab === 'export' && (
              <IocExportCenter
                entities={caseData.entitiesSnapshot || caseData.leadsSnapshot || []}
                evidence={caseData.evidence || []}
              />
            )}

            {/* Watchlist Tab */}
            {activeTab === 'watchlist' && (
              <WatchlistIntegration
                caseId={resolvedCaseId}
                linkedWatchlistItems={caseData.watchlist || []}
                alerts={caseData.watchlistAlerts || []}
                onLinkItem={(item) => {
                  addToWatchlist(resolvedCaseId, item);
                  addTimelineEvent(resolvedCaseId, `Linked watchlist item: ${item.value}`, 'watchlist');
                }}
                onUnlinkItem={(item) => {
                  removeFromWatchlist(resolvedCaseId, item._id || item.id);
                }}
                onCreateAlert={(alert) => {
                  const alerts = caseData.watchlistAlerts || [];
                  updateCase(resolvedCaseId, { watchlistAlerts: [...alerts, alert] });
                  addNotification('Watchlist alert created', 'success');
                }}
              />
            )}

            {/* Reports Tab (replaced by Generate POCs button) */}
            {activeTab === 'reports' && null}

            {/* Investigation Branches Tab */}
            {activeTab === 'branches' && (
              <InvestigationBranchPanel
                caseId={resolvedCaseId}
              />
            )}

            {/* Change Detection Tab */}
            {activeTab === 'change' && (
              <ChangeDetectionPanel
                caseId={resolvedCaseId}
              />
            )}

            {/* Audit Trail Tab */}
            {activeTab === 'audit' && (
              <AuditTrailPanel
                caseId={resolvedCaseId}
              />
            )}

            {/* Confidence Explanation Tab */}
            {activeTab === 'confidence' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-gray-200">Confidence & Source Reliability</h3>
                </div>
                {(() => {
                  const allEv = caseData.evidence || [];
                  if (!allEv.length) return (
                    <div className="text-center py-12">
                      <TrendingUp className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No evidence to analyze confidence for</p>
                    </div>
                  );
                  return allEv.map((item, i) => (
                    <ConfidenceExplanation
                      key={item._id || i}
                      evidence={item}
                    />
                  ));
                })()}
              </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <CaseTemplates
                evidence={caseData.evidence || []}
                onApplyTemplate={(templateId) => {
                  caseService.applyTemplate(resolvedCaseId, templateId).then(res => {
                    if (res.success) {
                      addNotification(`Template applied: ${res.data?.tasksAdded || 0} tasks added`, 'success');
                      refreshCase(resolvedCaseId);
                    }
                  });
                }}
              />
            )}

            {/* State Machine Tab */}
            {activeTab === 'state-machine' && (
              <StateMachinePanel caseId={resolvedCaseId} />
            )}

            {/* Watchtower Tab */}
            {activeTab === 'watchtower' && (
              <WatchtowerPanel caseId={resolvedCaseId} />
            )}

            {/* Compare Tab */}
            {activeTab === 'compare' && (
              <CaseComparePanel caseId={resolvedCaseId} caseTitle={caseData?.title} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ReportHub Modal */}
      <AnimatePresence>
        {showReportHub && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm"
            onClick={() => setShowReportHub(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              <ReportHub
                caseData={caseData}
                onClose={() => setShowReportHub(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POC Report Preview / Editor Modal */}
      <AnimatePresence>
        {showPocReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm"
            onClick={() => !isGeneratingPoc && setShowPocReport(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-6xl h-[90vh] bg-gray-950 rounded-2xl border border-amber-500/30 overflow-hidden flex flex-col shadow-2xl shadow-black/50"
            >
              <div className="p-4 sm:p-5 border-b border-gray-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-white">Generate POCs Report</h2>
                    <p className="text-sm text-gray-400">
                      Free local case correlation with optional browser-native AI enhancement when available.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex rounded-lg border border-gray-800 bg-gray-900 p-1">
                    <button
                      onClick={() => setPocViewMode('preview')}
                      className={`px-3 py-1.5 rounded-md text-sm ${pocViewMode === 'preview' ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => setPocViewMode('editor')}
                      className={`px-3 py-1.5 rounded-md text-sm ${pocViewMode === 'editor' ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      Editor
                    </button>
                  </div>

                  <div className="relative" ref={downloadMenuRef}>
                    <button
                      onClick={() => setShowDownloadMenu(prev => !prev)}
                      disabled={!pocDraft || isGeneratingPoc}
                      className="px-3 py-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 disabled:opacity-50 flex items-center gap-2 text-sm font-semibold"
                    >
                      <Download className="w-4 h-4" />
                      Download
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} />
                    </button>
                    {showDownloadMenu && (
                      <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-gray-900 border border-gray-700 shadow-2xl shadow-black/50 overflow-hidden z-50">
                        {[
                          { key: 'md', label: 'Markdown (.md)', icon: FileText },
                          { key: 'html', label: 'HTML Report (.html)', icon: Globe },
                          { key: 'pdf', label: 'PDF Report (.pdf)', icon: FileText },
                          { key: 'docx', label: 'Word Document (.docx)', icon: FileText },
                        ].map(({ key, label, icon: Icon }) => (
                          <button
                            key={key}
                            onClick={() => { handleDownloadPocReport(key); setShowDownloadMenu(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                          >
                            <Icon className="w-4 h-4 text-amber-400 shrink-0" />
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSavePocReportToCase}
                    disabled={!pocDraft || isGeneratingPoc}
                    className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-50 flex items-center gap-2 text-sm font-semibold"
                  >
                    <Save className="w-4 h-4" />
                    Save to Case
                  </button>
                  <button
                    onClick={() => setShowPocReport(false)}
                    disabled={isGeneratingPoc}
                    className="p-2 rounded-lg bg-gray-900 text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-50"
                    title="Close"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {pocStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2 sm:gap-3 p-4 border-b border-gray-900 bg-gray-950">
                  {[
                    ['Evidence', pocStats.evidenceCount],
                    ['Observables', pocStats.observableCount],
                    ['Images', pocStats.imageCount || 0],
                    ['Sensitive', pocStats.sensitiveCount || 0],
                    ['Correlations', pocStats.correlationCount],
                    ['Risk', `${pocStats.riskScore}/100`],
                    ['Confidence', pocStats.confidence]
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-gray-900/80 border border-gray-800 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
                      <p className="text-sm sm:text-base font-semibold text-white mt-1">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-hidden">
                {isGeneratingPoc ? (
                  <div className="h-full flex items-center justify-center p-8">
                    <div className="w-full max-w-lg">
                      <div className="w-14 h-14 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-center mx-auto mb-5">
                        <RefreshCw className="w-7 h-7 text-amber-400 animate-spin" />
                      </div>
                      <h3 className="text-xl font-bold text-white text-center mb-2">Generating Professional POCs</h3>
                      <p className="text-sm text-gray-400 text-center mb-6">{POC_GENERATION_STEPS[pocGenerationStep]}</p>
                      <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${((pocGenerationStep + 1) / POC_GENERATION_STEPS.length) * 100}%` }}
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full overflow-y-auto p-4 sm:p-6">
                    {pocViewMode === 'editor' ? (
                      <textarea
                        value={pocDraft}
                        onChange={(event) => setPocDraft(event.target.value)}
                        className="min-h-full w-full rounded-xl bg-gray-900 border border-gray-800 focus:border-amber-500/50 outline-none p-4 text-sm leading-6 text-gray-100 font-mono resize-none"
                        placeholder="Generated POC report will appear here..."
                      />
                    ) : (
                      pocDraft
                        ? <PocReportPreview markdown={pocDraft} stats={pocStats} />
                        : (
                          <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-10 text-center">
                            <FileSpreadsheet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400">Generated POC preview will appear here.</p>
                          </div>
                        )
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Evidence Modal */}
      <AnimatePresence>
        {showAddEvidence && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowAddEvidence(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-gray-900 rounded-2xl border border-amber-500/30 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  Add Evidence
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Title *</label>
                  <input
                    type="text"
                    value={newEvidence.title}
                    onChange={(e) => setNewEvidence({ ...newEvidence, title: e.target.value })}
                    placeholder="Evidence title..."
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-amber-500/50 outline-none text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Type</label>
                  <select
                    value={newEvidence.type}
                    onChange={(e) => setNewEvidence({ ...newEvidence, type: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white outline-none"
                  >
                    <option value="document">Document</option>
                    <option value="image">Image</option>
                    <option value="link">Link</option>
                    <option value="data">Data</option>
                    <option value="network">Network</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Description</label>
                  <textarea
                    value={newEvidence.description}
                    onChange={(e) => setNewEvidence({ ...newEvidence, description: e.target.value })}
                    placeholder="Describe this evidence..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-amber-500/50 outline-none text-white resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Source</label>
                  <input
                    type="text"
                    value={newEvidence.source}
                    onChange={(e) => setNewEvidence({ ...newEvidence, source: e.target.value })}
                    placeholder="Where was this collected from?"
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-amber-500/50 outline-none text-white"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-800 flex gap-3">
                <button
                  onClick={() => setShowAddEvidence(false)}
                  className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEvidence}
                  disabled={!newEvidence.title.trim()}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold disabled:opacity-50"
                >
                  Add Evidence
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Note Modal */}
      <AnimatePresence>
        {showAddNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowAddNote(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-gray-900 rounded-2xl border border-amber-500/30 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-400" />
                  Add Note
                </h2>
              </div>
              <div className="p-6">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Write your note..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-amber-500/50 outline-none text-white resize-none"
                  autoFocus
                />
              </div>
              <div className="p-6 border-t border-gray-800 flex gap-3">
                <button
                  onClick={() => setShowAddNote(false)}
                  className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold disabled:opacity-50"
                >
                  Add Note
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-gray-900 rounded-2xl border border-red-500/30 overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Delete Case?</h2>
                <p className="text-gray-400 mb-6">
                  Are you sure you want to delete "{caseData.title}"? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteCase}
                    className="flex-1 py-3 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CaseDetailPage;

