import React, { useState } from 'react';
import { Visit } from '../types';
import { formatDateBR } from '../utils/formatters';
import {
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  List,
  Grid,
} from 'lucide-react';

interface VisitsViewProps {
  visits: Visit[];
  onStartVisit: (clientId: string) => void;
}

export const VisitsView: React.FC<VisitsViewProps> = ({ visits, onStartVisit }) => {
  const [filter, setFilter] = useState<'Todas' | 'Hoje' | 'Atrasadas' | 'Próximas' | 'Concluídas'>('Todas');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const filteredVisits = visits.filter((v) => {
    if (filter === 'Hoje') return v.status === 'Hoje';
    if (filter === 'Atrasadas') return v.status === 'Atrasada';
    if (filter === 'Próximas') return v.status === 'Em breve';
    if (filter === 'Concluídas') return v.status === 'Concluída';
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-indigo-600" />
            Agenda de Visitas e Conferências
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Programe e execute visitas presenciais nos pontos de venda em consignação.
          </p>
        </div>

        <button
          onClick={() => {
            if (visits.length > 0 && visits[0].clientId) {
              onStartVisit(visits[0].clientId);
            } else {
              alert('Nenhuma visita agendada no momento. Cadastre ou selecione um cliente.');
            }
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <MapPin className="w-4 h-4" />
          Iniciar Visita Presencial
        </button>
      </div>

      {/* Filter Tabs & Toggle */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {['Todas', 'Hoje', 'Atrasadas', 'Próximas', 'Concluídas'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filter === tab
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Visualização em Lista"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'calendar'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Visualização em Calendário"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List View Cards */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVisits.map((v) => (
            <div
              key={v.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 block">{v.id}</span>
                    <h3 className="font-bold text-slate-900 text-base">{v.clientName}</h3>
                  </div>
                  {v.status === 'Hoje' && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Hoje às {v.timeSlot || '14:00'}
                    </span>
                  )}
                  {v.status === 'Atrasada' && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                      Atrasada
                    </span>
                  )}
                  {v.status === 'Em breve' && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      Em breve
                    </span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                  <p>
                    <strong>Motivo:</strong> {v.reason}
                  </p>
                  <p>
                    <strong>Produtos no local:</strong> {v.productsOnSite} unidades
                  </p>
                  <p className="text-slate-400">Última visita: {formatDateBR(v.lastVisitText)}</p>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => onStartVisit(v.clientId)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Iniciar Visita
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calendar View Placeholder */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-500 space-y-3">
          <Calendar className="w-10 h-10 text-indigo-500 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">Visão de Calendário Mensal</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Todas as visitas estão organizadas na grade mensal com lembretes quinzenais de atendimento.
          </p>
        </div>
      )}
    </div>
  );
};
