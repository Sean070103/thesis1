'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, Package, Loader2, AlertTriangle, Filter, History, Eye, Hash, Tag, Box, MapPin, Database, X, File } from 'lucide-react';
import { 
  getMaterialsFromSupabase, 
  saveMaterialToSupabase, 
  deleteMaterialFromSupabase,
  getTransactionsFromSupabase,
  generateId 
} from '@/lib/supabase-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { Material, MaterialTransaction } from '@/types';
import ConfirmModal from '@/components/ConfirmModal';
import AlertModal from '@/components/AlertModal';
import TransactionHistoryModal from '@/components/TransactionHistoryModal';
import MaterialDetailsModal from '@/components/MaterialDetailsModal';

export default function MaterialsPage() {
  const { theme } = useTheme();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [transactions, setTransactions] = useState<MaterialTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [alertFilter, setAlertFilter] = useState<'all' | 'low-stock' | 'reorder-threshold' | 'critical' | 'out-of-stock'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [historyModal, setHistoryModal] = useState<{ isOpen: boolean; material: Material | null }>({
    isOpen: false,
    material: null,
  });
  const [detailsModal, setDetailsModal] = useState<{ isOpen: boolean; material: Material | null }>({
    isOpen: false,
    material: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const LOW_STOCK_THRESHOLD = 10;
  const [formData, setFormData] = useState<Partial<Material>>({
    materialCode: '',
    description: '',
    category: '',
    unit: '',
    quantity: 0,
    location: '',
    sapQuantity: 0,
    reorderThreshold: 0,
  });

  // Modal states
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; materialId: string | null }>({
    isOpen: false,
    materialId: null,
  });
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', type: 'info' });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setAlertModal({ isOpen: true, title, message, type });
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [materialsData, transactionsData] = await Promise.all([
      getMaterialsFromSupabase(),
      getTransactionsFromSupabase()
    ]);
    setMaterials(materialsData);
    setTransactions(transactionsData);
    setIsLoading(false);
  };

  // Get transactions for a specific material
  const getMaterialTransactions = (materialCode: string): MaterialTransaction[] => {
    return transactions
      .filter(t => t.materialCode === materialCode)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Open transaction history modal
  const openHistoryModal = (material: Material) => {
    setHistoryModal({ isOpen: true, material });
  };

  // Close transaction history modal
  const closeHistoryModal = () => {
    setHistoryModal({ isOpen: false, material: null });
  };

  // Open material details modal
  const openDetailsModal = (material: Material) => {
    setDetailsModal({ isOpen: true, material });
  };

  // Close material details modal
  const closeDetailsModal = () => {
    setDetailsModal({ isOpen: false, material: null });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.materialCode?.trim()) {
      showAlert('Validation Error', 'Please enter a material code', 'warning');
      return;
    }
    if (!formData.description?.trim()) {
      showAlert('Validation Error', 'Please enter a description', 'warning');
      return;
    }
    if (formData.quantity === undefined || formData.quantity < 0) {
      showAlert('Validation Error', 'Please enter a valid quantity (0 or greater)', 'warning');
      return;
    }

    setIsSaving(true);
    
    const material: Material = {
      id: editingMaterial?.id || generateId(),
      materialCode: formData.materialCode!.trim(),
      description: formData.description!.trim(),
      category: formData.category?.trim() || '',
      unit: formData.unit?.trim() || '',
      quantity: formData.quantity || 0,
      location: formData.location?.trim() || '',
      sapQuantity: formData.sapQuantity,
      reorderThreshold: formData.reorderThreshold,
      lastUpdated: new Date().toISOString(),
    };

    const success = await saveMaterialToSupabase(material);
    
    if (success) {
      await loadData();
      setIsModalOpen(false);
      resetForm();
    } else {
      showAlert('Error', 'Failed to save material. Please try again.', 'error');
    }
    
    setIsSaving(false);
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData(material);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteModal({ isOpen: true, materialId: id });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.materialId) return;
    
    const success = await deleteMaterialFromSupabase(deleteModal.materialId);
    setDeleteModal({ isOpen: false, materialId: null });
    
    if (success) {
      await loadData();
    } else {
      showAlert('Error', 'Failed to delete material. Please try again.', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      materialCode: '',
      description: '',
      category: '',
      unit: '',
      quantity: 0,
      location: '',
      sapQuantity: 0,
      reorderThreshold: 0,
    });
    setEditingMaterial(null);
  };

  // Filter materials based on search and alert filters
  const filteredMaterials = useMemo(() => {
    let filtered = materials;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.materialCode?.toLowerCase().includes(search) ||
        m.description?.toLowerCase().includes(search) ||
        m.category?.toLowerCase().includes(search) ||
        m.location?.toLowerCase().includes(search)
      );
    }

    // Alert filter
    if (alertFilter !== 'all') {
      filtered = filtered.filter(m => {
        switch (alertFilter) {
          case 'low-stock':
            return m.quantity <= LOW_STOCK_THRESHOLD && m.quantity > 0;
          case 'reorder-threshold':
            return m.reorderThreshold !== undefined && m.quantity <= m.reorderThreshold && m.quantity > 0;
          case 'critical':
            return m.quantity <= 5 && m.quantity > 0;
          case 'out-of-stock':
            return m.quantity === 0;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [materials, searchTerm, alertFilter]);

  // Theme-aware classes
  const bgMain = theme === 'dark' ? 'bg-black' : 'bg-slate-50';
  const bgCard = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
  const bgHeader = theme === 'dark' ? 'bg-slate-900' : 'bg-white';
  const borderColor = theme === 'dark' ? 'border-slate-800' : 'border-slate-200';
  const borderCard = theme === 'dark' ? 'border-slate-700' : 'border-slate-200';
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';
  const textMuted = theme === 'dark' ? 'text-slate-500' : 'text-slate-500';
  const textTertiary = theme === 'dark' ? 'text-slate-300' : 'text-slate-700';
  const hoverRow = theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-50';
  const bgTableHeader = theme === 'dark' ? 'bg-slate-900' : 'bg-slate-100';
  const divideColor = theme === 'dark' ? 'divide-slate-700' : 'divide-slate-200';

  return (
    <div className={`min-h-screen ${bgMain} transition-colors duration-300`}>
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, materialId: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Material"
        message="Are you sure you want to delete this material? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      {/* Transaction History Modal */}
      <TransactionHistoryModal
        isOpen={historyModal.isOpen}
        onClose={closeHistoryModal}
        material={historyModal.material}
        transactions={historyModal.material ? getMaterialTransactions(historyModal.material.materialCode) : []}
      />

      {/* Material Details Modal */}
      <MaterialDetailsModal
        isOpen={detailsModal.isOpen}
        onClose={closeDetailsModal}
        material={detailsModal.material}
        transactions={detailsModal.material ? getMaterialTransactions(detailsModal.material.materialCode) : []}
        onEdit={detailsModal.material ? () => handleEdit(detailsModal.material!) : undefined}
      />

      {/* Header */}
      <div className={`${bgHeader} border-b ${borderColor} px-4 sm:px-6 lg:px-8 py-4 sm:py-6 transition-colors duration-300`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className={`text-lg sm:text-xl font-semibold ${textPrimary} transition-colors duration-300`}>Material Records</h1>
            <p className={`text-xs sm:text-sm ${textSecondary} mt-1 transition-colors duration-300`}>Manage inventory data synchronized with SAP</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className={`px-3 sm:px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl hover:from-amber-500 hover:to-orange-500 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2`}
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add Material</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Search and Alert Filters */}
        <div className={`${bgCard} rounded-lg border ${borderCard} p-4 transition-colors duration-300 space-y-4`}>
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${textSecondary} transition-colors duration-300`} size={20} />
            <input
              type="text"
              placeholder="Search materials by code, description, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 border ${borderCard} rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50'} ${textPrimary} placeholder-slate-500 backdrop-blur-sm transition-colors duration-300`}
            />
          </div>
          
          {/* Alert Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className={textSecondary} size={16} />
            <span className={`text-sm font-medium ${textSecondary} transition-colors duration-300`}>Alert Filter:</span>
            {[
              { value: 'all', label: 'All Items' },
              { value: 'low-stock', label: 'Low Stock (≤10)' },
              { value: 'reorder-threshold', label: 'Reorder Threshold' },
              { value: 'critical', label: 'Critical (≤5)' },
              { value: 'out-of-stock', label: 'Out of Stock' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setAlertFilter(filter.value as typeof alertFilter)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${
                  alertFilter === filter.value
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                    : theme === 'dark'
                      ? 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white border border-slate-700/50'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className={`${bgCard} rounded-lg border ${borderCard} p-12 transition-colors duration-300`}>
            <div className="flex flex-col items-center">
              <Loader2 className="animate-spin text-amber-500 mb-4" size={32} />
              <p className={textSecondary}>Loading materials...</p>
            </div>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className={`${bgCard} rounded-lg border ${borderCard} p-12 transition-colors duration-300`}>
            <div className="flex flex-col items-center">
              <div className={`p-4 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-100'} rounded-full mb-4 transition-colors duration-300`}>
                <Package className={textSecondary} size={32} />
              </div>
              <p className={`${textTertiary} font-medium mb-1 transition-colors duration-300`}>No materials found</p>
              <p className={`${textMuted} text-sm transition-colors duration-300`}>Add your first material or load sample data</p>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="lg:hidden space-y-4">
              {filteredMaterials.map((material) => {
                const materialTransactions = getMaterialTransactions(material.materialCode);
                const hasLowStock = material.quantity <= LOW_STOCK_THRESHOLD && material.quantity > 0;
                const hasReorderAlert = material.reorderThreshold !== undefined && material.quantity <= material.reorderThreshold && material.quantity > 0;
                const isCritical = material.quantity <= 5 && material.quantity > 0;
                const isOutOfStock = material.quantity === 0;
                
                return (
                  <div key={material.id} className={`${bgCard} rounded-lg border ${borderCard} p-4 transition-colors duration-300`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${textPrimary} transition-colors duration-300`}>{material.materialCode}</p>
                          {(hasLowStock || hasReorderAlert || isCritical || isOutOfStock) && (
                            <AlertTriangle 
                              size={12} 
                              className={isOutOfStock ? 'text-red-400' : isCritical ? 'text-orange-400' : 'text-amber-400'} 
                            />
                          )}
                        </div>
                        <p className={`text-xs ${textSecondary} mt-1 line-clamp-2 transition-colors duration-300`}>{material.description}</p>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={() => openDetailsModal(material)}
                          className={`p-2 text-emerald-400 ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} rounded-lg transition-colors`}
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(material)}
                          className={`p-2 text-blue-400 ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} rounded-lg transition-colors`}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(material.id)}
                          className={`p-2 text-red-400 ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} rounded-lg transition-colors`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`px-2 py-1 text-xs font-medium ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-100'} ${textTertiary} rounded-full transition-colors duration-300`}>
                        {material.category || 'N/A'}
                      </span>
                      <span className={`px-2 py-1 text-xs ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-100'} ${textSecondary} rounded-full transition-colors duration-300`}>
                        {material.location || 'N/A'}
                      </span>
                    </div>
                    <div className={`grid grid-cols-3 gap-3 pt-3 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} transition-colors duration-300`}>
                      <div>
                        <p className={`text-xs ${textMuted} transition-colors duration-300`}>Quantity</p>
                        <p className={`text-sm font-semibold ${
                          isOutOfStock ? 'text-red-400' : isCritical ? 'text-orange-400' : hasLowStock ? 'text-amber-400' : textPrimary
                        } transition-colors duration-300`}>
                          {material.quantity}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${textMuted} transition-colors duration-300`}>Unit</p>
                        <p className={`text-sm ${textTertiary} transition-colors duration-300`}>{material.unit || 'N/A'}</p>
                      </div>
                      <div>
                        <p className={`text-xs ${textMuted} transition-colors duration-300`}>SAP Qty</p>
                        <p className={`text-sm ${textTertiary} transition-colors duration-300`}>{material.sapQuantity ?? 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table Layout */}
            <div className={`hidden lg:block ${bgCard} rounded-lg border ${borderCard} overflow-hidden transition-colors duration-300`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={bgTableHeader}>
                    <tr>
                      <th className={`sticky left-0 z-10 ${bgTableHeader} px-4 py-3 text-left text-xs font-medium ${textTertiary} uppercase tracking-wider transition-colors duration-300`}>Material Code</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium ${textTertiary} uppercase tracking-wider transition-colors duration-300`}>Description</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium ${textTertiary} uppercase tracking-wider hidden 2xl:table-cell transition-colors duration-300`}>Category</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium ${textTertiary} uppercase tracking-wider transition-colors duration-300`}>Quantity</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium ${textTertiary} uppercase tracking-wider hidden xl:table-cell transition-colors duration-300`}>Unit</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium ${textTertiary} uppercase tracking-wider hidden 2xl:table-cell transition-colors duration-300`}>Location</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium ${textTertiary} uppercase tracking-wider hidden 2xl:table-cell transition-colors duration-300`}>SAP Qty</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium ${textTertiary} uppercase tracking-wider transition-colors duration-300`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`${bgCard} ${divideColor} transition-colors duration-300`}>
                    {filteredMaterials.map((material) => {
                      const materialTransactions = getMaterialTransactions(material.materialCode);
                      const hasLowStock = material.quantity <= LOW_STOCK_THRESHOLD && material.quantity > 0;
                      const hasReorderAlert = material.reorderThreshold !== undefined && material.quantity <= material.reorderThreshold && material.quantity > 0;
                      const isCritical = material.quantity <= 5 && material.quantity > 0;
                      const isOutOfStock = material.quantity === 0;
                      
                      return (
                        <tr key={material.id} className={`${hoverRow} transition-colors group`}>
                          <td className={`sticky left-0 z-10 ${bgCard} px-4 py-3 whitespace-nowrap text-sm font-medium ${textPrimary} transition-colors duration-300 border-r ${borderColor}`}>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openDetailsModal(material)}
                                className="hover:underline text-left"
                              >
                                {material.materialCode}
                              </button>
                              {(hasLowStock || hasReorderAlert || isCritical || isOutOfStock) && (
                                <AlertTriangle 
                                  size={14} 
                                  className={isOutOfStock ? 'text-red-400' : isCritical ? 'text-orange-400' : 'text-amber-400'} 
                                />
                              )}
                            </div>
                          </td>
                          <td className={`px-4 py-3 text-sm ${textTertiary} max-w-[200px] truncate transition-colors duration-300`} title={material.description}>
                            <button
                              onClick={() => openDetailsModal(material)}
                              className="hover:underline text-left w-full truncate"
                            >
                              {material.description}
                            </button>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap hidden 2xl:table-cell">
                            <span className={`px-2 py-1 text-xs font-medium ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-100'} ${textTertiary} rounded-full transition-colors duration-300`}>
                              {material.category || 'N/A'}
                            </span>
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold ${
                            isOutOfStock ? 'text-red-400' : isCritical ? 'text-orange-400' : hasLowStock ? 'text-amber-400' : textPrimary
                          } transition-colors duration-300`}>
                            {material.quantity}
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm ${textSecondary} hidden xl:table-cell transition-colors duration-300`}>{material.unit || 'N/A'}</td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm ${textSecondary} hidden 2xl:table-cell transition-colors duration-300`}>{material.location || 'N/A'}</td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm ${textSecondary} hidden 2xl:table-cell transition-colors duration-300`}>{material.sapQuantity ?? 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => openDetailsModal(material)}
                                className={`p-1.5 text-emerald-400 ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} rounded-lg transition-colors`}
                                title="View details"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleEdit(material)}
                                className={`p-1.5 text-blue-400 ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} rounded-lg transition-colors`}
                                title="Edit material"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(material.id)}
                                className={`p-1.5 text-red-400 ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} rounded-lg transition-colors`}
                                title="Delete material"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className={`absolute inset-0 ${theme === 'dark' ? 'bg-black/70' : 'bg-black/50'} backdrop-blur-sm animate-fade-in`}
            onClick={() => {
              setIsModalOpen(false);
              resetForm();
            }}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-2xl max-h-[90vh] animate-scale-in">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-amber-500/20 rounded-2xl blur-xl opacity-50" />
            
            <div className={`${bgCard} relative rounded-2xl shadow-2xl overflow-hidden border ${borderCard}`}>
              {/* Top gradient line */}
              <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
              
              <div className="p-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <Package className="text-amber-400" size={24} />
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${textPrimary}`}>
                        {editingMaterial ? 'Edit Material' : 'Add New Material'}
                      </h2>
                      <p className={`text-xs ${textSecondary} mt-1`}>
                        {editingMaterial ? 'Update material information' : 'Fill in the details below'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className={`p-2 ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} rounded-lg transition-colors`}
                  >
                    <X size={20} className={textSecondary} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Basic Information Section */}
                  <div className="space-y-4">
                    <h3 className={`text-sm font-semibold ${textPrimary} flex items-center gap-2`}>
                      <div className="h-1 w-1 rounded-full bg-amber-500" />
                      Basic Information
                    </h3>
                    
                    <div>
                      <label className={`flex items-center gap-2 text-sm font-medium ${textPrimary} mb-2`}>
                        <Hash size={14} className={textMuted} />
                        Material Code <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.materialCode}
                        onChange={(e) => setFormData({ ...formData, materialCode: e.target.value })}
                        className={`w-full px-4 py-2.5 border ${borderCard} rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50'} ${textPrimary} placeholder-slate-500`}
                        placeholder="Enter material code"
                      />
                    </div>

                    <div>
                      <label className={`flex items-center gap-2 text-sm font-medium ${textPrimary} mb-2`}>
                        <File size={14} className={textMuted} />
                        Description <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className={`w-full px-4 py-2.5 border ${borderCard} rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50'} ${textPrimary} placeholder-slate-500`}
                        placeholder="Enter description"
                      />
                    </div>

                    <div>
                      <label className={`flex items-center gap-2 text-sm font-medium ${textPrimary} mb-2`}>
                        <Tag size={14} className={textMuted} />
                        Category <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className={`w-full px-4 py-2.5 border ${borderCard} rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50'} ${textPrimary} placeholder-slate-500`}
                        placeholder="Enter category"
                      />
                    </div>
                  </div>

                  {/* Quantity & Location Section */}
                  <div className="space-y-4">
                    <h3 className={`text-sm font-semibold ${textPrimary} flex items-center gap-2`}>
                      <div className="h-1 w-1 rounded-full bg-amber-500" />
                      Inventory Details
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`flex items-center gap-2 text-sm font-medium ${textPrimary} mb-2`}>
                          <Hash size={14} className={textMuted} />
                          Quantity <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                          className={`w-full px-4 py-2.5 border ${borderCard} rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50'} ${textPrimary} placeholder-slate-500`}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className={`flex items-center gap-2 text-sm font-medium ${textPrimary} mb-2`}>
                          <Box size={14} className={textMuted} />
                          Unit <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.unit}
                          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                          className={`w-full px-4 py-2.5 border ${borderCard} rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50'} ${textPrimary} placeholder-slate-500`}
                          placeholder="e.g., PCS, KG"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`flex items-center gap-2 text-sm font-medium ${textPrimary} mb-2`}>
                        <MapPin size={14} className={textMuted} />
                        Location <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className={`w-full px-4 py-2.5 border ${borderCard} rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50'} ${textPrimary} placeholder-slate-500`}
                        placeholder="Enter storage location"
                      />
                    </div>
                  </div>

                  {/* Optional Fields Section */}
                  <div className="space-y-4">
                    <h3 className={`text-sm font-semibold ${textPrimary} flex items-center gap-2`}>
                      <div className="h-1 w-1 rounded-full bg-amber-500" />
                      Optional Settings
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`flex items-center gap-2 text-sm font-medium ${textSecondary} mb-2`}>
                          <Database size={14} className={textMuted} />
                          SAP Quantity
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.sapQuantity || ''}
                          onChange={(e) => setFormData({ ...formData, sapQuantity: e.target.value ? parseFloat(e.target.value) : undefined })}
                          className={`w-full px-4 py-2.5 border ${borderCard} rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50'} ${textPrimary} placeholder-slate-500`}
                          placeholder="Enter SAP quantity"
                        />
                        <p className={`text-xs ${textMuted} mt-1`}>Synchronized with SAP system</p>
                      </div>
                      <div>
                        <label className={`flex items-center gap-2 text-sm font-medium ${textSecondary} mb-2`}>
                          <AlertTriangle size={14} className={textMuted} />
                          Reorder Threshold
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.reorderThreshold || ''}
                          onChange={(e) => setFormData({ ...formData, reorderThreshold: e.target.value ? parseFloat(e.target.value) : undefined })}
                          className={`w-full px-4 py-2.5 border ${borderCard} rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50'} ${textPrimary} placeholder-slate-500`}
                          placeholder="Alert when quantity ≤ this"
                        />
                        <p className={`text-xs ${textMuted} mt-1`}>Triggers alert when reached</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className={`flex gap-3 pt-4 border-t ${borderColor}`}>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold rounded-lg transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Plus size={18} />
                          {editingMaterial ? 'Update Material' : 'Add Material'}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        resetForm();
                      }}
                      className={`px-4 py-2.5 ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-200 hover:bg-slate-300'} ${textPrimary} font-semibold rounded-lg transition-colors`}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
