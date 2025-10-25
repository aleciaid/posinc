import React, { useState, useEffect } from 'react';
import { Plus, Search, CreditCard as Edit, Trash2, Save, X, AlertCircle, CreditCard, ToggleLeft, ToggleRight } from 'lucide-react';
import { BankDetails } from '../types/order';
import { getSettings, saveBank, deleteBank, isBankAccountExists, saveSettings } from '../utils/orderStorage';

export const BankManager: React.FC = () => {
  const [banks, setBanks] = useState<BankDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBank, setEditingBank] = useState<BankDetails | null>(null);
  const [formData, setFormData] = useState({ 
    bankName: '', 
    accountNumber: '', 
    accountHolder: '',
    isActive: true 
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadBanks();
  }, []);

  const loadBanks = () => {
    const settings = getSettings();
    setBanks(settings.bankDetails || []);
  };

  const filteredBanks = banks.filter(bank =>
    bank.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.accountNumber.includes(searchTerm) ||
    bank.accountHolder.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.bankName.trim()) {
      newErrors.bankName = 'Nama bank wajib diisi';
    }
    
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Nomor rekening wajib diisi';
    } else if (isBankAccountExists(formData.accountNumber.trim(), editingBank?.id)) {
      newErrors.accountNumber = 'Nomor rekening sudah terdaftar';
    }
    
    if (!formData.accountHolder.trim()) {
      newErrors.accountHolder = 'Nama pemilik rekening wajib diisi';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const bankData: BankDetails = {
      id: editingBank?.id || crypto.randomUUID(),
      bankName: formData.bankName.trim(),
      accountNumber: formData.accountNumber.trim(),
      accountHolder: formData.accountHolder.trim(),
      isActive: formData.isActive,
      createdAt: editingBank?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    saveBank(bankData);
    loadBanks();
    handleCancel();
    
    // Force reload settings to ensure UI updates
    window.dispatchEvent(new Event('storage'));
  };

  const handleEdit = (bank: BankDetails) => {
    setEditingBank(bank);
    setFormData({ 
      bankName: bank.bankName, 
      accountNumber: bank.accountNumber,
      accountHolder: bank.accountHolder,
      isActive: bank.isActive
    });
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = (bank: BankDetails) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus bank "${bank.bankName}" - ${bank.accountNumber}?`)) {
      deleteBank(bank.id);
      loadBanks();
    }
  };

  const handleToggleActive = (bank: BankDetails) => {
    const updatedBank = { ...bank, isActive: !bank.isActive };
    saveBank(updatedBank);
    loadBanks();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBank(null);
    setFormData({ bankName: '', accountNumber: '', accountHolder: '', isActive: true });
    setErrors({});
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const activeBanksCount = banks.filter(bank => bank.isActive).length;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-gray-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Manajemen Bank</h2>
              <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {activeBanksCount} Aktif
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-target"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Bank</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Informasi Bank Transfer:</p>
              <ul className="text-xs space-y-1 leading-relaxed">
                <li>• Tambahkan beberapa bank untuk memberikan pilihan kepada pelanggan</li>
                <li>• Hanya bank yang aktif yang akan ditampilkan dalam form pesanan</li>
                <li>• Pastikan informasi rekening sudah benar sebelum mengaktifkan</li>
                <li>• Minimal 1 bank harus aktif untuk menggunakan metode transfer bank</li>
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
              placeholder="Cari bank..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
          </div>
        </div>

        {/* Bank Form */}
        {showForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-md font-medium text-gray-900 mb-4">
              {editingBank ? 'Edit Bank' : 'Tambah Bank Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Bank <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                      errors.bankName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Contoh: Bank BCA"
                  />
                  {errors.bankName && (
                    <p className="text-red-600 text-xs mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.bankName}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Rekening <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                      errors.accountNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="1234567890"
                  />
                  {errors.accountNumber && (
                    <p className="text-red-600 text-xs mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.accountNumber}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Pemilik Rekening <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.accountHolder}
                    onChange={(e) => handleInputChange('accountHolder', e.target.value)}
                    className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                      errors.accountHolder ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Nama sesuai rekening"
                  />
                  {errors.accountHolder && (
                    <p className="text-red-600 text-xs mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.accountHolder}</span>
                    </p>
                  )}
                </div>
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
                  Aktifkan bank ini untuk digunakan dalam pesanan
                </label>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  type="submit"
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-target"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingBank ? 'Update' : 'Simpan'}</span>
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

        {/* Banks Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {filteredBanks.length === 0 ? (
            <div className="p-8 text-center">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {banks.length === 0 ? 'Belum ada bank terdaftar' : 'Tidak ada bank ditemukan'}
              </h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                {banks.length === 0 
                  ? 'Tambahkan bank untuk mengaktifkan metode transfer bank'
                  : 'Coba sesuaikan kata kunci pencarian'
                }
              </p>
              {banks.length === 0 && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-target"
                >
                  Tambah Bank Pertama
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="block lg:hidden divide-y divide-gray-200">
                {filteredBanks.map((bank) => (
                  <div key={bank.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <CreditCard className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-gray-900 block truncate">{bank.bankName}</span>
                          <span className="font-mono text-sm text-gray-600 block">{bank.accountNumber}</span>
                          <span className="text-sm text-gray-600 block truncate">{bank.accountHolder}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={() => handleToggleActive(bank)}
                          className={`p-2 rounded-lg transition-colors touch-target ${
                            bank.isActive 
                              ? 'text-green-600 hover:bg-green-50' 
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={bank.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {bank.isActive ? (
                            <ToggleRight className="w-5 h-5" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(bank)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-target"
                          title="Edit Bank"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(bank)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-target"
                          title="Hapus Bank"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                        bank.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <span>{bank.isActive ? 'Aktif' : 'Nonaktif'}</span>
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(bank.createdAt).toLocaleDateString('id-ID')}
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
                        Bank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nomor Rekening
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pemilik Rekening
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
                    {filteredBanks.map((bank) => (
                      <tr key={bank.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-gray-900">{bank.bankName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm text-gray-900">{bank.accountNumber}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{bank.accountHolder}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleActive(bank)}
                            className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                              bank.isActive 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {bank.isActive ? (
                              <ToggleRight className="w-3 h-3" />
                            ) : (
                              <ToggleLeft className="w-3 h-3" />
                            )}
                            <span>{bank.isActive ? 'Aktif' : 'Nonaktif'}</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(bank.createdAt).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(bank)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Bank"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(bank)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Bank"
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