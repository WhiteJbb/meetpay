export const SUPPORTED_CURRENCIES = ["KRW", "USD", "JPY", "EUR", "CNY"] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * 1 단위 통화 = N KRW. 실시간 환율 API 연동은 이후 확장 범위이며,
 * MVP에서는 고정 참고 환율을 사용한다 (docs/PlanningDoc.md 4.3 참고).
 * 지출 입력 미리보기와 정산 결과의 적용 환율 표에서도 이 값을 쓴다.
 */
export const KRW_EXCHANGE_RATE: Record<CurrencyCode, number> = {
  KRW: 1,
  USD: 1350,
  JPY: 9,
  EUR: 1450,
  CNY: 190,
};

export function toBaseCurrency(amount: number, currency: string): number {
  const rate = KRW_EXCHANGE_RATE[currency as CurrencyCode];
  if (!rate) {
    throw new Error(`지원하지 않는 통화입니다: ${currency}`);
  }
  return amount * rate;
}

export function formatCurrency(amount: number, currency: string): string {
  return `${Math.round(amount).toLocaleString("ko-KR")} ${currency}`;
}
