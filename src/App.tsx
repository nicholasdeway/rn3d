import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { useAuth } from './context/AuthContext';
import { LoginView } from './views/LoginView';
import { Box } from 'lucide-react';
import { fetchProducts, createProduct, updateProduct, syncMissingProductsToSupabase } from './services/productsService';
import { fetchClients, createClient, updateClient, syncMissingClientsToSupabase } from './services/clientsService';
import { fetchOrders, createOrder, updateOrderStatus, updateOrderProgress, syncMissingOrdersToSupabase, deleteOrder, updateOrderPayment } from './services/ordersService';
import { fetchQuotes, createQuote, updateQuoteStatus, syncMissingQuotesToSupabase } from './services/quotesService';

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

import { Client, Consignment, Order, Product, Quote, ViewMode, Visit } from './types';
import { MobileFloatingNav } from './components/MobileFloatingNav';

export function App() {
  const { user, loading } = useAuth();

  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('rn3d_current_view');
    return (saved as ViewMode) || 'dashboard';
  });

  useEffect(() => {
    if (currentView) {
      localStorage.setItem('rn3d_current_view', currentView);
    }
  }, [currentView]);
  const [activeClientIdForProfile, setActiveClientIdForProfile] = useState<string | null>(null);
  const [activeVisitClientId, setActiveVisitClientId] = useState<string | null>(null);

  // Sidebar collapse & mobile menu states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Preselection for modal wizards
  const [preselectedClientIdForAction, setPreselectedClientIdForAction] = useState<string | undefined>(undefined);

  // Toast Notification state
  const [toast, setToast] = useState<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);



  const isSampleMockItem = (item: any) => {
    if (!item) return false;
    const id = String(item.id || '');
    const name = String(item.name || item.clientName || '').toLowerCase();
    return (
      id === 'cli-1' ||
      id === 'cli-2' ||
      id === 'cli-3' ||
      id === 'cli-4' ||
      id === 'cli-5' ||
      id === 'cli-6' ||
      id === 'REM-000041' ||
      id === 'REM-000040' ||
      id === 'VIS-000052' ||
      id === 'VIS-000051' ||
      id === 'VIS-000050' ||
      id === 'TRC-000014' ||
      id === 'ORC-000034' ||
      id === 'ORC-000033' ||
      id === 'ORC-920984' ||
      id === 'PED-000081' ||
      id === 'PED-000080' ||
      id === 'PED-817946' ||
      id === 'sal-1' ||
      id === 'sal-2' ||
      id === 'sal-3' ||
      id === 'mov-1' ||
      id === 'mov-2' ||
      id === 'mov-3' ||
      id === 'mov-4' ||
      name.includes('depósito avenida') ||
      name.includes('bar do joão') ||
      name.includes('adega imperial') ||
      name.includes('conveniência central') ||
      name.includes('empresa abc')
    );
  };

  // Real Database State (Initialized with localStorage persistence)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('rn3d_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading products from localStorage:', e);
    }
    return [];
  });

  useEffect(() => {
    if (products) {
      try {
        localStorage.setItem('rn3d_products', JSON.stringify(products));
      } catch (e) {
        console.error('Error saving products to localStorage:', e);
      }
    }
  }, [products]);

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem('rn3d_clients');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((c) => !isSampleMockItem(c));
        }
      }
    } catch (e) {
      console.error('Error loading clients from localStorage:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('rn3d_clients', JSON.stringify(clients));
    } catch (e) {
      console.error('Error saving clients to localStorage:', e);
    }
  }, [clients]);

  const [consignments, setConsignments] = useState<Consignment[]>(() => {
    try {
      const saved = localStorage.getItem('rn3d_consignments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((c) => !isSampleMockItem(c));
        }
      }
    } catch (e) {
      console.error('Error loading consignments from localStorage:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('rn3d_consignments', JSON.stringify(consignments));
    } catch (e) {
      console.error('Error saving consignments to localStorage:', e);
    }
  }, [consignments]);

  const [visits, setVisits] = useState<Visit[]>(() => {
    try {
      const saved = localStorage.getItem('rn3d_visits');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((v) => !isSampleMockItem(v));
        }
      }
    } catch (e) {
      console.error('Error loading visits from localStorage:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('rn3d_visits', JSON.stringify(visits));
    } catch (e) {
      console.error('Error saving visits to localStorage:', e);
    }
  }, [visits]);

  const [exchanges, setExchanges] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('rn3d_exchanges');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((ex) => !isSampleMockItem(ex));
        }
      }
    } catch (e) {
      console.error('Error loading exchanges from localStorage:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('rn3d_exchanges', JSON.stringify(exchanges));
    } catch (e) {
      console.error('Error saving exchanges to localStorage:', e);
    }
  }, [exchanges]);

  const [quotes, setQuotes] = useState<Quote[]>(() => {
    try {
      const saved = localStorage.getItem('rn3d_quotes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((q) => !isSampleMockItem(q));
        }
      }
    } catch (e) {
      console.error('Error loading quotes from localStorage:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('rn3d_quotes', JSON.stringify(quotes));
    } catch (e) {
      console.error('Error saving quotes to localStorage:', e);
    }
  }, [quotes]);

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('rn3d_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((o: any) => !isSampleMockItem(o));
          return filtered;
        }
      }
    } catch (e) {
      console.error('Error loading orders from localStorage:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('rn3d_orders', JSON.stringify(orders));
    } catch (e) {
      console.error('Error saving orders to localStorage:', e);
    }
  }, [orders]);

  // Auto-sync: Ensure every converted or approved quote has a corresponding Order in orders list
  useEffect(() => {
    if (!quotes || quotes.length === 0) return;

    quotes.forEach((q) => {
      const isApprovedOrConverted =
        q.status === 'Convertido em Pedido' ||
        q.status === 'Convertido' ||
        q.status === 'Aprovado';

      if (isApprovedOrConverted) {
        setOrders((prevOrders) => {
          const exists = prevOrders.some(
            (o) =>
              o.timeline.some((t) => t.description?.includes(q.id) || t.title?.includes(q.id)) ||
              (o.clientName === q.clientName && Math.abs(o.totalValue - q.total) < 0.01)
          );

          if (!exists) {
            const newOrder: Order = {
              id: `PED-${Math.floor(Math.random() * 900000 + 100000)}`,
              clientId: q.clientId,
              clientName: q.clientName,
              date: q.date || new Date().toISOString().split('T')[0],
              itemsCount: q.items ? q.items.reduce((acc, i) => acc + i.quantity, 0) : 1,
              totalValue: q.total,
              paidAmount: 0.0,
              paymentStatusText: 'Aguardando Pagamento',
              status: 'Em produção',
              productionProgressPct: 15,
              productionSlaDate: q.date || new Date().toISOString().split('T')[0],
              estimatedDeliveryDate: q.date || new Date().toISOString().split('T')[0],
              internalLogisticsType: q.internalLogisticsType || 'combustivel',
              internalLogisticsCost: q.internalLogisticsCost ?? 0,
              notes: q.notes,
              paymentTerms: q.paymentTerms,
              items: (q.items || []).map((i) => ({
                productName: i.description,
                quantity: i.quantity,
                unitPrice: i.unitPrice || (i.subtotal / (i.quantity || 1)),
                subtotal: i.subtotal,
              })),
              timeline: [
                {
                  date: `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
                  title: `Orçamento ${q.id} Convertido em Pedido Oficial`,
                  description: `Origem: Orçamento ${q.id}`,
                },
                {
                  date: `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
                  title: 'Fila de Impressão 3D Iniciada',
                },
              ],
            };
            return [newOrder, ...prevOrders];
          }
          return prevOrders;
        });
      }
    });
  }, [quotes]);

  const [transactions, setTransactions] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('rn3d_transactions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((t) => !isSampleMockItem(t));
        }
      }
    } catch (e) {
      console.error('Error loading transactions from localStorage:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('rn3d_transactions', JSON.stringify(transactions));
    } catch (e) {
      console.error('Error saving transactions to localStorage:', e);
    }
  }, [transactions]);

  const [movements, setMovements] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('rn3d_movements');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((m) => !isSampleMockItem(m));
        }
      }
    } catch (e) {
      console.error('Error loading movements from localStorage:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('rn3d_movements', JSON.stringify(movements));
    } catch (e) {
      console.error('Error saving movements to localStorage:', e);
    }
  }, [movements]);

  const [clientInventories, setClientInventories] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem('rn3d_client_inventories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const cleaned: Record<string, any> = {};
          Object.keys(parsed).forEach((key) => {
            if (key !== 'cli-1' && key !== 'cli-2' && key !== 'cli-3' && key !== 'cli-4' && key !== 'cli-5') {
              cleaned[key] = parsed[key];
            }
          });
          return cleaned;
        }
      }
    } catch (e) {
      console.error('Error loading clientInventories from localStorage:', e);
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem('rn3d_client_inventories', JSON.stringify(clientInventories));
    } catch (e) {
      console.error('Error saving clientInventories to localStorage:', e);
    }
  }, [clientInventories]);

  useEffect(() => {
    try {
      localStorage.setItem('rn3d_client_inventories', JSON.stringify(clientInventories));
    } catch (e) {
      console.error('Error saving clientInventories to localStorage:', e);
    }
  }, [clientInventories]);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [dataLoading, setDataLoading] = useState<boolean>(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({
      id: Date.now().toString(),
      message,
      type,
    });
  };

  // Fetch real data from Supabase PostgreSQL when authenticated
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    setDataLoading(true);

    const loadAllData = async () => {
      try {
        const [dbProducts, dbClients, dbOrders, dbQuotes] = await Promise.all([
          fetchProducts(),
          fetchClients(),
          fetchOrders(),
          fetchQuotes(),
        ]);
        if (!isMounted) return;
        setProducts(dbProducts);
        setClients(dbClients);
        setOrders(dbOrders);
        setQuotes(dbQuotes);
      } catch (err) {
        console.error('Erro ao carregar dados do Supabase:', err);
      } finally {
        if (isMounted) setDataLoading(false);
      }
    };

    loadAllData();

    // 100% Automatic Background Sync Loop every 12 seconds
    const intervalId = setInterval(async () => {
      if (!isMounted) return;
      try {
        const [dbProducts, dbClients, dbOrders, dbQuotes] = await Promise.all([
          fetchProducts(),
          fetchClients(),
          fetchOrders(),
          fetchQuotes(),
        ]);
        if (!isMounted) return;
        setProducts(dbProducts);
        setClients(dbClients);
        setOrders(dbOrders);
        setQuotes(dbQuotes);
      } catch (e) {
        // Silent background sync error
      }
    }, 12000);

    // Immediate sync when user refocuses app tab
    const handleFocus = () => {
      if (!isMounted) return;
      loadAllData();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

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

  // Callbacks with Supabase persistence
  const handleAddProduct = async (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
    showToast(`Produto "${newProd.name}" cadastrado com sucesso!`, 'success');
    try {
      const savedInDb = await createProduct(newProd);
      if (savedInDb && savedInDb.id) {
        setProducts((prev) =>
          prev.map((p) => (p.id === newProd.id ? { ...p, id: savedInDb.id } : p))
        );
      }
    } catch (err: any) {
      console.error('Erro ao salvar produto no Supabase:', err);
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    showToast(`Produto "${updatedProduct.name}" atualizado com sucesso!`, 'success');
    try {
      await updateProduct(updatedProduct.id, updatedProduct);
    } catch (err) {
      console.error('Erro ao atualizar produto no Supabase:', err);
    }
  };

  const handleSyncProductsToSupabase = async () => {
    try {
      showToast('Sincronizando todo o sistema com o Supabase (Produtos, Clientes, Pedidos e Orçamentos)...', 'info');
      const [pCount, cCount, oCount, qCount] = await Promise.all([
        syncMissingProductsToSupabase(products),
        syncMissingClientsToSupabase(clients),
        syncMissingOrdersToSupabase(orders),
        syncMissingQuotesToSupabase(quotes),
      ]);

      const [dbProds, dbClients, dbOrders, dbQuotes] = await Promise.all([
        fetchProducts(),
        fetchClients(),
        fetchOrders(),
        fetchQuotes(),
      ]);

      setProducts(dbProds);
      setClients(dbClients);
      setOrders(dbOrders);
      setQuotes(dbQuotes);

      const totalNew = pCount + cCount + oCount + qCount;
      if (totalNew > 0) {
        showToast(`✅ Sincronização concluída! (${pCount} prods, ${cCount} clientes, ${oCount} pedidos, ${qCount} orçamentos)`, 'success');
      } else {
        showToast('✅ Sistema 100% sincronizado com o Supabase!', 'success');
      }
    } catch (err: any) {
      showToast(`Erro na sincronização: ${err?.message || 'Falha ao conectar com Supabase'}`, 'error');
    }
  };

  const handleAddClient = async (newClient: Client) => {
    setClients((prev) => [newClient, ...prev]);
    showToast(`Cliente "${newClient.name}" cadastrado com sucesso!`, 'success');
    try {
      const savedInDb = await createClient(newClient);
      if (savedInDb && savedInDb.id) {
        setClients((prev) =>
          prev.map((c) => (c.id === newClient.id ? { ...c, id: savedInDb.id } : c))
        );
      }
    } catch (err) {
      console.error('Erro ao salvar cliente no Supabase:', err);
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    setClients((prev) => prev.map((c) => (c.id === updatedClient.id ? updatedClient : c)));
    showToast(`Cadastro do cliente "${updatedClient.name}" atualizado com sucesso!`, 'success');
    try {
      await updateClient(updatedClient.id, updatedClient);
    } catch (err) {
      console.error('Erro ao atualizar cliente no Supabase:', err);
    }
  };

  const handleAddConsignment = (newConsignment: Consignment) => {
    setConsignments((prev) => [newConsignment, ...prev]);
    showToast(`Consignação ${newConsignment.id} registrada com sucesso!`, 'success');
  };

  const handleAddQuote = async (newQuote: Quote) => {
    setQuotes((prev) => [newQuote, ...prev]);
    showToast(`Orçamento ${newQuote.id} criado com sucesso!`, 'success');
    try {
      await createQuote(newQuote);
    } catch (err) {
      console.error('Erro ao salvar orçamento no Supabase:', err);
    }
  };

  const handleUpdateQuoteStatus = async (quoteId: string, newStatus: string) => {
    setQuotes((prev) =>
      prev.map((q) => (q.id === quoteId ? { ...q, status: newStatus as any } : q))
    );
    showToast(`Status do orçamento ${quoteId} alterado para "${newStatus}"!`, 'success');
    try {
      await updateQuoteStatus(quoteId, newStatus);
    } catch (err) {
      console.error('Erro ao atualizar status do orçamento no Supabase:', err);
    }
  };

  const handleConvertQuoteToOrder = async (quote: Quote) => {
    const newOrder: Order = {
      id: `PED-${Math.floor(Math.random() * 900000 + 100000)}`,
      clientId: quote.clientId,
      clientName: quote.clientName,
      date: new Date().toISOString().split('T')[0],
      itemsCount: quote.items.reduce((acc, i) => acc + i.quantity, 0),
      totalValue: quote.total,
      paidAmount: 0.0,
      paymentStatusText: 'Aguardando Pagamento',
      status: 'Em produção' as const,
      productionProgressPct: 15,
      productionSlaDate: quote.date || new Date().toISOString().split('T')[0],
      estimatedDeliveryDate: quote.date || new Date().toISOString().split('T')[0],
      attendanceMode: quote.attendanceMode || 'presencial',
      internalLogisticsType: quote.internalLogisticsType || 'combustivel',
      internalLogisticsCost: quote.internalLogisticsCost ?? 0,
      notes: quote.notes,
      paymentTerms: quote.paymentTerms,
      items: quote.items.map((i) => ({
        productName: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice || (i.subtotal / i.quantity),
        subtotal: i.subtotal,
      })),
      timeline: [
        { date: `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, title: 'Orçamento Convertido em Pedido Oficial' },
        { date: `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, title: 'Fila de Impressão 3D Iniciada' },
      ],
    };

    setOrders((prev) => [newOrder, ...prev]);
    setQuotes((prev) =>
      prev.map((q) => (q.id === quote.id ? { ...q, status: 'Convertido em Pedido' } : q))
    );
    setCurrentView('orders');
    showToast(`Orçamento ${quote.id} convertido com sucesso no Pedido ${newOrder.id}!`, 'success');

    try {
      await createOrder(newOrder);
      await updateQuoteStatus(quote.id, 'Convertido em Pedido');
    } catch (err) {
      console.error('Erro ao persistir pedido no Supabase:', err);
    }
  };

  const handleUpdateOrderProgress = async (orderId: string, newProgressPct: number) => {
    const clampedPct = Math.max(0, Math.min(100, Math.round(newProgressPct / 5) * 5));

    let updatedStatus: Order['status'] | undefined;
    if (clampedPct === 100) {
      updatedStatus = 'Pronto';
    } else if (clampedPct > 0) {
      updatedStatus = 'Em produção';
    }

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const finalStatus = updatedStatus || o.status;
          return {
            ...o,
            productionProgressPct: clampedPct,
            status: finalStatus,
            timeline: [
              {
                date: `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
                title: `Progresso de Impressão 3D: ${clampedPct}%`,
                description: `Status de Produção: ${finalStatus}`,
              },
              ...(o.timeline || []),
            ],
          };
        }
        return o;
      })
    );

    showToast(`Progresso de impressão 3D do Pedido ${orderId} ajustado para ${clampedPct}%!`, 'info');

    try {
      await updateOrderProgress(orderId, clampedPct, updatedStatus);
    } catch (err) {
      console.error('Erro ao atualizar progresso de impressão no Supabase:', err);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    const targetOrder = orders.find((o) => o.id === orderId);

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: newStatus,
            timeline: [
              {
                date: `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
                title: `Status do Pedido Atualizado: ${newStatus}`,
              },
              ...(o.timeline || []),
            ],
          };
        }
        return o;
      })
    );

    // Se o pedido for marcado como Entregue, registrar automaticamente uma Visita com data e hora atual
    if (newStatus === 'Entregue' && targetOrder) {
      const now = new Date();
      const formattedDate = now.toLocaleDateString('pt-BR');
      const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const modeText = targetOrder.attendanceMode === 'online' ? 'Atendimento Online / Envio' : 'Visita Presencial';

      const deliveryVisit: Visit = {
        id: `VIS-${Math.floor(100000 + Math.random() * 900000)}`,
        clientId: targetOrder.clientId,
        clientName: targetOrder.clientName,
        scheduledDate: formattedDate,
        timeSlot: formattedTime,
        reason: `Entrega do Pedido ${targetOrder.id} (${modeText})`,
        productsOnSite: targetOrder.itemsCount,
        lastVisitText: `${formattedDate} às ${formattedTime}`,
        status: 'Concluída',
        completedAt: `${formattedDate} ${formattedTime}`,
        completedSummary: {
          durationMinutes: 15,
          itemsSold: targetOrder.itemsCount,
          totalRevenue: targetOrder.totalValue,
          receivedAmount: targetOrder.paidAmount,
          itemsRemoved: 0,
          itemsAdded: targetOrder.itemsCount,
          finalStockCount: targetOrder.itemsCount,
          nextVisitDate: 'N/A',
        },
      };

      setVisits((prev) => [deliveryVisit, ...prev]);
      showToast(`📍 Registro de Visita/Entrega gravado em ${formattedDate} às ${formattedTime}!`, 'success');
    } else {
      showToast(`Status do Pedido ${orderId} alterado para "${newStatus}"!`, 'info');
    }

    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (err) {
      console.error('Erro ao atualizar status no Supabase:', err);
    }
  };

  const handleUpdateOrderPayment = async (orderId: string, additionalAmount: number) => {
    let finalPaidAmount = 0;
    let finalPaymentStatus = 'Aguardando Pagamento';

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const currentPaid = o.paidAmount || 0;
          const newPaidAmount = Math.min(o.totalValue, currentPaid + additionalAmount);
          const isFullyPaid = newPaidAmount >= o.totalValue;
          const pct = Math.round((newPaidAmount / o.totalValue) * 100);
          const newPaymentStatus = isFullyPaid ? 'Totalmente Pago' : `${pct}% Recebido`;

          finalPaidAmount = newPaidAmount;
          finalPaymentStatus = newPaymentStatus;

          return {
            ...o,
            paidAmount: newPaidAmount,
            paymentStatusText: newPaymentStatus,
            timeline: [
              {
                date: `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
                title: `Entrada em Caixa Registrada: R$ ${additionalAmount.toFixed(2).replace('.', ',')}`,
                description: `Status de Pagamento: ${newPaymentStatus}`,
              },
              ...(o.timeline || []),
            ],
          };
        }
        return o;
      })
    );

    showToast(`Recebimento de R$ ${additionalAmount.toFixed(2).replace('.', ',')} registrado com sucesso! Dashboard e Caixa atualizados.`, 'success');

    try {
      await updateOrderPayment(orderId, finalPaidAmount, finalPaymentStatus);
    } catch (err) {
      console.error('Erro ao atualizar pagamento no Supabase:', err);
    }
  };

  const handleStartVisit = (clientId: string) => {
    setActiveVisitClientId(clientId);
  };

  const handleCompleteVisit = (visitData: any) => {
    setActiveVisitClientId(null);
    showToast(`Visita ${visitData.visitId} finalizada! Vendas e estoque atualizados.`, 'success');

    // Add financial record
    if (visitData.receivedAmount > 0) {
      setTransactions((prev) => [
        {
          id: `PAG-${Math.floor(Math.random() * 9000 + 1000)}`,
          clientName: clients.find((c) => c.id === visitData.clientId)?.name || 'Cliente',
          date: '10/08/2026',
          type: 'Visita Consignação',
          amount: visitData.receivedAmount,
          paymentMethod: 'PIX',
          status: 'Recebido',
        },
        ...prev,
      ]);
    }
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.productId === productId || p.id === productId ? { ...p, currentStock: newStock } : p))
    );
    showToast('Saldo de estoque ajustado com sucesso!', 'success');
  };

  const handleSelectClientProfile = (clientOrId: string | Client) => {
    const id = typeof clientOrId === 'string' ? clientOrId : clientOrId.id;
    setActiveClientIdForProfile(id);
    setCurrentView('client-profile');
  };

  const selectedProfileClient = clients.find((c) => c.id === activeClientIdForProfile) || clients[0];

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex antialiased selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <Toast
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Desktop & Mobile Responsive Sidebar Drawer */}
      <Sidebar
        currentView={currentView}
        onSelectView={(mode) => {
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
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          }`}
      >
        {/* Top Header */}
        <Header
          currentView={currentView}
          onOpenMobileSidebar={() => setIsMobileMenuOpen(true)}
          products={products}
          clients={clients}
          orders={orders}
          quotes={quotes}
          onSearchChange={(query) => setGlobalSearchQuery(query)}
          onSelectSearchResult={(type, id, item) => {
            setGlobalSearchQuery(id || item?.id || '');
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
                handleSyncProductsToSupabase();
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
              client={clients.find((c) => c.id === activeVisitClientId) || clients[0]}
              inventory={clientInventories[activeVisitClientId] || []}
              allProducts={products}
              onCompleteVisit={handleCompleteVisit}
              onCancel={() => setActiveVisitClientId(null)}
            />
          ) : (
            <>
              {currentView === 'dashboard' && (
                <DashboardView
                  clients={clients}
                  visits={visits}
                  products={products}
                  consignments={consignments}
                  orders={orders}
                  onNavigate={(view) => setCurrentView(view)}
                  onStartVisit={handleStartVisit}
                  onSelectClient={handleSelectClientProfile}
                  onUpdateOrderProgress={handleUpdateOrderProgress}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
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
              )}

              {currentView === 'calculator' && (
                <CalculatorView
                  onSaveAsProduct={(newProduct) => {
                    handleAddProduct(newProduct);
                    setCurrentView('products');
                  }}
                />
              )}

              {currentView === 'products' && (
                <ProductsView
                  products={products}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onSyncSupabase={handleSyncProductsToSupabase}
                />
              )}

              {currentView === 'clients' && (
                <ClientsView
                  clients={clients}
                  onAddClient={handleAddClient}
                  onSelectClient={handleSelectClientProfile}
                  onStartVisit={handleStartVisit}
                />
              )}

              {currentView === 'client-profile' && (
                <ClientProfileView
                  client={selectedProfileClient}
                  clientInventory={clientInventories[selectedProfileClient.id] || []}
                  orders={orders}
                  quotes={quotes}
                  onBack={() => setCurrentView('clients')}
                  onStartVisit={handleStartVisit}
                  onNewConsignment={(cliId) => {
                    setPreselectedClientIdForAction(cliId);
                    setCurrentView('consignments');
                  }}
                  onNewOrder={() => setCurrentView('orders')}
                  onNewQuote={(cliId) => {
                    setPreselectedClientIdForAction(cliId);
                    setCurrentView('quotes');
                  }}
                  onUpdateClient={handleUpdateClient}
                  onUpdateOrderProgress={handleUpdateOrderProgress}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                />
              )}

              {currentView === 'consignments' && (
                <ConsignmentsView
                  consignments={consignments}
                  clients={clients}
                  products={products}
                  onAddConsignment={handleAddConsignment}
                  preselectedClientId={preselectedClientIdForAction}
                />
              )}

              {currentView === 'visits' && (
                <VisitsView visits={visits} onStartVisit={handleStartVisit} />
              )}

              {currentView === 'exchanges' && <ExchangesView exchanges={exchanges} />}

              {currentView === 'quotes' && (
                <QuotesView
                  quotes={quotes}
                  clients={clients}
                  products={products}
                  onAddQuote={handleAddQuote}
                  onUpdateQuoteStatus={handleUpdateQuoteStatus}
                  onConvertQuoteToOrder={handleConvertQuoteToOrder}
                  preselectedClientId={preselectedClientIdForAction}
                  searchQuery={globalSearchQuery}
                />
              )}

              {currentView === 'orders' && (
                <OrdersView
                  orders={orders}
                  products={products}
                  searchQuery={globalSearchQuery}
                  onUpdateOrderProgress={handleUpdateOrderProgress}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                />
              )}

              {currentView === 'inventory-general' && (
                <GeneralInventoryView products={products} onUpdateStock={handleUpdateStock} />
              )}

              {currentView === 'inventory-movements' && <MovementsView movements={movements} />}

              {currentView === 'inventory-clients' && (
                <ClientInventoryView clients={clients} clientInventories={clientInventories} />
              )}

              {currentView === 'financial' && (
                <FinancialView
                  transactions={transactions}
                  consignments={consignments}
                  orders={orders}
                  onUpdateOrderPayment={handleUpdateOrderPayment}
                />
              )}

              {currentView === 'reports' && (
                <ReportsView products={products} orders={orders} consignments={consignments} />
              )}

              {currentView === 'settings' && <SettingsView onShowToast={showToast} />}
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
