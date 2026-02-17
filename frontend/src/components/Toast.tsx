/**
 * Toast Notification Component
 * Success, error, warning, and info notifications with auto-dismiss
 */

import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export default function ToastComponent({ toast, onClose }: ToastProps) {
  const { id, type, message, duration = 4000 } = toast;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-[#0E1018] border-emerald-500/20',
          icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
          text: 'text-emerald-300',
          accent: 'bg-emerald-500',
        };
      case 'error':
        return {
          bg: 'bg-[#0E1018] border-red-500/20',
          icon: <AlertCircle className="w-5 h-5 text-red-400" />,
          text: 'text-red-300',
          accent: 'bg-red-500',
        };
      case 'warning':
        return {
          bg: 'bg-[#0E1018] border-amber-500/20',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
          text: 'text-amber-300',
          accent: 'bg-amber-500',
        };
      case 'info':
        return {
          bg: 'bg-[#0E1018] border-indigo-500/20',
          icon: <Info className="w-5 h-5 text-indigo-400" />,
          text: 'text-indigo-300',
          accent: 'bg-indigo-500',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      className={`
        ${styles.bg} border rounded-xl shadow-2xl shadow-black/40 p-4 mb-3
        min-w-[320px] max-w-md
        flex items-start gap-3
        animate-slide-in-right
        relative overflow-hidden
      `}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${styles.accent} rounded-l-xl`} />

      <div className="flex-shrink-0 mt-0.5 ml-1">{styles.icon}</div>
      <p className={`flex-1 font-sans text-sm font-medium ${styles.text}`}>{message}</p>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 text-[#55576A] hover:text-[#F0F0F5] transition-colors p-0.5 rounded hover:bg-white/[0.04]"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
