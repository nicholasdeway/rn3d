import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ExpenseItem, ExpenseCategory, AccountBalances } from '../types';
import { uploadToSupabaseStorage } from './storageService';
import { formatTimeOnly } from '../utils/formatters';

const STANDARD_DB_CATEGORIES = [
  'Combustível & Transporte',
  'Compra de Filamento',
  'Bicos & Peças',
  'Manutenção & Reparos',
  'Caixas & Embalagens',
  'Álcool & Insumos',
  'Impostos (DAS)',
  'Outros',
];

function encodeNotesAndMetadata(item: Partial<ExpenseItem>): string {
  const userNotes = item.notes || '';
  const meta = {
    userNotes,
    realCategory: item.category,
    createdBy: item.createdBy,
    timestamp: item.timestamp,
    sourceAccount: item.sourceAccount,
    destinationAccount: item.destinationAccount,
  };
  return `[META:${JSON.stringify(meta)}]${userNotes}`;
}

function decodeNotesAndMetadata(row: any): {
  notes: string;
  category: ExpenseCategory;
  createdBy: string;
  timestamp: string;
  sourceAccount?: any;
  destinationAccount?: any;
} {
  let notes = row.notes || '';
  let category = row.category as ExpenseCategory;
  let createdBy = row.created_by || 'Nicholas';
  let timestamp = formatTimeOnly(row.timestamp || row.created_at || new Date().toLocaleTimeString('pt-BR'));
  let sourceAccount = row.source_account;
  let destinationAccount = row.destination_account;

  if (notes.startsWith('[META:')) {
    const endIdx = notes.indexOf(']');
    if (endIdx > 6) {
      try {
        const jsonStr = notes.substring(6, endIdx);
        const meta = JSON.parse(jsonStr);
        if (meta.realCategory) category = meta.realCategory;
        if (meta.createdBy) createdBy = meta.createdBy;
        if (meta.timestamp) timestamp = formatTimeOnly(meta.timestamp);
        if (meta.sourceAccount) sourceAccount = meta.sourceAccount;
        if (meta.destinationAccount) destinationAccount = meta.destinationAccount;
        notes = meta.userNotes !== undefined ? meta.userNotes : notes.substring(endIdx + 1);
      } catch (e) {}
    }
  }

  return { notes, category, createdBy, timestamp, sourceAccount, destinationAccount };
}

