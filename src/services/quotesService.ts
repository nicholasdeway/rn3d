import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Quote } from '../types';

export async function fetchQuotes(): Promise<Quote[]> {
  let localQuotes: Quote[] = [];
  try {
    const saved = localStorage.getItem('rn3d_quotes');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localQuotes = parsed;
      }
    }
  } catch (e) {
    console.error('Error reading local quotes:', e);
  }

  if (!isSupabaseConfigured()) {
    return localQuotes;
  }

  const { data, error } = await supabase
    .from('quotes')
    .select('*, quote_items(*)')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Erro ao buscar orçamentos no Supabase:', error?.message);
    return localQuotes;
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

  try {
    localStorage.setItem('rn3d_quotes', JSON.stringify(dbQuotes));
  } catch (e) {}

  return dbQuotes;
}

function normalizeToIsoDate(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [p1, p2, p3] = parts;
      if (p3.length === 4) {
        // DD/MM/YYYY -> YYYY-MM-DD
        return `${p3}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
      } else if (p1.length === 4) {
        // YYYY/MM/DD -> YYYY-MM-DD
        return `${p1}-${p2.padStart(2, '0')}-${p3.padStart(2, '0')}`;
      }
    }
  }
  return dateStr;
}

export async function createQuote(quoteData: Partial<Quote>): Promise<Quote | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const quoteCode = quoteData.id || `ORC-${Math.floor(100000 + Math.random() * 900000)}`;
  const formattedDate = normalizeToIsoDate(quoteData.date);

  const payload: any = {
    quote_code: quoteCode,
    client_name: quoteData.clientName || 'Cliente Padrão',
    date: formattedDate,
    validity_days: quoteData.validityDays || 15,
    production_sla_days: quoteData.productionSlaDays || 7,
    subtotal: quoteData.subtotal || quoteData.total || 0,
    discount: quoteData.discount || 0,
    total: quoteData.total || 0,
    payment_terms: quoteData.paymentTerms || '',
    notes: quoteData.notes || '',
    status: quoteData.status || 'Enviado',
  };

  if (quoteData.clientId && !quoteData.clientId.startsWith('cli-')) {
    payload.client_id = quoteData.clientId;
  }

  let { data: newQuote, error: quoteError } = await supabase
    .from('quotes')
    .insert([payload])
    .select()
    .single();

  if (quoteError && quoteError.message.includes('client_id')) {
    delete payload.client_id;
    const retry = await supabase.from('quotes').insert([payload]).select().single();
    newQuote = retry.data;
    quoteError = retry.error;
  }

  if (quoteError || !newQuote) {
    console.error('Erro ao salvar orçamento no Supabase:', quoteError?.message);
    throw quoteError;
  }

  if (quoteData.items && quoteData.items.length > 0) {
    const formattedItems = quoteData.items.map((item) => ({
      quote_id: newQuote.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.subtotal,
    }));

    const { error: itemsError } = await supabase.from('quote_items').insert(formattedItems);
    if (itemsError) {
      console.error('Erro ao salvar itens do orçamento:', itemsError.message);
    }
  }

  return newQuote as any;
}

export async function updateQuote(quoteCode: string, quoteData: Partial<Quote>): Promise<Quote | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const formattedDate = normalizeToIsoDate(quoteData.date);

  const payload: any = {};
  if (quoteData.clientName !== undefined) payload.client_name = quoteData.clientName;
  if (quoteData.date !== undefined) payload.date = formattedDate;
  if (quoteData.validityDays !== undefined) payload.validity_days = quoteData.validityDays;
  if (quoteData.productionSlaDays !== undefined) payload.production_sla_days = quoteData.productionSlaDays;
  if (quoteData.subtotal !== undefined) payload.subtotal = quoteData.subtotal;
  if (quoteData.discount !== undefined) payload.discount = quoteData.discount;
  if (quoteData.total !== undefined) payload.total = quoteData.total;
  if (quoteData.paymentTerms !== undefined) payload.payment_terms = quoteData.paymentTerms;
  if (quoteData.notes !== undefined) payload.notes = quoteData.notes;
  if (quoteData.status !== undefined) payload.status = quoteData.status;

  if (quoteData.clientId && !quoteData.clientId.startsWith('cli-')) {
    payload.client_id = quoteData.clientId;
  }

  let { data: updatedQuote, error } = await supabase
    .from('quotes')
    .update(payload)
    .eq('quote_code', quoteCode)
    .select()
    .single();

  if (error && error.message.includes('client_id')) {
    delete payload.client_id;
    const retry = await supabase
      .from('quotes')
      .update(payload)
      .eq('quote_code', quoteCode)
      .select()
      .single();
    updatedQuote = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error('Erro ao atualizar orçamento no Supabase:', error.message);
  }

  if (updatedQuote && quoteData.items) {
    await supabase.from('quote_items').delete().eq('quote_id', updatedQuote.id);

    const formattedItems = quoteData.items.map((item) => ({
      quote_id: updatedQuote.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.subtotal,
    }));

    await supabase.from('quote_items').insert(formattedItems);
  }

  return updatedQuote as any;
}

export async function updateQuoteStatus(quoteCode: string, newStatus: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('quotes')
    .update({ status: newStatus })
    .eq('quote_code', quoteCode);

  if (error) {
    console.error('Erro ao atualizar status do orçamento:', error.message);
    return false;
  }
  return true;
}

export async function deleteQuote(quoteCode: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;

  let { error } = await supabase
    .from('quotes')
    .delete()
    .eq('quote_code', quoteCode);

  if (error) {
    const retry = await supabase.from('quotes').delete().eq('id', quoteCode);
    error = retry.error;
  }

  if (error) {
    console.error('Erro ao excluir orçamento no Supabase:', error.message);
    return false;
  }
  return true;
}

export async function syncMissingQuotesToSupabase(missingQuotes: Quote[]): Promise<number> {
  if (!isSupabaseConfigured() || missingQuotes.length === 0) return 0;

  let syncedCount = 0;
  for (const q of missingQuotes) {
    try {
      await createQuote(q);
      syncedCount++;
    } catch (err) {
      console.error(`Erro ao sincronizar orçamento ${q.id}:`, err);
    }
  }
  return syncedCount;
}
