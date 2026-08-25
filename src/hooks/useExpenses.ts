import { useState, useEffect } from 'react';
import { ExpenseItem, AccountBalances, MarketplaceAccount } from '../types';
import { safeSetLocalStorage, getStorageParsed } from '../utils/storage';
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
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() =>
    getStorageParsed<ExpenseItem[]>('rn3d_expenses', [])
  );

  const [accountBalances, setAccountBalances] = useState<AccountBalances>(() => {
    const saved = localStorage.getItem('rn3d_account_balances');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        return {
          nubank: typeof parsed.nubank === 'number' ? parsed.nubank : 0,
          shopee: typeof parsed.shopee === 'number' ? parsed.shopee : 0,
          mercadoLivre: typeof parsed.mercadoLivre === 'number' ? parsed.mercadoLivre : 0,
          tikTokShop: typeof parsed.tikTokShop === 'number' ? parsed.tikTokShop : 0,
          amazon: typeof parsed.amazon === 'number' ? parsed.amazon : 0,
        };
      } catch (e) {}
    }
    // Backward compatibility with single rn3d_account_balance
    const legacySingle = localStorage.getItem('rn3d_account_balance');
    if (legacySingle !== null) {
      const val = parseFloat(legacySingle);
      if (!isNaN(val)) {
        return { ...DEFAULT_BALANCES, nubank: val };
      }
    }
    return DEFAULT_BALANCES;
  });

  useEffect(() => {
    if (expenses) {
      safeSetLocalStorage('rn3d_expenses', JSON.stringify(expenses));
    }
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('rn3d_account_balances', JSON.stringify(accountBalances));
    localStorage.setItem('rn3d_account_balance', accountBalances.nubank.toString());
  }, [accountBalances]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'rn3d_account_balances' && e.newValue) {
        try {
          setAccountBalances(JSON.parse(e.newValue));
        } catch (err) {}
      }
      if (e.key === 'rn3d_expenses' && e.newValue) {
        try {
          setExpenses(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const reloadExpenses = async () => {
    try {
      const { expenses: dbExpenses, balances: dbBalances } = await fetchExpenses();
      if (Array.isArray(dbExpenses) && dbExpenses.length > 0) {
        setExpenses(dbExpenses);
      }
      if (dbBalances) {
        setAccountBalances(dbBalances);
      }
    } catch (err) {
      console.error('Erro ao recarregar despesas:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    fetchExpenses()
      .then(({ expenses: dbExpenses, balances: dbBalances }) => {
        if (!isMounted) return;
        if (Array.isArray(dbExpenses) && dbExpenses.length > 0) {
          setExpenses(dbExpenses);
        }
        if (dbBalances) {
          setAccountBalances(dbBalances);
        }
      })
      .catch((err) => console.error('Erro ao carregar despesas do Supabase:', err));

    return () => {
      isMounted = false;
    };
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
      setAccountBalances((prev) => ({
        ...prev,
        nubank: Math.max(0, prev.nubank - formattedItem.amount),
      }));
      showToast(`Retirada (R$ ${formattedItem.amount.toFixed(2)}) por ${formattedItem.createdBy} registrada!`, 'success');
    } else if (formattedItem.category === 'Aporte / Reembolso de Sócio') {
      setAccountBalances((prev) => ({
        ...prev,
        nubank: prev.nubank + formattedItem.amount,
      }));
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

    // Update balances
    setAccountBalances((prev) => {
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

      const updated = {
        ...prev,
        [sourceKey]: Math.max(0, (prev[sourceKey as keyof AccountBalances] || 0) - amount),
        [destKey]: (prev[destKey as keyof AccountBalances] || 0) + amount,
      };
      saveAccountBalancesToSupabase(updated);
      return updated;
    });

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
      await createExpense(transferExpense);
    } catch (err) {
      console.error('Erro ao registrar transferência no Supabase:', err);
    }
  };

  const handleUpdateExpense = async (updatedExpense: ExpenseItem) => {
    setExpenses((prev) => prev.map((e) => (e.id === updatedExpense.id ? updatedExpense : e)));
    showToast(`Lançamento "${updatedExpense.description}" atualizado com sucesso!`, 'success');
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

  const handleUpdateSingleBalance = (accountKey: keyof AccountBalances, newBalance: number) => {
    setAccountBalances((prev) => {
      const updated = {
        ...prev,
        [accountKey]: newBalance,
      };
      saveAccountBalancesToSupabase(updated);
      return updated;
    });
    showToast(`Saldo ${accountKey.toUpperCase()} atualizado para R$ ${newBalance.toFixed(2).replace('.', ',')}!`, 'success');
  };

  return {
    expenses,
    setExpenses,
    accountBalances,
    accountBalance: accountBalances.nubank, // Fallback property
    setAccountBalances,
    reloadExpenses,
    handleCreateExpense,
    handleExecuteTransfer,
    handleUpdateExpense,
    handleDeleteExpense,
    handleUpdateSingleBalance,
  };
}
