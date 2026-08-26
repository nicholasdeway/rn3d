import { useState, useEffect } from 'react';
import { ExpenseItem, AccountBalances, MarketplaceAccount } from '../types';
import {
  fetchExpenses,
  saveAccountBalancesToSupabase,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../services/expensesService';

const DEFAULT_BALANCES: AccountBalances = {
  nubank: 0,
  shopee: 0,
  mercadoLivre: 0,
  tikTokShop: 0,
  amazon: 0,
};

export function useExpenses(
  user: any,
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
) {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [accountBalances, setAccountBalances] = useState<AccountBalances>(DEFAULT_BALANCES);

  const reloadExpenses = async () => {
    try {
      const res = await fetchExpenses();
      if (res && res.expenses) {
        setExpenses(res.expenses);
      }
      if (res && res.balances) {
        setAccountBalances(res.balances);
      }
    } catch (err) {
      console.error('Erro ao recarregar despesas do Supabase:', err);
    }
  };

  useEffect(() => {
    if (user) {
      reloadExpenses();
    }
  }, [user]);

  const handleCreateExpense = async (newExpense: ExpenseItem) => {
    const formattedItem: ExpenseItem = {
      ...newExpense,
      timestamp: newExpense.timestamp || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      createdBy: newExpense.createdBy || 'Nicholas',
    };

    setExpenses((prev) => [formattedItem, ...prev]);

    // If it's a Retirada, deduct from Nubank balance automatically
    if (formattedItem.category === 'Retirada') {
      const updated = {
        ...accountBalances,
        nubank: Math.max(0, accountBalances.nubank - formattedItem.amount),
      };
      setAccountBalances(updated);
      await saveAccountBalancesToSupabase(updated);
      showToast(`Retirada (R$ ${formattedItem.amount.toFixed(2)}) por ${formattedItem.createdBy} registrada!`, 'success');
    } else if (formattedItem.category === 'Aporte / Reembolso de Sócio') {
      const updated = {
        ...accountBalances,
        nubank: accountBalances.nubank + formattedItem.amount,
      };
      setAccountBalances(updated);
      await saveAccountBalancesToSupabase(updated);
      showToast(`Lançamento/Aporte de R$ ${formattedItem.amount.toFixed(2)} por ${formattedItem.createdBy} creditado no Nubank!`, 'success');
    } else {
      showToast(`Despesa "${formattedItem.description}" registrada por ${formattedItem.createdBy}!`, 'success');
    }

    try {
      const savedInDb = await createExpense(formattedItem);
      if (savedInDb && savedInDb.id) {
        setExpenses((prev) =>
          prev.map((e) => (e.id === formattedItem.id ? { ...e, id: savedInDb.id } : e))
        );
      }
    } catch (err) {
      console.error('Erro ao salvar despesa no Supabase:', err);
    }
  };

  const handleExecuteTransfer = async (
    source: MarketplaceAccount,
    destination: MarketplaceAccount,
    amount: number,
    responsible: string,
    notes?: string,
    receiptUrl?: string,
    receiptType?: 'image' | 'pdf',
    receiptName?: string
  ) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const sourceKey =
      source === 'Shopee'
        ? 'shopee'
        : source === 'Mercado Livre'
        ? 'mercadoLivre'
        : source === 'TikTok Shop'
        ? 'tikTokShop'
        : source === 'Amazon'
        ? 'amazon'
        : 'nubank';

    const destKey =
      destination === 'Shopee'
        ? 'shopee'
        : destination === 'Mercado Livre'
        ? 'mercadoLivre'
        : destination === 'TikTok Shop'
        ? 'tikTokShop'
        : destination === 'Amazon'
        ? 'amazon'
        : 'nubank';

    const updatedBalances = {
      ...accountBalances,
      [sourceKey]: Math.max(0, (accountBalances[sourceKey as keyof AccountBalances] || 0) - amount),
      [destKey]: (accountBalances[destKey as keyof AccountBalances] || 0) + amount,
    };

    setAccountBalances(updatedBalances);
    await saveAccountBalancesToSupabase(updatedBalances);

    // Create Audit Log Transaction
    const transferExpense: ExpenseItem = {
      id: `trf-${Date.now()}`,
      description: `Resgate / Transferência (${source} ➔ ${destination})`,
      category: 'Transferência de Marketplace',
      amount,
      date: dateStr,
      timestamp: timeStr,
      paymentStatus: 'Pago',
      beneficiary: `Conta ${destination}`,
      createdBy: responsible || 'Nicholas',
      sourceAccount: source,
      destinationAccount: destination,
      receiptUrl: receiptUrl || '',
      receiptType: receiptType || 'image',
      receiptName: receiptName || '',
      notes: notes || `Transferência de saldo ${source} para ${destination}`,
    };

    setExpenses((prev) => [transferExpense, ...prev]);
    showToast(`Resgate de R$ ${amount.toFixed(2).replace('.', ',')} (${source} ➔ ${destination}) efetuado por ${responsible}!`, 'success');

    try {
      const savedInDb = await createExpense(transferExpense);
      if (savedInDb && savedInDb.id) {
        setExpenses((prev) =>
          prev.map((e) => (e.id === transferExpense.id ? { ...e, id: savedInDb.id } : e))
        );
      }
    } catch (err) {
      console.error('Erro ao registrar transferência no Supabase:', err);
    }
  };

  const handleUpdateExpense = async (updatedExpense: ExpenseItem) => {
    setExpenses((prev) => prev.map((e) => (e.id === updatedExpense.id ? updatedExpense : e)));
    showToast(`Comprovante de "${updatedExpense.description}" salvo no Supabase com sucesso!`, 'success');
    try {
      await updateExpense(updatedExpense.id, updatedExpense);
    } catch (err) {
      console.error('Erro ao atualizar despesa no Supabase:', err);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const target = expenses.find((e) => e.id === expenseId);
    const desc = target ? target.description : 'Lançamento';
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    showToast(`"${desc}" excluído com sucesso!`, 'success');
    try {
      await deleteExpense(expenseId);
    } catch (err) {
      console.error('Erro ao excluir despesa no Supabase:', err);
    }
  };

  const handleUpdateSingleBalance = async (accountKey: keyof AccountBalances, newBalance: number) => {
    const updated = {
      ...accountBalances,
      [accountKey]: newBalance,
    };
    setAccountBalances(updated);
    await saveAccountBalancesToSupabase(updated);
    showToast(`Saldo ${accountKey.toUpperCase()} atualizado para R$ ${newBalance.toFixed(2).replace('.', ',')}!`, 'success');
  };

  return {
    expenses,
    setExpenses,
    accountBalances,
    accountBalance: accountBalances.nubank,
    setAccountBalances,
    reloadExpenses,
    handleCreateExpense,
    handleExecuteTransfer,
    handleUpdateExpense,
    handleDeleteExpense,
    handleUpdateSingleBalance,
  };
}
