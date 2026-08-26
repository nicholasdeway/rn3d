import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Order } from '../types';

export async function fetchOrders(): Promise<Order[]> {
  let localOrders: Order[] = [];
  try {
    const saved = localStorage.getItem('rn3d_orders');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localOrders = parsed;
      }
    }
  } catch (e) {
    console.error('Error reading local orders:', e);
  }

  if (!isSupabaseConfigured()) {
    return localOrders;
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Erro ao buscar pedidos no Supabase:', error?.message);
    return localOrders;
  }

  const dbOrders: Order[] = data
    .filter((row) => row.order_code !== 'SYS_ACCOUNT_BALANCES' && row.client_name !== 'SISTEMA_BALANCES')
    .map((row) => {
      let clientCost = Number(row.internal_logistics_cost);
      let clientType = row.internal_logistics_type || 'combustivel';

      if (!clientCost || isNaN(clientCost)) {
        try {
          const savedLogistics = localStorage.getItem('rn3d_client_logistics');
          if (savedLogistics) {
            const parsed = JSON.parse(savedLogistics);
            if (row.client_id && parsed[row.client_id]) {
              clientCost = Number(parsed[row.client_id].cost) || 0;
              clientType = parsed[row.client_id].type || clientType;
            }
          }
        } catch (e) {}
      }

      return {
        id: row.order_code || row.id,
        clientId: row.client_id || '',
        clientName: row.client_name,
        date: row.date || new Date().toISOString().split('T')[0],
        itemsCount: row.items_count || (row.order_items ? row.order_items.length : 0),
        totalValue: Number(row.total_value) || 0,
        paidAmount: Number(row.paid_amount) || 0,
        paymentStatusText: row.payment_status_text || 'Pendente',
        status: row.status as Order['status'],
        productionProgressPct: row.production_progress_pct || 0,
        productionSlaDate: row.production_sla_date || '',
        estimatedDeliveryDate: row.estimated_delivery_date || '',
        internalLogisticsType: clientType as any,
        internalLogisticsCost: clientCost,
        items: (row.order_items || []).map((item: any) => ({
          productName: item.product_name,
          quantity: item.quantity,
          unitPrice: Number(item.unit_price) || 0,
          subtotal: Number(item.subtotal) || 0,
        })),
        timeline: [
          {
            date: new Date(row.created_at).toLocaleString('pt-BR'),
            title: 'Pedido Registrado no Sistema',
          },
        ],
      };
    });

  try {
    localStorage.setItem('rn3d_orders', JSON.stringify(dbOrders));
  } catch (e) {}

  return dbOrders;
}

