import React, { useState } from 'react';
import { ExchangeNote, Client, ClientInventoryItem, Product } from '../types';
import {
  Repeat,
  Printer,
  X,
  Plus,
  Store,
  Boxes,
  AlertTriangle,
  Building2,
  RotateCcw,
  Check,
} from 'lucide-react';

interface ExchangesViewProps {
  exchanges: ExchangeNote[];
  clients?: Client[];
  clientInventories?: Record<string, ClientInventoryItem[]>;
  products?: Product[];
  onExecuteExchange?: (newExchange: ExchangeNote) => void;
  preselectedClientId?: string;
}

export const ExchangesView: React.FC<ExchangesViewProps> = ({
  exchanges,
  clients = [],
  clientInventories = {},
  products = [],
  onExecuteExchange,
  preselectedClientId,
}) => {
  const [selectedExchange, setSelectedExchange] = useState<ExchangeNote | null>(exchanges[0] || null);

  // Wizard state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [sourceClientId, setSourceClientId] = useState<string>(preselectedClientId || clients[0]?.id || '');
  const [destinationType, setDestinationType] = useState<'migracao_lojas' | 'recolhimento_oficina'>('migracao_lojas');
  const [destinationClientId, setDestinationClientId] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [exchangeReason, setExchangeReason] = useState<string>('Baixo giro / Peças encalhadas no expositor');
  const [responsibleName, setResponsibleName] = useState<string>('Nicholas RN 3D');

  const sourceClient = clients.find((c) => c.id === sourceClientId);
  const sourceInventory = sourceClientId ? clientInventories[sourceClientId] || [] : [];
  const availableDestinationClients = clients.filter((c) => c.id !== sourceClientId);

  // Initialize wizard with preselected client if provided
  React.useEffect(() => {
    if (preselectedClientId && clients.some((c) => c.id === preselectedClientId)) {
      setSourceClientId(preselectedClientId);
      setIsWizardOpen(true);
    }
  }, [preselectedClientId, clients]);

  // Set default destination client when source changes
  React.useEffect(() => {
    if (availableDestinationClients.length > 0 && !destinationClientId) {
      setDestinationClientId(availableDestinationClients[0].id);
    }
  }, [sourceClientId, clients]);

  const handleToggleItemQuantity = (productId: string, maxQty: number, qty: number) => {
    const validQty = Math.max(0, Math.min(maxQty, qty));
    setSelectedItems((prev) => {
      if (validQty === 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: validQty };
    });
  };

  const handleOpenWizardForClient = (cliId: string) => {
    setSourceClientId(cliId);
    const dest = clients.find((c) => c.id !== cliId);
    if (dest) setDestinationClientId(dest.id);
    setSelectedItems({});
    setIsWizardOpen(true);
  };

  const handleSubmitExchange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceClient) return;

    const itemsRemoved = Object.entries(selectedItems)
      .filter(([_, qty]) => qty > 0)
      .map(([prodId, qty]) => {
        const invItem = sourceInventory.find((i) => i.productId === prodId);
        const prod = products.find((p) => p.id === prodId);
        return {
          productId: prodId,
          productName: invItem?.productName || prod?.name || 'Produto Consignado',
          quantity: qty,
          reason: exchangeReason,
        };
      });

    if (itemsRemoved.length === 0) {
      alert('Selecione pelo menos 1 produto e a quantidade a ser recolhida/trocada.');
      return;
    }

    const destClient = clients.find((c) => c.id === destinationClientId);

    const newExchange: ExchangeNote = {
      id: `TRC-${Math.floor(Math.random() * 900000 + 100000)}`,
      clientId: sourceClient.id,
      clientName: sourceClient.name,
      destinationClientId: destinationType === 'migracao_lojas' ? destClient?.id : 'OFFICE',
      destinationClientName: destinationType === 'migracao_lojas' ? destClient?.name : 'Estoque Geral (Oficina RN 3D)',
      type: destinationType,
      date: new Date().toLocaleDateString('pt-BR'),
      responsible: responsibleName,
      itemsRemoved,
      itemsAdded: destinationType === 'migracao_lojas' ? itemsRemoved.map((i) => ({ productId: i.productId, productName: i.productName, quantity: i.quantity })) : [],
      notes: exchangeReason,
    };

    if (onExecuteExchange) {
      onExecuteExchange(newExchange);
    }

    setSelectedExchange(newExchange);
    setIsWizardOpen(false);
    setSelectedItems({});
  };

  // Identify clients with stagnant inventory
  const stagnantAlerts = clients.map((cli) => {
    const inv = clientInventories[cli.id] || [];
    const stagnantItems = inv.filter((item) => item.daysOnSite >= 30 || item.status === 'Alerta (Sem Giro)');
    const totalStagnantQty = stagnantItems.reduce((acc, i) => acc + i.quantityOnSite, 0);
    const totalStagnantVal = stagnantItems.reduce((acc, i) => acc + i.valuation, 0);
    return {
      client: cli,
      stagnantItems,
      totalStagnantQty,
      totalStagnantVal,
    };
  }).filter((alert) => alert.totalStagnantQty > 0 || alert.client.productsOnSiteCount > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Repeat className="w-6 h-6 text-indigo-600" />
            Histórico & Central de Trocas de Produtos
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Remanejamento de itens encalhados entre lojas parceiras e recolhimento de estoque com baixo giro.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedItems({});
            setIsWizardOpen(true);
          }}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Troca / Migração entre Lojas</span>
        </button>
      </div>

      {/* Smart Alert Banner: Encalhados nos Clientes */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent p-5 rounded-2xl border border-amber-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-700 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Alerta de Remanejamento & Giro de Estoque</h3>
              <p className="text-xs text-slate-600">
                Lojas com produtos alocados sem vendas. Faça o trade de produtos para evitar encalhe no expositor!
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stagnantAlerts.map((st) => (
            <div
              key={st.client.id}
              className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between gap-3 hover:border-indigo-300 transition-colors"
            >
              <div className="min-w-0">
                <h4 className="font-bold text-slate-900 text-xs truncate">{st.client.name}</h4>
                <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
                  {st.client.productsOnSiteCount} produtos alocados ({st.totalStagnantQty > 0 ? `${st.totalStagnantQty} un encalhadas` : 'Giro normal'})
                </p>
              </div>
              <button
                onClick={() => handleOpenWizardForClient(st.client.id)}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg font-bold text-xs shrink-0 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Repeat className="w-3.5 h-3.5" /> Remanejar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Exchanges History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Registro de Notas de Troca & Remanejamento</h3>
          <span className="text-xs text-slate-400 font-medium">{exchanges.length} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">Nota / ID</th>
                <th className="p-4">Loja Origem (Retirado)</th>
                <th className="p-4">Destino (Alocado / Oficina)</th>
                <th className="p-4">Data</th>
                <th className="p-4 text-center">Itens Remanejados</th>
                <th className="p-4">Responsável</th>
                <th className="p-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {exchanges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Nenhuma troca ou migração de estoque registrada ainda. Clique em "Nova Troca / Migração entre Lojas" para realizar um remanejamento.
                  </td>
                </tr>
              ) : (
                exchanges.map((ex) => {
                  const totalRem = ex.itemsRemoved.reduce((acc, i) => acc + i.quantity, 0);

                  return (
                    <tr
                      key={ex.id}
                      onClick={() => setSelectedExchange(ex)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="p-4 font-mono font-bold text-indigo-600">{ex.id}</td>
                      <td className="p-4 font-bold text-slate-900">{ex.clientName}</td>
                      <td className="p-4 font-bold text-slate-700">
                        {ex.destinationClientName || (ex.type === 'recolhimento_oficina' ? 'Estoque Geral (Oficina)' : 'Troca Direta')}
                      </td>
                      <td className="p-4 text-slate-600">{ex.date}</td>
                      <td className="p-4 text-center font-extrabold text-indigo-600 bg-indigo-50/50 rounded-lg">
                        {totalRem} un
                      </td>
                      <td className="p-4 font-medium text-slate-700">{ex.responsible}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedExchange(ex);
                          }}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-semibold cursor-pointer"
                        >
                          Ver Comprovante PDF
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🚀 WIZARD MODAL: Nova Troca / Migração entre Lojas */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-2 sm:p-4 md:p-6">
          <div className="bg-white w-full max-w-[96vw] xl:max-w-7xl rounded-2xl border border-slate-300 overflow-hidden max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <Repeat className="w-6 h-6 text-indigo-600" />
                Wizard de Troca & Migração de Estoque Consignado
              </h3>
              <button
                type="button"
                onClick={() => setIsWizardOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 text-slate-600 cursor-pointer transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitExchange} className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs flex-1">
              {/* Step 1: Select Source Store (Loja A) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="block font-bold text-slate-800 text-xs mb-1.5 flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-indigo-600" />
                    1. Loja Origem (De onde as peças serão retiradas / Loja A) *
                  </label>
                  <select
                    value={sourceClientId}
                    onChange={(e) => {
                      setSourceClientId(e.target.value);
                      setSelectedItems({});
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {clients.map((cli) => (
                      <option key={cli.id} value={cli.id}>
                        {cli.name} ({cli.city} - {cli.productsOnSiteCount} un alocadas)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 2: Destination Choice */}
                <div>
                  <label className="block font-bold text-slate-800 text-xs mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    2. Destino do Remanejamento / Trade *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setDestinationType('migracao_lojas')}
                      className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        destinationType === 'migracao_lojas'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Store className="w-4 h-4 text-indigo-300" />
                      <span>🏬 Migrar para Outra Loja (Loja B)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDestinationType('recolhimento_oficina')}
                      className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        destinationType === 'recolhimento_oficina'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <RotateCcw className="w-4 h-4 text-emerald-300" />
                      <span>🏭 Recolher para Oficina</span>
                    </button>
                  </div>

                  {destinationType === 'migracao_lojas' && (
                    <select
                      value={destinationClientId}
                      onChange={(e) => setDestinationClientId(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs"
                    >
                      {availableDestinationClients.map((cli) => (
                        <option key={cli.id} value={cli.id}>
                          {cli.name} ({cli.city})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Step 3: Select Products to Migrate */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-indigo-600" />
                    <span>3. Produtos Alocados na Loja Origem — Selecione os itens e a quantidade a recolher/migrar:</span>
                  </h4>
                </div>

                {sourceInventory.length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400 space-y-1">
                    <p className="text-xs font-bold text-slate-700">Nenhum produto alocado nesta loja no momento.</p>
                    <p className="text-[11px]">Selecione outro estabelecimento de origem que possua produtos no expositor.</p>
                  </div>
                ) : (
                  <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                        <tr>
                          <th className="p-3.5">Produto Alocado</th>
                          <th className="p-3.5 text-center">Dias no Local</th>
                          <th className="p-3.5 text-center">Status Giro</th>
                          <th className="p-3.5 text-center">Disponível</th>
                          <th className="p-3.5 text-center w-36">Quantidade a Retirar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {sourceInventory.map((item) => {
                          const currentSelectedQty = selectedItems[item.productId] || 0;
                          return (
                            <tr key={item.productId} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3.5 font-bold text-slate-900">
                                {item.productName}
                                <span className="block text-[11px] text-slate-400 font-normal font-mono">
                                  R$ {item.unitPrice.toFixed(2).replace('.', ',')} / un
                                </span>
                              </td>
                              <td className="p-3.5 text-center text-slate-600 font-mono">
                                {item.daysOnSite} dias
                              </td>
                              <td className="p-3.5 text-center">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                                    item.daysOnSite >= 30 || item.status === 'Alerta (Sem Giro)'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {item.daysOnSite >= 30 ? 'Parado (Sem Giro)' : item.status}
                                </span>
                              </td>
                              <td className="p-3.5 text-center font-bold text-slate-900">
                                {item.quantityOnSite} un
                              </td>
                              <td className="p-3.5 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <input
                                    type="number"
                                    min="0"
                                    max={item.quantityOnSite}
                                    value={currentSelectedQty}
                                    onChange={(e) =>
                                      handleToggleItemQuantity(
                                        item.productId,
                                        item.quantityOnSite,
                                        Number(e.target.value)
                                      )
                                    }
                                    className="w-20 text-center px-2 py-1.5 border border-slate-300 rounded-xl font-bold bg-white focus:ring-2 focus:ring-indigo-500/20"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleItemQuantity(
                                        item.productId,
                                        item.quantityOnSite,
                                        item.quantityOnSite
                                      )
                                    }
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                  >
                                    Tudo
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Step 4: Reasons & Summary */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2 space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Motivo do Remanejamento / Troca</label>
                    <input
                      type="text"
                      value={exchangeReason}
                      onChange={(e) => setExchangeReason(e.target.value)}
                      placeholder="Ex: Peças encalhadas no expositor da Loja A migrando para ponto de alto fluxo..."
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-white text-xs text-slate-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Responsável pela Operação</label>
                    <input
                      type="text"
                      value={responsibleName}
                      onChange={(e) => setResponsibleName(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-white text-xs text-slate-900 font-medium"
                    />
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 text-right">
                  <span className="text-xs text-slate-400 font-semibold block">Total de Peças em Troca:</span>
                  <span className="text-2xl font-black text-indigo-600 block">
                    {Object.values(selectedItems).reduce((acc, qty) => acc + qty, 0)} unidades
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium block">
                    {destinationType === 'migracao_lojas' ? 'Destino: Loja Parceira' : 'Destino: Oficina Central'}
                  </span>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={Object.values(selectedItems).reduce((acc, qty) => acc + qty, 0) === 0}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar Troca & Remanejamento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Nota de Troca Modal / PDF Preview */}
      {selectedExchange && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }

              .print-container,
              .print-container * {
                visibility: visible !important;
              }

              .print-container {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
                display: block !important;
                z-index: 999999 !important;
              }

              .print-sheet {
                padding: 12mm 16mm !important;
                margin: 0 !important;
                max-height: none !important;
                overflow: visible !important;
              }

              .no-print {
                display: none !important;
              }
            }
          `}</style>

          <div className="print-container bg-white w-full max-w-3xl rounded-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="no-print p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" /> Preview do Documento PDF — Nota de Troca & Remanejamento
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 text-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
                </button>
                <button
                  onClick={() => setSelectedExchange(null)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* A4 Printed Sheet */}
            <div className="print-sheet p-8 sm:p-10 overflow-y-auto space-y-6 text-xs bg-white text-slate-900 font-sans">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">RN 3D Soluções</h2>
                  <p className="text-xs font-black text-slate-900 mt-1">CNPJ: 67.570.155/0001-34</p>
                  <p className="text-[11px] text-slate-700 font-semibold mt-1">
                    WhatsApp: (22) 99754-0815 • Instagram: @rn3d.solucoes
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-slate-900 text-white font-mono font-bold rounded-md text-xs">
                    NOTA DE TROCA {selectedExchange.id}
                  </span>
                  <p className="text-slate-500 mt-2 text-xs font-medium">Data: {selectedExchange.date}</p>
                  <p className="text-slate-500 text-xs font-medium">Responsável: {selectedExchange.responsible}</p>
                </div>
              </div>

              {/* Client Box */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900 text-sm">LOJA ORIGEM (RETIRADA): {selectedExchange.clientName}</p>
                <p className="font-bold text-indigo-700 text-xs">
                  DESTINO: {selectedExchange.destinationClientName || (selectedExchange.type === 'recolhimento_oficina' ? 'Estoque Geral (Oficina RN 3D)' : 'Loja Parceira')}
                </p>
                <p className="text-slate-600 font-medium">Operação: Troca e Remanejamento de Estoque Consignado (Giro de Peças)</p>
              </div>

              {/* Items Removed Table */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-rose-700 uppercase tracking-wider text-xs flex items-center justify-between border-b border-rose-200 pb-1">
                  <span>🔴 Produtos Retirados do Expositor (Loja Origem)</span>
                  <span className="font-mono text-rose-800 font-bold">
                    Total: {selectedExchange.itemsRemoved.reduce((acc, i) => acc + i.quantity, 0)} un
                  </span>
                </h3>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-rose-200 text-rose-900 font-bold uppercase text-[10px] bg-rose-50">
                      <th className="p-2">Descrição do Produto</th>
                      <th className="p-2 text-center">Quantidade Retirada</th>
                      <th className="p-2 text-right">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100">
                    {selectedExchange.itemsRemoved.map((item, idx) => (
                      <tr key={idx} className="bg-rose-50/40 text-rose-950">
                        <td className="p-2 font-semibold">{item.productName}</td>
                        <td className="p-2 text-center font-bold">{item.quantity} un</td>
                        <td className="p-2 text-right font-medium text-rose-700">{item.reason || 'Baixo giro / Encalhado'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures Footer */}
              <div className="pt-10 grid grid-cols-2 gap-8 text-center text-slate-700 text-[11px]">
                <div className="border-t border-slate-400 pt-2 space-y-0.5">
                  <p className="font-bold text-slate-900">{selectedExchange.clientName}</p>
                  <p className="text-slate-500">Assinatura da Loja Origem</p>
                </div>
                <div className="border-t border-slate-400 pt-2 space-y-0.5">
                  <p className="font-bold text-slate-900">{selectedExchange.responsible}</p>
                  <p className="text-slate-500">Assinatura do Responsável RN 3D</p>
                </div>
              </div>

              {/* Print Footer */}
              <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
                RN 3D Soluções — Sistema de Controle de Consignação e Gestão 3D • Documento Gerado em {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
