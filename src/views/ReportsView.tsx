import React, { useState } from 'react';
import { Product, Order, Consignment } from '../types';
import { BarChart3, Calendar, TrendingUp, AlertTriangle, Trophy, Package } from 'lucide-react';

interface ReportsViewProps {
  products: Product[];
  orders: Order[];
  consignments: Consignment[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  products,
  orders,
  consignments,
}) => {
  const [period, setPeriod] = useState('Este Mês');

  // Compute top products dynamically from real database state
  const productStats = products.map((p) => {
    let salesCount = 0;
    let revenue = 0;

    // Count from orders
    orders.forEach((o) => {
      o.items.forEach((item) => {
        if (item.productName.toLowerCase().includes(p.name.toLowerCase()) || item.productId === p.id) {
          salesCount += item.quantity;
          revenue += item.subtotal;
        }
      });
    });

    return {
      name: p.name,
      category: p.category,
      currentStock: p.currentStock,
      salesCount,
      revenue: revenue || salesCount * p.standardPrice,
    };
  });

  const topProducts = [...productStats]
    .filter((p) => p.salesCount > 0 || p.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const slowProducts = productStats.filter((p) => p.salesCount === 0 && p.currentStock > 10);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Relatórios e Inteligência de Vendas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Análise em tempo real de curva ABC, rotatividade de produtos e desempenho de vendas.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-400 ml-2" />
          {['Hoje', '7 dias', '30 dias', 'Este Mês'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                period === p ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ranking Mais Vendidos */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Produtos Mais Vendidos (Campeões de Giro)
            </h3>
            <span className="text-xs font-semibold text-slate-400">{period}</span>
          </div>

          {topProducts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700 text-xs">Nenhuma venda registrada no período</p>
              <p className="text-[11px] text-slate-400">
                Os produtos com maior saída aparecerão aqui conforme pedidos e acertos de consignação forem concluídos.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((prod, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{prod.name}</p>
                      <p className="text-[10px] text-slate-400">{prod.salesCount} unidades vendidas</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-emerald-600 text-xs">
                    R$ {prod.revenue.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alerta de Baixo Giro / Encalhados */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Alerta de Baixo Giro (Candidatos a Troca)
            </h3>
          </div>

          {slowProducts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <TrendingUp className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="font-bold text-slate-700 text-xs">Nenhum produto parado ou encalhado</p>
              <p className="text-[11px] text-slate-400">
                Todos os itens do seu catálogo possuem saldo controlado.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {slowProducts.map((prod, idx) => (
                <div key={idx} className="p-3.5 bg-amber-50/50 dark:bg-amber-950/40 rounded-xl border border-amber-200/60 dark:border-amber-900/50 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">{prod.name}</p>
                    <p className="text-[10px] text-amber-800 dark:text-amber-400 font-medium">
                      Estoque acumulado: {prod.currentStock} unidades sem movimentação recente
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 rounded-lg text-[10px] font-bold border border-amber-200 dark:border-amber-800/80 shrink-0">
                    Sugerir Recolhimento
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
