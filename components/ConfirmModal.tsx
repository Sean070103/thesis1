'use client';

import { AlertTriangle, Trash2, CheckCircle, X, Loader2, Info, AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'success' | 'info';
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: Trash2,
          iconBg: 'bg-red-500/10',
          iconBorder: 'border-red-500/20',
          iconColor: 'text-red-400',
          buttonBg: 'from-red-600 to-red-500 hover:from-red-500 hover:to-red-400',
          glowColor: 'bg-red-500/20',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-amber-500/10',
          iconBorder: 'border-amber-500/20',
          iconColor: 'text-amber-400',
          buttonBg: 'from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400',
          glowColor: 'bg-amber-500/20',
        };
      case 'success':
        return {
          icon: CheckCircle,
          iconBg: 'bg-emerald-500/10',
          iconBorder: 'border-emerald-500/20',
          iconColor: 'text-emerald-400',
          buttonBg: 'from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400',
          glowColor: 'bg-emerald-500/20',
        };
      case 'info':
      default:
        return {
          icon: Info,
          iconBg: 'bg-blue-500/10',
          iconBorder: 'border-blue-500/20',
          iconColor: 'text-blue-400',
          buttonBg: 'from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400',
          glowColor: 'bg-blue-500/20',
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md animate-scale-in">
        {/* Glow effect */}
        <div className={`absolute -inset-1 ${config.glowColor} rounded-2xl blur-xl opacity-50`} />
        
        <div className="premium-card relative overflow-hidden">
          {/* Top gradient line */}
          <div className={`h-1 bg-gradient-to-r ${config.buttonBg}`} />
          
          <div className="p-6">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-slate-800/50 rounded-lg transition-colors"
            >
              <X size={18} className="text-slate-400" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className={`p-4 rounded-2xl ${config.iconBg} border ${config.iconBorder}`}>
                <Icon className={config.iconColor} size={32} />
              </div>
            </div>

            {/* Content */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{message}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white rounded-xl font-semibold text-sm border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 relative px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 overflow-hidden disabled:opacity-50`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${config.buttonBg} transition-all duration-300`} />
                <span className="relative flex items-center justify-center gap-2 text-white">
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Processing...
                    </>
                  ) : (
                    confirmText
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
