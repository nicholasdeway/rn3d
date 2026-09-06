import React, { useState, useMemo } from 'react';
import { SaleTransaction, Consignment, Order, ExpenseItem, Client, Product } from '../types';
import { OrderPdfViewerModal } from '../components/OrderPdfViewerModal';
import {
  DollarSign,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  Plus,
  X,
  HandCoins,
  TrendingUp,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  Tag,
  FileText,
  Loader2,
  Trash2,
} from 'lucide-react';
import { formatDateBR, parseBRDate } from '../utils/formatters';

interface FinancialViewProps {
  transactions: SaleTransaction[];
  consignments?: Consignment[];
  orders?: Order[];
  expenses?: ExpenseItem[];
  clients?: Client[];
  products?: Product[];
  onUpdateOrderPayment?: (
    orderId: string,
    additionalAmount: number,
    receiptUrl?: string,
    receiptType?: 'image' | 'pdf',
    receiptName?: string
  ) => void;
  onRecordPayment?: (
    orderId: string,
    additionalAmount: number,
    receiptUrl?: string,
    receiptType?: 'image' | 'pdf',
    receiptName?: string
  ) => void;
  onDeleteExpense?: (id: string) => void;
}

export const FinancialView: React.FC<FinancialViewProps> = ({
  transactions = [],
  consignments = [],
  orders = [],
  expenses = [],
  clients = [],
  products = [],
  onUpdateOrderPayment,
  onRecordPayment,
  onDeleteExpense,
}) => {
  const handlePayment = onUpdateOrderPayment || onRecordPayment;

  const [tab, setTab] = useState<'extrato' | 'entradas' | 'receber'>('extrato');
  const [period, setPeriod] = useState<string>('Este Mês');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showCustomPicker, setShowCustomPicker] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [movementType, setMovementType] = useState<'todos' | 'entradas' | 'saidas'>('todos');

  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [selectedOrderForPdfModal, setSelectedOrderForPdfModal] = useState<Order | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState<string>('');
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState<string>('');
  const [paymentReceiptType, setPaymentReceiptType] = useState<'image' | 'pdf'>('image');
  const [paymentReceiptName, setPaymentReceiptName] = useState<string>('');

  // Pagination state (10 items per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [tab, period, customStartDate, customEndDate, searchTerm, movementType]);

  // Auxiliary Date Parser (Handles ISO, YYYY-MM-DD, DD/MM/YYYY, YYYY/MM/DD)
  const parseToDate = parseBRDate;

  // Compute Active Date Range Window
  const { dateRangeStart, dateRangeEnd, labelPeriodText } = useMemo(() => {
    const now = new Date();
    const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (period === 'Hoje') {
      return {
        dateRangeStart: todayZero,
        dateRangeEnd: todayEnd,
        labelPeriodText: `Hoje (${todayZero.toLocaleDateString('pt-BR')})`,
      };
    }
    if (period === '7 dias') {
      const start = new Date(todayZero);
      start.setDate(start.getDate() - 6);
      return {
        dateRangeStart: start,
        dateRangeEnd: todayEnd,
        labelPeriodText: `Últimos 7 dias (${start.toLocaleDateString('pt-BR')} a ${todayEnd.toLocaleDateString('pt-BR')})`,
      };
    }
    if (period === '30 dias') {
      const start = new Date(todayZero);
      start.setDate(start.getDate() - 29);
      return {
        dateRangeStart: start,
        dateRangeEnd: todayEnd,
        labelPeriodText: `Últimos 30 dias (${start.toLocaleDateString('pt-BR')} a ${todayEnd.toLocaleDateString('pt-BR')})`,
      };
    }
    if (period === 'Este Mês') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return {
        dateRangeStart: start,
        dateRangeEnd: end,
        labelPeriodText: `Este Mês (${start.toLocaleDateString('pt-BR')} a ${end.toLocaleDateString('pt-BR')})`,
      };
    }
    if (period === 'Este Ano') {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return {
        dateRangeStart: start,
        dateRangeEnd: end,
        labelPeriodText: `Ano de ${now.getFullYear()}`,
      };
    }
    if (period === 'Personalizado') {
      const start = customStartDate ? parseToDate(customStartDate) : null;
      const end = customEndDate ? parseToDate(customEndDate) : (start ? new Date(start) : null);

      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);

      let text = 'Período Personalizado';
      if (start && end) {
        text = start.toDateString() === end.toDateString()
          ? `Data: ${start.toLocaleDateString('pt-BR')}`
          : `De ${start.toLocaleDateString('pt-BR')} até ${end.toLocaleDateString('pt-BR')}`;
      } else if (start) {
        text = `A partir de ${start.toLocaleDateString('pt-BR')}`;
      } else if (end) {
        text = `Até ${end.toLocaleDateString('pt-BR')}`;
      }

      return {
        dateRangeStart: start,
        dateRangeEnd: end,
        labelPeriodText: text,
      };
    }

    return {
      dateRangeStart: null,
      dateRangeEnd: null,
      labelPeriodText: 'Todo o Histórico',
    };
  }, [period, customStartDate, customEndDate]);

  // Evaluator function to check if item date falls within selected range
  const isDateInRange = (dateStr?: string | null): boolean => {
    if (!dateRangeStart && !dateRangeEnd) return true;
    const d = parseToDate(dateStr);
    if (!d) return true;

    if (dateRangeStart && d.getTime() < dateRangeStart.getTime()) return false;
    if (dateRangeEnd && d.getTime() > dateRangeEnd.getTime()) return false;
    return true;
  };

  const handlePaymentFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.type.toLowerCase().includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
    const reader = new FileReader();

    reader.onloadend = () => {
      const base64Url = reader.result as string;
      setPaymentReceiptUrl(base64Url);
      setPaymentReceiptType(isPdf ? 'pdf' : 'image');
      setPaymentReceiptName(file.name);
    };

    reader.readAsDataURL(file);
  };

  // Filter out standalone transactions auto-created for orders and system sync items
  const filteredTransactions = transactions.filter(
    (t) =>
      !(
        t.type === 'Recebimento de Pedido' ||
        (t.notes && typeof t.notes === 'string' && t.notes.toLowerCase().includes('referente ao pedido')) ||
        (t.id && String(t.id).startsWith('PAG-') && orders.some((o) => o.clientName === t.clientName && Math.abs(o.totalValue - t.amount) < 0.01))
      )
  );

  // Clean expenses (exclude SYS_ internal balance rows)
  const cleanExpenses = expenses.filter(
    (exp) => !exp.referenceCode?.startsWith('SYS_') && exp.category !== 'Transferência de Marketplace'
  );

  // Extrato Entries: Entradas & Saídas combinadas (Transações de Caixa e Lançamentos)
  const allExtratoEntries = useMemo(() => {
    // 1. Transaction Entries (Entradas Balcão)
    const txEntries = filteredTransactions
      .filter((t) => isDateInRange(t.timestamp || t.date || t.dueDate))
      .map((t) => ({
        type: 'transaction' as const,
        direction: 'entrada' as const,
        data: t,
        id: t.id,
        date: t.timestamp || t.dueDate || '',
        title: `Venda / Transação #${t.id}`,
        clientOrCategory: t.clientName || 'Cliente Balcão',
        amount: t.amount || 0,
        paidAmount: t.amount || 0,
        totalValue: t.amount || 0,
        status: t.status || 'Recebido',
      }));

    // 2. Expense Entries (Saídas e Entradas de Pedido / Aportes / Transferências)
    const expenseEntries = cleanExpenses
      .filter((exp) => isDateInRange(exp.date || exp.timestamp))
      .map((exp) => {
        const isEntrada =
          exp.category === 'Entrada de Pedido' ||
          exp.category === 'Transferência de Marketplace' ||
          exp.category === 'Aporte / Reembolso de Sócio';
        return {
          type: 'expense' as const,
          direction: (isEntrada ? 'entrada' : 'saida') as 'entrada' | 'saida',
          data: exp,
          id: exp.id,
          date: exp.date || exp.timestamp || '',
          title: exp.description || 'Despesa Operacional',
          clientOrCategory: exp.category,
          amount: exp.amount || 0,
          paidAmount: exp.paymentStatus === 'Pago' ? exp.amount : 0,
          totalValue: exp.amount || 0,
          status: exp.paymentStatus || 'Pago',
        };
      });

    // 3. Pending Order Entries (Contas a Receber pendentes)
    const pendingOrderEntries = orders
      .filter((o) => !o.id?.startsWith('SYS_') && !o.clientName?.startsWith('SISTEMA_'))
      .filter((o) => o.totalValue > (o.paidAmount || 0))
      .filter((o) => isDateInRange(o.date || o.createdAt))
      .map((o) => ({
        type: 'order' as const,
        direction: 'entrada' as const,
        data: o,
        id: o.id,
        date: o.date || o.createdAt || '',
        title: `Pedido #${o.id}`,
        clientOrCategory: o.clientName,
        amount: o.totalValue - (o.paidAmount || 0),
        paidAmount: o.paidAmount || 0,
        totalValue: o.totalValue || 0,
        status: o.paymentStatusText || (o.paidAmount > 0 ? 'Adiantamento' : 'Pendente'),
      }));

    const combined = [...txEntries, ...expenseEntries, ...pendingOrderEntries];

    // Search term filtering
    const searchFiltered = combined.filter((item) => {
      if (movementType !== 'todos' && item.direction !== movementType) return false;
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase().trim();
      return (
        item.id.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.clientOrCategory.toLowerCase().includes(q) ||
        item.amount.toString().includes(q) ||
        item.status.toLowerCase().includes(q)
      );
    });

    return searchFiltered.sort((a, b) => {
      const timeA = parseToDate(a.date)?.getTime() || 0;
      const timeB = parseToDate(b.date)?.getTime() || 0;
      return timeB - timeA;
    });
  }, [orders, filteredTransactions, cleanExpenses, dateRangeStart, dateRangeEnd, searchTerm, movementType]);

  // Calculate Filtered Summary Metrics for Header KPI cards
  const periodEntradas = useMemo(() => {
    return allExtratoEntries
      .filter((e) => e.direction === 'entrada')
      .reduce((acc, e) => acc + e.amount, 0);
  }, [allExtratoEntries]);

  const periodSaidas = useMemo(() => {
    return allExtratoEntries
      .filter((e) => e.direction === 'saida')
      .reduce((acc, e) => acc + e.amount, 0);
  }, [allExtratoEntries]);

  const periodSaldo = periodEntradas - periodSaidas;

  const totalReceivable = useMemo(() => {
    const ordersPending = orders
      .filter((o) => !o.id?.startsWith('SYS_') && isDateInRange(o.date || o.createdAt))
      .reduce((acc, o) => acc + Math.max(0, o.totalValue - (o.paidAmount || 0)), 0);
    const consignmentsPending = consignments
      .filter((c) => isDateInRange(c.date || c.createdAt))
      .reduce((acc, c) => acc + c.totalValue, 0);
    return ordersPending + consignmentsPending;
  }, [orders, consignments, dateRangeStart, dateRangeEnd]);

  const extratoTotalPages = Math.ceil(allExtratoEntries.length / ITEMS_PER_PAGE) || 1;
  const paginatedExtrato = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return allExtratoEntries.slice(start, start + ITEMS_PER_PAGE);
  }, [allExtratoEntries, currentPage]);

  // TAB 2 Data: Entradas em Caixa
  const allEntradasEntries = useMemo(() => {
    return allExtratoEntries.filter((e) => e.direction === 'entrada');
  }, [allExtratoEntries]);

  const entradasTotalPages = Math.ceil(allEntradasEntries.length / ITEMS_PER_PAGE) || 1;
  const paginatedEntradas = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return allEntradasEntries.slice(start, start + ITEMS_PER_PAGE);
  }, [allEntradasEntries, currentPage]);

  // TAB 3 Data: Contas a Receber
  const allReceberEntries = useMemo(() => {
    const pendingOrders = orders
      .filter((o) => !o.id?.startsWith('SYS_') && o.totalValue > (o.paidAmount || 0) && isDateInRange(o.date || o.createdAt))
      .map((o) => ({ type: 'order' as const, data: o, id: o.id, date: o.date || o.createdAt || '' }));
    const consignmentEntries = consignments
      .filter((c) => isDateInRange(c.date || c.createdAt))
      .map((c) => ({ type: 'consignment' as const, data: c, id: c.id, date: c.date || c.createdAt || '' }));
    return [...pendingOrders, ...consignmentEntries].sort((a, b) => {
      const timeA = parseToDate(a.date)?.getTime() || 0;
      const timeB = parseToDate(b.date)?.getTime() || 0;
      return timeB - timeA;
    });
  }, [orders, consignments, dateRangeStart, dateRangeEnd]);

  const receberTotalPages = Math.ceil(allReceberEntries.length / ITEMS_PER_PAGE) || 1;
  const paginatedReceber = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return allReceberEntries.slice(start, start + ITEMS_PER_PAGE);
  }, [allReceberEntries, currentPage]);

  const handleOpenPaymentModal = (order: Order) => {
    setSelectedOrderForPayment(order);
    const paid = order.paidAmount || 0;
    const remaining = Math.max(0, order.totalValue - paid);
    
    // Sugere 50% se for primeira parcela de contrato 50/50, senão sugere o saldo restante
    let defaultInput = remaining;
    if (paid === 0 && order.paymentTerms && (order.paymentTerms.includes('50%') || order.paymentTerms.includes('50/50'))) {
      defaultInput = order.totalValue * 0.5;
    }

    setPaymentAmountInput(defaultInput.toFixed(2).replace('.', ','));
    setPaymentReceiptUrl('');
    setPaymentReceiptType('image');
    setPaymentReceiptName('');
  };

  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForPayment || !handlePayment || isSubmittingPayment) return;
    const cleanStr = paymentAmountInput.replace(/\./g, '').replace(',', '.');
    const val = parseFloat(cleanStr);
    if (isNaN(val) || val <= 0) return;

    setIsSubmittingPayment(true);
    try {
      await handlePayment(
        selectedOrderForPayment.id,
        val,
        paymentReceiptUrl || undefined,
        paymentReceiptType,
        paymentReceiptName || undefined
      );
      setSelectedOrderForPayment(null);
      setPaymentAmountInput('');
      setPaymentReceiptUrl('');
      setPaymentReceiptType('image');
      setPaymentReceiptName('');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Interactive Date Filter */}
      <div className="bg-white dark:bg-[#12151c] p-6 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              Extrato Financeiro Completo (Entradas & Saídas)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
              <span>Acompanhamento detalhado de todas as receitas e despesas registradas.</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-extrabold rounded-full border border-indigo-200 dark:border-indigo-800 text-[11px]">
                {labelPeriodText}
              </span>
            </p>
          </div>

          {/* Period Presets & Interactive Calendar Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#181c26] p-1.5 rounded-xl border border-slate-200 dark:border-[#202531] flex-wrap">
            <button
              type="button"
              onClick={() => {
                setShowCustomPicker((prev) => !prev);
                if (period !== 'Personalizado') {
                  setPeriod('Personalizado');
                }
              }}
              title="Clique para selecionar intervalo de datas personalizado"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                showCustomPicker || period === 'Personalizado'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white dark:bg-[#12151c] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>Personalizado</span>
            </button>

            {['Hoje', '7 dias', '30 dias', 'Este Mês', 'Este Ano', 'Tudo'].map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPeriod(p);
                  setShowCustomPicker(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === p && !showCustomPicker
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range Panel (Data X até Y) */}
        {(showCustomPicker || period === 'Personalizado') && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/40 flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Selecionar período personalizado:</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <label className="text-slate-600 dark:text-slate-400 font-semibold">Data Inicial (De):</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    setPeriod('Personalizado');
                  }}
                  className="px-3 py-1.5 bg-white dark:bg-[#12151c] border border-slate-200 dark:border-[#202531] rounded-lg text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <label className="text-slate-600 dark:text-slate-400 font-semibold">Data Final (Até):</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setPeriod('Personalizado');
                  }}
                  className="px-3 py-1.5 bg-white dark:bg-[#12151c] border border-slate-200 dark:border-[#202531] rounded-lg text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(customStartDate || customEndDate) && (
                <button
                  onClick={() => {
                    setCustomStartDate('');
                    setCustomEndDate('');
                    setPeriod('Este Mês');
                    setShowCustomPicker(false);
                  }}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Limpar Filtro
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dynamic KPI Cards for Selected Period (Definance 2x2 Mobile Layout) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Entradas */}
        <div className="definance-kpi-card bg-white dark:bg-[#12151c] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs hover:border-emerald-500/40 cursor-pointer">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
              Total Entradas (Receitas)
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 sm:mt-3 tracking-tight truncate">
            R$ {periodEntradas.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 truncate">
            {period}
          </p>
        </div>

        {/* Total Saídas */}
        <div className="definance-kpi-card bg-white dark:bg-[#12151c] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs hover:border-rose-500/40 cursor-pointer">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
              Total Saídas (Despesas)
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-2 sm:mt-3 tracking-tight truncate">
            R$ {periodSaidas.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-[10px] sm:text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1 truncate">
            {period}
          </p>
        </div>

        {/* Resultado do Período (Saldo) */}
        <div className="definance-kpi-card bg-white dark:bg-[#12151c] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs hover:border-indigo-500/40 cursor-pointer">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
              Resultado do Período
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-lg sm:text-2xl font-black mt-2 sm:mt-3 tracking-tight truncate ${
            periodSaldo >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            R$ {periodSaldo.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 truncate">
            Entradas − Saídas
          </p>
        </div>

        {/* Saldo a Receber */}
        <div className="definance-kpi-card bg-white dark:bg-[#12151c] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs hover:border-blue-500/40 cursor-pointer">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
              Saldo a Receber
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 sm:mt-3 tracking-tight truncate">
            R$ {totalReceivable.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 truncate">
            Pendente no período
          </p>
        </div>
      </div>

      {/* Search & Movement Type Filter Controls */}
      <div className="bg-white dark:bg-[#12151c] p-4 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código, cliente, fornecedor ou categoria..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-semibold"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#181c26] p-1 rounded-xl border border-slate-200 dark:border-[#202531] text-xs font-bold w-full md:w-auto">
          <button
            onClick={() => setMovementType('todos')}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
              movementType === 'todos'
                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setMovementType('entradas')}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
              movementType === 'entradas'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> Entradas
          </button>
          <button
            onClick={() => setMovementType('saidas')}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
              movementType === 'saidas'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" /> Saídas
          </button>
        </div>
      </div>

      {/* Navigation Tabs (Segmented Control side-by-side on Mobile and Desktop) */}
      <div className="bg-slate-100 dark:bg-[#12151c] p-1.5 rounded-2xl border border-slate-200 dark:border-[#202531] shadow-xs grid grid-cols-3 gap-1 sm:gap-1.5">
        <button
          onClick={() => setTab('extrato')}
          className={`py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
            tab === 'extrato'
              ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span className="hidden sm:inline">Extrato Completo</span>
          <span className="sm:hidden">Extrato</span>
          <span className="px-1.5 py-0.5 bg-indigo-100/60 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-full text-[10px] whitespace-nowrap">
            ({allExtratoEntries.length})
          </span>
        </button>
        <button
          onClick={() => setTab('entradas')}
          className={`py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
            tab === 'entradas'
              ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span className="hidden sm:inline">Entradas em Caixa</span>
          <span className="sm:hidden">Entradas</span>
          <span className="px-1.5 py-0.5 bg-emerald-100/60 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] whitespace-nowrap">
            ({allEntradasEntries.length})
          </span>
        </button>
        <button
          onClick={() => setTab('receber')}
          className={`py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
            tab === 'receber'
              ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span className="hidden sm:inline">Contas a Receber</span>
          <span className="sm:hidden">A Receber</span>
          <span className="px-1.5 py-0.5 bg-amber-100/60 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 rounded-full text-[10px] whitespace-nowrap">
            ({allReceberEntries.length})
          </span>
        </button>
      </div>

      {/* TAB 1: Extrato Completo de Vendas & Pedidos */}
      {tab === 'extrato' && (
        <div className="bg-white dark:bg-[#12151c] rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs overflow-hidden">
          {allExtratoEntries.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Wallet className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">Nenhum pedido ou transação financeira</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Assim que orçamentos forem convertidos em pedidos ou vendas forem efetuadas, o faturamento aparecerá aqui.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile View: Financial Cards */}
              <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedExtrato.map((entry) => {
                  if (entry.type === 'order') {
                    const o = entry.data as Order;
                    const paid = o.paidAmount || 0;
                    const pending = Math.max(0, o.totalValue - paid);
                    const isFullyPaid = pending === 0;

                    let statusBadge = 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50';
                    if (isFullyPaid) statusBadge = 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/80 font-extrabold';
                    else if (paid > 0) statusBadge = 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/50 font-bold';

                    return (
                      <div key={o.id} className="p-4 space-y-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">{o.id}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] border shrink-0 whitespace-nowrap ${statusBadge}`}>
                            {isFullyPaid ? 'Totalmente Pago' : o.paymentStatusText || 'Pendente'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-slate-900 dark:text-slate-100 flex-1 min-w-0 pr-1 leading-snug break-words">{o.clientName}</span>
                          <span className="text-slate-500 dark:text-slate-400 text-[11px] shrink-0 whitespace-nowrap">{formatDateBR(o.date)}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 p-2.5 bg-slate-50 dark:bg-[#181c26] rounded-xl border border-slate-200/60 dark:border-[#202531] text-[11px]">
                          <div>
                            <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Total</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">R$ {o.totalValue.toFixed(2).replace('.', ',')}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Caixa</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">R$ {paid.toFixed(2).replace('.', ',')}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Saldo</span>
                            <span className="font-extrabold text-rose-600 dark:text-rose-400 whitespace-nowrap">R$ {pending.toFixed(2).replace('.', ',')}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForPdfModal(o)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-500" /> PDF do Pedido
                          </button>
                          {!isFullyPaid ? (
                            <button
                              onClick={() => handleOpenPaymentModal(o)}
                              className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <HandCoins className="w-4 h-4" /> Registrar Recebimento
                            </button>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-4 h-4" /> Quitado
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  } else if (entry.type === 'expense') {
                    const exp = entry.data as ExpenseItem;
                    const isEntrada = entry.direction === 'entrada';
                    return (
                      <div key={exp.id} className={`p-4 space-y-2.5 ${isEntrada ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : 'bg-rose-50/40 dark:bg-rose-950/20'}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-xs flex items-center gap-1">
                            <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${isEntrada ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {isEntrada ? '+ ENTRADA' : '- SAÍDA'}
                            </span>
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 text-[11px] shrink-0 whitespace-nowrap">{formatDateBR(exp.date)}</span>
                        </div>

                        <div className="flex items-start justify-between gap-3 text-xs">
                          <span className="font-bold text-slate-900 dark:text-slate-100 flex-1 min-w-0 pr-1 leading-snug break-words">{exp.description}</span>
                          <span className={`font-black text-sm whitespace-nowrap shrink-0 text-right ${isEntrada ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {isEntrada ? '+' : '-'} R$ {exp.amount.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Categoria: {exp.category}</p>
                      </div>
                    );
                  } else {
                    const t = entry.data as SaleTransaction;
                    return (
                      <div key={t.id} className="p-4 space-y-2.5 bg-slate-50/40 dark:bg-slate-900/40">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs shrink-0">{t.id}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80 shrink-0 whitespace-nowrap">
                            {t.status || 'Recebido'} ({t.paymentMethod || 'PIX'})
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-3 text-xs">
                          <span className="font-bold text-slate-900 dark:text-slate-100 flex-1 min-w-0 pr-1 leading-snug break-words">{t.clientName}</span>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap shrink-0 text-right">R$ {t.amount.toFixed(2).replace('.', ',')}</span>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>

              {/* Desktop / Tablet View: Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#181c26] border-b border-slate-200 dark:border-[#202531] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-4 whitespace-nowrap">Código / Tipo</th>
                      <th className="p-4 whitespace-nowrap">Origem / Descrição</th>
                      <th className="p-4 whitespace-nowrap">Data</th>
                      <th className="p-4 text-right whitespace-nowrap">Valor Total</th>
                      <th className="p-4 text-right whitespace-nowrap">Entrou em Caixa</th>
                      <th className="p-4 text-right whitespace-nowrap">A Receber / Saldo</th>
                      <th className="p-4 text-center whitespace-nowrap">Status Pagamento</th>
                      <th className="p-4 text-right whitespace-nowrap">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                    {paginatedExtrato.map((entry) => {
                      if (entry.type === 'order') {
                        const o = entry.data as Order;
                        const paid = o.paidAmount || 0;
                        const pending = Math.max(0, o.totalValue - paid);
                        const isFullyPaid = pending === 0;

                        let statusBadge = 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50';
                        if (isFullyPaid) statusBadge = 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/80 font-extrabold';
                        else if (paid > 0) statusBadge = 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/50 font-bold';

                        return (
                          <tr key={o.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                            <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{o.id}</td>
                            <td className="p-4 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{o.clientName}</td>
                            <td className="p-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDateBR(o.date)}</td>
                            <td className="p-4 text-right font-extrabold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                              R$ {o.totalValue.toFixed(2).replace('.', ',')}
                            </td>
                            <td className="p-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                              R$ {paid.toFixed(2).replace('.', ',')}
                            </td>
                            <td className="p-4 text-right font-extrabold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                              R$ {pending.toFixed(2).replace('.', ',')}
                            </td>
                            <td className="p-4 text-center whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] border inline-flex items-center justify-center gap-1 whitespace-nowrap ${statusBadge}`}>
                                {isFullyPaid && <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                                <span>{isFullyPaid ? 'Totalmente Pago' : o.paymentStatusText || 'Pendente'}</span>
                              </span>
                            </td>
                            <td className="p-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderForPdfModal(o)}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Visualizar PDF do Pedido em A4"
                                >
                                  <FileText className="w-3.5 h-3.5 text-indigo-500" /> Ver PDF
                                </button>
                                {!isFullyPaid ? (
                                  <button
                                    onClick={() => handleOpenPaymentModal(o)}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 whitespace-nowrap"
                                  >
                                    <HandCoins className="w-3.5 h-3.5" /> Registrar Recebimento
                                  </button>
                                ) : (
                                  <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-lg font-bold inline-flex items-center gap-1 border border-emerald-300 dark:border-emerald-800/80 text-xs shrink-0 whitespace-nowrap">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Quitado
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      } else if (entry.type === 'expense') {
                        const exp = entry.data as ExpenseItem;
                        const isEntrada = entry.direction === 'entrada';
                        return (
                          <tr key={exp.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors ${isEntrada ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : 'bg-rose-50/30 dark:bg-rose-950/20'}`}>
                            <td className="p-4 font-mono font-bold whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold inline-flex items-center gap-1 ${
                                isEntrada
                                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                                  : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300'
                              }`}>
                                {isEntrada ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                <span>{isEntrada ? '+ ENTRADA' : '- SAÍDA'}</span>
                              </span>
                            </td>
                            <td className="p-4 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                              {exp.description}
                              <span className="block text-[10px] text-slate-400 font-normal">Categoria: {exp.category}</span>
                            </td>
                            <td className="p-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDateBR(exp.date)}</td>
                            <td className="p-4 text-right font-extrabold whitespace-nowrap">
                              <span className={isEntrada ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                {isEntrada ? '+' : '-'} R$ {exp.amount.toFixed(2).replace('.', ',')}
                              </span>
                            </td>
                            <td className="p-4 text-right font-extrabold text-slate-500 whitespace-nowrap">
                              R$ {exp.paymentStatus === 'Pago' ? exp.amount.toFixed(2).replace('.', ',') : '0,00'}
                            </td>
                            <td className="p-4 text-right font-extrabold text-slate-400 whitespace-nowrap">
                              R$ {exp.paymentStatus === 'Pendente' ? exp.amount.toFixed(2).replace('.', ',') : '0,00'}
                            </td>
                            <td className="p-4 text-center whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center justify-center gap-1 ${
                                exp.paymentStatus === 'Pago'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}>
                                <span>{exp.paymentStatus || 'Pago'}</span>
                              </span>
                            </td>
                            <td className="p-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                <span className="text-[11px] font-semibold text-slate-400">
                                  {isEntrada ? 'Registrado em Entradas' : 'Registrado em Despesas'}
                                </span>
                                {onDeleteExpense && (
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Deseja apagar este lançamento ("${exp.description}")?`)) {
                                        onDeleteExpense(exp.id);
                                      }
                                    }}
                                    title="Excluir este lançamento"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      } else {
                        const t = entry.data as SaleTransaction;
                        return (
                          <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors bg-slate-50/40 dark:bg-slate-900/40">
                            <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{t.id}</td>
                            <td className="p-4 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{t.clientName}</td>
                            <td className="p-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDateBR(t.timestamp || t.dueDate)}</td>
                            <td className="p-4 text-right font-extrabold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                              R$ {t.amount.toFixed(2).replace('.', ',')}
                            </td>
                            <td className="p-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                              R$ {t.amount.toFixed(2).replace('.', ',')}
                            </td>
                            <td className="p-4 text-right font-extrabold text-slate-400 dark:text-slate-500 whitespace-nowrap">R$ 0,00</td>
                            <td className="p-4 text-center whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80 inline-flex items-center justify-center gap-1 whitespace-nowrap">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>{t.status || 'Recebido'} ({t.paymentMethod || 'PIX'})</span>
                              </span>
                            </td>
                            <td className="p-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-lg font-bold inline-flex items-center gap-1 border border-emerald-300 dark:border-emerald-800/80 text-xs shrink-0 whitespace-nowrap">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Quitado
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls for Extrato */}
              {allExtratoEntries.length > 10 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-[#181c26] border-t border-slate-200 dark:border-[#202531] text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Mostrando <span className="font-bold text-slate-900 dark:text-slate-100">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> a{' '}
                    <span className="font-bold text-slate-900 dark:text-slate-100">{Math.min(currentPage * ITEMS_PER_PAGE, allExtratoEntries.length)}</span> de{' '}
                    <span className="font-bold text-slate-900 dark:text-slate-100">{allExtratoEntries.length}</span> registros
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#202531] bg-white dark:bg-[#12151c] text-slate-700 dark:text-slate-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: extratoTotalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`w-8 h-8 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                            currentPage === p
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white dark:bg-[#12151c] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#202531] hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    <button
                      disabled={currentPage === extratoTotalPages}
                      onClick={() => setCurrentPage((p) => Math.min(extratoTotalPages, p + 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#202531] bg-white dark:bg-[#12151c] text-slate-700 dark:text-slate-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      Próxima <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 2: Entradas em Caixa (Pagamentos Confirmados) */}
      {tab === 'entradas' && (
        <div className="bg-white dark:bg-[#12151c] rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs overflow-hidden">
          {allEntradasEntries.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Wallet className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">Nenhuma entrada registrada</h3>
            </div>
          ) : (
            <>
              {/* Mobile View */}
              <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedEntradas.map((entry) => {
                  if (entry.type === 'order') {
                    const o = entry.data as Order;
                    return (
                      <div key={o.id} className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">{o.id}</span>
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">{formatDateBR(o.date)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{o.clientName}</span>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400">R$ {(o.paidAmount || 0).toFixed(2).replace('.', ',')}</span>
                        </div>
                        <span className="inline-block px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 rounded-full font-bold text-[10px]">
                          ✓ Recebido no Sinal / Entrada
                        </span>
                      </div>
                    );
                  } else {
                    const t = entry.data as SaleTransaction;
                    return (
                      <div key={t.id} className="p-4 space-y-2 bg-slate-50/40 dark:bg-slate-900/40">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">{t.id}</span>
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">{formatDateBR(t.timestamp || t.dueDate)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{t.clientName}</span>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400">R$ {t.amount.toFixed(2).replace('.', ',')}</span>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>

              {/* Desktop View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#181c26] border-b border-slate-200 dark:border-[#202531] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-4 whitespace-nowrap">Origem / Código</th>
                      <th className="p-4 whitespace-nowrap">Cliente</th>
                      <th className="p-4 whitespace-nowrap">Data</th>
                      <th className="p-4 text-right whitespace-nowrap">Valor Entrado em Caixa</th>
                      <th className="p-4 text-center whitespace-nowrap">Status de Confirmação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                    {paginatedEntradas.map((entry) => {
                      if (entry.type === 'order') {
                        const o = entry.data as Order;
                        return (
                          <tr key={o.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                            <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{o.id}</td>
                            <td className="p-4 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{o.clientName}</td>
                            <td className="p-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDateBR(o.date)}</td>
                            <td className="p-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                              R$ {(o.paidAmount || 0).toFixed(2).replace('.', ',')}
                            </td>
                            <td className="p-4 text-center whitespace-nowrap">
                              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/50 rounded-full font-bold text-emerald-700 dark:text-emerald-300 text-[10px] inline-flex items-center justify-center gap-1 whitespace-nowrap">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>Recebido no Sinal / Entrada</span>
                              </span>
                            </td>
                          </tr>
                        );
                      } else {
                        const t = entry.data as SaleTransaction;
                        return (
                          <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                            <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{t.id}</td>
                            <td className="p-4 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{t.clientName}</td>
                            <td className="p-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDateBR(t.timestamp || t.dueDate)}</td>
                            <td className="p-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                              R$ {t.amount.toFixed(2).replace('.', ',')}
                            </td>
                            <td className="p-4 text-center whitespace-nowrap">
                              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/50 rounded-full font-bold text-emerald-700 dark:text-emerald-300 text-[10px] inline-flex items-center justify-center gap-1 whitespace-nowrap">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>Venda Confirmada ({t.paymentMethod})</span>
                              </span>
                            </td>
                          </tr>
                        );
                      }
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls for Entradas */}
              {allEntradasEntries.length > 10 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-[#181c26] border-t border-slate-200 dark:border-[#202531] text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Mostrando <span className="font-bold text-slate-900 dark:text-slate-100">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> a{' '}
                    <span className="font-bold text-slate-900 dark:text-slate-100">{Math.min(currentPage * ITEMS_PER_PAGE, allEntradasEntries.length)}</span> de{' '}
                    <span className="font-bold text-slate-900 dark:text-slate-100">{allEntradasEntries.length}</span> registros
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#202531] bg-white dark:bg-[#12151c] text-slate-700 dark:text-slate-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: entradasTotalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`w-8 h-8 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                            currentPage === p
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white dark:bg-[#12151c] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#202531] hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    <button
                      disabled={currentPage === entradasTotalPages}
                      onClick={() => setCurrentPage((p) => Math.min(entradasTotalPages, p + 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#202531] bg-white dark:bg-[#12151c] text-slate-700 dark:text-slate-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      Próxima <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 3: Contas a Receber / Financiados */}
      {tab === 'receber' && (
        <div className="bg-white dark:bg-[#12151c] rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs overflow-hidden">
          {allReceberEntries.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Wallet className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">Nenhum valor pendente a receber</h3>
            </div>
          ) : (
            <>
              {/* Mobile View */}
              <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedReceber.map((entry) => {
                  if (entry.type === 'order') {
                    const o = entry.data as Order;
                    const paid = o.paidAmount || 0;
                    const remaining = o.totalValue - paid;
                    const isPartial = paid > 0 && paid < o.totalValue;

                    return (
                      <div key={o.id} className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">{o.id}</span>
                            {isPartial && (
                              <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                Adiantamento
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">{o.clientName}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 dark:bg-[#181c26] rounded-xl border border-slate-200/60 dark:border-[#202531] text-[11px]">
                          <div>
                            <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Total</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">R$ {o.totalValue.toFixed(2).replace('.', ',')}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Já Pago</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">R$ {paid.toFixed(2).replace('.', ',')}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Pendente</span>
                            <span className="font-extrabold text-rose-600 dark:text-rose-400">R$ {remaining.toFixed(2).replace('.', ',')}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenPaymentModal(o)}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <HandCoins className="w-4 h-4" />
                          {paid > 0 ? `Quitar Saldo Restante (R$ ${remaining.toFixed(2).replace('.', ',')})` : 'Dar Baixa / Registrar Entrada'}
                        </button>
                      </div>
                    );
                  } else {
                    const c = entry.data as Consignment;
                    return (
                      <div key={c.id} className="p-4 space-y-2 bg-purple-50/30 dark:bg-purple-950/20">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-purple-600 dark:text-purple-400 text-xs">{c.id} (Consignação)</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{c.clientName}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">Valor em Loja:</span>
                          <span className="font-extrabold text-indigo-600 dark:text-indigo-400">R$ {c.totalValue.toFixed(2).replace('.', ',')}</span>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>

              {/* Desktop View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#181c26] border-b border-slate-200 dark:border-[#202531] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-4 whitespace-nowrap">Pedido / Loja</th>
                      <th className="p-4 whitespace-nowrap">Cliente</th>
                      <th className="p-4 text-right whitespace-nowrap">Valor Total Pedido</th>
                      <th className="p-4 text-right whitespace-nowrap">Valor Já Pago</th>
                      <th className="p-4 text-right whitespace-nowrap">Saldo Pendente (A Receber)</th>
                      <th className="p-4 text-right whitespace-nowrap">Ação de Recebimento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                    {paginatedReceber.map((entry) => {
                      if (entry.type === 'order') {
                        const o = entry.data as Order;
                        const paid = o.paidAmount || 0;
                        const remaining = o.totalValue - paid;
                        const isPartial = paid > 0 && paid < o.totalValue;

                        return (
                          <tr key={o.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                            <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span>{o.id}</span>
                                {isPartial && (
                                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                    Adiantamento
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{o.clientName}</td>
                            <td className="p-4 text-right font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              R$ {o.totalValue.toFixed(2).replace('.', ',')}
                            </td>
                            <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                              R$ {paid.toFixed(2).replace('.', ',')}
                            </td>
                            <td className="p-4 text-right font-extrabold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                              R$ {remaining.toFixed(2).replace('.', ',')}
                            </td>
                            <td className="p-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                <button
                                  onClick={() => handleOpenPaymentModal(o)}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 whitespace-nowrap"
                                >
                                  <HandCoins className="w-3.5 h-3.5" />
                                  {paid > 0 ? `Quitar Saldo (R$ ${remaining.toFixed(2).replace('.', ',')})` : 'Dar Baixa / Quitar'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      } else {
                        const c = entry.data as Consignment;
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors bg-purple-50/30 dark:bg-purple-950/20">
                            <td className="p-4 font-mono font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap">{c.id} (Consignação)</td>
                            <td className="p-4 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{c.clientName}</td>
                            <td className="p-4 text-right font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              R$ {c.totalValue.toFixed(2).replace('.', ',')}
                            </td>
                            <td className="p-4 text-right font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">R$ 0,00</td>
                            <td className="p-4 text-right font-extrabold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                              R$ {c.totalValue.toFixed(2).replace('.', ',')}
                            </td>
                            <td className="p-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 rounded-lg font-bold text-xs inline-block whitespace-nowrap border border-purple-200 dark:border-purple-800">
                                  Acerto na Visita
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls for Contas a Receber */}
              {allReceberEntries.length > 10 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-[#181c26] border-t border-slate-200 dark:border-[#202531] text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Mostrando <span className="font-bold text-slate-900 dark:text-slate-100">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> a{' '}
                    <span className="font-bold text-slate-900 dark:text-slate-100">{Math.min(currentPage * ITEMS_PER_PAGE, allReceberEntries.length)}</span> de{' '}
                    <span className="font-bold text-slate-900 dark:text-slate-100">{allReceberEntries.length}</span> registros
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#202531] bg-white dark:bg-[#12151c] text-slate-700 dark:text-slate-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: receberTotalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`w-8 h-8 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                            currentPage === p
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white dark:bg-[#12151c] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#202531] hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    <button
                      disabled={currentPage === receberTotalPages}
                      onClick={() => setCurrentPage((p) => Math.min(receberTotalPages, p + 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#202531] bg-white dark:bg-[#12151c] text-slate-700 dark:text-slate-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      Próxima <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Payment Entry Modal */}
      {selectedOrderForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#12151c] w-full max-w-md rounded-2xl border border-slate-300 dark:border-[#202531] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 dark:border-[#202531] flex items-center justify-between bg-slate-50 dark:bg-[#181c26]">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Registrar Pagamento — {selectedOrderForPayment.id}
              </h3>
              <button
                onClick={() => setSelectedOrderForPayment(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-[#181c26] rounded-xl border border-slate-200 dark:border-[#202531] space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">Cliente: {selectedOrderForPayment.clientName}</p>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 text-[11px]">
                    {selectedOrderForPayment.paymentTerms || 'A combinar'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 dark:border-[#202531]">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Valor Total</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      R$ {selectedOrderForPayment.totalValue.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">1º Pag. (Adiantado)</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      R$ {(selectedOrderForPayment.paidAmount || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Saldo Restante</span>
                    <span className="font-extrabold text-rose-600 dark:text-rose-400">
                      R$ {(selectedOrderForPayment.totalValue - (selectedOrderForPayment.paidAmount || 0)).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {selectedOrderForPayment.paymentReceiptName && (
                  <div className="p-2 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-900 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                    <span className="flex items-center gap-1 font-semibold">
                      <Paperclip className="w-3.5 h-3.5 text-emerald-600" /> 1º Comprovante (Entrada):
                    </span>
                    <span className="font-bold truncate max-w-[180px]">{selectedOrderForPayment.paymentReceiptName}</span>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-800 dark:text-slate-200">
                    {(selectedOrderForPayment.paidAmount || 0) > 0
                      ? 'Valor da Quitação / Saldo Restante (R$) *'
                      : 'Valor Entrado em Caixa (R$) *'}
                  </label>
                  <span className="text-[11px] text-slate-400">Pode ajustar o valor pago</span>
                </div>
                <input
                  type="text"
                  required
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(e.target.value)}
                  placeholder="Ex: 60,00"
                  className="w-full px-3 py-2 bg-white dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl font-extrabold text-emerald-600 dark:text-emerald-400 text-base focus:outline-none focus:border-indigo-500"
                />

                {/* Preset suggestions */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-500 font-medium">Sugerir:</span>
                  {(selectedOrderForPayment.paidAmount || 0) === 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmountInput((selectedOrderForPayment.totalValue * 0.5).toFixed(2).replace('.', ','))}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-[#202531] hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 rounded-lg font-bold text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      50% (R$ {(selectedOrderForPayment.totalValue * 0.5).toFixed(2).replace('.', ',')})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPaymentAmountInput((selectedOrderForPayment.totalValue - (selectedOrderForPayment.paidAmount || 0)).toFixed(2).replace('.', ','))}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-[#202531] hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 rounded-lg font-bold text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    {(selectedOrderForPayment.paidAmount || 0) > 0 ? 'Quitar Saldo Restante' : '100%'} (R$ {(selectedOrderForPayment.totalValue - (selectedOrderForPayment.paidAmount || 0)).toFixed(2).replace('.', ',')})
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {(selectedOrderForPayment.paidAmount || 0) === 0
                    ? 'Comprovante 1 (Entrada - Opcional PNG/JPG ou PDF)'
                    : 'Comprovante 2 (Quitação/Saldo - Opcional PNG/JPG ou PDF)'}
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  onChange={handlePaymentFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 dark:file:bg-emerald-950/60 dark:file:text-emerald-300 cursor-pointer"
                />
                {paymentReceiptName && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Anexado: {paymentReceiptName}</span>
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#202531] flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isSubmittingPayment}
                  onClick={() => setSelectedOrderForPayment(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Registrando...
                    </>
                  ) : (
                    <>
                      <HandCoins className="w-4 h-4" />
                      {(selectedOrderForPayment.paidAmount || 0) > 0 ? 'Quitar Saldo Restante' : 'Confirmar Recebimento'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VISUALIZADOR DE PDF DO PEDIDO */}
      {selectedOrderForPdfModal && (
        <OrderPdfViewerModal
          order={selectedOrderForPdfModal}
          clients={clients}
          products={products}
          onClose={() => setSelectedOrderForPdfModal(null)}
        />
      )}
    </div>
  );
};
