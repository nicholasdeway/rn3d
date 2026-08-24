import React, { useState, useEffect } from 'react';
import { ExchangeNote, Product, Client, Consignment } from '../types';
import { safeSetLocalStorage, getStorageParsed } from '../utils/storage';

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
            return {
              ...p,
              currentStock: p.currentStock + removed.quantity,
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
