'use client';

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Package, AlertTriangle, Calculator, Download, RefreshCw, Calendar, Loader2 } from 'lucide-react';
import { 
  getMaterialsFromSupabase, 
  getTransactionsFromSupabase, 
  getDefectsFromSupabase 
} from '@/lib/supabase-storage';
import { exportToCSV } from '@/lib/export';
import { Material, MaterialTransaction, Defect } from '@/types';

export default function CostAnalysisPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [transactions, setTransactions] = useState<MaterialTransaction[]>([]);
  const [defects, setDefects] = useState<Defect[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [materialsData, transactionsData, defectsData] = await Promise.all([
      getMaterialsFromSupabase(),
      getTransactionsFromSupabase(),
      getDefectsFromSupabase()
    ]);
    setMaterials(materialsData);
    setTransactions(transactionsData);
    setDefects(defectsData);
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

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

  // Mock cost calculation (in real app, this would come from material cost data)
  const calculateMaterialCost = (material: Material) => {
    // Mock: assume average cost per unit based on category
    const baseCosts: { [key: string]: number } = {
      'Electronics': 150,
      'Raw Materials': 50,
      'Components': 75,
      'Packaging': 20,
      'Tools': 200,
      'Default': 100,
    };
    return baseCosts[material.category] || baseCosts['Default'];
  };

  // Calculate costs
  const totalInventoryValue = materials.reduce((sum, m) => {
    const unitCost = calculateMaterialCost(m);
    return sum + (m.quantity * unitCost);
  }, 0);

  const receivingCost = filteredTransactions
    .filter(t => t.transactionType === 'receiving')
    .reduce((sum, t) => {
      const material = materials.find(m => m.materialCode === t.materialCode);
      if (material) {
        const unitCost = calculateMaterialCost(material);
        return sum + (t.quantity * unitCost);
      }
      return sum;
    }, 0);

  const issuanceCost = filteredTransactions
    .filter(t => t.transactionType === 'issuance')
    .reduce((sum, t) => {
      const material = materials.find(m => m.materialCode === t.materialCode);
      if (material) {
        const unitCost = calculateMaterialCost(material);
        return sum + (t.quantity * unitCost);
      }
      return sum;
    }, 0);

  const defectCost = defects.reduce((sum, d) => {
    const material = materials.find(m => m.materialCode === d.materialCode);
    if (material) {
      const unitCost = calculateMaterialCost(material);
      return sum + (d.quantity * unitCost * 0.5); // Assume 50% value loss for defects
    }
    return sum;
  }, 0);

  // Cost by category
  const costByCategory = materials.reduce((acc, m) => {
    const unitCost = calculateMaterialCost(m);
    const totalCost = m.quantity * unitCost;
    const category = m.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = { category, cost: 0, count: 0 };
    }
    acc[category].cost += totalCost;
    acc[category].count += m.quantity;
    return acc;
  }, {} as { [key: string]: { category: string; cost: number; count: number } });

  const categoryCosts = Object.values(costByCategory).sort((a, b) => b.cost - a.cost);

  // Cost trends (simplified)
  const getCostTrends = () => {
    const days = Math.min(dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 14, 14);
    const trends: { date: string; receiving: number; issuance: number }[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTransactions = filteredTransactions.filter(t => 
        t.date.startsWith(dateStr)
      );
      
      const dayReceiving = dayTransactions
        .filter(t => t.transactionType === 'receiving')
        .reduce((sum, t) => {
          const material = materials.find(m => m.materialCode === t.materialCode);
          if (material) {
            return sum + (t.quantity * calculateMaterialCost(material));
          }
          return sum;
        }, 0);
      
      const dayIssuance = dayTransactions
        .filter(t => t.transactionType === 'issuance')
        .reduce((sum, t) => {
          const material = materials.find(m => m.materialCode === t.materialCode);
          if (material) {
            return sum + (t.quantity * calculateMaterialCost(material));
          }
          return sum;
        }, 0);
      
      trends.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        receiving: dayReceiving,
        issuance: dayIssuance,
      });
    }
    
    return trends;
  };

  const costTrends = getCostTrends();
  const maxCost = Math.max(...costTrends.map(t => Math.max(t.receiving, t.issuance)), 1);

  const handleExportReport = () => {
    const periodLabel = dateRange === '7d' ? '7 Days' : dateRange === '30d' ? '30 Days' : dateRange === '90d' ? '90 Days' : dateRange === '1y' ? '1 Year' : 'All Time';
    const rows = [
      { metric: 'Total Inventory Value', value: `$${totalInventoryValue.toLocaleString()}`, period: 'Current' },
      { metric: 'Receiving Costs', value: `$${receivingCost.toLocaleString()}`, period: periodLabel },
      { metric: 'Issuance Costs', value: `$${issuanceCost.toLocaleString()}`, period: periodLabel },
      { metric: 'Defect Losses', value: `$${defectCost.toLocaleString()}`, period: 'All Time' },
      { metric: 'Net Cost Flow', value: `$${(receivingCost - issuanceCost).toLocaleString()}`, period: periodLabel },
      ...categoryCosts.map(item => ({
        metric: `Category: ${item.category}`,
        value: `$${item.cost.toLocaleString()} (${item.count} units)`,
        period: 'Current',
      })),
    ];

    exportToCSV(`cost-analysis-${new Date().toISOString().split('T')[0]}.csv`, rows, [
      { key: 'metric', label: 'Metric' },
      { key: 'value', label: 'Value' },
      { key: 'period', label: 'Period' },
    ]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-amber-500 mx-auto mb-4" size={48} />
          <p className="text-slate-400">Loading cost analysis...</p>
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
            <h1 className="text-xl font-semibold text-white">Cost Analysis</h1>
            <p className="text-sm text-slate-400 mt-1">Comprehensive cost tracking and financial insights</p>
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
              onClick={handleExportReport}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              Export Report
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Date Range Filter */}
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
          </div>
        </div>

        {/* Key Cost Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Total Inventory Value</p>
              <Package className="text-blue-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-white mb-2">${totalInventoryValue.toLocaleString()}</p>
            <p className="text-xs text-slate-500">Current stock value</p>
          </div>
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Receiving Costs</p>
              <TrendingUp className="text-emerald-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-white mb-2">${receivingCost.toLocaleString()}</p>
            <p className="text-xs text-slate-500">In selected period</p>
          </div>
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Issuance Costs</p>
              <TrendingDown className="text-blue-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-white mb-2">${issuanceCost.toLocaleString()}</p>
            <p className="text-xs text-slate-500">In selected period</p>
          </div>
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Defect Losses</p>
              <AlertTriangle className="text-rose-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-white mb-2">${defectCost.toLocaleString()}</p>
            <p className="text-xs text-slate-500">Estimated value loss</p>
          </div>
        </div>

        {/* Cost Trends Chart */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="text-slate-400" size={20} />
            Cost Trends Over Time
          </h3>
          <div className="h-64 flex items-end justify-between gap-1 overflow-x-auto">
            {costTrends.map((trend, i) => (
              <div key={i} className="flex-1 min-w-[30px] flex flex-col items-center gap-1 group">
                <div className="w-full flex flex-col items-center gap-1" style={{ height: '200px' }}>
                  <div
                    className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t transition-all cursor-pointer"
                    style={{ height: `${(trend.receiving / Math.max(maxCost, 1)) * 100}%`, minHeight: '4px' }}
                    title={`Receiving: $${trend.receiving.toLocaleString()}`}
                  />
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all cursor-pointer"
                    style={{ height: `${(trend.issuance / Math.max(maxCost, 1)) * 100}%`, minHeight: '4px' }}
                    title={`Issuance: $${trend.issuance.toLocaleString()}`}
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
              <span className="text-xs text-slate-400">Receiving Costs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-xs text-slate-400">Issuance Costs</span>
            </div>
          </div>
        </div>

        {/* Cost by Category */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Calculator className="text-slate-400" size={20} />
              Cost Distribution by Category
            </h3>
            <div className="space-y-4">
              {categoryCosts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto text-slate-600 mb-3" size={32} />
                  <p className="text-sm text-slate-400">No category data available</p>
                </div>
              ) : (
                categoryCosts.slice(0, 5).map((item, i) => {
                  const percentage = totalInventoryValue > 0 ? (item.cost / totalInventoryValue) * 100 : 0;
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">{item.category}</span>
                        <div className="text-right">
                          <span className="text-sm font-bold text-slate-300">${item.cost.toLocaleString()}</span>
                          <span className="text-xs text-slate-500 ml-2">({item.count} units)</span>
                        </div>
                      </div>
                      <div className="h-3 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500">{percentage.toFixed(1)}% of total inventory value</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <DollarSign className="text-slate-400" size={20} />
              Cost Summary
            </h3>
            <div className="space-y-4">
              <div className="bg-slate-900 rounded-lg p-5 border border-slate-700">
                <p className="text-sm text-slate-400 mb-2">Net Cost Flow</p>
                <p className="text-2xl font-bold text-white mb-1">
                  ${(receivingCost - issuanceCost).toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">
                  {receivingCost > issuanceCost ? 'Net increase in inventory value' : 'Net decrease in inventory value'}
                </p>
              </div>
              <div className="bg-slate-900 rounded-lg p-5 border border-slate-700">
                <p className="text-sm text-slate-400 mb-2">Cost Efficiency Ratio</p>
                <p className="text-2xl font-bold text-white mb-1">
                  {issuanceCost > 0 ? (receivingCost / issuanceCost).toFixed(2) : 'N/A'}
                </p>
                <p className="text-xs text-slate-500">Receiving to Issuance ratio</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-5 border border-slate-700">
                <p className="text-sm text-slate-400 mb-2">Average Cost per Transaction</p>
                <p className="text-2xl font-bold text-white mb-1">
                  ${filteredTransactions.length > 0 
                    ? ((receivingCost + issuanceCost) / filteredTransactions.length).toLocaleString(undefined, { maximumFractionDigits: 2 })
                    : '0'}
                </p>
                <p className="text-xs text-slate-500">Based on {filteredTransactions.length} transactions</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-5 border border-rose-700">
                <p className="text-sm text-slate-400 mb-2">Total Estimated Losses</p>
                <p className="text-2xl font-bold text-rose-400 mb-1">
                  ${defectCost.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">From {defects.length} defect reports</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
