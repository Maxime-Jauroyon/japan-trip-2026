import { test } from "node:test";
import assert from "node:assert/strict";
import { SLIDE_MS, VIDEO_MAX_MS, VIDEO_MIN_MS, isLongPress, retryDelay, slideDuration, stepSlide, tapStep } from "../src/domain/story.js";

test("story : 3 secondes par photo", () => {
  assert.equal(SLIDE_MS, 3000);
  assert.equal(slideDuration(false, 12), 3000);
  assert.equal(slideDuration(true, undefined), 3000);
});

test("story : une vidéo dure sa durée, entre 3 et 8 secondes", () => {
  assert.equal(slideDuration(true, 1), VIDEO_MIN_MS);
  assert.equal(slideDuration(true, 5.4), 5400);
  assert.equal(slideDuration(true, 20), VIDEO_MAX_MS);
  assert.equal(slideDuration(true, NaN), SLIDE_MS);
});

test("story : navigation bornée, fermeture après la dernière", () => {
  assert.deepEqual(stepSlide(0, 1, 5), { idx: 1 });
  assert.deepEqual(stepSlide(0, -1, 5), { idx: 0 });      // pas avant la première
  assert.deepEqual(stepSlide(3, 1, 5), { idx: 4 });
  assert.deepEqual(stepSlide(4, 1, 5), { close: true });   // passer la dernière ferme
  assert.deepEqual(stepSlide(0, 1, 1), { close: true });
});

test("story : en tapant très vite on ne sort jamais des bornes", () => {
  let idx = 0, closed = false;
  for (let i = 0; i < 40 && !closed; i++) {
    const r = stepSlide(idx, i % 7 === 6 ? -1 : 1, 13);
    if (r.close) closed = true; else idx = r.idx;
    assert.ok(idx >= 0 && idx < 13);
  }
  assert.ok(closed);
});

test("story : toucher à gauche = précédente, ailleurs = suivante ; appui long = pause", () => {
  assert.equal(tapStep(10, 390), -1);
  assert.equal(tapStep(128, 390), -1);
  assert.equal(tapStep(130, 390), 1);
  assert.equal(tapStep(380, 390), 1);
  assert.equal(isLongPress(120), false);
  assert.equal(isLongPress(260), false);
  assert.equal(isLongPress(261), true);
});

test("photos : trois nouvelles tentatives aux délais croissants, puis on abandonne", () => {
  assert.deepEqual([0, 1, 2].map(retryDelay), [1500, 4000, 9000]);
  assert.equal(retryDelay(3), null);
  assert.equal(retryDelay(-1), null);
});
