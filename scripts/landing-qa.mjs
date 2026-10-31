#!/usr/bin/env node
// Landing QA capture script (task-20261031-018) — for the QA container ONLY.
//
// STATUS: UNRUN. Written from source and only syntax-parsed (`node --check`) in
// the developer sandbox; the contract forbids localhost/browser runs there.
// Nothing below has ever executed. QA owns the first run and should report
// script defects separately from page defects.
//
// Usage (against a server built from the exact commit under review):
//   BASE_URL=http://127.0.0.1:3000 OUT_DIR=/path/to/artifacts node scripts/landing-qa.mjs
//
// Environment:
//   BASE_URL         default http://127.0.0.1:3000; non-loopback hosts are refused
//                    (exit 2) unless QA_ALLOW_REMOTE=1 (isolated QA host only,
//                    never production).
//   COMMIT_SHA       default `git rev-parse HEAD`; used in file names + manifest.
//   OUT_DIR          default `${TMPDIR ?? os.tmpdir()}/meetpay-landing-qa-<sha7>`,
//                    outside the worktree so artifacts are never committed.
//   QA_ALLOW_REMOTE  see BASE_URL.
//
// Exit codes: 0 all scripted checks passed; 1 any failed check or fatal error
// (fatal errors are recorded in manifest.failures as "fatal: ..."); 2 refused host.
//
// Read-only: visits "/" and navigates to "/groups/new" without submitting the
// form, so it creates no data. The create → expenses → settlement → shared
// result regression stays a separate manual QA step on an isolated QA DB
// (docs/landing-design-review.md §8).
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const host = new URL(BASE_URL).hostname;
if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(host) && process.env.QA_ALLOW_REMOTE !== "1") {
  console.error(`Refusing non-loopback BASE_URL ${BASE_URL} (set QA_ALLOW_REMOTE=1 for an isolated QA host).`);
  process.exit(2);
}
const COMMIT_SHA = process.env.COMMIT_SHA ?? execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const SHORT = COMMIT_SHA.slice(0, 7);
const OUT_DIR = process.env.OUT_DIR ?? path.join(process.env.TMPDIR ?? tmpdir(), `meetpay-landing-qa-${SHORT}`);
const THEME = "dark"; // the app ships a single dark theme
mkdirSync(OUT_DIR, { recursive: true });

// width → first-viewport height
const VIEWPORTS = [
  [1920, 1080],
  [1440, 900],
  [1100, 900],
  [390, 844],
  [320, 640],
];
const HOME = new URL("/", BASE_URL).href;
const CTA_NAME = { name: "새 모임 만들기", exact: true };
// Approximate frame offsets (ms after hover) for CTA feedback strips. Screenshots
// take time, so the actual elapsed time per frame is measured and recorded.
const STRIP_OFFSETS = [80, 180];

const manifest = {
  task: "task-20261031-018",
  commit: COMMIT_SHA,
  baseUrl: BASE_URL,
  outDir: OUT_DIR,
  theme: THEME,
  capturedAt: new Date().toISOString(),
  browserVersion: null,
  artifacts: [],
  checks: [],
  failures: [],
};

