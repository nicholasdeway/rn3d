import { useState, useEffect, useCallback, useMemo } from 'react';
import { RecurringBill, RecurringBillAlertStatus, ExpenseItem } from '../types';
import {
  fetchRecurringBills,
  createRecurringBill,
  updateRecurringBill,
  deleteRecurringBill,
} from '../services/recurringBillsService';

export function calculateBillAlertStatus(bill: RecurringBill): RecurringBillAlertStatus {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth(); // 0-indexed
  const currentMonthStr = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}`;

  const isPaidThisMonth = bill.lastPaidMonth === currentMonthStr;

  // Compute target due date for current month
  const maxDaysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  const safeDueDay = Math.min(Math.max(1, bill.dueDay), maxDaysInMonth);

  const targetDateObj = new Date(currentYear, currentMonthIdx, safeDueDay);
  const todayMidnight = new Date(currentYear, currentMonthIdx, now.getDate());

  const diffMs = targetDateObj.getTime() - todayMidnight.getTime();
  const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const isOverdue = !isPaidThisMonth && daysRemaining < 0;
  const isUrgent = !isPaidThisMonth && (isOverdue || daysRemaining <= 3);
  const isWarning = !isPaidThisMonth && !isUrgent && daysRemaining <= 7;

  let statusTag: 'pago' | 'atrasado' | 'urgente_3d' | 'aviso_7d' | 'em_dia' = 'em_dia';
  if (isPaidThisMonth) {
    statusTag = 'pago';
  } else if (isOverdue) {
    statusTag = 'atrasado';
  } else if (daysRemaining <= 3) {
    statusTag = 'urgente_3d';
  } else if (daysRemaining <= 7) {
    statusTag = 'aviso_7d';
  }

  const formattedDueDate = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}-${String(safeDueDay).padStart(2, '0')}`;

  return {
    bill,
    targetDueDate: formattedDueDate,
    daysRemaining,
    isPaidThisMonth,
    isOverdue,
    isUrgent,
    isWarning,
    statusTag,
  };
}

export function useRecurringBills(
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void,
  handleCreateExpense: (expense: Partial<ExpenseItem>) => Promise<ExpenseItem | null>
) {
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [loadingBills, setLoadingBills] = useState<boolean>(false);

  const reloadBills = useCallback(async () => {
    try {
      setLoadingBills(true);
      const data = await fetchRecurringBills();
      setRecurringBills(data);
    } catch (e) {
      console.error('Erro ao carregar contas fixas:', e);
    } finally {
      setLoadingBills(false);
    }
  }, []);

  useEffect(() => {
    reloadBills();
  }, [reloadBills]);

  // Compute real-time alert statuses
  const billAlerts = useMemo(() => {
    return recurringBills
      .filter((b) => b.status === 'Ativo')
      .map(calculateBillAlertStatus)
      .sort((a, b) => {
        // Order: Overdue first, then Urgent (<=3d), then Warning (<=7d), then In Time, then Paid
        const getRank = (item: RecurringBillAlertStatus) => {
          if (item.isPaidThisMonth) return 5;
          if (item.isOverdue) return 1;
          if (item.isUrgent) return 2;
          if (item.isWarning) return 3;
          return 4;
        };
        const rankA = getRank(a);
        const rankB = getRank(b);
        if (rankA !== rankB) return rankA - rankB;
        return a.daysRemaining - b.daysRemaining;
      });
  }, [recurringBills]);

  const pendingAlertsCount = useMemo(() => {
    return billAlerts.filter((a) => !a.isPaidThisMonth && (a.isOverdue || a.daysRemaining <= 7)).length;
  }, [billAlerts]);

  const urgentAlertsCount = useMemo(() => {
    return billAlerts.filter((a) => !a.isPaidThisMonth && (a.isOverdue || a.daysRemaining <= 3)).length;
  }, [billAlerts]);

  const handleCreateBill = async (billData: Partial<RecurringBill>) => {
    const created = await createRecurringBill(billData);
    if (created) {
      setRecurringBills((prev) => [created, ...prev]);
      showToast('✅ Conta fixa cadastrada com sucesso!', 'success');
    } else {
      showToast('Erro ao cadastrar conta fixa', 'error');
    }
    return created;
  };

  const handleUpdateBill = async (id: string, updates: Partial<RecurringBill>) => {
    const success = await updateRecurringBill(id, updates);
    if (success) {
      setRecurringBills((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
      showToast('✅ Conta fixa atualizada!', 'success');
    }
    return success;
  };

  const handleDeleteBill = async (id: string) => {
    const success = await deleteRecurringBill(id);
    if (success) {
      setRecurringBills((prev) => prev.filter((item) => item.id !== id));
      showToast('🗑️ Conta fixa removida', 'info');
    }
    return success;
  };

  const handleMarkBillPaid = async (bill: RecurringBill, sourceAccount: any = 'Nubank') => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthStr = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 1. Create expense in Finance / Expenses module
    const newExpense: Partial<ExpenseItem> = {
      description: `Pagamento de Conta Fixa: ${bill.title}`,
      category: bill.category || 'Outros',
      amount: bill.amount,
      date: now.toISOString().split('T')[0],
      timestamp: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      paymentStatus: 'Pago',
      beneficiary: bill.beneficiary || bill.title,
      createdBy: 'Sistema RN 3D',
      sourceAccount: sourceAccount,
      referenceCode: `REC-BILL-${bill.id}-${currentMonthStr}`,
      notes: `Quitação automática via Lembrete Recorrente (${bill.recurrence}). ${bill.notes || ''}`.trim(),
    };

    await handleCreateExpense(newExpense);

    // 2. Mark recurring bill as paid in lastPaidMonth
    await handleUpdateBill(bill.id, { lastPaidMonth: currentMonthStr });

    showToast(`✅ ${bill.title} marcada como paga e espelhada no Financeiro!`, 'success');
  };

  return {
    recurringBills,
    billAlerts,
    pendingAlertsCount,
    urgentAlertsCount,
    loadingBills,
    reloadBills,
    handleCreateBill,
    handleUpdateBill,
    handleDeleteBill,
    handleMarkBillPaid,
  };
}
