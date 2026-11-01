// 정산 내용 복사(단톡방용 글) 회귀 (task-20261102-001). Node 내장 기능만 사용:
//   node --experimental-vm-modules --test tests/settlement-text.test.mjs
// 실제 src/lib/settlementText.ts와 실제 정산 알고리즘(src/lib/settlement.ts,
// src/lib/currency.ts)을 실행한다. 컴포넌트 배선은 소스 검사로 확인한다.
// 실제 클릭/클립보드/레이아웃 확인은 scripts/settlement-copy-qa.mjs(브라우저)가 맡는다.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";
import { SourceTextModule } from "node:vm";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const textSource = read("../src/lib/settlementText.ts");
const settlementSource = read("../src/lib/settlement.ts");
const currencySource = read("../src/lib/currency.ts");
const viewSource = read("../src/components/SettlementView.tsx");
const buttonSource = read("../src/components/CopySettlementButton.tsx");
const resultPageSource = read("../src/app/r/[token]/page.tsx");
const editPageSource = read("../src/app/groups/[id]/settlement/page.tsx");
const squash = (s) => s.replace(/\s+/g, " ");

async function load(source, modules = {}) {
  const mod = new SourceTextModule(stripTypeScriptTypes(source));
  await mod.link((specifier) => {
    assert.ok(Object.hasOwn(modules, specifier), `Unexpected import: ${specifier}`);
    return modules[specifier];
  });
  await mod.evaluate();
  return mod;
}

const textMod = await load(textSource);
const { buildSettlementText, formatTextAmount } = textMod.namespace;
const currencyMod = await load(currencySource);
const { computeSettlement } = (await load(settlementSource, { "@/lib/currency": currencyMod })).namespace;
const { formatCurrency } = currencyMod.namespace;

const URL_ = "http://127.0.0.1:3106/r/11111111-2222-3333-4444-555555555555";

test("첫 줄 모임 이름, 이체마다 한 줄, 마지막 줄 결과 URL", () => {
  const text = buildSettlementText({
    groupName: "제주 여행",
    transfers: [{ fromName: "민수", toName: "지영", amount: 12000, toAccount: null }],
    baseCurrency: "KRW",
    resultUrl: URL_,
  });
  assert.equal(text, `제주 여행\n민수 → 지영 12,000원\n${URL_}`);
});

test("여러 이체 + 계좌 등록/미등록 혼합: 계좌는 해당 줄 끝에 정확히, 없으면 생략", () => {
  const text = buildSettlementText({
    groupName: "동아리 MT",
    transfers: [
      { fromName: "민수", toName: "지영", amount: 12000, toAccount: "국민 123-456-789012" },
      { fromName: "철수", toName: "영희", amount: 8000, toAccount: null },
      { fromName: "수아", toName: "지영", amount: 1234567, toAccount: "카카오뱅크 3333-01-2345678" },
      { fromName: "하늘", toName: "영희", amount: 500, toAccount: "" },
    ],
    baseCurrency: "KRW",
    resultUrl: URL_,
  });
  assert.deepEqual(text.split("\n"), [
    "동아리 MT",
    "민수 → 지영 12,000원 (국민 123-456-789012)",
    "철수 → 영희 8,000원",
    "수아 → 지영 1,234,567원 (카카오뱅크 3333-01-2345678)",
    "하늘 → 영희 500원",
    URL_,
  ]);
});

test("이체 0건이어도 형식은 유지(버튼은 화면에서 숨김)", () => {
  assert.equal(
    buildSettlementText({ groupName: "모임", transfers: [], baseCurrency: "KRW", resultUrl: URL_ }),
    `모임\n${URL_}`
  );
});

test("금액은 화면 formatCurrency와 같은 반올림·구분, KRW 외 통화는 코드 표기", () => {
  for (const n of [0.4, 0.5, 999.5, 3333.3333, 12000, 1000000.49]) {
    assert.equal(formatTextAmount(n, "KRW"), formatCurrency(n, "KRW").replace(" KRW", "원"));
  }
  assert.equal(formatTextAmount(3333.3333, "KRW"), "3,333원");
  assert.equal(formatTextAmount(1500, "USD"), "1,500 USD");
});

