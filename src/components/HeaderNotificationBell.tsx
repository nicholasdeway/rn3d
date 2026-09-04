import React, { useState } from 'react';
import { Bell, AlertTriangle, Calendar, CheckCircle2, Clock, ArrowRight, ShieldAlert } from 'lucide-react';
import { RecurringBillAlertStatus, RecurringBill, ViewMode } from '../types';

interface HeaderNotificationBellProps {
  billAlerts: RecurringBillAlertStatus[];
  pendingAlertsCount: number;
  urgentAlertsCount: number;
  onMarkPaid: (bill: RecurringBill) => void;
  onNavigate: (view: ViewMode) => void;
}

export const HeaderNotificationBell: React.FC<HeaderNotificationBellProps> = ({
  billAlerts,
  pendingAlertsCount,
  urgentAlertsCount,
  onMarkPaid,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const pendingAlerts = billAlerts.filter((a) => !a.isPaidThisMonth && (a.isOverdue || a.daysRemaining <= 7));
  const paidAlerts = billAlerts.filter((a) => a.isPaidThisMonth);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer shadow-2xs flex items-center justify-center group"
        title="Alertas e Lembretes de Contas Fixas"
      >
        <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />

        {pendingAlertsCount > 0 && (
          <span className={`absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold text-white shadow-xs ${
            urgentAlertsCount > 0 ? 'bg-rose-600 animate-pulse' : 'bg-amber-500'
          }`}>
            {pendingAlertsCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#181c26] rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Contas Fixas & Lembretes</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Avisos automatizados (7 e 3 dias)</p>
                </div>
              </div>
              {pendingAlertsCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  {pendingAlertsCount} pendentes
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Tudo em dia
                </span>
              )}
            </div>

            {/* Content List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-2 divide-y divide-slate-100 dark:divide-slate-800/60">
              {pendingAlerts.length === 0 ? (
                <div className="py-8 text-center px-4 space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nenhum aviso pendente no momento!</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Todas as suas contas fixas do mês estão quitadas ou fora do prazo de alerta.</p>
                </div>
              ) : (
                pendingAlerts.map((item) => {
                  const b = item.bill;
                  const isUrgent = item.isUrgent || item.isOverdue;

                  return (
                    <div
                      key={b.id}
                      className={`p-2.5 rounded-xl transition-all border ${
                        isUrgent
                          ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/70 dark:border-rose-900/40'
                          : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-900/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.isOverdue
                                ? 'bg-rose-600 text-white'
                                : isUrgent
                                ? 'bg-rose-500 text-white animate-pulse'
                                : 'bg-amber-500 text-white'
                            }`}>
                              {item.isOverdue
                                ? 'Vencida!'
                                : item.daysRemaining === 0
                                ? 'Vence Hoje!'
                                : item.daysRemaining === 1
                                ? 'Vence Amanhã!'
                                : `Faltam ${item.daysRemaining} dias`}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {b.category}
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1.5 leading-snug">{b.title}</h5>
                          {b.beneficiary && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{b.beneficiary}</p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                            R$ {b.amount.toFixed(2).replace('.', ',')}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Dia {b.dueDay}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Vencimento: {item.targetDueDate.split('-').reverse().join('/')}
                        </span>
                        <button
                          onClick={() => {
                            onMarkPaid(b);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Quitar no Financeiro
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Already Paid Bills inside current month */}
              {paidAlerts.length > 0 && (
                <div className="pt-2">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 mb-1">
                    Quitadas neste Mês ({paidAlerts.length})
                  </p>
                  {paidAlerts.map((item) => (
                    <div
                      key={item.bill.id}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs mb-1"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] leading-tight">{item.bill.title}</p>
                          <p className="text-[9px] text-slate-400 font-mono">{item.bill.category}</p>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        R$ {item.bill.amount.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Navigation link */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('expenses');
                }}
                className="w-full text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center justify-center gap-1 py-1 cursor-pointer"
              >
                Gerenciar Todas as Contas Fixas <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
