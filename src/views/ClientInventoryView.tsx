import React, { useState, useMemo } from 'react';
import { Client, ClientInventoryItem, Consignment, ExchangeNote, Visit } from '../types';
import { formatDateBR, parseBRDate } from '../utils/formatters';
import {
  Store,
  ChevronDown,
  ChevronUp,
  Boxes,
  DollarSign,
  MapPin,
  Repeat,
  ChevronsDown,
  ChevronsUp,
  History,
  ArrowDownRight,
  Package,
} from 'lucide-react';
import { ImageLightboxModal } from '../components/ImageLightboxModal';

interface ClientInventoryViewProps {
  clients: Client[];
  clientInventories: Record<string, ClientInventoryItem[]>;
  consignments?: Consignment[];
  exchanges?: ExchangeNote[];
  visits?: Visit[];
  onNavigateToExchanges?: (clientId: string) => void;
}

export const ClientInventoryView: React.FC<ClientInventoryViewProps> = ({
  clients,
  clientInventories,
  consignments = [],
  exchanges = [],
  visits = [],
  onNavigateToExchanges,
}) => {
  const [expandedClientState, setExpandedClientState] = useState<Record<string, boolean>>({});
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);

  const handleExpandAll = () => {
    const nextState: Record<string, boolean> = {};
    clients.forEach((c) => {
      nextState[c.id] = true;
    });
    setExpandedClientState(nextState);
  };

  const handleCollapseAll = () => {
    setExpandedClientState({});
  };

  const toggleClientExpand = (clientId: string) => {
    setExpandedClientState((prev) => ({
      ...prev,
      [clientId]: !prev[clientId],
    }));
  };

  // Helper to reconcile items and audit history for any client across all consignments & exchanges
  const getReconciledClientData = (cli: Client) => {
    const itemMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        sku: string;
        sentQuantity: number;
        removedQuantity: number;
        unitPrice: number;
      }
    >();

    // 1. Accumulate items from ALL active consignments for this client
    consignments.forEach((cons) => {
      const matchesClient =
        (cons.clientId && cons.clientId === cli.id) ||
        (cons.clientName && cons.clientName.toLowerCase().trim() === cli.name.toLowerCase().trim());

      if (matchesClient && cons.items) {
        cons.items.forEach((cItem) => {
          const key = (cItem.productName || '').toLowerCase().trim();
          if (!key) return;

          if (itemMap.has(key)) {
            const existing = itemMap.get(key)!;
            existing.sentQuantity += cItem.quantity;
          } else {
            itemMap.set(key, {
              productId: cItem.productId || `prod-${Math.random().toString(36).substring(2, 8)}`,
              productName: cItem.productName,
              sku: cItem.sku || '',
              sentQuantity: cItem.quantity,
              removedQuantity: 0,
              unitPrice: cItem.unitPrice || 6.0,
            });
          }
        });
      }
    });

    // 2. Accumulate items removed in previous exchanges/remanejamentos for this client
    const clientExchanges = exchanges.filter(
      (e) =>
        (e.clientId && cli.id && e.clientId === cli.id) ||
        (e.clientName && cli.name && e.clientName.toLowerCase().trim() === cli.name.toLowerCase().trim())
    );

    const removedAuditLogs: {
      exchangeId: string;
      date: string;
      type: string;
      destinationName: string;
      items: { productName: string; quantity: number; reason?: string }[];
    }[] = [];

    clientExchanges.forEach((ex) => {
      const exItems: { productName: string; quantity: number; reason?: string }[] = [];

      (ex.itemsRemoved || []).forEach((remItem) => {
        const qty = Number(remItem.quantity) || 0;
        if (qty <= 0) return;

        const key = (remItem.productName || '').toLowerCase().trim();
        if (key && itemMap.has(key)) {
          const existing = itemMap.get(key)!;
          existing.removedQuantity += qty;
        }

        exItems.push({
          productName: remItem.productName || 'Produto Consignado',
          quantity: qty,
          reason: remItem.reason || ex.notes,
        });
      });

      if (exItems.length > 0) {
        removedAuditLogs.push({
          exchangeId: ex.id,
          date: ex.date || (ex as any).created_at || (ex as any).createdAt || '',
          type: ex.type === 'recolhimento_oficina' ? 'Recolhimento p/ Oficina' : 'Remanejo entre Clientes',
          destinationName: ex.destinationClientName || 'Oficina RN 3D',
          items: exItems,
        });
      }
    });

    // 3. Fallback to clientInventories state if no consignments exist in system
    if (itemMap.size === 0 && consignments.length === 0) {
      const invFromState = clientInventories[cli.id] || [];
      invFromState.forEach((item) => {
        const key = (item.productName || '').toLowerCase().trim();
        const qty = item.quantityOnSite ?? item.currentQuantity ?? 0;
        if (qty > 0 && key) {
          itemMap.set(key, {
            productId: item.productId,
            productName: item.productName,
            sku: item.sku || '',
            sentQuantity: item.sentQuantity ?? qty,
            removedQuantity: 0,
            unitPrice: item.unitPrice || 6.0,
          });
        }
      });
    }

    // Build net store items
    const items: ClientInventoryItem[] = Array.from(itemMap.values())
      .map((entry) => {
        const netQty = Math.max(0, entry.sentQuantity - entry.removedQuantity);
        return {
          productId: entry.productId,
          productName: entry.productName,
          sku: entry.sku,
          sentQuantity: entry.sentQuantity,
          soldQuantity: entry.removedQuantity,
          currentQuantity: netQty,
          quantityOnSite: netQty,
          unitPrice: entry.unitPrice,
          valuation: netQty * entry.unitPrice,
          daysOnSite: 0,
          status: 'Normal' as const,
        };
      })
      .filter((item) => item.quantityOnSite > 0 || item.sentQuantity > 0 || item.soldQuantity > 0);

    const totalQty = items.reduce((acc, i) => acc + i.quantityOnSite, 0);
    const totalValuation = items.reduce((acc, i) => acc + i.valuation, 0);

    // 4. Calculate latest audit date dynamically across client visits, exchanges, consignments, and lastVisitDate
    let latestDate: Date | null = parseBRDate(cli.lastVisitDate);
    let latestStr: string = cli.lastVisitDate || 'N/A';

    consignments.forEach((c) => {
      if (c.clientId === cli.id || (c.clientName && c.clientName.toLowerCase().trim() === cli.name.toLowerCase().trim())) {
        const d = parseBRDate(c.lastAuditDate || c.date);
        if (d && (!latestDate || d.getTime() > latestDate.getTime())) {
          latestDate = d;
          latestStr = c.lastAuditDate || c.date;
        }
      }
    });

    clientExchanges.forEach((ex) => {
      const rawDate = ex.date || (ex as any).created_at || (ex as any).createdAt;
      const d = parseBRDate(rawDate);
      if (d && (!latestDate || d.getTime() > latestDate.getTime())) {
        latestDate = d;
        latestStr = rawDate;
      }
    });

    const clientVisits = visits.filter(
      (v) =>
        (v.clientId && cli.id && v.clientId === cli.id) ||
        (v.clientName && cli.name && v.clientName.toLowerCase().trim() === cli.name.toLowerCase().trim())
    );
    clientVisits.forEach((v) => {
      const rawVDate = v.completedAt || v.lastVisitText || v.scheduledDate;
      const d = parseBRDate(rawVDate);
      if (d && (!latestDate || d.getTime() > latestDate.getTime())) {
        latestDate = d;
        latestStr = rawVDate;
      }
    });

    return {
      items,
      totalQty,
      totalValuation,
      removedAuditLogs,
      latestAuditDate: latestStr,
    };
  };

  // Sort clients by largest product quantity descending
  const sortedClientsData = useMemo(() => {
    return clients
      .map((cli) => {
        const data = getReconciledClientData(cli);
        return {
          client: cli,
          data,
        };
      })
      .sort((a, b) => {
        if (b.data.totalQty !== a.data.totalQty) {
          return b.data.totalQty - a.data.totalQty;
        }
        if (b.data.totalValuation !== a.data.totalValuation) {
          return b.data.totalValuation - a.data.totalValuation;
        }
        return a.client.name.localeCompare(b.client.name);
      });
  }, [clients, consignments, exchanges, visits, clientInventories]);

  // Overall KPI totals across all clients
  const totalProductsConsigned = useMemo(() => {
    return sortedClientsData.reduce((acc, item) => acc + item.data.totalQty, 0);
  }, [sortedClientsData]);

  const totalValuationAll = useMemo(() => {
    return sortedClientsData.reduce((acc, item) => acc + item.data.totalValuation, 0);
  }, [sortedClientsData]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Modal Zoom da Foto / Logo do Cliente */}
      {zoomImage && (
        <ImageLightboxModal
          imageUrl={zoomImage.url}
          title={zoomImage.title}
          onClose={() => setZoomImage(null)}
        />
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Store className="w-6 h-6 text-indigo-600" />
            Estoque Alocado em Clientes
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Mapeamento em tempo real de onde suas mercadorias em consignação estão alocadas (ordenado por maior estoque).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExpandAll}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs border border-indigo-100"
            title="Expandir a visualização de todos os estabelecimentos"
          >
            <ChevronsDown className="w-4 h-4 text-indigo-600" />
            <span>Expandir Todos</span>
          </button>
          <button
            onClick={handleCollapseAll}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs border border-slate-200"
            title="Recolher a visualização de todos os estabelecimentos"
          >
            <ChevronsUp className="w-4 h-4 text-slate-500" />
            <span>Recolher Todos</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Definance Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="definance-kpi-card bg-white dark:bg-[#12151c] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs hover:border-indigo-500/40 dark:hover:border-indigo-500/40 cursor-pointer">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
              Total Consignado
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
              <Boxes className="w-4 h-4 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 sm:mt-3 tracking-tight truncate">
            {totalProductsConsigned} <span className="text-xs sm:text-sm font-bold text-slate-400">produtos</span>
          </p>
        </div>

        <div className="definance-kpi-card bg-white dark:bg-[#12151c] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs hover:border-emerald-500/40 dark:hover:border-emerald-500/40 cursor-pointer">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
              Valor de Venda Alocado
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
              <DollarSign className="w-4 h-4 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 sm:mt-3 tracking-tight truncate">
            R$ {totalValuationAll.toFixed(2).replace('.', ',')}
          </p>
        </div>

        <div className="definance-kpi-card bg-white dark:bg-[#12151c] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs hover:border-purple-500/40 dark:hover:border-purple-500/40 cursor-pointer col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
              Estabelecimentos Ativos
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
              <MapPin className="w-4 h-4 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 sm:mt-3 tracking-tight truncate">
            {clients.length} <span className="text-xs sm:text-sm font-bold text-slate-400">parceiros</span>
          </p>
        </div>
      </div>

      {/* Client Consignment Accordion List (Sorted by largest quantity) */}
      <div className="space-y-4">
        {sortedClientsData.map(({ client: cli, data }, index) => {
          const isExpanded = !!expandedClientState[cli.id];
          const itemsAtStore = data.items;
          const storeProductsCount = data.totalQty;
          const storeValuation = data.totalValuation;

          return (
            <div
              key={cli.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all"
            >
              <div
                onClick={() => toggleClientExpand(cli.id)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    onClick={(e) => {
                      if (cli.avatarUrl) {
                        e.stopPropagation();
                        setZoomImage({ url: cli.avatarUrl, title: cli.name });
                      }
                    }}
                    className={`w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0 border border-indigo-100 overflow-hidden ${
                      cli.avatarUrl ? 'cursor-zoom-in hover:scale-105 transition-transform' : ''
                    }`}
                    title={cli.avatarUrl ? 'Clique para ampliar a foto' : undefined}
                  >
                    {cli.avatarUrl ? (
                      <img src={cli.avatarUrl} alt={cli.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{cli.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{cli.name}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                        #{index + 1} em estoque
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {cli.city} • Última conferência: <span className="font-semibold text-slate-700">{formatDateBR(data.latestAuditDate)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {onNavigateToExchanges && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToExchanges(cli.id);
                      }}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                      title="Migrar/Remanejar estoque desta loja para outra"
                    >
                      <Repeat className="w-3.5 h-3.5" />
                      <span>Remanejar Estoque</span>
                    </button>
                  )}

                  <div className="text-right text-xs">
                    <span className="font-bold text-slate-900 block">
                      {storeProductsCount} {storeProductsCount === 1 ? 'produto' : 'produtos'}
                    </span>
                    <span className="font-semibold text-emerald-600">
                      R$ {storeValuation.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="p-5 bg-slate-50 border-t border-slate-100 space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-indigo-600" />
                        Estoque Atual no Estabelecimento ({cli.name}):
                      </h4>
                      {onNavigateToExchanges && itemsAtStore.length > 0 && (
                        <button
                          onClick={() => onNavigateToExchanges(cli.id)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1"
                        >
                          <Repeat className="w-3.5 h-3.5" /> Migrar peças desta loja ➔
                        </button>
                      )}
                    </div>

                    {itemsAtStore.length === 0 ? (
                      <p className="text-xs text-slate-400 italic bg-white p-4 rounded-xl border border-slate-200">Nenhum produto alocado nesta loja no momento.</p>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider">
                            <tr>
                              <th className="p-3">Produto</th>
                              <th className="p-3 text-center">Enviado Inicial</th>
                              <th className="p-3 text-center">Remanejado / Recolhido</th>
                              <th className="p-3 text-center">Estoque Atual</th>
                              <th className="p-3 text-right">Preço Unit.</th>
                              <th className="p-3 text-right">Valoração Atual</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {itemsAtStore.map((item) => {
                              const qty = item.quantityOnSite;
                              const sent = item.sentQuantity;
                              const removed = item.soldQuantity || 0;
                              return (
                                <tr key={item.productId} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-3 font-bold text-slate-900">{item.productName}</td>
                                  <td className="p-3 text-center text-slate-600 font-medium">{sent} un</td>
                                  <td className="p-3 text-center text-amber-700 font-semibold">
                                    {removed > 0 ? `-${removed} un` : '0 un'}
                                  </td>
                                  <td className="p-3 text-center font-black text-indigo-700 text-sm bg-indigo-50/50">
                                    {qty} un
                                  </td>
                                  <td className="p-3 text-right text-slate-600">R$ {item.unitPrice.toFixed(2).replace('.', ',')}</td>
                                  <td className="p-3 text-right font-extrabold text-emerald-600 text-sm">
                                    R$ {item.valuation.toFixed(2).replace('.', ',')}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Histórico Auditado de Retiradas & Remanejamentos (igual PDF de Consignações) */}
                  {data.removedAuditLogs.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/60 space-y-3">
                      <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                        <History className="w-4 h-4 text-amber-600" />
                        Histórico de Retiradas & Remanejamentos Auditados ({cli.name})
                      </h4>

                      <div className="space-y-2.5">
                        {data.removedAuditLogs.map((log) => (
                          <div
                            key={log.exchangeId}
                            className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-3 text-xs space-y-2"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-amber-200/60">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                                  {log.exchangeId}
                                </span>
                                <span className="font-semibold text-slate-800">
                                  {formatDateBR(log.date)}
                                </span>
                              </div>
                              <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                                <ArrowDownRight className="w-3.5 h-3.5 text-amber-600" />
                                {log.type} ➔ <span className="text-slate-900 font-extrabold">{log.destinationName}</span>
                              </span>
                            </div>

                            <ul className="list-disc pl-5 space-y-1 text-slate-700">
                              {log.items.map((item, idx) => (
                                <li key={idx} className="font-medium">
                                  <strong className="text-amber-900 font-bold">{item.quantity}x</strong> {item.productName}
                                  {item.reason && <span className="text-slate-500 text-[11px]"> ({item.reason})</span>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
