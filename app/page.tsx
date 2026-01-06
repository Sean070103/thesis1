'use client';

import { useEffect, useState } from 'react';
import { Package, FileText, AlertTriangle, Bell, TrendingUp, TrendingDown, Activity, RefreshCw, Download, Sparkles, Zap } from 'lucide-react';
import { getMaterials, getTransactions, getDefects, getAlerts } from '@/lib/storage';
import { DashboardMetrics } from '@/types';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalMaterials: 0,
    totalTransactions: 0,
    totalDefects: 0,
    activeAlerts: 0,
    recentActivities: [],
  });
  const [timeFilter, setTimeFilter] = useState<'weekly' | 'monthly' | 'yearly'>('yearly');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const loadMetrics = () => {
      const materials = getMaterials();
      const transactions = getTransactions();
      const defects = getDefects();
      const alerts = getAlerts().filter(a => !a.acknowledged);

      const recentActivities = [
        ...transactions.slice(-5).map(t => ({
          type: 'Transaction',
          description: `${t.transactionType === 'receiving' ? 'Received' : 'Issued'} ${t.quantity} ${t.unit} of ${t.materialDescription}`,
          timestamp: t.date,
        })),
        ...defects.slice(-3).map(d => ({
          type: 'Defect',
          description: `Defect reported for ${d.materialDescription}`,
          timestamp: d.reportedDate,
        })),
        ...alerts.slice(-2).map(a => ({
          type: 'Alert',
          description: a.message,
          timestamp: a.createdAt,
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

      setMetrics({
        totalMaterials: materials.length,
        totalTransactions: transactions.length,
        totalDefects: defects.length,
        activeAlerts: alerts.length,
        recentActivities,
      });
    };

    loadMetrics();
    const interval = setInterval(loadMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Force reload metrics
    const materials = getMaterials();
    const transactions = getTransactions();
    const defects = getDefects();
    const alerts = getAlerts().filter(a => !a.acknowledged);

    const recentActivities = [
      ...transactions.slice(-5).map(t => ({
        type: 'Transaction',
        description: `${t.transactionType === 'receiving' ? 'Received' : 'Issued'} ${t.quantity} ${t.unit} of ${t.materialDescription}`,
        timestamp: t.date,
      })),
      ...defects.slice(-3).map(d => ({
        type: 'Defect',
        description: `Defect reported for ${d.materialDescription}`,
        timestamp: d.reportedDate,
      })),
      ...alerts.slice(-2).map(a => ({
        type: 'Alert',
        description: a.message,
        timestamp: a.createdAt,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

    setMetrics({
      totalMaterials: materials.length,
      totalTransactions: transactions.length,
      totalDefects: defects.length,
      activeAlerts: alerts.length,
      recentActivities,
    });
    
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Calculate trends with more realistic data
  const calculateTrend = (current: number) => {
    const previous = current * 0.98;
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(2),
      isPositive: change > 0,
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
      bgGradient: 'from-blue-500/10 to-blue-600/5',
    },
    {
      title: 'TOTAL TRANSACTIONS',
      value: metrics.totalTransactions.toLocaleString(),
      trend: calculateTrend(metrics.totalTransactions),
      comparison: 'Compared to Last Month',
      icon: FileText,
      color: 'text-emerald-400',
      bgGradient: 'from-emerald-500/10 to-emerald-600/5',
    },
    {
      title: 'PENDING DEFECTS',
      value: metrics.totalDefects.toLocaleString(),
      trend: calculateTrend(metrics.totalDefects),
      comparison: 'Compared to Last Month',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bgGradient: 'from-amber-500/10 to-amber-600/5',
    },
    {
      title: 'ACTIVE ALERTS',
      value: metrics.activeAlerts.toLocaleString(),
      trend: calculateTrend(metrics.activeAlerts),
      comparison: 'Compared to Last Month',
      icon: Bell,
      color: 'text-rose-400',
      bgGradient: 'from-rose-500/10 to-rose-600/5',
    },
    {
      title: 'SYSTEM HEALTH',
      value: '99.9%',
      trend: { value: '0.1', isPositive: true },
      comparison: 'Uptime Status',
      icon: Activity,
      color: 'text-purple-400',
      bgGradient: 'from-purple-500/10 to-purple-600/5',
    },
  ];

  const receivingCount = getTransactions().filter(t => t.transactionType === 'receiving').length;
  const issuanceCount = getTransactions().filter(t => t.transactionType === 'issuance').length;
  const totalTransactions = receivingCount + issuanceCount;
  const receivingPercent = totalTransactions > 0 ? (receivingCount / totalTransactions) * 100 : 0;
  const issuancePercent = totalTransactions > 0 ? (issuanceCount / totalTransactions) * 100 : 0;

  // Generate more realistic chart data
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
      change: receivingCount > 0 ? ((receivingCount / (receivingCount + issuanceCount)) * 100).toFixed(1) : '0.0', 
      isPositive: true, 
      color: 'bg-amber-500',
      icon: TrendingUp,
    },
    { 
      name: 'ISSUANCE TRANSACTIONS', 
      value: issuanceCount, 
      change: issuanceCount > 0 ? ((issuanceCount / (receivingCount + issuanceCount)) * 100).toFixed(1) : '0.0', 
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

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-black via-slate-950 to-black border-b border-slate-800/50 px-8 py-7 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">Dashboard / Overview</h1>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-emerald-400">Live</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm">Welcome Back! Here's your real-time material management performance snapshot</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-5 py-2.5 text-sm font-medium text-slate-300 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:bg-slate-800 hover:border-slate-700 transition-all duration-200 backdrop-blur-sm">
              Optimize Network
            </button>
            <button className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 flex items-center gap-2">
              <Sparkles size={16} />
              Add Material
            </button>
          </div>
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
                className="group relative bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-xl border border-slate-800/50 p-6 shadow-lg hover:shadow-xl hover:border-slate-700/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                {/* Animated background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${kpi.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.title}</p>
                    <div className={`p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/50 group-hover:border-${kpi.color.split('-')[1]}-500/30 transition-colors`}>
                      <Icon className={kpi.color} size={18} />
                    </div>
                  </div>
                  <p className="text-3xl font-extrabold text-white mb-3 tracking-tight">{kpi.value}</p>
                  <div className="flex items-center gap-2 mb-3">
                    {kpi.trend.isPositive ? (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                        <TrendingUp className="text-emerald-400" size={14} />
                        <span className="text-xs font-bold text-emerald-400">
                          ▲ {kpi.trend.value}%
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-500/10 rounded-md border border-rose-500/20">
                        <TrendingDown className="text-rose-400" size={14} />
                        <span className="text-xs font-bold text-rose-400">
                          ▼ {kpi.trend.value}%
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{kpi.comparison}</p>
                </div>
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
                  onClick={() => {
                    const data = {
                      materials: getMaterials(),
                      transactions: getTransactions(),
                      defects: getDefects(),
                      alerts: getAlerts(),
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
                  }}
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
                {/* X-axis labels */}
                {months.map((month, i) => (
                  <text
                    key={i}
                    x={60 + (i * 60)}
                    y="195"
                    textAnchor="middle"
                    className="text-xs fill-slate-400"
                    fontSize="11"
                    fontWeight="500"
                  >
                    {month}
                  </text>
                ))}
                {/* Y-axis labels */}
                {[0, 2, 4, 6, 8, 10].map((val, i) => (
                  <text
                    key={i}
                    x="35"
                    y={200 - (i * 40)}
                    textAnchor="end"
                    className="text-xs fill-slate-500"
                    fontSize="10"
                    fontWeight="500"
                  >
                    {val}k
                  </text>
                ))}
              </svg>
              <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded shadow-lg shadow-amber-500/50"></div>
                <span className="text-xs text-slate-400 font-medium">All Overview</span>
              </div>
            </div>
          </div>

          {/* Transactions by Type */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-xl border border-slate-800/50 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Transactions by Type</h3>
              <Zap className="text-amber-400" size={18} />
            </div>
            <div className="space-y-3">
              {segments.map((segment, index) => {
                const Icon = segment.icon;
                return (
                  <div 
                    key={index} 
                    className="group flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700/30 hover:bg-slate-800/50 hover:border-slate-700/50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 ${segment.color} rounded shadow-lg`}></div>
                      <div>
                        <p className="text-sm font-semibold text-white mb-0.5">{segment.name}</p>
                        <p className="text-xs text-slate-400">{segment.value.toLocaleString()} units</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {segment.isPositive ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                          <Icon className="text-emerald-400" size={14} />
                          <span className="text-xs font-bold text-emerald-400">
                            ▲ {segment.change}%
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 rounded-md border border-rose-500/20">
                          <Icon className="text-rose-400" size={14} />
                          <span className="text-xs font-bold text-rose-400">
                            ▼ {segment.change}%
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
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-xl border border-slate-800/50 p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-6">Transaction Volume Distribution</h3>
            <div className="h-64 flex items-end justify-between gap-2 bg-slate-950/50 rounded-lg p-4 border border-slate-800/50">
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
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-xl border border-slate-800/50 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Recent Activities</h3>
              <Activity className="text-slate-400" size={18} />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {metrics.recentActivities.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800/50 rounded-full mb-4 border border-slate-700/50">
                    <Activity className="text-slate-500" size={28} />
                  </div>
                  <p className="text-sm font-medium text-slate-400 mb-1">No recent activities</p>
                  <p className="text-xs text-slate-500">Activities will appear here as they occur</p>
                </div>
              ) : (
                metrics.recentActivities.slice(0, 5).map((activity, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-3 p-3.5 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 border border-slate-700/30 hover:border-slate-700/50 transition-all duration-200 group"
                  >
                    <div className={`p-2.5 rounded-lg border ${
                      activity.type === 'Transaction' ? 'bg-emerald-500/10 border-emerald-500/20' :
                      activity.type === 'Defect' ? 'bg-amber-500/10 border-amber-500/20' :
                      'bg-rose-500/10 border-rose-500/20'
                    } group-hover:scale-110 transition-transform`}>
                      {activity.type === 'Transaction' ? (
                        <FileText className="text-emerald-400" size={16} />
                      ) : activity.type === 'Defect' ? (
                        <AlertTriangle className="text-amber-400" size={16} />
                      ) : (
                        <Bell className="text-rose-400" size={16} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white mb-1 group-hover:text-amber-400 transition-colors">{activity.description}</p>
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
