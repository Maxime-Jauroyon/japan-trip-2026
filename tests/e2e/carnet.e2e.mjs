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
    if (iso === "2026-11-09" && i === 1) items[id].likes = { Léo: 1000 };   // un coup de cœur de Léo déjà posé
  });
  files[iso + ".json"] = { sha: "s" + off, content: Buffer.from(JSON.stringify({ items })).toString("base64") };
});
const stats = { inflight: 0, peak: 0, fails: 0 }, tried = {};
const stats2 = { full: 0 };
const installRoutes = async (pg) => {
  await pg.route("https://api.github.com/**", async (r) => {
    const path_ = new URL(r.request().url()).pathname.replace("/repos/Maxime-Jauroyon/japan-trip-2026", "");
    const json = (o, s = 200) => r.fulfill({ status: s, contentType: "application/json", body: JSON.stringify(o) });
    if (path_ === "") return json({ full_name: "x", default_branch: "main", permissions: { push: true } });
    if (path_.startsWith("/git/ref/heads/journal")) return json({ object: { sha: "x" } });
    if (path_ === "/contents/journal/days") return json(Object.keys(files).map((n) => ({ name: n, sha: files[n].sha })));
    const day = /^\/contents\/journal\/days\/(.+\.json)$/.exec(path_);
    if (day && r.request().method() === "PUT") {
      const b = JSON.parse(r.request().postData());
      files[day[1]] = { sha: "n" + Math.random(), content: b.content };
      return json({ content: { sha: files[day[1]].sha } });
    }
    if (day) return files[day[1]] ? json({ sha: files[day[1]].sha, content: files[day[1]].content }) : json({}, 404);
    const ph = /^\/contents\/journal\/photos\/([^/]+)\/(.+)$/.exec(path_);
    if (ph) {
      stats.inflight++; stats.peak = Math.max(stats.peak, stats.inflight);
      await new Promise((ok) => setTimeout(ok, 250 + Math.random() * 500));
      stats.inflight--;
      const thumb = /\.t\.jpg$/.test(ph[2]), key = ph[1] + ph[2];
    if (!thumb) stats2.full++;
      tried[key] = (tried[key] || 0) + 1;
      if (!thumb && tried[key] === 1 && Math.random() < 0.2) { stats.fails++; return json({ message: "boom" }, 500); }
      return r.fulfill({ status: 200, contentType: "image/jpeg", body: thumb ? THUMB : FULL });
    }
    return json({}, 404);
  });
  await pg.route(/^https:\/\/(?!api\.github\.com)/, (r) => r.abort());
};
await installRoutes(page);
await page.goto(BASE);
await page.waitForTimeout(1500);
await page.getByText("Plus tard").click({ timeout: 2000 }).catch(() => {});
await page.locator('nav button:has-text("Carnet")').last().click();
await page.waitForTimeout(2500);

// 0. Carnet lisible par tous : bouton « Actualiser » dans la ligne d’état, deux onglets en mots, jours en dates, carte d’aide
const top = await page.evaluate(() => {
  const r = document.querySelector("#carnet-refresh"), st = document.querySelector("#carnet-status");
  const b = r && r.getBoundingClientRect(), sb = st.getBoundingClientRect();
  return { text: r && r.textContent.trim(), inStatus: !!r && st.contains(r), onScreen: !!b && b.top >= 0 && b.bottom <= innerHeight && b.left >= 0 && b.right <= innerWidth, nearTitle: !!b && b.top < 200, big: !!b && b.height >= 40, sameRow: !!b && Math.abs((b.top + b.bottom) / 2 - (sb.top + sb.bottom) / 2) < 12 };
});
check("« Actualiser » est un bouton avec son libellé, dans la ligne d’état, visible dès l’ouverture", top.inStatus && /Actualiser/.test(top.text) && top.onScreen && top.nearTitle && top.big && top.sameRow, JSON.stringify(top));
const refreshed = page.waitForRequest((rq) => /contents\/journal\/days/.test(rq.url()), { timeout: 5000 }).then(() => true, () => false);
await page.evaluate(() => document.querySelector("#carnet-refresh").click());
check("toucher « Actualiser » relance la synchro", await refreshed);
const tabs = await page.evaluate(() => ({ tabs: [...document.querySelectorAll(".cn-seg button")].map((b) => b.textContent.trim()), grid: !!document.querySelector('[data-mode="grid"], .cn-grid'), chips: [...document.querySelectorAll(".cn-days button")].map((b) => b.textContent.trim()), round: !!document.querySelector(".cn-round") }));
check("deux onglets en toutes lettres, plus de « Grille »", JSON.stringify(tabs.tabs) === JSON.stringify(["Journées", "❤️ Coups de cœur"]) && !tabs.grid && !tabs.round, JSON.stringify(tabs.tabs));
check("jours proposés en dates lisibles (« Mar 10 nov »), pas « J3 »", tabs.chips[0] === "Tous les jours" && tabs.chips.slice(1).every((c) => /^(Lun|Mar|Mer|Jeu|Ven|Sam|Dim) \d{1,2} \p{L}+/u.test(c)) && tabs.chips.length === 4, JSON.stringify(tabs.chips));
const help = await page.evaluate(() => { const h = document.querySelector(".cn-help"); return h ? { title: h.querySelector("strong").textContent, lines: h.querySelectorAll("li").length, btn: h.querySelector("[data-help-close]").textContent } : null; });
check("carte d’aide « Comment ça marche ? » au premier passage", !!help && /Comment/.test(help.title) && help.lines === 4 && /compris/.test(help.btn), JSON.stringify(help));
await page.evaluate(() => document.querySelector("[data-help-close]").click());
check("« J’ai compris » la ferme et s’en souvient", await page.evaluate(() => !document.querySelector(".cn-help") && localStorage.getItem("japan-trip-carnet-help") === "1"));

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

