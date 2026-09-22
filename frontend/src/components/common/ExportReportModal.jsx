/**
 * Export Report Modal
 * Allows exporting tool results in various formats with customization
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, X, FileJson, FileText, FileSpreadsheet, 
  Check, Copy, Printer, Share2, CheckCircle, Settings
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { exportToJSON, exportToCSV, exportToText, copyToClipboard } from '../../utils/export';

const ExportReportModal = ({ isOpen, onClose, data, title = 'Report', toolName = 'Tool' }) => {
  const { isDark } = useTheme();
  const [selectedFormat, setSelectedFormat] = useState('json');
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const formats = [
    { 
      id: 'json', 
      label: 'JSON', 
      description: 'Machine-readable format',
      icon: FileJson,
      color: 'from-amber-500 to-orange-500'
    },
    { 
      id: 'csv', 
      label: 'CSV', 
      description: 'Spreadsheet compatible',
      icon: FileSpreadsheet,
      color: 'from-emerald-500 to-green-500'
    },
    { 
      id: 'txt', 
      label: 'Text', 
      description: 'Plain text format',
      icon: FileText,
      color: 'from-cyan-500 to-blue-500'
    },
  ];

  const prepareExportData = () => {
    const exportData = {
      ...(includeMetadata && {
        _metadata: {
          tool: toolName,
          title: title,
          exportedAt: includeTimestamp ? new Date().toISOString() : undefined,
          format: selectedFormat,
        }
      }),
      data: data
    };
    return exportData;
  };

  const handleExport = async () => {
    if (!data) return;
    
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const exportData = prepareExportData();
      const timestamp = includeTimestamp ? `_${Date.now()}` : '';
      const filename = `${toolName.toLowerCase().replace(/\s+/g, '_')}${timestamp}`;

      let success = false;
      
      switch (selectedFormat) {
        case 'json':
          success = exportToJSON(exportData, `${filename}.json`);
          break;
        case 'csv':
          // Flatten data for CSV
          const csvData = Array.isArray(data) ? data : [data];
          success = exportToCSV(csvData, `${filename}.csv`);
          break;
        case 'txt':
          const textContent = `${title}\n${'='.repeat(50)}\n\nTool: ${toolName}\nExported: ${new Date().toLocaleString()}\n\n${JSON.stringify(data, null, 2)}`;
          success = exportToText(textContent, `${filename}.txt`);
          break;
      }

      if (success) {
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    const exportData = prepareExportData();
    const success = await copyToClipboard(JSON.stringify(exportData, null, 2));
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${title} - ${toolName}</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 40px; }
              pre { background: #f5f5f5; padding: 20px; border-radius: 8px; overflow: auto; }
              h1 { color: #333; }
              .meta { color: #666; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <div class="meta">
              <p>Tool: ${toolName}</p>
              <p>Generated: ${new Date().toLocaleString()}</p>
            </div>
            <pre>${JSON.stringify(data, null, 2)}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border ${
              isDark 
                ? 'bg-slate-900 border-white/10' 
                : 'bg-white border-gray-200'
            }`}
          >
            {/* Header */}
            <div className={`p-6 border-b ${isDark ? 'border-white/10 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10' : 'border-gray-200 bg-gradient-to-r from-cyan-50 to-emerald-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Export Report
                    </h2>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {toolName} - {title}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                >
                  <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                </motion.button>
              </div>
            </div>

            {/* Format Selection */}
            <div className="p-6 space-y-6">
              <div>
                <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Export Format
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {formats.map(format => (
                    <motion.button
                      key={format.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedFormat(format.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedFormat === format.id
                          ? `border-transparent bg-gradient-to-br ${format.color} text-white`
                          : isDark
                            ? 'border-white/10 bg-white/5 hover:bg-white/10'
                            : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <format.icon className={`w-6 h-6 mx-auto mb-2 ${
                        selectedFormat === format.id ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <div className={`text-sm font-medium ${
                        selectedFormat === format.id ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {format.label}
                      </div>
                      <div className={`text-xs mt-1 ${
                        selectedFormat === format.id ? 'text-white/80' : isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {format.description}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div>
                <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Settings className="w-4 h-4" />
                  Options
                </h3>
                <div className="space-y-3">
                  <label className={`flex items-center justify-between p-3 rounded-xl cursor-pointer ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Include timestamp
                    </span>
                    <input
                      type="checkbox"
                      checked={includeTimestamp}
                      onChange={(e) => setIncludeTimestamp(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
                    />
                  </label>
                  <label className={`flex items-center justify-between p-3 rounded-xl cursor-pointer ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Include metadata
                    </span>
                    <input
                      type="checkbox"
                      checked={includeMetadata}
                      onChange={(e) => setIncludeMetadata(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
                    />
                  </label>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCopyToClipboard}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-colors ${
                    isDark 
                      ? 'bg-white/5 hover:bg-white/10 text-gray-300' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePrint}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-colors ${
                    isDark 
                      ? 'bg-white/5 hover:bg-white/10 text-gray-300' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  <span className="text-sm">Print</span>
                </motion.button>
              </div>
            </div>

            {/* Footer */}
            <div className={`p-4 border-t ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <AnimatePresence>
                  {exportSuccess && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center gap-2 text-emerald-400"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm">Export successful!</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    onClick={onClose}
                    className={`px-4 py-2 rounded-xl text-sm ${isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleExport}
                    disabled={isExporting || !data}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition-all ${
                      isExporting || !data
                        ? 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:opacity-90'
                    }`}
                  >
                    {isExporting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Download className="w-4 h-4" />
                        </motion.div>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Export {selectedFormat.toUpperCase()}
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExportReportModal;