export async function fetchExpenses(): Promise<{ expenses: ExpenseItem[]; balances?: AccountBalances }> {
  let localExpenses: ExpenseItem[] = [];
  let localBalances: AccountBalances | undefined;

  try {
    const savedExp = localStorage.getItem('rn3d_expenses');
    if (savedExp) {
      const parsed = JSON.parse(savedExp);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localExpenses = parsed;
      }
    }
    const savedBal = localStorage.getItem('rn3d_account_balances');
    if (savedBal) {
      localBalances = JSON.parse(savedBal);
    }
  } catch (e) {
    console.error('Erro ao ler dados locais:', e);
  }

  if (!isSupabaseConfigured()) {
    return { expenses: localExpenses, balances: localBalances };
  }

  // Attempt to read balances from orders table as guaranteed fallback
  try {
    const { data: orderSys } = await supabase
      .from('orders')
      .select('payment_status_text')
      .eq('order_code', 'SYS_ACCOUNT_BALANCES')
      .maybeSingle();

    if (orderSys && orderSys.payment_status_text) {
      const parsed = JSON.parse(orderSys.payment_status_text);
      if (parsed && typeof parsed === 'object' && typeof parsed.nubank === 'number') {
        localBalances = parsed;
        localStorage.setItem('rn3d_account_balances', JSON.stringify(parsed));
        localStorage.setItem('rn3d_account_balance', (parsed.nubank || 0).toString());
      }
    }
  } catch (e) {}

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });

  if (error || !data) {
    // If expenses table not created in Supabase yet, return local + order fallback balances quietly
    return { expenses: localExpenses, balances: localBalances };
  }

  // Extract system account balances row if present in expenses
  const sysBalanceRow = data.find((row) => row.reference_code === 'SYS_ACCOUNT_BALANCES');
  if (sysBalanceRow && sysBalanceRow.notes) {
    try {
      let rawJson = sysBalanceRow.notes;
      if (rawJson.startsWith('[META:')) {
        const endIdx = rawJson.indexOf(']');
        if (endIdx > 6) {
          const meta = JSON.parse(rawJson.substring(6, endIdx));
          rawJson = meta.userNotes || rawJson.substring(endIdx + 1);
        }
      }
      const parsedBalances = JSON.parse(rawJson);
      if (parsedBalances && typeof parsedBalances === 'object' && typeof parsedBalances.nubank === 'number') {
        localBalances = parsedBalances;
        localStorage.setItem('rn3d_account_balances', JSON.stringify(parsedBalances));
        localStorage.setItem('rn3d_account_balance', (parsedBalances.nubank || 0).toString());
      }
    } catch (e) {}
  }

  // Purge legacy duplicated R$ 25,00 visit expenses permanently from Supabase
  const badRowIds = data
    .filter(
      (row) =>
        (row.reference_code && row.reference_code.includes('VIS-VIS-')) ||
        (Number(row.amount) === 25 && row.description && row.description.includes('Deslocamento / Combustível Visita'))
    )
    .map((row) => row.id);

  if (badRowIds.length > 0) {
    supabase.from('expenses').delete().in('id', badRowIds).then(({ error }) => {
      if (error) console.error('Erro ao expurgar despesas legadas do Supabase:', error.message);
      else console.log(`[expensesService] Expurgadas ${badRowIds.length} despesas duplicadas do Supabase com sucesso.`);
    });
  }

  const dbExpenses: ExpenseItem[] = data
    .filter((row) => {
      if (row.reference_code === 'SYS_ACCOUNT_BALANCES') return false;
      if (row.reference_code && row.reference_code.includes('VIS-VIS-')) return false;
      if (Number(row.amount) === 25 && row.description && row.description.includes('Deslocamento / Combustível Visita')) return false;
      return true;
    })
    .map((row) => {
      const decoded = decodeNotesAndMetadata(row);
      return {
        id: row.id,
        description: row.description,
        category: decoded.category,
        amount: Number(row.amount) || 0,
        date: row.date,
        timestamp: decoded.timestamp,
        paymentStatus: row.payment_status || 'Pago',
        beneficiary: row.beneficiary || '',
        createdBy: decoded.createdBy,
        sourceAccount: decoded.sourceAccount,
        destinationAccount: decoded.destinationAccount,
        receiptUrl: row.receipt_url || '',
        receiptType: row.receipt_type || (row.receipt_url?.startsWith('data:application/pdf') ? 'pdf' : 'image'),
        receiptName: row.receipt_name || '',
        isAutoReplicated: row.is_auto_replicated ?? false,
        referenceCode: row.reference_code || '',
        notes: decoded.notes,
      };
    });

  try {
    localStorage.setItem('rn3d_expenses', JSON.stringify(dbExpenses));
  } catch (e) {}

  return { expenses: dbExpenses, balances: localBalances };
}

export async function saveAccountBalancesToSupabase(balances: AccountBalances): Promise<boolean> {
  try {
    localStorage.setItem('rn3d_account_balances', JSON.stringify(balances));
    localStorage.setItem('rn3d_account_balance', balances.nubank.toString());

    if (!isSupabaseConfigured()) return true;

    // Guaranteed fallback: Save to orders table (order_code = 'SYS_ACCOUNT_BALANCES')
    try {
      const orderPayload = {
        order_code: 'SYS_ACCOUNT_BALANCES',
        client_name: 'SISTEMA_BALANCES',
        total_value: 0,
        paid_amount: 0,
        payment_status_text: JSON.stringify(balances),
        status: 'Novo',
      };
      await supabase.from('orders').upsert(orderPayload, { onConflict: 'order_code' });
    } catch (e) {}

    // Primary: Save to expenses table if created
    const payload = {
      description: 'Saldos de Contas e Marketplaces',
      category: 'Outros',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      payment_status: 'Pago',
      reference_code: 'SYS_ACCOUNT_BALANCES',
      notes: JSON.stringify(balances),
    };

    const { data: existing } = await supabase
      .from('expenses')
      .select('id')
      .eq('reference_code', 'SYS_ACCOUNT_BALANCES')
      .maybeSingle();

    if (existing && existing.id) {
      await supabase.from('expenses').update({ notes: JSON.stringify(balances) }).eq('id', existing.id);
    } else {
      await supabase.from('expenses').insert([payload]);
    }
    return true;
  } catch (err) {
    return false;
  }
}

