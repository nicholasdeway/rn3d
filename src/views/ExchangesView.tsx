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
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-300 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                NOTA DE TROCA — {selectedExchange.id}
              </h3>
              <button
                onClick={() => setSelectedExchange(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Printed Document */}
            <div className="p-8 space-y-6 text-xs bg-white">
              <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">RN 3D Impressão 3D</h4>
                  <p className="text-slate-500">Sistema Interno de Controle de Consignação</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-bold text-indigo-600">{selectedExchange.id}</span>
                  <p className="text-slate-500">Data: {selectedExchange.date}</p>
                </div>
              </div>

              <div>
                <p>
                  <strong>Cliente:</strong> {selectedExchange.clientName}
                </p>
                <p>
                  <strong>Responsável RN 3D:</strong> {selectedExchange.responsible}
                </p>
              </div>

              {/* Items Removed Table */}
              <div className="space-y-2">
                <h5 className="font-bold text-rose-700 uppercase tracking-wider text-[11px] border-b border-rose-200 pb-1">
                  Produtos Retirados do Estabelecimento:
                </h5>
                <ul className="space-y-1">
                  {selectedExchange.itemsRemoved.map((item, idx) => (
                    <li key={idx} className="flex justify-between bg-rose-50 p-2.5 rounded-lg font-medium text-rose-900">
                      <span>{item.quantity}x {item.productName}</span>
                      <span className="text-rose-600 text-[11px] font-normal">{item.reason || 'Baixo giro'}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Items Added Table */}
              <div className="space-y-2">
                <h5 className="font-bold text-emerald-700 uppercase tracking-wider text-[11px] border-b border-emerald-200 pb-1">
                  Produtos Adicionados para Reposição:
                </h5>
                <ul className="space-y-1">
                  {selectedExchange.itemsAdded.map((item, idx) => (
                    <li key={idx} className="flex justify-between bg-emerald-50 p-2.5 rounded-lg font-medium text-emerald-900">
                      <span>{item.quantity}x {item.productName}</span>
                      <span className="text-emerald-700 font-bold">Incluso no expositor</span>
                    </li>
                  ))}
                </ul>
              </div>

              {selectedExchange.notes && (
                <p className="text-slate-500 italic pt-2 border-t border-slate-100">
                  Observações: {selectedExchange.notes}
                </p>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-slate-400 text-xs">RN 3D - Impressões 3D Personalizadas</span>
              <button
                onClick={() => alert('Gerando Nota de Troca em formato PDF A4...')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 text-xs shadow-xs"
              >
                <Printer className="w-4 h-4" /> Gerar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
