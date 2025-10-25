import React, { useState, useEffect } from 'react';
import { Save, Settings as SettingsIcon, ArrowLeft, CreditCard, AlertCircle, Tag, Info, ChevronDown, ChevronUp, QrCode, Download, Upload } from 'lucide-react';
import { AppSettings } from '../types/order';
import { saveSettings, getSettings, exportSettings, importSettings } from '../utils/orderStorage';
import { CategoryManager } from './CategoryManager';
import { BankManager } from './BankManager';
import { QRISManager } from './QRISManager';

interface SettingsProps {
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'payment' | 'categories' | 'about' | 'export'>('general');
  const [mobileTabsExpanded, setMobileTabsExpanded] = useState(false);
  const [importStatus, setImportStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Listen for storage changes to update settings
  useEffect(() => {
    const handleStorageChange = () => {
      setSettings(getSettings());
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Reload settings when tab changes to payment
  useEffect(() => {
    if (activeTab === 'payment') {
      setSettings(getSettings());
    }
  }, [activeTab]);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    
    // Trigger storage event to update other components
    window.dispatchEvent(new Event('storage'));
  };

  const handleChange = (field: keyof AppSettings, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const activeBanksCount = settings.bankDetails.filter(bank => bank.isActive).length;
  const activeQRISCount = settings.qrisDetails?.filter(qris => qris.isActive).length || 0;

  const handleExportSettings = () => {
    exportSettings();
  };

  const handleImportSettings = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const result = await importSettings(file);
      setImportStatus({
        message: result.message,
        type: result.success ? 'success' : 'error'
      });
      
      if (result.success) {
        // Reload settings after successful import
        setSettings(getSettings());
        setTimeout(() => setImportStatus(null), 5000);
      } else {
        setTimeout(() => setImportStatus(null), 8000);
      }
    }
    // Reset input
    e.target.value = '';
  };

  const tabs = [
    { id: 'general', name: 'Umum', icon: SettingsIcon, description: 'Pengaturan dasar perusahaan' },
    { id: 'payment', name: 'Pembayaran', icon: CreditCard, description: `Bank (${activeBanksCount}) & QRIS (${activeQRISCount})` },
    { id: 'categories', name: 'Kategori', icon: Tag, description: 'Kelola kategori produk' },
    { id: 'export', name: 'Export/Import', icon: Download, description: 'Backup & restore pengaturan' },
    { id: 'about', name: 'Tentang', icon: Info, description: 'Informasi aplikasi' }
  ];

  const currentTab = tabs.find(tab => tab.id === activeTab);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as any);
    setMobileTabsExpanded(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow-lg min-h-screen lg:rounded-lg lg:my-4 lg:mx-4">
          {/* Header */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-200 sticky top-0 bg-white z-40 lg:rounded-t-lg">
            <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onBack}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-target"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center space-x-3">
                  <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Pengaturan</h1>
                    <p className="text-sm text-gray-600 hidden sm:block">Kelola pengaturan aplikasi</p>
                  </div>
                </div>
              </div>
              {activeTab !== 'categories' && activeTab !== 'payment' && activeTab !== 'about' && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  {saved && (
                    <span className="text-green-600 text-sm font-medium">Pengaturan tersimpan!</span>
                  )}
                  <button
                    onClick={handleSave}
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors touch-target"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Tab Selector */}
          <div className="lg:hidden border-b border-gray-200 bg-white sticky top-[88px] sm:top-[96px] z-30">
            <button
              onClick={() => setMobileTabsExpanded(!mobileTabsExpanded)}
              className="w-full px-4 sm:px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors touch-target"
            >
              <div className="flex items-center space-x-3">
                {currentTab && (
                  <>
                    <currentTab.icon className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="font-medium text-gray-900">{currentTab.name}</span>
                      <p className="text-sm text-gray-600">{currentTab.description}</p>
                      {currentTab.id === 'payment' && activeBanksCount > 0 && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {activeBanksCount} bank, {activeQRISCount} QRIS
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
              {mobileTabsExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {/* Mobile Tab Dropdown */}
            {mobileTabsExpanded && (
              <div className="border-t border-gray-200 bg-gray-50">
                <div className="py-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`w-full flex items-center space-x-3 px-4 sm:px-6 py-3 text-left transition-colors touch-target ${
                          activeTab === tab.id
                            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{tab.name}</span>
                            {tab.id === 'payment' && activeBanksCount > 0 && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {activeBanksCount + activeQRISCount}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{tab.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Tabs */}
          <div className="hidden lg:block border-b border-gray-200 bg-white sticky top-[96px] z-30">
            <nav className="flex space-x-0 px-6 lg:px-8 overflow-x-auto scrollbar-thin">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-4 xl:px-6 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                    {tab.id === 'payment' && activeBanksCount > 0 && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {activeBanksCount + activeQRISCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6 lg:p-8 max-w-none overflow-x-hidden">
            {/* General Settings Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6 sm:space-y-8">
                {/* Company Information */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Perusahaan</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    <div className="sm:col-span-2 xl:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nama Perusahaan</label>
                      <input
                        type="text"
                        value={settings.companyName}
                        onChange={(e) => handleChange('companyName', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        placeholder="Masukkan nama perusahaan"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                      <input
                        type="tel"
                        value={settings.companyPhone}
                        onChange={(e) => handleChange('companyPhone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        placeholder="081234567890"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Perusahaan</label>
                      <input
                        type="email"
                        value={settings.companyEmail}
                        onChange={(e) => handleChange('companyEmail', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        placeholder="info@perusahaan.com"
                      />
                    </div>
                    <div className="sm:col-span-2 xl:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Perusahaan</label>
                      <textarea
                        rows={3}
                        value={settings.companyAddress}
                        onChange={(e) => handleChange('companyAddress', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base"
                        placeholder="Alamat lengkap perusahaan"
                      />
                    </div>
                  </div>
                </div>

                {/* Default Settings */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Pengaturan Default</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pajak Default (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={settings.defaultTax}
                        onChange={(e) => handleChange('defaultTax', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prefix Nomor Pesanan</label>
                      <input
                        type="text"
                        value={settings.orderPrefix}
                        onChange={(e) => handleChange('orderPrefix', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        placeholder="ORD"
                      />
                    </div>
                  </div>
                </div>

                {/* Webhook Settings */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Pengaturan Webhook</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Aktifkan Webhook</p>
                        <p className="text-xs text-gray-600">Kirim data saat pesanan dibuat/diupdate</p>
                      </div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!settings.webhookEnabled}
                          onChange={(e) => handleChange('webhookEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL Webhook</label>
                      <input
                        type="url"
                        placeholder="https://example.com/webhook"
                        value={settings.webhookUrl || ''}
                        onChange={(e) => handleChange('webhookUrl', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                      />
                      <p className="text-xs text-gray-500 mt-1">Kami akan melakukan POST JSON ke URL ini.</p>
                    </div>
                  </div>
                </div>

                {/* Information */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Informasi Format Harga</h3>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    Sistem ini menggunakan format Rupiah Indonesia (Rp) dengan pemisah ribuan menggunakan titik (.) 
                    dan tidak menampilkan angka desimal. Contoh: Rp 12.000, Rp 1.500.000
                  </p>
                </div>
              </div>
            )}

            {/* Payment Settings Tab */}
            {activeTab === 'payment' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-6">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Metode Pembayaran</h2>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Konfigurasi Metode Pembayaran:</p>
                      <ul className="text-xs space-y-1 leading-relaxed">
                        <li>• <strong>Cash Payment:</strong> Selalu tersedia untuk semua pesanan</li>
                        <li>• <strong>Manual Bank Transfer:</strong> Tersedia jika minimal 1 bank aktif</li>
                        <li>• <strong>QRIS Payment:</strong> Tersedia jika minimal 1 QRIS aktif</li>
                        <li>• Kelola bank di bawah ini untuk mengatur opsi transfer bank</li>
                        <li>• Kelola QRIS untuk mengatur opsi pembayaran digital</li>
                        <li>• Pelanggan dapat memilih bank yang diinginkan saat membuat pesanan</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Payment Status */}
                <div className="mb-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm font-medium text-green-800">Cash Payment: Aktif</span>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        Metode pembayaran tunai selalu tersedia
                      </p>
                    </div>
                    
                    <div className={`p-4 border rounded-lg ${
                      activeBanksCount > 0 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          activeBanksCount > 0 ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                        <span className={`text-sm font-medium ${
                          activeBanksCount > 0 ? 'text-green-800' : 'text-gray-600'
                        }`}>
                          Manual Bank Transfer: {activeBanksCount > 0 ? `Aktif (${activeBanksCount} bank)` : 'Tidak Aktif'}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${
                        activeBanksCount > 0 ? 'text-green-700' : 'text-gray-500'
                      }`}>
                        {activeBanksCount > 0 
                          ? 'Pelanggan dapat memilih dari bank yang tersedia'
                          : 'Tambahkan dan aktifkan minimal 1 bank'
                        }
                      </p>
                    </div>

                    <div className={`p-4 border rounded-lg ${
                      activeQRISCount > 0 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          activeQRISCount > 0 ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                        <span className={`text-sm font-medium ${
                          activeQRISCount > 0 ? 'text-green-800' : 'text-gray-600'
                        }`}>
                          QRIS Payment: {activeQRISCount > 0 ? `Aktif (${activeQRISCount} QRIS)` : 'Tidak Aktif'}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${
                        activeQRISCount > 0 ? 'text-green-700' : 'text-gray-500'
                      }`}>
                        {activeQRISCount > 0 
                          ? 'Pelanggan dapat scan QRIS untuk pembayaran'
                          : 'Tambahkan dan aktifkan minimal 1 QRIS'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bank Management */}
                <div className="overflow-hidden mb-8">
                  <BankManager />
                </div>

                {/* QRIS Management */}
                <div className="overflow-hidden">
                  <QRISManager />
                </div>
              </div>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
              <div className="overflow-hidden">
                <CategoryManager />
              </div>
            )}

            {/* Export/Import Tab */}
            {activeTab === 'export' && (
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center space-x-2 mb-6">
                  <Download className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Export & Import Pengaturan</h2>
                </div>
                
                {/* Import Status */}
                {importStatus && (
                  <div className={`mb-6 p-4 rounded-lg border ${
                    importStatus.type === 'success' 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <p className="text-sm font-medium">{importStatus.message}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Export Section */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-lg">
                    <div className="flex items-center space-x-2 mb-4">
                      <Download className="w-6 h-6 text-blue-600" />
                      <h3 className="text-lg font-semibold text-blue-900">Export Pengaturan</h3>
                    </div>
                    <p className="text-sm text-blue-800 mb-6 leading-relaxed">
                      Backup semua pengaturan sistem termasuk informasi perusahaan, bank, QRIS, 
                      dan kategori ke dalam file JSON yang dapat disimpan sebagai cadangan.
                    </p>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center space-x-2 text-sm text-blue-700">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Informasi perusahaan</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-blue-700">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Data bank dan QRIS</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-blue-700">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Kategori produk</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-blue-700">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Pengaturan pajak dan prefix</span>
                      </div>
                    </div>
                    <button
                      onClick={handleExportSettings}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Backup Pengaturan</span>
                    </button>
                  </div>

                  {/* Import Section */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-6 rounded-lg">
                    <div className="flex items-center space-x-2 mb-4">
                      <Upload className="w-6 h-6 text-green-600" />
                      <h3 className="text-lg font-semibold text-green-900">Import Pengaturan</h3>
                    </div>
                    <p className="text-sm text-green-800 mb-6 leading-relaxed">
                      Restore pengaturan dari file backup yang telah di-export sebelumnya. 
                      Semua pengaturan saat ini akan diganti dengan data dari file backup.
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-yellow-800">
                          <p className="font-medium mb-1">Peringatan:</p>
                          <ul className="space-y-1">
                            <li>• Import akan mengganti semua pengaturan yang ada</li>
                            <li>• Pastikan file backup valid dan dari sistem yang sama</li>
                            <li>• Disarankan export pengaturan saat ini sebagai backup</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="border-2 border-dashed border-green-300 rounded-lg p-4 text-center">
                      <Upload className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <p className="text-sm text-green-700 mb-3">
                        Pilih file backup pengaturan (.json)
                      </p>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportSettings}
                        className="hidden"
                        id="import-settings"
                      />
                      <label
                        htmlFor="import-settings"
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Pilih File Backup</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Tips Backup & Restore:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="space-y-2">
                      <p><strong>Kapan melakukan backup:</strong></p>
                      <ul className="text-xs space-y-1 ml-4">
                        <li>• Sebelum mengubah pengaturan penting</li>
                        <li>• Secara berkala (mingguan/bulanan)</li>
                        <li>• Sebelum update sistem</li>
                        <li>• Saat migrasi ke perangkat baru</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <p><strong>Keamanan file backup:</strong></p>
                      <ul className="text-xs space-y-1 ml-4">
                        <li>• Simpan di tempat yang aman</li>
                        <li>• Jangan bagikan ke orang lain</li>
                        <li>• Berikan nama file yang mudah diingat</li>
                        <li>• Simpan multiple backup di lokasi berbeda</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* About Us Tab */}
            {activeTab === 'about' && (
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center space-x-2 mb-6">
                  <Info className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Tentang Kami</h2>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 sm:p-8 rounded-lg">
                  {/* Tool Information */}
                  <div className="text-center mb-6 sm:mb-8">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Sistem Pemesanan</h3>
                    <p className="text-lg text-blue-600 font-medium mb-4">Versi 2.0</p>
                    <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                      Sistem Pemesanan adalah aplikasi manajemen pesanan yang powerful untuk mengelola 
                      pesanan pelanggan dengan mudah dan efisien. Tool kami membantu pengguna 
                      mengorganisir pesanan, melacak pembayaran, dan menghasilkan laporan 
                      secara efektif dan profesional.
                    </p>
                  </div>

                  {/* Creator Information */}
                  <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Pembuat:</h4>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
                      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xl">AS</span>
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="font-semibold text-gray-900 text-lg">Andi Susanto</p>
                        <p className="text-blue-600 hover:text-blue-800 transition-colors">
                          <a href="mailto:im@andisusanto.my.id">im@andisusanto.my.id</a>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Collaboration */}
                  <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Kolaborasi dengan:</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm sm:text-base">Bolt.new - AI-Powered Development Platform</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm sm:text-base">Netlify - Online Development Environment</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm sm:text-base">React & TypeScript Community</span>
                      </div>
                    </div>
                  </div>

                  {/* Copyright and Legal */}
                  <div className="text-center border-t border-blue-200 pt-6">
                    <p className="text-gray-600 mb-2 text-sm sm:text-base">
                      © {new Date().getFullYear()} Sistem Pemesanan. All rights reserved.
                    </p>
                    <div className="text-xs sm:text-sm text-gray-500 space-y-1">
                      <p>
                        Aplikasi ini dikembangkan dengan teknologi modern untuk memberikan 
                        pengalaman terbaik dalam manajemen pesanan.
                      </p>
                      <p>
                        Terima kasih telah menggunakan Sistem Pemesanan untuk kebutuhan bisnis Anda.
                      </p>
                    </div>
                  </div>

                  {/* Technical Information */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Informasi Teknis:</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-gray-600">
                      <div className="space-y-1">
                        <p><strong>Framework:</strong> React 18 + TypeScript</p>
                        <p><strong>Styling:</strong> Tailwind CSS</p>
                        <p><strong>Icons:</strong> Lucide React</p>
                      </div>
                      <div className="space-y-1">
                        <p><strong>Storage:</strong> Local Storage</p>
                        <p><strong>Build Tool:</strong> Vite</p>
                        <p><strong>Deployment:</strong> Web-based Application</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};