'use client';

import React, { createContext, useContext, ReactNode } from 'react';

// Simple Toast context
interface ToastContextType {
  addToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export interface SimpleToastProviderProps {
  children: ReactNode;
}

export const SimpleToastProvider: React.FC<SimpleToastProviderProps> = ({ children }) => {
  const addToast = (message: string) => {
    console.log('Toast:', message);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
    </ToastContext.Provider>
  );
};
