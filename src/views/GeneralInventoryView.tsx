import React, { useState } from 'react';
import { Product } from '../types';
import { Warehouse, AlertTriangle, Search, Edit2, Package } from 'lucide-react';
import { ImageLightboxModal } from '../components/ImageLightboxModal';

interface GeneralInventoryViewProps {
  products: Product[];
  onUpdateStock: (productId: string, newStock: number) => void;
}

export const GeneralInventoryView: React.FC<GeneralInventoryViewProps> = ({
  products,
  onUpdateStock,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [stockInput, setStockInput] = useState<number>(0);
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);

  const totalRegistered = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + p.currentStock, 0);
  const totalCostValuation = products.reduce((acc, p) => acc + p.currentStock * p.estimatedCost, 0);
  const lowStockCount = products.filter((p) => p.currentStock <= p.minStock).length;

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-indigo-600" />
            Estoque Geral da Oficina
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Controle de saldo físico em prateleira, fotos dos produtos e valoração de insumos.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Produtos Cadastrados</span>
            <span className="text-lg font-bold text-slate-900">{totalRegistered} itens</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Estoque Total Físico</span>
            <span className="text-lg font-bold text-slate-900">{totalStockUnits} un</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <span className="font-black text-sm">R$</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Custo Total de Estoque</span>
            <span className="text-lg font-bold text-emerald-600">
              R$ {totalCostValuation.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Alertas Estoque Baixo</span>
            <span className="text-lg font-bold text-rose-600">{lowStockCount} alertas</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar produto por nome ou SKU..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Inventory Mobile Cards & Desktop Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">Nenhum produto encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Verifique o termo pesquisado ou cadastre novos produtos no catálogo.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Cards Layout (< 768px) - Eliminates Horizontal Scroll */}
          <div className="block md:hidden space-y-3">
            {filtered.map((p) => {
              const isLow = p.currentStock <= p.minStock;
              const totalVal = p.currentStock * p.estimatedCost;

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-2xl border shadow-xs space-y-3 transition-colors ${
                    isLow
                      ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                      : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'
                  }`}
                >
                  {/* Top Row: Thumbnail, Name, SKU & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Product Thumbnail */}
                      <div
                        onClick={() => {
                          if (p.imageUrl) {
                            setZoomImage({ url: p.imageUrl, title: p.name });
                          }
                        }}
                        className={`w-12 h-12 rounded-xl bg-indigo-100/80 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden border border-slate-200 ${
                          p.imageUrl ? 'cursor-zoom-in hover:scale-105 transition-transform' : ''
                        }`}
                        title={p.imageUrl ? 'Clique para ver foto em tela cheia' : undefined}
                      >
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>3D</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-xs leading-snug">{p.name}</h4>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">SKU: {p.sku}</p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isLow ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Estoque baixo
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Normal
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock Metrics Grid */}
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 font-medium block">Estoque Atual</span>
                      <span className={`font-black text-sm ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                        {p.currentStock} un <span className="text-[10px] font-normal text-slate-400">(mín: {p.minStock})</span>
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-right">
                      <span className="text-[10px] text-slate-400 font-medium block">Valor em Estoque</span>
                      <span className="font-black text-sm text-emerald-600">
                        R$ {totalVal.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProd(p);
                      setStockInput(p.currentStock);
                    }}
                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Ajustar Saldo Físico</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Desktop Table Layout (>= 768px) */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Foto</th>
                    <th className="p-4">Produto</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4 text-center">Estoque Atual</th>
                    <th className="p-4 text-center">Estoque Mínimo</th>
                    <th className="p-4 text-right">Custo Unit.</th>
                    <th className="p-4 text-right">Valor em Estoque</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p) => {
                    const isLow = p.currentStock <= p.minStock;
                    const totalVal = p.currentStock * p.estimatedCost;

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                          isLow ? 'bg-rose-50/20 dark:bg-rose-950/30' : ''
                        }`}
                      >
                        <td className="p-4">
                          <div
                            onClick={() => {
                              if (p.imageUrl) {
                                setZoomImage({ url: p.imageUrl, title: p.name });
                              }
                            }}
                            className={`w-10 h-10 rounded-xl bg-indigo-100/80 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden border border-slate-200 ${
                              p.imageUrl ? 'cursor-zoom-in hover:scale-105 transition-transform' : ''
                            }`}
                            title={p.imageUrl ? 'Clique para ver foto em tela cheia' : undefined}
                          >
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>3D</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-900">{p.name}</td>
                        <td className="p-4 font-mono text-slate-600">{p.sku}</td>
                        <td className="p-4 text-center font-extrabold text-slate-900">{p.currentStock} un</td>
                        <td className="p-4 text-center text-slate-500">{p.minStock} un</td>
                        <td className="p-4 text-right text-slate-700">
                          R$ {p.estimatedCost.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="p-4 text-right font-bold text-emerald-600">
                          R$ {totalVal.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="p-4">
                          {isLow ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-fit">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Estoque baixo
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProd(p);
                              setStockInput(p.currentStock);
                            }}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" /> Ajustar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Stock Edit Modal */}
      {editingProd && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full space-y-4 border border-slate-300 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-indigo-600" />
              Ajustar Saldo Físico
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Produto: <strong className="text-slate-900">{editingProd.name}</strong>
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Novo Saldo de Prateleira</label>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setStockInput(Math.max(0, stockInput - 1))}
                  className="w-10 h-10 bg-white border border-slate-200 hover:bg-slate-100 active:scale-95 rounded-xl font-black text-slate-800 text-base shadow-2xs cursor-pointer select-none"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  value={stockInput}
                  onChange={(e) => setStockInput(Math.max(0, Number(e.target.value)))}
                  className="w-24 px-3 py-2 border border-slate-200 rounded-xl font-black text-center text-xl bg-white text-slate-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setStockInput(stockInput + 1)}
                  className="w-10 h-10 bg-white border border-slate-200 hover:bg-slate-100 active:scale-95 rounded-xl font-black text-slate-800 text-base shadow-2xs cursor-pointer select-none"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingProd(null)}
                className="px-3.5 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateStock(editingProd.id, stockInput);
                  setEditingProd(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
              >
                Salvar Saldo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Inventory */}
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
