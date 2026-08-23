import React, { useState } from 'react';
import { Client, ClientInventoryItem, Product, Visit } from '../types';
import {
  MapPin,
  CheckCircle2,
  DollarSign,
  Repeat,
  PackagePlus,
  Receipt,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  AlertCircle,
  Plus,
  Trash2,
  Printer,
} from 'lucide-react';

interface VisitExecutionWizardProps {
  client: Client;
  inventory: ClientInventoryItem[];
  allProducts: Product[];
  onCompleteVisit: (visitData: any) => void;
  onCancel: () => void;
}

export const VisitExecutionWizard: React.FC<VisitExecutionWizardProps> = ({
  client,
  inventory,
  allProducts,
  onCompleteVisit,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Step 1: Conferência (Counted values)
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    inventory.forEach((item) => {
      initial[item.productId] = item.currentQuantity;
    });
    return initial;
  });

  // Step 3: Trocas (Initialized clean)
  const [removals, setRemovals] = useState<Record<string, number>>({});
  const [additionsInExchange, setAdditionsInExchange] = useState<
    { productId: string; name: string; quantity: number }[]
  >([]);

  // Step 4: Reposição (Initialized clean)
  const [restocks, setRestocks] = useState<Record<string, number>>({});

  // Step 5: Pagamento (Initialized clean)
  const [paymentStatus, setPaymentStatus] = useState<'Pago integralmente' | 'Parcial' | 'Não pago'>('Pago integralmente');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'Dinheiro' | 'Cartão' | 'Outro'>('PIX');
  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState('');

  // Calculations
  const auditCalculations = inventory.map((item) => {
    const counted = counts[item.productId] ?? item.currentQuantity;
    const sold = Math.max(0, item.currentQuantity - counted);
    const totalSalesValue = sold * item.unitPrice;
    return {
      ...item,
      counted,
      sold,
      totalSalesValue,
    };
  });

  const totalSoldUnits = auditCalculations.reduce((acc, i) => acc + i.sold, 0);
  const totalRevenueCalculated = auditCalculations.reduce((acc, i) => acc + i.totalSalesValue, 0);

  const totalItemsRemoved = (Object.values(removals) as number[]).reduce((acc, q) => acc + q, 0);
  const totalItemsAddedEx = additionsInExchange.reduce((acc, i) => acc + i.quantity, 0);
  const totalRestockUnits = (Object.values(restocks) as number[]).reduce((acc, q) => acc + q, 0);

  const finalEstimatedStock = auditCalculations.reduce((acc, item) => {
    const rem = removals[item.productId] || 0;
    const addEx = additionsInExchange.find((a) => a.productId === item.productId)?.quantity || 0;
    const res = restocks[item.productId] || 0;
    return acc + (item.counted - rem + addEx + res);
  }, 0);

  const steps = [
    { number: 1, title: 'Conferência' },
    { number: 2, title: 'Vendas' },
    { number: 3, title: 'Trocas' },
    { number: 4, title: 'Reposição' },
    { number: 5, title: 'Pagamento' },
    { number: 6, title: 'Resumo' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden max-w-4xl mx-auto space-y-0 my-4 animate-in fade-in duration-200">
      {/* Top Wizard Header */}
      <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
            Fluxo Rápido de Presença
          </span>
          <h2 className="text-xl font-bold">Realizar Visita — {client.name}</h2>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-slate-50 border-b border-slate-200 p-4 overflow-x-auto">
        <div className="flex items-center justify-between min-w-max gap-2 px-2">
          {steps.map((s) => {
            const isActive = currentStep === s.number;
            const isDone = currentStep > s.number;

            return (
              <div key={s.number} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isDone
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200/70 text-slate-500'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                    {isDone ? '✓' : s.number}
                  </span>
                  <span>{s.title}</span>
                </div>
                {s.number < 6 && <div className="w-6 h-0.5 bg-slate-200 shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Wizard Content Body */}
      <div className="p-6 space-y-6 text-xs">
        {/* STEP 1: CONFERÊNCIA */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Etapa 1 — Contagem de Estoque</h3>
                <p className="text-slate-600 mt-0.5">
                  Conte os produtos que ainda estão fisicamente no expositor do cliente.
                </p>
              </div>
              <Sparkles className="w-6 h-6 text-indigo-500 shrink-0" />
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="p-3.5">Produto</th>
                    <th className="p-3.5 text-center">Qtde Esperada</th>
                    <th className="p-3.5 text-center">Qtde Encontrada</th>
                    <th className="p-3.5 text-center">Unidades Vendidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditCalculations.map((item) => {
                    const diff = item.sold;
                    return (
                      <tr key={item.productId} className="hover:bg-slate-50">
                        <td className="p-3.5 font-bold text-slate-900">{item.productName}</td>
                        <td className="p-3.5 text-center font-bold text-slate-600">
                          {item.currentQuantity}
                        </td>
                        <td className="p-3.5 text-center">
                          <input
                            type="number"
                            min="0"
                            max={item.currentQuantity}
                            value={counts[item.productId] ?? item.currentQuantity}
                            onChange={(e) =>
                              setCounts({
                                ...counts,
                                [item.productId]: Number(e.target.value),
                              })
                            }
                            className="w-20 text-center py-1.5 px-2 border-2 border-indigo-200 rounded-xl font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                          />
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`font-extrabold px-3 py-1 rounded-full ${
                              diff > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {diff > 0 ? `-${diff} vendidas` : '0'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">
                Cálculo Automático de Vendas:
              </span>
              <span className="text-base font-extrabold text-emerald-700">
                {totalSoldUnits} unidades vendidas
              </span>
            </div>
          </div>
        )}

        {/* STEP 2: VENDAS */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <h3 className="font-bold text-emerald-900 text-sm">Etapa 2 — Resumo de Vendas Calculadas</h3>
              <p className="text-emerald-700 mt-0.5">
                Valores calculados com base na conferência efetuada na etapa anterior.
              </p>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="p-3.5">Produto</th>
                    <th className="p-3.5 text-center">Quantidade Vendida</th>
                    <th className="p-3.5 text-right">Preço Unitário</th>
                    <th className="p-3.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditCalculations
                    .filter((i) => i.sold > 0)
                    .map((item) => (
                      <tr key={item.productId} className="hover:bg-slate-50">
                        <td className="p-3.5 font-bold text-slate-900">{item.productName}</td>
                        <td className="p-3.5 text-center font-bold text-slate-800">
                          {item.sold} vendidas
                        </td>
                        <td className="p-3.5 text-right text-slate-600">
                          R$ {item.unitPrice.toFixed(2)}
                        </td>
                        <td className="p-3.5 text-right font-extrabold text-emerald-600">
                          R$ {item.totalSalesValue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="p-5 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-medium block">Total Geral Vendido:</span>
                <span className="text-2xl font-black text-emerald-400">
                  R$ {totalRevenueCalculated.toFixed(2)}
                </span>
              </div>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full font-bold">
                {totalSoldUnits} itens comercializados
              </span>
            </div>
          </div>
        )}

        {/* STEP 3: TROCAS */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <h3 className="font-bold text-amber-900 text-sm">Etapa 3 — Troca de Produtos de Baixo Giro</h3>
              <p className="text-amber-800 mt-0.5">
                Deseja recolher itens parados no cliente e substituir por modelos de maior saída?
              </p>
            </div>

            {/* Removal pick */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-slate-900">1. Selecionar produtos a retirar do local:</h4>
              <div className="space-y-2">
                {auditCalculations.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                    <span className="font-semibold text-slate-800">{item.productName} (Atual: {item.counted})</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[11px]">Qtde a retirar:</span>
                      <input
                        type="number"
                        min="0"
                        max={item.counted}
                        value={removals[item.productId] || 0}
                        onChange={(e) =>
                          setRemovals({
                            ...removals,
                            [item.productId]: Number(e.target.value),
                          })
                        }
                        className="w-16 text-center py-1 border border-slate-300 rounded-lg font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Addition pick */}
            <div className="space-y-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
              <h4 className="font-bold text-slate-900">2. Produtos adicionados na troca:</h4>
              <div className="space-y-2">
                {additionsInExchange.map((add, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900">{add.name}</span>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        value={add.quantity}
                        onChange={(e) => {
                          const updated = [...additionsInExchange];
                          updated[idx].quantity = Number(e.target.value);
                          setAdditionsInExchange(updated);
                        }}
                        className="w-16 text-center py-1 border border-slate-300 rounded-lg font-bold"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setAdditionsInExchange(additionsInExchange.filter((_, i) => i !== idx))
                        }
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-100 rounded-xl flex items-center justify-between font-bold text-slate-800">
              <span>Resumo do Balanço da Troca:</span>
              <span>
                {totalItemsRemoved} itens retirados ↔ {totalItemsAddedEx} itens adicionados
              </span>
            </div>
          </div>
        )}

        {/* STEP 4: REPOSIÇÃO */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h3 className="font-bold text-blue-900 text-sm">Etapa 4 — Reposição de Estoque</h3>
              <p className="text-blue-800 mt-0.5">
                Defina quantas novas unidades você deixará no expositor para reabastecimento.
              </p>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="p-3.5">Produto</th>
                    <th className="p-3.5 text-center">Estoque Atual no Local</th>
                    <th className="p-3.5 text-center">Adicionar Reposição</th>
                    <th className="p-3.5 text-center">Novo Estoque Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditCalculations.map((item) => {
                    const rem = removals[item.productId] || 0;
                    const addEx = additionsInExchange.find((a) => a.productId === item.productId)?.quantity || 0;
                    const base = item.counted - rem + addEx;
                    const addRestock = restocks[item.productId] || 0;
                    const finalStock = base + addRestock;

                    return (
                      <tr key={item.productId} className="hover:bg-slate-50">
                        <td className="p-3.5 font-bold text-slate-900">{item.productName}</td>
                        <td className="p-3.5 text-center font-bold text-slate-600">{base}</td>
                        <td className="p-3.5 text-center">
                          <input
                            type="number"
                            min="0"
                            value={restocks[item.productId] || 0}
                            onChange={(e) =>
                              setRestocks({
                                ...restocks,
                                [item.productId]: Number(e.target.value),
                              })
                            }
                            className="w-20 text-center py-1.5 border-2 border-indigo-200 rounded-xl font-bold text-slate-900"
                          />
                        </td>
                        <td className="p-3.5 text-center font-extrabold text-indigo-700">
                          {finalStock} un
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 5: PAGAMENTO */}
        {currentStep === 5 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-emerald-900 text-sm">Etapa 5 — Registro de Pagamento</h3>
                <p className="text-emerald-800 mt-0.5">
                  Valor total das vendas nesta visita: <strong>R$ {totalRevenueCalculated.toFixed(2)}</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status do Pagamento</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="Pago integralmente">Pago integralmente</option>
                  <option value="Parcial">Pagamento parcial</option>
                  <option value="Não pago">Não pago (Faturar para depois)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Forma de Pagamento</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="PIX">PIX</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Valor Recebido (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-extrabold text-emerald-600 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observações do Acerto</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Ex: Recebido em PIX pelo Carlos"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: RESUMO FINAL */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Printable/Formatted Summary Receipt */}
            <div className="bg-slate-50 border-2 border-indigo-200 rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-indigo-600">VIS-000052</span>
                  <h3 className="text-xl font-bold text-slate-900">{client.name}</h3>
                  <p className="text-xs text-slate-500">
                    10/08/2026 • Atendimento de Visita por Nicholas
                  </p>
                </div>
                <div className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">
                  Visita Concluída
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 block font-medium">Produtos Vendidos:</span>
                  <span className="text-lg font-bold text-slate-900">{totalSoldUnits} un</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 block font-medium">Total Calculado:</span>
                  <span className="text-lg font-bold text-emerald-600">
                    R$ {totalRevenueCalculated.toFixed(2)}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 block font-medium">Total Recebido:</span>
                  <span className="text-lg font-bold text-slate-900">
                    R$ {receivedAmount.toFixed(2)}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 block font-medium">Estoque Final Local:</span>
                  <span className="text-lg font-bold text-indigo-600">{finalEstimatedStock} un</span>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
                <p>
                  <strong>Trocas Efetuadas:</strong> {totalItemsRemoved} itens retirados | {totalItemsAddedEx} itens adicionados.
                </p>
                <p>
                  <strong>Próxima Visita Agendada:</strong> 24/08/2026 (Quinzenal).
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => alert('Comprovante em PDF gerado para compartilhamento no WhatsApp!')}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-slate-600" /> Gerar Comprovante
              </button>
              <button
                type="button"
                onClick={() => alert('Nota de Troca TRC-000014 gerada com sucesso!')}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center gap-2"
              >
                <Repeat className="w-4 h-4 text-slate-600" /> Gerar Nota de Troca
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <button
          disabled={currentStep === 1}
          onClick={() => setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as any) : prev))}
          className="px-4 py-2 text-slate-600 hover:bg-slate-200 disabled:opacity-40 rounded-xl font-bold flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Anterior
        </button>

        {currentStep < 6 ? (
          <button
            onClick={() => setCurrentStep((prev) => (prev < 6 ? ((prev + 1) as any) : prev))}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs"
          >
            Avançar <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() =>
              onCompleteVisit({
                visitId: 'VIS-000052',
                clientId: client.id,
                totalSoldUnits,
                totalRevenueCalculated,
                receivedAmount,
              })
            }
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold flex items-center gap-2 shadow-sm"
          >
            <CheckCircle2 className="w-5 h-5" /> Finalizar Visita
          </button>
        )}
      </div>
    </div>
  );
};
