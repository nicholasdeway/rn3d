import React, { useState } from 'react';
import { Order, Product, Client } from '../types';
import { ShoppingCart, Printer, X, Truck, FileText, Plus, Minus, CheckCircle2, Clock, Play, Sparkles, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { ImageLightboxModal } from '../components/ImageLightboxModal';
import { OrderPdfViewerModal } from '../components/OrderPdfViewerModal';
import { formatDateBR } from '../utils/formatters';

interface OrdersViewProps {
  orders: Order[];
  products?: Product[];
  clients?: Client[];
  searchQuery?: string;
  onUpdateOrderProgress?: (orderId: string, newProgressPct: number) => void;
  onUpdateOrderStatus?: (orderId: string, newStatus: Order['status']) => void;
  onUpdateOrderPayment?: (
    orderId: string,
    additionalAmount: number,
    receiptUrl?: string,
    receiptType?: 'image' | 'pdf',
    receiptName?: string,
    receiptIndex?: 1 | 2
  ) => void;
  onDeleteOrder?: (orderId: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  products = [],
  clients = [],
  searchQuery = '',
  onUpdateOrderProgress,
  onUpdateOrderStatus,
  onUpdateOrderPayment,
  onDeleteOrder,
}) => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
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
            <span className={`text-sm font-black font-mono px-3 py-1 rounded-xl border transition-colors ${o.productionProgressPct === 100
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
            className={`h-full transition-all duration-300 ${o.productionProgressPct === 100
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
              className={`px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${o.productionProgressPct === pct
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
                  className={`bg-white dark:bg-[#12151c] p-4 rounded-2xl border transition-all ${isExpanded
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
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${o.status === 'Entregue'
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
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${o.attendanceMode === 'online'
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

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewPdfOrder(o);
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 rounded-xl font-bold inline-flex items-center gap-1 cursor-pointer text-xs transition-colors shrink-0"
                        title="Ver Documento PDF A4 do Pedido"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>PDF</span>
                      </button>

                      {onDeleteOrder && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingOrderId(o.id);
                          }}
                          className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 rounded-xl font-bold inline-flex items-center gap-1 cursor-pointer text-xs transition-colors"
                          title="Excluir pedido"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir</span>
                        </button>
                      )}

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
                    <th className="p-4 text-left">Pedido</th>
                    <th className="p-4 text-left">Cliente</th>
                    <th className="p-4 text-left">Data</th>
                    <th className="p-4 text-center">Itens</th>
                    <th className="p-4 text-right">Valor</th>
                    <th className="p-4 text-center">Pagamento</th>
                    <th className="p-4 text-center">Progresso</th>
                    <th className="p-4 text-center">Status Entrega</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {filteredOrders.map((o) => {
                    const isExpanded = expandedOrderId === o.id;

                    return (
                      <React.Fragment key={o.id}>
                        <tr
                          onClick={() => toggleExpandOrder(o.id)}
                          className={`transition-colors cursor-pointer ${isExpanded
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
                          <td className="p-4 text-center font-semibold text-slate-700 dark:text-slate-300">{o.paymentStatusText}</td>
                          <td className="p-4 text-center align-middle">
                            <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
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
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${o.status === 'Entregue'
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
                          <td className="p-4 text-center align-middle">
                            <div className="flex items-center justify-center">
                              <label
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 cursor-pointer bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs font-semibold select-none transition-colors"
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
                            </div>
                          </td>
                          <td className="p-4 text-center align-middle">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewPdfOrder(o);
                                }}
                                className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 rounded-xl font-bold inline-flex items-center gap-1 cursor-pointer text-xs transition-colors shrink-0"
                                title="Ver Documento PDF A4 do Pedido"
                              >
                                <Printer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                <span>PDF</span>
                              </button>
                              {onDeleteOrder && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingOrderId(o.id);
                                  }}
                                  className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 rounded-xl font-bold inline-flex items-center gap-1 cursor-pointer text-xs transition-colors shrink-0"
                                  title="Excluir pedido e lançamentos financeiros"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Excluir</span>
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpandOrder(o.id);
                                }}
                                className={`px-2.5 py-1.5 rounded-xl font-bold inline-flex items-center gap-1 cursor-pointer text-xs transition-colors shrink-0 ${isExpanded
                                  ? 'bg-indigo-600 text-white shadow-2xs'
                                  : 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200/80 dark:border-indigo-800/80'
                                  }`}
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3.5 h-3.5" /> Detalhes
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3.5 h-3.5" /> Detalhes
                                  </>
                                )}
                              </button>
                            </div>
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

      {/* MODAL DE PDF DO PEDIDO */}
      {previewPdfOrder && (
        <OrderPdfViewerModal
          order={previewPdfOrder}
          clients={clients}
          products={products}
          onClose={() => setPreviewPdfOrder(null)}
        />
      )}

      {/* Lightbox para ampliar imagem do produto */}
      {zoomImage && (
        <ImageLightboxModal
          imageUrl={zoomImage.url}
          title={zoomImage.title}
          onClose={() => setZoomImage(null)}
        />
      )}

      {/* Confirmation Modal for Order Deletion */}
      {deletingOrderId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#12151c] rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-[#202531] shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-950/80 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Excluir Pedido</h3>
                <p className="text-xs text-slate-500 font-mono">#{deletingOrderId}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Atenção: Ao excluir este pedido, os lançamentos de pagamento associados no <strong>Vendas e Pagamentos / Financeiro</strong> também serão removidos do sistema em cascata.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingOrderId(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (onDeleteOrder && deletingOrderId) {
                    onDeleteOrder(deletingOrderId);
                  }
                  setDeletingOrderId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs transition-colors"
              >
                Sim, Excluir Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
