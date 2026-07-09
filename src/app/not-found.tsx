import Link from "next/link";

/**
 * DesignSystem.html "17. 접근 권한 없음" 컴포넌트. 모임/결과 링크가
 * 만료(90일 보관 정책)되었거나 잘못된 주소일 때 뜨는 화면
 * (notFound() 호출 시 전역으로 이 화면이 렌더된다).
 */
export default function NotFound() {
  return (
    <main className="flex flex-col items-center gap-4 rounded-token bg-surface px-6 py-14 text-center shadow-card">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-negative-soft text-2xl">
        🔒
      </div>
      <div>
        <p className="font-display text-lg font-bold">링크가 만료되었거나 잘못된 주소예요</p>
        <p className="mx-auto mt-2 max-w-[38ch] font-body text-sm text-muted">
          모임 데이터는 마지막 활동으로부터 90일이 지나면 자동 삭제돼요.
          모임 주최자에게 최신 링크를 요청해 주세요.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-full bg-accent px-6 py-3 font-display font-semibold text-accent-ink transition-colors duration-150 hover:bg-accent-hover"
      >
        홈으로 돌아가기
      </Link>
    </main>
  );
}
