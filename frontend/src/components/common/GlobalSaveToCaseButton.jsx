/**
 * GlobalSaveToCaseButton
 *
 * Floats in the bottom-right corner whenever any tool has produced a result
 * (via ToolResultContext). Clicking it opens SaveToCaseModal.
 *
 * Rendered once at the app root — no per-tool changes needed.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderPlus, X } from 'lucide-react';
import { useToolResult } from '../../context/ToolResultContext';
import SaveToCaseModal from './SaveToCaseModal';

const GlobalSaveToCaseButton = () => {
  const { lastResult, clearResult } = useToolResult();
  const [modalOpen, setModalOpen] = useState(false);

  if (!lastResult) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          key="global-save-btn"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-[90] flex items-center gap-2"
        >
          {/* Dismiss */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={clearResult}
            className="p-2 rounded-full bg-gray-800/90 border border-gray-700 text-gray-400 hover:text-white shadow-lg backdrop-blur-sm"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </motion.button>

          {/* Save button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-semibold text-sm shadow-xl shadow-violet-500/20 backdrop-blur-sm border border-white/10"
          >
            <FolderPlus className="w-4 h-4" />
            Save to Case
          </motion.button>
        </motion.div>
      </AnimatePresence>

      <SaveToCaseModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          clearResult();
        }}
        data={lastResult?.data}
        toolName={lastResult?.toolName}
        query={lastResult?.query}
      />
    </>
  );
};

export default GlobalSaveToCaseButton;
