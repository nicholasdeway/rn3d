import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ExchangeNote } from '../types';
import { normalizeToIsoDate } from '../utils/formatters';

/**
 * 100% Cloud-Native Supabase Persistence for Exchanges & Transfers
 * Uses standard 'orders' & 'order_items' tables to ensure 100% compatibility across all devices.
 */
export async function fetchExchanges(): Promise<ExchangeNote[]> {
  if (!isSupabaseConfigured()) return [];

  const exchangesMap = new Map<string, ExchangeNote>();

  // Fetch exchange records stored in 'orders' table
  try {
    const { data: oData, error: oErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (!oErr && oData && Array.isArray(oData)) {
      const exchangeRows = oData.filter(
        (row) =>
          (row.order_code && row.order_code.toUpperCase().startsWith('TRC-')) ||
          (row.payment_status_text && row.payment_status_text.startsWith('Troca'))
      );

      exchangeRows.forEach((row) => {
        const idKey = (row.order_code || row.id).toLowerCase().trim();
        if (exchangesMap.has(idKey)) return;

        let meta: any = {};
        let statusText = row.payment_status_text || '';

        if (statusText.includes('[META:')) {
          const startIdx = statusText.indexOf('[META:');
          const endIdx = statusText.indexOf(']', startIdx);
          if (startIdx !== -1 && endIdx > startIdx + 6) {
            try {
              const jsonStr = statusText.substring(startIdx + 6, endIdx);
              meta = JSON.parse(jsonStr);
            } catch (_) {}
          }
        }

        let itemsRemoved: { productId: string; productName: string; quantity: number; reason?: string }[] =
          meta.itemsRemoved || [];

        if (itemsRemoved.length === 0 && row.order_items && Array.isArray(row.order_items)) {
          itemsRemoved = row.order_items.map((i: any) => ({
            productId: i.product_id || '',
            productName: i.product_name,
            quantity: Number(i.quantity) || 1,
            reason: meta.notes || 'Troca / Recolhimento',
          }));
        }

        let destinationClientName = meta.destinationClientName || '';
        let exchangeType: 'troca_local' | 'migracao_lojas' | 'recolhimento_oficina' = meta.type || 'recolhimento_oficina';

        const ex: ExchangeNote = {
          id: row.order_code || row.id,
          visitId: meta.visitId || row.reference_code || undefined,
          clientId: meta.clientId || row.client_id || '',
          clientName: row.client_name || 'Cliente Local',
          destinationClientId: meta.destinationClientId || undefined,
          destinationClientName: destinationClientName || undefined,
          type: exchangeType,
          date: row.date || new Date().toISOString().split('T')[0],
          createdAt: row.created_at || undefined,
          responsible: meta.responsible || 'Nicholas / Rafael',
          itemsRemoved,
          itemsAdded: meta.itemsAdded || [],
          notes: meta.notes || '',
        };

        exchangesMap.set(idKey, ex);
      });
    }
  } catch (err) {
    console.error('Erro ao buscar trocas em orders no Supabase:', err);
  }

  return Array.from(exchangesMap.values());
}

export async function createExchange(exchange: ExchangeNote): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const totalItems = exchange.itemsRemoved.reduce((acc, i) => acc + i.quantity, 0);

    const meta = {
      visitId: exchange.visitId,
      clientId: exchange.clientId,
      destinationClientId: exchange.destinationClientId,
      destinationClientName: exchange.destinationClientName,
      type: exchange.type,
      responsible: exchange.responsible,
      notes: exchange.notes,
      itemsRemoved: exchange.itemsRemoved,
      itemsAdded: exchange.itemsAdded || [],
    };

    const statusPayload = `Troca / Recolhimento [META:${JSON.stringify(meta)}]`;
    const isoDate = normalizeToIsoDate(exchange.date);

    const orderPayload: any = {
      order_code: exchange.id,
      client_name: exchange.clientName || 'Cliente Local',
      date: isoDate,
      items_count: totalItems,
      total_value: 0,
      paid_amount: 0,
      payment_status_text: statusPayload,
      status: 'Concluído',
    };

    if (exchange.clientId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(exchange.clientId)) {
      orderPayload.client_id = exchange.clientId;
    }

    // Insert into orders table using ONLY standard valid columns
    const { data: oData, error: oErr } = await supabase
      .from('orders')
      .insert([orderPayload])
      .select();

    if (oErr) {
      console.error('Erro ao salvar troca em orders no Supabase:', oErr.message);
      return false;
    } else {
      const insertedOrder = oData && oData.length > 0 ? oData[0] : null;
      if (insertedOrder?.id && exchange.itemsRemoved && exchange.itemsRemoved.length > 0) {
        const itemRows = exchange.itemsRemoved.map((item) => ({
          order_id: insertedOrder.id,
          product_id: item.productId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.productId) ? item.productId : null,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: 0,
          subtotal: 0,
        }));
        await supabase.from('order_items').insert(itemRows);
      }
    }

    return true;
  } catch (err) {
    console.error('Erro ao criar troca no Supabase:', err);
    return false;
  }
}

export async function deleteExchange(exchangeId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !exchangeId) return false;

  try {
    const cleanId = exchangeId.trim();

    // Find matching rows in 'orders' table
    const { data: matchingOrders } = await supabase
      .from('orders')
      .select('id, order_code')
      .or(`order_code.ilike.${cleanId},id.ilike.${cleanId}`);

    if (matchingOrders && matchingOrders.length > 0) {
      for (const ord of matchingOrders) {
        // Delete order items
        await supabase.from('order_items').delete().eq('order_id', ord.id);
        // Delete order row
        await supabase.from('orders').delete().eq('id', ord.id);
      }
    } else {
      await supabase.from('orders').delete().eq('order_code', cleanId);
    }

    return true;
  } catch (err) {
    console.error('Erro ao deletar troca no Supabase:', err);
    return false;
  }
}

export async function syncMissingExchangesToSupabase(exchanges: ExchangeNote[]): Promise<number> {
  if (!isSupabaseConfigured() || !exchanges || exchanges.length === 0) return 0;

  let syncedCount = 0;
  try {
    const existingFromDb = await fetchExchanges();
    const existingIds = new Set(existingFromDb.map((e) => e.id.toLowerCase().trim()));

    for (const ex of exchanges) {
      if (ex.id && !existingIds.has(ex.id.toLowerCase().trim())) {
        const success = await createExchange(ex);
        if (success) syncedCount++;
      }
    }
  } catch (err) {
    console.error('Erro ao sincronizar trocas:', err);
  }

  return syncedCount;
}
