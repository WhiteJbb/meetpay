import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveGroupById } from "@/lib/group";
import { formatCurrency, toBaseCurrency } from "@/lib/currency";
import { computeSettlement } from "@/lib/settlement";
import ExpiryBanner from "@/components/ExpiryBanner";
import GroupCard from "@/components/GroupCard";
import Tabs from "@/components/Tabs";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import Avatar from "@/components/Avatar";
import { addParticipant, deleteParticipant, updateParticipant } from "@/app/actions";

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await getActiveGroupById(id);
  if (!group) notFound();

  const [participants, expenses] = await Promise.all([
    prisma.participant.findMany({
      where: { groupId: id },
      include: { _count: { select: { paid: true, shares: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.expense.findMany({
      where: { groupId: id },
      include: { payer: true, shares: { include: { participant: true } } },
      orderBy: { date: "desc" },
    }),
  ]);

  const totalBase = expenses.reduce((sum, e) => sum + toBaseCurrency(e.amount, e.currency), 0);
  const { netBalances } = computeSettlement(
    participants,
    expenses.map((e) => ({
      amount: e.amount,
      currency: e.currency,
      payerId: e.payerId,
      shareParticipantIds: e.shares.map((s) => s.participantId),
    })),
    group.baseCurrency
  );

  const expensesPanel = (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Link
          href={`/groups/${id}/expenses/new`}
          className="rounded-full bg-accent px-4 py-2 font-body text-sm font-medium text-accent-ink hover:bg-accent-hover"
        >
          지출 추가
        </Link>
      </div>

      {expenses.length === 0 ? (
        <EmptyState
          icon="🧾"
          title="아직 등록된 지출이 없어요"
          body="첫 지출을 추가하면 참여자별 정산 결과를 바로 확인할 수 있어요."
          action={
            <Link
              href={`/groups/${id}/expenses/new`}
              className="rounded-full bg-accent px-5 py-2.5 font-body text-sm font-semibold text-accent-ink hover:bg-accent-hover"
            >
              첫 지출 추가하기
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-token bg-surface shadow-card">
          {expenses.map((expense) => (
            <li key={expense.id} className="flex items-center gap-3 p-3">
              <Avatar name={expense.payer.name} size={36} />
              <div className="flex-1">
                <p className="font-body font-medium">
                  {expense.title}
                  {expense.receiptUrl && (
                    <a
                      href={expense.receiptUrl}
                      target="_blank"
                      title="영수증 보기"
                      className="ml-2 text-sm"
                      aria-label={`${expense.title} 영수증 보기`}
                    >
                      🧾
                    </a>
                  )}
                </p>
                <p className="font-body text-sm text-muted">
                  {expense.date.toISOString().slice(0, 10)} · {expense.payer.name} 결제 ·{" "}
                  <span className="font-data">
                    {formatCurrency(expense.amount, expense.currency)}
                  </span>{" "}
                  · {expense.shares.length}명 분담
                </p>
              </div>
              <Link
                href={`/groups/${id}/expenses/${expense.id}`}
                className="shrink-0 rounded-full bg-bg px-3 py-1.5 font-body text-sm font-medium text-ink transition-colors duration-150 hover:bg-accent-soft"
              >
                수정
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const participantsPanel = (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y divide-border rounded-token bg-surface shadow-card">
        {participants.map((p) => {
          const involved = p._count.paid > 0 || p._count.shares > 0;
          return (
            <li key={p.id} className="flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar name={p.name} size={36} />
                  <div>
                    <span className="font-body font-medium">{p.name}</span>
                    <span className="ml-2 font-body text-caption text-muted">
                      {p.email ?? ""}
                      {p.bankAccount ? ` · 계좌 ${p.bankAccount}` : " · 계좌 미등록"}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {involved || participants.length <= 2 ? (
                    <span className="font-body text-caption text-muted">
                      {involved ? "삭제 불가 (지출 내역 있음)" : "삭제 불가 (최소 2명)"}
                    </span>
                  ) : (
                    <ConfirmDialog
                      triggerLabel="삭제"
                      triggerClassName="rounded-full bg-negative-soft px-3 py-1.5 font-body text-sm font-medium text-negative hover:brightness-95"
                      title={`참여자 "${p.name}"을(를) 삭제할까요?`}
                      body="이 작업은 되돌릴 수 없어요."
                      confirmLabel="삭제"
                      action={deleteParticipant.bind(null, id, p.id)}
                    />
                  )}
                </div>
              </div>
              <details>
                <summary className="w-fit cursor-pointer rounded-full bg-bg px-3 py-1.5 font-body text-sm font-medium text-ink transition-colors duration-150 hover:bg-accent-soft">
                  수정
                </summary>
                <form
                  action={updateParticipant.bind(null, id, p.id)}
                  className="mt-2 flex flex-col gap-2 sm:flex-row"
                >
                  <input
                    name="name"
                    required
                    defaultValue={p.name}
                    placeholder="이름 (필수)"
                    className="rounded-input border border-border bg-bg px-3 py-2 font-body text-sm sm:w-1/4"
                  />
                  <input
                    name="email"
                    type="email"
                    defaultValue={p.email ?? ""}
                    placeholder="이메일 (선택)"
                    className="rounded-input border border-border bg-bg px-3 py-2 font-body text-sm sm:w-1/4"
                  />
                  <input
                    name="bankAccount"
                    defaultValue={p.bankAccount ?? ""}
                    placeholder="계좌 (선택)"
                    className="rounded-input border border-border bg-bg px-3 py-2 font-body text-sm sm:w-1/4"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-accent px-4 py-2 font-body text-sm font-medium text-accent-ink hover:bg-accent-hover"
                  >
                    저장
                  </button>
                </form>
              </details>
            </li>
          );
        })}
      </ul>

      <details className="rounded-token border border-dashed border-border p-3">
        <summary className="cursor-pointer font-body text-sm font-medium text-ink">
          + 참여자 추가
        </summary>
        <form action={addParticipant.bind(null, id)} className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            name="name"
            required
            placeholder="이름 (필수)"
            className="rounded-input border border-border bg-bg px-3 py-2 font-body text-sm sm:w-1/4"
          />
          <input
            name="email"
            type="email"
            placeholder="이메일 (동명이인 시 필수)"
            className="rounded-input border border-border bg-bg px-3 py-2 font-body text-sm sm:w-1/4"
          />
          <input
            name="bankAccount"
            placeholder="계좌 (선택)"
            className="rounded-input border border-border bg-bg px-3 py-2 font-body text-sm sm:w-1/4"
          />
          <button
            type="submit"
            className="rounded-full bg-accent px-4 py-2 font-body text-sm font-medium text-accent-ink hover:bg-accent-hover"
          >
            추가
          </button>
        </form>
      </details>
    </div>
  );

  return (
    <main className="flex flex-col gap-6">
      <GroupCard
        name={group.name}
        baseCurrency={group.baseCurrency}
        expiresAt={group.expiresAt}
        groupId={id}
        totalLabel={formatCurrency(totalBase, group.baseCurrency)}
        participantCount={participants.length}
        expenseCount={expenses.length}
      />

      <ExpiryBanner expiresAt={group.expiresAt} />

      <div className="rounded-token bg-surface p-4 shadow-card">
        <p className="font-body text-sm text-muted">현재 순 잔액 (+ 받을 돈 / - 낼 돈)</p>
        {expenses.length === 0 ? (
          <p className="font-body text-sm text-muted">지출이 등록되면 표시돼요.</p>
        ) : (
          <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-body text-sm">
            {netBalances.map((b) => (
              <li key={b.participantId}>
                {b.name}{" "}
                <span className={`font-data ${b.balance >= 0 ? "text-positive" : "text-negative"}`}>
                  {b.balance >= 0 ? "+" : ""}
                  {Math.round(b.balance).toLocaleString("ko-KR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Tabs
        tabs={[
          { label: "지출 목록", content: expensesPanel },
          { label: "참여자", content: participantsPanel },
        ]}
      />

      <Link
        href={`/groups/${id}/settlement`}
        className="rounded-full border border-accent px-6 py-3 text-center font-display font-semibold text-accent hover:bg-surface"
      >
        정산 결과 보기
      </Link>
      <p className="-mt-4 text-center font-body text-caption text-muted">
        언제든 눌러서 현재 기준 결과를 확인할 수 있어요. 확인 후에도 지출을
        계속 추가/수정할 수 있고, 데이터 보관 기간에도 영향이 없어요.
      </p>
    </main>
  );
}
