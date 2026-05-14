/* eslint-disable react-refresh/only-export-components */
// TOAST CONTEXT

import { createContext, useContext, useState } from 'react';
import { createPortal } from 'react-dom';

// CREATE THE TOAST CONTEXT
const ToastContext = createContext(null);

// CUSTOM HOOK TO USE THE TOAST CONTEXT
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// TOAST COMPONENT TO DISPLAY THE TOAST MESSAGE
function ToastComponent({ toast }) {
  if (!toast) return null;
  
  const colours = {
    success: "bg-green-600",
    error: "bg-red-600",
    warning: "bg-purple-600",
    info: "bg-blue-600",
  };
  
  return createPortal(
    <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${colours[toast.type] || "bg-gray-800"}`}>
      {toast.type === "success" && (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {toast.type === "error" && (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {toast.msg}
    </div>,
    document.body
  );
}

// MAIN PROVIDER COMPONENT TO WRAP THE APP AND PROVIDE THE TOAST CONTEXT
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastComponent toast={toast} />
    </ToastContext.Provider>
  );
}