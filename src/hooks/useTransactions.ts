import { useState, useEffect } from 'react';
import { safeSetLocalStorage, getStorageParsed } from '../utils/storage';

export function useTransactions() {
  const [transactions, setTransactions] = useState<any[]>(() =>
    getStorageParsed<any[]>('rn3d_transactions', [], true)
  );

  useEffect(() => {
    if (transactions) {
      safeSetLocalStorage('rn3d_transactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  const [movements, setMovements] = useState<any[]>(() =>
    getStorageParsed<any[]>('rn3d_movements', [], true)
  );

  useEffect(() => {
    if (movements) {
      safeSetLocalStorage('rn3d_movements', JSON.stringify(movements));
    }
  }, [movements]);

  const [clientInventories, setClientInventories] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem('rn3d_client_inventories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading clientInventories from localStorage:', e);
    }
    return {};
  });

  useEffect(() => {
    if (clientInventories) {
      safeSetLocalStorage('rn3d_client_inventories', JSON.stringify(clientInventories));
    }
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
