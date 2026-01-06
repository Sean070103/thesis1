'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search, Package } from 'lucide-react';
import { getMaterials, saveMaterial, deleteMaterial, generateId } from '@/lib/storage';
import { Material } from '@/types';

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
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

  const loadMaterials = () => {
    setMaterials(getMaterials());
  };

  const handleSubmit = (e: React.FormEvent) => {
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
    
    const material: Material = {
      id: editingMaterial?.id || generateId(),
      materialCode: formData.materialCode!.trim(),
      description: formData.description!.trim(),
      category: formData.category!.trim(),
      unit: formData.unit!.trim(),
      quantity: formData.quantity || 0,
      location: formData.location!.trim(),
      sapQuantity: formData.sapQuantity,
      lastUpdated: new Date().toISOString(),
    };
    saveMaterial(material);
    loadMaterials();
    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData(material);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this material?')) {
      deleteMaterial(id);
      loadMaterials();
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Material Records
          </h1>
          <p className="text-slate-600 mt-2 text-lg">Manage inventory data synchronized with SAP</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="premium-button flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add Material</span>
        </button>
      </div>

      <div className="premium-card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search materials by code, description, or category..."
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Material Code</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">SAP Quantity</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-slate-100 rounded-full mb-4">
                        <Package className="text-slate-400" size={32} />
                      </div>
                      <p className="text-slate-600 font-medium mb-1">No materials found</p>
                      <p className="text-slate-400 text-sm">Add your first material to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((material) => (
                  <tr key={material.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{material.materialCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{material.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
                        {material.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{material.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{material.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{material.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{material.sapQuantity ?? 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(material)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(material.id)}
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
          <div className="premium-card p-8 w-full max-w-md animate-fade-in">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-6">
              {editingMaterial ? 'Edit Material' : 'Add Material'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Material Code</label>
                <input
                  type="text"
                  required
                  value={formData.materialCode}
                  onChange={(e) => setFormData({ ...formData, materialCode: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">SAP Quantity (Optional)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.sapQuantity || ''}
                  onChange={(e) => setFormData({ ...formData, sapQuantity: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                />
              </div>
              <div className="flex space-x-3 pt-6">
                <button
                  type="submit"
                  className="flex-1 premium-button"
                >
                  {editingMaterial ? 'Update' : 'Add Material'}
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

