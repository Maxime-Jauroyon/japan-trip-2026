#!/usr/bin/env node
/* Test de bout en bout du Carnet dans un vrai navigateur (Playwright), sur un réseau lent et capricieux :
   photos jamais floues pour toujours, téléchargements limités, story qui ne se bloque pas quand on tape en rafale,
   pause à l’appui long, visionneuse qui suit les balayages rapides.
   Pas dans `npm run check` (il faut Playwright) : `npm run e2e` (variable PLAYWRIGHT_DIR si Playwright est installé ailleurs). */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = process.env.E2E_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");   // E2E_ROOT : tester une autre copie du site
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require(require.resolve("playwright", { paths: [process.env.PLAYWRIGHT_DIR || "/opt/node-tools/node_modules", ROOT] })));
} catch (_) {
  console.log("↷ Playwright introuvable : test e2e ignoré (PLAYWRIGHT_DIR=/chemin/vers/node_modules pour l’activer).");
  process.exit(0);
}

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".webmanifest": "application/manifest+json" };
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/\/$/, "/index.html"));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" }).end(fs.readFileSync(file));
});
await new Promise((ok) => server.listen(0, ok));
const BASE = `http://localhost:${server.address().port}/`;

const results = [];
const check = (name, ok, detail = "") => { results.push(ok); console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`); };

const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const context = await browser.newContext({ viewport: { width: 390, height: 800 }, serviceWorkers: "block" });
await context.addInitScript(() => {
  const R = Date, off = R.UTC(2026, 10, 11, 5, 0) - R.now();
  globalThis.Date = class extends R { constructor(...a) { a.length ? super(...a) : super(R.now() + off); } static now() { return R.now() + off; } };
  try { localStorage.setItem("japan-trip-journal-cfg-v1", JSON.stringify({ token: "t", author: "Maxime" })); } catch (_) { /* about:blank */ }
});
const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message));

// Deux JPEG (miniature 400 px, photo 1600 px) fabriqués par le navigateur
const jpeg = (w, h) => page.evaluate(async ([w, h]) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d"); g.fillStyle = "#c45c26"; g.fillRect(0, 0, w, h); g.fillStyle = "#fff"; g.fillRect(w / 4, h / 4, w / 2, h / 2);
  return c.toDataURL("image/jpeg", 0.8).split(",")[1];
}, [w, h]).then((b) => Buffer.from(b, "base64"));
await page.goto("about:blank");
const [THUMB, FULL] = [await jpeg(400, 300), await jpeg(1600, 1200)];

// Faux dépôt GitHub : 3 jours, 39 photos ; la 1re demande de chaque grande photo échoue une fois sur cinq ; ~500 ms de latence
const days = { "2026-11-08": 0, "2026-11-09": 13, "2026-11-10": 26 };
const files = {};
Object.entries(days).forEach(([iso, off]) => {
  const items = {}; let k = 0;
  ["Akihabara", "Zōjō-ji — grand temple", "teamLab Planets"].forEach((title, i) => {
    const photos = []; for (let j = 0; j < (i === 2 ? 5 : 4) && k < 13; j++, k++) photos.push("p" + String(off + k).padStart(2, "0") + ".jpg");
    const id = "p:" + title.toLowerCase().replace(/[^a-z]+/g, "-");
    items[id] = { id, kind: "planned", title, status: "done", at: 5 + i, doneAt: Date.parse(`${iso}T0${3 + i * 2}:00:00Z`), by: "Léo", photos };
  });
  files[iso + ".json"] = { sha: "s" + off, content: Buffer.from(JSON.stringify({ items })).toString("base64") };
});
const stats = { inflight: 0, peak: 0, fails: 0 }, tried = {};
await page.route("https://api.github.com/**", async (r) => {
  const path_ = new URL(r.request().url()).pathname.replace("/repos/Maxime-Jauroyon/japan-trip-2026", "");
  const json = (o, s = 200) => r.fulfill({ status: s, contentType: "application/json", body: JSON.stringify(o) });
  if (path_ === "") return json({ full_name: "x", default_branch: "main", permissions: { push: true } });
  if (path_.startsWith("/git/ref/heads/journal")) return json({ object: { sha: "x" } });
  if (path_ === "/contents/journal/days") return json(Object.keys(files).map((n) => ({ name: n, sha: files[n].sha })));
  const day = /^\/contents\/journal\/days\/(.+\.json)$/.exec(path_);
  if (day) return files[day[1]] ? json({ sha: files[day[1]].sha, content: files[day[1]].content }) : json({}, 404);
  const ph = /^\/contents\/journal\/photos\/([^/]+)\/(.+)$/.exec(path_);
  if (ph) {
    stats.inflight++; stats.peak = Math.max(stats.peak, stats.inflight);
    await new Promise((ok) => setTimeout(ok, 250 + Math.random() * 500));
    stats.inflight--;
    const thumb = /\.t\.jpg$/.test(ph[2]), key = ph[1] + ph[2];
    tried[key] = (tried[key] || 0) + 1;
    if (!thumb && tried[key] === 1 && Math.random() < 0.2) { stats.fails++; return json({ message: "boom" }, 500); }
    return r.fulfill({ status: 200, contentType: "image/jpeg", body: thumb ? THUMB : FULL });
  }
  return json({}, 404);
});
await page.route(/^https:\/\/(?!api\.github\.com)/, (r) => r.abort());
await page.goto(BASE);
await page.waitForTimeout(1500);
await page.getByText("Plus tard").click({ timeout: 2000 }).catch(() => {});
await page.locator('nav button:has-text("Carnet")').last().click();
await page.waitForTimeout(2500);

// 1. Story en rafale, photos pas encore sur le téléphone : 12 touchers très rapprochés (jusqu’à la dernière photo), puis elle doit aller au bout toute seule
const openStory = async () => { await page.evaluate(() => document.querySelector('[data-story-day="3"]').click()); await page.waitForTimeout(700); };
const story = () => page.evaluate(() => ({ cur: [...document.querySelectorAll(".st-bar")].findIndex((x) => x.classList.contains("cur")), paused: document.querySelector(".st-player").classList.contains("paused"), open: !document.querySelector(".st-player").hidden }));
await page.evaluate(() => document.querySelector("#view-carnet").scrollTo(0, 0));
await openStory();
const box = await page.locator(".st-player").boundingBox();
const tap = () => page.mouse.click(box.x + box.width * 0.8, box.y + box.height / 2);
for (let i = 0; i < 12; i++) { await tap(); await page.waitForTimeout(70); }
const a = await story();
check("après 12 touchers rapides : dernière diapositive, pas bloquée en pause", a.open && a.cur === 12 && !a.paused, JSON.stringify(a));
await page.waitForTimeout(5000);
check("la story va au bout toute seule puis se ferme", !(await story()).open);

// 2. Appui long = pause, relâcher = reprise
await openStory();
for (let i = 0; i < 3; i++) { await tap(); await page.waitForTimeout(80); }
await page.waitForTimeout(800);
const before = (await story()).cur;
await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
await page.mouse.down();
await page.waitForTimeout(4500);
const held = await story();
await page.mouse.up();
check("appui long : la story reste en pause", held.cur === before && held.paused, JSON.stringify(held));
await page.waitForTimeout(3600);
const resumed = await story();
check("relâché : la story reprend", !resumed.paused && resumed.cur > before, `${before} → ${resumed.cur}`);

// 2b. Musique : une famille par activité (arcade → temple → eau), fondu enchaîné à puissance égale, ⏭, 🔇, fermeture
const music = () => page.evaluate(async () => (await import("/src/ui/music-player.js")).musicDebug());
const slideNow = () => story().then((x) => x.cur);
const until = async (fn, ms = 6000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const r = await fn(); if (r) return r; await page.waitForTimeout(100); } return null; };
await page.evaluate(() => document.querySelector(".st-close")?.click());   // repartir d’une musique éteinte
await until(async () => (await music()).voices.length === 0, 6000);
await openStory();
const m1 = await until(async () => { const m = await music(); return m.ctx === "running" && m.voices.some((v) => !v.dying) ? m : null; });
check("musique : démarre avec la famille de la 1re activité (arcade)", !!m1 && m1.voices.find((v) => !v.dying).family === "arcade", JSON.stringify(m1 && m1.voices.map((v) => [v.family, v.file])));
await until(async () => (await music()).voices.some((v) => !v.dying && v.gain >= 0.49), 6000);   // le fondu d’entrée est fini : le suivant part d’un volume plein
for (let i = 0; i < 4; i++) { await tap(); await page.waitForTimeout(150); }   // 4 touchers : 1re photo de l’activité suivante (temple)
await until(async () => (await music()).voices.length === 2, 5000);
await page.waitForTimeout(1000);
const mid = await music();
const gains = mid.voices.map((v) => v.gain);
const volume = 0.55;   // volume de la famille (arcade 0,5 / temple 0,55) : on vérifie surtout que les deux sont audibles et que la somme des puissances reste constante
check("fondu : deux musiques en même temps pendant la transition (l’ancienne s’éteint, la nouvelle entre)", mid.voices.length === 2 && mid.voices.some((v) => v.dying) && mid.voices.some((v) => !v.dying && v.family === "temple"), JSON.stringify(mid.voices.map((v) => [v.family, v.dying, +v.gain.toFixed(2)])));
const power = mid.voices.reduce((sum, v) => sum + (v.gain / (v.family === "temple" ? 0.55 : 0.5)) ** 2, 0);
check("fondu : puissance totale à peu près constante (pas de creux)", power > 0.8 && power < 1.2, `somme des puissances = ${power.toFixed(2)}`);
await until(async () => (await music()).voices.length === 1, 6000);
const m3 = await music();
check("après le fondu : une seule musique (temple)", m3.voices.length === 1 && m3.voices[0].family === "temple" && !m3.voices[0].dying, JSON.stringify(m3.voices.map((v) => [v.family, v.file])));
const fileBefore = m3.voices[0].file;
await page.evaluate(() => document.querySelector(".st-music-next").click());
await until(async () => (await music()).voices.some((v) => !v.dying && v.file !== fileBefore), 6000);
await page.waitForTimeout(2000);
const m4 = await music();
check("⏭ : passe au morceau suivant de la même famille", m4.voices.length === 1 && m4.voices[0].family === "temple" && m4.voices[0].file !== fileBefore, JSON.stringify(m4.voices.map((v) => v.file)));
await page.evaluate(() => document.querySelector(".st-sound").click());
await page.waitForTimeout(1500);
check("🔇 : plus aucune musique", (await music()).voices.length === 0);
await page.evaluate(() => document.querySelector(".st-sound").click());
const m5 = await until(async () => { const m = await music(); return m.voices.some((v) => !v.dying) ? m : null; }, 8000);
check("🔊 : la musique de l’activité revient", !!m5);
await page.evaluate(() => document.querySelector(".st-close").click());
await page.waitForTimeout(1500);
check("fermeture : la musique s’efface", (await music()).voices.length === 0);

// 3. Toucher bien au-delà de la dernière diapositive : fermeture propre, sans rester bloqué
for (let i = 0; i < 20; i++) { await tap(); await page.waitForTimeout(40); }
check("passer la dernière photo ferme la story", !(await story()).open);

// 4. Photos : on fait défiler tout le fil, puis on laisse le temps aux nouvelles tentatives
for (let y = 0; y < 14000; y += 500) { await page.evaluate((y) => document.querySelector("#view-carnet").scrollTo(0, y), y); await page.waitForTimeout(120); }
await page.waitForTimeout(16000);
const feed = await page.evaluate(() => {
  const all = [...document.querySelectorAll("#carnet-body .vy-photo")];
  return { n: all.length, blur: all.filter((b) => b.querySelector("img.blur")).length, missing: all.filter((b) => b.classList.contains("missing")).length, soft: all.filter((b) => b.dataset.jpSoft).length };
});
check("aucune photo floue pour toujours", feed.blur === 0, `${feed.blur} floue(s) sur ${feed.n}`);
check("aucune photo « en route » restée vide", feed.missing === 0, `${feed.missing}`);
check("téléchargements limités à 4 en parallèle", stats.peak <= 4, `pic = ${stats.peak} (${stats.fails} échecs simulés rattrapés)`);

// 5. Visionneuse : balayages rapides (flèches) puis la bonne photo nette s’affiche
await page.evaluate(() => document.querySelector("#carnet-body .vy-post .vy-photo").click());
await page.waitForTimeout(600);
for (let i = 0; i < 25; i++) { await page.keyboard.press("ArrowRight"); await page.waitForTimeout(30); }
await page.waitForTimeout(3500);
const viewer = await page.evaluate(() => { const v = document.querySelector(".jr-viewer"), im = v.querySelector("img"); return { pos: v.querySelector(".jv-pos").textContent, nat: im.naturalWidth }; });
check("visionneuse : position juste et photo nette après 25 balayages", /^26 \/ 39$/.test(viewer.pos) && viewer.nat === 1600, JSON.stringify(viewer));

check("aucune erreur JavaScript", pageErrors.length === 0, pageErrors.join(" | "));
await browser.close();
server.close();
const failed = results.filter((x) => !x).length;
console.log(failed ? `\n${failed} vérification(s) en échec` : `\n✓ ${results.length} vérifications OK`);
process.exit(failed ? 1 : 0);
