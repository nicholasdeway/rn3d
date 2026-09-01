import React, { useState } from 'react';
import { ViewMode } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Calculator,
  ShoppingCart,
  Package,
  Menu,
  Plus,
  Boxes,
  Users,
  FileText,
  MapPin,
  Repeat,
  DollarSign,
  Warehouse,
  BarChart3,
  Settings,
  LogOut,
  X,
  Sparkles,
  TrendingDown,
  ArrowDownLeft,
  History,
  Store,
} from 'lucide-react';

interface MobileFloatingNavProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onQuickAction: (actionType: 'aporte' | 'withdrawal' | 'expense' | 'quote' | 'nova-consignacao') => void;
}

export const MobileFloatingNav: React.FC<MobileFloatingNavProps> = ({
  currentView,
  onSelectView,
  onQuickAction,
}) => {
  const { signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);

  const primaryNavItems = [
    { id: 'dashboard' as ViewMode, label: 'INÍCIO', icon: LayoutDashboard },
    { id: 'quotes' as ViewMode, label: 'ORÇAMENTO', icon: FileText },
    { id: 'orders' as ViewMode, label: 'PEDIDOS', icon: ShoppingCart },
    { id: 'products' as ViewMode, label: 'PRODUTOS', icon: Package },
  ];

  const dropdownMenuItems = [
    { id: 'consignments' as ViewMode, label: 'Remessas de Consignação', icon: Boxes, color: 'text-purple-400' },
    { id: 'quotes' as ViewMode, label: 'Orçamentos', icon: FileText, color: 'text-indigo-400' },
    { id: 'expenses' as ViewMode, label: 'Financeiro', icon: TrendingDown, color: 'text-rose-400' },
    { id: 'financial' as ViewMode, label: 'Financeiro e Vendas', icon: DollarSign, color: 'text-emerald-400' },
    { id: 'calculator' as ViewMode, label: 'Calculadora de Custos 3D', icon: Calculator, color: 'text-amber-400' },
    { id: 'visits' as ViewMode, label: 'Visitas e Rotas', icon: MapPin, color: 'text-emerald-400' },
    { id: 'exchanges' as ViewMode, label: 'Trocas de Produtos', icon: Repeat, color: 'text-amber-400' },
    { id: 'clients' as ViewMode, label: 'Gestão de Clientes', icon: Users, color: 'text-blue-400' },
    { id: 'inventory-general' as ViewMode, label: 'Estoque Geral', icon: Warehouse, color: 'text-sky-400' },
    { id: 'inventory-movements' as ViewMode, label: 'Movimentações de Estoque', icon: History, color: 'text-orange-400' },
    { id: 'inventory-clients' as ViewMode, label: 'Estoque em Clientes', icon: Store, color: 'text-teal-400' },
    { id: 'reports' as ViewMode, label: 'Relatórios e Métricas', icon: BarChart3, color: 'text-indigo-400' },
    { id: 'settings' as ViewMode, label: 'Configurações', icon: Settings, color: 'text-slate-400' },
  ];

  const handleSelectDropdownItem = (view: ViewMode) => {
    setIsDropdownOpen(false);
    setIsFabOpen(false);
    onSelectView(view);
  };

  const handleTriggerFabAction = (action: 'aporte' | 'withdrawal' | 'expense' | 'quote' | 'nova-consignacao') => {
    setIsFabOpen(false);
    setIsDropdownOpen(false);
    onQuickAction(action);
  };

  return (
    <div className="no-print fixed bottom-4 left-4 right-4 z-40 lg:hidden pointer-events-auto">
      {/* Backdrop for FAB Speed Dial or Main Dropdown */}
      {(isDropdownOpen || isFabOpen) && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 transition-opacity animate-in fade-in"
          onClick={() => {
            setIsDropdownOpen(false);
            setIsFabOpen(false);
          }}
        />
      )}

      {/* Floating Speed Dial Menu Panel (Opens when clicking FAB + button) */}
      {isFabOpen && (
        <div className="absolute bottom-16 right-0 bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-3xl p-3 shadow-2xl z-50 space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-200 min-w-[260px]">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/80 mb-1">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Operações Rápidas
            </span>
            <button
              onClick={() => setIsFabOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1 text-xs">
            <button
              onClick={() => handleTriggerFabAction('nova-consignacao')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl font-bold bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/30 transition-all text-left"
            >
              <Boxes className="w-4 h-4 shrink-0 text-purple-400" />
              <div>
                <p className="text-xs font-bold">📦 Nova Consignação</p>
                <p className="text-[10px] text-purple-200/80 font-normal">Enviar produtos consignados para cliente</p>
              </div>
            </button>

            <button
              onClick={() => handleTriggerFabAction('aporte')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all text-left"
            >
              <ArrowDownLeft className="w-4 h-4 shrink-0 text-emerald-400" />
              <div>
                <p className="text-xs font-bold">📥 Lançamento / Aporte <span className="text-[10px] text-emerald-300 font-mono font-bold">(+ Entrada)</span></p>
                <p className="text-[10px] text-emerald-300/80 font-normal">Sócio colocando/devolvendo valor na empresa</p>
              </div>
            </button>

            <button
              onClick={() => handleTriggerFabAction('withdrawal')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl font-bold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-all text-left"
            >
              <Users className="w-4 h-4 shrink-0 text-amber-400" />
              <div>
                <p className="text-xs font-bold">🤝 Retirada de Sócio <span className="text-[10px] text-amber-300 font-mono font-bold">(- Saída)</span></p>
                <p className="text-[10px] text-amber-300/80 font-normal">Sócio tirando dinheiro da conta para uso pessoal</p>
              </div>
            </button>

            <button
              onClick={() => handleTriggerFabAction('expense')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl font-bold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-all text-left"
            >
              <TrendingDown className="w-4 h-4 shrink-0 text-rose-400" />
              <div>
                <p className="text-xs font-bold">💸 Nova Despesa</p>
                <p className="text-[10px] text-rose-300/80 font-normal">Cadastrar custo ou saída de caixa</p>
              </div>
            </button>

            <button
              onClick={() => handleTriggerFabAction('quote')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl font-bold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all text-left"
            >
              <FileText className="w-4 h-4 shrink-0 text-indigo-400" />
              <div>
                <p className="text-xs font-bold">📄 Criar Orçamento / Pedido</p>
                <p className="text-[10px] text-indigo-300/80 font-normal">Novo orçamento para cliente</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Floating Dropdown Menu Panel (Opens Bottom-Up when clicking MENU) */}
      {isDropdownOpen && (
        <div className="absolute bottom-16 right-0 left-0 bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-3xl p-3 shadow-2xl z-50 space-y-1 animate-in fade-in slide-in-from-bottom-4 duration-200 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 mb-1">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Módulos do Sistema
            </span>
            <button
              onClick={() => setIsDropdownOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-1">
            {dropdownMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectDropdownItem(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold text-left transition-all ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Logout Option */}
            <div className="pt-2 border-t border-slate-800/80 mt-1">
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  signOut();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sair do Sistema</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) positioned top-right above the pill */}
      <div className="flex justify-end mb-2 pr-1 relative z-40">
        <button
          onClick={() => {
            setIsDropdownOpen(false);
            setIsFabOpen(!isFabOpen);
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border transition-all cursor-pointer ${
            isFabOpen
              ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-rose-600/40 rotate-45'
              : 'bg-emerald-500 hover:bg-emerald-400 text-white border-emerald-400/50 shadow-emerald-500/40'
          }`}
          title="Operações Rápidas"
        >
          <Plus className="w-6 h-6 stroke-[2.5] transition-transform duration-200" />
        </button>
      </div>

      {/* Main Floating Glass Pill Container (Perfectly Centered 5-Column Grid) */}
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800/90 rounded-full p-1.5 shadow-2xl shadow-slate-950/80 grid grid-cols-5 place-items-center relative z-40 w-full">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id && !isDropdownOpen && !isFabOpen;

          return (
            <button
              key={item.id}
              onClick={() => {
                setIsDropdownOpen(false);
                setIsFabOpen(false);
                onSelectView(item.id);
              }}
              className={`w-full flex flex-col items-center justify-center py-1 rounded-full transition-all duration-200 cursor-pointer ${
                isActive ? 'text-emerald-400 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <div className={`p-1 rounded-full ${isActive ? 'bg-emerald-500/15' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400 stroke-[2.5]' : 'text-slate-400'}`} />
              </div>
              <span className={`text-[9px] sm:text-[10px] tracking-wider mt-0.5 ${isActive ? 'text-emerald-400 font-extrabold' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Menu Toggle for Bottom-Up Dropdown */}
        <button
          onClick={() => {
            setIsFabOpen(false);
            setIsDropdownOpen(!isDropdownOpen);
          }}
          className={`w-full flex flex-col items-center justify-center py-1 rounded-full transition-all cursor-pointer ${
            isDropdownOpen ? 'text-emerald-400 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <div className={`p-1 rounded-full ${isDropdownOpen ? 'bg-emerald-500/15' : ''}`}>
            {isDropdownOpen ? (
              <X className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
            ) : (
              <Menu className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <span className={`text-[9px] sm:text-[10px] tracking-wider mt-0.5 ${isDropdownOpen ? 'text-emerald-400 font-extrabold' : 'text-slate-400'}`}>
            MENU
          </span>
        </button>
      </div>
    </div>
  );
};
