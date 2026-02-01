export type OrderType = 'e-invoice' | 'quotation';

export interface OrderItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
  categoryId?: string;
}

export interface Customer {
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface BankDetails {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QRISDetails {
  id: string;
  name: string;
  qrisImage: string;
  merchantName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Decoded EMV QR payload (optional), used to generate dynamic QR
  qrisPayload?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  date: string;
  customer: Customer;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  paymentMethod?: 'cash' | 'bank_transfer' | 'qris';
  selectedBankId?: string; // ID of selected bank for transfer
  selectedQRISId?: string; // ID of selected QRIS for payment
  status: 'menunggu_pembayaran' | 'telah_dibayar' | 'done';
  notes: string;
  createdAt: string;
  updatedAt: string;
  paymentDate?: string;
  completedDate?: string;
}

export interface AppSettings {
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  companyAddress: string;
  defaultTax: number;
  orderPrefix: string;
  bankDetails: BankDetails[]; // Changed to array
  qrisDetails: QRISDetails[]; // Array of QRIS payment options
  categories: Category[];
  // Webhook integration settings
  webhookEnabled?: boolean;
  webhookUrl?: string;
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
  categoryId?: string;
  status?: Order['status'] | 'all';
}

export interface ReportData {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByCategory: { [categoryId: string]: number };
  ordersByStatus: { [status: string]: number };
  dailyOrders: { date: string; count: number; revenue: number }[];
  categoryRevenue: { [categoryId: string]: number };
}