import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { MonthlyAnalyticsData } from '../../utils/analyticsHelper';

interface BalanceEvolutionChartProps {
  data: MonthlyAnalyticsData[];
  onViewDetails?: () => void;
}

export const BalanceEvolutionChart: React.FC<BalanceEvolutionChartProps> = ({ data, onViewDetails }) => {
  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatYAxisTick = (val: number) => {
    if (Math.abs(val) >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
    return `R$ ${val}`;
  };

  const tooltipFormatter = (value: any, name: any) => {
    const finalValue = Array.isArray(value) ? value[0] : value;
    const labelName = name === 'saldo' ? 'Saldo do Mês' : name === 'saldoAcumulado' ? 'Saldo Acumulado' : String(name || '');
    return [formatCurrency(Number(finalValue || 0)), labelName];
  };

  return (
    <div className="bg-white dark:bg-[#12151c] p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs flex flex-col justify-between space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>Evolução do Saldo Acumulado</span>
        </h3>
        <div className="flex items-center gap-2">
          {onViewDetails && (
            <button
              type="button"
              onClick={onViewDetails}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <span>Ver Detalhes</span>
            </button>
          )}
          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 sm:px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-1 shrink-0">
            <TrendingUp className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Tendência Financeira Real</span><span className="sm:hidden">Tendência</span>
          </span>
        </div>
      </div>

      <div className="h-[320px] sm:h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 5, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSaldoAcumulated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSaldoMensal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-slate-800/70" />
            <XAxis
              dataKey="month"
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              width={48}
              domain={['auto', 'auto']}
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatYAxisTick}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--tooltip-bg, #0f172a)',
                borderColor: 'var(--tooltip-border, #1e293b)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 'bold',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
              }}
              itemStyle={{ color: '#f8fafc' }}
              formatter={tooltipFormatter}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
            />
            <Area
              type="monotone"
              dataKey="saldoAcumulado"
              stroke="#10b981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorSaldoAcumulated)"
              name="saldoAcumulado"
              animationDuration={1500}
            />
            <Area
              type="monotone"
              dataKey="saldo"
              stroke="#6366f1"
              strokeWidth={2}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#colorSaldoMensal)"
              name="saldo"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-center gap-6 text-xs font-bold uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-slate-600 dark:text-slate-400">Saldo Acumulado (R$)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
          <span className="text-slate-600 dark:text-slate-400">Saldo do Mês (R$)</span>
        </div>
      </div>
    </div>
  );
};