await page.keyboard.press("Escape");   // referme la visionneuse
await page.waitForTimeout(300);
// 6. ❤️ sur une journée entière
await page.evaluate(() => document.querySelector("#view-carnet").scrollTo(0, 0));
const dayLike = () => page.evaluate(() => { const b = document.querySelector(".cn-daylike"); return b ? { pressed: b.getAttribute("aria-pressed"), n: (b.querySelector("b") || {}).textContent || "" } : null; });
const dl0 = await dayLike();
check("chaque journée du carnet a son bouton ❤️", !!dl0 && dl0.pressed === "false", JSON.stringify(dl0));
await page.evaluate(() => document.querySelector(".cn-daylike").click());
await page.waitForTimeout(800);
const liked = await dayLike();
check("❤️ sur la journée : le bouton passe à « aimé » avec le compteur", liked && liked.pressed === "true" && liked.n === "1", JSON.stringify(liked));
await page.waitForTimeout(3500);   // laisse partir la synchro vers le faux dépôt
const saved = Object.values(files).map((f) => JSON.parse(Buffer.from(f.content, "base64").toString())).find((d) => d.items && d.items["x:jour"]);
check("le cœur de la journée est envoyé au journal partagé", !!saved && Object.keys(saved.items["x:jour"].likes || {}).includes("Maxime"), saved ? JSON.stringify(saved.items["x:jour"].likes) : "absent");
await page.evaluate(() => document.querySelector(".cn-daylike").click());
await page.waitForTimeout(800);
check("un second appui retire le cœur", (await dayLike()).pressed === "false");

// 6 bis. 👎 sur une journée : exclusif avec le ❤️
const dayDislike = () => page.evaluate(() => { const b = document.querySelector(".cn-daydislike"); return b ? { pressed: b.getAttribute("aria-pressed"), n: (b.querySelector("b") || {}).textContent || "" } : null; });
check("chaque journée a aussi son bouton 👎", (await dayDislike() || {}).pressed === "false");
await page.evaluate(() => document.querySelector(".cn-daydislike").click());
await page.waitForTimeout(800);
const dis1 = await dayDislike();
check("👎 sur la journée : le bouton passe à « pas aimé » avec le compteur", dis1 && dis1.pressed === "true" && dis1.n === "1", JSON.stringify(dis1));
await page.evaluate(() => document.querySelector(".cn-daylike").click());   // aimer retire le 👎
await page.waitForTimeout(800);
check("aimer la journée retire le 👎", (await dayLike()).pressed === "true" && (await dayDislike()).pressed === "false");
await page.evaluate(() => document.querySelector(".cn-daydislike").click());   // ne pas aimer retire le ❤️
await page.waitForTimeout(800);
check("ne pas aimer retire le ❤️", (await dayLike()).pressed === "false" && (await dayDislike()).pressed === "true");
await page.evaluate(() => document.querySelector(".cn-daydislike").click());
await page.waitForTimeout(800);
check("un second appui retire le 👎", (await dayDislike()).pressed === "false");

