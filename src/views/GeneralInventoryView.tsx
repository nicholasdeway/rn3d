import React, { useState } from 'react';
import { Product } from '../types';
import { Warehouse, AlertTriangle, Search, Plus, Edit2 } from 'lucide-react';

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
            Controle de saldo físico em prateleira e valoração de insumos/produtos.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 font-medium block">Produtos Cadastrados</span>
          <span className="text-xl font-bold text-slate-900">{totalRegistered} itens</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 font-medium block">Estoque Total Físico</span>
          <span className="text-xl font-bold text-slate-900">{totalStockUnits} unidades</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 font-medium block">Valor de Custo em Estoque</span>
          <span className="text-xl font-bold text-emerald-600">
            R$ {totalCostValuation.toFixed(2)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 font-medium block">Estoque Baixo</span>
          <span className="text-xl font-bold text-rose-600">{lowStockCount} alertas</span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome do produto ou SKU..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
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
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isLow ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    <td className="p-4 font-bold text-slate-900">{p.name}</td>
                    <td className="p-4 font-mono text-slate-600">{p.sku}</td>
                    <td className="p-4 text-center font-extrabold text-slate-900">{p.currentStock} un</td>
                    <td className="p-4 text-center text-slate-500">{p.minStock} un</td>
                    <td className="p-4 text-right text-slate-700">R$ {p.estimatedCost.toFixed(2)}</td>
                    <td className="p-4 text-right font-bold text-slate-900">
                      R$ {totalVal.toFixed(2)}
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
                        onClick={() => {
                          setEditingProd(p);
                          setStockInput(p.currentStock);
                        }}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-semibold inline-flex items-center gap-1"
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

      {/* Stock Edit Modal */}
      {editingProd && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop- flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Ajustar Saldo — {editingProd.name}</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Novo Saldo de Estoque</label>
              <input
                type="number"
                value={stockInput}
                onChange={(e) => setStockInput(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-center text-lg"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingProd(null)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onUpdateStock(editingProd.id, stockInput);
                  setEditingProd(null);
                }}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold"
              >
                Salvar Saldo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
