import React, { useState, useEffect } from 'react';
import { Consignment, Client } from '../types';
import {
  fetchConsignments,
  createConsignment,
  updateConsignment,
  deleteSingleConsignment,
  deleteAllConsignments,
} from '../services/consignmentsService';

export function useConsignments(
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void,
  setClientInventories: React.Dispatch<React.SetStateAction<Record<string, any>>>,
  setClients: React.Dispatch<React.SetStateAction<Client[]>>
) {
  const [consignments, setConsignments] = useState<Consignment[]>([]);

  // 100% Cloud-Native Fetch on Mount from Supabase Postgres
  useEffect(() => {
    let isMounted = true;

    async function loadCloudConsignments() {
      try {
        try {
          localStorage.removeItem('rn3d_consignments');
        } catch (_) {}

        const dbItems = await fetchConsignments();
        if (isMounted) {
          setConsignments(dbItems);
        }
      } catch (err) {
        console.error('Erro ao carregar consignações do Supabase:', err);
      }
    }

    loadCloudConsignments();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddConsignment = async (newConsignment: Consignment) => {
    // Optimistic UI update
    setConsignments((prev) => [newConsignment, ...prev]);

    const clientId = newConsignment.clientId;
    const items = newConsignment.items || [];

    setClientInventories((prev) => {
      const currentList = prev[clientId] || [];
      let updatedList = [...currentList];

      items.forEach((newItem) => {
        const existingIdx = updatedList.findIndex(
          (i) =>
            i.productId === newItem.productId ||
            i.productName.toLowerCase() === newItem.productName.toLowerCase()
        );

        if (existingIdx >= 0) {
          const existing = updatedList[existingIdx];
          const newQty = existing.quantityOnSite + newItem.quantity;
          updatedList[existingIdx] = {
            ...existing,
            quantityOnSite: newQty,
            valuation: newQty * existing.unitPrice,
          };
        } else {
          updatedList.push({
            productId: newItem.productId || `prod-${Math.random().toString(36).substr(2, 6)}`,
            productName: newItem.productName,
            quantityOnSite: newItem.quantity,
            unitPrice: newItem.unitPrice,
            valuation: newItem.subtotal,
            daysOnSite: 0,
            status: 'Normal',
          });
        }
      });

      return {
        ...prev,
        [clientId]: updatedList,
      };
    });

    setClients((prev) =>
      prev.map((cli) => {
        if (cli.id === clientId) {
          return {
            ...cli,
            productsOnSiteCount: cli.productsOnSiteCount + newConsignment.itemsCount,
            productsValuation: cli.productsValuation + newConsignment.totalValue,
            lastVisitDate: newConsignment.date,
          };
        }
        return cli;
      })
    );

    showToast(`Remessa de consignação ${newConsignment.id} criada com sucesso!`, 'success');

    try {
      const success = await createConsignment(newConsignment);
      if (success) {
        const refreshed = await fetchConsignments();
        setConsignments(refreshed);
      }
    } catch (err) {
      console.error('Erro ao gravar consignação no Supabase:', err);
    }
  };

  const handleUpdateConsignment = async (updated: Consignment) => {
    setConsignments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    showToast(`Remessa ${updated.id} atualizada com sucesso!`, 'success');

    try {
      await updateConsignment(updated);
      const refreshed = await fetchConsignments();
      setConsignments(refreshed);
    } catch (err) {
      console.error('Erro ao atualizar consignação no Supabase:', err);
    }
  };

  const handleDeleteConsignment = async (id: string) => {
    setConsignments((prev) => prev.filter((c) => c.id !== id));
    showToast(`Remessa ${id} excluída do sistema!`, 'info');

    try {
      await deleteSingleConsignment(id);
      const refreshed = await fetchConsignments();
      setConsignments(refreshed);
    } catch (err) {
      console.error('Erro ao excluir consignação do Supabase:', err);
    }
  };

  const handleClearConsignments = async () => {
    setConsignments([]);
    showToast('Limpando consignações do Supabase...', 'info');
    await deleteAllConsignments();
    showToast('Todas as consignações foram apagadas do sistema!', 'success');
  };

  return {
    consignments,
    setConsignments,
    handleAddConsignment,
    handleUpdateConsignment,
    handleDeleteConsignment,
    handleClearConsignments,
  };
}