function normalizeToIsoDate(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [p1, p2, p3] = parts;
      if (p3.length === 4) {
        return `${p3}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
      } else if (p1.length === 4) {
        return `${p1}-${p2.padStart(2, '0')}-${p3.padStart(2, '0')}`;
      }
    }
  }
  return dateStr;
}

export async function createOrder(orderData: Partial<Order>): Promise<Order | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const orderCode = orderData.id || `PED-${Math.floor(100000 + Math.random() * 900000)}`;
  const initialProgress = orderData.productionProgressPct ?? (orderData.status === 'Entregue' || orderData.status === 'Concluído' ? 100 : 15);

  const payload: any = {
    order_code: orderCode,
    client_name: orderData.clientName || 'Cliente Padrão',
    date: normalizeToIsoDate(orderData.date),
    total_value: orderData.totalValue || 0,
    paid_amount: orderData.paidAmount || 0,
    payment_status_text: orderData.paymentStatusText || 'Pendente',
    status: orderData.status || 'Novo',
    production_progress_pct: initialProgress,
  };

  if (orderData.clientId && !orderData.clientId.startsWith('cli-')) {
    payload.client_id = orderData.clientId;
  }

  let { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert([payload])
    .select()
    .single();

  if (orderError && orderError.message.includes('client_id')) {
    delete payload.client_id;
    const retry = await supabase.from('orders').insert([payload]).select().single();
    newOrder = retry.data;
    orderError = retry.error;
  }

  if (orderError || !newOrder) {
    console.error('Erro ao salvar pedido no Supabase:', orderError?.message);
    throw orderError;
  }

  if (orderData.items && orderData.items.length > 0) {
    const formattedItems = orderData.items.map((item) => ({
      order_id: newOrder.id,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.subtotal,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(formattedItems);
    if (itemsError) {
      console.error('Erro ao salvar itens do pedido:', itemsError.message);
    }
  }

  return newOrder as any;
}

async function updateOrderPayloadInSupabase(
  orderCode: string,
  payload: Record<string, any>
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  // 1. Try update by order_code
  let { data, error } = await supabase
    .from('orders')
    .update(payload)
    .eq('order_code', orderCode)
    .select('id, order_code');

  // 2. Try update by id (UUID)
  if (error || !data || data.length === 0) {
    const retryId = await supabase
      .from('orders')
      .update(payload)
      .eq('id', orderCode)
      .select('id, order_code');

    data = retryId.data;
    error = retryId.error;
  }

  // 3. Fallback: Search all orders in Supabase to locate matching row by substring
  if (error || !data || data.length === 0) {
    const { data: allOrders } = await supabase.from('orders').select('id, order_code, client_name, total_value');
    if (allOrders && allOrders.length > 0) {
      const cleanCode = orderCode.replace('PED-', '').replace('ORC-', '');
      const match = allOrders.find(
        (r) =>
          r.order_code === orderCode ||
          r.id === orderCode ||
          (r.order_code && cleanCode && r.order_code.includes(cleanCode)) ||
          (r.id && cleanCode && r.id.includes(cleanCode))
      );

      if (match) {
        const retryMatch = await supabase
          .from('orders')
          .update(payload)
          .eq('id', match.id)
          .select('id, order_code');

        data = retryMatch.data;
        error = retryMatch.error;
      }
    }
  }

  // 4. Ultimate Fallback: If order does not exist in Supabase at all, insert/upsert it!
  if (error || !data || data.length === 0) {
    console.warn(`[ordersService] Pedido '${orderCode}' não encontrado no Supabase. Inserindo registro automaticamente...`);
    const insertPayload = {
      order_code: orderCode,
      client_name: payload.client_name || 'Cliente Padrão',
      date: new Date().toISOString().split('T')[0],
      total_value: payload.total_value || 0,
      paid_amount: payload.paid_amount || 0,
      payment_status_text: payload.payment_status_text || 'Pendente',
      status: payload.status || 'Novo',
      production_progress_pct: payload.production_progress_pct ?? 100,
    };
    const insertRes = await supabase.from('orders').upsert([insertPayload], { onConflict: 'order_code' }).select();
    if (insertRes.error) {
      console.error(`[ordersService] Erro ao inserir pedido '${orderCode}' no Supabase:`, insertRes.error.message);
      return false;
    }
    return true;
  }

  return true;
}

export async function updateOrderStatus(
  orderCode: string,
  newStatus: string,
  progressPct?: number
): Promise<boolean> {
  const payload: Record<string, any> = { status: newStatus };
  if (typeof progressPct === 'number') {
    payload.production_progress_pct = progressPct;
  } else if (newStatus === 'Entregue' || newStatus === 'Concluído' || newStatus === 'Pronto') {
    payload.production_progress_pct = 100;
  }

  return updateOrderPayloadInSupabase(orderCode, payload);
}

export async function updateOrderProgress(
  orderCode: string,
  progressPct: number,
  newStatus?: string
): Promise<boolean> {
  const updates: Record<string, any> = {
    production_progress_pct: progressPct,
  };
  if (newStatus) {
    updates.status = newStatus;
  }

  return updateOrderPayloadInSupabase(orderCode, updates);
}

export async function deleteOrder(orderCode: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;

  let { data, error } = await supabase
    .from('orders')
    .delete()
    .eq('order_code', orderCode)
    .select('id');

  if (error || !data || data.length === 0) {
    const retry = await supabase.from('orders').delete().eq('id', orderCode).select('id');
    error = retry.error;
    data = retry.data;
  }

  if (error) {
    console.error('Erro ao excluir pedido no Supabase:', error.message);
    return false;
  }
  return true;
}

export async function updateOrderPayment(
  orderCode: string,
  paidAmount: number,
  paymentStatusText: string
): Promise<boolean> {
  return updateOrderPayloadInSupabase(orderCode, {
    paid_amount: paidAmount,
    payment_status_text: paymentStatusText,
  });
}

export async function syncMissingOrdersToSupabase(missingOrders: Order[]): Promise<number> {
  if (!isSupabaseConfigured() || missingOrders.length === 0) return 0;

  const { data: existingRows } = await supabase.from('orders').select('id, order_code');
  const existingCodes = new Set<string>();
  if (existingRows) {
    existingRows.forEach((r) => {
      if (r.id) existingCodes.add(r.id);
      if (r.order_code) existingCodes.add(r.order_code);
    });
  }

  let syncedCount = 0;
  for (const o of missingOrders) {
    if (existingCodes.has(o.id)) continue;
    try {
      await createOrder(o);
      syncedCount++;
    } catch (err) {
      console.error(`Erro ao sincronizar pedido ${o.id}:`, err);
    }
  }
  return syncedCount;
}
