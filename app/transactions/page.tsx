'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, FileText, Loader2 } from 'lucide-react';
import { 
  getTransactionsFromSupabase, 
  saveTransactionToSupabase, 
  getMaterialsFromSupabase,
  updateMaterialQuantity,
  generateId 
} from '@/lib/supabase-storage';
import { MaterialTransaction, Material } from '@/types';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<MaterialTransaction[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<MaterialTransaction>>({
    materialCode: '',
    materialDescription: '',
    transactionType: 'receiving',
    quantity: 0,
    unit: '',
    user: '',
    reference: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [transactionsData, materialsData] = await Promise.all([
      getTransactionsFromSupabase(),
      getMaterialsFromSupabase()
    ]);
    setTransactions(transactionsData);
    setMaterials(materialsData);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.materialCode) {
      alert('Please select a material');
      return;
    }
    if (!formData.quantity || formData.quantity <= 0) {
      alert('Please enter a valid quantity (greater than 0)');
      return;
    }
    if (!formData.user?.trim()) {
      alert('Please enter a user name');
      return;
    }
    if (!formData.reference?.trim()) {
      alert('Please enter a reference');
      return;
    }
    
    const selectedMaterial = materials.find(m => m.materialCode === formData.materialCode);
    
    // Check if issuance quantity exceeds available quantity
    if (formData.transactionType === 'issuance' && selectedMaterial) {
      if (formData.quantity > selectedMaterial.quantity) {
        if (!confirm(`Warning: Issuing ${formData.quantity} ${formData.unit || selectedMaterial.unit} but only ${selectedMaterial.quantity} available. Continue anyway?`)) {
          return;
        }
      }
    }

    setIsSaving(true);
    
    const transaction: MaterialTransaction = {
      id: generateId(),
      materialCode: formData.materialCode!,
      materialDescription: formData.materialDescription || selectedMaterial?.description || '',
      transactionType: formData.transactionType as 'receiving' | 'issuance',
      quantity: formData.quantity || 0,
      unit: formData.unit || selectedMaterial?.unit || '',
      date: new Date().toISOString(),
      user: formData.user!.trim(),
      reference: formData.reference!.trim(),
      notes: formData.notes?.trim(),
    };
    
    const success = await saveTransactionToSupabase(transaction);
    
    if (success) {
      // Update material quantity
      await updateMaterialQuantity(
        transaction.materialCode, 
        transaction.quantity, 
        transaction.transactionType
      );
      
      await loadData();
      setIsModalOpen(false);
      resetForm();
    } else {
      alert('Failed to save transaction. Please try again.');
    }
    
    setIsSaving(false);
  };

  const handleMaterialChange = (materialCode: string) => {
    const material = materials.find(m => m.materialCode === materialCode);
    setFormData({
      ...formData,
      materialCode,
      materialDescription: material?.description || '',
      unit: material?.unit || '',
    });
  };

  const resetForm = () => {
    setFormData({
      materialCode: '',
      materialDescription: '',
      transactionType: 'receiving',
      quantity: 0,
      unit: '',
      user: '',
      reference: '',
      notes: '',
    });
  };

  const filteredTransactions = transactions.filter(t => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      t.materialCode?.toLowerCase().includes(search) ||
      t.materialDescription?.toLowerCase().includes(search) ||
      t.reference?.toLowerCase().includes(search) ||
      t.user?.toLowerCase().includes(search) ||
      t.transactionType?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-8 py-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">Material Transactions</h1>
            <p className="text-sm text-slate-400 mt-1">Record material receiving and issuance activities</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            New Transaction
          </button>
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-slate-600 transition-all bg-slate-900 text-white placeholder-slate-500"
            />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Material Code</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Reference</th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Loader2 className="animate-spin text-amber-500 mb-4" size={32} />
                        <p className="text-slate-400">Loading transactions...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="p-4 bg-slate-900 rounded-full mb-4">
                          <FileText className="text-slate-400" size={32} />
                        </div>
                        <p className="text-slate-300 font-medium mb-1">No transactions found</p>
                        <p className="text-slate-500 text-sm">Create your first transaction to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-slate-700 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {new Date(transaction.date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          transaction.transactionType === 'receiving'
                            ? 'bg-emerald-900 text-emerald-300'
                            : 'bg-blue-900 text-blue-300'
                        }`}>
                          {transaction.transactionType === 'receiving' ? 'Receiving' : 'Issuance'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{transaction.materialCode}</td>
                      <td className="px-6 py-4 text-sm text-slate-300 max-w-xs truncate">{transaction.materialDescription}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">{transaction.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{transaction.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{transaction.user}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{transaction.reference}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="premium-card p-8 w-full max-w-md animate-slide-in max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-2xl font-bold text-white mb-6">New Transaction</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-dark">Transaction Type</label>
                <select
                  required
                  value={formData.transactionType}
                  onChange={(e) => setFormData({ ...formData, transactionType: e.target.value as 'receiving' | 'issuance' })}
                  className="select-dark"
                >
                  <option value="receiving">Receiving</option>
                  <option value="issuance">Issuance</option>
                </select>
              </div>
              <div>
                <label className="label-dark">Material</label>
                <select
                  required
                  value={formData.materialCode}
                  onChange={(e) => handleMaterialChange(e.target.value)}
                  className="select-dark"
                >
                  <option value="">Select Material</option>
                  {materials.map((material) => (
                    <option key={material.id} value={material.materialCode}>
                      {material.materialCode} - {material.description}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-dark">Quantity</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                    className="input-dark"
                  />
                </div>
                <div>
                  <label className="label-dark">Unit</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="input-dark"
                    placeholder="e.g., PCS, KG"
                  />
                </div>
              </div>
              <div>
                <label className="label-dark">User</label>
                <input
                  type="text"
                  required
                  value={formData.user}
                  onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                  className="input-dark"
                  placeholder="Enter user name"
                />
              </div>
              <div>
                <label className="label-dark">Reference</label>
                <input
                  type="text"
                  required
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="input-dark"
                  placeholder="Enter reference number"
                />
              </div>
              <div>
                <label className="label-dark">Notes (Optional)</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="textarea-dark"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 premium-button flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Saving...
                    </>
                  ) : (
                    'Save Transaction'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="flex-1 premium-button-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
