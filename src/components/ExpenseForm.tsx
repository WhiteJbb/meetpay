"use client";

import { useState } from "react";
import { KRW_EXCHANGE_RATE, SUPPORTED_CURRENCIES, type CurrencyCode } from "@/lib/currency";
import Avatar from "@/components/Avatar";
import ConfirmDialog from "@/components/ConfirmDialog";

interface Participant {
  id: string;
  name: string;
}

interface Props {
  action: (formData: FormData) => void | Promise<void>;
  participants: Participant[];
  defaultValues?: {
    title: string;
    amount: number;
    currency: string;
    payerId: string;
    date: string; // YYYY-MM-DD
    shareParticipantIds: string[];
  };
  submitLabel: string;
  /** 생성 모드에서만 "저장 후 계속 추가" 버튼을 노출한다 */
  allowContinue?: boolean;
  /** 수정 모드에서 삭제 버튼으로 쓸 서버 액션 */
  deleteAction?: () => Promise<void>;
}

const inputClass = "rounded-input border border-border bg-bg px-3 py-2 font-body";

function todayLocal(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export default function ExpenseForm({
  action,
  participants,
  defaultValues,
  submitLabel,
  allowContinue = false,
  deleteAction,
}: Props) {
  const selectedShareIds = new Set(defaultValues?.shareParticipantIds ?? participants.map((p) => p.id));
  const [amount, setAmount] = useState<string>(defaultValues ? String(defaultValues.amount) : "");
  const [currency, setCurrency] = useState<string>(defaultValues?.currency ?? "KRW");

  const rate = KRW_EXCHANGE_RATE[currency as CurrencyCode] ?? 1;
  const numericAmount = Number(amount);
  const showPreview = currency !== "KRW" && Number.isFinite(numericAmount) && numericAmount > 0;

  return (
    <div className="flex flex-col gap-3">
      <form action={action} className="flex flex-col gap-6 rounded-token bg-surface p-6 shadow-card">
      <label className="flex flex-col gap-1">
        <span className="font-body text-sm font-medium">항목명</span>
        <input
          name="title"
          required
          defaultValue={defaultValues?.title}
          placeholder="예: 저녁 식사"
          className={inputClass}
        />
      </label>

      <div className="flex flex-col gap-1">
        <div className="flex gap-2">
          <label className="flex flex-1 flex-col gap-1">
            <span className="font-body text-sm font-medium">금액</span>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`${inputClass} font-data`}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-body text-sm font-medium">통화</span>
            <select
              name="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={inputClass}
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
        {showPreview && (
          <p className="font-body text-sm">
            <span className="font-data text-accent">
              ≈ {Math.round(numericAmount * rate).toLocaleString("ko-KR")} KRW
            </span>
            <span className="ml-2 font-body text-caption text-muted">
              (고정 참고 환율 1 {currency} = {rate.toLocaleString("ko-KR")} KRW)
            </span>
          </p>
        )}
      </div>

      <label className="flex flex-col gap-1">
        <span className="font-body text-sm font-medium">지출일</span>
        <input
          name="date"
          type="date"
          defaultValue={defaultValues?.date ?? todayLocal()}
          className={`${inputClass} font-data`}
        />
        <span className="font-body text-caption text-muted">오늘 지출이면 그대로 두면 돼요.</span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-body text-sm font-medium">지출자 (결제한 사람)</span>
        <select name="payerId" required defaultValue={defaultValues?.payerId} className={inputClass}>
          <option value="" disabled>
            선택해주세요
          </option>
          {participants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-2">
        <span className="font-body text-sm font-medium">참여자 (분담 대상)</span>
        <div className="flex flex-wrap gap-2">
          {participants.map((p) => (
            <label
              key={p.id}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-bg py-1.5 pl-1.5 pr-3 font-body text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
            >
              <input
                type="checkbox"
                name="shareParticipantIds"
                value={p.id}
                defaultChecked={selectedShareIds.has(p.id)}
                className="sr-only"
              />
              <Avatar name={p.name} size={24} />
              {p.name}
            </label>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1">
        <span className="font-body text-sm font-medium">영수증 (선택)</span>
        <input name="receipt" type="file" accept="image/*" className="font-body text-sm" />
      </label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          className="rounded-full bg-accent px-6 py-3 font-display font-semibold text-accent-ink transition-colors duration-150 hover:bg-accent-hover"
        >
          {submitLabel}
        </button>
        {allowContinue && (
          <button
            type="submit"
            name="continueAdding"
            value="1"
            className="rounded-full border border-accent px-6 py-3 font-display font-semibold text-accent hover:bg-bg"
          >
            저장 후 계속 추가
          </button>
        )}
      </div>
      </form>
      {deleteAction && (
        <ConfirmDialog
          triggerLabel="삭제"
          triggerClassName="self-start rounded-full border border-negative px-6 py-3 font-display font-semibold text-negative hover:bg-bg"
          title="이 지출을 삭제할까요?"
          body="되돌릴 수 없어요."
          confirmLabel="삭제"
          action={deleteAction}
        />
      )}
    </div>
  );
}
