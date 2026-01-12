'use client';

import { useEffect, useState } from 'react';
import { Bell, CheckCircle, XCircle, AlertCircle, RefreshCw, Loader2, AlertTriangle, Clock, Package, TrendingUp, TrendingDown, Trash2, CheckCheck, X, Sparkles } from 'lucide-react';
import { 
  getMaterialsFromSupabase, 
  getAlertsFromSupabase,
  saveAlertToSupabase,
  acknowledgeAlertInSupabase,
  deleteAlertFromSupabase,
  clearAllAlertsFromSupabase,
  clearAcknowledgedAlertsFromSupabase,
  acknowledgeAllAlertsInSupabase,
  generateId 
} from '@/lib/supabase-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { Alert, Material } from '@/types';
import ConfirmModal from '@/components/ConfirmModal';

// Toast Notification Component
function Toast({ 
  message, 
  type = 'success', 
  onClose 
}: { 
  message: string; 
  type?: 'success' | 'error' | 'info'; 
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: {
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/30',
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
      text: 'text-emerald-300',
    },
    error: {
      bg: 'bg-red-500/20',
      border: 'border-red-500/30',
      icon: XCircle,
      iconColor: 'text-red-400',
      text: 'text-red-300',
    },
    info: {
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/30',
      icon: AlertCircle,
      iconColor: 'text-blue-400',
      text: 'text-blue-300',
    },
  }[type];

  const Icon = config.icon;

  return (
    <div className={`fixed top-6 right-6 z-50 animate-slide-in ${config.bg} ${config.border} border backdrop-blur-xl rounded-xl p-4 shadow-2xl shadow-black/50 max-w-sm`}>
      <div className="flex items-start gap-3">
        <Icon className={config.iconColor} size={20} />
        <p className={`text-sm font-medium ${config.text} flex-1`}>{message}</p>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const { theme } = useTheme();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filter, setFilter] = useState<'all' | 'unacknowledged' | 'acknowledged'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'mismatch' | 'low-stock'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'delete' | 'acknowledge' | 'acknowledgeAll' | 'clearResolved' | 'clearAll';
    alertId?: string;
  }>({ isOpen: false, type: 'delete' });
  
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    
    const [materialsData, alertsData] = await Promise.all([
      getMaterialsFromSupabase(),
      getAlertsFromSupabase()
    ]);

    setMaterials(materialsData);
    setAlerts(alertsData);
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // Check for mismatches and create alerts if they don't exist
  const handleCheckMismatches = async () => {
    setIsRefreshing(true);
    
    const existingAlertKeys = new Set(
      alerts.filter(a => !a.acknowledged).map(a => `${a.type}-${a.materialCode}`)
    );

    let newAlertsCreated = 0;

    for (const material of materials) {
      // Check for SAP mismatch
      if (material.sapQuantity !== undefined && material.sapQuantity !== null) {
        const variance = material.quantity - material.sapQuantity;
        const variancePercent = material.sapQuantity > 0 
          ? Math.abs((variance / material.sapQuantity) * 100) 
          : (material.quantity > 0 ? 100 : 0);

        if (Math.abs(variance) >= 1 || variancePercent > 1) {
          const alertKey = `mismatch-${material.materialCode}`;
          
          if (!existingAlertKeys.has(alertKey)) {
            let severity: 'warning' | 'error' | 'critical' = 'warning';
            if (variancePercent > 20 || Math.abs(variance) > 100) {
              severity = 'critical';
            } else if (variancePercent > 10 || Math.abs(variance) > 50) {
              severity = 'error';
            }

            const alert: Alert = {
              id: generateId(),
              type: 'mismatch',
              materialCode: material.materialCode,
              materialDescription: material.description,
              message: `Quantity mismatch: Local (${material.quantity}) vs SAP (${material.sapQuantity}) = ${variance > 0 ? '+' : ''}${variance.toFixed(2)} ${material.unit}`,
              localQuantity: material.quantity,
              sapQuantity: material.sapQuantity,
              variance: variance,
              severity,
              createdAt: new Date().toISOString(),
              acknowledged: false,
            };
            
            await saveAlertToSupabase(alert);
            existingAlertKeys.add(alertKey);
            newAlertsCreated++;
          }
        }
      }

      // Check for low stock
      const lowStockThreshold = 10;
      if (material.quantity <= lowStockThreshold && material.quantity > 0) {
        const alertKey = `low-stock-${material.materialCode}`;
        
        if (!existingAlertKeys.has(alertKey)) {
          const alert: Alert = {
            id: generateId(),
            type: 'low-stock',
            materialCode: material.materialCode,
            materialDescription: material.description,
            message: `Low stock warning: Only ${material.quantity} ${material.unit} remaining`,
            localQuantity: material.quantity,
            sapQuantity: material.sapQuantity || 0,
            variance: 0,
            severity: material.quantity <= 5 ? 'critical' : 'warning',
            createdAt: new Date().toISOString(),
            acknowledged: false,
          };
          
          await saveAlertToSupabase(alert);
          existingAlertKeys.add(alertKey);
          newAlertsCreated++;
        }
      }
    }

    // Reload alerts from database
    const updatedAlerts = await getAlertsFromSupabase();
    setAlerts(updatedAlerts);
    setIsRefreshing(false);

    if (newAlertsCreated > 0) {
      showToast(`Created ${newAlertsCreated} new alert(s)`, 'success');
    } else {
      showToast('No new issues found. All quantities match!', 'info');
    }
  };

  const handleAcknowledge = async (id: string) => {
    setProcessingIds(prev => new Set(prev).add(id));
    
    const success = await acknowledgeAlertInSupabase(id);
    
    if (success) {
      setAlerts(alerts.map(a => a.id === id ? { ...a, acknowledged: true } : a));
      showToast('Alert acknowledged successfully', 'success');
    } else {
      showToast('Failed to acknowledge alert', 'error');
    }
    
    setProcessingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    setConfirmModal({ isOpen: false, type: 'acknowledge' });
  };

  const handleDelete = async (id: string) => {
    setProcessingIds(prev => new Set(prev).add(id));
    
    const success = await deleteAlertFromSupabase(id);
    
    if (success) {
      setAlerts(alerts.filter(a => a.id !== id));
      showToast('Alert deleted successfully', 'success');
    } else {
      showToast('Failed to delete alert', 'error');
    }
    
    setProcessingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    setConfirmModal({ isOpen: false, type: 'delete' });
  };

  const handleAcknowledgeAll = async () => {
    const success = await acknowledgeAllAlertsInSupabase();
    
    if (success) {
      setAlerts(alerts.map(a => ({ ...a, acknowledged: true })));
      showToast('All alerts acknowledged', 'success');
    } else {
      showToast('Failed to acknowledge alerts', 'error');
    }
    
    setConfirmModal({ isOpen: false, type: 'acknowledgeAll' });
  };

  const handleClearAcknowledged = async () => {
    const success = await clearAcknowledgedAlertsFromSupabase();
    
    if (success) {
      setAlerts(alerts.filter(a => !a.acknowledged));
      showToast('Resolved alerts cleared', 'success');
    } else {
      showToast('Failed to clear alerts', 'error');
    }
    
    setConfirmModal({ isOpen: false, type: 'clearResolved' });
  };

  const handleClearAll = async () => {
    const success = await clearAllAlertsFromSupabase();
    
    if (success) {
      setAlerts([]);
      showToast('All alerts cleared', 'success');
    } else {
      showToast('Failed to clear alerts', 'error');
    }
    
    setConfirmModal({ isOpen: false, type: 'clearAll' });
  };

  const openConfirmModal = (type: typeof confirmModal.type, alertId?: string) => {
    setConfirmModal({ isOpen: true, type, alertId });
  };

  const getModalConfig = () => {
    switch (confirmModal.type) {
      case 'delete':
        return {
          title: 'Delete Alert',
          message: 'Are you sure you want to delete this alert? This action cannot be undone.',
          confirmText: 'Delete',
          type: 'danger' as const,
        };
      case 'acknowledge':
        return {
          title: 'Acknowledge Alert',
          message: 'Mark this alert as acknowledged? It will be moved to resolved alerts.',
          confirmText: 'Acknowledge',
          type: 'success' as const,
        };
      case 'acknowledgeAll':
        return {
          title: 'Acknowledge All Alerts',
          message: 'Are you sure you want to acknowledge all unacknowledged alerts?',
          confirmText: 'Acknowledge All',
          type: 'success' as const,
        };
      case 'clearResolved':
        return {
          title: 'Clear Resolved Alerts',
          message: 'Delete all acknowledged/resolved alerts? This action cannot be undone.',
          confirmText: 'Clear All',
          type: 'warning' as const,
        };
      case 'clearAll':
        return {
          title: 'Clear All Alerts',
          message: 'Delete ALL alerts (both active and resolved)? This action cannot be undone.',
          confirmText: 'Clear Everything',
          type: 'danger' as const,
        };
      default:
        return {
          title: 'Confirm',
          message: 'Are you sure?',
          confirmText: 'Confirm',
          type: 'info' as const,
        };
    }
  };

  const handleConfirmAction = () => {
    switch (confirmModal.type) {
      case 'delete':
        if (confirmModal.alertId) handleDelete(confirmModal.alertId);
        break;
      case 'acknowledge':
        if (confirmModal.alertId) handleAcknowledge(confirmModal.alertId);
        break;
      case 'acknowledgeAll':
        handleAcknowledgeAll();
        break;
      case 'clearResolved':
        handleClearAcknowledged();
        break;
      case 'clearAll':
        handleClearAll();
        break;
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          icon: XCircle,
          iconColor: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          badgeBg: 'bg-red-500/20',
          badgeText: 'text-red-400',
          badgeBorder: 'border-red-500/30',
          barColor: 'bg-gradient-to-r from-red-600 via-red-500 to-red-600',
        };
      case 'error':
        return {
          icon: AlertCircle,
          iconColor: 'text-orange-400',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/30',
          badgeBg: 'bg-orange-500/20',
          badgeText: 'text-orange-400',
          badgeBorder: 'border-orange-500/30',
          barColor: 'bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600',
        };
      case 'warning':
      default:
        return {
          icon: AlertTriangle,
          iconColor: 'text-amber-400',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/30',
          badgeBg: 'bg-amber-500/20',
          badgeText: 'text-amber-400',
          badgeBorder: 'border-amber-500/30',
          barColor: 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600',
        };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mismatch': return Package;
      case 'low-stock': return AlertTriangle;
      default: return Bell;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'mismatch': return 'SAP Mismatch';
      case 'low-stock': return 'Low Stock';
      default: return type;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unacknowledged' && alert.acknowledged) return false;
    if (filter === 'acknowledged' && !alert.acknowledged) return false;
    if (typeFilter !== 'all' && alert.type !== typeFilter) return false;
    return true;
  }).sort((a, b) => {
    if (a.acknowledged !== b.acknowledged) {
      return a.acknowledged ? 1 : -1;
    }
    const severityOrder = { critical: 0, error: 1, warning: 2 };
    const severityDiff = (severityOrder[a.severity as keyof typeof severityOrder] || 3) - 
                        (severityOrder[b.severity as keyof typeof severityOrder] || 3);
    if (severityDiff !== 0) return severityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;
  const acknowledgedCount = alerts.filter(a => a.acknowledged).length;

  const mismatchCount = alerts.filter(a => a.type === 'mismatch' && !a.acknowledged).length;
  const lowStockCount = alerts.filter(a => a.type === 'low-stock' && !a.acknowledged).length;

  const modalConfig = getModalConfig();

  // Theme-aware classes
  const bgMain = theme === 'dark' 
    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-black' 
    : 'bg-gradient-to-br from-slate-50 via-white to-slate-100';
  const borderColor = theme === 'dark' ? 'border-slate-800/50' : 'border-slate-200';
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';
  const textMuted = theme === 'dark' ? 'text-slate-500' : 'text-slate-500';
  const bgCard = theme === 'dark' ? 'bg-slate-800/50' : 'bg-white';
  const borderCard = theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200';

  return (
    <div className={`min-h-screen ${bgMain} transition-colors duration-300`}>
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: 'delete' })}
        onConfirm={handleConfirmAction}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        type={modalConfig.type}
        isLoading={confirmModal.alertId ? processingIds.has(confirmModal.alertId) : false}
      />

      {/* Header */}
      <div className={`border-b ${borderColor} transition-colors duration-300`}>
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className={`text-xl sm:text-2xl font-bold ${textPrimary} tracking-tight transition-colors duration-300`}>Alerts</h1>
                {criticalCount > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 border border-red-500/30 rounded-full animate-pulse">
                    <div className="w-2 h-2 bg-red-400 rounded-full" />
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wide">{criticalCount} Critical</span>
                  </div>
                )}
              </div>
              <p className={`text-xs sm:text-sm ${textSecondary} transition-colors duration-300`}>Monitor SAP mismatches and low stock warnings</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`px-4 py-2.5 rounded-xl border font-medium text-sm transition-all flex items-center gap-2 disabled:opacity-50 ${
                  theme === 'dark' 
                    ? 'bg-slate-800/50 hover:bg-slate-700/50 border-slate-700/50 text-slate-300' 
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                }`}
              >
                <RefreshCw className={`${isRefreshing ? 'animate-spin' : ''}`} size={16} />
                Refresh
              </button>
              <button
                onClick={handleCheckMismatches}
                disabled={isRefreshing}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl text-white font-medium text-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <AlertTriangle size={16} />
                Check Mismatches
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${bgCard} rounded-xl p-5 border ${borderCard} transition-colors duration-300`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-red-500/10 rounded-lg border border-red-500/20">
                <Package size={18} className="text-red-400" />
              </div>
              <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-lg">MISMATCH</span>
            </div>
            <p className={`text-2xl font-bold ${textPrimary} transition-colors duration-300`}>{mismatchCount}</p>
            <p className={`text-xs ${textMuted} mt-1 transition-colors duration-300`}>SAP discrepancies</p>
          </div>
          
          <div className={`${bgCard} rounded-xl p-5 border ${borderCard} transition-colors duration-300`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <AlertTriangle size={18} className="text-amber-400" />
              </div>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg">LOW STOCK</span>
            </div>
            <p className={`text-2xl font-bold ${textPrimary} transition-colors duration-300`}>{lowStockCount}</p>
            <p className={`text-xs ${textMuted} mt-1 transition-colors duration-300`}>items need restock</p>
          </div>
          
          <div className={`${bgCard} rounded-xl p-5 border ${borderCard} transition-colors duration-300`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <Bell size={18} className="text-blue-400" />
              </div>
              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg">ACTIVE</span>
            </div>
            <p className={`text-2xl font-bold ${textPrimary} transition-colors duration-300`}>{unacknowledgedCount}</p>
            <p className={`text-xs ${textMuted} mt-1 transition-colors duration-300`}>unacknowledged</p>
          </div>
          
          <div className={`${bgCard} rounded-xl p-5 border ${borderCard} transition-colors duration-300`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <CheckCircle size={18} className="text-emerald-400" />
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">RESOLVED</span>
            </div>
            <p className={`text-2xl font-bold ${textPrimary} transition-colors duration-300`}>{acknowledgedCount}</p>
            <p className={`text-xs ${textMuted} mt-1 transition-colors duration-300`}>acknowledged</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex flex-wrap gap-4">
              {/* Status Filter */}
              <div className="flex gap-2">
                {[
                  { key: 'all', label: 'All', count: alerts.length },
                  { key: 'unacknowledged', label: 'Active', count: unacknowledgedCount },
                  { key: 'acknowledged', label: 'Resolved', count: acknowledgedCount },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as typeof filter)}
                    className={`relative px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${
                      filter === tab.key
                        ? 'text-white'
                        : 'text-slate-400 hover:text-white bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/30'
                    }`}
                  >
                    {filter === tab.key && (
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl" />
                    )}
                    <span className="relative flex items-center gap-2">
                      {tab.label}
                      <span className={`px-1.5 py-0.5 rounded-md text-xs ${
                        filter === tab.key ? 'bg-white/20' : 'bg-slate-700/50'
                      }`}>
                        {tab.count}
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="h-8 w-px bg-slate-700/50 hidden md:block" />

              {/* Type Filter */}
              <div className="flex gap-2">
                {[
                  { key: 'all', label: 'All Types' },
                  { key: 'mismatch', label: 'Mismatches' },
                  { key: 'low-stock', label: 'Low Stock' },
                ].map((type) => (
                  <button
                    key={type.key}
                    onClick={() => setTypeFilter(type.key as typeof typeFilter)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${
                      typeFilter === type.key
                        ? 'bg-slate-700 text-white border border-slate-600'
                        : 'text-slate-400 hover:text-white bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/30'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unacknowledgedCount > 1 && (
                <button
                  onClick={() => openConfirmModal('acknowledgeAll')}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-all duration-300"
                >
                  <CheckCheck size={14} />
                  Acknowledge All
                </button>
              )}
              {acknowledgedCount > 0 && (
                <button
                  onClick={() => openConfirmModal('clearResolved')}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-300 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30 rounded-xl transition-all duration-300"
                >
                  <Trash2 size={14} />
                  Clear Resolved
                </button>
              )}
              {alerts.length > 0 && (
                <button
                  onClick={() => openConfirmModal('clearAll')}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all duration-300"
                >
                  <Trash2 size={14} />
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-slate-800/50 rounded-xl p-16 text-center border border-slate-700/50">
              <Loader2 className="animate-spin text-amber-500 mx-auto mb-4" size={48} />
              <p className="text-slate-400 font-medium">Loading alerts...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="bg-slate-800/50 rounded-xl p-16 text-center border border-slate-700/50">
              <div className="w-20 h-20 bg-slate-700/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Bell className="text-slate-500" size={36} />
              </div>
              <p className="text-white text-xl font-semibold mb-2">No alerts found</p>
              <p className="text-slate-500 text-sm mb-4">
                {filter === 'unacknowledged' 
                  ? 'All alerts have been acknowledged!' 
                  : filter === 'acknowledged'
                  ? 'No resolved alerts yet'
                  : 'Click "Check Mismatches" to scan for issues'}
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const config = getSeverityConfig(alert.severity);
              const SeverityIcon = config.icon;
              const TypeIcon = getTypeIcon(alert.type);
              const isProcessing = processingIds.has(alert.id);

              return (
                <div
                  key={alert.id}
                  className={`bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden transition-all duration-300 ${
                    alert.acknowledged ? 'opacity-60' : ''
                  }`}
                >
                  {/* Severity indicator bar */}
                  <div className={`h-1 ${config.barColor}`} />
                  
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start gap-4 sm:gap-6">
                      {/* Icon */}
                      <div className={`shrink-0 p-3 rounded-xl ${config.bgColor} border ${config.borderColor} hidden sm:flex`}>
                        <SeverityIcon className={config.iconColor} size={24} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-semibold text-white truncate">{alert.materialDescription}</h3>
                            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-lg border ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}>
                              {alert.severity.toUpperCase()}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-lg bg-slate-700/50 text-slate-300 border border-slate-600/30">
                              <TypeIcon size={10} />
                              {getTypeLabel(alert.type)}
                            </span>
                            {alert.acknowledged && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle size={10} />
                                RESOLVED
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Message */}
                        <p className="text-sm text-slate-300 mb-4">{alert.message}</p>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                          <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/30">
                            <div className="text-slate-500 text-[10px] mb-0.5">Material Code</div>
                            <p className="font-semibold text-white text-xs truncate">{alert.materialCode}</p>
                          </div>
                          {alert.type === 'mismatch' && (
                            <>
                              <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/30">
                                <div className="text-slate-500 text-[10px] mb-0.5">Local Qty</div>
                                <p className="font-semibold text-white text-xs">{alert.localQuantity}</p>
                              </div>
                              <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/30">
                                <div className="text-slate-500 text-[10px] mb-0.5">SAP Qty</div>
                                <p className="font-semibold text-white text-xs">{alert.sapQuantity}</p>
                              </div>
                              <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/30">
                                <div className="text-slate-500 text-[10px] mb-0.5">Variance</div>
                                <p className={`font-bold text-xs flex items-center gap-1 ${alert.variance > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {alert.variance > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                  {alert.variance > 0 ? '+' : ''}{alert.variance.toFixed(2)}
                                </p>
                              </div>
                            </>
                          )}
                          {alert.type === 'low-stock' && (
                            <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/30">
                              <div className="text-slate-500 text-[10px] mb-0.5">Current Stock</div>
                              <p className="font-semibold text-amber-400 text-xs">{alert.localQuantity}</p>
                            </div>
                          )}
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                          <Clock size={12} />
                          {new Date(alert.createdAt).toLocaleString()}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="shrink-0 flex flex-col gap-2">
                        {!alert.acknowledged && (
                          <button
                            onClick={() => openConfirmModal('acknowledge', alert.id)}
                            disabled={isProcessing}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium text-xs text-white transition-all flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <Loader2 className="animate-spin" size={14} />
                            ) : (
                              <CheckCircle size={14} />
                            )}
                            <span className="hidden sm:inline">Acknowledge</span>
                          </button>
                        )}
                        <button
                          onClick={() => openConfirmModal('delete', alert.id)}
                          disabled={isProcessing}
                          className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-medium text-xs text-white transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="animate-spin" size={14} />
                          ) : (
                            <Trash2 size={14} />
                          )}
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
