"use client";

import { useRef } from "react";

/**
 * DesignSystem.html "7. 모달" 컴포넌트. 되돌리기 어려운 삭제 액션의
 * 확인 단계에 쓴다(기존 window.confirm 대체).
 */
export default function ConfirmDialog({
  triggerLabel,
  triggerClassName,
  title,
  body,
  confirmLabel,
  action,
}: {
  triggerLabel: string;
  triggerClassName: string;
  title: string;
  body: string;
  confirmLabel: string;
  action: () => Promise<void>;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => ref.current?.showModal()}>
        {triggerLabel}
      </button>
      <dialog
        ref={ref}
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
        className="m-auto rounded-token bg-surface p-0 shadow-none backdrop:bg-black/50"
      >
        <div className="flex w-[min(360px,86vw)] flex-col gap-4 p-5">
          <div>
            <p className="font-display text-lg font-bold">{title}</p>
            <p className="mt-1 font-body text-sm text-muted">{body}</p>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="rounded-full px-4 py-2 font-body text-sm font-medium text-muted hover:bg-bg"
            >
              취소
            </button>
            <form action={action}>
              <button
                type="submit"
                className="rounded-full bg-negative-soft px-4 py-2 font-body text-sm font-medium text-negative hover:brightness-95"
              >
                {confirmLabel}
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
