#!/usr/bin/env node
// 정산 내용 복사 브라우저 QA (task-20261102-001).
//
// 반드시 격리된 QA DB로 띄운 서버에만 실행한다. 이 스크립트는 가상의 테스트
// 모임/참여자/계좌(실존하지 않는 "테스트은행" 번호)를 UI로 생성한다.
//   mkdir -p /tmp/meetpay-qa
//   DATABASE_URL=file:/tmp/meetpay-qa/qa.db npx prisma migrate deploy
//   DATABASE_URL=file:/tmp/meetpay-qa/qa.db npm run dev -- --webpack -H 127.0.0.1 -p 3106
//   BASE_URL=http://127.0.0.1:3106 OUT_DIR=/work/out/captures node scripts/settlement-copy-qa.mjs
//
// 확인 항목: 생성→지출→정산→결과 공유 흐름, 두 화면(편집 모드 정산 결과,
// /r/[token] 열람 전용)에서 실제 클릭으로 쓴 클립보드 내용, 클립보드 거부/
// 사용 불가 시 실패 안내와 재시도, 키보드 조작, 이체 0건 시 버튼 숨김,
// 가로 넘침 없음, 1440/390 × light/dark 캡처.
// 종료 코드: 0 전체 통과, 1 실패 있음, 2 루프백이 아닌 주소 거부.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3106";
if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(BASE_URL).hostname)) {
  console.error(`Refusing non-loopback BASE_URL ${BASE_URL}`);
  process.exit(2);
}
const OUT_DIR = process.env.OUT_DIR ?? "/tmp/meetpay-qa/captures";
mkdirSync(OUT_DIR, { recursive: true });

