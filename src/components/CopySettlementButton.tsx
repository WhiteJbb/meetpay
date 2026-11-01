"use client";

import { useEffect, useRef, useState } from "react";
import { buildSettlementText, type SettlementTextTransfer } from "@/lib/settlementText";

type Status = "idle" | "copied" | "failed";

/**
 * "정산 내용 복사" — 모임 이름, 이체별 금액·받는 계좌, 열람 전용 결과
 * 링크를 단톡방용 글 한 덩어리로 클립보드에 쓴다. 클립보드가 없거나
 * 거부되면 성공 표시 없이 실패를 알리고, 같은 버튼으로 다시 시도한다.
 */
export default function CopySettlementButton({
  groupName,
  transfers,
  baseCurrency,
  resultPath,
}: {
  groupName: string;
  transfers: SettlementTextTransfer[];
  baseCurrency: string;
  /** 열람 전용 결과 경로(`/r/<viewToken>`). 클릭 시 현재 origin을 붙인다 */
  resultPath: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function handleClick() {
    if (timer.current) clearTimeout(timer.current);
    const text = buildSettlementText({
      groupName,
      transfers,
      baseCurrency,
      resultUrl: `${window.location.origin}${resultPath}`,
    });
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setStatus("copied");
      timer.current = setTimeout(() => setStatus("idle"), 1500);
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        className="rounded-full bg-accent px-4 py-2 font-body text-sm font-semibold text-accent-ink transition-colors duration-150 hover:bg-accent-hover"
      >
        {status === "copied" ? "복사되었어요!" : "정산 내용 복사"}
      </button>
      <span aria-live="polite" className="sr-only">
        {status === "copied" ? "정산 내용을 클립보드에 복사했어요" : ""}
      </span>
      <p className="font-body text-caption text-muted">
        모임 이름·이체 금액·받는 계좌·결과 링크를 한 번에 복사해요
      </p>
      {status === "failed" && (
        <p role="alert" className="rounded-input bg-negative-soft px-3 py-2 font-body text-caption text-negative">
          복사하지 못했어요. 브라우저의 클립보드 권한을 확인한 뒤 버튼을 다시 눌러 주세요.
        </p>
      )}
    </div>
  );
}
