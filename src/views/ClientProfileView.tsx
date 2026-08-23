import React, { useState, useEffect } from 'react';
import { Client, ClientInventoryItem, Order, Quote } from '../types';
import {
  Building2,
  Phone,
  MapPin,
  Boxes,
  DollarSign,
  FileText,
  ShoppingCart,
  Clock,
  ArrowLeft,
  AlertTriangle,
  History,
  TrendingUp,
  Truck,
  Edit3,
  X,
  UserCheck,
  Printer,
  CheckCircle2,
} from 'lucide-react';

interface ClientProfileViewProps {
  client: Client;
  onBack: () => void;
  onStartVisit: (clientId: string) => void;
  onNewConsignment: (clientId: string) => void;
  onNewOrder: (clientId: string) => void;
  onNewQuote: (clientId: string) => void;
  clientInventory: ClientInventoryItem[];
  orders?: Order[];
  quotes?: Quote[];
  onUpdateClient?: (updatedClient: Client) => void;
}

export const ClientProfileView: React.FC<ClientProfileViewProps> = ({
  client,
  onBack,
  onStartVisit,
  onNewConsignment,
  onNewOrder,
  onNewQuote,
  clientInventory,
  orders = [],
  quotes = [],
  onUpdateClient,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'inventory' | 'visits' | 'movements' | 'quotes' | 'orders'
  >('overview');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentClientData, setCurrentClientData] = useState<Client>(client);

  // Sync client when prop changes
  useEffect(() => {
    setCurrentClientData(client);
  }, [client]);

  // Read saved logistics memory from localStorage if present
  const [logisticsMemory, setLogisticsMemory] = useState<{ type: string; cost: number }>({
    type: client.defaultLogisticsType || 'combustivel',
    cost: client.defaultLogisticsCost ?? 50.0,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('rn3d_client_logistics');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed[client.id]) {
          setLogisticsMemory({
            type: parsed[client.id].type || 'combustivel',
            cost: parsed[client.id].cost ?? 50.0,
          });
        }
      }
    } catch (e) {
      console.error('Error reading client logistics memory:', e);
    }
  }, [client.id]);

  // Edit form state
  const [editFormData, setEditFormData] = useState<Partial<Client>>({});

  const handleOpenEditModal = () => {
    setEditFormData({
      ...currentClientData,
      defaultLogisticsType: logisticsMemory.type as any,
      defaultLogisticsCost: logisticsMemory.cost,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEditClient = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Client = {
      ...currentClientData,
      ...editFormData,
      name: editFormData.name || currentClientData.name,
      document: editFormData.document || currentClientData.document,
      defaultLogisticsType: editFormData.defaultLogisticsType || 'combustivel',
      defaultLogisticsCost: editFormData.defaultLogisticsCost ?? 50.0,
    } as Client;

    setCurrentClientData(updated);
    setLogisticsMemory({
      type: updated.defaultLogisticsType || 'combustivel',
      cost: updated.defaultLogisticsCost ?? 50.0,
    });

    if (onUpdateClient) {
      onUpdateClient(updated);
    }

    setIsEditModalOpen(false);
  };

  // Filter client specific orders & quotes
  const clientOrders = orders.filter(
    (o) => o.clientId === client.id || o.clientName.toLowerCase() === client.name.toLowerCase()
  );
  const clientQuotes = quotes.filter(
    (q) => q.clientId === client.id || q.clientName.toLowerCase() === client.name.toLowerCase()
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Back Navigation Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Lista de Clientes
      </button>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Store Info */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shrink-0 shadow-sm">
              {currentClientData.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-900">{currentClientData.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  {currentClientData.status}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                  {currentClientData.type}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Responsável: <strong className="text-slate-800">{currentClientData.responsible}</strong> • CNPJ/CPF:{' '}
                {currentClientData.document || 'Não informado'}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {currentClientData.street}, {currentClientData.number} - {currentClientData.neighborhood},{' '}
                  {currentClientData.city} / {currentClientData.state}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {currentClientData.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleOpenEditModal}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-emerald-400" />
              Editar Dados
            </button>
            <button
              onClick={() => onStartVisit(client.id)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
              Registrar visita
            </button>
            <button
              onClick={() => onNewConsignment(client.id)}
              className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Boxes className="w-4 h-4" />
              Nova consignação
            </button>
            <button
              onClick={() => onNewOrder(client.id)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 text-slate-600" />
              Novo pedido
            </button>
            <button
              onClick={() => onNewQuote(client.id)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-600" />
              Novo orçamento
            </button>
          </div>
        </div>

        {/* Key Metrics Row (Including Logistics Default Memory Card) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-400 font-medium block">Produtos no local</span>
            <span className="text-lg font-extrabold text-slate-900">{currentClientData.productsOnSiteCount} un</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-400 font-medium block">Valor das mercadorias</span>
            <span className="text-lg font-extrabold text-slate-900">
              R$ {currentClientData.productsValuation.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <span className="text-[11px] text-emerald-700 font-medium block">Valor a receber</span>
            <span className="text-lg font-extrabold text-emerald-700">
              R$ {currentClientData.receivableBalance.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-100">
            <span className="text-[11px] text-rose-700 font-bold block flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" /> Custo Transporte Padrão
            </span>
            <span className="text-lg font-black text-rose-600">
              R$ {logisticsMemory.cost.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[10px] text-slate-500 block capitalize">
              {logisticsMemory.type === 'frete'
                ? '🚚 Frete / Motoboy'
                : logisticsMemory.type === 'retirada'
                ? '🚗 Retirada'
                : '⛽ Combustível'}
            </span>
          </div>

          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <span className="text-[11px] text-indigo-700 font-medium block">Próxima visita</span>
            <span className="text-sm font-bold text-indigo-800">{currentClientData.nextVisitDate}</span>
          </div>
        </div>
      </div>

      {/* Profile Tabs Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {[
            { id: 'overview', label: 'Visão Geral & Cadastro', icon: Building2 },
            { id: 'inventory', label: 'Estoque no Local', icon: Boxes },
            { id: 'orders', label: `Pedidos (${clientOrders.length})`, icon: ShoppingCart },
            { id: 'quotes', label: `Orçamentos (${clientQuotes.length})`, icon: FileText },
            { id: 'visits', label: 'Visitas', icon: MapPin },
            { id: 'movements', label: 'Movimentações', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content 1: Visão Geral & Detalhes de Cadastro */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Complete Registration Details Box */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                  Ficha de Cadastro Completa
                </h3>
                <button
                  onClick={handleOpenEditModal}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-indigo-600" /> Editar Cadastro
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Razão Social / Nome</span>
                  <p className="font-bold text-slate-900 text-sm">{currentClientData.name}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Nome Fantasia</span>
                  <p className="font-bold text-slate-900 text-sm">{currentClientData.fantasyName || '-'}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">CPF / CNPJ</span>
                  <p className="font-bold text-slate-900">{currentClientData.document || 'Não informado'}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Inscrição Estadual (IE)</span>
                  <p className="font-bold text-slate-900">{currentClientData.stateRegistration || 'Isento / N/I'}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Responsável / Contato</span>
                  <p className="font-bold text-slate-900">{currentClientData.responsible}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Telefone / WhatsApp</span>
                  <p className="font-bold text-slate-900">{currentClientData.phone}</p>
                </div>

                <div className="sm:col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Endereço Comercial</span>
                  <p className="font-bold text-slate-900">
                    {currentClientData.street}, {currentClientData.number}
                    {currentClientData.complement ? ` (${currentClientData.complement})` : ''} - {currentClientData.neighborhood}, {currentClientData.city} / {currentClientData.state} - CEP: {currentClientData.cep}
                  </p>
                </div>
              </div>
            </div>

            {/* Internal Logistics Memory Details Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-indigo-600" />
                  Custo Padrão de Transporte / Deslocamento
                </h3>
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                  🔒 Memória Interna da Oficina
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block font-medium">Modalidade Preferencial de Entrega:</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {logisticsMemory.type === 'frete'
                      ? '🚚 Frete / Motoboy / Terceirizado'
                      : logisticsMemory.type === 'retirada'
                      ? '🚗 Retirada na Oficina'
                      : '⛽ Combustível (Deslocamento Próprio)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Custo Logístico Padrão Gravado:</span>
                  <span className="font-black text-rose-600 text-base">
                    R$ {logisticsMemory.cost.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                * Sempre que você criar um novo orçamento ou pedido para {currentClientData.name}, o sistema preencherá automaticamente este valor de R$ {logisticsMemory.cost.toFixed(2).replace('.', ',')}, permitindo alteração rápida se necessário.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Commercial terms & notes */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Termos Comerciais</h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="text-slate-500">Nível de preço:</span>
                  <span className="font-bold text-indigo-600">{currentClientData.agreedPriceLevel}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="text-slate-500">Frequência de Visita:</span>
                  <span className="font-bold text-slate-900">{currentClientData.visitFrequency}</span>
                </div>
              </div>

              <div className="pt-2">
                <h4 className="font-bold text-slate-900 text-xs mb-1">Observações do Cliente:</h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 text-xs italic">
                  {currentClientData.notes || 'Nenhuma observação comercial registrada.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Orders History */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-slate-900 text-sm">Histórico de Pedidos de Venda do Cliente</h3>
            <button
              onClick={() => onNewOrder(client.id)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" /> Criar Novo Pedido
            </button>
          </div>

          {clientOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Nenhum pedido de venda registrado para este cliente até o momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="p-4">Pedido</th>
                    <th className="p-4">Data</th>
                    <th className="p-4 text-center">Itens</th>
                    <th className="p-4 text-right">Valor Total</th>
                    <th className="p-4">Pagamento</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="p-4 font-mono font-bold text-indigo-600">{o.id}</td>
                      <td className="p-4 text-slate-600">{o.date}</td>
                      <td className="p-4 text-center font-bold">{o.itemsCount} itens</td>
                      <td className="p-4 text-right font-extrabold text-emerald-600">
                        R$ {o.totalValue.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="p-4 font-semibold text-slate-700">{o.paymentStatusText}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Quotes History */}
      {activeTab === 'quotes' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-slate-900 text-sm">Histórico de Orçamentos do Cliente</h3>
            <button
              onClick={() => onNewQuote(client.id)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" /> Criar Novo Orçamento
            </button>
          </div>

          {clientQuotes.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Nenhum orçamento emitido para este cliente até o momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="p-4">Número</th>
                    <th className="p-4">Data</th>
                    <th className="p-4 text-right">Valor Total</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientQuotes.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50">
                      <td className="p-4 font-mono font-bold text-indigo-600">{q.id}</td>
                      <td className="p-4 text-slate-600">{q.date}</td>
                      <td className="p-4 text-right font-extrabold text-emerald-600">
                        R$ {q.total.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {q.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Estoque no Local */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Itens Atualmente em Consignação</h3>
              <p className="text-xs text-slate-500">Auditoria do expositor na loja do cliente</p>
            </div>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full">
              Total: {clientInventory.reduce((acc, i) => acc + i.currentQuantity, 0)} itens
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Produto</th>
                  <th className="p-4 text-center">Enviado</th>
                  <th className="p-4 text-center">Vendido</th>
                  <th className="p-4 text-center">Atual no Local</th>
                  <th className="p-4 text-right">Preço Unit.</th>
                  <th className="p-4 text-right">Valor Atual</th>
                  <th className="p-4">Última Movimentação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientInventory.map((item) => {
                  const isLowTurnover = item.currentQuantity >= 10 && item.soldQuantity <= 2;
                  const totalVal = item.currentQuantity * item.unitPrice;

                  return (
                    <tr
                      key={item.productId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isLowTurnover ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="p-4 font-bold text-slate-900">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.productName}</p>
                          <p className="text-[11px] text-slate-400 font-normal">SKU: {item.sku}</p>
                          {isLowTurnover && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md mt-1">
                              <AlertTriangle className="w-3 h-3" />
                              Alerta de baixo giro!
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center font-medium text-slate-600">{item.sentQuantity}</td>
                      <td className="p-4 text-center font-bold text-emerald-600">{item.soldQuantity}</td>
                      <td className="p-4 text-center font-extrabold text-slate-900">
                        {item.currentQuantity} un
                      </td>
                      <td className="p-4 text-right font-medium text-slate-700">
                        R$ {item.unitPrice.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="p-4 text-right font-bold text-slate-900">
                        R$ {totalVal.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="p-4 text-slate-500">{item.lastMovementDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content Placeholders for Visits & Movements */}
      {(activeTab === 'visits' || activeTab === 'movements') && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-500 space-y-3">
          <Clock className="w-8 h-8 text-indigo-400 mx-auto" />
          <h4 className="font-bold text-slate-800 text-sm">Histórico do Cliente</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Todas as visitas e movimentações deste cliente estão registradas e sincronizadas em tempo real.
          </p>
          <button
            onClick={() => onStartVisit(client.id)}
            className="px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <MapPin className="w-4 h-4" /> Registrar Nova Visita
          </button>
        </div>
      )}

      {/* Edit Client Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-300 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                Editar Perfil do Cliente — {currentClientData.name}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditClient} className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-200 pb-1">
                  Dados Cadastrais
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Razão Social / Nome *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.name || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nome Fantasia</label>
                    <input
                      type="text"
                      value={editFormData.fantasyName || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, fantasyName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">CPF / CNPJ</label>
                    <input
                      type="text"
                      value={editFormData.document || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, document: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Inscrição Estadual (IE)</label>
                    <input
                      type="text"
                      value={editFormData.stateRegistration || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, stateRegistration: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pessoa de Contato / Responsável</label>
                    <input
                      type="text"
                      value={editFormData.responsible || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, responsible: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      value={editFormData.phone || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-200 pb-1">
                  Endereço Comercial
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Rua / Logradouro</label>
                    <input
                      type="text"
                      value={editFormData.street || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, street: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Número</label>
                    <input
                      type="text"
                      value={editFormData.number || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, number: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Bairro</label>
                    <input
                      type="text"
                      value={editFormData.neighborhood || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, neighborhood: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Cidade</label>
                    <input
                      type="text"
                      value={editFormData.city || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Estado</label>
                    <input
                      type="text"
                      value={editFormData.state || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Logistics Default Memory Block in Edit */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-indigo-600" /> Custo Padrão de Transporte / Deslocamento (Memória)
                  </span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                    🔒 Uso Interno Oficina
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Modalidade Preferencial</label>
                    <select
                      value={editFormData.defaultLogisticsType || 'combustivel'}
                      onChange={(e) => setEditFormData({ ...editFormData, defaultLogisticsType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                    >
                      <option value="combustivel">⛽ Combustível (Deslocamento Próprio)</option>
                      <option value="frete">🚚 Frete / Motoboy / Terceirizado</option>
                      <option value="retirada">🚗 Sem Custo (Retirada na Oficina)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Custo Logístico Padrão (R$)</label>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      value={editFormData.defaultLogisticsCost ?? 50.0}
                      onChange={(e) => setEditFormData({ ...editFormData, defaultLogisticsCost: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-black text-rose-600 text-sm"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  💡 Exemplo: R$ 50,00 para Minguta Clube de Tiro ou R$ 20,00 para Cliente Padrão. Este valor sempre sugerirá na hora de emitir orçamentos e pedidos.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" /> Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
