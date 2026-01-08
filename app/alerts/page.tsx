'use client';

import { useEffect, useState } from 'react';
import { Bell, CheckCircle, XCircle, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { 
  getAlertsFromSupabase, 
  acknowledgeAlertInSupabase, 
  deleteAlertFromSupabase, 
  getMaterialsFromSupabase, 
  saveAlertToSupabase, 
  generateId 
} from '@/lib/supabase-storage';
import { Alert, Material } from '@/types';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filter, setFilter] = useState<'all' | 'unacknowledged' | 'acknowledged'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [alertsData, materialsData] = await Promise.all([
      getAlertsFromSupabase(),
      getMaterialsFromSupabase()
    ]);
    setAlerts(alertsData);
    setMaterials(materialsData);
    await checkMismatches(materialsData, alertsData);
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const checkMismatches = async (materialsData: Material[], existingAlerts: Alert[]) => {
    const newAlerts: Alert[] = [];

    for (const material of materialsData) {
      if (material.sapQuantity !== undefined && material.sapQuantity !== null) {
        const variance = material.quantity - material.sapQuantity;
        const variancePercent = material.sapQuantity > 0 
          ? Math.abs((variance / material.sapQuantity) * 100) 
          : 0;

        // Only create alert if there's a significant variance (more than 1% or more than 1 unit)
        if (Math.abs(variance) > 1 || variancePercent > 1) {
          const existingAlert = existingAlerts.find(
            a => a.materialCode === material.materialCode && !a.acknowledged
          );

          if (!existingAlert) {
            let severity: 'warning' | 'error' | 'critical' = 'warning';
            if (variancePercent > 10 || Math.abs(variance) > 100) {
              severity = 'critical';
            } else if (variancePercent > 5 || Math.abs(variance) > 50) {
              severity = 'error';
            }

            const alert: Alert = {
              id: generateId(),
              type: 'mismatch',
              materialCode: material.materialCode,
              materialDescription: material.description,
              message: `Quantity mismatch detected: Local quantity (${material.quantity}) differs from SAP quantity (${material.sapQuantity}) by ${variance > 0 ? '+' : ''}${variance.toFixed(2)} ${material.unit}`,
              localQuantity: material.quantity,
              sapQuantity: material.sapQuantity,
              variance: variance,
              severity,
              createdAt: new Date().toISOString(),
              acknowledged: false,
            };
            newAlerts.push(alert);
            await saveAlertToSupabase(alert);
          }
        }
      }
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev]);
    }
  };

  const handleAcknowledge = async (id: string) => {
    const success = await acknowledgeAlertInSupabase(id);
    if (success) {
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    } else {
      alert('Failed to acknowledge alert. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this alert?')) {
      const success = await deleteAlertFromSupabase(id);
      if (success) {
        setAlerts(prev => prev.filter(a => a.id !== id));
      } else {
        alert('Failed to delete alert. Please try again.');
      }
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="text-red-500" size={24} />;
      case 'error': return <AlertCircle className="text-orange-500" size={24} />;
      case 'warning': return <Bell className="text-yellow-500" size={24} />;
      default: return <Bell className="text-gray-500" size={24} />;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unacknowledged') return !alert.acknowledged;
    if (filter === 'acknowledged') return alert.acknowledged;
    return true;
  }).sort((a, b) => {
    // Sort by severity and date
    const severityOrder = { critical: 0, error: 1, warning: 2 };
    const severityDiff = (severityOrder[a.severity as keyof typeof severityOrder] || 3) - 
                        (severityOrder[b.severity as keyof typeof severityOrder] || 3);
    if (severityDiff !== 0) return severityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-8 py-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">Alerts System</h1>
            <p className="text-sm text-slate-400 mt-1">Notifications for mismatches between local system and SAP</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={isRefreshing ? 'animate-spin' : ''} size={18} />
              Refresh
            </button>
            {unacknowledgedCount > 0 && (
              <div className="bg-rose-600 text-white px-4 py-2 rounded-lg font-medium">
                {unacknowledgedCount} Unacknowledged
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex space-x-4 flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-slate-700 text-white border border-slate-600' 
                  : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setFilter('unacknowledged')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                filter === 'unacknowledged' 
                  ? 'bg-slate-700 text-white border border-slate-600' 
                  : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              Unacknowledged ({unacknowledgedCount})
            </button>
            <button
              onClick={() => setFilter('acknowledged')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                filter === 'acknowledged' 
                  ? 'bg-slate-700 text-white border border-slate-600' 
                  : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              Acknowledged ({alerts.length - unacknowledgedCount})
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-12 text-center">
              <Loader2 className="animate-spin text-amber-500 mx-auto mb-4" size={40} />
              <p className="text-slate-400">Loading alerts...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-900 rounded-full mb-6">
                <Bell className="text-slate-400" size={40} />
              </div>
              <p className="text-slate-300 text-xl font-semibold mb-2">No alerts found</p>
              <p className="text-slate-500 text-sm">
                {filter === 'unacknowledged' 
                  ? 'All alerts have been acknowledged' 
                  : 'No alerts match the current filter'}
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-slate-800 rounded-lg border-l-4 p-6 ${
                  alert.severity === 'critical' ? 'border-red-600' : 
                  alert.severity === 'error' ? 'border-orange-600' : 
                  'border-yellow-600'
                } ${alert.acknowledged ? 'opacity-75' : ''} hover:bg-slate-700 transition-colors`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="mt-1">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2 flex-wrap gap-2">
                        <h3 className="text-lg font-semibold text-white">{alert.materialDescription}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          alert.severity === 'critical' ? 'bg-red-900 text-red-300' :
                          alert.severity === 'error' ? 'bg-orange-900 text-orange-300' :
                          'bg-amber-900 text-amber-300'
                        }`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        {alert.acknowledged && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-900 text-emerald-300">
                            ACKNOWLEDGED
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300 mb-3">{alert.message}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">Material Code:</span>
                          <p className="font-medium text-white">{alert.materialCode}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Local Quantity:</span>
                          <p className="font-medium text-white">{alert.localQuantity}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">SAP Quantity:</span>
                          <p className="font-medium text-white">{alert.sapQuantity}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Variance:</span>
                          <p className={`font-medium ${alert.variance > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {alert.variance > 0 ? '+' : ''}{alert.variance.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <p className="text-slate-500 text-sm mt-3">
                        Created: {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 ml-4">
                    {!alert.acknowledged && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-emerald-700 transition-colors font-medium text-sm"
                      >
                        <CheckCircle size={18} />
                        <span>Acknowledge</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(alert.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-red-700 transition-colors font-medium text-sm"
                    >
                      <XCircle size={18} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
