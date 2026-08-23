import React, { useEffect } from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<{
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 2000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  let Icon = CheckCircle2;
  let iconColor = 'text-emerald-600 bg-emerald-50';
  let borderColor = 'border-emerald-200';

  if (toast.type === 'error') {
    Icon = XCircle;
    iconColor = 'text-rose-600 bg-rose-50';
    borderColor = 'border-rose-200';
  } else if (toast.type === 'warning') {
    Icon = AlertCircle;
    iconColor = 'text-amber-600 bg-amber-50';
    borderColor = 'border-amber-200';
  } else if (toast.type === 'info') {
    Icon = Info;
    iconColor = 'text-indigo-600 bg-indigo-50';
    borderColor = 'border-indigo-200';
  }

  return (
    <motion.div
      key={toast.id}
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className={`pointer-events-auto flex items-start gap-3 p-3.5 bg-white rounded-xl border ${borderColor} shadow-lg shadow-slate-900/10`}
    >
      <div className={`p-1.5 rounded-lg shrink-0 ${iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-xs font-bold text-slate-900 leading-snug">{toast.title}</p>
        {toast.description && (
          <p className="text-[11px] text-slate-500 mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-xs sm:max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export const Toast: React.FC<{
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}> = ({ id, message, type = 'success', onClose }) => {
  return (
    <ToastContainer
      toasts={[{ id, title: message, type }]}
      onDismiss={() => onClose()}
    />
  );
};
