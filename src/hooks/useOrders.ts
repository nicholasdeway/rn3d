import { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { safeSetLocalStorage, getStorageParsed } from '../utils/storage';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  fetchOrders,
  createOrder,
  updateOrder,
  deleteOrder,
} from '../services/ordersService';

import { uploadToSupabaseStorage } from '../services/storageService';

export function useOrders(
  user: any,
  showToastOrQuotes?: any,
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void,
  setVisits?: any,
  setTransactions?: any
) {
  const [orders, setOrders] = useState<Order[]>(() =>
    getStorageParsed<Order[]>('rn3d_orders', [], true).filter(
      (o) =>
        !o.id?.startsWith('SYS_') &&
        !o.clientName?.startsWith('SISTEMA_') &&
        !o.id?.startsWith('REM-')
    )
  );

  const toast = typeof showToastOrQuotes === 'function' ? showToastOrQuotes : showToast || (() => { });

  useEffect(() => {
    if (orders && orders.length > 0) {
      const cleanOrders = orders.filter(
        (o) =>
          !o.id?.startsWith('SYS_') &&
          !o.clientName?.startsWith('SISTEMA_') &&
          !o.id?.startsWith('REM-')
      );
      safeSetLocalStorage('rn3d_orders', JSON.stringify(cleanOrders));
    }
  }, [orders]);

  // Load directly from Supabase on mount and set authoritative state
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    fetchOrders()
      .then((dbOrders) => {
        if (isMounted && Array.isArray(dbOrders)) {
          setOrders((prev) => {
            const cleanDb = dbOrders.filter(
              (o) =>
                !o.id?.startsWith('SYS_') &&
                !o.clientName?.startsWith('SISTEMA_') &&
                !o.id?.startsWith('REM-')
            );
            const merged = cleanDb.map((dbOrder) => {
              const localMatch = prev.find(
                (l) =>
                  l.id === dbOrder.id ||
                  l.id.replace(/^PED-/, '') === dbOrder.id.replace(/^PED-/, '')
              );

              if (localMatch && (localMatch.paidAmount || 0) > (dbOrder.paidAmount || 0)) {
                return {
                  ...dbOrder,
                  paidAmount: localMatch.paidAmount,
                  paymentStatusText: localMatch.paymentStatusText,
                  paymentReceiptUrl: localMatch.paymentReceiptUrl || dbOrder.paymentReceiptUrl,
                  paymentReceiptUrl2: localMatch.paymentReceiptUrl2 || dbOrder.paymentReceiptUrl2,
                };
              }
              return dbOrder;
            });

            safeSetLocalStorage('rn3d_orders', JSON.stringify(merged));
            return merged;
          });
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
    const cleanId = orderId.replace(/^PED-/, '').replace(/^ORC-/, '');
    setOrders((prev) => {
      const updated = prev.filter(
        (o) =>
          o.id !== orderId &&
          o.id !== cleanId &&
          o.id !== `PED-${cleanId}` &&
          o.id.replace(/^PED-/, '') !== cleanId
      );
      safeSetLocalStorage('rn3d_orders', JSON.stringify(updated));
      return updated;
    });
    toast(`Pedido #${orderId} removido!`, 'success');
    try {
      await deleteOrder(orderId);
    } catch (err) {
      console.error('Erro ao deletar pedido no Supabase:', err);
    }
  };

  const handleUpdateOrderPayment = async (
    orderId: string,
    addedAmount: number,
    receiptUrl?: string,
    receiptType?: 'image' | 'pdf',
    receiptName?: string,
    receiptIndex?: 1 | 2
  ) => {
    let processedReceiptUrl = receiptUrl;
    if (processedReceiptUrl && processedReceiptUrl.startsWith('data:')) {
      processedReceiptUrl = await uploadToSupabaseStorage(processedReceiptUrl, 'receipts', `pedido_${orderId}`);
    }

    let updatedOrderObj: Order | undefined;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId || o.id.replace(/^PED-/, '') === orderId.replace(/^PED-/, '')) {
          const newPaid = Math.min(o.totalValue, o.paidAmount + addedAmount);
          const newStatus =
            newPaid >= o.totalValue
              ? 'Pago Total'
              : newPaid > 0
                ? 'Adiantamento'
                : 'Pendente';

          const targetIndex = receiptIndex || (o.paymentReceiptUrl && processedReceiptUrl && o.paymentReceiptUrl !== processedReceiptUrl ? 2 : 1);

          let finalReceiptUrl1 = o.paymentReceiptUrl;
          let finalReceiptType1 = o.paymentReceiptType;
          let finalReceiptName1 = o.paymentReceiptName;

          let finalReceiptUrl2 = o.paymentReceiptUrl2;
          let finalReceiptType2 = o.paymentReceiptType2;
          let finalReceiptName2 = o.paymentReceiptName2;

          if (processedReceiptUrl !== undefined) {
            if (targetIndex === 2) {
              finalReceiptUrl2 = processedReceiptUrl;
              finalReceiptType2 = receiptType || 'image';
              finalReceiptName2 = receiptName || '';
            } else {
              finalReceiptUrl1 = processedReceiptUrl;
              finalReceiptType1 = receiptType || 'image';
              finalReceiptName1 = receiptName || '';
            }
          }

          updatedOrderObj = {
            ...o,
            paidAmount: newPaid,
            paymentStatusText: newStatus,
            paymentReceiptUrl: finalReceiptUrl1,
            paymentReceiptType: finalReceiptType1,
            paymentReceiptName: finalReceiptName1,
            paymentReceiptUrl2: finalReceiptUrl2,
            paymentReceiptType2: finalReceiptType2,
            paymentReceiptName2: finalReceiptName2,
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
          paymentReceiptUrl: updatedOrderObj.paymentReceiptUrl,
          paymentReceiptType: updatedOrderObj.paymentReceiptType,
          paymentReceiptName: updatedOrderObj.paymentReceiptName,
          paymentReceiptUrl2: updatedOrderObj.paymentReceiptUrl2,
          paymentReceiptType2: updatedOrderObj.paymentReceiptType2,
          paymentReceiptName2: updatedOrderObj.paymentReceiptName2,
        });
      }
    } catch (err) {
      console.error('Erro ao atualizar pagamento do pedido no Supabase:', err);
    }

    return updatedOrderObj;
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
