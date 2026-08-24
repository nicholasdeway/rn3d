import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Client, Consignment, ExchangeNote, Order, Product, Quote, Visit } from '../types';
import { safeSetLocalStorage, isSampleMockItem, getStorageParsed } from '../utils/storage';

import {
  fetchProducts,
  createProduct,
  updateProduct,
  syncMissingProductsToSupabase,
} from '../services/productsService';
import {
  fetchClients,
  createClient,
  updateClient,
  syncMissingClientsToSupabase,
} from '../services/clientsService';
import {
  fetchOrders,
  createOrder,
  updateOrderStatus,
  updateOrderProgress,
  syncMissingOrdersToSupabase,
  deleteOrder,
  updateOrderPayment,
} from '../services/ordersService';
import {
  fetchQuotes,
  createQuote,
  updateQuoteStatus,
  syncMissingQuotesToSupabase,
} from '../services/quotesService';

export function useAppData() {
  const { user } = useAuth();

  // Toast State
  const [toast, setToast] = useState<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({
      id: Date.now().toString(),
      message,
      type,
    });
  }, []);

  // Real Database State (Initialized with localStorage persistence & fallback)
  const [products, setProducts] = useState<Product[]>(() =>
    getStorageParsed<Product[]>('rn3d_products', [])
  );

  useEffect(() => {
    if (products) {
      const sanitizedProducts = products.map((p) => {
        if (p.imageUrl && (p.imageUrl.length > 300 || p.imageUrl.startsWith('data:image/'))) {
          return { ...p, imageUrl: '' };
        }
        return p;
      });
      safeSetLocalStorage('rn3d_products', JSON.stringify(sanitizedProducts));
    }
  }, [products]);

  const [clients, setClients] = useState<Client[]>(() =>
    getStorageParsed<Client[]>('rn3d_clients', [], true)
  );

  useEffect(() => {
    const sanitizedClients = clients.map((c) => {
      if (c.avatarUrl && c.avatarUrl.length > 500 && c.avatarUrl.startsWith('data:image/')) {
        return { ...c, avatarUrl: '' };
      }
      return c;
    });
    safeSetLocalStorage('rn3d_clients', JSON.stringify(sanitizedClients));
  }, [clients]);

  const [consignments, setConsignments] = useState<Consignment[]>(() =>
    getStorageParsed<Consignment[]>('rn3d_consignments', [], true)
  );

  useEffect(() => {
    safeSetLocalStorage('rn3d_consignments', JSON.stringify(consignments));
  }, [consignments]);

  const [visits, setVisits] = useState<Visit[]>(() =>
    getStorageParsed<Visit[]>('rn3d_visits', [], true)
  );

  useEffect(() => {
    safeSetLocalStorage('rn3d_visits', JSON.stringify(visits));
  }, [visits]);

  const [exchanges, setExchanges] = useState<ExchangeNote[]>(() =>
    getStorageParsed<ExchangeNote[]>('rn3d_exchanges', [], true)
  );

  useEffect(() => {
    safeSetLocalStorage('rn3d_exchanges', JSON.stringify(exchanges));
  }, [exchanges]);

  const [quotes, setQuotes] = useState<Quote[]>(() =>
    getStorageParsed<Quote[]>('rn3d_quotes', [], true)
  );

  useEffect(() => {
    safeSetLocalStorage('rn3d_quotes', JSON.stringify(quotes));
  }, [quotes]);

  const [orders, setOrders] = useState<Order[]>(() =>
    getStorageParsed<Order[]>('rn3d_orders', [], true)
  );

  useEffect(() => {
    safeSetLocalStorage('rn3d_orders', JSON.stringify(orders));
  }, [orders]);

  // Auto-sync: Ensure every converted or approved quote has a corresponding Order
  useEffect(() => {
    if (!quotes || quotes.length === 0) return;

    quotes.forEach((q) => {
      const isApprovedOrConverted =
        q.status === 'Convertido em Pedido' ||
        q.status === 'Convertido' ||
        q.status === 'Aprovado';

      if (isApprovedOrConverted) {
        setOrders((prevOrders) => {
          const exists = prevOrders.some(
            (o) =>
              o.timeline.some((t) => t.description?.includes(q.id) || t.title?.includes(q.id)) ||
              (o.clientName === q.clientName && Math.abs(o.totalValue - q.total) < 0.01)
          );

          if (!exists) {
            const newOrder: Order = {
              id: `PED-${Math.floor(Math.random() * 900000 + 100000)}`,
              clientId: q.clientId,
              clientName: q.clientName,
              date: q.date || new Date().toISOString().split('T')[0],
              itemsCount: q.items ? q.items.reduce((acc, i) => acc + i.quantity, 0) : 1,
              totalValue: q.total,
              paidAmount: 0.0,
              paymentStatusText: 'Aguardando Pagamento',
              status: 'Em produção',
              productionProgressPct: 15,
              productionSlaDate: q.date || new Date().toISOString().split('T')[0],
              estimatedDeliveryDate: q.date || new Date().toISOString().split('T')[0],
              internalLogisticsType: q.internalLogisticsType || 'combustivel',
              internalLogisticsCost: q.internalLogisticsCost ?? 0,
              notes: q.notes,
              paymentTerms: q.paymentTerms,
              items: (q.items || []).map((i) => ({
                productName: i.description,
                quantity: i.quantity,
                unitPrice: i.unitPrice || i.subtotal / (i.quantity || 1),
                subtotal: i.subtotal,
              })),
              timeline: [
                {
                  date: `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
                  title: `Orçamento ${q.id} Convertido em Pedido Oficial`,
                  description: `Origem: Orçamento ${q.id}`,
                },
                {
                  date: `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
                  title: 'Fila de Impressão 3D Iniciada',
                },
              ],
            };
            return [newOrder, ...prevOrders];
          }
          return prevOrders;
        });
      }
    });
  }, [quotes]);

  const [transactions, setTransactions] = useState<any[]>(() =>
    getStorageParsed<any[]>('rn3d_transactions', [], true)
  );

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

  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [dataLoading, setDataLoading] = useState<boolean>(false);

  // Fetch real data from Supabase PostgreSQL when authenticated
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    setDataLoading(true);

    const loadAllData = async () => {
      try {
        const [dbProducts, dbClients, dbOrders, dbQuotes] = await Promise.all([
          fetchProducts(),
          fetchClients(),
          fetchOrders(),
          fetchQuotes(),
        ]);
        if (!isMounted) return;
        setProducts(dbProducts);
        setClients(dbClients);
        setOrders(dbOrders);
        setQuotes(dbQuotes);
      } catch (err) {
        console.error('Erro ao carregar dados do Supabase:', err);
      } finally {
        if (isMounted) setDataLoading(false);
      }
    };

    loadAllData();

    // 100% Automatic Background Sync Loop every 12 seconds
    const intervalId = setInterval(async () => {
      if (!isMounted) return;
      try {
        const [dbProducts, dbClients, dbOrders, dbQuotes] = await Promise.all([
          fetchProducts(),
          fetchClients(),
          fetchOrders(),
          fetchQuotes(),
        ]);
        if (!isMounted) return;
        setProducts(dbProducts);
        setClients(dbClients);
        setOrders(dbOrders);
        setQuotes(dbQuotes);
      } catch (e) {
        // Silent background sync error
      }
    }, 12000);

    const handleFocus = () => {
      if (!isMounted) return;
      loadAllData();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  // Handlers
  const handleAddProduct = async (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
    showToast(`Produto "${newProd.name}" cadastrado com sucesso!`, 'success');
    try {
      const savedInDb = await createProduct(newProd);
      if (savedInDb && savedInDb.id) {
        setProducts((prev) =>
          prev.map((p) => (p.id === newProd.id ? { ...p, id: savedInDb.id } : p))
        );
      }
    } catch (err: any) {
      console.error('Erro ao salvar produto no Supabase:', err);
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    showToast(`Produto "${updatedProduct.name}" atualizado com sucesso!`, 'success');
    try {
      await updateProduct(updatedProduct.id, updatedProduct);
    } catch (err) {
      console.error('Erro ao atualizar produto no Supabase:', err);
    }
  };

  const handleSyncProductsToSupabase = async () => {
    try {
      showToast('Sincronizando todo o sistema com o Supabase (Produtos, Clientes, Pedidos e Orçamentos)...', 'info');
      const [pCount, cCount, oCount, qCount] = await Promise.all([
        syncMissingProductsToSupabase(products),
        syncMissingClientsToSupabase(clients),
        syncMissingOrdersToSupabase(orders),
        syncMissingQuotesToSupabase(quotes),
      ]);

      const [dbProds, dbClients, dbOrders, dbQuotes] = await Promise.all([
        fetchProducts(),
        fetchClients(),
        fetchOrders(),
        fetchQuotes(),
      ]);

      setProducts(dbProds);
      setClients(dbClients);
      setOrders(dbOrders);
      setQuotes(dbQuotes);

      const totalNew = pCount + cCount + oCount + qCount;
      if (totalNew > 0) {
        showToast(`✅ Sincronização concluída! (${pCount} prods, ${cCount} clientes, ${oCount} pedidos, ${qCount} orçamentos)`, 'success');
      } else {
        showToast('✅ Sistema 100% sincronizado com o Supabase!', 'success');
      }
    } catch (err: any) {
      showToast(`Erro na sincronização: ${err?.message || 'Falha ao conectar com Supabase'}`, 'error');
    }
  };

  const handleAddClient = async (newClient: Client) => {
    setClients((prev) => [newClient, ...prev]);
    showToast(`Cliente "${newClient.name}" cadastrado com sucesso!`, 'success');
    try {
      const savedInDb = await createClient(newClient);
      if (savedInDb && savedInDb.id) {
        setClients((prev) =>
          prev.map((c) => (c.id === newClient.id ? { ...c, id: savedInDb.id } : c))
        );
      }
    } catch (err) {
      console.error('Erro ao salvar cliente no Supabase:', err);
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    setClients((prev) => prev.map((c) => (c.id === updatedClient.id ? updatedClient : c)));
    showToast(`Cadastro do cliente "${updatedClient.name}" atualizado com sucesso!`, 'success');
    try {
      await updateClient(updatedClient.id, updatedClient);
    } catch (err) {
      console.error('Erro ao atualizar cliente no Supabase:', err);
    }
  };

  const handleAddConsignment = (newConsignment: Consignment) => {
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
  };

  const handleCreateQuote = async (newQuote: Quote) => {
    setQuotes((prev) => [newQuote, ...prev]);
    showToast(`Orçamento ${newQuote.id} criado com sucesso!`, 'success');
    try {
      await createQuote(newQuote);
    } catch (err) {
      console.error('Erro ao salvar orçamento no Supabase:', err);
    }
  };

  const handleUpdateQuoteStatus = async (quoteId: string, newStatus: string) => {
    setQuotes((prev) =>
      prev.map((q) => (q.id === quoteId ? { ...q, status: newStatus as any } : q))
    );
    showToast(`Status do orçamento ${quoteId} atualizado para "${newStatus}"!`, 'info');
    try {
      await updateQuoteStatus(quoteId, newStatus);
    } catch (err) {
      console.error('Erro ao atualizar status do orçamento no Supabase:', err);
    }
  };

  const handleCreateOrder = async (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    showToast(`Pedido ${newOrder.id} criado com sucesso!`, 'success');
    try {
      await createOrder(newOrder);
    } catch (err) {
      console.error('Erro ao salvar pedido no Supabase:', err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    showToast(`Pedido ${orderId} excluído com sucesso!`, 'info');
    try {
      await deleteOrder(orderId);
    } catch (err) {
      console.error('Erro ao excluir pedido no Supabase:', err);
    }
  };

  const handleUpdateOrderProgress = async (orderId: string, newProgress: number) => {
    let finalStatus = '';
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const autoStatus = newProgress >= 100 ? 'Concluído' : 'Em produção';
          finalStatus = autoStatus;
          return {
            ...o,
            productionProgressPct: newProgress,
            status: autoStatus,
          };
        }
        return o;
      })
    );
    showToast(`Progresso do Pedido ${orderId} atualizado para ${newProgress}%`, 'info');
    try {
      await updateOrderProgress(orderId, newProgress, finalStatus);
    } catch (err) {
      console.error('Erro ao atualizar progresso no Supabase:', err);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    let targetOrder: Order | undefined;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated = {
            ...o,
            status: newStatus,
            timeline: [
              {
                date: `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
                title: `Status alterado para: ${newStatus}`,
              },
              ...o.timeline,
            ],
          };
          targetOrder = updated;
          return updated;
        }
        return o;
      })
    );

    if (newStatus === 'Entregue' && targetOrder) {
      const modeText = targetOrder.paidAmount >= targetOrder.totalValue ? 'Pago' : 'Faturado / Pendente';
      const formattedDate = new Date().toLocaleDateString('pt-BR');
      const formattedTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const deliveryVisit: Visit = {
        id: `VIS-${Math.floor(100000 + Math.random() * 900000)}`,
        clientId: targetOrder.clientId,
        clientName: targetOrder.clientName,
        scheduledDate: formattedDate,
        timeSlot: formattedTime,
        reason: `Entrega do Pedido ${targetOrder.id} (${modeText})`,
        productsOnSite: targetOrder.itemsCount,
        lastVisitText: `${formattedDate} às ${formattedTime}`,
        status: 'Concluída',
        completedAt: `${formattedDate} ${formattedTime}`,
        completedSummary: {
          durationMinutes: 15,
          itemsSold: targetOrder.itemsCount,
          totalRevenue: targetOrder.totalValue,
          receivedAmount: targetOrder.paidAmount,
          itemsRemoved: 0,
          itemsAdded: targetOrder.itemsCount,
          finalStockCount: targetOrder.itemsCount,
          nextVisitDate: 'N/A',
        },
      };

      setVisits((prev) => [deliveryVisit, ...prev]);
      showToast(`📍 Registro de Visita/Entrega gravado em ${formattedDate} às ${formattedTime}!`, 'success');
    } else {
      showToast(`Status do Pedido ${orderId} alterado para "${newStatus}"!`, 'info');
    }

    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (err) {
      console.error('Erro ao atualizar status no Supabase:', err);
    }
  };

  const handleUpdateOrderPayment = async (orderId: string, additionalAmount: number) => {
    let finalPaidAmount = 0;
    let finalPaymentStatus = 'Aguardando Pagamento';

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const currentPaid = o.paidAmount || 0;
          const newPaidAmount = Math.min(o.totalValue, currentPaid + additionalAmount);
          const isFullyPaid = newPaidAmount >= o.totalValue;
          const pct = Math.round((newPaidAmount / o.totalValue) * 100);
          const newPaymentStatus = isFullyPaid ? 'Totalmente Pago' : `${pct}% Recebido`;

          finalPaidAmount = newPaidAmount;
          finalPaymentStatus = newPaymentStatus;

          return {
            ...o,
            paidAmount: newPaidAmount,
            paymentStatusText: newPaymentStatus,
            timeline: [
              {
                date: `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
                title: `Entrada em Caixa Registrada: R$ ${additionalAmount.toFixed(2).replace('.', ',')}`,
                description: `Status de Pagamento: ${newPaymentStatus}`,
              },
              ...o.timeline,
            ],
          };
        }
        return o;
      })
    );

    const orderObj = orders.find((o) => o.id === orderId);
    if (orderObj) {
      setTransactions((prev) => [
        {
          id: `PAG-${Math.floor(Math.random() * 9000 + 1000)}`,
          clientName: orderObj.clientName,
          date: new Date().toLocaleDateString('pt-BR'),
          type: 'Recebimento de Pedido',
          amount: additionalAmount,
          paymentMethod: 'PIX',
          status: 'Recebido',
          notes: `Entrada parcial/total referente ao Pedido ${orderId}`,
        },
        ...prev,
      ]);
    }

    showToast(`Recebimento de R$ ${additionalAmount.toFixed(2).replace('.', ',')} registrado com sucesso! Dashboard e Caixa atualizados.`, 'success');

    try {
      await updateOrderPayment(orderId, finalPaidAmount, finalPaymentStatus);
    } catch (err) {
      console.error('Erro ao atualizar pagamento no Supabase:', err);
    }
  };

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
        responsible: 'Nicholas RN 3D',
        responsibleName: 'Nicholas RN 3D',
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

    setVisits((prev) =>
      prev.map((v) => {
        if (v.clientId === clientId && v.status !== 'Concluída') {
          return {
            ...v,
            status: 'Concluída',
            productsOnSite: finalStock,
            lastVisitText: `${dateStr} às ${timeStr}`,
          };
        }
        return v;
      })
    );

    showToast(
      `📍 Visita ${visitId} concluída! Estoque do cliente, Vendas e Recebimento de R$ ${received.toFixed(
        2
      )} atualizados!`,
      'success'
    );
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.productId === productId || p.id === productId ? { ...p, currentStock: newStock } : p))
    );
    showToast('Saldo de estoque ajustado com sucesso!', 'success');
  };

  return {
    products,
    clients,
    consignments,
    visits,
    exchanges,
    quotes,
    orders,
    transactions,
    movements,
    clientInventories,
    globalSearchQuery,
    dataLoading,
    toast,
    setToast,
    setGlobalSearchQuery,
    showToast,
    handleAddProduct,
    handleUpdateProduct,
    handleSyncProductsToSupabase,
    handleUpdateStock,
    handleAddClient,
    handleUpdateClient,
    handleAddConsignment,
    handleCreateQuote,
    handleUpdateQuoteStatus,
    handleCreateOrder,
    handleDeleteOrder,
    handleUpdateOrderProgress,
    handleUpdateOrderStatus,
    handleUpdateOrderPayment,
    handleExecuteExchange,
    handleCompleteVisit,
  };
}
