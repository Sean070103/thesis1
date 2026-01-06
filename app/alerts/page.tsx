'use client';

import { useEffect, useState } from 'react';
import { Bell, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { getAlerts, acknowledgeAlert, deleteAlert, getMaterials, saveAlert, generateId } from '@/lib/storage';
import { Alert, Material } from '@/types';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filter, setFilter] = useState<'all' | 'unacknowledged' | 'acknowledged'>('all');

  useEffect(() => {
    loadData();
    // Check for mismatches periodically
    const interval = setInterval(() => {
      checkMismatches();
      loadData();
    }, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    setAlerts(getAlerts());
    setMaterials(getMaterials());
    checkMismatches();
  };

  const checkMismatches = () => {
    const materials = getMaterials();
    const existingAlerts = getAlerts();
    const newAlerts: Alert[] = [];

    materials.forEach((material) => {
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
            saveAlert(alert);
          }
        }
      }
    });

    if (newAlerts.length > 0) {
      loadData();
    }
  };

  const handleAcknowledge = (id: string) => {
    acknowledgeAlert(id);
    loadData();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this alert?')) {
      deleteAlert(id);
      loadData();
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="text-red-600" size={24} />;
      case 'error': return <AlertCircle className="text-orange-600" size={24} />;
      case 'warning': return <Bell className="text-yellow-600" size={24} />;
      default: return <Bell className="text-gray-600" size={24} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'error': return 'border-orange-500 bg-orange-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-gray-500 bg-gray-50';
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Alerts System
          </h1>
          <p className="text-slate-600 mt-2 text-lg">Notifications for mismatches between local system and SAP</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="premium-button flex items-center space-x-2"
          >
            <RefreshCw size={20} />
            <span>Refresh</span>
          </button>
          {unacknowledgedCount > 0 && (
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl shadow-lg font-semibold">
              {unacknowledgedCount} Unacknowledged
            </div>
          )}
        </div>
      </div>

      <div className="premium-card p-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              filter === 'all' 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50' 
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('unacknowledged')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              filter === 'unacknowledged' 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50' 
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Unacknowledged ({unacknowledgedCount})
          </button>
          <button
            onClick={() => setFilter('acknowledged')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              filter === 'acknowledged' 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50' 
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Acknowledged ({alerts.length - unacknowledgedCount})
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="premium-card p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-6">
              <Bell className="text-slate-400" size={40} />
            </div>
            <p className="text-slate-600 text-xl font-semibold mb-2">No alerts found</p>
            <p className="text-slate-400 text-sm">
              {filter === 'unacknowledged' 
                ? 'All alerts have been acknowledged' 
                : 'No alerts match the current filter'}
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`premium-card p-6 border-l-4 ${getSeverityColor(alert.severity)} ${
                alert.acknowledged ? 'opacity-75' : ''
              } hover:shadow-xl transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="mt-1">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{alert.materialDescription}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        alert.severity === 'error' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      {alert.acknowledged && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          ACKNOWLEDGED
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-3">{alert.message}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Material Code:</span>
                        <p className="font-medium text-gray-800">{alert.materialCode}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Local Quantity:</span>
                        <p className="font-medium text-gray-800">{alert.localQuantity}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">SAP Quantity:</span>
                        <p className="font-medium text-gray-800">{alert.sapQuantity}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Variance:</span>
                        <p className={`font-medium ${alert.variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {alert.variance > 0 ? '+' : ''}{alert.variance.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mt-3">
                      Created: {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col space-y-2 ml-4">
                  {!alert.acknowledged && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:shadow-lg transition-all font-semibold"
                    >
                      <CheckCircle size={18} />
                      <span>Acknowledge</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(alert.id)}
                    className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:shadow-lg transition-all font-semibold"
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
  );
}

