// Landing regression (task-20261031-018). Node built-ins only, same mechanism as
// tests/group-card.test.mjs:
//   node --experimental-vm-modules --test tests/landing.test.mjs
// Executes the real example data module and the real settlement algorithm;
// everything else is source inspection. It is NOT a render, browser, lint or
// visual check — see docs/landing-design-review.md for the QA capture spec.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";
import { SourceTextModule } from "node:vm";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const pageSource = read("../src/app/page.tsx");
const cssSource = read("../src/app/landing.module.css");
const specimenSource = read("../src/components/landing/SettlementSpecimen.tsx");
const stepsSource = read("../src/components/landing/StartSteps.tsx");
const exampleSource = read("../src/components/landing/settlementExample.ts");
const layoutSource = read("../src/app/layout.tsx");
const globalsSource = read("../src/app/globals.css");
const landingTsx = [pageSource, specimenSource, stepsSource];
const squash = (s) => s.replace(/\s+/g, " ");

// Evaluated in the current realm so deepStrictEqual compares plain prototypes.
async function load(source, modules = {}) {
  const mod = new SourceTextModule(stripTypeScriptTypes(source));
  await mod.link((specifier) => {
    assert.ok(Object.hasOwn(modules, specifier), `Unexpected import: ${specifier}`);
    return modules[specifier];
  });
  await mod.evaluate();
  return mod;
}

const example = (await load(exampleSource)).namespace;
const currency = await load(read("../src/lib/currency.ts"));
const { computeSettlement } = (await load(read("../src/lib/settlement.ts"), {
  "@/lib/currency": currency,
})).namespace;

// ---------- Example accounting ----------

test("example data is exactly the approved three-person equal split", () => {
  assert.equal(example.EXAMPLE_GROUP_NAME, "금요일 저녁 모임");
  assert.deepEqual([...example.EXAMPLE_PARTICIPANTS], ["지현", "민재", "수아"]);
  assert.deepEqual(example.EXAMPLE_EXPENSES.map((e) => ({ ...e })), [
    { payer: "지현", item: "저녁 식사", amount: 100000 },
    { payer: "민재", item: "카페", amount: 40000 },
    { payer: "수아", item: "택시", amount: 10000 },
  ]);
  assert.deepEqual(example.EXAMPLE_TRANSFERS.map((t) => ({ ...t })), [
    { from: "민재", to: "지현", amount: 10000 },
    { from: "수아", to: "지현", amount: 40000 },
  ]);
});

test("derived total, per-person share and balances reconcile", () => {
  const { total, perPerson, balances } = example.EXAMPLE_SUMMARY;
  assert.equal(total, 150000);
  assert.equal(perPerson, 50000);
  assert.ok(Number.isInteger(perPerson));
  assert.equal(perPerson * example.EXAMPLE_PARTICIPANTS.length, total);
  assert.deepEqual(balances, [
    { name: "지현", paid: 100000, balance: 50000 },
    { name: "민재", paid: 40000, balance: -10000 },
    { name: "수아", paid: 10000, balance: -40000 },
  ]);
  assert.equal(balances.reduce((sum, b) => sum + b.balance, 0), 0);
});

test("the two listed transfers settle every balance to zero", () => {
  const remaining = new Map(example.EXAMPLE_SUMMARY.balances.map((b) => [b.name, b.balance]));
  assert.equal(example.EXAMPLE_TRANSFERS.length, 2);
  for (const t of example.EXAMPLE_TRANSFERS) {
    assert.ok(t.amount > 0);
    assert.ok(remaining.get(t.from) < 0, `${t.from} must owe money`);
    assert.ok(remaining.get(t.to) > 0, `${t.to} must be owed money`);
    remaining.set(t.from, remaining.get(t.from) + t.amount);
    remaining.set(t.to, remaining.get(t.to) - t.amount);
  }
  for (const [name, value] of remaining) assert.equal(value, 0, `${name} not settled`);
});

test("the real settlement algorithm produces the same balances and transfers", () => {
  const participants = example.EXAMPLE_PARTICIPANTS.map((name) => ({ id: name, name }));
  const result = computeSettlement(
    participants,
    example.EXAMPLE_EXPENSES.map((e) => ({
      amount: e.amount,
      currency: "KRW",
      payerId: e.payer,
      shareParticipantIds: [...example.EXAMPLE_PARTICIPANTS],
    }))
  );
  // The algorithm splits each expense in floating point (amount / 3); compare in won.
  assert.deepEqual(
    result.netBalances.map((b) => [b.name, Math.round(b.balance)]),
    example.EXAMPLE_SUMMARY.balances.map((b) => [b.name, b.balance])
  );
  // The landing fixes display order (민재 first); the algorithm sorts by amount.
  const key = (t) => `${t.from}->${t.to}:${Math.round(t.amount)}`;
  assert.deepEqual(
    result.transfers.map((t) => key({ from: t.fromName, to: t.toName, amount: t.amount })).sort(),
    example.EXAMPLE_TRANSFERS.map(key).sort()
  );
});

