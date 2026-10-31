import Link from "next/link";
import styles from "@/app/landing.module.css";

/**
 * 그린 스테이지 아래의 시작 3단계. 아이콘 카드 대신 번호 + 구분선으로
 * 된 평범한 순서 목록이다. 문구는 실제 기능 범위만 설명한다:
 * 모임 생성(이름 + 참여자 2명 이상, 이메일·계좌는 선택) → 지출 기록
 * (결제자·금액·나눌 사람) → 열람 전용 결과 링크(/r/[token]) 공유.
 */
const STEPS = [
  {
    title: "모임 만들기",
    body: "모임 이름과 참여자 이름을 입력해요. 참여자는 이름만 있으면 돼요.",
  },
  {
    title: "지출 기록하기",
    body: "결제한 사람과 금액, 함께 나눌 사람을 골라 기록해요.",
  },
  {
    title: "결과 공유하기",
    body: "누가 누구에게 얼마 보낼지 정리된 결과를 링크로 공유해요. 링크를 받은 사람은 결과만 볼 수 있어요.",
  },
] as const;

export default function StartSteps() {
  return (
    <section className={styles.steps} aria-labelledby="landing-steps-title">
      <h2 id="landing-steps-title" className={`${styles.stepsTitle} font-display`}>
        모임 하나 만들면, 이 순서로.
      </h2>
      <ol className={styles.stepList}>
        {STEPS.map((step, index) => (
          <li key={step.title} className={styles.step}>
            <span className={`${styles.stepNumber} font-data`}>{index + 1}</span>
            <div>
              <h3 className={`${styles.stepTitle} font-display`}>{step.title}</h3>
              <p className={styles.stepBody}>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className={styles.stepsFoot}>
        <Link href="/groups/new" className={styles.textLink}>
          지금 새 모임 만들기<span aria-hidden="true"> →</span>
        </Link>
      </p>
    </section>
  );
}