const GROUP = "QA 테스트 모임";
const EMPTY_GROUP = "QA 빈 정산 모임";
const ACCOUNT_JY = "테스트은행 000-0000-0001";
const COPY = { name: "정산 내용 복사", exact: true };
const checks = [];
const failures = [];
function check(name, ok, detail) {
  checks.push({ name, ok: Boolean(ok), ...(detail === undefined ? {} : { detail }) });
  if (!ok) failures.push(name);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${!ok && detail !== undefined ? ` — ${JSON.stringify(detail)}` : ""}`);
}

const browser = await chromium.launch();
const origin = new URL(BASE_URL).origin;
async function newPage({ width = 1440, height = 900, scheme = "dark", clipboard = true } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, colorScheme: scheme });
  if (clipboard) await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin });
  return { context, page: await context.newPage() };
}
const visible = (loc) => loc.first().waitFor({ state: "visible", timeout: 5000 }).then(() => true, () => false);
const gone = (loc) => loc.waitFor({ state: "detached", timeout: 5000 }).then(() => true, () => false);
const readClipboard = (page) => page.evaluate(() => navigator.clipboard.readText());
const setClipboard = (page, v) => page.evaluate((x) => navigator.clipboard.writeText(x), v);

async function createGroup(page, name, people) {
  await page.goto(`${BASE_URL}/groups/new`);
  await page.locator('input[name="name"]').fill(name);
  for (let i = 2; i < people.length; i++) await page.getByRole("button", { name: "+ 참여자 추가" }).click();
  for (const [i, p] of people.entries()) {
    await page.locator('input[name="participantName"]').nth(i).fill(p.name);
    if (p.account) await page.locator('input[name="participantAccount"]').nth(i).fill(p.account);
  }
  await page.getByRole("button", { name: "모임 만들기" }).click();
  await page.waitForURL((u) => /^\/groups\/(?!new$)[^/]+$/.test(u.pathname));
  return new URL(page.url()).pathname.split("/")[2];
}

async function addExpense(page, groupId, { title, amount, currency, payer, shares }) {
  await page.goto(`${BASE_URL}/groups/${groupId}/expenses/new`);
  await page.locator('input[name="title"]').fill(title);
  await page.locator('input[name="amount"]').fill(String(amount));
  await page.locator('select[name="currency"]').selectOption(currency);
  await page.locator('select[name="payerId"]').selectOption({ label: payer });
  const labels = page.locator("label").filter({ has: page.locator('input[name="shareParticipantIds"]') });
  for (let i = 0; i < (await labels.count()); i++) {
    const label = labels.nth(i);
    const want = shares.includes((await label.innerText()).trim().split("\n").pop().trim());
    if ((await label.locator("input").isChecked()) !== want) await label.click();
  }
  await page.getByRole("button", { name: "지출 등록", exact: true }).click();
  await page.waitForURL(new RegExp(`/groups/${groupId}$`));
}

// 화면의 이체 목록에서 기대 텍스트를 만든다(구현 함수에 의존하지 않음).
async function expectedFromScreen(page, groupName, resultUrl) {
  const rows = await page.locator("ul li.animate-fade-up").evaluateAll((lis) =>
    lis.map((li) => {
      const [from, to] = [...li.querySelectorAll("strong")].map((s) => s.textContent.trim());
      const amount = li.querySelector(".font-data.font-semibold").textContent.trim();
      const acct = li.querySelector("span.font-data:not(.font-semibold)")?.textContent.trim() ?? null;
      return { from, to, amount, acct };
    })
  );
  const lines = rows.map((r) => {
    const won = r.amount.replace(/ KRW$/, "원");
    const account = r.acct ? r.acct.replace(/^받는 계좌\([^)]*\): /, "") : null;
    return `${r.from} → ${r.to} ${won}${account ? ` (${account})` : ""}`;
  });
  return { rows, text: [groupName, ...lines, resultUrl].join("\n") };
}

async function noHorizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
}

async function shot(page, file, opts = {}) {
  await page.screenshot({ path: path.join(OUT_DIR, file), fullPage: true, ...opts });
  console.log(`  captured ${file}`);
}

try {
  // ---- 1. 생성 → 지출 → 정산 → 결과 공유 (격리 DB, 가상 데이터) ----
  const { context: setupCtx, page } = await newPage();
  const groupId = await createGroup(page, GROUP, [
    { name: "민수" },
    { name: "지영", account: ACCOUNT_JY },
    { name: "철수" },
    { name: "영희" },
  ]);
  check("모임 생성 후 모임 홈으로 이동", Boolean(groupId));
  await addExpense(page, groupId, { title: "숙소", amount: 60000, currency: "KRW", payer: "지영", shares: ["민수", "지영", "철수", "영희"] });
  await addExpense(page, groupId, { title: "편의점", amount: 4000, currency: "JPY", payer: "영희", shares: ["민수", "철수", "영희"] });
  await addExpense(page, groupId, { title: "택시", amount: 10000, currency: "KRW", payer: "철수", shares: ["민수", "철수"] });
  check("지출 3건이 모임 홈에 표시", (await page.getByRole("link", { name: "수정", exact: true }).count()) === 3);

  await page.getByRole("link", { name: "정산 결과 보기" }).click();
  await page.waitForURL(new RegExp(`/groups/${groupId}/settlement$`));
  const settlementUrl = page.url();

  // 결과 링크(기존 버튼)로 열람 전용 URL을 얻는다.
  await page.getByRole("button", { name: "결과 링크 복사 (열람 전용)" }).click();
  const resultUrl = await readClipboard(page);
  check("기존 결과 링크 복사: /r/<token> 절대 URL", /^http:\/\/127\.0\.0\.1:3106\/r\/[0-9a-f-]{36}$/.test(resultUrl), resultUrl);

  const editExpected = await expectedFromScreen(page, GROUP, resultUrl);
  const hardExpected = [
    GROUP,
    `민수 → 지영 32,000원 (${ACCOUNT_JY})`,
    `철수 → 지영 13,000원 (${ACCOUNT_JY})`,
    "철수 → 영희 9,000원",
    resultUrl,
  ].join("\n");
  check("화면 이체 3건(계좌 등록 2/미등록 1)", editExpected.rows.length === 3, editExpected.rows);
  check("화면 기반 기대 텍스트 = 수기 기대 텍스트", editExpected.text === hardExpected, editExpected.text);
  await setupCtx.close();

  // ---- 2. 두 화면 × 2폭 × 2테마: 표시, 실제 클릭 복사, 캡처 ----
  const screens = [
    { key: "settlement", url: settlementUrl, readOnly: false },
    { key: "result", url: resultUrl, readOnly: true },
  ];
  for (const s of screens) {
    for (const width of [1440, 390]) {
      for (const scheme of ["light", "dark"]) {
        const tag = `${s.key}-${width}-${scheme}`;
        const { context, page: p } = await newPage({ width, height: width === 390 ? 844 : 900, scheme });
        await p.goto(s.url);
        const btn = p.getByRole("button", COPY);
        check(`${tag}: '정산 내용 복사' 버튼 표시`, await btn.isVisible());
        check(`${tag}: 기존 결과 링크 복사 버튼 유지`, await p.getByRole("button", { name: "결과 링크 복사 (열람 전용)" }).isVisible());
        check(`${tag}: 기존 계좌 복사 버튼 유지`, (await p.getByRole("button", { name: "계좌 복사" }).count()) === 2);
        check(`${tag}: 가로 넘침 없음`, await noHorizontalOverflow(p));
        if (s.readOnly) {
          check(`${tag}: 열람 전용 — 편집 진입 링크 없음`,
            (await p.getByRole("link", { name: /모임 홈으로 돌아가기/ }).count()) === 0 &&
            (await p.locator(`a[href^="/groups/"]`).count()) === 0);
          check(`${tag}: 열람 전용 안내 유지`, await p.getByText("열람 전용 페이지예요").isVisible());
        }
        await shot(p, `${tag}.png`);
        await setClipboard(p, "sentinel");
        await btn.click();
        const copied = await readClipboard(p);
        check(`${tag}: 클릭 → 클립보드 = 기대 텍스트`, copied === hardExpected, copied);
        const screenText = (await expectedFromScreen(p, GROUP, resultUrl)).text;
        check(`${tag}: 클립보드 = 이 화면의 이체 목록`, copied === screenText);
        check(`${tag}: 성공 피드백 표시`, await visible(p.getByRole("button", { name: "복사되었어요!" })));
        check(`${tag}: 마지막 줄이 /r/ 열람 URL(편집 링크 아님)`,
          copied.split("\n").at(-1) === resultUrl && !copied.includes("/groups/"));
        if (width === 390 || scheme === "dark") {
          await shot(p, `${s.key}-copied-${width}-${scheme}.png`, { fullPage: false });
        }
        await p.waitForTimeout(1700);
        check(`${tag}: 1.5초 후 원래 라벨 복귀`, await p.getByRole("button", COPY).isVisible());
        await context.close();
      }
    }
  }

  // ---- 3. 클립보드 거부 / 사용 불가 → 실패 안내, 성공 표시 없음, 재시도 ----
  for (const mode of ["denied", "unavailable"]) {
    for (const width of [1440, 390]) {
      for (const scheme of ["light", "dark"]) {
        const tag = `failure-${mode}-${width}-${scheme}`;
        const { context, page: p } = await newPage({ width, height: width === 390 ? 844 : 900, scheme });
        await p.addInitScript((m) => {
          const real = navigator.clipboard;
          if (m === "denied") {
            // 권한 거부: writeText가 NotAllowedError로 reject
            real.writeText = () => Promise.reject(new DOMException("Write permission denied.", "NotAllowedError"));
            window.__qaRestoreClipboard = () => { delete real.writeText; };
          } else {
            // 사용 불가(비보안 컨텍스트 등): navigator.clipboard 자체가 없음
            Object.defineProperty(Navigator.prototype, "clipboard", { configurable: true, get: () => undefined });
            window.__qaRestoreClipboard = () => {
              Object.defineProperty(Navigator.prototype, "clipboard", { configurable: true, get: () => real });
            };
          }
        }, mode);
        await p.goto(resultUrl);
        await p.getByRole("button", COPY).click();
        const alert = p.getByRole("alert").filter({ hasText: "복사하지 못했어요" });
        check(`${tag}: 실패 안내(role=alert) 표시`, await visible(alert));
        check(`${tag}: 성공 표시 없음`, (await p.getByRole("button", { name: "복사되었어요!" }).count()) === 0);
        check(`${tag}: 버튼 유지(재시도 가능)`, await p.getByRole("button", COPY).isEnabled());
        check(`${tag}: 가로 넘침 없음`, await noHorizontalOverflow(p));
        await shot(p, `result-failed-${mode}-${width}-${scheme}.png`, { fullPage: false });
        // 권한/클립보드 복구 후 같은 버튼으로 재시도
        await p.evaluate(() => window.__qaRestoreClipboard());
        await setClipboard(p, "sentinel");
        await p.getByRole("button", COPY).click();
        check(`${tag}: 재시도 성공 피드백`, await visible(p.getByRole("button", { name: "복사되었어요!" })));
        check(`${tag}: 재시도 후 실패 안내 사라짐`, await gone(alert));
        check(`${tag}: 재시도 후 클립보드 = 기대 텍스트`, (await readClipboard(p)) === hardExpected);
        await context.close();
      }
    }
  }

  // ---- 4. 키보드 조작 (Tab 포커스 → Enter / Space) ----
  for (const s of screens) {
    for (const width of [1440, 390]) {
      const tag = `keyboard-${s.key}-${width}`;
      const { context, page: p } = await newPage({ width, height: width === 390 ? 844 : 900, scheme: "dark" });
      await p.goto(s.url);
      let focused = false;
      for (let i = 0; i < 15 && !focused; i++) {
        await p.keyboard.press("Tab");
        focused = await p.evaluate(() => document.activeElement?.textContent?.trim() === "정산 내용 복사");
      }
      check(`${tag}: Tab으로 포커스 도달`, focused);
      const ring = await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
      check(`${tag}: focus-visible 외곽선`, ring === "solid", ring);
      await shot(p, `${s.key}-keyboard-focus-${width}-dark.png`, { fullPage: false });
      await setClipboard(p, "sentinel");
      await p.keyboard.press("Enter");
      check(`${tag}: Enter로 복사`, (await readClipboard(p)) === hardExpected);
      await p.waitForTimeout(1700);
      await setClipboard(p, "sentinel");
      await p.keyboard.press(" ");
      check(`${tag}: Space로 복사`, (await readClipboard(p)) === hardExpected);
      await context.close();
    }
  }

  // ---- 5. 이체 0건: 버튼 숨김, 빈 정산 안내·결과 링크 복사 유지 ----
  const { context: emptyCtx, page: ep } = await newPage();
  const emptyId = await createGroup(ep, EMPTY_GROUP, [{ name: "가람" }, { name: "나래" }]);
  await ep.goto(`${BASE_URL}/groups/${emptyId}/settlement`);
  await ep.getByRole("button", { name: "결과 링크 복사 (열람 전용)" }).click();
  const emptyResultUrl = await readClipboard(ep);
  await emptyCtx.close();
  for (const [key, url] of [["settlement-empty", `${BASE_URL}/groups/${emptyId}/settlement`], ["result-empty", emptyResultUrl]]) {
    for (const width of [1440, 390]) {
      for (const scheme of ["light", "dark"]) {
        const tag = `${key}-${width}-${scheme}`;
        const { context, page: p } = await newPage({ width, height: width === 390 ? 844 : 900, scheme });
        await p.goto(url);
        check(`${tag}: 정산 내용 복사 버튼 숨김`, (await p.getByRole("button", COPY).count()) === 0);
        check(`${tag}: 빈 정산 안내 유지`, await p.getByText("이미 정산이 맞아 이체할 내역이 없어요.").isVisible());
        check(`${tag}: 결과 링크 복사 유지`, await p.getByRole("button", { name: "결과 링크 복사 (열람 전용)" }).isVisible());
        check(`${tag}: 가로 넘침 없음`, await noHorizontalOverflow(p));
        await shot(p, `${tag}.png`);
        await context.close();
      }
    }
  }
} catch (err) {
  failures.push(`fatal: ${err?.stack ?? err}`);
  console.error(err);
} finally {
  await browser.close();
  writeFileSync(path.join(OUT_DIR, "settlement-copy-qa.json"), JSON.stringify({ baseUrl: BASE_URL, checks, failures }, null, 2));
  console.log(`\n${checks.length - failures.filter((f) => !f.startsWith("fatal")).length}/${checks.length} checks passed; failures: ${failures.length}`);
  process.exit(failures.length ? 1 : 0);
}
