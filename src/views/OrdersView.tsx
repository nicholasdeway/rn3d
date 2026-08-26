import React, { useState } from 'react';
import { Order, Product } from '../types';
import { ShoppingCart, Printer, X, Truck, FileText, Plus, Minus, CheckCircle2, Clock, Play, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { ImageLightboxModal } from '../components/ImageLightboxModal';
import { formatDateBR } from '../utils/formatters';

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
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
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

  const toggleExpandOrder = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const renderInlineOrderDetails = (o: Order) => (
    <div className="p-4 sm:p-6 bg-slate-50/90 dark:bg-[#181c26] rounded-2xl border border-slate-200/90 dark:border-[#202531] space-y-5 animate-in fade-in duration-150 my-2 text-left">
      {/* Top Header info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
            Detalhes Completos do Pedido <span className="font-mono text-indigo-600 dark:text-indigo-400">#{o.id}</span> — {o.clientName}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPreviewPdfOrder(o);
            }}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" /> PDF A4 do Pedido
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpandOrder(o.id);
            }}
            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <ChevronUp className="w-4 h-4" /> Recolher
          </button>
        </div>
      </div>

      {/* 3D Print Progress Bar & 5% Stepper */}
      <div className="p-4 bg-white dark:bg-[#12151c] rounded-2xl border border-slate-200 dark:border-[#202531] space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs shrink-0">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                Progresso de Impressão 3D
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Regule o avanço da produção das peças na impressora 3D</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className={`text-sm font-black font-mono px-3 py-1 rounded-xl border transition-colors ${
              o.productionProgressPct === 100
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : o.productionProgressPct > 0
                  ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
            }`}>
              {o.productionProgressPct}%
            </span>
          </div>
        </div>

        {/* Progress Bar Display */}
        <div className="w-full h-3 bg-slate-200/90 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner flex">
          <div
            className={`h-full transition-all duration-300 ${
              o.productionProgressPct === 100
                ? 'bg-emerald-500'
                : o.productionProgressPct >= 50
                  ? 'bg-indigo-600'
                  : 'bg-cyan-500'
            }`}
            style={{ width: `${o.productionProgressPct}%` }}
          />
        </div>

        {/* 5% Stepper Controls (Fixed duplicate + signs) */}
        <div className="flex items-center gap-3 pt-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              const newPct = Math.max(0, o.productionProgressPct - 5);
              if (onUpdateOrderProgress) onUpdateOrderProgress(o.id, newPct);
            }}
            disabled={o.productionProgressPct <= 0}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            title="Diminuir 5%"
          >
            <Minus className="w-4 h-4 text-rose-500" />
            <span>5%</span>
          </button>

          <div className="flex-1 px-1">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={o.productionProgressPct}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                if (onUpdateOrderProgress) onUpdateOrderProgress(o.id, val);
              }}
              className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              const newPct = Math.min(100, o.productionProgressPct + 5);
              if (onUpdateOrderProgress) onUpdateOrderProgress(o.id, newPct);
            }}
            disabled={o.productionProgressPct >= 100}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            title="Aumentar 5%"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>5%</span>
          </button>
        </div>

        {/* Preset Chips (Smaller, compact mobile tags) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">Atalhos:</span>
          {[0, 25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => {
                if (onUpdateOrderProgress) onUpdateOrderProgress(o.id, pct);
              }}
              className={`px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                o.productionProgressPct === pct
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {pct === 0 ? '0% (Fila)' : pct === 100 ? '100%' : `${pct}%`}
            </button>
          ))}
        </div>

        {/* Delivery Toggle Checkbox inside Inline View (Fixed double checkmark & mobile layout) */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs" onClick={(e) => e.stopPropagation()}>
          <span className="text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" /> Situação da Entrega:
          </span>
          <label className="inline-flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs font-bold select-none hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors self-start sm:self-auto">
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
            <span className={o.status === 'Entregue' ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-slate-700 dark:text-slate-300'}>
              {o.status === 'Entregue' ? 'Entregue ao Cliente' : 'Pendente (Não entregue)'}
            </span>
          </label>
        </div>
      </div>

      {/* Items do Pedido com Thumbnails Ampliáveis */}
      <div className="space-y-2">
        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">Itens do Pedido ({o.items.length}):</h4>
        <div className="border border-slate-200 dark:border-[#202531] rounded-2xl overflow-hidden bg-white dark:bg-[#12151c]">
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {o.items.map((i, idx) => {
              const matchingProduct = products.find(
                (p) =>
                  p.name.toLowerCase() === i.productName.toLowerCase() ||
                  i.productName.toLowerCase().includes(p.name.toLowerCase())
              );

              return (
                <div key={idx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Product Thumbnail */}
                    <div
                      onClick={(e) => {
                        if (matchingProduct?.imageUrl) {
                          e.stopPropagation();
                          setZoomImage({ url: matchingProduct.imageUrl, title: i.productName });
                        }
                      }}
                      className={`w-11 h-11 rounded-xl bg-indigo-100/80 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700 ${matchingProduct?.imageUrl ? 'cursor-zoom-in hover:scale-105 transition-transform' : ''
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
                      <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs">{i.productName}</h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        R$ {i.unitPrice ? i.unitPrice.toFixed(2).replace('.', ',') : (i.subtotal / i.quantity).toFixed(2).replace('.', ',')} un
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black text-slate-800 dark:text-slate-200">
                      {i.quantity} {i.quantity === 1 ? 'un' : 'uns'}
                    </span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">
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
      {o.notes && (
        <div className="space-y-1.5">
          <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs">
            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Observações & Descrição do Pedido:
          </h4>
          <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-900/50 rounded-xl text-slate-800 dark:text-amber-200 italic font-medium text-xs">
            {o.notes}
          </div>
        </div>
      )}

      {/* Internal Logistics Breakdown (Fixed mobile layout stacking) */}
      <div className="p-4 bg-white dark:bg-[#12151c] rounded-2xl border border-slate-200/80 dark:border-[#202531] space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4">
          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" /> Relatório Interno de Custo de Deslocamento/Frete
          </span>
          <span className="self-start sm:self-auto px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold rounded-full border border-amber-200 dark:border-amber-900 shrink-0">
            🔒 Somente Visão da Oficina
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 block font-medium">Modalidade</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {o.internalLogisticsType === 'frete'
                ? '🚚 Frete / Motoboy'
                : o.internalLogisticsType === 'retirada'
                  ? '🚗 Retirada na Oficina'
                  : '⛽ Combustível (Deslocamento)'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 block font-medium">Custo de Logística</span>
            <span className="font-extrabold text-rose-600 dark:text-rose-400">
              R$ {(o.internalLogisticsCost ?? 0).toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 block font-medium">Lucro Líquido Real</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400">
              R$ {Math.max(0, o.totalValue - (o.internalLogisticsCost ?? 0)).toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">Linha do Tempo:</h4>
        <div className="space-y-3 pl-4 border-l-2 border-indigo-200 dark:border-indigo-900">
          {o.timeline.map((t, idx) => (
            <div key={idx} className="relative">
              <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400 ring-4 ring-slate-50 dark:ring-[#181c26]" />
              <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">{t.title} ({t.date})</p>
              {t.description && <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{t.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#12151c] p-6 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Pedidos de Venda e Produção
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Acompanhe a fila de impressão 3D, regulagem de 5 em 5%, controle de entrega, faturamento e PDFs.
          </p>
        </div>
      </div>

      {/* Orders Table or Clean Empty State */}
      {orders.length === 0 ? (
        <div className="bg-white dark:bg-[#12151c] rounded-2xl border border-slate-200/80 dark:border-[#202531] p-12 text-center shadow-xs space-y-3">
          <ShoppingCart className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">Nenhum pedido de venda cadastrado</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Os pedidos aparecem aqui automaticamente assim que você converter um orçamento comercial em pedido.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout (< 768px) - Eliminates Horizontal Scroll */}
          <div className="block md:hidden space-y-3">
            {filteredOrders.map((o) => {
              const isExpanded = expandedOrderId === o.id;

              return (
                <div
                  key={o.id}
                  className={`bg-white dark:bg-[#12151c] p-4 rounded-2xl border transition-all ${
                    isExpanded
                      ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/10 shadow-md'
                      : 'border-slate-200/90 dark:border-[#202531] hover:border-indigo-300 dark:hover:border-indigo-800 shadow-xs'
                  }`}
                >
                  {/* Card Header: Order ID & Interactive 5% Production Progress */}
                  <div
                    onClick={() => toggleExpandOrder(o.id)}
                    className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 cursor-pointer"
                  >
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-1 rounded-lg">
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
                        className="p-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 disabled:opacity-30 rounded-md cursor-pointer transition-colors active:scale-95"
                        title="Diminuir 5%"
                      >
                        <Minus className="w-3 h-3 text-rose-500" />
                      </button>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                        o.status === 'Entregue'
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-extrabold'
                          : o.productionProgressPct === 100
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900'
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
                        className="p-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 disabled:opacity-30 rounded-md cursor-pointer transition-colors active:scale-95"
                        title="Aumentar 5%"
                      >
                        <Plus className="w-3 h-3 text-emerald-600" />
                      </button>
                    </div>
                  </div>

                  {/* Card Body: Client Name, Items, Delivery Checkbox & Total */}
                  <div
                    onClick={() => toggleExpandOrder(o.id)}
                    className="flex items-start justify-between gap-2 py-2 cursor-pointer"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{o.clientName}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Data: {o.date} • {o.itemsCount} {o.itemsCount === 1 ? 'item' : 'itens'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          o.attendanceMode === 'online'
                            ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                        }`}>
                          {o.attendanceMode === 'online' ? '💬 Atendimento Online' : '📍 Visita Presencial'}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          Pagamento: <strong className="text-slate-900 dark:text-slate-100">{o.paymentStatusText}</strong>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block">Valor Total</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                        R$ {o.totalValue.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  {/* Delivery Toggle Checkbox for Mobile */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                    <label
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold select-none transition-colors"
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
                      <span className={o.status === 'Entregue' ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-600 dark:text-slate-400'}>
                        {o.status === 'Entregue' ? 'Entregue' : 'Não entregue'}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => toggleExpandOrder(o.id)}
                      className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold inline-flex items-center gap-1 cursor-pointer text-xs transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" /> Fechar
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" /> Detalhes
                        </>
                      )}
                    </button>
                  </div>

                  {/* Inline Expanded Details (Mobile) */}
                  {isExpanded && renderInlineOrderDetails(o)}
                </div>
              );
            })}
          </div>

          {/* Desktop Table Layout (>= 768px) */}
          <div className="hidden md:block bg-white dark:bg-[#12151c] rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#181c26] border-b border-slate-200 dark:border-[#202531] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
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
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {filteredOrders.map((o) => {
                    const isExpanded = expandedOrderId === o.id;

                    return (
                      <React.Fragment key={o.id}>
                        <tr
                          onClick={() => toggleExpandOrder(o.id)}
                          className={`transition-colors cursor-pointer ${
                            isExpanded
                              ? 'bg-indigo-50/70 dark:bg-[#1c2230]'
                              : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            {o.id}
                          </td>
                          <td className="p-4 font-bold text-slate-900 dark:text-slate-100">{o.clientName}</td>
                          <td className="p-4 text-slate-600 dark:text-slate-400">{formatDateBR(o.date)}</td>
                          <td className="p-4 text-center font-bold text-slate-800 dark:text-slate-200">{o.itemsCount} itens</td>
                          <td className="p-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                            R$ {o.totalValue.toFixed(2).replace('.', ',')}
                          </td>
                          <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">{o.paymentStatusText}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => {
                                  const newPct = Math.max(0, o.productionProgressPct - 5);
                                  if (onUpdateOrderProgress) onUpdateOrderProgress(o.id, newPct);
                                }}
                                disabled={o.productionProgressPct <= 0}
                                className="p-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 disabled:opacity-30 rounded-md cursor-pointer transition-colors active:scale-95"
                                title="Diminuir 5%"
                              >
                                <Minus className="w-3 h-3 text-rose-500" />
                              </button>
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                                o.status === 'Entregue'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-extrabold'
                                  : o.productionProgressPct === 100
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900'
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
                                className="p-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 disabled:opacity-30 rounded-md cursor-pointer transition-colors active:scale-95"
                                title="Aumentar 5%"
                              >
                                <Plus className="w-3 h-3 text-emerald-600" />
                              </button>
                            </div>
                          </td>
                          <td className="p-4">
                            <label
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 cursor-pointer bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold select-none transition-colors"
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
                              <span className={o.status === 'Entregue' ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-600 dark:text-slate-400'}>
                                {o.status === 'Entregue' ? 'Entregue' : 'Não entregue'}
                              </span>
                            </label>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewPdfOrder(o);
                              }}
                              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold inline-flex items-center gap-1 cursor-pointer text-xs"
                              title="Ver Documento PDF A4 do Pedido"
                            >
                              <Printer className="w-3.5 h-3.5" /> PDF
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpandOrder(o.id);
                              }}
                              className={`px-3 py-1.5 rounded-lg font-bold inline-flex items-center gap-1 cursor-pointer text-xs transition-colors ${
                                isExpanded
                                  ? 'bg-indigo-600 text-white shadow-2xs'
                                  : 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900'
                              }`}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-3.5 h-3.5" /> Recolher
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3.5 h-3.5" /> Detalhes
                                </>
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Inline Expanded Details Row (Desktop) */}
                        {isExpanded && (
                          <tr className="bg-slate-50/50 dark:bg-[#181c26]/60 border-b border-slate-200 dark:border-[#202531]">
                            <td colSpan={9} className="p-4 sm:p-6">
                              {renderInlineOrderDetails(o)}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Printable PDF Modal Overlay for Order */}
      {previewPdfOrder && (
        <div className="printable-quote-modal fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          {/* Print CSS Rules - Ensures ONLY the selected order PDF is printed */}
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

              /* Hide all background app elements, headers, sidebars & other order cards */
              body * {
                visibility: hidden !important;
              }

              /* Display ONLY the active PDF document sheet */
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
                background: white !important;
                color: black !important;
              }

              .no-print {
                display: none !important;
              }
            }
          `}</style>

          <div className="print-container bg-white dark:bg-[#12151c] w-full max-w-3xl rounded-2xl border border-slate-300 dark:border-[#202531] overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header (Hidden on Print) */}
            <div className="no-print p-4 bg-slate-800 dark:bg-[#181c26] text-white flex items-center justify-between border-b border-slate-700 dark:border-[#202531]">
              <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" /> Preview do Documento PDF do Pedido (Formato A4)
              </span>
              <button
                onClick={() => setPreviewPdfOrder(null)}
                className="p-1 hover:bg-slate-700 dark:hover:bg-slate-800 rounded-lg text-slate-300 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* A4 Sheet Rendering */}
            <div className="print-sheet p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-900 dark:text-slate-100 bg-white dark:bg-[#12151c]">
              {/* PDF Header */}
              <div className="flex justify-between items-start pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-xl">
                    <ShoppingCart className="w-6 h-6" /> RN 3D Sistema
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Soluções em Impressão 3D & Manufatura Aditiva</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Atendimento Comercial & Logística Integrada</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-mono font-bold block">
                    PEDIDO DE VENDA #{previewPdfOrder.id}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">Data: {formatDateBR(previewPdfOrder.date)}</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                    Status: {previewPdfOrder.status} ({previewPdfOrder.productionProgressPct}%)
                  </span>
                </div>
              </div>

              {/* Client Info Card */}
              <div className="bg-slate-50 dark:bg-[#181c26] p-4 rounded-xl border border-slate-200 dark:border-[#202531] flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Cliente Destinatário</span>
                  <strong className="text-slate-900 dark:text-slate-100 text-sm block">{previewPdfOrder.clientName}</strong>
                  <span className="text-slate-500 dark:text-slate-400 block">Modalidade: {previewPdfOrder.attendanceMode === 'online' ? 'Atendimento Online / WhatsApp' : 'Visita Presencial'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Condição de Pagamento</span>
                  <span className="font-bold text-indigo-700 dark:text-indigo-400 text-xs block">{previewPdfOrder.paymentStatusText}</span>
                </div>
              </div>

              {/* Table of Products in PDF */}
              <table className="w-full text-xs text-left border border-slate-200 dark:border-[#202531] rounded-xl overflow-hidden">
                <thead className="bg-slate-100 dark:bg-[#181c26] text-slate-600 dark:text-slate-300 font-bold uppercase border-b border-slate-200 dark:border-[#202531]">
                  <tr>
                    <th className="p-3">Item / Descrição do Produto</th>
                    <th className="p-3 text-center">Qtd</th>
                    <th className="p-3 text-right">Preço Un.</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {previewPdfOrder.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{it.productName}</td>
                      <td className="p-3 text-center font-bold dark:text-slate-200">{it.quantity}</td>
                      <td className="p-3 text-right dark:text-slate-300">
                        R$ {(it.unitPrice ?? (it.subtotal / it.quantity)).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">
                        R$ {it.subtotal.toFixed(2).replace('.', ',')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* PDF Totals */}
              <div className="flex justify-end pt-2">
                <div className="w-64 bg-slate-50 dark:bg-[#181c26] p-4 rounded-xl border border-slate-200 dark:border-[#202531] space-y-2 text-xs">
                  <div className="flex justify-between font-black text-sm text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-slate-800 pt-2">
                    <span>VALOR TOTAL:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">R$ {previewPdfOrder.totalValue.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Trigger Footer */}
            <div className="no-print p-4 bg-slate-100 dark:bg-[#181c26] border-t border-slate-200 dark:border-[#202531] flex justify-between items-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Imprima ou salve em PDF usando Ctrl + P no seu navegador.</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewPdfOrder(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs inline-flex items-center gap-1.5 transition-all"
                >
                  <Printer className="w-4 h-4" /> Imprimir Documento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox para ampliar imagem do produto */}
      {zoomImage && (
        <ImageLightboxModal
          imageUrl={zoomImage.url}
          title={zoomImage.title}
          onClose={() => setZoomImage(null)}
        />
      )}
    </div>
  );
};
