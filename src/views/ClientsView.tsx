import React, { useState } from 'react';
import { Client } from '../types';
import {
  Users,
  Plus,
  Search,
  Boxes,
  DollarSign,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageSquare,
  ArrowRight,
  X,
  Building2,
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
    cep: '26210-000',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: 'Nova Iguaçu',
    state: 'RJ',
    type: 'Consignação',
    agreedPriceLevel: 'Preço Consignado R$ 6,00',
    visitFrequency: '15 dias',
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
      city: formData.city || 'Nova Iguaçu',
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
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-300 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Cadastrar Novo Cliente / Estabelecimento
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewClient} className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Main Fields */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-200 pb-1">
                  Dados do Estabelecimento
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nome / Razão Social *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Depósito Avenida"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nome Fantasia</label>
                    <input
                      type="text"
                      value={formData.fantasyName}
                      onChange={(e) => setFormData({ ...formData, fantasyName: e.target.value })}
                      placeholder="Ex: Depósito Avenida Bebidas"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">CPF / CNPJ</label>
                    <input
                      type="text"
                      value={formData.document}
                      onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                      placeholder="00.000.000/0001-00"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
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
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="(21) 98765-4321"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">E-mail</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contato@empresa.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-200 pb-1">
                  Endereço
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Rua / Logradouro</label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      placeholder="Av. Amaral Peixoto"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Número</label>
                    <input
                      type="text"
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                      placeholder="420"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Bairro</label>
                    <input
                      type="text"
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                      placeholder="Centro"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Cidade</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Nova Iguaçu"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Estado</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="RJ"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Commercial Terms */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-200 pb-1">
                  Informações Comerciais
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tipo de Cliente</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    >
                      <option value="Consignação">Consignação</option>
                      <option value="Revendedor">Revendedor</option>
                      <option value="Cliente direto">Cliente direto</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Periodicidade de Visita</label>
                    <select
                      value={formData.visitFrequency}
                      onChange={(e) => setFormData({ ...formData, visitFrequency: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    >
                      <option value="7 dias">7 dias (Semanal)</option>
                      <option value="15 dias">15 dias (Quinzenal)</option>
                      <option value="30 dias">30 dias (Mensal)</option>
                      <option value="Personalizado">Personalizado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Logistics Default Memory Block */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-200 pb-1 flex items-center justify-between">
                  <span>Logística e Deslocamento Padrão</span>
                  <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full text-[10px] lowercase font-semibold">🔒 Uso Interno</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Modalidade Padrão de Entrega</label>
                    <select
                      value={formData.defaultLogisticsType || 'combustivel'}
                      onChange={(e) => setFormData({ ...formData, defaultLogisticsType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
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

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
