import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { createContext, SourceTextModule, SyntheticModule } from "node:vm";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const loaderSource = read("../src/lib/groupCard.ts");
const groupSource = read("../src/lib/group.ts");
const cardSource = read("../src/components/GroupCard.tsx");
const pageSource = read("../src/app/groups/[id]/page.tsx");
const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-10-31T00:00:00.000Z");

// Execute the actual TS loader and existing expiry policy using Node only.
// Stub framework I/O, Prisma and the clock; no generated client or server needed.
async function harness({ group = null, now = NOW, boundary } = {}) {
  const events = [];
  const queries = [];
  const deletions = [];
  const context = createContext({
    Date: class extends Date {
      static now() {
        events.push("clock");
        return now;
      }
    },
  });
  const synthetic = (exports) => new SyntheticModule(
    Object.keys(exports),
    function () {
      for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
    },
    { context }
  );
  const modules = {
    "next/server": synthetic({
      connection: async () => {
        events.push("connection");
        await boundary;
        events.push("connected");
      },
    }),
    crypto: synthetic({ randomUUID }),
    "@/lib/prisma": synthetic({
      prisma: { group: {
        findUnique: async (query) => {
          events.push("query");
          queries.push(query);
          return group;
        },
        delete: async (query) => { deletions.push(query); },
      } },
    }),
    "@/lib/group": new SourceTextModule(stripTypeScriptTypes(groupSource), { context }),
  };
  const loader = new SourceTextModule(stripTypeScriptTypes(loaderSource), { context });
  await loader.link((specifier) => {
    assert.ok(Object.hasOwn(modules, specifier), `Unexpected import: ${specifier}`);
    return modules[specifier];
  });
  await loader.evaluate();
  return {
    ...loader.namespace,
    events,
    queries,
    deletions,
    setTime(value) { now = value; },
  };
}

const pure = await harness();
for (const [label, remaining, expected] of [
  ["one millisecond before expiry", 1, 1],
  ["just below one day", DAY - 1, 1],
  ["exactly one day", DAY, 1],
  ["just above one day", DAY + 1, 2],
  ["fractional days round up", DAY * 1.5, 2],
  ["exactly two days", DAY * 2, 2],
  ["full retention period", DAY * 90, 90],
  ["exact expiry", 0, 0],
  ["one millisecond expired", -1, 0],
  ["more than a day expired", -DAY - 1, 0],
]) {
  test(`days left: ${label}`, () => {
    const expiresAt = new Date(NOW + remaining);
    assert.equal(pure.calculateDaysLeft(expiresAt, NOW), expected);
    assert.equal(pure.calculateDaysLeft(expiresAt, NOW), expected);
    assert.equal(expiresAt.getTime(), NOW + remaining);
    assert.deepEqual(pure.events, []); // Explicit inputs only; no clock reads.
  });
}

test("request boundary blocks both database access and clock reads", async () => {
  let release;
  const boundary = new Promise((resolve) => { release = resolve; });
  const group = { id: "active", expiresAt: new Date(NOW + DAY + 1) };
  const h = await harness({ group, boundary });
  assert.deepEqual(h.events, []); // Nothing captured at module initialization.
  const pending = h.getActiveGroupCardData(group.id);
  assert.deepEqual(h.events, ["connection"]);
  h.setTime(NOW + 1);
  release();
  const result = await pending;
  assert.equal(result.group, group);
  assert.equal(result.daysLeft, 1);
  assert.deepEqual(h.events, ["connection", "connected", "query", "clock", "clock"]);
  assert.equal(h.queries[0].where.id, group.id);
  assert.deepEqual(h.deletions, []);
});

test("each request re-reads group and time across a day boundary and expiry", async () => {
  const group = { id: "fresh", expiresAt: new Date(NOW + DAY + 1) };
  const h = await harness({ group });
  assert.equal((await h.getActiveGroupCardData(group.id)).daysLeft, 2);
  h.setTime(NOW + 1);
  assert.equal((await h.getActiveGroupCardData(group.id)).daysLeft, 1);
  h.setTime(group.expiresAt.getTime() + 1);
  assert.equal(await h.getActiveGroupCardData(group.id), null);
  assert.equal(h.queries.length, 3);
  assert.equal(h.events.filter((event) => event === "connection").length, 3);
  assert.equal(h.deletions.length, 1);
  assert.equal(h.deletions[0].where.id, group.id);
});

test("missing group stays null without reading time or deleting data", async () => {
  const h = await harness();
  assert.equal(await h.getActiveGroupCardData("missing"), null);
  assert.deepEqual(h.events, ["connection", "connected", "query"]);
  assert.deepEqual(h.deletions, []);
});

test("existing strict expiry policy keeps exact-expiry groups with D-0", async () => {
  const group = { id: "exact-expiry", expiresAt: new Date(NOW) };
  const h = await harness({ group });
  const result = await h.getActiveGroupCardData(group.id);
  assert.equal(result.group, group);
  assert.equal(result.daysLeft, 0);
  assert.deepEqual(h.deletions, []);
});

test("page and card render without clocks or purity suppressions", () => {
  for (const source of [pageSource, cardSource]) {
    assert.doesNotMatch(source, /\bDate\b|\bperformance\b|Math\.random|\b(?:now|clock)\s*\(/);
    assert.doesNotMatch(source, /eslint-disable|react-hooks\/purity|use no memo/);
  }
  assert.match(pageSource, /const cardData = await getActiveGroupCardData\(id\)/);
  assert.match(pageSource, /if \(!cardData\) notFound\(\)/);
  assert.match(pageSource, /const \{ group, daysLeft \} = cardData/);
  assert.match(pageSource, /<GroupCard\b[^>]*daysLeft=\{daysLeft\}/s);
  assert.match(cardSource, /daysLeft: number/);
  assert.match(loaderSource, /await connection\(\)/);
  assert.match(loaderSource, /Date\.now\(\)/);
  assert.doesNotMatch(loaderSource, /unstable_cache|\bcache\s*\(|use cache|eslint-disable|use no memo/);
});

test("badge wording and layout classes stay unchanged", () => {
  assert.match(cardSource, /<span className="shrink-0 whitespace-nowrap rounded-full bg-warn-soft px-3 py-1 font-body text-xs font-bold text-warn">\s*D-\{daysLeft\} 후 자동 삭제\s*<\/span>/);
  assert.match(cardSource, /<div className="flex flex-col gap-5 rounded-token bg-surface p-5 shadow-card">/);
  assert.match(pageSource, /<ExpiryBanner expiresAt=\{group\.expiresAt\} \/>/);
});

test("build script orders Prisma generation before Next and preserves ignored output", () => {
  const { scripts } = JSON.parse(read("../package.json"));
  assert.equal(scripts.build, "prisma generate && next build");
  assert.match(read("../prisma/schema.prisma"), /output\s*=\s*"\.\.\/src\/generated\/prisma"/);
  assert.match(read("../.gitignore"), /^\/src\/generated\/prisma$/m);
});
