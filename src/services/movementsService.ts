import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { InventoryMovement, SaleTransaction } from '../types';

/**
 * 100% Cloud-Native Supabase Persistence for Inventory Movements & Sales Transactions
 */
export async function fetchInventoryMovements(): Promise<InventoryMovement[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error || !data) {
      console.error('Erro ao buscar movimentações no Supabase:', error?.message);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      productId: row.product_id || '',
      productName: row.product_name,
      quantityDelta: Number(row.quantity_delta) || 0,
      type: row.type || 'Ajuste',
      clientName: row.client_name || undefined,
      referenceCode: row.reference_code || undefined,
      notes: row.notes || undefined,
    }));
  } catch (err) {
    console.error('Erro ao buscar movimentações de estoque:', err);
    return [];
  }
}

export async function createInventoryMovement(movement: InventoryMovement): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const payload: any = {
      timestamp: movement.timestamp || new Date().toISOString(),
      product_name: movement.productName,
      quantity_delta: movement.quantityDelta,
      type: movement.type || 'Ajuste',
      client_name: movement.clientName || null,
      reference_code: movement.referenceCode || null,
      notes: movement.notes || null,
    };

    if (movement.productId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(movement.productId)) {
      payload.product_id = movement.productId;
    }

    const { error } = await supabase.from('inventory_movements').insert([payload]);
    if (error) {
      console.error('Erro ao salvar movimentação no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Erro ao criar movimentação de estoque:', err);
    return false;
  }
}

export async function fetchSalesTransactions(): Promise<SaleTransaction[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('sales_transactions')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error || !data) {
      console.error('Erro ao buscar transações no Supabase:', error?.message);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      clientName: row.client_name,
      amount: Number(row.amount) || 0,
      receivedAmount: Number(row.received_amount) || 0,
      balance: Number(row.balance) || 0,
      paymentMethod: row.payment_method || 'PIX',
      status: row.status || 'Pago',
      dueDate: row.due_date || new Date().toISOString().split('T')[0],
      referenceCode: row.reference_code || undefined,
    }));
  } catch (err) {
    console.error('Erro ao buscar transações de vendas:', err);
    return [];
  }
}

export async function createSaleTransaction(tx: SaleTransaction): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const payload = {
      timestamp: tx.timestamp || new Date().toISOString(),
      client_name: tx.clientName,
      amount: tx.amount,
      received_amount: tx.receivedAmount,
      balance: tx.balance,
      payment_method: tx.paymentMethod || 'PIX',
      status: tx.status || 'Pago',
      due_date: tx.dueDate || new Date().toISOString().split('T')[0],
      reference_code: tx.referenceCode || null,
    };

    const { error } = await supabase.from('sales_transactions').insert([payload]);
    if (error) {
      console.error('Erro ao salvar transação de venda no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Erro ao criar transação de venda:', err);
    return false;
  }
}
