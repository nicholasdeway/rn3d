import React, { useState } from 'react';
import { Client, Product, Quote, QuoteItem } from '../types';
import {
  FileText,
  Plus,
  Printer,
  X,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Clock,
  Send,
  Building2,
  Sparkles,
  ShoppingCart,
  Truck,
} from 'lucide-react';

interface QuotesViewProps {
  quotes: Quote[];
  clients: Client[];
  products: Product[];
  onAddQuote: (quote: Quote) => void;
  onUpdateQuoteStatus?: (quoteId: string, newStatus: string) => void;
  onConvertQuoteToOrder: (quote: Quote) => void;
  preselectedClientId?: string;
  searchQuery?: string;
}

export const QuotesView: React.FC<QuotesViewProps> = ({
  quotes,
  clients,
  products,
  onAddQuote,
  onUpdateQuoteStatus,
  onConvertQuoteToOrder,
  preselectedClientId,
  searchQuery = '',
}) => {
  const [isFormOpen, setIsFormOpen] = useState(!!preselectedClientId);
  const [previewPdfQuote, setPreviewPdfQuote] = useState<Quote | null>(null);

  const filteredQuotes = quotes.filter((q) => {
    if (!searchQuery || searchQuery.trim() === '') return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      q.id.toLowerCase().includes(query) ||
      q.clientName.toLowerCase().includes(query) ||
      q.status.toLowerCase().includes(query) ||
      (q.items && q.items.some((i) => i.description.toLowerCase().includes(query)))
    );
  });

  // New quote state initialized clean
  const [selectedClientId, setSelectedClientId] = useState(preselectedClientId || clients[0]?.id || '');
  const [validityDays, setValidityDays] = useState(7);
  const [productionSlaDays, setProductionSlaDays] = useState(5);
  const [discount, setDiscount] = useState(0);
  const [paymentTerms, setPaymentTerms] = useState('');
  const [notes, setNotes] = useState('');

  // Internal Logistics Cost State (Memory per Client)
  const [internalLogisticsType, setInternalLogisticsType] = useState<'combustivel' | 'frete' | 'retirada'>('combustivel');
  const [internalLogisticsCost, setInternalLogisticsCost] = useState<number>(50.0);

  // Sync client logistics memory from localStorage
  React.useEffect(() => {
    if (!selectedClientId) return;
    try {
      const saved = localStorage.getItem('rn3d_client_logistics');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed[selectedClientId]) {
          setInternalLogisticsType(parsed[selectedClientId].type || 'combustivel');
          setInternalLogisticsCost(parsed[selectedClientId].cost ?? 50.0);
        }
      }
    } catch (e) {
      console.error('Error loading client logistics memory:', e);
    }
  }, [selectedClientId]);

  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  const handleAddItem = () => {
    setQuoteItems([
      ...quoteItems,
      { description: '', quantity: 1, unitPrice: 0.0, subtotal: 0.0 },
    ]);
  };

  const handleSelectPaymentTerms = (newTerms: string) => {
    setPaymentTerms(newTerms);

    const isCash =
      newTerms.toLowerCase().includes('à vista') ||
      newTerms.toLowerCase().includes('a vista') ||
      newTerms.toLowerCase().includes('pix') ||
      newTerms.toLowerCase().includes('50%');

    setQuoteItems((prev) =>
      prev.map((item) => {
        const matchedProd = products.find(
          (p) => item.description.includes(p.sku) || item.description.toLowerCase().includes(p.name.toLowerCase())
        );
        if (matchedProd) {
          const targetPrice = isCash
            ? (matchedProd.cashPrice ?? (matchedProd.isKeychain || matchedProd.category === 'Chaveiro' ? 4.0 : matchedProd.standardPrice))
            : matchedProd.standardPrice;

          return {
            ...item,
            unitPrice: targetPrice,
            subtotal: item.quantity * targetPrice,
          };
        }
        return item;
      })
    );
  };

  const handleAddProductFromCatalog = (prod: Product) => {
    const isCash =
      paymentTerms.toLowerCase().includes('à vista') ||
      paymentTerms.toLowerCase().includes('a vista') ||
      paymentTerms.toLowerCase().includes('pix') ||
      paymentTerms.toLowerCase().includes('50%');

    const initialPrice = isCash
      ? (prod.cashPrice ?? (prod.isKeychain || prod.category === 'Chaveiro' ? 4.0 : prod.standardPrice))
      : prod.standardPrice;

    setQuoteItems([
      ...quoteItems,
      {
        description: `${prod.name} (SKU: ${prod.sku})`,
        quantity: 1,
        unitPrice: initialPrice,
        subtotal: initialPrice,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setQuoteItems(quoteItems.filter((_, idx) => idx !== index));
  };

  const handleUpdateItem = (index: number, field: keyof QuoteItem, val: any) => {
    const updated = [...quoteItems];
    (updated[index] as any)[field] = val;
    if (field === 'quantity' || field === 'unitPrice') {
      updated[index].subtotal = Number(updated[index].quantity) * Number(updated[index].unitPrice);
    }
    setQuoteItems(updated);
  };

  const subtotal = quoteItems.reduce((acc, i) => acc + i.subtotal, 0);
  const total = Math.max(0, subtotal - discount);

  const handleSubmitQuote = (status: Quote['status']) => {
    if (!selectedClient || quoteItems.length === 0) return;

    const todayDate = new Date().toISOString().slice(0, 10);

    const newQuote: Quote = {
      id: `ORC-${Math.floor(Math.random() * 900000 + 100000)}`,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientDocument: selectedClient.document,
      clientPhone: selectedClient.phone,
      clientAddress: `${selectedClient.street || ''}, ${selectedClient.number || ''} - ${selectedClient.city || ''} / ${selectedClient.state || ''}`,
      date: todayDate,
      validityDays,
      productionSlaDays,
      items: quoteItems,
      subtotal,
      discount,
      total,
      paymentTerms,
      notes,
      status,
      internalLogisticsType,
      internalLogisticsCost,
    };

    // Save/update client logistics memory in localStorage
    try {
      const saved = localStorage.getItem('rn3d_client_logistics');
      const parsed = saved ? JSON.parse(saved) : {};
      parsed[selectedClient.id] = { type: internalLogisticsType, cost: internalLogisticsCost };
      localStorage.setItem('rn3d_client_logistics', JSON.stringify(parsed));
    } catch (e) {
      console.error('Error saving client logistics memory:', e);
    }

    onAddQuote(newQuote);
    setIsFormOpen(false);
    setQuoteItems([]);
    setDiscount(0);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Orçamentos Comerciais
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gere propostas profissionais de impressão 3D em PDF para clientes e revendedores.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Orçamento
        </button>
      </div>

      {/* Quotes Table or Clean Empty State */}
      {quotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">Nenhum orçamento cadastrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Crie propostas comerciais completas em PDF para apresentar aos seus clientes.
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
          >
            Criar Primeiro Orçamento
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout (< 768px) - Eliminates Horizontal Scroll */}
          <div className="block md:hidden space-y-3">
            {filteredQuotes.map((q) => {
              const isConverted =
                q.status === 'Convertido em Pedido' ||
                q.status === 'Convertido' ||
                q.status === 'Aprovado';

              const displayStatus = isConverted ? 'Convertido em Pedido' : q.status;

              let badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
              if (isConverted) badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold';
              if (q.status === 'Recusado') badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
              if (q.status === 'Enviado') badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';

              return (
                <div
                  key={q.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3"
                >
                  {/* Card Header: ID & Status */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <span className="font-mono font-bold text-indigo-600 text-xs bg-indigo-50 px-2.5 py-1 rounded-lg">
                      {q.id}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeStyle}`}>
                      {displayStatus}
                    </span>
                  </div>

                  {/* Card Body: Client, Date & Total */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{q.clientName}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Data: {q.date} • {q.items ? q.items.length : 0} {q.items && q.items.length === 1 ? 'item' : 'itens'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-medium block">Valor Total</span>
                      <span className="font-black text-emerald-600 text-base">
                        R$ {q.total.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setPreviewPdfQuote(q)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" /> PDF
                    </button>
                    {isConverted ? (
                      <span className="flex-1 py-2 bg-emerald-100 text-emerald-800 rounded-xl font-bold inline-flex items-center justify-center gap-1.5 border border-emerald-300 text-xs text-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Pedido Gerado
                      </span>
                    ) : (
                      <button
                        onClick={() => onConvertQuoteToOrder(q)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs text-xs transition-colors"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Converter Pedido
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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
                    <th className="p-4 text-right">Valor Total</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQuotes.map((q) => {
                    const isConverted =
                      q.status === 'Convertido em Pedido' ||
                      q.status === 'Convertido' ||
                      q.status === 'Aprovado';

                    const displayStatus = isConverted ? 'Convertido em Pedido' : q.status;

                    let badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
                    if (isConverted) badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold';
                    if (q.status === 'Recusado') badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
                    if (q.status === 'Enviado') badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';

                    return (
                      <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono font-bold text-indigo-600">{q.id}</td>
                        <td className="p-4 font-bold text-slate-900">{q.clientName}</td>
                        <td className="p-4 text-slate-600">{q.date}</td>
                        <td className="p-4 text-right font-extrabold text-emerald-600">
                          R$ {q.total.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeStyle}`}>
                            {displayStatus}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => setPreviewPdfQuote(q)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold inline-flex items-center gap-1 cursor-pointer text-xs"
                          >
                            <Printer className="w-3.5 h-3.5" /> PDF
                          </button>
                          {isConverted ? (
                            <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg font-bold inline-flex items-center gap-1.5 border border-emerald-300 text-xs shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Convertido em Pedido
                            </span>
                          ) : (
                            <button
                              onClick={() => onConvertQuoteToOrder(q)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs text-xs"
                              title="Gerar Pedido Comercial a partir deste Orçamento"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" /> Converter em Pedido
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Cadastrar Orçamento Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl border border-slate-300 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Criar Novo Orçamento Comercial
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Client & SLA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cliente *</label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Validade da Proposta (Dias)</label>
                  <input
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prazo de Produção SLA (Dias)</label>
                  <input
                    type="number"
                    value={productionSlaDays}
                    onChange={(e) => setProductionSlaDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* Full Product Catalog Selection Dropdown */}
              {products.length > 0 && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-900 text-xs">
                    Adicionar do Catálogo de Produtos ({products.length} itens disponíveis):
                  </label>
                  <select
                    onChange={(e) => {
                      const selected = products.find((p) => p.id === e.target.value);
                      if (selected) {
                        handleAddProductFromCatalog(selected);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="" disabled>
                      🔍 Clique para selecionar qualquer produto do catálogo...
                    </option>
                    {products
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (SKU: {p.sku}) {p.storageCapacity ? `• ${p.storageCapacity}` : ''} — R$ {p.standardPrice.toFixed(2).replace('.', ',')}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">Itens e Serviços do Orçamento</h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Item Personalizado
                  </button>
                </div>

                {quoteItems.length === 0 ? (
                  <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
                    Nenhum item adicionado ao orçamento. Clique no botão acima para adicionar produtos.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                        <tr>
                          <th className="p-3">Descrição do Item / Serviço</th>
                          <th className="p-3 text-center">Qtde</th>
                          <th className="p-3 text-right">Valor Unit.</th>
                          <th className="p-3 text-right">Subtotal</th>
                          <th className="p-3 text-center">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {quoteItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                                placeholder="Descrição do item ou serviço..."
                                className="w-full px-2 py-1 border border-slate-200 rounded-lg font-medium placeholder-slate-400"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                                className="w-16 text-center py-1 border border-slate-200 rounded-lg font-bold"
                              />
                            </td>
                            <td className="p-3 text-right">
                              <input
                                type="number"
                                step="0.10"
                                value={item.unitPrice}
                                onChange={(e) => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                                className="w-20 text-right py-1 border border-slate-200 rounded-lg font-medium"
                              />
                            </td>
                            <td className="p-3 text-right font-bold text-emerald-600">
                              R$ {item.subtotal.toFixed(2).replace('.', ',')}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
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

              {/* Internal Logistics Memory & Cost Block (Hidden on Client PDF) */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-indigo-600" /> Custo Interno de Logística & Entrega
                  </span>
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200">
                    🔒 Uso Interno Oficina (Oculto no PDF)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Modalidade de Logística / Deslocamento</label>
                    <select
                      value={internalLogisticsType}
                      onChange={(e) => setInternalLogisticsType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-slate-900"
                    >
                      <option value="combustivel">⛽ Combustível (Deslocamento Próprio)</option>
                      <option value="frete">🚚 Frete / Motoboy / Envio Terceirizado</option>
                      <option value="retirada">🚗 Sem Custo (Retirada na Oficina)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Custo Estimado (R$) — Salvo para {selectedClient?.name || 'Cliente'}
                    </label>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      value={internalLogisticsCost}
                      onChange={(e) => setInternalLogisticsCost(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-black text-rose-600 text-sm"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  💡 Este valor é salvo na memória para {selectedClient?.name || 'este cliente'}, sugerindo R$ {internalLogisticsCost.toFixed(2).replace('.', ',')} na próxima vez, mas você pode editá-lo livremente caso faça mais viagens.
                </p>
              </div>

              {/* Totals & Conditions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Condições Comerciais / Modalidade</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      '⚡ Pagamento à Vista (PIX / Dinheiro)',
                      '🤝 Consignado (Acerto Periódico)',
                      '💳 50% no Pedido e 50% na Entrega',
                      '📅 Faturado a Prazo (30 Dias)',
                    ].map((preset) => {
                      const isSelected = paymentTerms === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleSelectPaymentTerms(preset)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/30'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-indigo-400'
                          }`}
                        >
                          {preset}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => handleSelectPaymentTerms(e.target.value)}
                    placeholder="Ex: Pagamento à Vista com 5% de desconto via PIX..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white placeholder-slate-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Observações do Projeto</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Instruções adicionais..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  />
                </div>
                <div className="space-y-3 text-right flex flex-col justify-end">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-bold">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 items-center">
                    <span>Desconto Concedido:</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-right font-bold text-rose-600"
                    />
                  </div>
                  <div className="flex justify-between text-slate-900 text-base font-black border-t border-slate-200 pt-2">
                    <span>TOTAL FINAL:</span>
                    <span className="text-emerald-600">R$ {total.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSubmitQuote('Rascunho')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                Salvar Rascunho
              </button>
              <button
                type="button"
                onClick={() => handleSubmitQuote('Enviado')}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
              >
                Marcar como Enviado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview PDF Modal Document */}
      {previewPdfQuote && (
        <div className="printable-quote-modal fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 print:p-0 print:bg-white">
          {/* Print CSS Rules */}
          <style>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 0;
              }

              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                height: 100% !important;
                overflow: visible !important;
              }

              /* Hide all background app elements, headers, sidebars, mobile navs & toasts */
              body * {
                visibility: hidden !important;
              }

              /* Display ONLY the PDF document sheet */
              .printable-quote-modal,
              .printable-quote-modal * {
                visibility: visible !important;
              }

              .printable-quote-modal {
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

              .print-container {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                max-width: 100% !important;
                width: 100% !important;
                border: none !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                max-height: none !important;
                overflow: visible !important;
                display: block !important;
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
            {/* Modal Header (Hidden on Print) */}
            <div className="no-print p-4 bg-slate-800 text-white flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" /> Preview do Documento PDF (Formato A4)
              </span>
              <button
                onClick={() => setPreviewPdfQuote(null)}
                className="p-1 hover:bg-slate-700 rounded-lg text-slate-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* A4 Sheet Rendering */}
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
                    ORÇAMENTO {previewPdfQuote.id}
                  </span>
                  <p className="text-slate-500 mt-2 text-xs">Data: {previewPdfQuote.date}</p>
                  <p className="text-slate-500 text-xs">Validade: {previewPdfQuote.validityDays} dias</p>
                </div>
              </div>

              {/* Client info */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900 text-sm">CLIENTE: {previewPdfQuote.clientName}</p>
                {previewPdfQuote.clientDocument && (
                  <p className="text-slate-600 font-medium">CPF/CNPJ: {previewPdfQuote.clientDocument}</p>
                )}
              </div>

              {/* Table with Image Thumbnails */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="py-2">Item / Descrição</th>
                    <th className="py-2 text-center">Qtde</th>
                    <th className="py-2 text-right">Valor Unit.</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewPdfQuote.items.map((item, idx) => {
                    const matchingProduct = products.find(
                      (p) =>
                        p.id === item.productId ||
                        p.name.toLowerCase() === item.description.toLowerCase() ||
                        item.description.toLowerCase().includes(p.name.toLowerCase())
                    );

                    return (
                      <tr key={idx}>
                        <td className="py-2.5 font-medium flex items-center gap-3">
                          {matchingProduct?.imageUrl ? (
                            <img
                              src={matchingProduct.imageUrl}
                              alt=""
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-400 shrink-0">
                              3D
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{item.description}</p>
                            {matchingProduct?.storageCapacity && (
                              <p className="text-[10px] text-indigo-600 font-semibold">
                                Cap: {matchingProduct.storageCapacity}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 text-center font-bold">{item.quantity}</td>
                        <td className="py-2.5 text-right text-slate-600">R$ {item.unitPrice.toFixed(2).replace('.', ',')}</td>
                        <td className="py-2.5 text-right font-bold text-slate-900">
                          R$ {item.subtotal.toFixed(2).replace('.', ',')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Totals */}
              <div className="border-t-2 border-slate-200 pt-4 flex justify-between items-end">
                <div className="space-y-1 text-[11px] max-w-md">
                  <p>
                    <strong>Condições de Pagamento:</strong> {previewPdfQuote.paymentTerms}
                  </p>
                  <p>
                    <strong>Prazo de Produção:</strong> {previewPdfQuote.productionSlaDays} dias úteis
                  </p>
                  <p className="text-slate-500 italic">{previewPdfQuote.notes}</p>
                </div>

                <div className="text-right space-y-1">
                  <p className="text-slate-500">Subtotal: R$ {previewPdfQuote.subtotal.toFixed(2).replace('.', ',')}</p>
                  {previewPdfQuote.discount > 0 && (
                    <p className="text-rose-600">Desconto: -R$ {previewPdfQuote.discount.toFixed(2).replace('.', ',')}</p>
                  )}
                  <p className="text-xl font-black text-slate-900 pt-1 border-t border-slate-300">
                    TOTAL: R$ {previewPdfQuote.total.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-6 border-t border-slate-200 text-center text-[10px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-900">
                  RN 3D Soluções • CNPJ: 67.570.155/0001-34 • WhatsApp: (22) 99754-0815 • Instagram: @rn3d.solucoes
                </p>
                <p>Obrigado pela preferência e confiança em nosso trabalho!</p>
              </div>
            </div>

            {/* Modal Bottom Actions (Hidden on Print) */}
            <div className="no-print p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setPreviewPdfQuote(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold cursor-pointer text-xs"
              >
                Fechar
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 text-xs cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" /> Baixar / Imprimir PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
