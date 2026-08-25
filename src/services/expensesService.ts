import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ExpenseItem } from '../types';

export async function fetchExpenses(): Promise<ExpenseItem[]> {
  let localExpenses: ExpenseItem[] = [];
  try {
    const saved = localStorage.getItem('rn3d_expenses');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localExpenses = parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao ler despesas locais:', e);
  }

  if (!isSupabaseConfigured()) {
    return localExpenses;
  }

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });

  if (error || !data) {
    console.error('Erro ao buscar despesas no Supabase:', error?.message);
    return localExpenses;
  }

  const dbExpenses: ExpenseItem[] = data.map((row) => ({
    id: row.id,
    description: row.description,
    category: row.category,
    amount: Number(row.amount) || 0,
    date: row.date,
    timestamp: row.timestamp || row.created_at || new Date().toLocaleTimeString('pt-BR'),
    paymentStatus: row.payment_status || 'Pago',
    beneficiary: row.beneficiary || '',
    createdBy: row.created_by || 'Nicholas',
    sourceAccount: row.source_account || undefined,
    destinationAccount: row.destination_account || undefined,
    receiptUrl: row.receipt_url || '',
    receiptType: row.receipt_type || (row.receipt_url?.startsWith('data:application/pdf') ? 'pdf' : 'image'),
    receiptName: row.receipt_name || '',
    isAutoReplicated: row.is_auto_replicated ?? false,
    referenceCode: row.reference_code || '',
    notes: row.notes || '',
  }));

  try {
    localStorage.setItem('rn3d_expenses', JSON.stringify(dbExpenses));
  } catch (e) {}

  return dbExpenses;
}

export async function createExpense(expense: Partial<ExpenseItem>): Promise<ExpenseItem | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const payload: any = {
    description: expense.description,
    category: expense.category || 'Outros',
    amount: expense.amount || 0,
    date: expense.date || new Date().toISOString().split('T')[0],
    payment_status: expense.paymentStatus || 'Pago',
    beneficiary: expense.beneficiary || '',
    receipt_url: expense.receiptUrl || '',
    receipt_type: expense.receiptType || 'image',
    receipt_name: expense.receiptName || '',
    is_auto_replicated: expense.isAutoReplicated ?? false,
    reference_code: expense.referenceCode || '',
    notes: expense.notes || '',
  };

  const { data, error } = await supabase
    .from('expenses')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Erro ao cadastrar despesa no Supabase:', error.message);
    // Silent fallback if table does not exist in Supabase DB schema yet
    return null;
  }

  return (data as any) || null;
}

export async function updateExpense(id: string, updates: Partial<ExpenseItem>): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return true;
  }

  const payload: any = {};
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.amount !== undefined) payload.amount = updates.amount;
  if (updates.date !== undefined) payload.date = updates.date;
  if (updates.paymentStatus !== undefined) payload.payment_status = updates.paymentStatus;
  if (updates.beneficiary !== undefined) payload.beneficiary = updates.beneficiary;
  if (updates.receiptUrl !== undefined) payload.receipt_url = updates.receiptUrl;
  if (updates.receiptType !== undefined) payload.receipt_type = updates.receiptType;
  if (updates.receiptName !== undefined) payload.receipt_name = updates.receiptName;
  if (updates.notes !== undefined) payload.notes = updates.notes;

  const isLocalId = !id || id.startsWith('exp-') || id.length < 30;
  let query = supabase.from('expenses').update(payload);
  if (!isLocalId) {
    query = query.eq('id', id);
  } else if (updates.referenceCode) {
    query = query.eq('reference_code', updates.referenceCode);
  } else {
    return true;
  }

  const { error } = await query;
  if (error) {
    console.error('Erro ao atualizar despesa no Supabase:', error.message);
    return false;
  }
  return true;
}

export async function deleteExpense(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return true;
  }

  const isLocalId = !id || id.startsWith('exp-') || id.length < 30;
  if (isLocalId) return true;

  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir despesa no Supabase:', error.message);
    return false;
  }
  return true;
}

export async function syncMissingExpensesToSupabase(expenses: ExpenseItem[]): Promise<number> {
  if (!isSupabaseConfigured() || expenses.length === 0) return 0;

  try {
    const { data: dbData } = await supabase.from('expenses').select('id, reference_code');
    const existingIds = new Set((dbData || []).map((row) => row.id));
    const existingRefCodes = new Set((dbData || []).map((row) => row.reference_code).filter(Boolean));

    const toInsert = expenses.filter(
      (e) => !existingIds.has(e.id) && (!e.referenceCode || !existingRefCodes.has(e.referenceCode))
    );

    if (toInsert.length === 0) return 0;

    const rows = toInsert.map((e) => ({
      description: e.description,
      category: e.category,
      amount: e.amount,
      date: e.date,
      payment_status: e.paymentStatus,
      beneficiary: e.beneficiary || '',
      receipt_url: e.receiptUrl || '',
      receipt_type: e.receiptType || 'image',
      receipt_name: e.receiptName || '',
      is_auto_replicated: e.isAutoReplicated ?? false,
      reference_code: e.referenceCode || '',
      notes: e.notes || '',
    }));

    const { error } = await supabase.from('expenses').insert(rows);
    if (error) {
      console.warn('Erro ao sincronizar despesas no Supabase:', error.message);
      return 0;
    }
    return rows.length;
  } catch (err) {
    console.error('Erro ao sincronizar despesas:', err);
    return 0;
  }
}
