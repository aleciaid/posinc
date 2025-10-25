import { Invoice, AppSettings } from '../types/invoice';

const INVOICES_KEY = 'invoice-generator-invoices';
const SETTINGS_KEY = 'invoice-generator-settings';

export const saveInvoice = (invoice: Invoice): void => {
  const invoices = getInvoices();
  const existingIndex = invoices.findIndex(inv => inv.id === invoice.id);
  
  if (existingIndex >= 0) {
    invoices[existingIndex] = { ...invoice, updatedAt: new Date().toISOString() };
  } else {
    invoices.push(invoice);
  }
  
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
};

export const getInvoices = (): Invoice[] => {
  const data = localStorage.getItem(INVOICES_KEY);
  return data ? JSON.parse(data) : [];
};

export const getInvoice = (id: string): Invoice | null => {
  const invoices = getInvoices();
  return invoices.find(inv => inv.id === id) || null;
};

export const deleteInvoice = (id: string): void => {
  const invoices = getInvoices().filter(inv => inv.id !== id);
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
};

export const saveSettings = (settings: AppSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const getSettings = (): AppSettings => {
  const data = localStorage.getItem(SETTINGS_KEY);
  return data ? JSON.parse(data) : getDefaultSettings();
};

export const getDefaultSettings = (): AppSettings => ({
  defaultCurrency: 'USD',
  defaultTaxRate: 8.5,
  company: {
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    website: ''
  },
  paymentTerms: 'Net 30',
  invoicePrefix: 'INV'
});

export const exportData = () => {
  const invoices = getInvoices();
  const settings = getSettings();
  const data = { invoices, settings, exportDate: new Date().toISOString() };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importData = (file: File): Promise<{ success: boolean; message: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.invoices && Array.isArray(data.invoices)) {
          localStorage.setItem(INVOICES_KEY, JSON.stringify(data.invoices));
        }
        
        if (data.settings) {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
        }
        
        resolve({ success: true, message: 'Data imported successfully' });
      } catch (error) {
        resolve({ success: false, message: 'Invalid file format' });
      }
    };
    reader.readAsText(file);
  });
};