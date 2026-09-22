/**
 * ToolResultContext
 *
 * Any tool can call `setLastResult({ data, toolName, query })` to register
 * its latest result. A global floating "Save to Case" button appears
 * automatically whenever a result is present, without needing to modify
 * each individual tool component.
 */

import { createContext, useContext, useState, useCallback } from 'react';
import { sanitizeResultData, sanitizeString, sanitizeToolName } from '../utils/resultSanitizer';

const ToolResultContext = createContext(null);

export const useToolResult = () => {
  const ctx = useContext(ToolResultContext);
  if (!ctx) throw new Error('useToolResult must be used within ToolResultProvider');
  return ctx;
};

export const ToolResultProvider = ({ children }) => {
  const [lastResult, setLastResultState] = useState(null);

  const setLastResult = useCallback((result) => {
    if (!result) {
      setLastResultState(null);
      return;
    }

    try {
      const hasExplicitData = Object.prototype.hasOwnProperty.call(result, 'data');
      const data = sanitizeResultData(hasExplicitData ? result.data : result);
      const toolName = sanitizeToolName(result.toolName || result.tool || result.name || result.module || 'Tool') || 'Tool';
      const query = sanitizeString(result.query || result.target || result.input || result.value || '');

      setLastResultState({
        data,
        toolName,
        query: typeof query === 'string' ? query : String(query || ''),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[ToolResult] sanitization failed, storing raw result:', err.message);
      setLastResultState({
        data: result.data || result,
        toolName: result.toolName || result.tool || 'Tool',
        query: String(result.query || result.target || ''),
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  const clearResult = useCallback(() => setLastResultState(null), []);

  return (
    <ToolResultContext.Provider value={{ lastResult, setLastResult, clearResult }}>
      {children}
    </ToolResultContext.Provider>
  );
};

export default ToolResultContext;
