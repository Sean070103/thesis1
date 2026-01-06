'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { getDefects, saveDefect, deleteDefect, getMaterials, generateId } from '@/lib/storage';
import { Defect, Material } from '@/types';

export default function DefectsPage() {
  const [defects, setDefects] = useState<Defect[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDefect, setEditingDefect] = useState<Defect | null>(null);
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setDefects(getDefects());
    setMaterials(getMaterials());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.materialCode) {
      alert('Please select a material');
      return;
    }
    if (!formData.defectType?.trim()) {
      alert('Please enter a defect type');
      return;
    }
    if (!formData.quantity || formData.quantity <= 0) {
      alert('Please enter a valid quantity (greater than 0)');
      return;
    }
    if (!formData.description?.trim()) {
      alert('Please enter a description');
      return;
    }
    if (!formData.reportedBy?.trim()) {
      alert('Please enter who reported this defect');
      return;
    }
    
    const selectedMaterial = materials.find(m => m.materialCode === formData.materialCode);
    
    // Check if defect quantity exceeds available quantity
    if (selectedMaterial && formData.quantity > selectedMaterial.quantity) {
      if (!confirm(`Warning: Reporting defect for ${formData.quantity} ${formData.unit || selectedMaterial.unit} but only ${selectedMaterial.quantity} available. Continue anyway?`)) {
        return;
      }
    }
    
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
    
    saveDefect(defect);
    loadData();
    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = (defect: Defect) => {
    setEditingDefect(defect);
    setFormData(defect);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this defect record?')) {
      deleteDefect(id);
      loadData();
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'open': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Defects Module
          </h1>
          <p className="text-slate-600 mt-2 text-lg">Monitor and log defective or damaged materials</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="premium-button flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Report Defect</span>
        </button>
      </div>

      <div className="premium-card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search defects..."
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Material Code</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Defect Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Reported By</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredDefects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-slate-100 rounded-full mb-4">
                        <AlertTriangle className="text-slate-400" size={32} />
                      </div>
                      <p className="text-slate-600 font-medium mb-1">No defects found</p>
                      <p className="text-slate-400 text-sm">Report your first defect to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDefects
                  .sort((a, b) => new Date(b.reportedDate).getTime() - new Date(a.reportedDate).getTime())
                  .map((defect) => (
                    <tr key={defect.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {new Date(defect.reportedDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{defect.materialCode}</td>
                      <td className="px-6 py-4 text-sm text-slate-700 max-w-xs truncate">{defect.materialDescription}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{defect.defectType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{defect.quantity} {defect.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getSeverityColor(defect.severity)}`}>
                          {defect.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(defect.status)}`}>
                          {defect.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{defect.reportedBy}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(defect)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(defect.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="premium-card p-8 w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-6">
              {editingDefect ? 'Edit Defect' : 'Report Defect'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Material</label>
                <select
                  required
                  value={formData.materialCode}
                  onChange={(e) => handleMaterialChange(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">Defect Type</label>
                <input
                  type="text"
                  required
                  value={formData.defectType}
                  onChange={(e) => setFormData({ ...formData, defectType: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                  placeholder="e.g., Damage, Contamination, Expired"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Quantity</label>
                  <input
                    type="number"
                    required
                    min="0"
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">Severity</label>
                <select
                  required
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Reported By</label>
                <input
                  type="text"
                  required
                  value={formData.reportedBy}
                  onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                />
              </div>
              {editingDefect && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                  {formData.status === 'resolved' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Resolution Notes</label>
                      <textarea
                        value={formData.resolutionNotes || ''}
                        onChange={(e) => setFormData({ ...formData, resolutionNotes: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                        rows={3}
                      />
                    </div>
                  )}
                </>
              )}
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 premium-button"
                >
                  {editingDefect ? 'Update' : 'Report'}
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