// 7. Coups de cœur de chacun (vue ❤️ du Carnet)
await page.evaluate(() => document.querySelector(".cn-daylike").click());   // Maxime aime aussi une journée
await page.waitForTimeout(600);
await page.evaluate(() => document.querySelector('[data-mode="hearts"]').click());
await page.waitForTimeout(600);
const hearts = () => page.evaluate(() => ({
  chips: [...document.querySelectorAll(".cn-who button")].map((b) => b.textContent.trim()),
  days: document.querySelectorAll(".cn-favday").length,
  moments: [...document.querySelectorAll(".cn-fav strong")].map((x) => x.textContent)
}));
const h1 = await hearts();
check("vue ❤️ : puces Tous / Léo / Maxime", JSON.stringify(h1.chips) === JSON.stringify(["Tous", "❤️ Léo", "❤️ Maxime"]), JSON.stringify(h1.chips));
check("vue ❤️ : le moment aimé par Léo et la journée aimée par Maxime sont listés", h1.days === 1 && h1.moments.length === 1, JSON.stringify(h1));
await page.evaluate(() => document.querySelector('[data-who="Léo"]').click());
await page.waitForTimeout(400);
const hLeo = await hearts();
check("filtre Léo : son moment, pas la journée de Maxime", hLeo.days === 0 && hLeo.moments.length === 1, JSON.stringify(hLeo));
await page.evaluate(() => document.querySelector('[data-who="Maxime"]').click());
await page.waitForTimeout(400);
const hMax = await hearts();
check("filtre Maxime : sa journée, pas le moment de Léo", hMax.days === 1 && hMax.moments.length === 0, JSON.stringify(hMax));
await page.evaluate(() => document.querySelector(".cn-favday").click());   // toucher une journée adorée ouvre ce jour dans le fil
await page.waitForTimeout(500);
check("toucher une journée adorée ouvre ce jour dans le fil", await page.evaluate(() => document.querySelector('[data-mode="feed"]').getAttribute("aria-pressed") === "true" && !!document.querySelector(".vy-daygroup")));

// 8. Depuis les coups de cœur : ouvrir un moment (fil de l’activité) puis revenir à la liste, sans la perdre
await page.evaluate(() => document.querySelector('[data-mode="hearts"]').click());
await page.waitForTimeout(500);
await page.evaluate(() => document.querySelector('[data-who=""]').click());
await page.waitForTimeout(400);
await page.evaluate(() => { document.querySelector("#view-carnet").scrollTo(0, 120); });
await page.waitForTimeout(300);
const topBefore = await page.evaluate(() => document.querySelector("#view-carnet").scrollTop);
await page.evaluate(() => document.querySelector(".cn-fav").click());
await page.waitForTimeout(1200);
const sheetInfo = await page.evaluate(() => { const s = document.querySelector(".cn-sheet"); return s ? { posts: s.querySelectorAll(".vy-post").length, title: (s.querySelector(".vy-post header strong") || {}).textContent, back: (s.querySelector("[data-sheet-close]") || {}).textContent, photos: s.querySelectorAll(".vy-photo").length, likeBtn: !!s.querySelector(".cn-like"), visible: s.querySelector(".vy-post") ? getComputedStyle(s.querySelector(".vy-post")).opacity === "1" : false } : null; });
check("toucher un moment aimé ouvre son fil (le moment, ses photos, son ❤️) avec un retour « Coups de cœur »", !!sheetInfo && sheetInfo.posts === 1 && /Zōjō/.test(sheetInfo.title) && /Coups de cœur/.test(sheetInfo.back) && sheetInfo.photos >= 2 && sheetInfo.likeBtn && sheetInfo.visible, JSON.stringify(sheetInfo));
await page.evaluate(() => document.querySelector(".cn-sheet .cn-like").click());
await page.waitForTimeout(800);
check("❤️ posé dans la fiche : mis à jour dans la fiche", await page.evaluate(() => document.querySelector(".cn-sheet .cn-like").getAttribute("aria-pressed") === "true"));
await page.evaluate(() => document.querySelector("[data-sheet-close]").click());
await page.waitForTimeout(500);
const back = await page.evaluate(() => ({ sheet: !!document.querySelector(".cn-sheet"), mode: document.querySelector('[data-mode="hearts"]').getAttribute("aria-pressed"), favs: document.querySelectorAll(".cn-fav").length, chips: document.querySelectorAll(".cn-who button").length, top: document.querySelector("#view-carnet").scrollTop }));
check("retour : la liste des coups de cœur est intacte (même vue, même défilement)", !back.sheet && back.mode === "true" && back.favs >= 1 && back.chips === 3 && Math.abs(back.top - topBefore) < 5, JSON.stringify({ ...back, topBefore }));
await page.evaluate(() => document.querySelector(".cn-fav").click());
await page.waitForTimeout(600);
await page.keyboard.press("Escape");
await page.waitForTimeout(400);
check("Échap referme aussi la fiche", !(await page.evaluate(() => !!document.querySelector(".cn-sheet"))));

