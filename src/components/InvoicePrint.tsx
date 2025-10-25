import React from 'react';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import { Invoice } from '../types/invoice';
import { formatCurrency } from '../utils/calculations';

interface InvoicePrintProps {
  invoice: Invoice;
  onBack: () => void;
}

export const InvoicePrint: React.FC<InvoicePrintProps> = ({ invoice, onBack }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Convert to PDF would require additional library, for now we'll use print
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Invoices</span>
          </button>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-4xl mx-auto bg-white print:shadow-none shadow-lg print:mx-0 print:max-w-none">
        <div className="p-8 print:p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center space-x-4">
              {invoice.company.logo && (
                <img 
                  src={invoice.company.logo} 
                  alt="Company Logo" 
                  className="h-16 w-auto"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{invoice.company.name}</h1>
                <div className="text-sm text-gray-600 mt-1">
                  <p>{invoice.company.address}</p>
                  <p>{invoice.company.city}, {invoice.company.state} {invoice.company.zipCode}</p>
                  {invoice.company.phone && <p>Phone: {invoice.company.phone}</p>}
                  {invoice.company.email && <p>Email: {invoice.company.email}</p>}
                  {invoice.company.website && <p>Website: {invoice.company.website}</p>}
                </div>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h2>
              <div className="text-sm text-gray-600">
                <p><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>
                <p><strong>Date:</strong> {new Date(invoice.date).toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
            <div className="text-sm text-gray-700">
              <p className="font-medium">{invoice.client.name}</p>
              <p>{invoice.client.address}</p>
              <p>{invoice.client.city}, {invoice.client.state} {invoice.client.zipCode}</p>
              {invoice.client.phone && <p>Phone: {invoice.client.phone}</p>}
              {invoice.client.email && <p>Email: {invoice.client.email}</p>}
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 font-semibold text-gray-900">Description</th>
                  <th className="text-center py-3 font-semibold text-gray-900 w-20">Qty</th>
                  <th className="text-right py-3 font-semibold text-gray-900 w-24">Rate</th>
                  <th className="text-right py-3 font-semibold text-gray-900 w-24">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-3 text-gray-700">{item.description}</td>
                    <td className="py-3 text-center text-gray-700">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-700">
                      {formatCurrency(item.rate, invoice.currency)}
                    </td>
                    <td className="py-3 text-right text-gray-700 font-medium">
                      {formatCurrency(item.amount, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(invoice.subtotal, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-700">Tax ({invoice.taxRate}%):</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(invoice.taxAmount, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-gray-200">
                <span className="text-lg font-bold text-gray-900">Total:</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(invoice.total, invoice.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Terms and Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {invoice.paymentTerms && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Payment Terms</h4>
                <p className="text-sm text-gray-700">{invoice.paymentTerms}</p>
              </div>
            )}
            {invoice.notes && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>Thank you for your business!</p>
          </div>
        </div>
      </div>
    </div>
  );
};