const slug = (p) => (p === "/" ? "root" : p.replace(/^\//, "").replace(/[^\w-]+/g, "-"));
const artifactName = (width, route, kind) => `${SHORT}_${width}w_${slug(route)}_${THEME}_${kind}.png`;

async function capture(page, width, route, kind, fullPage, { clip, meta } = {}) {
  const file = artifactName(width, route, kind);
  await page.screenshot({ path: path.join(OUT_DIR, file), fullPage, clip, animations: "allow" });
  manifest.artifacts.push({ file, commit: COMMIT_SHA, width, route, theme: THEME, kind, fullPage, ...(clip ? { clip } : {}), ...meta });
}

function check(name, ok, detail) {
  manifest.checks.push({ name, ok, detail });
  if (!ok) manifest.failures.push(name);
}

function watchErrors(page, label) {
  page.on("console", (msg) => {
    if (msg.type() === "error") check(`${label}: console error`, false, msg.text());
  });
  page.on("pageerror", (err) => check(`${label}: page error`, false, String(err)));
}

// Runs one section; an exception is recorded as a failed "fatal" check (never
// swallowed) and later sections still run. The context is always closed.
async function section(name, browser, contextOptions, fn) {
  let context;
  try {
    context = await browser.newContext(contextOptions);
    const page = await context.newPage();
    watchErrors(page, name);
    await fn(page);
  } catch (err) {
    check(`fatal: ${name}`, false, err?.stack ?? String(err));
  } finally {
    await context?.close().catch((err) => check(`fatal: ${name} (context close)`, false, String(err)));
  }
}

async function openHome(page) {
  await page.goto(HOME, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
}

// Real CTA feedback frames: before hover, immediately after, ~+80ms, ~+180ms.
async function ctaMotionStrip(page, width, label, expectMotion) {
  const cta = page.getByRole("link", CTA_NAME);
  const box = await cta.boundingBox();
  if (!box) throw new Error("hero CTA has no bounding box");
  const pad = 24;
  const clip = {
    x: Math.max(0, Math.floor(box.x - pad)),
    y: Math.max(0, Math.floor(box.y - pad)),
    width: Math.ceil(box.width + pad * 2),
    height: Math.ceil(box.height + pad * 2),
  };
  const frames = [];
  const shoot = async (index, tag, t0) => {
    const transform = await cta.evaluate((el) => getComputedStyle(el).transform);
    const elapsedMs = t0 === null ? null : Math.round(performance.now() - t0);
    const kind = `cta-motion-${label}-${String(index).padStart(2, "0")}-${tag}`;
    await capture(page, width, "/", kind, false, { clip, meta: { strip: label, elapsedMs, transform } });
    frames.push({ tag, elapsedMs, transform });
  };

  await page.mouse.move(0, 0);
  await page.waitForTimeout(300); // settle any prior hover state
  await shoot(0, "before", null);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const t0 = performance.now();
  await shoot(1, "t0", t0);
  for (const [i, offset] of STRIP_OFFSETS.entries()) {
    const wait = t0 + offset - performance.now();
    if (wait > 0) await page.waitForTimeout(wait);
    await shoot(i + 2, `t${offset}`, t0);
  }

  check(`${width}w cta-motion-${label}: no transform before hover`, frames[0].transform === "none", frames);
  if (expectMotion) {
    const last = frames.at(-1);
    check(
      `${width}w cta-motion-${label}: settles at translateY(-1px)`,
      /^matrix\(1, 0, 0, 1, 0, -1\)$/.test(last.transform),
      frames
    );
  } else {
    check(`${width}w cta-motion-${label}: transform none in every frame`, frames.every((f) => f.transform === "none"), frames);
  }
}

let browser;
try {
  browser = await chromium.launch();
  manifest.browserVersion = browser.version();

  // 1. Full page + first viewport at every width, with overflow and structure checks.
  for (const [width, height] of VIEWPORTS) {
    await section(`${width}w /`, browser, { viewport: { width, height } }, async (page) => {
      await openHome(page);
      await capture(page, width, "/", "first-viewport", false);
      await capture(page, width, "/", "full", true);

      const m = await page.evaluate(() => {
        const root = document.documentElement;
        const cta = [...document.querySelectorAll('a[href="/groups/new"]')];
        const stage = document.querySelector("main > section");
        const ctaBox = cta[0]?.getBoundingClientRect();
        return {
          scrollWidth: root.scrollWidth,
          clientWidth: root.clientWidth,
          h1: document.querySelectorAll("h1").length,
          h2: [...document.querySelectorAll("h2")].map((h) => h.textContent.trim()),
          ol: document.querySelectorAll("ol").length,
          ctaLinks: cta.length,
          ctaHeight: ctaBox?.height ?? 0,
          ctaTop: ctaBox?.top ?? null,
          stageTop: stage?.getBoundingClientRect().top ?? null,
          stageHeight: stage?.getBoundingClientRect().height ?? null,
          bodyText: document.body.innerText,
        };
      });
      check(`${width}w no horizontal overflow`, m.scrollWidth === m.clientWidth, `${m.scrollWidth}/${m.clientWidth}`);
      check(`${width}w single h1`, m.h1 === 1, m.h1);
      check(`${width}w two CTA links to /groups/new`, m.ctaLinks === 2, m.ctaLinks);
      check(`${width}w CTA >= 48px tall`, m.ctaHeight >= 48, m.ctaHeight);
      check(`${width}w stage starts at viewport top`, m.stageTop === 0, m.stageTop);
      check(`${width}w CTA within first viewport`, m.ctaTop !== null && m.ctaTop < height, m.ctaTop);
      for (const text of ["정산 예시", "금요일 저녁 모임", "150,000원", "50,000원", "10,000원", "40,000원", "실제 송금은 직접 해요"]) {
        check(`${width}w shows ${text}`, m.bodyText.includes(text));
      }
      manifest.checks.push({ name: `${width}w metrics`, ok: true, detail: { ...m, bodyText: undefined } });
    });
  }

  // 2. Hover, keyboard focus and click-through to the existing create form (1440).
  await section("1440w interaction", browser, { viewport: { width: 1440, height: 900 } }, async (page) => {
    await openHome(page);
    const heroCta = page.getByRole("link", CTA_NAME);

    await heroCta.hover();
    await page.waitForTimeout(200); // let the 150ms feedback settle
    await capture(page, 1440, "/", "cta-hover", false);

    await page.mouse.move(0, 0);
    let focused = false;
    for (let i = 0; i < 10 && !focused; i++) {
      await page.keyboard.press("Tab");
      focused = await heroCta.evaluate((el) => el === document.activeElement);
    }
    check("keyboard reaches hero CTA", focused);
    if (focused) {
      const outline = await heroCta.evaluate((el) => {
        const s = getComputedStyle(el);
        return { style: s.outlineStyle, width: s.outlineWidth, color: s.outlineColor };
      });
      check("hero CTA focus outline visible", outline.style !== "none" && parseFloat(outline.width) >= 2, outline);
      await capture(page, 1440, "/", "cta-focus", false);
      await page.keyboard.press("Enter");
    } else {
      await heroCta.click();
    }
    await page.waitForURL("**/groups/new");
    const formVisible = await page.locator('form input[name="name"]').isVisible();
    check("CTA opens existing /groups/new form", formVisible);
    await capture(page, 1440, "/groups/new", "after-cta", false);
  });

  // 3. CTA feedback frame strips, normal vs reduced motion (1440).
  await section("1440w cta-motion-normal", browser, { viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" }, async (page) => {
    await openHome(page);
    await ctaMotionStrip(page, 1440, "normal", true);
  });
  await section("1440w cta-motion-reduced", browser, { viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" }, async (page) => {
    await openHome(page);
    await ctaMotionStrip(page, 1440, "reduced", false);
  });

  // 4. Reduced motion full-page captures: every piece of content visible without motion.
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    await section(`${width}w reduced-motion`, browser, { viewport: { width, height }, reducedMotion: "reduce" }, async (page) => {
      await openHome(page);
      const heroCta = page.getByRole("link", CTA_NAME);
      await heroCta.hover();
      const motion = await heroCta.evaluate((el) => {
        const s = getComputedStyle(el);
        return { transitionDuration: s.transitionDuration, transform: s.transform };
      });
      check(`${width}w reduced motion: no CTA transform`, motion.transform === "none", motion);
      await page.mouse.move(0, 0);
      await capture(page, width, "/", "reduced-motion-full", true);
    });
  }
} catch (err) {
  // Anything outside a section (e.g. browser launch) is a recorded failure, not swallowed.
  check("fatal: run aborted", false, err?.stack ?? String(err));
} finally {
  if (browser) await browser.close().catch((err) => check("fatal: browser close", false, String(err)));
  try {
    writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
    console.log(`Artifacts + manifest: ${OUT_DIR} (commit ${COMMIT_SHA})`);
  } catch (err) {
    manifest.failures.push("fatal: manifest write");
    console.error(`Could not write manifest to ${OUT_DIR}:`, err);
  }
  if (manifest.failures.length > 0) {
    console.error(`FAILURES (${manifest.failures.length}):\n- ${manifest.failures.join("\n- ")}`);
    process.exitCode = 1;
  } else {
    console.log("All scripted checks passed.");
    process.exitCode = 0;
  }
}
