import { useState, useEffect, useCallback } from 'react';
import { ExpenseItem, Quote, Order, Client, Consignment, Visit } from '../types';
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
import { useRecurringBills } from './useRecurringBills';
import { normalizeToIsoDate } from '../utils/formatters';


import { fetchProducts } from '../services/productsService';
import { fetchClients } from '../services/clientsService';
import { fetchOrders } from '../services/ordersService';
import { fetchQuotes } from '../services/quotesService';
import { fetchConsignments, syncMissingConsignmentsToSupabase } from '../services/consignmentsService';
import { fetchVisits, syncMissingVisitsToSupabase } from '../services/visitsService';
import { syncMissingProductsToSupabase } from '../services/productsService';
import { syncMissingClientsToSupabase } from '../services/clientsService';
import { syncMissingOrdersToSupabase } from '../services/ordersService';
import { syncMissingQuotesToSupabase } from '../services/quotesService';
import { syncMissingExpensesToSupabase, createExpense } from '../services/expensesService';
import { parseBRDate, formatDateBR } from '../utils/formatters';

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
    handleDeleteClient,
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
    recurringBills,
    billAlerts,
    pendingAlertsCount,
    urgentAlertsCount,
    reloadBills,
    handleCreateBill,
    handleUpdateBill,
    handleDeleteBill,
    handleMarkBillPaid,
  } = useRecurringBills(showToast, handleCreateExpense);


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
    handleDeleteQuote,
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
    setTransactions,
    user
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

  const handleDeleteOrderCascade = async (orderId: string) => {
    await handleDeleteOrder(orderId);

    const cleanId = orderId.replace(/^PED-/, '');
    const matchingExpenses = expenses.filter(
      (e) =>
        (e.referenceCode && (e.referenceCode.includes(orderId) || e.referenceCode.includes(cleanId))) ||
        e.id.includes(orderId) ||
        e.id.includes(cleanId) ||
        e.description.includes(orderId) ||
        e.description.includes(cleanId) ||
        (e.notes && (e.notes.includes(orderId) || e.notes.includes(cleanId)))
    );

    for (const exp of matchingExpenses) {
      await handleDeleteExpense(exp.id);
    }
  };

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

    const loadAllData = async (showLoadingState = true) => {
      try {
        if (showLoadingState) setDataLoading(true);
        const [dbProducts, dbClients, dbOrders, dbQuotes, dbConsignments, dbVisits] = await Promise.all([
          fetchProducts(),
          fetchClients(),
          fetchOrders(),
          fetchQuotes(),
          fetchConsignments(),
          fetchVisits(),
        ]);
        if (!isMounted) return;
        const enrichedClients = computeEnrichedClients(dbClients, dbConsignments || [], dbOrders || [], dbVisits || visits || []);
        setProducts((prev) => (prev && prev.length === dbProducts.length && JSON.stringify(prev) === JSON.stringify(dbProducts) ? prev : dbProducts));
        setClients((prev) => (prev && prev.length === enrichedClients.length && JSON.stringify(prev) === JSON.stringify(enrichedClients) ? prev : enrichedClients));
        setQuotes((prev) => (prev && prev.length === dbQuotes.length && JSON.stringify(prev) === JSON.stringify(dbQuotes) ? prev : dbQuotes));
        if (dbVisits && dbVisits.length > 0) {
          setVisits((prev) => {
            const map = new Map<string, Visit>();
            dbVisits.forEach((v) => map.set(v.id.toLowerCase().trim(), v));
            (prev || []).forEach((v) => {
              if (!map.has(v.id.toLowerCase().trim())) {
                map.set(v.id.toLowerCase().trim(), v);
              }
            });
            const merged = Array.from(map.values());
            return prev && prev.length === merged.length && JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged;
          });
        }
        setOrders((prev) => {
          if (!prev || prev.length === 0) return dbOrders;
          const dbSet = new Set(
            dbOrders.flatMap((o) => [
              o.id.toLowerCase().trim(),
              o.id.replace(/^PED-/, '').toLowerCase().trim(),
              `ped-${o.id.replace(/^PED-/, '').toLowerCase().trim()}`,
            ])
          );

          const merged = dbOrders.map((dbOrder) => {
            const cleanDb = dbOrder.id.replace(/^PED-/, '').toLowerCase().trim();
            const local = prev.find(
              (l) =>
                l.id.toLowerCase().trim() === dbOrder.id.toLowerCase().trim() ||
                l.id.replace(/^PED-/, '').toLowerCase().trim() === cleanDb
            );

            let finalPaid = dbOrder.paidAmount || 0;
            let finalReceipt1 = dbOrder.paymentReceiptUrl || '';
            let finalReceipt2 = dbOrder.paymentReceiptUrl2 || '';
            let finalReceiptName1 = dbOrder.paymentReceiptName || '';
            let finalReceiptName2 = dbOrder.paymentReceiptName2 || '';
            let finalProgress = dbOrder.productionProgressPct || 0;
            let finalStatus = dbOrder.status;

            if (local) {
              if ((local.paidAmount || 0) > finalPaid) finalPaid = local.paidAmount;
              if (local.paymentReceiptUrl) finalReceipt1 = local.paymentReceiptUrl;
              if (local.paymentReceiptUrl2) finalReceipt2 = local.paymentReceiptUrl2;
              if (local.paymentReceiptName) finalReceiptName1 = local.paymentReceiptName;
              if (local.paymentReceiptName2) finalReceiptName2 = local.paymentReceiptName2;
              if ((local.productionProgressPct || 0) > finalProgress) {
                finalProgress = local.productionProgressPct;
                finalStatus = local.status;
              }
            }

            const hasReceipt = Boolean(finalReceipt1 || finalReceipt2);
            const isPaidFull = (finalPaid >= dbOrder.totalValue && dbOrder.totalValue > 0) || (hasReceipt && (finalPaid >= dbOrder.totalValue || finalPaid === 0));
            const calculatedPaid = isPaidFull ? (finalPaid > 0 ? finalPaid : dbOrder.totalValue) : finalPaid;
            const calculatedStatusText = isPaidFull
              ? 'Pago Total'
              : calculatedPaid > 0
                ? 'Adiantamento'
                : (dbOrder.paymentStatusText && dbOrder.paymentStatusText !== 'Pendente' ? dbOrder.paymentStatusText : 'Pendente');

            return {
              ...dbOrder,
              productionProgressPct: finalProgress,
              status: finalStatus,
              paidAmount: calculatedPaid,
              paymentStatusText: calculatedStatusText,
              paymentReceiptUrl: finalReceipt1,
              paymentReceiptUrl2: finalReceipt2,
              paymentReceiptName: finalReceiptName1,
              paymentReceiptName2: finalReceiptName2,
            };
          });

          const extraLocal = prev.filter((l) => {
            const cleanL = l.id.replace(/^PED-/, '').toLowerCase().trim();
            return !dbSet.has(l.id.toLowerCase().trim()) && !dbSet.has(cleanL) && !dbSet.has(`ped-${cleanL}`);
          });

          return [...merged, ...extraLocal];
        });
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
        if (reloadBills) reloadBills();
      } catch (err) {
        console.error('Erro ao carregar dados do Supabase:', err);
      } finally {
        if (isMounted && showLoadingState) setDataLoading(false);
      }
    };

    // Initial load shows loading indicator if needed
    loadAllData(true);

    // Re-sincronizar silenciosamente a cada 5 minutos (sem disparar efeito de blur/loading nos cards)
    const intervalId = setInterval(async () => {
      if (!isMounted) return;
      loadAllData(false);
    }, 300000);

    // Re-sincronizar silenciosamente ao focar na janela/Alt+Tab (sem disparar efeito de blur/loading nos cards)
    const handleFocus = () => {
      if (!isMounted) return;
      loadAllData(false);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, setProducts, setClients, setOrders, setQuotes]);

