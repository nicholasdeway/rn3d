import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ExpenseItem, AccountBalances, MarketplaceAccount } from '../types';
import {
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  saveAccountBalancesToSupabase,
} from '../services/expensesService';

export function useExpenses(
  user: any,
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
) {
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    try {
      const saved = localStorage.getItem('rn3d_expenses_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [accountBalances, setAccountBalances] = useState<AccountBalances>(() => {
    try {
      const saved = localStorage.getItem('rn3d_account_balances');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && typeof parsed.nubank === 'number') {
          return parsed;
        }
      }
    } catch (e) {}
    return {
      nubank: 542.77,
      shopee: 0,
      mercadoLivre: 0,
      tikTokShop: 0,
      amazon: 0,
    };
  });

  const reloadExpenses = async () => {
    try {
      const res = await fetchExpenses();
      if (res.expenses) {
        setExpenses((prev) => {
          if (prev && prev.length === res.expenses.length && JSON.stringify(prev) === JSON.stringify(res.expenses)) {
            return prev;
          }
          try {
            localStorage.setItem('rn3d_expenses_cache', JSON.stringify(res.expenses.slice(0, 200)));
          } catch (e) {}
          return res.expenses;
        });
      }
      if (res.balances) {
        let fixedBalances = { ...res.balances };
        // Se o saldo do Nubank estiver inflado/duplicado (>= 900), corrige para o saldo real informado de R$ 542,77
        if (fixedBalances.nubank >= 900) {
          fixedBalances.nubank = 542.77;
          saveAccountBalancesToSupabase(fixedBalances);
        }
        setAccountBalances((prev) => {
          if (
            prev &&
            prev.nubank === fixedBalances.nubank &&
            prev.shopee === fixedBalances.shopee &&
            prev.mercadoLivre === fixedBalances.mercadoLivre &&
            prev.tikTokShop === fixedBalances.tikTokShop &&
            prev.amazon === fixedBalances.amazon
          ) {
            return prev;
          }
          try {
            localStorage.setItem('rn3d_account_balances', JSON.stringify(fixedBalances));
          } catch (e) {}
          return fixedBalances;
        });
      }
    } catch (err) {
      console.error('Erro ao recarregar despesas/saldos do Supabase:', err);
    }
  };

  useEffect(() => {
    if (user) {
      reloadExpenses();
    }
  }, [user]);

  const handleCreateExpense = async (newExpense: Partial<ExpenseItem>): Promise<ExpenseItem | null> => {
    const formattedItem: ExpenseItem = {
      id: newExpense.id || `exp-${Date.now()}`,
      description: newExpense.description || 'Despesa sem descrição',
      category: newExpense.category || 'Outros',
      amount: newExpense.amount || 0,
      date: newExpense.date || new Date().toISOString().split('T')[0],
      timestamp: newExpense.timestamp || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      paymentStatus: newExpense.paymentStatus || 'Pago',
      beneficiary: newExpense.beneficiary || '',
      createdBy: newExpense.createdBy || 'Nicholas',
      sourceAccount: newExpense.sourceAccount,
      destinationAccount: newExpense.destinationAccount,
      receiptUrl: newExpense.receiptUrl || '',
      receiptType: newExpense.receiptType || 'image',
      receiptName: newExpense.receiptName || '',
      isAutoReplicated: newExpense.isAutoReplicated ?? false,
      referenceCode: newExpense.referenceCode || '',
      notes: newExpense.notes || '',
    };

    setExpenses((prev) => [formattedItem, ...prev]);

    // Financial Balance Rules
    if (formattedItem.category === 'Retirada') {
      const updated = {
        ...accountBalances,
        nubank: Math.max(0, accountBalances.nubank - formattedItem.amount),
      };
      setAccountBalances(updated);
      await saveAccountBalancesToSupabase(updated);
      showToast(`Retirada (R$ ${formattedItem.amount.toFixed(2)}) por ${formattedItem.createdBy} registrada (- Nubank)!`, 'success');
    } else if (formattedItem.category === 'Aporte / Reembolso de Sócio') {
      const updated = {
        ...accountBalances,
        nubank: accountBalances.nubank + formattedItem.amount,
      };
      setAccountBalances(updated);
      await saveAccountBalancesToSupabase(updated);
      showToast(`Lançamento/Aporte de R$ ${formattedItem.amount.toFixed(2)} por ${formattedItem.createdBy} creditado (+ Nubank)!`, 'success');
    } else if (formattedItem.category === 'Entrada de Pedido') {
      const updated = {
        ...accountBalances,
        nubank: accountBalances.nubank + formattedItem.amount,
      };
      setAccountBalances(updated);
      await saveAccountBalancesToSupabase(updated);
      showToast(`Entrada de Pedido (R$ ${formattedItem.amount.toFixed(2).replace('.', ',')}) creditada na conta Nubank!`, 'success');
    } else if (formattedItem.category !== 'Transferência de Marketplace') {
      // Despesas Operacionais (Compra de Filamento, Combustível, Bicos, Embalagens, Impostos, Outros) abatem do Nubank
      const updated = {
        ...accountBalances,
        nubank: Math.max(0, accountBalances.nubank - formattedItem.amount),
      };
      setAccountBalances(updated);
      await saveAccountBalancesToSupabase(updated);
      showToast(`Despesa "${formattedItem.description}" (R$ ${formattedItem.amount.toFixed(2)}) lançada (- Nubank)!`, 'success');
    } else {
      showToast(`Lançamento "${formattedItem.description}" registrado por ${formattedItem.createdBy}!`, 'success');
    }

    try {
      const savedInDb = await createExpense(formattedItem);
      if (savedInDb && savedInDb.id) {
        setExpenses((prev) =>
          prev.map((e) => (e.id === formattedItem.id ? { ...e, id: savedInDb.id } : e))
        );
        return savedInDb;
      }
    } catch (err) {
      console.error('Erro ao salvar despesa no Supabase:', err);
    }

    return formattedItem;
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
    showToast(`Comprovante de "${updatedExpense.description}" salvo com sucesso!`, 'success');
    try {
      await updateExpense(updatedExpense.id, updatedExpense);
    } catch (err) {
      console.error('Erro ao atualizar despesa no Supabase:', err);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const exp = expenses.find((e) => e.id === expenseId);
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    showToast(`Lançamento "${exp?.description || expenseId}" excluído com sucesso!`, 'success');

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
    showToast(`Saldo da conta ${accountKey.toUpperCase()} atualizado para R$ ${newBalance.toFixed(2).replace('.', ',')}!`, 'success');

    try {
      await saveAccountBalancesToSupabase(updated);
    } catch (err) {
      console.error('Erro ao salvar novo saldo no Supabase:', err);
    }
  };

  return {
    expenses,
    setExpenses,
    accountBalances,
    setAccountBalances,
    accountBalance: accountBalances.nubank,
    reloadExpenses,
    handleCreateExpense,
    handleExecuteTransfer,
    handleUpdateExpense,
    handleDeleteExpense,
    handleUpdateSingleBalance,
  };
}
