import { test } from "node:test";
import assert from "node:assert/strict";
import { periodAt } from "../src/domain/phrases.js";

const periods = [{ id: "morning", from: "04:00" }, { id: "day", from: "10:30" }, { id: "evening", from: "17:00" }, { id: "night", from: "21:00" }];

test("période de la journée : matin, journée, soir, nuit (même après minuit)", () => {
  assert.equal(periodAt(periods, "08:15").id, "morning");
  assert.equal(periodAt(periods, "12:00").id, "day");
  assert.equal(periodAt(periods, "18:30").id, "evening");
  assert.equal(periodAt(periods, "23:40").id, "night");
  assert.equal(periodAt(periods, "02:10").id, "night");
  assert.equal(periodAt([], "10:00"), null);
});
