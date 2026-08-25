import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types';
import { Search, Plus, Minus, X, ChevronDown, Check, Sparkles } from 'lucide-react';
import { ImageLightboxModal } from './ImageLightboxModal';

interface ProductSelectComboboxProps {
  products: Product[];
  onSelectProduct: (product: Product, quantity?: number) => void;
  isCashPayment?: boolean;
}

export const ProductSelectCombobox: React.FC<ProductSelectComboboxProps> = ({
  products,
  onSelectProduct,
  isCashPayment = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside (on desktop)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus input when mobile full-screen view opens
  useEffect(() => {
    if (isOpen && mobileInputRef.current) {
      setTimeout(() => {
        mobileInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      (p.storageCapacity && p.storageCapacity.toLowerCase().includes(query)) ||
      (p.material && p.material.toLowerCase().includes(query))
    );
  });

  const getEffectivePrice = (p: Product) => {
    if (isCashPayment) {
      return p.cashPrice ?? (p.isKeychain || p.category === 'Chaveiro' ? 4.0 : p.standardPrice);
    }
    return p.standardPrice;
  };

  // Mobile selection handler
  const handleMobileSelect = (product: Product) => {
    onSelectProduct(product);
    setLastAddedId(product.id);
    setTimeout(() => setLastAddedId(null), 1500);
  };

  // Desktop selection / quantity handlers (Keeps dropdown OPEN on web!)
  const handleDesktopAddProduct = (product: Product) => {
    const currentQty = selectedQuantities[product.id] || 0;
    const newQty = currentQty > 0 ? currentQty + 1 : 1;

    setSelectedQuantities((prev) => ({
      ...prev,
      [product.id]: newQty,
    }));

    onSelectProduct(product);
    // Web dropdown stays OPEN (do not close!)
    setIsOpen(true);
  };

  const handleDesktopQuantityChange = (product: Product, delta: number) => {
    const currentQty = selectedQuantities[product.id] || 0;
    const newQty = Math.max(0, currentQty + delta);

    setSelectedQuantities((prev) => ({
      ...prev,
      [product.id]: newQty,
    }));

    if (newQty > 0) {
      onSelectProduct(product);
    }
    setIsOpen(true);
  };

  const handleDesktopDirectInputQty = (product: Product, valStr: string) => {
    const qty = parseInt(valStr.replace(/\D/g, ''), 10) || 0;
    setSelectedQuantities((prev) => ({
      ...prev,
      [product.id]: qty,
    }));
    if (qty > 0) {
      onSelectProduct(product);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Desktop & Inline Input Trigger */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder={`🔍 Digite o nome, SKU ou modelo para pesquisar (${products.length} produtos)...`}
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 hover:border-indigo-400 focus:border-indigo-500 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs transition-all cursor-pointer"
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        )}
      </div>

      {/* 📱 MOBILE FULL-SCREEN VIEW (Visible on screens < 640px when open) */}
      {isOpen && (
        <div className="fixed inset-0 z-[99999] bg-white dark:bg-slate-950 flex flex-col sm:hidden animate-in fade-in duration-150">
          {/* Mobile Top Header */}
          <div className="p-3.5 bg-slate-900 dark:bg-slate-900 text-white flex items-center justify-between shadow-md shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-xs uppercase tracking-wider">Catálogo de Produtos</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" /> Concluir
            </button>
          </div>

          {/* Mobile Sticky Search Field */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-600 pointer-events-none" />
              <input
                ref={mobileInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Digite nome, SKU ou modelo..."
                className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-950 border border-indigo-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1">
              <span>{filteredProducts.length} produtos encontrados</span>
              <span className="text-indigo-600 dark:text-indigo-400">Toque em + para adicionar</span>
            </div>
          </div>

          {/* Mobile Scrollable Product List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2">
            {filteredProducts.length === 0 ? (
              <div className="p-10 text-center text-slate-400 space-y-2">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhum produto localizado</p>
                <p className="text-xs">Tente buscar por outro termo.</p>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const price = getEffectivePrice(p);
                const isJustAdded = lastAddedId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleMobileSelect(p)}
                    className={`p-3 rounded-xl transition-all flex items-center justify-between gap-3 active:bg-indigo-50 dark:active:bg-indigo-950 ${
                      isJustAdded ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800' : 'hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-indigo-100/80 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
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
                      <div className="min-w-0">
                        <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">{p.name}</h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">SKU: {p.sku}</span>
                          {p.storageCapacity && ` • ${p.storageCapacity}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">
                          R$ {price.toFixed(2).replace('.', ',')}
                        </span>
                        {isCashPayment && (
                          <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase bg-amber-50 dark:bg-amber-950 px-1 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                            À Vista
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMobileSelect(p);
                        }}
                        className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs transition-all ${
                          isJustAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {isJustAdded ? (
                          <>
                            <Check className="w-4 h-4" /> Adicionado
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" /> Adicionar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 💻 DESKTOP FLOATING DROPDOWN MENU (Visible on screens >= 640px when open) */}
      {isOpen && (
        <div className="hidden sm:block absolute z-[9999] left-0 right-0 mt-1.5 bg-white dark:bg-[#181c26] text-slate-900 dark:text-slate-100 rounded-2xl border border-slate-200/90 dark:border-[#202531] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Web Dropdown Header with Done Button */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-[#12151c] border-b border-slate-100 dark:border-[#202531] flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              {searchQuery
                ? `${filteredProducts.length} ${filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}`
                : `Catálogo Completo (${products.length} itens disponíveis)`}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden md:inline">
                Altere as quantidades à vontade. Clique fora ou em fechar ao terminar.
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Fechar
              </button>
            </div>
          </div>

          <div className="max-h-[650px] lg:max-h-[750px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredProducts.length === 0 ? (
              <div className="p-10 text-center text-slate-400 dark:text-slate-500 space-y-1.5">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhum produto localizado</p>
                <p className="text-xs">Tente buscar por outro termo ou SKU.</p>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const price = getEffectivePrice(p);
                const selectedQty = selectedQuantities[p.id] || 0;
                const isSelectedOnWeb = selectedQty > 0;

                return (
                  <div
                    key={p.id}
                    className={`w-full p-3.5 sm:p-4 transition-colors flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 last:border-0 ${
                      isSelectedOnWeb
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                        : 'hover:bg-indigo-50/60 dark:hover:bg-[#202636]'
                    }`}
                  >
                    {/* Left Info: Image + Name + SKU */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        onClick={(e) => {
                          if (p.imageUrl) {
                            e.stopPropagation();
                            setZoomImage({ url: p.imageUrl, title: p.name });
                          }
                        }}
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-indigo-100/80 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700 ${
                          p.imageUrl ? 'cursor-zoom-in hover:scale-105 transition-transform' : ''
                        }`}
                        title={p.imageUrl ? 'Clique para ampliar a foto' : undefined}
                      >
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs">3D</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                            {p.name}
                          </h5>
                          {isSelectedOnWeb && (
                            <span className="px-2 py-0.5 bg-emerald-600 text-white font-extrabold text-[10px] rounded-md flex items-center gap-1 shadow-xs animate-in fade-in">
                              <Check className="w-3 h-3" /> Selecionado
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                          <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded-md">
                            SKU: {p.sku}
                          </span>
                          {p.storageCapacity && ` • ${p.storageCapacity}`}
                          {p.category && ` • ${p.category}`}
                        </p>
                      </div>
                    </div>

                    {/* Right Controls: Price + Permanent Web Stepper / Select Button */}
                    <div className="flex items-center gap-3.5 shrink-0">
                      <div className="text-right">
                        <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 block">
                          R$ {price.toFixed(2).replace('.', ',')}
                        </span>
                        {isCashPayment && (
                          <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase bg-amber-50 dark:bg-amber-950/80 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 inline-block mt-0.5">
                            À Vista
                          </span>
                        )}
                      </div>

                      {/* WEB CONTROLS: Stepper if selected, or (+) Add button */}
                      {isSelectedOnWeb ? (
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-emerald-500/60 rounded-xl p-1 shadow-xs">
                          <button
                            type="button"
                            onClick={() => handleDesktopQuantityChange(p, -1)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold cursor-pointer transition-all active:scale-95"
                            title="Diminuir quantidade"
                          >
                            <Minus className="w-3.5 h-3.5 text-rose-500" />
                          </button>

                          <input
                            type="text"
                            inputMode="numeric"
                            value={selectedQty}
                            onChange={(e) => handleDesktopDirectInputQty(p, e.target.value)}
                            className="w-10 text-center font-black text-xs text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none"
                          />

                          <button
                            type="button"
                            onClick={() => handleDesktopQuantityChange(p, 1)}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer transition-all active:scale-95 shadow-xs"
                            title="Aumentar quantidade"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDesktopAddProduct(p)}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Selecionar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Lightbox Full-Screen Modal */}
      {zoomImage && (
        <ImageLightboxModal
          imageUrl={zoomImage.url}
          title={zoomImage.title}
          onClose={() => setZoomImage(null)}
        />
      )}
    </div>
  );
};
