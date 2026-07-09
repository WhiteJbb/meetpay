import type { ReactNode } from "react";

/** DesignSystem.html "15. 빈 상태" 컴포넌트. */
export default function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-token bg-surface px-6 py-10 text-center shadow-card">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-bg text-2xl" aria-hidden>
        {icon}
      </div>
      <div>
        <p className="font-display text-base font-bold">{title}</p>
        <p className="mt-1 font-body text-sm text-muted">{body}</p>
      </div>
      {action}
    </div>
  );
}
