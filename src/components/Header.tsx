import React, { useState } from 'react';
import { Client, Order, Product, Quote, ViewMode } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  Plus,
  Search,
  ShoppingCart,
  FileText,
  Boxes,
  MapPin,
  PackagePlus,
  Sparkles,
  User as UserIcon,
  LogOut,
  X,
} from 'lucide-react';

interface HeaderProps {
  currentView: ViewMode;
  onOpenMobileSidebar: () => void;
  onQuickAction: (actionType: string) => void;
  onSearchChange?: (query: string) => void;
  products?: Product[];
  clients?: Client[];
  orders?: Order[];
  quotes?: Quote[];
  onSelectSearchResult?: (type: 'order' | 'quote' | 'product' | 'client', id: string, item: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onOpenMobileSidebar,
  onQuickAction,
  onSearchChange,
  products = [],
  clients = [],
  orders = [],
  quotes = [],
  onSelectSearchResult,
}) => {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Dashboard Geral';
      case 'calculator':
        return 'Calculadora de Custos 3D';
      case 'products':
        return 'Catálogo de Produtos';
      case 'clients':
      case 'client-profile':
        return 'Gestão de Clientes';
      case 'consignments':
        return 'Consignações em Clientes';
      case 'visits':
      case 'visit-execution':
        return 'Visitas e Conferências';
      case 'exchanges':
        return 'Histórico de Trocas';
      case 'quotes':
        return 'Orçamentos Comerciais';
      case 'orders':
        return 'Pedidos de Venda e Produção';
      case 'inventory-general':
        return 'Estoque Geral da Oficina';
      case 'inventory-movements':
        return 'Extrato de Movimentações';
      case 'inventory-clients':
        return 'Estoque Alocado em Clientes';
      case 'financial':
        return 'Gestão Financeira e Pagamentos';
      case 'reports':
        return 'Relatórios e Indicadores';
      case 'settings':
        return 'Configurações do Sistema';
      default:
        return 'RN 3D Sistema';
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchVal(val);
    setIsSearchOpen(true);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  // Search Matching Algorithm
  const q = searchVal.trim().toLowerCase();

  const matchedOrders = q
    ? orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.clientName.toLowerCase().includes(q) ||
        o.paymentStatusText.toLowerCase().includes(q) ||
        (o.items && o.items.some((i) => i.productName.toLowerCase().includes(q)))
    )
    : [];

  const matchedQuotes = q
    ? quotes.filter(
      (quote) =>
        quote.id.toLowerCase().includes(q) ||
        quote.clientName.toLowerCase().includes(q) ||
        quote.status.toLowerCase().includes(q) ||
        (quote.items && quote.items.some((i) => i.description.toLowerCase().includes(q)))
    )
    : [];

  const matchedProducts = q
    ? products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    )
    : [];

  const matchedClients = q
    ? clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.document && c.document.includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q))
    )
    : [];

  const actions = [
    { id: 'calculadora-3d', label: 'Calculadora 3D', icon: Sparkles, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'novo-pedido', label: 'Novo Pedido', icon: ShoppingCart, color: 'text-blue-600 bg-blue-50' },
    { id: 'novo-orcamento', label: 'Novo Orçamento', icon: FileText, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'nova-consignacao', label: 'Nova Consignação', icon: Boxes, color: 'text-purple-600 bg-purple-50' },
    { id: 'registrar-visita', label: 'Registrar Visita', icon: MapPin, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'registrar-entrada', label: 'Entrada de Estoque', icon: PackagePlus, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left side: Mobile menu toggle + Page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">{getViewTitle()}</h1>
          <p className="text-xs text-slate-400 hidden sm:block">Operação Local RN 3D</p>
        </div>
      </div>

      {/* Middle/Right: Global Search + Quick Action Button + User Profile */}
      <div className="flex items-center gap-3">
        {/* Search Input Container */}
        <div className="relative hidden md:block w-64 lg:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchVal}
            onChange={handleSearch}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Buscar pedido (ex: PED-...), orçamento, produto..."
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
          />
          {searchVal && (
            <button
              onClick={() => {
                setSearchVal('');
                setIsSearchOpen(false);
                if (onSearchChange) onSearchChange('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Floating Search Results Popup */}
          {isSearchOpen && searchVal.trim().length > 0 && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsSearchOpen(false)}
              />
              <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-50 max-h-96 overflow-y-auto space-y-3 animate-in fade-in zoom-in-95 duration-150">
                {matchedOrders.length === 0 &&
                  matchedQuotes.length === 0 &&
                  matchedProducts.length === 0 &&
                  matchedClients.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    Nenhum resultado encontrado para "<strong>{searchVal}</strong>"
                  </div>
                ) : (
                  <>
                    {/* Orders Match Section */}
                    {matchedOrders.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
                          <ShoppingCart className="w-3 h-3 text-indigo-600" /> Pedidos Encontrados ({matchedOrders.length})
                        </div>
                        {matchedOrders.slice(0, 4).map((o) => (
                          <button
                            key={o.id}
                            onClick={() => {
                              setIsSearchOpen(false);
                              onSelectSearchResult?.('order', o.id, o);
                            }}
                            className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl text-left transition-colors cursor-pointer group border border-slate-100"
                          >
                            <div>
                              <p className="font-mono font-bold text-indigo-600 text-xs">{o.id}</p>
                              <p className="text-[11px] text-slate-700 font-semibold">{o.clientName}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-emerald-600 text-xs">
                                R$ {o.totalValue.toFixed(2).replace('.', ',')}
                              </p>
                              <span className="text-[10px] text-indigo-600 font-medium">
                                {o.status}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Quotes Match Section */}
                    {matchedQuotes.length > 0 && (
                      <div className="space-y-1 border-t border-slate-100 pt-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
                          <FileText className="w-3 h-3 text-indigo-600" /> Orçamentos Encontrados ({matchedQuotes.length})
                        </div>
                        {matchedQuotes.slice(0, 4).map((quote) => (
                          <button
                            key={quote.id}
                            onClick={() => {
                              setIsSearchOpen(false);
                              onSelectSearchResult?.('quote', quote.id, quote);
                            }}
                            className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl text-left transition-colors cursor-pointer group border border-slate-100"
                          >
                            <div>
                              <p className="font-mono font-bold text-indigo-600 text-xs">{quote.id}</p>
                              <p className="text-[11px] text-slate-700 font-semibold">{quote.clientName}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-emerald-600 text-xs">
                                R$ {quote.total.toFixed(2).replace('.', ',')}
                              </p>
                              <span className="text-[10px] text-slate-500 font-medium">
                                {quote.status}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Products Match Section */}
                    {matchedProducts.length > 0 && (
                      <div className="space-y-1 border-t border-slate-100 pt-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
                          <Boxes className="w-3 h-3 text-indigo-600" /> Produtos ({matchedProducts.length})
                        </div>
                        {matchedProducts.slice(0, 3).map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setIsSearchOpen(false);
                              onSelectSearchResult?.('product', p.id, p);
                            }}
                            className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl text-left transition-colors cursor-pointer group border border-slate-100"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] shrink-0 border border-slate-200 overflow-hidden">
                                {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : '3D'}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-xs">{p.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</p>
                              </div>
                            </div>
                            <p className="font-bold text-emerald-600 text-xs">
                              R$ {p.standardPrice.toFixed(2).replace('.', ',')}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Clients Match Section */}
                    {matchedClients.length > 0 && (
                      <div className="space-y-1 border-t border-slate-100 pt-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
                          <UserIcon className="w-3 h-3 text-indigo-600" /> Clientes ({matchedClients.length})
                        </div>
                        {matchedClients.slice(0, 3).map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setIsSearchOpen(false);
                              onSelectSearchResult?.('client', c.id, c);
                            }}
                            className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl text-left transition-colors cursor-pointer group border border-slate-100"
                          >
                            <p className="font-bold text-slate-900 text-xs">{c.name}</p>
                            <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full">
                              Ver Perfil
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Quick Action Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-indigo-600/20 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova operação</span>
          </button>

          {/* Quick Action Menu Popup */}
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Ações Rápidas
                </div>
                {actions.map((act) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={act.id}
                      onClick={() => {
                        setIsMenuOpen(false);
                        onQuickAction(act.id);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl text-left transition-colors group cursor-pointer"
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${act.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900">
                        {act.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* User Profile Avatar Pill in Header */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs border border-slate-800">
            <UserIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-800 truncate max-w-28">
              {user?.email?.split('@')[0] || 'Admin'}
            </span>
            <span className="text-[10px] text-slate-400 truncate max-w-28">
              RN3D System
            </span>
          </div>
          <button
            onClick={() => signOut()}
            title="Sair do sistema"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
