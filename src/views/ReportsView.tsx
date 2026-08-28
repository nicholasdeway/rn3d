import React, { useState, useMemo } from 'react';
import { Product, Order, Consignment, Client, ExpenseItem } from '../types';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  Trophy,
  Package,
  Building2,
  ArrowRight,
  ArrowLeft,
  Search,
  Users,
  DollarSign,
  Award,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { MonthlyComparisonChart } from '../components/charts/MonthlyComparisonChart';
import { BalanceEvolutionChart } from '../components/charts/BalanceEvolutionChart';
import { computeMonthlyAnalyticsData } from '../utils/analyticsHelper';
import { formatDateBR } from '../utils/formatters';

interface ReportsViewProps {
  products: Product[];
  orders: Order[];
  consignments: Consignment[];
  transactions?: any[];
  clients?: Client[];
  expenses?: ExpenseItem[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  products,
  orders,
  consignments,
  transactions = [],
  clients = [],
  expenses = [],
}) => {
  const [period, setPeriod] = useState<string>('Este Mês');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showCustomPicker, setShowCustomPicker] = useState<boolean>(false);
  const [subScreen, setSubScreen] = useState<'dashboard' | 'full-products-ranking' | 'full-clients-ranking'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  // Auxiliary Date Parser (Handles ISO, YYYY-MM-DD, DD/MM/YYYY)
  const parseToDate = (dateStr?: string | null): Date | null => {
    if (!dateStr) return null;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
    } else if (dateStr.includes('-')) {
      const cleanStr = dateStr.split('T')[0];
      const parts = cleanStr.split('-');
      if (parts.length === 3) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  // Compute Active Date Range Window
  const { dateRangeStart, dateRangeEnd, labelPeriodText } = useMemo(() => {
    const now = new Date();
    const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (period === 'Hoje') {
      return {
        dateRangeStart: todayZero,
        dateRangeEnd: todayEnd,
        labelPeriodText: `Hoje (${todayZero.toLocaleDateString('pt-BR')})`,
      };
    }
    if (period === '7 dias') {
      const start = new Date(todayZero);
      start.setDate(start.getDate() - 6);
      return {
        dateRangeStart: start,
        dateRangeEnd: todayEnd,
        labelPeriodText: `Últimos 7 dias (${start.toLocaleDateString('pt-BR')} a ${todayEnd.toLocaleDateString('pt-BR')})`,
      };
    }
    if (period === '30 dias') {
      const start = new Date(todayZero);
      start.setDate(start.getDate() - 29);
      return {
        dateRangeStart: start,
        dateRangeEnd: todayEnd,
        labelPeriodText: `Últimos 30 dias (${start.toLocaleDateString('pt-BR')} a ${todayEnd.toLocaleDateString('pt-BR')})`,
      };
    }
    if (period === 'Este Mês') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return {
        dateRangeStart: start,
        dateRangeEnd: end,
        labelPeriodText: `Este Mês (${start.toLocaleDateString('pt-BR')} a ${end.toLocaleDateString('pt-BR')})`,
      };
    }
    if (period === 'Este Ano') {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return {
        dateRangeStart: start,
        dateRangeEnd: end,
        labelPeriodText: `Ano de ${now.getFullYear()}`,
      };
    }
    if (period === 'Personalizado') {
      const start = customStartDate ? parseToDate(customStartDate) : null;
      const end = customEndDate ? parseToDate(customEndDate) : (start ? new Date(start) : null);

      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);

      let text = 'Período Personalizado';
      if (start && end) {
        if (start.toDateString() === end.toDateString()) {
          text = `Data: ${start.toLocaleDateString('pt-BR')}`;
        } else {
          text = `De ${start.toLocaleDateString('pt-BR')} até ${end.toLocaleDateString('pt-BR')}`;
        }
      } else if (start) {
        text = `A partir de ${start.toLocaleDateString('pt-BR')}`;
      } else if (end) {
        text = `Até ${end.toLocaleDateString('pt-BR')}`;
      }

      return {
        dateRangeStart: start,
        dateRangeEnd: end,
        labelPeriodText: text,
      };
    }

    // Default: 'Tudo'
    return {
      dateRangeStart: null,
      dateRangeEnd: null,
      labelPeriodText: 'Todo o histórico',
    };
  }, [period, customStartDate, customEndDate]);

  // Evaluator function to check if item date falls within selected range
  const isDateInRange = (dateStr?: string | null): boolean => {
    if (!dateRangeStart && !dateRangeEnd) return true;
    const d = parseToDate(dateStr);
    if (!d) return true;

    if (dateRangeStart && d.getTime() < dateRangeStart.getTime()) {
      return false;
    }
    if (dateRangeEnd && d.getTime() > dateRangeEnd.getTime()) {
      return false;
    }
    return true;
  };

  // Filtered collections based on active date range
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => isDateInRange(o.date || o.createdAt));
  }, [orders, dateRangeStart, dateRangeEnd]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => isDateInRange(t.timestamp || t.date || t.dueDate));
  }, [transactions, dateRangeStart, dateRangeEnd]);

  const filteredConsignments = useMemo(() => {
    return consignments.filter((c) => isDateInRange(c.date || c.createdAt));
  }, [consignments, dateRangeStart, dateRangeEnd]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => isDateInRange(e.date || e.timestamp));
  }, [expenses, dateRangeStart, dateRangeEnd]);

  // 1. Monthly analytics data for charts (re-calculated with filtered dataset)
  const monthlyAnalyticsData = useMemo(() => {
    return computeMonthlyAnalyticsData(filteredOrders, filteredTransactions, filteredConsignments, filteredExpenses);
  }, [filteredOrders, filteredTransactions, filteredConsignments, filteredExpenses]);

  // 2. Compute Product Profitability Rankings (filtered)
  const productProfitability = useMemo(() => {
    return products.map((p) => {
      let salesCount = 0;
      let totalRevenue = 0;

      filteredOrders.forEach((o) => {
        if (o.items) {
          o.items.forEach((item) => {
            if (
              item.productName.toLowerCase().trim() === p.name.toLowerCase().trim() ||
              item.productName.toLowerCase().includes(p.name.toLowerCase().trim())
            ) {
              salesCount += item.quantity;
              totalRevenue += item.subtotal;
            }
          });
        }
      });

      filteredConsignments.forEach((cons) => {
        if (cons.items) {
          cons.items.forEach((cItem) => {
            if (
              cItem.productName.toLowerCase().trim() === p.name.toLowerCase().trim() ||
              cItem.productId === p.id
            ) {
              salesCount += Math.round(cItem.quantity * 0.4);
              totalRevenue += cItem.subtotal * 0.4;
            }
          });
        }
      });

      const unitCost = p.estimatedCost > 0 ? p.estimatedCost : p.standardPrice * 0.35;
      const totalCost = salesCount * unitCost;
      const netProfit = Math.max(0, totalRevenue - totalCost);
      const marginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        standardPrice: p.standardPrice,
        salesCount,
        totalRevenue: totalRevenue || salesCount * p.standardPrice,
        unitCost,
        totalCost,
        netProfit: netProfit || salesCount * (p.standardPrice - unitCost),
        marginPct: marginPct || 65,
      };
    });
  }, [products, filteredOrders, filteredConsignments]);

  // Sorted product rankings
  const allProductsRanked = useMemo(() => {
    return [...productProfitability].sort((a, b) => b.netProfit - a.netProfit);
  }, [productProfitability]);

  const top5Products = useMemo(() => {
    return allProductsRanked.slice(0, 5);
  }, [allProductsRanked]);

  // 3. Compute Client / Partner Store Rankings (filtered)
  const clientRankings = useMemo(() => {
    return clients.map((cli) => {
      let ordersCount = 0;
      let totalRevenue = 0;

      filteredOrders.forEach((o) => {
        const matches =
          o.clientId === cli.id ||
          (o.clientName && o.clientName.toLowerCase().trim() === cli.name.toLowerCase().trim());
        if (matches) {
          ordersCount++;
          totalRevenue += Number(o.paidAmount) || Number(o.totalValue) || 0;
        }
      });

      const clientConsignments = filteredConsignments.filter(
        (c) =>
          c.clientId === cli.id ||
          (c.clientName && c.clientName.toLowerCase().trim() === cli.name.toLowerCase().trim())
      );
      const consignmentsValue = clientConsignments.reduce((acc, c) => acc + c.totalValue, 0);

      const combinedRevenue = totalRevenue + consignmentsValue;

      return {
        id: cli.id,
        name: cli.name,
        fantasyName: cli.fantasyName || cli.name,
        city: cli.city || 'Local',
        type: cli.type || 'Consignação',
        agreedPriceLevel: cli.agreedPriceLevel || 'Padrão',
        ordersCount,
        consignmentsCount: clientConsignments.length,
        productsOnSiteCount: cli.productsOnSiteCount || 0,
        totalRevenue: combinedRevenue,
        lastVisitDate: cli.lastVisitDate,
      };
    });
  }, [clients, filteredOrders, filteredConsignments]);

  // Sorted client rankings
  const allClientsRanked = useMemo(() => {
    return [...clientRankings].sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [clientRankings]);

  const top5Clients = useMemo(() => {
    return allClientsRanked.slice(0, 5);
  }, [allClientsRanked]);

  // Search filtered full lists
  const filteredProductsList = useMemo(() => {
    if (!searchTerm.trim()) return allProductsRanked;
    const term = searchTerm.toLowerCase().trim();
    return allProductsRanked.filter(
      (p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term) || p.category.toLowerCase().includes(term)
    );
  }, [allProductsRanked, searchTerm]);

  const filteredClientsList = useMemo(() => {
    if (!searchTerm.trim()) return allClientsRanked;
    const term = searchTerm.toLowerCase().trim();
    return allClientsRanked.filter(
      (c) => c.name.toLowerCase().includes(term) || c.city.toLowerCase().includes(term) || c.type.toLowerCase().includes(term)
    );
  }, [allClientsRanked, searchTerm]);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // RENDER SUB-SCREEN: FULL PRODUCTS RANKING
  if (subScreen === 'full-products-ranking') {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#12151c] p-6 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs">
          <div>
            <button
              onClick={() => setSubScreen('dashboard')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1.5 mb-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar para Relatórios
            </button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500" />
              Ranking Completo de Rentabilidade de Produtos
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Lista ordenada por Lucro Líquido gerado (Preço de Venda – Custo de Impressão)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSubScreen('full-clients-ranking')}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Building2 className="w-4 h-4 text-indigo-500" />
              <span>Ver Ranking de Clientes</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-[#12151c] p-4 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome do produto, SKU ou categoria..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-semibold"
            />
          </div>
        </div>

        {/* Full Products Ranking Table */}
        <div className="bg-white dark:bg-[#12151c] rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#181c26] border-b border-slate-200 dark:border-[#202531] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Posição</th>
                  <th className="p-4">Produto</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4 text-right">Qtd Vendida</th>
                  <th className="p-4 text-right">Faturamento Total</th>
                  <th className="p-4 text-right">Custo Estimado</th>
                  <th className="p-4 text-right">Lucro Líquido (R$)</th>
                  <th className="p-4 text-right">Margem (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredProductsList.map((prod, idx) => (
                  <tr key={prod.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <span
                        className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center border ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                            : idx === 2
                            ? 'bg-amber-700/20 text-amber-900 border-amber-600/30 dark:bg-amber-900/40 dark:text-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/50'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{prod.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">SKU: {prod.sku}</p>
                    </td>
                    <td className="p-4 font-semibold text-slate-600 dark:text-slate-400">{prod.category}</td>
                    <td className="p-4 text-right font-bold text-slate-900 dark:text-slate-100">{prod.salesCount} un</td>
                    <td className="p-4 text-right font-bold text-slate-900 dark:text-slate-100">{formatCurrency(prod.totalRevenue)}</td>
                    <td className="p-4 text-right text-rose-600 dark:text-rose-400 font-semibold">{formatCurrency(prod.totalCost)}</td>
                    <td className="p-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatCurrency(prod.netProfit)}
                    </td>
                    <td className="p-4 text-right">
                      <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-extrabold border border-emerald-200 dark:border-emerald-900/50">
                        {prod.marginPct.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // RENDER SUB-SCREEN: FULL CLIENTS RANKING
  if (subScreen === 'full-clients-ranking') {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#12151c] p-6 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs">
          <div>
            <button
              onClick={() => setSubScreen('dashboard')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1.5 mb-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar para Relatórios
            </button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Ranking Completo de Faturamento por Cliente / Loja
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Lista ordenada por Faturamento Total gerado para a oficina RN 3D
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSubScreen('full-products-ranking')}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Ver Ranking de Produtos</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-[#12151c] p-4 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome do cliente, cidade ou tipo de conta..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-semibold"
            />
          </div>
        </div>

        {/* Full Clients Ranking Table */}
        <div className="bg-white dark:bg-[#12151c] rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#181c26] border-b border-slate-200 dark:border-[#202531] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Posição</th>
                  <th className="p-4">Cliente / Loja Parceira</th>
                  <th className="p-4">Cidade</th>
                  <th className="p-4">Tipo / Tabela</th>
                  <th className="p-4 text-center">Pedidos</th>
                  <th className="p-4 text-center">Peças no Local</th>
                  <th className="p-4 text-right">Faturamento Total (R$)</th>
                  <th className="p-4 text-right">Última Visita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredClientsList.map((cli, idx) => (
                  <tr key={cli.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <span
                        className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center border ${
                          idx === 0
                            ? 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-700'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                            : idx === 2
                            ? 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-700'
                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/50'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {cli.fantasyName || cli.name}
                    </td>
                    <td className="p-4 font-semibold text-slate-600 dark:text-slate-400">{cli.city}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">
                      {cli.type} • Tabela {cli.agreedPriceLevel}
                    </td>
                    <td className="p-4 text-center font-bold text-slate-900 dark:text-slate-100">{cli.ordersCount}</td>
                    <td className="p-4 text-center font-bold text-indigo-600 dark:text-indigo-400">{cli.productsOnSiteCount} un</td>
                    <td className="p-4 text-right font-black text-indigo-600 dark:text-indigo-400 text-sm">
                      {formatCurrency(cli.totalRevenue)}
                    </td>
                    <td className="p-4 text-right text-slate-500 font-medium">{formatDateBR(cli.lastVisitDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // RENDER MAIN DASHBOARD VIEW
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Interactive Date Filter */}
      <div className="bg-white dark:bg-[#12151c] p-6 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Relatórios e Inteligência de Vendas
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
              <span>Análise de curva ABC, margens de lucro por modelo e ranking de clientes.</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-extrabold rounded-full border border-indigo-200 dark:border-indigo-800 text-[11px]">
                {labelPeriodText}
              </span>
            </p>
          </div>

          {/* Period Presets & Interactive Calendar Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#181c26] p-1.5 rounded-xl border border-slate-200 dark:border-[#202531] flex-wrap">
            {/* Functional Calendar Icon Button */}
            <button
              type="button"
              onClick={() => {
                setShowCustomPicker((prev) => !prev);
                if (period !== 'Personalizado') {
                  setPeriod('Personalizado');
                }
              }}
              title="Clique para selecionar intervalo de datas personalizado"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                showCustomPicker || period === 'Personalizado'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white dark:bg-[#12151c] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>Personalizado</span>
            </button>

            {['Hoje', '7 dias', '30 dias', 'Este Mês', 'Este Ano', 'Tudo'].map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPeriod(p);
                  setShowCustomPicker(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === p && !showCustomPicker
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range Panel (Data X até Y) */}
        {(showCustomPicker || period === 'Personalizado') && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/40 flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Selecionar período personalizado:</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <label className="text-slate-600 dark:text-slate-400 font-semibold">Data Inicial (De):</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    setPeriod('Personalizado');
                  }}
                  className="px-3 py-1.5 bg-white dark:bg-[#12151c] border border-slate-200 dark:border-[#202531] rounded-lg text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <label className="text-slate-600 dark:text-slate-400 font-semibold">Data Final (Até):</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setPeriod('Personalizado');
                  }}
                  className="px-3 py-1.5 bg-white dark:bg-[#12151c] border border-slate-200 dark:border-[#202531] rounded-lg text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(customStartDate || customEndDate) && (
                <button
                  onClick={() => {
                    setCustomStartDate('');
                    setCustomEndDate('');
                    setPeriod('Este Mês');
                    setShowCustomPicker(false);
                  }}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Limpar Filtro
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Financial Analytics & Trends Charts (Definance Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyComparisonChart data={monthlyAnalyticsData} />
        <BalanceEvolutionChart data={monthlyAnalyticsData} />
      </div>

      {/* Top 5 Rankings Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: TOP 5 PRODUTOS MAIS LUCRATIVOS */}
        <div className="bg-white dark:bg-[#12151c] rounded-2xl border border-slate-200/80 dark:border-[#202531] p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Trophy className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                <span>Top 5 Produtos Mais Lucrativos (Rentabilidade)</span>
              </h3>
              <span className="text-xs font-semibold text-slate-400 shrink-0">{period}</span>
            </div>

            {top5Products.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">Nenhuma venda registrada no período</p>
                <p className="text-[11px] text-slate-400">
                  Os produtos com maior rentabilidade aparecerão aqui conforme pedidos forem concluídos.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {top5Products.map((prod, idx) => (
                  <div
                    key={prod.id}
                    className="p-3 bg-slate-50 dark:bg-[#181c26] rounded-xl border border-slate-100 dark:border-[#202531] flex items-center justify-between transition-all hover:border-emerald-300/50"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-lg font-extrabold text-xs flex items-center justify-center shrink-0 ${
                          idx === 0
                            ? 'bg-amber-500 text-white'
                            : idx === 1
                            ? 'bg-slate-400 text-white'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-indigo-600 text-white'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">{prod.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {prod.salesCount} un vendidas • Fat: {formatCurrency(prod.totalRevenue)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Lucro Líquido</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">
                        {formatCurrency(prod.netProfit)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                setSearchTerm('');
                setSubScreen('full-products-ranking');
              }}
              className="w-full py-2.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Ver Ranking Completo de Produtos</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CARD 2: TOP 5 CLIENTES / LOJAS PARCEIRAS */}
        <div className="bg-white dark:bg-[#12151c] rounded-2xl border border-slate-200/80 dark:border-[#202531] p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Building2 className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Top 5 Clientes / Lojas Parceiras (Faturamento)</span>
              </h3>
              <span className="text-xs font-semibold text-slate-400 shrink-0">{period}</span>
            </div>

            {top5Clients.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">Nenhum cliente com compras recentes</p>
                <p className="text-[11px] text-slate-400">
                  Os clientes parceiros de maior movimento aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {top5Clients.map((cli, idx) => (
                  <div
                    key={cli.id}
                    className="p-3 bg-slate-50 dark:bg-[#181c26] rounded-xl border border-slate-100 dark:border-[#202531] flex items-center justify-between transition-all hover:border-indigo-300/50"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-lg font-extrabold text-xs flex items-center justify-center shrink-0 ${
                          idx === 0
                            ? 'bg-indigo-600 text-white'
                            : idx === 1
                            ? 'bg-slate-400 text-white'
                            : idx === 2
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-600 text-white'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">{cli.fantasyName || cli.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {cli.city} • {cli.ordersCount} pedidos / consignações
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Faturamento</span>
                      <span className="font-black text-indigo-600 dark:text-indigo-400 text-xs">
                        {formatCurrency(cli.totalRevenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                setSearchTerm('');
                setSubScreen('full-clients-ranking');
              }}
              className="w-full py-2.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Ver Ranking Completo de Clientes</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
