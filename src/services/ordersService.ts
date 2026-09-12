import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Order } from '../types';
import { formatDateBR, normalizeToIsoDate, getTodayBR } from '../utils/formatters';

function encodeStatusWithMeta(statusText: string, order: Partial<Order>): string {
  const userNotes = order.notes || '';
  const meta = {
    userNotes,
    paymentReceiptUrl: order.paymentReceiptUrl,
    paymentReceiptType: order.paymentReceiptType,
    paymentReceiptName: order.paymentReceiptName,
    paymentReceiptUrl2: order.paymentReceiptUrl2,
    paymentReceiptType2: order.paymentReceiptType2,
    paymentReceiptName2: order.paymentReceiptName2,
    paymentTerms: order.paymentTerms,
    productionProgressPct: order.productionProgressPct,
    internalLogisticsType: order.internalLogisticsType,
    internalLogisticsCost: order.internalLogisticsCost,
  };

  const hasMeta =
    Boolean(userNotes) ||
    Boolean(order.paymentReceiptUrl) ||
    Boolean(order.paymentReceiptUrl2) ||
    Boolean(order.paymentTerms) ||
    order.productionProgressPct !== undefined ||
    Boolean(order.internalLogisticsType) ||
    order.internalLogisticsCost !== undefined;

  const baseStatus = statusText || 'Pendente';
  if (!hasMeta) return baseStatus;
  return `${baseStatus} [META:${JSON.stringify(meta)}]`;
}

