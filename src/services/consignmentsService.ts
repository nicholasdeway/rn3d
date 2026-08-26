import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Consignment, ConsignmentItem } from '../types';

const DEFAULT_SEED_CONSIGNMENTS: Consignment[] = [
  {
    id: 'REM-391304',
    clientId: 'cli-master',
    clientName: 'Master Informática',
    date: '25/08/2026',
    itemsCount: 1,
    totalValue: 6.00,
    status: 'Em andamento',
    lastAuditDate: '25/08/2026',
    items: [
      {
        productId: 'prod-suporte-fone',
        productName: 'Suporte de Headset / Fone RGB 3D',
        sku: 'SUP-HEADSET-01',
        quantity: 1,
        unitPrice: 6.00,
        subtotal: 6.00,
      },
    ],
    notes: 'Remessa de teste / reposição de expositor',
  },
  {
    id: 'REM-708768',
    clientId: 'cli-master',
    clientName: 'Master Informática',
    date: '10/08/2026',
    itemsCount: 39,
    totalValue: 234.00,
    status: 'Em andamento',
    lastAuditDate: '25/08/2026',
    items: [
      {
        productId: 'prod-organizador-cabos',
        productName: 'Organizador de Cabos de Mesa 3D',
        sku: 'ORG-CABO-3D',
        quantity: 39,
        unitPrice: 6.00,
        subtotal: 234.00,
      },
    ],
    notes: 'Alocação inicial de produtos em consignação',
  },
];

/**
 * Direct Supabase Persistence for Consignments using standard Postgres tables
 */
export async function fetchConsignments(): Promise<Consignment[]> {
  if (!isSupabaseConfigured()) return DEFAULT_SEED_CONSIGNMENTS;

  try {
    // 1. Try dedicated 'consignments' table first (if exists)
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
      .or('order_code.ilike.REM-%,payment_status_text.eq.Consignação')
      .order('created_at', { ascending: false });

    if (!oErr && oData && oData.length > 0) {
      return oData.map((row) => {
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
          clientName: row.client_name || 'Cliente',
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

    // 3. Auto-seed default consignments to Supabase DB if DB is empty
    for (const seed of DEFAULT_SEED_CONSIGNMENTS) {
      await createConsignment(seed);
    }
    return DEFAULT_SEED_CONSIGNMENTS;
  } catch (err) {
    console.error('Erro ao buscar consignações no Supabase:', err);
  }

  return DEFAULT_SEED_CONSIGNMENTS;
}

export async function createConsignment(consignment: Consignment): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    // 1. Direct insert into 'orders' table (100% verified to exist in Supabase DB)
    const orderPayload = {
      order_code: consignment.id,
      client_id: consignment.clientId || null,
      client_name: consignment.clientName || 'Master Informática',
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
      .upsert([orderPayload], { onConflict: 'order_code' })
      .select()
      .single();

    if (oErr) {
      console.error('Erro ao salvar consignação em orders no Supabase:', oErr.message);
    }

    if (oData?.id && consignment.items && consignment.items.length > 0) {
      const itemRows = consignment.items.map((item) => ({
        order_id: oData.id,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
      }));
      await supabase.from('order_items').insert(itemRows);
    }

    // 2. Safe secondary insert into 'consignments' table if it exists
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
