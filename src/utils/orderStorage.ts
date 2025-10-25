import { Order, AppSettings, Category, ReportFilters, ReportData, BankDetails, QRISDetails } from '../types/order';

const ORDERS_KEY = 'order-system-orders';
const SETTINGS_KEY = 'order-system-settings';

export const saveOrder = (order: Order): void => {
  const orders = getOrders();
  const existingIndex = orders.findIndex(ord => ord.id === order.id);
  
  if (existingIndex >= 0) {
    orders[existingIndex] = { ...order, updatedAt: new Date().toISOString() };
  } else {
    orders.push(order);
  }
  
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  
  // Trigger storage event for real-time updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('storage'));
  }
  
  // Send webhook event
  try {
    const isUpdate = existingIndex >= 0;
    const payload = isUpdate ? orders[existingIndex] : order;
    sendWebhook(isUpdate ? 'order_updated' : 'order_created', payload);
  } catch (err) {
    console.error('Failed to send webhook on saveOrder:', err);
  }
};

export const getOrders = (): Order[] => {
  const data = localStorage.getItem(ORDERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getOrder = (id: string): Order | null => {
  const orders = getOrders();
  return orders.find(ord => ord.id === id) || null;
};

export const deleteOrder = (id: string): void => {
  const orders = getOrders().filter(ord => ord.id !== id);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
};

export const updateOrderStatus = (id: string, status: Order['status']): void => {
  const orders = getOrders();
  const orderIndex = orders.findIndex(ord => ord.id === id);
  
  if (orderIndex >= 0) {
    const updatedOrder = { 
      ...orders[orderIndex], 
      status, 
      updatedAt: new Date().toISOString() 
    };
    
    // Set payment date when status changes to 'telah_dibayar'
    if (status === 'telah_dibayar' && !updatedOrder.paymentDate) {
      updatedOrder.paymentDate = new Date().toISOString();
    }
    
    // Set completion date when status changes to 'done'
    if (status === 'done' && !updatedOrder.completedDate) {
      updatedOrder.completedDate = new Date().toISOString();
    }
    
    orders[orderIndex] = updatedOrder;
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

    // Trigger storage event for real-time updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }

    // Send webhook event
    try {
      sendWebhook('order_status_changed', updatedOrder);
    } catch (err) {
      console.error('Failed to send webhook on updateOrderStatus:', err);
    }
  }
};

export const saveSettings = (settings: AppSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const getSettings = (): AppSettings => {
  const data = localStorage.getItem(SETTINGS_KEY);
  const defaultSettings = getDefaultSettings();
  
  if (data) {
    const storedSettings = JSON.parse(data);
    
    // Migration: Convert old bankDetails format to new array format
    if (storedSettings.bankDetails && !Array.isArray(storedSettings.bankDetails)) {
      const oldBankDetails = storedSettings.bankDetails;
      if (oldBankDetails.bankName && oldBankDetails.accountNumber) {
        storedSettings.bankDetails = [{
          id: crypto.randomUUID(),
          bankName: oldBankDetails.bankName,
          accountNumber: oldBankDetails.accountNumber,
          accountHolder: storedSettings.companyName || 'Pemilik Rekening',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }];
      } else {
        storedSettings.bankDetails = [];
      }
    }
    
    // Merge stored settings with defaults to ensure all properties exist
    return {
      ...defaultSettings,
      ...storedSettings,
      // Explicitly ensure arrays are always arrays
      categories: Array.isArray(storedSettings.categories) ? storedSettings.categories : [],
      bankDetails: Array.isArray(storedSettings.bankDetails) ? storedSettings.bankDetails : [],
      qrisDetails: Array.isArray(storedSettings.qrisDetails) ? storedSettings.qrisDetails : []
    };
  }
  
  return defaultSettings;
};

export const getDefaultSettings = (): AppSettings => ({
  companyName: 'Toko Saya',
  companyPhone: '081234567890',
  companyEmail: 'info@tokosaya.com',
  companyAddress: 'Jl. Contoh No. 123, Jakarta',
  defaultTax: 10,
  orderPrefix: 'ORD',
  bankDetails: [],
  qrisDetails: [],
  categories: [],
  webhookEnabled: false,
  webhookUrl: ''
});

export const generateOrderNumber = (prefix: string = 'ORD'): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}${random}`;
};

export const isBankTransferAvailable = (): boolean => {
  const settings = getSettings();
  return settings.bankDetails.some(bank => bank.isActive);
};

export const isQRISAvailable = (): boolean => {
  const settings = getSettings();
  return settings.qrisDetails.some(qris => qris.isActive);
};

export const getActiveBanks = (): BankDetails[] => {
  const settings = getSettings();
  return settings.bankDetails.filter(bank => bank.isActive);
};

export const getActiveQRIS = (): QRISDetails[] => {
  const settings = getSettings();
  return settings.qrisDetails.filter(qris => qris.isActive);
};

export const getBankById = (id: string): BankDetails | null => {
  const settings = getSettings();
  return settings.bankDetails.find(bank => bank.id === id) || null;
};

export const getQRISById = (id: string): QRISDetails | null => {
  const settings = getSettings();
  return settings.qrisDetails.find(qris => qris.id === id) || null;
};

// Bank Management Functions
export const saveBank = (bank: BankDetails): void => {
  const settings = getSettings();
  const existingIndex = settings.bankDetails.findIndex(b => b.id === bank.id);
  
  if (existingIndex >= 0) {
    settings.bankDetails[existingIndex] = { ...bank, updatedAt: new Date().toISOString() };
  } else {
    settings.bankDetails.push(bank);
  }
  
  saveSettings(settings);
  
  // Trigger storage event for real-time updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('storage'));
  }
};

export const deleteBank = (bankId: string): void => {
  const settings = getSettings();
  settings.bankDetails = settings.bankDetails.filter(bank => bank.id !== bankId);
  saveSettings(settings);
  
  // Trigger storage event for real-time updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('storage'));
  }
};

export const isBankAccountExists = (accountNumber: string, excludeId?: string): boolean => {
  const settings = getSettings();
  return settings.bankDetails.some(bank => 
    bank.accountNumber === accountNumber && bank.id !== excludeId
  );
};

// QRIS Management Functions
export const saveQRIS = (qris: QRISDetails): void => {
  const settings = getSettings();
  const existingIndex = settings.qrisDetails.findIndex(q => q.id === qris.id);
  
  if (existingIndex >= 0) {
    settings.qrisDetails[existingIndex] = { ...qris, updatedAt: new Date().toISOString() };
  } else {
    settings.qrisDetails.push(qris);
  }
  
  saveSettings(settings);
  
  // Trigger storage event for real-time updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('storage'));
  }
};

export const deleteQRIS = (qrisId: string): void => {
  const settings = getSettings();
  settings.qrisDetails = settings.qrisDetails.filter(qris => qris.id !== qrisId);
  saveSettings(settings);
  
  // Trigger storage event for real-time updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('storage'));
  }
};

export const isQRISNameExists = (name: string, excludeId?: string): boolean => {
  const settings = getSettings();
  return settings.qrisDetails.some(qris => 
    qris.name.toLowerCase() === name.toLowerCase() && qris.id !== excludeId
  );
};

// Category Management Functions
export const saveCategory = (category: Category): void => {
  const settings = getSettings();
  const existingIndex = settings.categories.findIndex(cat => cat.id === category.id);
  
  if (existingIndex >= 0) {
    settings.categories[existingIndex] = { ...category, updatedAt: new Date().toISOString() };
  } else {
    settings.categories.push(category);
  }
  
  saveSettings(settings);
};

export const deleteCategory = (categoryId: string): void => {
  const settings = getSettings();
  settings.categories = settings.categories.filter(cat => cat.id !== categoryId);
  saveSettings(settings);
};

export const getCategories = (): Category[] => {
  const settings = getSettings();
  return settings.categories || [];
};

export const getCategoryById = (id: string): Category | null => {
  const categories = getCategories();
  return categories.find(cat => cat.id === id) || null;
};

export const isCategoryNameExists = (name: string, excludeId?: string): boolean => {
  const categories = getCategories();
  return categories.some(cat => 
    cat.name.toLowerCase() === name.toLowerCase() && cat.id !== excludeId
  );
};

// Report Generation Functions
export const generateReportData = (filters: ReportFilters): ReportData => {
  const orders = getOrders();
  const categories = getCategories();
  
  // Filter orders based on date range and other filters
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.date);
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    
    // Date range filter
    if (orderDate < startDate || orderDate > endDate) {
      return false;
    }
    
    // Status filter
    if (filters.status && filters.status !== 'all' && order.status !== filters.status) {
      return false;
    }
    
    // Category filter
    if (filters.categoryId) {
      const hasCategory = order.items.some(item => item.categoryId === filters.categoryId);
      if (!hasCategory) {
        return false;
      }
    }
    
    return true;
  });
  
  // Calculate basic metrics
  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders
    .filter(order => order.status !== 'menunggu_pembayaran')
    .reduce((sum, order) => sum + order.total, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Orders by category
  const ordersByCategory: { [categoryId: string]: number } = {};
  const categoryRevenue: { [categoryId: string]: number } = {};
  
  categories.forEach(category => {
    ordersByCategory[category.id] = 0;
    categoryRevenue[category.id] = 0;
  });
  
  filteredOrders.forEach(order => {
    order.items.forEach(item => {
      if (item.categoryId) {
        ordersByCategory[item.categoryId] = (ordersByCategory[item.categoryId] || 0) + item.quantity;
        if (order.status !== 'menunggu_pembayaran') {
          categoryRevenue[item.categoryId] = (categoryRevenue[item.categoryId] || 0) + item.total;
        }
      }
    });
  });
  
  // Orders by status
  const ordersByStatus: { [status: string]: number } = {
    'menunggu_pembayaran': 0,
    'telah_dibayar': 0,
    'done': 0
  };
  
  filteredOrders.forEach(order => {
    ordersByStatus[order.status]++;
  });
  
  // Daily orders (for trend chart)
  const dailyOrders: { date: string; count: number; revenue: number }[] = [];
  const dateMap: { [date: string]: { count: number; revenue: number } } = {};
  
  filteredOrders.forEach(order => {
    const date = order.date;
    if (!dateMap[date]) {
      dateMap[date] = { count: 0, revenue: 0 };
    }
    dateMap[date].count++;
    if (order.status !== 'menunggu_pembayaran') {
      dateMap[date].revenue += order.total;
    }
  });
  
  Object.keys(dateMap).sort().forEach(date => {
    dailyOrders.push({
      date,
      count: dateMap[date].count,
      revenue: dateMap[date].revenue
    });
  });
  
  return {
    totalOrders,
    totalRevenue,
    averageOrderValue,
    ordersByCategory,
    ordersByStatus,
    dailyOrders,
    categoryRevenue
  };
};

export const exportReportData = (data: ReportData, filters: ReportFilters, format: 'csv' | 'json') => {
  const categories = getCategories();
  const orders = getOrders();
  
  if (format === 'json') {
    const exportData = {
      reportData: data,
      filters,
      categories,
      orders: orders.filter(order => {
        const orderDate = new Date(order.date);
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        return orderDate >= startDate && orderDate <= endDate;
      }),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-report-${filters.startDate}-to-${filters.endDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else if (format === 'csv') {
    // Create CSV content
    const csvContent = [
      ['Order Report Summary'],
      ['Period', `${filters.startDate} to ${filters.endDate}`],
      ['Total Orders', data.totalOrders.toString()],
      ['Total Revenue', data.totalRevenue.toString()],
      ['Average Order Value', data.averageOrderValue.toFixed(2)],
      [''],
      ['Category Performance'],
      ['Category', 'Orders', 'Revenue'],
      ...categories.map(cat => [
        cat.name,
        (data.ordersByCategory[cat.id] || 0).toString(),
        (data.categoryRevenue[cat.id] || 0).toString()
      ]),
      [''],
      ['Status Distribution'],
      ['Status', 'Count'],
      ...Object.entries(data.ordersByStatus).map(([status, count]) => [status, count.toString()])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-report-${filters.startDate}-to-${filters.endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

// Export Settings Function
export const exportSettings = () => {
  const settings = getSettings();
  const exportData = {
    settings,
    exportDate: new Date().toISOString(),
    version: '1.0'
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pengaturan-sistem-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Import Settings Function
export const importSettings = (file: File): Promise<{ success: boolean; message: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.settings) {
          // Validate the settings structure
          const requiredFields = ['companyName', 'companyPhone', 'companyEmail', 'companyAddress'];
          const hasRequiredFields = requiredFields.every(field => 
            data.settings.hasOwnProperty(field)
          );
          
          if (hasRequiredFields) {
            saveSettings(data.settings);
            resolve({ success: true, message: 'Pengaturan berhasil diimpor' });
          } else {
            resolve({ success: false, message: 'Format file tidak valid - field wajib tidak lengkap' });
          }
        } else {
          resolve({ success: false, message: 'Format file tidak valid - tidak ada data pengaturan' });
        }
      } catch (error) {
        resolve({ success: false, message: 'File tidak valid atau rusak' });
      }
    };
    reader.readAsText(file);
  });
};

// Helper: send webhook if configured
const sendWebhook = (event: 'order_created' | 'order_updated' | 'order_status_changed', data: Order) => {
  try {
    const settings = getSettings();
    if (!settings.webhookEnabled || !settings.webhookUrl) return;

    fetch(settings.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        order: data
      })
    }).catch((err) => {
      console.error('Webhook POST failed:', err);
    });
  } catch (err) {
    console.error('Webhook error:', err);
  }
};

// Export Orders Function (CSV/JSON)
export const exportOrdersData = (orders: Order[], format: 'csv' | 'json') => {
  if (format === 'json') {
    const exportData = {
      orders,
      count: orders.length,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else {
    const header = ['OrderNumber','Tanggal','CustomerNama','CustomerPhone','Status','Total'];
    const rows = orders.map(o => [
      o.orderNumber,
      o.date,
      o.customer.name.replace(/,/g, ' '),
      o.customer.phone,
      o.status,
      o.total.toString()
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

export const importOrdersData = async (file: File): Promise<{ success: boolean; message: string; importedCount: number }> => {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    let incomingOrders: Order[] | null = null;
    if (Array.isArray(parsed)) {
      incomingOrders = parsed as Order[];
    } else if (parsed && Array.isArray(parsed.orders)) {
      incomingOrders = parsed.orders as Order[];
    }

    if (!incomingOrders || !Array.isArray(incomingOrders)) {
      return { success: false, message: 'Format JSON tidak valid: tidak menemukan array orders', importedCount: 0 };
    }

    const existing = getOrders();
    const byId = new Map<string, Order>();
    for (const o of existing) {
      if (o.id) byId.set(o.id, o);
    }

    let importedCount = 0;
    for (const o of incomingOrders) {
      // Minimal validasi: wajib ada id dan orderNumber
      if (!o || typeof o !== 'object' || !o.id || !o.orderNumber) {
        continue;
      }
      byId.set(o.id, o);
      importedCount += 1;
    }

    const merged = Array.from(byId.values());
    localStorage.setItem(ORDERS_KEY, JSON.stringify(merged));
    window.dispatchEvent(new StorageEvent('storage', { key: ORDERS_KEY }));

    return { success: true, message: `Import berhasil: ${importedCount} pesanan diproses`, importedCount };
  } catch (err) {
    return { success: false, message: `Gagal import: ${(err as Error).message}`, importedCount: 0 };
  }
};