/**
 * Loading Spinner Component
 * Reusable loading indicators
 */

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={`${sizes[size]} ${className}`}
    >
      <Loader2 className="w-full h-full text-cyan-400" />
    </motion.div>
  );
};

export const LoadingOverlay = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-cyan-500/30 rounded-lg p-6 flex flex-col items-center gap-4">
        <Spinner size="xl" />
        <p className="text-cyan-400 font-mono text-sm">{message}</p>
      </div>
    </div>
  );
};

export const InlineLoader = ({ message = 'Loading...' }) => {
  return (
    <div className="flex items-center gap-3 p-4">
      <Spinner size="md" />
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
};

export const SkeletonLoader = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className="h-4 bg-gray-800 rounded animate-pulse"
          style={{ width: `${100 - i * 10}%` }}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
      <div className="h-6 bg-gray-800 rounded w-2/3 animate-pulse" />
      <div className="h-4 bg-gray-800 rounded w-full animate-pulse" />
      <div className="h-4 bg-gray-800 rounded w-4/5 animate-pulse" />
    </div>
  );
};

export default Spinner;
