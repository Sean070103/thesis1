'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, FileText } from 'lucide-react';
import { getTransactions, saveTransaction, getMaterials, saveMaterial, generateId } from '@/lib/storage';
import { MaterialTransaction, Material } from '@/types';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<MaterialTransaction[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const loadData = () => {
    setTransactions(getTransactions());
    setMaterials(getMaterials());
  };

  const handleSubmit = (e: React.FormEvent) => {
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
    
    saveTransaction(transaction);
    
    // Update material quantity
    if (selectedMaterial) {
      if (transaction.transactionType === 'receiving') {
        selectedMaterial.quantity += transaction.quantity;
      } else {
        selectedMaterial.quantity = Math.max(0, selectedMaterial.quantity - transaction.quantity);
      }
      selectedMaterial.lastUpdated = new Date().toISOString();
      saveMaterial(selectedMaterial);
    }
    
    loadData();
    setIsModalOpen(false);
    resetForm();
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Material Transactions
          </h1>
          <p className="text-slate-600 mt-2 text-lg">Record material receiving and issuance activities</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="premium-button flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>New Transaction</span>
        </button>
      </div>

      <div className="premium-card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
          />
        </div>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Material Code</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Reference</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-slate-100 rounded-full mb-4">
                        <FileText className="text-slate-400" size={32} />
                      </div>
                      <p className="text-slate-600 font-medium mb-1">No transactions found</p>
                      <p className="text-slate-400 text-sm">Create your first transaction to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {new Date(transaction.date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          transaction.transactionType === 'receiving'
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700'
                            : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700'
                        }`}>
                          {transaction.transactionType === 'receiving' ? 'Receiving' : 'Issuance'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{transaction.materialCode}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{transaction.materialDescription}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{transaction.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{transaction.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{transaction.user}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{transaction.reference}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="premium-card p-8 w-full max-w-md animate-fade-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-6">New Transaction</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Transaction Type</label>
                <select
                  required
                  value={formData.transactionType}
                  onChange={(e) => setFormData({ ...formData, transactionType: e.target.value as 'receiving' | 'issuance' })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                >
                  <option value="receiving">Receiving</option>
                  <option value="issuance">Issuance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Material</label>
                <select
                  required
                  value={formData.materialCode}
                  onChange={(e) => handleMaterialChange(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
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
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Quantity</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Unit</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">User</label>
                <input
                  type="text"
                  required
                  value={formData.user}
                  onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Reference</label>
                <input
                  type="text"
                  required
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                  rows={3}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 premium-button"
                >
                  Save Transaction
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

