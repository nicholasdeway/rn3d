import { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import {
  fetchOrders,
  createOrder,
  updateOrder,
} from '../services/ordersService';

export function useOrders(
  user: any,
  showToastOrQuotes?: any,
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void,
  setVisits?: any,
  setTransactions?: any
) {
  const [orders, setOrders] = useState<Order[]>([]);

  const toast = typeof showToastOrQuotes === 'function' ? showToastOrQuotes : showToast || (() => {});

  // Load directly from Supabase on mount
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

  const handleAddOrder = async (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    toast(`Pedido #${newOrder.id} gerado com sucesso!`, 'success');
    try {
      await createOrder(newOrder);
    } catch (err) {
      console.error('Erro ao salvar pedido no Supabase:', err);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const progress =
            newStatus === 'Entregue' || newStatus === 'Concluído'
              ? 100
              : newStatus === 'Pronto'
              ? 90
              : newStatus === 'Em produção'
              ? 50
              : 10;
          return {
            ...o,
            status: newStatus,
            productionProgressPct: progress,
          };
        }
        return o;
      })
    );

    toast(`Status do pedido #${orderId} alterado para "${newStatus}"!`, 'success');

    try {
      const progress =
        newStatus === 'Entregue' || newStatus === 'Concluído'
          ? 100
          : newStatus === 'Pronto'
          ? 90
          : newStatus === 'Em produção'
          ? 50
          : 10;

      await updateOrder(orderId, { status: newStatus, productionProgressPct: progress });
    } catch (err) {
      console.error('Erro ao atualizar status do pedido no Supabase:', err);
    }
  };

  const handleUpdateOrderProgress = async (orderId: string, progressPct: number) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, productionProgressPct: progressPct } : o))
    );
    try {
      await updateOrder(orderId, { productionProgressPct: progressPct });
    } catch (err) {
      console.error('Erro ao atualizar progresso do pedido no Supabase:', err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    toast(`Pedido #${orderId} removido!`, 'success');
  };

  const handleUpdateOrderPayment = async (
    orderId: string,
    addedAmount: number,
    receiptUrl?: string,
    receiptType?: 'image' | 'pdf',
    receiptName?: string
  ) => {
    let updatedOrderObj: Order | undefined;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const newPaid = Math.min(o.totalValue, o.paidAmount + addedAmount);
          const newStatus =
            newPaid >= o.totalValue
              ? 'Pago Total'
              : newPaid > 0
              ? 'Parcial'
              : 'Pendente';

          const finalReceiptUrl = receiptUrl !== undefined ? receiptUrl : o.paymentReceiptUrl;
          const finalReceiptType = receiptType !== undefined ? receiptType : o.paymentReceiptType;
          const finalReceiptName = receiptName !== undefined ? receiptName : o.paymentReceiptName;

          updatedOrderObj = {
            ...o,
            paidAmount: newPaid,
            paymentStatusText: newStatus,
            paymentReceiptUrl: finalReceiptUrl,
            paymentReceiptType: finalReceiptType,
            paymentReceiptName: finalReceiptName,
          };

          return updatedOrderObj;
        }
        return o;
      })
    );

    if (receiptUrl) {
      toast(`Comprovante do pedido #${orderId} salvo com sucesso!`, 'success');
    } else {
      toast(`Pagamento do pedido #${orderId} atualizado!`, 'success');
    }

    try {
      if (updatedOrderObj) {
        await updateOrder(orderId, {
          paidAmount: updatedOrderObj.paidAmount,
          paymentStatusText: updatedOrderObj.paymentStatusText,
        });
      }
    } catch (err) {
      console.error('Erro ao atualizar pagamento do pedido no Supabase:', err);
    }
  };

  return {
    orders,
    setOrders,
    handleAddOrder,
    handleCreateOrder: handleAddOrder,
    handleDeleteOrder,
    handleUpdateOrderStatus,
    handleUpdateOrderProgress,
    handleUpdateOrderPayment,
  };
}
