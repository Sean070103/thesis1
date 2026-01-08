'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search, Package, Loader2 } from 'lucide-react';
import { 
  getMaterialsFromSupabase, 
  saveMaterialToSupabase, 
  deleteMaterialFromSupabase, 
  seedMaterialsToSupabase,
  generateId 
} from '@/lib/supabase-storage';
import { Material } from '@/types';

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [formData, setFormData] = useState<Partial<Material>>({
    materialCode: '',
    description: '',
    category: '',
    unit: '',
    quantity: 0,
    location: '',
    sapQuantity: 0,
  });

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    setIsLoading(true);
    const data = await getMaterialsFromSupabase();
    setMaterials(data);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.materialCode?.trim()) {
      alert('Please enter a material code');
      return;
    }
    if (!formData.description?.trim()) {
      alert('Please enter a description');
      return;
    }
    if (formData.quantity === undefined || formData.quantity < 0) {
      alert('Please enter a valid quantity (0 or greater)');
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
      lastUpdated: new Date().toISOString(),
    };

    const success = await saveMaterialToSupabase(material);
    
    if (success) {
      await loadMaterials();
      setIsModalOpen(false);
      resetForm();
    } else {
      alert('Failed to save material. Please try again.');
    }
    
    setIsSaving(false);
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData(material);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this material?')) {
      const success = await deleteMaterialFromSupabase(id);
      if (success) {
        await loadMaterials();
      } else {
        alert('Failed to delete material. Please try again.');
      }
    }
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    await seedMaterialsToSupabase();
    await loadMaterials();
    setIsSeeding(false);
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
    });
    setEditingMaterial(null);
  };

  const filteredMaterials = materials.filter(m => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      m.materialCode?.toLowerCase().includes(search) ||
      m.description?.toLowerCase().includes(search) ||
      m.category?.toLowerCase().includes(search) ||
      m.location?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-8 py-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">Material Records</h1>
            <p className="text-sm text-slate-400 mt-1">Manage inventory data synchronized with SAP</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSeedData}
              disabled={isSeeding}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-700 border border-emerald-600 rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSeeding ? <Loader2 className="animate-spin" size={18} /> : <Package size={18} />}
              {isSeeding ? 'Loading...' : 'Load Sample Data'}
            </button>
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Add Material
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search materials by code, description, or category..."
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
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Material Code</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">SAP Quantity</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Loader2 className="animate-spin text-amber-500 mb-4" size={32} />
                        <p className="text-slate-400">Loading materials...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="p-4 bg-slate-900 rounded-full mb-4">
                          <Package className="text-slate-400" size={32} />
                        </div>
                        <p className="text-slate-300 font-medium mb-1">No materials found</p>
                        <p className="text-slate-500 text-sm">Add your first material or load sample data</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMaterials.map((material) => (
                    <tr key={material.id} className="hover:bg-slate-700 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{material.materialCode}</td>
                      <td className="px-6 py-4 text-sm text-slate-300 max-w-xs truncate">{material.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-medium bg-slate-900 text-slate-300 rounded-full">
                          {material.category || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">{material.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{material.unit || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{material.location || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{material.sapQuantity ?? 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(material)}
                            className="p-2 text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(material.id)}
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
          <div className="premium-card p-8 w-full max-w-md animate-slide-in">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingMaterial ? 'Edit Material' : 'Add Material'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-dark">Material Code</label>
                <input
                  type="text"
                  required
                  value={formData.materialCode}
                  onChange={(e) => setFormData({ ...formData, materialCode: e.target.value })}
                  className="input-dark"
                  placeholder="Enter material code"
                />
              </div>
              <div>
                <label className="label-dark">Description</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-dark"
                  placeholder="Enter description"
                />
              </div>
              <div>
                <label className="label-dark">Category</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-dark"
                  placeholder="Enter category"
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
                <label className="label-dark">Location</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input-dark"
                  placeholder="Enter storage location"
                />
              </div>
              <div>
                <label className="label-dark">SAP Quantity (Optional)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.sapQuantity || ''}
                  onChange={(e) => setFormData({ ...formData, sapQuantity: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="input-dark"
                  placeholder="Enter SAP quantity"
                />
              </div>
              <div className="flex space-x-3 pt-6">
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
                    editingMaterial ? 'Update' : 'Add Material'
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
