import React, { useState, useEffect } from 'react';
import { Plus, Search, CreditCard as Edit, Trash2, Save, X, AlertCircle, Tag } from 'lucide-react';
import { Category } from '../types/order';
import { getCategories, saveCategory, deleteCategory, isCategoryNameExists } from '../utils/orderStorage';

interface CategoryManagerProps {
  onClose?: () => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ onClose }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    setCategories(getCategories());
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nama kategori wajib diisi';
    } else if (isCategoryNameExists(formData.name.trim(), editingCategory?.id)) {
      newErrors.name = 'Nama kategori sudah ada';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Deskripsi kategori wajib diisi';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const categoryData: Category = {
      id: editingCategory?.id || crypto.randomUUID(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      createdAt: editingCategory?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    saveCategory(categoryData);
    loadCategories();
    handleCancel();
    
    // Force reload settings to ensure UI updates
    window.dispatchEvent(new Event('storage'));
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description });
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = (category: Category) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus kategori "${category.name}"?`)) {
      deleteCategory(category.id);
      loadCategories();
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Manajemen Kategori</h2>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-target"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kategori</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
          </div>
        </div>

        {/* Category Form */}
        {showForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-md font-medium text-gray-900 mb-4">
              {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Kategori <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                      errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Masukkan nama kategori"
                  />
                  {errors.name && (
                    <p className="text-red-600 text-xs mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.name}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                      errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Masukkan deskripsi kategori"
                  />
                  {errors.description && (
                    <p className="text-red-600 text-xs mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.description}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  type="submit"
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-target"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingCategory ? 'Update' : 'Simpan'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors touch-target"
                >
                  <X className="w-4 h-4" />
                  <span>Batal</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {filteredCategories.length === 0 ? (
            <div className="p-8 text-center">
              <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {categories.length === 0 ? 'Belum ada kategori' : 'Tidak ada kategori ditemukan'}
              </h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                {categories.length === 0 
                  ? 'Mulai dengan membuat kategori pertama untuk mengorganisir produk Anda'
                  : 'Coba sesuaikan kata kunci pencarian'
                }
              </p>
              {categories.length === 0 && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-target"
                >
                  Buat Kategori Pertama
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="block lg:hidden divide-y divide-gray-200">
                {filteredCategories.map((category) => (
                  <div key={category.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2 flex-1">
                        <Tag className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-gray-900 block truncate">{category.name}</span>
                          <span className="text-sm text-gray-600 block">{category.description}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-target"
                          title="Edit Kategori"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-target"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Dibuat: {new Date(category.createdAt).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama Kategori
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deskripsi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dibuat
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCategories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Tag className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-gray-900">{category.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{category.description}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(category.createdAt).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(category)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Kategori"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(category)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Kategori"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};