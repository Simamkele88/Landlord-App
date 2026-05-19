/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((message, duration) => addToast(message, "success", duration), [addToast]);
  const error = useCallback((message, duration) => addToast(message, "error", duration), [addToast]);
  const warning = useCallback((message, duration) => addToast(message, "warning", duration), [addToast]);
  const info = useCallback((message, duration) => addToast(message, "info", duration), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }) {
  const config = {
    success: {
      bg: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800",
      text: "text-green-800 dark:text-green-200",
      icon: CheckCircle,
      iconColor: "text-green-500",
    },
    error: {
      bg: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800",
      text: "text-red-800 dark:text-red-200",
      icon: XCircle,
      iconColor: "text-red-500",
    },
    warning: {
      bg: "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800",
      text: "text-yellow-800 dark:text-yellow-200",
      icon: AlertTriangle,
      iconColor: "text-yellow-500",
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
      text: "text-blue-800 dark:text-blue-200",
      icon: Info,
      iconColor: "text-blue-500",
    },
  };

  const cfg = config[toast.type] || config.info;
  const Icon = cfg.icon;

  return (
    <div className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg animate-slide-in ${cfg.bg}`}>
      <Icon size={20} className={`flex-shrink-0 mt-0.5 ${cfg.iconColor}`} />
      <p className={`flex-1 text-sm font-medium ${cfg.text}`}>{toast.message}</p>
      <button onClick={onClose} className={`flex-shrink-0 ${cfg.text} hover:opacity-70`}>
        <X size={16} />
      </button>
    </div>
  );
}