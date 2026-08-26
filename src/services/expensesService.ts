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

export async function syncMissingExpensesToSupabase(expenses: ExpenseItem[]): Promise<number> {
  // Direct Supabase mode: zero LocalStorage sync required
  return 0;
}

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

/**
  100% Direct Supabase Postgres Fetch — Zero LocalStorage Caching
 */
export async function fetchExpenses(): Promise<{ expenses: ExpenseItem[]; balances?: AccountBalances }> {
  if (!isSupabaseConfigured()) {
    return { expenses: [], balances: undefined };
  }

  let dbBalances: AccountBalances | undefined;

  // 1. Fetch balances directly from Supabase (orders table or expenses table)
  try {
    const { data: orderSys } = await supabase
      .from('orders')
      .select('payment_status_text')
      .eq('order_code', 'SYS_ACCOUNT_BALANCES')
      .maybeSingle();

    if (orderSys && orderSys.payment_status_text) {
      const parsed = JSON.parse(orderSys.payment_status_text);
      if (parsed && typeof parsed === 'object' && typeof parsed.nubank === 'number') {
        dbBalances = parsed;
      }
    }
  } catch (e) {}

  // 2. Fetch expenses directly from Supabase expenses table
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });

  if (error || !data) {
    return { expenses: [], balances: dbBalances };
  }

  // Extract balances from expenses table if not found in orders
  if (!dbBalances) {
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
          dbBalances = parsedBalances;
        }
      } catch (e) {}
    }
  }

  // Purge legacy & duplicate expenses permanently from Supabase
  const duplicateIdsToDelete: string[] = [];
  const seenIds = new Set<string>();
  const seenRefCodes = new Set<string>();
  const seenSignatures = new Set<string>();

  const filteredData = data.filter((row) => {
    if (row.reference_code === 'SYS_ACCOUNT_BALANCES') return false;

    if (seenIds.has(row.id)) {
      duplicateIdsToDelete.push(row.id);
      return false;
    }
    seenIds.add(row.id);

    if (row.reference_code && row.reference_code.length > 0) {
      if (seenRefCodes.has(row.reference_code)) {
        duplicateIdsToDelete.push(row.id);
        return false;
      }
      seenRefCodes.add(row.reference_code);
    }

    const signature = `${row.description}_${row.amount}_${row.date}_${row.receipt_url || ''}`;
    if (seenSignatures.has(signature)) {
      duplicateIdsToDelete.push(row.id);
      return false;
    }
    seenSignatures.add(signature);

    return true;
  });

  if (duplicateIdsToDelete.length > 0) {
    supabase.from('expenses').delete().in('id', duplicateIdsToDelete).then(({ error }) => {
      if (error) console.error('Erro ao expurgar despesas duplicadas do Supabase:', error.message);
    });
  }

  const dbExpenses: ExpenseItem[] = filteredData.map((row) => {
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

  return { expenses: dbExpenses, balances: dbBalances };
}

/**
 * Persiste saldos de contas diretamente no Supabase
 */
export async function saveAccountBalancesToSupabase(balances: AccountBalances): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;

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

  try {
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

/**
 * Cria um novo lançamento de despesa/saída/aporte diretamente no Supabase
 */
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
    description: expense.description || 'Despesa sem descrição',
    category: safeCategory,
    amount: expense.amount || 0,
    date: expense.date || new Date().toISOString().split('T')[0],
    payment_status: expense.paymentStatus || 'Pago',
    beneficiary: expense.beneficiary || '',
    receipt_url: receiptUrl,
    receipt_type: expense.receiptType || (receiptUrl.startsWith('data:application/pdf') ? 'pdf' : 'image'),
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
    console.error('Erro ao criar despesa no Supabase:', error.message);
    return null;
  }

  const decoded = decodeNotesAndMetadata(data);
  return {
    id: data.id,
    description: data.description,
    category: decoded.category,
    amount: Number(data.amount) || 0,
    date: data.date,
    timestamp: decoded.timestamp,
    paymentStatus: data.payment_status || 'Pago',
    beneficiary: data.beneficiary || '',
    createdBy: decoded.createdBy,
    sourceAccount: decoded.sourceAccount,
    destinationAccount: decoded.destinationAccount,
    receiptUrl: data.receipt_url || '',
    receiptType: data.receipt_type || 'image',
    receiptName: data.receipt_name || '',
    isAutoReplicated: data.is_auto_replicated ?? false,
    referenceCode: data.reference_code || '',
    notes: decoded.notes,
  };
}

/**
 * Atualiza um lançamento de despesa/saída/aporte diretamente no Supabase Postgres
 */
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

  // 1. Tenta atualizar pelo ID de UUID real do Supabase
  if (id && !id.startsWith('exp-') && !id.startsWith('apt-') && !id.startsWith('trf-') && id.length > 20) {
    const { error } = await supabase.from('expenses').update(payload).eq('id', id);
    if (!error) return true;
  }

  // 2. Fallback: Tenta atualizar pelo código de referência
  if (updates.referenceCode) {
    const { error } = await supabase.from('expenses').update(payload).eq('reference_code', updates.referenceCode);
    if (!error) return true;
  }

  // 3. Fallback: Tenta atualizar por descrição e data se for um lançamento manual
  if (updates.description && updates.date) {
    const { error } = await supabase
      .from('expenses')
      .update(payload)
      .eq('description', updates.description)
      .eq('date', updates.date);
    if (!error) return true;
  }

  return true;
}

/**
 * Exclui uma despesa diretamente do Supabase Postgres
 */
export async function deleteExpense(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;

  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir despesa no Supabase:', error.message);
    return false;
  }
  return true;
}
