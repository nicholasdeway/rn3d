import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { RecurringBill, ExpenseCategory } from '../types';
import { safeSetLocalStorage, getStorageParsed } from '../utils/storage';

const MOCK_IDS = ['rec-bill-1', 'rec-bill-2', 'rec-bill-3'];
const MOCK_TITLES = [
  'das - imposto simples nacional',
  'upseller erp - mensalidade',
  'chatgpt plus / openai api',
];

let hasRecurringBillsTable = true;

function isMockItem(id?: string, title?: string): boolean {
  if (id && MOCK_IDS.includes(id)) return true;
  if (title && MOCK_TITLES.some((m) => title.toLowerCase().includes(m))) return true;
  return false;
}

// Sync all recurring bills to SYS_RECURRING_BILLS in orders table for guaranteed cross-device sync
async function saveSysRecurringBillsToSupabase(bills: RecurringBill[]): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const payload = {
      order_code: 'SYS_RECURRING_BILLS',
      client_name: 'SISTEMA_RECURRING_BILLS',
      total_value: 0,
      paid_amount: 0,
      payment_status_text: JSON.stringify(bills),
      status: 'Novo',
    };
    await supabase.from('orders').upsert(payload, { onConflict: 'order_code' });
  } catch (e) {
    console.error('Erro ao salvar SYS_RECURRING_BILLS no Supabase:', e);
  }
}

async function fetchSysRecurringBillsFromSupabase(): Promise<RecurringBill[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data } = await supabase
      .from('orders')
      .select('payment_status_text')
      .eq('order_code', 'SYS_RECURRING_BILLS')
      .maybeSingle();

    if (data && data.payment_status_text) {
      const parsed = JSON.parse(data.payment_status_text);
      if (Array.isArray(parsed)) {
        return parsed.filter((b) => !isMockItem(b.id, b.title));
      }
    }
  } catch (e) {}
  return [];
}

