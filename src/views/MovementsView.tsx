import React, { useState } from 'react';
import { InventoryMovement } from '../types';
import { History, Search } from 'lucide-react';
import { formatDateBR } from '../utils/formatters';

interface MovementsViewProps {
  movements: InventoryMovement[];
}

export const MovementsView: React.FC<MovementsViewProps> = ({ movements }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos');

  const filtered = movements.filter((m) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      m.productName.toLowerCase().includes(term) ||
      (m.clientName && m.clientName.toLowerCase().includes(term)) ||
      (m.referenceCode && m.referenceCode.toLowerCase().includes(term));
    const matchType = typeFilter === 'Todos' || m.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-600" />
            Extrato de Movimentações de Estoque
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Histórico estilo extrato bancário com auditoria completa de entradas, saídas e trocas.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por produto, cliente ou código..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
        >
          <option value="Todos">Tipo: Todos</option>
          <option value="Venda">Venda</option>
          <option value="Reposição">Reposição</option>
          <option value="Retirada">Retirada</option>
          <option value="Consignação">Consignação</option>
          <option value="Produção">Produção</option>
        </select>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">Data e Hora</th>
                <th className="p-4">Produto</th>
                <th className="p-4 text-center">Movimentação</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Cliente / Origem</th>
                <th className="p-4">Referência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((m) => {
                const isPositive = m.quantityDelta > 0;
                return (
                  <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="p-4 font-medium text-slate-500 dark:text-slate-400">{formatDateBR(m.timestamp)}</td>
                    <td className="p-4 font-bold text-slate-900 dark:text-slate-100">{m.productName}</td>
                    <td className="p-4 text-center">
                      <span
                        className={`font-black text-sm px-2.5 py-0.5 rounded-md ${
                          isPositive
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isPositive ? `+${m.quantityDelta}` : `${m.quantityDelta}`} un
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                        {m.type}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-700">{m.clientName || 'Oficina RN 3D'}</td>
                    <td className="p-4 font-mono font-semibold text-slate-500">
                      {m.referenceCode || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
