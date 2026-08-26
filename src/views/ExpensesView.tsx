import React, { useState, useMemo } from 'react';
import { ExpenseItem, ExpenseCategory, AccountBalances, MarketplaceAccount } from '../types';
import { ReceiptViewerModal } from '../components/ReceiptViewerModal';
import {
  TrendingDown,
  Plus,
  Search,
  Calendar,
  Filter,
  DollarSign,
  Wallet,
  FileText,
  Paperclip,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  X,
  Eye,
  ExternalLink,
  Download,
  Users,
  Truck,
  Sparkles,
  Check,
  Building,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
  Store,
  UserCheck,
  ArrowDownLeft,
} from 'lucide-react';
import { formatDateBR, formatTimeOnly } from '../utils/formatters';

interface ExpensesViewProps {
  expenses: ExpenseItem[];
  accountBalances?: AccountBalances;
  accountBalance?: number;
  autoOpenModal?: 'aporte' | 'withdrawal' | 'expense' | null;
  onCreateExpense: (expense: ExpenseItem) => void;
  onExecuteTransfer?: (
    source: MarketplaceAccount,
    destination: MarketplaceAccount,
    amount: number,
    responsible: string,
    notes?: string,
    receiptUrl?: string,
    receiptType?: 'image' | 'pdf',
    receiptName?: string
  ) => void;
  onUpdateExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (expenseId: string) => void;
  onUpdateSingleBalance?: (accountKey: keyof AccountBalances, newBalance: number) => void;
  onUpdateAccountBalance?: (newBalance: number) => void;
}

const CATEGORIES: ExpenseCategory[] = [
  'Combustível & Transporte',
  'Compra de Filamento',
  'Bicos & Peças',
  'Manutenção & Reparos',
  'Caixas & Embalagens',
  'Álcool & Insumos',
  'Impostos (DAS)',
  'Retirada',
  'Aporte / Reembolso de Sócio',
  'Transferência de Marketplace',
  'Entrada de Pedido',
  'Outros',
];