// 9. « Tout télécharger » : photos en haute qualité, jamais floues ensuite (contexte neuf : rien n’est encore sur le téléphone)
const ctx2 = await browser.newContext({ viewport: { width: 390, height: 800 }, serviceWorkers: "block" });
await ctx2.addInitScript(() => {
  const R = Date, off = R.UTC(2026, 10, 11, 5, 0) - R.now();
  globalThis.Date = class extends R { constructor(...a) { a.length ? super(...a) : super(R.now() + off); } static now() { return R.now() + off; } };
  try { localStorage.setItem("japan-trip-journal-cfg-v1", JSON.stringify({ token: "t", author: "Maxime" })); localStorage.setItem("japan-trip-carnet-help", "1"); } catch (_) { /* about:blank */ }
});
const page2 = await ctx2.newPage();
page2.on("pageerror", (e) => pageErrors.push(e.message));
await installRoutes(page2);
await page2.goto(BASE);
await page2.waitForTimeout(1500);
await page2.getByText("Plus tard").click({ timeout: 2000 }).catch(() => {});
await page2.locator('nav button:has-text("Carnet")').last().click();
await page2.waitForTimeout(6000);
const hq0 = await page2.evaluate(() => { const h = document.querySelector("#carnet-hq"); return h && !h.hidden ? { text: h.querySelector("span").textContent, btn: h.querySelector("button").textContent } : null; });
check("le Carnet dit combien de photos sont encore en qualité réduite, avec le poids à prévoir", !!hq0 && /qualité réduite/.test(hq0.text) && /Tout télécharger \(≈ \d+ Mo\)/.test(hq0.btn), JSON.stringify(hq0));
stats2.full = 0;
await page2.evaluate(() => document.querySelector("[data-hq=all]").click());
await page2.waitForTimeout(500);
const running = await page2.evaluate(() => { const h = document.querySelector("#carnet-hq"); return h && !h.hidden ? { text: h.querySelector("span").textContent, btn: h.querySelector("button").textContent } : null; });
check("pendant le téléchargement : avancement « Haute qualité : x / 39 » et bouton Pause", !!running && /Haute qualité : \d+ \/ 39/.test(running.text) && running.btn === "Pause", JSON.stringify(running));
await page2.waitForFunction(() => document.querySelector("#carnet-hq").hidden === true, null, { timeout: 60000 }).catch(() => {});
const done = await page2.evaluate(() => ({ hidden: document.querySelector("#carnet-hq").hidden, status: document.querySelector("#carnet-status .cn-status-text").textContent }));
check("une fois fini : le Carnet l’annonce (« en haute qualité »)", done.hidden && /en haute qualité/.test(done.status), JSON.stringify(done));
check("toutes les grandes photos ont été prises (39), pas une de plus", stats2.full >= 39 && stats2.full <= 39 + 6, `${stats2.full} demandes (dont quelques nouvelles tentatives simulées)`);
// Défilement complet : plus jamais une photo floue, même un instant
let blurSeen = 0;
for (let y = 0; y < 14000; y += 400) { await page2.evaluate((y) => document.querySelector("#view-carnet").scrollTo(0, y), y); await page2.waitForTimeout(60); blurSeen += await page2.evaluate(() => document.querySelectorAll("#carnet-body img.blur").length); }
check("en haute qualité : aucune photo floue, même un instant, pendant tout le défilement", blurSeen === 0, `${blurSeen} observations de flou`);
await ctx2.close();

check("aucune erreur JavaScript", pageErrors.length === 0, pageErrors.join(" | "));
await browser.close();
server.close();
const failed = results.filter((x) => !x).length;
console.log(failed ? `\n${failed} vérification(s) en échec` : `\n✓ ${results.length} vérifications OK`);
process.exit(failed ? 1 : 0);
