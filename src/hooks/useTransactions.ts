import { useState } from 'react';

export function useTransactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [clientInventories, setClientInventories] = useState<Record<string, any>>({});

  return {
    transactions,
    setTransactions,
    movements,
    setMovements,
    clientInventories,
    setClientInventories,
  };
}
