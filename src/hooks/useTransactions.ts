import { useState, useEffect } from 'react';
import { safeSetLocalStorage, getStorageParsed } from '../utils/storage';

export function useTransactions() {
  const [transactions, setTransactions] = useState<any[]>(() => {
    const raw = getStorageParsed<any[]>('rn3d_transactions', [], true);
    return raw.filter(
      (t) =>
        !(
          t.type === 'Recebimento de Pedido' ||
          (t.notes && typeof t.notes === 'string' && t.notes.toLowerCase().includes('referente ao pedido'))
        )
    );
  });

  useEffect(() => {
    safeSetLocalStorage('rn3d_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const [movements, setMovements] = useState<any[]>(() =>
    getStorageParsed<any[]>('rn3d_movements', [], true)
  );

  useEffect(() => {
    safeSetLocalStorage('rn3d_movements', JSON.stringify(movements));
  }, [movements]);

  const [clientInventories, setClientInventories] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem('rn3d_client_inventories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const cleaned: Record<string, any> = {};
          Object.keys(parsed).forEach((key) => {
            if (key !== 'cli-1' && key !== 'cli-2' && key !== 'cli-3' && key !== 'cli-4' && key !== 'cli-5') {
              cleaned[key] = parsed[key];
            }
          });
          return cleaned;
        }
      }
    } catch (e) {
      console.error('Error loading clientInventories from localStorage:', e);
    }
    return {};
  });

  useEffect(() => {
    safeSetLocalStorage('rn3d_client_inventories', JSON.stringify(clientInventories));
  }, [clientInventories]);

  return {
    transactions,
    setTransactions,
    movements,
    setMovements,
    clientInventories,
    setClientInventories,
  };
}
