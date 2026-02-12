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
          bg: 'bg-green-50 border-green-200',
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          text: 'text-green-800',
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: <AlertCircle className="w-5 h-5 text-red-600" />,
          text: 'text-red-800',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-200',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
          text: 'text-amber-800',
        };
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: <Info className="w-5 h-5 text-blue-600" />,
          text: 'text-blue-800',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      className={`
        ${styles.bg} ${styles.text} border rounded-lg shadow-lg p-4 mb-3
        min-w-[320px] max-w-md
        flex items-start space-x-3
        animate-slide-in-right
      `}
    >
      <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity duration-150"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
