import React, { useState } from 'react';
import { formatDateBR, getTodayBR } from '../utils/formatters';
import { Client, Product, Quote, QuoteItem, AttendanceMode } from '../types';
import { ProductSelectCombobox } from '../components/ProductSelectCombobox';
import { ImageLightboxModal } from '../components/ImageLightboxModal';
import {
  FileText,
  Plus,
  Printer,
  X,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Clock,
  Send,
  Building2,
  Sparkles,
  ShoppingCart,
  Truck,
  MapPin,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Edit2,
} from 'lucide-react';

interface QuotesViewProps {
  quotes: Quote[];
  clients: Client[];
  products: Product[];
  onAddQuote: (quote: Quote) => void;
  onUpdateQuote?: (quote: Quote) => void;
  onUpdateQuoteStatus?: (quoteId: string, newStatus: string) => void;
  onConvertQuoteToOrder: (quote: Quote) => void;
  preselectedClientId?: string;
  searchQuery?: string;
}

export const QuotesView: React.FC<QuotesViewProps> = ({
  quotes,
  clients,
  products,
  onAddQuote,
  onUpdateQuote,
  onUpdateQuoteStatus,
  onConvertQuoteToOrder,
  preselectedClientId,
  searchQuery = '',
}) => {
  const [isFormOpen, setIsFormOpen] = useState(!!preselectedClientId);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [previewPdfQuote, setPreviewPdfQuote] = useState<Quote | null>(null);
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);

  const handleEditQuote = (q: Quote) => {
    const isConverted =
      q.status === 'Convertido em Pedido' ||
      q.status === 'Convertido' ||
      q.status === 'Aprovado';

    if (isConverted) return;

    setEditingQuoteId(q.id);
    setSelectedClientId(q.clientId || fallbackDefaultClient.id);
    setValidityDays(q.validityDays || 7);
    setProductionSlaDays(q.productionSlaDays || 5);
    setDiscount(q.discount || 0);
    setDiscountPercent(0);
    setPaymentTerms(q.paymentTerms || '');
    setNotes(q.notes || '');
    setQuoteItems(q.items || []);
    if (q.attendanceMode) setAttendanceMode(q.attendanceMode);
    if (q.internalLogisticsType) setInternalLogisticsType(q.internalLogisticsType);
    if (typeof q.internalLogisticsCost === 'number') setInternalLogisticsCost(q.internalLogisticsCost);

    setIsFormOpen(true);
  };

  const toggleExpandQuote = (quoteId: string) => {
    setExpandedQuoteId((prev) => (prev === quoteId ? null : quoteId));
  };

  const filteredQuotes = quotes.filter((q) => {
    if (!searchQuery || searchQuery.trim() === '') return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      q.id.toLowerCase().includes(query) ||
      q.clientName.toLowerCase().includes(query) ||
      q.status.toLowerCase().includes(query) ||
      (q.items && q.items.some((i) => i.description.toLowerCase().includes(query)))
    );
  });

  // Default fallback Cliente Padrão
  const defaultPadraoClientInList = clients.find(
    (c) => c.name.toLowerCase().trim() === 'cliente padrão' || c.name.toLowerCase().trim() === 'cliente padrao'
  );

  const fallbackDefaultClient: Client = defaultPadraoClientInList || {
    id: 'cli-padrao-default',
    name: 'Cliente Padrão',
    responsible: 'Balcão / Geral',
    phone: '(00) 00000-0000',
    whatsapp: '',
    email: '',
    document: '000.000.000-00',
    cep: '00000-000',
    street: 'Atendimento Local',
    number: 'S/N',
    neighborhood: 'Centro',
    city: 'Local',
    state: 'RJ',
    type: 'Cliente direto',
    agreedPriceLevel: 'Padrão',
    visitFrequency: '15 dias',
    status: 'Ativo',
    defaultLogisticsType: 'combustivel',
    defaultLogisticsCost: 0,
    productsOnSiteCount: 0,
    productsValuation: 0,
    receivableBalance: 0,
    lastVisitDate: 'N/A',
    nextVisitDate: 'N/A',
    visitStatus: 'Em breve',
  };

  // Available clients list ensuring Cliente Padrão is present & first
  const availableClientsList: Client[] = defaultPadraoClientInList
    ? [defaultPadraoClientInList, ...clients.filter((c) => c.id !== defaultPadraoClientInList.id)]
    : [fallbackDefaultClient, ...clients];

  // New quote state initialized with Cliente Padrão as fixed default
  const [selectedClientId, setSelectedClientId] = useState(
    preselectedClientId || fallbackDefaultClient.id
  );
  const [validityDays, setValidityDays] = useState(7);
  const [productionSlaDays, setProductionSlaDays] = useState(5);
  const [discount, setDiscount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentTerms, setPaymentTerms] = useState('');
  const [notes, setNotes] = useState('');
  const [attendanceMode, setAttendanceMode] = useState<AttendanceMode>('presencial');

  // Internal Logistics Cost State (Memory per Client)
  const [internalLogisticsType, setInternalLogisticsType] = useState<'combustivel' | 'frete' | 'retirada'>('combustivel');
  const [internalLogisticsCost, setInternalLogisticsCost] = useState<number>(0);

  const selectedClient = availableClientsList.find((c) => c.id === selectedClientId) || fallbackDefaultClient;

  // Sync client logistics memory: Always use selectedClient.defaultLogisticsCost (defaulting to 20 if combustivel)
  React.useEffect(() => {
    if (!selectedClient) return;

    let cost = typeof selectedClient.defaultLogisticsCost === 'number'
      ? selectedClient.defaultLogisticsCost
      : (Number(selectedClient.defaultLogisticsCost) || 0);

    const type = selectedClient.defaultLogisticsType || 'combustivel';

    if (!cost) {
      try {
        const saved = localStorage.getItem('rn3d_client_logistics');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (selectedClient.id && parsed[selectedClient.id] && parsed[selectedClient.id].cost) {
            cost = Number(parsed[selectedClient.id].cost) || 0;
          }
        }
      } catch (e) {}
    }

    setInternalLogisticsType(type);
    setInternalLogisticsCost(cost);
  }, [selectedClient, selectedClientId, isFormOpen]);

  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);

  // LOCAL STORAGE DRAFT AUTO-PERSISTENCE
  const DRAFT_STORAGE_KEY = 'rn3d_quote_form_draft';
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  // Restore draft on mount
  React.useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && typeof parsed === 'object') {
          if (parsed.selectedClientId) setSelectedClientId(parsed.selectedClientId);
          if (typeof parsed.validityDays === 'number') setValidityDays(parsed.validityDays);
          if (typeof parsed.productionSlaDays === 'number') setProductionSlaDays(parsed.productionSlaDays);
          if (typeof parsed.discount === 'number') setDiscount(parsed.discount);
          if (typeof parsed.discountPercent === 'number') setDiscountPercent(parsed.discountPercent);
          if (parsed.paymentTerms) setPaymentTerms(parsed.paymentTerms);
          if (parsed.notes) setNotes(parsed.notes);
          if (parsed.attendanceMode) setAttendanceMode(parsed.attendanceMode);
          if (Array.isArray(parsed.quoteItems) && parsed.quoteItems.length > 0) {
            setQuoteItems(parsed.quoteItems);
            setHasRestoredDraft(true);
          }
          if (parsed.internalLogisticsType) setInternalLogisticsType(parsed.internalLogisticsType);
          if (typeof parsed.internalLogisticsCost === 'number') setInternalLogisticsCost(parsed.internalLogisticsCost);
        }
      }
    } catch (err) {
      console.error('Erro ao restaurar rascunho de orçamento:', err);
    }
  }, []);

  // Auto-save draft on form changes
  React.useEffect(() => {
    if (quoteItems.length > 0 || paymentTerms || notes || selectedClientId !== fallbackDefaultClient.id) {
      try {
        const draftData = {
          selectedClientId,
          validityDays,
          productionSlaDays,
          discount,
          discountPercent,
          paymentTerms,
          notes,
          attendanceMode,
          quoteItems,
          internalLogisticsType,
          internalLogisticsCost,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
      } catch (err) {
        console.error('Erro ao salvar rascunho de orçamento:', err);
      }
    }
  }, [
    selectedClientId,
    validityDays,
    productionSlaDays,
    discount,
    discountPercent,
    paymentTerms,
    notes,
    attendanceMode,
    quoteItems,
    internalLogisticsType,
    internalLogisticsCost,
  ]);

  const handleClearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (e) {}
    setQuoteItems([]);
    setDiscount(0);
    setDiscountPercent(0);
    setPaymentTerms('');
    setNotes('');
    setHasRestoredDraft(false);
    setSelectedClientId(fallbackDefaultClient.id);
  };

  const handleAddItem = () => {
    setQuoteItems([
      ...quoteItems,
      { description: '', quantity: 1, unitPrice: 0.0, subtotal: 0.0 },
    ]);
  };

  const handleSelectPaymentTerms = (newTerms: string) => {
    setPaymentTerms(newTerms);

    const isCash =
      newTerms.toLowerCase().includes('à vista') ||
      newTerms.toLowerCase().includes('a vista') ||
      newTerms.toLowerCase().includes('pix') ||
      newTerms.toLowerCase().includes('50%');

    setQuoteItems((prev) =>
      prev.map((item) => {
        const matchedProd = products.find(
          (p) => item.description.includes(p.sku) || item.description.toLowerCase().includes(p.name.toLowerCase())
        );
        if (matchedProd) {
          const targetPrice = isCash
            ? (matchedProd.cashPrice ?? (matchedProd.isKeychain || matchedProd.category === 'Chaveiro' ? 4.0 : matchedProd.standardPrice))
            : matchedProd.standardPrice;

          return {
            ...item,
            unitPrice: targetPrice,
            subtotal: item.quantity * targetPrice,
          };
        }
        return item;
      })
    );
  };

  const handleAddProductFromCatalog = (prod: Product) => {
    const isCash =
      paymentTerms.toLowerCase().includes('à vista') ||
      paymentTerms.toLowerCase().includes('a vista') ||
      paymentTerms.toLowerCase().includes('pix') ||
      paymentTerms.toLowerCase().includes('50%');

    const initialPrice = isCash
      ? (prod.cashPrice ?? (prod.isKeychain || prod.category === 'Chaveiro' ? 4.0 : prod.standardPrice))
      : prod.standardPrice;

    const itemDescription = `${prod.name} (SKU: ${prod.sku})`;

    // Check if product is already in quoteItems list
    const existingIndex = quoteItems.findIndex(
      (item) =>
        item.productId === prod.id ||
        item.description === itemDescription ||
        (prod.sku && item.description.includes(`SKU: ${prod.sku}`))
    );

    if (existingIndex >= 0) {
      // Item exists! Increment quantity by 1 on the existing single row
      const updated = [...quoteItems];
      const newQty = updated[existingIndex].quantity + 1;
      updated[existingIndex] = {
        ...updated[existingIndex],
        productId: prod.id,
        quantity: newQty,
        subtotal: newQty * updated[existingIndex].unitPrice,
      };
      setQuoteItems(updated);
    } else {
      // New item! Add once with quantity 1
      setQuoteItems([
        ...quoteItems,
        {
          productId: prod.id,
          description: itemDescription,
          quantity: 1,
          unitPrice: initialPrice,
          subtotal: initialPrice,
        },
      ]);
    }
  };

  const handleSetProductQuantityFromCatalog = (prod: Product, newQty: number) => {
    const isCash =
      paymentTerms.toLowerCase().includes('à vista') ||
      paymentTerms.toLowerCase().includes('a vista') ||
      paymentTerms.toLowerCase().includes('pix') ||
      paymentTerms.toLowerCase().includes('50%');

    const initialPrice = isCash
      ? (prod.cashPrice ?? (prod.isKeychain || prod.category === 'Chaveiro' ? 4.0 : prod.standardPrice))
      : prod.standardPrice;

    const itemDescription = `${prod.name} (SKU: ${prod.sku})`;

    const existingIndex = quoteItems.findIndex(
      (item) =>
        item.productId === prod.id ||
        item.description === itemDescription ||
        (prod.sku && item.description.includes(`SKU: ${prod.sku}`))
    );

    if (newQty <= 0) {
      if (existingIndex >= 0) {
        setQuoteItems(quoteItems.filter((_, idx) => idx !== existingIndex));
      }
      return;
    }

    if (existingIndex >= 0) {
      const updated = [...quoteItems];
      updated[existingIndex] = {
        ...updated[existingIndex],
        productId: prod.id,
        quantity: newQty,
        subtotal: newQty * updated[existingIndex].unitPrice,
      };
      setQuoteItems(updated);
    } else {
      setQuoteItems([
        ...quoteItems,
        {
          productId: prod.id,
          description: itemDescription,
          quantity: newQty,
          unitPrice: initialPrice,
          subtotal: newQty * initialPrice,
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setQuoteItems(quoteItems.filter((_, idx) => idx !== index));
  };

  const handleUpdateItem = (index: number, field: keyof QuoteItem, val: any) => {
    const updated = [...quoteItems];
    (updated[index] as any)[field] = val;
    if (field === 'quantity' || field === 'unitPrice') {
      updated[index].subtotal = Number(updated[index].quantity) * Number(updated[index].unitPrice);
    }
    setQuoteItems(updated);
  };

  const subtotal = quoteItems.reduce((acc, i) => acc + i.subtotal, 0);
  const total = Math.max(0, subtotal - discount);

  const [validationMessage, setValidationError] = useState<string | null>(null);

  const handleSubmitQuote = (status: Quote['status']) => {
    if (!selectedClient) {
      setValidationError('Por favor, selecione um cliente para o orçamento.');
      return;
    }

    if (quoteItems.length === 0) {
      setValidationError('Adicione pelo menos 1 produto do catálogo ao orçamento antes de salvar.');
      return;
    }

    setValidationError(null);

    const todayDate = getTodayBR();

    const newQuote: Quote = {
      id: `ORC-${Math.floor(Math.random() * 900000 + 100000)}`,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientDocument: selectedClient.document,
      clientPhone: selectedClient.phone,
      clientAddress: `${selectedClient.street || ''}, ${selectedClient.number || ''} - ${selectedClient.city || ''} / ${selectedClient.state || ''}`,
      date: todayDate,
      validityDays,
      productionSlaDays,
      items: quoteItems,
      subtotal,
      discount,
      total,
      paymentTerms: paymentTerms || 'À vista',
      notes,
      status,
      attendanceMode,
      internalLogisticsType,
      internalLogisticsCost,
    };

    // Save/update client logistics memory in localStorage
    try {
      const saved = localStorage.getItem('rn3d_client_logistics');
      const parsed = saved ? JSON.parse(saved) : {};
      parsed[selectedClient.id] = { type: internalLogisticsType, cost: internalLogisticsCost };
      localStorage.setItem('rn3d_client_logistics', JSON.stringify(parsed));
    } catch (e) {
      console.error('Error saving client logistics memory:', e);
    }

    if (editingQuoteId) {
      const updatedQuoteObj: Quote = {
        ...newQuote,
        id: editingQuoteId,
      };
      if (onUpdateQuote) {
        onUpdateQuote(updatedQuoteObj);
      } else {
        onAddQuote(updatedQuoteObj);
      }
      setEditingQuoteId(null);
    } else {
      onAddQuote(newQuote);
    }

    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (e) {}
    setHasRestoredDraft(false);
    setIsFormOpen(false);
    setQuoteItems([]);
    setDiscount(0);
    setDiscountPercent(0);
  };

  const renderInlineQuoteDetails = (q: Quote) => (
    <div className="p-4 sm:p-6 bg-slate-50/90 dark:bg-[#181c26] rounded-2xl border border-slate-200/90 dark:border-[#202531] space-y-5 animate-in fade-in duration-150 my-2 text-left">
      {/* Top Header info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
            Detalhes Completos do Orçamento <span className="font-mono text-indigo-600 dark:text-indigo-400">#{q.id}</span> — {q.clientName}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPreviewPdfQuote(q);
            }}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" /> PDF A4 do Orçamento
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpandQuote(q.id);
            }}
            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <ChevronUp className="w-4 h-4" /> Recolher
          </button>
        </div>
      </div>

      {/* Grid Client & Parameters Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-white dark:bg-[#12151c] rounded-xl border border-slate-200 dark:border-[#202531]">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block">Cliente / Solicitante</span>
          <strong className="text-slate-900 dark:text-slate-100 font-bold block truncate">{q.clientName}</strong>
          {q.clientDocument && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block mt-0.5">Doc: {q.clientDocument}</span>
          )}
        </div>

        <div className="p-3 bg-white dark:bg-[#12151c] rounded-xl border border-slate-200 dark:border-[#202531]">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block">Datas & Validade</span>
          <span className="text-slate-700 dark:text-slate-300 font-semibold block mt-0.5">Emissão: {formatDateBR(q.date)}</span>
          <span className="text-amber-600 dark:text-amber-400 font-bold block text-[11px] mt-0.5">Validade: {q.validityDays} dias úteis</span>
        </div>

        <div className="p-3 bg-white dark:bg-[#12151c] rounded-xl border border-slate-200 dark:border-[#202531]">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block">Condição de Pagamento</span>
          <span className="text-slate-900 dark:text-slate-100 font-bold block mt-0.5">{q.paymentTerms}</span>
          <span className="text-slate-500 dark:text-slate-400 text-[11px] block mt-0.5">Prazo Produção: {q.productionSlaDays} dias</span>
        </div>

        <div className="p-3 bg-white dark:bg-[#12151c] rounded-xl border border-slate-200 dark:border-[#202531]">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block">Valor Total Orçado</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-black text-base block mt-0.5">
            R$ {q.total.toFixed(2).replace('.', ',')}
          </span>
          {q.discount > 0 && (
            <span className="text-rose-600 dark:text-rose-400 text-[11px] font-semibold block">Desc.: -R$ {q.discount.toFixed(2).replace('.', ',')}</span>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="space-y-2">
        <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-2">
          <span>📋 Itens Cotados no Orçamento ({q.items ? q.items.length : 0})</span>
        </h5>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#202531] bg-white dark:bg-[#12151c]">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-[#181c26] text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-[#202531]">
              <tr>
                <th className="p-3">Produto / Descrição</th>
                <th className="p-3 text-center">Quantidade</th>
                <th className="p-3 text-right">Valor Unitário</th>
                <th className="p-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {(q.items || []).map((item, idx) => {
                const matchingProduct = products.find(
                  (p) =>
                    p.id === item.productId ||
                    p.name.toLowerCase() === item.description.toLowerCase() ||
                    item.description.toLowerCase().includes(p.name.toLowerCase())
                );

                return (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {matchingProduct?.imageUrl ? (
                          <img
                            src={matchingProduct.imageUrl}
                            alt=""
                            onClick={(e) => {
                              e.stopPropagation();
                              setZoomImage({
                                url: matchingProduct.imageUrl,
                                title: item.description,
                              });
                            }}
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700 cursor-zoom-in shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                            3D
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">{item.description}</p>
                          {matchingProduct?.storageCapacity && (
                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                              Capacidade: {matchingProduct.storageCapacity}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-900 dark:text-slate-200">{item.quantity} un</td>
                    <td className="p-3 text-right text-slate-600 dark:text-slate-400">
                      R$ {item.unitPrice.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="p-3 text-right font-extrabold text-slate-900 dark:text-slate-100">
                      R$ {item.subtotal.toFixed(2).replace('.', ',')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes / Internal Observations */}
      {q.notes && (
        <div className="p-3 bg-white dark:bg-[#12151c] rounded-xl border border-slate-200 dark:border-[#202531] space-y-1">
          <span className="font-bold text-slate-900 dark:text-slate-100 block text-[11px]">Observações / Notas Comerciais:</span>
          <p className="text-slate-600 dark:text-slate-300 italic text-[11px]">{q.notes}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {!isFormOpen ? (
        <>
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#12151c] p-6 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                Orçamentos Comerciais
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Gere propostas profissionais de impressão 3D em PDF para clientes e revendedores.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingQuoteId(null);
                setQuoteItems([]);
                setDiscount(0);
                setDiscountPercent(0);
                setPaymentTerms('');
                setNotes('');
                setIsFormOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Novo Orçamento
            </button>
          </div>

          {/* Quotes Table or Clean Empty State */}
          {quotes.length === 0 ? (
            <div className="bg-white dark:bg-[#12151c] rounded-2xl border border-slate-200/80 dark:border-[#202531] p-12 text-center shadow-xs space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">Nenhum orçamento cadastrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Crie propostas comerciais completas em PDF para apresentar aos seus clientes.
          </p>
          <button
            onClick={() => {
              setEditingQuoteId(null);
              setQuoteItems([]);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
          >
            Criar Primeiro Orçamento
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout (< 768px) - Eliminates Horizontal Scroll */}
          <div className="block md:hidden space-y-3">
            {filteredQuotes.map((q) => {
              const isExpanded = expandedQuoteId === q.id;
              const isConverted =
                q.status === 'Convertido em Pedido' ||
                q.status === 'Convertido' ||
                q.status === 'Aprovado';

              const displayStatus = isConverted ? 'Convertido em Pedido' : q.status;

              let badgeStyle = 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50';
              if (q.status === 'Rascunho') badgeStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 font-bold';
              if (isConverted) badgeStyle = 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/80 font-extrabold';
              if (q.status === 'Recusado') badgeStyle = 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50';
              if (q.status === 'Enviado') badgeStyle = 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50';

              return (
                <div
                  key={q.id}
                  className="bg-white dark:bg-[#12151c] p-4 rounded-2xl border border-slate-200/90 dark:border-[#202531] shadow-xs space-y-3"
                >
                  {/* Card Header: ID & Status */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-1 rounded-lg">
                      {q.id}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeStyle}`}>
                      {displayStatus}
                    </span>
                  </div>

                  {/* Card Body: Client, Date & Total */}
                  <div
                    className="flex items-start justify-between gap-2 cursor-pointer"
                    onClick={() => toggleExpandQuote(q.id)}
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{q.clientName}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Data: {formatDateBR(q.date)} • {q.items ? q.items.length : 0} {q.items && q.items.length === 1 ? 'item' : 'itens'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block">Valor Total</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                        R$ {q.total.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions Grid (Mobile Optimized) */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => toggleExpandQuote(q.id)}
                      className={`w-full py-2 rounded-xl font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-colors ${
                        isExpanded
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" /> Recolher
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" /> Detalhes
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setPreviewPdfQuote(q)}
                      className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" /> PDF A4
                    </button>

                    {!isConverted && (
                      <button
                        onClick={() => handleEditQuote(q)}
                        className="w-full py-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 rounded-xl font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-colors"
                        title="Editar orçamento em aberto"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </button>
                    )}

                    {isConverted ? (
                      <span className="col-span-2 py-2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-xl font-bold inline-flex items-center justify-center gap-1.5 border border-emerald-300 dark:border-emerald-800/80 text-xs text-center shadow-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Pedido Gerado
                      </span>
                    ) : (
                      <button
                        onClick={() => onConvertQuoteToOrder(q)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs text-xs transition-colors"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Converter Pedido
                      </button>
                    )}
                  </div>

                  {/* Inline Details when expanded */}
                  {isExpanded && renderInlineQuoteDetails(q)}
                </div>
              );
            })}
          </div>

          {/* Desktop Table Layout (>= 768px) */}
          <div className="hidden md:block bg-white dark:bg-[#12151c] rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#181c26] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-4 whitespace-nowrap">Número</th>
                    <th className="p-4 whitespace-nowrap">Cliente</th>
                    <th className="p-4 whitespace-nowrap">Data</th>
                    <th className="p-4 text-right whitespace-nowrap">Valor Total</th>
                    <th className="p-4 text-center whitespace-nowrap">Status</th>
                    <th className="p-4 text-right whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {filteredQuotes.map((q) => {
                    const isExpanded = expandedQuoteId === q.id;
                    const isConverted =
                      q.status === 'Convertido em Pedido' ||
                      q.status === 'Convertido' ||
                      q.status === 'Aprovado';

                    const displayStatus = isConverted ? 'Convertido em Pedido' : q.status;

                    let badgeStyle = 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50';
                    if (q.status === 'Rascunho') badgeStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 font-bold';
                    if (isConverted) badgeStyle = 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/80 font-extrabold';
                    if (q.status === 'Recusado') badgeStyle = 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50';
                    if (q.status === 'Enviado') badgeStyle = 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50';

                    return (
                      <React.Fragment key={q.id}>
                        <tr
                          onClick={() => toggleExpandQuote(q.id)}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                        >
                          <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                              )}
                              <span>{q.id}</span>
                            </div>
                          </td>
                          <td className="p-4 font-bold text-slate-900 dark:text-slate-100 min-w-[140px] max-w-[220px] truncate">{q.clientName}</td>
                          <td className="p-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDateBR(q.date)}</td>
                          <td className="p-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            R$ {q.total.toFixed(2).replace('.', ',')}
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center justify-center gap-1 whitespace-nowrap ${badgeStyle}`}>
                              {isConverted && <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                              <span>{displayStatus}</span>
                            </span>
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpandQuote(q.id);
                                }}
                                className={`px-3 py-1.5 rounded-lg font-bold inline-flex items-center gap-1 cursor-pointer text-xs transition-colors shrink-0 ${
                                  isExpanded
                                    ? 'bg-indigo-600 text-white shadow-2xs'
                                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                                }`}
                                title={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes completos do orçamento'}
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3.5 h-3.5" /> Recolher
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3.5 h-3.5" /> Detalhes
                                  </>
                                )}
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewPdfQuote(q);
                                }}
                                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold inline-flex items-center gap-1 cursor-pointer text-xs transition-colors shrink-0"
                              >
                                <Printer className="w-3.5 h-3.5" /> PDF
                              </button>

                              {!isConverted && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditQuote(q);
                                  }}
                                  className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 rounded-lg font-bold inline-flex items-center gap-1 cursor-pointer text-xs transition-colors shrink-0"
                                  title="Editar este orçamento em aberto"
                                >
                                  <Edit2 className="w-3.5 h-3.5" /> Editar
                                </button>
                              )}

                              {isConverted ? (
                                <span className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-lg font-bold inline-flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-800/80 text-xs shadow-2xs shrink-0 whitespace-nowrap">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>Pedido Gerado</span>
                                </span>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onConvertQuoteToOrder(q);
                                  }}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs text-xs transition-colors shrink-0 whitespace-nowrap"
                                  title="Gerar Pedido Comercial a partir deste Orçamento"
                                >
                                  <ShoppingCart className="w-3.5 h-3.5" />
                                  <span>Converter <span className="hidden xl:inline">em Pedido</span></span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Inline Quote Details */}
                        {isExpanded && (
                          <tr className="bg-slate-50/50 dark:bg-[#181c26]/60 border-b border-slate-200 dark:border-[#202531]">
                            <td colSpan={6} className="p-4 sm:p-6">
                              {renderInlineQuoteDetails(q)}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  ) : (
    /* Cadastrar Orçamento — Inline Page View (Sem modal) */
    <div className="w-full space-y-6 animate-in fade-in duration-200">
          {/* DRAFT RESTORED NOTIFICATION BANNER */}
          {hasRestoredDraft && quoteItems.length > 0 && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-bold shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Rascunho de orçamento recuperado do salvamento automático em tempo real ({quoteItems.length} {quoteItems.length === 1 ? 'item' : 'itens'} restaurados)</span>
              </div>
              <button
                type="button"
                onClick={handleClearDraft}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Limpar Rascunho
              </button>
            </div>
          )}

          {/* Top Page Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#12151c] p-6 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs">
            <div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                OPERAÇÃO COMERCIAL — PROPOSTA & COTAÇÃO
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-1">
                <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                {editingQuoteId ? `Editar Orçamento #${editingQuoteId}` : 'Criar Novo Orçamento Comercial'}
              </h2>
            </div>
            <button
              onClick={() => {
                setEditingQuoteId(null);
                setIsFormOpen(false);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
              Voltar para Lista de Orçamentos
            </button>
          </div>

          {/* Main Form Body Card */}
          <div className="bg-white dark:bg-[#12151c] rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs p-6 space-y-6 text-xs text-slate-900 dark:text-slate-100">
            {/* Client & SLA */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Cliente *</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setSelectedClientId(newId);
                    const targetCli = availableClientsList.find((c) => c.id === newId);
                    const cost = targetCli && typeof targetCli.defaultLogisticsCost === 'number'
                      ? targetCli.defaultLogisticsCost
                      : (Number(targetCli?.defaultLogisticsCost) || 0);
                    setInternalLogisticsCost(cost);
                    if (targetCli?.defaultLogisticsType) {
                      setInternalLogisticsType(targetCli.defaultLogisticsType);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800"
                >
                  {availableClientsList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Validade da Proposta (Dias)</label>
                <input
                  type="number"
                  value={validityDays}
                  onChange={(e) => setValidityDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Prazo de Produção SLA (Dias)</label>
                <input
                  type="number"
                  value={productionSlaDays}
                  onChange={(e) => setProductionSlaDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            {/* Attendance Mode Selector */}
            <div className="p-4 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-2xl space-y-2">
              <label className="block font-bold text-slate-900 dark:text-slate-100 text-xs">Modalidade de Atendimento ao Cliente:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAttendanceMode('presencial')}
                  className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${attendanceMode === 'presencial'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                >
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>📍 Visita Presencial (No Cliente)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAttendanceMode('online')}
                  className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${attendanceMode === 'online'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                >
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span>💬 Atendimento Online / WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Full Product Catalog Searchable Combobox with Thumbnails */}
            {products.length > 0 && (
              <div className="p-4 bg-indigo-50/50 dark:bg-[#181c26] rounded-2xl border border-indigo-100 dark:border-[#202531] space-y-2">
                <label className="block font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center justify-between">
                  <span>Adicionar do Catálogo de Produtos ({products.length} itens disponíveis):</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">Pesquisa Instantânea</span>
                </label>
                <ProductSelectCombobox
                  products={products}
                  onSelectProduct={handleAddProductFromCatalog}
                  onSetProductQuantity={handleSetProductQuantityFromCatalog}
                  isCashPayment={
                    paymentTerms.toLowerCase().includes('à vista') ||
                    paymentTerms.toLowerCase().includes('a vista') ||
                    paymentTerms.toLowerCase().includes('pix') ||
                    paymentTerms.toLowerCase().includes('50%')
                  }
                />
              </div>
            )}

            {/* Selected Items List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-2">
                  <span>Itens do Orçamento ({quoteItems.length})</span>
                </h4>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg font-bold flex items-center gap-1 cursor-pointer text-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Item Personalizado
                </button>
              </div>

              {quoteItems.length === 0 ? (
                <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400 dark:text-slate-500 space-y-1">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Nenhum item adicionado ao orçamento</p>
                  <p className="text-[11px]">Use a busca acima ou clique em "Item Personalizado" para adicionar.</p>
                </div>
              ) : (
                <>
                  {/* Mobile Selected Items Cards (< 768px) */}
                  <div className="block md:hidden space-y-3">
                    {quoteItems.map((item, idx) => {
                      const matchingProduct = products.find(
                        (p) =>
                          p.id === item.productId ||
                          p.name.toLowerCase() === item.description.toLowerCase() ||
                          item.description.toLowerCase().includes(p.name.toLowerCase())
                      );

                      return (
                        <div
                          key={idx}
                          className="bg-white dark:bg-[#181c26] p-3.5 rounded-2xl border border-slate-200/90 dark:border-[#202531] shadow-xs space-y-3 text-slate-900 dark:text-slate-100"
                        >
                          {/* Top Row: Thumbnail Image, Editable Description & Red X Delete */}
                          <div className="flex items-start justify-between gap-3">
                            <div
                              onClick={() => {
                                if (matchingProduct?.imageUrl) {
                                  setZoomImage({ url: matchingProduct.imageUrl, title: item.description });
                                }
                              }}
                              className={`w-11 h-11 rounded-xl bg-indigo-100/80 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700 ${matchingProduct?.imageUrl ? 'cursor-zoom-in hover:scale-105 transition-transform' : ''
                                }`}
                              title={matchingProduct?.imageUrl ? 'Clique para ver foto em tela cheia' : undefined}
                            >
                              {matchingProduct?.imageUrl ? (
                                <img
                                  src={matchingProduct.imageUrl}
                                  alt={item.description}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>3D</span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <label className="text-[10px] font-semibold text-slate-400 block">Descrição do Item</label>
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer shrink-0 mt-3"
                              title="Remover este item do orçamento"
                            >
                              <X className="w-4 h-4 text-rose-500" />
                            </button>
                          </div>

                          {/* Bottom Row: Quantity Stepper (- and + as sole control), Unit Price & Subtotal */}
                          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                            {/* Quantity Stepper */}
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                              <button
                                type="button"
                                onClick={() => handleUpdateItem(idx, 'quantity', Math.max(1, item.quantity - 1))}
                                className="w-7 h-7 bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-95 text-slate-800 dark:text-slate-100 font-black rounded-lg flex items-center justify-center cursor-pointer shadow-2xs select-none"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-black text-slate-900 dark:text-slate-100 text-xs select-none">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateItem(idx, 'quantity', item.quantity + 1)}
                                className="w-7 h-7 bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-95 text-slate-800 dark:text-slate-100 font-black rounded-lg flex items-center justify-center cursor-pointer shadow-2xs select-none"
                              >
                                +
                              </button>
                            </div>

                            {/* Unit Price */}
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-medium">Un: R$</span>
                              <input
                                type="number"
                                step="0.10"
                                value={item.unitPrice}
                                onChange={(e) => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                                className="w-16 px-1.5 py-1 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-slate-100 text-xs text-right bg-white dark:bg-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </div>

                            {/* Subtotal */}
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 font-medium block">Subtotal</span>
                              <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">
                                R$ {item.subtotal.toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Items Table (>= 768px) */}
                  <div className="hidden md:block border border-slate-200 dark:border-[#202531] rounded-2xl overflow-hidden bg-white dark:bg-[#181c26]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-[#12151c] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase">
                        <tr>
                          <th className="p-3">Foto</th>
                          <th className="p-3">Descrição do Item / Serviço</th>
                          <th className="p-3 text-center">Qtde</th>
                          <th className="p-3 text-right">Valor Unit.</th>
                          <th className="p-3 text-right">Subtotal</th>
                          <th className="p-3 text-center">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {quoteItems.map((item, idx) => {
                          const matchingProduct = products.find(
                            (p) =>
                              p.id === item.productId ||
                              p.name.toLowerCase() === item.description.toLowerCase() ||
                              item.description.toLowerCase().includes(p.name.toLowerCase())
                          );

                          return (
                            <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                              <td className="p-3">
                                <div
                                  onClick={() => {
                                    if (matchingProduct?.imageUrl) {
                                      setZoomImage({ url: matchingProduct.imageUrl, title: item.description });
                                    }
                                  }}
                                  className={`w-9 h-9 rounded-lg bg-indigo-100/80 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700 ${matchingProduct?.imageUrl ? 'cursor-zoom-in hover:scale-105 transition-transform' : ''
                                    }`}
                                  title={matchingProduct?.imageUrl ? 'Clique para ver foto em tela cheia' : undefined}
                                >
                                  {matchingProduct?.imageUrl ? (
                                    <img
                                      src={matchingProduct.imageUrl}
                                      alt={item.description}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span>3D</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                                  placeholder="Descrição do item ou serviço..."
                                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 bg-slate-50/50 dark:bg-slate-800"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateItem(idx, 'quantity', Math.max(1, item.quantity - 1))}
                                    className="w-6 h-6 bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-95 text-slate-800 dark:text-slate-100 font-black rounded-lg flex items-center justify-center cursor-pointer shadow-2xs select-none"
                                  >
                                    -
                                  </button>
                                  <span className="w-7 text-center font-black text-slate-900 dark:text-slate-100 text-xs select-none">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateItem(idx, 'quantity', item.quantity + 1)}
                                    className="w-6 h-6 bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-95 text-slate-800 dark:text-slate-100 font-black rounded-lg flex items-center justify-center cursor-pointer shadow-2xs select-none"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <input
                                  type="number"
                                  step="0.10"
                                  value={item.unitPrice}
                                  onChange={(e) => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                                  className="w-20 text-right py-1 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800"
                                />
                              </td>
                              <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                R$ {item.subtotal.toFixed(2).replace('.', ',')}
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                                  title="Excluir item"
                                >
                                  <X className="w-4 h-4 text-rose-500" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Internal Logistics Memory & Cost Block (Hidden on Client PDF) */}
            <div className="p-4 bg-slate-50 dark:bg-[#181c26] border border-slate-200/80 dark:border-[#202531] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Custo Interno de Logística & Entrega
                </span>
                <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold rounded-full border border-amber-200 dark:border-amber-800">
                  🔒 Uso Interno Oficina (Oculto no PDF)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Modalidade de Logística / Deslocamento</label>
                  <select
                    value={internalLogisticsType}
                    onChange={(e) => setInternalLogisticsType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="combustivel">⛽ Combustível (Deslocamento Próprio)</option>
                    <option value="frete">🚚 Frete / Motoboy / Envio Terceirizado</option>
                    <option value="retirada">🚗 Sem Custo (Retirada na Oficina)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Custo Estimado (R$) — Salvo para {selectedClient?.name || 'Cliente'}
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    value={internalLogisticsCost}
                    onChange={(e) => setInternalLogisticsCost(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 font-black text-rose-600 dark:text-rose-400 text-sm"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                💡 Este valor é salvo na memória para {selectedClient?.name || 'este cliente'}, sugerindo R$ {internalLogisticsCost.toFixed(2).replace('.', ',')} na próxima vez, mas você pode editá-lo livremente caso faça mais viagens.
              </p>
            </div>

            {/* Totals & Conditions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 dark:bg-[#181c26] p-4 rounded-2xl border border-slate-200 dark:border-[#202531]">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Condições Comerciais / Modalidade</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    '⚡ Pagamento à Vista (PIX / Dinheiro)',
                    '🤝 Consignado (Acerto Periódico)',
                    '💳 50% no Pedido e 50% na Entrega',
                    '📅 Faturado a Prazo (30 Dias)',
                  ].map((preset) => {
                    const isSelected = paymentTerms === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleSelectPaymentTerms(preset)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer border ${isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/30'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => handleSelectPaymentTerms(e.target.value)}
                  placeholder="Ex: Pagamento à Vista com 5% de desconto via PIX..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Observações do Projeto</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instruções adicionais..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-3 text-right flex flex-col justify-end">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Subtotal:</span>
                  <span className="font-bold">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>

                {/* Linked Discount in % and R$ */}
                <div className="flex justify-between items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-xs">Desconto Concedido:</span>
                  <div className="flex items-center gap-2">
                    {/* Discount % Field */}
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="100"
                        value={discountPercent || ''}
                        onChange={(e) => {
                          const pct = Math.max(0, Math.min(100, Number(e.target.value)));
                          setDiscountPercent(pct);
                          if (subtotal > 0) {
                            const calcVal = Number(((subtotal * pct) / 100).toFixed(2));
                            setDiscount(calcVal);
                          }
                        }}
                        className="w-12 text-right font-bold text-rose-600 dark:text-rose-400 bg-transparent focus:outline-none text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0"
                      />
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500">%</span>
                    </div>

                    {/* Discount R$ Field */}
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg">
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500">R$</span>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={discount || ''}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value));
                          setDiscount(val);
                          if (subtotal > 0) {
                            const calcPct = Number(((val / subtotal) * 100).toFixed(1));
                            setDiscountPercent(calcPct);
                          }
                        }}
                        className="w-16 text-right font-bold text-rose-600 dark:text-rose-400 bg-transparent focus:outline-none text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between text-slate-900 dark:text-slate-100 text-base font-black border-t border-slate-200 dark:border-slate-700 pt-2">
                  <span>TOTAL FINAL:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>

            {/* Validation Error Alert */}
            {validationMessage && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 font-bold text-xs animate-in fade-in duration-150">
                ⚠️ {validationMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="order-3 sm:order-1 px-4 py-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl font-semibold text-xs transition-colors cursor-pointer text-center"
              >
                Cancelar
              </button>
              <div className="order-1 sm:order-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSubmitQuote('Rascunho')}
                  className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs shadow-2xs transition-colors cursor-pointer whitespace-nowrap text-center"
                >
                  Salvar Rascunho
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitQuote('Enviado')}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Marcar como Enviado</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview PDF Modal Document */}
      {previewPdfQuote && (
        <div className="printable-quote-modal fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 print:p-0 print:bg-white">

          <div className="print-container bg-white dark:bg-[#12151c] w-full max-w-3xl rounded-2xl border border-slate-300 dark:border-[#202531] overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header (Hidden on Print) */}
            <div className="no-print p-4 bg-slate-800 dark:bg-[#181c26] text-white flex items-center justify-between border-b border-slate-700 dark:border-[#202531]">
              <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" /> Preview do Documento PDF (Formato A4)
              </span>
              <button
                onClick={() => setPreviewPdfQuote(null)}
                className="p-1 hover:bg-slate-700 dark:hover:bg-slate-800 rounded-lg text-slate-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* A4 Sheet Rendering (Dark mode compatible preview, pure white print) */}
            <div className="print-sheet p-5 sm:p-10 overflow-y-auto space-y-6 text-xs bg-white dark:bg-[#12151c] text-slate-900 dark:text-slate-100 font-sans">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 dark:border-slate-700 pb-5 gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">RN 3D Soluções</h2>
                  <p className="text-xs font-black text-slate-900 dark:text-slate-200 mt-1">CNPJ: 67.570.155/0001-34</p>
                  <p className="text-[11px] text-slate-700 dark:text-slate-400 font-semibold mt-1">
                    WhatsApp: (22) 99754-0815 • Instagram: @rn3d.solucoes
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="px-3 py-1 bg-slate-900 dark:bg-indigo-600 text-white font-mono font-bold rounded-md text-xs inline-block whitespace-nowrap shadow-xs">
                    ORÇAMENTO {previewPdfQuote.id}
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 text-xs">Data: {previewPdfQuote.date}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Validade: {previewPdfQuote.validityDays} dias</p>
                </div>
              </div>

              {/* Client info */}
              <div className="p-4 bg-slate-50 dark:bg-[#181c26] rounded-xl border border-slate-200 dark:border-[#202531] space-y-1">
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">CLIENTE: {previewPdfQuote.clientName}</p>
                {previewPdfQuote.clientDocument && (
                  <p className="text-slate-600 dark:text-slate-400 font-medium">CPF/CNPJ: {previewPdfQuote.clientDocument}</p>
                )}
              </div>

              {/* Table with Image Thumbnails */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[320px]">
                  <thead>
                    <tr className="border-b-2 border-slate-200 dark:border-[#202531] text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-1.5 sm:px-3">Item / Descrição</th>
                      <th className="py-2.5 px-1.5 sm:px-3 text-center whitespace-nowrap">Qtde</th>
                      <th className="py-2.5 px-1.5 sm:px-3 text-right whitespace-nowrap">Valor Unit.</th>
                      <th className="py-2.5 px-1.5 sm:px-3 text-right whitespace-nowrap">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {previewPdfQuote.items.map((item, idx) => {
                      const matchingProduct = products.find(
                        (p) =>
                          p.id === item.productId ||
                          p.name.toLowerCase() === item.description.toLowerCase() ||
                          item.description.toLowerCase().includes(p.name.toLowerCase())
                      );

                      return (
                        <tr key={idx}>
                          <td className="py-2.5 px-1.5 sm:px-3 font-medium">
                            <div className="flex items-center gap-2.5">
                              {matchingProduct?.imageUrl ? (
                                <img
                                  src={matchingProduct.imageUrl}
                                  alt=""
                                  className="w-9 h-9 sm:w-10 sm:h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                                  3D
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">{item.description}</p>
                                {matchingProduct?.storageCapacity && (
                                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                                    Cap: {matchingProduct.storageCapacity}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-1.5 sm:px-3 text-center font-semibold text-slate-700 dark:text-slate-400 whitespace-nowrap">{item.quantity}</td>
                          <td className="py-2.5 px-1.5 sm:px-3 text-right text-slate-600 dark:text-slate-400 whitespace-nowrap">R$ {item.unitPrice.toFixed(2).replace('.', ',')}</td>
                          <td className="py-2.5 px-1.5 sm:px-3 text-right font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            R$ {item.subtotal.toFixed(2).replace('.', ',')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="print-avoid-break border-t-2 border-slate-200 dark:border-[#202531] pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div className="space-y-1 text-[11px] max-w-md">
                  <p className="dark:text-slate-300">
                    <strong className="dark:text-slate-100">Condições de Pagamento:</strong> {previewPdfQuote.paymentTerms}
                  </p>
                  <p className="dark:text-slate-300">
                    <strong className="dark:text-slate-100">Prazo de Produção:</strong> {previewPdfQuote.productionSlaDays} dias úteis
                  </p>
                  {previewPdfQuote.notes && (
                    <p className="text-slate-500 dark:text-slate-400 italic">{previewPdfQuote.notes}</p>
                  )}
                </div>

                <div className="text-left sm:text-right space-y-1 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-2 sm:pt-0">
                  <p className="text-slate-500 dark:text-slate-400">Subtotal: R$ {previewPdfQuote.subtotal.toFixed(2).replace('.', ',')}</p>
                  {previewPdfQuote.discount > 0 && (
                    <p className="text-rose-600 dark:text-rose-400 font-semibold">Desconto: -R$ {previewPdfQuote.discount.toFixed(2).replace('.', ',')}</p>
                  )}
                  <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 pt-1 border-t border-slate-300 dark:border-slate-700">
                    TOTAL: R$ {previewPdfQuote.total.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="print-avoid-break pt-6 border-t border-slate-200 dark:border-[#202531] text-center text-[10px] text-slate-600 dark:text-slate-400 space-y-1">
                <p className="font-bold text-slate-900 dark:text-slate-200">
                  RN 3D Soluções • CNPJ: 67.570.155/0001-34 • WhatsApp: (22) 99754-0815 • Instagram: @rn3d.solucoes
                </p>
                <p>Obrigado pela preferência e confiança em nosso trabalho!</p>
              </div>
            </div>

            {/* Modal Bottom Actions (Hidden on Print) */}
            <div className="no-print p-4 bg-slate-50 dark:bg-[#181c26] border-t border-slate-100 dark:border-[#202531] flex items-center justify-end gap-3">
              <button
                onClick={() => setPreviewPdfQuote(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  const originalTitle = document.title;
                  document.title = `${previewPdfQuote.id} - ${previewPdfQuote.clientName} - RN 3D`;
                  window.print();
                  setTimeout(() => {
                    document.title = originalTitle;
                  }, 1000);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs inline-flex items-center gap-1.5 transition-all"
              >
                <Printer className="w-4 h-4" /> Baixar / Imprimir PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
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
