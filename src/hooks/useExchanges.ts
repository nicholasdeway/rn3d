import React, { useState, useEffect } from 'react';
import { ExchangeNote, Product, Client, Consignment } from '../types';
import { safeSetLocalStorage, getStorageParsed } from '../utils/storage';
import { updateProduct } from '../services/productsService';
import { createExchange, fetchExchanges } from '../services/exchangesService';
import { createInventoryMovement } from '../services/movementsService';

export function useExchanges(
  products: Product[],
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void,
  setClientInventories: React.Dispatch<React.SetStateAction<Record<string, any>>>,
  setClients: React.Dispatch<React.SetStateAction<Client[]>>,
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>,
  setConsignments: React.Dispatch<React.SetStateAction<Consignment[]>>
) {
  const [exchanges, setExchanges] = useState<ExchangeNote[]>(() =>
    getStorageParsed<ExchangeNote[]>('rn3d_exchanges', [], true)
  );

  useEffect(() => {
    safeSetLocalStorage('rn3d_exchanges', JSON.stringify(exchanges));
  }, [exchanges]);

  const handleExecuteExchange = (newExchange: ExchangeNote) => {
    setExchanges((prev) => [newExchange, ...prev]);

    // Persist exchange note directly to Supabase PostgreSQL
    createExchange(newExchange).catch((err) =>
      console.error('Erro ao salvar troca no Supabase:', err)
    );

    // Persist inventory movements for each item
    (newExchange.itemsRemoved || []).forEach((item) => {
      createInventoryMovement({
        id: `mov-trc-${Date.now()}-${item.productId}`,
        timestamp: new Date().toISOString(),
        productId: item.productId,
        productName: item.productName,
        quantityDelta: newExchange.type === 'recolhimento_oficina' ? item.quantity : -item.quantity,
        type: 'Troca',
        clientName: newExchange.clientName,
        referenceCode: newExchange.id,
        notes: `Troca / Recolhimento - ${item.reason || 'Devolução/Migração'}`,
      }).catch((err) => console.error('Erro ao registrar movimentação de troca:', err));
    });

    const sourceId = newExchange.clientId;
    const destId = newExchange.destinationClientId;
    const isOffice = newExchange.type === 'recolhimento_oficina' || destId === 'OFFICE' || !destId;

    const itemsRemoved = newExchange.itemsRemoved;

    setClientInventories((prev) => {
      const sourceList = prev[sourceId] || [];
      const updatedSource = sourceList
        .map((item) => {
          const removed = itemsRemoved.find(
            (r) => r.productId === item.productId || r.productName.toLowerCase() === item.productName.toLowerCase()
          );
          if (removed) {
            const newQty = Math.max(0, item.quantityOnSite - removed.quantity);
            return {
              ...item,
              quantityOnSite: newQty,
              valuation: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter((item) => item.quantityOnSite > 0);

      if (!isOffice && destId) {
        const destList = prev[destId] || [];
        let updatedDest = [...destList];

        itemsRemoved.forEach((remItem) => {
          const matchingProduct = products.find(
            (p) => p.id === remItem.productId || p.name.toLowerCase() === remItem.productName.toLowerCase()
          );
          const unitPrice = matchingProduct ? matchingProduct.standardPrice : 8.0;

          const existingIdx = updatedDest.findIndex(
            (i) => i.productId === remItem.productId || i.productName.toLowerCase() === remItem.productName.toLowerCase()
          );

          if (existingIdx >= 0) {
            const existing = updatedDest[existingIdx];
            const newQty = existing.quantityOnSite + remItem.quantity;
            updatedDest[existingIdx] = {
              ...existing,
              quantityOnSite: newQty,
              valuation: newQty * existing.unitPrice,
            };
          } else {
            updatedDest.push({
              productId: remItem.productId,
              productName: remItem.productName,
              quantityOnSite: remItem.quantity,
              unitPrice: unitPrice,
              valuation: remItem.quantity * unitPrice,
              daysOnSite: 0,
              status: 'Normal',
            });
          }
        });

        return {
          ...prev,
          [sourceId]: updatedSource,
          [destId]: updatedDest,
        };
      }

      return {
        ...prev,
        [sourceId]: updatedSource,
      };
    });

    setClients((prev) =>
      prev.map((cli) => {
        if (cli.id === sourceId) {
          const totalQtyRemoved = itemsRemoved.reduce((acc, i) => acc + i.quantity, 0);
          const newCount = Math.max(0, cli.productsOnSiteCount - totalQtyRemoved);
          return {
            ...cli,
            productsOnSiteCount: newCount,
          };
        }
        if (!isOffice && destId && cli.id === destId) {
          const totalQtyAdded = itemsRemoved.reduce((acc, i) => acc + i.quantity, 0);
          return {
            ...cli,
            productsOnSiteCount: cli.productsOnSiteCount + totalQtyAdded,
          };
        }
        return cli;
      })
    );

    if (isOffice) {
      setProducts((prev) =>
        prev.map((p) => {
          const removed = itemsRemoved.find(
            (r) => r.productId === p.id || r.productName.toLowerCase() === p.name.toLowerCase()
          );
          if (removed) {
            const newStock = p.currentStock + removed.quantity;
            updateProduct(p.id, { currentStock: newStock }).catch((err) =>
              console.error('Erro ao atualizar estoque da oficina no Supabase:', err)
            );
            return {
              ...p,
              currentStock: newStock,
            };
          }
          return p;
        })
      );
    }

    setConsignments((prev) =>
      prev.map((c) => {
        const matchesClient =
          c.clientId === sourceId ||
          (c.clientName && c.clientName.toLowerCase().trim() === newExchange.clientName.toLowerCase().trim());

        if (matchesClient && c.items) {
          const updatedItems = c.items
            .map((cItem) => {
              const removed = itemsRemoved.find(
                (r) =>
                  r.productId === cItem.productId ||
                  r.productName.toLowerCase().trim() === cItem.productName.toLowerCase().trim()
              );
              if (removed) {
                const newQty = Math.max(0, cItem.quantity - removed.quantity);
                return {
                  ...cItem,
                  quantity: newQty,
                  subtotal: newQty * cItem.unitPrice,
                };
              }
              return cItem;
            })
            .filter((cItem) => cItem.quantity > 0);

          const newItemsCount = updatedItems.reduce((sum, i) => sum + i.quantity, 0);
          const newTotalValuation = updatedItems.reduce((sum, i) => sum + i.subtotal, 0);

          return {
            ...c,
            items: updatedItems,
            itemsCount: newItemsCount,
            totalValue: newTotalValuation,
          };
        }
        return c;
      })
    );

    if (isOffice) {
      showToast(`Troca / Recolhimento ${newExchange.id} concluído! Peças retornadas ao Estoque Geral.`, 'success');
    } else {
      showToast(`Troca / Migração ${newExchange.id} concluída! Peças transferidas para a nova loja.`, 'success');
    }
  };

  return {
    exchanges,
    setExchanges,
    handleExecuteExchange,
  };
}
