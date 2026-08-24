import { useState, useEffect } from 'react';
import { Quote } from '../types';
import { safeSetLocalStorage, getStorageParsed } from '../utils/storage';
import {
  fetchQuotes,
  createQuote,
  updateQuoteStatus,
} from '../services/quotesService';

export function useQuotes(user: any, showToast: (msg: string, type?: 'success' | 'error' | 'info') => void) {
  const [quotes, setQuotes] = useState<Quote[]>(() =>
    getStorageParsed<Quote[]>('rn3d_quotes', [], true)
  );

  useEffect(() => {
    safeSetLocalStorage('rn3d_quotes', JSON.stringify(quotes));
  }, [quotes]);

  // Load from Supabase on mount
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

  const handleCreateQuote = async (newQuote: Quote) => {
    setQuotes((prev) => [newQuote, ...prev]);
    showToast(`Orçamento ${newQuote.id} criado com sucesso!`, 'success');
    try {
      await createQuote(newQuote);
    } catch (err) {
      console.error('Erro ao salvar orçamento no Supabase:', err);
    }
  };

  const handleUpdateQuoteStatus = async (quoteId: string, newStatus: string) => {
    setQuotes((prev) =>
      prev.map((q) => (q.id === quoteId ? { ...q, status: newStatus as any } : q))
    );
    showToast(`Status do orçamento ${quoteId} atualizado para "${newStatus}"!`, 'info');
    try {
      await updateQuoteStatus(quoteId, newStatus);
    } catch (err) {
      console.error('Erro ao atualizar status do orçamento no Supabase:', err);
    }
  };

  return {
    quotes,
    setQuotes,
    handleCreateQuote,
    handleUpdateQuoteStatus,
  };
}
