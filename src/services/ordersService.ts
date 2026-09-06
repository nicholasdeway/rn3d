import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Order } from '../types';
import { formatDateBR, normalizeToIsoDate, getTodayBR } from '../utils/formatters';

/**
 * 100% Direct Supabase Postgres Fetch — Zero LocalStorage Caching
 */
export async function fetchOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Erro ao buscar pedidos no Supabase:', error?.message);
    return [];
  }

  const dbOrders: Order[] = data
    .filter(
      (row) =>
        !row.order_code?.startsWith('SYS_') &&
        !row.client_name?.startsWith('SISTEMA_') &&
        !(row.order_code && row.order_code.startsWith('REM-'))
    )
    .map((row) => {
      let clientCost = Number(row.internal_logistics_cost) || 0;
      let clientType = row.internal_logistics_type || 'combustivel';

      return {
        id: row.order_code || row.id,
        clientId: row.client_id || '',
        clientName: row.client_name,
        date: formatDateBR(row.date) || formatDateBR(row.created_at) || getTodayBR(),
        createdAt: row.created_at || undefined,
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
        paymentReceiptUrl: row.payment_receipt_url || '',
        paymentReceiptType: row.payment_receipt_type || 'image',
        paymentReceiptName: row.payment_receipt_name || '',
        paymentReceiptUrl2: row.payment_receipt_url2 || '',
        paymentReceiptType2: row.payment_receipt_type2 || 'image',
        paymentReceiptName2: row.payment_receipt_name2 || '',
        paymentTerms: row.payment_terms || row.payment_method || '',
        notes: row.notes || '',
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

  return dbOrders;
}

export async function syncMissingOrdersToSupabase(missingOrders: Order[]): Promise<number> {
  if (!isSupabaseConfigured() || missingOrders.length === 0) return 0;

  try {
    const { data: dbData } = await supabase.from('orders').select('order_code');
    const existingCodes = new Set((dbData || []).map((row) => (row.order_code || '').toLowerCase().trim()));

    const toInsert = missingOrders.filter(
      (o) =>
        o.id &&
        !o.id.startsWith('SYS_') &&
        !o.clientName?.startsWith('SISTEMA_') &&
        !existingCodes.has(o.id.toLowerCase().trim())
    );
    if (toInsert.length === 0) return 0;

    const rows = toInsert.map((o) => ({
      order_code: o.id,
      client_id: (o.clientId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(o.clientId)) ? o.clientId : null,
      client_name: o.clientName,
      date: o.date,
      items_count: o.itemsCount || (o.items ? o.items.length : 0),
      total_value: o.totalValue,
      paid_amount: o.paidAmount,
      payment_status_text: o.paymentStatusText || (o.paidAmount >= o.totalValue ? 'Pago Total' : o.paidAmount > 0 ? 'Parcial' : 'Pendente'),
      status: o.status || 'Novo',
      production_progress_pct: o.productionProgressPct || 0,
      internal_logistics_type: o.internalLogisticsType || 'combustivel',
      internal_logistics_cost: o.internalLogisticsCost || 0,
    }));

    const { error } = await supabase.from('orders').insert(rows);

    if (error) {
      console.warn('Aviso na sincronização de pedidos com Supabase:', error.message);
      return 0;
    } else {
      return rows.length;
    }
  } catch (err) {
    console.error('Erro ao sincronizar lote de pedidos:', err);
    return 0;
  }
}

export async function createOrder(order: Partial<Order>): Promise<Order | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const payload: any = {
    order_code: order.id,
    client_name: order.clientName,
    date: order.date || new Date().toISOString().split('T')[0],
    items_count: order.itemsCount || (order.items ? order.items.length : 0),
    total_value: order.totalValue || 0,
    paid_amount: order.paidAmount || 0,
    payment_status_text: order.paymentStatusText || (order.paidAmount && order.totalValue && order.paidAmount >= order.totalValue ? 'Pago Total' : order.paidAmount && order.paidAmount > 0 ? 'Parcial' : 'Pendente'),
    status: order.status || 'Novo',
  };

  if (order.clientId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.clientId)) {
    payload.client_id = order.clientId;
  }

  const { data, error } = await supabase
    .from('orders')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.warn('Aviso ao cadastrar pedido no Supabase (salvo no armazenamento local):', error.message);
  }

  // Insert Order Items if present
  if (order.items && order.items.length > 0 && data?.id) {
    const itemRows = order.items.map((item) => ({
      order_id: data.id,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.subtotal,
    }));
    await supabase.from('order_items').insert(itemRows);
  }

  return (data || payload) as any;
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const payload: any = {};
  if (updates.clientName !== undefined) payload.client_name = updates.clientName;
  if (updates.totalValue !== undefined) payload.total_value = updates.totalValue;
  if (updates.paidAmount !== undefined) payload.paid_amount = updates.paidAmount;
  if (updates.paymentStatusText !== undefined) payload.payment_status_text = updates.paymentStatusText;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.productionProgressPct !== undefined) payload.production_progress_pct = updates.productionProgressPct;
  if (updates.internalLogisticsType !== undefined) payload.internal_logistics_type = updates.internalLogisticsType;
  if (updates.internalLogisticsCost !== undefined) payload.internal_logistics_cost = updates.internalLogisticsCost;

  if (Object.keys(payload).length === 0) return null;

  const isLocalId = !id || id.startsWith('PED-') || id.length < 30;

  let query = supabase.from('orders').update(payload);
  if (!isLocalId) {
    query = query.eq('id', id);
  } else {
    query = query.eq('order_code', id);
  }

  const { data, error } = await query.select();

  if (error) {
    console.warn('Aviso ao atualizar pedido no Supabase:', error.message);
    return null;
  }

  return (data && data[0]) ? (data[0] as any) : null;
}

export async function deleteOrder(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;
  try {
    const isLocalId = !id || id.startsWith('PED-') || id.length < 30;
    if (isLocalId) {
      await supabase.from('orders').delete().eq('order_code', id);
    } else {
      await supabase.from('orders').delete().eq('id', id);
    }
    return true;
  } catch (e) {
    console.error('Erro ao deletar pedido no Supabase:', e);
    return false;
  }
}

