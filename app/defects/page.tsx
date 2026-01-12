'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search, AlertTriangle, Loader2 } from 'lucide-react';
import { 
  getDefectsFromSupabase, 
  saveDefectToSupabase, 
  deleteDefectFromSupabase, 
  getMaterialsFromSupabase,
  generateId 
} from '@/lib/supabase-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { Defect, Material } from '@/types';
import ConfirmModal from '@/components/ConfirmModal';
import AlertModal from '@/components/AlertModal';

// Helper function to send defect email notifications
const sendDefectEmail = async (defect: Defect) => {
  try {
    // Get notification settings from localStorage
    const savedSettings = localStorage.getItem('notificationSettings');
    if (!savedSettings) return;
    
    const settings = JSON.parse(savedSettings);
    if (!settings.emailAlerts || !settings.defectEmails || !settings.emailRecipients) return;

    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'defect',
        to: settings.emailRecipients,
        data: {
          materialCode: defect.materialCode,
          materialDescription: defect.materialDescription,
          defectType: defect.defectType,
          quantity: defect.quantity,
          severity: defect.severity,
          reportedBy: defect.reportedBy,
          date: defect.reportedDate,
        },
      }),
    });
  } catch (error) {
    console.error('Failed to send defect email:', error);
  }
};

export default function DefectsPage() {
  const { theme } = useTheme();
  const [defects, setDefects] = useState<Defect[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDefect, setEditingDefect] = useState<Defect | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Defect>>({
    materialCode: '',
    materialDescription: '',
    defectType: '',
    quantity: 0,
    unit: '',
    severity: 'low',
    description: '',
    reportedBy: '',
    status: 'open',
  });

  // Modal states
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; defectId: string | null }>({
    isOpen: false,
    defectId: null,
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
    const [defectsData, materialsData] = await Promise.all([
      getDefectsFromSupabase(),
      getMaterialsFromSupabase()
    ]);
    setDefects(defectsData);
    setMaterials(materialsData);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.materialCode) {
      showAlert('Validation Error', 'Please select a material', 'warning');
      return;
    }
    if (!formData.defectType?.trim()) {
      showAlert('Validation Error', 'Please enter a defect type', 'warning');
      return;
    }
    if (!formData.quantity || formData.quantity <= 0) {
      showAlert('Validation Error', 'Please enter a valid quantity (greater than 0)', 'warning');
      return;
    }
    if (!formData.description?.trim()) {
      showAlert('Validation Error', 'Please enter a description', 'warning');
      return;
    }
    if (!formData.reportedBy?.trim()) {
      showAlert('Validation Error', 'Please enter who reported this defect', 'warning');
      return;
    }
    
    const selectedMaterial = materials.find(m => m.materialCode === formData.materialCode);

    setIsSaving(true);
    
    const defect: Defect = {
      id: editingDefect?.id || generateId(),
      materialCode: formData.materialCode!,
      materialDescription: formData.materialDescription || selectedMaterial?.description || '',
      defectType: formData.defectType!.trim(),
      quantity: formData.quantity || 0,
      unit: formData.unit || selectedMaterial?.unit || '',
      severity: formData.severity as 'low' | 'medium' | 'high' | 'critical',
      description: formData.description!.trim(),
      reportedBy: formData.reportedBy!.trim(),
      reportedDate: editingDefect?.reportedDate || new Date().toISOString(),
      status: formData.status as 'open' | 'in-progress' | 'resolved',
      resolutionNotes: formData.resolutionNotes?.trim(),
    };
    
    const success = await saveDefectToSupabase(defect);
    
    if (success) {
      // Send email notification only for new defects (not edits)
      if (!editingDefect) {
        await sendDefectEmail(defect);
      }
      
      await loadData();
      setIsModalOpen(false);
      resetForm();
    } else {
      showAlert('Error', 'Failed to save defect. Please try again.', 'error');
    }
    
    setIsSaving(false);
  };

  const handleEdit = (defect: Defect) => {
    setEditingDefect(defect);
    setFormData(defect);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteModal({ isOpen: true, defectId: id });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.defectId) return;
    
    const success = await deleteDefectFromSupabase(deleteModal.defectId);
    setDeleteModal({ isOpen: false, defectId: null });
    
    if (success) {
      await loadData();
    } else {
      showAlert('Error', 'Failed to delete defect. Please try again.', 'error');
    }
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
      defectType: '',
      quantity: 0,
      unit: '',
      severity: 'low',
      description: '',
      reportedBy: '',
      status: 'open',
    });
    setEditingDefect(null);
  };

  const filteredDefects = defects.filter(d => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      d.materialCode?.toLowerCase().includes(search) ||
      d.materialDescription?.toLowerCase().includes(search) ||
      d.defectType?.toLowerCase().includes(search) ||
      d.reportedBy?.toLowerCase().includes(search) ||
      d.severity?.toLowerCase().includes(search) ||
      d.status?.toLowerCase().includes(search)
    );
  });

  // Theme-aware classes
  const bgMain = theme === 'dark' ? 'bg-black' : 'bg-slate-50';
  const bgHeader = theme === 'dark' ? 'bg-slate-900' : 'bg-white';
  const borderColor = theme === 'dark' ? 'border-slate-800' : 'border-slate-200';
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';
  const textMuted = theme === 'dark' ? 'text-slate-500' : 'text-slate-500';
  const textTertiary = theme === 'dark' ? 'text-slate-300' : 'text-slate-700';
  const hoverRow = theme === 'dark' ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50';
  const bgTableHeader = theme === 'dark' ? 'bg-slate-900' : 'bg-slate-100';
  const divideColor = theme === 'dark' ? 'divide-slate-700' : 'divide-slate-200';
  const bgCard = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
  const borderCard = theme === 'dark' ? 'border-slate-700' : 'border-slate-200';

  return (
    <div className={`min-h-screen ${bgMain} transition-colors duration-300`}>
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, defectId: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Defect"
        message="Are you sure you want to delete this defect record? This action cannot be undone."
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

      {/* Header */}
      <div className={`${bgHeader} border-b ${borderColor} px-8 py-6 transition-colors duration-300`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className={`text-xl font-semibold ${textPrimary} transition-colors duration-300`}>Defects Module</h1>
            <p className={`text-sm ${textSecondary} mt-1 transition-colors duration-300`}>Monitor and log defective or damaged materials</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl hover:from-amber-500 hover:to-orange-500 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
          >
            <Plus size={18} />
            Report Defect
          </button>
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div className={`${bgCard} rounded-lg border ${borderCard} p-4 transition-colors duration-300`}>
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${textSecondary} transition-colors duration-300`} size={20} />
            <input
              type="text"
              placeholder="Search defects by material code, description, type, reporter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 border ${borderCard} rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50'} ${textPrimary} placeholder-slate-500 backdrop-blur-sm transition-colors duration-300`}
            />
          </div>
        </div>

        <div className={`${bgCard} rounded-lg border ${borderCard} overflow-hidden transition-colors duration-300`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className={bgTableHeader}>
                <tr>
                  <th className={`px-4 py-4 text-left text-xs font-medium ${textTertiary} uppercase tracking-wider w-32 transition-colors duration-300`}>Date</th>
                  <th className={`px-4 py-4 text-left text-xs font-medium ${textTertiary} uppercase tracking-wider w-40 transition-colors duration-300`}>Material Code</th>
                  <th className={`px-4 py-4 text-left text-xs font-medium ${textTertiary} uppercase tracking-wider min-w-[200px] transition-colors duration-300`}>Description</th>
                  <th className={`px-4 py-4 text-left text-xs font-medium ${textTertiary} uppercase tracking-wider w-36 transition-colors duration-300`}>Defect Type</th>
                  <th className={`px-4 py-4 text-left text-xs font-medium ${textTertiary} uppercase tracking-wider w-28 transition-colors duration-300`}>Quantity</th>
                  <th className={`px-4 py-4 text-left text-xs font-medium ${textTertiary} uppercase tracking-wider w-32 transition-colors duration-300`}>Severity</th>
                  <th className={`px-4 py-4 text-left text-xs font-medium ${textTertiary} uppercase tracking-wider w-32 transition-colors duration-300`}>Status</th>
                  <th className={`px-4 py-4 text-left text-xs font-medium ${textTertiary} uppercase tracking-wider w-36 transition-colors duration-300`}>Reported By</th>
                  <th className={`px-4 py-4 text-left text-xs font-medium ${textTertiary} uppercase tracking-wider w-28 transition-colors duration-300`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`${bgCard} ${divideColor} transition-colors duration-300`}>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Loader2 className="animate-spin text-amber-500 mb-4" size={32} />
                        <p className={textSecondary}>Loading defects...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredDefects.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className={`p-4 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-100'} rounded-full mb-4 transition-colors duration-300`}>
                          <AlertTriangle className={textSecondary} size={32} />
                        </div>
                        <p className={`${textTertiary} font-medium mb-1 transition-colors duration-300`}>No defects found</p>
                        <p className="text-slate-500 text-sm">Report your first defect to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDefects.map((defect) => (
                    <tr key={defect.id} className={`${hoverRow} transition-colors group`}>
                      <td className={`px-4 py-4 whitespace-nowrap text-sm ${textSecondary} transition-colors duration-300`}>
                        {new Date(defect.reportedDate).toLocaleDateString()}
                      </td>
                      <td className={`px-4 py-4 whitespace-nowrap text-sm font-medium ${textPrimary} transition-colors duration-300`}>{defect.materialCode}</td>
                      <td className={`px-4 py-4 text-sm ${textTertiary} transition-colors duration-300`} title={defect.materialDescription}>
                        <div className="max-w-[200px] truncate" title={defect.materialDescription}>
                          {defect.materialDescription}
                        </div>
                      </td>
                      <td className={`px-4 py-4 whitespace-nowrap text-sm ${textTertiary} transition-colors duration-300`}>{defect.defectType}</td>
                      <td className={`px-4 py-4 whitespace-nowrap text-sm font-semibold ${textPrimary} transition-colors duration-300`}>{defect.quantity} {defect.unit}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                          defect.severity === 'critical' ? 'bg-red-900 text-red-300' :
                          defect.severity === 'high' ? 'bg-orange-900 text-orange-300' :
                          defect.severity === 'medium' ? 'bg-amber-900 text-amber-300' :
                          'bg-blue-900 text-blue-300'
                        }`}>
                          {defect.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                          defect.status === 'resolved' ? 'bg-emerald-900 text-emerald-300' :
                          defect.status === 'in-progress' ? 'bg-blue-900 text-blue-300' :
                          'bg-amber-900 text-amber-300'
                        }`}>
                          {defect.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-300">{defect.reportedBy}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(defect)}
                            className="p-2 text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                            title="Edit defect"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(defect.id)}
                            className="p-2 text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                            title="Delete defect"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-black/70' : 'bg-black/50'} backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-colors duration-300`}>
          <div className="premium-card p-8 w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar animate-slide-in">
            <h2 className={`text-2xl font-bold ${textPrimary} mb-6 transition-colors duration-300`}>
              {editingDefect ? 'Edit Defect' : 'Report Defect'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-dark">Material</label>
                <select
                  required
                  value={formData.materialCode}
                  onChange={(e) => handleMaterialChange(e.target.value)}
                  className="select-dark"
                  disabled={!!editingDefect}
                >
                  <option value="">Select Material</option>
                  {materials.map((material) => (
                    <option key={material.id} value={material.materialCode}>
                      {material.materialCode} - {material.description}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-dark">Defect Type</label>
                <input
                  type="text"
                  required
                  value={formData.defectType}
                  onChange={(e) => setFormData({ ...formData, defectType: e.target.value })}
                  className="input-dark"
                  placeholder="e.g., Damage, Contamination, Expired"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-dark">Quantity</label>
                  <input
                    type="number"
                    required
                    min="0"
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
                <label className="label-dark">Severity</label>
                <select
                  required
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                  className="select-dark"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="label-dark">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="textarea-dark"
                  rows={3}
                  placeholder="Describe the defect..."
                />
              </div>
              <div>
                <label className="label-dark">Reported By</label>
                <input
                  type="text"
                  required
                  value={formData.reportedBy}
                  onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                  className="input-dark"
                  placeholder="Enter reporter name"
                />
              </div>
              {editingDefect && (
                <>
                  <div>
                    <label className="label-dark">Status</label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="select-dark"
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                  {formData.status === 'resolved' && (
                    <div>
                      <label className="label-dark">Resolution Notes</label>
                      <textarea
                        value={formData.resolutionNotes || ''}
                        onChange={(e) => setFormData({ ...formData, resolutionNotes: e.target.value })}
                        className="textarea-dark"
                        rows={3}
                        placeholder="Describe how the defect was resolved..."
                      />
                    </div>
                  )}
                </>
              )}
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
                    editingDefect ? 'Update' : 'Report'
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
