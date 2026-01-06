'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Package, FileText, AlertTriangle, Bell, Calendar, Filter, Download, RefreshCw } from 'lucide-react';
import { getMaterials, getTransactions, getDefects, getAlerts } from '@/lib/storage';
import { exportToCSV } from '@/lib/export';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const materials = getMaterials();
  const transactions = getTransactions();
  const defects = getDefects();
  const alerts = getAlerts();

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(materials.map(m => m.category)))];

  // Filter materials by category
  const filteredMaterials = categoryFilter === 'all' 
    ? materials 
    : materials.filter(m => m.category === categoryFilter);

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    const ranges = {
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      '1y': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      'all': new Date(0),
    };
    return ranges[dateRange];
  };

  const startDate = getDateRange();
  const filteredTransactions = transactions.filter(t => new Date(t.date) >= startDate);
  const filteredDefects = defects.filter(d => new Date(d.reportedDate) >= startDate);
  const filteredAlerts = alerts.filter(a => new Date(a.createdAt) >= startDate);

  // Calculate statistics
  const stats = {
    totalMaterials: filteredMaterials.length,
    totalTransactions: filteredTransactions.length,
    receivingCount: filteredTransactions.filter(t => t.transactionType === 'receiving').length,
    issuanceCount: filteredTransactions.filter(t => t.transactionType === 'issuance').length,
    totalDefects: filteredDefects.length,
    activeAlerts: filteredAlerts.filter(a => !a.acknowledged).length,
    totalInventoryValue: filteredMaterials.reduce((sum, m) => sum + (m.quantity || 0), 0),
  };

  // Transaction trends by day
  const getTransactionTrends = () => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
    const trends: { date: string; receiving: number; issuance: number }[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTransactions = filteredTransactions.filter(t => 
        t.date.startsWith(dateStr)
      );
      
      trends.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        receiving: dayTransactions.filter(t => t.transactionType === 'receiving').length,
        issuance: dayTransactions.filter(t => t.transactionType === 'issuance').length,
      });
    }
    
    return trends;
  };

  const transactionTrends = getTransactionTrends();
  const maxTransactions = Math.max(...transactionTrends.map(t => Math.max(t.receiving, t.issuance)), 1);

  // Material distribution by category
  const categoryDistribution = categories.slice(1).map(cat => ({
    category: cat,
    count: materials.filter(m => m.category === cat).length,
    percentage: (materials.filter(m => m.category === cat).length / materials.length) * 100,
  })).sort((a, b) => b.count - a.count);

  // Defect severity distribution
  const defectSeverity = {
    critical: defects.filter(d => d.severity === 'critical').length,
    high: defects.filter(d => d.severity === 'high').length,
    medium: defects.filter(d => d.severity === 'medium').length,
    low: defects.filter(d => d.severity === 'low').length,
  };

  // Alert severity distribution
  const alertSeverity = {
    critical: alerts.filter(a => a.severity === 'critical').length,
    error: alerts.filter(a => a.severity === 'error').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Force reload by triggering a re-render
    window.location.reload();
  };

  const exportTransactionsCSV = () => {
    const rows = filteredTransactions.map((t) => ({
      date: new Date(t.date).toISOString(),
      type: t.transactionType,
      materialCode: t.materialCode,
      materialDescription: t.materialDescription,
      quantity: t.quantity,
      unit: t.unit,
      user: t.user,
      reference: t.reference,
    }));

    exportToCSV('transactions.csv', rows, [
      { key: 'date', label: 'Date' },
      { key: 'type', label: 'Type' },
      { key: 'materialCode', label: 'Material Code' },
      { key: 'materialDescription', label: 'Description' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'unit', label: 'Unit' },
      { key: 'user', label: 'User' },
      { key: 'reference', label: 'Reference' },
    ]);
  };

  const exportCategoriesCSV = () => {
    const rows = categoryDistribution.map((item) => ({
      category: item.category,
      count: item.count,
      percentage: item.percentage.toFixed(1),
    }));

    exportToCSV('category-distribution.csv', rows, [
      { key: 'category', label: 'Category' },
      { key: 'count', label: 'Count' },
      { key: 'percentage', label: 'Percentage' },
    ]);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-black via-slate-950 to-black border-b border-slate-800/50 px-8 py-7 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">Analytics</h1>
            </div>
            <p className="text-slate-400 text-sm">Deep insights and performance analytics for your material management</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:bg-slate-800 hover:border-slate-700 transition-all duration-200 flex items-center gap-2"
            >
              <RefreshCw className={isRefreshing ? 'animate-spin' : ''} size={18} />
              Refresh
            </button>
            <button
              onClick={exportTransactionsCSV}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 flex items-center gap-2"
            >
              <Download size={16} />
              Export Transactions
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Filters */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-xl border border-slate-800/50 p-6 shadow-lg">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="text-amber-400" size={18} />
              <span className="text-sm font-semibold text-slate-300">Date Range:</span>
            </div>
            {(['7d', '30d', '90d', '1y', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  dateRange === range
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 border border-slate-700/50'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : range === '1y' ? '1 Year' : 'All Time'}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <Filter className="text-amber-400" size={18} />
              <span className="text-sm font-semibold text-slate-300">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-xl border border-slate-800/50 p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase">Total Materials</p>
              <Package className="text-blue-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stats.totalMaterials}</p>
            <p className="text-xs text-slate-500">In selected period</p>
          </div>
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-xl border border-slate-800/50 p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase">Transactions</p>
              <FileText className="text-emerald-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stats.totalTransactions}</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-emerald-400">↑ {stats.receivingCount} Receiving</span>
              <span className="text-slate-500">•</span>
              <span className="text-blue-400">↓ {stats.issuanceCount} Issuance</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-xl border border-slate-800/50 p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase">Defects</p>
              <AlertTriangle className="text-amber-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stats.totalDefects}</p>
            <p className="text-xs text-slate-500">Reported issues</p>
          </div>
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-xl border border-slate-800/50 p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase">Active Alerts</p>
              <Bell className="text-rose-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stats.activeAlerts}</p>
            <p className="text-xs text-slate-500">Requiring attention</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transaction Trends */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-xl border border-slate-800/50 p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="text-amber-400" size={20} />
              Transaction Trends
            </h3>
            <div className="h-64 flex items-end justify-between gap-1">
              {transactionTrends.map((trend, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full flex flex-col items-center gap-1" style={{ height: '200px' }}>
                    <div
                      className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t hover:from-emerald-600 hover:to-emerald-500 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40"
                      style={{ height: `${(trend.receiving / maxTransactions) * 100}%`, minHeight: '4px' }}
                      title={`Receiving: ${trend.receiving}`}
                    />
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t hover:from-blue-600 hover:to-blue-500 transition-all cursor-pointer shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40"
                      style={{ height: `${(trend.issuance / maxTransactions) * 100}%`, minHeight: '4px' }}
                      title={`Issuance: ${trend.issuance}`}
                    />
                  </div>
                  <span className="text-xs text-slate-400 mt-2 font-medium transform -rotate-45 origin-top-left whitespace-nowrap">
                    {trend.date.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                <span className="text-xs text-slate-400">Receiving</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-xs text-slate-400">Issuance</span>
              </div>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-xl border border-slate-800/50 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="text-amber-400" size={20} />
                Material Distribution by Category
              </h3>
              <button
                onClick={exportCategoriesCSV}
                className="px-3 py-2 text-xs font-semibold text-white bg-slate-800/50 border border-slate-700/50 rounded-lg hover:bg-slate-800 hover:border-slate-700 transition-all flex items-center gap-1.5"
              >
                <Download size={14} />
                Export CSV
              </button>
            </div>
            <div className="space-y-4">
              {categoryDistribution.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto text-slate-600 mb-3" size={32} />
                  <p className="text-sm text-slate-400">No categories found</p>
                </div>
              ) : (
                categoryDistribution.map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{item.category}</span>
                      <span className="text-sm font-bold text-slate-300">{item.count} ({item.percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Defect & Alert Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Defect Severity Distribution */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-xl border border-slate-800/50 p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <AlertTriangle className="text-amber-400" size={20} />
              Defect Severity Distribution
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Critical', value: defectSeverity.critical, color: 'from-rose-500 to-rose-600', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
                { label: 'High', value: defectSeverity.high, color: 'from-orange-500 to-orange-600', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
                { label: 'Medium', value: defectSeverity.medium, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                { label: 'Low', value: defectSeverity.low, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
              ].map((item, i) => {
                const total = defectSeverity.critical + defectSeverity.high + defectSeverity.medium + defectSeverity.low;
                const percentage = total > 0 ? (item.value / total) * 100 : 0;
                return (
                  <div key={i} className={`p-4 rounded-lg border ${item.bg} ${item.border}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-white">{item.label}</span>
                      <span className="text-sm font-bold text-white">{item.value}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{percentage.toFixed(1)}% of total defects</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alert Severity Distribution */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-xl border border-slate-800/50 p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Bell className="text-rose-400" size={20} />
              Alert Severity Distribution
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Critical', value: alertSeverity.critical, color: 'from-rose-500 to-rose-600', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
                { label: 'Error', value: alertSeverity.error, color: 'from-orange-500 to-orange-600', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
                { label: 'Warning', value: alertSeverity.warning, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
              ].map((item, i) => {
                const total = alertSeverity.critical + alertSeverity.error + alertSeverity.warning;
                const percentage = total > 0 ? (item.value / total) * 100 : 0;
                return (
                  <div key={i} className={`p-4 rounded-lg border ${item.bg} ${item.border}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-white">{item.label}</span>
                      <span className="text-sm font-bold text-white">{item.value}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{percentage.toFixed(1)}% of total alerts</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Transaction Analysis */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-xl border border-slate-800/50 p-6 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <BarChart3 className="text-amber-400" size={20} />
            Transaction Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700/30">
              <p className="text-sm text-slate-400 mb-2">Receiving Transactions</p>
              <p className="text-3xl font-bold text-emerald-400 mb-1">{stats.receivingCount}</p>
              <p className="text-xs text-slate-500">
                {stats.totalTransactions > 0 
                  ? `${((stats.receivingCount / stats.totalTransactions) * 100).toFixed(1)}% of total`
                  : '0% of total'}
              </p>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700/30">
              <p className="text-sm text-slate-400 mb-2">Issuance Transactions</p>
              <p className="text-3xl font-bold text-blue-400 mb-1">{stats.issuanceCount}</p>
              <p className="text-xs text-slate-500">
                {stats.totalTransactions > 0 
                  ? `${((stats.issuanceCount / stats.totalTransactions) * 100).toFixed(1)}% of total`
                  : '0% of total'}
              </p>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700/30">
              <p className="text-sm text-slate-400 mb-2">Transaction Ratio</p>
              <p className="text-3xl font-bold text-amber-400 mb-1">
                {stats.issuanceCount > 0 
                  ? (stats.receivingCount / stats.issuanceCount).toFixed(2)
                  : stats.receivingCount > 0 ? '∞' : '0'}
              </p>
              <p className="text-xs text-slate-500">Receiving : Issuance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

