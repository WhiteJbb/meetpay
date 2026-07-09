import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computeSettlement } from "@/lib/settlement";
import { formatCurrency, KRW_EXCHANGE_RATE, type CurrencyCode } from "@/lib/currency";
import ExpiryBanner from "@/components/ExpiryBanner";
import CopyLinkButton from "@/components/CopyLinkButton";
import TransferList from "@/components/TransferList";
import Avatar from "@/components/Avatar";
import AppBar from "@/components/AppBar";

interface GroupInfo {
  id: string;
  name: string;
  baseCurrency: string;
  expiresAt: Date;
}

/**
 * 정산 결과 공용 뷰. 모임 링크(/groups/[id]/settlement)에서는 편집
 * 모드로, 결과 링크(/r/[token])에서는 읽기 전용 모드로 렌더된다
 * (docs/IA.md §1 링크 체계).
 */
export default async function SettlementView({
  group,
  viewToken,
  readOnly,
}: {
  group: GroupInfo;
  viewToken: string;
  readOnly: boolean;
}) {
  const [participants, expenses] = await Promise.all([
    prisma.participant.findMany({ where: { groupId: group.id }, orderBy: { name: "asc" } }),
    prisma.expense.findMany({
      where: { groupId: group.id },
      include: { payer: true, shares: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const result = computeSettlement(
    participants,
    expenses.map((e) => ({
      amount: e.amount,
      currency: e.currency,
      payerId: e.payerId,
      shareParticipantIds: e.shares.map((s) => s.participantId),
    })),
    group.baseCurrency
  );

  const usedForeignCurrencies = [...new Set(expenses.map((e) => e.currency))].filter(
    (c) => c !== group.baseCurrency
  );

  return (
    <main className="flex flex-col gap-6">
      <AppBar
        title={`${group.name} 정산 결과`}
        subtitle={readOnly ? "열람 전용 페이지예요" : undefined}
        backHref={readOnly ? undefined : `/groups/${group.id}`}
      />

      <div className="flex flex-col items-start gap-1">
        <CopyLinkButton path={`/r/${viewToken}`} label="결과 링크 복사 (열람 전용)" />
        <p className="font-body text-caption text-muted">이 링크로는 결과만 볼 수 있어요</p>
      </div>

      <ExpiryBanner expiresAt={group.expiresAt} />

      <div className="flex flex-col gap-6 rounded-token bg-surface p-6 shadow-card">
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-semibold">
            참여자별 잔액 ({group.baseCurrency} 환산)
          </h2>
          <ul className="flex flex-col divide-y divide-border">
            {result.netBalances.map((b) => (
              <li key={b.participantId} className="flex items-center justify-between gap-3 py-2 font-body text-sm">
                <span className="flex items-center gap-2">
                  <Avatar name={b.name} size={28} />
                  {b.name}
                </span>
                <span className={`font-data ${b.balance >= 0 ? "text-positive" : "text-negative"}`}>
                  {b.balance >= 0 ? "+" : ""}
                  {formatCurrency(b.balance, group.baseCurrency)}
                </span>
              </li>
            ))}
          </ul>
          <p className="font-body text-caption text-muted">+ 는 받아야 할 돈, - 는 내야 할 돈이에요.</p>
        </section>

        <div className="border-t border-border" />

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-semibold">이체 목록 (최소 횟수)</h2>
          <TransferList
            transfers={result.transfers}
            participants={participants.map((p) => ({
              id: p.id,
              name: p.name,
              bankAccount: p.bankAccount,
            }))}
            baseCurrency={group.baseCurrency}
          />
        </section>
      </div>

      {usedForeignCurrencies.length > 0 && (
        <section className="flex flex-col gap-2 rounded-token bg-surface p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">적용 환율</h2>
          <ul className="flex flex-col divide-y divide-border">
            {usedForeignCurrencies.map((c) => (
              <li key={c} className="flex justify-between py-2 font-data text-sm">
                <span>1 {c}</span>
                <span>
                  = {(KRW_EXCHANGE_RATE[c as CurrencyCode] ?? 1).toLocaleString("ko-KR")}{" "}
                  {group.baseCurrency}
                </span>
              </li>
            ))}
          </ul>
          <p className="font-body text-caption text-muted">
            고정 참고 환율이에요. 실제 결제일의 환율과 다를 수 있어요.
          </p>
        </section>
      )}

      <section className="flex flex-col gap-2 rounded-token bg-surface p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold">지출 내역 (원본 통화)</h2>
        {expenses.length === 0 ? (
          <p className="font-body text-sm text-muted">등록된 지출이 없어요.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {expenses.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-4 py-2 font-body text-sm">
                <div>
                  <p className="font-medium">
                    {e.title}
                    {e.receiptUrl && (
                      <a
                        href={e.receiptUrl}
                        target="_blank"
                        title="영수증 보기"
                        className="ml-2"
                        aria-label={`${e.title} 영수증 보기`}
                      >
                        🧾
                      </a>
                    )}
                  </p>
                  <p className="text-muted">
                    {e.date.toISOString().slice(0, 10)} · {e.payer.name} 결제 · {e.shares.length}명
                    분담
                  </p>
                </div>
                <span className="shrink-0 font-data font-medium">
                  {formatCurrency(e.amount, e.currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!readOnly && (
        <Link
          href={`/groups/${group.id}`}
          className="self-start rounded-full bg-bg px-4 py-2 font-body text-sm font-medium text-ink hover:bg-accent-soft"
        >
          ← 모임 홈으로 돌아가기 (지출 수정)
        </Link>
      )}
    </main>
  );
}
