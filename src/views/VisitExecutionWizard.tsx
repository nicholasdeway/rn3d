import React, { useState, useMemo } from 'react';
import { Client, ClientInventoryItem, Product, Consignment } from '../types';
import { ProductSelectCombobox } from '../components/ProductSelectCombobox';
import {
  MapPin,
  CheckCircle2,
  DollarSign,
  Repeat,
  PackagePlus,
  Receipt,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  AlertCircle,
  Plus,
  Trash2,
  Printer,
  Truck,
  Boxes,
  ShoppingBag,
} from 'lucide-react';

interface VisitExecutionWizardProps {
  client: Client;
  inventory: ClientInventoryItem[];
  consignments?: Consignment[];
  allProducts: Product[];
  onCompleteVisit: (visitData: any) => void;
  onCancel: () => void;
}

export type VisitType = 'consignado' | 'entrega_pedido' | 'troca' | 'comercial';

export const VisitExecutionWizard: React.FC<VisitExecutionWizardProps> = ({
  client,
  inventory = [],
  consignments = [],
  allProducts = [],
  onCompleteVisit,
  onCancel,
}) => {
  // Step 0: Triagem do Objetivo da Visita
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [visitType, setVisitType] = useState<VisitType>('consignado');

  // 1. Reconcile effective inventory for client from clientInventories & consignments
  const effectiveInventory = useMemo(() => {
    const map = new Map<
      string,
      { productId: string; productName: string; currentQuantity: number; unitPrice: number }
    >();

    (inventory || []).forEach((item: any) => {
      const key = item.productId || item.id || item.productName?.toLowerCase().trim();
      const qty = item.quantityOnSite ?? item.currentQuantity ?? item.quantity ?? 0;
      if (key) {
        map.set(key, {
          productId: key,
          productName: item.productName || item.name || 'Produto',
          currentQuantity: qty,
          unitPrice: item.unitPrice || 6.0,
        });
      }
    });

    (consignments || []).forEach((c) => {
      const matchesClient =
        c.clientId === client.id ||
        (c.clientName && client.name && c.clientName.toLowerCase().trim() === client.name.toLowerCase().trim());

      if (matchesClient && c.items) {
        c.items.forEach((cItem) => {
          const key = cItem.productId || cItem.productName.toLowerCase().trim();
          if (!map.has(key) && cItem.quantity > 0) {
            map.set(key, {
              productId: key,
              productName: cItem.productName,
              currentQuantity: cItem.quantity,
              unitPrice: cItem.unitPrice || 6.0,
            });
          }
        });
      }
    });

    return Array.from(map.values());
  }, [inventory, consignments, client]);

  // Step 1: Conferência (Counted values)
  const [counts, setCounts] = useState<Record<string, number>>({});

  // Step 3: Trocas
  const [removals, setRemovals] = useState<Record<string, number>>({});
  const [additionsInExchange, setAdditionsInExchange] = useState<
    { productId: string; name: string; quantity: number }[]
  >([]);

  // Step 4: Reposição
  const [restocks, setRestocks] = useState<Record<string, number>>({});

  // Direct Delivery State (Entrega de Remessa com pagamento na hora)
  const [deliveryItems, setDeliveryItems] = useState<
    { productId: string; productName: string; quantity: number; unitPrice: number; subtotal: number }[]
  >([]);

  // Step 5: Pagamento
  const [paymentStatus, setPaymentStatus] = useState<'Pago integralmente' | 'Parcial' | 'Não pago'>('Pago integralmente');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'Dinheiro' | 'Cartão' | 'Outro'>('PIX');
  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState('');

  // Calculations for Consignado
  const auditCalculations = effectiveInventory.map((item) => {
    const counted = counts[item.productId] ?? item.currentQuantity;
    const sold = Math.max(0, item.currentQuantity - counted);
    const totalSalesValue = sold * item.unitPrice;
    return {
      ...item,
      counted,
      sold,
      totalSalesValue,
    };
  });

  const totalSoldUnits = auditCalculations.reduce((acc, i) => acc + i.sold, 0);
  const totalRevenueCalculated = auditCalculations.reduce((acc, i) => acc + i.totalSalesValue, 0);

  const totalItemsRemoved = (Object.values(removals) as number[]).reduce((acc, q) => acc + q, 0);
  const totalItemsAddedEx = additionsInExchange.reduce((acc, i) => acc + i.quantity, 0);
  const totalRestockUnits = (Object.values(restocks) as number[]).reduce((acc, q) => acc + q, 0);

  // Direct delivery totals
  const totalDeliveryItemsCount = deliveryItems.reduce((acc, i) => acc + i.quantity, 0);
  const totalDeliveryValue = deliveryItems.reduce((acc, i) => acc + i.subtotal, 0);

  const finalEstimatedStock = auditCalculations.reduce((acc, item) => {
    const rem = removals[item.productId] || 0;
    const addEx = additionsInExchange.find((a) => a.productId === item.productId)?.quantity || 0;
    const res = restocks[item.productId] || 0;
    return acc + (item.counted - rem + addEx + res);
  }, 0);

  // Dynamic Steps based on Visit Type
  const stepsMap: Record<VisitType, { number: number; title: string }[]> = {
    consignado: [
      { number: 1, title: 'Conferência' },
      { number: 2, title: 'Vendas' },
      { number: 3, title: 'Trocas' },
      { number: 4, title: 'Reposição' },
      { number: 5, title: 'Pagamento' },
      { number: 6, title: 'Resumo' },
    ],
    entrega_pedido: [
      { number: 1, title: 'Itens Entregues' },
      { number: 2, title: 'Pagamento na Hora' },
      { number: 3, title: 'Comprovante' },
    ],
    troca: [
      { number: 1, title: 'Troca de Peças' },
      { number: 2, title: 'Resumo da Troca' },
    ],
    comercial: [
      { number: 1, title: 'Anotações Comercial' },
      { number: 2, title: 'Concluir Visita' },
    ],
  };

  const currentSteps = stepsMap[visitType];
  const maxStep = currentSteps.length;

  const handleAddProductToDelivery = (prod: Product) => {
    const existingIdx = deliveryItems.findIndex((i) => i.productId === prod.id);
    if (existingIdx >= 0) {
      const updated = [...deliveryItems];
      updated[existingIdx].quantity += 1;
      updated[existingIdx].subtotal = updated[existingIdx].quantity * updated[existingIdx].unitPrice;
      setDeliveryItems(updated);
    } else {
      setDeliveryItems([
        ...deliveryItems,
        {
          productId: prod.id,
          productName: prod.name,
          quantity: 5,
          unitPrice: prod.standardPrice,
          subtotal: 5 * prod.standardPrice,
        },
      ]);
    }
  };

  return (
    <div className="bg-white dark:bg-[#12151c] text-slate-900 dark:text-slate-100 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xl overflow-hidden max-w-4xl mx-auto space-y-0 my-4 animate-in fade-in duration-200">
      {/* Top Wizard Header */}
      <div className="bg-slate-900 dark:bg-[#0c0e12] text-white p-6 flex items-center justify-between border-b border-slate-800 dark:border-[#202531]">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
            ATENDIMENTO PRESENCIAL — {visitType === 'entrega_pedido' ? 'ENTREGA DE REMESSA' : visitType === 'troca' ? 'TROCA / RECOLHIMENTO' : visitType === 'comercial' ? 'REUNIÃO COMERCIAL' : 'CONSIGNADO'}
          </span>
          <h2 className="text-xl font-bold">Realizar Visita — {client.name}</h2>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Stepper Progress Bar (Only visible if Step > 0) */}
      {currentStep > 0 && (
        <div className="bg-slate-50 dark:bg-[#181c26] border-b border-slate-200 dark:border-[#202531] p-4 overflow-x-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStep(0)}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs cursor-pointer mr-2 transition-colors"
            >
              ← Trocar Objetivo
            </button>
          </div>
          <div className="flex items-center justify-between min-w-max gap-2 px-2">
            {currentSteps.map((s) => {
              const isActive = currentStep === s.number;
              const isDone = currentStep > s.number;

              return (
                <div key={s.number} className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-indigo-600 dark:bg-indigo-600 text-white shadow-xs'
                        : isDone
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80'
                        : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                      {isDone ? '✓' : s.number}
                    </span>
                    <span>{s.title}</span>
                  </div>
                  {s.number < maxStep && <div className="w-6 h-0.5 bg-slate-200 dark:bg-slate-800 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Wizard Content Body */}
      <div className="p-6 space-y-6 text-xs">
        {/* STEP 0: TRIAGEM DO OBJETIVO DA VISITA */}
        {currentStep === 0 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Qual é o objetivo principal da visita hoje no cliente {client.name}?</h3>
              <p className="text-slate-600 dark:text-slate-300 text-xs mt-1">
                Selecione o tipo de atendimento presencial para adaptar as etapas e realizar o acerto na hora.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Consignado */}
              <button
                type="button"
                onClick={() => {
                  setVisitType('consignado');
                  setCurrentStep(1);
                }}
                className="p-5 bg-white dark:bg-[#181c26] hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 border-2 border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl text-left transition-all cursor-pointer group space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Boxes className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-900">
                    Consignado
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    Auditoria & Conferência de Consignado
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Contar itens no expositor, calcular vendas, fazer trocas, repor estoque e receber acerto.
                  </p>
                </div>
              </button>

              {/* Option 2: Entrega de Pedido / Remessa com Pagamento na Hora */}
              <button
                type="button"
                onClick={() => {
                  setVisitType('entrega_pedido');
                  setCurrentStep(1);
                }}
                className="p-5 bg-white dark:bg-[#181c26] hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40 border-2 border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl text-left transition-all cursor-pointer group space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Truck className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900">
                    Entrega / Pagamento na Hora
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    Entrega de Remessa & Pagamento na Hora
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Entregar produtos sob encomenda / venda direta e receber o pagamento presencial no ato.
                  </p>
                </div>
              </button>

              {/* Option 3: Troca / Recolhimento */}
              <button
                type="button"
                onClick={() => {
                  setVisitType('troca');
                  setCurrentStep(1);
                }}
                className="p-5 bg-white dark:bg-[#181c26] hover:bg-amber-50/50 dark:hover:bg-amber-950/40 border-2 border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 rounded-2xl text-left transition-all cursor-pointer group space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Repeat className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900">
                    Trocas
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base group-hover:text-amber-600 dark:group-hover:text-amber-400">
                    Troca de Peças ou Recolhimento
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Recolher itens parados no cliente ou fazer substituição por modelos novos.
                  </p>
                </div>
              </button>

              {/* Option 4: Visita Comercial */}
              <button
                type="button"
                onClick={() => {
                  setVisitType('comercial');
                  setCurrentStep(1);
                }}
                className="p-5 bg-white dark:bg-[#181c26] hover:bg-purple-50/50 dark:hover:bg-purple-950/40 border-2 border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 rounded-2xl text-left transition-all cursor-pointer group space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-900">
                    Comercial
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base group-hover:text-purple-600 dark:group-hover:text-purple-400">
                    Visita Comercial & Alinhamento
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Reunião presencial, apresentação de novos modelos ou prospecção comercial.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FLUXO 1: CONSIGNADO */}
        {/* ========================================================================= */}
        {visitType === 'consignado' && (
          <>
            {/* STEP 1: CONFERÊNCIA */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Etapa 1 — Contagem de Estoque</h3>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                      Conte os produtos que ainda estão fisicamente no expositor do cliente.
                    </p>
                  </div>
                  <Sparkles className="w-6 h-6 text-indigo-500 shrink-0" />
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase">
                      <tr>
                        <th className="p-3.5">Produto</th>
                        <th className="p-3.5 text-center">Qtde Esperada</th>
                        <th className="p-3.5 text-center">Qtde Encontrada</th>
                        <th className="p-3.5 text-center">Unidades Vendidas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {auditCalculations.map((item) => {
                        const diff = item.sold;
                        return (
                          <tr key={item.productId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{item.productName}</td>
                            <td className="p-3.5 text-center font-bold text-slate-600 dark:text-slate-400">
                              {item.currentQuantity}
                            </td>
                            <td className="p-3.5 text-center">
                              <input
                                type="number"
                                min="0"
                                max={item.currentQuantity}
                                value={counts[item.productId] ?? item.currentQuantity}
                                onChange={(e) =>
                                  setCounts({
                                    ...counts,
                                    [item.productId]: Number(e.target.value),
                                  })
                                }
                                className="w-20 text-center py-1.5 px-2 border-2 border-indigo-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:border-indigo-600 focus:outline-none"
                              />
                            </td>
                            <td className="p-3.5 text-center">
                              <span
                                className={`font-extrabold px-3 py-1 rounded-full ${
                                  diff > 0
                                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                {diff > 0 ? `-${diff} vendidas` : '0'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    Cálculo Automático de Vendas:
                  </span>
                  <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                    {totalSoldUnits} unidades vendidas
                  </span>
                </div>
              </div>
            )}

            {/* STEP 2: VENDAS */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                  <h3 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">Etapa 2 — Resumo de Vendas Calculadas</h3>
                  <p className="text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Valores calculados com base na conferência efetuada na etapa anterior.
                  </p>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase">
                      <tr>
                        <th className="p-3.5">Produto</th>
                        <th className="p-3.5 text-center">Quantidade Vendida</th>
                        <th className="p-3.5 text-right">Preço Unitário</th>
                        <th className="p-3.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {auditCalculations
                        .filter((i) => i.sold > 0)
                        .map((item) => (
                          <tr key={item.productId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{item.productName}</td>
                            <td className="p-3.5 text-center font-bold text-slate-800 dark:text-slate-300">
                              {item.sold} vendidas
                            </td>
                            <td className="p-3.5 text-right text-slate-600 dark:text-slate-400">
                              R$ {item.unitPrice.toFixed(2)}
                            </td>
                            <td className="p-3.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                              R$ {item.totalSalesValue.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-5 bg-slate-900 dark:bg-[#181c26] text-white rounded-2xl flex items-center justify-between border border-slate-800 dark:border-[#202531]">
                  <div>
                    <span className="text-slate-400 font-medium block">Total Geral Vendido:</span>
                    <span className="text-2xl font-black text-emerald-400">
                      R$ {totalRevenueCalculated.toFixed(2)}
                    </span>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full font-bold">
                    {totalSoldUnits} itens comercializados
                  </span>
                </div>
              </div>
            )}

            {/* STEP 3: TROCAS */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/50">
                  <h3 className="font-bold text-amber-900 dark:text-amber-300 text-sm">Etapa 3 — Troca de Produtos de Baixo Giro</h3>
                  <p className="text-amber-800 dark:text-amber-400 mt-0.5">
                    Deseja recolher itens parados no cliente e substituir por modelos de maior saída?
                  </p>
                </div>

                {/* Removal pick */}
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">1. Selecionar produtos a retirar do local:</h4>
                  <div className="space-y-2">
                    {auditCalculations.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{item.productName} (Atual: {item.counted})</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-[11px]">Qtde a retirar:</span>
                          <input
                            type="number"
                            min="0"
                            max={item.counted}
                            value={removals[item.productId] || 0}
                            onChange={(e) =>
                              setRemovals({
                                ...removals,
                                [item.productId]: Number(e.target.value),
                              })
                            }
                            className="w-16 text-center py-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-bold text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                  <span>Resumo do Balanço da Troca:</span>
                  <span>
                    {totalItemsRemoved} itens retirados ↔ {totalItemsAddedEx} itens adicionados
                  </span>
                </div>
              </div>
            )}

            {/* STEP 4: REPOSIÇÃO */}
            {currentStep === 4 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/50">
                  <h3 className="font-bold text-blue-900 dark:text-blue-300 text-sm">Etapa 4 — Reposição de Estoque</h3>
                  <p className="text-blue-800 dark:text-blue-400 mt-0.5">
                    Defina quantas novas unidades você deixará no expositor para reabastecimento.
                  </p>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase">
                      <tr>
                        <th className="p-3.5">Produto</th>
                        <th className="p-3.5 text-center">Estoque Atual no Local</th>
                        <th className="p-3.5 text-center">Adicionar Reposição</th>
                        <th className="p-3.5 text-center">Novo Estoque Final</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {auditCalculations.map((item) => {
                        const rem = removals[item.productId] || 0;
                        const addEx = additionsInExchange.find((a) => a.productId === item.productId)?.quantity || 0;
                        const base = item.counted - rem + addEx;
                        const addRestock = restocks[item.productId] || 0;
                        const finalStock = base + addRestock;

                        return (
                          <tr key={item.productId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{item.productName}</td>
                            <td className="p-3.5 text-center font-bold text-slate-600 dark:text-slate-400">{base}</td>
                            <td className="p-3.5 text-center">
                              <input
                                type="number"
                                min="0"
                                value={restocks[item.productId] || 0}
                                onChange={(e) =>
                                  setRestocks({
                                    ...restocks,
                                    [item.productId]: Number(e.target.value),
                                  })
                                }
                                className="w-20 text-center py-1.5 border-2 border-indigo-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl font-bold text-slate-900 dark:text-slate-100"
                              />
                            </td>
                            <td className="p-3.5 text-center font-extrabold text-indigo-700 dark:text-indigo-400">
                              {finalStock} un
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* STEP 5: PAGAMENTO */}
            {currentStep === 5 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">Etapa 5 — Registro de Pagamento</h3>
                    <p className="text-emerald-800 dark:text-emerald-400 mt-0.5">
                      Valor total das vendas nesta visita: <strong>R$ {totalRevenueCalculated.toFixed(2)}</strong>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Status do Pagamento</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800"
                    >
                      <option value="Pago integralmente">Pago integralmente (Na Hora)</option>
                      <option value="Parcial">Pagamento parcial</option>
                      <option value="Não pago">Não pago (Faturar para depois)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Forma de Pagamento</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800"
                    >
                      <option value="PIX">PIX</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Cartão">Cartão</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Valor Recebido (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-extrabold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Observações do Acerto</label>
                    <input
                      type="text"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="Ex: Recebido em PIX pelo Carlos"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: RESUMO FINAL */}
            {currentStep === 6 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="bg-slate-50 dark:bg-slate-900/80 border-2 border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div>
                      <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        VIS-{Math.floor(100000 + Math.random() * 900000)}
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{client.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date().toLocaleDateString('pt-BR')} • Atendimento e Acerto Presencial por Nicholas
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-full font-bold text-xs border border-emerald-300 dark:border-emerald-800">
                      Visita Concluída
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block font-medium">Produtos Vendidos:</span>
                      <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{totalSoldUnits} un</span>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block font-medium">Total Calculado:</span>
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        R$ {totalRevenueCalculated.toFixed(2)}
                      </span>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block font-medium">Total Recebido:</span>
                      <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        R$ {(receivedAmount || totalRevenueCalculated).toFixed(2)}
                      </span>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block font-medium">Estoque Final Local:</span>
                      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{finalEstimatedStock} un</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Imprimir / Gerar PDF
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* FLUXO 2: ENTREGA DE PEDIDO / REMESSA COM PAGAMENTO NA HORA */}
        {/* ========================================================================= */}
        {visitType === 'entrega_pedido' && (
          <>
            {/* STEP 1: ITENS ENTREGUES */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Etapa 1 — Produtos Entregues ao Cliente</h3>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                      Selecione os produtos e as quantidades entregues presencialmente para {client.name}.
                    </p>
                  </div>
                  <Truck className="w-6 h-6 text-emerald-500 shrink-0" />
                </div>

                {allProducts.length > 0 && (
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-2">
                    <label className="block font-bold text-slate-900 dark:text-slate-100 text-xs">
                      Adicionar Produtos do Catálogo para Entrega Presencial:
                    </label>
                    <ProductSelectCombobox
                      products={allProducts}
                      onSelectProduct={handleAddProductToDelivery}
                      isCashPayment={true}
                    />
                  </div>
                )}

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase">
                      <tr>
                        <th className="p-3.5">Produto Entregue</th>
                        <th className="p-3.5 text-center">Quantidade</th>
                        <th className="p-3.5 text-right">Preço Unitário</th>
                        <th className="p-3.5 text-right">Subtotal</th>
                        <th className="p-3.5 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {deliveryItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-500">
                            Nenhum produto selecionado para a entrega. Adicione itens acima no campo de busca.
                          </td>
                        </tr>
                      ) : (
                        deliveryItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{item.productName}</td>
                            <td className="p-3.5 text-center">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => {
                                  const newQty = Math.max(1, Number(e.target.value));
                                  const updated = [...deliveryItems];
                                  updated[idx].quantity = newQty;
                                  updated[idx].subtotal = newQty * updated[idx].unitPrice;
                                  setDeliveryItems(updated);
                                }}
                                className="w-20 text-center py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl font-bold text-slate-900 dark:text-slate-100"
                              />
                            </td>
                            <td className="p-3.5 text-right text-slate-700 dark:text-slate-300">
                              R$ {item.unitPrice.toFixed(2).replace('.', ',')}
                            </td>
                            <td className="p-3.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                              R$ {item.subtotal.toFixed(2).replace('.', ',')}
                            </td>
                            <td className="p-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => setDeliveryItems(deliveryItems.filter((_, i) => i !== idx))}
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between font-extrabold">
                  <span className="text-slate-800 dark:text-slate-200">Total da Remessa Entregue:</span>
                  <span className="text-lg text-emerald-600 dark:text-emerald-400">
                    R$ {totalDeliveryValue.toFixed(2).replace('.', ',')} ({totalDeliveryItemsCount} peças)
                  </span>
                </div>
              </div>
            )}

            {/* STEP 2: PAGAMENTO NA HORA */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">Etapa 2 — Recebimento do Pagamento na Hora</h3>
                    <p className="text-emerald-800 dark:text-emerald-400 mt-0.5">
                      Valor total a cobrar nesta entrega: <strong>R$ {totalDeliveryValue.toFixed(2).replace('.', ',')}</strong>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Status do Pagamento</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800"
                    >
                      <option value="Pago integralmente">Pago no Ato da Entrega (Na Hora)</option>
                      <option value="Parcial">Pagamento Parcial</option>
                      <option value="Não pago">Faturado para depois</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Forma de Pagamento</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800"
                    >
                      <option value="PIX">PIX</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Cartão">Cartão de Crédito/Débito</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Valor Recebido Presencialmente (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={receivedAmount || totalDeliveryValue}
                      onChange={(e) => setReceivedAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-extrabold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Observações da Entrega</label>
                    <input
                      type="text"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="Ex: Entregue em mãos e pago via PIX"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: COMPROVANTE */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="bg-slate-50 dark:bg-slate-900/80 border-2 border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ENTREG-{Math.floor(100000 + Math.random() * 900000)}
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{client.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date().toLocaleDateString('pt-BR')} • Entrega Presencial Concluída por Nicholas
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-full font-bold text-xs border border-emerald-300 dark:border-emerald-800">
                      Entrega & Pagamento Efetuados
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block font-medium">Itens Entregues:</span>
                      <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{totalDeliveryItemsCount} un</span>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block font-medium">Valor da Remessa:</span>
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        R$ {totalDeliveryValue.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block font-medium">Forma de Pagamento:</span>
                      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        {paymentMethod}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Imprimir Recibo
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* FLUXO 3: TROCAS / RECOLHIMENTO */}
        {/* ========================================================================= */}
        {visitType === 'troca' && (
          <>
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/50">
                  <h3 className="font-bold text-amber-900 dark:text-amber-300 text-sm">Troca / Recolhimento de Peças no Expositor</h3>
                  <p className="text-amber-800 dark:text-amber-400 mt-0.5">
                    Selecione os produtos a retirar da loja de {client.name}.
                  </p>
                </div>

                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                  {auditCalculations.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{item.productName} (Estoque local: {item.currentQuantity})</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[11px]">Qtde a retirar:</span>
                        <input
                          type="number"
                          min="0"
                          max={item.currentQuantity}
                          value={removals[item.productId] || 0}
                          onChange={(e) =>
                            setRemovals({
                              ...removals,
                              [item.productId]: Number(e.target.value),
                            })
                          }
                          className="w-16 text-center py-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-bold text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="p-6 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
                <Repeat className="w-10 h-10 text-amber-500 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Resumo da Troca / Recolhimento</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total de {totalItemsRemoved} itens recolhidos do expositor do cliente. As peças serão retornadas para a oficina.
                </p>
              </div>
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* FLUXO 4: VISITA COMERCIAL */}
        {/* ========================================================================= */}
        {visitType === 'comercial' && (
          <>
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-100 dark:border-purple-900/50">
                  <h3 className="font-bold text-purple-900 dark:text-purple-300 text-sm">Registro de Reunião & Prospecção Comercial</h3>
                  <p className="text-purple-800 dark:text-purple-400 mt-0.5">
                    Registre os alinhamentos e combinados presenciais com {client.name}.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Anotações Comerciais da Visita</label>
                  <textarea
                    rows={4}
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Ex: Apresentados novos chaveiros 3D. Cliente demonstrou interesse em aumentar expositor para 30 peças..."
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="p-6 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
                <CheckCircle2 className="w-10 h-10 text-purple-500 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Visita Comercial Pronta para Registro</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Clique em Finalizar para salvar a visita no histórico de {client.name}.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Navigation Buttons Footer */}
      <div className="p-4 bg-slate-50 dark:bg-[#181c26] border-t border-slate-200 dark:border-[#202531] flex items-center justify-between">
        <button
          disabled={currentStep === 0}
          onClick={() => setCurrentStep((prev) => (prev > 0 ? prev - 1 : 0))}
          className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Anterior
        </button>

        {currentStep === 0 ? (
          <span className="text-xs text-slate-400 font-semibold">Selecione uma das opções acima para continuar</span>
        ) : currentStep < maxStep ? (
          <button
            onClick={() => {
              if (visitType === 'consignado' && currentStep === 4 && receivedAmount === 0 && totalRevenueCalculated > 0) {
                setReceivedAmount(totalRevenueCalculated);
              }
              if (visitType === 'entrega_pedido' && currentStep === 1 && receivedAmount === 0 && totalDeliveryValue > 0) {
                setReceivedAmount(totalDeliveryValue);
              }
              setCurrentStep((prev) => (prev < maxStep ? prev + 1 : prev));
            }}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs cursor-pointer"
          >
            Avançar <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() =>
              onCompleteVisit({
                visitId: `VIS-${Math.floor(100000 + Math.random() * 900000)}`,
                client,
                visitType,
                auditCalculations: visitType === 'consignado' ? auditCalculations : [],
                deliveryItems: visitType === 'entrega_pedido' ? deliveryItems : [],
                totalSoldUnits: visitType === 'consignado' ? totalSoldUnits : totalDeliveryItemsCount,
                totalRevenueCalculated: visitType === 'consignado' ? totalRevenueCalculated : totalDeliveryValue,
                removals,
                additionsInExchange,
                restocks,
                paymentStatus,
                paymentMethod,
                receivedAmount: receivedAmount || (visitType === 'consignado' ? totalRevenueCalculated : totalDeliveryValue),
                paymentNotes,
                finalEstimatedStock: visitType === 'consignado' ? finalEstimatedStock : client.productsOnSiteCount + totalDeliveryItemsCount,
              })
            }
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" /> Finalizar Visita & Gravar Histórico
          </button>
        )}
      </div>
    </div>
  );
};
