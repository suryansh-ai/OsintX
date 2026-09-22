import { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';
import InvestigationTerminal from '../terminal/InvestigationTerminal';

const TerminalBubble = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* ─── Floating Terminal Button ─── */}
      <motion.div
        className="fixed bottom-42 right-6 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.7, type: 'spring', stiffness: 200, damping: 15 }}
        style={{ bottom: '10.5rem' }}
      >
        <motion.button
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 
            shadow-lg shadow-emerald-500/30 flex items-center justify-center group
            hover:shadow-emerald-500/50 transition-shadow duration-300"
        >
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" style={{ animationDuration: '3s' }} />
          
          {/* Icon */}
          <Terminal className="w-6 h-6 text-white relative z-10" />

          {/* Tooltip */}
          <span className="absolute right-full mr-3 px-2 py-1 rounded bg-gray-900 text-cyan-300 text-xs font-mono
            whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
            border border-cyan-500/30 shadow-lg">
            AI Investigation Terminal
          </span>

          {/* Glow dot */}
          <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-[#0a1520]" />
        </motion.button>
      </motion.div>

      {/* ─── Terminal (supports fullscreen / windowed / minimized) ─── */}
      <InvestigationTerminal isOpen={isOpen} onClose={() => setIsOpen(false)} userId={userId} />
    </>
  );
};

export default TerminalBubble;
