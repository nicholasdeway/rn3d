import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Visit } from '../types';
import { formatDateBR, normalizeToIsoDate } from '../utils/formatters';

/**
 * 100% Direct Supabase Postgres Fetch & Cross-Device Sync for Visits (Web <-> Mobile)
 */
export async function fetchVisits(): Promise<Visit[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      if (error) {
        console.warn('Aviso ao buscar visitas no Supabase:', error.message);
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
      console.warn('Aviso ao salvar visita no Supabase:', error.message);
      return null;
    }

    return data as any;
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
      console.warn('Aviso ao atualizar visita no Supabase:', error.message);
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
    if (isUuid) {
      await supabase.from('visits').delete().eq('id', id);
    } else {
      await supabase.from('visits').delete().eq('visit_code', id);
    }
    return true;
  } catch (err) {
    console.error('Erro ao deletar visita do Supabase:', err);
    return false;
  }
}
