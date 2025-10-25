import React, { useState, useEffect } from 'react';
import { Plus, Search, CreditCard as Edit, Trash2, Save, X, AlertCircle, QrCode, ToggleLeft, ToggleRight, Upload, Image } from 'lucide-react';
import { QRISDetails } from '../types/order';
import { getSettings, saveQRIS, deleteQRIS, isQRISNameExists, saveSettings } from '../utils/orderStorage';
import { decodeQRFromBase64 } from '../utils/qris';

export const QRISManager: React.FC = () => {
  const [qrisList, setQRISList] = useState<QRISDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingQRIS, setEditingQRIS] = useState<QRISDetails | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    merchantName: '',
    qrisImage: '',
    isActive: true,
    qrisPayload: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    loadQRIS();
  }, []);

  const loadQRIS = () => {
    const settings = getSettings();
    setQRISList(settings.qrisDetails || []);
  };

  const filteredQRIS = qrisList.filter(qris =>
    qris.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qris.merchantName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nama QRIS wajib diisi';
    } else if (isQRISNameExists(formData.name.trim(), editingQRIS?.id)) {
      newErrors.name = 'Nama QRIS sudah ada';
    }
    
    if (!formData.merchantName.trim()) {
      newErrors.merchantName = 'Nama merchant wajib diisi';
    }
    
    if (!formData.qrisImage) {
      newErrors.qrisImage = 'Gambar QRIS wajib diupload';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, qrisImage: 'File harus berupa gambar' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, qrisImage: 'Ukuran file maksimal 5MB' }));
        return;
      }
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target?.result as string;
        setFormData(prev => ({ ...prev, qrisImage: base64Image }));
        setImagePreview(base64Image);
        if (errors.qrisImage) {
          setErrors(prev => ({ ...prev, qrisImage: '' }));
        }
        // Try decode QR payload
        const payload = await decodeQRFromBase64(base64Image);
        setFormData(prev => ({ ...prev, qrisPayload: payload || '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const qrisData: QRISDetails = {
      id: editingQRIS?.id || crypto.randomUUID(),
      name: formData.name.trim(),
      merchantName: formData.merchantName.trim(),
      qrisImage: formData.qrisImage,
      isActive: formData.isActive,
      createdAt: editingQRIS?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      qrisPayload: formData.qrisPayload || editingQRIS?.qrisPayload
    };
    saveQRIS(qrisData);
    loadQRIS();
    handleCancel();
    
    // Force reload settings to ensure UI updates
    window.dispatchEvent(new Event('storage'));
  };

  const handleEdit = (qris: QRISDetails) => {
    setEditingQRIS(qris);
    setFormData({ 
      name: qris.name, 
      merchantName: qris.merchantName,
      qrisImage: qris.qrisImage,
      isActive: qris.isActive,
      qrisPayload: qris.qrisPayload || ''
    });
    setImagePreview(qris.qrisImage);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = (qris: QRISDetails) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus QRIS "${qris.name}"?`)) {
      deleteQRIS(qris.id);
      loadQRIS();
    }
  };

  const handleToggleActive = (qris: QRISDetails) => {
    const updatedQRIS = { ...qris, isActive: !qris.isActive };
    saveQRIS(updatedQRIS);
    loadQRIS();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingQRIS(null);
    setFormData({ name: '', merchantName: '', qrisImage: '', isActive: true, qrisPayload: '' });
    setImagePreview(null);
    setErrors({});
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const activeQRISCount = qrisList.filter(qris => qris.isActive).length;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-gray-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Manajemen QRIS</h2>
              <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {activeQRISCount} Aktif
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-target"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah QRIS</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Informasi QRIS Payment:</p>
              <ul className="text-xs space-y-1 leading-relaxed">
                <li>• Upload gambar QRIS code untuk memudahkan pelanggan melakukan pembayaran</li>
                <li>• Hanya QRIS yang aktif yang akan ditampilkan dalam form pesanan</li>
                <li>• Pastikan gambar QRIS jelas dan dapat di-scan dengan mudah</li>
                <li>• Format gambar yang didukung: JPG, PNG (maksimal 5MB)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari QRIS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
          </div>
        </div>

        {/* QRIS Form */}
        {showForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-md font-medium text-gray-900 mb-4">
              {editingQRIS ? 'Edit QRIS' : 'Tambah QRIS Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama QRIS <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                      errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Contoh: QRIS Utama"
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
                    Nama Merchant <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.merchantName}
                    onChange={(e) => handleInputChange('merchantName', e.target.value)}
                    className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                      errors.merchantName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Nama merchant sesuai QRIS"
                  />
                  {errors.merchantName && (
                    <p className="text-red-600 text-xs mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.merchantName}</span>
                    </p>
                  )}
                </div>
              </div>
              
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Gambar QRIS <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="QRIS Preview" 
                          className="mx-auto h-32 w-32 object-contain rounded"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setFormData(prev => ({ ...prev, qrisImage: '' }));
                          }}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <Image className="mx-auto h-12 w-12 text-gray-400" />
                    )}
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="qris-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>{imagePreview ? 'Ganti Gambar' : 'Upload Gambar'}</span>
                        <input 
                          id="qris-upload" 
                          name="qris-upload" 
                          type="file" 
                          className="sr-only" 
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </label>
                      <p className="pl-1">atau drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG maksimal 5MB</p>
                  </div>
                </div>
                {errors.qrisImage && (
                  <p className="text-red-600 text-xs mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.qrisImage}</span>
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Aktifkan QRIS ini untuk digunakan dalam pesanan
                </label>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  type="submit"
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-target"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingQRIS ? 'Update' : 'Simpan'}</span>
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

        {/* QRIS Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {filteredQRIS.length === 0 ? (
            <div className="p-8 text-center">
              <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {qrisList.length === 0 ? 'Belum ada QRIS terdaftar' : 'Tidak ada QRIS ditemukan'}
              </h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                {qrisList.length === 0 
                  ? 'Tambahkan QRIS untuk mengaktifkan metode pembayaran QRIS'
                  : 'Coba sesuaikan kata kunci pencarian'
                }
              </p>
              {qrisList.length === 0 && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-target"
                >
                  Tambah QRIS Pertama
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="block lg:hidden divide-y divide-gray-200">
                {filteredQRIS.map((qris) => (
                  <div key={qris.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <img 
                          src={qris.qrisImage} 
                          alt={qris.name}
                          className="w-12 h-12 object-contain rounded border border-gray-200"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-gray-900 block truncate">{qris.name}</span>
                          <span className="text-sm text-gray-600 block truncate">{qris.merchantName}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={() => handleToggleActive(qris)}
                          className={`p-2 rounded-lg transition-colors touch-target ${
                            qris.isActive 
                              ? 'text-green-600 hover:bg-green-50' 
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={qris.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {qris.isActive ? (
                            <ToggleRight className="w-5 h-5" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(qris)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-target"
                          title="Edit QRIS"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(qris)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-target"
                          title="Hapus QRIS"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                        qris.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <span>{qris.isActive ? 'Aktif' : 'Nonaktif'}</span>
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(qris.createdAt).toLocaleDateString('id-ID')}
                      </span>
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
                        QRIS
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama Merchant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
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
                    {filteredQRIS.map((qris) => (
                      <tr key={qris.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={qris.qrisImage} 
                              alt={qris.name}
                              className="w-10 h-10 object-contain rounded border border-gray-200"
                            />
                            <span className="font-medium text-gray-900">{qris.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{qris.merchantName}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleActive(qris)}
                            className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                              qris.isActive 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {qris.isActive ? (
                              <ToggleRight className="w-3 h-3" />
                            ) : (
                              <ToggleLeft className="w-3 h-3" />
                            )}
                            <span>{qris.isActive ? 'Aktif' : 'Nonaktif'}</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(qris.createdAt).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(qris)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit QRIS"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(qris)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus QRIS"
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