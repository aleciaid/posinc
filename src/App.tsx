import React, { useState } from 'react';
import { ShoppingCart, Settings as SettingsIcon, Home, BarChart3, Menu, X } from 'lucide-react';
import { OrderList } from './components/OrderList';
import { OrderCreator } from './components/OrderCreator';
import { OrderView } from './components/OrderView';
import { Settings } from './components/Settings';
import { Reports } from './components/Reports';
import { Order } from './types/order';

type View = 'list' | 'create' | 'edit' | 'view' | 'settings' | 'reports';

function App() {
  const [currentView, setCurrentView] = useState<View>('list');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCreateNew = () => {
    setEditingOrder(null);
    setCurrentView('create');
    setMobileMenuOpen(false);
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setCurrentView('edit');
  };

  const handleView = (order: Order) => {
    setViewingOrder(order);
    setCurrentView('view');
  };

  const handleSave = () => {
    setEditingOrder(null);
    setCurrentView('list');
  };

  const handleCancel = () => {
    setEditingOrder(null);
    setCurrentView('list');
  };

  const handleBack = () => {
    setViewingOrder(null);
    setCurrentView('list');
  };

  const handleShowSettings = () => {
    setCurrentView('settings');
    setMobileMenuOpen(false);
  };

  const handleShowReports = () => {
    setCurrentView('reports');
    setMobileMenuOpen(false);
  };

  const handleNavigation = (view: View) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'create':
      case 'edit':
        return (
          <OrderCreator
            editingOrder={editingOrder}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        );
      case 'view':
        return viewingOrder ? (
          <OrderView
            order={viewingOrder}
            onBack={handleBack}
          />
        ) : null;
      case 'settings':
        return <Settings onBack={handleBack} />;
      case 'reports':
        return <Reports onBack={handleBack} />;
      default:
        return (
          <OrderList
            onCreateNew={handleCreateNew}
            onEdit={handleEdit}
            onView={handleView}
          />
        );
    }
  };

  const navigationItems = [
    { id: 'list', name: 'Dashboard', icon: Home },
    { id: 'reports', name: 'Laporan', icon: BarChart3 },
    { id: 'settings', name: 'Pengaturan', icon: SettingsIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header - Hidden when viewing order */}
      {currentView !== 'view' && (
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo and Brand */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                <span className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  Sistem Pemesanan
                </span>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.id as View)}
                      className={`flex items-center space-x-2 px-3 lg:px-4 py-2 rounded-lg font-medium transition-colors text-sm lg:text-base ${
                        currentView === item.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden lg:inline">{item.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  aria-label="Toggle mobile menu"
                >
                  {mobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Navigation Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden border-t border-gray-200 py-2">
                <div className="space-y-1">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigation(item.id as View)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg font-medium transition-colors ${
                          currentView === item.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="relative">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;