import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Visit } from '../types';
import { formatDateBR, normalizeToIsoDate } from '../utils/formatters';

let useOrdersFallbackForVisits = false;

/**
 * 100% Direct Supabase Postgres Fetch & Cross-Device Sync for Visits (Web <-> Mobile)
 * Falls back to 'orders' table with 'VIS-' prefix if 'visits' table is not present in schema cache
 */
export async function fetchVisits(): Promise<Visit[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  if (useOrdersFallbackForVisits) {
    return fetchVisitsFromOrders();
  }

  try {
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      if (error && (error.message?.includes('schema cache') || error.message?.includes('Could not find the table') || error.code === 'PGRST301')) {
        useOrdersFallbackForVisits = true;
        return fetchVisitsFromOrders();
      }
      return [];
    }

    const dbVisits: Visit[] = data.map((row) => ({
      id: row.visit_code || row.id,
      clientId: row.client_id || '',
      clientName: row.client_name || '',
      scheduledDate: formatDateBR(row.scheduled_date) || row.scheduled_date || '',
      timeSlot: row.time_slot || '14:00',
      reason: row.reason || 'Conferência e reposição presencial',
      productsOnSite: Number(row.products_on_site) || 0,
      lastVisitText: row.last_visit_text || 'N/A',
      status: row.status as Visit['status'],
      completedAt: row.completed_at || undefined,
      completedSummary: row.completed_summary
        ? typeof row.completed_summary === 'string'
          ? JSON.parse(row.completed_summary)
          : row.completed_summary
        : undefined,
    }));

    return dbVisits;
  } catch (err) {
    useOrdersFallbackForVisits = true;
    return fetchVisitsFromOrders();
  }
}

async function fetchVisitsFromOrders(): Promise<Visit[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || !Array.isArray(data)) return [];

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
  } catch (_) {
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

  if (useOrdersFallbackForVisits) {
    return createVisitInOrders(visit);
  }

  try {
    const payload: any = {
      visit_code: visit.id,
      client_name: visit.clientName,
      scheduled_date: normalizeToIsoDate(visit.scheduledDate),
      time_slot: visit.timeSlot || '14:00',
      reason: visit.reason || 'Conferência e reposição presencial',
      products_on_site: visit.productsOnSite || 0,
      last_visit_text: visit.lastVisitText || 'N/A',
      status: visit.status || 'Em breve',
      completed_at: visit.completedAt || null,
      completed_summary: visit.completedSummary || null,
    };

    if (visit.clientId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(visit.clientId)) {
      payload.client_id = visit.clientId;
    }

    const { data, error } = await supabase
      .from('visits')
      .insert([payload])
      .select()
      .single();

    if (error) {
      if (error.message?.includes('schema cache') || error.message?.includes('Could not find the table') || error.code === 'PGRST301') {
        useOrdersFallbackForVisits = true;
        return createVisitInOrders(visit);
      }
      return null;
    }

    return data as any;
  } catch (err) {
    useOrdersFallbackForVisits = true;
    return createVisitInOrders(visit);
  }
}

async function createVisitInOrders(visit: Partial<Visit>): Promise<Visit | null> {
  try {
    const orderPayload: any = {
      order_code: visit.id || `VIS-${Date.now()}`,
      client_name: visit.clientName || 'Cliente Local',
      date: normalizeToIsoDate(visit.scheduledDate) || new Date().toISOString().split('T')[0],
      items_count: visit.productsOnSite || 0,
      total_value: 0,
      paid_amount: 0,
      payment_status_text: 'Visita',
      status: visit.status === 'Concluída' ? 'Concluído' : 'Novo',
      notes: visit.reason || 'Conferência e reposição presencial',
    };

    if (visit.clientId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(visit.clientId)) {
      orderPayload.client_id = visit.clientId;
    }

    await supabase.from('orders').insert([orderPayload]);
    return visit as any;
  } catch (_) {
    return null;
  }
}

export async function updateVisit(id: string, updates: Partial<Visit>): Promise<Visit | null> {
  if (!isSupabaseConfigured() || !id) {
    return null;
  }

  if (useOrdersFallbackForVisits) {
    return updates as any;
  }

  try {
    const payload: any = {};
    if (updates.clientName !== undefined) payload.client_name = updates.clientName;
    if (updates.scheduledDate !== undefined) payload.scheduled_date = normalizeToIsoDate(updates.scheduledDate);
    if (updates.timeSlot !== undefined) payload.time_slot = updates.timeSlot;
    if (updates.reason !== undefined) payload.reason = updates.reason;
    if (updates.productsOnSite !== undefined) payload.products_on_site = updates.productsOnSite;
    if (updates.lastVisitText !== undefined) payload.last_visit_text = updates.lastVisitText;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.completedAt !== undefined) payload.completed_at = updates.completedAt;
    if (updates.completedSummary !== undefined) payload.completed_summary = updates.completedSummary;

    if (Object.keys(payload).length === 0) return updates as any;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let query = supabase.from('visits').update(payload);
    if (isUuid) {
      query = query.eq('id', id);
    } else {
      query = query.eq('visit_code', id);
    }

    const { data, error } = await query.select();

    if (error) {
      if (error.message?.includes('schema cache') || error.message?.includes('Could not find the table') || error.code === 'PGRST301') {
        useOrdersFallbackForVisits = true;
      }
      return null;
    }

    return (data && data[0]) ? (data[0] as any) : (updates as any);
  } catch (err) {
    useOrdersFallbackForVisits = true;
    return updates as any;
  }
}

export async function deleteVisit(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !id) return true;

  if (useOrdersFallbackForVisits) {
    try {
      await supabase.from('orders').delete().eq('order_code', id);
    } catch (_) {}
    return true;
  }

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      await supabase.from('visits').delete().eq('id', id);
    } else {
      await supabase.from('visits').delete().eq('visit_code', id);
    }
    return true;
  } catch (err) {
    return false;
  }
}