test("won formatting and Korean subject particles are deterministic", () => {
  assert.equal(example.formatWon(150000), "150,000원");
  assert.equal(example.formatWon(-40000), "40,000원");
  assert.equal(example.formatWon(10000), "10,000원");
  assert.equal(example.withSubjectParticle("지현"), "지현이");
  assert.equal(example.withSubjectParticle("민재"), "민재가");
  assert.equal(example.withSubjectParticle("수아"), "수아가");
});

// ---------- Copy, links and semantics (source inspection) ----------

test("hero copy, eyebrow and the real /groups/new CTA", () => {
  const page = squash(pageSource);
  assert.match(pageSource, /^import Link from "next\/link";/m);
  assert.match(page, /모임 지출 · 더치페이 정산/);
  assert.match(pageSource, /함께 쓴 돈,\s*<br \/>\s*누가 얼마 보낼지\s*<br \/>\s*한눈에\./);
  assert.match(page, /지출을 기록하면 보낼 금액을 계산해요\. 가입 없이 시작하고, 결과는 링크로 공유하세요\./);
  assert.match(page, /<Link href="\/groups\/new" className=\{`\$\{styles\.cta\}[^`]*`\}> 새 모임 만들기 <\/Link>/);
  assert.match(page, /가입 없이 바로 시작/);
});

test("specimen is labelled as an example and explains its assumptions", () => {
  const s = squash(specimenSource);
  assert.match(s, /정산 예시/);
  assert.match(s, /\{EXAMPLE_GROUP_NAME\}/);
  assert.match(s, /모두 같은 금액으로 나눈 예시 · 실제 송금은 직접 해요\./);
  assert.match(s, /받을 돈/);
  assert.match(s, /보낼 돈/);
  assert.match(s, /font-data/);
  // Rows are read-only: no buttons, links, handlers or fake controls.
  assert.doesNotMatch(specimenSource, /<button|<Link|<a\s|onClick|role="button"|tabIndex/);
});

test("three start steps are a semantic ordered list with a text link", () => {
  const s = squash(stepsSource);
  assert.match(s, /모임 하나 만들면, 이 순서로\./);
  assert.match(s, /<ol className=\{styles\.stepList\}>/);
  for (const title of ["모임 만들기", "지출 기록하기", "결과 공유하기"]) {
    assert.match(s, new RegExp(`title: "${title}"`));
  }
  assert.equal((stepsSource.match(/title: "/g) ?? []).length, 3);
  assert.match(s, /<Link href="\/groups\/new" className=\{styles\.textLink\}>/);
});

test("exactly one h1, h2 sections, server-only rendering", () => {
  const all = landingTsx.join("\n");
  assert.equal((all.match(/<h1\b/g) ?? []).length, 1);
  assert.equal((all.match(/<h2\b/g) ?? []).length, 2);
  for (const source of landingTsx) {
    assert.doesNotMatch(source, /["']use client["']/);
    assert.doesNotMatch(source, /useState|useEffect|\bDate\b|Math\.random/);
  }
});

// Copy guard for this landing only: no transfer-count promises tied to the
// example ("one transfer"), testimonials or metrics. This is a scope rule for
// the landing copy, not a judgment about the settlement algorithm.
test("no transfer-count promises, testimonials or metrics in landing copy", () => {
  const all = landingTsx.join("\n") + exampleSource;
  for (const banned of [/한 줄로/, /이체 한 번/, /송금 한 번/, /한 번에 끝/, /후기/, /만 명/, /\d+\s*%/, /★/]) {
    assert.doesNotMatch(all, banned);
  }
});

// ---------- Style constraints ----------

const ALLOWED_VARS = new Set([
  "bg", "surface", "ink", "muted", "accent", "accent-ink", "border",
  "t-fast", "ease", "gutter", "content",
]);
const SPACING = new Set([0, 4, 8, 12, 16, 24, 32, 48, 64, 80]);
const cssNoComments = cssSource.replace(/\/\*[\s\S]*?\*\//g, "");

test("colors come only from approved tokens", () => {
  assert.doesNotMatch(cssNoComments, /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(|color-mix\(/i);
  for (const [, name] of cssNoComments.matchAll(/var\(--([\w-]+)\)/g)) {
    assert.ok(ALLOWED_VARS.has(name), `unexpected token --${name}`);
  }
  // On the accent stage, text is accent-ink (never muted or alpha).
  const stageRules = ["eyebrow", "headline", "lead", "ctaNote"].map((c) =>
    cssNoComments.match(new RegExp(`\\.${c} \\{[^}]*\\}`))[0]
  );
  for (const rule of stageRules) assert.match(rule, /color: var\(--accent-ink\)/);
});

test("spacing values stay on the 4/8/12/16/24/32/48/64/80 scale", () => {
  const decl = /(?:^|\s)(margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|gap|row-gap|column-gap):\s*([^;]+);/g;
  for (const [, prop, value] of cssNoComments.matchAll(decl)) {
    if (/calc\(/.test(value)) continue; // breakout margin-inline
    for (const token of value.trim().split(/\s+/)) {
      if (token === "-40px") continue; // offsets layout.tsx py-10 (asserted below)
      const n = Number(token.replace(/px$/, ""));
      assert.ok(SPACING.has(n), `${prop}: ${value}`);
    }
  }
});

test("typography minimums and headline scale", () => {
  for (const [, px] of cssNoComments.matchAll(/font-size:\s*(\d+)px/g)) {
    assert.ok(Number(px) >= 13, `font-size ${px}px below 13px`);
  }
  assert.match(cssNoComments, /\.headline \{[^}]*font-size: 40px;[^}]*line-height: 1\.12;[^}]*font-weight: 800;[^}]*letter-spacing: -0\.035em;/);
  assert.match(cssNoComments, /@media \(max-width: 359\.98px\) \{\s*\.headline \{\s*font-size: 36px;/);
  assert.match(cssNoComments, /@media \(min-width: 1100px\) \{\s*\.headline \{\s*font-size: 64px;/);
  assert.match(cssNoComments, /font-variant-numeric: tabular-nums/);
});

test("layout: scrollbar-safe breakout, two columns at 960, no hidden overflow", () => {
  assert.match(cssNoComments, /--content: min\(1120px, calc\(100vw - 2 \* var\(--gutter\)\)\)/);
  assert.match(cssNoComments, /margin-inline: calc\(\(100% - var\(--content\)\) \/ 2\)/);
  assert.match(cssNoComments, /grid-template-columns: minmax\(0, 0\.95fr\) minmax\(0, 1\.05fr\)/);
  assert.doesNotMatch(cssNoComments, /overflow(?:-x)?:\s*(?:hidden|clip)/);
  assert.doesNotMatch(cssNoComments, /(?:^|[\s;{])width:\s*100vw/);
  // The -40px stage offset and 640 breakout depend on the unchanged layout wrapper.
  assert.match(layoutSource, /<div className="mx-auto w-full max-w-\[640px\] flex-1 px-4 py-10">\{children\}<\/div>/);
});

test("specimen card is a single surface: no shadow or border stacking", () => {
  const rule = cssNoComments.match(/\.specimen \{[^}]*\}/g).join("\n");
  assert.match(rule, /background: var\(--surface\)/);
  assert.match(rule, /border-radius: 14px/);
  assert.doesNotMatch(rule, /box-shadow|border:/);
});

test("motion: only 150ms feedback transitions, reduced motion removes them", () => {
  assert.doesNotMatch(cssNoComments, /@keyframes|animation/);
  for (const [, value] of cssNoComments.matchAll(/transition:\s*([^;]+);/g)) {
    if (value.trim() === "none") continue;
    assert.match(value, /var\(--t-fast\) var\(--ease\)/);
    assert.doesNotMatch(value, /\d+m?s/);
  }
  assert.match(globalsSource, /--t-fast: 150ms;/);
  const reduced = cssNoComments.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*)\}\s*$/)[1];
  assert.match(reduced, /transition: none;/);
  assert.match(reduced, /transform: none;/);
});

test("controls: pill CTA >= 48px with contrasting focus ring, 44px text link", () => {
  const cta = cssNoComments.match(/\.cta \{[^}]*\}/)[0];
  assert.match(cta, /min-height: 52px/);
  assert.match(cta, /border-radius: 999px/);
  assert.match(cta, /background: var\(--bg\)/);
  assert.match(cta, /color: var\(--ink\)/);
  assert.match(cssNoComments, /\.cta:focus-visible \{[^}]*outline: 3px solid var\(--accent-ink\)/);
  assert.match(cssNoComments, /\.cta:active \{/);
  assert.match(cssNoComments, /\.textLink \{[^}]*min-height: 44px/);
});

// ---------- Contrast from the actual token values ----------

const token = (name) => {
  const m = globalsSource.match(new RegExp(`--${name}: (#[0-9a-f]{6});`, "i"));
  assert.ok(m, `token --${name} missing`);
  return m[1];
};
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(token(a)), luminance(token(b))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test("approved token values are unchanged", () => {
  assert.deepEqual(
    ["bg", "surface", "ink", "muted", "accent", "accent-ink", "border"].map(token),
    ["#14170f", "#1e231a", "#edefe7", "#a6ac9c", "#23d67f", "#06301d", "#333a2c"]
  );
});

for (const [fg, bg, min] of [
  ["accent-ink", "accent", 4.5], // stage text
  ["ink", "bg", 4.5], // CTA label
  ["bg", "accent", 3], // CTA shape against stage
  ["accent-ink", "accent", 3], // CTA focus ring
  ["ink", "surface", 4.5],
  ["muted", "surface", 4.5],
  ["accent", "surface", 4.5], // label, 받을 돈, transfer amounts
  ["muted", "bg", 4.5], // step bodies
  ["accent", "bg", 4.5], // step numbers, global focus ring on text link
]) {
  test(`contrast ${fg} on ${bg} >= ${min}`, () => {
    assert.ok(contrast(fg, bg) >= min, `${contrast(fg, bg).toFixed(2)}`);
  });
}
