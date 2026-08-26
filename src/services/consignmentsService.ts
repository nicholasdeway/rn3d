import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Consignment, ConsignmentItem } from '../types';

/**
 * 100% Real Supabase Postgres Persistence for Consignments
 * Direct Database Read/Write without requiring custom Postgres constraints
 */
export async function fetchConsignments(): Promise<Consignment[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    // 1. Check dedicated 'consignments' table first (if created in Supabase)
    try {
      const { data: cData, error: cErr } = await supabase
        .from('consignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (!cErr && cData && cData.length > 0) {
        return cData.map((row) => ({
          id: row.code || row.id,
          clientId: row.client_id || '',
          clientName: row.client_name || '',
          date: row.date || new Date().toISOString().split('T')[0],
          itemsCount: Number(row.items_count) || 0,
          totalValue: Number(row.total_value) || 0,
          status: (row.status as any) || 'Em andamento',
          lastAuditDate: row.last_audit_date || row.date || new Date().toISOString().split('T')[0],
          items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items || [],
          notes: row.notes || '',
        }));
      }
    } catch (_) {
      // Table doesn't exist yet, proceed to orders fallback
    }

    // 2. Fetch from 'orders' table where order_code starts with 'REM-' or payment_status_text is 'Consignação'
    const { data: oData, error: oErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (!oErr && oData && oData.length > 0) {
      const consignmentRows = oData.filter(
        (row) =>
          (row.order_code && row.order_code.toUpperCase().startsWith('REM-')) ||
          row.payment_status_text === 'Consignação'
      );

      return consignmentRows.map((row) => {
        let items: ConsignmentItem[] = [];
        if (row.order_items && row.order_items.length > 0) {
          items = row.order_items.map((i: any) => ({
            productId: i.product_id || '',
            productName: i.product_name,
            sku: i.sku || '',
            quantity: i.quantity,
            unitPrice: Number(i.unit_price) || 0,
            subtotal: Number(i.subtotal) || 0,
          }));
        }

        return {
          id: row.order_code || row.id,
          clientId: row.client_id || '',
          clientName: row.client_name || 'Cliente Consignado',
          date: row.date || new Date().toISOString().split('T')[0],
          itemsCount: row.items_count || items.reduce((sum, i) => sum + i.quantity, 0),
          totalValue: Number(row.total_value) || 0,
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

    // Check if order_code already exists in Supabase DB
    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('order_code', consignment.id)
      .maybeSingle();

    let oData: any = null;

    if (existing?.id) {
      const { data: updated, error: uErr } = await supabase
        .from('orders')
        .update(orderPayload)
        .eq('id', existing.id)
        .select()
        .single();

      if (uErr) console.error('Erro ao atualizar consignação no Supabase:', uErr.message);
      oData = updated;
    } else {
      const { data: inserted, error: iErr } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();

      if (iErr) console.error('Erro ao inserir consignação no Supabase:', iErr.message);
      oData = inserted;
    }

    if (oData?.id && consignment.items && consignment.items.length > 0) {
      // Clean up previous items if updating
      await supabase.from('order_items').delete().eq('order_id', oData.id);

      const itemRows = consignment.items.map((item) => ({
        order_id: oData.id,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
      }));
      await supabase.from('order_items').insert(itemRows);
    }

    // Try secondary consignments table safely without throwing on missing schema
    try {
      const cPayload = {
        code: consignment.id,
        client_id: consignment.clientId || null,
        client_name: consignment.clientName,
        date: consignment.date,
        items_count: consignment.itemsCount,
        total_value: consignment.totalValue,
        status: consignment.status,
        last_audit_date: consignment.lastAuditDate,
        items: JSON.stringify(consignment.items || []),
        notes: consignment.notes || '',
      };
      await supabase.from('consignments').insert([cPayload]);
    } catch (_) {
      // Safe fallback ignore
    }

    return true;
  } catch (err) {
    console.error('Erro ao criar consignação no Supabase:', err);
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
