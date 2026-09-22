/**
 * Keyboard Shortcuts Utility
 * Global keyboard shortcuts for accessibility
 */
import { useEffect } from 'react';

const shortcuts = new Map();
let isInitialized = false;

/**
 * Register keyboard shortcut
 */
export const registerShortcut = (keys, handler, description = '') => {
  const normalizedKeys = normalizeKeys(keys);
  shortcuts.set(normalizedKeys, { handler, description, keys });
};

/**
 * Unregister keyboard shortcut
 */
export const unregisterShortcut = (keys) => {
  const normalizedKeys = normalizeKeys(keys);
  shortcuts.delete(normalizedKeys);
};

/**
 * Normalize key combination
 */
const normalizeKeys = (keys) => {
  return keys
    .toLowerCase()
    .split('+')
    .map(k => k.trim())
    .sort()
    .join('+');
};

/**
 * Get current pressed keys
 */
const getPressedKeys = (event) => {
  const keys = [];
  
  if (event.ctrlKey || event.metaKey) keys.push('ctrl');
  if (event.shiftKey) keys.push('shift');
  if (event.altKey) keys.push('alt');
  
  const key = event.key.toLowerCase();
  if (key !== 'control' && key !== 'shift' && key !== 'alt' && key !== 'meta') {
    keys.push(key);
  }
  
  return keys.sort().join('+');
};

/**
 * Handle keydown event
 */
const handleKeyDown = (event) => {
  // Ignore if typing in input/textarea
  const target = event.target;
  if (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  ) {
    return;
  }

  const pressedKeys = getPressedKeys(event);
  const shortcut = shortcuts.get(pressedKeys);
  
  if (shortcut) {
    event.preventDefault();
    shortcut.handler(event);
  }
};

/**
 * Initialize keyboard shortcuts
 */
export const initKeyboardShortcuts = () => {
  if (isInitialized || typeof window === 'undefined') return;

  window.addEventListener('keydown', handleKeyDown);
  isInitialized = true;

  // Register default shortcuts
  registerDefaultShortcuts();
  
  console.log('[KeyboardShortcuts] Initialized');
};

/**
 * Cleanup keyboard shortcuts
 */
export const cleanupKeyboardShortcuts = () => {
  if (typeof window === 'undefined') return;
  
  window.removeEventListener('keydown', handleKeyDown);
  shortcuts.clear();
  isInitialized = false;
};

/**
 * Register default shortcuts
 */
const registerDefaultShortcuts = () => {
  // Search (Ctrl+K)
  registerShortcut('ctrl+k', () => {
    const searchInput = document.querySelector('[data-search-input]');
    if (searchInput) {
      searchInput.focus();
    }
  }, 'Open search');

  // Help (Ctrl+/)
  registerShortcut('ctrl+/', () => {
    window.dispatchEvent(new CustomEvent('show-shortcuts-help'));
  }, 'Show keyboard shortcuts');

  // Escape (Close modals)
  registerShortcut('escape', () => {
    window.dispatchEvent(new CustomEvent('close-modal'));
  }, 'Close modal');

  // Navigation
  registerShortcut('ctrl+h', () => {
    window.location.href = '/';
  }, 'Go to home');

  registerShortcut('ctrl+shift+h', () => {
    window.dispatchEvent(new CustomEvent('show-history'));
  }, 'Show history');

  registerShortcut('ctrl+b', () => {
    window.dispatchEvent(new CustomEvent('show-bookmarks'));
  }, 'Show bookmarks');
};

/**
 * Get all registered shortcuts
 */
export const getAllShortcuts = () => {
  return Array.from(shortcuts.entries()).map(([keys, data]) => ({
    keys: data.keys,
    description: data.description,
  }));
};

/**
 * Hook for keyboard shortcuts in React components
 */
export const useKeyboardShortcut = (keys, handler, deps = []) => {
  if (typeof window === 'undefined') return;

  useEffect(() => {
    registerShortcut(keys, handler);
    
    return () => {
      unregisterShortcut(keys);
    };
  }, deps);
};

// Auto-initialize
if (typeof window !== 'undefined') {
  initKeyboardShortcuts();
}

export default {
  registerShortcut,
  unregisterShortcut,
  initKeyboardShortcuts,
  cleanupKeyboardShortcuts,
  getAllShortcuts,
};
