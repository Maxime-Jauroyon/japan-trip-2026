import { test } from "node:test";
import assert from "node:assert/strict";
import { expenseTotals, formatEur, formatYen } from "../src/domain/expenses.js";

test("totaux des dépenses", () => {
  const list = [
    { id: 1, iso: "2026-11-20", yen: 1200, cat: "food" },
    { id: 2, iso: "2026-11-20", yen: 300, cat: "transport" },
    { id: 3, iso: "2026-11-19", yen: 4500, cat: "food" },
    { id: 4, iso: "2026-11-19", yen: -5, cat: "food" }
  ];
  const t = expenseTotals(list, "2026-11-20");
  assert.equal(t.todayYen, 1500);
  assert.equal(t.todayList.length, 2);
  assert.equal(t.totalYen, 6000);
  assert.deepEqual(t.byCat, { food: 5700, transport: 300 });
  assert.equal(t.days, 2);
  assert.equal(t.avgYen, 3000);
  assert.equal(expenseTotals([], "x").avgYen, 0);
});

test("formats ¥ / €", () => {
  assert.equal(formatYen(12300), "12 300 ¥");
  assert.equal(formatEur(1850, 185), "10,00 €");
  assert.equal(formatEur(185000, 185), "1\u202f000\u202f€");
});