test("실제 정산 결과와 화면 순서·대상·금액이 일치한다(다국통화·계좌 혼합)", () => {
  const participants = [
    { id: "p1", name: "민수", bankAccount: null },
    { id: "p2", name: "지영", bankAccount: "신한 110-123-456789" },
    { id: "p3", name: "철수", bankAccount: null },
    { id: "p4", name: "영희", bankAccount: "우리 1002-345-678901" },
  ];
  const expenses = [
    { amount: 60000, currency: "KRW", payerId: "p2", shareParticipantIds: ["p1", "p2", "p3", "p4"] },
    { amount: 4000, currency: "JPY", payerId: "p4", shareParticipantIds: ["p1", "p3", "p4"] },
    { amount: 10000, currency: "KRW", payerId: "p3", shareParticipantIds: ["p1", "p3"] },
  ];
  const result = computeSettlement(participants, expenses, "KRW");
  assert.ok(result.transfers.length >= 2, "여러 이체 사례");
  const accountById = new Map(participants.map((p) => [p.id, p.bankAccount]));
  // SettlementView의 매핑과 동일
  const transfers = result.transfers.map((t) => ({
    fromName: t.fromName,
    toName: t.toName,
    amount: t.amount,
    toAccount: accountById.get(t.toId) ?? null,
  }));
  const lines = buildSettlementText({ groupName: "도쿄", transfers, baseCurrency: "KRW", resultUrl: URL_ }).split("\n");
  assert.equal(lines.length, result.transfers.length + 2);
  assert.equal(lines[0], "도쿄");
  assert.equal(lines.at(-1), URL_);
  result.transfers.forEach((t, i) => {
    const screenAmount = formatCurrency(t.amount, "KRW").replace(" KRW", "원");
    const account = accountById.get(t.toId);
    assert.equal(lines[i + 1], `${t.fromName} → ${t.toName} ${screenAmount}${account ? ` (${account})` : ""}`);
  });
  assert.ok(lines.some((l) => l.endsWith("(신한 110-123-456789)") || l.endsWith("(우리 1002-345-678901)")));
});

test("SettlementView 배선: 이체가 있을 때만 버튼, 결과 링크는 /r/viewToken, 기존 버튼 유지", () => {
  const view = squash(viewSource);
  assert.match(view, /\{result\.transfers\.length > 0 && \( <CopySettlementButton/);
  assert.match(view, /resultPath=\{`\/r\/\$\{viewToken\}`\}/);
  assert.match(view, /<CopyLinkButton path=\{`\/r\/\$\{viewToken\}`\} label="결과 링크 복사 \(열람 전용\)" \/>/);
  assert.match(view, /groupName=\{group\.name\}/);
  assert.match(view, /transfers=\{result\.transfers\.map/);
  assert.doesNotMatch(view, /resultPath=\{`\/groups/);
  // 열람 전용 화면의 편집 진입점은 계속 readOnly일 때 숨김
  assert.match(view, /backHref=\{readOnly \? undefined/);
  assert.match(view, /\{!readOnly && \( <Link/);
  // 두 진입점 모두 같은 뷰를 쓰고 열람 전용은 readOnly
  assert.match(squash(resultPageSource), /<SettlementView group=\{group\} viewToken=\{group\.viewToken\} readOnly \/>/);
  assert.match(squash(editPageSource), /<SettlementView group=\{group\} viewToken=\{viewToken\} readOnly=\{false\} \/>/);
});

test("CopySettlementButton: 실패 시 성공 표시 없이 alert, 재시도 가능한 단일 button", () => {
  const src = squash(buttonSource);
  assert.match(src, /^"use client";/);
  assert.match(src, /<button type="button" onClick=\{handleClick\}/);
  assert.match(src, /\{status === "copied" \? "복사되었어요!" : "정산 내용 복사"\}/);
  assert.match(src, /catch \{ setStatus\("failed"\);/);
  assert.match(src, /if \(!navigator\.clipboard\?\.writeText\) throw/);
  assert.match(src, /role="alert"/);
  // 성공 상태는 writeText가 끝난 다음에만 설정
  assert.ok(src.indexOf("await navigator.clipboard.writeText(text)") < src.indexOf('setStatus("copied")'));
  assert.match(src, /resultUrl: `\$\{window\.location\.origin\}\$\{resultPath\}`/);
});
