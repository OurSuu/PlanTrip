// src/contexts/ToastContext.tsx

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 1. กำหนดประเภท
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
}

interface ToastContextType {
  showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// 2. สร้าง Hook สำหรับใช้งาน
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// 3. Component Toast
const ToastNotification: React.FC<{ toast: Toast }> = ({ toast }) => {
  const baseClass = "fixed right-4 bottom-4 z-[200] p-4 rounded-xl shadow-2xl backdrop-blur-md transition-all";
  let colorClass = "";
  let icon = "";

  switch (toast.type) {
    case 'success':
      colorClass = "bg-green-600/80 ring-2 ring-green-400/50";
      icon = "✅";
      break;
    case 'error':
      colorClass = "bg-red-600/80 ring-2 ring-red-400/50";
      icon = "🚨";
      break;
    case 'warning':
      colorClass = "bg-yellow-600/80 ring-2 ring-yellow-400/50";
      icon = "⚠️";
      break;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      className={`${baseClass} ${colorClass} flex items-center gap-3 text-white font-semibold min-w-[280px]`}
    >
      <span className="text-xl">{icon}</span>
      {toast.message}
    </motion.div>
  );
};

// 4. Component Provider หลัก
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let nextId = 0;

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const id = nextId++;
    const newToast = { id, message, type };
    
    // จำกัดจำนวน Toast พร้อมกันไม่ให้เกิน 3
    setToasts(currentToasts => {
      if (currentToasts.length >= 3) {
        return [...currentToasts.slice(1), newToast];
      }
      return [...currentToasts, newToast];
    });

    // ซ่อน Toast หลังจาก 4 วินาที
    setTimeout(() => {
      setToasts(currentToasts => currentToasts.filter(t => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-0 right-0 p-4 space-y-2 flex flex-col items-end pointer-events-none z-[200]">
        <AnimatePresence>
          {/* แสดง Toast ที่ตำแหน่งต่างกันตามลำดับ */}
          {toasts.map((toast, index) => (
             <ToastNotification 
                key={toast.id} 
                toast={toast} 
                style={{ bottom: `${4 + index * 5}rem` }} // จัดตำแหน่งตาม index
             />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};