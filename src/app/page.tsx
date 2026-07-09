import Link from "next/link";
import Avatar from "@/components/Avatar";

export default function HomePage() {
  return (
    <main className="flex flex-col gap-10">
      {/* 히어로 컬러 블록 — 상단 여백을 상쇄해 뷰포트 맨 위까지 채우고,
          헤드라인을 첫 화면의 유일한 주인공으로 둔다. 브랜드 워드마크는
          두지 않는다(사용자 지시). */}
      <div
        style={{
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
          marginTop: "-2.5rem",
        }}
        className="bg-accent px-4 pb-14 pt-14 sm:pb-20 sm:pt-20"
      >
        <div className="mx-auto flex max-w-[640px] flex-col gap-6">
          <h1
            className="text-balance font-display text-5xl font-extrabold leading-[1.1] tracking-tight text-accent-ink sm:text-6xl"
            style={{ wordBreak: "keep-all" }}
          >
            더치페이,
            <br />
            계산기 대신
            <br />
            링크 하나로 끝내요
          </h1>
          <p className="max-w-[46ch] text-pretty font-body text-lg leading-relaxed text-accent-ink/75">
            지출을 적기만 하면 최소 이체 횟수로 정산돼요. 로그인 없이 링크만
            공유하면 모임원 모두 결과를 바로 확인할 수 있어요.
          </p>
          <Link
            href="/groups/new"
            className="w-fit rounded-full bg-ink px-7 py-3.5 text-center font-display font-semibold text-bg transition-opacity duration-150 hover:opacity-90"
          >
            새 모임 만들기
          </Link>
        </div>
      </div>

      {/* 실제 컴포넌트 스타일로 만든 정산 결과 미리보기 — 가짜 스크린샷이 아니라
          이 서비스가 실제로 만들어내는 화면 그대로다. */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 font-body text-caption font-bold uppercase tracking-wide text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          모임 예시 — 실제 화면 그대로예요
        </div>

        <div className="flex flex-col gap-3 overflow-hidden rounded-token bg-surface shadow-card">
          <div className="h-1.5 bg-accent" aria-hidden />
          <div className="flex flex-col gap-3 px-6 pb-6 pt-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-display text-base font-semibold">금요일 저녁 모임</p>
              <p className="font-data text-caption text-muted">지출 3건 · 282,000원</p>
            </div>

            <ul className="flex flex-col divide-y divide-border">
              <li className="flex items-center justify-between py-2 text-sm">
                <span className="flex items-center gap-2">
                  <Avatar name="지현" size={26} />
                  지현
                </span>
                <span className="font-data text-positive">+6,000원</span>
              </li>
              <li className="flex items-center justify-between py-2 text-sm">
                <span className="flex items-center gap-2">
                  <Avatar name="민재" size={26} />
                  민재
                </span>
                <span className="font-data text-positive">+24,000원</span>
              </li>
              <li className="flex items-center justify-between py-2 text-sm">
                <span className="flex items-center gap-2">
                  <Avatar name="수아" size={26} />
                  수아
                </span>
                <span className="font-data text-negative">-30,000원</span>
              </li>
            </ul>

            <div className="border-t border-border" />

            <div className="flex items-center justify-between rounded-token bg-bg px-3 py-2 text-sm">
              <span className="flex items-center gap-2">
                <Avatar name="수아" size={24} />
                <strong>수아</strong>
                <span aria-hidden className="text-muted">
                  →
                </span>
                <Avatar name="민재" size={24} />
                <strong>민재</strong>
              </span>
              <span className="font-data font-semibold">24,000원</span>
            </div>
            <p className="font-body text-caption text-muted">
              이체는 이 한 줄로 끝. 계좌도 함께 보여줘요.
            </p>
          </div>
        </div>
      </div>

      <p className="-mt-6 text-center font-body text-caption text-muted">
        가입 없이 바로 시작 · 참여자는 이름만 있으면 충분해요
      </p>
    </main>
  );
}
