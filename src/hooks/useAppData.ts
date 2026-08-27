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
import { fetchConsignments, syncMissingConsignmentsToSupabase } from '../services/consignmentsService';
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
    handleUpdateConsignment,
    handleDeleteConsignment,
    handleClearConsignments,
  } = useConsignments(showToast, setClientInventories, setClients);

  const {
    quotes,
    setQuotes,
    handleCreateQuote,
    handleUpdateQuote,
    handleUpdateQuoteStatus,
  } = useQuotes(user, showToast);

  const {
    visits,
    setVisits,
    handleScheduleVisit,
    handleDeleteVisit,
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
        const [dbProducts, dbClients, dbOrders, dbQuotes, dbConsignments] = await Promise.all([
          fetchProducts(),
          fetchClients(),
          fetchOrders(),
          fetchQuotes(),
          fetchConsignments(),
        ]);
        if (!isMounted) return;
        setProducts(dbProducts);
        setClients(dbClients);
        setOrders(dbOrders);
        setQuotes(dbQuotes);
        if (dbConsignments && dbConsignments.length > 0) {
          setConsignments((prev) => {
            const map = new Map<string, any>();
            dbConsignments.forEach((c) => map.set(c.id.toLowerCase().trim(), c));
            (prev || []).forEach((c) => {
              if (!map.has(c.id.toLowerCase().trim())) {
                map.set(c.id.toLowerCase().trim(), c);
              }
            });
            return Array.from(map.values());
          });
        }
        if (reloadExpenses) reloadExpenses();
      } catch (err) {
        console.error('Erro ao carregar dados do Supabase:', err);
      } finally {
        if (isMounted) setDataLoading(false);
      }
    };

    loadAllData();

    // Re-sincronizar apenas ao focar na janela do navegador ou em intervalo longo (5 minutos)
    const intervalId = setInterval(async () => {
      if (!isMounted) return;
      try {
        const [dbProducts, dbClients, dbOrders, dbQuotes, dbConsignments] = await Promise.all([
          fetchProducts(),
          fetchClients(),
          fetchOrders(),
          fetchQuotes(),
          fetchConsignments(),
        ]);
        if (!isMounted) return;
        setProducts(dbProducts);
        setClients(dbClients);
        setOrders(dbOrders);
        setQuotes(dbQuotes);
        if (dbConsignments && dbConsignments.length > 0) {
          setConsignments((prev) => {
            const map = new Map<string, any>();
            dbConsignments.forEach((c) => map.set(c.id.toLowerCase().trim(), c));
            (prev || []).forEach((c) => {
              if (!map.has(c.id.toLowerCase().trim())) {
                map.set(c.id.toLowerCase().trim(), c);
              }
            });
            return Array.from(map.values());
          });
        }
        if (reloadExpenses) reloadExpenses();
      } catch (e) {
        // Silent background sync error
      }
    }, 300000); // 5 minutos (300.000 ms) em vez de 5 segundos

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

  // Sync clients' productsOnSiteCount, productsValuation, lastVisitDate, nextVisitDate, and visitStatus dynamically
  useEffect(() => {
    if (clients.length === 0) return;

    setClients((prevClients) => {
      let changed = false;
      const todayStr = new Date().toLocaleDateString('pt-BR');

      const updated = prevClients.map((cli) => {
        const matchingConsignments = consignments.filter(
          (c) =>
            c.clientId === cli.id ||
            (c.clientName && c.clientName.toLowerCase().trim() === cli.name.toLowerCase().trim())
        );

        const totalItemsCount = matchingConsignments.reduce((sum, c) => sum + c.itemsCount, 0);
        const totalValuation = matchingConsignments.reduce((sum, c) => sum + c.totalValue, 0);

        // Find most recent visit date from completed visits or delivered orders
        const matchingVisits = visits.filter(
          (v) =>
            v.clientId === cli.id || (v.clientName && v.clientName.toLowerCase().trim() === cli.name.toLowerCase().trim())
        );

        const completedVisits = matchingVisits.filter((v) => v.status === 'Concluída');

        const matchingDeliveredOrders = orders.filter(
          (o) =>
            (o.clientId === cli.id || (o.clientName && o.clientName.toLowerCase().trim() === cli.name.toLowerCase().trim())) &&
            (o.status === 'Entregue' || o.status === 'Concluído')
        );

        let latestVisitDateStr = cli.lastVisitDate || 'Sem visitas';

        const dates: string[] = [];
        completedVisits.forEach((v) => {
          if (v.completedAt) dates.push(v.completedAt.split(' ')[0]);
          else if (v.lastVisitText && v.lastVisitText !== 'N/A' && v.lastVisitText !== 'Sem visitas') {
            dates.push(v.lastVisitText.split(' ')[0]);
          } else if (v.scheduledDate) dates.push(v.scheduledDate);
        });

        matchingDeliveredOrders.forEach((o) => {
          if (o.date) dates.push(o.date);
        });

        if (dates.length > 0) {
          dates.sort((a, b) => {
            const parseD = (str: string) => {
              if (str.includes('/')) {
                const parts = str.split('/');
                if (parts.length === 3) return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
              } else if (str.includes('-')) {
                const parts = str.split('-');
                if (parts.length >= 3) return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getTime();
              }
              return 0;
            };
            return parseD(b) - parseD(a);
          });
          latestVisitDateStr = dates[0];
        }

        // Find pending scheduled visits for this client
        const pendingVisits = matchingVisits.filter((v) => v.status !== 'Concluída');

        let computedNextVisitDate = cli.nextVisitDate || 'A agendar';
        let computedVisitStatus: 'Hoje' | 'Atrasada' | 'Em breve' | 'Concluída' | 'Última visita' = cli.visitStatus || 'Última visita';

        if (pendingVisits.length > 0) {
          // Sort by scheduledDate ascending (earliest scheduled visit first)
          pendingVisits.sort((a, b) => {
            const parseD = (str: string) => {
              if (!str) return 0;
              if (str.includes('/')) {
                const parts = str.split('/');
                if (parts.length === 3) return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
              } else if (str.includes('-')) {
                const parts = str.split('-');
                if (parts.length >= 3) return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getTime();
              }
              return 0;
            };
            return parseD(a.scheduledDate) - parseD(b.scheduledDate);
          });

          const nextScheduled = pendingVisits[0];
          computedNextVisitDate = nextScheduled.scheduledDate || 'A agendar';

          const now = new Date();
          const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

          const parseDateToTimestamp = (str?: string) => {
            if (!str) return 0;
            if (str.includes('/')) {
              const parts = str.split('/');
              if (parts.length === 3) return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
            } else if (str.includes('-')) {
              const parts = str.split('-');
              if (parts.length >= 3) return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getTime();
            }
            return 0;
          };

          const schedTime = parseDateToTimestamp(nextScheduled.scheduledDate);

          if (schedTime > 0) {
            if (schedTime === todayMidnight || nextScheduled.scheduledDate === todayStr) {
              computedVisitStatus = 'Hoje';
            } else if (schedTime < todayMidnight) {
              computedVisitStatus = 'Atrasada';
            } else {
              computedVisitStatus = 'Em breve';
            }
          } else {
            computedVisitStatus = nextScheduled.status === 'Hoje' ? 'Hoje' : nextScheduled.status === 'Atrasada' ? 'Atrasada' : 'Em breve';
          }
        } else {
          computedNextVisitDate = 'A agendar';
          computedVisitStatus = 'Última visita';
        }

        const stockChanged = cli.productsOnSiteCount !== totalItemsCount || Math.abs((cli.productsValuation || 0) - totalValuation) > 0.01;
        const lastVisitChanged = latestVisitDateStr !== cli.lastVisitDate && latestVisitDateStr !== 'Sem visitas' && latestVisitDateStr !== 'N/A';
        const nextVisitChanged = computedNextVisitDate !== cli.nextVisitDate;
        const visitStatusChanged = computedVisitStatus !== cli.visitStatus;

        if (stockChanged || lastVisitChanged || nextVisitChanged || visitStatusChanged) {
          changed = true;
          return {
            ...cli,
            productsOnSiteCount: totalItemsCount,
            productsValuation: totalValuation,
            lastVisitDate: lastVisitChanged ? latestVisitDateStr : cli.lastVisitDate,
            nextVisitDate: computedNextVisitDate,
            visitStatus: computedVisitStatus,
          };
        }
        return cli;
      });

      return changed ? updated : prevClients;
    });
  }, [consignments, orders, visits, clients]);

  // Auto-replicate internal logistics costs from orders and visits into expenses (Combustível & Transporte)


  // Auto-mirror order local payments (e.g. 50% signal deposit / 50% completion) into expenses/transactions log
  useEffect(() => {
    if (!orders || orders.length === 0) return;

    setExpenses((prevExpenses) => {
      let changed = false;
      const newPaymentEntries: ExpenseItem[] = [];

      const updatedPrev = prevExpenses.map((exp) => {
        if (exp.referenceCode && exp.referenceCode.startsWith('PED-PAY-')) {
          const orderId = exp.referenceCode.replace('PED-PAY-', '');
          const matchedOrder = orders.find((o) => o.id === orderId);
          if (matchedOrder && matchedOrder.paymentReceiptUrl && !exp.receiptUrl) {
            changed = true;
            return {
              ...exp,
              receiptUrl: matchedOrder.paymentReceiptUrl,
              receiptType: matchedOrder.paymentReceiptType || 'image',
              receiptName: matchedOrder.paymentReceiptName || 'Comprovante de Pagamento',
            };
          }
        }
        return exp;
      });

      orders.forEach((o) => {
        const paid = Number(o.paidAmount) || 0;
        if (paid > 0) {
          const refCode = `PED-PAY-${o.id}`;
          const alreadyExists = updatedPrev.some((e) => e.referenceCode === refCode);
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
              receiptUrl: o.paymentReceiptUrl || '',
              receiptType: o.paymentReceiptType || 'image',
              receiptName: o.paymentReceiptName || (o.paymentReceiptUrl ? 'Comprovante de Pagamento' : ''),
              notes: `Pagamento de ${o.paymentMethod || 'PIX'} referente ao pedido ${o.id}`,
            });
          }
        }
      });

      return changed ? [...newPaymentEntries, ...updatedPrev] : prevExpenses;
    });
  }, [orders]);


  const handleSyncProductsToSupabase = async () => {
    try {
      showToast('Sincronizando todo o sistema com o Banco de Dados', 'info');
      const [pCount, cCount, oCount, qCount, eCount, consCount] = await Promise.all([
        syncMissingProductsToSupabase(products),
        syncMissingClientsToSupabase(clients),
        syncMissingOrdersToSupabase(orders),
        syncMissingQuotesToSupabase(quotes),
        syncMissingExpensesToSupabase(expenses),
        syncMissingConsignmentsToSupabase(consignments),
      ]);

      const [dbProds, dbClients, dbOrders, dbQuotes, dbConsignments] = await Promise.all([
        fetchProducts(),
        fetchClients(),
        fetchOrders(),
        fetchQuotes(),
        fetchConsignments(),
      ]);

      setProducts(dbProds);
      setClients(dbClients);
      setOrders(dbOrders);
      setQuotes(dbQuotes);
      if (dbConsignments && dbConsignments.length > 0) {
        setConsignments((prev) => {
          const map = new Map<string, any>();
          dbConsignments.forEach((c) => map.set(c.id.toLowerCase().trim(), c));
          (prev || []).forEach((c) => {
            if (!map.has(c.id.toLowerCase().trim())) {
              map.set(c.id.toLowerCase().trim(), c);
            }
          });
          return Array.from(map.values());
        });
      }
      if (reloadExpenses) reloadExpenses();

      const totalNew = pCount + cCount + oCount + qCount + eCount + consCount;
      if (totalNew > 0) {
        showToast(`✅ Sincronização concluída! (${pCount} prods, ${cCount} clientes, ${oCount} pedidos, ${consCount} consignações)`, 'success');
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
    handleUpdateConsignment,
    handleDeleteConsignment,
    handleClearConsignments,
    handleCreateQuote,
    handleUpdateQuote,
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
    handleDeleteVisit,
    handleCompleteVisit,
  };
}
