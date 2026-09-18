import { useState, useEffect } from 'react';
import { safeSetLocalStorage, safeGetLocalStorage, getStorageParsed } from '../utils/storage';
import { fetchInventoryMovements, fetchSalesTransactions } from '../services/movementsService';

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

  useEffect(() => {
    let active = true;
    async function loadCloudData() {
      const [dbMovements, dbTxs] = await Promise.all([
        fetchInventoryMovements(),
        fetchSalesTransactions(),
      ]);
      if (!active) return;
      if (dbMovements && dbMovements.length > 0) {
        setMovements((prev) => {
          const map = new Map<string, any>();
          dbMovements.forEach((m) => map.set(m.id, m));
          (prev || []).forEach((m) => {
            if (!map.has(m.id)) map.set(m.id, m);
          });
          return Array.from(map.values());
        });
      }
      if (dbTxs && dbTxs.length > 0) {
        setTransactions((prev) => {
          const map = new Map<string, any>();
          dbTxs.forEach((t) => map.set(t.id, t));
          (prev || []).forEach((t) => {
            if (!map.has(t.id)) map.set(t.id, t);
          });
          return Array.from(map.values());
        });
      }
    }
    loadCloudData();
    return () => {
      active = false;
    };
  }, []);

  const [clientInventories, setClientInventories] = useState<Record<string, any>>({});

  useEffect(() => {
    try {
      localStorage.removeItem('rn3d_client_inventories');
    } catch (_) {}
  }, []);

  return {
    transactions,
    setTransactions,
    movements,
    setMovements,
    clientInventories,
    setClientInventories,
  };
}