function decodeOrderRow(row: any): {
  paymentStatusText: string;
  notes: string;
  paymentReceiptUrl: string;
  paymentReceiptType: 'image' | 'pdf';
  paymentReceiptName: string;
  paymentReceiptUrl2: string;
  paymentReceiptType2: 'image' | 'pdf';
  paymentReceiptName2: string;
  paymentTerms: string;
  productionProgressPct: number;
  internalLogisticsType: 'combustivel' | 'transporte' | 'entrega_propria';
  internalLogisticsCost: number;
} {
  let rawText = (row.notes || '') + ' ' + (row.payment_status_text || '');
  let paymentStatusText = row.payment_status_text || 'Pendente';
  let notes = row.notes || '';
  let paymentReceiptUrl = row.payment_receipt_url || '';
  let paymentReceiptType = (row.payment_receipt_type || 'image') as any;
  let paymentReceiptName = row.payment_receipt_name || '';
  let paymentReceiptUrl2 = row.payment_receipt_url2 || '';
  let paymentReceiptType2 = (row.payment_receipt_type2 || 'image') as any;
  let paymentReceiptName2 = row.payment_receipt_name2 || '';
  let paymentTerms = row.payment_terms || row.payment_method || '';
  let productionProgressPct = Number(row.production_progress_pct) || 0;
  let internalLogisticsType = (row.internal_logistics_type || 'combustivel') as any;
  let internalLogisticsCost = Number(row.internal_logistics_cost) || 0;

  if (rawText.includes('[META:')) {
    const startIdx = rawText.indexOf('[META:');
    const endIdx = rawText.indexOf(']', startIdx);
    if (startIdx !== -1 && endIdx > startIdx + 6) {
      try {
        const jsonStr = rawText.substring(startIdx + 6, endIdx);
        const meta = JSON.parse(jsonStr);
        if (meta.paymentReceiptUrl) paymentReceiptUrl = meta.paymentReceiptUrl;
        if (meta.paymentReceiptType) paymentReceiptType = meta.paymentReceiptType;
        if (meta.paymentReceiptName) paymentReceiptName = meta.paymentReceiptName;
        if (meta.paymentReceiptUrl2) paymentReceiptUrl2 = meta.paymentReceiptUrl2;
        if (meta.paymentReceiptType2) paymentReceiptType2 = meta.paymentReceiptType2;
        if (meta.paymentReceiptName2) paymentReceiptName2 = meta.paymentReceiptName2;
        if (meta.paymentTerms) paymentTerms = meta.paymentTerms;
        if (meta.productionProgressPct !== undefined) productionProgressPct = Number(meta.productionProgressPct) || 0;
        if (meta.internalLogisticsType) internalLogisticsType = meta.internalLogisticsType;
        if (meta.internalLogisticsCost !== undefined) internalLogisticsCost = Number(meta.internalLogisticsCost) || 0;
        if (meta.userNotes !== undefined) notes = meta.userNotes;
      } catch (e) {}
    }

    if (paymentStatusText.includes('[META:')) {
      paymentStatusText = paymentStatusText.substring(0, paymentStatusText.indexOf('[META:')).trim() || 'Pendente';
    }
  }

  return {
    paymentStatusText,
    notes,
    paymentReceiptUrl,
    paymentReceiptType,
    paymentReceiptName,
    paymentReceiptUrl2,
    paymentReceiptType2,
    paymentReceiptName2,
    paymentTerms,
    productionProgressPct,
    internalLogisticsType,
    internalLogisticsCost,
  };
}

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
      const decoded = decodeOrderRow(row);
      let clientCost = decoded.internalLogisticsCost || Number(row.internal_logistics_cost) || 0;
      let clientType = decoded.internalLogisticsType || row.internal_logistics_type || 'combustivel';
      let progressPct = decoded.productionProgressPct || Number(row.production_progress_pct) || 0;

      const totalVal = Number(row.total_value) || 0;
      let paidVal = Number(row.paid_amount) || 0;
      const hasReceipt = Boolean(decoded.paymentReceiptUrl || decoded.paymentReceiptUrl2);

      let computedStatusText = decoded.paymentStatusText || 'Pendente';
      if ((totalVal > 0 && paidVal >= totalVal) || (hasReceipt && (paidVal >= totalVal || paidVal === 0))) {
        computedStatusText = 'Pago Total';
        if (paidVal === 0 && totalVal > 0) {
          paidVal = totalVal;
        }
      } else if (paidVal > 0 && (computedStatusText === 'Pendente' || !computedStatusText)) {
        computedStatusText = 'Adiantamento';
      }

      return {
        id: row.order_code || row.id,
        clientId: row.client_id || '',
        clientName: row.client_name,
        date: formatDateBR(row.date) || formatDateBR(row.created_at) || getTodayBR(),
        createdAt: row.created_at || undefined,
        itemsCount: row.items_count || (row.order_items ? row.order_items.length : 0),
        totalValue: totalVal,
        paidAmount: paidVal,
        paymentStatusText: computedStatusText,
        status: row.status as Order['status'],
        productionProgressPct: progressPct,
        productionSlaDate: row.production_sla_date || '',
        estimatedDeliveryDate: row.estimated_delivery_date || '',
        internalLogisticsType: clientType as any,
        internalLogisticsCost: clientCost,
        paymentReceiptUrl: decoded.paymentReceiptUrl,
        paymentReceiptType: decoded.paymentReceiptType,
        paymentReceiptName: decoded.paymentReceiptName,
        paymentReceiptUrl2: decoded.paymentReceiptUrl2,
        paymentReceiptType2: decoded.paymentReceiptType2,
        paymentReceiptName2: decoded.paymentReceiptName2,
        paymentTerms: decoded.paymentTerms,
        notes: decoded.notes,
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
      date: normalizeToIsoDate(o.date),
      items_count: o.itemsCount || (o.items ? o.items.length : 0),
      total_value: o.totalValue,
      paid_amount: o.paidAmount,
      payment_status_text: encodeStatusWithMeta(
        o.paymentStatusText || (o.paidAmount >= o.totalValue ? 'Pago Total' : o.paidAmount > 0 ? 'Adiantamento' : 'Pendente'),
        o
      ),
      status: o.status || 'Novo',
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

  const baseStatusText =
    order.paymentStatusText ||
    (order.paidAmount && order.totalValue && order.paidAmount >= order.totalValue
      ? 'Pago Total'
      : order.paidAmount && order.paidAmount > 0
        ? 'Adiantamento'
        : 'Pendente');

  const payload: any = {
    order_code: order.id,
    client_name: order.clientName,
    date: normalizeToIsoDate(order.date),
    items_count: order.itemsCount || (order.items ? order.items.length : 0),
    total_value: order.totalValue || 0,
    paid_amount: order.paidAmount || 0,
    payment_status_text: encodeStatusWithMeta(baseStatusText, order),
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
  if (!isSupabaseConfigured() || !id) {
    return null;
  }

  const cleanId = id.replace(/^PED-/, '').replace(/^ORC-/, '');

  const corePayload: any = {};
  if (updates.clientName !== undefined) corePayload.client_name = updates.clientName;
  if (updates.totalValue !== undefined) corePayload.total_value = Number(updates.totalValue) || 0;
  if (updates.paidAmount !== undefined) corePayload.paid_amount = Number(updates.paidAmount) || 0;
  if (updates.status !== undefined) corePayload.status = updates.status;

  if (
    updates.paymentStatusText !== undefined ||
    updates.notes !== undefined ||
    updates.paymentReceiptUrl !== undefined ||
    updates.paymentReceiptUrl2 !== undefined ||
    updates.paymentTerms !== undefined ||
    updates.productionProgressPct !== undefined ||
    updates.internalLogisticsType !== undefined ||
    updates.internalLogisticsCost !== undefined
  ) {
    const statusText = updates.paymentStatusText || 'Pendente';
    corePayload.payment_status_text = encodeStatusWithMeta(statusText, updates);
  }

  if (Object.keys(corePayload).length === 0) return updates as any;

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      await supabase.from('orders').update(corePayload).eq('id', id);
    } else {
      await supabase
        .from('orders')
        .update(corePayload)
        .or(`order_code.eq.${id},order_code.eq.${cleanId},order_code.eq.PED-${cleanId}`);
    }
  } catch (e) {
    console.error('Erro ao atualizar pedido no Supabase:', e);
  }

  return updates as any;
}

export async function deleteOrder(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !id) return true;
  try {
    const cleanId = id.replace(/^PED-/, '').replace(/^ORC-/, '');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (isUuid) {
      await supabase.from('order_items').delete().eq('order_id', id);
      await supabase.from('orders').delete().eq('id', id);
    } else {
      const { data: matched } = await supabase
        .from('orders')
        .select('id, order_code')
        .or(`order_code.eq.${id},order_code.eq.${cleanId},order_code.eq.PED-${cleanId}`);

      if (matched && matched.length > 0) {
        const uuids = matched.map((m) => m.id);
        await supabase.from('order_items').delete().in('order_id', uuids);
        await supabase.from('orders').delete().in('id', uuids);
      }

      await supabase
        .from('orders')
        .delete()
        .or(`order_code.eq.${id},order_code.eq.${cleanId},order_code.eq.PED-${cleanId}`);
    }
    return true;
  } catch (e) {
    console.error('Erro ao deletar pedido no Supabase:', e);
    return false;
  }
}


