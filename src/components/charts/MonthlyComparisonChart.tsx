import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { MonthlyAnalyticsData } from '../../utils/analyticsHelper';

interface MonthlyComparisonChartProps {
  data: MonthlyAnalyticsData[];
}

export const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({ data }) => {
  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatYAxisTick = (val: number) => {
    if (Math.abs(val) >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
    return `R$ ${val}`;
  };

  const tooltipFormatter = (value: any, name: any) => {
    const finalValue = Array.isArray(value) ? value[0] : value;
    const labelName = name === 'receitas' ? 'Receitas' : name === 'despesas' ? 'Despesas' : String(name || '');
    return [formatCurrency(Number(finalValue || 0)), labelName];
  };

  return (
    <div className="bg-white dark:bg-[#12151c] p-6 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Receitas vs Despesas
        </h3>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
          Comparativo Mensal
        </span>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-slate-800/70" />
            <XAxis
              dataKey="month"
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              width={65}
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
            <Bar dataKey="receitas" fill="#10b981" radius={[6, 6, 0, 0]} name="Receitas" />
            <Bar dataKey="despesas" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Despesas" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-center gap-6 text-xs font-bold uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-slate-600 dark:text-slate-400">Receitas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          <span className="text-slate-600 dark:text-slate-400">Despesas</span>
        </div>
      </div>
    </div>
  );
};
