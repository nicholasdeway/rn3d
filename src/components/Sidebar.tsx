import React from 'react';
import { ViewMode } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Calculator,
  ShoppingCart,
  FileText,
  Boxes,
  MapPin,
  Repeat,
  Package,
  Users,
  DollarSign,
  TrendingDown,
  Warehouse,
  History,
  Store,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: ViewMode;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  groupLabel?: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { isDemo, signOut } = useAuth();

  const navGroups: NavGroup[] = [
    {
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'calculator', label: 'Calculadora 3D', icon: Calculator },
      ],
    },
    {
      groupLabel: 'Operações',
      items: [
        { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
        { id: 'quotes', label: 'Orçamentos', icon: FileText },
        { id: 'consignments', label: 'Consignações', icon: Boxes },
        { id: 'visits', label: 'Visitas', icon: MapPin },
        { id: 'exchanges', label: 'Trocas', icon: Repeat },
      ],
    },
    {
      groupLabel: 'Cadastros',
      items: [
        { id: 'products', label: 'Produtos', icon: Package },
        { id: 'clients', label: 'Clientes', icon: Users },
      ],
    },
    {
      groupLabel: 'Financeiro',
      items: [
        { id: 'financial', label: 'Vendas e Pagamentos', icon: DollarSign },
        { id: 'expenses', label: 'Financeiro', icon: TrendingDown },
      ],
    },
    {
      groupLabel: 'Estoque',
      items: [
        { id: 'inventory-general', label: 'Estoque Geral', icon: Warehouse },
        { id: 'inventory-movements', label: 'Movimentações', icon: History },
        { id: 'inventory-clients', label: 'Estoque em Clientes', icon: Store },
      ],
    },
    {
      items: [
        { id: 'reports', label: 'Relatórios', icon: BarChart3 },
        { id: 'settings', label: 'Configurações', icon: Settings },
      ],
    },
  ];

  const handleItemClick = (view: ViewMode) => {
    onSelectView(view);
    onCloseMobile();
  };

  return (
    <>
      <aside
        className={`hidden lg:flex fixed top-0 left-0 bottom-0 z-40 bg-white border-r border-slate-200/80 transition-all duration-300 ease-in-out flex-col justify-between
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Top Branding Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
          {isCollapsed ? (
            <div className="w-full flex items-center justify-center relative group">
              <img
                src="/logo.png"
                alt="RN 3D"
                onClick={() => {
                  onSelectView('dashboard');
                  if (isMobileOpen) onCloseMobile();
                }}
                className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-200 cursor-pointer hover:scale-105 transition-transform"
                title="Ir para o Dashboard"
              />
              <button
                onClick={onToggleCollapse}
                className="absolute -right-2 top-1/2 -translate-y-1/2 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block cursor-pointer"
                title="Expandir Menu"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <div
                onClick={() => {
                  onSelectView('dashboard');
                  if (isMobileOpen) onCloseMobile();
                }}
                className="flex items-center gap-3 overflow-hidden cursor-pointer group hover:opacity-90 transition-opacity"
                title="Ir para o Dashboard"
              >
                <img
                  src="/logo.png"
                  alt="RN 3D"
                  className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-200 shrink-0 cursor-pointer group-hover:scale-105 transition-transform"
                />
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-slate-900 text-base leading-tight truncate group-hover:text-indigo-600 transition-colors">
                    RN 3D <span className="text-indigo-600">Sistema</span>
                  </span>
                </div>
              </div>

              {/* Mobile Close Button */}
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Desktop Collapse Toggle */}
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Recolher Menu"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Balanced Navigation Items (Comfortable text size & smooth overflow without scrollbars) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3 space-y-3.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {group.groupLabel && !isCollapsed && (
                <div className="px-3 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {group.groupLabel}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  currentView === item.id ||
                  (item.id === 'clients' && currentView === 'client-profile') ||
                  (item.id === 'visits' && currentView === 'visit-execution');

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 relative group cursor-pointer
                      ${isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-100 dark:border-indigo-900/50'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white border border-transparent'
                      }
                      ${isCollapsed ? 'justify-center px-0' : ''}
                    `}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-colors cursor-pointer ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                        }`}
                    />
                    {!isCollapsed && <span className="truncate cursor-pointer">{item.label}</span>}

                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-600 rounded-r-full" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Clean Logout Button */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => signOut()}
            title="Sair do sistema"
            className={`w-full flex items-center justify-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer ${isCollapsed ? 'justify-center px-0' : ''
              }`}
          >
            <LogOut className="w-4 h-4 shrink-0 cursor-pointer" />
            {!isCollapsed && <span className="cursor-pointer">Sair do sistema</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
