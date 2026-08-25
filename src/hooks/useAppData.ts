import { useState, useEffect, useCallback } from 'react';
import { ExpenseItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { useProducts } from './useProducts';
import { useClients } from './useClients';
import { useTransactions } from './useTransactions';
import { useConsignments } from './useConsignments';
import { useQuotes } from './useQuotes';
import { useOrders } from './useOrders';
import { useExchanges } from './useExchanges';
import { useVisits } from './useVisits';
import { useExpenses } from './useExpenses';

import { fetchProducts } from '../services/productsService';
import { fetchClients } from '../services/clientsService';
import { fetchOrders } from '../services/ordersService';
import { fetchQuotes } from '../services/quotesService';
import { syncMissingProductsToSupabase } from '../services/productsService';
import { syncMissingClientsToSupabase } from '../services/clientsService';
import { syncMissingOrdersToSupabase } from '../services/ordersService';
import { syncMissingQuotesToSupabase } from '../services/quotesService';

export function useAppData() {
  const { user } = useAuth();

  // Toast State
  const [toast, setToast] = useState<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({
      id: Date.now().toString(),
      message,
      type,
    });
  }, []);

  // Sub-hooks por funcionalidade
  const {
    products,
    setProducts,
    handleAddProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    handleUpdateStock,
  } = useProducts(user, showToast);

  const {
    clients,
    setClients,
    handleAddClient,
    handleUpdateClient,
  } = useClients(user, showToast);

  const {
    expenses,
    setExpenses,
    accountBalance,
    setAccountBalance,
    handleCreateExpense,
    handleUpdateExpense,
    handleDeleteExpense,
    handleUpdateAccountBalance,
  } = useExpenses(user, showToast);

  const {
    transactions,
    setTransactions,
    movements,
    clientInventories,
    setClientInventories,
  } = useTransactions();

  const {
    consignments,
    setConsignments,
    handleAddConsignment,
  } = useConsignments(showToast, setClientInventories, setClients);

  const {
    quotes,
    setQuotes,
    handleCreateQuote,
    handleUpdateQuoteStatus,
  } = useQuotes(user, showToast);

  const {
    visits,
    setVisits,
    handleScheduleVisit,
    handleCompleteVisit,
  } = useVisits(
    clients,
    showToast,
    setClientInventories,
    setProducts,
    setClients,
    setConsignments,
    setExchangesRef,
    setTransactions
  );

  const {
    orders,
    setOrders,
    handleCreateOrder,
    handleDeleteOrder,
    handleUpdateOrderProgress,
    handleUpdateOrderStatus,
    handleUpdateOrderPayment,
  } = useOrders(user, quotes, showToast, setVisits, setTransactions);

  const {
    exchanges,
    setExchanges,
    handleExecuteExchange,
  } = useExchanges(
    products,
    showToast,
    setClientInventories,
    setClients,
    setProducts,
    setConsignments
  );

  // Auxiliary setter helper for useVisits
  function setExchangesRef(val: any) {
    setExchanges(val);
  }

  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [dataLoading, setDataLoading] = useState<boolean>(false);

  // Global Supabase sync loop (every 12 seconds)
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
  }, [user, setProducts, setClients, setOrders, setQuotes]);

  // Sync clients' productsOnSiteCount and productsValuation dynamically from consignments
  useEffect(() => {
    if (clients.length === 0 || consignments.length === 0) return;

    setClients((prevClients) => {
      let changed = false;
      const updated = prevClients.map((cli) => {
        const matchingConsignments = consignments.filter(
          (c) =>
            c.clientId === cli.id ||
            (c.clientName && c.clientName.toLowerCase().trim() === cli.name.toLowerCase().trim())
        );

        const totalItemsCount = matchingConsignments.reduce((sum, c) => sum + c.itemsCount, 0);
        const totalValuation = matchingConsignments.reduce((sum, c) => sum + c.totalValue, 0);

        if (
          cli.productsOnSiteCount !== totalItemsCount ||
          Math.abs((cli.productsValuation || 0) - totalValuation) > 0.01
        ) {
          changed = true;
          return {
            ...cli,
            productsOnSiteCount: totalItemsCount,
            productsValuation: totalValuation,
          };
        }
        return cli;
      });

      return changed ? updated : prevClients;
    });
  }, [consignments, clients]);

  // Auto-replicate internal logistics costs from orders and visits into expenses (Combustível & Transporte)
  useEffect(() => {
    if ((!orders || orders.length === 0) && (!visits || visits.length === 0)) return;

    setExpenses((prevExpenses) => {
      let changed = false;
      const newAutoExpenses: ExpenseItem[] = [];

      orders.forEach((o) => {
        const cost = Number(o.internalLogisticsCost) || 0;
        if (cost > 0) {
          const alreadyExists = prevExpenses.some((e) => e.referenceCode === o.id);
          if (!alreadyExists) {
            changed = true;
            newAutoExpenses.push({
              id: `exp-auto-${o.id}`,
              description: `Custo de Logística / Frete (${o.id} - ${o.clientName})`,
              category: 'Combustível & Transporte',
              amount: cost,
              date: o.date || new Date().toISOString().split('T')[0],
              paymentStatus: 'Pago',
              beneficiary: 'Logística de Entrega',
              isAutoReplicated: true,
              referenceCode: o.id,
              notes: `Gerado automaticamente via Pedido ${o.id}`,
            });
          }
        }
      });

      visits.forEach((v) => {
        if (v.status === 'Concluída') {
          const cost = 25.0; // Standard estimated visit fuel cost if presencial visit completed
          const refCode = `VIS-${v.id}`;
          const alreadyExists = prevExpenses.some((e) => e.referenceCode === refCode);
          if (!alreadyExists) {
            changed = true;
            newAutoExpenses.push({
              id: `exp-auto-${refCode}`,
              description: `Deslocamento / Combustível Visita (${v.clientName})`,
              category: 'Combustível & Transporte',
              amount: cost,
              date: v.completedAt ? v.completedAt.split('T')[0] : v.scheduledDate,
              paymentStatus: 'Pago',
              beneficiary: 'Rota de Consignação',
              isAutoReplicated: true,
              referenceCode: refCode,
              notes: `Gerado automaticamente via Visita Presencial ${v.id}`,
            });
          }
        }
      });

      return changed ? [...newAutoExpenses, ...prevExpenses] : prevExpenses;
    });
  }, [orders, visits]);

  const handleSyncProductsToSupabase = async () => {
    try {
      showToast('Sincronizando todo o sistema com o Banco de Dados', 'info');
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

  return {
    products,
    clients,
    consignments,
    visits,
    exchanges,
    quotes,
    orders,
    transactions,
    movements,
    clientInventories,
    expenses,
    accountBalance,
    globalSearchQuery,
    dataLoading,
    toast,
    setToast,
    setGlobalSearchQuery,
    showToast,
    handleAddProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    handleSyncProductsToSupabase,
    handleUpdateStock,
    handleAddClient,
    handleUpdateClient,
    handleAddConsignment,
    handleCreateQuote,
    handleUpdateQuoteStatus,
    handleCreateExpense,
    handleUpdateExpense,
    handleDeleteExpense,
    handleUpdateAccountBalance,
    handleCreateOrder,
    handleDeleteOrder,
    handleUpdateOrderProgress,
    handleUpdateOrderStatus,
    handleUpdateOrderPayment,
    handleExecuteExchange,
    handleScheduleVisit,
    handleCompleteVisit,
  };
}
