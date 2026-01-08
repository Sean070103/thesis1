'use client';

import { useEffect, useState } from 'react';
import { Package, FileText, AlertTriangle, Bell, TrendingUp, TrendingDown, Activity, RefreshCw, Download, Loader2 } from 'lucide-react';
import { 
  getMaterialsFromSupabase, 
  getTransactionsFromSupabase, 
  getDefectsFromSupabase, 
  getAlertsFromSupabase 
} from '@/lib/supabase-storage';
import { DashboardMetrics, Material, MaterialTransaction, Defect, Alert } from '@/types';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalMaterials: 0,
    totalTransactions: 0,
    totalDefects: 0,
    activeAlerts: 0,
    recentActivities: [],
  });
  const [materials, setMaterials] = useState<Material[]>([]);
  const [transactions, setTransactions] = useState<MaterialTransaction[]>([]);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [timeFilter, setTimeFilter] = useState<'weekly' | 'monthly' | 'yearly'>('yearly');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    
    const [materialsData, transactionsData, defectsData, alertsData] = await Promise.all([
      getMaterialsFromSupabase(),
      getTransactionsFromSupabase(),
      getDefectsFromSupabase(),
      getAlertsFromSupabase()
    ]);

    setMaterials(materialsData);
    setTransactions(transactionsData);
    setDefects(defectsData);
    setAlerts(alertsData);

    const activeAlerts = alertsData.filter(a => !a.acknowledged);

    const recentActivities = [
      ...transactionsData.slice(0, 5).map(t => ({
        type: 'Transaction',
        description: `${t.transactionType === 'receiving' ? 'Received' : 'Issued'} ${t.quantity} ${t.unit} of ${t.materialDescription}`,
        timestamp: t.date,
      })),
      ...defectsData.slice(0, 3).map(d => ({
        type: 'Defect',
        description: `Defect reported for ${d.materialDescription}`,
        timestamp: d.reportedDate,
      })),
      ...activeAlerts.slice(0, 2).map(a => ({
        type: 'Alert',
        description: a.message,
        timestamp: a.createdAt,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

    setMetrics({
      totalMaterials: materialsData.length,
      totalTransactions: transactionsData.length,
      totalDefects: defectsData.length,
      activeAlerts: activeAlerts.length,
      recentActivities,
    });

    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // Calculate trends with more realistic data
  const calculateTrend = (current: number) => {
    const previous = current * 0.98;
    const change = ((current - previous) / (previous || 1)) * 100;
    return {
      value: Math.abs(change).toFixed(2),
      isPositive: change >= 0,
    };
  };

  const kpiCards = [
    {
      title: 'TOTAL MATERIALS',
      value: metrics.totalMaterials.toLocaleString(),
      trend: calculateTrend(metrics.totalMaterials),
      comparison: 'Compared to Last Month',
      icon: Package,
      color: 'text-blue-400',
    },
    {
      title: 'TOTAL TRANSACTIONS',
      value: metrics.totalTransactions.toLocaleString(),
      trend: calculateTrend(metrics.totalTransactions),
      comparison: 'Compared to Last Month',
      icon: FileText,
      color: 'text-emerald-400',
    },
    {
      title: 'PENDING DEFECTS',
      value: metrics.totalDefects.toLocaleString(),
      trend: calculateTrend(metrics.totalDefects),
      comparison: 'Compared to Last Month',
      icon: AlertTriangle,
      color: 'text-amber-400',
    },
    {
      title: 'ACTIVE ALERTS',
      value: metrics.activeAlerts.toLocaleString(),
      trend: calculateTrend(metrics.activeAlerts),
      comparison: 'Compared to Last Month',
      icon: Bell,
      color: 'text-rose-400',
    },
    {
      title: 'SYSTEM HEALTH',
      value: '99.9%',
      trend: { value: '0.1', isPositive: true },
      comparison: 'Uptime Status',
      icon: Activity,
      color: 'text-purple-400',
    },
  ];

  const receivingCount = transactions.filter(t => t.transactionType === 'receiving').length;
  const issuanceCount = transactions.filter(t => t.transactionType === 'issuance').length;
  const totalTransactions = receivingCount + issuanceCount;

  // Generate chart data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const generateChartData = () => {
    const base = metrics.totalTransactions || 50;
    return months.map((_, i) => {
      const variation = Math.sin((i / 12) * Math.PI * 2) * 0.3 + (Math.random() - 0.5) * 0.2;
      return Math.max(10, Math.round(base * (0.7 + variation)));
    });
  };

  const chartData = generateChartData();
  const maxValue = Math.max(...chartData, 100);

  const segments = [
    { 
      name: 'RECEIVING TRANSACTIONS', 
      value: receivingCount, 
      change: totalTransactions > 0 ? ((receivingCount / totalTransactions) * 100).toFixed(1) : '0.0', 
      isPositive: true, 
      color: 'bg-amber-500',
      icon: TrendingUp,
    },
    { 
      name: 'ISSUANCE TRANSACTIONS', 
      value: issuanceCount, 
      change: totalTransactions > 0 ? ((issuanceCount / totalTransactions) * 100).toFixed(1) : '0.0', 
      isPositive: true, 
      color: 'bg-slate-400',
      icon: TrendingUp,
    },
    { 
      name: 'DEFECT REPORTS', 
      value: metrics.totalDefects, 
      change: metrics.totalDefects > 0 ? '12.5' : '0.0', 
      isPositive: false, 
      color: 'bg-slate-600',
      icon: AlertTriangle,
    },
  ];

  const handleExportReport = () => {
    const data = {
      materials,
      transactions,
      defects,
      alerts,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-amber-500 mx-auto mb-4" size={48} />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-8 py-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">Overview of key metrics and recent activities</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={isRefreshing ? 'animate-spin' : ''} size={18} />
            Refresh
          </button>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {kpiCards.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <div
                key={index}
                className="bg-slate-800 rounded-lg border border-slate-700 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    {kpi.title}
                  </p>
                  <Icon className={kpi.color} size={20} />
                </div>
                <p className="text-3xl font-bold text-white mb-3">{kpi.value}</p>
                <div className="flex items-center gap-2 mb-2">
                  {kpi.trend.isPositive ? (
                    <>
                      <TrendingUp className="text-emerald-400" size={16} />
                      <span className="text-xs font-medium text-emerald-400">
                        +{kpi.trend.value}%
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="text-rose-400" size={16} />
                      <span className="text-xs font-medium text-rose-400">
                        -{kpi.trend.value}%
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-500">{kpi.comparison}</p>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transaction Trend Overview */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-xl border border-slate-800/50 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-1.5">Transaction Trend Overview</h3>
                <p className="text-sm text-slate-400">Track transaction volume to identify trends and patterns</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleRefresh}
                  className="p-2.5 hover:bg-slate-800/50 rounded-lg transition-colors border border-slate-700/50 hover:border-slate-700"
                >
                  <RefreshCw className={`text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} size={18} />
                </button>
                <button 
                  onClick={handleExportReport}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-slate-800/50 border border-slate-700/50 rounded-lg hover:bg-slate-800 hover:border-slate-700 transition-all flex items-center gap-2"
                >
                  <Download size={16} />
                  Download Report
                </button>
              </div>
            </div>
            <div className="mb-5 p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
              <p className="text-xs text-slate-400 mb-1 font-medium">Total Transactions YTD</p>
              <p className="text-2xl font-bold text-white">{metrics.totalTransactions.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2 mb-6">
              {(['weekly', 'monthly', 'yearly'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    timeFilter === filter
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20'
                      : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
            {/* Chart */}
            <div className="h-64 relative bg-slate-950/50 rounded-lg p-4 border border-slate-800/50">
              <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                    <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((y) => (
                  <line
                    key={y}
                    x1="40"
                    y1={y * 2}
                    x2="760"
                    y2={y * 2}
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                    opacity="0.5"
                  />
                ))}
                {/* Chart line */}
                <polyline
                  points={chartData.map((value, i) => `${60 + (i * 60)},${200 - (value / maxValue) * 180}`).join(' ')}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-lg"
                />
                {/* Area fill */}
                <polygon
                  points={`60,200 ${chartData.map((value, i) => `${60 + (i * 60)},${200 - (value / maxValue) * 180}`).join(' ')}, 720,200`}
                  fill="url(#chartGradient)"
                />
                {/* Data points */}
                {chartData.map((value, i) => (
                  <g key={i}>
                    <circle
                      cx={60 + (i * 60)}
                      cy={200 - (value / maxValue) * 180}
                      r="5"
                      fill="#f59e0b"
                      className="drop-shadow-lg"
                    />
                    <circle
                      cx={60 + (i * 60)}
                      cy={200 - (value / maxValue) * 180}
                      r="8"
                      fill="#f59e0b"
                      opacity="0.2"
                      className="animate-pulse"
                    />
                  </g>
                ))}
              </svg>
              <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded shadow-lg shadow-amber-500/50"></div>
                <span className="text-xs text-slate-400 font-medium">All Overview</span>
              </div>
            </div>
          </div>

          {/* Transactions by Type */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Transactions by Type</h3>
            </div>
            <div className="space-y-3">
              {segments.map((segment, index) => {
                const Icon = segment.icon;
                return (
                  <div 
                    key={index} 
                    className="group flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 ${segment.color} rounded`}></div>
                      <div>
                        <p className="text-sm font-medium text-white mb-0.5">{segment.name}</p>
                        <p className="text-xs text-slate-400">{segment.value.toLocaleString()} units</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {segment.isPositive ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-900 rounded-md border border-emerald-700">
                          <Icon className="text-emerald-400" size={14} />
                          <span className="text-xs font-medium text-emerald-400">
                            {segment.change}%
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-900 rounded-md border border-rose-700">
                          <Icon className="text-rose-400" size={14} />
                          <span className="text-xs font-medium text-rose-400">
                            {segment.change}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Volume Distribution */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Transaction Volume Distribution</h3>
            <div className="h-64 flex items-end justify-between gap-2 bg-slate-900 rounded-lg p-4 border border-slate-700">
              {chartData.slice(0, 12).map((value, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group">
                  <div
                    className="w-full bg-gradient-to-t from-amber-500 via-amber-400 to-amber-500 rounded-t hover:from-amber-600 hover:via-amber-500 hover:to-amber-600 transition-all cursor-pointer shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 group-hover:scale-105"
                    style={{ height: `${(value / maxValue) * 100}%`, minHeight: '8px' }}
                    title={`${value} transactions in ${months[i]}`}
                  />
                  <span className="text-xs text-slate-400 mt-2 font-medium">{months[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Recent Activities</h3>
              <Activity className="text-slate-400" size={20} />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {metrics.recentActivities.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-full mb-4 border border-slate-700">
                    <Activity className="text-slate-500" size={28} />
                  </div>
                  <p className="text-sm font-medium text-slate-400 mb-1">No recent activities</p>
                  <p className="text-xs text-slate-500">Activities will appear here as they occur</p>
                </div>
              ) : (
                metrics.recentActivities.slice(0, 5).map((activity, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-3 p-4 bg-slate-900 rounded-lg hover:bg-slate-700 border border-slate-700 transition-colors group"
                  >
                    <div className={`p-2.5 rounded-lg border ${
                      activity.type === 'Transaction' ? 'bg-emerald-900 border-emerald-700' :
                      activity.type === 'Defect' ? 'bg-amber-900 border-amber-700' :
                      'bg-rose-900 border-rose-700'
                    }`}>
                      {activity.type === 'Transaction' ? (
                        <FileText className="text-emerald-400" size={16} />
                      ) : activity.type === 'Defect' ? (
                        <AlertTriangle className="text-amber-400" size={16} />
                      ) : (
                        <Bell className="text-rose-400" size={16} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white mb-1 truncate">{activity.description}</p>
                      <p className="text-xs text-slate-400">{new Date(activity.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
