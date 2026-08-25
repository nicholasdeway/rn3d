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
    safeSetLocalStorage('rn3d_visits', JSON.stringify(visits));
  }, [visits]);

  // Auto-gerar visitas pendentes caso a lista esteja vazia ou faltem visitas para os clientes
  useEffect(() => {
    if (clients.length > 0 && visits.filter((v) => v.status !== 'Concluída').length === 0) {
      const generated: Visit[] = clients.map((cli, idx) => {
        const today = new Date();
        const scheduledDate = new Date(today.getTime() + (idx + 1) * 3 * 86400000);
        const day = String(scheduledDate.getDate()).padStart(2, '0');
        const month = String(scheduledDate.getMonth() + 1).padStart(2, '0');
        const year = scheduledDate.getFullYear();
        const dateFormatted = `${day}/${month}/${year}`;

        return {
          id: `VIS-${Math.floor(100000 + Math.random() * 900000)}`,
          clientId: cli.id,
          clientName: cli.name,
          scheduledDate: cli.nextVisitDate && cli.nextVisitDate !== 'A agendar' ? cli.nextVisitDate : dateFormatted,
          timeSlot: '14:00',
          reason: 'Conferência quinzenal de estoque e reposição de lançamentos 3D',
          productsOnSite: cli.productsOnSiteCount || 0,
          lastVisitText: cli.lastVisitDate || 'N/A',
          status: idx === 0 ? 'Hoje' : 'Em breve',
        };
      });

      setVisits((prev) => [...prev, ...generated]);
    }
  }, [clients]);

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

    const newVisit: Visit = {
      id: `VIS-${Math.floor(100000 + Math.random() * 900000)}`,
      clientId: client.id,
      clientName: client.name,
      scheduledDate: formattedDate,
      timeSlot: newVisitData.timeSlot || '14:00',
      reason: newVisitData.reason || 'Conferência e reposição presencial',
      productsOnSite: client.productsOnSiteCount || 0,
      lastVisitText: client.lastVisitDate || 'N/A',
      status: 'Em breve',
    };

    setVisits((prev) => [newVisit, ...prev]);

    setClients((prev) =>
      prev.map((c) => (c.id === client.id ? { ...c, nextVisitDate: formattedDate, visitStatus: 'Em breve' } : c))
    );

    showToast(`🗓️ Visita agendada para ${client.name} em ${formattedDate}!`, 'success');
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

    // Calcular proxima visita em +15 dias
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
            nextVisitDate: nextVisitStr,
            visitStatus: 'Em breve',
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
          type: 'Acerto Consignação (Visita)',
          amount: received,
          paymentMethod: method,
          status: 'Recebido',
          notes: visitData.paymentNotes || `Recebimento presencial de ${visitData.totalSoldUnits || 0} peças vendidas`,
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

      // Criar o proximo lembrete na agenda para a data da proxima visita (+15 dias)
      const nextPendingVisit: Visit = {
        id: `VIS-${Math.floor(100000 + Math.random() * 900000)}`,
        clientId: clientId,
        clientName: client.name,
        scheduledDate: nextVisitStr,
        timeSlot: '14:00',
        reason: 'Conferência periódica de expositor e nova reposição',
        productsOnSite: finalStock,
        lastVisitText: dateStr,
        status: 'Em breve',
      };

      return [nextPendingVisit, ...updated];
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
    handleCompleteVisit,
  };
}
