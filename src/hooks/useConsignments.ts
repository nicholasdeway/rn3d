import React, { useState, useEffect } from 'react';
import { Consignment, Client } from '../types';
import { safeSetLocalStorage, getStorageParsed } from '../utils/storage';
import { fetchConsignments, createConsignment, syncMissingConsignmentsToSupabase } from '../services/consignmentsService';

export function useConsignments(
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void,
  setClientInventories: React.Dispatch<React.SetStateAction<Record<string, any>>>,
  setClients: React.Dispatch<React.SetStateAction<Client[]>>
) {
  const [consignments, setConsignments] = useState<Consignment[]>(() =>
    getStorageParsed<Consignment[]>('rn3d_consignments', [], true)
  );

  useEffect(() => {
    if (consignments) {
      safeSetLocalStorage('rn3d_consignments', JSON.stringify(consignments));
    }
  }, [consignments]);

  // Dual Hydration and auto-sync to Supabase Postgres
  useEffect(() => {
    let isMounted = true;

    async function initSupabaseConsignments() {
      try {
        const dbItems = await fetchConsignments();
        if (!isMounted) return;

        if (dbItems && dbItems.length > 0) {
          setConsignments((prevLocal) => {
            const mergedMap = new Map<string, Consignment>();
            dbItems.forEach((item) => mergedMap.set(item.id.toLowerCase().trim(), item));
            (prevLocal || []).forEach((item) => {
              const key = item.id.toLowerCase().trim();
              if (!mergedMap.has(key)) {
                mergedMap.set(key, item);
              }
            });
            return Array.from(mergedMap.values());
          });
        }

        // Auto-sync any local consignments up to Supabase
        if (consignments && consignments.length > 0) {
          syncMissingConsignmentsToSupabase(consignments);
        }
      } catch (err) {
        console.error('Erro ao inicializar consignações do Supabase:', err);
      }
    }

    initSupabaseConsignments();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddConsignment = async (newConsignment: Consignment) => {
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
      await createConsignment(newConsignment);
    } catch (err) {
      console.error('Erro ao gravar consignação no Supabase:', err);
    }
  };

  return {
    consignments,
    setConsignments,
    handleAddConsignment,
  };
}
