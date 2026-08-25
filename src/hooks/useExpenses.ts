import { useState, useEffect } from 'react';
import { ExpenseItem } from '../types';
import { safeSetLocalStorage, getStorageParsed } from '../utils/storage';
import {
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../services/expensesService';

export function useExpenses(
  user: any,
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
) {
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() =>
    getStorageParsed<ExpenseItem[]>('rn3d_expenses', [])
  );

  const [accountBalance, setAccountBalance] = useState<number>(() => {
    const saved = localStorage.getItem('rn3d_account_balance');
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed)) return parsed;
    }
    return 3500.0; // Default initial account balance if not set
  });

  useEffect(() => {
    if (expenses) {
      safeSetLocalStorage('rn3d_expenses', JSON.stringify(expenses));
    }
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('rn3d_account_balance', accountBalance.toString());
  }, [accountBalance]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    fetchExpenses()
      .then((dbExpenses) => {
        if (isMounted && Array.isArray(dbExpenses) && dbExpenses.length > 0) {
          setExpenses(dbExpenses);
        }
      })
      .catch((err) => console.error('Erro ao carregar despesas do Supabase:', err));

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleCreateExpense = async (newExpense: ExpenseItem) => {
    setExpenses((prev) => [newExpense, ...prev]);
    if (newExpense.category === 'Retirada de Sócio / Pro-labore') {
      showToast(`Retirada de Sócio (R$ ${newExpense.amount.toFixed(2)}) lançada com sucesso!`, 'success');
    } else {
      showToast(`Despesa "${newExpense.description}" registrada com sucesso!`, 'success');
    }

    try {
      const savedInDb = await createExpense(newExpense);
      if (savedInDb && savedInDb.id) {
        setExpenses((prev) =>
          prev.map((e) => (e.id === newExpense.id ? { ...e, id: savedInDb.id } : e))
        );
      }
    } catch (err) {
      console.error('Erro ao salvar despesa no Supabase:', err);
    }
  };

  const handleUpdateExpense = async (updatedExpense: ExpenseItem) => {
    setExpenses((prev) => prev.map((e) => (e.id === updatedExpense.id ? updatedExpense : e)));
    showToast(`Despesa "${updatedExpense.description}" atualizada com sucesso!`, 'success');
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

  const handleUpdateAccountBalance = (newBalance: number) => {
    setAccountBalance(newBalance);
    showToast(`Saldo da Conta atualizado para R$ ${newBalance.toFixed(2).replace('.', ',')}!`, 'success');
  };

  return {
    expenses,
    setExpenses,
    accountBalance,
    setAccountBalance,
    handleCreateExpense,
    handleUpdateExpense,
    handleDeleteExpense,
    handleUpdateAccountBalance,
  };
}
