import Avatar from "@/components/Avatar";
import styles from "@/app/landing.module.css";
import {
  EXAMPLE_EXPENSES,
  EXAMPLE_GROUP_NAME,
  EXAMPLE_PARTICIPANTS,
  EXAMPLE_SUMMARY,
  EXAMPLE_TRANSFERS,
  formatWon,
  withSubjectParticle,
} from "@/components/landing/settlementExample";

/**
 * 랜딩 히어로 오른쪽(모바일은 CTA 아래)의 "지출 → 송금" 예시. 가상의
 * 예시 모임을 서버에서 그대로 렌더한다. 버튼처럼 보이는 행이나 가짜
 * 컨트롤은 두지 않는다 — 읽기만 하는 표본이다.
 */
export default function SettlementSpecimen() {
  const { total, perPerson, balances } = EXAMPLE_SUMMARY;
  const people = EXAMPLE_PARTICIPANTS.length;

  return (
    <section className={styles.specimen} aria-labelledby="landing-example-title">
      <h2 id="landing-example-title" className={styles.specimenHeading}>
        <span className={styles.specimenLabel}>정산 예시</span>
        <span className={styles.specimenTitle}>{EXAMPLE_GROUP_NAME}</span>
      </h2>
      <p className={styles.specimenMeta}>
        참여자 {people}명 · 지출 {EXAMPLE_EXPENSES.length}건
      </p>

      <div className={styles.block}>
        <h3 className={styles.blockTitle}>기록한 지출</h3>
        <ul className={styles.rows}>
          {EXAMPLE_EXPENSES.map((expense) => (
            <li key={expense.item} className={styles.row}>
              <Avatar name={expense.payer} size={28} />
              <div className={styles.rowText}>
                <span className={styles.rowPrimary}>{expense.item}</span>
                <span className={styles.rowSecondary}>
                  {withSubjectParticle(expense.payer)} 결제
                </span>
              </div>
              <span className={`${styles.amount} font-data`}>{formatWon(expense.amount)}</span>
            </li>
          ))}
        </ul>
        <dl className={styles.totals}>
          <div className={styles.totalRow}>
            <dt>합계</dt>
            <dd className="font-data">{formatWon(total)}</dd>
          </div>
          <div className={styles.totalRow}>
            <dt>1인당 부담 (합계 ÷ {people}명)</dt>
            <dd className="font-data">{formatWon(perPerson)}</dd>
          </div>
        </dl>
      </div>

      <div className={styles.block}>
        <h3 className={styles.blockTitle}>사람별 잔액</h3>
        <ul className={styles.rows}>
          {balances.map((b) => {
            const receives = b.balance > 0;
            return (
              <li key={b.name} className={styles.row}>
                <Avatar name={b.name} size={28} />
                <div className={styles.rowText}>
                  <span className={styles.rowPrimary}>{b.name}</span>
                  <span className={styles.rowSecondary}>
                    낸 돈 <span className="font-data">{formatWon(b.paid)}</span>
                  </span>
                </div>
                <div className={styles.balance}>
                  <span className={styles.balanceLabel}>{receives ? "받을 돈" : "보낼 돈"}</span>
                  <span
                    className={`${styles.balanceAmount} ${receives ? styles.receive : styles.send} font-data`}
                  >
                    {formatWon(b.balance)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={styles.result}>
        <h3 className={styles.resultTitle}>이렇게 보내면 끝나요 · 송금 {EXAMPLE_TRANSFERS.length}건</h3>
        <ol className={styles.transfers}>
          {EXAMPLE_TRANSFERS.map((t) => (
            <li key={`${t.from}-${t.to}`} className={styles.transfer}>
              <span className={styles.transferPair} aria-hidden="true">
                <strong>{t.from}</strong>
                <span className={styles.transferArrow}>→</span>
                <strong>{t.to}</strong>
              </span>
              <span className="sr-only">
                {withSubjectParticle(t.from)} {t.to}에게
              </span>
              <span className={`${styles.transferAmount} font-data`}>{formatWon(t.amount)}</span>
            </li>
          ))}
        </ol>
      </div>

      <p className={styles.specimenNote}>모두 같은 금액으로 나눈 예시 · 실제 송금은 직접 해요.</p>
    </section>
  );
}
