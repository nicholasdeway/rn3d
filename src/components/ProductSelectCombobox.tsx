import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types';
import { Search, Plus, X, ChevronDown, Check } from 'lucide-react';

interface ProductSelectComboboxProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  isCashPayment?: boolean;
}

export const ProductSelectCombobox: React.FC<ProductSelectComboboxProps> = ({
  products,
  onSelectProduct,
  isCashPayment = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleSelect = (product: Product) => {
    onSelectProduct(product);
    setSearchQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
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
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 hover:border-indigo-400 focus:border-indigo-500 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs transition-all"
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

      {/* Floating Dropdown Results Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>
              {searchQuery
                ? `${filteredProducts.length} ${filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}`
                : `Mostrando catálogo completo (${products.length} itens)`}
            </span>
            <span className="text-[10px] font-normal text-slate-400">Clique para adicionar ao orçamento</span>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {filteredProducts.length === 0 ? (
              <div className="p-6 text-center text-slate-400 space-y-1">
                <p className="text-xs font-bold text-slate-700">Nenhum produto localizado</p>
                <p className="text-[11px]">Tente buscar por outro nome ou SKU.</p>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const price = getEffectivePrice(p);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p)}
                    className="w-full p-2.5 text-left hover:bg-indigo-50/80 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Product Thumbnail */}
                      <div className="w-10 h-10 rounded-lg bg-indigo-100/80 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden border border-slate-200 group-hover:border-indigo-300">
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

                      {/* Product Details */}
                      <div className="min-w-0">
                        <h5 className="font-bold text-slate-900 text-xs truncate group-hover:text-indigo-900">
                          {p.name}
                        </h5>
                        <p className="text-[11px] text-slate-500 truncate">
                          <span className="font-mono text-indigo-600 font-semibold">SKU: {p.sku}</span>
                          {p.storageCapacity && ` • ${p.storageCapacity}`}
                          {p.category && ` • ${p.category}`}
                        </p>
                      </div>
                    </div>

                    {/* Price and Add Button */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-emerald-600 block">
                          R$ {price.toFixed(2).replace('.', ',')}
                        </span>
                        {isCashPayment && (
                          <span className="text-[9px] font-bold text-amber-600 uppercase bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                            À Vista
                          </span>
                        )}
                      </div>
                      <span className="p-1.5 bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white rounded-lg transition-colors">
                        <Plus className="w-4 h-4" />
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