function computeEnrichedClients(
  rawClients: Client[],
  consignments: Consignment[],
  orders: Order[],
  visits: Visit[]
): Client[] {
  if (!rawClients || rawClients.length === 0) return [];
  const todayStr = new Date().toLocaleDateString('pt-BR');

  return rawClients.map((cli) => {
    const matchingConsignments = (consignments || []).filter(
      (c) =>
        c.clientId === cli.id ||
        (c.clientName && c.clientName.toLowerCase().trim() === cli.name.toLowerCase().trim())
    );

    const totalItemsCount = matchingConsignments.reduce((sum, c) => sum + (c.itemsCount || 0), 0);
    const totalValuation = matchingConsignments.reduce((sum, c) => sum + (c.totalValue || 0), 0);

    const matchingVisits = (visits || []).filter(
      (v) =>
        v.clientId === cli.id || (v.clientName && v.clientName.toLowerCase().trim() === cli.name.toLowerCase().trim())
    );

    const completedVisits = matchingVisits.filter((v) => v.status === 'Concluída');

    const matchingDeliveredOrders = (orders || []).filter(
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
        const timeA = parseBRDate(a)?.getTime() || 0;
        const timeB = parseBRDate(b)?.getTime() || 0;
        return timeB - timeA;
      });
      latestVisitDateStr = dates[0];
    }

    const pendingVisits = matchingVisits.filter((v) => v.status !== 'Concluída');

    let computedNextVisitDate = cli.nextVisitDate || 'A agendar';
    let computedVisitStatus: 'Hoje' | 'Atrasada' | 'Em breve' | 'Concluída' | 'Última visita' = cli.visitStatus || 'Última visita';

    if (pendingVisits.length > 0) {
      pendingVisits.sort((a, b) => {
        const timeA = parseBRDate(a.scheduledDate)?.getTime() || 0;
        const timeB = parseBRDate(b.scheduledDate)?.getTime() || 0;
        return timeA - timeB;
      });

      const nextScheduled = pendingVisits[0];
      computedNextVisitDate = nextScheduled.scheduledDate || 'A agendar';

      const now = new Date();
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      const schedTime = parseBRDate(nextScheduled.scheduledDate)?.getTime() || 0;

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

    return {
      ...cli,
      productsOnSiteCount: totalItemsCount,
      productsValuation: totalValuation,
      lastVisitDate: (latestVisitDateStr && latestVisitDateStr !== 'Sem visitas' && latestVisitDateStr !== 'N/A') ? latestVisitDateStr : cli.lastVisitDate,
      nextVisitDate: computedNextVisitDate,
      visitStatus: computedVisitStatus,
    };
  });
}

  // Sync clients' productsOnSiteCount, productsValuation, lastVisitDate, nextVisitDate, and visitStatus dynamically
  useEffect(() => {
    if (!clients || clients.length === 0) return;

    setClients((prevClients) => {
      if (!prevClients || prevClients.length === 0) return prevClients;

      const enriched = computeEnrichedClients(prevClients, consignments || [], orders || [], visits || []);
      const isIdentical =
        prevClients.length === enriched.length &&
        prevClients.every((c, idx) => {
          const e = enriched[idx];
          return (
            c.productsOnSiteCount === e.productsOnSiteCount &&
            Math.abs((c.productsValuation || 0) - (e.productsValuation || 0)) < 0.01 &&
            c.lastVisitDate === e.lastVisitDate &&
            c.nextVisitDate === e.nextVisitDate &&
            c.visitStatus === e.visitStatus
          );
        });

      return isIdentical ? prevClients : enriched;
    });
  }, [consignments, orders, visits]);

  // Auto-replicate internal logistics costs from orders and visits into expenses (Combustível & Transporte)


  // Auto-mirror order local payments (e.g. 50% signal deposit / 50% completion) into expenses/transactions log
  useEffect(() => {
    if (!orders || orders.length === 0) return;

    setExpenses((prevExpenses) => {
      let changed = false;
      const newPaymentEntries: ExpenseItem[] = [];

      // 1. Sync receipts for existing payment expenses
      const updatedPrev = prevExpenses.map((exp) => {
        if (exp.referenceCode && exp.referenceCode.startsWith('PED-PAY-')) {
          const parts = exp.referenceCode.split('-');
          const orderId = parts.length >= 4 ? `${parts[2]}-${parts[3]}` : exp.referenceCode.replace('PED-PAY-', '');
          const matchedOrder = orders.find((o) => o.id === orderId || o.id.replace(/^PED-/, '') === orderId.replace(/^PED-/, ''));
          if (matchedOrder) {
            const hasNewReceipt1 = matchedOrder.paymentReceiptUrl && exp.receiptUrl !== matchedOrder.paymentReceiptUrl;
            const hasNewReceipt2 = matchedOrder.paymentReceiptUrl2 && exp.receiptUrl2 !== matchedOrder.paymentReceiptUrl2;
            if (hasNewReceipt1 || hasNewReceipt2) {
              changed = true;
              return {
                ...exp,
                receiptUrl: matchedOrder.paymentReceiptUrl || exp.receiptUrl || '',
                receiptType: matchedOrder.paymentReceiptType || exp.receiptType || 'image',
                receiptName: matchedOrder.paymentReceiptName || exp.receiptName || 'Comprovante 1',
                receiptUrl2: matchedOrder.paymentReceiptUrl2 || exp.receiptUrl2 || '',
                receiptType2: matchedOrder.paymentReceiptType2 || exp.receiptType2 || 'image',
                receiptName2: matchedOrder.paymentReceiptName2 || exp.receiptName2 || 'Comprovante 2',
              };
            }
          }
        }
        return exp;
      });

      // 2. Ensure orders with paidAmount > 0 have an expense entry without creating duplicates
      orders.forEach((o) => {
        const paid = Number(o.paidAmount) || 0;
        if (paid > 0) {
          const cleanId = o.id.replace(/^PED-/, '');
          const alreadyExists = updatedPrev.some((e) => {
            const refLower = (e.referenceCode || '').toLowerCase();
            const idLower = (e.id || '').toLowerCase();
            const descLower = (e.description || '').toLowerCase();
            const oIdLower = o.id.toLowerCase();
            const cleanIdLower = cleanId.toLowerCase();

            return (
              refLower.includes(oIdLower) ||
              refLower.includes(cleanIdLower) ||
              idLower.includes(oIdLower) ||
              idLower.includes(cleanIdLower) ||
              (e.category === 'Entrada de Pedido' && (descLower.includes(oIdLower) || descLower.includes(cleanIdLower)))
            );
          });

          if (!alreadyExists) {
            changed = true;
            const newExpItem: ExpenseItem = {
              id: `exp-pay-${o.id}-1`,
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
              referenceCode: `PED-PAY-${o.id}-1`,
              receiptUrl: o.paymentReceiptUrl || '',
              receiptType: o.paymentReceiptType || 'image',
              receiptName: o.paymentReceiptName || (o.paymentReceiptUrl ? 'Comprovante 1' : ''),
              receiptUrl2: o.paymentReceiptUrl2 || '',
              receiptType2: o.paymentReceiptType2 || 'image',
              receiptName2: o.paymentReceiptName2 || (o.paymentReceiptUrl2 ? 'Comprovante 2' : ''),
              notes: `Pagamento de ${o.paymentTerms || 'PIX'} referente ao pedido ${o.id}`,
            };
            newPaymentEntries.push(newExpItem);
            createExpense(newExpItem).catch(() => {});
          }
        }
      });

      return changed ? [...newPaymentEntries, ...updatedPrev] : prevExpenses;
    });
  }, [orders]);

  const handleUpdateOrderPaymentWrapper = async (
    orderId: string,
    addedAmount: number,
    receiptUrl?: string,
    receiptType?: 'image' | 'pdf',
    receiptName?: string,
    receiptIndex?: 1 | 2
  ) => {
    const updatedOrderObj = await handleUpdateOrderPayment(
      orderId,
      addedAmount,
      receiptUrl,
      receiptType,
      receiptName,
      receiptIndex
    );

    const targetOrder = updatedOrderObj || orders.find((o) => o.id === orderId || o.id.replace(/^PED-/, '') === orderId.replace(/^PED-/, ''));
    const clientName = targetOrder ? targetOrder.clientName : 'Cliente Local';
    const terms = targetOrder?.paymentTerms || 'PIX';
    const cleanId = orderId.replace(/^PED-/, '');

    const isSecondPayment = (targetOrder?.paidAmount || 0) >= (targetOrder?.totalValue || 0) && (targetOrder?.paidAmount || 0) > addedAmount;
    const paymentIdx = receiptIndex || (isSecondPayment ? 2 : 1);
    const refCode = `PED-PAY-${orderId}-${paymentIdx}`;

    const existingExp = expenses.find(
      (e) =>
        e.referenceCode === refCode ||
        e.referenceCode === `PED-PAY-${cleanId}-${paymentIdx}` ||
        e.id === `exp-pay-${orderId}-${paymentIdx}` ||
        e.id === `exp-pay-${cleanId}-${paymentIdx}`
    );

    if (existingExp) {
      await handleUpdateExpense({
        ...existingExp,
        amount: addedAmount,
        receiptUrl: receiptUrl || (paymentIdx === 2 ? targetOrder?.paymentReceiptUrl2 : targetOrder?.paymentReceiptUrl) || existingExp.receiptUrl,
        receiptType: (receiptType || (paymentIdx === 2 ? targetOrder?.paymentReceiptType2 : targetOrder?.paymentReceiptType) || existingExp.receiptType || 'image') as any,
        receiptName: receiptName || (paymentIdx === 2 ? targetOrder?.paymentReceiptName2 : targetOrder?.paymentReceiptName) || existingExp.receiptName,
        receiptUrl2: targetOrder?.paymentReceiptUrl2 || existingExp.receiptUrl2,
        receiptType2: (targetOrder?.paymentReceiptType2 || existingExp.receiptType2 || 'image') as any,
        receiptName2: targetOrder?.paymentReceiptName2 || existingExp.receiptName2,
      });
    } else {
      const paymentExpenseItem: ExpenseItem = {
        id: `exp-pay-${orderId}-${paymentIdx}`,
        description: `Entrada / Pagamento de Pedido (${orderId} - ${clientName})`,
        category: 'Entrada de Pedido',
        amount: addedAmount,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        paymentStatus: 'Pago',
        beneficiary: clientName,
        createdBy: 'Sistema RN 3D',
        destinationAccount: 'Nubank',
        isAutoReplicated: true,
        referenceCode: refCode,
        receiptUrl: receiptUrl || (paymentIdx === 2 ? targetOrder?.paymentReceiptUrl2 : targetOrder?.paymentReceiptUrl) || '',
        receiptType: (receiptType || (paymentIdx === 2 ? targetOrder?.paymentReceiptType2 : targetOrder?.paymentReceiptType) || 'image') as any,
        receiptName: receiptName || (paymentIdx === 2 ? targetOrder?.paymentReceiptName2 : targetOrder?.paymentReceiptName) || '',
        receiptUrl2: targetOrder?.paymentReceiptUrl2 || '',
        receiptType2: (targetOrder?.paymentReceiptType2 || 'image') as any,
        receiptName2: targetOrder?.paymentReceiptName2 || '',
        notes: `Pagamento de R$ ${addedAmount.toFixed(2).replace('.', ',')} (${terms}) referente ao pedido ${orderId}`,
      };

      await handleCreateExpense(paymentExpenseItem);
    }
  };

  const activeConversionsRef = useState(() => new Set<string>())[0];

  const handleConvertQuoteToOrder = useCallback(
    async (quote: Quote) => {
      if (!quote || activeConversionsRef.has(quote.id)) return;
      activeConversionsRef.add(quote.id);

      try {
        await handleUpdateQuoteStatus(quote.id, 'Convertido em Pedido');

        const orderId = quote.id.startsWith('ORC-')
          ? `PED-${quote.id.replace('ORC-', '')}`
          : `PED-${quote.id}`;

        const existingOrder = orders.find(
          (o) => o.id.toLowerCase() === orderId.toLowerCase() || o.id.toLowerCase() === quote.id.toLowerCase()
        );

      if (!existingOrder) {
        const itemsCount = (quote.items || []).reduce(
          (acc, i) => acc + (Number(i.quantity) || 1),
          0
        );

        const slaDays = quote.productionSlaDays || 7;
        const slaDateObj = new Date(Date.now() + slaDays * 86400000);
        const productionSlaDateStr = `${slaDateObj.getFullYear()}-${String(slaDateObj.getMonth() + 1).padStart(2, '0')}-${String(slaDateObj.getDate()).padStart(2, '0')}`;

        const totalVal = Number(quote.total) || Number(quote.subtotal) || 0;

        const newOrder: Order = {
          id: orderId,
          clientId: quote.clientId || '',
          clientName: quote.clientName || 'Cliente Local',
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          itemsCount: itemsCount,
          totalValue: totalVal,
          paidAmount: 0,
          paymentStatusText: 'Pendente',
          status: 'Novo',
          productionProgressPct: 0,
          productionSlaDate: productionSlaDateStr,
          attendanceMode: quote.attendanceMode,
          internalLogisticsType: quote.internalLogisticsType,
          internalLogisticsCost: quote.internalLogisticsCost,
          notes: quote.notes || `Convertido a partir do Orçamento #${quote.id}`,
          paymentTerms: quote.paymentTerms || '',
          items: (quote.items || []).map((item) => ({
            productName: item.description || 'Item sem nome',
            quantity: item.quantity || 1,
            unitPrice: Number(item.unitPrice) || 0,
            subtotal: Number(item.subtotal) || (item.quantity * item.unitPrice) || 0,
          })),
          timeline: [
            {
              date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              title: 'Pedido Convertido de Orçamento',
              description: `Convertido a partir do Orçamento #${quote.id}`,
            },
          ],
        };

        await handleCreateOrder(newOrder);
        showToast(`Orçamento #${quote.id} convertido no Pedido #${newOrder.id} com sucesso!`, 'success');
      } else {
        showToast(`Pedido #${orderId} já existia no sistema. Status atualizado.`, 'info');
      }
      } finally {
        activeConversionsRef.delete(quote.id);
      }
    },
    [handleUpdateQuoteStatus, orders, handleCreateOrder, showToast]
  );

  const handleSyncProductsToSupabase = async () => {
    try {
      showToast('Sincronizando todo o sistema com o Banco de Dados', 'info');
      const [pCount, cCount, oCount, qCount, eCount, consCount, vCount] = await Promise.all([
        syncMissingProductsToSupabase(products),
        syncMissingClientsToSupabase(clients),
        syncMissingOrdersToSupabase(orders),
        syncMissingQuotesToSupabase(quotes),
        syncMissingExpensesToSupabase(expenses),
        syncMissingConsignmentsToSupabase(consignments),
        syncMissingVisitsToSupabase(visits),
      ]);

      const [dbProds, dbClients, dbOrders, dbQuotes, dbConsignments, dbVisits] = await Promise.all([
        fetchProducts(),
        fetchClients(),
        fetchOrders(),
        fetchQuotes(),
        fetchConsignments(),
        fetchVisits(),
      ]);

      setProducts(dbProds);
      setClients(dbClients);
      setOrders(dbOrders);
      setQuotes(dbQuotes);
      if (dbVisits && dbVisits.length > 0) {
        setVisits((prev) => {
          const map = new Map<string, Visit>();
          dbVisits.forEach((v) => map.set(v.id.toLowerCase().trim(), v));
          (prev || []).forEach((v) => {
            if (!map.has(v.id.toLowerCase().trim())) {
              map.set(v.id.toLowerCase().trim(), v);
            }
          });
          return Array.from(map.values());
        });
      }
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

      const totalNew = pCount + cCount + oCount + qCount + eCount + consCount + vCount;
      if (totalNew > 0) {
        showToast(`✅ Sincronização concluída! (${pCount} prods, ${cCount} clientes, ${oCount} pedidos, ${consCount} consignações, ${vCount} visitas)`, 'success');
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
    recurringBills,
    billAlerts,
    pendingAlertsCount,
    urgentAlertsCount,
    reloadBills,
    handleCreateBill,
    handleUpdateBill,
    handleDeleteBill,
    handleMarkBillPaid,
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
    handleDeleteClient,
    handleAddConsignment,
    handleUpdateConsignment,
    handleDeleteConsignment,
    handleClearConsignments,
    handleCreateQuote,
    handleUpdateQuote,
    handleUpdateQuoteStatus,
    handleDeleteQuote,
    handleConvertQuoteToOrder,
    handleCreateExpense,
    handleExecuteTransfer,
    handleUpdateExpense,
    handleDeleteExpense,
    handleUpdateSingleBalance,
    handleCreateOrder,
    handleDeleteOrder: handleDeleteOrderCascade,
    handleUpdateOrderProgress,
    handleUpdateOrderStatus,
    handleUpdateOrderPayment: handleUpdateOrderPaymentWrapper,
    handleExecuteExchange,
    handleScheduleVisit,
    handleDeleteVisit,
    handleCompleteVisit,
  };
}
