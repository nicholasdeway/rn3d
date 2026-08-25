import React, { useState } from 'react';
import { SaleTransaction, Consignment, Order } from '../types';
import { DollarSign, Wallet, ArrowUpRight, Clock, CheckCircle2, Plus, X, HandCoins, TrendingUp } from 'lucide-react';
import { formatDateBR } from '../utils/formatters';

interface FinancialViewProps {
  transactions: SaleTransaction[];
  consignments?: Consignment[];
  orders?: Order[];
  onUpdateOrderPayment?: (orderId: string, additionalAmount: number) => void;
}

export const FinancialView: React.FC<FinancialViewProps> = ({
  transactions = [],
  consignments = [],
  orders = [],
  onUpdateOrderPayment,
}) => {
  const [tab, setTab] = useState<'extrato' | 'entradas' | 'receber'>('extrato');
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState<string>('');

  // 1. Calculate Real Financial Metrics from Orders + Transactions + Consignments
  const ordersTotalPaid = orders.reduce((acc, o) => acc + (o.paidAmount || 0), 0);
  const transactionsTotal = transactions
    .filter((t) => t.status === 'Recebido' || !t.status)
    .reduce((acc, t) => acc + t.amount, 0);

  const totalReceived = ordersTotalPaid + transactionsTotal;

  const ordersPendingReceivable = orders.reduce(
    (acc, o) => acc + Math.max(0, o.totalValue - (o.paidAmount || 0)),
    0
  );
  const consignmentsTotalReceivable = consignments.reduce((acc, c) => acc + c.totalValue, 0);

  const totalReceivable = ordersPendingReceivable + consignmentsTotalReceivable;

  const ordersGrossTotal = orders.reduce((acc, o) => acc + o.totalValue, 0);
  const totalGrossSales = ordersGrossTotal + transactionsTotal;

  const totalOperationsCount = orders.length + transactions.length;
  const averageTicket = totalOperationsCount > 0 ? totalGrossSales / totalOperationsCount : 0;

  const handleOpenPaymentModal = (order: Order) => {
    setSelectedOrderForPayment(order);
    const remaining = Math.max(0, order.totalValue - (order.paidAmount || 0));
    setPaymentAmountInput(remaining.toFixed(2));
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForPayment || !onUpdateOrderPayment) return;
    const val = parseFloat(paymentAmountInput.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;

    onUpdateOrderPayment(selectedOrderForPayment.id, val);
    setSelectedOrderForPayment(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            Gestão Financeira, Vendas e Pagamentos
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Acompanhamento em tempo real de entradas em caixa, pedidos faturados e saldos pendentes a receber.
          </p>
        </div>
      </div>

      {/* Dynamic KPI Cards (Definance 2x2 Mobile Layout) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="definance-kpi-card bg-white dark:bg-[#12151c] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs hover:border-emerald-500/40 dark:hover:border-emerald-500/40 cursor-pointer">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
              Total Recebido
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 sm:mt-3 tracking-tight truncate">
            R$ {totalReceived.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 truncate">
            Entrou em Caixa
          </p>
        </div>

        <div className="definance-kpi-card bg-white dark:bg-[#12151c] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs hover:border-indigo-500/40 dark:hover:border-indigo-500/40 cursor-pointer">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
              Saldo a Receber
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
              <DollarSign className="w-4 h-4 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2 sm:mt-3 tracking-tight truncate">
            R$ {totalReceivable.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 truncate">
            Pendente em pedidos
          </p>
        </div>

        <div className="definance-kpi-card bg-white dark:bg-[#12151c] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs hover:border-purple-500/40 dark:hover:border-purple-500/40 cursor-pointer">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
              Total Emitido
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
              <Wallet className="w-4 h-4 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 sm:mt-3 tracking-tight truncate">
            R$ {totalGrossSales.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 truncate">
            Faturamento bruto
          </p>
        </div>

        <div className="definance-kpi-card bg-white dark:bg-[#12151c] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs hover:border-blue-500/40 dark:hover:border-blue-500/40 cursor-pointer">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
              Ticket Médio
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
              <HandCoins className="w-4 h-4 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 sm:mt-3 tracking-tight truncate">
            R$ {averageTicket.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 truncate">
            Média por pedido
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-2">
        <button
          onClick={() => setTab('extrato')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'extrato'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Extrato Completo de Vendas & Pedidos ({orders.length + transactions.length})
        </button>
        <button
          onClick={() => setTab('entradas')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'entradas'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Entradas em Caixa (Pagamentos Confirmados)
        </button>
        <button
          onClick={() => setTab('receber')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'receber'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Contas a Receber / Financiado ({orders.filter((o) => o.totalValue > (o.paidAmount || 0)).length})
        </button>
      </div>

      {/* TAB 1: Extrato Completo de Vendas & Pedidos */}
      {tab === 'extrato' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {orders.length === 0 && transactions.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Wallet className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">Nenhum pedido ou transação financeira</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Assim que orçamentos forem convertidos em pedidos ou vendas forem efetuadas, o faturamento aparecerá aqui.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Código</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Data</th>
                    <th className="p-4 text-right">Valor Total</th>
                    <th className="p-4 text-right">Entrou em Caixa</th>
                    <th className="p-4 text-right">A Receber / Saldo</th>
                    <th className="p-4">Status Pagamento</th>
                    <th className="p-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Orders */}
                  {orders.map((o) => {
                    const paid = o.paidAmount || 0;
                    const pending = Math.max(0, o.totalValue - paid);
                    const isFullyPaid = pending === 0;

                    let statusBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                    if (isFullyPaid) statusBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold';
                    else if (paid > 0) statusBadge = 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold';

                    return (
                      <tr key={o.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="p-4 font-mono font-bold text-indigo-600">{o.id}</td>
                        <td className="p-4 font-bold text-slate-900">{o.clientName}</td>
                        <td className="p-4 text-slate-600">{formatDateBR(o.date)}</td>
                        <td className="p-4 text-right font-extrabold text-slate-900">
                          R$ {o.totalValue.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="p-4 text-right font-extrabold text-emerald-600">
                          R$ {paid.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="p-4 text-right font-extrabold text-rose-600">
                          R$ {pending.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] border ${statusBadge}`}>
                            {isFullyPaid ? 'Totalmente Pago' : o.paymentStatusText || 'Pendente'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {!isFullyPaid ? (
                            <button
                              onClick={() => handleOpenPaymentModal(o)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <HandCoins className="w-3.5 h-3.5" /> Registrar Recebimento
                            </button>
                          ) : (
                            <span className="text-emerald-600 font-bold flex items-center justify-end gap-1 text-[11px]">
                              <CheckCircle2 className="w-4 h-4" /> Quitado
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Direct Sale Transactions */}
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors bg-slate-50/40 dark:bg-slate-900/40">
                      <td className="p-4 font-mono font-bold text-emerald-600">{t.id}</td>
                      <td className="p-4 font-bold text-slate-900">{t.clientName}</td>
                      <td className="p-4 text-slate-600">{formatDateBR(t.date)}</td>
                      <td className="p-4 text-right font-extrabold text-slate-900">
                        R$ {t.amount.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="p-4 text-right font-extrabold text-emerald-600">
                        R$ {t.amount.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="p-4 text-right font-extrabold text-slate-400">R$ 0,00</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {t.status || 'Recebido'} ({t.paymentMethod || 'PIX'})
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-emerald-600 font-bold flex items-center justify-end gap-1 text-[11px]">
                          <CheckCircle2 className="w-4 h-4" /> Recebido
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Entradas em Caixa (Pagamentos Confirmados) */}
      {tab === 'entradas' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Origem / Código</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Data</th>
                  <th className="p-4 text-right">Valor Entrado em Caixa</th>
                  <th className="p-4">Status de Confirmação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders
                  .filter((o) => (o.paidAmount || 0) > 0)
                  .map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="p-4 font-mono font-bold text-indigo-600">{o.id}</td>
                      <td className="p-4 font-bold text-slate-900">{o.clientName}</td>
                      <td className="p-4 text-slate-600">{formatDateBR(o.date)}</td>
                      <td className="p-4 text-right font-extrabold text-emerald-600">
                        R$ {(o.paidAmount || 0).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="p-4 font-semibold text-emerald-700">
                        <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full font-bold">
                          ✓ Recebido no Sinal / Entrada
                        </span>
                      </td>
                    </tr>
                  ))}
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="p-4 font-mono font-bold text-emerald-600">{t.id}</td>
                    <td className="p-4 font-bold text-slate-900">{t.clientName}</td>
                    <td className="p-4 text-slate-600">{formatDateBR(t.date)}</td>
                    <td className="p-4 text-right font-extrabold text-emerald-600">
                      R$ {t.amount.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="p-4 font-semibold text-emerald-700">
                      <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full font-bold">
                        ✓ Venda Confirmada ({t.paymentMethod})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Contas a Receber / Financiados */}
      {tab === 'receber' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Pedido / Loja</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4 text-right">Valor Total Pedido</th>
                  <th className="p-4 text-right">Valor Já Pago</th>
                  <th className="p-4 text-right">Saldo Pendente (A Receber)</th>
                  <th className="p-4 text-right">Ação de Recebimento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders
                  .filter((o) => o.totalValue > (o.paidAmount || 0))
                  .map((o) => {
                    const remaining = o.totalValue - (o.paidAmount || 0);
                    return (
                      <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono font-bold text-indigo-600">{o.id}</td>
                        <td className="p-4 font-bold text-slate-900">{o.clientName}</td>
                        <td className="p-4 text-right font-bold text-slate-700">
                          R$ {o.totalValue.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="p-4 text-right font-bold text-emerald-600">
                          R$ {(o.paidAmount || 0).toFixed(2).replace('.', ',')}
                        </td>
                        <td className="p-4 text-right font-extrabold text-rose-600">
                          R$ {remaining.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleOpenPaymentModal(o)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <HandCoins className="w-3.5 h-3.5" /> Dar Baixa / Quitar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                {consignments.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors bg-purple-50/30">
                    <td className="p-4 font-mono font-bold text-purple-600">{c.id} (Consignação)</td>
                    <td className="p-4 font-bold text-slate-900">{c.clientName}</td>
                    <td className="p-4 text-right font-bold text-slate-700">
                      R$ {c.totalValue.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="p-4 text-right font-bold text-slate-400">R$ 0,00</td>
                    <td className="p-4 text-right font-extrabold text-indigo-600">
                      R$ {c.totalValue.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-purple-700 font-semibold text-xs">
                        Acerto na Visita
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Entry Modal */}
      {selectedOrderForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-300 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-emerald-600" />
                Registrar Pagamento — {selectedOrderForPayment.id}
              </h3>
              <button
                onClick={() => setSelectedOrderForPayment(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900 text-sm">Cliente: {selectedOrderForPayment.clientName}</p>
                <p className="text-slate-600">
                  Valor Total do Pedido: <strong>R$ {selectedOrderForPayment.totalValue.toFixed(2).replace('.', ',')}</strong>
                </p>
                <p className="text-emerald-700 font-semibold">
                  Valor Já Pago: <strong>R$ {(selectedOrderForPayment.paidAmount || 0).toFixed(2).replace('.', ',')}</strong>
                </p>
                <p className="text-rose-600 font-bold">
                  Saldo Restante: <strong>R$ {(selectedOrderForPayment.totalValue - (selectedOrderForPayment.paidAmount || 0)).toFixed(2).replace('.', ',')}</strong>
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Valor Entrado em Caixa (R$) *
                </label>
                <input
                  type="text"
                  required
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(e.target.value)}
                  placeholder="Ex: 27,50"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-extrabold text-emerald-600 text-base"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForPayment(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  Confirmar Entrada em Caixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
