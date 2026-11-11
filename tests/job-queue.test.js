import { test } from "node:test";
import assert from "node:assert/strict";
import { createDedupe, createJobQueue } from "../src/shared/job-queue.js";

const tick = () => new Promise((r) => setTimeout(r, 0));
const gate = () => { let open; const p = new Promise((r) => { open = r; }); return { p, open }; };

test("file : jamais plus de `max` tâches en même temps", async () => {
  const q = createJobQueue(3);
  let now = 0, peak = 0;
  const gates = Array.from({ length: 10 }, gate);
  const all = gates.map((g) => q.run(async () => { now++; peak = Math.max(peak, now); await g.p; now--; return 1; }));
  await tick();
  assert.equal(q.running, 3);
  assert.equal(q.size, 7);
  for (const g of gates) { g.open(); await tick(); }
  await Promise.all(all);
  assert.equal(peak, 3);
  assert.equal(q.running, 0);
});

test("file : priorité d’abord, puis la plus récente (ce qu’on regarde maintenant)", async () => {
  const q = createJobQueue(1);
  const order = [];
  const block = gate();
  const first = q.run(() => block.p);
  const job = (name, prio) => q.run(async () => { order.push(name); }, { prio });
  const rest = [job("fond-ancien", 0), job("fond-récent", 0), job("écran", 5), job("plein-écran", 10)];
  block.open();
  await Promise.all([first, ...rest]);
  assert.deepEqual(order, ["plein-écran", "écran", "fond-récent", "fond-ancien"]);
});

test("file : une priorité peut changer pendant l’attente (photo qui entre à l’écran)", async () => {
  const q = createJobQueue(1);
  const order = [];
  const block = gate();
  const first = q.run(() => block.p);
  let aVisible = false;
  const a = q.run(async () => { order.push("a"); }, { prio: () => (aVisible ? 6 : 1) });
  const b = q.run(async () => { order.push("b"); }, { prio: 3 });
  aVisible = true;
  block.open();
  await Promise.all([first, a, b]);
  assert.deepEqual(order, ["a", "b"]);
});

test("file : une tâche devenue inutile n’est pas lancée et rend le repli", async () => {
  const q = createJobQueue(1);
  const block = gate();
  let ran = false, alive = true;
  const first = q.run(() => block.p);
  const stale = q.run(async () => { ran = true; return "x"; }, { live: () => alive, fallback: null });
  alive = false;
  block.open();
  await first;
  assert.equal(await stale, null);
  assert.equal(ran, false);
});

test("file : une erreur n’arrête pas la file", async () => {
  const q = createJobQueue(1);
  const bad = q.run(async () => { throw new Error("réseau"); });
  const good = q.run(async () => "ok");
  await assert.rejects(bad, /réseau/);
  assert.equal(await good, "ok");
  assert.equal(q.running, 0);
});

test("dedupe : une même clé n’est demandée qu’une fois en parallèle, puis peut être redemandée", async () => {
  const once = createDedupe();
  let calls = 0;
  const g = gate();
  const start = async () => { calls++; await g.p; return "url"; };
  const [a, b] = [once("k", start), once("k", start)];
  g.open();
  assert.equal(await a, "url");
  assert.equal(await b, "url");
  assert.equal(calls, 1);
  await once("k", async () => { calls++; return "url2"; });
  assert.equal(calls, 2);
});
