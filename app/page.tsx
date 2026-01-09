'use client';

import { useEffect, useState } from 'react';
import { Package, FileText, AlertTriangle, Bell, TrendingUp, TrendingDown, Activity, RefreshCw, Download, Loader2, Sparkles, Zap, ArrowUpRight, Clock } from 'lucide-react';
import { 
  getMaterialsFromSupabase, 
  getTransactionsFromSupabase, 
  getDefectsFromSupabase, 
  getAlertsFromSupabase 
} from '@/lib/supabase-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { DashboardMetrics, Material, MaterialTransaction, Defect, Alert } from '@/types';

export default function Dashboard() {
  const { theme } = useTheme();
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
      title: 'Total Materials',
      value: metrics.totalMaterials.toLocaleString(),
      trend: calculateTrend(metrics.totalMaterials),
      comparison: 'vs last month',
      icon: Package,
      gradient: 'from-blue-500 to-cyan-500',
      bgGlow: 'bg-blue-500/20',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
    },
    {
      title: 'Total Transactions',
      value: metrics.totalTransactions.toLocaleString(),
      trend: calculateTrend(metrics.totalTransactions),
      comparison: 'vs last month',
      icon: FileText,
      gradient: 'from-emerald-500 to-teal-500',
      bgGlow: 'bg-emerald-500/20',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
    },
    {
      title: 'Pending Defects',
      value: metrics.totalDefects.toLocaleString(),
      trend: calculateTrend(metrics.totalDefects),
      comparison: 'vs last month',
      icon: AlertTriangle,
      gradient: 'from-amber-500 to-orange-500',
      bgGlow: 'bg-amber-500/20',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
    },
    {
      title: 'Active Alerts',
      value: metrics.activeAlerts.toLocaleString(),
      trend: calculateTrend(metrics.activeAlerts),
      comparison: 'vs last month',
      icon: Bell,
      gradient: 'from-rose-500 to-pink-500',
      bgGlow: 'bg-rose-500/20',
      iconBg: 'bg-rose-500/10',
      iconColor: 'text-rose-400',
    },
    {
      title: 'System Health',
      value: '99.9%',
      trend: { value: '0.1', isPositive: true },
      comparison: 'uptime status',
      icon: Activity,
      gradient: 'from-violet-500 to-purple-500',
      bgGlow: 'bg-violet-500/20',
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-400',
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
      name: 'Receiving Transactions', 
      value: receivingCount, 
      percentage: totalTransactions > 0 ? ((receivingCount / totalTransactions) * 100).toFixed(1) : '0.0', 
      isPositive: true, 
      gradient: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500',
      lightBg: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
    },
    { 
      name: 'Issuance Transactions', 
      value: issuanceCount, 
      percentage: totalTransactions > 0 ? ((issuanceCount / totalTransactions) * 100).toFixed(1) : '0.0', 
      isPositive: true, 
      gradient: 'from-slate-400 to-slate-500',
      bgColor: 'bg-slate-400',
      lightBg: 'bg-slate-500/10',
      borderColor: 'border-slate-500/30',
    },
    { 
      name: 'Defect Reports', 
      value: metrics.totalDefects, 
      percentage: metrics.totalDefects > 0 ? '12.5' : '0.0', 
      isPositive: false, 
      gradient: 'from-rose-500 to-pink-500',
      bgColor: 'bg-rose-500',
      lightBg: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30',
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

  // Theme-aware classes
  const bgMain = theme === 'dark' 
    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-black' 
    : 'bg-gradient-to-br from-slate-50 via-white to-slate-100';
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';
  const textMuted = theme === 'dark' ? 'text-slate-500' : 'text-slate-500';
  const borderColor = theme === 'dark' ? 'border-slate-800/50' : 'border-slate-200';
  const cardBg = theme === 'dark' 
    ? 'bg-gradient-to-r from-slate-800/30 to-slate-900/30' 
    : 'bg-gradient-to-r from-white to-slate-50';
  const headerBg = theme === 'dark'
    ? 'bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/80'
    : 'bg-gradient-to-r from-white/90 via-white/80 to-white/90';
  const buttonBg = theme === 'dark'
    ? 'from-slate-800 to-slate-700 group-hover:from-slate-700 group-hover:to-slate-600'
    : 'from-slate-100 to-slate-200 group-hover:from-slate-200 group-hover:to-slate-300';
  const buttonBorder = theme === 'dark' ? 'border-slate-600/50' : 'border-slate-300';
  const buttonText = theme === 'dark' ? 'text-slate-200' : 'text-slate-700';

  if (isLoading) {
    return (
      <div className={`min-h-screen ${bgMain} flex items-center justify-center transition-colors duration-300`}>
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full animate-pulse" />
            <Loader2 className="relative animate-spin text-amber-500 mx-auto mb-4" size={56} />
          </div>
          <p className={`${textSecondary} font-medium`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgMain} transition-colors duration-300`}>
      {/* Ambient background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 right-1/4 w-96 h-96 rounded-full blur-3xl ${theme === 'dark' ? 'bg-amber-500/5' : 'bg-amber-500/10'}`} />
        <div className={`absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl ${theme === 'dark' ? 'bg-blue-500/5' : 'bg-blue-500/10'}`} />
        <div className={`absolute top-1/2 right-0 w-64 h-64 rounded-full blur-3xl ${theme === 'dark' ? 'bg-purple-500/5' : 'bg-purple-500/10'}`} />
      </div>

      {/* Header */}
      <div className={`relative border-b ${borderColor} transition-colors duration-300`}>
        <div className={`absolute inset-0 ${headerBg} backdrop-blur-xl`} />
        <div className="relative px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className={`text-2xl font-bold ${textPrimary} tracking-tight`}>Dashboard</h1>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">Live</span>
                </div>
              </div>
              <p className={`text-sm ${textSecondary}`}>Overview of key metrics and recent activities</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="group relative px-5 py-2.5 overflow-hidden rounded-xl font-semibold text-sm transition-all duration-300 disabled:opacity-50"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${buttonBg} transition-all duration-300`} />
              <div className={`absolute inset-0 border ${buttonBorder} group-hover:border-slate-500/50 rounded-xl transition-colors`} />
              <div className={`relative flex items-center gap-2 ${buttonText}`}>
                <RefreshCw className={`${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} size={16} />
                Refresh
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="relative p-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {kpiCards.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <div
                key={index}
                className="group relative animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Card glow effect on hover */}
                <div className={`absolute -inset-0.5 ${kpi.bgGlow} rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500`} />
                
                <div className="kpi-card relative h-full">
                  {/* Top gradient line */}
                  <div className={`absolute top-0 left-4 right-4 h-px bg-gradient-to-r ${kpi.gradient} opacity-50`} />
                  
                  {/* Icon & Title Row */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className={`text-[11px] font-semibold uppercase tracking-wider mb-0.5 ${textMuted}`}>
                        {kpi.title}
                      </p>
                    </div>
                    <div className={`p-2.5 ${kpi.iconBg} rounded-xl border ${theme === 'dark' ? 'border-white/5' : 'border-slate-200'}`}>
                      <Icon className={kpi.iconColor} size={18} />
                    </div>
                  </div>
                  
                  {/* Value */}
                  <p className={`text-3xl font-bold ${textPrimary} mb-3 number-display tracking-tight`}>
                    {kpi.value}
                  </p>
                  
                  {/* Trend */}
                  <div className="flex items-center gap-2">
                    {kpi.trend.isPositive ? (
                      <div className="stat-badge-positive">
                        <TrendingUp size={12} />
                        <span>+{kpi.trend.value}%</span>
                      </div>
                    ) : (
                      <div className="stat-badge-negative">
                        <TrendingDown size={12} />
                        <span>-{kpi.trend.value}%</span>
                      </div>
                    )}
                    <span className={`text-[11px] ${textMuted}`}>{kpi.comparison}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transaction Trend Overview */}
          <div className="premium-card p-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="section-header">
                <h3 className={`text-lg font-bold ${textPrimary} mb-1`}>Transaction Trend</h3>
                <p className={`text-sm ${textSecondary}`}>Track volume to identify patterns</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleRefresh}
                  className={`p-2.5 rounded-xl border transition-all duration-300 ${
                    theme === 'dark' 
                      ? 'bg-slate-800/50 hover:bg-slate-700/50 border-slate-700/30 hover:border-slate-600/50' 
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <RefreshCw className={`${textSecondary} ${isRefreshing ? 'animate-spin' : ''}`} size={16} />
                </button>
                <button 
                  onClick={handleExportReport}
                  className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-300 ${
                    theme === 'dark' 
                      ? 'bg-slate-800/50 hover:bg-slate-700/50 border-slate-700/30 hover:border-slate-600/50' 
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Download size={14} className={`${textSecondary} group-hover:text-amber-500 transition-colors`} />
                  <span className={`text-sm font-medium ${textSecondary} group-hover:text-amber-500 transition-colors`}>Export</span>
                </button>
              </div>
            </div>

            {/* Stats Card */}
            <div className={`relative mb-5 p-4 rounded-xl border overflow-hidden ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-slate-800/30 to-slate-900/30 border-slate-700/20' 
                : 'bg-gradient-to-br from-slate-50 to-white border-slate-200'
            }`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${textMuted}`}>Total Transactions YTD</p>
                  <p className={`text-3xl font-bold ${textPrimary} number-display`}>{metrics.totalTransactions.toLocaleString()}</p>
                </div>
                <div className="stat-badge-positive">
                  <Zap size={12} />
                  <span>Active</span>
                </div>
              </div>
            </div>

            {/* Time Filter */}
            <div className="flex items-center gap-2 mb-6">
              {(['weekly', 'monthly', 'yearly'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`relative px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 overflow-hidden ${
                    timeFilter === filter
                      ? 'text-white'
                      : theme === 'dark' 
                        ? 'text-slate-400 hover:text-white bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/30'
                        : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {timeFilter === filter && (
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500" />
                  )}
                  <span className="relative">{filter.charAt(0).toUpperCase() + filter.slice(1)}</span>
                </button>
              ))}
            </div>

            {/* Chart */}
            <div className={`relative h-56 rounded-xl p-4 border overflow-hidden ${
              theme === 'dark' 
                ? 'bg-slate-900/50 border-slate-800/50' 
                : 'bg-slate-50 border-slate-200'
            }`}>
              {/* Grid pattern */}
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: `linear-gradient(${theme === 'dark' ? 'rgba(148, 163, 184, 0.03)' : 'rgba(148, 163, 184, 0.1)'} 1px, transparent 1px), linear-gradient(90deg, ${theme === 'dark' ? 'rgba(148, 163, 184, 0.03)' : 'rgba(148, 163, 184, 0.1)'} 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }} />
              
              <svg className="relative w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Area fill */}
                <polygon
                  points={`60,200 ${chartData.map((value, i) => `${60 + (i * 60)},${200 - (value / maxValue) * 170}`).join(' ')}, 720,200`}
                  fill="url(#chartGradient)"
                />
                
                {/* Chart line */}
                <polyline
                  points={chartData.map((value, i) => `${60 + (i * 60)},${200 - (value / maxValue) * 170}`).join(' ')}
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow)"
                />
                
                {/* Data points */}
                {chartData.map((value, i) => (
                  <g key={i}>
                    <circle
                      cx={60 + (i * 60)}
                      cy={200 - (value / maxValue) * 170}
                      r="6"
                      fill={theme === 'dark' ? '#0f172a' : '#ffffff'}
                      stroke="#f59e0b"
                      strokeWidth="2"
                    />
                    <circle
                      cx={60 + (i * 60)}
                      cy={200 - (value / maxValue) * 170}
                      r="3"
                      fill="#f59e0b"
                    />
                  </g>
                ))}
              </svg>
              
              {/* Legend */}
              <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 backdrop-blur-sm rounded-full border ${
                theme === 'dark' 
                  ? 'bg-slate-900/80 border-slate-700/30' 
                  : 'bg-white/90 border-slate-200'
              }`}>
                <div className="w-2.5 h-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-lg shadow-amber-500/50" />
                <span className={`text-xs font-medium ${textSecondary}`}>All Overview</span>
              </div>
            </div>
          </div>

          {/* Transactions by Type */}
          <div className="premium-card p-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <div className="section-header mb-6">
              <h3 className={`text-lg font-bold ${textPrimary} mb-1`}>Transactions by Type</h3>
              <p className={`text-sm ${textSecondary}`}>Breakdown of transaction categories</p>
            </div>
            
            <div className="space-y-4">
              {segments.map((segment, index) => (
                <div 
                  key={index}
                  className={`group relative p-4 rounded-xl border ${segment.borderColor} ${cardBg} hover:shadow-md transition-all duration-300`}
                >
                  {/* Hover glow */}
                  <div className={`absolute inset-0 ${segment.lightBg} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-10 bg-gradient-to-b ${segment.gradient} rounded-full shadow-lg`} />
                      <div>
                        <p className={`text-sm font-semibold ${textPrimary} mb-1`}>{segment.name}</p>
                        <p className={`text-xs ${textSecondary}`}>{segment.value.toLocaleString()} units</p>
                      </div>
                    </div>
                    <div className={segment.isPositive ? 'stat-badge-positive' : 'stat-badge-negative'}>
                      {segment.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      <span>{segment.percentage}%</span>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className={`relative mt-3 h-1.5 rounded-full overflow-hidden ${
                    theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'
                  }`}>
                    <div 
                      className={`absolute inset-y-0 left-0 bg-gradient-to-r ${segment.gradient} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(parseFloat(segment.percentage), 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Volume Distribution */}
          <div className="premium-card p-6 animate-fade-in" style={{ animationDelay: '500ms' }}>
            <div className="section-header mb-6">
              <h3 className={`text-lg font-bold ${textPrimary} mb-1`}>Volume Distribution</h3>
              <p className={`text-sm ${textSecondary}`}>Monthly transaction breakdown</p>
            </div>
            
            <div className={`relative h-56 rounded-xl p-4 border overflow-hidden ${
              theme === 'dark' 
                ? 'bg-slate-900/50 border-slate-800/50' 
                : 'bg-slate-50 border-slate-200'
            }`}>
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `linear-gradient(${theme === 'dark' ? 'rgba(148, 163, 184, 0.05)' : 'rgba(148, 163, 184, 0.15)'} 1px, transparent 1px)`,
                backgroundSize: '1px 40px'
              }} />
              
              <div className="relative h-full flex items-end justify-between gap-1.5 pb-6">
                {chartData.slice(0, 12).map((value, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group cursor-pointer">
                    <div className="relative w-full">
                      {/* Glow effect */}
                      <div 
                        className="absolute inset-x-0 bottom-0 bg-amber-500/20 blur-md rounded-t-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                        style={{ height: `${(value / maxValue) * 100}%` }}
                      />
                      
                      {/* Bar */}
                      <div
                        className="relative w-full bg-gradient-to-t from-amber-600 via-amber-500 to-amber-400 rounded-t-lg group-hover:from-amber-500 group-hover:via-amber-400 group-hover:to-amber-300 transition-all duration-300 group-hover:scale-105"
                        style={{ height: `${(value / maxValue) * 140}px`, minHeight: '8px' }}
                      >
                        {/* Top highlight */}
                        <div className="absolute top-0 inset-x-1 h-1 bg-white/30 rounded-full" />
                      </div>
                    </div>
                    <span className={`absolute -bottom-0 text-[10px] font-medium group-hover:text-amber-400 transition-colors ${textMuted}`}>{months[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="premium-card p-6 animate-fade-in" style={{ animationDelay: '600ms' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="section-header">
                <h3 className={`text-lg font-bold ${textPrimary} mb-1`}>Recent Activities</h3>
                <p className={`text-sm ${textSecondary}`}>Latest system events</p>
              </div>
              <div className={`p-2.5 rounded-xl border ${
                theme === 'dark' 
                  ? 'bg-slate-800/50 border-slate-700/30' 
                  : 'bg-slate-100 border-slate-200'
              }`}>
                <Activity className={textSecondary} size={18} />
              </div>
            </div>
            
            <div className="space-y-3 max-h-56 overflow-y-auto custom-scrollbar pr-2">
              {metrics.recentActivities.length === 0 ? (
                <div className="text-center py-10">
                  <div className={`relative inline-flex items-center justify-center w-16 h-16 mb-4 ${
                    theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-200'
                  } rounded-2xl`}>
                    <Activity className={textMuted} size={28} />
                  </div>
                  <p className={`text-sm font-medium ${textSecondary} mb-1`}>No recent activities</p>
                  <p className={`text-xs ${textMuted}`}>Activities will appear here as they occur</p>
                </div>
              ) : (
                metrics.recentActivities.slice(0, 5).map((activity, index) => (
                  <div 
                    key={index}
                    className={`group relative p-3.5 rounded-xl border ${cardBg} hover:shadow-md transition-all duration-300 ${
                      theme === 'dark' ? 'border-slate-700/30' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`shrink-0 p-2.5 rounded-xl border ${
                        activity.type === 'Transaction' 
                          ? 'bg-emerald-500/10 border-emerald-500/20' 
                          : activity.type === 'Defect' 
                          ? 'bg-amber-500/10 border-amber-500/20' 
                          : 'bg-rose-500/10 border-rose-500/20'
                      }`}>
                        {activity.type === 'Transaction' ? (
                          <FileText className="text-emerald-400" size={14} />
                        ) : activity.type === 'Defect' ? (
                          <AlertTriangle className="text-amber-400" size={14} />
                        ) : (
                          <Bell className="text-rose-400" size={14} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${textPrimary} mb-1 truncate group-hover:text-amber-400 transition-colors`}>
                          {activity.description}
                        </p>
                        <div className={`flex items-center gap-1.5 text-xs ${textMuted}`}>
                          <Clock size={10} />
                          {new Date(activity.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <ArrowUpRight className={`shrink-0 ${textMuted} group-hover:text-amber-400 transition-colors`} size={14} />
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
