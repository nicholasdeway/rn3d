import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ExchangeNote } from '../types';

/**
 * 100% Cloud-Native Supabase Persistence for Exchanges & Transfers
 * Reads and writes directly to 'orders' and 'order_items' table with 'TRC-' prefix
 */
export async function fetchExchanges(): Promise<ExchangeNote[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data: oData, error: oErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (!oErr && oData && Array.isArray(oData)) {
      const exchangeRows = oData.filter(
        (row) =>
          (row.order_code && row.order_code.toUpperCase().startsWith('TRC-')) ||
          row.payment_status_text === 'Troca / Recolhimento'
      );

      return exchangeRows.map((row) => {
        let itemsRemoved: { productId: string; productName: string; quantity: number; reason?: string }[] = [];
        if (row.order_items && Array.isArray(row.order_items)) {
          itemsRemoved = row.order_items.map((i: any) => ({
            productId: i.product_id || '',
            productName: i.product_name,
            quantity: Number(i.quantity) || 1,
            reason: row.notes || 'Troca / Recolhimento',
          }));
        }

        let destinationClientName = '';
        let exchangeType: 'troca_local' | 'migracao_lojas' | 'recolhimento_oficina' = 'recolhimento_oficina';
        if (row.notes && row.notes.includes('Destino:')) {
          destinationClientName = row.notes.split('Destino:')[1]?.trim() || '';
          exchangeType = destinationClientName.toLowerCase().includes('oficina') ? 'recolhimento_oficina' : 'migracao_lojas';
        }

        return {
          id: row.order_code || row.id,
          visitId: row.reference_code || undefined,
          clientId: row.client_id || '',
          clientName: row.client_name || 'Cliente Local',
          destinationClientName: destinationClientName || undefined,
          type: exchangeType,
          date: row.date || new Date().toISOString().split('T')[0],
          createdAt: row.created_at || undefined,
          responsible: 'Nicholas / Rafael',
          itemsRemoved,
          notes: row.notes || '',
        };
      });
    }
  } catch (err) {
    console.error('Erro ao buscar trocas no Supabase:', err);
  }

  return [];
}

export async function createExchange(exchange: ExchangeNote): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const totalItems = exchange.itemsRemoved.reduce((acc, i) => acc + i.quantity, 0);
    const notesText = exchange.destinationClientName
      ? `${exchange.notes || ''} [Destino: ${exchange.destinationClientName}]`.trim()
      : exchange.notes || 'Troca / Recolhimento';

    const orderPayload: any = {
      order_code: exchange.id,
      client_name: exchange.clientName || 'Cliente Local',
      date: exchange.date || new Date().toISOString().split('T')[0],
      items_count: totalItems,
      total_value: 0,
      paid_amount: 0,
      payment_status_text: 'Troca / Recolhimento',
      status: 'Concluído',
      notes: notesText,
    };

    if (exchange.clientId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(exchange.clientId)) {
      orderPayload.client_id = exchange.clientId;
    }

    const { data: oData, error: oErr } = await supabase
      .from('orders')
      .insert([orderPayload])
      .select();

    if (oErr) {
      console.error('Erro ao salvar troca em orders no Supabase:', oErr.message);
      return false;
    }

    const insertedRow = oData && oData.length > 0 ? oData[0] : null;

    if (insertedRow?.id && exchange.itemsRemoved && exchange.itemsRemoved.length > 0) {
      const itemRows = exchange.itemsRemoved.map((item) => ({
        order_id: insertedRow.id,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: 0,
        subtotal: 0,
      }));
      await supabase.from('order_items').insert(itemRows);
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
