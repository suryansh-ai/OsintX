import { useState, useCallback, useEffect } from 'react';
import { FileText, Download, Loader2, Check, File, Shield, Target, AlertTriangle, Eye, Settings, Image, GitBranch, Clock, Hash, Lock } from 'lucide-react';
import { caseService } from '../../services/caseService';

const REPORT_TYPES = [
  { id: 'intelligence_brief', label: 'OsintX Report', icon: Target, color: 'amber', description: '1-3 pages · Quick understanding for investigators, managers, clients, and executives', sections: ['Snapshot', 'Key Findings', 'Assessment', 'Risk Summary', 'Actions'] },
  { id: 'executive_investigation_report', label: 'OsintX Report', icon: Shield, color: 'purple', description: '5-15 pages · Full attribution analysis with entity graphs, timeline, image intel, and POCs', sections: ['Cover', 'Executive Summary', 'Key Findings', 'Attribution', 'Graph', 'Timeline', 'Image Intel', 'Risk', 'POCs', 'Actions'] },
  { id: 'technical_evidence_package', label: 'OsintX Report', icon: Hash, color: 'cyan', description: 'Unlimited · Evidence preservation for analysts, DFIR, compliance, auditors, courts, and law enforcement', sections: ['Custody Chain', 'Evidence Inventory', 'Indicators', 'Correlations', 'Source Reliability', 'Quality', 'Visuals'] },
];

const EXPORT_FORMATS = [
  { id: 'html', label: 'HTML', icon: Eye, desc: 'Professional web format with embedded visuals' },
  { id: 'pdf', label: 'PDF', icon: File, desc: 'Print-ready document' },
  { id: 'docx', label: 'DOCX', icon: FileText, desc: 'Editable Word document' },
  { id: 'markdown', label: 'Markdown', icon: File, desc: 'Plain text with formatting' },
  { id: 'json', label: 'JSON', icon: Hash, desc: 'Structured data export' },
];

const REPORT_COLORS = {
  amber: { selected: 'bg-amber-500/20 border-amber-500/50', icon: 'text-amber-400', gradient: 'from-amber-500 to-orange-500', badge: 'bg-amber-500/20 text-amber-400' },
  purple: { selected: 'bg-purple-500/20 border-purple-500/50', icon: 'text-purple-400', gradient: 'from-purple-500 to-violet-600', badge: 'bg-purple-500/20 text-purple-400' },
  cyan: { selected: 'bg-cyan-500/20 border-cyan-500/50', icon: 'text-cyan-400', gradient: 'from-cyan-500 to-blue-600', badge: 'bg-cyan-500/20 text-cyan-400' },
};

const API_BASE = 'http://localhost:5000/api';

