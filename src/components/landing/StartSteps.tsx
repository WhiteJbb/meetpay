import styles from "@/app/landing.module.css";

/**
 * CTA 바로 아래의 짧은 시작 순서(시안 B). 문구는 실제 기능 범위만 설명한다:
 * 모임 생성(이름 + 참여자 이름) → 지출 기록(결제자·금액·나눌 사람)
 * → 열람 전용 결과 링크(/r/[token]) 공유.
 */
const STEPS = [
  { title: "모임 만들기", body: "모임 이름과 참여자 이름만 입력해요." },
  { title: "지출 기록하기", body: "결제한 사람과 금액, 함께 나눌 사람을 골라요." },
  { title: "결과 공유하기", body: "링크를 받은 사람은 결과만 볼 수 있어요." },
] as const;

export default function StartSteps() {
  return (
    <ol className={styles.flow} aria-label="시작하는 순서">
      {STEPS.map((step, index) => (
        <li key={step.title} className={styles.flowItem}>
          <span className={`${styles.flowNumber} font-data`}>{index + 1}</span>
          <span>
            <strong className={styles.flowTitle}>{step.title}</strong>
            {step.body}
          </span>
        </li>
      ))}
    </ol>
  );
}
