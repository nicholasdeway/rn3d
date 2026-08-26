import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Consignment, ConsignmentItem } from '../types';

/**
 * 100% Cloud-Native Supabase Persistence for Consignments
 * Pure Supabase DB Read/Write — Zero LocalStorage Partitioning
 */
export async function fetchConsignments(): Promise<Consignment[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data: oData, error: oErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (!oErr && oData && Array.isArray(oData)) {
      const consignmentRows = oData.filter(
        (row) =>
          (row.order_code && row.order_code.toUpperCase().startsWith('REM-')) ||
          row.payment_status_text === 'Consignação'
      );

      return consignmentRows.map((row) => {
        let items: ConsignmentItem[] = [];
        if (row.order_items && Array.isArray(row.order_items)) {
          items = row.order_items.map((i: any) => ({
            productId: i.product_id || '',
            productName: i.product_name,
            sku: i.sku || '',
            quantity: Number(i.quantity) || 1,
            unitPrice: Number(i.unit_price) || 0,
            subtotal: Number(i.subtotal) || 0,
          }));
        }

        return {
          id: row.order_code || row.id,
          clientId: row.client_id || '',
          clientName: row.client_name || 'Cliente Consignado',
          date: row.date || new Date().toISOString().split('T')[0],
          itemsCount: Number(row.items_count) || items.reduce((sum, i) => sum + i.quantity, 0),
          totalValue: Number(row.total_value) || items.reduce((sum, i) => sum + i.subtotal, 0),
          status: row.status === 'Concluído' ? 'Finalizada' : 'Em andamento',
          lastAuditDate: row.date || new Date().toISOString().split('T')[0],
          items,
          notes: row.notes || '',
        };
      });
    }
  } catch (err) {
    console.error('Erro ao buscar consignações no Supabase:', err);
  }

  return [];
}

export async function createConsignment(consignment: Consignment): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const orderPayload = {
      order_code: consignment.id,
      client_id: consignment.clientId || null,
      client_name: consignment.clientName || 'Cliente Consignado',
      date: consignment.date || new Date().toISOString().split('T')[0],
      items_count: consignment.itemsCount || 0,
      total_value: consignment.totalValue || 0,
      paid_amount: 0,
      payment_status_text: 'Consignação',
      status: consignment.status === 'Finalizada' ? 'Concluído' : 'Em produção',
      production_progress_pct: 100,
      internal_logistics_type: 'combustivel',
      internal_logistics_cost: 0,
    };

    const { data: oData, error: oErr } = await supabase
      .from('orders')
      .insert([orderPayload])
      .select();

    if (oErr) {
      console.error('Erro ao salvar consignação em orders no Supabase:', oErr.message);
      return false;
    }

    const insertedRow = oData && oData.length > 0 ? oData[0] : null;

    if (insertedRow?.id && consignment.items && consignment.items.length > 0) {
      const itemRows = consignment.items.map((item) => ({
        order_id: insertedRow.id,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
      }));
      await supabase.from('order_items').insert(itemRows);
    }

    return true;
  } catch (err) {
    console.error('Erro ao criar consignação no Supabase:', err);
    return false;
  }
}

/**
 * Completely wipe out all consignment records from local storage and Supabase Postgres
 */
export async function deleteAllConsignments(): Promise<boolean> {
  try {
    localStorage.removeItem('rn3d_consignments');
  } catch (_) {}

  if (!isSupabaseConfigured()) return true;

  try {
    // Delete from orders table where order_code starts with 'REM-' or payment_status_text = 'Consignação'
    await supabase.from('orders').delete().ilike('order_code', 'REM-%');
    await supabase.from('orders').delete().eq('payment_status_text', 'Consignação');

    // Delete from consignments table if present
    try {
      await supabase.from('consignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (_) {}

    return true;
  } catch (err) {
    console.error('Erro ao deletar todas as consignações do Supabase:', err);
    return false;
  }
}

export async function syncMissingConsignmentsToSupabase(consignments: Consignment[]): Promise<number> {
  if (!isSupabaseConfigured() || !consignments || consignments.length === 0) return 0;

  let syncedCount = 0;
  try {
    const existingFromDb = await fetchConsignments();
    const existingIds = new Set(existingFromDb.map((c) => c.id.toLowerCase().trim()));

    for (const c of consignments) {
      if (c.id && !existingIds.has(c.id.toLowerCase().trim())) {
        const success = await createConsignment(c);
        if (success) syncedCount++;
      }
    }
  } catch (err) {
    console.error('Erro ao sincronizar consignações:', err);
  }

  return syncedCount;
}
