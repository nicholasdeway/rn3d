import React, { useState, useMemo } from 'react';
import { ExpenseItem, ExpenseCategory } from '../types';
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
} from 'lucide-react';
import { formatDateBR } from '../utils/formatters';

interface ExpensesViewProps {
  expenses: ExpenseItem[];
  accountBalance: number;
  onCreateExpense: (expense: ExpenseItem) => void;
  onUpdateExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (expenseId: string) => void;
  onUpdateAccountBalance: (newBalance: number) => void;
}

const CATEGORIES: ExpenseCategory[] = [
  'Combustível & Transporte',
  'Compra de Filamento',
  'Bicos & Peças',
  'Manutenção & Reparos',
  'Caixas & Embalagens',
  'Álcool & Insumos',
  'Impostos (DAS)',
  'Retirada de Sócio / Pro-labore',
  'Outros',
];

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses = [],
  accountBalance = 3500.0,
  onCreateExpense,
  onUpdateExpense,
  onDeleteExpense,
  onUpdateAccountBalance,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todas');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');

  // Modals state
  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);
  const [isPartnerWithdrawalModalOpen, setIsPartnerWithdrawalModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<{ url: string; type?: 'image' | 'pdf'; name?: string; title: string } | null>(null);

  // Edit Account Balance state
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState(accountBalance.toString());

  // Form state for General Expense
  const [formData, setFormData] = useState<{
    description: string;
    category: ExpenseCategory;
    amount: string;
    date: string;
    paymentStatus: 'Pago' | 'Pendente' | 'Agendado';
    beneficiary: string;
    notes: string;
    receiptUrl: string;
    receiptType: 'image' | 'pdf';
    receiptName: string;
  }>({
    description: '',
    category: 'Compra de Filamento',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentStatus: 'Pago',
    beneficiary: '',
    notes: '',
    receiptUrl: '',
    receiptType: 'image',
    receiptName: '',
  });

  // Form state for Partner Withdrawal
  const [withdrawalData, setWithdrawalData] = useState<{
    partnerName: string;
    amount: string;
    date: string;
    notes: string;
    receiptUrl: string;
    receiptType: 'image' | 'pdf';
    receiptName: string;
  }>({
    partnerName: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    receiptUrl: '',
    receiptType: 'image',
    receiptName: '',
  });

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const matchesSearch =
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.beneficiary && item.beneficiary.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.referenceCode && item.referenceCode.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = categoryFilter === 'Todas' || item.category === categoryFilter;
      const matchesStatus = statusFilter === 'Todos' || item.paymentStatus === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [expenses, searchTerm, categoryFilter, statusFilter]);

  // Financial KPI totals
  const totalExpensesAmount = useMemo(() => {
    return expenses.reduce((acc, e) => acc + (e.paymentStatus === 'Pago' ? e.amount : 0), 0);
  }, [expenses]);

  const partnerWithdrawalsAmount = useMemo(() => {
    return expenses
      .filter((e) => e.category === 'Retirada de Sócio / Pro-labore' && e.paymentStatus === 'Pago')
      .reduce((acc, e) => acc + e.amount, 0);
  }, [expenses]);

  const autoLogisticsAmount = useMemo(() => {
    return expenses
      .filter((e) => e.category === 'Combustível & Transporte' && e.paymentStatus === 'Pago')
      .reduce((acc, e) => acc + e.amount, 0);
  }, [expenses]);

  const pendingExpensesAmount = useMemo(() => {
    return expenses
      .filter((e) => e.paymentStatus === 'Pendente' || e.paymentStatus === 'Agendado')
      .reduce((acc, e) => acc + e.amount, 0);
  }, [expenses]);

  // Handle balance edit submission
  const handleSaveBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(balanceInput.replace(',', '.'));
    if (!isNaN(val)) {
      onUpdateAccountBalance(val);
    }
    setIsEditingBalance(false);
  };

  // Handle file uploads (Base64 conversion)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isWithdrawal = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf';
    const reader = new FileReader();

    reader.onloadend = () => {
      const base64Url = reader.result as string;
      if (isWithdrawal) {
        setWithdrawalData((prev) => ({
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

  // Submit General Expense
  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(formData.amount.replace(',', '.'));
    if (isNaN(amountVal) || amountVal <= 0 || !formData.description.trim()) return;

    const newExpense: ExpenseItem = {
      id: `exp-${Date.now()}`,
      description: formData.description.trim(),
      category: formData.category,
      amount: amountVal,
      date: formData.date,
      paymentStatus: formData.paymentStatus,
      beneficiary: formData.beneficiary.trim() || 'Fornecedor',
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
      paymentStatus: 'Pago',
      beneficiary: '',
      notes: '',
      receiptUrl: '',
      receiptType: 'image',
      receiptName: '',
    });
  };

  // Submit Partner Withdrawal
  const handleSubmitWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(withdrawalData.amount.replace(',', '.'));
    if (isNaN(amountVal) || amountVal <= 0 || !withdrawalData.partnerName.trim()) return;

    const newExpense: ExpenseItem = {
      id: `ret-${Date.now()}`,
      description: `Retirada de Sócio / Pro-labore (${withdrawalData.partnerName.trim()})`,
      category: 'Retirada de Sócio / Pro-labore',
      amount: amountVal,
      date: withdrawalData.date,
      paymentStatus: 'Pago',
      beneficiary: withdrawalData.partnerName.trim(),
      receiptUrl: withdrawalData.receiptUrl,
      receiptType: withdrawalData.receiptType,
      receiptName: withdrawalData.receiptName,
      notes: withdrawalData.notes.trim(),
    };

    onCreateExpense(newExpense);
    setIsPartnerWithdrawalModalOpen(false);
    setWithdrawalData({
      partnerName: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
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
            Controle de Saídas, Despesas e Retiradas
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gerenciamento de custos operacionais, insumos, fretes e retiradas de sócios com comprovantes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsPartnerWithdrawalModalOpen(true)}
            className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" />
            <span>Nova Retirada de Sócio</span>
          </button>

          <button
            onClick={() => setIsNewExpenseModalOpen(true)}
            className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Despesa</span>
          </button>
        </div>
      </div>

      {/* EDITABLE ACCOUNT BALANCE CARD (Lápis Icon) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-900/40 text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Saldo Atual em Conta da Oficina RN 3D
              </span>
            </div>

            {!isEditingBalance ? (
              <div className="flex items-center gap-3 pt-1">
                <span className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
                  R$ {accountBalance.toFixed(2).replace('.', ',')}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setBalanceInput(accountBalance.toString());
                    setIsEditingBalance(true);
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 text-emerald-300 rounded-xl transition-colors cursor-pointer border border-white/10"
                  title="Editar Saldo em Conta da Oficina"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveBalance} className="flex items-center gap-2 pt-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                  <input
                    type="text"
                    autoFocus
                    value={balanceInput}
                    onChange={(e) => setBalanceInput(e.target.value)}
                    placeholder="0,00"
                    className="pl-8 pr-3 py-2 bg-slate-800 border border-emerald-500 rounded-xl text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingBalance(false)}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
              </form>
            )}
          </div>

          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 rounded-xl backdrop-blur-xs">
            <div className="text-left">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Disponibilidade</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Caixa Operacional Ativo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#12151c] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Total de Saídas</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-2 tracking-tight">
            R$ {totalExpensesAmount.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-1">Despesas pagas registradas</p>
        </div>

        <div className="bg-white dark:bg-[#12151c] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Retiradas de Sócios</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-2 tracking-tight">
            R$ {partnerWithdrawalsAmount.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-1">Pro-labore & Sangrias</p>
        </div>

        <div className="bg-white dark:bg-[#12151c] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Logística & Frete</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2 tracking-tight">
            R$ {autoLogisticsAmount.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-1">Réplica de pedidos / visitas</p>
        </div>

        <div className="bg-white dark:bg-[#12151c] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Pendente / Agendado</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 tracking-tight">
            R$ {pendingExpensesAmount.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-1">A pagar em breve</p>
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
              placeholder="Buscar por descrição, sócio, fornecedor ou código..."
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

      {/* Main Expenses Table */}
      <div className="bg-white dark:bg-[#12151c] rounded-2xl border border-slate-200/80 dark:border-[#202531] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#181c26] border-b border-slate-200 dark:border-[#202531] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">Data</th>
                <th className="p-4">Descrição</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Favorecido / Sócio</th>
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
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">Nenhuma saída ou despesa encontrada</p>
                    <p className="text-[11px] text-slate-400">
                      Cadastre novos gastos ou retiradas de sócios clicando nos botões no topo.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatDateBR(exp.date)}
                    </td>
                    <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        {exp.category === 'Retirada de Sócio / Pro-labore' ? (
                          <Users className="w-4 h-4 text-amber-500 shrink-0" />
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
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          exp.category === 'Retirada de Sócio / Pro-labore'
                            ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900'
                            : exp.category === 'Combustível & Transporte'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900'
                            : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                      {exp.beneficiary || '-'}
                    </td>
                    <td className="p-4 text-right font-black text-rose-600 dark:text-rose-400 text-sm whitespace-nowrap">
                      R$ {exp.amount.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          exp.paymentStatus === 'Pago'
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
                        title="Excluir despesa"
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

      {/* MODAL: NOVA DESPESA / SAÍDA */}
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
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Favorecido / Fornecedor</label>
                  <input
                    type="text"
                    value={formData.beneficiary}
                    onChange={(e) => setFormData({ ...formData, beneficiary: e.target.value })}
                    placeholder="Ex: 3D Fila, Posto X, Mercado..."
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Anexar Comprovante / Nota Fiscal (Imagem PNG/JPG ou PDF)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileUpload(e, false)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer"
                />
                {formData.receiptName && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                    ✓ Arquivo anexado: {formData.receiptName}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewExpenseModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs cursor-pointer transition-colors"
                >
                  Salvar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVA RETIRADA DE SÓCIO */}
      {isPartnerWithdrawalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#12151c] border border-slate-200/80 dark:border-[#202531] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                Registrar Retirada de Sócio / Pro-labore
              </h3>
              <button
                onClick={() => setIsPartnerWithdrawalModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitWithdrawal} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nome do Sócio / Favorecido</label>
                <input
                  type="text"
                  required
                  value={withdrawalData.partnerName}
                  onChange={(e) => setWithdrawalData({ ...withdrawalData, partnerName: e.target.value })}
                  placeholder="Ex: Nicholas, Sócio 2..."
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#181c26] border border-slate-200 dark:border-[#202531] rounded-xl font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
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
                  onChange={(e) => handleFileUpload(e, true)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-800 hover:file:bg-amber-100 cursor-pointer"
                />
                {withdrawalData.receiptName && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                    ✓ Arquivo anexado: {withdrawalData.receiptName}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPartnerWithdrawalModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-xs cursor-pointer transition-colors"
                >
                  Confirmar Retirada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VISUALIZADOR DE COMPROVANTE (LIGHTBOX / PDF VIEWER) */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#12151c] border border-slate-200/80 dark:border-[#202531] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#181c26]">
              <div className="flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-indigo-500" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{selectedReceipt.title}</h3>
                  <p className="text-[11px] text-slate-400">{selectedReceipt.name || 'Comprovante de Lançamento'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedReceipt.url}
                  download={selectedReceipt.name || 'comprovante'}
                  className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
                  title="Baixar arquivo"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-auto flex-1 flex items-center justify-center bg-slate-100 dark:bg-[#10121a]">
              {selectedReceipt.type === 'pdf' || selectedReceipt.url.startsWith('data:application/pdf') ? (
                <iframe
                  src={selectedReceipt.url}
                  className="w-full h-[60vh] rounded-xl border border-slate-200 dark:border-slate-800"
                  title="Visualizador de PDF"
                />
              ) : (
                <img
                  src={selectedReceipt.url}
                  alt="Comprovante"
                  className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-md border border-slate-200 dark:border-slate-800"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
