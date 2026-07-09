import Link from "next/link";
import type { ReactNode } from "react";

/**
 * DesignSystem.html "8. 내비게이션" 컴포넌트. 하위 화면은 back
 * 버튼+제목+부제목, 최상위 화면은 제목만(back 없이) 쓴다.
 */
export default function AppBar({
  title,
  subtitle,
  backHref,
  action,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-token bg-surface p-3 shadow-card">
      {backHref && (
        <Link
          href={backHref}
          aria-label="뒤로 가기"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg text-base transition-colors duration-150 hover:bg-accent-soft"
        >
          ←
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-base font-bold tracking-tight">{title}</p>
        {subtitle && <p className="truncate font-body text-xs text-muted">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center">{action}</div>}
    </div>
  );
}
