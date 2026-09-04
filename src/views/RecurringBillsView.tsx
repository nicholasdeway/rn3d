import React, { useState, useMemo } from 'react';
import { RecurringBill, RecurringBillAlertStatus, ExpenseCategory } from '../types';
import {
  Bell,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  DollarSign,
  Clock,
  Trash2,
  Edit2,
  X,
  Play,
  Pause,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface RecurringBillsViewProps {
  recurringBills: RecurringBill[];
  billAlerts: RecurringBillAlertStatus[];
  onCreateBill: (bill: Partial<RecurringBill>) => Promise<RecurringBill | null>;
  onUpdateBill: (id: string, updates: Partial<RecurringBill>) => Promise<boolean>;
  onDeleteBill: (id: string) => Promise<boolean>;
  onMarkBillPaid: (bill: RecurringBill) => Promise<void>;
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

export const RecurringBillsView: React.FC<RecurringBillsViewProps> = ({
  recurringBills = [],
  billAlerts = [],
  onCreateBill,
  onUpdateBill,
  onDeleteBill,
  onMarkBillPaid,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendentes' | 'quitados' | 'pausados'>('todos');

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);

  const [formData, setFormData] = useState<{
    title: string;
    category: ExpenseCategory;
    amount: string;
    dueDay: string;
    beneficiary: string;
    notes: string;
    recurrence: 'Mensal' | 'Anual';
  }>({
    title: '',
    category: 'Impostos (DAS)',
    amount: '',
    dueDay: '10',
    beneficiary: '',
    notes: '',
    recurrence: 'Mensal',
  });

  // Filtered bills
  const filteredBills = useMemo(() => {
    return recurringBills.filter((bill) => {
      const alertStatus = billAlerts.find((a) => a.bill.id === bill.id);
      const isPaid = alertStatus ? alertStatus.isPaidThisMonth : false;

      const matchesSearch =
        bill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bill.beneficiary && bill.beneficiary.toLowerCase().includes(searchTerm.toLowerCase())) ||
        bill.category.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'pendentes') return !isPaid && bill.status === 'Ativo';
      if (statusFilter === 'quitados') return isPaid;
      if (statusFilter === 'pausados') return bill.status === 'Pausado';

      return true;
    });
  }, [recurringBills, billAlerts, searchTerm, statusFilter]);

  // Statistics
  const totalMonthlyCost = useMemo(() => {
    return recurringBills
      .filter((b) => b.status === 'Ativo')
      .reduce((acc, b) => acc + b.amount, 0);
  }, [recurringBills]);

  const pendingCount = useMemo(() => {
    return billAlerts.filter((a) => !a.isPaidThisMonth && a.bill.status === 'Ativo').length;
  }, [billAlerts]);

  const paidCount = useMemo(() => {
    return billAlerts.filter((a) => a.isPaidThisMonth).length;
  }, [billAlerts]);

  const handleOpenCreateModal = () => {
    setEditingBill(null);
    setFormData({
      title: '',
      category: 'Impostos (DAS)',
      amount: '',
      dueDay: '10',
      beneficiary: '',
      notes: '',
      recurrence: 'Mensal',
    });
    setIsNewModalOpen(true);
  };

  const handleOpenEditModal = (bill: RecurringBill) => {
    setEditingBill(bill);
    setFormData({
      title: bill.title,
      category: bill.category,
      amount: bill.amount.toString(),
      dueDay: bill.dueDay.toString(),
      beneficiary: bill.beneficiary || '',
      notes: bill.notes || '',
      recurrence: bill.recurrence,
    });
    setIsNewModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(formData.amount.replace(',', '.'));
    const dueDayVal = parseInt(formData.dueDay, 10);
    if (isNaN(amountVal) || amountVal <= 0 || !formData.title.trim() || isNaN(dueDayVal)) return;

    if (editingBill) {
      await onUpdateBill(editingBill.id, {
        title: formData.title.trim(),
        category: formData.category,
        amount: amountVal,
        dueDay: dueDayVal,
        beneficiary: formData.beneficiary.trim(),
        notes: formData.notes.trim(),
        recurrence: formData.recurrence,
      });
    } else {
      await onCreateBill({
        title: formData.title.trim(),
        category: formData.category,
        amount: amountVal,
        dueDay: dueDayVal,
        beneficiary: formData.beneficiary.trim(),
        notes: formData.notes.trim(),
        recurrence: formData.recurrence,
        status: 'Ativo',
      });
    }

    setIsNewModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#12151c] p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Contas Fixas & Lembretes Recorrentes
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cadastre suas obrigações mensais (DAS imposto, ERP, assinaturas) para receber alertas automáticos e quitar direto no Financeiro.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Conta Fixa</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#12151c] p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Mensal em Contas Fixas
          </p>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 font-mono">
            R$ {totalMonthlyCost.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{recurringBills.filter((b) => b.status === 'Ativo').length} contas ativas registradas</p>
        </div>

        <div className="bg-white dark:bg-[#12151c] p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Pendentes no Mês
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className={`text-2xl font-black font-mono ${pendingCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
              {pendingCount}
            </p>
            <span className="text-xs font-medium text-slate-500">contas a vencer</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Avisos prévios de 7 e 3 dias ativos</p>
        </div>

        <div className="bg-white dark:bg-[#12151c] p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Quitadas no Mês
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {paidCount}
            </p>
            <span className="text-xs font-medium text-slate-500">pagamentos efetuados</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Lançados automaticamente em Despesas</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#12151c] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, categoria ou fornecedor..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 font-medium focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              statusFilter === 'todos'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Todos ({recurringBills.length})
          </button>
          <button
            onClick={() => setStatusFilter('pendentes')}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              statusFilter === 'pendentes'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Pendentes ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('quitados')}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              statusFilter === 'quitados'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Quitadas ({paidCount})
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-3">
        {filteredBills.length === 0 ? (
          <div className="bg-white dark:bg-[#12151c] p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhuma conta fixa encontrada</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Você ainda não cadastrou nenhuma conta nesta visualização. Clique no botão abaixo para adicionar suas contas fixas manuais.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Cadastrar Primeira Conta
            </button>
          </div>
        ) : (
          filteredBills.map((bill) => {
            const alertStatus = billAlerts.find((a) => a.bill.id === bill.id);
            const isPaid = alertStatus ? alertStatus.isPaidThisMonth : false;

            return (
              <div
                key={bill.id}
                className={`bg-white dark:bg-[#12151c] p-4.5 rounded-2xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isPaid
                    ? 'border-slate-200 dark:border-slate-800 opacity-80'
                    : alertStatus?.isOverdue
                    ? 'border-rose-300 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/10'
                    : alertStatus?.isUrgent
                    ? 'border-rose-200 dark:border-rose-900/60'
                    : alertStatus?.isWarning
                    ? 'border-amber-200 dark:border-amber-900/60'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      isPaid
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : alertStatus?.isOverdue
                        ? 'bg-rose-600 text-white'
                        : alertStatus?.isUrgent
                        ? 'bg-rose-500 text-white'
                        : alertStatus?.isWarning
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      {isPaid
                        ? '✅ Quitado este Mês'
                        : alertStatus?.isOverdue
                        ? 'Vencida!'
                        : alertStatus?.daysRemaining === 0
                        ? 'Vence Hoje!'
                        : alertStatus?.daysRemaining && alertStatus.daysRemaining <= 7
                        ? `Faltam ${alertStatus.daysRemaining} dias`
                        : `Vencimento dia ${bill.dueDay}`}
                    </span>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {bill.category}
                    </span>

                    {bill.status === 'Pausado' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                        Pausado
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{bill.title}</h3>

                  {bill.beneficiary && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Favorecido / ERP: <strong className="text-slate-700 dark:text-slate-300">{bill.beneficiary}</strong>
                    </p>
                  )}

                  {bill.notes && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">"{bill.notes}"</p>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] text-slate-400 font-mono">Valor Mensal</p>
                    <p className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono">
                      R$ {bill.amount.toFixed(2).replace('.', ',')}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!isPaid && (
                      <button
                        onClick={() => onMarkBillPaid(bill)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Quitar
                      </button>
                    )}

                    <button
                      onClick={() => onUpdateBill(bill.id, { status: bill.status === 'Ativo' ? 'Pausado' : 'Ativo' })}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title={bill.status === 'Ativo' ? 'Pausar conta' : 'Ativar conta'}
                    >
                      {bill.status === 'Ativo' ? <Pause className="w-4 h-4 text-amber-500" /> : <Play className="w-4 h-4 text-emerald-500" />}
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(bill)}
                      className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Editar conta"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Deseja excluir permanentemente a conta "${bill.title}"?`)) {
                          onDeleteBill(bill.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Excluir conta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Clean de Cadastro / Edição */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#12151c] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" />
                {editingBill ? 'Editar Conta Fixa' : 'Cadastrar Nova Conta Fixa'}
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Nome da Conta Fixa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: DAS Imposto, UpSeller ERP, ChatGPT, Internet..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Categoria no Financeiro *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:outline-none cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Valor Mensal (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    inputMode="decimal"
                    placeholder="0,00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value.replace(/[^0-9.,]/g, '') })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Dia de Vencimento (1 a 31) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    placeholder="Ex: 10, 20..."
                    value={formData.dueDay}
                    onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Favorecido / Fornecedor
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Receita Federal, ERP..."
                    value={formData.beneficiary}
                    onChange={(e) => setFormData({ ...formData, beneficiary: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  placeholder="Informações adicionais, código ou lembretes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  {editingBill ? 'Salvar Alterações' : 'Salvar Conta Fixa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
