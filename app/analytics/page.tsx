'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Package, FileText, AlertTriangle, Bell, Calendar, Filter, Download, RefreshCw, Loader2 } from 'lucide-react';
import { 
  getMaterialsFromSupabase, 
  getTransactionsFromSupabase, 
  getDefectsFromSupabase, 
  getAlertsFromSupabase 
} from '@/lib/supabase-storage';
import { Material, MaterialTransaction, Defect, Alert } from '@/types';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [transactions, setTransactions] = useState<MaterialTransaction[]>([]);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

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
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(materials.map(m => m.category).filter(Boolean)))];

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
    
    for (let i = Math.min(days, 30) - 1; i >= 0; i--) {
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
    percentage: materials.length > 0 ? (materials.filter(m => m.category === cat).length / materials.length) * 100 : 0,
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

  const exportAnalyticsPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      const periodLabel = dateRange === '7d' ? '7 Days' : dateRange === '30d' ? '30 Days' : dateRange === '90d' ? '90 Days' : dateRange === '1y' ? '1 Year' : 'All Time';
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(41, 37, 36);
      doc.text('Analytics Report', 14, 22);
      
      // Subtitle
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Period: ${periodLabel}`, 14, 36);
      doc.text(`Category Filter: ${categoryFilter === 'all' ? 'All Categories' : categoryFilter}`, 14, 42);

      // Key Metrics Section
      doc.setFontSize(14);
      doc.setTextColor(41, 37, 36);
      doc.text('Key Metrics', 14, 56);

      const metricsData = [
        ['Total Materials', stats.totalMaterials.toString()],
        ['Total Transactions', stats.totalTransactions.toString()],
        ['Receiving Transactions', stats.receivingCount.toString()],
        ['Issuance Transactions', stats.issuanceCount.toString()],
        ['Total Defects', stats.totalDefects.toString()],
        ['Active Alerts', stats.activeAlerts.toString()],
        ['Total Inventory Units', stats.totalInventoryValue.toLocaleString()],
      ];

      autoTable(doc, {
        startY: 61,
        head: [['Metric', 'Value']],
        body: metricsData,
        theme: 'striped',
        headStyles: { 
          fillColor: [245, 158, 11],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 10,
          cellPadding: 4
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        }
      });

      // Category Distribution Section
      let finalY = (doc as any).lastAutoTable.finalY || 130;
      
      doc.setFontSize(14);
      doc.setTextColor(41, 37, 36);
      doc.text('Material Distribution by Category', 14, finalY + 15);

      const categoryData = categoryDistribution.map(item => [
        item.category || 'Uncategorized',
        item.count.toString(),
        `${item.percentage.toFixed(1)}%`
      ]);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Category', 'Count', 'Percentage']],
        body: categoryData,
        theme: 'striped',
        headStyles: { 
          fillColor: [245, 158, 11],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 10,
          cellPadding: 4
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        }
      });

      // Defect Severity Section
      finalY = (doc as any).lastAutoTable.finalY || 200;
      
      // Check if we need a new page
      if (finalY > 230) {
        doc.addPage();
        finalY = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(41, 37, 36);
      doc.text('Defect Severity Distribution', 14, finalY + 15);

      const totalDefects = defectSeverity.critical + defectSeverity.high + defectSeverity.medium + defectSeverity.low;
      const defectData = [
        ['Critical', defectSeverity.critical.toString(), totalDefects > 0 ? `${((defectSeverity.critical / totalDefects) * 100).toFixed(1)}%` : '0%'],
        ['High', defectSeverity.high.toString(), totalDefects > 0 ? `${((defectSeverity.high / totalDefects) * 100).toFixed(1)}%` : '0%'],
        ['Medium', defectSeverity.medium.toString(), totalDefects > 0 ? `${((defectSeverity.medium / totalDefects) * 100).toFixed(1)}%` : '0%'],
        ['Low', defectSeverity.low.toString(), totalDefects > 0 ? `${((defectSeverity.low / totalDefects) * 100).toFixed(1)}%` : '0%'],
      ];

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Severity', 'Count', 'Percentage']],
        body: defectData,
        theme: 'striped',
        headStyles: { 
          fillColor: [245, 158, 11],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 10,
          cellPadding: 4
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        }
      });

      doc.save(`analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-amber-500 mx-auto mb-4" size={48} />
          <p className="text-slate-400">Loading analytics...</p>
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
            <h1 className="text-xl font-semibold text-white">Analytics</h1>
            <p className="text-sm text-slate-400 mt-1">Deep insights and performance analytics</p>
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
            <button
              onClick={exportAnalyticsPDF}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Filters */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="text-slate-400" size={18} />
              <span className="text-sm font-medium text-slate-300">Date Range:</span>
            </div>
            {(['7d', '30d', '90d', '1y', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  dateRange === range
                    ? 'bg-slate-700 text-white border border-slate-600'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : range === '1y' ? '1 Year' : 'All Time'}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <Filter className="text-slate-400" size={18} />
              <span className="text-sm font-medium text-slate-300">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
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
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Total Materials</p>
              <Package className="text-blue-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-white mb-2">{stats.totalMaterials}</p>
            <p className="text-xs text-slate-500">In selected period</p>
          </div>
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Transactions</p>
              <FileText className="text-emerald-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-white mb-2">{stats.totalTransactions}</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-emerald-400 font-medium">↑ {stats.receivingCount} Receiving</span>
              <span className="text-slate-500">•</span>
              <span className="text-blue-400 font-medium">↓ {stats.issuanceCount} Issuance</span>
            </div>
          </div>
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Defects</p>
              <AlertTriangle className="text-amber-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-white mb-2">{stats.totalDefects}</p>
            <p className="text-xs text-slate-500">Reported issues</p>
          </div>
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Active Alerts</p>
              <Bell className="text-rose-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-white mb-2">{stats.activeAlerts}</p>
            <p className="text-xs text-slate-500">Requiring attention</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transaction Trends */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="text-slate-400" size={20} />
              Transaction Trends
            </h3>
            <div className="h-64 flex items-end justify-between gap-1 overflow-x-auto">
              {transactionTrends.slice(-14).map((trend, i) => (
                <div key={i} className="flex-1 min-w-[20px] flex flex-col items-center gap-1 group">
                  <div className="w-full flex flex-col items-center gap-1" style={{ height: '200px' }}>
                    <div
                      className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t transition-all cursor-pointer"
                      style={{ height: `${(trend.receiving / Math.max(maxTransactions, 1)) * 100}%`, minHeight: '4px' }}
                      title={`Receiving: ${trend.receiving}`}
                    />
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all cursor-pointer"
                      style={{ height: `${(trend.issuance / Math.max(maxTransactions, 1)) * 100}%`, minHeight: '4px' }}
                      title={`Issuance: ${trend.issuance}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                    {trend.date.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-700">
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
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <BarChart3 className="text-slate-400" size={20} />
              Material Distribution by Category
            </h3>
            <div className="space-y-4">
              {categoryDistribution.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto text-slate-600 mb-3" size={32} />
                  <p className="text-sm text-slate-400">No categories found</p>
                </div>
              ) : (
                categoryDistribution.slice(0, 5).map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{item.category || 'Uncategorized'}</span>
                      <span className="text-sm font-bold text-slate-300">{item.count} ({item.percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="h-3 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
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
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <AlertTriangle className="text-slate-400" size={20} />
              Defect Severity Distribution
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Critical', value: defectSeverity.critical, color: 'bg-rose-600' },
                { label: 'High', value: defectSeverity.high, color: 'bg-orange-600' },
                { label: 'Medium', value: defectSeverity.medium, color: 'bg-amber-600' },
                { label: 'Low', value: defectSeverity.low, color: 'bg-blue-600' },
              ].map((item, i) => {
                const total = defectSeverity.critical + defectSeverity.high + defectSeverity.medium + defectSeverity.low;
                const percentage = total > 0 ? (item.value / total) * 100 : 0;
                return (
                  <div key={i} className="p-4 bg-slate-900 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{item.label}</span>
                      <span className="text-sm font-bold text-white">{item.value}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{percentage.toFixed(1)}% of total defects</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alert Severity Distribution */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Bell className="text-slate-400" size={20} />
              Alert Severity Distribution
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Critical', value: alertSeverity.critical, color: 'bg-rose-600' },
                { label: 'Error', value: alertSeverity.error, color: 'bg-orange-600' },
                { label: 'Warning', value: alertSeverity.warning, color: 'bg-amber-600' },
              ].map((item, i) => {
                const total = alertSeverity.critical + alertSeverity.error + alertSeverity.warning;
                const percentage = total > 0 ? (item.value / total) * 100 : 0;
                return (
                  <div key={i} className="p-4 bg-slate-900 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{item.label}</span>
                      <span className="text-sm font-bold text-white">{item.value}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{percentage.toFixed(1)}% of total alerts</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Transaction Analysis */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <BarChart3 className="text-slate-400" size={20} />
            Transaction Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 rounded-lg p-5 border border-slate-700">
              <p className="text-sm text-slate-400 mb-2">Receiving Transactions</p>
              <p className="text-3xl font-bold text-emerald-400 mb-1">{stats.receivingCount}</p>
              <p className="text-xs text-slate-500">
                {stats.totalTransactions > 0 
                  ? `${((stats.receivingCount / stats.totalTransactions) * 100).toFixed(1)}% of total`
                  : '0% of total'}
              </p>
            </div>
            <div className="bg-slate-900 rounded-lg p-5 border border-slate-700">
              <p className="text-sm text-slate-400 mb-2">Issuance Transactions</p>
              <p className="text-3xl font-bold text-blue-400 mb-1">{stats.issuanceCount}</p>
              <p className="text-xs text-slate-500">
                {stats.totalTransactions > 0 
                  ? `${((stats.issuanceCount / stats.totalTransactions) * 100).toFixed(1)}% of total`
                  : '0% of total'}
              </p>
            </div>
            <div className="bg-slate-900 rounded-lg p-5 border border-slate-700">
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
