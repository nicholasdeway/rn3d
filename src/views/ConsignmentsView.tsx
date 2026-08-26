import React, { useState } from 'react';
import { Client, Consignment, ConsignmentItem, Product, ExchangeNote } from '../types';
import { ProductSelectCombobox } from '../components/ProductSelectCombobox';
import { formatDateBR, getTodayBR } from '../utils/formatters';
import {
  Boxes,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  Building2,
  Calendar,
  X,
  Package,
  Printer,
  FileText,
  Grid,
  List,
} from 'lucide-react';

interface ConsignmentsViewProps {
  consignments: Consignment[];
  clients: Client[];
  products: Product[];
  exchanges?: ExchangeNote[];
  onAddConsignment: (consignment: Consignment) => void;
  onClearConsignments?: () => void;
  preselectedClientId?: string;
}

export const ConsignmentsView: React.FC<ConsignmentsViewProps> = ({
  consignments,
  clients,
  products,
  exchanges = [],
  onAddConsignment,
  onClearConsignments,
  preselectedClientId,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    const saved = localStorage.getItem('rn3d_consignments_view_mode');
    return saved === 'grid' || saved === 'table' ? saved : 'grid';
  });

  React.useEffect(() => {
    localStorage.setItem('rn3d_consignments_view_mode', viewMode);
  }, [viewMode]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedConsignment, setSelectedConsignment] = useState<Consignment | null>(null);

  // Form State
  const [selectedClientId, setSelectedClientId] = useState<string>(
    preselectedClientId || clients[0]?.id || ''
  );
  const [deliveryDate, setDeliveryDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ConsignmentItem[]>([]);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const filteredConsignments = consignments.filter(
    (c) =>
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProductToConsignment = (prod: Product) => {
    const existingIndex = items.findIndex((i) => i.productId === prod.id);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          quantity: 10,
          unitPrice: prod.standardPrice,
          subtotal: 10 * prod.standardPrice,
        },
      ]);
    }
  };

  const handleUpdateItemQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const updated = [...items];
    updated[index].quantity = newQty;
    updated[index].subtotal = newQty * updated[index].unitPrice;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const totalQuantity = items.reduce((acc, i) => acc + i.quantity, 0);
  const totalValuation = items.reduce((acc, i) => acc + i.subtotal, 0);

  const handleSubmitConsignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || items.length === 0) return;

    const newConsignment: Consignment = {
      id: `REM-${Math.floor(Math.random() * 900000 + 100000)}`,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      date: deliveryDate,
      itemsCount: totalQuantity,
      totalValue: totalValuation,
      status: 'Em andamento',
      lastAuditDate: deliveryDate,
      items,
      notes,
    };

    onAddConsignment(newConsignment);
    setIsWizardOpen(false);
    setItems([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-indigo-600" />
            Remessas de Consignação
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Controle o envio e a alocação inicial de mercadorias nos pontos de venda.
          </p>
        </div>

        <button
          onClick={() => setIsWizardOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Consignação
        </button>
      </div>

      {/* Table search filter & view mode toggle */}
      <div className="bg-white dark:bg-[#12151c] p-4 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código de remessa (REM-...) ou nome do cliente..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center justify-center bg-slate-100 dark:bg-[#181c26] p-1 rounded-xl border border-slate-200 dark:border-[#202531] shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Visualização em Cards / Grid"
          >
            <Grid className="w-4 h-4" />
            <span>Grid</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              viewMode === 'table'
                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Visualização em Lista / Tabela"
          >
            <List className="w-4 h-4" />
            <span>Lista</span>
          </button>
        </div>
      </div>

      {/* Consignment Table / Cards */}
      {filteredConsignments.length === 0 ? (
        <div className="bg-white dark:bg-[#12151c] rounded-2xl border border-slate-200/80 dark:border-[#202531] p-12 text-center shadow-xs space-y-3">
          <Boxes className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">Nenhuma remessa de consignação encontrada</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Registre envios e alocações de mercadorias para seus estabelecimentos parceiros.
          </p>
          <div className="flex gap-2 justify-center mt-4">
            {onClearConsignments && consignments.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja apagar TODOS os registros de consignação?')) {
                    onClearConsignments();
                  }
                }}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-xs cursor-pointer flex items-center justify-center gap-2 transition-colors border border-rose-100"
              >
                <Trash2 className="w-4 h-4" />
                Limpar Consignações
              </button>
            )}
            <button
              onClick={() => setIsWizardOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Registrar Primeira Consignação
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Cards Grid Layout */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConsignments.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedConsignment(c)}
                  className="bg-white dark:bg-[#12151c] p-4 rounded-2xl border border-slate-200/90 dark:border-[#202531] shadow-xs space-y-3 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Card Header: REM ID & Status */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg">
                        {c.id}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                        {c.status}
                      </span>
                    </div>

                    {/* Card Body: Client, Items & Valuation */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{c.clientName}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Data: {formatDateBR(c.date)} • {c.itemsCount} {c.itemsCount === 1 ? 'item' : 'itens'}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Última conferência: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatDateBR(c.lastAuditDate)}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-medium block">Valor Mercadorias</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                          R$ {c.totalValue.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-[#202531] flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedConsignment(c);
                      }}
                      className="w-full py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" /> Ver Comprovante PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table List Layout */}
          {viewMode === 'table' && (
            <div className="bg-white dark:bg-[#12151c] rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#181c26] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-4 whitespace-nowrap">Número</th>
                      <th className="p-4 whitespace-nowrap">Cliente</th>
                      <th className="p-4 whitespace-nowrap">Data</th>
                      <th className="p-4 text-center whitespace-nowrap">Quantidade</th>
                      <th className="p-4 text-right whitespace-nowrap">Valor em Mercadorias</th>
                      <th className="p-4 text-center whitespace-nowrap">Status</th>
                      <th className="p-4 whitespace-nowrap">Última Conferência</th>
                      <th className="p-4 text-right whitespace-nowrap">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                    {filteredConsignments.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedConsignment(c)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                      >
                        <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{c.id}</td>
                        <td className="p-4 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{c.clientName}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDateBR(c.date)}</td>
                        <td className="p-4 text-center font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{c.itemsCount} itens</td>
                        <td className="p-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap">
                          R$ {c.totalValue.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 inline-flex items-center justify-center gap-1 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{c.status}</span>
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDateBR(c.lastAuditDate)}</td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedConsignment(c);
                              }}
                              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer text-xs transition-colors shrink-0 whitespace-nowrap"
                            >
                              <Printer className="w-3.5 h-3.5" /> Ver PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Nova Consignação Modal Wizard */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-2 sm:p-4 md:p-6">
          <div className="bg-white w-full max-w-[96vw] xl:max-w-7xl rounded-2xl border border-slate-300 overflow-hidden max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <Boxes className="w-6 h-6 text-indigo-600" />
                Registrar Nova Consignação em Cliente
              </h3>
              <button
                type="button"
                onClick={() => setIsWizardOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 text-slate-600 cursor-pointer transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitConsignment} className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs flex-1">
              {/* 1. Client & Delivery Date Header Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Selecionar Cliente / Loja *</label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 bg-white"
                  >
                    {clients.map((cli) => (
                      <option key={cli.id} value={cli.id}>
                        {cli.name} ({cli.city} - {cli.state})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data de Entrega / Envio</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* Selected Client Info Card */}
              {selectedClient && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1 text-slate-600">
                  <p>
                    <strong>Endereço:</strong> {selectedClient.street}, {selectedClient.number} -{' '}
                    {selectedClient.neighborhood}, {selectedClient.city} / {selectedClient.state}
                  </p>
                  <p>
                    <strong>Responsável:</strong> {selectedClient.responsible} ({selectedClient.phone || selectedClient.whatsapp})
                  </p>
                </div>
              )}

              {/* 2. Full Product Catalog Search Combobox */}
              {products.length > 0 && (
                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-2 relative z-30">
                  <label className="block font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center justify-between">
                    <span>Adicionar Produtos do Catálogo ({products.length} itens disponíveis):</span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">Pesquisa Instantânea</span>
                  </label>
                  <ProductSelectCombobox
                    products={products}
                    onSelectProduct={handleAddProductToConsignment}
                    isCashPayment={false}
                  />
                </div>
              )}

              {/* 3. Items Table - Full 100% Width */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <span>Produtos da Remessa de Consignação ({items.length})</span>
                  </h4>
                </div>

                {items.length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400 space-y-1">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-bold text-slate-700">Nenhum produto adicionado à remessa</p>
                    <p className="text-[11px]">Use a caixa de pesquisa acima para selecionar e incluir produtos no consignado.</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Items Cards (< 768px) */}
                    <div className="block md:hidden space-y-3">
                      {items.map((item, idx) => (
                        <div key={item.productId} className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h5 className="font-bold text-slate-900 text-xs">{item.productName}</h5>
                              <p className="text-[11px] text-slate-500 font-mono">SKU: {item.sku}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">Qtd:</span>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItemQuantity(idx, Number(e.target.value))}
                                className="w-16 text-center px-2 py-1 border border-slate-200 rounded-lg font-bold"
                              />
                            </div>
                            <div className="text-right">
                              <span className="text-slate-400 text-[10px] block">Subtotal</span>
                              <span className="font-bold text-emerald-600">R$ {item.subtotal.toFixed(2).replace('.', ',')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table (>= 768px) */}
                    <div className="hidden md:block border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                          <tr>
                            <th className="p-3.5">Produto</th>
                            <th className="p-3.5 text-center">Quantidade Enviada</th>
                            <th className="p-3.5 text-right">Preço Unit.</th>
                            <th className="p-3.5 text-right">Subtotal</th>
                            <th className="p-3.5 text-center">Remover</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {items.map((item, idx) => (
                            <tr key={item.productId} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3.5 font-bold text-slate-900">
                                {item.productName}
                                <span className="block text-[11px] text-slate-400 font-normal font-mono">SKU: {item.sku}</span>
                              </td>
                              <td className="p-3.5 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateItemQuantity(idx, Number(e.target.value))}
                                  className="w-20 text-center px-2.5 py-1.5 border border-slate-200 rounded-xl font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                              </td>
                              <td className="p-3.5 text-right text-slate-700 font-semibold">
                                R$ {item.unitPrice.toFixed(2).replace('.', ',')}
                              </td>
                              <td className="p-3.5 text-right font-extrabold text-emerald-600 text-sm">
                                R$ {item.subtotal.toFixed(2).replace('.', ',')}
                              </td>
                              <td className="p-3.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Remover produto da remessa"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-500" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* 4. Bottom Observações & Summary Totals Card */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2 space-y-1">
                  <label className="block font-semibold text-slate-700">Observações de Entrega / Notas da Remessa</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Instruções sobre colocação do expositor, itens em promoção, observações..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs text-slate-900"
                  />
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 text-right">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Quantidade Total:</span>
                    <span className="font-bold text-slate-900">{totalQuantity} un</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="font-bold text-slate-900 text-xs">Valor Mercadorias:</span>
                    <span className="text-xl font-black text-emerald-600">
                      R$ {totalValuation.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Modal Footer Action Buttons */}
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
                  disabled={items.length === 0}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <Boxes className="w-4 h-4" />
                  <span>Registrar Consignação</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📄 Modal de Detalhes da Consignação & Comprovante PDF A4 */}
      {selectedConsignment && (
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

          <div className="print-container bg-white dark:bg-[#12151c] w-full max-w-3xl rounded-2xl border border-slate-300 dark:border-[#202531] overflow-hidden flex flex-col max-h-[92vh] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Top Controls (Hidden on Print) */}
            <div className="no-print p-4 bg-slate-900 dark:bg-[#181c26] text-white flex items-center justify-between shrink-0 border-b border-slate-800 dark:border-[#202531]">
              <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-400" />
                Comprovante de Remessa em Consignação ({selectedConsignment.id})
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 text-xs transition-colors cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
                </button>
                <button
                  onClick={() => setSelectedConsignment(null)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* A4 Printed Sheet Document */}
            <div className="print-sheet p-8 sm:p-10 overflow-y-auto space-y-6 text-xs bg-white text-slate-900 font-sans flex-1">
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
                  <span className="px-3 py-1 bg-indigo-600 text-white font-mono font-bold rounded-md text-xs inline-block">
                    REMESSA {selectedConsignment.id}
                  </span>
                  <p className="text-slate-500 mt-2 text-xs font-medium">Data Envio: {selectedConsignment.date}</p>
                  <p className="text-slate-500 text-xs font-medium">Status: <span className="font-bold text-emerald-600">{selectedConsignment.status}</span></p>
                </div>
              </div>

              {/* Client Details Box */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900 text-sm uppercase">ESTABELECIMENTO / CLIENTE: {selectedConsignment.clientName}</p>
                <p className="text-slate-600 font-medium">Modalidade: Alocação Inicial de Produtos em Consignação</p>
                <p className="text-slate-500 text-[11px]">Última Conferência Auditada: {selectedConsignment.lastAuditDate}</p>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-xs flex items-center justify-between border-b border-slate-200 pb-1">
                  <span>📦 Produtos Entregues / Alocados no Expositor</span>
                  <span className="font-mono text-indigo-700 font-bold">
                    Total: {selectedConsignment.itemsCount} unidades
                  </span>
                </h3>
                <table className="w-full text-left border-collapse border border-slate-200">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] bg-slate-50">
                      <th className="p-2">Item / Descrição do Produto</th>
                      <th className="p-2 text-center">SKU</th>
                      <th className="p-2 text-center">Quantidade</th>
                      <th className="p-2 text-right">Preço Unit.</th>
                      <th className="p-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(selectedConsignment.items || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2 font-bold text-slate-900">{item.productName}</td>
                        <td className="p-2 text-center font-mono text-slate-500">{item.sku || 'N/A'}</td>
                        <td className="p-2 text-center font-extrabold text-slate-900">{item.quantity} un</td>
                        <td className="p-2 text-right text-slate-700">R$ {item.unitPrice.toFixed(2).replace('.', ',')}</td>
                        <td className="p-2 text-right font-extrabold text-emerald-600">R$ {item.subtotal.toFixed(2).replace('.', ',')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Histórico Auditado de Retiradas / Trocas */}
              {(() => {
                const clientExchanges = exchanges.filter(
                  (e) =>
                    e.clientId === selectedConsignment.clientId ||
                    (e.clientName &&
                      selectedConsignment.clientName &&
                      e.clientName.toLowerCase().trim() === selectedConsignment.clientName.toLowerCase().trim())
                );

                if (clientExchanges.length === 0) return null;

                return (
                  <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                    <h4 className="font-extrabold text-amber-900 text-xs flex items-center justify-between border-b border-amber-200/60 pb-1">
                      <span>🔄 Histórico de Retiradas & Remanejamentos Auditados (RN 3D)</span>
                      <span className="font-mono text-[11px] bg-amber-200/80 px-2 py-0.5 rounded-md text-amber-900 font-bold">
                        {clientExchanges.length} nota(s) vinculada(s)
                      </span>
                    </h4>
                    <div className="space-y-1.5 text-[11px]">
                      {clientExchanges.map((ex) => {
                        const totalRemoved = ex.itemsRemoved.reduce((acc, i) => acc + i.quantity, 0);
                        return (
                          <div
                            key={ex.id}
                            className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-amber-200/60 shadow-2xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                  {ex.id}
                                </span>
                                <span className="text-slate-600 font-medium">{ex.date}</span>
                                <span className="text-slate-500 font-normal">({ex.responsibleName})</span>
                              </div>
                              <span className="text-slate-800 block font-bold mt-1 text-xs">
                                {ex.itemsRemoved.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                              </span>
                            </div>
                            <span className="font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-md text-xs shrink-0 whitespace-nowrap">
                              -{totalRemoved} un
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Summary Valuation */}
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">Saldo Atual Alocado no Expositor:</span>
                  <span className="text-slate-600 font-medium">{selectedConsignment.itemsCount} produtos em exibição</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Valor Total Auditado / A Cobrar</span>
                  <span className="text-xl font-black text-emerald-700">
                    R$ {selectedConsignment.totalValue.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {selectedConsignment.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block text-[11px]">Observações de Entrega:</span>
                  <p className="text-slate-600 italic text-[11px]">{selectedConsignment.notes}</p>
                </div>
              )}

              {/* Signatures Footer */}
              <div className="pt-10 grid grid-cols-2 gap-8 text-center text-slate-700 text-[11px]">
                <div className="border-t border-slate-400 pt-2 space-y-0.5">
                  <p className="font-bold text-slate-900">{selectedConsignment.clientName}</p>
                  <p className="text-slate-500">Assinatura de Recebimento do Estabelecimento</p>
                </div>
                <div className="border-t border-slate-400 pt-2 space-y-0.5">
                  <p className="font-bold text-slate-900">RN 3D Soluções</p>
                  <p className="text-slate-500">Assinatura do Entregador / Responsável</p>
                </div>
              </div>

              {/* Print Footer */}
              <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
                RN 3D Soluções — Sistema de Controle de Consignação e Gestão 3D • Documento Gerado em {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>

            {/* Modal Bottom Controls (Hidden on Print) */}
            <div className="no-print p-4 bg-slate-50 dark:bg-[#181c26] border-t border-slate-200 dark:border-[#202531] flex items-center justify-between shrink-0">
              <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">RN 3D Soluções — Impressão em Formato A4 Padronizado</span>
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 text-xs shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Imprimir / Gerar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
