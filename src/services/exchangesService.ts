import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ExchangeNote } from '../types';

/**
 * 100% Cloud-Native Supabase Persistence for Exchanges & Transfers
 * Reads and writes directly to Supabase Postgres (orders, order_items & exchanges tables)
 */
export async function fetchExchanges(): Promise<ExchangeNote[]> {
  if (!isSupabaseConfigured()) return [];

  const exchangesMap = new Map<string, ExchangeNote>();

  // 1. Try fetching from dedicated 'exchanges' table if exists
  try {
    const { data: exData, error: exErr } = await supabase
      .from('exchanges')
      .select('*')
      .order('created_at', { ascending: false });

    if (!exErr && exData && Array.isArray(exData)) {
      exData.forEach((row) => {
        let itemsRemoved = [];
        let itemsAdded = [];
        try { itemsRemoved = typeof row.items_removed === 'string' ? JSON.parse(row.items_removed) : (row.items_removed || []); } catch (_) {}
        try { itemsAdded = typeof row.items_added === 'string' ? JSON.parse(row.items_added) : (row.items_added || []); } catch (_) {}

        const ex: ExchangeNote = {
          id: row.exchange_code || row.id,
          visitId: row.visit_id || undefined,
          clientId: row.client_id || '',
          clientName: row.client_name || 'Cliente Local',
          destinationClientId: row.destination_client_id || undefined,
          destinationClientName: row.destination_client_name || undefined,
          type: row.type || 'recolhimento_oficina',
          date: row.date || new Date().toISOString().split('T')[0],
          createdAt: row.created_at || undefined,
          responsible: row.responsible || 'Nicholas / Rafael',
          itemsRemoved,
          itemsAdded,
          notes: row.notes || '',
        };
        exchangesMap.set(ex.id.toLowerCase().trim(), ex);
      });
    }
  } catch (_) {}

  // 2. Fetch from 'orders' table (TRC- prefix or 'Troca / Recolhimento' status)
  try {
    const { data: oData, error: oErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (!oErr && oData && Array.isArray(oData)) {
      const exchangeRows = oData.filter(
        (row) =>
          (row.order_code && row.order_code.toUpperCase().startsWith('TRC-')) ||
          row.payment_status_text === 'Troca / Recolhimento' ||
          (row.notes && row.notes.includes('[META:') && row.notes.includes('"type":'))
      );

      exchangeRows.forEach((row) => {
        const idKey = (row.order_code || row.id).toLowerCase().trim();
        if (exchangesMap.has(idKey)) return;

        let meta: any = {};
        let cleanNotes = row.notes || '';

        if (cleanNotes.includes('[META:')) {
          const startIdx = cleanNotes.indexOf('[META:');
          const endIdx = cleanNotes.indexOf(']', startIdx);
          if (startIdx !== -1 && endIdx > startIdx + 6) {
            try {
              const jsonStr = cleanNotes.substring(startIdx + 6, endIdx);
              meta = JSON.parse(jsonStr);
              cleanNotes = (cleanNotes.substring(0, startIdx) + cleanNotes.substring(endIdx + 1)).trim();
            } catch (_) {}
          }
        }

        let itemsRemoved: { productId: string; productName: string; quantity: number; reason?: string }[] = [];
        if (row.order_items && Array.isArray(row.order_items)) {
          itemsRemoved = row.order_items.map((i: any) => ({
            productId: i.product_id || '',
            productName: i.product_name,
            quantity: Number(i.quantity) || 1,
            reason: cleanNotes || 'Troca / Recolhimento',
          }));
        }

        let destinationClientName = meta.destinationClientName || '';
        if (!destinationClientName && cleanNotes.includes('[Destino:')) {
          destinationClientName = cleanNotes.split('[Destino:')[1]?.split(']')[0]?.trim() || '';
        }

        let exchangeType: 'troca_local' | 'migracao_lojas' | 'recolhimento_oficina' = meta.type || 'recolhimento_oficina';
        if (!meta.type && destinationClientName) {
          exchangeType = destinationClientName.toLowerCase().includes('oficina') ? 'recolhimento_oficina' : 'migracao_lojas';
        }

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
          notes: cleanNotes || '',
        };

        exchangesMap.set(idKey, ex);
      });
    }
  } catch (err) {
    console.error('Erro ao buscar trocas no Supabase:', err);
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
      itemsAdded: exchange.itemsAdded,
    };

    const notesPayload = `${exchange.notes || ''} [META:${JSON.stringify(meta)}]`;

    const orderPayload: any = {
      order_code: exchange.id,
      client_name: exchange.clientName || 'Cliente Local',
      date: exchange.date || new Date().toISOString().split('T')[0],
      items_count: totalItems,
      total_value: 0,
      paid_amount: 0,
      payment_status_text: 'Troca / Recolhimento',
      status: 'Concluído',
      notes: notesPayload,
    };

    if (exchange.clientId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(exchange.clientId)) {
      orderPayload.client_id = exchange.clientId;
    }

    // 1. Try inserting into dedicated 'exchanges' table if exists
    try {
      await supabase
        .from('exchanges')
        .insert([{
          exchange_code: exchange.id,
          client_id: orderPayload.client_id,
          client_name: exchange.clientName,
          destination_client_id: exchange.destinationClientId,
          destination_client_name: exchange.destinationClientName,
          type: exchange.type,
          date: exchange.date,
          responsible: exchange.responsible,
          notes: exchange.notes,
          items_removed: JSON.stringify(exchange.itemsRemoved),
          items_added: JSON.stringify(exchange.itemsAdded || []),
        }]);
    } catch (_) {}

    // 2. Always insert into orders & order_items for full cross-device sync
    const { data: oData, error: oErr } = await supabase
      .from('orders')
      .insert([orderPayload])
      .select();

    if (oErr) {
      console.error('Erro ao salvar troca em orders no Supabase:', oErr.message);
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
