import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle2, X, Calendar, DollarSign, ArrowRight, ShieldAlert } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#121622] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Top Header Banner */}
        <div className={`p-4 sm:p-5 text-white flex items-start justify-between relative overflow-hidden shrink-0 ${
          hasCriticalOverdueOr3Days
            ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700'
            : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600'
        }`}>
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shrink-0 shadow-lg">
              <Bell className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full border border-white/30">
                {hasCriticalOverdueOr3Days ? '🚨 Alerta Urgente de Vencimento' : '⏰ Aviso de Contas Fixas (7 Dias)'}
              </span>
              <h3 className="text-base sm:text-lg font-black leading-tight mt-1">
                Lembretes & Contas Recorrentes
              </h3>
              <p className="text-xs text-white/90 font-medium mt-0.5">
                {pendingAlerts.length === 1
                  ? 'Você tem 1 conta pendente prestes a vencer'
                  : `Você tem ${pendingAlerts.length} contas pendentes prestes a vencer`}
              </p>
            </div>
          </div>

          <button
            onClick={handleDismissToday}
            className="p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-colors cursor-pointer shrink-0 z-10"
            title="Fechar aviso por hoje"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Bills List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {pendingAlerts.map((item) => {
            const b = item.bill;
            const isCritical = item.isOverdue || item.daysRemaining <= 3;

            return (
              <div
                key={b.id}
                className={`p-3.5 sm:p-4 rounded-2xl transition-all border ${
                  isCritical
                    ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 shadow-xs'
                    : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        item.isOverdue
                          ? 'bg-rose-600 text-white'
                          : isCritical
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
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {b.category}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">{b.title}</h4>

                    {b.beneficiary && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Beneficiário / ERP: <strong className="text-slate-700 dark:text-slate-300">{b.beneficiary}</strong>
                      </p>
                    )}
                  </div>

                  <div className="sm:text-right shrink-0">
                    <p className="text-xs text-slate-400 font-mono">Valor Total</p>
                    <p className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono text-emerald-600 dark:text-emerald-400">
                      R$ {b.amount.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Dia do Vencimento: <strong>{b.dueDay}</strong></span>
                  </div>

                  <button
                    onClick={() => {
                      onMarkPaid(b);
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Quitar e Lançar no Financeiro
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <button
            onClick={() => {
              handleDismissToday();
              onNavigate('expenses');
            }}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            Ver Módulo Financeiro & Contas Fixas <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleDismissToday}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Entendi / Lembrar Mais Tarde
          </button>
        </div>
      </div>
    </div>
  );
};
