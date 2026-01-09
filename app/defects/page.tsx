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

  return (
    <div className="min-h-screen bg-black">
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
      <div className="bg-slate-900 border-b border-slate-800 px-8 py-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">Defects Module</h1>
            <p className="text-sm text-slate-400 mt-1">Monitor and log defective or damaged materials</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            Report Defect
          </button>
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search defects..."
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
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Material Code</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Defect Type</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Severity</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Reported By</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Loader2 className="animate-spin text-amber-500 mb-4" size={32} />
                        <p className="text-slate-400">Loading defects...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredDefects.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="p-4 bg-slate-900 rounded-full mb-4">
                          <AlertTriangle className="text-slate-400" size={32} />
                        </div>
                        <p className="text-slate-300 font-medium mb-1">No defects found</p>
                        <p className="text-slate-500 text-sm">Report your first defect to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDefects.map((defect) => (
                    <tr key={defect.id} className="hover:bg-slate-700 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {new Date(defect.reportedDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{defect.materialCode}</td>
                      <td className="px-6 py-4 text-sm text-slate-300 max-w-xs truncate">{defect.materialDescription}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{defect.defectType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">{defect.quantity} {defect.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          defect.severity === 'critical' ? 'bg-red-900 text-red-300' :
                          defect.severity === 'high' ? 'bg-orange-900 text-orange-300' :
                          defect.severity === 'medium' ? 'bg-amber-900 text-amber-300' :
                          'bg-blue-900 text-blue-300'
                        }`}>
                          {defect.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          defect.status === 'resolved' ? 'bg-emerald-900 text-emerald-300' :
                          defect.status === 'in-progress' ? 'bg-blue-900 text-blue-300' :
                          'bg-amber-900 text-amber-300'
                        }`}>
                          {defect.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{defect.reportedBy}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(defect)}
                            className="p-2 text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(defect.id)}
                            className="p-2 text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="premium-card p-8 w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar animate-slide-in">
            <h2 className="text-2xl font-bold text-white mb-6">
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