function normalizeToIsoDate(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [p1, p2, p3] = parts;
      if (p3.length === 4) {
        return `${p3}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
      } else if (p1.length === 4) {
        return `${p1}-${p2.padStart(2, '0')}-${p3.padStart(2, '0')}`;
      }
    }
  }
  return dateStr;
}

export async function createExpense(expense: Partial<ExpenseItem>): Promise<ExpenseItem | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const safeCategory = STANDARD_DB_CATEGORIES.includes(expense.category || '')
    ? expense.category
    : 'Outros';

  let receiptUrl = expense.receiptUrl || '';
  if (receiptUrl.startsWith('data:')) {
    receiptUrl = await uploadToSupabaseStorage(receiptUrl, 'receipts', expense.description || 'receipt');
  }

  const payload: any = {
    description: expense.description,
    category: safeCategory,
    amount: expense.amount || 0,
    date: normalizeToIsoDate(expense.date),
    payment_status: expense.paymentStatus || 'Pago',
    beneficiary: expense.beneficiary || '',
    receipt_url: receiptUrl,
    receipt_type: expense.receiptType || 'image',
    receipt_name: expense.receiptName || '',
    is_auto_replicated: expense.isAutoReplicated ?? false,
    reference_code: expense.referenceCode || '',
    notes: encodeNotesAndMetadata(expense),
  };

  const { data, error } = await supabase
    .from('expenses')
    .insert([payload])
    .select()
    .single();

  if (error) {
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
  if (updates.category !== undefined) {
    payload.category = STANDARD_DB_CATEGORIES.includes(updates.category) ? updates.category : 'Outros';
  }
  if (updates.amount !== undefined) payload.amount = updates.amount;
  if (updates.date !== undefined) payload.date = updates.date;
  if (updates.paymentStatus !== undefined) payload.payment_status = updates.paymentStatus;
  if (updates.beneficiary !== undefined) payload.beneficiary = updates.beneficiary;
  if (updates.receiptUrl !== undefined) {
    let receiptUrl = updates.receiptUrl;
    if (receiptUrl.startsWith('data:')) {
      receiptUrl = await uploadToSupabaseStorage(receiptUrl, 'receipts', updates.description || 'receipt');
    }
    payload.receipt_url = receiptUrl;
  }
  if (updates.receiptType !== undefined) payload.receipt_type = updates.receiptType;
  if (updates.receiptName !== undefined) payload.receipt_name = updates.receiptName;
  payload.notes = encodeNotesAndMetadata(updates);

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
    return false;
  }
  return true;
}

export async function syncMissingExpensesToSupabase(expenses: ExpenseItem[]): Promise<number> {
  if (!isSupabaseConfigured() || expenses.length === 0) return 0;

  try {
    const { data: dbData } = await supabase.from('expenses').select('id, reference_code');
    if (!dbData) return 0;

    const existingIds = new Set((dbData || []).map((row) => row.id));
    const existingRefCodes = new Set((dbData || []).map((row) => row.reference_code).filter(Boolean));

    const toInsert = expenses.filter(
      (e) => !existingIds.has(e.id) && (!e.referenceCode || !existingRefCodes.has(e.referenceCode)) && e.referenceCode !== 'SYS_ACCOUNT_BALANCES'
    );

    if (toInsert.length === 0) return 0;

    const rows = await Promise.all(
      toInsert.map(async (e) => {
        let receiptUrl = e.receiptUrl || '';
        if (receiptUrl.startsWith('data:')) {
          receiptUrl = await uploadToSupabaseStorage(receiptUrl, 'receipts', e.description || 'receipt');
        }
        return {
          description: e.description,
          category: STANDARD_DB_CATEGORIES.includes(e.category) ? e.category : 'Outros',
          amount: e.amount,
          date: e.date,
          payment_status: e.paymentStatus,
          beneficiary: e.beneficiary || '',
          receipt_url: receiptUrl,
          receipt_type: e.receiptType || 'image',
          receipt_name: e.receiptName || '',
          is_auto_replicated: e.isAutoReplicated ?? false,
          reference_code: e.referenceCode || '',
          notes: encodeNotesAndMetadata(e),
        };
      })
    );

    const { error } = await supabase.from('expenses').insert(rows);
    if (error) {
      return 0;
    }
    return rows.length;
  } catch (err) {
    return 0;
  }
}
