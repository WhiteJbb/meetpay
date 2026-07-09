"use client";

import { useState, type ReactNode } from "react";

/**
 * DesignSystem.html "9. 탭" 컴포넌트. 화면 전환용 밑줄 탭 — 옵션
 * 선택용 세그먼트 컨트롤과 구분해서 쓴다.
 */
export default function Tabs({
  tabs,
}: {
  tabs: { label: string; content: ReactNode }[];
}) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-5 border-b-2 border-border">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setActive(i)}
            className={`relative top-[2px] border-b-[3px] px-1 pb-2 font-body text-sm font-semibold transition-colors duration-150 ${
              active === i ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs[active].content}
    </div>
  );
}
