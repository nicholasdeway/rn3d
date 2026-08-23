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

  const dbOrders: Order[] = data.map((row) => ({
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
  }));

  try {
    localStorage.setItem('rn3d_orders', JSON.stringify(dbOrders));
  } catch (e) {}

  return dbOrders;
}

export async function createOrder(orderData: Partial<Order>): Promise<Order | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const orderCode = orderData.id || `PED-${Math.floor(100000 + Math.random() * 900000)}`;

  const payload: any = {
    order_code: orderCode,
    client_name: orderData.clientName || 'Cliente Padrão',
    total_value: orderData.totalValue || 0,
    paid_amount: orderData.paidAmount || 0,
    payment_status_text: orderData.paymentStatusText || 'Pendente',
    status: orderData.status || 'Novo',
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

export async function updateOrderStatus(orderCode: string, newStatus: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('order_code', orderCode);

  if (error) {
    console.error('Erro ao atualizar status do pedido:', error.message);
    return false;
  }
  return true;
}

export async function updateOrderProgress(
  orderCode: string,
  progressPct: number,
  newStatus?: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const updates: Record<string, any> = {
    production_progress_pct: progressPct,
  };
  if (newStatus) {
    updates.status = newStatus;
  }

  const { error } = await supabase
    .from('orders')
    .update(updates)
    .eq('order_code', orderCode);

  if (error) {
    console.error('Erro ao atualizar progresso de impressão 3D:', error.message);
    return false;
  }
  return true;
}

export async function deleteOrder(orderCode: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;

  const { error } = await supabase
    .from('orders')
    .delete()
    .or(`order_code.eq.${orderCode},id.eq.${orderCode}`);

  if (error) {
    console.error('Erro ao excluir pedido no Supabase:', error.message);
    return false;
  }
  return true;
}


export async function syncMissingOrdersToSupabase(missingOrders: Order[]): Promise<number> {
  if (!isSupabaseConfigured() || missingOrders.length === 0) return 0;

  let syncedCount = 0;
  for (const o of missingOrders) {
    try {
      await createOrder(o);
      syncedCount++;
    } catch (err) {
      console.error(`Erro ao sincronizar pedido ${o.id}:`, err);
    }
  }
  return syncedCount;
}
