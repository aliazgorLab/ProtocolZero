import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
        {toasts.map((toast) => {
          let bgClass = "bg-surface-container-highest text-on-surface border-outline-variant";
          let icon = "info";
          let iconColor = "text-primary";

          if (toast.type === 'success') {
            bgClass = "bg-emerald-950/90 text-emerald-100 border-emerald-500/30";
            icon = "check_circle";
            iconColor = "text-emerald-400";
          } else if (toast.type === 'error') {
            bgClass = "bg-rose-950/90 text-rose-100 border-rose-500/30";
            icon = "error";
            iconColor = "text-rose-400";
          } else if (toast.type === 'warning') {
            bgClass = "bg-amber-950/90 text-amber-100 border-amber-500/30";
            icon = "warning";
            iconColor = "text-amber-400";
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 p-3.5 rounded-xl shadow-2xl backdrop-blur-md border animate-in fade-in slide-in-from-bottom-4 transition-all ${bgClass}`}
            >
              <span className={`material-symbols-outlined text-[22px] shrink-0 ${iconColor}`}>
                {icon}
              </span>
              <p className="text-xs font-semibold leading-relaxed flex-1">
                {toast.message}
              </p>
              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-60 hover:opacity-100 transition-opacity shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
