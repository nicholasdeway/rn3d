import React, { useState } from 'react';
import { Client, Consignment, ConsignmentItem, Product, ExchangeNote, Visit, Order } from '../types';
import { ProductSelectCombobox } from '../components/ProductSelectCombobox';
import { formatDateBR, getTodayBR, parseBRDate } from '../utils/formatters';
import {
  Boxes,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  Building2,
  Calendar,
  X,
  Package,
  Printer,
  FileText,
  Grid,
  List,
  Edit,
  DollarSign,
  Minus,
  Check,
  CreditCard,
  Clock,
} from 'lucide-react';

import { safeGetLocalStorage, safeSetLocalStorage } from '../utils/storage';

interface ConsignmentsViewProps {
  consignments: Consignment[];
  clients: Client[];
  products: Product[];
  exchanges?: ExchangeNote[];
  visits?: Visit[];
  onAddConsignment: (consignment: Consignment) => void;
  onUpdateConsignment?: (consignment: Consignment) => void;
  onDeleteConsignment?: (id: string) => void;
  onClearConsignments?: () => void;
  preselectedClientId?: string;
  onAddOrder?: (order: Order) => void;
  onExecuteExchange?: (exchange: ExchangeNote) => void;
  onCreateExpense?: (expense: any) => void;
}

