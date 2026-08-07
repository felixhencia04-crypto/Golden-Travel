import React from 'react';
import { ShieldAlert, AlertTriangle, ShieldCheck, X, Trash2, HelpCircle } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText = 'Batal',
  type = 'danger',
  isLoading = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const defaultConfirmText = 
    confirmText || 
    (type === 'danger' ? 'Ya, Hapus' : type === 'warning' ? 'Ya, Lanjutkan' : 'Konfirmasi');

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-[2.5rem] p-8 sm:p-10 max-w-md w-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.25)] relative animate-in zoom-in-95 duration-200 border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Blur */}
        <div className={`absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 rounded-full blur-3xl pointer-events-none ${
          type === 'danger' ? 'bg-rose-500/10' : type === 'warning' ? 'bg-amber-500/10' : 'bg-emerald-500/10'
        }`}></div>

        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon Header */}
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-sm ${
          type === 'danger' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
          type === 'warning' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
          type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
          'bg-blue-50 text-blue-600 border border-blue-100'
        }`}>
          {type === 'danger' ? <Trash2 className="w-9 h-9 stroke-[2.2]" /> : 
           type === 'warning' ? <AlertTriangle className="w-9 h-9 stroke-[2.2]" /> : 
           type === 'success' ? <ShieldCheck className="w-9 h-9 stroke-[2.2]" /> :
           <HelpCircle className="w-9 h-9 stroke-[2.2]" />}
        </div>

        {/* Title & Description */}
        <div className="text-center space-y-2 mb-8">
          <h3 className="text-xl sm:text-2xl font-playfair font-bold text-slate-900 tracking-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed px-2">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="py-3.5 px-5 bg-slate-100 text-slate-700 rounded-2xl font-bold text-xs hover:bg-slate-200 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`py-3.5 px-5 text-white rounded-2xl font-bold text-xs transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
              type === 'danger' ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 shadow-rose-600/20' :
              type === 'warning' ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/20' :
              'bg-gradient-to-r from-emerald-800 to-teal-900 hover:from-emerald-900 hover:to-teal-950 shadow-emerald-900/20'
            }`}
          >
            <span>{isLoading ? 'Memproses...' : defaultConfirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
