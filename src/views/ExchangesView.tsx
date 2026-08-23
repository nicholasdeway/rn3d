import React, { useState } from 'react';
import { ExchangeNote } from '../types';
import { Repeat, Printer, X, FileText, CheckCircle2 } from 'lucide-react';

interface ExchangesViewProps {
  exchanges: ExchangeNote[];
}

export const ExchangesView: React.FC<ExchangesViewProps> = ({ exchanges }) => {
  const [selectedExchange, setSelectedExchange] = useState<ExchangeNote | null>(exchanges[0] || null);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Repeat className="w-6 h-6 text-indigo-600" />
            Histórico de Trocas de Produtos
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Registro das notas de troca de itens com baixo giro por modelos de alta rotatividade.
          </p>
        </div>
      </div>

      {/* Exchanges Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">Número</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Data</th>
                <th className="p-4 text-center">Itens Retirados</th>
                <th className="p-4 text-center">Itens Adicionados</th>
                <th className="p-4">Responsável</th>
                <th className="p-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exchanges.map((ex) => {
                const totalRem = ex.itemsRemoved.reduce((acc, i) => acc + i.quantity, 0);
                const totalAdd = ex.itemsAdded.reduce((acc, i) => acc + i.quantity, 0);

                return (
                  <tr
                    key={ex.id}
                    onClick={() => setSelectedExchange(ex)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="p-4 font-mono font-bold text-indigo-600">{ex.id}</td>
                    <td className="p-4 font-bold text-slate-900">{ex.clientName}</td>
                    <td className="p-4 text-slate-600">{ex.date}</td>
                    <td className="p-4 text-center font-bold text-rose-600">-{totalRem} un</td>
                    <td className="p-4 text-center font-bold text-emerald-600">+{totalAdd} un</td>
                    <td className="p-4 font-medium text-slate-700">{ex.responsible}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedExchange(ex);
                        }}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-semibold"
                      >
                        Ver Nota
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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
            {/* Modal Header (Hidden on Print) */}
            <div className="no-print p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" /> Preview do Documento PDF — Nota de Troca
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
                <p className="font-bold text-slate-900 text-sm">ESTABELECIMENTO / CLIENTE: {selectedExchange.clientName}</p>
                <p className="text-slate-600 font-medium">Modalidade: Troca de Produtos em Consignação (Giro de Estoque)</p>
              </div>

              {/* Items Removed Table */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-rose-700 uppercase tracking-wider text-xs flex items-center justify-between border-b border-rose-200 pb-1">
                  <span>🔴 Produtos Retirados (Baixo Giro / Substituição)</span>
                  <span className="font-mono text-rose-800 font-bold">
                    Total: {selectedExchange.itemsRemoved.reduce((acc, i) => acc + i.quantity, 0)} un
                  </span>
                </h3>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-rose-200 text-rose-900 font-bold uppercase text-[10px] bg-rose-50">
                      <th className="p-2">Item / Descrição do Produto</th>
                      <th className="p-2 text-center">Qtde Retirada</th>
                      <th className="p-2 text-right">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100">
                    {selectedExchange.itemsRemoved.map((item, idx) => (
                      <tr key={idx} className="bg-rose-50/40 text-rose-950">
                        <td className="p-2 font-semibold">{item.productName}</td>
                        <td className="p-2 text-center font-bold">{item.quantity} un</td>
                        <td className="p-2 text-right font-medium text-rose-700">{item.reason || 'Baixo giro'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Items Added Table */}
              <div className="space-y-2 pt-2">
                <h3 className="font-extrabold text-emerald-700 uppercase tracking-wider text-xs flex items-center justify-between border-b border-emerald-200 pb-1">
                  <span>🟢 Produtos Adicionados para Reposição (Alta Rotatividade)</span>
                  <span className="font-mono text-emerald-800 font-bold">
                    Total: {selectedExchange.itemsAdded.reduce((acc, i) => acc + i.quantity, 0)} un
                  </span>
                </h3>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-emerald-200 text-emerald-900 font-bold uppercase text-[10px] bg-emerald-50">
                      <th className="p-2">Item / Descrição do Produto</th>
                      <th className="p-2 text-center">Qtde Adicionada</th>
                      <th className="p-2 text-right">Status Reposição</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100">
                    {selectedExchange.itemsAdded.map((item, idx) => (
                      <tr key={idx} className="bg-emerald-50/40 text-emerald-950">
                        <td className="p-2 font-semibold">{item.productName}</td>
                        <td className="p-2 text-center font-bold">{item.quantity} un</td>
                        <td className="p-2 text-right font-medium text-emerald-700">Incluso no Expositor</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              {selectedExchange.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block text-[11px]">Observações Técnicas / Acerto:</span>
                  <p className="text-slate-600 italic text-[11px]">{selectedExchange.notes}</p>
                </div>
              )}

              {/* Signatures Footer */}
              <div className="pt-10 grid grid-cols-2 gap-8 text-center text-slate-700 text-[11px]">
                <div className="border-t border-slate-400 pt-2 space-y-0.5">
                  <p className="font-bold text-slate-900">{selectedExchange.clientName}</p>
                  <p className="text-slate-500">Assinatura do Estabelecimento / Parceiro</p>
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

            {/* Modal Bottom Controls (Hidden on Print) */}
            <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 text-xs font-medium">RN 3D Soluções — Impressão em Formato A4 Padronizado</span>
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
