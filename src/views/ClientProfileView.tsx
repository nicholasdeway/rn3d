import React, { useState, useEffect } from 'react';
import { Client, ClientInventoryItem, Order, Quote } from '../types';
import { ImageCropperModal } from '../components/ImageCropperModal';
import { ImageLightboxModal } from '../components/ImageLightboxModal';
import { fetchAddressByCep } from '../services/viaCepService';
import { formatPhone, formatDocument } from '../utils/formatters';
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
  Crop,
  Trash2,
  ImageIcon,
  Users,
  Loader2,
  Plus,
  Minus,
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
  onUpdateOrderProgress?: (orderId: string, newProgressPct: number) => void;
  onUpdateOrderStatus?: (orderId: string, newStatus: Order['status']) => void;
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
  onUpdateOrderProgress,
  onUpdateOrderStatus,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'inventory' | 'visits' | 'movements' | 'quotes' | 'orders'
  >('overview');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentClientData, setCurrentClientData] = useState<Client>(client);
  const [logisticsMemory, setLogisticsMemory] = useState<{ type: string; cost: number }>({
    type: client.defaultLogisticsType || 'combustivel',
    cost: client.defaultLogisticsCost ?? 0,
  });

  // Sync client & logistics memory when prop changes
  useEffect(() => {
    setCurrentClientData(client);
    setLogisticsMemory({
      type: client.defaultLogisticsType || 'combustivel',
      cost: client.defaultLogisticsCost ?? 0,
    });
  }, [client]);

  // Edit form state & Avatar Cropper state
  const [editFormData, setEditFormData] = useState<Partial<Client>>({});
  const [croppingImageSrc, setCroppingImageSrc] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);
  const [isSearchingEditCep, setIsSearchingEditCep] = useState(false);
  const [editCepStatusMessage, setEditCepStatusMessage] = useState('');

  const handleEditCepChange = async (inputCep: string) => {
    const numeric = inputCep.replace(/\D/g, '').slice(0, 8);
    let formatted = numeric;
    if (numeric.length > 5) {
      formatted = `${numeric.slice(0, 5)}-${numeric.slice(5, 8)}`;
    }

    setEditFormData((prev) => ({ ...prev, cep: formatted }));

    if (numeric.length === 8) {
      setIsSearchingEditCep(true);
      setEditCepStatusMessage('Buscando CEP no ViaCEP...');
      const address = await fetchAddressByCep(numeric);
      setIsSearchingEditCep(false);
      if (address) {
        setEditFormData((prev) => ({
          ...prev,
          street: address.logradouro || prev.street,
          neighborhood: address.bairro || prev.neighborhood,
          city: address.localidade || prev.city,
          state: address.uf || prev.state,
          complement: address.complemento || prev.complement,
        }));
        setEditCepStatusMessage('✅ Endereço localizado!');
      } else {
        setEditCepStatusMessage('⚠️ CEP não encontrado');
      }
    } else {
      setEditCepStatusMessage('');
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCroppingImageSrc(reader.result as string);
      });
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleCropComplete = (croppedBase64: string) => {
    setEditFormData((prev) => ({ ...prev, avatarUrl: croppedBase64 }));
    setCroppingImageSrc(null);
  };

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
      defaultLogisticsCost: editFormData.defaultLogisticsCost ?? 0,
    } as Client;

    setCurrentClientData(updated);
    setLogisticsMemory({
      type: updated.defaultLogisticsType || 'combustivel',
      cost: updated.defaultLogisticsCost ?? 0,
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
            <div
              onClick={() => {
                if (currentClientData.avatarUrl) {
                  setZoomImage({ url: currentClientData.avatarUrl, title: currentClientData.name });
                }
              }}
              className={`w-14 h-14 rounded-2xl bg-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden border border-indigo-200 ${
                currentClientData.avatarUrl ? 'cursor-zoom-in hover:scale-105 transition-transform' : ''
              }`}
              title={currentClientData.avatarUrl ? 'Clique para ver foto em tela cheia' : undefined}
            >
              {currentClientData.avatarUrl ? (
                <img src={currentClientData.avatarUrl} alt={currentClientData.name} className="w-full h-full object-cover" />
              ) : (
                <span>{currentClientData.name.charAt(0).toUpperCase()}</span>
              )}
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
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 w-full lg:w-auto">
            <button
              onClick={handleOpenEditModal}
              className="px-3.5 py-2.5 bg-slate-800 dark:bg-slate-800 hover:bg-slate-900 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700/50"
            >
              <Edit3 className="w-4 h-4 text-emerald-400" />
              <span>Editar Dados</span>
            </button>
            <button
              onClick={() => onStartVisit(client.id)}
              className="px-3.5 py-2.5 bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
              <span>Registrar visita</span>
            </button>
            <button
              onClick={() => onNewConsignment(client.id)}
              className="px-3.5 py-2.5 bg-indigo-600 dark:bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Boxes className="w-4 h-4" />
              <span>Nova consignação</span>
            </button>
            <button
              onClick={() => onNewOrder(client.id)}
              className="px-3.5 py-2.5 bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Novo pedido</span>
            </button>
            <button
              onClick={() => onNewQuote(client.id)}
              className="col-span-2 sm:col-span-1 px-3.5 py-2.5 bg-purple-600 dark:bg-purple-600 hover:bg-purple-700 dark:hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Novo orçamento</span>
            </button>
          </div>
        </div>

        {/* Key Metrics Row (Definance KPI Cards Style) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          {/* Card 1: Produtos no local */}
          <div className="definance-kpi-card bg-white dark:bg-[#12151c] p-4 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs hover:border-purple-500/40 dark:hover:border-purple-500/40 cursor-pointer">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
                Produtos no local
              </span>
              <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 tracking-tight truncate">
              {currentClientData.productsOnSiteCount} <span className="text-xs font-bold text-slate-400">un</span>
            </p>
          </div>

          {/* Card 2: Valor das mercadorias */}
          <div className="definance-kpi-card bg-white dark:bg-[#12151c] p-4 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs hover:border-indigo-500/40 dark:hover:border-indigo-500/40 cursor-pointer">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
                Valor Mercadorias
              </span>
              <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 tracking-tight truncate">
              R$ {currentClientData.productsValuation.toFixed(2).replace('.', ',')}
            </p>
          </div>

          {/* Card 3: Valor a receber */}
          <div className="definance-kpi-card bg-white dark:bg-[#12151c] p-4 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs hover:border-emerald-500/40 dark:hover:border-emerald-500/40 cursor-pointer">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
                Valor a Receber
              </span>
              <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 tracking-tight truncate">
              R$ {currentClientData.receivableBalance.toFixed(2).replace('.', ',')}
            </p>
          </div>

          {/* Card 4: Custo Transporte Padrão */}
          <div className="definance-kpi-card bg-white dark:bg-[#12151c] p-4 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs hover:border-rose-500/40 dark:hover:border-rose-500/40 cursor-pointer">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
                Transporte Padrão
              </span>
              <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-2 tracking-tight truncate">
              R$ {logisticsMemory.cost.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
              {logisticsMemory.type === 'frete'
                ? '🚚 Frete / Motoboy'
                : logisticsMemory.type === 'retirada'
                ? '🚗 Retirada'
                : '⛽ Combustível'}
            </p>
          </div>

          {/* Card 5: Próxima visita */}
          <div className="definance-kpi-card bg-white dark:bg-[#12151c] p-4 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs hover:border-amber-500/40 dark:hover:border-amber-500/40 cursor-pointer col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
                Próxima Visita
              </span>
              <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <p className="text-base sm:text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-2 tracking-tight truncate">
              {currentClientData.nextVisitDate}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Tabs Bar (No Horizontal Scroll on Mobile, Full Dark Mode Support) */}
      <div className="bg-white dark:bg-[#12151c] rounded-2xl border border-slate-200/80 dark:border-[#202531] p-1.5 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap items-center gap-1.5">
          {[
            { id: 'overview', label: 'Visão Geral', icon: Building2 },
            { id: 'inventory', label: 'Estoque Local', icon: Boxes },
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
                className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white bg-slate-50/60 dark:bg-slate-800/40 border border-transparent dark:border-slate-700/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{tab.label}</span>
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
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
            <h3 className="font-bold text-slate-900 text-sm">Histórico de Pedidos de Venda do Cliente</h3>
            <button
              onClick={() => onNewOrder(client.id)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ShoppingCart className="w-4 h-4" /> Criar Novo Pedido
            </button>
          </div>

          {clientOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Nenhum pedido de venda registrado para este cliente até o momento.
            </div>
          ) : (
            <>
              {/* Mobile Cards View (< 768px) - No Horizontal Scroll */}
              <div className="block md:hidden p-4 space-y-3">
                {clientOrders.map((o) => (
                  <div key={o.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-indigo-600 text-xs">{o.id}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const newPct = Math.max(0, o.productionProgressPct - 5);
                            if (onUpdateOrderProgress) onUpdateOrderProgress(o.id, newPct);
                          }}
                          disabled={o.productionProgressPct <= 0}
                          className="p-1 bg-white hover:bg-slate-200 text-slate-700 disabled:opacity-30 rounded-md cursor-pointer transition-colors active:scale-95 border border-slate-200"
                          title="Diminuir 5%"
                        >
                          <Minus className="w-3 h-3 text-rose-500" />
                        </button>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                          o.status === 'Entregue'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold'
                            : o.productionProgressPct === 100
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {o.status} ({o.productionProgressPct}%)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newPct = Math.min(100, o.productionProgressPct + 5);
                            if (onUpdateOrderProgress) onUpdateOrderProgress(o.id, newPct);
                          }}
                          disabled={o.productionProgressPct >= 100}
                          className="p-1 bg-white hover:bg-slate-200 text-slate-700 disabled:opacity-30 rounded-md cursor-pointer transition-colors active:scale-95 border border-slate-200"
                          title="Aumentar 5%"
                        >
                          <Plus className="w-3 h-3 text-emerald-600" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div>
                        <p className="text-slate-500 text-[11px]">Data: {o.date}</p>
                        <p className="font-bold text-slate-800 mt-0.5">{o.itemsCount} itens</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-medium block">Valor Total</span>
                        <span className="font-black text-emerald-600 text-sm">
                          R$ {o.totalValue.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Pagamento: <strong className="text-slate-800">{o.paymentStatusText}</strong></span>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-semibold select-none">
                        <input
                          type="checkbox"
                          checked={o.status === 'Entregue'}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            if (isChecked) {
                              if (onUpdateOrderStatus) onUpdateOrderStatus(o.id, 'Entregue');
                            } else {
                              const fallbackStatus = o.productionProgressPct === 100 ? 'Pronto' : o.productionProgressPct > 0 ? 'Em produção' : 'Novo';
                              if (onUpdateOrderStatus) onUpdateOrderStatus(o.id, fallbackStatus);
                            }
                          }}
                          className="w-3.5 h-3.5 accent-emerald-600 rounded cursor-pointer"
                        />
                        <span className={o.status === 'Entregue' ? 'text-emerald-700 font-bold' : 'text-slate-600'}>
                          {o.status === 'Entregue' ? '✅ Entregue' : '📦 Não entregue'}
                        </span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (>= 768px) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="p-4">Pedido</th>
                      <th className="p-4">Data</th>
                      <th className="p-4 text-center">Itens</th>
                      <th className="p-4 text-right">Valor Total</th>
                      <th className="p-4">Pagamento</th>
                      <th className="p-4">Progresso Impressão 3D</th>
                      <th className="p-4">Entrega</th>
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
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const newPct = Math.max(0, o.productionProgressPct - 5);
                                if (onUpdateOrderProgress) onUpdateOrderProgress(o.id, newPct);
                              }}
                              disabled={o.productionProgressPct <= 0}
                              className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 rounded-md cursor-pointer transition-colors active:scale-95"
                              title="Diminuir 5%"
                            >
                              <Minus className="w-3 h-3 text-rose-500" />
                            </button>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                              o.status === 'Entregue'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold'
                                : o.productionProgressPct === 100
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            }`}>
                              {o.status} ({o.productionProgressPct}%)
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const newPct = Math.min(100, o.productionProgressPct + 5);
                                if (onUpdateOrderProgress) onUpdateOrderProgress(o.id, newPct);
                              }}
                              disabled={o.productionProgressPct >= 100}
                              className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 rounded-md cursor-pointer transition-colors active:scale-95"
                              title="Aumentar 5%"
                            >
                              <Plus className="w-3 h-3 text-emerald-600" />
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <label className="inline-flex items-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold select-none">
                            <input
                              type="checkbox"
                              checked={o.status === 'Entregue'}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                if (isChecked) {
                                  if (onUpdateOrderStatus) onUpdateOrderStatus(o.id, 'Entregue');
                                } else {
                                  const fallbackStatus = o.productionProgressPct === 100 ? 'Pronto' : o.productionProgressPct > 0 ? 'Em produção' : 'Novo';
                                  if (onUpdateOrderStatus) onUpdateOrderStatus(o.id, fallbackStatus);
                                }
                              }}
                              className="w-3.5 h-3.5 accent-emerald-600 rounded cursor-pointer"
                            />
                            <span className={o.status === 'Entregue' ? 'text-emerald-700 font-bold' : 'text-slate-600'}>
                              {o.status === 'Entregue' ? '✅ Entregue' : '📦 Não entregue'}
                            </span>
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab Content: Quotes History */}
      {activeTab === 'quotes' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
            <h3 className="font-bold text-slate-900 text-sm">Histórico de Orçamentos do Cliente</h3>
            <button
              onClick={() => onNewQuote(client.id)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileText className="w-4 h-4" /> Criar Novo Orçamento
            </button>
          </div>

          {clientQuotes.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Nenhum orçamento emitido para este cliente até o momento.
            </div>
          ) : (
            <>
              {/* Mobile Cards View (< 768px) - No Horizontal Scroll */}
              <div className="block md:hidden p-4 space-y-3">
                {clientQuotes.map((q) => (
                  <div key={q.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-indigo-600 text-xs">{q.id}</span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
                        {q.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs">
                      <p className="text-slate-500 text-[11px]">Data: {q.date}</p>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-medium block">Valor Total</span>
                        <span className="font-black text-emerald-600 text-sm">
                          R$ {q.total.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (>= 768px) */}
              <div className="hidden md:block overflow-x-auto">
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
            </>
          )}
        </div>
      )}

      {/* Tab Content: Estoque no Local */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Itens Atualmente em Consignação</h3>
              <p className="text-xs text-slate-500">Auditoria do expositor na loja do cliente</p>
            </div>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full self-start sm:self-auto">
              Total: {clientInventory.reduce((acc, i) => acc + i.currentQuantity, 0)} itens
            </span>
          </div>

          {/* Mobile Cards View (< 768px) - No Horizontal Scroll */}
          <div className="block md:hidden p-4 space-y-3">
            {clientInventory.map((item) => {
              const isLowTurnover = item.currentQuantity >= 10 && item.soldQuantity <= 2;
              const totalVal = item.currentQuantity * item.unitPrice;

              return (
                <div key={item.productId} className={`p-4 border rounded-2xl space-y-2.5 ${isLowTurnover ? 'bg-amber-50/40 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">{item.productName}</h5>
                      <p className="text-[11px] text-slate-500 font-mono">SKU: {item.sku}</p>
                    </div>
                    {isLowTurnover && (
                      <span className="px-2 py-0.5 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 rounded-md shrink-0">
                        Baixo giro!
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 border-t border-slate-200/60">
                    <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 font-medium block">Enviados</span>
                      <span className="font-bold text-slate-800">{item.sentQuantity}</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 font-medium block">Vendidos</span>
                      <span className="font-bold text-emerald-600">{item.soldQuantity}</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 font-medium block">No Local</span>
                      <span className="font-black text-slate-900">{item.currentQuantity} un</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">Un: R$ {item.unitPrice.toFixed(2).replace('.', ',')}</span>
                    <span className="font-black text-emerald-600">Total: R$ {totalVal.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block overflow-x-auto">
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
              {/* Basic Info & Avatar */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-200 pb-1">
                  Dados Cadastrais & Foto de Avatar
                </h4>

                {/* Avatar / Foto do Cliente */}
                <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-900">Logo / Foto do Cliente (Avatar)</label>
                    {editFormData.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, avatarUrl: '' })}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer hover:underline"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remover Foto
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white border border-slate-200 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-xs relative">
                      {editFormData.avatarUrl ? (
                        <img src={editFormData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-7 h-7 text-slate-400" />
                      )}
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap gap-2">
                        <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center gap-1.5 w-fit cursor-pointer shadow-xs">
                          <Crop className="w-4 h-4" />
                          {editFormData.avatarUrl ? 'Substituir / Recortar Foto' : 'Selecionar e Recortar Foto'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileChange}
                            className="hidden"
                          />
                        </label>
                        {editFormData.avatarUrl && (
                          <button
                            type="button"
                            onClick={() => setEditFormData({ ...editFormData, avatarUrl: '' })}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-semibold flex items-center gap-1 cursor-pointer border border-rose-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Excluir
                          </button>
                        )}
                      </div>
                      <input
                        type="url"
                        value={editFormData.avatarUrl || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, avatarUrl: e.target.value })}
                        placeholder="Ou cole a URL da imagem (https://...)"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>

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
                      onChange={(e) => setEditFormData({ ...editFormData, document: formatDocument(e.target.value) })}
                      placeholder="00.000.000/0001-00"
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
                      value={editFormData.phone || editFormData.whatsapp || ''}
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value);
                        setEditFormData({ ...editFormData, phone: formatted, whatsapp: formatted });
                      }}
                      placeholder="(22) 99754-0815"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Address (Optional / ViaCEP) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                    Endereço Comercial (Opcional)
                  </h4>
                  {editCepStatusMessage && (
                    <span className={`text-[11px] font-bold flex items-center gap-1 ${
                      isSearchingEditCep ? 'text-indigo-600 animate-pulse' : editCepStatusMessage.includes('✅') ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {isSearchingEditCep && <Loader2 className="w-3 h-3 animate-spin" />}
                      {editCepStatusMessage}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>CEP (Busca ViaCEP)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editFormData.cep || ''}
                        onChange={(e) => handleEditCepChange(e.target.value)}
                        placeholder="26200-000"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs font-bold"
                      />
                      {isSearchingEditCep && (
                        <div className="absolute right-2.5 top-2.5">
                          <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>
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
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Estado (UF)</label>
                    <input
                      type="text"
                      value={editFormData.state || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl uppercase font-bold text-slate-900"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Complemento / Referência</label>
                    <input
                      type="text"
                      value={editFormData.complement || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, complement: e.target.value })}
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
                    <label className="block font-semibold text-slate-700 mb-1">Custo Logístico Padrão (R$) *</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={editFormData.defaultLogisticsCost === '' || editFormData.defaultLogisticsCost === undefined || editFormData.defaultLogisticsCost === null ? '' : editFormData.defaultLogisticsCost}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditFormData({
                          ...editFormData,
                          defaultLogisticsCost: val === '' ? ('' as any) : Number(val),
                        });
                      }}
                      placeholder="Ex: 50.00"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-black text-rose-600 text-sm placeholder-slate-300"
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

      {/* Image Cropper Modal for Avatar */}
      {croppingImageSrc && (
        <ImageCropperModal
          imageSrc={croppingImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => setCroppingImageSrc(null)}
        />
      )}

      {/* Lightbox Zoom Modal for Avatar */}
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
