import CopyLinkButton from "@/components/CopyLinkButton";

/**
 * DesignSystem.html "10. 모임 카드" 컴포넌트. 모임 홈 최상단에서
 * 이름·만료·총액·참여자·지출 건수·모임 링크 복사를 한 번에 보여준다.
 */
export default function GroupCard({
  name,
  baseCurrency,
  expiresAt,
  groupId,
  totalLabel,
  participantCount,
  expenseCount,
}: {
  name: string;
  baseCurrency: string;
  expiresAt: Date;
  groupId: string;
  totalLabel: string;
  participantCount: number;
  expenseCount: number;
}) {
  const daysLeft = Math.max(
    0,
    Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
  );

  return (
    <div className="flex flex-col gap-5 rounded-token bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{name}</h1>
          <p className="font-body text-sm text-muted">기준 통화 {baseCurrency}</p>
        </div>
        <span className="shrink-0 whitespace-nowrap rounded-full bg-warn-soft px-3 py-1 font-body text-xs font-bold text-warn">
          D-{daysLeft} 후 자동 삭제
        </span>
      </div>

      <div className="flex gap-6">
        <div>
          <p className="font-body text-xs text-muted">지출 총액</p>
          <p className="font-data text-xl font-bold">{totalLabel}</p>
        </div>
        <div>
          <p className="font-body text-xs text-muted">참여자</p>
          <p className="font-data text-xl font-bold">{participantCount}명</p>
        </div>
        <div>
          <p className="font-body text-xs text-muted">지출 건수</p>
          <p className="font-data text-xl font-bold">{expenseCount}건</p>
        </div>
      </div>

      <div className="flex flex-col items-start gap-1">
        <CopyLinkButton path={`/groups/${groupId}`} label="모임 링크 복사 (편집 가능)" />
        <p className="font-body text-caption text-muted">
          이 링크를 받은 사람은 지출을 수정할 수 있어요
        </p>
      </div>
    </div>
  );
}
