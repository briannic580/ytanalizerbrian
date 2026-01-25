import React from 'react';
import { ToastType } from '../types';
import { IconCheck, IconX, IconLoader } from '../constants/icons';

interface ToastProps {
  message: string;
  type: ToastType;
}

const Toast: React.FC<ToastProps> = ({ message, type }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <IconCheck className="w-4 h-4 text-emerald-400" />;
      case 'error':
        return <IconX className="w-4 h-4 text-red-400" />;
      case 'loading':
        return <IconLoader className="w-4 h-4 text-primary" />;
      default:
        return null;
    }
  };

  const getBgClass = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-950/90 border-emerald-800';
      case 'error':
        return 'bg-red-950/90 border-red-800';
      case 'loading':
        return 'bg-card/95 border-border';
      default:
        return 'bg-card/95 border-border';
    }
  };

  return (
    <div className={`fixed bottom-6 left-6 z-[300] px-4 py-3 rounded-2xl shadow-premium-lg flex items-center gap-3 min-w-[200px] max-w-md animate-slide-in-up border backdrop-blur-xl ${getBgClass()}`}>
      {getIcon()}
      <span className="text-sm font-medium text-foreground">{message}</span>
    </div>
  );
};

export default Toast;
