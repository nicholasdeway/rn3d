import React, { useState } from 'react';
import { Order, Product } from '../types';
import { ShoppingCart, Printer, X, Truck, FileText } from 'lucide-react';

interface OrdersViewProps {
  orders: Order[];
  products?: Product[];
  searchQuery?: string;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ orders, products = [], searchQuery = '' }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [previewPdfOrder, setPreviewPdfOrder] = useState<Order | null>(null);

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
            Acompanhe a fila de impressão 3D, status de faturamento, descrições e emissão de PDFs.
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
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
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
                  <th className="p-4">Status Produção</th>
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
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                        {o.status} ({o.productionProgressPct}%)
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewPdfOrder(o);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold inline-flex items-center gap-1 cursor-pointer"
                        title="Ver Documento PDF A4 do Pedido"
                      >
                        <Printer className="w-3.5 h-3.5" /> PDF
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(o);
                        }}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-semibold cursor-pointer"
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
              {/* Progress bar */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Progresso de Impressão 3D:</span>
                  <span className="text-indigo-600">{selectedOrder.productionProgressPct}%</span>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${selectedOrder.productionProgressPct}%` }}
                  />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">Itens do Pedido:</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <tr>
                        <th className="p-3">Produto</th>
                        <th className="p-3 text-center">Qtde</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items.map((i, idx) => (
                        <tr key={idx}>
                          <td className="p-3 font-bold text-slate-900">{i.productName}</td>
                          <td className="p-3 text-center font-bold">{i.quantity}</td>
                          <td className="p-3 text-right font-bold text-emerald-600">
                            R$ {i.subtotal.toFixed(2).replace('.', ',')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
