import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Visit } from '../types';
import { formatDateBR, normalizeToIsoDate } from '../utils/formatters';

/**
 * 100% Direct Supabase Postgres Persistence for Visits
 * Reads and writes directly to 'orders' table with 'VIS-' prefix (matching consignments REM- and exchanges TRC-)
 */
export async function fetchVisits(): Promise<Visit[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || !Array.isArray(data)) {
      return [];
    }

    const visitRows = data.filter(
      (row) =>
        (row.order_code && row.order_code.toUpperCase().startsWith('VIS-')) ||
        row.payment_status_text === 'Visita'
    );

    return visitRows.map((row) => ({
      id: row.order_code || row.id,
      clientId: row.client_id || '',
      clientName: row.client_name || '',
      scheduledDate: formatDateBR(row.date) || row.date || '',
      timeSlot: '14:00',
      reason: row.notes || 'Conferência e reposição presencial',
      productsOnSite: Number(row.items_count) || 0,
      lastVisitText: row.date || 'N/A',
      status: (row.status === 'Concluído' ? 'Concluída' : row.status) as any,
      completedAt: row.status === 'Concluído' ? row.created_at : undefined,
    }));
  } catch (err) {
    console.error('Erro ao carregar visitas do Supabase:', err);
    return [];
  }
}

export async function syncMissingVisitsToSupabase(missingVisits: Visit[]): Promise<number> {
  if (!isSupabaseConfigured() || !missingVisits || missingVisits.length === 0) return 0;

  try {
    const existingFromDb = await fetchVisits();
    const existingIds = new Set(existingFromDb.map((v) => v.id.toLowerCase().trim()));

    const toInsert = missingVisits.filter((v) => v.id && !existingIds.has(v.id.toLowerCase().trim()));
    if (toInsert.length === 0) return 0;

    let syncedCount = 0;
    for (const v of toInsert) {
      const res = await createVisit(v);
      if (res) syncedCount++;
    }
    return syncedCount;
  } catch (err) {
    console.error('Erro ao sincronizar lote de visitas:', err);
    return 0;
  }
}

export async function createVisit(visit: Partial<Visit>): Promise<Visit | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const orderPayload: any = {
      order_code: visit.id || `VIS-${Date.now()}`,
      client_name: visit.clientName || 'Cliente Local',
      date: normalizeToIsoDate(visit.scheduledDate) || new Date().toISOString().split('T')[0],
      items_count: visit.productsOnSite || 0,
      total_value: 0,
      paid_amount: 0,
      payment_status_text: 'Visita',
      status: visit.status === 'Concluída' ? 'Concluído' : (visit.status || 'Novo'),
      notes: visit.reason || 'Conferência e reposição presencial',
    };

    if (visit.clientId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(visit.clientId)) {
      orderPayload.client_id = visit.clientId;
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([orderPayload])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar visita em orders no Supabase:', error.message);
      return null;
    }

    return (data as any) || (visit as any);
  } catch (err) {
    console.error('Erro ao criar visita no Supabase:', err);
    return null;
  }
}

export async function updateVisit(id: string, updates: Partial<Visit>): Promise<Visit | null> {
  if (!isSupabaseConfigured() || !id) {
    return null;
  }

  try {
    const payload: any = {};
    if (updates.clientName !== undefined) payload.client_name = updates.clientName;
    if (updates.scheduledDate !== undefined) payload.date = normalizeToIsoDate(updates.scheduledDate);
    if (updates.reason !== undefined) payload.notes = updates.reason;
    if (updates.productsOnSite !== undefined) payload.items_count = updates.productsOnSite;
    if (updates.status !== undefined) {
      payload.status = updates.status === 'Concluída' ? 'Concluído' : updates.status;
    }

    if (Object.keys(payload).length === 0) return updates as any;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let query = supabase.from('orders').update(payload);
    if (isUuid) {
      query = query.or(`order_code.eq.${id},id.eq.${id}`);
    } else {
      query = query.eq('order_code', id);
    }

    const { data, error } = await query.select();
    if (error) {
      console.error('Erro ao atualizar visita no Supabase:', error.message);
      return null;
    }

    return (data && data[0]) ? (data[0] as any) : (updates as any);
  } catch (err) {
    console.error('Erro ao atualizar visita no Supabase:', err);
    return null;
  }
}

export async function deleteVisit(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !id) return true;

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let query = supabase.from('orders').delete();
    if (isUuid) {
      query = query.or(`order_code.eq.${id},id.eq.${id}`);
    } else {
      query = query.eq('order_code', id);
    }

    const { error } = await query;
    if (error) {
      console.error('Erro ao deletar visita do Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Erro ao deletar visita do Supabase:', err);
    return false;
  }
}
