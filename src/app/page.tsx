import Link from "next/link";
import styles from "./landing.module.css";
import SettlementSpecimen from "@/components/landing/SettlementSpecimen";
import StartSteps from "@/components/landing/StartSteps";

/**
 * 랜딩(task-20261031-018). 공통 레이아웃(max-640 + py-10)은 그대로 두고,
 * 이 페이지 안에서만 그린 스테이지를 넓게 펼친다(landing.module.css 참고).
 * 워드마크/헤더 없음. 모든 내용은 서버에서 렌더되며 클라이언트 JS가 없다.
 * 설계 근거와 QA 사양: docs/landing-design-review.md
 */
export default function HomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.stage} aria-labelledby="landing-title">
        <div className={styles.hero}>
          <div className={styles.message}>
            <p className={`${styles.eyebrow} font-body`}>모임 지출 · 더치페이 정산</p>
            <h1 id="landing-title" className={`${styles.headline} font-display`}>
              함께 쓴 돈,
              <br />
              누가 얼마 보낼지
              <br />
              한눈에.
            </h1>
            <p className={`${styles.lead} font-body`}>
              지출을 기록하면 보낼 금액을 계산해요. 가입 없이 시작하고, 결과는 링크로
              공유하세요.
            </p>
            <div className={styles.ctaGroup}>
              <Link href="/groups/new" className={`${styles.cta} font-display`}>
                새 모임 만들기
              </Link>
              <p className={`${styles.ctaNote} font-body`}>
                가입 없이 바로 시작 · 참여자는 이름만 있으면 돼요
              </p>
            </div>
          </div>

          <SettlementSpecimen />
        </div>
      </section>

      <StartSteps />
    </main>
  );
}
