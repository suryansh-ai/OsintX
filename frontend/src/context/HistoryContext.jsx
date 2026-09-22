/**
 * Result History Context
 * Store and manage search history and bookmarks
 */

import { createContext, useContext, useState, useEffect } from 'react';

const HistoryContext = createContext();

const MAX_HISTORY_ITEMS = 50;
const STORAGE_KEY_HISTORY = 'osintx_history';
const STORAGE_KEY_BOOKMARKS = 'osintx_bookmarks';

export const HistoryProvider = ({ children }) => {
  const [history, setHistory] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
      const savedBookmarks = localStorage.getItem(STORAGE_KEY_BOOKMARKS);

      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks));
      }
    } catch (error) {
      console.error('[History] Failed to load:', error);
    }
  }, []);

  // Save to localStorage whenever history changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('[History] Failed to save history:', error);
    }
  }, [history]);

  // Save to localStorage whenever bookmarks change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(bookmarks));
    } catch (error) {
      console.error('[History] Failed to save bookmarks:', error);
    }
  }, [bookmarks]);

  /**
   * Add item to history
   */
  const addToHistory = (item) => {
    const historyItem = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...item,
    };

    setHistory((prev) => {
      // Remove duplicates (same tool + query)
      const filtered = prev.filter(
        (h) => !(h.tool === item.tool && h.query === item.query)
      );
      
      // Add to beginning and limit size
      return [historyItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    });

    return historyItem.id;
  };

  /**
   * Remove item from history
   */
  const removeFromHistory = (id) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  /**
   * Clear all history
   */
  const clearHistory = () => {
    setHistory([]);
  };

  /**
   * Get history for specific tool
   */
  const getToolHistory = (toolName) => {
    return history.filter((item) => item.tool === toolName);
  };

  /**
   * Search history
   */
  const searchHistory = (query) => {
    const lowerQuery = query.toLowerCase();
    return history.filter(
      (item) =>
        item.query?.toLowerCase().includes(lowerQuery) ||
        item.tool?.toLowerCase().includes(lowerQuery) ||
        item.result?.toString().toLowerCase().includes(lowerQuery)
    );
  };

  /**
   * Add bookmark
   */
  const addBookmark = (item) => {
    const bookmark = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...item,
    };

    setBookmarks((prev) => {
      // Check if already bookmarked
      const exists = prev.find(
        (b) => b.tool === item.tool && b.query === item.query
      );
      
      if (exists) {
        return prev;
      }

      return [bookmark, ...prev];
    });

    return bookmark.id;
  };

  /**
   * Remove bookmark
   */
  const removeBookmark = (id) => {
    setBookmarks((prev) => prev.filter((item) => item.id !== id));
  };

  /**
   * Check if item is bookmarked
   */
  const isBookmarked = (tool, query) => {
    return bookmarks.some((b) => b.tool === tool && b.query === query);
  };

  /**
   * Toggle bookmark
   */
  const toggleBookmark = (item) => {
    const existing = bookmarks.find(
      (b) => b.tool === item.tool && b.query === item.query
    );

    if (existing) {
      removeBookmark(existing.id);
      return false;
    } else {
      addBookmark(item);
      return true;
    }
  };

  /**
   * Clear all bookmarks
   */
  const clearBookmarks = () => {
    setBookmarks([]);
  };

  /**
   * Get bookmarks for specific tool
   */
  const getToolBookmarks = (toolName) => {
    return bookmarks.filter((item) => item.tool === toolName);
  };

  /**
   * Export history as JSON
   */
  const exportHistory = () => {
    return JSON.stringify({ history, bookmarks }, null, 2);
  };

  /**
   * Import history from JSON
   */
  const importHistory = (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.history) setHistory(data.history);
      if (data.bookmarks) setBookmarks(data.bookmarks);
      return true;
    } catch (error) {
      console.error('[History] Failed to import:', error);
      return false;
    }
  };

  const value = {
    // History
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getToolHistory,
    searchHistory,

    // Bookmarks
    bookmarks,
    addBookmark,
    removeBookmark,
    isBookmarked,
    toggleBookmark,
    clearBookmarks,
    getToolBookmarks,

    // Import/Export
    exportHistory,
    importHistory,
  };

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within HistoryProvider');
  }
  return context;
};

export default HistoryContext;
