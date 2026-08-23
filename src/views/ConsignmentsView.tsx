import React, { useState } from 'react';
import { Client, Consignment, ConsignmentItem, Product } from '../types';
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
} from 'lucide-react';

interface ConsignmentsViewProps {
  consignments: Consignment[];
  clients: Client[];
  products: Product[];
  onAddConsignment: (consignment: Consignment) => void;
  preselectedClientId?: string;
}

export const ConsignmentsView: React.FC<ConsignmentsViewProps> = ({
  consignments,
  clients,
  products,
  onAddConsignment,
  preselectedClientId,
}) => {
  const [isWizardOpen, setIsWizardOpen] = useState(!!preselectedClientId);
  const [searchTerm, setSearchTerm] = useState('');

  // Wizard state
  const [selectedClientId, setSelectedClientId] = useState(preselectedClientId || clients[0]?.id || '');
  const [items, setItems] = useState<ConsignmentItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const filteredConsignments = consignments.filter((c) => {
    const term = searchTerm.toLowerCase();
    return c.id.toLowerCase().includes(term) || c.clientName.toLowerCase().includes(term);
  });

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
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nova Consignação
        </button>
      </div>

      {/* Table search filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código de remessa (REM-...) ou nome do cliente..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Consignment Table / Cards */}
      {filteredConsignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs space-y-3">
          <Boxes className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">Nenhuma remessa de consignação encontrada</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Registre envios e alocações de mercadorias para seus estabelecimentos parceiros.
          </p>
          <button
            onClick={() => setIsWizardOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
          >
            Registrar Primeira Consignação
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout (< 768px) - Eliminates Horizontal Scroll */}
          <div className="block md:hidden space-y-3">
            {filteredConsignments.map((c) => (
              <div
                key={c.id}
                className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3"
              >
                {/* Card Header: REM ID & Status */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <span className="font-mono font-bold text-indigo-600 text-xs bg-indigo-50 px-2.5 py-1 rounded-lg">
                    {c.id}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {c.status}
                  </span>
                </div>

                {/* Card Body: Client, Items & Valuation */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{c.clientName}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Data: {c.date} • {c.itemsCount} {c.itemsCount === 1 ? 'item' : 'itens'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Última conferência: <span className="font-semibold text-slate-700">{c.lastAuditDate}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-medium block">Valor Mercadorias</span>
                    <span className="font-black text-emerald-600 text-base">
                      R$ {c.totalValue.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Layout (>= 768px) */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Número</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Data</th>
                    <th className="p-4 text-center">Quantidade</th>
                    <th className="p-4 text-right">Valor em Mercadorias</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Última Conferência</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredConsignments.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-indigo-600">{c.id}</td>
                      <td className="p-4 font-bold text-slate-900">{c.clientName}</td>
                      <td className="p-4 text-slate-600">{c.date}</td>
                      <td className="p-4 text-center font-bold text-slate-800">{c.itemsCount} itens</td>
                      <td className="p-4 text-right font-bold text-emerald-600">
                        R$ {c.totalValue.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          {c.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{c.lastAuditDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Nova Consignação Modal Wizard */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl border border-slate-300 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Boxes className="w-5 h-5 text-indigo-600" />
                Registrar Nova Consignação em Cliente
              </h3>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitConsignment} className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (2/3): Form & Dynamic Item Table */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Select Client */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Selecionar Cliente / Loja *</label>
                    <select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                    >
                      {clients.map((cli) => (
                        <option key={cli.id} value={cli.id}>
                          {cli.name} ({cli.city} - {cli.state})
                        </option>
                      ))}
                    </select>

                    {selectedClient && (
                      <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs space-y-1 text-slate-600">
                        <p>
                          <strong>Endereço:</strong> {selectedClient.street}, {selectedClient.number} -{' '}
                          {selectedClient.neighborhood}, {selectedClient.city}
                        </p>
                        <p>
                          <strong>Responsável:</strong> {selectedClient.responsible} ({selectedClient.phone})
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Add Product Search picker */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Buscar Produto para Adicionar</label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Digite o nome do produto ou SKU..."
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>

                    {/* Product Quick Results */}
                    {productSearch.length > 0 && (
                      <div className="mt-1 bg-white rounded-xl border border-slate-200 shadow-md max-h-40 overflow-y-auto divide-y divide-slate-100 z-10 relative">
                        {products
                          .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                          .slice(0, 5)
                          .map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                handleAddProductToConsignment(p);
                                setProductSearch('');
                              }}
                              className="w-full text-left p-2.5 hover:bg-slate-50 flex items-center justify-between transition-colors"
                            >
                              <div>
                                <p className="font-bold text-slate-900">{p.name}</p>
                                <p className="text-[10px] text-slate-400">SKU: {p.sku}</p>
                              </div>
                              <span className="font-bold text-emerald-600">R$ {p.standardPrice.toFixed(2)}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Dynamic Items Table */}
                  <div className="space-y-2">
                    <label className="block font-semibold text-slate-700">Produtos da Remessa</label>
                    {items.length === 0 ? (
                      <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
                        <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        Nenhum produto adicionado ainda. Utilize a busca acima para incluir produtos.
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                            <tr>
                              <th className="p-3">Produto</th>
                              <th className="p-3 text-center">Quantidade</th>
                              <th className="p-3 text-right">Preço Unit.</th>
                              <th className="p-3 text-right">Subtotal</th>
                              <th className="p-3 text-center">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {items.map((item, idx) => (
                              <tr key={item.productId} className="hover:bg-slate-50">
                                <td className="p-3 font-bold text-slate-900">{item.productName}</td>
                                <td className="p-3 text-center">
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleUpdateItemQuantity(idx, Number(e.target.value))}
                                    className="w-16 text-center px-2 py-1 border border-slate-200 rounded-lg font-bold"
                                  />
                                </td>
                                <td className="p-3 text-right text-slate-700">
                                  R$ {item.unitPrice.toFixed(2)}
                                </td>
                                <td className="p-3 text-right font-bold text-emerald-600">
                                  R$ {item.subtotal.toFixed(2)}
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(idx)}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column (1/3): Summary Card */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                      Resumo da Remessa
                    </h4>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Quantidade Total:</span>
                        <span className="font-bold text-slate-900">{totalQuantity} unidades</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Valor em Mercadorias:</span>
                        <span className="font-extrabold text-emerald-600 text-sm">
                          R$ {totalValuation.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Data de Entrega</label>
                        <input
                          type="date"
                          value={deliveryDate}
                          onChange={(e) => setDeliveryDate(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Observações</label>
                        <textarea
                          rows={3}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Observações de entrega..."
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={items.length === 0}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-sm transition-colors"
                  >
                    Registrar Consignação
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
