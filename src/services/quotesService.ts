import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Quote } from '../types';

/**
 * 100% Direct Supabase Postgres Fetch — Zero LocalStorage Caching
 */
export async function fetchQuotes(): Promise<Quote[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('quotes')
    .select('*, quote_items(*)')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Erro ao buscar orçamentos no Supabase:', error?.message);
    return [];
  }

  const dbQuotes: Quote[] = data.map((row) => ({
    id: row.quote_code || row.id,
    clientId: row.client_id || '',
    clientName: row.client_name,
    date: row.date || new Date().toISOString().split('T')[0],
    validityDays: row.validity_days || 15,
    productionSlaDays: row.production_sla_days || 7,
    items: (row.quote_items || []).map((item: any) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price) || 0,
      subtotal: Number(item.subtotal) || 0,
    })),
    subtotal: Number(row.subtotal) || 0,
    discount: Number(row.discount) || 0,
    total: Number(row.total) || 0,
    paymentTerms: row.payment_terms || '',
    notes: row.notes || '',
    status: row.status as Quote['status'],
  }));

  return dbQuotes;
}

function normalizeToIsoDate(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [p1, p2, p3] = parts;
      if (p1.length === 4) return `${p1}-${p2.padStart(2, '0')}-${p3.padStart(2, '0')}`;
      return `${p3}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
    }
  }
  return dateStr;
}

export async function syncMissingQuotesToSupabase(missingQuotes: Quote[]): Promise<number> {
  if (!isSupabaseConfigured() || missingQuotes.length === 0) return 0;

  try {
    const { data: dbData } = await supabase.from('quotes').select('quote_code');
    const existingCodes = new Set((dbData || []).map((row) => (row.quote_code || '').toLowerCase().trim()));

    const toInsert = missingQuotes.filter((q) => q.id && !existingCodes.has(q.id.toLowerCase().trim()));
    if (toInsert.length === 0) return 0;

    const rows = toInsert.map((q) => ({
      quote_code: q.id,
      client_id: q.clientId || null,
      client_name: q.clientName,
      date: normalizeToIsoDate(q.date),
      validity_days: q.validityDays || 15,
      production_sla_days: q.productionSlaDays || 7,
      subtotal: q.subtotal,
      discount: q.discount || 0,
      total: q.total,
      payment_terms: q.paymentTerms || '',
      notes: q.notes || '',
      status: q.status || 'Rascunho',
    }));

    const { error } = await supabase.from('quotes').insert(rows);

    if (error) {
      console.warn('Aviso na sincronização de orçamentos com Supabase:', error.message);
      throw error;
    } else {
      return rows.length;
    }
  } catch (err) {
    console.error('Erro ao sincronizar lote de orçamentos:', err);
    throw err;
  }
}

export async function createQuote(quote: Partial<Quote>): Promise<Quote | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const payload: any = {
    quote_code: quote.id,
    client_id: quote.clientId || null,
    client_name: quote.clientName,
    date: normalizeToIsoDate(quote.date),
    validity_days: quote.validityDays || 15,
    production_sla_days: quote.productionSlaDays || 7,
    subtotal: quote.subtotal || 0,
    discount: quote.discount || 0,
    total: quote.total || 0,
    payment_terms: quote.paymentTerms || '',
    notes: quote.notes || '',
    status: quote.status || 'Rascunho',
  };

  const { data, error } = await supabase
    .from('quotes')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Erro ao cadastrar orçamento no Supabase:', error.message);
    throw error;
  }

  if (quote.items && quote.items.length > 0 && data?.id) {
    const itemRows = quote.items.map((item) => ({
      quote_id: data.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.subtotal,
    }));
    await supabase.from('quote_items').insert(itemRows);
  }

  return data as any;
}

export async function updateQuote(id: string, updates: Partial<Quote>): Promise<Quote | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const payload: any = {};
  if (updates.clientName !== undefined) payload.client_name = updates.clientName;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.total !== undefined) payload.total = updates.total;
  if (updates.subtotal !== undefined) payload.subtotal = updates.subtotal;
  if (updates.discount !== undefined) payload.discount = updates.discount;
  if (updates.notes !== undefined) payload.notes = updates.notes;

  const isLocalId = !id || id.startsWith('ORC-') || id.length < 30;

  let query = supabase.from('quotes').update(payload);
  if (!isLocalId) {
    query = query.eq('id', id);
  } else {
    query = query.eq('quote_code', id);
  }

  const { data, error } = await query.select();

  if (error) {
    console.error('Erro ao atualizar orçamento no Supabase:', error.message);
    throw error;
  }

  return (data && data[0]) ? (data[0] as any) : null;
}
