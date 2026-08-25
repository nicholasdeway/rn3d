import React from 'react';
import { Client, Product, Visit, ViewMode, Order } from '../types';
import { formatDateBR } from '../utils/formatters';
import {
  TrendingUp,
  DollarSign,
  Boxes,
  ShoppingBag,
  MapPin,
  Flame,
  AlertTriangle,
  Clock,
  ArrowRight,
  Plus,
  Minus,
  ArrowUpRight,
  Sparkles,
  PackagePlus,
  Users,
  ShoppingCart,
  Printer,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (view: ViewMode) => void;
  onStartVisit: (clientId: string) => void;
  onQuickAction: (action: string) => void;
  clients: Client[];
  products: Product[];
  visits: Visit[];
  consignments?: any[];
  orders?: Order[];
  onSelectClient?: (clientOrId: string | Client) => void;
  onUpdateOrderProgress?: (orderId: string, newProgressPct: number) => void;
  onUpdateOrderStatus?: (orderId: string, newStatus: Order['status']) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onStartVisit,
  onQuickAction,
  clients,
  products,
  visits,
  consignments = [],
  orders = [],
  onSelectClient,
  onUpdateOrderProgress,
  onUpdateOrderStatus,
}) => {
  // Filter pending visits and open orders
  const pendingVisits = visits.filter((v) => v.status !== 'Concluída');
  const openOrders = orders.filter((o) => o.status !== 'Entregue' && o.status !== 'Cancelado');

  // Compute dynamic KPIs
  const totalRevenue = orders.reduce((acc, o) => acc + (Number(o.paidAmount) || 0), 0);
  const totalReceivable = orders.reduce(
    (acc, o) => acc + Math.max(0, (Number(o.totalValue) || 0) - (Number(o.paidAmount) || 0)),
    0
  );
  const totalProductsInStock = products.reduce((acc, p) => acc + (Number(p.currentStock) || 0), 0);
  const totalItemsSold = orders.reduce(
    (acc, o) => acc + (o.items ? o.items.reduce((sum, item) => sum + item.quantity, 0) : o.itemsCount || 0),
    0
  );

  // Top turnover items
  const bestTurnover = products
    .filter((p) => (p.monthlySalesCount || 0) > 0)
    .sort((a, b) => (b.monthlySalesCount || 0) - (a.monthlySalesCount || 0));

  // Low turnover items
  const lowTurnover = products.filter((p) => p.currentStock > 0 && (p.turnoverRatePct || 0) < 30);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md shadow-indigo-950/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Painel Operacional • Banco Ativo
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Visão Geral da Oficina 3D</h2>
            <p className="text-indigo-200/80 text-sm mt-1">
              Acompanhe vendas, clientes, pedidos e estoque em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onQuickAction('novo-produto')}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <PackagePlus className="w-4 h-4" />
              Cadastrar Produto
            </button>
            <button
              onClick={() => onQuickAction('novo-pedido')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-900 hover:bg-indigo-50 rounded-xl text-xs font-semibold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 text-indigo-600" />
              Novo Pedido
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Cards Grid (Definance 2x2 Mobile Layout) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Faturamento real */}
        <div className="definance-kpi-card bg-white dark:bg-[#12151c] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs hover:border-emerald-500/40 dark:hover:border-emerald-500/40 cursor-pointer">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
              Faturamento Acumulado
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 sm:mt-3 tracking-tight truncate">
            {formatCurrency(totalRevenue)}
          </p>
          <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1 truncate">
            <ArrowUpRight className="w-3 h-3 shrink-0" />
            <span>Base real</span>
          </p>
        </div>

        {/* Card 2: Valor a receber */}
        <div className="definance-kpi-card bg-white dark:bg-[#12151c] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs hover:border-indigo-500/40 dark:hover:border-indigo-500/40 cursor-pointer">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
              Saldo a Receber
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
              <DollarSign className="w-4 h-4 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 sm:mt-3 tracking-tight truncate">
            {formatCurrency(totalReceivable)}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 truncate">
            Em pedidos pendentes
          </p>
        </div>

        {/* Card 3: Produtos em estoque */}
        <div className="definance-kpi-card bg-white dark:bg-[#12151c] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs hover:border-purple-500/40 dark:hover:border-purple-500/40 cursor-pointer">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
              Estoque Produtos
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
              <Boxes className="w-4 h-4 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 sm:mt-3 tracking-tight truncate">
            {totalProductsInStock} <span className="text-xs sm:text-sm font-bold text-slate-400">un</span>
          </p>
          <p className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-400 font-semibold mt-1 truncate">
            {products.length} modelos cadastrados
          </p>
        </div>

        {/* Card 4: Unidades vendidas */}
        <div className="definance-kpi-card bg-white dark:bg-[#12151c] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs hover:border-blue-500/40 dark:hover:border-blue-500/40 cursor-pointer">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
              Produtos Vendidos
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
              <ShoppingBag className="w-4 h-4 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 sm:mt-3 tracking-tight truncate">
            {totalItemsSold} <span className="text-xs sm:text-sm font-bold text-slate-400">un</span>
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 truncate">
            {orders.length} pedidos efetuados
          </p>
        </div>
      </div>

      {/* SEÇÃO NOVO REQUISITO: Pedidos de Venda em Aberto & Produção 3D (Com conversão direta para Entregue) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-600" />
              Pedidos em Aberto & Fila de Impressão 3D ({openOrders.length})
            </h3>
            <p className="text-xs text-slate-500">Gerencie a produção 3D e converta pedidos em "Entregue" diretamente pelo Dashboard</p>
          </div>
          <button
            onClick={() => onNavigate('orders')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
          >
            Ver todos os pedidos ({orders.length}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {openOrders.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">Todos os pedidos foram entregues!</p>
            <p className="text-xs text-slate-400">Nenhum pedido de produção pendente no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openOrders.slice(0, 6).map((o) => (
              <div
                key={o.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 hover:border-indigo-300 transition-colors"
              >
                {/* Header: ID, Client & Attendance Mode */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
                  <span className="font-mono font-bold text-indigo-600 text-xs bg-indigo-100 px-2.5 py-1 rounded-lg">
                    {o.id}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${o.attendanceMode === 'online'
                      ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                    {o.attendanceMode === 'online' ? '💬 Atendimento Online' : '📍 Visita Presencial'}
                  </span>
                </div>

                {/* Client info & value */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{o.clientName}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {o.itemsCount} {o.itemsCount === 1 ? 'item' : 'itens'} • {o.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Valor Total</span>
                    <span className="font-black text-emerald-600 text-sm">
                      R$ {o.totalValue.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* 3D Print Progress Stepper (5 in 5%) */}
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Progresso 3D:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const newPct = Math.max(0, o.productionProgressPct - 5);
                          if (onUpdateOrderProgress) onUpdateOrderProgress(o.id, newPct);
                        }}
                        disabled={o.productionProgressPct <= 0}
                        className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 rounded-md cursor-pointer transition-colors active:scale-95"
                        title="Diminuir 5%"
                      >
                        <Minus className="w-3 h-3 text-rose-500" />
                      </button>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-extrabold border ${o.productionProgressPct === 100
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                        {o.status} ({o.productionProgressPct}%)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newPct = Math.min(100, o.productionProgressPct + 5);
                          if (onUpdateOrderProgress) onUpdateOrderProgress(o.id, newPct);
                        }}
                        disabled={o.productionProgressPct >= 100}
                        className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 rounded-md cursor-pointer transition-colors active:scale-95"
                        title="Aumentar 5%"
                      >
                        <Plus className="w-3 h-3 text-emerald-600" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-300 ${o.productionProgressPct === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                      style={{ width: `${o.productionProgressPct}%` }}
                    />
                  </div>
                </div>

                {/* Direct Action Button to Mark as Delivered */}
                <div className="pt-1 flex items-center justify-between gap-2">
                  <label className="flex-1 inline-flex items-center justify-center gap-2 cursor-pointer bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-2 px-3 rounded-xl font-bold text-xs shadow-xs transition-all select-none">
                    <input
                      type="checkbox"
                      checked={o.status === 'Entregue'}
                      onChange={(e) => {
                        if (e.target.checked && onUpdateOrderStatus) {
                          onUpdateOrderStatus(o.id, 'Entregue');
                        }
                      }}
                      className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                    />
                    <span>📦 Marcar como Entregue</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visitas Pendentes Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              Visitas Agendadas e Pendentes
            </h3>
            <p className="text-xs text-slate-500">Estabelecimentos cadastrados para rota de consignação</p>
          </div>
          <button
            onClick={() => onNavigate('visits')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            Ver todas <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {pendingVisits.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-semibold text-slate-700">Nenhuma visita pendente no momento</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Cadastre novos clientes ou agende visitas para sua rota de consignação.</p>
            <button
              onClick={() => onNavigate('clients')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 transition-colors inline-flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              Ir para Cadastro de Clientes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingVisits.map((v) => (
              <div
                key={v.id}
                className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 flex flex-col justify-between transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{v.clientName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Última visita: {formatDateBR(v.lastVisitText)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Boxes className="w-3.5 h-3.5 text-slate-400" />
                      {v.productsOnSite} produtos no local
                    </span>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">{v.reason}</span>
                  <button
                    onClick={() => onStartVisit(v.clientId)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    Realizar visita
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Catalogs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products List Overview */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  Catálogo de Produtos Cadastrados
                </h3>
                <p className="text-xs text-slate-500">Produtos gravados no banco de dados Supabase</p>
              </div>
              <button
                onClick={() => onNavigate('products')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                Ver catálogo ({products.length})
              </button>
            </div>

            {products.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Boxes className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                <p className="text-sm font-semibold text-slate-700">Seu banco de produtos está vazio</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">Cadastre seu primeiro modelo 3D para gerar orçamentos e pedidos.</p>
                <button
                  onClick={() => onQuickAction('novo-produto')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Cadastrar Primeiro Produto
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {products.slice(0, 10).map((p) => (
                  <div key={p.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100/80 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden border border-slate-200">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>3D</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">{p.name}</h4>
                        <p className="text-xs text-slate-500">SKU: {p.sku} • {p.material}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 block">{formatCurrency(p.standardPrice)}</span>
                      <span className="text-[11px] text-slate-500">{p.currentStock} un em estoque</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {products.length > 10 && (
            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <button
                onClick={() => onNavigate('products')}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Ver todos os {products.length} produtos do catálogo →
              </button>
            </div>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  Alerta de Estoque Mínimo
                </h3>
                <p className="text-xs text-slate-500">Itens que precisam de nova impressão em breve</p>
              </div>
              {products.filter((p) => p.currentStock <= p.minStock).length > 0 && (
                <button
                  onClick={() => onNavigate('inventory-general')}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                >
                  Gerenciar estoque ({products.filter((p) => p.currentStock <= p.minStock).length})
                </button>
              )}
            </div>

            {products.filter((p) => p.currentStock <= p.minStock).length === 0 ? (
              <div className="p-8 text-center bg-emerald-50/50 rounded-xl border border-emerald-200/60">
                <Sparkles className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-emerald-800">Estoque Saudável!</p>
                <p className="text-xs text-emerald-600/90 mt-1">Todos os produtos estão acima do limite mínimo de estoque.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {products
                  .filter((p) => p.currentStock <= p.minStock)
                  .slice(0, 10)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 bg-rose-50/50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 rounded-xl flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{p.name}</h4>
                        <p className="text-xs text-rose-700 dark:text-rose-400 font-semibold">
                          Estoque atual: {p.currentStock} un (Mínimo: {p.minStock} un)
                        </p>
                      </div>

                      <button
                        onClick={() => onNavigate('inventory-general')}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer shadow-xs"
                      >
                        Ajustar Estoque
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {products.filter((p) => p.currentStock <= p.minStock).length > 10 && (
            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <button
                onClick={() => onNavigate('inventory-general')}
                className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Ver todos os {products.filter((p) => p.currentStock <= p.minStock).length} alertas de estoque →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
