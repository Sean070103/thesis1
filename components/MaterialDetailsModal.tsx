'use client';

import { X, Package, MapPin, Box, Hash, Tag, AlertTriangle, Calendar, FileText, ArrowDownCircle, ArrowUpCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { Material, MaterialTransaction } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';

interface MaterialDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
  transactions?: MaterialTransaction[];
  onEdit?: () => void;
}

export default function MaterialDetailsModal({
  isOpen,
  onClose,
  material,
  transactions = [],
  onEdit,
}: MaterialDetailsModalProps) {
  const { theme } = useTheme();

  if (!isOpen || !material) return null;

  // Theme-aware classes
  const bgMain = theme === 'dark' ? 'bg-slate-900' : 'bg-white';
  const bgCard = theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50';
  const borderColor = theme === 'dark' ? 'border-slate-700' : 'border-slate-200';
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';
  const textMuted = theme === 'dark' ? 'text-slate-500' : 'text-slate-500';

  // Alert status
  const LOW_STOCK_THRESHOLD = 10;
  const hasLowStock = material.quantity <= LOW_STOCK_THRESHOLD && material.quantity > 0;
  const hasReorderAlert = material.reorderThreshold !== undefined && 
                          material.quantity <= material.reorderThreshold && 
                          material.quantity > 0;
  const isCritical = material.quantity <= 5 && material.quantity > 0;
  const isOutOfStock = material.quantity === 0;

  const getQuantityColor = () => {
    if (isOutOfStock) return 'text-red-400';
    if (isCritical) return 'text-orange-400';
    if (hasLowStock || hasReorderAlert) return 'text-amber-400';
    return textPrimary;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] animate-scale-in">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-amber-500/20 rounded-2xl blur-xl opacity-50" />
        
        <div className={`${bgMain} relative rounded-2xl shadow-2xl overflow-hidden border ${borderColor}`}>
          {/* Top gradient line */}
          <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          
          <div className="p-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <Package className="text-amber-400" size={24} />
                  </div>
                  <div className="flex-1">
                    <h2 className={`text-xl font-bold ${textPrimary}`}>Material Details</h2>
                    <p className={`text-sm ${textSecondary} mt-1`}>{material.materialCode}</p>
                  </div>
                  {(hasLowStock || hasReorderAlert || isCritical || isOutOfStock) && (
                    <AlertTriangle 
                      size={20} 
                      className={isOutOfStock ? 'text-red-400' : isCritical ? 'text-orange-400' : 'text-amber-400'} 
                    />
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-2 ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} rounded-lg transition-colors`}
              >
                <X size={20} className={textSecondary} />
              </button>
            </div>

            {/* Details Grid */}
            <div className={`${bgCard} rounded-lg border ${borderColor} p-5 space-y-4`}>
              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText size={16} className={textMuted} />
                  <label className={`text-xs font-semibold uppercase tracking-wider ${textMuted}`}>Description</label>
                </div>
                <p className={`${textPrimary} text-sm leading-relaxed`}>{material.description || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Tag size={16} className={textMuted} />
                    <label className={`text-xs font-semibold uppercase tracking-wider ${textMuted}`}>Category</label>
                  </div>
                  <p className={`${textPrimary} font-medium`}>{material.category || 'N/A'}</p>
                </div>

                {/* Unit */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Box size={16} className={textMuted} />
                    <label className={`text-xs font-semibold uppercase tracking-wider ${textMuted}`}>Unit</label>
                  </div>
                  <p className={`${textPrimary} font-medium`}>{material.unit || 'N/A'}</p>
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Hash size={16} className={textMuted} />
                    <label className={`text-xs font-semibold uppercase tracking-wider ${textMuted}`}>Quantity</label>
                  </div>
                  <p className={`${getQuantityColor()} font-bold text-lg`}>
                    {material.quantity} {material.unit || ''}
                  </p>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className={textMuted} />
                    <label className={`text-xs font-semibold uppercase tracking-wider ${textMuted}`}>Location</label>
                  </div>
                  <p className={`${textPrimary} font-medium`}>{material.location || 'N/A'}</p>
                </div>

                {/* SAP Quantity */}
                {material.sapQuantity !== undefined && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Hash size={16} className={textMuted} />
                      <label className={`text-xs font-semibold uppercase tracking-wider ${textMuted}`}>SAP Quantity</label>
                    </div>
                    <p className={`${textPrimary} font-medium`}>{material.sapQuantity}</p>
                  </div>
                )}

                {/* Reorder Threshold */}
                {material.reorderThreshold !== undefined && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className={textMuted} />
                      <label className={`text-xs font-semibold uppercase tracking-wider ${textMuted}`}>Reorder Threshold</label>
                    </div>
                    <p className={`${textPrimary} font-medium`}>
                      {material.reorderThreshold} {material.unit || ''}
                      {hasReorderAlert && (
                        <span className="ml-2 text-xs text-amber-400">(Alert Active)</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Last Updated */}
                <div className="space-y-2 col-span-2">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className={textMuted} />
                    <label className={`text-xs font-semibold uppercase tracking-wider ${textMuted}`}>Last Updated</label>
                  </div>
                  <p className={`${textSecondary} text-sm`}>
                    {new Date(material.lastUpdated).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Transaction History Section */}
            {transactions.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${theme === 'dark' ? 'bg-amber-500/10' : 'bg-amber-50'} rounded-lg border ${theme === 'dark' ? 'border-amber-500/20' : 'border-amber-200'}`}>
                      <Clock className="text-amber-400" size={20} />
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${textPrimary}`}>Transaction History</h3>
                      <p className={`text-xs ${textSecondary}`}>
                        {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'} for this material
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`${bgCard} rounded-lg border ${borderColor} p-4 space-y-3 max-h-96 overflow-y-auto custom-scrollbar`}>
                  {transactions
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((transaction) => {
                      const isReceiving = transaction.transactionType === 'receiving';
                      const transactionDate = new Date(transaction.date);
                      
                      return (
                        <div
                          key={transaction.id}
                          className={`p-4 rounded-lg border transition-all ${
                            isReceiving
                              ? theme === 'dark'
                                ? 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/30'
                                : 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-300'
                              : theme === 'dark'
                                ? 'border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/30'
                                : 'border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg flex-shrink-0 ${
                              isReceiving
                                ? theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-100'
                                : theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                            }`}>
                              {isReceiving ? (
                                <ArrowDownCircle size={18} className="text-emerald-400" />
                              ) : (
                                <ArrowUpCircle size={18} className="text-blue-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Calendar size={14} className={textMuted} />
                                    <span className={`text-sm font-semibold ${textPrimary}`}>
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
                                  {transaction.reference && (
                                    <div className="flex items-center gap-1.5 text-xs">
                                      <FileText size={12} className={textMuted} />
                                      <span className={textMuted}>Ref: {transaction.reference}</span>
                                    </div>
                                  )}
                                </div>
                                <div className={`px-3 py-1.5 rounded-lg flex-shrink-0 ${
                                  isReceiving
                                    ? theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-100'
                                    : theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                                }`}>
                                  <span className={`text-sm font-bold ${
                                    isReceiving ? 'text-emerald-400' : 'text-blue-400'
                                  }`}>
                                    {isReceiving ? '+' : '–'}{transaction.quantity.toLocaleString()} {transaction.unit}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 flex-wrap text-xs">
                                <span className={`px-2 py-1 rounded-full font-medium ${
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
                                  <span className={textMuted}>by {transaction.user}</span>
                                )}
                                {transaction.notes && (
                                  <span className={`${textSecondary} italic`} title={transaction.notes}>
                                    "{transaction.notes}"
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className={`mt-6 flex items-center justify-end gap-3 pt-4 border-t ${borderColor}`}>
              {onEdit && (
                <button
                  onClick={() => {
                    onEdit();
                    onClose();
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg transition-all shadow-lg shadow-blue-500/20"
                >
                  Edit Material
                </button>
              )}
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