const downloadFile = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const ReportHub = ({ caseData, onClose }) => {
  const [selectedType, setSelectedType] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('html');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    classification: 'confidential',
    includeImages: true,
    includeGraphs: true,
    includeTimeline: true,
    includePocs: true,
    includeRawEvidence: false,
    courtReady: false,
    customBranding: false,
    redactionMode: false,
    analyst: '',
  });

  const caseId = caseData?._id || caseData?.id;

  const generateReport = useCallback(async () => {
    if (!selectedType || !caseId) return;
    setIsGenerating(true);
    setGenerationStep(0);
    setError(null);

    const steps = ['Compiling case data...', 'Running correlation analysis...', 'Processing image intelligence...', 'Building visualizations...', 'Generating POCs...', 'Formatting report...'];
    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 400));
      setGenerationStep(i + 1);
    }

    try {
      const token = localStorage.getItem('osintx_token');
      const resp = await fetch(`${API_BASE}/reports/${caseId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reportType: selectedType, format: 'html', options }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || 'Report generation failed');
      }

      const html = await resp.text();
      setPreviewHtml(html);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedType, caseId, options]);

  const handleExport = useCallback(async (format) => {
    if (!selectedType || !caseId || !previewHtml) return;

    if (format === 'html' && previewHtml) {
      const blob = new Blob([previewHtml], { type: 'text/html' });
      downloadFile(blob, `${caseData?.caseId || caseId}_${selectedType}_${Date.now()}.html`);
      return;
    }

    try {
      const token = localStorage.getItem('osintx_token');
      const resp = await fetch(`${API_BASE}/reports/${caseId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reportType: selectedType, format, options }),
      });

      if (!resp.ok) throw new Error('Export failed');

      const contentType = resp.headers.get('content-type') || '';
      const disposition = resp.headers.get('content-disposition') || '';
      const filename = disposition.match(/filename="?(.+)"?/)?.[1] || `${caseData?.caseId || caseId}_${selectedType}_${Date.now()}.${format}`;

      if (contentType.includes('application/json') || contentType.includes('text/markdown')) {
        const text = await resp.text();
        downloadFile(new Blob([text], { type: contentType }), filename);
      } else {
        const blob = await resp.blob();
        downloadFile(blob, filename);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [selectedType, caseId, previewHtml, caseData, options]);

  const printReport = useCallback(() => {
    if (!previewHtml) return;
    const win = window.open('', '_blank');
    win.document.write(previewHtml);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  }, [previewHtml]);

  const rt = REPORT_TYPES.find(t => t.id === selectedType);
  const colors = REPORT_COLORS[rt?.color || 'amber'];

  return (
    <div className="w-full bg-gray-900 rounded-2xl border border-amber-500/30 flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center gap-3 shrink-0">
        <FileText className="w-6 h-6 text-amber-400" />
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">Generate Intelligence Report</h2>
          <p className="text-sm text-gray-500">Professional investigation reports with visual intelligence</p>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">✕</button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {!previewHtml ? (
          <div className="space-y-6">
            {/* Report Type Selection */}
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Select Report Type</h3>
              <div className="grid grid-cols-1 gap-4">
                {REPORT_TYPES.map(type => {
                  const Icon = type.icon;
                  const c = REPORT_COLORS[type.color];
                  const isSelected = selectedType === type.id;
                  return (
                    <button key={type.id} onClick={() => { setSelectedType(type.id); setPreviewHtml(null); }}
                      className={`p-5 rounded-xl border text-left transition-all ${isSelected ? c.selected : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'}`}>
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shrink-0`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-white text-lg" style={{ fontFamily: "'Papyrus', 'Copperplate', fantasy" }}>{type.label}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded ${c.badge}`}>{isSelected ? 'Selected' : 'Select'}</span>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{type.description}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {type.sections.map(s => (
                              <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-gray-700 text-gray-400">{s}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Advanced Options */}
            {selectedType && (
              <div>
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-gray-400" /> Advanced Options
                </h3>
                <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-gray-800/30 border border-gray-700/50">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={options.includeImages} onChange={e => setOptions(o => ({ ...o, includeImages: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-amber-500" />
                    <Image className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm text-gray-300">Include Images</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={options.includeGraphs} onChange={e => setOptions(o => ({ ...o, includeGraphs: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-amber-500" />
                    <GitBranch className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm text-gray-300">Include Visual Graphs</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={options.includeTimeline} onChange={e => setOptions(o => ({ ...o, includeTimeline: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-amber-500" />
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm text-gray-300">Include Timeline</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={options.includePocs} onChange={e => setOptions(o => ({ ...o, includePocs: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-amber-500" />
                    <Target className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm text-gray-300">Include POCs</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={options.includeRawEvidence} onChange={e => setOptions(o => ({ ...o, includeRawEvidence: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-amber-500" />
                    <Hash className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm text-gray-300">Include Raw Evidence</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={options.courtReady} onChange={e => setOptions(o => ({ ...o, courtReady: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-amber-500" />
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm text-gray-300">Court Ready Export</span>
                  </label>
                </div>

                {/* Classification */}
                <div className="mt-3">
                  <h4 className="text-xs font-medium text-gray-400 mb-2">Classification Level</h4>
                  <div className="flex gap-2">
                    {['public', 'internal', 'confidential', 'restricted', 'top_secret'].map(level => (
                      <button key={level} onClick={() => setOptions(o => ({ ...o, classification: level }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${options.classification === level
                          ? 'bg-amber-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                        {level.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Generating progress */}
            {isGenerating && (
              <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                  <span className="text-white font-medium">Generating Report...</span>
                </div>
                <div className="space-y-2">
                  {['Compiling case data...', 'Running correlation analysis...', 'Processing image intelligence...', 'Building visualizations...', 'Generating POCs...', 'Formatting report...'].map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {i < generationStep ? <Check className="w-4 h-4 text-green-400" /> :
                        i === generationStep ? <Loader2 className="w-4 h-4 text-amber-400 animate-spin" /> :
                          <div className="w-4 h-4 rounded-full border border-gray-600" />}
                      <span className={`text-sm ${i <= generationStep ? 'text-gray-300' : 'text-gray-600'}`}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Preview */
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white">Report Preview</h3>
              <button onClick={() => setPreviewHtml(null)} className="text-sm text-amber-400 hover:text-amber-300">
                ← Back to Options
              </button>
            </div>
            <p className="text-xs text-gray-500">Report generated successfully. Use the options below to export or print.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-800 shrink-0">
        {!previewHtml ? (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {selectedType ? (REPORT_TYPES.find(t => t.id === selectedType)?.sections.length || 0) + ' sections' : 'Select a report type'}
            </p>
            <button onClick={generateReport} disabled={!selectedType || isGenerating}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed">
              {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> :
                <><FileText className="w-4 h-4" /> Generate Report</>}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">Report ready · {selectedType?.replace(/_/g, ' ')}</p>
              <div className="flex gap-2">
                <button onClick={printReport}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white text-xs">
                  <Eye className="w-3.5 h-3.5" /> Print / PDF
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {EXPORT_FORMATS.map(f => (
                <button key={f.id} onClick={() => handleExport(f.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm hover:opacity-90 transition-opacity">
                  <Download className="w-3.5 h-3.5" /> {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              {EXPORT_FORMATS.map(f => (
                <span key={f.id} className="truncate" title={f.desc}>{f.label}: {f.desc}{' · '}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportHub;
