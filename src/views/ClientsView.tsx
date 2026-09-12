import React, { useState } from 'react';
import { Client } from '../types';
import { formatDateBR } from '../utils/formatters';
import { fetchAddressByCep } from '../services/viaCepService';
import { formatPhone, formatDocument } from '../utils/formatters';
import {
  Users,
  User,
  Plus,
  Search,
  Boxes,
  DollarSign,
  MapPin,
  ArrowRight,
  X,
  Building2,
  Truck,
  Image as ImageIcon,
  Crop,
  Trash2,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { ImageCropperModal } from '../components/ImageCropperModal';
import { ImageLightboxModal } from '../components/ImageLightboxModal';

interface ClientsViewProps {
  clients: Client[];
  onSelectClient: (client: Client) => void;
  onAddClient: (client: Client) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  onSelectClient,
  onAddClient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientModalStep, setClientModalStep] = useState<'selection' | 'form' | null>(null);
  const [clientCategoryMode, setClientCategoryMode] = useState<'b2c' | 'b2b'>('b2b');
  const [croppingImageSrc, setCroppingImageSrc] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);

  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    fantasyName: '',
    avatarUrl: '',
    document: '',
    responsible: '',
    phone: '',
    whatsapp: '',
    email: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    type: 'Consignação',
    agreedPriceLevel: 'Padrão',
    visitFrequency: '15 dias',
    defaultLogisticsType: 'combustivel',
    defaultLogisticsCost: 0,
    notes: '',
  });

  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepStatusMessage, setCepStatusMessage] = useState('');

  const handleCepChange = async (inputCep: string) => {
    const numeric = inputCep.replace(/\D/g, '').slice(0, 8);
    let formatted = numeric;
    if (numeric.length > 5) {
      formatted = `${numeric.slice(0, 5)}-${numeric.slice(5, 8)}`;
    }

    setFormData((prev) => ({ ...prev, cep: formatted }));

    if (numeric.length === 8) {
      setIsSearchingCep(true);
      setCepStatusMessage('Buscando CEP no ViaCEP...');
      const address = await fetchAddressByCep(numeric);
      setIsSearchingCep(false);
      if (address) {
        setFormData((prev) => ({
          ...prev,
          street: address.logradouro || prev.street,
          neighborhood: address.bairro || prev.neighborhood,
          city: address.localidade || prev.city,
          state: address.uf || prev.state,
          complement: address.complemento || prev.complement,
        }));
        setCepStatusMessage('✅ Endereço localizado pelo ViaCEP!');
      } else {
        setCepStatusMessage('⚠️ CEP não encontrado no ViaCEP');
      }
    } else {
      setCepStatusMessage('');
    }
  };

  const activeClientsCount = clients.filter((c) => c.status === 'Ativo').length;
  const totalProductsOnSite = clients.reduce((acc, c) => acc + c.productsOnSiteCount, 0);
  const totalReceivable = clients.reduce((acc, c) => acc + c.receivableBalance, 0);
  const pendingVisitsCount = clients.filter(
    (c) => c.visitStatus === 'Hoje' || c.visitStatus === 'Atrasada'
  ).length;

  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.fantasyName && c.fantasyName.toLowerCase().includes(term)) ||
      c.responsible.toLowerCase().includes(term) ||
      c.city.toLowerCase().includes(term)
    );
  });

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCroppingImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = (croppedBase64: string) => {
    setFormData((prev) => ({ ...prev, avatarUrl: croppedBase64 }));
    setCroppingImageSrc(null);
  };

  const handleSubmitNewClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const nameTrimmed = formData.name.trim();
    const responsibleTrimmed = formData.responsible?.trim() || nameTrimmed;

    const newClient: Client = {
      id: `cli-${Date.now()}`,
      name: nameTrimmed,
      fantasyName: formData.fantasyName?.trim() || nameTrimmed,
      avatarUrl: formData.avatarUrl || '',
      document: formData.document || '',
      responsible: responsibleTrimmed,
      phone: formData.phone || formData.whatsapp || '',
      whatsapp: formData.whatsapp || formData.phone || '',
      email: formData.email || '',
      cep: formData.cep || '',
      street: formData.street || '',
      number: formData.number || '',
      complement: formData.complement || '',
      neighborhood: formData.neighborhood || '',
      city: formData.city || 'Barra de São João',
      state: formData.state || 'RJ',
      type: formData.type || 'Cliente direto',
      agreedPriceLevel: formData.agreedPriceLevel || 'Padrão',
      visitFrequency: formData.visitFrequency || 'Sem visitas',
      defaultLogisticsType: formData.defaultLogisticsType || 'combustivel',
      defaultLogisticsCost: typeof formData.defaultLogisticsCost === 'number' ? formData.defaultLogisticsCost : (Number(formData.defaultLogisticsCost) || 0),
      status: 'Ativo',
      productsOnSiteCount: 0,
      productsValuation: 0,
      receivableBalance: 0,
      lastVisitDate: 'Sem visitas',
      nextVisitDate: (formData.visitFrequency || 'Sem visitas') === 'Sem visitas' ? 'Sem visitas' : 'Em breve',
      visitStatus: (formData.visitFrequency || 'Sem visitas') === 'Sem visitas' ? 'Última visita' : 'Em breve',
      notes: formData.notes || '',
    };

    onAddClient(newClient);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Clientes e Pontos de Venda
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gerencie estabelecimentos parceiros de consignação e clientes diretos.
          </p>
        </div>

        <button
          onClick={() => setClientModalStep('selection')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {/* Top Overview KPI Cards (Definance 2x2 Mobile Layout) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="definance-kpi-card bg-white dark:bg-[#12151c] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs hover:border-indigo-500/40 dark:hover:border-indigo-500/40 cursor-pointer">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
              Clientes Ativos
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
              <Users className="w-4 h-4 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 sm:mt-3 tracking-tight truncate">
            {activeClientsCount} <span className="text-xs sm:text-sm font-bold text-slate-400">parceiros</span>
          </p>
        </div>

        <div className="definance-kpi-card bg-white dark:bg-[#12151c] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs hover:border-purple-500/40 dark:hover:border-purple-500/40 cursor-pointer">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
              Produtos em Clientes
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
              <Boxes className="w-4 h-4 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 sm:mt-3 tracking-tight truncate">
            {totalProductsOnSite} <span className="text-xs sm:text-sm font-bold text-slate-400">un</span>
          </p>
        </div>

        <div className="definance-kpi-card bg-white dark:bg-[#12151c] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs hover:border-emerald-500/40 dark:hover:border-emerald-500/40 cursor-pointer">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
              Total a Receber
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
              <DollarSign className="w-4 h-4 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 sm:mt-3 tracking-tight truncate">
            R$ {totalReceivable.toFixed(2).replace('.', ',')}
          </p>
        </div>

        <div className="definance-kpi-card bg-white dark:bg-[#12151c] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs hover:border-amber-500/40 dark:hover:border-amber-500/40 cursor-pointer">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
              Visitas Pendentes
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
              <MapPin className="w-4 h-4 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-2 sm:mt-3 tracking-tight truncate">
            {pendingVisitsCount} <span className="text-xs sm:text-sm font-bold text-slate-400">pendentes</span>
          </p>
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
            placeholder="Buscar cliente por nome, responsável ou cidade..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Clients Table / Mobile Cards */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">Nenhum cliente cadastrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Cadastre seus pontos de venda parceiros e clientes comerciais.
          </p>
          <button
            onClick={() => setClientModalStep('selection')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
          >
            Cadastrar Primeiro Cliente
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Cards Layout (< 768px) - Eliminates Horizontal Scroll */}
          <div className="block md:hidden space-y-3">
            {filteredClients.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectClient(c)}
                className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 cursor-pointer hover:border-indigo-300 transition-colors"
              >
                {/* Card Header: Avatar, Client Name & Visit Status */}
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div
                      onClick={(e) => {
                        if (c.avatarUrl) {
                          e.stopPropagation();
                          setZoomImage({ url: c.avatarUrl, title: c.name });
                        }
                      }}
                      className={`w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 font-extrabold text-sm flex items-center justify-center shrink-0 border border-indigo-100 overflow-hidden ${
                        c.avatarUrl ? 'cursor-zoom-in hover:scale-105 transition-transform' : ''
                      }`}
                      title={c.avatarUrl ? 'Clique para ver foto em tela cheia' : undefined}
                    >
                      {c.avatarUrl ? (
                        <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{c.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">{c.name}</h4>
                      <p className="text-[11px] text-slate-400 font-medium">{c.type}</p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {c.visitStatus === 'Hoje' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Visitar hoje
                      </span>
                    )}
                    {c.visitStatus === 'Atrasada' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        Atrasada
                      </span>
                    )}
                    {c.visitStatus === 'Em breve' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Em breve
                      </span>
                    )}
                    {(c.visitStatus === 'Última visita' || c.visitStatus === 'Concluída' || (!c.visitStatus && c.lastVisitDate)) && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        Última visita {c.lastVisitDate && c.lastVisitDate !== 'Sem visitas' && c.lastVisitDate !== 'N/A' ? `(${formatDateBR(c.lastVisitDate)})` : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body: Details & Receivable Balance */}
                <div className="flex items-start justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <p className="text-slate-600">
                      <span className="font-semibold text-slate-700">Resp:</span> {c.responsible}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      {c.city ? `${c.city} - ${c.state}` : 'Sem localização'} • {c.productsOnSiteCount} un no local
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Próxima visita: <span className="font-semibold text-slate-700">{formatDateBR(c.nextVisitDate)}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 font-medium block">A Receber</span>
                    <span className="font-black text-emerald-600 text-base">
                      R$ {c.receivableBalance.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectClient(c);
                    }}
                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-colors"
                  >
                    <span>Ver Perfil Completo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Layout (>= 768px) */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Responsável</th>
                    <th className="p-4">Cidade</th>
                    <th className="p-4 text-center">Produtos no Local</th>
                    <th className="p-4 text-right">A Receber</th>
                    <th className="p-4">Última Visita</th>
                    <th className="p-4">Próxima Visita</th>
                    <th className="p-4">Status Visita</th>
                    <th className="p-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClients.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => onSelectClient(c)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                    >
                      <td className="p-4 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={(e) => {
                              if (c.avatarUrl) {
                                e.stopPropagation();
                                setZoomImage({ url: c.avatarUrl, title: c.name });
                              }
                            }}
                            className={`w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-100 overflow-hidden ${
                              c.avatarUrl ? 'cursor-zoom-in hover:scale-105 transition-transform' : ''
                            }`}
                            title={c.avatarUrl ? 'Clique para ver foto em tela cheia' : undefined}
                          >
                            {c.avatarUrl ? (
                              <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{c.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {c.name}
                            </p>
                            <p className="text-[11px] text-slate-400 font-normal">{c.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-700">{c.responsible}</td>
                      <td className="p-4 text-slate-600">
                        {c.city} - {c.state}
                      </td>
                      <td className="p-4 text-center font-bold text-slate-800">
                        {c.productsOnSiteCount} un
                      </td>
                      <td className="p-4 text-right font-bold text-emerald-600">
                        R$ {c.receivableBalance.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="p-4 text-slate-500">{formatDateBR(c.lastVisitDate)}</td>
                      <td className="p-4 text-slate-700 font-medium">{formatDateBR(c.nextVisitDate)}</td>
                      <td className="p-4">
                        {c.visitStatus === 'Hoje' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Visitar hoje
                          </span>
                        )}
                        {c.visitStatus === 'Atrasada' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            Atrasada
                          </span>
                        )}
                        {c.visitStatus === 'Em breve' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Em breve
                          </span>
                        )}
                        {(c.visitStatus === 'Última visita' || c.visitStatus === 'Concluída' || (!c.visitStatus && c.lastVisitDate)) && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            Última visita {c.lastVisitDate && c.lastVisitDate !== 'Sem visitas' && c.lastVisitDate !== 'N/A' ? `(${formatDateBR(c.lastVisitDate)})` : ''}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectClient(c);
                          }}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-semibold transition-colors flex items-center gap-1 ml-auto"
                        >
                          Perfil <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* MODAL ETAPA 1: POPUP DE ESCOLHA DA CATEGORIA (CLIENTE FINAL OU EMPRESA) */}
      {clientModalStep === 'selection' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#12151c] w-full max-w-lg rounded-3xl border border-slate-200 dark:border-[#202531] p-6 sm:p-7 space-y-6 animate-in fade-in zoom-in-95 duration-150 relative">
            <button
              type="button"
              onClick={() => setClientModalStep(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-900/50">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Qual tipo de cliente você deseja cadastrar?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Selecione o perfil para exibir os campos sob medida.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3.5 pt-1">
              {/* OPÇÃO 1: CLIENTE FINAL / PESSOA FÍSICA (B2C) */}
              <button
                type="button"
                onClick={() => {
                  setClientCategoryMode('b2c');
                  setFormData({
                    name: '',
                    responsible: '',
                    whatsapp: '',
                    phone: '',
                    email: '',
                    document: '',
                    avatarUrl: '',
                    type: 'Cliente direto',
                    visitFrequency: 'Sem visitas',
                    city: 'Barra de São João',
                    state: 'RJ',
                    agreedPriceLevel: 'Padrão',
                    defaultLogisticsType: 'combustivel',
                    defaultLogisticsCost: 0,
                    notes: '',
                  });
                  setClientModalStep('form');
                }}
                className="p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-[#181c26] hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 text-left transition-all duration-200 group flex items-start gap-4 cursor-pointer active:scale-[0.99]"
              >
                <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
                  <User className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      👤 Cliente Final / Pessoa Física
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Rápido (B2C)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Para vendas diretas, amigos ou consumidores finais. Apenas <b>Nome</b> e <b>Telefone/WhatsApp</b> obrigatórios. Sem exigência de CNPJ, endereço ou visitas periódicas.
                  </p>
                </div>
              </button>

              {/* OPÇÃO 2: EMPRESA / PONTO DE VENDA / PARCEIRO (B2B) */}
              <button
                type="button"
                onClick={() => {
                  setClientCategoryMode('b2b');
                  setFormData({
                    name: '',
                    fantasyName: '',
                    avatarUrl: '',
                    document: '',
                    responsible: '',
                    phone: '',
                    whatsapp: '',
                    email: '',
                    cep: '',
                    street: '',
                    number: '',
                    complement: '',
                    neighborhood: '',
                    city: '',
                    state: '',
                    type: 'Consignação',
                    agreedPriceLevel: 'Padrão',
                    visitFrequency: '15 dias',
                    defaultLogisticsType: 'combustivel',
                    defaultLogisticsCost: 0,
                    notes: '',
                  });
                  setClientModalStep('form');
                }}
                className="p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-[#181c26] hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 text-left transition-all duration-200 group flex items-start gap-4 cursor-pointer active:scale-[0.99]"
              >
                <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-110 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      🏢 Empresa / Ponto de Venda / Parceiro
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      Completo (B2B)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Para lojas, adegas, pontos de consignação ou revendedores. Cadastro completo com CNPJ, Responsável, Endereço ViaCEP, Frequência de Visita e Logística.
                  </p>
                </div>
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setClientModalStep(null)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ETAPA 2: FORMULÁRIO PERSONALIZADO DE ACORDO COM O TIPO */}
      {clientModalStep === 'form' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className={`bg-white dark:bg-[#12151c] w-full ${clientCategoryMode === 'b2c' ? 'max-w-xl' : 'max-w-3xl'} rounded-2xl border border-slate-300 dark:border-[#202531] overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150`}>
            {/* Header */}
            <div className={`p-5 border-b border-slate-100 dark:border-[#202531] flex items-center justify-between ${clientCategoryMode === 'b2c' ? 'bg-emerald-50/80 dark:bg-emerald-950/40' : 'bg-slate-50 dark:bg-[#181c26]'}`}>
              <div className="flex items-center gap-2">
                {clientCategoryMode === 'b2c' ? (
                  <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                )}
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                    {clientCategoryMode === 'b2c' ? 'Cadastrar Cliente Final (Pessoa Física)' : 'Cadastrar Empresa / Ponto de Venda / Parceiro'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {clientCategoryMode === 'b2c' ? 'Venda direta sem exigência de endereço ou visitas' : 'Cadastro comercial completo'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setClientCategoryMode(clientCategoryMode === 'b2c' ? 'b2b' : 'b2c')}
                  className="text-[11px] font-bold px-2.5 py-1 bg-white dark:bg-[#12151c] text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg cursor-pointer transition-colors shadow-2xs"
                  title="Alternar modo de cadastro"
                >
                  {clientCategoryMode === 'b2c' ? 'Mudar para Empresa 🏢' : 'Mudar para Cliente Final 👤'}
                </button>
                <button
                  type="button"
                  onClick={() => setClientModalStep(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Form Content */}
            {clientCategoryMode === 'b2c' ? (
              /* FORMULÁRIO B2C SIMPLIFICADO */
              <form onSubmit={handleSubmitNewClient} className="p-6 overflow-y-auto space-y-5 text-xs">
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl space-y-4">
                  <h4 className="font-bold text-emerald-950 dark:text-emerald-300 text-xs flex items-center gap-1.5 border-b border-emerald-200/80 dark:border-emerald-900/40 pb-2">
                    <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Dados Básicos do Cliente Final
                  </h4>

                  {/* Foto / Avatar */}
                  <div className="space-y-2 p-3 bg-white dark:bg-[#181c26] rounded-xl border border-slate-200 dark:border-[#282e3d]">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-slate-900 dark:text-slate-100">Foto do Cliente (Opcional)</label>
                      {formData.avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, avatarUrl: '' })}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer hover:underline"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remover Foto
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-xs relative">
                        {formData.avatarUrl ? (
                          <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-1.5 w-fit cursor-pointer shadow-xs">
                          <Crop className="w-4 h-4" />
                          {formData.avatarUrl ? 'Substituir Foto' : 'Selecionar Foto'}
                          <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block font-bold text-slate-900 dark:text-slate-200 mb-1">Nome Completo do Cliente *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Mariana Souza"
                        className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#181c26] font-bold text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-900 dark:text-slate-200 mb-1">Telefone / WhatsApp *</label>
                      <input
                        type="text"
                        required
                        value={formData.whatsapp}
                        onChange={(e) => {
                          const formatted = formatPhone(e.target.value);
                          setFormData({ ...formData, whatsapp: formatted, phone: formatted });
                        }}
                        placeholder="(22) 99754-0815"
                        className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#181c26] font-bold text-slate-900 dark:text-slate-100 font-mono text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">CPF (Opcional)</label>
                        <input
                          type="text"
                          value={formData.document}
                          onChange={(e) => setFormData({ ...formData, document: formatDocument(e.target.value) })}
                          placeholder="000.000.000-00"
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#181c26] text-slate-900 dark:text-slate-100 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">E-mail (Opcional)</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="mariana@email.com"
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#181c26] text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Observações / Notas Internas (Opcional)</label>
                      <textarea
                        rows={2}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Ex: Amiga de faculdade, cliente avulso..."
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#181c26] text-slate-900 dark:text-slate-100 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setClientModalStep('selection')}
                    className="px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                  >
                    ← Voltar à Escolha
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <User className="w-4 h-4" />
                    <span>Cadastrar Cliente Final</span>
                  </button>
                </div>
              </form>
            ) : (
              /* FORMULÁRIO B2B EMPRESA COMPLETO */
              <form onSubmit={handleSubmitNewClient} className="p-6 overflow-y-auto space-y-5 text-xs">
                {/* Section 1: Main Identification & Avatar */}
                <div className="p-4 bg-slate-50 dark:bg-[#181c26] border border-slate-200/80 dark:border-[#282e3d] rounded-2xl space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5 border-b border-slate-200/80 dark:border-slate-800 pb-2">
                    <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Dados do Estabelecimento / Parceiro
                  </h4>

                  {/* Avatar / Foto do Cliente */}
                  <div className="space-y-2 p-3.5 bg-white dark:bg-[#12151c] rounded-xl border border-slate-200 dark:border-[#282e3d]">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-slate-900 dark:text-slate-100">Logo / Foto do Cliente (Avatar)</label>
                      {formData.avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, avatarUrl: '' })}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer hover:underline"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remover Foto
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-xs relative">
                        {formData.avatarUrl ? (
                          <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-7 h-7 text-slate-400" />
                        )}
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap gap-2">
                          <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center gap-1.5 w-fit cursor-pointer shadow-xs">
                            <Crop className="w-4 h-4" />
                            {formData.avatarUrl ? 'Substituir / Recortar Foto' : 'Selecionar e Recortar Foto'}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageFileChange}
                              className="hidden"
                            />
                          </label>
                          {formData.avatarUrl && (
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, avatarUrl: '' })}
                              className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-400 rounded-xl font-semibold flex items-center gap-1 cursor-pointer border border-rose-200 dark:border-rose-900/50"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Excluir
                            </button>
                          )}
                        </div>
                        <input
                          type="url"
                          value={formData.avatarUrl || ''}
                          onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                          placeholder="Ou cole a URL da imagem (https://...)"
                          className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#181c26] text-slate-900 dark:text-slate-100 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Razão Social / Nome Oficial *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Adega Imperial Ltda"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#12151c] font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome Fantasia / Nome Popular</label>
                      <input
                        type="text"
                        value={formData.fantasyName}
                        onChange={(e) => setFormData({ ...formData, fantasyName: e.target.value })}
                        placeholder="Ex: Adega Imperial"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#12151c] font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">CNPJ / CPF</label>
                      <input
                        type="text"
                        value={formData.document}
                        onChange={(e) => setFormData({ ...formData, document: formatDocument(e.target.value) })}
                        placeholder="00.000.000/0001-00"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#12151c] font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome do Responsável *</label>
                      <input
                        type="text"
                        required
                        value={formData.responsible}
                        onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                        placeholder="Ex: Carlos Henrique"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#12151c] font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Telefone / WhatsApp *</label>
                      <input
                        type="text"
                        required
                        value={formData.whatsapp}
                        onChange={(e) => {
                          const formatted = formatPhone(e.target.value);
                          setFormData({ ...formData, whatsapp: formatted, phone: formatted });
                        }}
                        placeholder="(22) 99754-0815"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#12151c] font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">E-mail de Contato</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contato@empresa.com"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#12151c] font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Address & Location (Optional / Non-Mandatory) */}
                <div className="p-4 bg-slate-50 dark:bg-[#181c26] border border-slate-200/80 dark:border-[#282e3d] rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Endereço & Localização (Opcional)
                    </h4>
                    {cepStatusMessage && (
                      <span className={`text-[11px] font-bold flex items-center gap-1 ${
                        isSearchingCep ? 'text-indigo-600 dark:text-indigo-400 animate-pulse' : cepStatusMessage.includes('✅') ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {isSearchingCep && <Loader2 className="w-3 h-3 animate-spin" />}
                        {cepStatusMessage}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>CEP (Busca ViaCEP)</span>
                        <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.cep}
                          onChange={(e) => handleCepChange(e.target.value)}
                          placeholder="26200-000"
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#12151c] font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs font-bold"
                        />
                        {isSearchingCep && (
                          <div className="absolute right-2.5 top-2.5">
                            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Cidade</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Casimiro de Abreu"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#12151c] font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Estado (UF)</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="RJ"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#12151c] uppercase font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Rua / Logradouro</label>
                      <input
                        type="text"
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        placeholder="Av. Amaral Peixoto"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#12151c] font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Número</label>
                      <input
                        type="text"
                        value={formData.number}
                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                        placeholder="131"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#12151c] font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Bairro</label>
                      <input
                        type="text"
                        value={formData.neighborhood}
                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                        placeholder="Centro"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#12151c] font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Complemento / Ponto de Referência</label>
                      <input
                        type="text"
                        value={formData.complement}
                        onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                        placeholder="Loja 02 (ao lado do posto)"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#12151c] font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Commercial Terms */}
                <div className="p-4 bg-slate-50 dark:bg-[#181c26] border border-slate-200/80 dark:border-[#282e3d] rounded-2xl space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs border-b border-slate-200/80 dark:border-slate-800 pb-2">
                    Informações Comerciais & Visitas
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipo de Cliente / Modalidade</label>
                      <select
                        value={formData.type}
                        onChange={(e) => {
                          const newType = e.target.value as any;
                          setFormData((prev) => ({
                            ...prev,
                            type: newType,
                            visitFrequency: newType === 'Cliente direto' ? 'Sem visitas' : prev.visitFrequency === 'Sem visitas' ? '15 dias' : prev.visitFrequency,
                          }));
                        }}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#12151c] font-bold text-slate-900 dark:text-slate-100"
                      >
                        <option value="Consignação">🤝 Consignação (Acerto Periódico)</option>
                        <option value="Revendedor">🏬 Revendedor / Lojista</option>
                        <option value="Cliente direto">👤 Cliente Direto / Final (B2C)</option>
                        <option value="Outro">🌐 Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Periodicidade de Visita</label>
                      <select
                        value={formData.visitFrequency}
                        onChange={(e) => setFormData({ ...formData, visitFrequency: e.target.value as any })}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#12151c] font-bold text-slate-900 dark:text-slate-100"
                      >
                        <option value="15 dias">15 dias (Quinzenal)</option>
                        <option value="7 dias">7 dias (Semanal)</option>
                        <option value="30 dias">30 dias (Mensal)</option>
                        <option value="Personalizado">Personalizado</option>
                        <option value="Sem visitas">🚫 Sem visitas periódicas</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 4: Logistics Memory */}
                <div className="p-4 bg-slate-50 dark:bg-[#181c26] border border-slate-200/80 dark:border-[#282e3d] rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Logística e Deslocamento Padrão
                    </h4>
                    <span className="text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full text-[10px] lowercase font-semibold border border-amber-200/50 dark:border-amber-800/50">
                      🔒 Uso Interno Oficina
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Modalidade Padrão de Entrega</label>
                      <select
                        value={formData.defaultLogisticsType || 'combustivel'}
                        onChange={(e) => setFormData({ ...formData, defaultLogisticsType: e.target.value as any })}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#12151c] font-bold text-slate-900 dark:text-slate-100"
                      >
                        <option value="combustivel">⛽ Combustível (Deslocamento Próprio)</option>
                        <option value="frete">🚚 Frete / Motoboy / Terceirizado</option>
                        <option value="retirada">🚗 Sem Custo (Retirada na Oficina)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Custo Padrão de Transporte (R$)</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={formData.defaultLogisticsCost === '' || formData.defaultLogisticsCost === undefined || formData.defaultLogisticsCost === null ? '' : formData.defaultLogisticsCost}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({
                            ...formData,
                            defaultLogisticsCost: val === '' ? ('' as any) : Number(val),
                          });
                        }}
                        placeholder="Ex: 50.00"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#12151c] font-black text-rose-600 dark:text-rose-400 placeholder-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={() => setClientModalStep('selection')}
                    className="order-2 sm:order-1 px-3.5 py-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl font-semibold text-xs transition-colors cursor-pointer text-center"
                  >
                    ← Voltar à Escolha
                  </button>
                  <button
                    type="submit"
                    className="order-1 sm:order-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar Empresa / Parceiro</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Image Cropper Modal for Client Avatar */}
      {croppingImageSrc && (
        <ImageCropperModal
          imageSrc={croppingImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => setCroppingImageSrc(null)}
        />
      )}

      {/* Lightbox Zoom Modal for Client Avatar */}
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
