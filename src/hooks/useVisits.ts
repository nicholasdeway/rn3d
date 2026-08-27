import React, { useState, useEffect } from 'react';
import { Visit, Client, Product, Consignment, ExchangeNote } from '../types';
import { safeSetLocalStorage, getStorageParsed } from '../utils/storage';

export function useVisits(
  clients: Client[],
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void,
  setClientInventories: React.Dispatch<React.SetStateAction<Record<string, any>>>,
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>,
  setClients: React.Dispatch<React.SetStateAction<Client[]>>,
  setConsignments: React.Dispatch<React.SetStateAction<Consignment[]>>,
  setExchanges: React.Dispatch<React.SetStateAction<ExchangeNote[]>>,
  setTransactions: React.Dispatch<React.SetStateAction<any[]>>
) {
  const [visits, setVisits] = useState<Visit[]>(() =>
    getStorageParsed<Visit[]>('rn3d_visits', [], true)
  );

  useEffect(() => {
    if (visits) {
      safeSetLocalStorage('rn3d_visits', JSON.stringify(visits));
    }
  }, [visits]);

  const handleScheduleVisit = (newVisitData: {
    clientId: string;
    scheduledDate: string;
    timeSlot?: string;
    reason?: string;
  }) => {
    const client = clients.find((c) => c.id === newVisitData.clientId);
    if (!client) return;

    const formattedDate = newVisitData.scheduledDate.includes('/')
      ? newVisitData.scheduledDate
      : newVisitData.scheduledDate.split('-').reverse().join('/');

    const todayStr = new Date().toLocaleDateString('pt-BR');
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const parseDateToTimestamp = (str: string) => {
      if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
      } else if (str.includes('-')) {
        const parts = str.split('-');
        if (parts.length >= 3) return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getTime();
      }
      return 0;
    };

    const schedTime = parseDateToTimestamp(formattedDate);
    let calculatedStatus: 'Hoje' | 'Atrasada' | 'Em breve' = 'Em breve';

    if (schedTime > 0) {
      if (schedTime === todayMidnight || formattedDate === todayStr) {
        calculatedStatus = 'Hoje';
      } else if (schedTime < todayMidnight) {
        calculatedStatus = 'Atrasada';
      } else {
        calculatedStatus = 'Em breve';
      }
    }

    const newVisit: Visit = {
      id: `VIS-${Math.floor(100000 + Math.random() * 900000)}`,
      clientId: client.id,
      clientName: client.name,
      scheduledDate: formattedDate,
      timeSlot: newVisitData.timeSlot || '14:00',
      reason: newVisitData.reason || 'Conferência e reposição presencial',
      productsOnSite: client.productsOnSiteCount || 0,
      lastVisitText: client.lastVisitDate || 'N/A',
      status: calculatedStatus,
    };

    setVisits((prev) => [newVisit, ...prev]);

    setClients((prev) =>
      prev.map((c) => (c.id === client.id ? { ...c, nextVisitDate: formattedDate, visitStatus: calculatedStatus } : c))
    );

    showToast(`🗓️ Visita agendada para ${client.name} em ${formattedDate}!`, 'success');
  };

  const handleDeleteVisit = (visitId: string) => {
    setVisits((prev) => {
      const next = prev.filter((v) => v.id !== visitId);
      safeSetLocalStorage('rn3d_visits', JSON.stringify(next));
      return next;
    });
    showToast(`Visita #${visitId} removida com sucesso!`, 'success');
  };

  const handleCompleteVisit = (visitData: any) => {
    const client = visitData.client || clients.find((c) => c.id === visitData.clientId);
    if (!client) return;

    const clientId = client.id;
    const finalStock = visitData.finalEstimatedStock || 0;
    const received = visitData.receivedAmount || 0;
    const method = visitData.paymentMethod || 'PIX';
    const visitId = visitData.visitId || `VIS-${Math.floor(100000 + Math.random() * 900000)}`;

    const dateStr = new Date().toLocaleDateString('pt-BR');
    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const nextVisit = new Date(Date.now() + 15 * 86400000);
    const nextVisitDay = String(nextVisit.getDate()).padStart(2, '0');
    const nextVisitMonth = String(nextVisit.getMonth() + 1).padStart(2, '0');
    const nextVisitYear = nextVisit.getFullYear();
    const nextVisitStr = `${nextVisitDay}/${nextVisitMonth}/${nextVisitYear}`;

    if (visitData.auditCalculations && Array.isArray(visitData.auditCalculations)) {
      setClientInventories((prev) => {
        const currentList = prev[clientId] || [];
        const updatedList = currentList.map((item: any) => {
          const audit = visitData.auditCalculations.find((a: any) => a.productId === item.productId);
          if (audit) {
            const counted = audit.counted;
            const rem = visitData.removals?.[item.productId] || 0;
            const res = visitData.restocks?.[item.productId] || 0;
            const newQty = Math.max(0, counted - rem + res);
            return {
              ...item,
              quantityOnSite: newQty,
              currentQuantity: newQty,
              soldQuantity: (item.soldQuantity || 0) + (audit.sold || 0),
              valuation: newQty * item.unitPrice,
            };
          }
          return item;
        });

        return {
          ...prev,
          [clientId]: updatedList,
        };
      });
    }

    if (visitData.restocks && typeof visitData.restocks === 'object') {
      setProducts((prev) =>
        prev.map((p) => {
          const restockQty = visitData.restocks[p.id] || visitData.restocks[p.productId] || 0;
          if (restockQty > 0) {
            return {
              ...p,
              currentStock: Math.max(0, p.currentStock - restockQty),
            };
          }
          return p;
        })
      );
    }

    setClients((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          return {
            ...c,
            productsOnSiteCount: finalStock,
            lastVisitDate: dateStr,
            nextVisitDate: 'A agendar',
            visitStatus: 'Última visita',
          };
        }
        return c;
      })
    );

    setConsignments((prev) =>
      prev.map((c) => {
        const matchesClient =
          c.clientId === clientId ||
          (c.clientName && c.clientName.toLowerCase().trim() === client.name.toLowerCase().trim());

        if (matchesClient && c.items) {
          const updatedItems = c.items
            .map((cItem) => {
              const audit = visitData.auditCalculations?.find(
                (a: any) =>
                  a.productId === cItem.productId ||
                  a.productName.toLowerCase().trim() === cItem.productName.toLowerCase().trim()
              );
              if (audit) {
                const rem = visitData.removals?.[audit.productId] || 0;
                const res = visitData.restocks?.[audit.productId] || 0;
                const newQty = Math.max(0, audit.counted - rem + res);
                return {
                  ...cItem,
                  quantity: newQty,
                  subtotal: newQty * cItem.unitPrice,
                };
              }
              return cItem;
            })
            .filter((i) => i.quantity > 0);

          const newCount = updatedItems.reduce((acc, i) => acc + i.quantity, 0);
          const newVal = updatedItems.reduce((acc, i) => acc + i.subtotal, 0);

          return {
            ...c,
            items: updatedItems,
            itemsCount: newCount,
            totalValue: newVal,
            lastAuditDate: dateStr,
          };
        }
        return c;
      })
    );

    const totalRemoved: number = Object.values(visitData.removals || {}).reduce<number>(
      (acc: number, q: any) => acc + Number(q),
      0
    );
    if (Number(totalRemoved) > 0) {
      const exchangeNote: ExchangeNote = {
        id: `TRC-${Math.floor(100000 + Math.random() * 900000)}`,
        clientId: client.id,
        clientName: client.name,
        date: dateStr,
        destinationClientId: 'OFFICE',
        destinationClientName: 'Estoque Geral (Oficina RN 3D)',
        type: 'recolhimento_oficina',
        itemsRemoved: Object.entries(visitData.removals || {})
          .filter(([_, qty]) => Number(qty) > 0)
          .map(([prodId, qty]) => {
            const itemObj = visitData.auditCalculations?.find((a: any) => a.productId === prodId);
            return {
              productId: prodId,
              productName: itemObj?.productName || 'Produto Consignado',
              quantity: Number(qty),
              reason: 'Recolhimento durante visita presencial',
            };
          }),
        itemsAdded: [],
        responsible: 'Nicholas',
        responsibleName: 'Nicholas',
        notes: 'Recolhimento durante acerto presencial',
      };
      setExchanges((prev) => [exchangeNote, ...prev]);
    }

    if (received > 0) {
      setTransactions((prev) => [
        {
          id: `PAG-${Math.floor(Math.random() * 90000 + 10000)}`,
          clientName: client.name,
          date: dateStr,
          type: visitData.visitType === 'entrega_pedido' ? 'Entrega Presencial (Venda à Vista)' : 'Acerto Consignação (Visita)',
          amount: received,
          paymentMethod: method,
          status: 'Recebido',
          notes: visitData.paymentNotes || `Recebimento presencial de R$ ${received.toFixed(2)}`,
        },
        ...prev,
      ]);
    }

    setVisits((prev) => {
      let foundExisting = false;
      const updated = prev.map((v) => {
        if (v.clientId === clientId && v.status !== 'Concluída') {
          foundExisting = true;
          return {
            ...v,
            status: 'Concluída' as const,
            productsOnSite: finalStock,
            lastVisitText: `${dateStr} às ${timeStr}`,
            completedAt: `${dateStr} ${timeStr}`,
          };
        }
        return v;
      });

      if (!foundExisting) {
        updated.unshift({
          id: visitId,
          clientId: clientId,
          clientName: client.name,
          scheduledDate: dateStr,
          timeSlot: timeStr,
          reason: 'Visita presencial e conferência de expositor',
          productsOnSite: finalStock,
          lastVisitText: `${dateStr} às ${timeStr}`,
          status: 'Concluída',
          completedAt: `${dateStr} ${timeStr}`,
        });
      }

      return updated;
    });

    showToast(
      `📍 Visita ${visitId} concluída! Estoque do cliente, Vendas e Recebimento de R$ ${received.toFixed(
        2
      )} atualizados!`,
      'success'
    );
  };

  return {
    visits,
    setVisits,
    handleScheduleVisit,
    handleDeleteVisit,
    handleCompleteVisit,
  };
}
