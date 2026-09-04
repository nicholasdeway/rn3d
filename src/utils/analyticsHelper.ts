import { Order, Consignment, ExpenseItem } from '../types';

export interface MonthlyAnalyticsData {
  month: string;
  monthFullName: string;
  receitas: number;
  despesas: number;
  saldo: number;
  saldoAcumulado: number;
}

/**
 * Calcula os dados analíticos mensais 100% reais dos últimos 6 meses
 * sem valores fakes ou baselines mockadas.
 */
export function computeMonthlyAnalyticsData(
  orders: Order[] = [],
  transactions: any[] = [],
  consignments: Consignment[] = [],
  expenses: ExpenseItem[] = []
): MonthlyAnalyticsData[] {
  const monthsNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const fullMonthsNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const now = new Date();
  const currentMonthIdx = now.getMonth();

  const last6Months: { idx: number; year: number; label: string; fullLabel: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), currentMonthIdx - i, 1);
    const mIdx = d.getMonth();
    const yr = d.getFullYear();
    last6Months.push({
      idx: mIdx,
      year: yr,
      label: monthsNames[mIdx],
      fullLabel: `${fullMonthsNames[mIdx]} ${yr}`,
    });
  }

  const monthlyMap = new Map<string, { receitas: number; despesas: number }>();
  last6Months.forEach((m) => {
    monthlyMap.set(`${m.year}-${m.idx}`, { receitas: 0, despesas: 0 });
  });

  const parseDateToMonthKey = (dateStr: string): string | null => {
    if (!dateStr) return null;
    let d: Date | null = null;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
    } else if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length >= 3) {
        d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    }
    if (d && !isNaN(d.getTime())) {
      return `${d.getFullYear()}-${d.getMonth()}`;
    }
    return null;
  };

  // 1. Pedidos Faturados / Recebidos
  orders.forEach((o) => {
    if (o.id?.startsWith('SYS_') || o.clientName?.startsWith('SISTEMA_')) return;
    const key = parseDateToMonthKey(o.date);
    const revenue = Number(o.paidAmount) || Number(o.totalValue) || 0;
    if (key && monthlyMap.has(key)) {
      const cur = monthlyMap.get(key)!;
      cur.receitas += revenue;
    }
  });

  // 2. Transações de Caixa / Vendas
  transactions.forEach((t) => {
    const key = parseDateToMonthKey(t.date);
    const amt = Number(t.amount) || 0;
    if (key && monthlyMap.has(key)) {
      const cur = monthlyMap.get(key)!;
      const typeLower = (t.type || '').toLowerCase();
      if (typeLower.includes('receita') || typeLower.includes('venda') || typeLower.includes('entrada') || typeLower.includes('recebimento')) {
        cur.receitas += amt;
      } else if (typeLower.includes('despesa') || typeLower.includes('saída') || typeLower.includes('retirada')) {
        cur.despesas += amt;
      }
    }
  });

  // 3. Consignações Ativas
  consignments.forEach((c) => {
    const key = parseDateToMonthKey(c.date);
    const val = Number(c.totalValue) || 0;
    if (key && monthlyMap.has(key)) {
      const cur = monthlyMap.get(key)!;
      cur.receitas += val;
    }
  });

  // 4. Lançamentos de Despesas & Aportes
  expenses.forEach((exp) => {
    if (
      exp.referenceCode?.startsWith('SYS_') ||
      exp.category === 'Transferência de Marketplace'
    ) {
      return;
    }

    const key = parseDateToMonthKey(exp.date);
    const amt = Number(exp.amount) || 0;

    if (key && monthlyMap.has(key)) {
      const cur = monthlyMap.get(key)!;
      if (exp.category === 'Aporte / Reembolso de Sócio') {
        cur.receitas += amt;
      } else if (exp.paymentStatus === 'Pago') {
        cur.despesas += amt;
      }
    }
  });

  let runningAccumulatedBalance = 0;

  return last6Months.map((m) => {
    const key = `${m.year}-${m.idx}`;
    const real = monthlyMap.get(key) || { receitas: 0, despesas: 0 };
    const receitas = real.receitas;
    const despesas = real.despesas;
    const saldo = receitas - despesas;
    runningAccumulatedBalance += saldo;

    return {
      month: m.label,
      monthFullName: m.fullLabel,
      receitas,
      despesas,
      saldo,
      saldoAcumulado: runningAccumulatedBalance,
    };
  });
}
