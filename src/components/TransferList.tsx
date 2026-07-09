"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/currency";
import Avatar from "@/components/Avatar";

interface TransferItem {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

interface ParticipantInfo {
  id: string;
  name: string;
  bankAccount: string | null;
}

/**
 * 이체 목록 + "내 항목 강조". 로그인이 없어 시스템이 "나"를 모르므로,
 * 열람자가 자기 이름을 선택하면 관련 이체만 강조한다 (docs/IA.md §4).
 */
export default function TransferList({
  transfers,
  participants,
  baseCurrency,
}: {
  transfers: TransferItem[];
  participants: ParticipantInfo[];
  baseCurrency: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const accountById = new Map(participants.map((p) => [p.id, p.bankAccount]));

  async function copyAccount(key: string, account: string) {
    await navigator.clipboard.writeText(account);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  if (transfers.length === 0) {
    return <p className="font-body text-sm text-muted">이미 정산이 맞아 이체할 내역이 없어요.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-body text-sm text-muted">내 이름을 선택하면 내 항목만 강조돼요:</span>
        {participants.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedId((cur) => (cur === p.id ? null : p.id))}
            className={`flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 font-body text-sm transition-colors duration-150 ${
              selectedId === p.id
                ? "border-accent bg-accent text-accent-ink"
                : "border-border text-ink hover:bg-surface"
            }`}
          >
            <Avatar name={p.name} size={20} />
            {p.name}
          </button>
        ))}
        {selectedId && (
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="font-body text-sm text-muted underline underline-offset-2"
          >
            전체 보기
          </button>
        )}
      </div>

      <ul className="flex flex-col gap-2">
        {transfers.map((t, i) => {
          const mine = selectedId !== null && (t.fromId === selectedId || t.toId === selectedId);
          const dimmed = selectedId !== null && !mine;
          const account = accountById.get(t.toId) ?? null;
          const copyKey = `${i}-${t.toId}`;
          return (
            <li
              key={i}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`animate-fade-up flex flex-col gap-1 rounded-token p-3 font-body text-sm transition-opacity duration-150 ${
                mine ? "bg-surface shadow-card" : "border border-border"
              } ${dimmed ? "opacity-40" : ""}`}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2">
                  <Avatar name={t.fromName} size={26} />
                  <strong>{t.fromName}</strong>
                  <span aria-hidden className="text-muted">
                    →
                  </span>
                  <Avatar name={t.toName} size={26} />
                  <strong>{t.toName}</strong>
                </span>
                <span className="font-data font-semibold">{formatCurrency(t.amount, baseCurrency)}</span>
              </div>
              <div className="flex items-center gap-2 text-caption text-muted">
                {account ? (
                  <>
                    <span className="font-data">
                      받는 계좌({t.toName}): {account}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyAccount(copyKey, account)}
                      className="rounded border border-border px-2 py-0.5 font-body text-ink hover:bg-bg"
                    >
                      {copiedKey === copyKey ? "복사됨!" : "계좌 복사"}
                    </button>
                  </>
                ) : (
                  <span>받는 사람({t.toName}) 계좌 미등록 — 모임 홈의 참여자 수정에서 등록할 수 있어요</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
