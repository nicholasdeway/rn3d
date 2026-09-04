import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, X, Calendar, ArrowRight } from 'lucide-react';
import { RecurringBillAlertStatus, RecurringBill, ViewMode } from '../types';

interface BillReminderModalProps {
  billAlerts: RecurringBillAlertStatus[];
  onMarkPaid: (bill: RecurringBill) => void;
  onNavigate: (view: ViewMode) => void;
}

export const BillReminderModal: React.FC<BillReminderModalProps> = ({
  billAlerts,
  onMarkPaid,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter urgent & warning alerts
  const pendingAlerts = billAlerts.filter(
    (a) => !a.isPaidThisMonth && (a.isOverdue || a.daysRemaining <= 7)
  );

  useEffect(() => {
    // Check if user dismissed reminder today
    const dismissedDate = localStorage.getItem('rn3d_dismissed_reminders_date');
    if (dismissedDate !== todayStr && pendingAlerts.length > 0) {
      setIsOpen(true);
    }
  }, [pendingAlerts.length, todayStr]);

  if (!isOpen || pendingAlerts.length === 0) {
    return null;
  }

  const handleDismissToday = () => {
    localStorage.setItem('rn3d_dismissed_reminders_date', todayStr);
    setIsOpen(false);
  };

  const hasCriticalOverdueOr3Days = pendingAlerts.some(
    (a) => a.isOverdue || a.daysRemaining <= 3
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#12151c] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header Banner */}
        <div className={`p-4 text-white flex items-start justify-between border-b ${
          hasCriticalOverdueOr3Days ? 'bg-rose-600 border-rose-700' : 'bg-amber-600 border-amber-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                {hasCriticalOverdueOr3Days ? 'Lembrete de Vencimento' : 'Aviso de Contas Fixas (7 Dias)'}
              </span>
              <h3 className="text-base font-bold leading-tight mt-0.5">
                Contas Recorrentes a Vencer
              </h3>
            </div>
          </div>

          <button
            onClick={handleDismissToday}
            className="p-1 rounded-lg bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Bills List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {pendingAlerts.map((item) => {
            const b = item.bill;
            const isCritical = item.isOverdue || item.daysRemaining <= 3;

            return (
              <div
                key={b.id}
                className={`p-3.5 rounded-xl border ${
                  isCritical
                    ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                    : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.isOverdue
                          ? 'bg-rose-600 text-white'
                          : isCritical
                          ? 'bg-rose-500 text-white'
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
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {b.category}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{b.title}</h4>

                    {b.beneficiary && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Favorecido: <strong className="text-slate-700 dark:text-slate-300">{b.beneficiary}</strong>
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-400 font-mono">Valor</p>
                    <p className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
                      R$ {b.amount.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Dia {b.dueDay} do mês
                  </span>

                  <button
                    onClick={() => onMarkPaid(b)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Quitar e Lançar no Financeiro
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <button
            onClick={() => {
              handleDismissToday();
              onNavigate('recurring-bills');
            }}
            className="w-full sm:w-auto text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1 py-1 cursor-pointer"
          >
            Ir para Tela de Contas Fixas <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleDismissToday}
            className="w-full sm:w-auto px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Entendi / Lembrar Mais Tarde
          </button>
        </div>
      </div>
    </div>
  );
};
