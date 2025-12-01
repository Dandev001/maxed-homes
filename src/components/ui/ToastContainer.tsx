import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext';
import Toast from './Toast';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-md w-full sm:w-auto">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;

