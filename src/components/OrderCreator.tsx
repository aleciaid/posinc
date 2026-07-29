import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ShoppingCart, ArrowLeft, DollarSign, CreditCard, Banknote, Tag, AlertCircle, QrCode } from 'lucide-react';
import { Order, OrderItem, Customer } from '../types/order';
import { saveOrder, getSettings, generateOrderNumber, getActiveBanks, getCategories, getBankById, getActiveQRIS, getQRISById } from '../utils/orderStorage';
import { formatRupiah } from '../utils/currency';

interface OrderCreatorProps {
  editingOrder?: Order | null;
  onSave: () => void;
  onCancel: () => void;
}

export const OrderCreator: React.FC<OrderCreatorProps> = ({ 
  editingOrder, 
  onSave, 
  onCancel 
}) => {
  const settings = getSettings();
  const [activeBanks, setActiveBanks] = useState(getActiveBanks());
  const [activeQRIS, setActiveQRIS] = useState(getActiveQRIS());
  const categories = getCategories();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [allBanks, setAllBanks] = useState<any[]>([]);
  const [allQRIS, setAllQRIS] = useState<any[]>([]);
  
  // Load all banks and QRIS (active and inactive) for editing purposes
  useEffect(() => {
    const allBanksList = getSettings().bankDetails || [];
    const allQRISList = getSettings().qrisDetails || [];
    setAllBanks(allBanksList);
    setAllQRIS(allQRISList);
    setActiveBanks(getActiveBanks());
    setActiveQRIS(getActiveQRIS());
  }, []);
  
  const [order, setOrder] = useState<Order>(() => {
    if (editingOrder) {
      // Ensure all data is preserved when editing
      return {
        ...editingOrder,
        // Preserve existing data but ensure required fields exist
        customer: {
          name: editingOrder.customer?.name || '',
          phone: editingOrder.customer?.phone || '',
          email: editingOrder.customer?.email || '',
          address: editingOrder.customer?.address || ''
        },
        items: editingOrder.items?.length > 0 ? editingOrder.items : [{
          id: crypto.randomUUID(),
          name: '',
          description: '',
          quantity: 1,
          price: 0,
          total: 0
        }],
        paidAmount: editingOrder.paidAmount || 0,
        paymentMethod: editingOrder.paymentMethod || 'cash',
        selectedBankId: editingOrder.selectedBankId || '',
        selectedQRISId: editingOrder.selectedQRISId || ''
      };
    }
    
    return {
      id: crypto.randomUUID(),
      orderNumber: generateOrderNumber(settings.orderPrefix),
      date: new Date().toISOString().split('T')[0],
      customer: {
        name: '',
        phone: '',
        email: '',
        address: ''
      },
      items: [{
        id: crypto.randomUUID(),
        name: '',
        description: '',
        quantity: 1,
        price: 0,
        total: 0
      }],
      subtotal: 0,
      tax: settings.defaultTax,
      taxAmount: 0,
      total: 0,
      paidAmount: 0,
      paymentMethod: 'cash',
      selectedBankId: '',
      selectedQRISId: '',
      status: 'menunggu_pembayaran',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  const [paymentInput, setPaymentInput] = useState<string>(
    order.paidAmount ? order.paidAmount.toString() : ''
  );

  // Get selected bank - this will work for both active and inactive banks
  const selectedBank = (() => {
    if (!order.selectedBankId) return null;
    
    // First try to find in all banks (including inactive ones)
    const bankFromAll = allBanks.find(bank => bank.id === order.selectedBankId);
    if (bankFromAll) return bankFromAll;
    
    // Fallback to getBankById
    return getBankById(order.selectedBankId);
  })();

  // Get selected QRIS - this will work for both active and inactive QRIS
  const selectedQRIS = (() => {
    if (!order.selectedQRISId) return null;
    
    // First try to find in all QRIS (including inactive ones)
    const qrisFromAll = allQRIS.find(qris => qris.id === order.selectedQRISId);
    if (qrisFromAll) return qrisFromAll;
    
    // Fallback to getQRISById
    return getQRISById(order.selectedQRISId);
  })();

  // Get available banks for dropdown (prioritize active banks, but include selected bank if inactive)
  const availableBanks = (() => {
    const banks = [...activeBanks];
    
    // If editing and selected bank is inactive, include it in the list
    if (editingOrder && selectedBank && !selectedBank.isActive) {
      const isAlreadyInList = banks.some(bank => bank.id === selectedBank.id);
      if (!isAlreadyInList) {
        banks.push(selectedBank);
      }
    }
    
    return banks;
  })();

  // Get available QRIS for dropdown (prioritize active QRIS, but include selected QRIS if inactive)
  const availableQRIS = (() => {
    const qrisList = [...activeQRIS];
    
    // If editing and selected QRIS is inactive, include it in the list
    if (editingOrder && selectedQRIS && !selectedQRIS.isActive) {
      const isAlreadyInList = qrisList.some(qris => qris.id === selectedQRIS.id);
      if (!isAlreadyInList) {
        qrisList.push(selectedQRIS);
      }
    }
    
    return qrisList;
  })();

  useEffect(() => {
    const subtotal = order.items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = Math.round((subtotal * order.tax) / 100);
    const total = subtotal + taxAmount;

    // Auto-update status based on payment
    let newStatus = order.status;
    if (order.paidAmount === 0) {
      newStatus = 'menunggu_pembayaran';
    } else if (order.paidAmount >= total) {
      newStatus = 'telah_dibayar';
    } else {
      newStatus = 'menunggu_pembayaran';
    }

    setOrder(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      total,
      status: newStatus
    }));
  }, [order.items, order.tax, order.paidAmount]);

  const handleCustomerChange = (field: keyof Customer, value: string) => {
    setOrder(prev => ({
      ...prev,
      customer: { ...prev.customer, [field]: value }
    }));
    
    // Clear customer name error when typing
    if (field === 'name' && errors.customerName) {
      setErrors(prev => ({ ...prev, customerName: '' }));
    }
  };

  const handleItemChange = (id: string, field: keyof OrderItem, value: string | number) => {
    setOrder(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'price') {
            updatedItem.total = Math.round(updatedItem.quantity * updatedItem.price);
          }
          return updatedItem;
        }
        return item;
      })
    }));
    
    // Clear items error when making changes
    if (errors.items) {
      setErrors(prev => ({ ...prev, items: '' }));
    }
  };

  const handlePaymentInputChange = (value: string) => {
    setPaymentInput(value);
    // Parse the input and update paidAmount
    const numericValue = parseInt(value.replace(/\D/g, '')) || 0;
    setOrder(prev => ({
      ...prev,
      paidAmount: numericValue
    }));
  };

  const handlePaymentMethodChange = (method: 'cash' | 'bank_transfer' | 'qris') => {
    setOrder(prev => ({
      ...prev,
      paymentMethod: method,
      // Clear selectedBankId when switching to cash or QRIS
      selectedBankId: method === 'bank_transfer' ? prev.selectedBankId : '',
      // Clear selectedQRISId when switching to cash or bank transfer
      selectedQRISId: method === 'qris' ? prev.selectedQRISId : ''
    }));
    
    // Clear bank selection error when switching away from bank transfer
    if (method !== 'bank_transfer' && errors.selectedBankId) {
      setErrors(prev => ({ ...prev, selectedBankId: '' }));
    }
    
    // Clear QRIS selection error when switching away from QRIS
    if (method !== 'qris' && errors.selectedQRISId) {
      setErrors(prev => ({ ...prev, selectedQRISId: '' }));
    }
  };

  const handleBankSelection = (bankId: string) => {
    setOrder(prev => ({
      ...prev,
      selectedBankId: bankId
    }));
    
    // Clear bank selection error when a bank is selected
    if (bankId && errors.selectedBankId) {
      setErrors(prev => ({ ...prev, selectedBankId: '' }));
    }
  };

  const handleQRISSelection = (qrisId: string) => {
    setOrder(prev => ({
      ...prev,
      selectedQRISId: qrisId
    }));
    
    // Clear QRIS selection error when a QRIS is selected
    if (qrisId && errors.selectedQRISId) {
      setErrors(prev => ({ ...prev, selectedQRISId: '' }));
    }
  };

  const addItem = () => {
    const newItem: OrderItem = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      quantity: 1,
      price: 0,
      total: 0
    };
    setOrder(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (id: string) => {
    if (order.items.length > 1) {
      setOrder(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id)
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    // Validate customer name
    if (!order.customer.name.trim()) {
      newErrors.customerName = 'Nama pelanggan wajib diisi';
    }
    
    // Validate items
    const hasValidItems = order.items.some(item => item.name.trim() && item.quantity > 0 && item.price > 0);
    if (!hasValidItems) {
      newErrors.items = 'Minimal harus ada satu item yang valid';
    }
    
    // Validate bank selection for bank transfer
    if (order.paymentMethod === 'bank_transfer') {
      if (!order.selectedBankId) {
        newErrors.selectedBankId = 'Pilih bank untuk metode transfer bank';
      } else if (!selectedBank) {
        newErrors.selectedBankId = 'Bank yang dipilih tidak valid atau tidak tersedia';
      }
    }
    
    // Validate QRIS selection for QRIS payment
    if (order.paymentMethod === 'qris') {
      if (!order.selectedQRISId) {
        newErrors.selectedQRISId = 'Pilih QRIS untuk metode pembayaran QRIS';
      } else if (!selectedQRIS) {
        newErrors.selectedQRISId = 'QRIS yang dipilih tidak valid atau tidak tersedia';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorElement = document.querySelector('.border-red-300');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    // Ensure updatedAt is set when saving
    const orderToSave = {
      ...order,
      updatedAt: new Date().toISOString()
    };
    saveOrder(orderToSave);
    onSave();
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'menunggu_pembayaran':
        return 'bg-yellow-100 text-yellow-800';
      case 'telah_dibayar':
        return 'bg-blue-100 text-blue-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'menunggu_pembayaran':
        return 'Menunggu Pembayaran';
      case 'telah_dibayar':
        return 'Telah Dibayar';
      case 'done':
        return 'Selesai';
      default:
        return status;
    }
  };

  const remainingAmount = Math.max(0, order.total - order.paidAmount);

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onCancel}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-target"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {editingOrder ? 'Edit Pesanan' : 'Buat Pesanan Baru'}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    No. Pesanan: {order.orderNumber}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
                <button
                  onClick={handleSave}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors touch-target"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Pesanan</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            {/* Customer Information */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Pelanggan</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Pelanggan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={order.customer.name}
                    onChange={(e) => handleCustomerChange('name', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                      errors.customerName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Masukkan nama pelanggan"
                  />
                  {errors.customerName && (
                    <p className="text-red-600 text-xs mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.customerName}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                  <input
                    type="tel"
                    value={order.customer.phone}
                    onChange={(e) => handleCustomerChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    placeholder="081234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={order.customer.email}
                    onChange={(e) => handleCustomerChange('email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    placeholder="email@contoh.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Pesanan</label>
                  <input
                    type="date"
                    value={order.date}
                    onChange={(e) => setOrder(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                  <textarea
                    rows={3}
                    value={order.customer.address}
                    onChange={(e) => handleCustomerChange('address', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base"
                    placeholder="Alamat lengkap pelanggan"
                  />
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                <h2 className="text-lg font-semibold text-gray-900">Item Pesanan</h2>
                <button
                  onClick={addItem}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors touch-target"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Item</span>
                </button>
              </div>
              
              {errors.items && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.items}</span>
                  </p>
                </div>
              )}
              
              {/* Mobile Item Cards */}
              <div className="block lg:hidden space-y-4">
                {order.items.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Item #{index + 1}</span>
                      {order.items.length > 1 && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-target"
                          title="Hapus item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nama Item</label>
                        <input
                          type="text"
                          placeholder="Nama item"
                          value={item.name}
                          onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Deskripsi</label>
                        <input
                          type="text"
                          placeholder="Deskripsi item"
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Kategori</label>
                        <select
                          value={item.categoryId || ''}
                          onChange={(e) => handleItemChange(item.id, 'categoryId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        >
                          <option value="">Pilih Kategori</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Jumlah</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Harga</label>
                          <input
                            type="number"
                            min="0"
                            value={item.price}
                            onChange={(e) => handleItemChange(item.id, 'price', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Total:</span>
                          <span className="text-lg font-bold text-blue-600">{formatRupiah(item.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden lg:block border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 grid grid-cols-12 gap-4 font-medium text-gray-700 text-sm">
                  <div className="col-span-2">Nama Item</div>
                  <div className="col-span-2">Deskripsi</div>
                  <div className="col-span-2">Kategori</div>
                  <div className="col-span-1">Jumlah</div>
                  <div className="col-span-2">Harga</div>
                  <div className="col-span-2">Total</div>
                  <div className="col-span-1"></div>
                </div>
                
                {order.items.map((item) => (
                  <div key={item.id} className="px-6 py-4 border-t border-gray-200 grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Nama item"
                        value={item.name}
                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Deskripsi item"
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-2">
                      <select
                        value={item.categoryId || ''}
                        onChange={(e) => handleItemChange(item.id, 'categoryId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Pilih Kategori</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        value={item.price}
                        onChange={(e) => handleItemChange(item.id, 'price', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-between">
                      <div className="flex-1 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-right font-bold text-blue-700 text-sm min-h-[38px] flex items-center justify-end mr-2">
                        {formatRupiah(item.total)}
                      </div>
                      {order.items.length > 1 && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0 touch-target"
                          title="Hapus item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary and Payment */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pengaturan</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pajak (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={order.tax}
                      onChange={(e) => setOrder(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status Pesanan</label>
                    <select
                      value={order.status}
                      onChange={(e) => setOrder(prev => ({ ...prev, status: e.target.value as Order['status'] }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    >
                      <option value="menunggu_pembayaran">Menunggu Pembayaran</option>
                      <option value="telah_dibayar">Telah Dibayar</option>
                      <option value="done">Selesai</option>
                    </select>
                  </div>

                  {/* Payment Method Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Metode Pembayaran</label>
                    <div className="space-y-3">
                      {/* Cash Payment - Always Available */}
                      <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer touch-target">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cash"
                          checked={order.paymentMethod === 'cash'}
                          onChange={(e) => handlePaymentMethodChange(e.target.value as 'cash' | 'bank_transfer')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex items-center space-x-2">
                          <Banknote className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-gray-900">Cash Payment</p>
                            <p className="text-sm text-gray-600">Pembayaran tunai langsung</p>
                          </div>
                        </div>
                      </label>

                      {/* Manual Bank Transfer - Conditional */}
                      {activeBanks.length > 0 && (
                        <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer touch-target">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="bank_transfer"
                            checked={order.paymentMethod === 'bank_transfer'}
                            onChange={(e) => handlePaymentMethodChange(e.target.value as 'cash' | 'bank_transfer' | 'qris')}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-gray-900">Manual Bank Transfer</p>
                              <p className="text-sm text-gray-600">
                                Transfer ke bank yang dipilih ({activeBanks.length} bank tersedia)
                              </p>
                            </div>
                          </div>
                        </label>
                      )}

                      {/* QRIS Payment - Conditional */}
                      {activeQRIS.length > 0 && (
                        <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer touch-target">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="qris"
                            checked={order.paymentMethod === 'qris'}
                            onChange={(e) => handlePaymentMethodChange(e.target.value as 'cash' | 'bank_transfer' | 'qris')}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex items-center space-x-2">
                            <QrCode className="w-5 h-5 text-purple-600" />
                            <div>
                              <p className="font-medium text-gray-900">QRIS Payment</p>
                              <p className="text-sm text-gray-600">
                                Scan QRIS untuk pembayaran digital ({activeQRIS.length} QRIS tersedia)
                              </p>
                            </div>
                          </div>
                        </label>
                      )}

                      {/* Bank Transfer Not Available Message */}
                      {activeBanks.length === 0 && activeQRIS.length === 0 && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-5 h-5 text-yellow-600" />
                            <div>
                              <p className="text-sm font-medium text-yellow-800">Transfer Bank & QRIS tidak tersedia</p>
                              <p className="text-xs text-yellow-700">
                                Konfigurasi bank dan QRIS di Pengaturan untuk mengaktifkan opsi ini
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bank Selection - Show when bank transfer is selected */}
                    {order.paymentMethod === 'bank_transfer' && availableBanks.length > 0 && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pilih Bank <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={order.selectedBankId}
                          onChange={(e) => handleBankSelection(e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                            errors.selectedBankId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Pilih Bank</option>
                          {availableBanks.map(bank => (
                            <option key={bank.id} value={bank.id}>
                              {bank.bankName} - {bank.accountNumber} ({bank.accountHolder})
                              {!bank.isActive ? ' [Tidak Aktif]' : ''}
                            </option>
                          ))}
                        </select>
                        
                        {errors.selectedBankId && (
                          <p className="text-red-600 text-xs mt-1 flex items-center space-x-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>{errors.selectedBankId}</span>
                          </p>
                        )}
                        
                        {/* Show selected bank info */}
                        {selectedBank && (
                          <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <CreditCard className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">Bank yang Dipilih:</span>
                            </div>
                            <div className="text-sm text-blue-800 space-y-1">
                              <p><strong>Bank:</strong> {selectedBank.bankName}</p>
                              <p><strong>No. Rekening:</strong> {selectedBank.accountNumber}</p>
                              <p><strong>Atas Nama:</strong> {selectedBank.accountHolder}</p>
                              {!selectedBank.isActive && (
                                <p className="text-red-600 text-xs mt-2">
                                  ⚠️ Bank ini sudah tidak aktif, namun tetap dapat digunakan untuk pesanan yang sudah ada.
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* QRIS Selection - Show when QRIS is selected */}
                    {order.paymentMethod === 'qris' && availableQRIS.length > 0 && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pilih QRIS <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={order.selectedQRISId}
                          onChange={(e) => handleQRISSelection(e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                            errors.selectedQRISId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Pilih QRIS</option>
                          {availableQRIS.map(qris => (
                            <option key={qris.id} value={qris.id}>
                              {qris.name} - {qris.merchantName}
                              {!qris.isActive ? ' [Tidak Aktif]' : ''}
                            </option>
                          ))}
                        </select>
                        
                        {errors.selectedQRISId && (
                          <p className="text-red-600 text-xs mt-1 flex items-center space-x-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>{errors.selectedQRISId}</span>
                          </p>
                        )}
                        
                        {/* Show selected QRIS info */}
                        {selectedQRIS && (
                          <div className="mt-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <QrCode className="w-4 h-4 text-purple-600" />
                              <span className="text-sm font-medium text-purple-800">QRIS yang Dipilih:</span>
                            </div>
                            <div className="flex items-start space-x-3">
                              <img 
                                src={selectedQRIS.qrisImage} 
                                alt={selectedQRIS.name}
                                className="w-16 h-16 object-contain rounded border border-purple-200"
                              />
                              <div className="text-sm text-purple-800 space-y-1">
                                <p><strong>Nama:</strong> {selectedQRIS.name}</p>
                                <p><strong>Merchant:</strong> {selectedQRIS.merchantName}</p>
                                {!selectedQRIS.isActive && (
                                  <p className="text-red-600 text-xs mt-2">
                                    ⚠️ QRIS ini sudah tidak aktif, namun tetap dapat digunakan untuk pesanan yang sudah ada.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Pesanan</h3>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 sm:p-6 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Subtotal:</span>
                    <span className="font-semibold text-gray-900">{formatRupiah(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Pajak ({order.tax}%):</span>
                    <span className="font-semibold text-gray-900">{formatRupiah(order.taxAmount)}</span>
                  </div>
                  <div className="border-t border-blue-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total:</span>
                      <span className="text-xl font-bold text-blue-600">{formatRupiah(order.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Input */}
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Pembayaran</h4>
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
                    <div className="flex items-start space-x-2">
                      <DollarSign className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">Masukkan nominal pembayaran Anda:</p>
                        <ul className="text-xs space-y-1">
                          <li>• Ketik "0" atau biarkan kosong jika belum ada pembayaran</li>
                          <li>• Masukkan angka tanpa simbol atau karakter khusus (contoh: 12000)</li>
                          <li>• Nominal akan otomatis diformat menjadi format rupiah (contoh: Rp 12.000)</li>
                          <li>• Pastikan nominal yang dimasukkan sudah benar dan sesuai dengan bukti pembayaran</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Dibayar</label>
                      <input
                        type="text"
                        value={paymentInput}
                        onChange={(e) => handlePaymentInputChange(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Format: {formatRupiah(order.paidAmount)}
                      </p>
                    </div>
                    
                    {remainingAmount > 0 && (
                      <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                        <p className="text-sm text-red-800">
                          <span className="font-medium">Sisa pembayaran: </span>
                          {formatRupiah(remainingAmount)}
                        </p>
                      </div>
                    )}
                    
                    {order.paidAmount >= order.total && order.total > 0 && (
                      <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                        <p className="text-sm text-green-800 font-medium">
                          ✓ Pembayaran sudah lunas
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Tambahan</label>
              <textarea
                rows={4}
                placeholder="Tambahkan catatan untuk pesanan ini..."
                value={order.notes}
                onChange={(e) => setOrder(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};