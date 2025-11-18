'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastComponent({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setIsVisible(true);

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(toast.id), 300); // Wait for fade-out animation
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const icons = {
    success: CheckCircleIcon,
    error: ExclamationCircleIcon,
    warning: ExclamationCircleIcon,
    info: InformationCircleIcon,
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconColors = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400',
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={`
        ${colors[toast.type]}
        border rounded-lg shadow-lg p-4 mb-3 flex items-start space-x-3
        transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
        min-w-[300px] max-w-md
      `}
    >
      <Icon className={`h-5 w-5 ${iconColors[toast.type]} flex-shrink-0 mt-0.5`} />
      <div className="flex-1">
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose(toast.id), 300);
        }}
        className={`${iconColors[toast.type]} hover:opacity-70 flex-shrink-0`}
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Listen for toast events
    const handleToast = (event: CustomEvent<Omit<Toast, 'id'>>) => {
      const newToast: Toast = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        ...event.detail,
      };
      setToasts((prev) => [...prev, newToast]);
    };

    window.addEventListener('show-toast' as any, handleToast as EventListener);
    return () => {
      window.removeEventListener('show-toast' as any, handleToast as EventListener);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
}

// Helper function to show toast
export function showToast(message: string, type: ToastType = 'info', duration?: number) {
  const event = new CustomEvent('show-toast', {
    detail: { message, type, duration },
  });
  window.dispatchEvent(event);
}

