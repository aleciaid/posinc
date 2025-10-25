import { LineItem } from '../types/invoice';

export const calculateLineItemAmount = (quantity: number, rate: number): number => {
  return Math.round((quantity * rate) * 100) / 100;
};

export const calculateSubtotal = (lineItems: LineItem[]): number => {
  return Math.round(lineItems.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
};

export const calculateTaxAmount = (subtotal: number, taxRate: number): number => {
  return Math.round((subtotal * (taxRate / 100)) * 100) / 100;
};

export const calculateTotal = (subtotal: number, taxAmount: number): number => {
  return Math.round((subtotal + taxAmount) * 100) / 100;
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const generateInvoiceNumber = (prefix: string = 'INV'): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}${random}`;
};