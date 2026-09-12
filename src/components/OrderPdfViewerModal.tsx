import React from 'react';
import { Order, Client, Product } from '../types';
import { Printer, X, ShoppingCart } from 'lucide-react';
import { formatDateBR } from '../utils/formatters';

interface OrderPdfViewerModalProps {
  order: Order | null;
  clients?: Client[];
  products?: Product[];
  onClose: () => void;
}

export const OrderPdfViewerModal: React.FC<OrderPdfViewerModalProps> = ({
  order,
  clients = [],
  products = [],
  onClose,
}) => {
  if (!order) return null;

  const matchedCli = clients.find(
    (c) => c.id === order.clientId || c.name.toLowerCase().trim() === order.clientName.toLowerCase().trim()
  );

  const displayPaymentTerms = order.paymentTerms || order.paymentMethod || 'À vista / PIX';

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${order.id} - ${order.clientName} - RN 3D`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <div className="printable-quote-modal fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 print:p-0 print:bg-white overflow-y-auto">
      {/* Print CSS Rules */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }

          header, nav, aside, footer, .no-print, [role="alert"] {
            display: none !important;
          }

          #root, #root > div, main {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            background: white !important;
          }

          main > div > *:not(.printable-quote-modal) {
            display: none !important;
          }

          .printable-quote-modal {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
            display: block !important;
            z-index: 999999 !important;
          }

          .print-container {
            position: static !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            height: auto !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            max-height: none !important;
            overflow: visible !important;
            display: block !important;
            background: white !important;
            color: black !important;
          }

          .print-sheet {
            padding: 0 !important;
            margin: 0 !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            background: white !important;
            color: black !important;
            display: block !important;
          }

          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .print-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="print-container bg-white dark:bg-[#12151c] w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-[#202531] shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Top Header (Hidden on Print) */}
        <div className="no-print p-4 bg-slate-50 dark:bg-[#181c26] border-b border-slate-100 dark:border-[#202531] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              Documento PDF do Pedido <span className="font-mono text-indigo-600 dark:text-indigo-400">#{order.id}</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable PDF Area */}
        <div className="print-sheet p-5 sm:p-10 space-y-6 overflow-y-auto text-xs bg-white dark:bg-[#12151c] text-slate-900 dark:text-slate-100 font-sans flex-1">
          {/* Header Branding */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b-2 border-slate-200 dark:border-[#202531] gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">RN 3D Soluções</h2>
              <p className="text-xs font-black text-slate-900 dark:text-slate-200 mt-1">CNPJ: 67.570.155/0001-34</p>
              <p className="text-[11px] text-slate-700 dark:text-slate-400 font-semibold mt-1">
                WhatsApp: (22) 99754-0815 • Instagram: @rn3d.solucoes
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="px-3 py-1 bg-slate-900 dark:bg-indigo-600 text-white font-mono font-bold rounded-md text-xs inline-block whitespace-nowrap shadow-xs">
                PEDIDO DE VENDA #{order.id}
              </span>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-xs">Data: {formatDateBR(order.date)}</p>
              <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xs mt-0.5">
                Status: {order.status} ({order.productionProgressPct || 0}%)
              </p>
            </div>
          </div>

          {/* Client & Payment Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-slate-50 dark:bg-[#181c26] rounded-xl border border-slate-200 dark:border-[#202531] space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Cliente Destinatário</span>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{order.clientName}</p>
              {matchedCli?.document ? (
                <p className="text-slate-600 dark:text-slate-400 font-medium">CPF/CNPJ: {matchedCli.document}</p>
              ) : matchedCli?.phone ? (
                <p className="text-slate-600 dark:text-slate-400 font-medium">Tel: {matchedCli.phone}</p>
              ) : null}
              <p className="text-slate-500 dark:text-slate-400">
                Modalidade: {order.attendanceMode === 'online' ? 'Atendimento Online / WhatsApp' : 'Visita Presencial'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-[#181c26] rounded-xl border border-slate-200 dark:border-[#202531] space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Informações de Pagamento</span>
              <p className="text-slate-900 dark:text-slate-100 font-bold text-xs">
                Forma de Pagamento: <strong className="text-indigo-600 dark:text-indigo-400">{displayPaymentTerms}</strong>
              </p>
              {(() => {
                const paid = Number(order.paidAmount) || 0;
                const total = Number(order.totalValue) || 0;
                const hasReceipt = Boolean(order.paymentReceiptUrl || order.paymentReceiptUrl2);
                const isPaidFull = (total > 0 && paid >= total) || (hasReceipt && paid >= total) || (hasReceipt && paid === 0);
                const isPaidPartial = paid > 0 && !isPaidFull;

                let finText = 'Pendente';
                let finColor = 'text-amber-600 dark:text-amber-400';

                if (isPaidFull || order.paymentStatusText === 'Pago Total' || order.paymentStatusText === 'Quitado') {
                  finText = 'Pago Total (Quitado)';
                  finColor = 'text-emerald-600 dark:text-emerald-400';
                } else if (isPaidPartial) {
                  finText = `Parcial / Adiantamento (R$ ${paid.toFixed(2).replace('.', ',')} pago)`;
                  finColor = 'text-indigo-600 dark:text-indigo-400';
                } else if (order.paymentStatusText && order.paymentStatusText !== 'Pendente') {
                  finText = order.paymentStatusText;
                }

                return (
                  <p className={`font-bold text-xs ${finColor}`}>
                    Situação Financeira: {finText}
                  </p>
                );
              })()}
              {(order.productionSlaDate || order.estimatedDeliveryDate) && (
                <p className="text-slate-500 dark:text-slate-400">
                  Previsão de Entrega: {formatDateBR(order.productionSlaDate || order.estimatedDeliveryDate)}
                </p>
              )}
            </div>
          </div>

          {/* Table of Products in PDF */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[320px]">
              <thead>
                <tr className="border-b-2 border-slate-200 dark:border-[#202531] text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-1.5 sm:px-3">Item / Descrição do Produto</th>
                  <th className="py-2.5 px-1.5 sm:px-3 text-center whitespace-nowrap">Qtd</th>
                  <th className="py-2.5 px-1.5 sm:px-3 text-right whitespace-nowrap">Preço Un.</th>
                  <th className="py-2.5 px-1.5 sm:px-3 text-right whitespace-nowrap">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {(order.items || []).map((it, idx) => {
                  const matchingProduct = products.find(
                    (p) =>
                      p.name.toLowerCase() === it.productName.toLowerCase() ||
                      it.productName.toLowerCase().includes(p.name.toLowerCase()) ||
                      p.name.toLowerCase().includes(it.productName.toLowerCase()) ||
                      (p.id && (it as any).productId && p.id === (it as any).productId)
                  );

                  return (
                    <tr key={idx}>
                      <td className="py-2.5 px-1.5 sm:px-3 font-medium">
                        <div className="flex items-center gap-2.5">
                          {matchingProduct?.imageUrl ? (
                            <img
                              src={matchingProduct.imageUrl}
                              alt=""
                              className="w-9 h-9 sm:w-10 sm:h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                              3D
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">{it.productName}</p>
                            {matchingProduct?.storageCapacity && (
                              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                                Cap: {matchingProduct.storageCapacity}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-1.5 sm:px-3 text-center font-semibold text-slate-700 dark:text-slate-400 whitespace-nowrap">{it.quantity}</td>
                      <td className="py-2.5 px-1.5 sm:px-3 text-right text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        R$ {(it.unitPrice ?? (it.subtotal / (it.quantity || 1))).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="py-2.5 px-1.5 sm:px-3 text-right font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        R$ {it.subtotal.toFixed(2).replace('.', ',')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PDF Totals & Notes */}
          <div className="print-avoid-break border-t-2 border-slate-200 dark:border-[#202531] pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div className="space-y-1 text-[11px] max-w-md">
              {order.notes && (
                <p className="text-slate-500 dark:text-slate-400 italic font-medium">Observações: {order.notes}</p>
              )}
              <p className="text-slate-500 dark:text-slate-400">
                SLA de Fabricação: {order.productionProgressPct === 100 ? 'Produção Concluída (100%)' : `Em andamento (${order.productionProgressPct || 0}%)`}
              </p>
            </div>

            {(() => {
              const paid = Number(order.paidAmount) || 0;
              const total = Number(order.totalValue) || 0;
              const hasReceipt = Boolean(order.paymentReceiptUrl || order.paymentReceiptUrl2);
              const isPaidFull = (total > 0 && paid >= total) || (hasReceipt && paid >= total) || (hasReceipt && paid === 0);
              const effectivePaid = isPaidFull ? total : paid;
              const remaining = Math.max(0, total - effectivePaid);

              return (
                <div className="text-left sm:text-right space-y-1 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-2 sm:pt-0">
                  {effectivePaid > 0 && (
                    <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Valor Pago: R$ {effectivePaid.toFixed(2).replace('.', ',')}
                    </p>
                  )}
                  {remaining > 0 && (
                    <p className="text-rose-600 dark:text-rose-400 font-semibold">
                      Saldo Restante: R$ {remaining.toFixed(2).replace('.', ',')}
                    </p>
                  )}
                  <p className="text-lg font-black text-slate-900 dark:text-slate-100 pt-1">
                    VALOR TOTAL: R$ {total.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Footer */}
          <div className="print-avoid-break pt-6 border-t border-slate-200 dark:border-[#202531] text-center text-[10px] text-slate-600 dark:text-slate-400 space-y-1">
            <p className="font-bold text-slate-900 dark:text-slate-200">
              RN 3D Soluções • CNPJ: 67.570.155/0001-34 • WhatsApp: (22) 99754-0815 • Instagram: @rn3d.solucoes
            </p>
            <p>Obrigado pela preferência e confiança em nosso trabalho!</p>
          </div>
        </div>

        {/* Modal Bottom Actions (Hidden on Print) */}
        <div className="no-print p-4 bg-slate-50 dark:bg-[#181c26] border-t border-slate-100 dark:border-[#202531] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer transition-colors"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs inline-flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-4 h-4" /> Baixar / Imprimir PDF
          </button>
        </div>
      </div>
    </div>
  );
};
