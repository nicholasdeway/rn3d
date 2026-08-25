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
import { syncMissingExpensesToSupabase } from '../services/expensesService';

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
    accountBalances,
    accountBalance,
    reloadExpenses,
    handleCreateExpense,
    handleExecuteTransfer,
    handleUpdateExpense,
    handleDeleteExpense,
    handleUpdateSingleBalance,
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

  // Cross-device & cross-window real-time synchronization effect
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
        if (reloadExpenses) reloadExpenses();
      } catch (err) {
        console.error('Erro ao carregar dados do Supabase:', err);
      } finally {
        if (isMounted) setDataLoading(false);
      }
    };

    loadAllData();

    // Rapid 5-second background sync interval for seamless web <-> mobile real-time updates
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
        if (reloadExpenses) reloadExpenses();
      } catch (e) {
        // Silent background sync error
      }
    }, 5000);

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

  // Auto-mirror order local payments (e.g. 50% signal deposit / 50% completion) into expenses/transactions log
  useEffect(() => {
    if (!orders || orders.length === 0) return;

    setExpenses((prevExpenses) => {
      let changed = false;
      const newPaymentEntries: ExpenseItem[] = [];

      orders.forEach((o) => {
        const paid = Number(o.paidAmount) || 0;
        if (paid > 0) {
          const refCode = `PED-PAY-${o.id}`;
          const alreadyExists = prevExpenses.some((e) => e.referenceCode === refCode);
          if (!alreadyExists) {
            changed = true;
            newPaymentEntries.push({
              id: `exp-pay-${o.id}`,
              description: `Entrada / Pagamento de Pedido (${o.id} - ${o.clientName})`,
              category: 'Entrada de Pedido',
              amount: paid,
              date: o.date || new Date().toISOString().split('T')[0],
              timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              paymentStatus: 'Pago',
              beneficiary: o.clientName || 'Cliente Local',
              createdBy: 'Sistema RN 3D',
              destinationAccount: 'Nubank',
              isAutoReplicated: true,
              referenceCode: refCode,
              notes: `Pagamento de ${o.paymentMethod || 'PIX'} referente ao pedido ${o.id}`,
            });
          }
        }
      });

      return changed ? [...newPaymentEntries, ...prevExpenses] : prevExpenses;
    });
  }, [orders]);

  // Automatically sync local expenses to Supabase if any exist locally
  useEffect(() => {
    if (expenses.length > 0) {
      syncMissingExpensesToSupabase(expenses);
    }
  }, [expenses]);

  const handleSyncProductsToSupabase = async () => {
    try {
      showToast('Sincronizando todo o sistema com o Banco de Dados', 'info');
      const [pCount, cCount, oCount, qCount, eCount] = await Promise.all([
        syncMissingProductsToSupabase(products),
        syncMissingClientsToSupabase(clients),
        syncMissingOrdersToSupabase(orders),
        syncMissingQuotesToSupabase(quotes),
        syncMissingExpensesToSupabase(expenses),
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
      if (reloadExpenses) reloadExpenses();

      const totalNew = pCount + cCount + oCount + qCount + eCount;
      if (totalNew > 0) {
        showToast(`✅ Sincronização concluída! (${pCount} prods, ${cCount} clientes, ${oCount} pedidos, ${qCount} orçamentos, ${eCount} despesas)`, 'success');
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
    accountBalances,
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
    handleExecuteTransfer,
    handleUpdateExpense,
    handleDeleteExpense,
    handleUpdateSingleBalance,
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
