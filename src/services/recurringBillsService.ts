import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { RecurringBill, ExpenseCategory } from '../types';
import { safeSetLocalStorage, getStorageParsed } from '../utils/storage';

const INITIAL_DEFAULT_BILLS: Partial<RecurringBill>[] = [
  {
    title: 'DAS - Imposto Simples Nacional',
    category: 'Impostos (DAS)',
    amount: 250.0,
    dueDay: 20,
    recurrence: 'Mensal',
    beneficiary: 'Receita Federal / Simples Nacional',
    notes: 'Guia DAS de imposto mensal da empresa',
    status: 'Ativo',
  },
  {
    title: 'UpSeller ERP - Mensalidade',
    category: 'Outros',
    amount: 89.9,
    dueDay: 10,
    recurrence: 'Mensal',
    beneficiary: 'UpSeller ERP',
    notes: 'Assinatura do sistema ERP e integração de marketplaces',
    status: 'Ativo',
  },
  {
    title: 'ChatGPT Plus / OpenAI API',
    category: 'Outros',
    amount: 110.0,
    dueDay: 15,
    recurrence: 'Mensal',
    beneficiary: 'OpenAI',
    notes: 'Assinatura de inteligência artificial para o sistema',
    status: 'Ativo',
  },
];

export async function fetchRecurringBills(): Promise<RecurringBill[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('recurring_bills')
        .select('*')
        .order('due_day', { ascending: true });

      if (!error && data) {
        if (data.length === 0) {
          // Seed initial default bills to Supabase if empty
          const seeded: RecurringBill[] = [];
          for (const item of INITIAL_DEFAULT_BILLS) {
            const created = await createRecurringBill(item);
            if (created) seeded.push(created);
          }
          if (seeded.length > 0) return seeded;
        }

        const bills: RecurringBill[] = data.map((row) => ({
          id: row.id,
          title: row.title,
          category: row.category as ExpenseCategory,
          amount: Number(row.amount) || 0,
          dueDay: Number(row.due_day) || 1,
          recurrence: (row.recurrence as 'Mensal' | 'Anual') || 'Mensal',
          beneficiary: row.beneficiary || '',
          notes: row.notes || '',
          status: (row.status as 'Ativo' | 'Pausado') || 'Ativo',
          lastPaidMonth: row.last_paid_month || '',
          createdAt: row.created_at,
        }));
        safeSetLocalStorage('rn3d_recurring_bills', JSON.stringify(bills));
        return bills;
      }
    } catch (e) {
      console.warn('Erro ao carregar recurring_bills do Supabase, utilizando fallback local:', e);
    }
  }

  // Fallback to LocalStorage if Supabase fails or is unconfigured
  const saved = getStorageParsed<RecurringBill[]>('rn3d_recurring_bills', []);
  if (saved && saved.length > 0) return saved;

  // Initial seed in local storage
  const defaultList: RecurringBill[] = INITIAL_DEFAULT_BILLS.map((b, idx) => ({
    id: `rec-bill-${idx + 1}`,
    title: b.title || '',
    category: (b.category as ExpenseCategory) || 'Outros',
    amount: b.amount || 0,
    dueDay: b.dueDay || 1,
    recurrence: (b.recurrence as 'Mensal' | 'Anual') || 'Mensal',
    beneficiary: b.beneficiary || '',
    notes: b.notes || '',
    status: 'Ativo',
    lastPaidMonth: '',
    createdAt: new Date().toISOString(),
  }));
  safeSetLocalStorage('rn3d_recurring_bills', JSON.stringify(defaultList));
  return defaultList;
}

export async function createRecurringBill(bill: Partial<RecurringBill>): Promise<RecurringBill | null> {
  const payload = {
    title: bill.title || 'Conta Fixa Sem Nome',
    category: bill.category || 'Outros',
    amount: bill.amount || 0,
    due_day: bill.dueDay || 1,
    recurrence: bill.recurrence || 'Mensal',
    beneficiary: bill.beneficiary || '',
    notes: bill.notes || '',
    status: bill.status || 'Ativo',
    last_paid_month: bill.lastPaidMonth || '',
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('recurring_bills')
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          title: data.title,
          category: data.category as ExpenseCategory,
          amount: Number(data.amount) || 0,
          dueDay: Number(data.due_day) || 1,
          recurrence: data.recurrence as 'Mensal' | 'Anual',
          beneficiary: data.beneficiary || '',
          notes: data.notes || '',
          status: data.status as 'Ativo' | 'Pausado',
          lastPaidMonth: data.last_paid_month || '',
          createdAt: data.created_at,
        };
      }
    } catch (e) {
      console.error('Erro ao criar conta fixa no Supabase:', e);
    }
  }

  // Local fallback
  const localBill: RecurringBill = {
    id: bill.id || `rec-bill-${Date.now()}`,
    title: payload.title,
    category: payload.category as ExpenseCategory,
    amount: payload.amount,
    dueDay: payload.due_day,
    recurrence: payload.recurrence as 'Mensal' | 'Anual',
    beneficiary: payload.beneficiary,
    notes: payload.notes,
    status: payload.status as 'Ativo' | 'Pausado',
    lastPaidMonth: payload.last_paid_month,
    createdAt: new Date().toISOString(),
  };

  const current = getStorageParsed<RecurringBill[]>('rn3d_recurring_bills', []);
  safeSetLocalStorage('rn3d_recurring_bills', JSON.stringify([localBill, ...current]));
  return localBill;
}

export async function updateRecurringBill(id: string, updates: Partial<RecurringBill>): Promise<boolean> {
  const payload: any = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.amount !== undefined) payload.amount = updates.amount;
  if (updates.dueDay !== undefined) payload.due_day = updates.dueDay;
  if (updates.recurrence !== undefined) payload.recurrence = updates.recurrence;
  if (updates.beneficiary !== undefined) payload.beneficiary = updates.beneficiary;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.lastPaidMonth !== undefined) payload.last_paid_month = updates.lastPaidMonth;

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('recurring_bills')
        .update(payload)
        .eq('id', id);
      if (!error) return true;
    } catch (e) {
      console.error('Erro ao atualizar conta fixa no Supabase:', e);
    }
  }

  // Local fallback update
  const current = getStorageParsed<RecurringBill[]>('rn3d_recurring_bills', []);
  const updated = current.map((item) => (item.id === id ? { ...item, ...updates } : item));
  safeSetLocalStorage('rn3d_recurring_bills', JSON.stringify(updated));
  return true;
}

export async function deleteRecurringBill(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('recurring_bills').delete().eq('id', id);
      if (!error) return true;
    } catch (e) {
      console.error('Erro ao excluir conta fixa no Supabase:', e);
    }
  }

  const current = getStorageParsed<RecurringBill[]>('rn3d_recurring_bills', []);
  const filtered = current.filter((item) => item.id !== id);
  safeSetLocalStorage('rn3d_recurring_bills', JSON.stringify(filtered));
  return true;
}