export async function fetchRecurringBills(): Promise<RecurringBill[]> {
  let billsFromDb: RecurringBill[] = [];

  if (isSupabaseConfigured() && hasRecurringBillsTable) {
    // 1. Try querying recurring_bills table directly
    try {
      const { data, error } = await supabase
        .from('recurring_bills')
        .select('*')
        .order('due_day', { ascending: true });

      if (error) {
        if (
          error.code === '42P01' ||
          error.message?.includes('404') ||
          error.message?.includes('does not exist') ||
          (error as any).status === 404 ||
          (error as any).statusCode === '404'
        ) {
          hasRecurringBillsTable = false;
        }
      } else if (data) {
        // Delete mock rows from Supabase if present
        const mockRows = data.filter((row) => isMockItem(row.id, row.title));
        if (mockRows.length > 0) {
          const idsToDelete = mockRows.map((r) => r.id);
          await supabase.from('recurring_bills').delete().in('id', idsToDelete);
        }

        const cleanRows = data.filter((row) => !isMockItem(row.id, row.title));
        billsFromDb = cleanRows.map((row) => ({
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
      }
    } catch (e) {
      hasRecurringBillsTable = false;
    }
  }

  // 2. Fetch SYS_RECURRING_BILLS fallback from orders table
  const sysBills = await fetchSysRecurringBillsFromSupabase();

  // Prefer table data if available, otherwise sysBills
  let mergedBills: RecurringBill[] = [];
  if (billsFromDb.length > 0) {
    mergedBills = billsFromDb;
  } else if (sysBills.length > 0) {
    mergedBills = sysBills;
  }

  // 3. Check if local storage has any items created on this device that are missing from Supabase
  const cached = getStorageParsed<RecurringBill[]>('rn3d_recurring_bills', []).filter(
    (item) => !isMockItem(item.id, item.title)
  );

  if (cached.length > 0 && mergedBills.length === 0) {
    // Upload local items to Supabase
    mergedBills = cached;
    saveSysRecurringBillsToSupabase(mergedBills);
  } else if (mergedBills.length > 0) {
    // Keep SYS_RECURRING_BILLS updated
    saveSysRecurringBillsToSupabase(mergedBills);
  }

  safeSetLocalStorage('rn3d_recurring_bills', JSON.stringify(mergedBills));
  return mergedBills;
}


export async function createRecurringBill(bill: Partial<RecurringBill>): Promise<RecurringBill | null> {
  const newBill: RecurringBill = {
    id: bill.id || `rec-bill-${Date.now()}`,
    title: bill.title || 'Conta Fixa Sem Nome',
    category: (bill.category || 'Outros') as ExpenseCategory,
    amount: bill.amount || 0,
    dueDay: bill.dueDay || 1,
    recurrence: bill.recurrence || 'Mensal',
    beneficiary: bill.beneficiary || '',
    notes: bill.notes || '',
    status: bill.status || 'Ativo',
    lastPaidMonth: bill.lastPaidMonth || '',
    createdAt: new Date().toISOString(),
  };

  const currentBills = getStorageParsed<RecurringBill[]>('rn3d_recurring_bills', []).filter(
    (b) => !isMockItem(b.id, b.title)
  );
  const updatedList = [newBill, ...currentBills.filter((b) => b.id !== newBill.id)];

  if (isSupabaseConfigured()) {
    // 1. Insert into recurring_bills table if available
    if (hasRecurringBillsTable) {
      try {
        const payload = {
          title: newBill.title,
          category: newBill.category,
          amount: newBill.amount,
          due_day: newBill.dueDay,
          recurrence: newBill.recurrence,
          beneficiary: newBill.beneficiary,
          notes: newBill.notes,
          status: newBill.status,
          last_paid_month: newBill.lastPaidMonth,
        };
        const { data, error } = await supabase
          .from('recurring_bills')
          .insert([payload])
          .select()
          .single();

        if (!error && data) {
          newBill.id = data.id;
          newBill.createdAt = data.created_at;
        } else if (error && (error.code === '42P01' || error.message?.includes('404'))) {
          hasRecurringBillsTable = false;
        }
      } catch (e) {
        hasRecurringBillsTable = false;
      }
    }

    // 2. Persist updated list to SYS_RECURRING_BILLS in orders table (guaranteed cross-device sync)
    await saveSysRecurringBillsToSupabase(updatedList);
  }

  safeSetLocalStorage('rn3d_recurring_bills', JSON.stringify(updatedList));
  return newBill;
}

export async function updateRecurringBill(id: string, updates: Partial<RecurringBill>): Promise<boolean> {
  const currentBills = getStorageParsed<RecurringBill[]>('rn3d_recurring_bills', []).filter(
    (b) => !isMockItem(b.id, b.title)
  );
  const updatedList = currentBills.map((item) => (item.id === id ? { ...item, ...updates } : item));

  if (isSupabaseConfigured()) {
    // 1. Update recurring_bills table if applicable
    if (hasRecurringBillsTable) {
      try {
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

        await supabase.from('recurring_bills').update(payload).eq('id', id);
      } catch (e) {}
    }

    // 2. Update SYS_RECURRING_BILLS in orders table
    await saveSysRecurringBillsToSupabase(updatedList);
  }

  safeSetLocalStorage('rn3d_recurring_bills', JSON.stringify(updatedList));
  return true;
}

export async function deleteRecurringBill(id: string): Promise<boolean> {
  const currentBills = getStorageParsed<RecurringBill[]>('rn3d_recurring_bills', []).filter(
    (b) => !isMockItem(b.id, b.title)
  );
  const updatedList = currentBills.filter((item) => item.id !== id);

  if (isSupabaseConfigured()) {
    // 1. Delete from recurring_bills table
    if (hasRecurringBillsTable) {
      try {
        await supabase.from('recurring_bills').delete().eq('id', id);
      } catch (e) {}
    }

    // 2. Update SYS_RECURRING_BILLS in orders table
    await saveSysRecurringBillsToSupabase(updatedList);
  }

  safeSetLocalStorage('rn3d_recurring_bills', JSON.stringify(updatedList));
  return true;
}
