export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Company {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
  logo?: string;
}

export interface Client {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  email: string;
  phone: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  company: Company;
  client: Client;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  paymentTerms: string;
  notes: string;
  status: 'draft' | 'sent' | 'paid';
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  defaultCurrency: string;
  defaultTaxRate: number;
  company: Company;
  paymentTerms: string;
  invoicePrefix: string;
}