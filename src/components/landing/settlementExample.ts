/**
 * 랜딩 "정산 예시" 카드의 데이터. 화면에 "정산 예시"로 표시되는 가상의
 * 모임이며 실제 사용자 사례가 아니다.
 *
 * 합계·1인당 금액·잔액은 손으로 적지 않고 지출 목록에서 계산한다.
 * 송금 목록은 표시 순서를 고정하기 위해 명시하되, tests/landing.test.mjs가
 * 잔액과 맞는지, 실제 정산 로직(src/lib/settlement.ts)의 결과와 같은지
 * 확인한다. 이 파일은 import가 없는 순수 TS로 둔다(테스트가 Node만으로
 * 실행하도록).
 */

export interface ExampleExpense {
  payer: string;
  item: string;
  amount: number;
}

export interface ExampleTransfer {
  from: string;
  to: string;
  amount: number;
}

export interface ExampleBalance {
  name: string;
  paid: number;
  /** 낸 돈 - 부담할 돈. 양수면 받을 돈, 음수면 보낼 돈 */
  balance: number;
}

export const EXAMPLE_GROUP_NAME = "금요일 저녁 모임";

export const EXAMPLE_PARTICIPANTS: readonly string[] = ["지현", "민재", "수아"];

/** 세 지출 모두 참여자 3명이 같은 금액으로 나눈다. */
export const EXAMPLE_EXPENSES: readonly ExampleExpense[] = [
  { payer: "지현", item: "저녁 식사", amount: 100000 },
  { payer: "민재", item: "카페", amount: 40000 },
  { payer: "수아", item: "택시", amount: 10000 },
];

export const EXAMPLE_TRANSFERS: readonly ExampleTransfer[] = [
  { from: "민재", to: "지현", amount: 10000 },
  { from: "수아", to: "지현", amount: 40000 },
];

export function summarizeExample(
  participants: readonly string[],
  expenses: readonly ExampleExpense[]
): { total: number; perPerson: number; balances: ExampleBalance[] } {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const perPerson = total / participants.length;
  const balances = participants.map((name) => {
    const paid = expenses
      .filter((e) => e.payer === name)
      .reduce((sum, e) => sum + e.amount, 0);
    return { name, paid, balance: paid - perPerson };
  });
  return { total, perPerson, balances };
}

export const EXAMPLE_SUMMARY = summarizeExample(EXAMPLE_PARTICIPANTS, EXAMPLE_EXPENSES);

/** 로케일/ICU에 의존하지 않는 원화 표기: 100000 → "100,000원" */
export function formatWon(amount: number): string {
  const digits = String(Math.abs(Math.round(amount))).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${digits}원`;
}

/** 받침 유무에 따른 주격 조사: 민재 → "민재가", 지현 → "지현이" */
export function withSubjectParticle(name: string): string {
  const last = name.charCodeAt(name.length - 1);
  const isHangul = last >= 0xac00 && last <= 0xd7a3;
  const hasFinal = isHangul && (last - 0xac00) % 28 !== 0;
  return `${name}${hasFinal ? "이" : "가"}`;
}
