import Link from "next/link";
import styles from "./landing.module.css";
import SettlementSpecimen from "@/components/landing/SettlementSpecimen";
import StartSteps from "@/components/landing/StartSteps";

/**
 * 랜딩(task-20261105-002, 시안 B "계산 장부"). 공통 레이아웃(max-640 + py-10)은
 * 그대로 두고 이 페이지 안에서만 콘텐츠 폭을 넓힌다(landing.module.css 참고).
 * 넓은 화면: 왼쪽 5단 소개 + 오른쪽 7단 정산 예시 장부. 좁은 화면: 위아래로 쌓는다.
 * 장부만 클라이언트 컴포넌트(예시 지출 켜고 끄기)이고 나머지는 서버에서 렌더한다.
 */
export default function HomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.intro} aria-labelledby="landing-title">
        <p className={`${styles.eyebrow} font-body`}>모임 지출 · 더치페이 정산</p>
        <h1 id="landing-title" className={`${styles.headline} font-display`}>
          함께 쓴 돈,
          <br />
          누가 얼마 보낼지
          <br />
          <em>한눈에.</em>
        </h1>
        <p className={`${styles.lead} font-body`}>
          지출을 기록하면 보낼 금액을 계산해요. 가입 없이 시작하고, 결과는 링크로 공유하세요.
        </p>
        <div className={styles.ctaGroup}>
          <Link href="/groups/new" className={`${styles.cta} font-display`}>
            새 모임 만들기
          </Link>
          <p className={`${styles.ctaNote} font-body`}>
            가입 없이 바로 시작 · 참여자는 이름만 있으면 돼요
          </p>
        </div>
        <StartSteps />
      </section>

      <SettlementSpecimen />
    </main>
  );
}
