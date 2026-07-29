import React, { useEffect, useState } from 'react';
import { Printer, Download, ArrowLeft, Clock, CheckCircle, Package, DollarSign, CreditCard, Banknote, QrCode } from 'lucide-react';
import { Order } from '../types/order';
import { formatRupiah } from '../utils/currency';
import { getSettings, getBankById, getQRISById } from '../utils/orderStorage';
import { generateDynamicQRISPayload, makeQRDataURL } from '../utils/qris';

interface OrderViewProps {
  order: Order;
  onBack: () => void;
}

export const OrderView: React.FC<OrderViewProps> = ({ order, onBack }) => {
  const settings = getSettings();

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    window.print();
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

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'menunggu_pembayaran':
        return <Clock className="w-5 h-5" />;
      case 'telah_dibayar':
        return <CheckCircle className="w-5 h-5" />;
      case 'done':
        return <Package className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getPaymentMethodInfo = () => {
    switch (order.paymentMethod) {
      case 'cash':
        return {
          icon: <Banknote className="w-4 h-4" />,
          name: 'Cash Payment',
          description: 'Pembayaran tunai langsung'
        };
      case 'bank_transfer':
        const selectedBank = order.selectedBankId ? getBankById(order.selectedBankId) : null;
        return {
          icon: <CreditCard className="w-4 h-4" />,
          name: 'Manual Bank Transfer',
          description: selectedBank 
            ? `${selectedBank.bankName} - ${selectedBank.accountNumber} (${selectedBank.accountHolder})`
            : 'Transfer bank manual',
          bankDetails: selectedBank
        };
      case 'qris':
        const selectedQRIS = order.selectedQRISId ? getQRISById(order.selectedQRISId) : null;
        return {
          icon: <QrCode className="w-4 h-4" />,
          name: 'QRIS Payment',
          description: selectedQRIS 
            ? `${selectedQRIS.name} - ${selectedQRIS.merchantName}`
            : 'Pembayaran QRIS digital',
          qrisDetails: selectedQRIS
        };
      default:
        return {
          icon: <Banknote className="w-4 h-4" />,
          name: 'Cash Payment',
          description: 'Pembayaran tunai langsung'
        };
    }
  };

  const paymentMethod = getPaymentMethodInfo();
  const remainingAmount = Math.max(0, order.total - (order.paidAmount || 0));
  const selectedBank = order.selectedBankId ? getBankById(order.selectedBankId) : null;
  const selectedQRIS = order.selectedQRISId ? getQRISById(order.selectedQRISId) : null;

  const [dynamicQR, setDynamicQR] = useState<string | null>(null);
  useEffect(() => {
    const gen = async () => {
      if (selectedQRIS?.qrisPayload) {
        try {
          const payload = generateDynamicQRISPayload(selectedQRIS.qrisPayload, order.total, order.orderNumber);
          const url = await makeQRDataURL(payload, 512);
          setDynamicQR(url);
        } catch (e) {
          setDynamicQR(null);
        }
      } else {
        setDynamicQR(null);
      }
    };
    gen();
  }, [selectedQRIS?.qrisPayload, order.total, order.orderNumber]);

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
            <span>Kembali ke Daftar Pesanan</span>
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
              <span>Cetak Pesanan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Order Content */}
      <div className="max-w-4xl mx-auto bg-white print:shadow-none shadow-lg print:mx-0 print:max-w-none">
        <div className="p-8 print:p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{settings.companyName}</h1>
              <div className="text-sm text-gray-600 mt-1">
                <p>{settings.companyAddress}</p>
                <p>Telepon: {settings.companyPhone}</p>
                {settings.companyEmail && <p>Email: {settings.companyEmail}</p>}
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">E-INVOICE</h2>
              <div className="text-sm text-gray-600">
                <p><strong>No. Pesanan:</strong> {order.orderNumber}</p>
                <p><strong>Tanggal:</strong> {new Date(order.date).toLocaleDateString('id-ID')}</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span>{getStatusText(order.status)}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Informasi Pelanggan:</h3>
            <div className="text-sm text-gray-700">
              <p className="font-medium">{order.customer.name}</p>
              <p>Telepon: {order.customer.phone}</p>
              {order.customer.email && <p>Email: {order.customer.email}</p>}
              {order.customer.address && <p>Alamat: {order.customer.address}</p>}
            </div>
          </div>

          {/* Payment Method Info */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Metode Pembayaran:</h3>
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {paymentMethod.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 mb-1">{paymentMethod.name}</p>
                  <p className="text-sm text-gray-600 mb-2">{paymentMethod.description}</p>
                  
                  {/* Show detailed bank info if bank transfer */}
                  {order.paymentMethod === 'bank_transfer' && selectedBank && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div>
                            <span className="font-medium text-blue-900">Bank:</span>
                            <p className="text-blue-800">{selectedBank.bankName}</p>
                          </div>
                          <div>
                            <span className="font-medium text-blue-900">No. Rekening:</span>
                            <p className="text-blue-800 font-mono">{selectedBank.accountNumber}</p>
                          </div>
                          <div>
                            <span className="font-medium text-blue-900">Atas Nama:</span>
                            <p className="text-blue-800">{selectedBank.accountHolder}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show detailed QRIS info if QRIS payment */}
                  {order.paymentMethod === 'qris' && selectedQRIS && (
                    <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <img 
                          src={dynamicQR || selectedQRIS.qrisImage}
                          alt={selectedQRIS.name}
                          className="w-24 h-24 object-contain mx-auto rounded border border-purple-200"
                        />
                        <div className="text-sm flex-1">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <span className="font-medium text-purple-900">Nama QRIS:</span>
                              <p className="text-purple-800">{selectedQRIS.name}</p>
                            </div>
                            <div>
                              <span className="font-medium text-purple-900">Merchant:</span>
                              <p className="text-purple-800">{selectedQRIS.merchantName}</p>
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

          {/* Order Items */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 font-semibold text-gray-900">Item</th>
                  <th className="text-left py-3 font-semibold text-gray-900">Deskripsi</th>
                  <th className="text-center py-3 font-semibold text-gray-900 w-20">Qty</th>
                  <th className="text-right py-3 font-semibold text-gray-900 w-32">Harga</th>
                  <th className="text-right py-3 font-semibold text-gray-900 w-32">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-3 text-gray-700 font-medium">{item.name}</td>
                    <td className="py-3 text-gray-600">{item.description}</td>
                    <td className="py-3 text-center text-gray-700">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-700">
                      {formatRupiah(item.price)}
                    </td>
                    <td className="py-3 text-right text-gray-700 font-medium">
                      {formatRupiah(item.total)}
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
                  {formatRupiah(order.subtotal)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-700">Pajak ({order.tax}%):</span>
                <span className="font-medium text-gray-900">
                  {formatRupiah(order.taxAmount)}
                </span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-gray-200">
                <span className="text-xl font-bold text-gray-900">Total:</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatRupiah(order.total)}
                </span>
              </div>
              
              {/* Payment Information */}
              {order.paidAmount > 0 && (
                <>
                  <div className="flex justify-between py-2 border-t border-gray-100 bg-green-50 px-3 rounded">
                    <span className="text-green-700 font-medium">Dibayar:</span>
                    <span className="font-bold text-green-800">
                      {formatRupiah(order.paidAmount)}
                    </span>
                  </div>
                  {remainingAmount > 0 && (
                    <div className="flex justify-between py-2 bg-red-50 px-3 rounded mt-1">
                      <span className="text-red-700 font-medium">Sisa:</span>
                      <span className="font-bold text-red-800">
                        {formatRupiah(remainingAmount)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Status Timeline */}
          <div className="mb-8">
            <h4 className="font-semibold text-gray-900 mb-4">Status Pesanan</h4>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                order.status === 'menunggu_pembayaran' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-gray-100 text-gray-600'
              }`}>
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Menunggu Pembayaran</span>
              </div>
              <div className={`w-8 h-0.5 ${
                ['telah_dibayar', 'done'].includes(order.status) ? 'bg-blue-500' : 'bg-gray-300'
              }`}></div>
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                order.status === 'telah_dibayar' ? 'bg-blue-100 text-blue-800' : 
                order.status === 'done' ? 'bg-gray-100 text-gray-600' :
                'bg-gray-100 text-gray-400'
              }`}>
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Telah Dibayar</span>
              </div>
              <div className={`w-8 h-0.5 ${
                order.status === 'done' ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                order.status === 'done' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
              }`}>
                <Package className="w-4 h-4" />
                <span className="text-sm font-medium">Selesai</span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          {order.paidAmount > 0 && (
            <div className="mb-8">
              <h4 className="font-semibold text-gray-900 mb-3">Detail Pembayaran</h4>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Informasi Pembayaran</span>
                </div>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>Metode: <span className="font-bold">{paymentMethod.name}</span></p>
                  <p>Jumlah dibayar: <span className="font-bold">{formatRupiah(order.paidAmount)}</span></p>
                  {remainingAmount > 0 ? (
                    <p>Sisa pembayaran: <span className="font-bold text-red-600">{formatRupiah(remainingAmount)}</span></p>
                  ) : (
                    <p className="text-green-600 font-medium">✓ Pembayaran sudah lunas</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bank Transfer Instructions */}
          {order.paymentMethod === 'bank_transfer' && order.status === 'menunggu_pembayaran' && selectedBank && (
            <div className="mb-8">
              <h4 className="font-semibold text-gray-900 mb-3">Instruksi Transfer Bank</h4>
              <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
                <div className="flex items-center space-x-2 mb-4">
                  <CreditCard className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-900 text-lg">Detail Transfer</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-yellow-700">Bank:</span>
                      <p className="text-lg font-bold text-yellow-900">{selectedBank.bankName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-yellow-700">Nomor Rekening:</span>
                      <p className="text-lg font-bold text-yellow-900 font-mono">{selectedBank.accountNumber}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-yellow-700">Atas Nama:</span>
                      <p className="text-lg font-bold text-yellow-900">{selectedBank.accountHolder}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-yellow-700">Jumlah Transfer:</span>
                      <p className="text-2xl font-bold text-yellow-900">{formatRupiah(order.total)}</p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded border border-yellow-300">
                      <p className="text-xs text-yellow-800 font-medium">
                        📝 Catatan: Silakan transfer sesuai nominal yang tertera dan konfirmasi pembayaran kepada kami.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* QRIS Payment Instructions */}
          {order.paymentMethod === 'qris' && order.status === 'menunggu_pembayaran' && selectedQRIS && (
            <div className="mb-8">
              <h4 className="font-semibold text-gray-900 mb-3">Instruksi Pembayaran QRIS</h4>
              <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg">
                <div className="flex items-center space-x-2 mb-4">
                  <QrCode className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-900 text-lg">Scan QRIS untuk Pembayar</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex justify-center">
                    <div className="text-center">
                      <img 
                        src={dynamicQR || selectedQRIS.qrisImage}
                        alt={selectedQRIS.name}
                        className="w-80 h-80 object-contain mx-auto rounded-lg border-2 border-purple-300 shadow-lg"
                      />
                      <p className="text-sm text-purple-700 mt-2 font-medium">{selectedQRIS.name}</p>
                      <p className="text-xs text-purple-600">{selectedQRIS.merchantName}</p>
                      {dynamicQR && (
                        <p className="text-xs text-purple-700 mt-1">Nominal otomatis: {formatRupiah(order.total)}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-medium text-purple-700">Jumlah Pembayaran:</span>
                      <p className="text-2xl font-bold text-purple-900">{formatRupiah(order.total)}</p>
                    </div>
                    <div className="bg-purple-100 p-4 rounded border border-purple-300">
                      <p className="text-sm text-purple-800 font-medium mb-2">📱 Cara Pembayaran:</p>
                      <ol className="text-xs text-purple-700 space-y-1">
                        <li>1. Buka aplikasi mobile banking atau e-wallet</li>
                        <li>2. Pilih menu "Scan QR" atau "QRIS"</li>
                        <li>3. Arahkan kamera ke QR code di atas</li>
                        <li>4. {dynamicQR ? 'Nominal akan otomatis terisi' : `Masukkan nominal: ${formatRupiah(order.total)}`}</li>
                        <li>5. Konfirmasi pembayaran</li>
                        <li>6. Simpan bukti pembayaran</li>
                      </ol>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded border border-yellow-300">
                      <p className="text-xs text-yellow-800">
                        💡 <strong>Tips:</strong> Pastikan nominal pembayaran sesuai dengan total pesanan. 
                        Jika mengalami kesulitan, hubungi customer service kami.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="mb-8">
              <h4 className="font-semibold text-gray-900 mb-2">Catatan</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">{order.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>Terima kasih atas kepercayaan Anda!</p>
            <p className="mt-1">Pesanan dibuat pada: {new Date(order.createdAt).toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};