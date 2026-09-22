import { sanitizeResultData, sanitizeString, stringifySanitized } from './resultSanitizer';

/**
 * Export Utilities
 * Export data in various formats (JSON, CSV, PDF)
 */

/**
 * Export data as JSON file
 */
export const exportToJSON = (data, filename = 'export.json') => {
  try {
    const jsonString = stringifySanitized(data);
    const blob = new Blob([jsonString], { type: 'application/json' });
    downloadBlob(blob, filename);
    return true;
  } catch (error) {
    console.error('[Export] JSON export failed:', error);
    return false;
  }
};

/**
 * Export data as CSV file
 */
export const exportToCSV = (data, filename = 'export.csv', columns = null) => {
  try {
    // Handle array of objects
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Data must be a non-empty array');
    }

    // Determine columns
    const cols = columns || Object.keys(data[0]);

    // Create CSV header
    const header = cols.map(escapeCSVValue).join(',');

    // Create CSV rows
    const rows = data.map(row => 
      cols.map(col => escapeCSVValue(row[col])).join(',')
    );

    // Combine header and rows
    const csv = [header, ...rows].join('\n');

    // Create and download blob
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename);
    return true;
  } catch (error) {
    console.error('[Export] CSV export failed:', error);
    return false;
  }
};

/**
 * Export data as plain text
 */
export const exportToText = (data, filename = 'export.txt') => {
  try {
    let content;
    
    if (typeof data === 'string') {
      content = sanitizeString(data);
    } else if (typeof data === 'object') {
      content = stringifySanitized(data);
    } else {
      content = String(data);
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    downloadBlob(blob, filename);
    return true;
  } catch (error) {
    console.error('[Export] Text export failed:', error);
    return false;
  }
};

/**
 * Export table data to CSV
 */
export const exportTableToCSV = (tableId, filename = 'table.csv') => {
  try {
    const table = document.getElementById(tableId);
    if (!table) throw new Error('Table not found');

    const rows = Array.from(table.querySelectorAll('tr'));
    const csv = rows.map(row => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      return cells.map(cell => escapeCSVValue(cell.textContent)).join(',');
    }).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename);
    return true;
  } catch (error) {
    console.error('[Export] Table CSV export failed:', error);
    return false;
  }
};

/**
 * Export as PDF (requires html2pdf.js or similar library)
 * This is a placeholder - integrate with jsPDF or html2pdf.js in production
 */
export const exportToPDF = async (elementId, filename = 'export.pdf', options = {}) => {
  try {
    // Check if html2pdf is available
    if (typeof window !== 'undefined' && window.html2pdf) {
      const element = document.getElementById(elementId);
      if (!element) throw new Error('Element not found');

      const opt = {
        margin: 10,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        ...options,
      };

      await window.html2pdf().set(opt).from(element).save();
      return true;
    } else {
      console.warn('[Export] PDF export requires html2pdf library');
      return false;
    }
  } catch (error) {
    console.error('[Export] PDF export failed:', error);
    return false;
  }
};

/**
 * Copy data to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('[Export] Copy to clipboard failed:', error);
    return false;
  }
};

/**
 * Generate and download report
 */
export const generateReport = (data, options = {}) => {
  const {
    title = 'Report',
    timestamp = new Date().toISOString(),
    format = 'json',
    filename = `report_${Date.now()}.${format}`,
  } = options;

  const report = {
    title,
    generated: timestamp,
    data: sanitizeResultData(data),
  };

  switch (format) {
    case 'json':
      return exportToJSON(report, filename);
    case 'csv':
      return exportToCSV(Array.isArray(data) ? data : [data], filename);
    case 'text':
      return exportToText(report, filename);
    default:
      console.error('[Export] Unknown format:', format);
      return false;
  }
};

/**
 * Export history/bookmarks
 */
export const exportHistory = (history, bookmarks) => {
  const data = {
    exported: new Date().toISOString(),
    history: sanitizeResultData(history),
    bookmarks: sanitizeResultData(bookmarks),
  };
  return exportToJSON(data, `osintx_history_${Date.now()}.json`);
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Escape CSV value
 */
const escapeCSVValue = (value) => {
  if (value === null || value === undefined) return '';
  
  const str = sanitizeString(String(value));
  
  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
};

/**
 * Download blob as file
 */
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up URL
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

/**
 * Format data for export
 */
export const formatForExport = (data, format = 'json') => {
  if (!data) return null;

  switch (format) {
    case 'json':
      return stringifySanitized(data);
    case 'csv':
      // Convert to flat structure for CSV
      if (Array.isArray(data)) {
        return data;
      }
      return [sanitizeResultData(data)];
    case 'text':
      if (typeof data === 'string') return sanitizeString(data);
      return stringifySanitized(data);
    default:
      return sanitizeResultData(data);
  }
};

export default {
  exportToJSON,
  exportToCSV,
  exportToText,
  exportTableToCSV,
  exportToPDF,
  copyToClipboard,
  generateReport,
  exportHistory,
  formatForExport,
};
