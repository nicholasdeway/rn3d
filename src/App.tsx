import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { MobileFloatingNav } from './components/MobileFloatingNav';
import { useAuth } from './context/AuthContext';
import { LoginView } from './views/LoginView';
import { Box } from 'lucide-react';
import { useAppData } from './hooks/useAppData';
import { safeSetLocalStorage } from './utils/storage';
import { Client, ViewMode } from './types';

// Views
import { DashboardView } from './views/DashboardView';
import { CalculatorView } from './views/CalculatorView';
import { ProductsView } from './views/ProductsView';
import { ClientsView } from './views/ClientsView';
import { ClientProfileView } from './views/ClientProfileView';
import { ConsignmentsView } from './views/ConsignmentsView';
import { VisitsView } from './views/VisitsView';
import { VisitExecutionWizard } from './views/VisitExecutionWizard';
import { ExchangesView } from './views/ExchangesView';
import { QuotesView } from './views/QuotesView';
import { OrdersView } from './views/OrdersView';
import { GeneralInventoryView } from './views/GeneralInventoryView';
import { MovementsView } from './views/MovementsView';
import { ClientInventoryView } from './views/ClientInventoryView';
import { FinancialView } from './views/FinancialView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';

export function App() {
  const { user, loading } = useAuth();
  const appData = useAppData();

  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('rn3d_current_view');
    return (saved as ViewMode) || 'dashboard';
  });

  const [activeClientIdForProfile, setActiveClientIdForProfile] = useState<string | null>(null);
  const [activeVisitClientId, setActiveVisitClientId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [preselectedClientIdForAction, setPreselectedClientIdForAction] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (currentView) {
      safeSetLocalStorage('rn3d_current_view', currentView);
      setActiveVisitClientId(null);
    }
  }, [currentView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4 font-sans">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center animate-pulse shadow-lg shadow-indigo-600/30">
          <Box className="w-6 h-6 text-white" />
        </div>
        <p className="text-xs text-slate-400 font-medium tracking-wide">Carregando credenciais de sessão...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const handleStartVisit = (clientId: string) => {
    setActiveVisitClientId(clientId);
  };

  const handleSelectClientProfile = (clientOrId: string | Client) => {
    const id = typeof clientOrId === 'string' ? clientOrId : clientOrId.id;
    setActiveClientIdForProfile(id);
    setCurrentView('client-profile');
  };

  const selectedProfileClient =
    appData.clients.find((c) => c.id === activeClientIdForProfile) || appData.clients[0];

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex antialiased selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {appData.toast && (
        <Toast
          id={appData.toast.id}
          message={appData.toast.message}
          type={appData.toast.type}
          onClose={() => appData.setToast(null)}
        />
      )}

      {/* Desktop & Mobile Responsive Sidebar Drawer */}
      <Sidebar
        currentView={currentView}
        onSelectView={(mode) => {
          setActiveVisitClientId(null);
          setCurrentView(mode);
          setActiveClientIdForProfile(null);
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Right Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        {/* Top Header */}
        <Header
          currentView={currentView}
          onOpenMobileSidebar={() => setIsMobileMenuOpen(true)}
          products={appData.products}
          clients={appData.clients}
          orders={appData.orders}
          quotes={appData.quotes}
          onSearchChange={(query) => appData.setGlobalSearchQuery(query)}
          onSelectSearchResult={(type, id, item) => {
            appData.setGlobalSearchQuery(id || item?.id || '');
            if (type === 'order') {
              setCurrentView('orders');
            } else if (type === 'quote') {
              setCurrentView('quotes');
            } else if (type === 'product') {
              setCurrentView('products');
            } else if (type === 'client') {
              setActiveClientIdForProfile(id);
              setCurrentView('client-profile');
            }
          }}
          onQuickAction={(action) => {
            switch (action) {
              case 'sync-all':
                appData.handleSyncProductsToSupabase();
                break;
              case 'calculadora-3d':
                setCurrentView('calculator');
                break;
              case 'novo-pedido':
              case 'order':
                setCurrentView('orders');
                break;
              case 'novo-orcamento':
              case 'quote':
                setCurrentView('quotes');
                break;
              case 'nova-consignacao':
              case 'consignment':
                setCurrentView('consignments');
                break;
              case 'registrar-visita':
              case 'visit':
                setCurrentView('visits');
                break;
              case 'registrar-entrada':
              case 'inventory':
                setCurrentView('inventory-general');
                break;
              case 'product':
                setCurrentView('products');
                break;
              case 'client':
                setCurrentView('clients');
                break;
              default:
                break;
            }
          }}
        />

        {/* Dynamic View Body Container */}
        <main className="p-4 sm:p-6 lg:p-8 pb-28 lg:pb-8 flex-1 max-w-7xl w-full mx-auto">
          {/* Active Visit Wizard Modal Overlay */}
          {activeVisitClientId ? (
            <VisitExecutionWizard
              client={appData.clients.find((c) => c.id === activeVisitClientId) || appData.clients[0]}
              inventory={appData.clientInventories[activeVisitClientId] || []}
              consignments={appData.consignments}
              allProducts={appData.products}
              onCompleteVisit={(visitData) => {
                setActiveVisitClientId(null);
                appData.handleCompleteVisit(visitData);
              }}
              onCancel={() => setActiveVisitClientId(null)}
            />
          ) : (
            <>
              {currentView === 'dashboard' && (
                <DashboardView
                  clients={appData.clients}
                  visits={appData.visits}
                  products={appData.products}
                  consignments={appData.consignments}
                  orders={appData.orders}
                  onNavigate={(view) => setCurrentView(view)}
                  onStartVisit={handleStartVisit}
                  onSelectClient={handleSelectClientProfile}
                  onUpdateOrderProgress={appData.handleUpdateOrderProgress}
                  onUpdateOrderStatus={appData.handleUpdateOrderStatus}
                  onQuickAction={(action) => {
                    switch (action) {
                      case 'calculadora-3d':
                        setCurrentView('calculator');
                        break;
                      case 'novo-pedido':
                      case 'order':
                        setCurrentView('orders');
                        break;
                      case 'novo-orcamento':
                      case 'quote':
                        setCurrentView('quotes');
                        break;
                      case 'nova-consignacao':
                      case 'consignment':
                        setCurrentView('consignments');
                        break;
                      case 'nova-troca':
                      case 'exchange':
                        setCurrentView('exchanges');
                        break;
                      case 'registrar-visita':
                      case 'visit':
                        setCurrentView('visits');
                        break;
                      case 'registrar-entrada':
                      case 'inventory':
                        setCurrentView('inventory-general');
                        break;
                      case 'movimentacoes':
                      case 'movements':
                        setCurrentView('movements');
                        break;
                      case 'financeiro':
                      case 'financial':
                        setCurrentView('financial');
                        break;
                      case 'relatorios':
                      case 'reports':
                        setCurrentView('reports');
                        break;
                      default:
                        break;
                    }
                  }}
                />
              )}

              {currentView === 'calculator' && (
                <CalculatorView
                  products={appData.products}
                  onSaveAsProduct={(prodData) => {
                    appData.handleAddProduct({
                      ...prodData,
                      id: `prod-${Math.random().toString(36).substr(2, 6)}`,
                    } as any);
                    setCurrentView('products');
                  }}
                />
              )}

              {currentView === 'products' && (
                <ProductsView
                  products={appData.products}
                  onAddProduct={appData.handleAddProduct}
                  onUpdateProduct={appData.handleUpdateProduct}
                  onSyncSupabase={appData.handleSyncProductsToSupabase}
                />
              )}

              {currentView === 'clients' && (
                <ClientsView
                  clients={appData.clients}
                  onAddClient={appData.handleAddClient}
                  onSelectClient={handleSelectClientProfile}
                  onStartVisit={handleStartVisit}
                />
              )}

              {currentView === 'client-profile' && (
                <ClientProfileView
                  client={selectedProfileClient}
                  clientInventory={appData.clientInventories[selectedProfileClient?.id] || []}
                  consignments={appData.consignments.filter((c) => c.clientId === selectedProfileClient?.id)}
                  exchanges={appData.exchanges.filter(
                    (e) =>
                      e.clientId === selectedProfileClient?.id ||
                      e.destinationClientId === selectedProfileClient?.id
                  )}
                  visits={appData.visits.filter((v) => v.clientId === selectedProfileClient?.id)}
                  orders={appData.orders.filter((o) => o.clientId === selectedProfileClient?.id)}
                  quotes={appData.quotes.filter((q) => q.clientId === selectedProfileClient?.id)}
                  onBack={() => setCurrentView('clients')}
                  onStartVisit={() => handleStartVisit(selectedProfileClient.id)}
                  onAddConsignment={() => {
                    setPreselectedClientIdForAction(selectedProfileClient.id);
                    setCurrentView('consignments');
                  }}
                  onNewExchange={() => setCurrentView('exchanges')}
                  onUpdateClient={appData.handleUpdateClient}
                  onUpdateOrderProgress={appData.handleUpdateOrderProgress}
                  onUpdateOrderStatus={appData.handleUpdateOrderStatus}
                />
              )}

              {currentView === 'consignments' && (
                <ConsignmentsView
                  consignments={appData.consignments}
                  clients={appData.clients}
                  products={appData.products}
                  exchanges={appData.exchanges}
                  onAddConsignment={appData.handleAddConsignment}
                  preselectedClientId={preselectedClientIdForAction}
                />
              )}

              {currentView === 'visits' && (
                <VisitsView visits={appData.visits} onStartVisit={handleStartVisit} />
              )}

              {currentView === 'exchanges' && (
                <ExchangesView
                  exchanges={appData.exchanges}
                  clients={appData.clients}
                  clientInventories={appData.clientInventories}
                  products={appData.products}
                  onExecuteExchange={appData.handleExecuteExchange}
                />
              )}

              {currentView === 'quotes' && (
                <QuotesView
                  quotes={appData.quotes}
                  clients={appData.clients}
                  products={appData.products}
                  onCreateQuote={appData.handleCreateQuote}
                  onUpdateQuoteStatus={appData.handleUpdateQuoteStatus}
                />
              )}

              {currentView === 'orders' && (
                <OrdersView
                  orders={appData.orders}
                  clients={appData.clients}
                  products={appData.products}
                  onCreateOrder={appData.handleCreateOrder}
                  onDeleteOrder={appData.handleDeleteOrder}
                  onUpdateOrderProgress={appData.handleUpdateOrderProgress}
                  onUpdateOrderStatus={appData.handleUpdateOrderStatus}
                  onUpdateOrderPayment={appData.handleUpdateOrderPayment}
                />
              )}

              {currentView === 'inventory-general' && (
                <GeneralInventoryView
                  products={appData.products}
                  onUpdateStock={appData.handleUpdateStock}
                />
              )}

              {currentView === 'movements' && (
                <MovementsView movements={appData.movements} products={appData.products} />
              )}

              {currentView === 'inventory-clients' && (
                <ClientInventoryView
                  clientInventories={appData.clientInventories}
                  clients={appData.clients}
                />
              )}

              {currentView === 'financial' && (
                <FinancialView
                  transactions={appData.transactions}
                  orders={appData.orders}
                  consignments={appData.consignments}
                  onRecordPayment={appData.handleUpdateOrderPayment}
                />
              )}

              {currentView === 'reports' && (
                <ReportsView
                  products={appData.products}
                  orders={appData.orders}
                  consignments={appData.consignments}
                />
              )}

              {currentView === 'settings' && <SettingsView onShowToast={appData.showToast} />}
            </>
          )}
        </main>
      </div>

      {/* Floating Bottom Footer Navigation Bar on Mobile */}
      <MobileFloatingNav
        currentView={currentView}
        onSelectView={(mode) => {
          setCurrentView(mode);
          setActiveClientIdForProfile(null);
        }}
        onQuickAction={() => setCurrentView('quotes')}
      />
    </div>
  );
}

export default App;
