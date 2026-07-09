import { toBaseCurrency } from "@/lib/currency";

export interface SettlementParticipant {
  id: string;
  name: string;
}

export interface SettlementExpense {
  amount: number;
  currency: string;
  payerId: string;
  shareParticipantIds: string[];
}

export interface Transfer {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

export interface SettlementResult {
  baseCurrency: string;
  netBalances: { participantId: string; name: string; balance: number }[];
  transfers: Transfer[];
}

/**
 * 참여자별 순 잔액(낸 돈 - 부담해야 할 돈, 기준 통화 환산)을 계산하고,
 * 그리디 방식으로 최소 이체 횟수의 정산 목록을 만든다.
 */
export function computeSettlement(
  participants: SettlementParticipant[],
  expenses: SettlementExpense[],
  baseCurrency = "KRW"
): SettlementResult {
  const balances = new Map<string, number>();
  for (const p of participants) balances.set(p.id, 0);

  for (const expense of expenses) {
    const baseAmount = toBaseCurrency(expense.amount, expense.currency);
    const shareCount = expense.shareParticipantIds.length;
    if (shareCount === 0) continue;
    const perPerson = baseAmount / shareCount;

    balances.set(expense.payerId, (balances.get(expense.payerId) ?? 0) + baseAmount);
    for (const participantId of expense.shareParticipantIds) {
      balances.set(participantId, (balances.get(participantId) ?? 0) - perPerson);
    }
  }

  const nameById = new Map(participants.map((p) => [p.id, p.name]));

  const EPSILON = 0.5; // 반올림 오차(1원 미만) 무시
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];
  for (const [id, balance] of balances.entries()) {
    if (balance > EPSILON) creditors.push({ id, amount: balance });
    else if (balance < -EPSILON) debtors.push({ id, amount: -balance });
  }
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > EPSILON) {
      transfers.push({
        fromId: debtor.id,
        fromName: nameById.get(debtor.id) ?? "알 수 없음",
        toId: creditor.id,
        toName: nameById.get(creditor.id) ?? "알 수 없음",
        amount,
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount <= EPSILON) i++;
    if (creditor.amount <= EPSILON) j++;
  }

  const netBalances = participants.map((p) => ({
    participantId: p.id,
    name: p.name,
    balance: balances.get(p.id) ?? 0,
  }));

  return { baseCurrency, netBalances, transfers };
}
