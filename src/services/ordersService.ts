import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Order } from '../types';
import { INITIAL_ORDERS } from '../mockData';

export async function fetchOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured()) {
    return INITIAL_ORDERS;
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar pedidos no Supabase:', error.message);
    return INITIAL_ORDERS;
  }

  return (data || []).map((row) => ({
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
}

export async function createOrder(orderData: Partial<Order>): Promise<Order | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const orderCode = orderData.id || `PED-${Math.floor(100000 + Math.random() * 900000)}`;

  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert([
      {
        order_code: orderCode,
        client_id: orderData.clientId || null,
        client_name: orderData.clientName,
        total_value: orderData.totalValue,
        paid_amount: orderData.paidAmount || 0,
        payment_status_text: orderData.paymentStatusText || 'Pendente',
        status: orderData.status || 'Novo',
      },
    ])
    .select()
    .single();

  if (orderError) {
    console.error('Erro ao salvar pedido:', orderError.message);
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
