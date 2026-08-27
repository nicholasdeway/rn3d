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
  RefreshCw,
  Sun,
  Moon,
  ArrowLeft,
} from 'lucide-react';

interface HeaderProps {
  currentView: ViewMode;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onOpenMobileSidebar: () => void;
  onQuickAction: (actionType: string) => void;
  onSearchChange?: (query: string) => void;
  onNavigate?: (view: ViewMode) => void;
  products?: Product[];
  clients?: Client[];
  orders?: Order[];
  quotes?: Quote[];
  onSelectSearchResult?: (type: 'order' | 'quote' | 'product' | 'client', id: string, item: any) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  canGoBack,
  onGoBack,
  onOpenMobileSidebar,
  onQuickAction,
  onSearchChange,
  onNavigate,
  products = [],
  clients = [],
  orders = [],
  quotes = [],
  onSelectSearchResult,
  theme = 'light',
  onToggleTheme,
}) => {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

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
    <>
      <header className="h-16 bg-white dark:bg-[#12151c] border-b border-slate-200/80 dark:border-[#202531] px-3 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs gap-3">
        {/* Left Side: Back Button, Mobile Logo, and Long Expanded Web Search Bar */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1">
          {/* Universal Visual Back Button ("← Voltar") for iOS, Android & Desktop */}
          {canGoBack && onGoBack && (
            <button
              onClick={onGoBack}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/80 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200/80 dark:border-slate-700/80 shrink-0 shadow-2xs group"
              title="Voltar para a tela anterior"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:-translate-x-0.5 transition-transform" />
              <span className="font-extrabold text-xs">Voltar</span>
            </button>
          )}

          {/* MOBILE ONLY: Circular Round Logo */}
          <button
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="md:hidden flex items-center justify-center p-0.5 rounded-full border-2 border-indigo-500/40 hover:border-indigo-600 dark:border-indigo-400/50 dark:hover:border-indigo-400 transition-all cursor-pointer group shrink-0"
            title="Ir para a Página Inicial (Dashboard)"
          >
            <img
              src="/logo.png"
              alt="RN 3D"
              className="w-9 h-9 rounded-full object-cover group-hover:scale-105 transition-transform"
            />
          </button>

          {/* WEB / DESKTOP ONLY: Long Expanded Search Bar (no logo, no titles) */}
          <div className="relative hidden md:block flex-1 max-w-xl lg:max-w-2xl">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchVal}
              onChange={handleSearch}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Buscar pedido, orçamento, produto ou cliente..."
              className="w-full pl-10 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
            {searchVal && (
              <button
                onClick={() => {
                  setSearchVal('');
                  setIsSearchOpen(false);
                  if (onSearchChange) onSearchChange('');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
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
                <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-[#181c26] rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xl p-3 z-50 max-h-96 overflow-y-auto space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  {matchedOrders.length === 0 &&
                    matchedQuotes.length === 0 &&
                    matchedProducts.length === 0 &&
                    matchedClients.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                      Nenhum resultado encontrado para "<strong>{searchVal}</strong>"
                    </div>
                  ) : (
                    <>
                      {/* Orders Match Section */}
                      {matchedOrders.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 flex items-center gap-1.5">
                            <ShoppingCart className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Pedidos Encontrados ({matchedOrders.length})
                          </div>
                          {matchedOrders.slice(0, 4).map((o) => (
                            <button
                              key={o.id}
                              onClick={() => {
                                setIsSearchOpen(false);
                                onSelectSearchResult?.('order', o.id, o);
                              }}
                              className="w-full flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-left transition-colors cursor-pointer group border border-slate-100 dark:border-slate-800"
                            >
                              <div>
                                <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">{o.id}</p>
                                <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold">{o.clientName}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                                  R$ {o.totalValue.toFixed(2).replace('.', ',')}
                                </p>
                                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                                  {o.status}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Quotes Match Section */}
                      {matchedQuotes.length > 0 && (
                        <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-2">
                          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 flex items-center gap-1.5">
                            <FileText className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Orçamentos Encontrados ({matchedQuotes.length})
                          </div>
                          {matchedQuotes.slice(0, 4).map((quote) => (
                            <button
                              key={quote.id}
                              onClick={() => {
                                setIsSearchOpen(false);
                                onSelectSearchResult?.('quote', quote.id, quote);
                              }}
                              className="w-full flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-left transition-colors cursor-pointer group border border-slate-100 dark:border-slate-800"
                            >
                              <div>
                                <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">{quote.id}</p>
                                <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold">{quote.clientName}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                                  R$ {quote.total.toFixed(2).replace('.', ',')}
                                </p>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                  {quote.status}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Products Match Section */}
                      {matchedProducts.length > 0 && (
                        <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-2">
                          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 flex items-center gap-1.5">
                            <Boxes className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Produtos ({matchedProducts.length})
                          </div>
                          {matchedProducts.slice(0, 3).map((p) => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setIsSearchOpen(false);
                                onSelectSearchResult?.('product', p.id, p);
                              }}
                              className="w-full flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-left transition-colors cursor-pointer group border border-slate-100 dark:border-slate-800"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-slate-200 dark:border-slate-700 overflow-hidden">
                                  {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : '3D'}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">{p.name}</p>
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">SKU: {p.sku}</p>
                                </div>
                              </div>
                              <p className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                                R$ {p.standardPrice.toFixed(2).replace('.', ',')}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Clients Match Section */}
                      {matchedClients.length > 0 && (
                        <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-2">
                          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 flex items-center gap-1.5">
                            <UserIcon className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Clientes ({matchedClients.length})
                          </div>
                          {matchedClients.slice(0, 3).map((c) => (
                            <button
                              key={c.id}
                              onClick={() => {
                                setIsSearchOpen(false);
                                onSelectSearchResult?.('client', c.id, c);
                              }}
                              className="w-full flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-left transition-colors cursor-pointer group border border-slate-100 dark:border-slate-800"
                            >
                              <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">{c.name}</p>
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
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
        </div>

        {/* Right Side Tools: Mobile Search Button, Sync System, Theme Toggle, Quick Actions, User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile Search Icon Button (Lupa no mobile) */}
          <button
            onClick={() => {
              setIsMobileSearchOpen(!isMobileSearchOpen);
              setIsSearchOpen(true);
            }}
            className="md:hidden flex items-center justify-center p-2 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800"
            title="Buscar no Sistema"
          >
            <Search className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </button>

          {/* Sync System Button */}
          <button
            onClick={() => onQuickAction('sync-all')}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Sincronizar todo o sistema com o Supabase (Produtos, Clientes, Pedidos e Orçamentos)"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline">Sincronizar Sistema</span>
          </button>

          {/* Dark / Light Mode Theme Toggle Button */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer shadow-2xs flex items-center justify-center"
              title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro (Cinza Preto)'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
          )}

          {/* Quick Action Dropdown Button (Oculto no Mobile, visivel apenas no desktop sm:block) */}
          <div className="relative hidden sm:block">
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
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#181c26] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    Ações Rápidas
                  </div>
                  {actions.map((act) => {
                    const IconComponent = act.icon;
                    return (
                      <button
                        key={act.id}
                        onClick={() => {
                          setIsMenuOpen(false);
                          onQuickAction(act.id);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left cursor-pointer group"
                      >
                        <div className={`p-1.5 rounded-lg ${act.color} dark:bg-slate-800 dark:text-indigo-400 group-hover:scale-105 transition-transform`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        {act.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* User Profile Info Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-2xs border border-slate-700">
              {user?.email?.charAt(0).toUpperCase() || 'N'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {user?.email?.split('@')[0] || 'nicholasdeway'}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">RN3D System</p>
            </div>
            <button
              onClick={() => signOut()}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-1"
              title="Sair da Conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Overlay Search Modal (When Search Icon is tapped on Mobile) */}
      {isMobileSearchOpen && (
        <div className="md:hidden bg-slate-900 text-white p-3 border-b border-slate-800 sticky top-16 z-30 shadow-xl animate-in slide-in-from-top-2 duration-150">
          <div className="relative flex items-center gap-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchVal}
              onChange={handleSearch}
              placeholder="Buscar pedido, orçamento, produto ou cliente..."
              className="w-full pl-9 pr-12 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
            {searchVal && (
              <button
                onClick={() => {
                  setSearchVal('');
                  if (onSearchChange) onSearchChange('');
                }}
                className="absolute right-16 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => {
                setIsMobileSearchOpen(false);
                setSearchVal('');
                if (onSearchChange) onSearchChange('');
              }}
              className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 shrink-0 cursor-pointer"
            >
              Fechar
            </button>
          </div>

          {/* Instant Mobile Search Results */}
          {searchVal.trim().length > 0 && (
            <div className="mt-2 bg-white dark:bg-[#181c26] text-slate-900 dark:text-slate-100 rounded-2xl p-3 shadow-2xl max-h-80 overflow-y-auto space-y-3 border border-slate-200 dark:border-slate-700">
              {matchedOrders.length === 0 &&
                matchedQuotes.length === 0 &&
                matchedProducts.length === 0 &&
                matchedClients.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                  Nenhum resultado encontrado para "<strong>{searchVal}</strong>"
                </div>
              ) : (
                <>
                  {/* Orders Match Section */}
                  {matchedOrders.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 flex items-center gap-1.5">
                        <ShoppingCart className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Pedidos ({matchedOrders.length})
                      </div>
                      {matchedOrders.slice(0, 4).map((o) => (
                        <button
                          key={o.id}
                          onClick={() => {
                            setIsMobileSearchOpen(false);
                            onSelectSearchResult?.('order', o.id, o);
                          }}
                          className="w-full flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-left transition-colors cursor-pointer border border-slate-100 dark:border-slate-800"
                        >
                          <div>
                            <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">{o.id}</p>
                            <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold">{o.clientName}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                              R$ {o.totalValue.toFixed(2).replace('.', ',')}
                            </p>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                              {o.status}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Quotes Match Section */}
                  {matchedQuotes.length > 0 && (
                    <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-2">
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Orçamentos ({matchedQuotes.length})
                      </div>
                      {matchedQuotes.slice(0, 4).map((quote) => (
                        <button
                          key={quote.id}
                          onClick={() => {
                            setIsMobileSearchOpen(false);
                            onSelectSearchResult?.('quote', quote.id, quote);
                          }}
                          className="w-full flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-left transition-colors cursor-pointer border border-slate-100 dark:border-slate-800"
                        >
                          <div>
                            <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">{quote.id}</p>
                            <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold">{quote.clientName}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                              R$ {quote.total.toFixed(2).replace('.', ',')}
                            </p>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              {quote.status}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Products Match Section */}
                  {matchedProducts.length > 0 && (
                    <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-2">
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 flex items-center gap-1.5">
                        <Boxes className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Produtos ({matchedProducts.length})
                      </div>
                      {matchedProducts.slice(0, 3).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setIsMobileSearchOpen(false);
                            onSelectSearchResult?.('product', p.id, p);
                          }}
                          className="w-full flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-left transition-colors cursor-pointer border border-slate-100 dark:border-slate-800"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-slate-200 dark:border-slate-700 overflow-hidden">
                              {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : '3D'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">{p.name}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">SKU: {p.sku}</p>
                            </div>
                          </div>
                          <p className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                            R$ {p.standardPrice.toFixed(2).replace('.', ',')}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Clients Match Section */}
                  {matchedClients.length > 0 && (
                    <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-2">
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 flex items-center gap-1.5">
                        <UserIcon className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Clientes ({matchedClients.length})
                      </div>
                      {matchedClients.slice(0, 3).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setIsMobileSearchOpen(false);
                            onSelectSearchResult?.('client', c.id, c);
                          }}
                          className="w-full flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-left transition-colors cursor-pointer border border-slate-100 dark:border-slate-800"
                        >
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">{c.name}</p>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
                            Ver Perfil
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};
