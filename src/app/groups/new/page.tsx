"use client";

import { useState } from "react";
import { createGroup } from "@/app/actions";
import Avatar from "@/components/Avatar";
import AppBar from "@/components/AppBar";

export default function NewGroupPage() {
  const [names, setNames] = useState<string[]>(["", ""]);

  function updateName(index: number, value: string) {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  }

  function addRow() {
    setNames((prev) => [...prev, ""]);
  }

  return (
    <main className="flex flex-col gap-6">
      <AppBar title="새 모임 만들기" subtitle="가입 없이 링크로 바로 시작해요" backHref="/" />

      <p className="flex items-center gap-2 rounded-full bg-accent-soft px-4 py-2 font-body text-sm text-ink">
        <span aria-hidden>💱</span>
        모든 지출은 <strong>KRW(원) 기준</strong>으로 환산되어 정산됩니다.
      </p>

      <form action={createGroup} className="flex flex-col gap-7 rounded-token bg-surface p-6 shadow-card">
        <label className="flex flex-col gap-1.5">
          <span className="font-display text-lg font-semibold">모임 이름</span>
          <input
            name="name"
            required
            placeholder="예: 금요일 저녁 모임"
            className="rounded-input border border-border bg-bg px-4 py-3 font-display text-lg focus-visible:bg-surface"
          />
        </label>

        <div className="flex flex-col gap-3">
          <div>
            <span className="font-body text-caption font-bold uppercase tracking-wide text-muted">
              참여자 (2명 이상)
            </span>
            <p className="mt-1 font-body text-sm text-muted">
              이름만 있으면 시작할 수 있어요. 이메일은 같은 이름의 참여자가
              있을 때만 구분용으로 필요하고, 계좌는 정산 결과에서 받을 돈
              안내에 쓰여요. 참여자는 나중에도 추가/수정할 수 있어요.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {names.map((name, i) => (
              <div key={i} className="flex items-center gap-3 rounded-token bg-bg p-3">
                <Avatar index={i} letter={name} size={40} />
                <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                  <input
                    name="participantName"
                    placeholder="이름 (필수)"
                    value={name}
                    onChange={(e) => updateName(i, e.target.value)}
                    className="rounded-input border border-border bg-surface px-3 py-2 font-body sm:w-1/3"
                  />
                  <input
                    name="participantEmail"
                    type="email"
                    placeholder="이메일 (선택)"
                    className="rounded-input border border-border bg-surface px-3 py-2 font-body sm:w-1/3"
                  />
                  <input
                    name="participantAccount"
                    placeholder="계좌 (선택, 예: 국민 000-00)"
                    className="rounded-input border border-border bg-surface px-3 py-2 font-body sm:w-1/3"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="self-start rounded-full border border-dashed border-border px-4 py-2 font-body text-sm font-medium text-muted transition-colors duration-150 hover:border-accent hover:text-accent"
          >
            + 참여자 추가
          </button>
        </div>

        <button
          type="submit"
          className="rounded-full bg-accent px-6 py-3 font-display font-semibold text-accent-ink transition-colors duration-150 hover:bg-accent-hover"
        >
          모임 만들기
        </button>
      </form>
    </main>
  );
}
