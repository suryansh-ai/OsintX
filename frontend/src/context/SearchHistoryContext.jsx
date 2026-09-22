/**
 * Search History Context
 * Manages search history per tool with persistence
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SearchHistoryContext = createContext(null);

const STORAGE_KEY = 'osintx_searchHistory';
const MAX_HISTORY_PER_TOOL = 50;

export const useSearchHistory = () => {
  const context = useContext(SearchHistoryContext);
  if (!context) {
    throw new Error('useSearchHistory must be used within SearchHistoryProvider');
  }
  return context;
};

export const SearchHistoryProvider = ({ children }) => {
  const [history, setHistory] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load history from storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.error('[SearchHistory] Failed to load:', error);
    }
    setIsLoaded(true);
  }, []);

  // Persist history when changed
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      } catch (error) {
        console.error('[SearchHistory] Failed to save:', error);
      }
    }
  }, [history, isLoaded]);

  // Add search to history
  const addSearch = useCallback((toolId, query, results = null) => {
    if (!query?.trim()) return;

    const searchEntry = {
      id: `search-${Date.now()}`,
      query: query.trim(),
      timestamp: new Date().toISOString(),
      hasResults: !!results,
      resultsSummary: results ? summarizeResults(results) : null,
    };

    setHistory(prev => {
      const toolHistory = prev[toolId] || [];
      
      // Check for duplicate recent searches (within last 5 minutes)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const isDuplicate = toolHistory.some(
        h => h.query.toLowerCase() === query.toLowerCase() && 
             new Date(h.timestamp).getTime() > fiveMinutesAgo
      );

      if (isDuplicate) return prev;

      const updated = [searchEntry, ...toolHistory].slice(0, MAX_HISTORY_PER_TOOL);
      return { ...prev, [toolId]: updated };
    });
  }, []);

  // Get history for a specific tool
  const getToolHistory = useCallback((toolId) => {
    return history[toolId] || [];
  }, [history]);

  // Get recent searches across all tools
  const getRecentSearches = useCallback((limit = 20) => {
    const allSearches = Object.entries(history).flatMap(([toolId, searches]) =>
      searches.map(s => ({ ...s, toolId }))
    );
    
    return allSearches
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }, [history]);

  // Clear history for a specific tool
  const clearToolHistory = useCallback((toolId) => {
    setHistory(prev => {
      const updated = { ...prev };
      delete updated[toolId];
      return updated;
    });
  }, []);

  // Clear all history
  const clearAllHistory = useCallback(() => {
    setHistory({});
  }, []);

  // Remove specific search entry
  const removeSearch = useCallback((toolId, searchId) => {
    setHistory(prev => {
      const toolHistory = prev[toolId] || [];
      const updated = toolHistory.filter(s => s.id !== searchId);
      return { ...prev, [toolId]: updated };
    });
  }, []);

  // Get search statistics
  const getStats = useCallback(() => {
    const totalSearches = Object.values(history).reduce((sum, arr) => sum + arr.length, 0);
    const toolsUsed = Object.keys(history).length;
    const mostUsedTool = Object.entries(history)
      .sort((a, b) => b[1].length - a[1].length)[0];

    return {
      totalSearches,
      toolsUsed,
      mostUsedTool: mostUsedTool ? { toolId: mostUsedTool[0], count: mostUsedTool[1].length } : null,
    };
  }, [history]);

  const value = {
    history,
    addSearch,
    getToolHistory,
    getRecentSearches,
    clearToolHistory,
    clearAllHistory,
    removeSearch,
    getStats,
  };

  return (
    <SearchHistoryContext.Provider value={value}>
      {children}
    </SearchHistoryContext.Provider>
  );
};

// Helper to summarize results for display
const summarizeResults = (results) => {
  if (!results) return null;
  
  if (typeof results === 'object') {
    const keys = Object.keys(results);
    return `${keys.length} data points`;
  }
  
  if (Array.isArray(results)) {
    return `${results.length} results`;
  }
  
  return 'Data retrieved';
};

export default SearchHistoryContext;
