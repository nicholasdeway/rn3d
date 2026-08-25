import React, { useState } from 'react';
import { Visit, Client } from '../types';
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
  X,
  CalendarPlus,
} from 'lucide-react';

interface VisitsViewProps {
  visits: Visit[];
  clients?: Client[];
  onStartVisit: (clientId: string) => void;
  onScheduleVisit?: (data: { clientId: string; scheduledDate: string; timeSlot?: string; reason?: string }) => void;
}

export const VisitsView: React.FC<VisitsViewProps> = ({
  visits,
  clients = [],
  onStartVisit,
  onScheduleVisit,
}) => {
  const [filter, setFilter] = useState<'Todas' | 'Hoje' | 'Atrasadas' | 'Próximas' | 'Concluídas'>('Todas');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>(() => {
    const saved = localStorage.getItem('rn3d_visits_view_mode');
    if (saved === 'grid' || saved === 'list' || saved === 'calendar') return saved;
    return 'grid';
  });

  React.useEffect(() => {
    localStorage.setItem('rn3d_visits_view_mode', viewMode);
  }, [viewMode]);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSelectClientModalOpen, setIsSelectClientModalOpen] = useState(false);

  // Form State
  const [scheduleClientId, setScheduleClientId] = useState(clients[0]?.id || '');
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleTime, setScheduleTime] = useState('14:00');
  const [scheduleReason, setScheduleReason] = useState('Conferência e reposição de estoque 3D');

  const filteredVisits = visits.filter((v) => {
    if (filter === 'Hoje') return v.status === 'Hoje';
    if (filter === 'Atrasadas') return v.status === 'Atrasada';
    if (filter === 'Próximas') return v.status === 'Em breve';
    if (filter === 'Concluídas') return v.status === 'Concluída';
    return true;
  });

  const handleOpenScheduleModal = () => {
    if (clients.length > 0 && !scheduleClientId) {
      setScheduleClientId(clients[0].id);
    }
    setIsScheduleModalOpen(true);
  };

  const handleConfirmSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleClientId) return;

    if (onScheduleVisit) {
      onScheduleVisit({
        clientId: scheduleClientId,
        scheduledDate: scheduleDate,
        timeSlot: scheduleTime,
        reason: scheduleReason,
      });
    }

    setIsScheduleModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#12151c] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
            Agenda de Visitas e Conferências
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Programe e execute visitas presenciais nos pontos de venda em consignação.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full sm:w-auto shrink-0">
          <button
            onClick={handleOpenScheduleModal}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Agendar Nova Visita</span>
          </button>
          <button
            onClick={() => setIsSelectClientModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <MapPin className="w-4 h-4" />
            <span>Iniciar Visita Presencial</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Toggle */}
      <div className="bg-white dark:bg-[#12151c] p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {['Todas', 'Hoje', 'Atrasadas', 'Próximas', 'Concluídas'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                filter === tab
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-[#181c26] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center sm:justify-end bg-slate-100 dark:bg-[#181c26] p-1 rounded-xl border border-slate-200 dark:border-[#202531] shrink-0 self-end sm:self-auto w-full sm:w-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex-1 sm:flex-initial py-1.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Visualização em Grid de Cards"
          >
            <Grid className="w-4 h-4" />
            <span className="text-xs">Grid</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 sm:flex-initial py-1.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              viewMode === 'list'
                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Visualização em Lista"
          >
            <List className="w-4 h-4" />
            <span className="text-xs">Lista</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex-1 sm:flex-initial py-1.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              viewMode === 'calendar'
                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Visualização em Agenda / Calendário"
          >
            <Calendar className="w-4 h-4" />
            <span className="text-xs">Agenda</span>
          </button>
        </div>
      </div>

      {/* Grid View Cards */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVisits.map((v) => (
            <div
              key={v.id}
              className="bg-white dark:bg-[#12151c] rounded-2xl border border-slate-200/80 dark:border-[#202531] p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 block">{v.id}</span>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{v.clientName}</h3>
                  </div>
                  {v.status === 'Hoje' && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80 shrink-0">
                      Hoje às {v.timeSlot || '14:00'}
                    </span>
                  )}
                  {v.status === 'Atrasada' && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800/80 shrink-0">
                      Atrasada
                    </span>
                  )}
                  {v.status === 'Em breve' && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 shrink-0">
                      Em breve
                    </span>
                  )}
                  {v.status === 'Concluída' && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                      Concluída
                    </span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-[#181c26] rounded-xl space-y-1.5 text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-[#202531]">
                  <p>
                    <strong>Motivo:</strong> {v.reason}
                  </p>
                  <p>
                    <strong>Produtos no local:</strong> {v.productsOnSite} unidades
                  </p>
                  <p className="text-slate-400 dark:text-slate-500">Última visita: {formatDateBR(v.lastVisitText)}</p>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 dark:border-[#202531] flex items-center justify-end">
                <button
                  onClick={() => onStartVisit(v.clientId)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <MapPin className="w-4 h-4" /> Iniciar Visita
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-[#12151c] rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#181c26] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4 whitespace-nowrap">Código</th>
                  <th className="p-4 whitespace-nowrap">Cliente / Ponto de Venda</th>
                  <th className="p-4 whitespace-nowrap">Motivo / Tipo</th>
                  <th className="p-4 text-center whitespace-nowrap">Produtos no Local</th>
                  <th className="p-4 whitespace-nowrap">Última Visita</th>
                  <th className="p-4 text-center whitespace-nowrap">Status</th>
                  <th className="p-4 text-right whitespace-nowrap">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {filteredVisits.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{v.id}</td>
                    <td className="p-4 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{v.clientName}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">{v.reason}</td>
                    <td className="p-4 text-center font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{v.productsOnSite} un</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDateBR(v.lastVisitText)}</td>
                    <td className="p-4 text-center whitespace-nowrap">
                      {v.status === 'Hoje' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          Hoje às {v.timeSlot || '14:00'}
                        </span>
                      )}
                      {v.status === 'Atrasada' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          Atrasada
                        </span>
                      )}
                      {v.status === 'Em breve' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          Em breve
                        </span>
                      )}
                      {v.status === 'Concluída' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          Concluída
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onStartVisit(v.clientId)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5" /> Iniciar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white dark:bg-[#12151c] p-6 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#202531] pb-3">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Cronograma de Visitas e Conferências Programadas
            </h3>
            <span className="text-xs font-bold text-slate-400">{filteredVisits.length} agendamentos</span>
          </div>

          <div className="space-y-3">
            {filteredVisits.map((v) => (
              <div
                key={v.id}
                className="p-4 bg-slate-50 dark:bg-[#181c26] rounded-xl border border-slate-200/80 dark:border-[#202531] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold text-xs shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{v.clientName}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Motivo: {v.reason} • {v.productsOnSite} peças em consignação
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60 dark:border-[#202531]">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    🕒 {v.timeSlot || '14:00'}
                  </span>
                  <button
                    onClick={() => onStartVisit(v.clientId)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1"
                  >
                    <MapPin className="w-3.5 h-3.5" /> Iniciar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal 1: Agendar Nova Visita */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#12151c] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-[#202531] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 dark:border-[#202531] flex items-center justify-between bg-slate-50 dark:bg-[#181c26]">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Agendar Nova Visita ao Cliente
              </h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSchedule} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cliente / Ponto de Venda *
                </label>
                <select
                  value={scheduleClientId}
                  onChange={(e) => setScheduleClientId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800"
                  required
                >
                  {clients.map((cli) => (
                    <option key={cli.id} value={cli.id}>
                      {cli.name} ({cli.city} - {cli.state})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data da Visita *
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Horário Estimado
                  </label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo / Observação Comercial
                </label>
                <input
                  type="text"
                  value={scheduleReason}
                  onChange={(e) => setScheduleReason(e.target.value)}
                  placeholder="Ex: Reposição de expositor, novos modelos 3D, entrega..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#202531] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <CalendarPlus className="w-4 h-4" />
                  Salvar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Selecionar Cliente para Iniciar Visita */}
      {isSelectClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#12151c] w-full max-w-md rounded-2xl border border-slate-200 dark:border-[#202531] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 dark:border-[#202531] flex items-center justify-between bg-slate-50 dark:bg-[#181c26]">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Iniciar Visita — Escolha o Cliente
              </h3>
              <button
                onClick={() => setIsSelectClientModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {clients.map((cli) => (
                <button
                  key={cli.id}
                  onClick={() => {
                    setIsSelectClientModalOpen(false);
                    onStartVisit(cli.id);
                  }}
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-left flex items-center justify-between cursor-pointer transition-colors group"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {cli.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {cli.city} - {cli.state} • {cli.productsOnSiteCount} peças no local
                    </p>
                  </div>
                  <MapPin className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
