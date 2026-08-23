import React, { useState } from 'react';
import { Order, Product } from '../types';
import { ShoppingCart, Printer, X, Truck, FileText, Plus, Minus, CheckCircle2, Clock, Play, Sparkles } from 'lucide-react';
import { ImageLightboxModal } from '../components/ImageLightboxModal';

interface OrdersViewProps {
  orders: Order[];
  products?: Product[];
  searchQuery?: string;
  onUpdateOrderProgress?: (orderId: string, newProgressPct: number) => void;
  onUpdateOrderStatus?: (orderId: string, newStatus: Order['status']) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  products = [],
  searchQuery = '',
  onUpdateOrderProgress,
  onUpdateOrderStatus,
}) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [previewPdfOrder, setPreviewPdfOrder] = useState<Order | null>(null);
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery || searchQuery.trim() === '') return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      o.id.toLowerCase().includes(q) ||
      o.clientName.toLowerCase().includes(q) ||
      o.paymentStatusText.toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q) ||
      (o.notes && o.notes.toLowerCase().includes(q)) ||
      (o.items && o.items.some((i) => i.productName.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-indigo-600" />
            Pedidos de Venda e Produção
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Acompanhe a fila de impressão 3D, regulagem de 5 em 5%, controle de entrega, faturamento e PDFs.
          </p>
        </div>
      </div>

      {/* Orders Table or Clean Empty State */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs space-y-3">
          <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">Nenhum pedido de venda cadastrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Os pedidos aparecem aqui automaticamente assim que você converter um orçamento comercial em pedido.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout (< 768px) - Eliminates Horizontal Scroll */}
          <div className="block md:hidden space-y-3">
            {filteredOrders.map((o) => (
              <div
                key={o.id}
                onClick={() => setSelectedOrder(o)}
                className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 cursor-pointer hover:border-indigo-300 transition-colors"
              >
                {/* Card Header: Order ID & Interactive 5% Production Progress */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <span className="font-mono font-bold text-indigo-600 text-xs bg-indigo-50 px-2.5 py-1 rounded-lg">
                    {o.id}
                  </span>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        const newPct = Math.max(0, o.productionProgressPct - 5);
                        if (onUpdateOrderProgress) onUpdateOrderProgress(o.id, newPct);
                      }}
                      disabled={o.productionProgressPct <= 0}
                      className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 rounded-md cursor-pointer transition-colors active:scale-95"
                      title="Diminuir 5%"
                    >
                      <Minus className="w-3 h-3 text-rose-500" />
                    </button>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                      o.status === 'Entregue'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold'
                        : o.productionProgressPct === 100
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>
                      {o.status} ({o.productionProgressPct}%)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newPct = Math.min(100, o.productionProgressPct + 5);
                        if (onUpdateOrderProgress) onUpdateOrderProgress(o.id, newPct);
                      }}
                      disabled={o.productionProgressPct >= 100}
                      className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 rounded-md cursor-pointer transition-colors active:scale-95"
                      title="Aumentar 5%"
                    >
                      <Plus className="w-3 h-3 text-emerald-600" />
                    </button>
                  </div>
                </div>

                {/* Card Body: Client Name, Items, Delivery Checkbox & Total */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{o.clientName}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Data: {o.date} • {o.itemsCount} {o.itemsCount === 1 ? 'item' : 'itens'}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-700 mt-1">
                      Pagamento: <span className="text-slate-900">{o.paymentStatusText}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-medium block">Valor Total</span>
                    <span className="font-black text-emerald-600 text-base">
                      R$ {o.totalValue.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* Delivery Toggle Checkbox for Mobile */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <label
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold select-none transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={o.status === 'Entregue'}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        if (isChecked) {
                          if (onUpdateOrderStatus) onUpdateOrderStatus(o.id, 'Entregue');
                        } else {
                          const fallbackStatus = o.productionProgressPct === 100 ? 'Pronto' : o.productionProgressPct > 0 ? 'Em produção' : 'Novo';
                          if (onUpdateOrderStatus) onUpdateOrderStatus(o.id, fallbackStatus);
                        }
                      }}
                      className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                    />
                    <span className={o.status === 'Entregue' ? 'text-emerald-700 font-bold' : 'text-slate-600'}>
                      {o.status === 'Entregue' ? '✅ Entregue ao cliente' : '📦 Não entregue (Pendente)'}
                    </span>
                  </label>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewPdfOrder(o);
                    }}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" /> PDF
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrder(o);
                    }}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs text-xs transition-colors"
                  >
                    Detalhes
                  </button>
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
                    <th className="p-4">Pedido</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Data</th>
                    <th className="p-4 text-center">Itens</th>
                    <th className="p-4 text-right">Valor</th>
                    <th className="p-4">Pagamento</th>
                    <th className="p-4">Progresso Impressão 3D</th>
                    <th className="p-4">Status Entrega</th>
                    <th className="p-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => setSelectedOrder(o)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="p-4 font-mono font-bold text-indigo-600">{o.id}</td>
                      <td className="p-4 font-bold text-slate-900">{o.clientName}</td>
                      <td className="p-4 text-slate-600">{o.date}</td>
                      <td className="p-4 text-center font-bold text-slate-800">{o.itemsCount} itens</td>
                      <td className="p-4 text-right font-extrabold text-emerald-600">
                        R$ {o.totalValue.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="p-4 font-semibold text-slate-700">{o.paymentStatusText}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              const newPct = Math.max(0, o.productionProgressPct - 5);
                              if (onUpdateOrderProgress) onUpdateOrderProgress(o.id, newPct);
                            }}
                            disabled={o.productionProgressPct <= 0}
                            className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 rounded-md cursor-pointer transition-colors active:scale-95"
                            title="Diminuir 5%"
                          >
                            <Minus className="w-3 h-3 text-rose-500" />
                          </button>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                            o.status === 'Entregue'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold'
                              : o.productionProgressPct === 100
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {o.status} ({o.productionProgressPct}%)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const newPct = Math.min(100, o.productionProgressPct + 5);
                              if (onUpdateOrderProgress) onUpdateOrderProgress(o.id, newPct);
                            }}
                            disabled={o.productionProgressPct >= 100}
                            className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 rounded-md cursor-pointer transition-colors active:scale-95"
                            title="Aumentar 5%"
                          >
                            <Plus className="w-3 h-3 text-emerald-600" />
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <label
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold select-none transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={o.status === 'Entregue'}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              if (isChecked) {
                                if (onUpdateOrderStatus) onUpdateOrderStatus(o.id, 'Entregue');
                              } else {
                                const fallbackStatus = o.productionProgressPct === 100 ? 'Pronto' : o.productionProgressPct > 0 ? 'Em produção' : 'Novo';
                                if (onUpdateOrderStatus) onUpdateOrderStatus(o.id, fallbackStatus);
                              }
                            }}
                            className="w-3.5 h-3.5 accent-emerald-600 rounded cursor-pointer"
                          />
                          <span className={o.status === 'Entregue' ? 'text-emerald-700 font-bold' : 'text-slate-600'}>
                            {o.status === 'Entregue' ? '✅ Entregue' : '📦 Não entregue'}
                          </span>
                        </label>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewPdfOrder(o);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold inline-flex items-center gap-1 cursor-pointer text-xs"
                          title="Ver Documento PDF A4 do Pedido"
                        >
                          <Printer className="w-3.5 h-3.5" /> PDF
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(o);
                          }}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-semibold cursor-pointer text-xs"
                        >
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-300 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                Pedido {selectedOrder.id} — {selectedOrder.clientName}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewPdfOrder(selectedOrder)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> PDF do Pedido
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Interactive 3D Print Progress Regulator (5% increments) */}
              <div className="p-4 bg-gradient-to-r from-indigo-50/80 via-slate-50 to-cyan-50/60 rounded-2xl border border-indigo-100/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                      <Printer className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        Progresso de Impressão 3D
                        <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md">
                          Passo: 5 em 5%
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500">Regule o avanço da produção das peças na impressora 3D</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-black font-mono px-3 py-1 rounded-xl border transition-colors ${
                      selectedOrder.productionProgressPct === 100
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : selectedOrder.productionProgressPct > 0
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}>
                      {selectedOrder.productionProgressPct}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar Display */}
                <div className="w-full h-3 bg-slate-200/90 rounded-full overflow-hidden shadow-inner flex">
                  <div
                    className={`h-full transition-all duration-300 ${
                      selectedOrder.productionProgressPct === 100
                        ? 'bg-emerald-500'
                        : selectedOrder.productionProgressPct >= 50
                          ? 'bg-indigo-600'
                          : 'bg-cyan-500'
                    }`}
                    style={{ width: `${selectedOrder.productionProgressPct}%` }}
                  />
                </div>

                {/* 5% Stepper Controls: -5%, Range Slider (step=5), +5% */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const newPct = Math.max(0, selectedOrder.productionProgressPct - 5);
                      if (onUpdateOrderProgress) {
                        onUpdateOrderProgress(selectedOrder.id, newPct);
                      }
                      setSelectedOrder((prev) => (prev ? { ...prev, productionProgressPct: newPct } : null));
                    }}
                    disabled={selectedOrder.productionProgressPct <= 0}
                    className="px-3 py-2 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white border border-slate-200 text-slate-800 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                    title="Diminuir 5%"
                  >
                    <Minus className="w-4 h-4 text-rose-500" />
                    <span>-5%</span>
                  </button>

                  <div className="flex-1 px-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={selectedOrder.productionProgressPct}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        if (onUpdateOrderProgress) {
                          onUpdateOrderProgress(selectedOrder.id, val);
                        }
                        setSelectedOrder((prev) => (prev ? { ...prev, productionProgressPct: val } : null));
                      }}
                      className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const newPct = Math.min(100, selectedOrder.productionProgressPct + 5);
                      if (onUpdateOrderProgress) {
                        onUpdateOrderProgress(selectedOrder.id, newPct);
                      }
                      setSelectedOrder((prev) => (prev ? { ...prev, productionProgressPct: newPct } : null));
                    }}
                    disabled={selectedOrder.productionProgressPct >= 100}
                    className="px-3 py-2 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white border border-slate-200 text-slate-800 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                    title="Aumentar 5%"
                  >
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span>+5%</span>
                  </button>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Atalhos:</span>
                  {[0, 25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        if (onUpdateOrderProgress) {
                          onUpdateOrderProgress(selectedOrder.id, pct);
                        }
                        setSelectedOrder((prev) => (prev ? { ...prev, productionProgressPct: pct } : null));
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedOrder.productionProgressPct === pct
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {pct === 0 ? '0% (Fila)' : pct === 100 ? '100% (Pronto)' : `${pct}%`}
                    </button>
                  ))}
                </div>

                {/* Delivery Toggle Checkbox inside Modal */}
                <div className="pt-3 border-t border-indigo-100/80 flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-bold flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-indigo-600" /> Situação da Entrega:
                  </span>
                  <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs font-bold select-none hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedOrder.status === 'Entregue'}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        if (isChecked) {
                          if (onUpdateOrderStatus) onUpdateOrderStatus(selectedOrder.id, 'Entregue');
                          setSelectedOrder((prev) => (prev ? { ...prev, status: 'Entregue' } : null));
                        } else {
                          const fallbackStatus = selectedOrder.productionProgressPct === 100 ? 'Pronto' : selectedOrder.productionProgressPct > 0 ? 'Em produção' : 'Novo';
                          if (onUpdateOrderStatus) onUpdateOrderStatus(selectedOrder.id, fallbackStatus);
                          setSelectedOrder((prev) => (prev ? { ...prev, status: fallbackStatus } : null));
                        }
                      }}
                      className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                    />
                    <span className={selectedOrder.status === 'Entregue' ? 'text-emerald-700' : 'text-slate-700'}>
                      {selectedOrder.status === 'Entregue' ? '✅ Entregue ao Cliente' : '📦 Marcar como Entregue'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Items do Pedido com Thumbnails Ampliáveis */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs">Itens do Pedido ({selectedOrder.items.length}):</h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  <div className="divide-y divide-slate-100">
                    {selectedOrder.items.map((i, idx) => {
                      const matchingProduct = products.find(
                        (p) =>
                          p.name.toLowerCase() === i.productName.toLowerCase() ||
                          i.productName.toLowerCase().includes(p.name.toLowerCase())
                      );

                      return (
                        <div key={idx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Product Thumbnail */}
                            <div
                              onClick={() => {
                                if (matchingProduct?.imageUrl) {
                                  setZoomImage({ url: matchingProduct.imageUrl, title: i.productName });
                                }
                              }}
                              className={`w-11 h-11 rounded-xl bg-indigo-100/80 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden border border-slate-200 ${matchingProduct?.imageUrl ? 'cursor-zoom-in hover:scale-105 transition-transform' : ''
                                }`}
                              title={matchingProduct?.imageUrl ? 'Clique para ampliar foto' : undefined}
                            >
                              {matchingProduct?.imageUrl ? (
                                <img
                                  src={matchingProduct.imageUrl}
                                  alt={i.productName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>3D</span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <h5 className="font-bold text-slate-900 text-xs">{i.productName}</h5>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                R$ {i.unitPrice ? i.unitPrice.toFixed(2).replace('.', ',') : (i.subtotal / i.quantity).toFixed(2).replace('.', ',')} un
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-black text-slate-800">
                              {i.quantity} {i.quantity === 1 ? 'un' : 'uns'}
                            </span>
                            <span className="font-black text-emerald-600 text-xs">
                              R$ {i.subtotal.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Order Description / Notes Block */}
              {selectedOrder.notes && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" /> Observações & Descrição do Pedido:
                  </h4>
                  <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-xl text-slate-800 italic font-medium text-xs">
                    {selectedOrder.notes}
                  </div>
                </div>
              )}

              {/* Internal Logistics Breakdown */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-indigo-600" /> Relatório Interno de Custo de Deslocamento/Frete
                  </span>
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200">
                    🔒 Somente Visão da Oficina
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-medium">Modalidade</span>
                    <span className="font-bold text-slate-800">
                      {selectedOrder.internalLogisticsType === 'frete'
                        ? '🚚 Frete / Motoboy'
                        : selectedOrder.internalLogisticsType === 'retirada'
                          ? '🚗 Retirada na Oficina'
                          : '⛽ Combustível (Deslocamento)'}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-medium">Custo de Logística</span>
                    <span className="font-extrabold text-rose-600">
                      R$ {(selectedOrder.internalLogisticsCost ?? 50.0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-medium">Lucro Líquido Real</span>
                    <span className="font-black text-emerald-600">
                      R$ {Math.max(0, selectedOrder.totalValue - (selectedOrder.internalLogisticsCost ?? 50.0)).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900">Linha do Tempo:</h4>
                <div className="space-y-3 pl-4 border-l-2 border-indigo-200">
                  {selectedOrder.timeline.map((t, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                      <p className="font-bold text-slate-900">{t.title} ({t.date})</p>
                      {t.description && <p className="text-slate-500 mt-0.5">{t.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable PDF Modal Overlay for Order */}
      {previewPdfOrder && (
        <div className="printable-quote-modal fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="print-container bg-white w-full max-w-3xl rounded-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header (Hidden on Print) */}
            <div className="no-print p-4 bg-slate-800 text-white flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" /> Preview do Documento PDF do Pedido (Formato A4)
              </span>
              <button
                onClick={() => setPreviewPdfOrder(null)}
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
                    PEDIDO DE VENDA {previewPdfOrder.id}
                  </span>
                  <p className="text-slate-500 mt-2 text-xs">Data de Emissão: {previewPdfOrder.date}</p>
                  <p className="text-slate-500 text-xs">Status: {previewPdfOrder.status} ({previewPdfOrder.productionProgressPct}%)</p>
                </div>
              </div>

              {/* Client info */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900 text-sm">CLIENTE: {previewPdfOrder.clientName}</p>
                {previewPdfOrder.clientDocument && (
                  <p className="text-slate-600 font-medium">CPF/CNPJ: {previewPdfOrder.clientDocument}</p>
                )}
                {previewPdfOrder.clientPhone && (
                  <p className="text-slate-600 font-medium">Telefone / Contato: {previewPdfOrder.clientPhone}</p>
                )}
              </div>

              {/* Items Table with Thumbnails */}
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
                  {previewPdfOrder.items.map((item, idx) => {
                    const matchingProduct = products.find(
                      (p) =>
                        p.name.toLowerCase() === item.productName.toLowerCase() ||
                        item.productName.toLowerCase().includes(p.name.toLowerCase())
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
                            <p className="font-bold text-slate-900">{item.productName}</p>
                            {matchingProduct?.storageCapacity && (
                              <p className="text-[10px] text-indigo-600 font-semibold">
                                Cap: {matchingProduct.storageCapacity}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 text-center font-bold">{item.quantity}</td>
                        <td className="py-2.5 text-right text-slate-600">
                          R$ {(item.unitPrice || 0).toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-2.5 text-right font-bold text-slate-900">
                          R$ {item.subtotal.toFixed(2).replace('.', ',')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Description / Notes Box */}
              {previewPdfOrder.notes && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                  <p className="font-bold text-slate-900 text-[11px]">Observações / Descrição do Pedido:</p>
                  <p className="text-slate-700 italic">{previewPdfOrder.notes}</p>
                </div>
              )}

              {/* Totals & Conditions */}
              <div className="border-t-2 border-slate-200 pt-4 flex justify-between items-end">
                <div className="space-y-1 text-[11px] max-w-md">
                  {previewPdfOrder.paymentTerms && (
                    <p>
                      <strong>Condições de Pagamento:</strong> {previewPdfOrder.paymentTerms}
                    </p>
                  )}
                  <p>
                    <strong>Situação Financeira:</strong> {previewPdfOrder.paymentStatusText}
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <p className="text-slate-500">
                    Valor Pago (Sinal): R$ {(previewPdfOrder.paidAmount || 0).toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-rose-600">
                    Saldo Restante: R$ {Math.max(0, previewPdfOrder.totalValue - (previewPdfOrder.paidAmount || 0)).toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-xl font-black text-slate-900 pt-1 border-t border-slate-300">
                    TOTAL PEDIDO: R$ {previewPdfOrder.totalValue.toFixed(2).replace('.', ',')}
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

            {/* Modal Actions Footer */}
            <div className="no-print p-4 bg-slate-100 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setPreviewPdfOrder(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-xs cursor-pointer"
              >
                Fechar
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
