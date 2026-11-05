"use client";

import { useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import styles from "@/app/landing.module.css";
import { computeSettlement } from "@/lib/settlement";
import {
  EXAMPLE_EXPENSES,
  EXAMPLE_GROUP_NAME,
  EXAMPLE_PARTICIPANTS,
  formatWon,
  withSubjectParticle,
} from "@/components/landing/settlementExample";

/**
 * 랜딩 "정산 예시" 장부 (task-20261105-002, 시안 B).
 * 가상의 예시 모임에서 지출을 켜고 끄면 실제 정산 로직(computeSettlement)으로
 * 잔액과 송금을 다시 계산한다. 서버에서 모든 지출이 켜진 상태로 먼저 렌더되므로
 * JS가 없어도 결과가 보인다. 데이터는 저장하지 않는다.
 */

const PARTICIPANTS = EXAMPLE_PARTICIPANTS.map((name) => ({ id: name, name }));
const ALL_ON = EXAMPLE_EXPENSES.map(() => true);

function settle(included: readonly boolean[]) {
  const active = EXAMPLE_EXPENSES.filter((_, i) => included[i]);
  const result = computeSettlement(
    PARTICIPANTS,
    active.map((e) => ({
      amount: e.amount,
      currency: "KRW",
      payerId: e.payer,
      shareParticipantIds: [...EXAMPLE_PARTICIPANTS],
    }))
  );
  const total = active.reduce((sum, e) => sum + e.amount, 0);
  const balances = result.netBalances.map((b) => ({
    name: b.name,
    balance: b.balance,
    paid: active.filter((e) => e.payer === b.name).reduce((sum, e) => sum + e.amount, 0),
  }));
  return { count: active.length, total, balances, transfers: result.transfers };
}

export default function SettlementSpecimen() {
  const [included, setIncluded] = useState<boolean[]>(ALL_ON);
  // 바뀐 숫자에 짧은 opacity 피드백을 주기 위한 키(첫 렌더에는 0 → 애니메이션 없음)
  const [revision, setRevision] = useState(0);
  const firstCheckbox = useRef<HTMLInputElement>(null);

  const { count, total, balances, transfers } = settle(included);
  const people = EXAMPLE_PARTICIPANTS.length;
  const changed = included.some((on) => !on);
  const maxAbs = Math.max(1, ...balances.map((b) => Math.abs(b.balance)));
  const fresh = revision > 0 ? styles.fresh : "";

  const toggle = (index: number, on: boolean) => {
    setIncluded((prev) => prev.map((v, i) => (i === index ? on : v)));
    setRevision((r) => r + 1);
  };
  const reset = () => {
    setIncluded(ALL_ON);
    setRevision((r) => r + 1);
    // 누르면 버튼이 비활성화되므로, 키보드 포커스가 문서 맨 앞으로 사라지지 않게 첫 지출로 옮긴다
    firstCheckbox.current?.focus();
  };

  return (
    <section className={styles.ledger} aria-labelledby="landing-example-title">
      <div className={styles.ledgerHead}>
        <h2 id="landing-example-title" className={styles.ledgerTitle}>
          <span className={styles.ledgerLabel}>정산 예시</span>
          <span>{EXAMPLE_GROUP_NAME}</span>
        </h2>
        <button type="button" className={styles.reset} onClick={reset} disabled={!changed}>
          처음 예시로
        </button>
        <p className={styles.hint}>지출을 끄고 켜 보세요. 보낼 금액이 다시 계산돼요.</p>
      </div>

      <ol className={styles.track}>
        <li className={styles.trackStep}>
          <span className={`${styles.dot} font-data`} aria-hidden="true">
            1
          </span>
          <h3 className={styles.stepHead}>
            기록한 지출
            <span className={`${styles.stepMeta} font-data`}>{count}건</span>
          </h3>
          <ul className={styles.rows}>
            {EXAMPLE_EXPENSES.map((expense, i) => (
              <li key={expense.item}>
                <label className={`${styles.expense} ${included[i] ? "" : styles.off}`}>
                  <input
                    ref={i === 0 ? firstCheckbox : undefined}
                    type="checkbox"
                    checked={included[i]}
                    onChange={(event) => toggle(i, event.target.checked)}
                    aria-label={`${expense.item} ${formatWon(expense.amount)} 정산에 포함`}
                  />
                  <span className={styles.avatarSlot}>
                    <Avatar name={expense.payer} size={28} />
                  </span>
                  <span className={styles.rowText}>
                    <span className={styles.rowPrimary}>{expense.item}</span>
                    <span className={styles.rowSecondary}>
                      {withSubjectParticle(expense.payer)} 결제
                    </span>
                  </span>
                  <span className={`${styles.amount} font-data`}>{formatWon(expense.amount)}</span>
                </label>
              </li>
            ))}
          </ul>
          <dl className={styles.totals}>
            <div className={styles.totalRow}>
              <dt>합계</dt>
              <dd key={`t${revision}`} className={`${fresh} font-data`}>
                {formatWon(total)}
              </dd>
            </div>
            <div className={styles.totalRow}>
              <dt>1인당 부담 (합계 ÷ {people}명)</dt>
              <dd key={`p${revision}`} className={`${fresh} font-data`}>
                {formatWon(total / people)}
              </dd>
            </div>
          </dl>
        </li>

        <li className={styles.trackStep}>
          <span className={`${styles.dot} font-data`} aria-hidden="true">
            2
          </span>
          <h3 className={styles.stepHead}>사람별 잔액</h3>
          <ul className={styles.rows}>
            {balances.map((b) => {
              const rounded = Math.round(b.balance);
              const kind = rounded > 0 ? "receive" : rounded < 0 ? "send" : "zero";
              const label = kind === "receive" ? "받을 돈" : kind === "send" ? "보낼 돈" : "정산 끝";
              const scale = rounded === 0 ? 0 : Math.abs(b.balance) / maxAbs;
              return (
                <li key={b.name} className={styles.balanceRow}>
                  <Avatar name={b.name} size={28} />
                  <span className={styles.rowText}>
                    <span className={styles.rowPrimary}>{b.name}</span>
                    <span className={styles.rowSecondary}>
                      낸 돈 <span className="font-data">{formatWon(b.paid)}</span>
                    </span>
                  </span>
                  <span className={styles.bar} aria-hidden="true">
                    <i
                      className={styles.barPos}
                      style={{ transform: `scaleX(${kind === "receive" ? scale : 0})` }}
                    />
                    <i
                      className={styles.barNeg}
                      style={{ transform: `scaleX(${kind === "send" ? scale : 0})` }}
                    />
                  </span>
                  <span className={styles.balance}>
                    <span className={styles.balanceLabel}>{label}</span>
                    <span
                      className={`${styles.balanceAmount} ${kind === "receive" ? styles.receive : ""} font-data`}
                    >
                      {formatWon(b.balance)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </li>

        <li className={styles.trackStep}>
          <span className={`${styles.dot} ${styles.dotFinal} font-data`} aria-hidden="true">
            3
          </span>
          <h3 className={styles.stepHead}>
            이렇게 보내면 끝나요
            {transfers.length > 0 && (
              <span className={`${styles.stepMeta} font-data`}>송금 {transfers.length}건</span>
            )}
          </h3>
          {/* 라이브 영역은 고정해 두고 안쪽만 다시 그려야 스크린리더가 바뀐 결과를 읽는다 */}
          <div aria-live="polite" className={styles.result}>
            <div key={`r${revision}`} className={fresh}>
              {count === 0 ? (
                <p className={styles.empty}>
                  <strong>켜진 지출이 없어요.</strong> 지출을 하나 이상 켜면 보낼 금액이 나와요.
                </p>
              ) : transfers.length === 0 ? (
                <p className={styles.empty}>
                  <strong>보낼 돈이 없어요.</strong> 모두 자기 몫만큼 냈어요.
                </p>
              ) : (
                <ol className={styles.rows}>
                  {transfers.map((t) => (
                    <li key={`${t.fromId}-${t.toId}`} className={styles.transfer}>
                      <span className={styles.transferPair} aria-hidden="true">
                        {t.fromName}
                        <span className={styles.transferArrow}>→</span>
                        {t.toName}
                      </span>
                      <span className="sr-only">
                        {withSubjectParticle(t.fromName)} {t.toName}에게
                      </span>
                      <span className={`${styles.transferAmount} font-data`}>{formatWon(t.amount)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </li>
      </ol>

      <p className={styles.note}>모두 같은 금액으로 나눈 예시 · 실제 송금은 직접 해요.</p>
    </section>
  );
}
