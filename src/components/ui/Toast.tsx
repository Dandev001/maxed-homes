import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Toast as ToastType } from '../../contexts/ToastContext';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-md ${getStyles()}`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium break-words">{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default Toast;

