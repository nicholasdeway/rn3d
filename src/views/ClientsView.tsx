import React, { useState } from 'react';
import { Client } from '../types';
import {
  Users,
  Plus,
  Search,
  Boxes,
  DollarSign,
  MapPin,
  ArrowRight,
  X,
  Building2,
  Truck,
} from 'lucide-react';

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

  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    fantasyName: '',
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
    defaultLogisticsCost: 50.0,
    notes: '',
  });

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

  const handleSubmitNewClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.responsible) return;

    const newClient: Client = {
      id: `cli-${Date.now()}`,
      name: formData.name || 'Novo Cliente',
      fantasyName: formData.fantasyName || formData.name || '',
      document: formData.document || '',
      responsible: formData.responsible || 'Responsável',
      phone: formData.phone || '',
      whatsapp: formData.whatsapp || '',
      email: formData.email || '',
      cep: formData.cep || '26200-000',
      street: formData.street || 'Rua Principal',
      number: formData.number || '100',
      complement: formData.complement || '',
      neighborhood: formData.neighborhood || 'Centro',
      city: formData.city || 'Barra de São João',
      state: formData.state || 'RJ',
      type: formData.type || 'Consignação',
      agreedPriceLevel: formData.agreedPriceLevel || 'Padrão',
      visitFrequency: formData.visitFrequency || '15 dias',
      status: 'Ativo',
      productsOnSiteCount: 0,
      productsValuation: 0,
      receivableBalance: 0,
      lastVisitDate: 'Sem visitas',
      nextVisitDate: 'Em breve',
      visitStatus: 'Em breve',
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
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {/* Top Overview KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Clientes Ativos</span>
            <span className="text-lg font-bold text-slate-900">{activeClientsCount} parceiros</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Produtos em Clientes</span>
            <span className="text-lg font-bold text-slate-900">{totalProductsOnSite} un</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Total a Receber</span>
            <span className="text-lg font-bold text-emerald-600">
              R$ {totalReceivable.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Visitas Pendentes</span>
            <span className="text-lg font-bold text-amber-600">{pendingVisitsCount} pendentes</span>
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
            placeholder="Buscar cliente por nome, responsável ou cidade..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
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
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="p-4 font-bold text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {c.name.charAt(0)}
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
                    R$ {c.receivableBalance.toFixed(2)}
                  </td>
                  <td className="p-4 text-slate-500">{c.lastVisitDate}</td>
                  <td className="p-4 text-slate-700 font-medium">{c.nextVisitDate}</td>
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

      {/* Modal Cadastrar Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl border border-slate-300 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Cadastrar Novo Cliente / Ponto de Venda
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <form onSubmit={handleSubmitNewClient} className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Section 1: Main Identification */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-200/80 pb-2">
                  <Building2 className="w-4 h-4 text-indigo-600" /> Dados do Estabelecimento / Parceiro
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Razão Social / Nome Oficial *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Adega Imperial Ltda"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-slate-900 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nome Fantasia / Nome Popular</label>
                    <input
                      type="text"
                      value={formData.fantasyName}
                      onChange={(e) => setFormData({ ...formData, fantasyName: e.target.value })}
                      placeholder="Ex: Adega Imperial"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">CPF / CNPJ</label>
                    <input
                      type="text"
                      value={formData.document}
                      onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                      placeholder="00.000.000/0001-00"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nome do Responsável *</label>
                    <input
                      type="text"
                      required
                      value={formData.responsible}
                      onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                      placeholder="Ex: Carlos Henrique"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-slate-900 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="(22) 99876-5432"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">E-mail de Contato</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contato@empresa.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Address & Location */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-200/80 pb-2">
                  <MapPin className="w-4 h-4 text-indigo-600" /> Endereço & Localização
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">CEP</label>
                    <input
                      type="text"
                      value={formData.cep}
                      onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                      placeholder="28800-000"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Cidade</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Casimiro de Abreu"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-900 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Estado (UF)</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="RJ"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white uppercase font-bold text-slate-900 placeholder-slate-400"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Rua / Logradouro</label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      placeholder="Av. Amaral Peixoto"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Número</label>
                    <input
                      type="text"
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                      placeholder="131"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Bairro</label>
                    <input
                      type="text"
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                      placeholder="Centro"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium placeholder-slate-400"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Complemento / Ponto de Referência</label>
                    <input
                      type="text"
                      value={formData.complement}
                      onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                      placeholder="Loja 02 (ao lado do posto)"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Commercial Terms */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-200/80 pb-2">
                  Informações Comerciais & Visitas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tipo de Cliente / Modalidade</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-slate-900"
                    >
                      <option value="Consignação">🤝 Consignação (Acerto Periódico)</option>
                      <option value="Revendedor">🏬 Revendedor / Lojista</option>
                      <option value="Cliente direto">👤 Cliente Direto / Final</option>
                      <option value="Outro">🌐 Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Periodicidade de Visita</label>
                    <select
                      value={formData.visitFrequency}
                      onChange={(e) => setFormData({ ...formData, visitFrequency: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-slate-900"
                    >
                      <option value="7 dias">7 dias (Semanal)</option>
                      <option value="15 dias">15 dias (Quinzenal)</option>
                      <option value="30 dias">30 dias (Mensal)</option>
                      <option value="Personalizado">Personalizado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 4: Logistics Memory */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-indigo-600" /> Logística e Deslocamento Padrão
                  </h4>
                  <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full text-[10px] lowercase font-semibold">
                    🔒 Uso Interno Oficina
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Modalidade Padrão de Entrega</label>
                    <select
                      value={formData.defaultLogisticsType || 'combustivel'}
                      onChange={(e) => setFormData({ ...formData, defaultLogisticsType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-slate-900"
                    >
                      <option value="combustivel">⛽ Combustível (Deslocamento Próprio)</option>
                      <option value="frete">🚚 Frete / Motoboy / Terceirizado</option>
                      <option value="retirada">🚗 Sem Custo (Retirada na Oficina)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Custo Padrão de Transporte (R$)</label>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      value={formData.defaultLogisticsCost ?? 50.0}
                      onChange={(e) => setFormData({ ...formData, defaultLogisticsCost: Number(e.target.value) })}
                      placeholder="Ex: 50.00"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-black text-rose-600"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons (Non-Fixed / Scrollable) */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="order-2 sm:order-1 px-3.5 py-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl font-semibold text-xs transition-colors cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="order-1 sm:order-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Cliente</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
