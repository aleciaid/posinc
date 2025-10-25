import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, TrendingUp, PieChart, Download, Calendar, Filter, FileText, Printer, ArrowLeft } from 'lucide-react';
import { ReportFilters, ReportData, Order } from '../types/order';
import { generateReportData, exportReportData, importOrdersData, getCategories, getSettings } from '../utils/orderStorage';
import { formatRupiah } from '../utils/currency';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ReportsProps {
  onBack: () => void;
}

export const Reports: React.FC<ReportsProps> = ({ onBack }) => {
  const [filters, setFilters] = useState<ReportFilters>(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return {
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      categoryId: '',
      status: 'all'
    };
  });
  
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const categories = getCategories();
  const settings = getSettings();
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    generateReport();
  }, [filters]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const data = generateReportData(filters);
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof ReportFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value === '' ? undefined : value
    }));
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || !reportData) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const fileName = `laporan-pesanan-${filters.startDate}-to-${filters.endDate}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Terjadi kesalahan saat mengexport PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportData = (format: 'csv' | 'json') => {
    if (!reportData) return;
    exportReportData(reportData, filters, format);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'menunggu_pembayaran': return 'Menunggu Pembayaran';
      case 'telah_dibayar': return 'Telah Dibayar';
      case 'done': return 'Selesai';
      default: return status;
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Tidak Berkategori';
  };

  // Import JSON controls
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const handleImportClick = () => importInputRef.current?.click();
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const res = await importOrdersData(file);
      alert(res.message);
      await generateReport();
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat laporan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </button>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Laporan</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Mengexport...' : 'Export PDF'}</span>
            </button>
            <button
              onClick={() => handleExportData('csv')}
              disabled={!reportData}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => handleExportData('json')}
              disabled={!reportData}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              title="Export JSON"
            >
              <Download className="w-4 h-4" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={handleImportClick}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              title="Import JSON"
            >
              <Download className="w-4 h-4" />
              <span>Import JSON</span>
            </button>
            <input
              type="file"
              accept="application/json"
              ref={importInputRef}
              onChange={handleImportFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="max-w-7xl mx-auto bg-white print:shadow-none shadow-lg print:mx-0 print:max-w-none">
        <div className="p-8 print:p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{settings.companyName}</h1>
              <div className="text-sm text-gray-600 mt-1">
                <p>{settings.companyAddress}</p>
                <p>Telepon: {settings.companyPhone}</p>
                {settings.companyEmail && <p>Email: {settings.companyEmail}</p>}
              </div>
            </div>
            <div className="md:text-right text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">LAPORAN PESANAN</h2>
              <div className="text-sm text-gray-600">
                <p><strong>Periode:</strong> {new Date(filters.startDate).toLocaleDateString('id-ID')} - {new Date(filters.endDate).toLocaleDateString('id-ID')}</p>
                <p><strong>Tanggal Cetak:</strong> {new Date().toLocaleDateString('id-ID')}</p>
                {filters.categoryId && (
                  <p><strong>Kategori:</strong> {getCategoryName(filters.categoryId)}</p>
                )}
                {filters.status && filters.status !== 'all' && (
                  <p><strong>Status:</strong> {getStatusText(filters.status)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Filters - Only show in screen view */}
          <div className="print:hidden bg-gray-50 p-6 rounded-lg shadow mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filter Laporan</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={filters.categoryId || ''}
                  onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status || 'all'}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Semua Status</option>
                  <option value="menunggu_pembayaran">Menunggu Pembayaran</option>
                  <option value="telah_dibayar">Telah Dibayar</option>
                  <option value="done">Selesai</option>
                </select>
              </div>
            </div>
          </div>

          {reportData && (
            <>
              {/* Summary Cards */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Laporan</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-700">Total Pesanan</p>
                        <p className="text-2xl font-bold text-blue-900">{reportData.totalOrders}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-700">Total Pendapatan</p>
                        <p className="text-2xl font-bold text-green-900">{formatRupiah(reportData.totalRevenue)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <BarChart3 className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-purple-700">Rata-rata Nilai Pesanan</p>
                        <p className="text-2xl font-bold text-purple-900">{formatRupiah(reportData.averageOrderValue)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Category Distribution */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribusi Kategori</h3>
                  <div className="space-y-3">
                    {Object.entries(reportData.ordersByCategory).map(([categoryId, count]) => {
                      const categoryName = getCategoryName(categoryId);
                      const percentage = reportData.totalOrders > 0 ? (count / reportData.totalOrders * 100) : 0;
                      
                      return (
                        <div key={categoryId} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">{categoryName}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-12 text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status Distribution */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Pesanan</h3>
                  <div className="space-y-3">
                    {Object.entries(reportData.ordersByStatus).map(([status, count]) => {
                      const percentage = reportData.totalOrders > 0 ? (count / reportData.totalOrders * 100) : 0;
                      const statusColors = {
                        'menunggu_pembayaran': 'bg-yellow-500',
                        'telah_dibayar': 'bg-blue-500',
                        'done': 'bg-green-500'
                      };
                      
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${statusColors[status as keyof typeof statusColors] || 'bg-gray-500'}`}></div>
                            <span className="text-sm text-gray-700">{getStatusText(status)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${statusColors[status as keyof typeof statusColors] || 'bg-gray-500'}`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-12 text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Revenue by Category */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pendapatan per Kategori</h3>
                <div className="border border-gray-200 rounded-lg overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kategori
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jumlah Item
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pendapatan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Persentase
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(reportData.categoryRevenue)
                        .sort(([,a], [,b]) => b - a)
                        .map(([categoryId, revenue]) => {
                          const categoryName = getCategoryName(categoryId);
                          const itemCount = reportData.ordersByCategory[categoryId] || 0;
                          const percentage = reportData.totalRevenue > 0 ? (revenue / reportData.totalRevenue * 100) : 0;
                          
                          return (
                            <tr key={categoryId}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-medium text-gray-900">{categoryName}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {itemCount}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-medium text-gray-900">{formatRupiah(revenue)}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-green-500 h-2 rounded-full" 
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Daily Trend */}
              {reportData.dailyOrders.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tren Harian</h3>
                  <div className="border border-gray-200 rounded-lg overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tanggal
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Jumlah Pesanan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pendapatan
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.dailyOrders.map((day) => (
                          <tr key={day.date}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-medium text-gray-900">
                                {new Date(day.date).toLocaleDateString('id-ID')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {day.count}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-medium text-gray-900">{formatRupiah(day.revenue)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-12 pt-8 border-t border-gray-200 text-center text-xs text-gray-500">
                <p>Laporan ini dibuat secara otomatis oleh Sistem Pemesanan</p>
                <p className="mt-1">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ReportsLegacy: React.FC = () => {
  const [filters, setFilters] = useState<ReportFilters>(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return {
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      categoryId: '',
      status: 'all'
    };
  });
  
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const categories = getCategories();
  const settings = getSettings();
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    generateReport();
  }, [filters]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const data = generateReportData(filters);
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof ReportFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value === '' ? undefined : value
    }));
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || !reportData) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const fileName = `laporan-pesanan-${filters.startDate}-to-${filters.endDate}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Terjadi kesalahan saat mengexport PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportData = (format: 'csv' | 'json') => {
    if (!reportData) return;
    exportReportData(reportData, filters, format);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'menunggu_pembayaran': return 'Menunggu Pembayaran';
      case 'telah_dibayar': return 'Telah Dibayar';
      case 'done': return 'Selesai';
      default: return status;
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Tidak Berkategori';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat laporan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </button>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Laporan</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Mengexport...' : 'Export PDF'}</span>
            </button>
            <button
              onClick={() => handleExportData('csv')}
              disabled={!reportData}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => handleExportData('json')}
              disabled={!reportData}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              title="Export JSON"
            >
              <Download className="w-4 h-4" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="max-w-7xl mx-auto bg-white print:shadow-none shadow-lg print:mx-0 print:max-w-none">
        <div className="p-8 print:p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{settings.companyName}</h1>
              <div className="text-sm text-gray-600 mt-1">
                <p>{settings.companyAddress}</p>
                <p>Telepon: {settings.companyPhone}</p>
                {settings.companyEmail && <p>Email: {settings.companyEmail}</p>}
              </div>
            </div>
            <div className="md:text-right text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">LAPORAN PESANAN</h2>
              <div className="text-sm text-gray-600">
                <p><strong>Periode:</strong> {new Date(filters.startDate).toLocaleDateString('id-ID')} - {new Date(filters.endDate).toLocaleDateString('id-ID')}</p>
                <p><strong>Tanggal Cetak:</strong> {new Date().toLocaleDateString('id-ID')}</p>
                {filters.categoryId && (
                  <p><strong>Kategori:</strong> {getCategoryName(filters.categoryId)}</p>
                )}
                {filters.status && filters.status !== 'all' && (
                  <p><strong>Status:</strong> {getStatusText(filters.status)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Filters - Only show in screen view */}
          <div className="print:hidden bg-gray-50 p-6 rounded-lg shadow mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filter Laporan</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={filters.categoryId || ''}
                  onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status || 'all'}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Semua Status</option>
                  <option value="menunggu_pembayaran">Menunggu Pembayaran</option>
                  <option value="telah_dibayar">Telah Dibayar</option>
                  <option value="done">Selesai</option>
                </select>
              </div>
            </div>
          </div>

          {reportData && (
            <>
              {/* Summary Cards */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Laporan</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-700">Total Pesanan</p>
                        <p className="text-2xl font-bold text-blue-900">{reportData.totalOrders}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-700">Total Pendapatan</p>
                        <p className="text-2xl font-bold text-green-900">{formatRupiah(reportData.totalRevenue)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <BarChart3 className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-purple-700">Rata-rata Nilai Pesanan</p>
                        <p className="text-2xl font-bold text-purple-900">{formatRupiah(reportData.averageOrderValue)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Category Distribution */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribusi Kategori</h3>
                  <div className="space-y-3">
                    {Object.entries(reportData.ordersByCategory).map(([categoryId, count]) => {
                      const categoryName = getCategoryName(categoryId);
                      const percentage = reportData.totalOrders > 0 ? (count / reportData.totalOrders * 100) : 0;
                      
                      return (
                        <div key={categoryId} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">{categoryName}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-12 text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status Distribution */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Pesanan</h3>
                  <div className="space-y-3">
                    {Object.entries(reportData.ordersByStatus).map(([status, count]) => {
                      const percentage = reportData.totalOrders > 0 ? (count / reportData.totalOrders * 100) : 0;
                      const statusColors = {
                        'menunggu_pembayaran': 'bg-yellow-500',
                        'telah_dibayar': 'bg-blue-500',
                        'done': 'bg-green-500'
                      };
                      
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${statusColors[status as keyof typeof statusColors] || 'bg-gray-500'}`}></div>
                            <span className="text-sm text-gray-700">{getStatusText(status)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${statusColors[status as keyof typeof statusColors] || 'bg-gray-500'}`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-12 text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Revenue by Category */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pendapatan per Kategori</h3>
                <div className="border border-gray-200 rounded-lg overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kategori
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jumlah Item
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pendapatan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Persentase
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(reportData.categoryRevenue)
                        .sort(([,a], [,b]) => b - a)
                        .map(([categoryId, revenue]) => {
                          const categoryName = getCategoryName(categoryId);
                          const itemCount = reportData.ordersByCategory[categoryId] || 0;
                          const percentage = reportData.totalRevenue > 0 ? (revenue / reportData.totalRevenue * 100) : 0;
                          
                          return (
                            <tr key={categoryId}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-medium text-gray-900">{categoryName}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {itemCount}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-medium text-gray-900">{formatRupiah(revenue)}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-green-500 h-2 rounded-full" 
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Daily Trend */}
              {reportData.dailyOrders.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tren Harian</h3>
                  <div className="border border-gray-200 rounded-lg overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tanggal
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Jumlah Pesanan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pendapatan
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.dailyOrders.map((day) => (
                          <tr key={day.date}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-medium text-gray-900">
                                {new Date(day.date).toLocaleDateString('id-ID')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {day.count}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-medium text-gray-900">{formatRupiah(day.revenue)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-12 pt-8 border-t border-gray-200 text-center text-xs text-gray-500">
                <p>Laporan ini dibuat secara otomatis oleh Sistem Pemesanan</p>
                <p className="mt-1">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};