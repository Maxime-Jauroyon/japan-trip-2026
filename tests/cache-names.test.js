import { test } from "node:test";
import assert from "node:assert/strict";
import { APP_CACHE_PREFIX, cachesToClear } from "../src/shared/cache-names.js";

test("rafraîchir l’app : seuls les caches du code sont vidés, jamais les photos du journal, images, musiques ni cartes", () => {
  const keys = ["japan-trip-2026-v249", "japan-trip-2026-v248", "japan-journal-v1", "japan-img-v1", "japan-audio-v1", "japan-tiles-v1", "autre"];
  assert.deepEqual(cachesToClear(keys), ["japan-trip-2026-v249", "japan-trip-2026-v248"]);
  assert.deepEqual(cachesToClear([]), []);
  assert.deepEqual(cachesToClear(undefined), []);
});

test("le préfixe correspond au cache du service worker", async () => {
  const fs = await import("node:fs");
  const sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  assert.match(sw, new RegExp(`const CACHE = "${APP_CACHE_PREFIX}v\\d+"`));
  assert.match(sw, /startsWith\("japan-trip-2026-"\)/);   // le nettoyage du service worker suit la même règle
  assert.match(sw, /const IMG_CACHE = "japan-img-v1"/);
  assert.match(sw, /const AUDIO_CACHE = "japan-audio-v1"/);
});
