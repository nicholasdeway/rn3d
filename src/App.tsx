import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { BillReminderModal } from './components/BillReminderModal';
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
import { ExpensesView } from './views/ExpensesView';
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
  const [autoOpenNewProductModal, setAutoOpenNewProductModal] = useState(false);
  const [autoOpenExpenseModal, setAutoOpenExpenseModal] = useState<'aporte' | 'withdrawal' | 'expense' | null>(null);

  // Persistent Theme Mode state ('light' | 'dark') — Default: 'dark'
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('rn3d_theme');
    if (saved === 'light') return 'light';
    return 'dark';
  });

  useEffect(() => {
    localStorage.setItem('rn3d_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    if (currentView) {
      safeSetLocalStorage('rn3d_current_view', currentView);
      setActiveVisitClientId(null);
      if (currentView !== 'products') {
        setAutoOpenNewProductModal(false);
      }
    }
  }, [currentView]);

  const allMovements = useMemo(() => {
    if (appData.movements && appData.movements.length > 0) {
      return appData.movements;
    }

    const derived: any[] = [];

    (appData.consignments || []).forEach((c) => {
      (c.items || []).forEach((item, idx) => {
        derived.push({
          id: `MOV-REM-${c.id}-${idx}`,
          timestamp: c.createdAt || c.date,
          productId: item.productId,
          productName: item.productName,
          quantityDelta: -item.quantity,
          type: 'Consignação',
          clientName: c.clientName,
          referenceCode: c.id,
          notes: `Remessa alocada no expositor`,
        });
      });
    });

    (appData.exchanges || []).forEach((ex) => {
      (ex.itemsRemoved || []).forEach((item, idx) => {
        derived.push({
          id: `MOV-TRC-${ex.id}-${idx}`,
          timestamp: ex.createdAt || ex.date,
          productId: item.productId,
          productName: item.productName,
          quantityDelta: item.quantity,
          type: 'Retirada',
          clientName: ex.clientName,
          referenceCode: ex.id,
          notes: item.reason || 'Recolhimento para Oficina RN 3D',
        });
      });
    });

    (appData.orders || []).forEach((o) => {
      (o.items || []).forEach((item, idx) => {
        derived.push({
          id: `MOV-PED-${o.id}-${idx}`,
          timestamp: o.createdAt || o.date,
          productId: `prod-${idx}`,
          productName: item.productName,
          quantityDelta: item.quantity,
          type: 'Produção',
          clientName: o.clientName,
          referenceCode: o.id,
          notes: `Pedido oficial de venda e produção`,
        });
      });
    });

    return derived;
  }, [appData.movements, appData.consignments, appData.exchanges, appData.orders]);

  interface NavigationHistoryEntry {
    view: ViewMode;
    activeClientIdForProfile: string | null;
    activeVisitClientId: string | null;
  }

  const [historyStack, setHistoryStack] = useState<NavigationHistoryEntry[]>(() => {
    const initialView = (localStorage.getItem('rn3d_current_view') as ViewMode) || 'dashboard';
    return [{ view: initialView, activeClientIdForProfile: null, activeVisitClientId: null }];
  });

  // Unified Navigation Manager with internal SPA history stack and 2-stage hierarchy
  const navigateTo = (
    view: ViewMode,
    options?: {
      clientIdForProfile?: string | null;
      visitClientId?: string | null;
      replace?: boolean;
    }
  ) => {
    const nextClientProfileId = options?.clientIdForProfile !== undefined ? options.clientIdForProfile : null;
    const nextVisitClientId = options?.visitClientId !== undefined ? options.visitClientId : null;

    const newEntry: NavigationHistoryEntry = {
      view,
      activeClientIdForProfile: nextClientProfileId,
      activeVisitClientId: nextVisitClientId,
    };

    // Estágio 2: Perfil do Cliente -> garante que 'clients' (Estágio 1) esteja no histórico como pai
    if (view === 'client-profile' && nextClientProfileId) {
      setHistoryStack((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (!last || last.view !== 'clients') {
          copy.push({ view: 'clients', activeClientIdForProfile: null, activeVisitClientId: null });
        }
        copy.push(newEntry);
        return copy;
      });
      window.history.pushState({ view: 'clients', activeClientIdForProfile: null, activeVisitClientId: null }, '', '#clients');
      window.history.pushState(newEntry, '', `#${view}`);
      setCurrentView(view);
      setActiveClientIdForProfile(nextClientProfileId);
      setActiveVisitClientId(nextVisitClientId);
      return;
    }

    // Estágio 2: Execução de Visita -> garante que 'visits' (Estágio 1) esteja no histórico como pai
    if (nextVisitClientId) {
      setHistoryStack((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (!last || last.view !== 'visits') {
          copy.push({ view: 'visits', activeClientIdForProfile: null, activeVisitClientId: null });
        }
        copy.push(newEntry);
        return copy;
      });
      window.history.pushState({ view: 'visits', activeClientIdForProfile: null, activeVisitClientId: null }, '', '#visits');
      window.history.pushState(newEntry, '', `#${view}`);
      setCurrentView(view);
      setActiveClientIdForProfile(null);
      setActiveVisitClientId(nextVisitClientId);
      return;
    }

    if (options?.replace) {
      setHistoryStack((prev) => {
        const copy = [...prev];
        if (copy.length > 0) copy[copy.length - 1] = newEntry;
        else copy.push(newEntry);
        return copy;
      });
      window.history.replaceState({ view, activeClientIdForProfile: nextClientProfileId, activeVisitClientId: nextVisitClientId }, '', `#${view}`);
    } else {
      setHistoryStack((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.view === view && last.activeClientIdForProfile === nextClientProfileId && last.activeVisitClientId === nextVisitClientId) {
          return prev;
        }
        return [...prev, newEntry];
      });
      window.history.pushState({ view, activeClientIdForProfile: nextClientProfileId, activeVisitClientId: nextVisitClientId }, '', `#${view}`);
    }

    setCurrentView(view);
    setActiveClientIdForProfile(nextClientProfileId);
    setActiveVisitClientId(nextVisitClientId);
  };

  // Sync initial history state and intercept native Android back gesture (popstate/hashchange)
  useEffect(() => {
    const initialView = currentView || 'dashboard';

    // Push initial anchor state so Android always has a history entry to pop
    window.history.replaceState({ view: 'dashboard', isBase: true }, '', '#dashboard');
    if (initialView !== 'dashboard') {
      window.history.pushState({ view: initialView, activeClientIdForProfile, activeVisitClientId }, '', `#${initialView}`);
    }

    const handlePopState = (event: PopStateEvent) => {
      setHistoryStack((prevStack) => {
        if (prevStack.length > 1) {
          const nextStack = prevStack.slice(0, prevStack.length - 1);
          const prevEntry = nextStack[nextStack.length - 1];

          setCurrentView(prevEntry.view);
          setActiveClientIdForProfile(prevEntry.activeClientIdForProfile);
          setActiveVisitClientId(prevEntry.activeVisitClientId);

          return nextStack;
        } else {
          // Lock anchor state so Android native gesture does not close the browser
          window.history.pushState({ view: 'dashboard', isBase: true }, '', '#dashboard');
          setCurrentView('dashboard');
          setActiveClientIdForProfile(null);
          setActiveVisitClientId(null);
          return [{ view: 'dashboard', activeClientIdForProfile: null, activeVisitClientId: null }];
        }
      });
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleGoBack = () => {
    if (historyStack.length > 1) {
      window.history.back();
    } else {
      setHistoryStack([{ view: 'dashboard', activeClientIdForProfile: null, activeVisitClientId: null }]);
      window.history.replaceState({ view: 'dashboard', activeClientIdForProfile: null, activeVisitClientId: null }, '', '#dashboard');
      setCurrentView('dashboard');
      setActiveClientIdForProfile(null);
      setActiveVisitClientId(null);
    }
  };

  const canGoBack = historyStack.length > 1 || (currentView !== 'dashboard' || activeClientIdForProfile !== null || activeVisitClientId !== null);

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
    navigateTo('visits', { visitClientId: clientId });
  };

  const handleSelectClientProfile = (clientOrId: string | Client) => {
    const id = typeof clientOrId === 'string' ? clientOrId : clientOrId.id;
    navigateTo('client-profile', { clientIdForProfile: id });
  };

  const selectedProfileClient =
    appData.clients.find((c) => c.id === activeClientIdForProfile) || appData.clients[0];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0c0e12] text-slate-900 dark:text-slate-100 font-sans flex antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Toast Notification */}
      {appData.toast && (
        <Toast
          id={appData.toast.id}
          message={appData.toast.message}
          type={appData.toast.type}
          onClose={() => appData.setToast(null)}
        />
      )}

      {/* Pop-up Responsivo de Lembrete de Contas Fixas (7 e 3 Dias) */}
      <BillReminderModal
        billAlerts={appData.billAlerts}
        onMarkPaid={appData.handleMarkBillPaid}
        onNavigate={(mode) => navigateTo(mode)}
      />

      {/* Desktop & Mobile Responsive Sidebar Drawer */}
      <Sidebar
        currentView={currentView}
        onSelectView={(mode) => navigateTo(mode)}
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
          canGoBack={canGoBack}
          onGoBack={handleGoBack}
          onOpenMobileSidebar={() => setIsMobileMenuOpen(true)}
          onNavigate={(view) => navigateTo(view)}
          products={appData.products}
          clients={appData.clients}
          orders={appData.orders}
          quotes={appData.quotes}
          billAlerts={appData.billAlerts}
          pendingAlertsCount={appData.pendingAlertsCount}
          urgentAlertsCount={appData.urgentAlertsCount}
          onMarkBillPaid={appData.handleMarkBillPaid}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onSearchChange={(query) => appData.setGlobalSearchQuery(query)}

          onSelectSearchResult={(type, id, item) => {
            appData.setGlobalSearchQuery(id || item?.id || '');
            if (type === 'order') {
              navigateTo('orders');
            } else if (type === 'quote') {
              navigateTo('quotes');
            } else if (type === 'product') {
              navigateTo('products');
            } else if (type === 'client') {
              navigateTo('client-profile', { clientIdForProfile: id });
            }
          }}
          onQuickAction={(action) => {
            switch (action) {
              case 'sync-all':
                appData.handleSyncProductsToSupabase();
                break;
              case 'calculadora-3d':
                navigateTo('calculator');
                break;
              case 'novo-pedido':
              case 'order':
                navigateTo('orders');
                break;
              case 'novo-orcamento':
              case 'quote':
                navigateTo('quotes');
                break;
              case 'nova-consignacao':
              case 'consignment':
                navigateTo('consignments');
                break;
              case 'registrar-visita':
              case 'visit':
                navigateTo('visits');
                break;
              case 'registrar-entrada':
              case 'inventory':
                navigateTo('inventory-general');
                break;
              case 'novo-produto':
              case 'cadastrar-produto':
              case 'product':
                setAutoOpenNewProductModal(true);
                navigateTo('products');
                break;
              case 'client':
                navigateTo('clients');
                break;
              default:
                break;
            }
          }}
        />

        {/* Dynamic View Body Container (Full-width expanded layout) */}
        <main className="p-4 sm:p-6 lg:p-8 pb-28 lg:pb-8 flex-1 w-full">
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
                  products={appData.products}
                  visits={appData.visits}
                  consignments={appData.consignments}
                  orders={appData.orders}
                  transactions={appData.transactions}
                  expenses={appData.expenses}
                  onNavigate={(view) => navigateTo(view)}
                  onStartVisit={handleStartVisit}
                  onSelectClient={handleSelectClientProfile}
                  onUpdateOrderProgress={appData.handleUpdateOrderProgress}
                  onUpdateOrderStatus={appData.handleUpdateOrderStatus}
                  onQuickAction={(action) => {
                    switch (action) {
                      case 'novo-produto':
                      case 'cadastrar-produto':
                      case 'product':
                        setAutoOpenNewProductModal(true);
                        navigateTo('products');
                        break;
                      case 'calculadora-3d':
                        navigateTo('calculator');
                        break;
                      case 'novo-pedido':
                      case 'order':
                        navigateTo('orders');
                        break;
                      case 'novo-orcamento':
                      case 'quote':
                        navigateTo('quotes');
                        break;
                      case 'nova-consignacao':
                      case 'consignment':
                        navigateTo('consignments');
                        break;
                      case 'nova-troca':
                      case 'exchange':
                        navigateTo('exchanges');
                        break;
                      case 'registrar-visita':
                      case 'visit':
                        navigateTo('visits');
                        break;
                      case 'registrar-entrada':
                      case 'inventory':
                        navigateTo('inventory-general');
                        break;
                      case 'movimentacoes':
                      case 'movements':
                        navigateTo('inventory-movements');
                        break;
                      case 'financeiro':
                      case 'financial':
                        navigateTo('financial');
                        break;
                      case 'relatorios':
                      case 'reports':
                        navigateTo('reports');
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
                  onAddProduct={(p) => {
                    appData.handleAddProduct(p);
                    setAutoOpenNewProductModal(false);
                  }}
                  onUpdateProduct={appData.handleUpdateProduct}
                  onDeleteProduct={appData.handleDeleteProduct}
                  onSyncSupabase={appData.handleSyncProductsToSupabase}
                  autoOpenNewModal={autoOpenNewProductModal}
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
                  onNewConsignment={(clientId) => {
                    setPreselectedClientIdForAction(clientId || selectedProfileClient.id);
                    setCurrentView('consignments');
                  }}
                  onNewOrder={(clientId) => {
                    setPreselectedClientIdForAction(clientId || selectedProfileClient.id);
                    setCurrentView('orders');
                  }}
                  onNewQuote={(clientId) => {
                    setPreselectedClientIdForAction(clientId || selectedProfileClient.id);
                    setCurrentView('quotes');
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
                  onUpdateConsignment={appData.handleUpdateConsignment}
                  onDeleteConsignment={appData.handleDeleteConsignment}
                  onClearConsignments={appData.handleClearConsignments}
                  preselectedClientId={preselectedClientIdForAction}
                />
              )}

              {currentView === 'visits' && (
                <VisitsView
                  visits={appData.visits}
                  clients={appData.clients}
                  onStartVisit={handleStartVisit}
                  onScheduleVisit={appData.handleScheduleVisit}
                  onDeleteVisit={appData.handleDeleteVisit}
                />
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
                  onAddQuote={appData.handleCreateQuote}
                  onUpdateQuote={appData.handleUpdateQuote}
                  onUpdateQuoteStatus={appData.handleUpdateQuoteStatus}
                  onConvertQuoteToOrder={(quote) => appData.handleUpdateQuoteStatus(quote.id, 'Convertido em Pedido')}
                  preselectedClientId={preselectedClientIdForAction}
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

              {(currentView === 'movements' || currentView === 'inventory-movements') && (
                <MovementsView movements={allMovements} />
              )}

              {currentView === 'inventory-clients' && (
                <ClientInventoryView
                  clientInventories={appData.clientInventories}
                  clients={appData.clients}
                  consignments={appData.consignments}
                  exchanges={appData.exchanges}
                  onNavigateToExchanges={(cliId) => {
                    setPreselectedClientIdForAction(cliId);
                    setCurrentView('exchanges');
                  }}
                />
              )}

              {currentView === 'financial' && (
                <FinancialView
                  transactions={appData.transactions}
                  orders={appData.orders}
                  consignments={appData.consignments}
                  onUpdateOrderPayment={appData.handleUpdateOrderPayment}
                  onRecordPayment={appData.handleUpdateOrderPayment}
                />
              )}

              {currentView === 'expenses' && (
                <ExpensesView
                  expenses={appData.expenses}
                  accountBalances={appData.accountBalances}
                  accountBalance={appData.accountBalance}
                  autoOpenModal={autoOpenExpenseModal}
                  isLoading={appData.dataLoading}
                  recurringBills={appData.recurringBills}
                  billAlerts={appData.billAlerts}
                  onCreateExpense={appData.handleCreateExpense}
                  onExecuteTransfer={appData.handleExecuteTransfer}
                  onUpdateExpense={appData.handleUpdateExpense}
                  onDeleteExpense={appData.handleDeleteExpense}
                  onUpdateSingleBalance={appData.handleUpdateSingleBalance}
                  onCreateBill={appData.handleCreateBill}
                  onUpdateBill={appData.handleUpdateBill}
                  onDeleteBill={appData.handleDeleteBill}
                  onMarkBillPaid={appData.handleMarkBillPaid}
                />
              )}


              {currentView === 'reports' && (
                <ReportsView
                  products={appData.products}
                  orders={appData.orders}
                  consignments={appData.consignments}
                  transactions={appData.transactions}
                  clients={appData.clients}
                  expenses={appData.expenses}
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
          setAutoOpenExpenseModal(null);
          setCurrentView(mode);
          setActiveClientIdForProfile(null);
        }}
        onQuickAction={(actionType) => {
          if (actionType === 'quote') {
            setAutoOpenExpenseModal(null);
            setCurrentView('quotes');
          } else {
            setAutoOpenExpenseModal(actionType);
            setCurrentView('expenses');
          }
        }}
      />
    </div>
  );
}

export default App;