const PARTNERS = ['Nicholas', 'Rafael'];

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses = [],
  accountBalances = { nubank: 0, shopee: 0, mercadoLivre: 0, tikTokShop: 0, amazon: 0 },
  autoOpenModal = null,
  onCreateExpense,
  onExecuteTransfer,
  onUpdateExpense,
  onDeleteExpense,
  onUpdateSingleBalance,
  onUpdateAccountBalance,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todas');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');

  // Modals state
  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isAporteModalOpen, setIsAporteModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<{ url: string; type?: 'image' | 'pdf'; name?: string; title: string } | null>(null);

  React.useEffect(() => {
    if (autoOpenModal === 'aporte') {
      setIsAporteModalOpen(true);
    } else if (autoOpenModal === 'withdrawal') {
      setIsWithdrawalModalOpen(true);
    } else if (autoOpenModal === 'expense') {
      setIsNewExpenseModalOpen(true);
    }
  }, [autoOpenModal]);

  // Transfer Modal State
  const [transferData, setTransferData] = useState<{
    source: MarketplaceAccount;
    amount: string;
    responsible: string;
    notes: string;
    receiptUrl: string;
    receiptType: 'image' | 'pdf';
    receiptName: string;
  }>({
    source: 'Shopee',
    amount: '',
    responsible: 'Nicholas',
    notes: '',
    receiptUrl: '',
    receiptType: 'image',
    receiptName: '',
  });

  // Edit Single Account Balance State
  const [editingAccountKey, setEditingAccountKey] = useState<keyof AccountBalances | null>(null);
  const [balanceInputValue, setBalanceInputValue] = useState('');

  // Form state for General Expense
  const [formData, setFormData] = useState<{
    description: string;
    category: ExpenseCategory;
    amount: string;
    date: string;
    timestamp: string;
    paymentStatus: 'Pago' | 'Pendente' | 'Agendado';
    beneficiary: string;
    createdBy: string;
    notes: string;
    receiptUrl: string;
    receiptType: 'image' | 'pdf';
    receiptName: string;
  }>({
    description: '',
    category: 'Compra de Filamento',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    paymentStatus: 'Pago',
    beneficiary: '',
    createdBy: 'Nicholas',
    notes: '',
    receiptUrl: '',
    receiptType: 'image',
    receiptName: '',
  });

  // Form state for Retirada
  const [withdrawalData, setWithdrawalData] = useState<{
    responsible: string;
    amount: string;
    date: string;
    timestamp: string;
    notes: string;
    receiptUrl: string;
    receiptType: 'image' | 'pdf';
    receiptName: string;
  }>({
    responsible: 'Nicholas',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    notes: '',
    receiptUrl: '',
    receiptType: 'image',
    receiptName: '',
  });

  // Form state for Aporte / Reembolso de Sócio
  const [aporteData, setAporteData] = useState<{
    description: string;
    amount: string;
    responsible: string;
    date: string;
    timestamp: string;
    notes: string;
    receiptUrl: string;
    receiptType: 'image' | 'pdf';
    receiptName: string;
  }>({
    description: '',
    amount: '',
    responsible: 'Nicholas',
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    notes: '',
    receiptUrl: '',
    receiptType: 'image',
    receiptName: '',
  });

  // Filtered and deterministically sorted expenses (Date desc -> Time desc -> ID desc)
  const filteredExpenses = useMemo(() => {
    const filtered = expenses.filter((item) => {
      const matchesSearch =
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.beneficiary && item.beneficiary.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.createdBy && item.createdBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.referenceCode && item.referenceCode.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = categoryFilter === 'Todas' || item.category === categoryFilter;
      const matchesStatus = statusFilter === 'Todos' || item.paymentStatus === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    return filtered.sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) {
        return dateB.localeCompare(dateA);
      }

      const timeA = a.timestamp || '00:00:00';
      const timeB = b.timestamp || '00:00:00';
      if (timeA !== timeB) {
        return timeB.localeCompare(timeA);
      }

      return (b.id || '').localeCompare(a.id || '');
    });
  }, [expenses, searchTerm, categoryFilter, statusFilter]);

  // Financial KPI totals
  const totalExpensesAmount = useMemo(() => {
    return expenses
      .filter((e) => e.paymentStatus === 'Pago' && e.category !== 'Retirada' && e.category !== 'Transferência de Marketplace' && e.category !== 'Entrada de Pedido' && e.category !== 'Aporte / Reembolso de Sócio')
      .reduce((acc, e) => acc + e.amount, 0);
  }, [expenses]);

  const totalWithdrawalsAmount = useMemo(() => {
    return expenses
      .filter((e) => e.category === 'Retirada' && e.paymentStatus === 'Pago')
      .reduce((acc, e) => acc + e.amount, 0);
  }, [expenses]);

  const totalAportesAmount = useMemo(() => {
    return expenses
      .filter((e) => e.category === 'Aporte / Reembolso de Sócio')
      .reduce((acc, e) => acc + e.amount, 0);
  }, [expenses]);

  // Handle balance edit submission
  const handleSaveBalance = (accountKey: keyof AccountBalances) => {
    const cleanStr = balanceInputValue.replace(/\./g, '').replace(',', '.');
    const val = parseFloat(cleanStr);
    if (!isNaN(val) && val >= 0) {
      if (onUpdateSingleBalance) {
        onUpdateSingleBalance(accountKey, val);
      } else if (accountKey === 'nubank' && onUpdateAccountBalance) {
        onUpdateAccountBalance(val);
      }
    }
    setEditingAccountKey(null);
  };

  // Handle file uploads (Base64 conversion)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, targetForm: 'expense' | 'withdrawal' | 'transfer' | 'aporte') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf';
    const reader = new FileReader();

    reader.onloadend = () => {
      const base64Url = reader.result as string;
      if (targetForm === 'withdrawal') {
        setWithdrawalData((prev) => ({
          ...prev,
          receiptUrl: base64Url,
          receiptType: isPdf ? 'pdf' : 'image',
          receiptName: file.name,
        }));
      } else if (targetForm === 'transfer') {
        setTransferData((prev) => ({
          ...prev,
          receiptUrl: base64Url,
          receiptType: isPdf ? 'pdf' : 'image',
          receiptName: file.name,
        }));
      } else if (targetForm === 'aporte') {
        setAporteData((prev) => ({
          ...prev,
          receiptUrl: base64Url,
          receiptType: isPdf ? 'pdf' : 'image',
          receiptName: file.name,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          receiptUrl: base64Url,
          receiptType: isPdf ? 'pdf' : 'image',
          receiptName: file.name,
        }));
      }
    };

    reader.readAsDataURL(file);
  };

  // Open Transfer modal pre-selecting a source marketplace
  const handleOpenTransferModal = (sourceAccount: MarketplaceAccount) => {
    const currentBalance =
      sourceAccount === 'Shopee'
        ? accountBalances.shopee
        : sourceAccount === 'Mercado Livre'
          ? accountBalances.mercadoLivre
          : sourceAccount === 'TikTok Shop'
            ? accountBalances.tikTokShop
            : accountBalances.amazon;

    setTransferData({
      source: sourceAccount,
      amount: currentBalance.toFixed(2).replace('.', ','),
      responsible: 'Nicholas',
      notes: '',
      receiptUrl: '',
      receiptType: 'image',
      receiptName: '',
    });
    setIsTransferModalOpen(true);
  };

  // Submit Transfer / Resgate
  const handleSubmitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(transferData.amount.replace(',', '.'));
    if (isNaN(amountVal) || amountVal <= 0) return;

    if (onExecuteTransfer) {
      onExecuteTransfer(
        transferData.source,
        'Nubank',
        amountVal,
        transferData.responsible,
        transferData.notes,
        transferData.receiptUrl,
        transferData.receiptType,
        transferData.receiptName
      );
    }
    setIsTransferModalOpen(false);
  };

  // Submit General Expense
  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(formData.amount.replace(',', '.'));
    if (isNaN(amountVal) || amountVal <= 0 || !formData.description.trim()) return;

    const timeString = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newExpense: ExpenseItem = {
      id: `exp-${Date.now()}`,
      description: formData.description.trim(),
      category: formData.category,
      amount: amountVal,
      date: formData.date,
      timestamp: timeString,
      paymentStatus: formData.paymentStatus,
      beneficiary: formData.beneficiary.trim() || 'Fornecedor',
      createdBy: formData.createdBy,
      receiptUrl: formData.receiptUrl,
      receiptType: formData.receiptType,
      receiptName: formData.receiptName,
      notes: formData.notes.trim(),
    };

    onCreateExpense(newExpense);
    setIsNewExpenseModalOpen(false);
    setFormData({
      description: '',
      category: 'Compra de Filamento',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      timestamp: timeString,
      paymentStatus: 'Pago',
      beneficiary: '',
      createdBy: 'Nicholas',
      notes: '',
      receiptUrl: '',
      receiptType: 'image',
      receiptName: '',
    });
  };

  // Submit Retirada
  const handleSubmitWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(withdrawalData.amount.replace(',', '.'));
    if (isNaN(amountVal) || amountVal <= 0 || !withdrawalData.responsible.trim()) return;

    const timeString = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newExpense: ExpenseItem = {
      id: `ret-${Date.now()}`,
      description: `Retirada (${withdrawalData.responsible.trim()})`,
      category: 'Retirada',
      amount: amountVal,
      date: withdrawalData.date,
      timestamp: timeString,
      paymentStatus: 'Pago',
      beneficiary: withdrawalData.responsible.trim(),
      createdBy: withdrawalData.responsible.trim(),
      receiptUrl: withdrawalData.receiptUrl,
      receiptType: withdrawalData.receiptType,
      receiptName: withdrawalData.receiptName,
      notes: withdrawalData.notes.trim(),
    };

    onCreateExpense(newExpense);
    setIsWithdrawalModalOpen(false);
    setWithdrawalData({
      responsible: 'Nicholas',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      timestamp: timeString,
      notes: '',
      receiptUrl: '',
      receiptType: 'image',
      receiptName: '',
    });
  };

  // Submit Aporte / Reembolso de Sócio
  const handleSubmitAporte = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(aporteData.amount.replace(',', '.'));
    if (isNaN(amountVal) || amountVal <= 0 || !aporteData.responsible.trim()) return;

    const timeString = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newExpense: ExpenseItem = {
      id: `apt-${Date.now()}`,
      description: aporteData.description.trim() || `Lançamento / Aporte (${aporteData.responsible.trim()})`,
      category: 'Aporte / Reembolso de Sócio',
      amount: amountVal,
      date: aporteData.date,
      timestamp: timeString,
      paymentStatus: 'Pago',
      beneficiary: 'Conta Nubank (Oficina RN 3D)',
      createdBy: aporteData.responsible.trim(),
      destinationAccount: 'Nubank',
      receiptUrl: aporteData.receiptUrl,
      receiptType: aporteData.receiptType,
      receiptName: aporteData.receiptName,
      notes: aporteData.notes.trim(),
    };

    onCreateExpense(newExpense);
    setIsAporteModalOpen(false);
    setAporteData({
      description: '',
      amount: '',
      responsible: 'Nicholas',
      date: new Date().toISOString().split('T')[0],
      timestamp: timeString,
      notes: '',
      receiptUrl: '',
      receiptType: 'image',
      receiptName: '',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#12151c] p-6 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-rose-500" />
            Controle de Saídas, Retiradas e Saldos de Marketplaces
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestão financeira de custos, retiradas de sócios, resgates de marketplaces e lançamentos/aportes para a empresa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAporteModalOpen(true)}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            title="Registrar entrada/crédito do sócio para a conta da empresa (+)"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Lançamento / Aporte <span className="bg-emerald-800/80 px-1.5 py-0.5 rounded text-[10px] ml-0.5 font-mono">(+ Entrada)</span></span>
          </button>

          <button
            onClick={() => setIsWithdrawalModalOpen(true)}
            className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            title="Registrar retirada/saque do sócio da conta da empresa (-)"
          >
            <Users className="w-4 h-4" />
            <span>Retirada de Sócio <span className="bg-amber-700/80 px-1.5 py-0.5 rounded text-[10px] ml-0.5 font-mono">(- Saída)</span></span>
          </button>

          <button
            onClick={() => setIsNewExpenseModalOpen(true)}
            className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            title="Registrar gasto operacional da empresa (-)"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Despesa <span className="bg-rose-800/80 px-1.5 py-0.5 rounded text-[10px] ml-0.5 font-mono">(- Custo)</span></span>
          </button>
        </div>
      </div>

      {/* MULTI-ACCOUNT & MARKETPLACE BALANCES GRID (5 BALANCES WITH EDIT PENCILS ✏️) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* CARD 1: CONTA NUBANK / OFICINA */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4.5 rounded-2xl border border-indigo-900/50 text-white shadow-md flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Nubank / Oficina
              </span>
              <button
                type="button"
                onClick={() => {
                  setBalanceInputValue(accountBalances.nubank ? accountBalances.nubank.toFixed(2).replace('.', ',') : '0,00');
                  setEditingAccountKey('nubank');
                }}
                className="p-1 text-slate-400 hover:text-emerald-400 cursor-pointer transition-colors"
                title="Editar Saldo Nubank"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {editingAccountKey === 'nubank' ? (
              <div className="flex items-center gap-1 mt-2">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  autoFocus
                  value={balanceInputValue}
                  onChange={(e) => setBalanceInputValue(e.target.value.replace(/[^0-9.,]/g, ''))}
                  className="w-full px-2 py-1 bg-slate-800 border border-emerald-500 rounded-lg text-xs font-bold text-white"
                />
                <button
                  onClick={() => handleSaveBalance('nubank')}
                  className="p-1 bg-emerald-500 text-white rounded-lg cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <p className="text-xl font-black text-emerald-400 tracking-tight mt-1.5">
                R$ {accountBalances.nubank.toFixed(2).replace('.', ',')}
              </p>
            )}
          </div>
          <span className="text-[10px] text-emerald-400/90 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md inline-block">
            Conta Principal
          </span>
        </div>

        {/* CARD 2: SALDO SHOPEE */}
        <div className="bg-white dark:bg-[#12151c] p-4.5 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5" /> Saldo Shopee
              </span>
              <button
                type="button"
                onClick={() => {
                  setBalanceInputValue(accountBalances.shopee ? accountBalances.shopee.toFixed(2).replace('.', ',') : '0,00');
                  setEditingAccountKey('shopee');
                }}
                className="p-1 text-slate-400 hover:text-amber-500 cursor-pointer transition-colors"
                title="Editar Saldo Shopee"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {editingAccountKey === 'shopee' ? (
              <div className="flex items-center gap-1 mt-2">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  autoFocus
                  value={balanceInputValue}
                  onChange={(e) => setBalanceInputValue(e.target.value.replace(/[^0-9.,]/g, ''))}
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-amber-500 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100"
                />
                <button
                  onClick={() => handleSaveBalance('shopee')}
                  className="p-1 bg-amber-500 text-white rounded-lg cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <p className="text-xl font-black text-amber-600 dark:text-amber-400 tracking-tight mt-1.5">
                R$ {accountBalances.shopee.toFixed(2).replace('.', ',')}
              </p>
            )}
          </div>

          <button
            onClick={() => handleOpenTransferModal('Shopee')}
            className="w-full py-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 border border-amber-200/60 dark:border-amber-900/50"
          >
            <RefreshCw className="w-3 h-3 text-amber-600" />
            <span>Resgatar p/ Nubank</span>
          </button>
        </div>

        {/* CARD 3: SALDO MERCADO LIVRE */}
        <div className="bg-white dark:bg-[#12151c] p-4.5 rounded-2xl border border-yellow-200 dark:border-yellow-900/50 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                <Store className="w-3.5 h-3.5" /> Mercado Livre
              </span>
              <button
                type="button"
                onClick={() => {
                  setBalanceInputValue(accountBalances.mercadoLivre ? accountBalances.mercadoLivre.toFixed(2).replace('.', ',') : '0,00');
                  setEditingAccountKey('mercadoLivre');
                }}
                className="p-1 text-slate-400 hover:text-yellow-500 cursor-pointer transition-colors"
                title="Editar Saldo Mercado Livre"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {editingAccountKey === 'mercadoLivre' ? (
              <div className="flex items-center gap-1 mt-2">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  autoFocus
                  value={balanceInputValue}
                  onChange={(e) => setBalanceInputValue(e.target.value.replace(/[^0-9.,]/g, ''))}
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-yellow-500 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100"
                />
                <button
                  onClick={() => handleSaveBalance('mercadoLivre')}
                  className="p-1 bg-yellow-500 text-white rounded-lg cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <p className="text-xl font-black text-yellow-600 dark:text-yellow-400 tracking-tight mt-1.5">
                R$ {accountBalances.mercadoLivre.toFixed(2).replace('.', ',')}
              </p>
            )}
          </div>

          <button
            onClick={() => handleOpenTransferModal('Mercado Livre')}
            className="w-full py-1.5 bg-yellow-50 dark:bg-yellow-950/60 hover:bg-yellow-100 dark:hover:bg-yellow-900 text-yellow-800 dark:text-yellow-200 font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 border border-yellow-200/60 dark:border-yellow-900/50"
          >
            <RefreshCw className="w-3 h-3 text-yellow-600" />
            <span>Resgatar p/ Nubank</span>
          </button>
        </div>

        {/* CARD 4: SALDO TIKTOK SHOP */}
        <div className="bg-white dark:bg-[#12151c] p-4.5 rounded-2xl border border-cyan-200 dark:border-cyan-900/50 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> TikTok Shop
              </span>
              <button
                type="button"
                onClick={() => {
                  setBalanceInputValue(accountBalances.tikTokShop ? accountBalances.tikTokShop.toFixed(2).replace('.', ',') : '0,00');
                  setEditingAccountKey('tikTokShop');
                }}
                className="p-1 text-slate-400 hover:text-cyan-500 cursor-pointer transition-colors"
                title="Editar Saldo TikTok Shop"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {editingAccountKey === 'tikTokShop' ? (
              <div className="flex items-center gap-1 mt-2">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  autoFocus
                  value={balanceInputValue}
                  onChange={(e) => setBalanceInputValue(e.target.value.replace(/[^0-9.,]/g, ''))}
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-cyan-500 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100"
                />
                <button
                  onClick={() => handleSaveBalance('tikTokShop')}
                  className="p-1 bg-cyan-500 text-white rounded-lg cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <p className="text-xl font-black text-cyan-600 dark:text-cyan-400 tracking-tight mt-1.5">
                R$ {accountBalances.tikTokShop.toFixed(2).replace('.', ',')}
              </p>
            )}
          </div>

          <button
            onClick={() => handleOpenTransferModal('TikTok Shop')}
            className="w-full py-1.5 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900 text-cyan-800 dark:text-cyan-200 font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 border border-cyan-200/60 dark:border-cyan-900/50"
          >
            <RefreshCw className="w-3 h-3 text-cyan-600" />
            <span>Resgatar p/ Nubank</span>
          </button>
        </div>

        {/* CARD 5: SALDO AMAZON */}
        <div className="bg-white dark:bg-[#12151c] p-4.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <Building className="w-3.5 h-3.5" /> Amazon
              </span>
              <button
                type="button"
                onClick={() => {
                  setBalanceInputValue(accountBalances.amazon ? accountBalances.amazon.toFixed(2).replace('.', ',') : '0,00');
                  setEditingAccountKey('amazon');
                }}
                className="p-1 text-slate-400 hover:text-indigo-500 cursor-pointer transition-colors"
                title="Editar Saldo Amazon"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {editingAccountKey === 'amazon' ? (
              <div className="flex items-center gap-1 mt-2">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  autoFocus
                  value={balanceInputValue}
                  onChange={(e) => setBalanceInputValue(e.target.value.replace(/[^0-9.,]/g, ''))}
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-indigo-500 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100"
                />
                <button
                  onClick={() => handleSaveBalance('amazon')}
                  className="p-1 bg-indigo-500 text-white rounded-lg cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight mt-1.5">
                R$ {accountBalances.amazon.toFixed(2).replace('.', ',')}
              </p>
            )}
          </div>

          <button
            onClick={() => handleOpenTransferModal('Amazon')}
            className="w-full py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 border border-indigo-200/60 dark:border-indigo-900/50"
          >
            <RefreshCw className="w-3 h-3 text-indigo-600" />
            <span>Resgatar p/ Nubank</span>
          </button>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white dark:bg-[#12151c] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por descrição, sócio, responsável ou código de referência..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-rose-500 font-semibold"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl text-xs text-slate-700 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="Todas">Categoria: Todas</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl text-xs text-slate-700 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="Todos">Status: Todos</option>
              <option value="Pago">Pago</option>
              <option value="Pendente">Pendente</option>
              <option value="Agendado">Agendado</option>
            </select>
          </div>
        </div>
      </div>

      {/* MOBILE / TABLET CARD GRID VIEW (lg:hidden) */}
      <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredExpenses.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-[#12151c] p-8 rounded-2xl border border-slate-200/80 dark:border-[#202531] text-center text-slate-400 space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">Nenhuma movimentação encontrada</p>
            <p className="text-[11px] text-slate-400">
              Cadastre despesas, retiradas, lançamentos ou resgates de marketplaces nos botões no topo.
            </p>
          </div>
        ) : (
          filteredExpenses.map((exp) => (
            <div
              key={exp.id}
              className="bg-white dark:bg-[#12151c] p-4 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3 flex flex-col justify-between"
            >
              {/* Top Row: Category Badge + Value */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-1.5">
                  {exp.category === 'Retirada' ? (
                    <Users className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : exp.category === 'Aporte / Reembolso de Sócio' ? (
                    <ArrowDownLeft className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : exp.category === 'Transferência de Marketplace' ? (
                    <RefreshCw className="w-4 h-4 text-cyan-500 shrink-0" />
                  ) : exp.category === 'Entrada de Pedido' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : exp.isAutoReplicated ? (
                    <Truck className="w-4 h-4 text-indigo-500 shrink-0" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${exp.category === 'Retirada'
                      ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900'
                      : exp.category === 'Aporte / Reembolso de Sócio'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900'
                        : exp.category === 'Transferência de Marketplace'
                          ? 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-900'
                          : exp.category === 'Entrada de Pedido'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900'
                            : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}
                  >
                    {exp.category}
                  </span>
                </div>

                <span
                  className={`text-base font-black tracking-tight shrink-0 ${exp.category === 'Entrada de Pedido' || exp.category === 'Transferência de Marketplace' || exp.category === 'Aporte / Reembolso de Sócio'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                    }`}
                >
                  {exp.category === 'Entrada de Pedido' || exp.category === 'Transferência de Marketplace' || exp.category === 'Aporte / Reembolso de Sócio' ? '+' : '-'} R${' '}
                  {exp.amount.toFixed(2).replace('.', ',')}
                </span>
              </div>

              {/* Middle Row: Description & Ref */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">{exp.description}</p>
                {exp.referenceCode && (
                  <span className="inline-block text-[10px] font-mono font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded">
                    Ref: {exp.referenceCode}
                  </span>
                )}
                {exp.notes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2">{exp.notes}</p>
                )}
              </div>

              {/* Info Badges: Date/Time + Responsavel */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDateBR(exp.date)}</span>
                  <span className="text-slate-400 font-mono text-[10px]">({formatTimeOnly(exp.timestamp)})</span>
                </div>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-[11px] font-bold border border-indigo-100 dark:border-indigo-900/50">
                  <UserCheck className="w-3 h-3" />
                  {exp.createdBy || exp.beneficiary || 'Nicholas'}
                </span>
              </div>

              {/* Footer Actions: Receipt + Delete */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                <div>
                  {exp.receiptUrl ? (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedReceipt({
                          url: exp.receiptUrl!,
                          type: exp.receiptType,
                          name: exp.receiptName,
                          title: exp.description,
                        })
                      }
                      className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-indigo-200 dark:border-indigo-900"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Ver Comprovante</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-normal">Sem anexo</span>
                  )}
                </div>

                <button
                  onClick={() => onDeleteExpense(exp.id)}
                  className="p-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-lg font-bold transition-colors cursor-pointer"
                  title="Excluir movimentação"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP TABLE VIEW (hidden lg:block) */}
      <div className="hidden lg:block bg-white dark:bg-[#12151c] rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#181c26] border-b border-slate-200 dark:border-[#202531] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">Data & Horário Exato</th>
                <th className="p-4">Descrição do Lançamento</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Responsável</th>
                <th className="p-4 text-right">Valor (R$)</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Comprovante</th>
                <th className="p-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 space-y-2">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">Nenhuma movimentação encontrada</p>
                    <p className="text-[11px] text-slate-400">
                      Cadastre despesas, retiradas, lançamentos ou resgates de marketplaces nos botões no topo.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{formatDateBR(exp.date)}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{formatTimeOnly(exp.timestamp)}</p>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        {exp.category === 'Retirada' ? (
                          <Users className="w-4 h-4 text-amber-500 shrink-0" />
                        ) : exp.category === 'Aporte / Reembolso de Sócio' ? (
                          <ArrowDownLeft className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : exp.category === 'Transferência de Marketplace' ? (
                          <RefreshCw className="w-4 h-4 text-cyan-500 shrink-0" />
                        ) : exp.category === 'Entrada de Pedido' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : exp.isAutoReplicated ? (
                          <Truck className="w-4 h-4 text-indigo-500 shrink-0" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-semibold">{exp.description}</p>
                          {exp.referenceCode && (
                            <span className="inline-block text-[10px] font-mono font-semibold text-slate-400">
                              Ref: {exp.referenceCode}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${exp.category === 'Retirada'
                          ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900'
                          : exp.category === 'Aporte / Reembolso de Sócio'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900'
                            : exp.category === 'Transferência de Marketplace'
                              ? 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-900'
                              : exp.category === 'Entrada de Pedido'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900'
                                : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                          }`}
                      >
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold border border-indigo-100 dark:border-indigo-900/50">
                        <UserCheck className="w-3.5 h-3.5" />
                        {exp.createdBy || exp.beneficiary || 'Nicholas'}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-sm whitespace-nowrap">
                      <span
                        className={
                          exp.category === 'Entrada de Pedido' || exp.category === 'Transferência de Marketplace' || exp.category === 'Aporte / Reembolso de Sócio'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }
                      >
                        {exp.category === 'Entrada de Pedido' || exp.category === 'Transferência de Marketplace' || exp.category === 'Aporte / Reembolso de Sócio' ? '+' : '-'} R${' '}
                        {exp.amount.toFixed(2).replace('.', ',')}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${exp.paymentStatus === 'Pago'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                      >
                        {exp.paymentStatus === 'Pago' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {exp.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {exp.receiptUrl ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedReceipt({
                              url: exp.receiptUrl!,
                              type: exp.receiptType,
                              name: exp.receiptName,
                              title: exp.description,
                            })
                          }
                          className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer border border-indigo-200 dark:border-indigo-900"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Ver Comprovante</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-normal">Sem anexo</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        className="p-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-lg font-bold transition-colors cursor-pointer"
                        title="Excluir movimentação"
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
      </div>

      {/* MODAL: REGISTRAR LANÇAMENTO / APORTE DE SÓCIO */}
      {isAporteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#12151c] border border-slate-200/80 dark:border-[#202531] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
                Registrar Lançamento / Aporte para Empresa
              </h3>
              <button
                onClick={() => setIsAporteModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAporte} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição do Lançamento / Ressarcimento
                </label>
                <input
                  type="text"
                  required
                  value={aporteData.description}
                  onChange={(e) => setAporteData({ ...aporteData, description: e.target.value })}
                  placeholder="Ex: Pagamento de filamentos comprados na conta pessoal..."
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Valor Creditado (R$)</label>
                  <input
                    type="text"
                    required
                    value={aporteData.amount}
                    onChange={(e) => setAporteData({ ...aporteData, amount: e.target.value })}
                    placeholder="0,00"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl font-black text-emerald-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Quem Efetuou o Lançamento</label>
                  <select
                    value={aporteData.responsible}
                    onChange={(e) => setAporteData({ ...aporteData, responsible: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
                  >
                    {PARTNERS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Conta de Destino</label>
                <input
                  type="text"
                  disabled
                  value="Conta Nubank (Oficina RN 3D)"
                  className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-emerald-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Comprovante do PIX / Depósito (PNG/JPG ou PDF)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileUpload(e, 'aporte')}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer"
                />
                {aporteData.receiptName && (
                  <p className="text-[11px] text-emerald-600 font-bold mt-1">✓ Arquivo anexado: {aporteData.receiptName}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAporteModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESGATE / TRANSFERÊNCIA DE MARKETPLACE */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#12151c] border border-slate-200/80 dark:border-[#202531] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-amber-500" />
                Resgatar Saldo de Marketplace
              </h3>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTransfer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Marketplace de Origem</label>
                <select
                  value={transferData.source}
                  onChange={(e) => setTransferData({ ...transferData, source: e.target.value as MarketplaceAccount })}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
                >
                  <option value="Shopee">Shopee (Disponível: R$ {accountBalances.shopee.toFixed(2)})</option>
                  <option value="Mercado Livre">Mercado Livre (Disponível: R$ {accountBalances.mercadoLivre.toFixed(2)})</option>
                  <option value="TikTok Shop">TikTok Shop (Disponível: R$ {accountBalances.tikTokShop.toFixed(2)})</option>
                  <option value="Amazon">Amazon (Disponível: R$ {accountBalances.amazon.toFixed(2)})</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Destino da Transferência</label>
                <input
                  type="text"
                  disabled
                  value="Conta Nubank (Oficina RN 3D)"
                  className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-emerald-600 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Valor a Transferir (R$)</label>
                  <input
                    type="text"
                    required
                    value={transferData.amount}
                    onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                    placeholder="0,00"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl font-black text-amber-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Responsável</label>
                  <select
                    value={transferData.responsible}
                    onChange={(e) => setTransferData({ ...transferData, responsible: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
                  >
                    {PARTNERS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Comprovante de Transferência/Resgate (Opcional - PNG/PDF)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileUpload(e, 'transfer')}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                {transferData.receiptName && (
                  <p className="text-[11px] text-emerald-600 font-bold mt-1">✓ Anexado: {transferData.receiptName}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Confirmar Resgate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVA DESPESA OPERACIONAL */}
      {isNewExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#12151c] border border-slate-200/80 dark:border-[#202531] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-rose-500" />
                Cadastrar Nova Despesa Operacional
              </h3>
              <button
                onClick={() => setIsNewExpenseModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição da Despesa (ex: Compra de Filamento PLA Preto 1kg)
                </label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Digite a descrição da despesa..."
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl font-semibold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Valor (R$)</label>
                  <input
                    type="text"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0,00"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl font-black text-rose-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Data do Lançamento</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl font-semibold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Responsável</label>
                  <select
                    value={formData.createdBy}
                    onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
                  >
                    {PARTNERS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Anexar Comprovante / Nota Fiscal (Imagem PNG/JPG ou PDF)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileUpload(e, 'expense')}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer"
                />
                {formData.receiptName && (
                  <p className="text-[11px] text-emerald-600 font-bold mt-1">✓ Arquivo anexado: {formData.receiptName}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewExpenseModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Salvar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RETIRADA */}
      {isWithdrawalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#12151c] border border-slate-200/80 dark:border-[#202531] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                Registrar Retirada
              </h3>
              <button
                onClick={() => setIsWithdrawalModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitWithdrawal} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Responsável pela Retirada</label>
                <select
                  value={withdrawalData.responsible}
                  onChange={(e) => setWithdrawalData({ ...withdrawalData, responsible: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
                >
                  {PARTNERS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Valor Retirado (R$)</label>
                  <input
                    type="text"
                    required
                    value={withdrawalData.amount}
                    onChange={(e) => setWithdrawalData({ ...withdrawalData, amount: e.target.value })}
                    placeholder="0,00"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl font-black text-amber-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Data da Transação</label>
                  <input
                    type="date"
                    required
                    value={withdrawalData.date}
                    onChange={(e) => setWithdrawalData({ ...withdrawalData, date: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl font-semibold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Comprovante de Transferência PIX (PNG/JPG ou PDF)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileUpload(e, 'withdrawal')}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-800 hover:file:bg-amber-100 cursor-pointer"
                />
                {withdrawalData.receiptName && (
                  <p className="text-[11px] text-emerald-600 font-bold mt-1">✓ Arquivo anexado: {withdrawalData.receiptName}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsWithdrawalModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Confirmar Retirada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VISUALIZADOR DE COMPROVANTE COM ZOOM INTERATIVO */}
      <ReceiptViewerModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
    </div>
  );
};
