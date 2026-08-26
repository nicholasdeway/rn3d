import { useState, useEffect } from 'react';
import { Quote } from '../types';
import {
  fetchQuotes,
  createQuote,
  updateQuote,
} from '../services/quotesService';

export function useQuotes(user: any, showToast: (msg: string, type?: 'success' | 'error' | 'info') => void) {
  const [quotes, setQuotes] = useState<Quote[]>([]);

  // Load directly from Supabase on mount
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    fetchQuotes()
      .then((dbQuotes) => {
        if (isMounted && Array.isArray(dbQuotes)) {
          setQuotes(dbQuotes);
        }
      })
      .catch((err) => console.error('Erro ao carregar orçamentos do Supabase:', err));

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleAddQuote = async (newQuote: Quote) => {
    setQuotes((prev) => [newQuote, ...prev]);
    showToast(`Orçamento #${newQuote.id} gerado com sucesso!`, 'success');
    try {
      await createQuote(newQuote);
    } catch (err) {
      console.error('Erro ao salvar orçamento no Supabase:', err);
    }
  };

  const handleUpdateQuote = async (updatedQuote: Quote) => {
    setQuotes((prev) => prev.map((q) => (q.id === updatedQuote.id ? updatedQuote : q)));
    showToast(`Orçamento #${updatedQuote.id} atualizado com sucesso!`, 'success');
    try {
      await updateQuote(updatedQuote.id, updatedQuote);
    } catch (err) {
      console.error('Erro ao atualizar orçamento no Supabase:', err);
    }
  };

  const handleUpdateQuoteStatus = async (quoteId: string, newStatus: Quote['status']) => {
    setQuotes((prev) =>
      prev.map((q) => (q.id === quoteId ? { ...q, status: newStatus } : q))
    );
    showToast(`Status do orçamento #${quoteId} alterado para "${newStatus}"!`, 'success');
    try {
      await updateQuote(quoteId, { status: newStatus });
    } catch (err) {
      console.error('Erro ao atualizar status do orçamento no Supabase:', err);
    }
  };

  return {
    quotes,
    setQuotes,
    handleAddQuote,
    handleCreateQuote: handleAddQuote,
    handleUpdateQuote,
    handleUpdateQuoteStatus,
  };
}
