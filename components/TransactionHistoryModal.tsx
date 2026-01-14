'use client';

import { X, Package, ArrowDownCircle, ArrowUpCircle, ArrowRight, Calendar, User, FileText } from 'lucide-react';
import { MaterialTransaction, Material } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
  transactions: MaterialTransaction[];
}

export default function TransactionHistoryModal({
  isOpen,
  onClose,
  material,
  transactions,
}: TransactionHistoryModalProps) {
  const { theme } = useTheme();

  if (!isOpen || !material) return null;

  // Theme-aware classes
  const bgMain = theme === 'dark' ? 'bg-slate-900' : 'bg-white';
  const bgCard = theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50';
  const borderColor = theme === 'dark' ? 'border-slate-700' : 'border-slate-200';
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';
  const textMuted = theme === 'dark' ? 'text-slate-500' : 'text-slate-500';
  const textTertiary = theme === 'dark' ? 'text-slate-300' : 'text-slate-700';

  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] animate-scale-in">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-amber-500/20 rounded-2xl blur-xl opacity-50" />
        
        <div className={`${bgMain} relative rounded-2xl shadow-2xl overflow-hidden border ${borderColor}`}>
          {/* Top gradient line */}
          <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <Package className="text-amber-400" size={24} />
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${textPrimary}`}>Transaction History</h2>
                    <p className={`text-sm ${textSecondary} mt-1`}>
                      {material.materialCode} • {material.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs">
                  <span className={`${textMuted}`}>
                    <span className="font-medium">{sortedTransactions.length}</span> {sortedTransactions.length === 1 ? 'transaction' : 'transactions'}
                  </span>
                  <span className={`${textMuted}`}>
                    Current Quantity: <span className={`font-semibold ${textPrimary}`}>{material.quantity} {material.unit}</span>
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-2 ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} rounded-lg transition-colors`}
              >
                <X size={20} className={textSecondary} />
              </button>
            </div>

            {/* Transactions List */}
            <div className={`${bgCard} rounded-lg border ${borderColor} max-h-[60vh] overflow-y-auto custom-scrollbar`}>
              {sortedTransactions.length === 0 ? (
                <div className="p-12 text-center">
                  <div className={`p-4 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-100'} rounded-full inline-block mb-4`}>
                    <Package className={textSecondary} size={32} />
                  </div>
                  <p className={`${textTertiary} font-medium mb-1`}>No transactions found</p>
                  <p className={`${textMuted} text-sm`}>This material has no transaction history yet</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {sortedTransactions.map((transaction, idx) => {
                    const isReceiving = transaction.transactionType === 'receiving';
                    const transactionDate = new Date(transaction.date);
                    
                    return (
                      <div
                        key={transaction.id}
                        className={`group relative flex items-start gap-4 p-4 rounded-lg border transition-all duration-200 ${
                          isReceiving
                            ? theme === 'dark'
                              ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15 hover:border-emerald-500/30'
                              : 'bg-emerald-50/50 border-emerald-200/50 hover:bg-emerald-50 hover:border-emerald-300'
                            : theme === 'dark'
                              ? 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15 hover:border-blue-500/30'
                              : 'bg-blue-50/50 border-blue-200/50 hover:bg-blue-50 hover:border-blue-300'
                        }`}
                      >
                        {/* Icon */}
                        <div className={`flex-shrink-0 p-2.5 rounded-full ${
                          isReceiving
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {isReceiving ? (
                            <ArrowDownCircle size={20} />
                          ) : (
                            <ArrowUpCircle size={20} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex-1 min-w-0">
                              {/* Date and Arrow */}
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <Calendar size={14} className={textMuted} />
                                  <span className={`text-sm font-medium ${textPrimary}`}>
                                    {transactionDate.toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })}
                                  </span>
                                  <span className={`text-xs ${textMuted}`}>
                                    {transactionDate.toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                <ArrowRight size={12} className={textMuted} />
                                <span className={`text-base font-bold ${
                                  isReceiving ? 'text-emerald-500' : 'text-blue-500'
                                }`}>
                                  {isReceiving ? '+' : '–'}{transaction.quantity} {transaction.unit}
                                </span>
                              </div>

                              {/* Transaction Type Badge and Details */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                                  isReceiving
                                    ? theme === 'dark'
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : 'bg-emerald-100 text-emerald-700'
                                    : theme === 'dark'
                                      ? 'bg-blue-500/20 text-blue-400'
                                      : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {isReceiving ? 'Received' : 'Issued'}
                                </span>
                                
                                {transaction.user && (
                                  <div className="flex items-center gap-1.5">
                                    <User size={12} className={textMuted} />
                                    <span className={`text-xs ${textMuted}`}>{transaction.user}</span>
                                  </div>
                                )}
                                
                                {transaction.reference && (
                                  <div className="flex items-center gap-1.5">
                                    <FileText size={12} className={textMuted} />
                                    <span className={`text-xs ${textMuted}`}>Ref: {transaction.reference}</span>
                                  </div>
                                )}
                              </div>

                              {/* Notes */}
                              {transaction.notes && (
                                <div className={`mt-2 p-2 rounded ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-white/50'} border ${borderColor}`}>
                                  <p className={`text-xs ${textSecondary} leading-relaxed`}>
                                    <span className="font-medium">Note:</span> {transaction.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 flex items-center justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold rounded-lg transition-all shadow-lg shadow-amber-500/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
