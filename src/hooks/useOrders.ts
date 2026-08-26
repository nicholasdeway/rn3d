import React, { useState, useEffect } from 'react';
import { Order, Quote, Visit } from '../types';
import { safeSetLocalStorage, getStorageParsed } from '../utils/storage';
import {
  fetchOrders,
  createOrder,
  updateOrderStatus,
  updateOrderProgress,
  deleteOrder,
  updateOrderPayment,
} from '../services/ordersService';

export function useOrders(
  user: any,
  quotes: Quote[],
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void,
  setVisits: React.Dispatch<React.SetStateAction<Visit[]>>,
  setTransactions: React.Dispatch<React.SetStateAction<any[]>>
) {
  const [orders, setOrders] = useState<Order[]>(() =>
    getStorageParsed<Order[]>('rn3d_orders', [], true)
  );

  useEffect(() => {
    safeSetLocalStorage('rn3d_orders', JSON.stringify(orders));
  }, [orders]);

  // Load from Supabase on mount
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    fetchOrders()
      .then((dbOrders) => {
        if (isMounted && Array.isArray(dbOrders)) {
          setOrders(dbOrders);
        }
      })
      .catch((err) => console.error('Erro ao carregar pedidos do Supabase:', err));

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Auto-sync: Ensure every converted or approved quote has a corresponding Order
  useEffect(() => {
    if (!quotes || quotes.length === 0) return;

    quotes.forEach((q) => {
      const statusStr = String(q.status);
      const isApprovedOrConverted =
        statusStr === 'Convertido em Pedido' ||
        statusStr === 'Convertido' ||
        statusStr === 'Aprovado';

      if (isApprovedOrConverted) {
        const cleanQuoteCode = q.id ? q.id.replace('ORC-', '') : '';
        const orderIdCandidate = cleanQuoteCode ? `PED-${cleanQuoteCode}` : q.id;

        setOrders((prevOrders) => {
          const exists = prevOrders.some(
            (o) =>
              o.id === q.id ||
              o.id === orderIdCandidate ||
              (cleanQuoteCode && (o.id.includes(cleanQuoteCode) || o.id.includes(q.id))) ||
              o.timeline.some((t) => t.description?.includes(q.id) || t.title?.includes(q.id)) ||
              (o.clientName.toLowerCase().trim() === q.clientName.toLowerCase().trim() && Math.abs(o.totalValue - q.total) < 0.01)
          );

          if (!exists) {
            const newOrder: Order = {
              id: orderIdCandidate,
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
                unitPrice: i.unitPrice || i.subtotal / (i.quantity || 1),
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

            // Immediately persist new order to Supabase
            createOrder(newOrder).catch((err) =>
              console.error('Erro ao persisitir pedido convertido no Supabase:', err)
            );

            return [newOrder, ...prevOrders];
          }
          return prevOrders;
        });
      }
    });
  }, [quotes]);

  const handleCreateOrder = async (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    showToast(`Pedido ${newOrder.id} criado com sucesso!`, 'success');
    try {
      await createOrder(newOrder);
    } catch (err) {
      console.error('Erro ao salvar pedido no Supabase:', err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    showToast(`Pedido ${orderId} excluído com sucesso!`, 'info');
    try {
      await deleteOrder(orderId);
    } catch (err) {
      console.error('Erro ao excluir pedido no Supabase:', err);
    }
  };

  const handleUpdateOrderProgress = async (orderId: string, newProgress: number) => {
    let finalStatus = '';
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          let autoStatus = o.status;
          if (newProgress >= 100) {
            autoStatus = o.status === 'Entregue' ? 'Entregue' : 'Concluído';
          } else {
            autoStatus = o.status === 'Entregue' ? 'Entregue' : 'Em produção';
          }
          finalStatus = autoStatus;
          return {
            ...o,
            productionProgressPct: newProgress,
            status: autoStatus,
          };
        }
        return o;
      })
    );
    showToast(`Progresso do Pedido ${orderId} atualizado para ${newProgress}%`, 'info');
    try {
      await updateOrderProgress(orderId, newProgress, finalStatus);
    } catch (err) {
      console.error('Erro ao atualizar progresso no Supabase:', err);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    let targetOrder: Order | undefined;
    let targetProgress = 0;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const isCompletedStatus =
            newStatus === 'Entregue' || newStatus === 'Concluído' || newStatus === 'Pronto';
          const newProgress = isCompletedStatus ? 100 : o.productionProgressPct;
          targetProgress = newProgress;

          const updated = {
            ...o,
            status: newStatus as any,
            productionProgressPct: newProgress,
            timeline: [
              {
                date: `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
                title: `Status alterado para: ${newStatus}`,
              },
              ...o.timeline,
            ],
          };
          targetOrder = updated;
          return updated;
        }
        return o;
      })
    );

    if (newStatus === 'Entregue' && targetOrder) {
      const modeText = targetOrder.paidAmount >= targetOrder.totalValue ? 'Pago' : 'Faturado / Pendente';
      const formattedDate = new Date().toLocaleDateString('pt-BR');
      const formattedTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

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
      await updateOrderStatus(orderId, newStatus, targetProgress);
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
              ...o.timeline,
            ],
          };
        }
        return o;
      })
    );

    const orderObj = orders.find((o) => o.id === orderId);
    if (orderObj) {
      setTransactions((prev) => [
        {
          id: `PAG-${Math.floor(Math.random() * 9000 + 1000)}`,
          clientName: orderObj.clientName,
          date: new Date().toLocaleDateString('pt-BR'),
          type: 'Recebimento de Pedido',
          amount: additionalAmount,
          paymentMethod: 'PIX',
          status: 'Recebido',
          notes: `Entrada parcial/total referente ao Pedido ${orderId}`,
        },
        ...prev,
      ]);
    }

    showToast(`Recebimento de R$ ${additionalAmount.toFixed(2).replace('.', ',')} registrado com sucesso! Dashboard e Caixa atualizados.`, 'success');

    try {
      await updateOrderPayment(orderId, finalPaidAmount, finalPaymentStatus);
    } catch (err) {
      console.error('Erro ao atualizar pagamento no Supabase:', err);
    }
  };

  return {
    orders,
    setOrders,
    handleCreateOrder,
    handleDeleteOrder,
    handleUpdateOrderProgress,
    handleUpdateOrderStatus,
    handleUpdateOrderPayment,
  };
}
