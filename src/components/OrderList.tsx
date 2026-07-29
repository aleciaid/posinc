import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, ShoppingCart, Clock, CheckCircle, Package, Filter, Download } from 'lucide-react';
import { Order } from '../types/order';
import { getOrders, deleteOrder, updateOrderStatus, exportOrdersData, importOrdersData } from '../utils/orderStorage';
import { formatRupiah } from '../utils/currency';

interface OrderListProps {
  onCreateNew: () => void;
  onEdit: (order: Order) => void;
  onView: (order: Order) => void;
}

export const OrderList: React.FC<OrderListProps> = ({ onCreateNew, onEdit, onView }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'menunggu_pembayaran' | 'telah_dibayar' | 'done'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'total' | 'status'>('date');
  const [showFilters, setShowFilters] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    setOrders(getOrders());
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pesanan ini?')) {
      deleteOrder(id);
      loadOrders();
    }
  };

  const handleStatusChange = (id: string, newStatus: Order['status']) => {
    updateOrderStatus(id, newStatus);
    loadOrders();
  };

  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.phone.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'total':
          return b.total - a.total;
        case 'status':
          const statusOrder = { 'menunggu_pembayaran': 0, 'telah_dibayar': 1, 'done': 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return 0;
      }
    });

  const handleExport = (format: 'csv' | 'json') => {
    exportOrdersData(filteredOrders, format);
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
        return <Clock className="w-4 h-4" />;
      case 'telah_dibayar':
        return <CheckCircle className="w-4 h-4" />;
      case 'done':
        return <Package className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const totalOrders = orders.length;
  const totalRevenue = orders.filter(order => order.status !== 'menunggu_pembayaran').reduce((sum, order) => sum + order.total, 0);
  const pendingOrders = orders.filter(order => order.status === 'menunggu_pembayaran').length;
  const completedOrders = orders.filter(order => order.status === 'done').length;

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Dashboard Pesanan</h1>
              <p className="text-gray-600">Kelola dan pantau semua pesanan Anda</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onCreateNew}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors touch-target"
              >
                <Plus className="w-5 h-5" />
                <span>Buat Pesanan</span>
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="hidden sm:inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                title="Export CSV"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => handleExport('json')}
                className="hidden sm:inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                title="Export JSON"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Pesanan</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalOrders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Pendapatan</p>
                <p className="text-sm sm:text-2xl font-bold text-gray-900">{formatRupiah(totalRevenue)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Menunggu Pembayaran</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{pendingOrders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Pesanan Selesai</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{completedOrders}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari pesanan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
            </div>

            {/* Filter Toggle Button (Mobile) */}
            <div className="flex items-center justify-between sm:hidden">
              <span className="text-sm font-medium text-gray-700">Filter & Urutkan</span>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-target"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm">{showFilters ? 'Sembunyikan' : 'Tampilkan'}</span>
              </button>
            </div>

            {/* Filters */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${showFilters ? 'block' : 'hidden sm:grid'}`}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              >
                <option value="all">Semua Status</option>
                <option value="menunggu_pembayaran">Menunggu Pembayaran</option>
                <option value="telah_dibayar">Telah Dibayar</option>
                <option value="done">Selesai</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              >
                <option value="date">Urutkan berdasarkan Tanggal</option>
                <option value="total">Urutkan berdasarkan Total</option>
                <option value="status">Urutkan berdasarkan Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Order List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada pesanan ditemukan</h3>
              <p className="text-gray-600 mb-6">
                {orders.length === 0 
                  ? "Mulai dengan membuat pesanan pertama Anda"
                  : "Coba sesuaikan kriteria pencarian atau filter"
                }
              </p>
              {orders.length === 0 && (
                <button
                  onClick={onCreateNew}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors touch-target"
                >
                  Buat Pesanan Pertama
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="block lg:hidden divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-medium text-gray-900">{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">{order.items.length} item(s)</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatRupiah(order.total)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(order.date).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-sm text-gray-900">{order.customer.name}</div>
                      <div className="text-sm text-gray-500">{order.customer.phone}</div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                        className={`text-xs font-semibold rounded-full px-3 py-1 border-0 ${getStatusColor(order.status)} focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="menunggu_pembayaran">Menunggu Pembayaran</option>
                        <option value="telah_dibayar">Telah Dibayar</option>
                        <option value="done">Selesai</option>
                      </select>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onView(order)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-target"
                          title="Lihat Pesanan"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(order)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors touch-target"
                          title="Edit Pesanan"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-target"
                          title="Hapus Pesanan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pesanan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pelanggan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{order.orderNumber}</div>
                          <div className="text-sm text-gray-500">{order.items.length} item(s)</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.customer.name}</div>
                          <div className="text-sm text-gray-500">{order.customer.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(order.date).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatRupiah(order.total)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                              className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(order.status)} focus:ring-2 focus:ring-blue-500`}
                            >
                              <option value="menunggu_pembayaran">Menunggu Pembayaran</option>
                              <option value="telah_dibayar">Telah Dibayar</option>
                              <option value="done">Selesai</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => onView(order)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Lihat Pesanan"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onEdit(order)}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                              title="Edit Pesanan"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(order.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Pesanan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};