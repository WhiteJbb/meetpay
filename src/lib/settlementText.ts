/**
 * 단톡방에 붙여 넣을 정산 안내 글을 만든다 (task-20261102-001).
 *
 *   모임 이름
 *   민수 → 지영 12,000원 (국민 123-456-789)
 *   철수 → 지영 8,000원
 *   https://example.com/r/<viewToken>
 *
 * - 이체 줄은 화면의 이체 목록과 같은 순서·대상·금액(반올림 포함)이다.
 * - 받는 사람 계좌가 있으면 줄 끝에 괄호로 그대로 붙이고, 없으면 생략한다.
 * - 마지막 줄은 열람 전용 결과 링크(절대 URL)다. 편집 링크는 넣지 않는다.
 *
 * 서버/클라이언트 어디서든 쓰도록 외부 import 없이 순수 함수로 둔다.
 */

export interface SettlementTextTransfer {
  fromName: string;
  toName: string;
  amount: number;
  /** 받는 사람(toName)의 계좌. 미등록이면 null/빈 값 */
  toAccount: string | null;
}

/** 화면의 formatCurrency와 같은 반올림·천 단위 구분. KRW는 "원"으로 표기 */
export function formatTextAmount(amount: number, currency: string): string {
  const digits = Math.round(amount).toLocaleString("ko-KR");
  return currency === "KRW" ? `${digits}원` : `${digits} ${currency}`;
}

export function buildSettlementText({
  groupName,
  transfers,
  baseCurrency,
  resultUrl,
}: {
  groupName: string;
  transfers: SettlementTextTransfer[];
  baseCurrency: string;
  resultUrl: string;
}): string {
  const lines = [groupName];
  for (const t of transfers) {
    const line = `${t.fromName} → ${t.toName} ${formatTextAmount(t.amount, baseCurrency)}`;
    lines.push(t.toAccount ? `${line} (${t.toAccount})` : line);
  }
  lines.push(resultUrl);
  return lines.join("\n");
}