export const ConsignmentsView: React.FC<ConsignmentsViewProps> = ({
  consignments,
  clients,
  products,
  exchanges = [],
  visits = [],
  onAddConsignment,
  onUpdateConsignment,
  onDeleteConsignment,
  onClearConsignments,
  preselectedClientId,
  onAddOrder,
  onExecuteExchange,
  onCreateExpense,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    const saved = safeGetLocalStorage('rn3d_consignments_view_mode');
    return saved === 'grid' || saved === 'table' ? saved : 'grid';
  });

  React.useEffect(() => {
    safeSetLocalStorage('rn3d_consignments_view_mode', viewMode);
  }, [viewMode]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedConsignment, setSelectedConsignment] = useState<Consignment | null>(null);

  // Acerto Modal State
  const [isAcertoModalOpen, setIsAcertoModalOpen] = useState(false);
  const [acertoConsignment, setAcertoConsignment] = useState<Consignment | null>(null);
  const [acertoQuantities, setAcertoQuantities] = useState<Record<string, number>>({});
  const [acertoPaymentMethod, setAcertoPaymentMethod] = useState<string>('PIX');
  const [acertoPaymentStatus, setAcertoPaymentStatus] = useState<'aguardando_pagamento' | 'pago'>('aguardando_pagamento');
  const [acertoDate, setAcertoDate] = useState<string>(getTodayBR());
  const [acertoNotes, setAcertoNotes] = useState('');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingConsignmentId, setEditingConsignmentId] = useState<string | null>(null);
  const [editSelectedClientId, setEditSelectedClientId] = useState<string>('');
  const [editDeliveryDate, setEditDeliveryDate] = useState<string>(getTodayBR());
  const [editStatus, setEditStatus] = useState<'Em andamento' | 'Finalizada' | 'Cancelada'>('Em andamento');
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState<ConsignmentItem[]>([]);

  // Form State
  const [selectedClientId, setSelectedClientId] = useState<string>(
    preselectedClientId || clients[0]?.id || ''
  );
  const [deliveryDate, setDeliveryDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ConsignmentItem[]>([]);

  // Synchronize preselectedClientId whenever prop changes
  React.useEffect(() => {
    if (preselectedClientId) {
      setSelectedClientId(preselectedClientId);
      setIsWizardOpen(true);
    }
  }, [preselectedClientId]);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const filteredConsignments = consignments.filter(
    (c) =>
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProductToConsignment = (prod: Product) => {
    const existingIndex = items.findIndex((i) => i.productId === prod.id);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          quantity: 1,
          unitPrice: prod.standardPrice,
          subtotal: 1 * prod.standardPrice,
        },
      ]);
    }
  };

  const handleUpdateItemQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const updated = [...items];
    updated[index].quantity = newQty;
    updated[index].subtotal = newQty * updated[index].unitPrice;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const totalQuantity = items.reduce((acc, i) => acc + i.quantity, 0);
  const totalValuation = items.reduce((acc, i) => acc + i.subtotal, 0);

  const handleSubmitConsignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || items.length === 0) return;

    const newConsignment: Consignment = {
      id: `REM-${Math.floor(Math.random() * 900000 + 100000)}`,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      date: deliveryDate,
      itemsCount: totalQuantity,
      totalValue: totalValuation,
      status: 'Em andamento',
      lastAuditDate: deliveryDate,
      items,
      notes,
    };

    onAddConsignment(newConsignment);
    setIsWizardOpen(false);
    setItems([]);
  };

  const handleStartAcerto = (c: Consignment) => {
    setAcertoConsignment(c);

    const initialSold: Record<string, number> = {};
    (c.items || []).forEach((item) => {
      const key = item.productId || item.productName;
      initialSold[key] = 0;
    });

    setAcertoQuantities(initialSold);
    setAcertoPaymentMethod('PIX');
    setAcertoPaymentStatus('aguardando_pagamento');
    setAcertoDate(getTodayBR());
    setAcertoNotes('');
    setIsAcertoModalOpen(true);
  };

  const handleConfirmAcerto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acertoConsignment) return;

    const soldItemsList: {
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }[] = [];

    (acertoConsignment.items || []).forEach((item) => {
      const key = item.productId || item.productName;
      const soldQty = Number(acertoQuantities[key]) || 0;
      if (soldQty > 0) {
        soldItemsList.push({
          productId: item.productId || key,
          productName: item.productName,
          quantity: soldQty,
          unitPrice: item.unitPrice,
          subtotal: soldQty * item.unitPrice,
        });
      }
    });

    if (soldItemsList.length === 0) {
      alert('Selecione pelo menos 1 produto vendido para realizar o acerto.');
      return;
    }

    const totalSoldQty = soldItemsList.reduce((acc, i) => acc + i.quantity, 0);
    const totalSoldValuation = soldItemsList.reduce((acc, i) => acc + i.subtotal, 0);

    const newOrderId = `PED-${Math.floor(100000 + Math.random() * 900000)}`;

    const formattedIsoDate = acertoDate.includes('/')
      ? acertoDate.split('/').reverse().join('-')
      : acertoDate;

    const isPaid = acertoPaymentStatus === 'pago';
    const paidAmountVal = isPaid ? totalSoldValuation : 0;
    const paymentStatusTextVal = isPaid ? 'PAGO' : 'AGUARDANDO PAGAMENTO';
    const statusVal = 'Entregue';

    const newOrder: Order = {
      id: newOrderId,
      clientId: acertoConsignment.clientId,
      clientName: acertoConsignment.clientName,
      date: formattedIsoDate,
      createdAt: new Date().toISOString(),
      itemsCount: totalSoldQty,
      totalValue: totalSoldValuation,
      paidAmount: paidAmountVal,
      paymentStatusText: paymentStatusTextVal,
      status: statusVal,
      productionProgressPct: 100,
      attendanceMode: 'presencial',
      paymentMethod: acertoPaymentMethod,
      orderType: 'acerto_consignacao',
      notes: acertoNotes || `Acerto de Consignação (${acertoConsignment.id})`,
      items: soldItemsList.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        subtotal: i.subtotal,
      })),
      timeline: [
        {
          date: formatDateBR(acertoDate),
          title: isPaid ? 'Venda Consignada Auditada & Faturada (Pago)' : 'Venda Consignada Auditada (Aguardando Pagamento)',
          description: `Acerto presencial de ${totalSoldQty} peças no valor de R$ ${totalSoldValuation.toFixed(2).replace('.', ',')} (${acertoPaymentMethod})`,
        },
      ],
    };

    const exchangeNote: ExchangeNote = {
      id: `TRC-${Math.floor(100000 + Math.random() * 900000)}`,
      clientId: acertoConsignment.clientId,
      clientName: acertoConsignment.clientName,
      date: acertoDate,
      destinationClientId: 'OFFICE',
      destinationClientName: 'Venda Consignada Auditada',
      type: 'recolhimento_oficina',
      itemsRemoved: soldItemsList.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        reason: 'Vendido no PDV (Acerto de Consignação)',
      })),
      itemsAdded: [],
      responsible: 'Nicholas',
      responsibleName: 'Nicholas',
      notes: `Venda consignada faturada via Pedido #${newOrderId}`,
    };

    if (onAddOrder) {
      onAddOrder(newOrder);
    }
    if (isPaid && onCreateExpense) {
      onCreateExpense({
        id: `EXP-${Math.floor(100000 + Math.random() * 900000)}`,
        date: formattedIsoDate,
        description: `Acerto de Consignação - Pedido #${newOrderId} (${acertoConsignment.clientName})`,
        category: 'Entrada de Pedido',
        amount: totalSoldValuation,
        paymentMethod: acertoPaymentMethod,
        type: 'income',
        referenceCode: newOrderId,
        notes: `Gerado via Acerto de Consignação (${acertoConsignment.id})`,
      });
    }
    if (onExecuteExchange) {
      onExecuteExchange(exchangeNote);
    }
    if (onUpdateConsignment) {
      onUpdateConsignment({
        ...acertoConsignment,
        lastAuditDate: getTodayBR(),
      });
    }

    setIsAcertoModalOpen(false);
    setAcertoConsignment(null);
  };

  const handleStartEditConsignment = (c: Consignment) => {
    setEditingConsignmentId(c.id);
    setEditSelectedClientId(c.clientId || clients[0]?.id || '');
    setEditDeliveryDate(c.date || getTodayBR());
    setEditStatus((c.status as any) || 'Em andamento');
    setEditItems(c.items ? c.items.map((i) => ({ ...i })) : []);
    setEditNotes(c.notes || '');
    setIsEditModalOpen(true);
  };

  const handleAddProductToEditItems = (prod: Product) => {
    const existingIndex = editItems.findIndex((i) => i.productId === prod.id);
    if (existingIndex >= 0) {
      const updated = [...editItems];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setEditItems(updated);
    } else {
      setEditItems([
        ...editItems,
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          quantity: 1,
          unitPrice: prod.standardPrice,
          subtotal: prod.standardPrice,
        },
      ]);
    }
  };

  const handleSaveEditedConsignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConsignmentId || editItems.length === 0) return;

    const targetClient = clients.find((cli) => cli.id === editSelectedClientId);
    const totalQty = editItems.reduce((acc, i) => acc + i.quantity, 0);
    const totalVal = editItems.reduce((acc, i) => acc + i.subtotal, 0);

    const updatedConsignment: Consignment = {
      id: editingConsignmentId,
      clientId: editSelectedClientId,
      clientName: targetClient?.name || 'Cliente Consignado',
      date: editDeliveryDate,
      itemsCount: totalQty,
      totalValue: totalVal,
      status: editStatus,
      lastAuditDate: getTodayBR(),
      items: editItems,
      notes: editNotes,
    };

    if (onUpdateConsignment) {
      onUpdateConsignment(updatedConsignment);
    }
    setIsEditModalOpen(false);
    setEditingConsignmentId(null);
  };

  const getConsignmentLatestAuditDate = (
    cons: Consignment,
    exList: ExchangeNote[] = [],
    vList: Visit[] = []
  ): string => {
    let latestDate: Date | null = parseBRDate(cons.lastAuditDate) || parseBRDate(cons.date);
    let latestStr: string = cons.lastAuditDate || cons.date || getTodayBR();

    const clientExchanges = exList.filter(
      (e) =>
        (e.clientId && cons.clientId && e.clientId === cons.clientId) ||
        (e.clientName && cons.clientName && e.clientName.toLowerCase().trim() === cons.clientName.toLowerCase().trim())
    );

    clientExchanges.forEach((ex) => {
      const rawDate = ex.date || (ex as any).created_at || (ex as any).createdAt;
      const exDate = parseBRDate(rawDate);
      if (exDate && (!latestDate || exDate.getTime() > latestDate.getTime())) {
        latestDate = exDate;
        latestStr = rawDate;
      }
    });

    const clientVisits = vList.filter(
      (v) =>
        (v.clientId && cons.clientId && v.clientId === cons.clientId) ||
        (v.clientName && cons.clientName && v.clientName.toLowerCase().trim() === cons.clientName.toLowerCase().trim())
    );

    clientVisits.forEach((v) => {
      const rawVDate = v.completedAt || v.lastVisitText || v.scheduledDate;
      const vDate = parseBRDate(rawVDate);
      if (vDate && (!latestDate || vDate.getTime() > latestDate.getTime())) {
        latestDate = vDate;
        latestStr = rawVDate;
      }
    });

    return latestStr;
  };

  const getConsignmentDeductedStats = (cons: Consignment, exList: ExchangeNote[]) => {
    const clientExchanges = exList.filter(
      (e) =>
        (e.clientId && cons.clientId && e.clientId === cons.clientId) ||
        (e.clientName && cons.clientName && e.clientName.toLowerCase().trim() === cons.clientName.toLowerCase().trim())
    );

    if (clientExchanges.length === 0) {
      return {
        itemsCount: cons.itemsCount,
        totalValue: cons.totalValue,
      };
    }

    let totalRemovedQty = 0;
    let totalRemovedValue = 0;

    clientExchanges.forEach((ex) => {
      (ex.itemsRemoved || []).forEach((remItem) => {
        const qty = Number(remItem.quantity) || 0;
        totalRemovedQty += qty;

        const consItem = (cons.items || []).find(
          (ci) =>
            (remItem.productId && ci.productId && remItem.productId === ci.productId) ||
            (remItem.productName && ci.productName && remItem.productName.toLowerCase().trim() === ci.productName.toLowerCase().trim())
        );
        const unitPrice = consItem ? consItem.unitPrice : 6.0;
        totalRemovedValue += qty * unitPrice;
      });
    });

    return {
      itemsCount: Math.max(0, cons.itemsCount - totalRemovedQty),
      totalValue: Math.max(0, cons.totalValue - totalRemovedValue),
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-indigo-600" />
            Remessas de Consignação
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Controle o envio e a alocação inicial de mercadorias nos pontos de venda.
          </p>
        </div>

        <button
          onClick={() => setIsWizardOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Consignação
        </button>
      </div>

      {/* Table search filter & view mode toggle */}
      <div className="bg-white dark:bg-[#12151c] p-4 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código de remessa (REM-...) ou nome do cliente..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center justify-center bg-slate-100 dark:bg-[#181c26] p-1 rounded-xl border border-slate-200 dark:border-[#202531] shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${viewMode === 'grid'
              ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            title="Visualização em Cards / Grid"
          >
            <Grid className="w-4 h-4" />
            <span>Grid</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${viewMode === 'table'
              ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            title="Visualização em Lista / Tabela"
          >
            <List className="w-4 h-4" />
            <span>Lista</span>
          </button>
        </div>
      </div>

      {/* Consignment Table / Cards */}
      {filteredConsignments.length === 0 ? (
        <div className="bg-white dark:bg-[#12151c] rounded-2xl border border-slate-200/80 dark:border-[#202531] p-12 text-center shadow-xs space-y-3">
          <Boxes className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">Nenhuma remessa de consignação encontrada</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Registre envios e alocações de mercadorias para seus estabelecimentos parceiros.
          </p>
          <div className="flex gap-2 justify-center mt-4">
            {onClearConsignments && consignments.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja apagar TODOS os registros de consignação?')) {
                    onClearConsignments();
                  }
                }}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-xs cursor-pointer flex items-center justify-center gap-2 transition-colors border border-rose-100"
              >
                <Trash2 className="w-4 h-4" />
                Limpar Consignações
              </button>
            )}
            <button
              onClick={() => setIsWizardOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Registrar Primeira Consignação
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Cards Grid Layout */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConsignments.map((c) => {
                const stats = getConsignmentDeductedStats(c, exchanges);
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedConsignment(c)}
                    className="bg-white dark:bg-[#12151c] p-4 rounded-2xl border border-slate-200/90 dark:border-[#202531] shadow-xs space-y-3 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Card Header: REM ID & Status */}
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg">
                          {c.id}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                          {c.status}
                        </span>
                      </div>

                      {/* Card Body: Client, Items & Valuation */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{c.clientName}</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Data: {formatDateBR(c.date)} • {stats.itemsCount} {stats.itemsCount === 1 ? 'item' : 'itens'}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Última conferência: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatDateBR(getConsignmentLatestAuditDate(c, exchanges, visits))}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-medium block">Valor Mercadorias</span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                            R$ {stats.totalValue.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-[#202531] flex items-center justify-between gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartAcerto(c);
                        }}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                        title="Realizar Acerto e Faturar Venda"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Acerto</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedConsignment(c);
                        }}
                        className="flex-1 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" /> PDF
                      </button>
                      {onUpdateConsignment && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditConsignment(c);
                          }}
                          className="px-2.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 dark:text-amber-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          title="Editar Remessa"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                      )}
                      {onDeleteConsignment && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Tem certeza que deseja excluir a remessa ${c.id} de todo o sistema?`)) {
                              onDeleteConsignment(c.id);
                            }
                          }}
                          className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 dark:text-rose-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          title="Excluir Remessa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Table List Layout */}
          {viewMode === 'table' && (
            <div className="bg-white dark:bg-[#12151c] rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#181c26] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-4 whitespace-nowrap">Número</th>
                      <th className="p-4 whitespace-nowrap">Cliente</th>
                      <th className="p-4 whitespace-nowrap">Data</th>
                      <th className="p-4 text-center whitespace-nowrap">Quantidade</th>
                      <th className="p-4 text-right whitespace-nowrap">Valor em Mercadorias</th>
                      <th className="p-4 text-center whitespace-nowrap">Status</th>
                      <th className="p-4 whitespace-nowrap">Última Conferência</th>
                      <th className="p-4 text-right whitespace-nowrap">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                    {filteredConsignments.map((c) => {
                      const stats = getConsignmentDeductedStats(c, exchanges);
                      return (
                        <tr
                          key={c.id}
                          onClick={() => setSelectedConsignment(c)}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                        >
                          <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{c.id}</td>
                          <td className="p-4 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{c.clientName}</td>
                          <td className="p-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDateBR(c.date)}</td>
                          <td className="p-4 text-center font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{stats.itemsCount} itens</td>
                          <td className="p-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap">
                            R$ {stats.totalValue.toFixed(2).replace('.', ',')}
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 inline-flex items-center justify-center gap-1 whitespace-nowrap">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>{c.status}</span>
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDateBR(getConsignmentLatestAuditDate(c, exchanges, visits))}</td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartAcerto(c);
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer text-xs transition-colors shrink-0 whitespace-nowrap shadow-xs"
                                title="Realizar Acerto e Faturar Venda"
                              >
                                <DollarSign className="w-3.5 h-3.5" /> Acerto
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedConsignment(c);
                                }}
                                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer text-xs transition-colors shrink-0 whitespace-nowrap"
                              >
                                <Printer className="w-3.5 h-3.5" /> Ver PDF
                              </button>
                              {onUpdateConsignment && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEditConsignment(c);
                                  }}
                                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 dark:text-amber-400 rounded-lg font-semibold flex items-center gap-1 cursor-pointer text-xs transition-colors shrink-0 whitespace-nowrap"
                                  title="Editar Remessa"
                                >
                                  <Edit className="w-3.5 h-3.5" /> Editar
                                </button>
                              )}
                              {onDeleteConsignment && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Tem certeza que deseja excluir a remessa ${c.id} de todo o sistema?`)) {
                                      onDeleteConsignment(c.id);
                                    }
                                  }}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 dark:text-rose-400 rounded-lg font-semibold flex items-center gap-1 cursor-pointer text-xs transition-colors shrink-0 whitespace-nowrap"
                                  title="Excluir Remessa"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de Acerto de Consignação */}
      {isAcertoModalOpen && acertoConsignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-2 sm:p-4 md:p-6">
          <div className="bg-white dark:bg-[#12151c] w-full max-w-4xl rounded-2xl border border-slate-300 dark:border-[#202531] overflow-hidden max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 shadow-2xl">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#202531] flex items-center justify-between bg-slate-50 dark:bg-[#181c26] shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    Realizar Acerto de Consignação — {acertoConsignment.clientName}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Selecione as peças vendidas no ponto de venda para faturar e dar baixa no expositor ({acertoConsignment.id}).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAcertoModalOpen(false);
                  setAcertoConsignment(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAcerto} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* Table of products */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center justify-between">
                  <span>📦 Produtos Alocados no Expositor</span>
                  <span className="text-slate-500 font-normal">Informe a quantidade vendida de cada item</span>
                </h4>

                <div className="border border-slate-200 dark:border-[#202531] rounded-xl overflow-hidden bg-white dark:bg-[#12151c]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-[#181c26] text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-[#202531]">
                      <tr>
                        <th className="p-3">Produto</th>
                        <th className="p-3 text-center">Alocado Atual</th>
                        <th className="p-3 text-center">Quantidade Vendida</th>
                        <th className="p-3 text-right">Preço Unit.</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                      {(acertoConsignment.items || []).map((item) => {
                        const key = item.productId || item.productName;

                        const clientExchanges = exchanges.filter(
                          (e) =>
                            (e.clientId && acertoConsignment.clientId && e.clientId === acertoConsignment.clientId) ||
                            (e.clientName && acertoConsignment.clientName && e.clientName.toLowerCase().trim() === acertoConsignment.clientName.toLowerCase().trim())
                        );

                        let removedQty = 0;
                        clientExchanges.forEach((ex) => {
                          (ex.itemsRemoved || []).forEach((rem) => {
                            if (
                              (rem.productId && item.productId && rem.productId === item.productId) ||
                              (rem.productName && item.productName && rem.productName.toLowerCase().trim() === item.productName.toLowerCase().trim())
                            ) {
                              removedQty += Number(rem.quantity) || 0;
                            }
                          });
                        });

                        const currentQtyOnSite = Math.max(0, item.quantity - removedQty);
                        const soldQty = Number(acertoQuantities[key]) || 0;

                        return (
                          <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{item.productName}</td>
                            <td className="p-3 text-center text-slate-600 dark:text-slate-400 font-semibold">{currentQtyOnSite} un</td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newQty = Math.max(0, soldQty - 1);
                                    setAcertoQuantities((prev) => ({ ...prev, [key]: newQty }));
                                  }}
                                  className="w-7 h-7 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  max={currentQtyOnSite}
                                  value={soldQty}
                                  onChange={(e) => {
                                    const val = Math.min(currentQtyOnSite, Math.max(0, Number(e.target.value) || 0));
                                    setAcertoQuantities((prev) => ({ ...prev, [key]: val }));
                                  }}
                                  className="w-14 text-center px-1 py-1 border border-slate-300 dark:border-slate-700 rounded-lg font-bold bg-white dark:bg-[#181c26] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newQty = Math.min(currentQtyOnSite, soldQty + 1);
                                    setAcertoQuantities((prev) => ({ ...prev, [key]: newQty }));
                                  }}
                                  className="w-7 h-7 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAcertoQuantities((prev) => ({ ...prev, [key]: currentQtyOnSite }));
                                  }}
                                  className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[10px] font-bold rounded-lg transition-colors cursor-pointer border border-emerald-200/60 dark:border-emerald-900/50"
                                >
                                  Tudo
                                </button>
                              </div>
                            </td>
                            <td className="p-3 text-right text-slate-600 dark:text-slate-400">R$ {item.unitPrice.toFixed(2).replace('.', ',')}</td>
                            <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                              R$ {(soldQty * item.unitPrice).toFixed(2).replace('.', ',')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment & Date Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-[#181c26] rounded-2xl border border-slate-200/80 dark:border-[#202531]">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500" /> Status do Pagamento *
                  </label>
                  <select
                    value={acertoPaymentStatus}
                    onChange={(e) => setAcertoPaymentStatus(e.target.value as 'aguardando_pagamento' | 'pago')}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#12151c] border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="aguardando_pagamento">⏳ Aguardando Pagamento (Lança em Contas a Receber)</option>
                    <option value="pago">✅ Já Pago / Recebido na Hora (Lança no Caixa)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs mb-1.5 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Forma de Pagamento *
                  </label>
                  <select
                    value={acertoPaymentMethod}
                    onChange={(e) => setAcertoPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#12151c] border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="PIX">⚡ PIX</option>
                    <option value="Dinheiro">💵 Dinheiro</option>
                    <option value="Cartão de Crédito">💳 Cartão de Crédito</option>
                    <option value="Cartão de Débito">💳 Cartão de Débito</option>
                    <option value="Transferência / Boleto">📑 Transferência / Boleto</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Data do Acerto *
                  </label>
                  <input
                    type="text"
                    value={acertoDate}
                    onChange={(e) => setAcertoDate(e.target.value)}
                    placeholder="DD/MM/AAAA"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#12151c] border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs mb-1.5">
                    Observações do Acerto (Opcional)
                  </label>
                  <input
                    type="text"
                    value={acertoNotes}
                    onChange={(e) => setAcertoNotes(e.target.value)}
                    placeholder="Ex: Acerto referente à conferência quinzenal presencial..."
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#12151c] border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Live Total & Submit Footer */}
              {(() => {
                let totalSoldQty = 0;
                let totalSoldValuation = 0;

                (acertoConsignment.items || []).forEach((item) => {
                  const key = item.productId || item.productName;
                  const soldQty = Number(acertoQuantities[key]) || 0;
                  totalSoldQty += soldQty;
                  totalSoldValuation += soldQty * item.unitPrice;
                });

                return (
                  <div className="pt-4 border-t border-slate-200 dark:border-[#202531] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-left w-full sm:w-auto">
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                        Resumo do Acerto ({totalSoldQty} {totalSoldQty === 1 ? 'peça vendida' : 'peças vendidas'})
                      </span>
                      <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                        Total: R$ {totalSoldValuation.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAcertoModalOpen(false);
                          setAcertoConsignment(null);
                        }}
                        className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={totalSoldQty === 0}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${totalSoldQty > 0
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                          }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>Confirmar Acerto & Gerar Pedido (R$ {totalSoldValuation.toFixed(2).replace('.', ',')})</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </form>
          </div>
        </div>
      )}

      {/* Nova Consignação Modal Wizard */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-2 sm:p-4 md:p-6">
          <div className="bg-white w-full max-w-[96vw] xl:max-w-7xl rounded-2xl border border-slate-300 overflow-hidden max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <Boxes className="w-6 h-6 text-indigo-600" />
                Registrar Nova Consignação em Cliente
              </h3>
              <button
                type="button"
                onClick={() => setIsWizardOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 text-slate-600 cursor-pointer transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitConsignment} className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs flex-1">
              {/* 1. Client & Delivery Date Header Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Selecionar Cliente / Loja *</label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 bg-white"
                  >
                    {clients.map((cli) => (
                      <option key={cli.id} value={cli.id}>
                        {cli.name} ({cli.city} - {cli.state})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data de Entrega / Envio</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* Selected Client Info Card */}
              {selectedClient && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1 text-slate-600">
                  <p>
                    <strong>Endereço:</strong> {selectedClient.street}, {selectedClient.number} -{' '}
                    {selectedClient.neighborhood}, {selectedClient.city} / {selectedClient.state}
                  </p>
                  <p>
                    <strong>Responsável:</strong> {selectedClient.responsible} ({selectedClient.phone || selectedClient.whatsapp})
                  </p>
                </div>
              )}

              {/* 2. Full Product Catalog Search Combobox */}
              {products.length > 0 && (
                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-2 relative z-30">
                  <label className="block font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center justify-between">
                    <span>Adicionar Produtos do Catálogo ({products.length} itens disponíveis):</span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">Pesquisa Instantânea</span>
                  </label>
                  <ProductSelectCombobox
                    products={products}
                    onSelectProduct={handleAddProductToConsignment}
                    isCashPayment={false}
                  />
                </div>
              )}

              {/* 3. Items Table - Full 100% Width */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <span>Produtos da Remessa de Consignação ({items.length})</span>
                  </h4>
                </div>

                {items.length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400 space-y-1">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-bold text-slate-700">Nenhum produto adicionado à remessa</p>
                    <p className="text-[11px]">Use a caixa de pesquisa acima para selecionar e incluir produtos no consignado.</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Items Cards (< 768px) */}
                    <div className="block md:hidden space-y-3">
                      {items.map((item, idx) => (
                        <div key={item.productId} className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h5 className="font-bold text-slate-900 text-xs">{item.productName}</h5>
                              <p className="text-[11px] text-slate-500 font-mono">SKU: {item.sku}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">Qtd:</span>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItemQuantity(idx, Number(e.target.value))}
                                className="w-16 text-center px-2 py-1 border border-slate-200 rounded-lg font-bold"
                              />
                            </div>
                            <div className="text-right">
                              <span className="text-slate-400 text-[10px] block">Subtotal</span>
                              <span className="font-bold text-emerald-600">R$ {item.subtotal.toFixed(2).replace('.', ',')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table (>= 768px) */}
                    <div className="hidden md:block border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                          <tr>
                            <th className="p-3.5">Produto</th>
                            <th className="p-3.5 text-center">Quantidade Enviada</th>
                            <th className="p-3.5 text-right">Preço Unit.</th>
                            <th className="p-3.5 text-right">Subtotal</th>
                            <th className="p-3.5 text-center">Remover</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {items.map((item, idx) => (
                            <tr key={item.productId} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3.5 font-bold text-slate-900">
                                {item.productName}
                                <span className="block text-[11px] text-slate-400 font-normal font-mono">SKU: {item.sku}</span>
                              </td>
                              <td className="p-3.5 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateItemQuantity(idx, Number(e.target.value))}
                                  className="w-20 text-center px-2.5 py-1.5 border border-slate-200 rounded-xl font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                              </td>
                              <td className="p-3.5 text-right text-slate-700 font-semibold">
                                R$ {item.unitPrice.toFixed(2).replace('.', ',')}
                              </td>
                              <td className="p-3.5 text-right font-extrabold text-emerald-600 text-sm">
                                R$ {item.subtotal.toFixed(2).replace('.', ',')}
                              </td>
                              <td className="p-3.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Remover produto da remessa"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-500" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* 4. Bottom Observações & Summary Totals Card */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2 space-y-1">
                  <label className="block font-semibold text-slate-700">Observações de Entrega / Notas da Remessa</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Instruções sobre colocação do expositor, itens em promoção, observações..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs text-slate-900"
                  />
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 text-right">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Quantidade Total:</span>
                    <span className="font-bold text-slate-900">{totalQuantity} un</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="font-bold text-slate-900 text-xs">Valor Mercadorias:</span>
                    <span className="text-xl font-black text-emerald-600">
                      R$ {totalValuation.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Modal Footer Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={items.length === 0}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <Boxes className="w-4 h-4" />
                  <span>Registrar Consignação</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✏️ Modal de Edição de Consignação */}
      {isEditModalOpen && editingConsignmentId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-2 sm:p-4 md:p-6">
          <div className="bg-white dark:bg-[#12151c] w-full max-w-[96vw] xl:max-w-4xl rounded-2xl border border-slate-300 dark:border-[#202531] overflow-hidden max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 shadow-2xl">
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#181c26]">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-500" />
                Editar Remessa de Consignação ({editingConsignmentId})
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedConsignment} className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cliente / Estabelecimento
                  </label>
                  <select
                    value={editSelectedClientId}
                    onChange={(e) => setEditSelectedClientId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/20"
                  >
                    {clients.map((cli) => (
                      <option key={cli.id} value={cli.id}>
                        {cli.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data da Remessa
                  </label>
                  <input
                    type="date"
                    value={editDeliveryDate}
                    onChange={(e) => setEditDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status da Remessa
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="Em andamento">Em andamento</option>
                    <option value="Finalizada">Finalizada (Auditada / Faturada)</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Adicionar Produtos à Remessa
                </label>
                <ProductSelectCombobox
                  products={products}
                  onSelectProduct={handleAddProductToEditItems}
                  placeholder="Buscar produto do catálogo 3D..."
                />
              </div>

              {/* Edit Items List */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Produtos em Consignação ({editItems.reduce((sum, i) => sum + i.quantity, 0)} unidades)
                </h4>
                {editItems.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-4 text-center bg-slate-50 dark:bg-[#181c26] rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    Nenhum produto adicionado. Adicione acima.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {editItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 dark:bg-[#181c26] rounded-xl border border-slate-200 dark:border-[#202531] flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{item.productName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{item.sku}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const qty = Math.max(1, parseInt(e.target.value) || 1);
                              const updated = [...editItems];
                              updated[idx].quantity = qty;
                              updated[idx].subtotal = qty * updated[idx].unitPrice;
                              setEditItems(updated);
                            }}
                            className="w-16 px-2 py-1 bg-white dark:bg-[#12151c] border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-center text-slate-900 dark:text-slate-100 text-xs"
                          />
                          <span className="text-slate-400">×</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            R$ {item.unitPrice.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 min-w-[70px] text-right">
                            R$ {item.subtotal.toFixed(2).replace('.', ',')}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditItems(editItems.filter((_, i) => i !== idx))}
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observações / Notas Gerais
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  placeholder="Informações sobre expositores, reposições ou acordos..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Total Atualizado</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    R$ {editItems.reduce((acc, i) => acc + i.subtotal, 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={editItems.length === 0}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📄 Modal de Detalhes da Consignação & Comprovante PDF A4 */}
      {selectedConsignment && (() => {
        const clientExchanges = exchanges.filter(
          (e) =>
            (e.clientId && selectedConsignment.clientId && e.clientId === selectedConsignment.clientId) ||
            (e.clientName &&
              selectedConsignment.clientName &&
              e.clientName.toLowerCase().trim() === selectedConsignment.clientName.toLowerCase().trim())
        );

        let totalRemovedQty = 0;
        let totalRemovedValue = 0;

        clientExchanges.forEach((ex) => {
          (ex.itemsRemoved || []).forEach((remItem) => {
            const qty = Number(remItem.quantity) || 0;
            totalRemovedQty += qty;

            const consItem = (selectedConsignment.items || []).find(
              (ci) =>
                (remItem.productId && ci.productId && remItem.productId === ci.productId) ||
                (remItem.productName && ci.productName && remItem.productName.toLowerCase().trim() === ci.productName.toLowerCase().trim())
            );
            const unitPrice = consItem ? consItem.unitPrice : 6.0;
            totalRemovedValue += qty * unitPrice;
          });
        });

        const currentQtyOnSite = Math.max(0, selectedConsignment.itemsCount - totalRemovedQty);
        const currentValuationOnSite = Math.max(0, selectedConsignment.totalValue - totalRemovedValue);

        const isPaidExchange = (ex: ExchangeNote) => {
          const dest = (ex.destinationClientName || '').toLowerCase();
          const notes = (ex.notes || '').toLowerCase();

          if (dest.includes('venda') || dest.includes('acerto') || dest.includes('pdv') || dest.includes('faturad')) return true;
          if (notes.includes('venda') || notes.includes('pedido #') || notes.includes('acerto') || notes.includes('faturad') || notes.includes('baixa') || notes.includes('pago')) return true;

          if (
            ex.itemsRemoved &&
            ex.itemsRemoved.some((i) => {
              const r = (i.reason || '').toLowerCase();
              return (
                r.includes('vendido') ||
                r.includes('acerto') ||
                r.includes('pdv') ||
                r.includes('baixa') ||
                r.includes('pago') ||
                r.includes('faturad')
              );
            })
          )
            return true;

          return false;
        };

        const paidExchanges = clientExchanges.filter(isPaidExchange);
        const remanejadoExchanges = clientExchanges.filter((ex) => !isPaidExchange(ex));

        const getConsignmentUnitPrice = (productName: string, productId?: string) => {
          const item = (selectedConsignment.items || []).find(
            (ci) =>
              (productId && ci.productId && ci.productId === productId) ||
              (productName && ci.productName && ci.productName.toLowerCase().trim() === productName.toLowerCase().trim())
          );
          return item ? item.unitPrice : 0;
        };

        const activeItemsOnSite = (selectedConsignment.items || [])
          .map((consItem) => {
            let itemRemovedQty = 0;
            clientExchanges.forEach((ex) => {
              (ex.itemsRemoved || []).forEach((rem) => {
                if (
                  (rem.productId && consItem.productId && rem.productId === consItem.productId) ||
                  (rem.productName && consItem.productName && rem.productName.toLowerCase().trim() === consItem.productName.toLowerCase().trim())
                ) {
                  itemRemovedQty += Number(rem.quantity) || 0;
                }
              });
            });
            const remainingQty = Math.max(0, consItem.quantity - itemRemovedQty);
            return {
              ...consItem,
              remainingQty,
              remainingSubtotal: remainingQty * consItem.unitPrice,
            };
          })
          .filter((i) => i.remainingQty > 0);

        const handleToggleExchangeStatus = (ex: ExchangeNote, targetType: 'paid' | 'remanejado') => {
          const updatedExchange: ExchangeNote = {
            ...ex,
            destinationClientName: targetType === 'paid' ? 'Venda Consignada Auditada' : 'Estoque Geral (Oficina RN 3D)',
            notes: targetType === 'paid' ? 'Acerto de Consignação (Baixa por Venda)' : 'Remanejamento de estoque',
            itemsRemoved: (ex.itemsRemoved || []).map((item) => ({
              ...item,
              reason: targetType === 'paid' ? 'Vendido no PDV (Acerto — Baixa)' : 'Remanejamento / Recolhimento para Oficina',
            })),
          };

          if (onExecuteExchange) {
            onExecuteExchange(updatedExchange);
          }
        };

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
            <style>{`
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 10mm 12mm;
                }

                body * {
                  visibility: hidden !important;
                }

                .print-container, .print-container * {
                  visibility: visible !important;
                }

                .print-container {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  border: none !important;
                  border-radius: 0 !important;
                  box-shadow: none !important;
                  max-height: none !important;
                  height: auto !important;
                  overflow: visible !important;
                  background: white !important;
                  color: black !important;
                }

                .fixed.inset-0 {
                  position: absolute !important;
                  inset: 0 !important;
                  background: white !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  overflow: visible !important;
                  display: block !important;
                  z-index: 99999 !important;
                }

                .print-sheet {
                  padding: 0 !important;
                  margin: 0 !important;
                  height: auto !important;
                  max-height: none !important;
                  overflow: visible !important;
                  background: white !important;
                  color: black !important;
                }

                .no-print {
                  display: none !important;
                }

                tr, .print-avoid-break {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
              }
            `}</style>

            <div className="print-container bg-white dark:bg-[#12151c] w-full max-w-3xl rounded-2xl border border-slate-300 dark:border-[#202531] overflow-hidden flex flex-col max-h-[92vh] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Top Controls (Hidden on Print) */}
              <div className="no-print p-4 bg-slate-900 dark:bg-[#181c26] text-white flex items-center justify-between shrink-0 border-b border-slate-800 dark:border-[#202531]">
                <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <Printer className="w-4 h-4 text-indigo-400" />
                  Comprovante de Remessa em Consignação ({selectedConsignment.id})
                </span>
                <div className="flex items-center gap-2 sm:gap-3">
                  {onUpdateConsignment && (
                    <button
                      onClick={() => {
                        const toEdit = selectedConsignment;
                        setSelectedConsignment(null);
                        handleStartEditConsignment(toEdit);
                      }}
                      className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
                    >
                      <Edit className="w-4 h-4" /> Editar
                    </button>
                  )}
                  {onDeleteConsignment && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Tem certeza que deseja excluir a remessa ${selectedConsignment.id} de todo o sistema?`)) {
                          onDeleteConsignment(selectedConsignment.id);
                          setSelectedConsignment(null);
                        }
                      }}
                      className="px-3 py-2 bg-rose-600/80 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" /> Excluir
                    </button>
                  )}
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 text-xs transition-colors cursor-pointer shadow-sm"
                  >
                    <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
                  </button>
                  <button
                    onClick={() => setSelectedConsignment(null)}
                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* A4 Printed Sheet Document */}
              <div className="print-sheet p-8 sm:p-10 overflow-y-auto space-y-6 text-xs bg-white text-slate-900 font-sans flex-1">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">RN 3D Soluções</h2>
                    <p className="text-xs font-black text-slate-900 mt-1">CNPJ: 67.570.155/0001-34</p>
                    <p className="text-[11px] text-slate-700 font-semibold mt-1">
                      WhatsApp: (22) 99754-0815 • Instagram: @rn3d.solucoes
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-indigo-600 text-white font-mono font-bold rounded-md text-xs inline-block">
                      REMESSA {selectedConsignment.id}
                    </span>
                    <p className="text-slate-500 mt-2 text-xs font-medium">Data Envio: {formatDateBR(selectedConsignment.date)}</p>
                    <p className="text-slate-500 text-xs font-medium">Status: <span className="font-bold text-emerald-600">{selectedConsignment.status}</span></p>
                  </div>
                </div>

                {/* Client Details Box */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <p className="font-bold text-slate-900 text-sm uppercase">ESTABELECIMENTO / CLIENTE: {selectedConsignment.clientName}</p>
                  <p className="text-slate-600 font-medium">Modalidade: Alocação Inicial de Produtos em Consignação</p>
                  <p className="text-slate-500 text-[11px]">Última Conferência Auditada: {formatDateBR(getConsignmentLatestAuditDate(selectedConsignment, exchanges, visits))}</p>
                </div>

                {/* Items Table */}
                <div className="space-y-2">
                  <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-xs flex items-center justify-between border-b border-slate-200 pb-1">
                    <span>📦 Produtos Entregues / Alocados no Expositor (Inicial)</span>
                    <span className="font-mono text-indigo-700 font-bold">
                      Total: {selectedConsignment.itemsCount} unidades
                    </span>
                  </h3>
                  <table className="w-full text-left border-collapse border border-slate-200">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] bg-slate-50">
                        <th className="p-2">Item / Descrição do Produto</th>
                        <th className="p-2 text-center">SKU</th>
                        <th className="p-2 text-center">Quantidade</th>
                        <th className="p-2 text-right">Preço Unit.</th>
                        <th className="p-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(selectedConsignment.items || []).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2 font-bold text-slate-900">{item.productName}</td>
                          <td className="p-2 text-center font-mono text-slate-500">{item.sku || 'N/A'}</td>
                          <td className="p-2 text-center font-extrabold text-slate-900">{item.quantity} un</td>
                          <td className="p-2 text-right text-slate-700">R$ {item.unitPrice.toFixed(2).replace('.', ',')}</td>
                          <td className="p-2 text-right font-extrabold text-emerald-600">R$ {item.subtotal.toFixed(2).replace('.', ',')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mechanism 1: Itens Quitados / Pagos (Vendas Auditadas & Faturadas) */}
                {paidExchanges.length > 0 && (
                  <div className="p-4 bg-emerald-50/90 border border-emerald-300 rounded-xl space-y-3 print-avoid-break">
                    <h4 className="font-extrabold text-emerald-950 text-xs flex items-center justify-between border-b border-emerald-200 pb-2">
                      <span className="flex items-center gap-1.5">
                        <span className="text-emerald-600">✅</span>
                        <span>Itens Quitados / Pagos — Baixa Registrada (Não Cobrar Novamente)</span>
                      </span>
                      <span className="font-mono text-[11px] bg-emerald-200/90 px-2.5 py-0.5 rounded-md text-emerald-950 font-bold">
                        {paidExchanges.length} nota(s) baixada(s)
                      </span>
                    </h4>
                    <div className="space-y-2.5 text-[11px]">
                      {paidExchanges.map((ex) => {
                        let notePaidTotal = 0;
                        let notePaidQty = 0;
                        return (
                          <div
                            key={ex.id}
                            className="bg-white p-3 rounded-lg border border-emerald-200 shadow-2xs space-y-2"
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                                  {ex.id}
                                </span>
                                <span className="text-slate-600 font-semibold">{formatDateBR(ex.date)}</span>
                                {ex.responsible && (
                                  <span className="text-slate-500 text-[10px]">({ex.responsible})</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md border border-emerald-300">
                                  DEU BAIXA — PAGO
                                </span>
                                {onExecuteExchange && (
                                  <button
                                    onClick={() => handleToggleExchangeStatus(ex, 'remanejado')}
                                    className="no-print text-[10px] text-sky-700 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded border border-sky-200 font-bold cursor-pointer transition-colors"
                                    title="Clique para alterar a classificação desta nota para Remanejamento"
                                  >
                                    🔄 Mudar p/ Remanejado
                                  </button>
                                )}
                              </div>
                            </div>
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="text-slate-500 uppercase text-[9px] border-b border-slate-100 bg-slate-50/50">
                                  <th className="p-1 font-bold">Item Vendido / Baixado</th>
                                  <th className="p-1 text-center font-bold">Qtd Baixada</th>
                                  <th className="p-1 text-right font-bold">Preço Unit.</th>
                                  <th className="p-1 text-right font-bold">Total Quitado</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {ex.itemsRemoved.map((item, iIdx) => {
                                  const unitPrice = getConsignmentUnitPrice(item.productName, item.productId);
                                  const subtotal = item.quantity * unitPrice;
                                  notePaidTotal += subtotal;
                                  notePaidQty += item.quantity;
                                  return (
                                    <tr key={iIdx} className="text-xs">
                                      <td className="p-1 font-bold text-slate-800">
                                        {item.productName}
                                        <span className="ml-2 text-[10px] text-emerald-600 font-normal italic">(Baixa por Venda)</span>
                                      </td>
                                      <td className="p-1 text-center font-extrabold text-slate-900">{item.quantity} un</td>
                                      <td className="p-1 text-right text-slate-600">R$ {unitPrice.toFixed(2).replace('.', ',')}</td>
                                      <td className="p-1 text-right font-extrabold text-emerald-700">R$ {subtotal.toFixed(2).replace('.', ',')}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                            <div className="pt-1 border-t border-emerald-100 flex justify-between items-center text-[11px] font-bold text-emerald-900">
                              <span>Total Baixado nesta Nota ({notePaidQty} un):</span>
                              <span className="font-black text-xs text-emerald-800">R$ {notePaidTotal.toFixed(2).replace('.', ',')}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Mechanism 2: Itens Remanejados / Devolvidos (Oficina ou Outra Loja) */}
                {remanejadoExchanges.length > 0 && (
                  <div className="p-4 bg-sky-50/90 border border-sky-300 rounded-xl space-y-3 print-avoid-break">
                    <h4 className="font-extrabold text-sky-950 text-xs flex items-center justify-between border-b border-sky-200 pb-2">
                      <span className="flex items-center gap-1.5">
                        <span className="text-sky-600">🔄</span>
                        <span>Itens Remanejados / Retirados (Oficina ou Outra Loja)</span>
                      </span>
                      <span className="font-mono text-[11px] bg-sky-200/90 px-2.5 py-0.5 rounded-md text-sky-950 font-bold">
                        {remanejadoExchanges.length} nota(s) de remanejamento
                      </span>
                    </h4>
                    <div className="space-y-2 text-[11px]">
                      {remanejadoExchanges.map((ex) => {
                        const totalRemoved = ex.itemsRemoved.reduce((acc, i) => acc + i.quantity, 0);
                        const destinationLabel =
                          ex.destinationClientName ||
                          (ex.type === 'recolhimento_oficina' ? 'Estoque Geral (Oficina RN 3D)' : 'Troca Direta / Outra Loja');

                        return (
                          <div
                            key={ex.id}
                            className="bg-white p-3 rounded-lg border border-sky-200 shadow-2xs space-y-2"
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md border border-sky-200">
                                  {ex.id}
                                </span>
                                <span className="text-slate-600 font-semibold">{formatDateBR(ex.date)}</span>
                                {ex.responsible && (
                                  <span className="text-slate-500 text-[10px]">({ex.responsible})</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sky-900 bg-sky-100 border border-sky-300 px-2.5 py-0.5 rounded-md text-xs">
                                  -{totalRemoved} un
                                </span>
                                {onExecuteExchange && (
                                  <button
                                    onClick={() => handleToggleExchangeStatus(ex, 'paid')}
                                    className="no-print text-[10px] text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 font-bold cursor-pointer transition-colors flex items-center gap-1"
                                    title="Clique para converter esta nota em Baixa por Venda / Pago"
                                  >
                                    🟢 Converter em Baixa (Vendido / Quitado)
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-600">
                              Destino / Motivo: <strong className="text-slate-900 font-bold">{destinationLabel}</strong>
                            </p>
                            <ul className="space-y-1 font-medium text-slate-800 text-xs pl-1">
                              {ex.itemsRemoved.map((item, iIdx) => (
                                <li key={iIdx} className="flex items-center justify-between">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0"></span>
                                    <span>{item.productName}</span>
                                    {item.reason && <span className="text-slate-400 text-[10px]">({item.reason})</span>}
                                  </span>
                                  <span className="font-bold text-sky-900 font-mono">-{item.quantity} un</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Summary Valuation & Remaining Active Stock */}
                <div className="print-avoid-break p-4 bg-emerald-50/90 rounded-xl border border-emerald-300 space-y-3 text-xs">
                  <div className="flex justify-between items-center border-b border-emerald-200 pb-2">
                    <div>
                      <span className="font-black text-emerald-950 text-xs uppercase block">📦 Saldo Atual Alocado no Expositor (Ativo na Loja)</span>
                      <span className="text-slate-700 font-bold">{currentQtyOnSite} produtos em exibição restante</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-600 text-[10px] uppercase font-bold block">Valor Total Auditado / A Cobrar</span>
                      <span className="text-xl font-black text-emerald-700">
                        R$ {currentValuationOnSite.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  {activeItemsOnSite.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-600 block">Detalhamento dos Itens Restantes na Loja:</span>
                      <table className="w-full text-left border-collapse bg-white rounded-lg border border-emerald-200 text-[11px]">
                        <thead>
                          <tr className="bg-emerald-100/60 text-emerald-950 text-[9px] uppercase font-bold border-b border-emerald-200">
                            <th className="p-1.5">Produto Restante</th>
                            <th className="p-1.5 text-center">Qtd Atual</th>
                            <th className="p-1.5 text-right">Preço Unit.</th>
                            <th className="p-1.5 text-right">Subtotal A Cobrar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {activeItemsOnSite.map((item, aIdx) => (
                            <tr key={aIdx}>
                              <td className="p-1.5 font-bold text-slate-900">{item.productName}</td>
                              <td className="p-1.5 text-center font-extrabold text-slate-900">{item.remainingQty} un</td>
                              <td className="p-1.5 text-right text-slate-600">R$ {item.unitPrice.toFixed(2).replace('.', ',')}</td>
                              <td className="p-1.5 text-right font-extrabold text-emerald-700">
                                R$ {item.remainingSubtotal.toFixed(2).replace('.', ',')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {selectedConsignment.notes && (
                  <div className="print-avoid-break p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block text-[11px]">Observações de Entrega:</span>
                    <p className="text-slate-600 italic text-[11px]">{selectedConsignment.notes}</p>
                  </div>
                )}

                {/* Signatures Footer */}
                <div className="print-avoid-break pt-10 grid grid-cols-2 gap-8 text-center text-slate-700 text-[11px]">
                  <div className="border-t border-slate-400 pt-2 space-y-0.5">
                    <p className="font-bold text-slate-900">{selectedConsignment.clientName}</p>
                    <p className="text-slate-500">Assinatura de Recebimento do Estabelecimento</p>
                  </div>
                  <div className="border-t border-slate-400 pt-2 space-y-0.5">
                    <p className="font-bold text-slate-900">RN 3D Soluções</p>
                    <p className="text-slate-500">Assinatura do Entregador / Responsável</p>
                  </div>
                </div>

                {/* Print Footer */}
                <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
                  RN 3D Soluções — Sistema de Controle de Consignação e Gestão 3D • Documento Gerado em {new Date().toLocaleDateString('pt-BR')}
                </div>
              </div>

              {/* Modal Bottom Controls (Hidden on Print) */}
              <div className="no-print p-4 bg-slate-50 dark:bg-[#181c26] border-t border-slate-200 dark:border-[#202531] flex items-center justify-between shrink-0">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">RN 3D Soluções — Impressão em Formato A4 Padronizado</span>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 text-xs shadow-sm transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Imprimir / Gerar PDF
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
