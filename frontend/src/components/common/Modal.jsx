import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      <div className={`relative w-full max-w-lg bg-slate-900 border border-slate-800/80 rounded-3xl shadow-2xl p-6 z-10 overflow-hidden ${className}`}>
        <div className="flex items-center justify-between mb-4 border-b border-slate-800/60 pb-3">
          <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 p-1.5 rounded-xl transition duration-150 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
